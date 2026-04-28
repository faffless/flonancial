import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  applyHmrcCookieMutations,
  hmrcFetchWithAuth,
  getNinoForUser,
  logHmrcCall,
} from "@/utils/hmrc/server";
import {
  buildFraudPreventionHeaders,
  parseFraudDataFromHeader,
} from "@/utils/hmrc/fraud-prevention";
import { HMRC_API_BASE } from "@/utils/hmrc/config";

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

function toHmrcBusinessType(businessType: string | null): string {
  if (businessType === "uk_property") return "uk-property";
  return "self-employment";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filterBusinessId = url.searchParams.get("businessId")
    ? Number(url.searchParams.get("businessId"))
    : null;
  const fromDateParam = url.searchParams.get("fromDate");
  const toDateParam = url.searchParams.get("toDate");

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "not_logged_in" }, { status: 401 });
  }

  const nino = await getNinoForUser(user.id);
  if (!nino) {
    return NextResponse.json({ error: "missing_nino", message: "Please add your National Insurance number in your profile" }, { status: 400 });
  }

  // Parse fraud data from custom header (sent by business page)
  const clientFraudData = parseFraudDataFromHeader(request.headers.get("x-fraud-data"));
  const fraudHeaders = buildFraudPreventionHeaders(
    request.headers,
    clientFraudData,
    user.id,
    user.email
  );

  let businessQuery = supabase
    .from("businesses")
    .select("id, name, business_type, hmrc_business_id")
    .eq("user_id", user.id)
    .not("hmrc_business_id", "is", null);

  if (filterBusinessId && Number.isFinite(filterBusinessId)) {
    businessQuery = businessQuery.eq("id", filterBusinessId);
  }

  const { data: businesses, error: businessesError } = await businessQuery;

  if (businessesError) {
    return NextResponse.json({ error: businessesError.message }, { status: 500 });
  }

  if (!businesses || businesses.length === 0) {
    return NextResponse.json({ obligations: [] });
  }

  const fromDate = fromDateParam ?? "2025-04-06";
  const toDate = toDateParam ?? "2026-04-05";

  const allObligations = [];
  let lastCookieMutations: Parameters<typeof applyHmrcCookieMutations>[1] = [];

  for (const business of businesses) {
    if (!business.hmrc_business_id) continue;

    const hmrcBusinessType = toHmrcBusinessType(business.business_type);
    const hmrcUrl = new URL(
      `${HMRC_API_BASE}/obligations/details/${encodeURIComponent(nino)}/income-and-expenditure`
    );
    hmrcUrl.searchParams.set("typeOfBusiness", hmrcBusinessType);
    hmrcUrl.searchParams.set("businessId", business.hmrc_business_id);
    hmrcUrl.searchParams.set("fromDate", fromDate);
    hmrcUrl.searchParams.set("toDate", toDate);

    const hmrcResult = await hmrcFetchWithAuth(hmrcUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/vnd.hmrc.3.0+json",
        ...fraudHeaders,
      },
    });

    if (hmrcResult.cookieMutations) {
      lastCookieMutations = hmrcResult.cookieMutations;
    }

    if (!hmrcResult.ok) continue;
    const hmrcResponse = hmrcResult.response;
    await logHmrcCall("GET", hmrcUrl.toString(), hmrcResponse);
    if (!hmrcResponse.ok) continue;

    const data = (await hmrcResponse.json()) as HMRCObligationsResponse;

    const obligations =
      data.obligations?.flatMap((group) =>
        (group.obligationDetails ?? [])
          .filter((item) => !!item.periodStartDate && !!item.periodEndDate)
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
