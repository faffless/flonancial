import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type HMRCListBusiness = {
  businessId: string;
  typeOfBusiness: string;
  tradingName?: string;
};

type HMRCBusinessDetailsResponse = {
  listOfBusinesses?: HMRCListBusiness[];
};

type HMRCErrorResponse = {
  code?: string;
  message?: string;
  error?: string;
  error_description?: string;
};

export async function GET() {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get("hmrc_access_token")?.value;
  const testNino = process.env.HMRC_TEST_NINO;

  if (!accessToken) {
    return NextResponse.json(
      { error: "missing_hmrc_access_token" },
      { status: 401 }
    );
  }

  if (!testNino) {
    return NextResponse.json(
      { error: "missing_hmrc_test_nino" },
      { status: 500 }
    );
  }

  const hmrcResponse = await fetch(
    `https://test-api.service.hmrc.gov.uk/individuals/business/details/${encodeURIComponent(
      testNino
    )}/list`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.hmrc.2.0+json",
      },
      cache: "no-store",
    }
  );

  if (!hmrcResponse.ok) {
    let hmrcError = "hmrc_business_details_failed";

    try {
      const errorJson = (await hmrcResponse.json()) as HMRCErrorResponse;
      hmrcError =
        errorJson.message ||
        errorJson.error_description ||
        errorJson.error ||
        errorJson.code ||
        hmrcError;
    } catch {}

    return NextResponse.json(
      {
        error: hmrcError,
        status: hmrcResponse.status,
      },
      { status: hmrcResponse.status }
    );
  }

  const data = (await hmrcResponse.json()) as HMRCBusinessDetailsResponse;

  const businesses =
    data.listOfBusinesses?.map((business) => ({
      hmrc_business_id: business.businessId,
      type_of_business: business.typeOfBusiness,
      trading_name: business.tradingName ?? null,
    })) ?? [];

  return NextResponse.json({
    businesses,
  });
}