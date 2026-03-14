import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  applyHmrcCookieMutations,
  hmrcFetchWithAuth,
  getValidHmrcAccessToken,
} from "@/utils/hmrc/server";
import {
  buildFraudPreventionHeaders,
  type ClientFraudData,
} from "@/utils/hmrc/fraud-prevention";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type HMRCErrorResponse = {
  code?: string;
  message?: string;
  error?: string;
  error_description?: string;
};

function getTaxYearFromPeriodEnd(periodEnd: string) {
  const endDate = new Date(`${periodEnd}T00:00:00`);
  const year = endDate.getFullYear();
  const april5 = new Date(`${year}-04-05T00:00:00`);
  if (endDate <= april5) return `${year - 1}-${String(year).slice(2)}`;
  return `${year}-${String(year + 1).slice(2)}`;
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const updateId = Number(id);

  if (!Number.isFinite(updateId)) {
    return NextResponse.json({ error: "invalid_update_id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const testNino = process.env.HMRC_TEST_NINO;

  if (!testNino) {
    return NextResponse.json({ error: "missing_hmrc_test_nino" }, { status: 500 });
  }

  const tokenResult = await getValidHmrcAccessToken();
  if (!tokenResult.ok) {
    const response = NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status });
    return applyHmrcCookieMutations(response, tokenResult.cookieMutations);
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    const response = NextResponse.json({ error: "not_logged_in" }, { status: 401 });
    return applyHmrcCookieMutations(response, tokenResult.cookieMutations);
  }

  const { data: update, error: updateError } = await supabase
    .from("quarterly_updates")
    .select("id, business_id, user_id, period_key, quarter_start, quarter_end, turnover, expenses, status, submitted_at")
    .eq("id", updateId)
    .eq("user_id", user.id)
    .single();

  if (updateError || !update) {
    const response = NextResponse.json({ error: "update_not_found" }, { status: 404 });
    return applyHmrcCookieMutations(response, tokenResult.cookieMutations);
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, hmrc_business_id, business_type")
    .eq("id", update.business_id)
    .eq("user_id", user.id)
    .single();

  if (businessError || !business) {
    const response = NextResponse.json({ error: "business_not_found" }, { status: 404 });
    return applyHmrcCookieMutations(response, tokenResult.cookieMutations);
  }

  if (!business.hmrc_business_id) {
    const response = NextResponse.json({ error: "business_not_hmrc_linked" }, { status: 400 });
    return applyHmrcCookieMutations(response, tokenResult.cookieMutations);
  }

  if (business.business_type !== "sole_trader" && business.business_type !== "uk_property") {
    const response = NextResponse.json({ error: "unsupported_business_type" }, { status: 400 });
    return applyHmrcCookieMutations(response, tokenResult.cookieMutations);
  }

  if (update.status !== "draft" && update.status !== "submitted") {
    const response = NextResponse.json({ error: "only_draft_or_submitted_updates_can_be_reviewed" }, { status: 400 });
    return applyHmrcCookieMutations(response, tokenResult.cookieMutations);
  }

  const taxYear = getTaxYearFromPeriodEnd(update.quarter_end);
  const isProperty = business.business_type === "uk_property";

  const response = NextResponse.json({
    ok: true,
    submission_method: "cumulative",
    tax_year: taxYear,
    business: {
      id: business.id,
      name: business.name,
      hmrc_business_id: business.hmrc_business_id,
      business_type: business.business_type,
    },
    update: {
      id: update.id,
      period_key: update.period_key,
      quarter_start: update.quarter_start,
      quarter_end: update.quarter_end,
      turnover: update.turnover,
      expenses: update.expenses,
      status: update.status,
      submitted_at: update.submitted_at,
    },
    hmrc_endpoint: isProperty
      ? `/individuals/business/property/uk/${testNino}/${business.hmrc_business_id}/cumulative/${taxYear}`
      : `/individuals/business/self-employment/${testNino}/${business.hmrc_business_id}/cumulative/${taxYear}`,
  });

  return applyHmrcCookieMutations(response, tokenResult.cookieMutations);
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const updateId = Number(id);

  if (!Number.isFinite(updateId)) {
    return NextResponse.json({ error: "invalid_update_id" }, { status: 400 });
  }

  const testNino = process.env.HMRC_TEST_NINO;
  if (!testNino) {
    return NextResponse.json({ error: "missing_hmrc_test_nino" }, { status: 500 });
  }

  // Read client fraud data from request body
  let clientFraudData: ClientFraudData | null = null;
  try {
    const body = await request.json();
    clientFraudData = body.fraudData ?? null;
  } catch {
    // Body is optional
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "not_logged_in" }, { status: 401 });
  }

  const { data: update, error: updateError } = await supabase
    .from("quarterly_updates")
    .select("id, business_id, user_id, period_key, quarter_start, quarter_end, turnover, expenses, status, submitted_at")
    .eq("id", updateId)
    .eq("user_id", user.id)
    .single();

  if (updateError || !update) {
    return NextResponse.json({ error: "update_not_found" }, { status: 404 });
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, hmrc_business_id, business_type")
    .eq("id", update.business_id)
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

  if (update.status !== "draft" && update.status !== "submitted") {
    return NextResponse.json({ error: "only_draft_or_submitted_updates_can_be_submitted" }, { status: 400 });
  }

  // Build fraud prevention headers
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

  const taxYear = getTaxYearFromPeriodEnd(update.quarter_end);
  const isProperty = business.business_type === "uk_property";

  const hmrcUrl = isProperty
    ? `https://test-api.service.hmrc.gov.uk/individuals/business/property/uk/${testNino}/${business.hmrc_business_id}/cumulative/${taxYear}`
    : `https://test-api.service.hmrc.gov.uk/individuals/business/self-employment/${testNino}/${business.hmrc_business_id}/cumulative/${taxYear}`;

  const acceptHeader = isProperty
    ? "application/vnd.hmrc.6.0+json"
    : "application/vnd.hmrc.5.0+json";

  const payload = isProperty
    ? {
        fromDate: update.quarter_start,
        toDate: update.quarter_end,
        income: {
          periodAmount: Number(update.turnover),
        },
        expenses: {
          consolidatedExpenses: Number(update.expenses),
        },
      }
    : {
        periodDates: {
          periodStartDate: update.quarter_start,
          periodEndDate: update.quarter_end,
        },
        periodIncome: {
          turnover: Number(update.turnover),
        },
        periodExpenses: {
          consolidatedExpenses: Number(update.expenses),
        },
      };

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
    const response = NextResponse.json({ error: "hmrc_auth_failed", status: hmrcResult.status }, { status: hmrcResult.status });
    return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
  }

  const hmrcResponse = hmrcResult.response;

  if (!hmrcResponse.ok) {
    let hmrcError = "hmrc_submission_failed";
    let hmrcBody: unknown = null;
    try {
      hmrcBody = await hmrcResponse.json();
      const errorJson = hmrcBody as HMRCErrorResponse;
      hmrcError = errorJson.message || errorJson.error_description || errorJson.error || errorJson.code || hmrcError;
    } catch {}
    const response = NextResponse.json({ error: hmrcError, hmrc_response: hmrcBody }, { status: hmrcResponse.status });
    return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
  }

  let hmrcBody: unknown = null;
  try { hmrcBody = await hmrcResponse.json(); } catch {}

  const submittedAt = new Date().toISOString();

  const { error: saveError } = await supabase
    .from("quarterly_updates")
    .update({ status: "submitted", submitted_at: submittedAt })
    .eq("id", update.id)
    .eq("user_id", user.id);

  if (saveError) {
    const response = NextResponse.json({ error: "hmrc_submission_succeeded_but_local_save_failed" }, { status: 500 });
    return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
  }

  const response = NextResponse.json({
    ok: true,
    submitted: true,
    submission_method: "cumulative",
    tax_year: taxYear,
    business: {
      id: business.id,
      name: business.name,
      hmrc_business_id: business.hmrc_business_id,
      business_type: business.business_type,
    },
    update: {
      id: update.id,
      period_key: update.period_key,
      quarter_start: update.quarter_start,
      quarter_end: update.quarter_end,
      turnover: update.turnover,
      expenses: update.expenses,
      status: "submitted",
      submitted_at: submittedAt,
    },
    hmrc_endpoint: isProperty
      ? `/individuals/business/property/uk/${testNino}/${business.hmrc_business_id}/cumulative/${taxYear}`
      : `/individuals/business/self-employment/${testNino}/${business.hmrc_business_id}/cumulative/${taxYear}`,
    hmrc_response: hmrcBody,
  });

  return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
}