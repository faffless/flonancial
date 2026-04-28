import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Admin client used by logHmrcCall to persist HMRC call evidence to
// the `hmrc_call_log` table (bypasses RLS via service-role key).
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createAdminClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * Records a single HMRC API call to the `hmrc_call_log` Supabase table.
 * Captures method, URL, status, response_ok flag and the x-correlationid
 * response header — used as evidence for HMRC production approval and
 * fraud-header validation. Fire-and-forget; never blocks or throws.
 */
export async function logHmrcCall(
  method: string,
  url: string,
  response: Response
) {
  try {
    const admin = getAdminSupabase();
    if (!admin) return;
    await admin.from("hmrc_call_log").insert({
      method,
      url,
      status: response.status,
      response_ok: response.ok,
      correlation_id: response.headers.get("x-correlationid") ?? null,
    });
  } catch {
    // Fire-and-forget — never block on logging
  }
}

type HMRCRefreshTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};

type HMRCErrorResponse = {
  code?: string;
  message?: string;
  error?: string;
  error_description?: string;
};

type CookieMutation =
  | {
      name: string;
      value: string;
      maxAge: number;
    }
  | {
      name: string;
      value: "";
      maxAge: 0;
    };

type GetAccessTokenResult =
  | {
      ok: true;
      accessToken: string;
      cookieMutations: CookieMutation[];
    }
  | {
      ok: false;
      error: string;
      status: number;
      cookieMutations: CookieMutation[];
    };

type HmrcFetchResult =
  | {
      ok: true;
      response: Response;
      accessToken: string;
      cookieMutations: CookieMutation[];
    }
  | {
      ok: false;
      error: string;
      status: number;
      cookieMutations: CookieMutation[];
    };

import { HMRC_TOKEN_URL } from "@/utils/hmrc/config";


function getSecureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

function buildAuthCookieMutation(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  scope?: string
): CookieMutation[] {
  return [
    {
      name: "hmrc_access_token",
      value: accessToken,
      maxAge: expiresIn,
    },
    {
      name: "hmrc_refresh_token",
      value: refreshToken,
      maxAge: 60 * 60 * 24 * 30,
    },
    {
      name: "hmrc_token_expires_at",
      value: String(Date.now() + expiresIn * 1000),
      maxAge: expiresIn,
    },
    {
      name: "hmrc_scope",
      value: scope ?? "",
      maxAge: expiresIn,
    },
  ];
}

function buildClearHmrcCookieMutations(): CookieMutation[] {
  return [
    { name: "hmrc_access_token", value: "", maxAge: 0 },
    { name: "hmrc_refresh_token", value: "", maxAge: 0 },
    { name: "hmrc_token_expires_at", value: "", maxAge: 0 },
    { name: "hmrc_scope", value: "", maxAge: 0 },
    { name: "hmrc_oauth_state", value: "", maxAge: 0 },
  ];
}

async function refreshHmrcAccessToken(
  refreshToken: string
): Promise<GetAccessTokenResult> {
  const clientId = process.env.HMRC_CLIENT_ID;
  const clientSecret = process.env.HMRC_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      ok: false,
      error: "missing_hmrc_env",
      status: 500,
      cookieMutations: [],
    };
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const tokenResponse = await fetch(HMRC_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    let hmrcError = "hmrc_token_refresh_failed";

    try {
      const errorJson = (await tokenResponse.json()) as HMRCErrorResponse;
      hmrcError =
        errorJson.error_description ||
        errorJson.error ||
        errorJson.message ||
        errorJson.code ||
        hmrcError;
    } catch {}

    return {
      ok: false,
      error: hmrcError,
      status: tokenResponse.status,
      cookieMutations: buildClearHmrcCookieMutations(),
    };
  }

  const tokenJson = (await tokenResponse.json()) as HMRCRefreshTokenResponse;

  const nextRefreshToken = tokenJson.refresh_token || refreshToken;

  return {
    ok: true,
    accessToken: tokenJson.access_token,
    cookieMutations: buildAuthCookieMutation(
      tokenJson.access_token,
      nextRefreshToken,
      tokenJson.expires_in,
      tokenJson.scope
    ),
  };
}

export async function getValidHmrcAccessToken(): Promise<GetAccessTokenResult> {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get("hmrc_access_token")?.value;
  const refreshToken = cookieStore.get("hmrc_refresh_token")?.value;
  const expiresAtRaw = cookieStore.get("hmrc_token_expires_at")?.value;

  const expiresAt = Number(expiresAtRaw);
  const now = Date.now();
  const refreshBufferMs = 60 * 1000;

  if (
    accessToken &&
    Number.isFinite(expiresAt) &&
    expiresAt > now + refreshBufferMs
  ) {
    return {
      ok: true,
      accessToken,
      cookieMutations: [],
    };
  }

  if (!refreshToken) {
    return {
      ok: false,
      error: "missing_hmrc_refresh_token",
      status: 401,
      cookieMutations: buildClearHmrcCookieMutations(),
    };
  }

  return refreshHmrcAccessToken(refreshToken);
}

export async function hmrcFetchWithAuth(
  input: string,
  init?: RequestInit
): Promise<HmrcFetchResult> {
  const tokenResult = await getValidHmrcAccessToken();

  if (!tokenResult.ok) {
    return tokenResult;
  }

  const firstHeaders = new Headers(init?.headers ?? {});
  firstHeaders.set("Authorization", `Bearer ${tokenResult.accessToken}`);

  let response = await fetch(input, {
    ...init,
    headers: firstHeaders,
    cache: "no-store",
  });

  if (response.status !== 401) {
    return {
      ok: true,
      response,
      accessToken: tokenResult.accessToken,
      cookieMutations: tokenResult.cookieMutations,
    };
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("hmrc_refresh_token")?.value;

  if (!refreshToken) {
    return {
      ok: false,
      error: "missing_hmrc_refresh_token",
      status: 401,
      cookieMutations: buildClearHmrcCookieMutations(),
    };
  }

  const refreshed = await refreshHmrcAccessToken(refreshToken);

  if (!refreshed.ok) {
    return refreshed;
  }

  const retryHeaders = new Headers(init?.headers ?? {});
  retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);

  response = await fetch(input, {
    ...init,
    headers: retryHeaders,
    cache: "no-store",
  });

  return {
    ok: true,
    response,
    accessToken: refreshed.accessToken,
    cookieMutations: [
      ...tokenResult.cookieMutations,
      ...refreshed.cookieMutations,
    ],
  };
}

export function applyHmrcCookieMutations(
  response: NextResponse,
  cookieMutations: CookieMutation[]
) {
  for (const cookie of cookieMutations) {
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      sameSite: "lax",
      secure: getSecureCookieFlag(),
      path: "/",
      maxAge: cookie.maxAge,
    });
  }

  return response;
}

export async function getNinoForUser(userId: string): Promise<string | null> {
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("nino")
    .eq("user_id", userId)
    .single();

  if (error || !data?.nino) return null;
  return data.nino;
}