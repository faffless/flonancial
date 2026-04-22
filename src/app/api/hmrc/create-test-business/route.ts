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
  const hmrcBody = await hmrcResponse.json().catch(() => null) as { businessId?: string } | null;

  // Directly upsert into Supabase so dashboard shows the new business immediately
  // without relying on HMRC sandbox list endpoint eventual consistency
  let supabaseInsert: { ok: boolean; error?: string; row?: unknown } = { ok: false };
  if (hmrcResponse.ok && hmrcBody?.businessId) {
    const ourType =
      typeOfBusiness === "uk-property"
        ? "uk_property"
        : typeOfBusiness === "foreign-property"
          ? "overseas_property"
          : "sole_trader";
    const fallbackName =
      ourType === "uk_property"
        ? "Test UK Property Business"
        : ourType === "overseas_property"
          ? "Test Overseas Property Business"
          : "Test Sole Trader Business";

    const { data: insertedRow, error: insertError } = await supabase
      .from("businesses")
      .insert({
        user_id: user.id,
        name: (payload.tradingName as string) ?? fallbackName,
        trading_name: (payload.tradingName as string) ?? null,
        business_type: ourType,
        hmrc_business_id: hmrcBody.businessId,
        accounting_year_end: "04-05",
      })
      .select("id, name, business_type, hmrc_business_id")
      .single();

    if (insertError) {
      supabaseInsert = { ok: false, error: insertError.message };
    } else {
      supabaseInsert = { ok: true, row: insertedRow };
    }
  }

  const response = NextResponse.json(
    {
      ok: hmrcResponse.ok,
      status: hmrcResponse.status,
      hmrcBody,
      sentPayload: payload,
      ninoUsed: nino,
      supabaseInsert,
    },
    { status: hmrcResponse.status }
  );
  return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
}
