import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("hmrc_access_token")?.value;
  const refreshToken = cookieStore.get("hmrc_refresh_token")?.value;
  const expiresAt = Number(cookieStore.get("hmrc_token_expires_at")?.value);
  const now = Date.now();

  const hasValidToken =
    !!refreshToken &&
    !!accessToken &&
    Number.isFinite(expiresAt) &&
    expiresAt > now;

  return NextResponse.json({ connected: hasValidToken });
}