import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const HMRC_COOKIES = [
  "hmrc_access_token",
  "hmrc_refresh_token",
  "hmrc_token_expires_at",
  "hmrc_scope",
  "hmrc_oauth_state",
];

function getSecureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const appBaseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/login", appBaseUrl));

  for (const name of HMRC_COOKIES) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: getSecureCookieFlag(),
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}