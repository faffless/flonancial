import { NextResponse } from "next/server";

function getSecureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

export async function POST() {
  const response = NextResponse.json({ ok: true, message: "Token marked as expired" });

  response.cookies.set("hmrc_token_expires_at", "0", {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(),
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
}