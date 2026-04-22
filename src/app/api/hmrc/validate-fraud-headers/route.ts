import { NextRequest, NextResponse } from "next/server";
import { buildFraudPreventionHeaders, type ClientFraudData } from "@/utils/hmrc/fraud-prevention";
import { logHmrcCall } from "@/utils/hmrc/server";
import { HMRC_API_BASE } from "@/utils/hmrc/config";

type ValidateBody = {
  fraudData: ClientFraudData;
  userId?: string;
  userEmail?: string | null;
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

  const fraudHeaders = buildFraudPreventionHeaders(
    req.headers,
    body.fraudData,
    body.userId ?? "validate-fraud-headers-route",
    body.userEmail ?? null,
  );

  const validateUrl = `${HMRC_API_BASE}/test/fraud-prevention-headers/validate`;

  // Test Fraud Prevention Headers is an open-access API — no Authorization required
  const validateRes = await fetch(validateUrl, {
    method: "GET",
    headers: {
      Accept: "application/vnd.hmrc.1.0+json",
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
