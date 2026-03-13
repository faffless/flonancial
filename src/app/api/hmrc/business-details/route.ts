import { NextResponse } from "next/server";
import {
  applyHmrcCookieMutations,
  hmrcFetchWithAuth,
} from "@/utils/hmrc/server";

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
  const testNino = process.env.HMRC_TEST_NINO;

  if (!testNino) {
    return NextResponse.json(
      { error: "missing_hmrc_test_nino" },
      { status: 500 }
    );
  }

  const hmrcResult = await hmrcFetchWithAuth(
    `https://test-api.service.hmrc.gov.uk/individuals/business/details/${encodeURIComponent(
      testNino
    )}/list`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.hmrc.2.0+json",
      },
    }
  );

  if (!hmrcResult.ok) {
    const response = NextResponse.json(
      {
        error: hmrcResult.error,
        status: hmrcResult.status,
      },
      { status: hmrcResult.status }
    );

    return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
  }

  const hmrcResponse = hmrcResult.response;

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

    const response = NextResponse.json(
      {
        error: hmrcError,
        status: hmrcResponse.status,
      },
      { status: hmrcResponse.status }
    );

    return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
  }

  const data = (await hmrcResponse.json()) as HMRCBusinessDetailsResponse;

  const businesses =
    data.listOfBusinesses?.map((business) => ({
      hmrc_business_id: business.businessId,
      type_of_business: business.typeOfBusiness,
      trading_name: business.tradingName ?? null,
    })) ?? [];

  const response = NextResponse.json({
    businesses,
  });

  return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
}