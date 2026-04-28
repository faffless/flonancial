import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { applyHmrcCookieMutations, hmrcFetchWithAuth, getNinoForUser, logHmrcCall } from "@/utils/hmrc/server";
import { buildFraudPreventionHeaders, type ClientFraudData } from "@/utils/hmrc/fraud-prevention";
import { HMRC_API_BASE } from "@/utils/hmrc/config";

type TestBody = {
  fraudData: ClientFraudData;
  typeOfBusiness?: "uk-property" | "self-employment" | "foreign-property";
  businessId?: string;
  scenario?: "OPEN" | "FULFILLED" | "OPEN_AND_FULFILLED" | "STATEFUL" | string;
  fromDate?: string;
  toDate?: string;
};

// Documented HMRC sandbox test business IDs that work with Gov-Test-Scenario.
// XPIS12345678903 + OPEN returns a canned UK property OPEN obligation.
const DEFAULTS = {
  typeOfBusiness: "uk-property",
  businessId: "XPIS12345678903",
  scenario: "OPEN",
  fromDate: "2025-04-06",
  toDate: "2026-04-05",
} as const;

export async function POST(req: NextRequest) {
  let body: TestBody;
  try {
    body = (await req.json()) as TestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 });
  }

  if (!body.fraudData || typeof body.fraudData.deviceId !== "string") {
    return NextResponse.json({ error: "missing_fraud_data" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "not_logged_in" }, { status: 401 });
  }

  const nino = await getNinoForUser(user.id);
  if (!nino) {
    return NextResponse.json({ error: "missing_nino" }, { status: 400 });
  }

  const typeOfBusiness = body.typeOfBusiness ?? DEFAULTS.typeOfBusiness;
  const businessId = body.businessId ?? DEFAULTS.businessId;
  const scenario = body.scenario ?? DEFAULTS.scenario;
  const fromDate = body.fromDate ?? DEFAULTS.fromDate;
  const toDate = body.toDate ?? DEFAULTS.toDate;

  const fraudHeaders = buildFraudPreventionHeaders(req.headers, body.fraudData, user.id, user.email);

  const hmrcUrl = new URL(
    `${HMRC_API_BASE}/obligations/details/${encodeURIComponent(nino)}/income-and-expenditure`
  );
  hmrcUrl.searchParams.set("typeOfBusiness", typeOfBusiness);
  hmrcUrl.searchParams.set("businessId", businessId);
  hmrcUrl.searchParams.set("fromDate", fromDate);
  hmrcUrl.searchParams.set("toDate", toDate);

  const result = await hmrcFetchWithAuth(hmrcUrl.toString(), {
    method: "GET",
    headers: {
      Accept: "application/vnd.hmrc.3.0+json",
      "Gov-Test-Scenario": scenario,
      ...fraudHeaders,
    },
  });

  if (!result.ok) {
    const res = NextResponse.json({ error: result.error, status: result.status }, { status: result.status });
    return applyHmrcCookieMutations(res, result.cookieMutations);
  }

  const hmrcResponse = result.response;
  await logHmrcCall("GET", hmrcUrl.toString(), hmrcResponse);
  let payload: unknown = null;
  try {
    payload = await hmrcResponse.json();
  } catch {
    payload = { parseError: "non-JSON response" };
  }

  const out = NextResponse.json({
    requestUrl: hmrcUrl.toString(),
    scenarioHeader: scenario,
    status: hmrcResponse.status,
    correlationId: hmrcResponse.headers.get("x-correlationid"),
    body: payload,
  }, { status: hmrcResponse.ok ? 200 : hmrcResponse.status });

  return applyHmrcCookieMutations(out, result.cookieMutations);
}
