import { NextRequest, NextResponse } from "next/server";
import { buildFraudPreventionHeaders, ClientFraudData } from "@/utils/hmrc/fraud-prevention";
import { getValidHmrcAccessToken, applyHmrcCookieMutations } from "@/utils/hmrc/server";
import { createClient } from "@/utils/supabase/server";

const HMRC_VALIDATE_URL = "https://test-api.service.hmrc.gov.uk/test/fraud-prevention-headers/validate";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const clientData: ClientFraudData = await req.json();

  const tokenResult = await getValidHmrcAccessToken();
  if (!tokenResult.ok) {
    return NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status });
  }

  const fraudHeaders = buildFraudPreventionHeaders(
    req.headers,
    clientData,
    user.id,
    user.email
  );

  const validateResponse = await fetch(HMRC_VALIDATE_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokenResult.accessToken}`,
      Accept: "application/vnd.hmrc.1.0+json",
      ...fraudHeaders,
    },
    cache: "no-store",
  });

  const result = await validateResponse.json();

  const nextResponse = NextResponse.json({
    status: validateResponse.status,
    headers_sent: fraudHeaders,
    hmrc_response: result,
  });

  return applyHmrcCookieMutations(nextResponse, tokenResult.cookieMutations);
}