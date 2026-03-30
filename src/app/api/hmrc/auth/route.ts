import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { HMRC_AUTHORIZE_URL } from "@/utils/hmrc/config";

export async function GET() {
  const state = randomUUID();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.HMRC_CLIENT_ID!,
    scope: "read:self-assessment write:self-assessment",
    redirect_uri: process.env.HMRC_REDIRECT_URI!,
    state,
  });

  const hmrcAuthUrl = `${HMRC_AUTHORIZE_URL}?${params.toString()}`;

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