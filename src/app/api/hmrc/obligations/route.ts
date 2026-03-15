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

function isQuarterlyPeriod(startDate: string | null, endDate: string | null): boolean {
  if (!startDate || !endDate) return false;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return days >= 80 && days <= 105;
}

function toHmrcBusinessType(businessType: string | null): string {
  if (businessType === "uk_property") return "uk-property";
  return "self-employment";
}

export async function GET() {
  const testNino = process.env.HMRC_TEST_NINO;

  if (!testNino) {
    return NextResponse.json({ error: "missing_hmrc_test_nino" }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "not_logged_in" }, { status: 401 });
  }

  const { data: businesses, error: businessesError } = await supabase
    .from("businesses")
    .select("id, name, business_type, hmrc_business_id")
    .eq("user_id", user.id)
    .not("hmrc_business_id", "is", null);

  if (businessesError) {
    return NextResponse.json({ error: businessesError.message }, { status: 500 });
  }

  if (!businesses || businesses.length === 0) {
    return NextResponse.json({ error: "no_linked_hmrc_business" }, { status: 400 });
  }

  const fromDate = "2025-04-06";
  const toDate = "2026-04-05";

  const allObligations = [];
  let lastCookieMutations: Parameters<typeof applyHmrcCookieMutations>[1] = [];

  for (const business of businesses) {
    if (!business.hmrc_business_id) continue;

    const hmrcBusinessType = toHmrcBusinessType(business.business_type);

    const hmrcUrl = new URL(
      `https://test-api.service.hmrc.gov.uk/obligations/details/${encodeURIComponent(testNino)}/income-and-expenditure`
    );
    hmrcUrl.searchParams.set("typeOfBusiness", hmrcBusinessType);
    hmrcUrl.searchParams.set("businessId", business.hmrc_business_id);
    hmrcUrl.searchParams.set("fromDate", fromDate);
    hmrcUrl.searchParams.set("toDate", toDate);

    console.log("[obligations] Fetching:", hmrcUrl.toString());

    const hmrcResult = await hmrcFetchWithAuth(hmrcUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/vnd.hmrc.3.0+json",
        "Gov-Test-Scenario": "DYNAMIC",
      },
    });

    if (hmrcResult.cookieMutations) {
      lastCookieMutations = hmrcResult.cookieMutations;
    }

    console.log("[obligations] hmrcResult.ok:", hmrcResult.ok);

    if (!hmrcResult.ok) {
      console.log("[obligations] Auth failed, skipping business:", business.id);
      continue;
    }

    const hmrcResponse = hmrcResult.response;
    console.log("[obligations] HMRC HTTP status:", hmrcResponse.status);

    if (!hmrcResponse.ok) {
      const errorBody = await hmrcResponse.text();
      console.log("[obligations] HMRC error body:", errorBody);
      continue;
    }

    const data = (await hmrcResponse.json()) as HMRCObligationsResponse;
    console.log("[obligations] Raw HMRC response:", JSON.stringify(data));

    const obligations =
      data.obligations?.flatMap((group) =>
        (group.obligationDetails ?? [])
          .filter((item) => {
            const quarterly = isQuarterlyPeriod(item.periodStartDate ?? null, item.periodEndDate ?? null);
            console.log("[obligations] period:", item.periodStartDate, "to", item.periodEndDate, "status:", item.status, "quarterly:", quarterly);
            return quarterly;
          })
          .map((item) => ({
            business_id: business.id,
            business_name: business.name,
            hmrc_business_id: group.businessId ?? business.hmrc_business_id,
            type_of_business: group.typeOfBusiness ?? hmrcBusinessType,
            period_key: item.periodKey ?? null,
            status: item.status ?? null,
            quarter_start: item.periodStartDate ?? null,
            quarter_end: item.periodEndDate ?? null,
            due_date: item.dueDate ?? null,
            received_date: item.receivedDate ?? null,
          }))
      ) ?? [];

    allObligations.push(...obligations);
  }

  const response = NextResponse.json({ obligations: allObligations });
  return applyHmrcCookieMutations(response, lastCookieMutations);
}