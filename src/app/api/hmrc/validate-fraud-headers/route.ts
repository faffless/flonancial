import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { buildFraudPreventionHeaders, type ClientFraudData } from "@/utils/hmrc/fraud-prevention";
import { logHmrcCall } from "@/utils/hmrc/server";
import { HMRC_API_BASE } from "@/utils/hmrc/config";

type ValidateBody = {
  fraudData: ClientFraudData;
};

export async function POST(req: NextRequest) {
  let body: ValidateBody;
  try {
    body = (await req.json()) as ValidateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 });
  }

  if (!body.fraudData || typeof body.fraudData.deviceId !== "string") {
    return NextResponse.json({ error: "missing_fraud_data" }, { status: 400 });
  }

  const clientId = process.env.HMRC_CLIENT_ID;
  const clientSecret = process.env.HMRC_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "missing_hmrc_env" }, { status: 500 });
  }

  // Application-restricted token — no scope param (the Test Fraud Prevention
  // Headers API uses an empty scope; sending any scope name returns "scope is invalid")
  const tokenResponse = await fetch(`${HMRC_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }).toString(),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    let error = "token_request_failed";
    try {
      const errJson = await tokenResponse.json();
      error = errJson.error_description || errJson.error || error;
    } catch {}
    return NextResponse.json({ error }, { status: tokenResponse.status });
  }

  const tokenJson = await tokenResponse.json();

  // Read the logged-in Supabase user so Gov-Client-User-IDs reflects a real user
  // (falls back to a placeholder if not logged in — validator only checks format)
  let userId = "validate-fraud-headers-route";
  let userEmail: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      userEmail = user.email ?? null;
    }
  } catch {
    // ignore — fall through with placeholder
  }

  const fraudHeaders = buildFraudPreventionHeaders(
    req.headers,
    body.fraudData,
    userId,
    userEmail,
  );

  const validateUrl = `${HMRC_API_BASE}/test/fraud-prevention-headers/validate`;

  const validateRes = await fetch(validateUrl, {
    method: "GET",
    headers: {
      Accept: "application/vnd.hmrc.1.0+json",
      Authorization: `Bearer ${tokenJson.access_token}`,
      ...fraudHeaders,
    },
    cache: "no-store",
  });

  await logHmrcCall("GET", validateUrl, validateRes);

  let report: unknown = null;
  try {
    report = await validateRes.json();
  } catch {
    report = { parseError: "non-JSON response" };
  }

  return NextResponse.json({
    status: validateRes.status,
    correlationId: validateRes.headers.get("x-correlationid"),
    headersSent: fraudHeaders,
    report,
  }, { status: validateRes.ok ? 200 : validateRes.status });
}
