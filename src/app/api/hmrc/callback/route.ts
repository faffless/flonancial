import { NextRequest, NextResponse } from "next/server";

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

function getSecureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const storedState = request.cookies.get("hmrc_oauth_state")?.value;

  const appBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      new URL(`/account?hmrc_error=${encodeURIComponent(error)}`, appBaseUrl)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/account?hmrc_error=missing_code", appBaseUrl)
    );
  }

  if (!returnedState || !storedState || returnedState !== storedState) {
    return NextResponse.redirect(
      new URL("/account?hmrc_error=invalid_state", appBaseUrl)
    );
  }

  const clientId = process.env.HMRC_CLIENT_ID;
  const clientSecret = process.env.HMRC_CLIENT_SECRET;
  const redirectUri = process.env.HMRC_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL("/account?hmrc_error=missing_hmrc_env", appBaseUrl)
    );
  }

  const tokenBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const tokenResponse = await fetch(
    "https://test-api.service.hmrc.gov.uk/oauth/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenBody.toString(),
      cache: "no-store",
    }
  );

  if (!tokenResponse.ok) {
    let hmrcError = "token_exchange_failed";

    try {
      const errorJson = (await tokenResponse.json()) as HMRCErrorResponse;
      hmrcError =
        errorJson.error_description ||
        errorJson.error ||
        errorJson.message ||
        errorJson.code ||
        hmrcError;
    } catch {}

    const response = NextResponse.redirect(
      new URL(
        `/account?hmrc_error=${encodeURIComponent(hmrcError)}`,
        appBaseUrl
      )
    );

    response.cookies.set("hmrc_oauth_state", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: getSecureCookieFlag(),
      path: "/",
      maxAge: 0,
    });

    return response;
  }

  const tokenJson = (await tokenResponse.json()) as HMRCTokenResponse;

  const response = NextResponse.redirect(
    new URL("/account?hmrc=connected", appBaseUrl)
  );

  response.cookies.set("hmrc_oauth_state", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(),
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("hmrc_access_token", tokenJson.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(),
    path: "/",
    maxAge: tokenJson.expires_in,
  });

  response.cookies.set("hmrc_refresh_token", tokenJson.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  response.cookies.set(
    "hmrc_token_expires_at",
    String(Date.now() + tokenJson.expires_in * 1000),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: getSecureCookieFlag(),
      path: "/",
      maxAge: tokenJson.expires_in,
    }
  );

  response.cookies.set("hmrc_scope", tokenJson.scope ?? "", {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(),
    path: "/",
    maxAge: tokenJson.expires_in,
  });

  return response;
}