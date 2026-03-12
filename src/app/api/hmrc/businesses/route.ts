import { cookies } from "next/headers";
import { NextResponse } from "next/server";
type HmrcBusiness = {
  businessId: string;
  typeOfBusiness: string;
  tradingName?: string;
};
type HmrcListBusinessesResponse = {
  listOfBusinesses?: HmrcBusiness[];
  code?: string;
  message?: string;
};
function getPublicIpFromHeaders(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (!forwardedFor) return "203.0.113.1";
  return forwardedFor.split(",")[0]?.trim() || "203.0.113.1";
}
function getPublicPortFromHeaders(headers: Headers) {
  const forwardedPort = headers.get("x-forwarded-port");
  if (!forwardedPort) return "12345";
  return forwardedPort;
}
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("hmrc_access_token")?.value;
  const nino = process.env.HMRC_TEST_NINO;
  if (!accessToken) {
    return NextResponse.json(
      { error: "No HMRC access token found. Connect HMRC sandbox first." },
      { status: 401 }
    );
  }
  if (!nino) {
    return NextResponse.json(
      { error: "Missing HMRC_TEST_NINO in .env.local" },
      { status: 500 }
    );
  }
  const nowIso = new Date().toISOString();
  const publicIp = getPublicIpFromHeaders(request.headers);
  const publicPort = getPublicPortFromHeaders(request.headers);
  const hmrcResponse = await fetch(
    `https://test-api.service.hmrc.gov.uk/individuals/business/details/${encodeURIComponent(
      nino
    )}/list`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.hmrc.1.0+json",
        Authorization: `Bearer ${accessToken}`,
        "Gov-Client-Connection-Method": "WEB_APP_VIA_SERVER",
        "Gov-Client-Public-IP": publicIp,
        "Gov-Client-Public-IP-Timestamp": nowIso,
        "Gov-Client-Public-Port": publicPort,
        "Gov-Client-Timezone": "UTC+00:00",
      },
      cache: "no-store",
    }
  );
  const text = await hmrcResponse.text();
  let data: HmrcListBusinessesResponse | { raw: string };
  try {
    data = JSON.parse(text) as HmrcListBusinessesResponse;
  } catch {
    data = { raw: text };
  }
  if (!hmrcResponse.ok) {
    return NextResponse.json(
      {
        error: "HMRC Business Details request failed",
        status: hmrcResponse.status,
        hmrc: data,
      },
      { status: hmrcResponse.status }
    );
  }
  const listData = data as HmrcListBusinessesResponse;
  const businesses = Array.isArray(listData.listOfBusinesses)
    ? listData.listOfBusinesses
    : [];
  const selfEmploymentBusinesses = businesses.filter(
    (business) => business.typeOfBusiness === "self-employment"
  );
  return NextResponse.json({
    ok: true,
    count: businesses.length,
    selfEmploymentCount: selfEmploymentBusinesses.length,
    businesses,
    selfEmploymentBusinesses,
  });
}