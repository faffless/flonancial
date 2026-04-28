import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  applyHmrcCookieMutations,
  hmrcFetchWithAuth,
  getValidHmrcAccessToken,
  getNinoForUser,
  logHmrcCall,
} from "@/utils/hmrc/server";
import {
  buildFraudPreventionHeaders,
  type ClientFraudData,
} from "@/utils/hmrc/fraud-prevention";
import { sendSubmissionConfirmation } from "@/utils/email/send-submission-confirmation";
import { HMRC_API_BASE } from "@/utils/hmrc/config";

type HMRCErrorResponse = {
  code?: string;
  message?: string;
  error?: string;
  error_description?: string;
};

function getTaxYearFromPeriodEnd(periodEnd: string) {
  const endDate = new Date(`${periodEnd}T00:00:00`);
  const year = endDate.getUTCFullYear();
  const april5 = new Date(`${year}-04-05T00:00:00`);
  if (endDate <= april5) return `${year - 1}-${String(year).slice(2)}`;
  return `${year}-${String(year + 1).slice(2)}`;
}

function parsePeriodKey(periodKey: string): { quarterStart: string; quarterEnd: string } | null {
  const parts = periodKey.split("_");
  if (parts.length !== 2) return null;
  return { quarterStart: parts[0], quarterEnd: parts[1] };
}

function getTaxYearStart(periodEnd: string, accountingYearEnd: string): string {
  const [endMonth, endDay] = accountingYearEnd.split("-").map(Number);
  const periodEndDate = new Date(`${periodEnd}T00:00:00`);
  const year = periodEndDate.getUTCFullYear();

  let yearEnd = new Date(Date.UTC(year, endMonth - 1, endDay));
  if (yearEnd < periodEndDate) {
    yearEnd = new Date(Date.UTC(year + 1, endMonth - 1, endDay));
  }

  const yearStart = new Date(yearEnd);
  yearStart.setUTCFullYear(yearStart.getUTCFullYear() - 1);
  yearStart.setUTCDate(yearStart.getUTCDate() + 1);

  return yearStart.toISOString().slice(0, 10);
}

function getQuartersForTaxYear(
  accountingYearEnd: string,
  referenceDateStr: string
): { quarterStart: string; quarterEnd: string; periodKey: string }[] {
  const [endMonth, endDay] = accountingYearEnd.split("-").map(Number);
  const referenceDate = new Date(`${referenceDateStr}T00:00:00`);
  const year = referenceDate.getUTCFullYear();

  let yearEnd = new Date(Date.UTC(year, endMonth - 1, endDay));
  if (yearEnd < referenceDate) {
    yearEnd = new Date(Date.UTC(year + 1, endMonth - 1, endDay));
  }

  const yearStart = new Date(yearEnd);
  yearStart.setUTCFullYear(yearStart.getUTCFullYear() - 1);
  yearStart.setUTCDate(yearStart.getUTCDate() + 1);

  const quarters = [];
  const cursor = new Date(yearStart);

  for (let i = 0; i < 4; i++) {
    const periodStart = new Date(cursor);
    const periodEnd = new Date(cursor);
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 3);
    periodEnd.setUTCDate(periodEnd.getUTCDate() - 1);

    const quarterStart = periodStart.toISOString().slice(0, 10);
    const quarterEnd = periodEnd.toISOString().slice(0, 10);

    quarters.push({
      quarterStart,
      quarterEnd,
      periodKey: `${quarterStart}_${quarterEnd}`,
    });

    cursor.setUTCMonth(cursor.getUTCMonth() + 3);
  }

  return quarters;
}

// ─── POST — submit figures from spreadsheet upload ────────────────────────────

export async function POST(request: Request) {
  // ── Parse body ──────────────────────────────────────────────────────────
  let businessId: number | null = null;
  let periodKey: string | null = null;
  let turnover: number | null = null;
  let expenses: number | null = null;
  let otherIncome = 0;
  let clientFraudData: ClientFraudData | null = null;

  try {
    const body = await request.json();
    businessId = typeof body.businessId === "number" ? body.businessId : null;
    periodKey = typeof body.periodKey === "string" ? body.periodKey : null;
    turnover = typeof body.turnover === "number" && Number.isFinite(body.turnover) ? Math.round(body.turnover * 100) / 100 : null;
    expenses = typeof body.expenses === "number" && Number.isFinite(body.expenses) ? Math.round(body.expenses * 100) / 100 : null;
    otherIncome = typeof body.otherIncome === "number" && Number.isFinite(body.otherIncome) ? Math.round(body.otherIncome * 100) / 100 : 0;
    clientFraudData = body.fraudData ?? null;
  } catch {
    return NextResponse.json({ error: "invalid_request_body" }, { status: 400 });
  }

  if (!businessId || !periodKey || turnover === null || expenses === null) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const parsed = parsePeriodKey(periodKey);
  if (!parsed) {
    return NextResponse.json({ error: "invalid_period_key" }, { status: 400 });
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  const tokenResult = await getValidHmrcAccessToken();
  if (!tokenResult.ok) {
    const response = NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status });
    return applyHmrcCookieMutations(response, tokenResult.cookieMutations);
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "not_logged_in" }, { status: 401 });
  }

  const nino = await getNinoForUser(user.id);
  if (!nino) {
    return NextResponse.json({ error: "missing_nino", message: "Please add your National Insurance number in your profile" }, { status: 400 });
  }

  // ── Business lookup ──────────────────────────────────────────────────────
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, hmrc_business_id, business_type, accounting_year_end")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .single();

  if (businessError || !business) {
    return NextResponse.json({ error: "business_not_found" }, { status: 404 });
  }

  if (!business.hmrc_business_id) {
    return NextResponse.json({ error: "business_not_hmrc_linked" }, { status: 400 });
  }

  if (business.business_type !== "sole_trader" && business.business_type !== "uk_property") {
    return NextResponse.json({ error: "unsupported_business_type" }, { status: 400 });
  }

  // ── Cumulative dates ─────────────────────────────────────────────────────
  const accountingYearEnd = business.accounting_year_end ?? "04-05";
  const taxYearStart = getTaxYearStart(parsed.quarterEnd, accountingYearEnd);
  const taxYear = getTaxYearFromPeriodEnd(parsed.quarterEnd);
  const isProperty = business.business_type === "uk_property";

  // ── Check existing submission ────────────────────────────────────────────
  const { data: existingSubmission } = await supabase
    .from("quarterly_updates")
    .select("id, turnover, expenses, status")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .eq("quarter_start", parsed.quarterStart)
    .eq("quarter_end", parsed.quarterEnd)
    .maybeSingle();

  const isAmend = existingSubmission?.status === "submitted";

  // ── Build HMRC request ───────────────────────────────────────────────────
  const fraudHeaders = buildFraudPreventionHeaders(
    request.headers,
    clientFraudData ?? {
      browserJSUserAgent: "",
      deviceId: "",
      screens: "",
      timezone: "",
      windowSize: "",
    },
    user.id,
    user.email
  );

  const hmrcUrl = isProperty
    ? `${HMRC_API_BASE}/individuals/business/property/uk/${nino}/${business.hmrc_business_id}/cumulative/${taxYear}`
    : `${HMRC_API_BASE}/individuals/business/self-employment/${nino}/${business.hmrc_business_id}/cumulative/${taxYear}`;

  const acceptHeader = isProperty
    ? "application/vnd.hmrc.6.0+json"
    : "application/vnd.hmrc.5.0+json";

  // Build payload matching existing submit-business structure exactly
  const payload = isProperty
    ? {
        fromDate: taxYearStart,
        toDate: parsed.quarterEnd,
        ukProperty: {
          income: { periodAmount: turnover },
          expenses: { consolidatedExpenses: expenses },
        },
      }
    : {
        periodDates: {
          periodStartDate: taxYearStart,
          periodEndDate: parsed.quarterEnd,
        },
        periodIncome: { turnover, other: otherIncome },
periodExpenses: { consolidatedExpenses: expenses },
      };

  // ── Call HMRC ────────────────────────────────────────────────────────────
  const hmrcResult = await hmrcFetchWithAuth(hmrcUrl, {
    method: "PUT",
    headers: {
      Accept: acceptHeader,
      "Content-Type": "application/json",
      ...fraudHeaders,
    },
    body: JSON.stringify(payload),
  });

  if (!hmrcResult.ok) {
    const response = NextResponse.json(
      { error: "hmrc_auth_failed", status: hmrcResult.status },
      { status: hmrcResult.status }
    );
    return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
  }

  const hmrcResponse = hmrcResult.response;
  await logHmrcCall("PUT", hmrcUrl, hmrcResponse);

  if (!hmrcResponse.ok) {
    let hmrcError = "hmrc_submission_failed";
    let hmrcBody: unknown = null;
    try {
      hmrcBody = await hmrcResponse.json();
      const errorJson = hmrcBody as HMRCErrorResponse;
      hmrcError =
        errorJson.message ||
        errorJson.error_description ||
        errorJson.error ||
        errorJson.code ||
        hmrcError;
    } catch {}
    const response = NextResponse.json(
      { error: hmrcError, hmrc_response: hmrcBody },
      { status: hmrcResponse.status }
    );
    return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
  }

  // Extract correlation ID from HMRC response headers
  const correlationId = hmrcResponse.headers.get("x-correlationid") ?? null;

  const submittedAt = new Date().toISOString();

  // ── Upsert quarterly_updates row ─────────────────────────────────────────
  if (existingSubmission) {
    await supabase
      .from("quarterly_updates")
      .update({
        turnover,
        expenses,
        other_income: otherIncome,
        status: "submitted",
        submitted_at: submittedAt,
        hmrc_correlation_id: correlationId,
      })
      .eq("id", existingSubmission.id)
      .eq("user_id", user.id);
  } else {
    await supabase.from("quarterly_updates").insert({
      business_id: businessId,
      user_id: user.id,
      period_key: periodKey,
      quarter_start: parsed.quarterStart,
      quarter_end: parsed.quarterEnd,
      turnover,
      expenses,
      other_income: otherIncome,
      status: "submitted",
      submitted_at: submittedAt,
      hmrc_correlation_id: correlationId,
    });
  }

  // ── Auto-create covered rows for earlier quarters ────────────────────────
  // (matching existing submit-business logic)
  try {
    const { data: allSubmissions } = await supabase
      .from("quarterly_updates")
      .select("quarter_start, quarter_end")
      .eq("business_id", businessId)
      .eq("user_id", user.id);

    const existingKeys = new Set(
      (allSubmissions ?? []).map((r) => `${r.quarter_start}_${r.quarter_end}`)
    );

    const allQuarters = getQuartersForTaxYear(accountingYearEnd, parsed.quarterEnd);

    for (const q of allQuarters) {
      if (q.quarterEnd >= parsed.quarterStart) break;
      if (existingKeys.has(q.periodKey)) continue;

      // For covered quarters with no figures from the spreadsheet,
      // insert with zero values — they're just coverage markers
      const { data: insertedRow } = await supabase
        .from("quarterly_updates")
        .insert({
          business_id: businessId,
          user_id: user.id,
          period_key: q.periodKey,
          quarter_start: q.quarterStart,
          quarter_end: q.quarterEnd,
          turnover: 0,
          expenses: 0,
          other_income: 0,
          status: "submitted",
          submitted_at: submittedAt,
          hmrc_correlation_id: correlationId,
        })
        .select("id")
        .single();

      await supabase.from("submission_history").insert({
        user_id: user.id,
        business_id: businessId,
        quarterly_update_id: insertedRow?.id ?? null,
        period_key: q.periodKey,
        quarter_start: q.quarterStart,
        quarter_end: q.quarterEnd,
        turnover: 0,
        expenses: 0,
        other_income: 0,
        tax_year: taxYear,
        action: "covered",
        submitted_at: submittedAt,
        hmrc_correlation_id: correlationId,
      });
    }
  } catch {
    // Non-fatal — submission already succeeded
  }

  // ── Submission history ───────────────────────────────────────────────────
  try {
    await supabase.from("submission_history").insert({
      user_id: user.id,
      business_id: businessId,
      quarterly_update_id: existingSubmission?.id ?? null,
      period_key: periodKey,
      quarter_start: parsed.quarterStart,
      quarter_end: parsed.quarterEnd,
      turnover,
      expenses,
      other_income: otherIncome,
      tax_year: taxYear,
      action: isAmend ? "amended" : "submitted",
      submitted_at: submittedAt,
      hmrc_correlation_id: correlationId,
    });
  } catch {}

  // ── Email confirmation ───────────────────────────────────────────────────
  if (user.email) {
    try {
      await sendSubmissionConfirmation({
        toEmail: user.email,
        businessName: business.name,
        quarterStart: parsed.quarterStart,
        quarterEnd: parsed.quarterEnd,
        turnover,
        expenses,
        taxYear,
        submittedAt,
      });
    } catch {}
  }

  // ── Response ─────────────────────────────────────────────────────────────
  const response = NextResponse.json({
    ok: true,
    submitted: true,
    is_amend: isAmend,
    correlationId,
    tax_year: taxYear,
    tax_year_start: taxYearStart,
    business: {
      id: business.id,
      name: business.name,
      hmrc_business_id: business.hmrc_business_id,
      business_type: business.business_type,
    },
    period: {
      quarter_start: parsed.quarterStart,
      quarter_end: parsed.quarterEnd,
      period_key: periodKey,
    },
    totals: { turnover, expenses, otherIncome },
    submitted_at: submittedAt,
  });

  return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
}