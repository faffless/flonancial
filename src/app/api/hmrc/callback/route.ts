import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
  commencementDate?: string;
};

type HMRCBusinessListResponse = {
  listOfBusinesses?: HMRCBusiness[];
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

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const storedState = request.cookies.get("hmrc_oauth_state")?.value;
  const appBaseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(new URL(`/account?hmrc_error=${encodeURIComponent(error)}`, appBaseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/account?hmrc_error=missing_code", appBaseUrl));
  }

  if (!returnedState || !storedState || returnedState !== storedState) {
    return NextResponse.redirect(new URL("/account?hmrc_error=invalid_state", appBaseUrl));
  }

  const clientId = process.env.HMRC_CLIENT_ID;
  const clientSecret = process.env.HMRC_CLIENT_SECRET;
  const redirectUri = process.env.HMRC_REDIRECT_URI;
  const testNino = process.env.HMRC_TEST_NINO;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/account?hmrc_error=missing_hmrc_env", appBaseUrl));
  }

  // ── Exchange code for token ──────────────────────────────────────────────

  const tokenBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const tokenResponse = await fetch("https://test-api.service.hmrc.gov.uk/oauth/token", {
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
    const response = NextResponse.redirect(new URL(`/account?hmrc_error=${encodeURIComponent(hmrcError)}`, appBaseUrl));
    response.cookies.set("hmrc_oauth_state", "", { httpOnly: true, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: 0 });
    return response;
  }

  const tokenJson = (await tokenResponse.json()) as HMRCTokenResponse;

  // ── Auto-fetch HMRC business IDs and save to Supabase ───────────────────

  if (testNino) {
    try {
      const businessListResponse = await fetch(
        `https://test-api.service.hmrc.gov.uk/individuals/business/details/${testNino}/list`,
        {
          method: "GET",
          headers: {
            Accept: "application/vnd.hmrc.2.0+json",
            Authorization: `Bearer ${tokenJson.access_token}`,
          },
          cache: "no-store",
        }
      );

      if (businessListResponse.ok) {
        const businessListJson = (await businessListResponse.json()) as HMRCBusinessListResponse;
        const hmrcBusinesses = businessListJson.listOfBusinesses ?? [];

        if (hmrcBusinesses.length > 0) {
          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            const { data: ourBusinesses } = await supabase
              .from("businesses")
              .select("id, business_type, hmrc_business_id")
              .eq("user_id", user.id);

            if (ourBusinesses && ourBusinesses.length > 0) {
              for (const hmrcBusiness of hmrcBusinesses) {
                const ourType = hmrcTypeToOurType(hmrcBusiness.typeOfBusiness);
                if (!ourType) continue;

                // Find a matching business that doesn't already have an HMRC ID
                const match = ourBusinesses.find(
                  (b) => b.business_type === ourType && !b.hmrc_business_id
                );

                if (match) {
                  await supabase
                    .from("businesses")
                    .update({ hmrc_business_id: hmrcBusiness.businessId })
                    .eq("id", match.id)
                    .eq("user_id", user.id);
                }
              }
            }
          }
        }
      }
    } catch {
      // Auto-fetch failed silently — user can still paste ID manually
    }
  }

  // ── Set cookies and redirect ─────────────────────────────────────────────

  const response = NextResponse.redirect(new URL("/dashboard", appBaseUrl));

  response.cookies.set("hmrc_oauth_state", "", { httpOnly: true, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: 0 });
  response.cookies.set("hmrc_access_token", tokenJson.access_token, { httpOnly: true, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: tokenJson.expires_in });
  response.cookies.set("hmrc_refresh_token", tokenJson.refresh_token, { httpOnly: true, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set("hmrc_token_expires_at", String(Date.now() + tokenJson.expires_in * 1000), { httpOnly: true, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: tokenJson.expires_in });
  response.cookies.set("hmrc_scope", tokenJson.scope ?? "", { httpOnly: true, sameSite: "lax", secure: getSecureCookieFlag(), path: "/", maxAge: tokenJson.expires_in });

  return response;
}