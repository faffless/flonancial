// TEMPORARY route — used only to verify the VPS reverse proxy forwards the
// client's TCP source port via X-Client-Port. Remove once HMRC fraud-prevention
// migration is proven end-to-end.

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return NextResponse.json(
    {
      clientPort: req.headers.get("x-client-port"),
      clientIP: req.headers.get("x-forwarded-for"),
      allHeaders: headers,
    },
    { status: 200 }
  );
}
