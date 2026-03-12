import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  const state = randomUUID();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.HMRC_CLIENT_ID!,
    scope: "read:self-assessment write:self-assessment",
    redirect_uri: process.env.HMRC_REDIRECT_URI!,
    state,
  });

  const hmrcAuthUrl = `https://test-www.tax.service.gov.uk/oauth/authorize?${params.toString()}`;

  const response = NextResponse.redirect(hmrcAuthUrl);

  response.cookies.set("hmrc_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}