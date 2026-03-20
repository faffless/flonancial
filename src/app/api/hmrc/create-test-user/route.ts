import { NextResponse } from "next/server";

export async function POST() {
  const clientId = process.env.HMRC_CLIENT_ID;
  const clientSecret = process.env.HMRC_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "missing_hmrc_env" }, { status: 500 });
  }

  // Get an application-restricted token using client credentials
  const tokenResponse = await fetch(
    "https://test-api.service.hmrc.gov.uk/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: "write:self-assessment",
      }).toString(),
      cache: "no-store",
    }
  );

  if (!tokenResponse.ok) {
    let error = "token_request_failed";
    try {
      const errJson = await tokenResponse.json();
      error = errJson.error_description || errJson.error || error;
    } catch {}
    return NextResponse.json({ error }, { status: tokenResponse.status });
  }

  const tokenJson = await tokenResponse.json();

  // Create the test user
  const res = await fetch(
    "https://test-api.service.hmrc.gov.uk/create-test-user/individuals",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.hmrc.1.0+json",
        Authorization: `Bearer ${tokenJson.access_token}`,
      },
      body: JSON.stringify({
        serviceNames: [
          "mtd-income-tax",
          "self-assessment",
          "national-insurance",
        ],
      }),
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: res.status });
  }

  return NextResponse.json(data);
}