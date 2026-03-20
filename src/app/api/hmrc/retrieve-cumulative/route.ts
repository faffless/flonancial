import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  applyHmrcCookieMutations,
  hmrcFetchWithAuth,
  getNinoForUser,
} from "@/utils/hmrc/server";
import {
  buildFraudPreventionHeaders,
  parseFraudDataFromHeader,
} from "@/utils/hmrc/fraud-prevention";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const businessId = url.searchParams.get("businessId");
  const taxYear = url.searchParams.get("taxYear") ?? "2025-26";

  if (!businessId) {
    return NextResponse.json({ error: "missing_business_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
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

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, hmrc_business_id, business_type")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (businessError || !business || !business.hmrc_business_id) {
    return NextResponse.json({ error: "business_not_found" }, { status: 404 });
  }

  let hmrcUrl: string;
  if (business.business_type === "uk_property") {
    hmrcUrl = `https://test-api.service.hmrc.gov.uk/individuals/business/property/uk/${nino}/${business.hmrc_business_id}/cumulative/${taxYear}`;
  } else {
    hmrcUrl = `https://test-api.service.hmrc.gov.uk/individuals/business/self-employment/${nino}/${business.hmrc_business_id}/cumulative/${taxYear}`;
  }

  const acceptHeader =
    business.business_type === "uk_property"
      ? "application/vnd.hmrc.6.0+json"
      : "application/vnd.hmrc.5.0+json";

  const hmrcResult = await hmrcFetchWithAuth(hmrcUrl, {
    method: "GET",
    headers: {
      Accept: acceptHeader,
      ...fraudHeaders,
    },
  });

  if (!hmrcResult.ok) {
    const response = NextResponse.json(
      { error: hmrcResult.error },
      { status: hmrcResult.status }
    );
    return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
  }

  const hmrcResponse = hmrcResult.response;

  if (!hmrcResponse.ok) {
    let errorBody = null;
    try {
      errorBody = await hmrcResponse.json();
    } catch {}
    const response = NextResponse.json(
      { error: "hmrc_error", status: hmrcResponse.status, detail: errorBody },
      { status: hmrcResponse.status }
    );
    return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
  }

  const data = await hmrcResponse.json();

  const response = NextResponse.json({
    businessId: Number(businessId),
    hmrcBusinessId: business.hmrc_business_id,
    businessType: business.business_type,
    taxYear,
    hmrcData: data,
  });

  return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
}
