import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getNinoForUser } from "@/utils/hmrc/server";
import {
  buildFraudPreventionHeaders,
  parseFraudDataFromCookie,
} from "@/utils/hmrc/fraud-prevention";
import { HMRC_API_BASE, HMRC_TOKEN_URL } from "@/utils/hmrc/config";

type HMRCTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope?: string;
};

type HMRCErrorResponse = {
  error?: string;
  error_description?: string;
  message?: string;
  code?: string;
};

type HMRCBusiness = {
  typeOfBusiness: string;
  businessId: string;
  tradingName?: string;
};

type HMRCBusinessListResponse = {
  listOfBusinesses?: HMRCBusiness[];
};

type HMRCAccountingPeriod = {
  start?: string;
  end?: string;
};

type HMRCBusinessDetail = {
  businessId: string;
  typeOfBusiness: string;
  tradingName?: string;
  accountingPeriods?: HMRCAccountingPeriod[];
  businessAddressLineOne?: string;
  businessAddressLineTwo?: string;
  businessAddressLineThree?: string;
  businessAddressLineFour?: string;
  businessAddressPostcode?: string;
  businessAddressCountryCode?: string;
  commencementDate?: string;
};

function getSecureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

function hmrcTypeToOurType(hmrcType: string): string | null {
  if (hmrcType === "self-employment") return "sole_trader";
  if (hmrcType === "uk-property") return "uk_property";
  if (hmrcType === "foreign-property") return "overseas_property";
  return null;
}

function deriveAccountingYearEnd(
  accountingPeriods?: HMRCAccountingPeriod[]
): string {
  if (!accountingPeriods || accountingPeriods.length === 0) return "04-05";
  const sorted = [...accountingPeriods].sort((a, b) =>
    (b.end ?? "").localeCompare(a.end ?? "")
  );
  const endDate = sorted[0]?.end;
  if (!endDate) return "04-05";
  const parts = endDate.split("-");
  if (parts.length < 3) return "04-05";
  const mmdd = `${parts[1]}-${parts[2]}`;
  if (mmdd === "04-05") return "04-05";
  if (mmdd === "03-31") return "03-31";
  if (mmdd === "12-31") return "12-31";
  return mmdd;
}

function getFallbackName(businessType: string | null): string {
  if (businessType === "sole_trader") return "My Sole Trader Business";
  if (businessType === "uk_property") return "My UK Property Business";
  if (businessType === "overseas_property") return "My Overseas Property Business";
  return "My Business";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const storedState = request.cookies.get("hmrc_oauth_state")?.value;
  const appBaseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?hmrc_error=${encodeURIComponent(error)}`, appBaseUrl));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/dashboard?hmrc_error=missing_code", appBaseUrl));
  }
  if (!returnedState || !storedState || returnedState !== storedState) {
    return NextResponse.redirect(new URL("/dashboard?hmrc_error=invalid_state", appBaseUrl));
  }

  const clientId = process.env.HMRC_CLIENT_ID;
  const clientSecret = process.env.HMRC_CLIENT_SECRET;
  const redirectUri = process.env.HMRC_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/dashboard?hmrc_error=missing_hmrc_env", appBaseUrl));
  }

  // ── Read fraud data from cookie (set by ConnectHmrcButton before OAuth redirect) ──
  const clientFraudData = parseFraudDataFromCookie(
    request.cookies.get("flo_fraud_data")?.value
  );

  // ── Exchange code for token ──────────────────────────────────────────────

  const tokenBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const tokenResponse = await fetch(HMRC_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    let hmrcError = "token_exchange_failed";
    try {
      const errorJson = (await tokenResponse.json()) as HMRCErrorResponse;
      hmrcError = errorJson.error_description || errorJson.error || errorJson.message || errorJson.code || hmrcError;
    } catch {}
    const response = NextResponse.redirect(new URL(`/dashboard?hmrc_error=${encodeURIComponent(hmrcError)}`, appBaseUrl));
    response.cookies.set("hmrc_oauth_state", "", { httpOnly: true, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: 0 });
    return response;
  }

  const tokenJson = (await tokenResponse.json()) as HMRCTokenResponse;

  // ── Fetch businesses from HMRC and sync to Supabase ─────────────────────

  const notifications: string[] = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const nino = await getNinoForUser(user.id);

      if (nino) {
        // Build fraud headers for the business sync calls
        const fraudHeaders = buildFraudPreventionHeaders(
          request.headers,
          clientFraudData,
          user.id,
          user.email
        );

        const listResponse = await fetch(
          `${HMRC_API_BASE}/individuals/business/details/${nino}/list`,
          {
            method: "GET",
            headers: {
              Accept: "application/vnd.hmrc.2.0+json",
              Authorization: `Bearer ${tokenJson.access_token}`,
              ...fraudHeaders,
            },
            cache: "no-store",
          }
        );

        if (listResponse.ok) {
          const listJson = (await listResponse.json()) as HMRCBusinessListResponse;
          const hmrcBusinesses = listJson.listOfBusinesses ?? [];

          for (const hmrcBusiness of hmrcBusinesses) {
            const ourType = hmrcTypeToOurType(hmrcBusiness.typeOfBusiness);
            if (!ourType) continue;

            // Get detailed info
            let detail: HMRCBusinessDetail | null = null;
            try {
              const detailResponse = await fetch(
                `${HMRC_API_BASE}/individuals/business/details/${nino}/${hmrcBusiness.businessId}`,
                {
                  method: "GET",
                  headers: {
                    Accept: "application/vnd.hmrc.2.0+json",
                    Authorization: `Bearer ${tokenJson.access_token}`,
                    ...fraudHeaders,
                  },
                  cache: "no-store",
                }
              );
              if (detailResponse.ok) {
                detail = (await detailResponse.json()) as HMRCBusinessDetail;
              }
            } catch {}

            const accountingYearEnd = deriveAccountingYearEnd(detail?.accountingPeriods);
            const tradingName = detail?.tradingName ?? hmrcBusiness.tradingName ?? null;

            // Check if business already exists with this HMRC ID
            const { data: existing } = await supabase
              .from("businesses")
              .select("id, name, business_type, accounting_year_end")
              .eq("user_id", user.id)
              .eq("hmrc_business_id", hmrcBusiness.businessId)
              .maybeSingle();

            if (existing) {
              const updates: Record<string, string | null> = {
                trading_name: tradingName,
                business_type: ourType,
                accounting_year_end: accountingYearEnd,
                address_line_1: detail?.businessAddressLineOne ?? null,
                address_line_2: detail?.businessAddressLineTwo ?? null,
                address_line_3: detail?.businessAddressLineThree ?? null,
                address_line_4: detail?.businessAddressLineFour ?? null,
                address_postcode: detail?.businessAddressPostcode ?? null,
                address_country_code: detail?.businessAddressCountryCode ?? null,
                commencement_date: detail?.commencementDate ?? null,
              };

              if (existing.accounting_year_end !== accountingYearEnd) {
                notifications.push(`year_end_changed:${existing.name}:${accountingYearEnd}`);
              }

              if (existing.business_type !== ourType) {
                notifications.push(`type_changed:${existing.name}:${ourType}`);
              }

              await supabase
                .from("businesses")
                .update(updates)
                .eq("id", existing.id)
                .eq("user_id", user.id);

            } else {
              let unmatched = null;

              const { data: exactMatch } = await supabase
                .from("businesses")
                .select("id, name, accounting_year_end")
                .eq("user_id", user.id)
                .eq("business_type", ourType)
                .is("hmrc_business_id", null)
                .maybeSingle();

              if (exactMatch) {
                unmatched = exactMatch;
              } else {
                const { data: anyMatch } = await supabase
                  .from("businesses")
                  .select("id, name, accounting_year_end, business_type")
                  .eq("user_id", user.id)
                  .is("hmrc_business_id", null)
                  .maybeSingle();

                if (anyMatch) {
                  unmatched = anyMatch;
                  if ((anyMatch as any).business_type !== ourType) {
                    notifications.push(`type_changed:${anyMatch.name}:${ourType}`);
                  }
                }
              }

              if (unmatched) {
                const updates: Record<string, string | null> = {
                  trading_name: tradingName,
                  business_type: ourType,
                  hmrc_business_id: hmrcBusiness.businessId,
                  accounting_year_end: accountingYearEnd,
                  address_line_1: detail?.businessAddressLineOne ?? null,
                  address_line_2: detail?.businessAddressLineTwo ?? null,
                  address_line_3: detail?.businessAddressLineThree ?? null,
                  address_line_4: detail?.businessAddressLineFour ?? null,
                  address_postcode: detail?.businessAddressPostcode ?? null,
                  address_country_code: detail?.businessAddressCountryCode ?? null,
                  commencement_date: detail?.commencementDate ?? null,
                };

                if (unmatched.accounting_year_end !== accountingYearEnd) {
                  notifications.push(`year_end_changed:${unmatched.name}:${accountingYearEnd}`);
                }

                await supabase
                  .from("businesses")
                  .update(updates)
                  .eq("id", unmatched.id)
                  .eq("user_id", user.id);

              } else {
                const newName = tradingName?.trim() || getFallbackName(ourType);

                await supabase.from("businesses").insert({
                  user_id: user.id,
                  name: newName,
                  trading_name: tradingName ?? null,
                  business_type: ourType,
                  hmrc_business_id: hmrcBusiness.businessId,
                  accounting_year_end: accountingYearEnd,
                  address_line_1: detail?.businessAddressLineOne ?? null,
                  address_line_2: detail?.businessAddressLineTwo ?? null,
                  address_line_3: detail?.businessAddressLineThree ?? null,
                  address_line_4: detail?.businessAddressLineFour ?? null,
                  address_postcode: detail?.businessAddressPostcode ?? null,
                  address_country_code: detail?.businessAddressCountryCode ?? null,
                  commencement_date: detail?.commencementDate ?? null,
                });
              }
            }
          }
        }
      }
    }
  } catch {
    // Sync failed silently — tokens still set, user lands on dashboard
  }

  // ── Set cookies and redirect ─────────────────────────────────────────────

  const dashboardUrl = new URL("/dashboard", appBaseUrl);
  if (notifications.length > 0) {
    dashboardUrl.searchParams.set("hmrc_notifications", encodeURIComponent(JSON.stringify(notifications)));
  }

  const response = NextResponse.redirect(dashboardUrl);

  // Clear OAuth state and fraud data cookies
  response.cookies.set("hmrc_oauth_state", "", { httpOnly: true, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: 0 });
  response.cookies.set("flo_fraud_data", "", { httpOnly: false, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: 0 });

  // Set HMRC auth cookies
  response.cookies.set("hmrc_access_token", tokenJson.access_token, { httpOnly: true, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: tokenJson.expires_in });
  response.cookies.set("hmrc_refresh_token", tokenJson.refresh_token, { httpOnly: true, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set("hmrc_token_expires_at", String(Date.now() + tokenJson.expires_in * 1000), { httpOnly: true, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: tokenJson.expires_in });
  response.cookies.set("hmrc_scope", tokenJson.scope ?? "", { httpOnly: true, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: tokenJson.expires_in });

  return response;
}
