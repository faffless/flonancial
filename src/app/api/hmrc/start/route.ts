import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.HMRC_CLIENT_ID;
  const redirectUri = process.env.HMRC_REDIRECT_URI;
  const scopes = "read:self-assessment write:self-assessment";

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(
      new URL(
        "/account?hmrc_error=missing_hmrc_env",
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
      )
    );
  }

  const state = crypto.randomUUID();

  const authorizeUrl = new URL(
    "https://test-www.tax.service.gov.uk/oauth/authorize"
  );

  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("scope", scopes);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);

  const response = NextResponse.redirect(authorizeUrl);

  response.cookies.set("hmrc_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}