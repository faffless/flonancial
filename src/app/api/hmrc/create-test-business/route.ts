import { NextResponse } from "next/server";
import {
  applyHmrcCookieMutations,
  hmrcFetchWithAuth,
  getNinoForUser,
} from "@/utils/hmrc/server";
import { createClient } from "@/utils/supabase/server";
import { HMRC_API_BASE } from "@/utils/hmrc/config";

export async function POST(request: Request) {
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
    return NextResponse.json(
      { error: "missing_nino", message: "Set your NINO in /settings first" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const typeOfBusiness = body.typeOfBusiness ?? "uk-property";

  const payload: Record<string, unknown> = {
    typeOfBusiness,
    firstAccountingPeriodStartDate: "2026-04-06",
    firstAccountingPeriodEndDate: "2027-04-05",
    accountingType: "CASH",
    commencementDate: "2020-01-01",
  };

  if (typeOfBusiness === "self-employment") {
    payload.tradingName = "Flonancial Test SE";
    payload.businessAddressLineOne = "1 Test Street";
    payload.businessAddressPostcode = "TS1 1AA";
    payload.businessAddressCountryCode = "GB";
  }

  const url = `${HMRC_API_BASE}/individuals/self-assessment-test-support/business/${nino}`;

  const hmrcResult = await hmrcFetchWithAuth(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.hmrc.1.0+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!hmrcResult.ok) {
    const response = NextResponse.json(
      { error: hmrcResult.error },
      { status: hmrcResult.status }
    );
    return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
  }

  const hmrcResponse = hmrcResult.response;
  const hmrcBody = await hmrcResponse.json().catch(() => null);

  const response = NextResponse.json(
    {
      ok: hmrcResponse.ok,
      status: hmrcResponse.status,
      hmrcBody,
      sentPayload: payload,
      ninoUsed: nino,
    },
    { status: hmrcResponse.status }
  );
  return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
}
