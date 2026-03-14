import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  applyHmrcCookieMutations,
  hmrcFetchWithAuth,
} from "@/utils/hmrc/server";

type HMRCObligationGroup = {
  typeOfBusiness?: string;
  businessId?: string;
  obligationDetails?: Array<{
    status?: string;
    periodStartDate?: string;
    periodEndDate?: string;
    dueDate?: string;
    periodKey?: string;
    receivedDate?: string;
  }>;
};

type HMRCObligationsResponse = {
  obligations?: HMRCObligationGroup[];
};

type HMRCErrorResponse = {
  code?: string;
  message?: string;
  error?: string;
  error_description?: string;
};

// Quarterly obligations are approximately 3 months (88–95 days).
// Annual obligations (End of Period Statements, Final Declarations) are ~365 days.
// We only want quarterly periods here.
function isQuarterlyPeriod(startDate: string | null, endDate: string | null): boolean {
  if (!startDate || !endDate) return false;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return days >= 80 && days <= 105;
}

export async function GET() {
  const testNino = process.env.HMRC_TEST_NINO;

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

  const { data: businesses, error: businessesError } = await supabase
    .from("businesses")
    .select("id, name, hmrc_business_id")
    .eq("user_id", user.id)
    .not("hmrc_business_id", "is", null);

  if (businessesError) {
    return NextResponse.json(
      { error: businessesError.message },
      { status: 500 }
    );
  }

  if (!businesses || businesses.length === 0) {
    return NextResponse.json(
      { error: "no_linked_hmrc_business" },
      { status: 400 }
    );
  }

  const linkedBusiness = businesses[0];

  if (!linkedBusiness.hmrc_business_id) {
    return NextResponse.json(
      { error: "missing_hmrc_business_id" },
      { status: 400 }
    );
  }

  const fromDate = "2025-04-06";
  const toDate = "2026-04-05";

  const hmrcUrl = new URL(
    `https://test-api.service.hmrc.gov.uk/obligations/details/${encodeURIComponent(
      testNino
    )}/income-and-expenditure`
  );

  hmrcUrl.searchParams.set("typeOfBusiness", "self-employment");
  hmrcUrl.searchParams.set("businessId", linkedBusiness.hmrc_business_id);
  hmrcUrl.searchParams.set("fromDate", fromDate);
  hmrcUrl.searchParams.set("toDate", toDate);

  const hmrcResult = await hmrcFetchWithAuth(hmrcUrl.toString(), {
    method: "GET",
    headers: {
      Accept: "application/vnd.hmrc.3.0+json",
      "Gov-Test-Scenario": "CUMULATIVE",
    },
  });

  if (!hmrcResult.ok) {
    const response = NextResponse.json(
      {
        error: hmrcResult.error,
        status: hmrcResult.status,
      },
      { status: hmrcResult.status }
    );

    return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
  }

  const hmrcResponse = hmrcResult.response;

  if (!hmrcResponse.ok) {
    let hmrcError = "hmrc_obligations_failed";

    try {
      const errorJson = (await hmrcResponse.json()) as HMRCErrorResponse;
      hmrcError =
        errorJson.message ||
        errorJson.error_description ||
        errorJson.error ||
        errorJson.code ||
        hmrcError;
    } catch {}

    const response = NextResponse.json(
      {
        error: hmrcError,
        status: hmrcResponse.status,
      },
      { status: hmrcResponse.status }
    );

    return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
  }

  const data = (await hmrcResponse.json()) as HMRCObligationsResponse;

  const obligations =
    data.obligations?.flatMap((group) =>
      (group.obligationDetails ?? [])
        .filter((item) => isQuarterlyPeriod(item.periodStartDate ?? null, item.periodEndDate ?? null))
        .map((item) => ({
          business_id: linkedBusiness.id,
          business_name: linkedBusiness.name,
          hmrc_business_id: group.businessId ?? linkedBusiness.hmrc_business_id,
          type_of_business: group.typeOfBusiness ?? "self-employment",
          period_key: item.periodKey ?? null,
          status: item.status ?? null,
          quarter_start: item.periodStartDate ?? null,
          quarter_end: item.periodEndDate ?? null,
          due_date: item.dueDate ?? null,
          received_date: item.receivedDate ?? null,
        }))
    ) ?? [];

  const response = NextResponse.json({
    obligations,
  });

  return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
}