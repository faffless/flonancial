import { NextResponse } from "next/server";
import { getValidHmrcAccessToken, applyHmrcCookieMutations } from "@/utils/hmrc/server";

export async function POST() {
  const tokenResult = await getValidHmrcAccessToken();
  if (!tokenResult.ok) {
    const response = NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status });
    return applyHmrcCookieMutations(response, tokenResult.cookieMutations);
  }

  const res = await fetch(
    "https://test-api.service.hmrc.gov.uk/create-test-user/individuals",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.hmrc.1.0+json",
        Authorization: `Bearer ${tokenResult.accessToken}`,
      },
      body: JSON.stringify({
        serviceNames: [
          "mtd-income-tax",
          "self-assessment",
          "national-insurance",
        ],
      }),
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    const response = NextResponse.json({ error: data }, { status: res.status });
    return applyHmrcCookieMutations(response, tokenResult.cookieMutations);
  }

  const response = NextResponse.json(data);
  return applyHmrcCookieMutations(response, tokenResult.cookieMutations);
}