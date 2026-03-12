import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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

  if (endDate <= april5) {
    return `${year - 1}-${String(year).slice(2)}`;
  }

  return `${year}-${String(year + 1).slice(2)}`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const updateId = Number(id);

  if (!Number.isFinite(updateId)) {
    return NextResponse.json({ error: "invalid_update_id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("hmrc_access_token")?.value;
  const scope = cookieStore.get("hmrc_scope")?.value ?? "";
  const testNino = process.env.HMRC_TEST_NINO;

  if (!accessToken) {
    return NextResponse.json(
      { error: "missing_hmrc_access_token" },
      { status: 401 }
    );
  }

  if (!testNino) {
    return NextResponse.json(
      { error: "missing_hmrc_test_nino" },
      { status: 500 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "not_logged_in" }, { status: 401 });
  }

  const { data: update, error: updateError } = await supabase
    .from("quarterly_updates")
    .select(
      "id, business_id, user_id, period_key, quarter_start, quarter_end, turnover, expenses, status, submitted_at"
    )
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
    return NextResponse.json(
      { error: "business_not_hmrc_linked" },
      { status: 400 }
    );
  }

  if (business.business_type !== "sole_trader") {
    return NextResponse.json(
      { error: "business_type_must_be_sole_trader" },
      { status: 400 }
    );
  }

  if (update.status !== "draft" && update.status !== "submitted") {
    return NextResponse.json(
      { error: "only_draft_or_submitted_updates_can_be_reviewed" },
      { status: 400 }
    );
  }

  const taxYear = getTaxYearFromPeriodEnd(update.quarter_end);

  return NextResponse.json({
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
    hmrc_endpoint: `/individuals/business/self-employment/${testNino}/${business.hmrc_business_id}/cumulative/${taxYear}`,
    note:
      update.status === "submitted"
        ? `This period was already submitted once. You can review and send amended cumulative figures again. Token scope cookie: ${scope || "(empty)"}`
        : `Preview ready. Token scope cookie: ${scope || "(empty)"}`,
  });
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const updateId = Number(id);

  if (!Number.isFinite(updateId)) {
    return NextResponse.json({ error: "invalid_update_id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("hmrc_access_token")?.value;
  const scope = cookieStore.get("hmrc_scope")?.value ?? "";
  const testNino = process.env.HMRC_TEST_NINO;

  if (!accessToken) {
    return NextResponse.json(
      { error: "missing_hmrc_access_token" },
      { status: 401 }
    );
  }

  if (!testNino) {
    return NextResponse.json(
      { error: "missing_hmrc_test_nino" },
      { status: 500 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "not_logged_in" }, { status: 401 });
  }

  const { data: update, error: updateError } = await supabase
    .from("quarterly_updates")
    .select(
      "id, business_id, user_id, period_key, quarter_start, quarter_end, turnover, expenses, status, submitted_at"
    )
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
    return NextResponse.json(
      { error: "business_not_hmrc_linked" },
      { status: 400 }
    );
  }

  if (business.business_type !== "sole_trader") {
    return NextResponse.json(
      { error: "business_type_must_be_sole_trader" },
      { status: 400 }
    );
  }

  if (update.status !== "draft" && update.status !== "submitted") {
    return NextResponse.json(
      { error: "only_draft_or_submitted_updates_can_be_submitted" },
      { status: 400 }
    );
  }

  const taxYear = getTaxYearFromPeriodEnd(update.quarter_end);

  const hmrcEndpoint = `/individuals/business/self-employment/${testNino}/${business.hmrc_business_id}/cumulative/${taxYear}`;
  const hmrcUrl = `https://test-api.service.hmrc.gov.uk${hmrcEndpoint}`;

  const payload = {
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

  const hmrcResponse = await fetch(hmrcUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.hmrc.5.0+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

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

    return NextResponse.json(
      {
        error: `${hmrcError} | token scope: ${scope || "(empty)"}`,
        status: hmrcResponse.status,
        hmrc_response: hmrcBody,
      },
      { status: hmrcResponse.status }
    );
  }

  let hmrcBody: unknown = null;

  try {
    hmrcBody = await hmrcResponse.json();
  } catch {}

  const submittedAt = new Date().toISOString();

  const { error: saveError } = await supabase
    .from("quarterly_updates")
    .update({
      status: "submitted",
      submitted_at: submittedAt,
    })
    .eq("id", update.id)
    .eq("user_id", user.id);

  if (saveError) {
    return NextResponse.json(
      {
        error: "hmrc_submission_succeeded_but_local_save_failed",
        hmrc_response: hmrcBody,
        local_error: saveError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
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
    hmrc_endpoint: hmrcEndpoint,
    hmrc_response: hmrcBody,
    note: `Submitted successfully. Token scope cookie: ${scope || "(empty)"}`,
  });
}