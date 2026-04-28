// src/utils/hmrc/fraud-prevention.ts

export type ClientFraudData = {
  browserJSUserAgent: string;
  deviceId: string;
  screens: string;      // e.g. "width=1920&height=1080&scaling-factor=1&colour-depth=24"
  timezone: string;     // e.g. "UTC+00:00"
  windowSize: string;   // e.g. "width=1256&height=803"
};

const EMPTY_FRAUD_DATA: ClientFraudData = {
  browserJSUserAgent: "",
  deviceId: "",
  screens: "",
  timezone: "",
  windowSize: "",
};

function pct(value: string): string {
  return encodeURIComponent(value);
}

function getClientPublicIP(requestHeaders: Headers): string | null {
  const forwarded = requestHeaders.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return null;
}

// X-Client-Port is injected by Caddy from {http.request.remote.port} — the
// end-user's TCP source port. Required by HMRC for Gov-Client-Public-Port.
function getClientPublicPort(requestHeaders: Headers): string | null {
  const port = requestHeaders.get("x-client-port");
  if (!port) return null;
  return /^\d+$/.test(port) ? port : null;
}

/**
 * Parse fraud data from X-Fraud-Data header (base64-encoded JSON).
 * Used by GET routes (obligations, retrieve-cumulative) where the business page
 * sends fraud data as a custom header.
 */
export function parseFraudDataFromHeader(headerValue: string | null): ClientFraudData {
  if (!headerValue) return EMPTY_FRAUD_DATA;
  try {
    const decoded = Buffer.from(headerValue, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (typeof parsed.browserJSUserAgent === "string" && typeof parsed.deviceId === "string") {
      return parsed as ClientFraudData;
    }
    return EMPTY_FRAUD_DATA;
  } catch {
    return EMPTY_FRAUD_DATA;
  }
}

/**
 * Parse fraud data from a cookie (URL-encoded JSON).
 * Used by the callback route where the ConnectHmrcButton stores fraud data
 * in a cookie before navigating to HMRC OAuth.
 */
export function parseFraudDataFromCookie(cookieValue: string | null | undefined): ClientFraudData {
  if (!cookieValue) return EMPTY_FRAUD_DATA;
  try {
    const decoded = decodeURIComponent(cookieValue);
    const parsed = JSON.parse(decoded);
    if (typeof parsed.browserJSUserAgent === "string" && typeof parsed.deviceId === "string") {
      return parsed as ClientFraudData;
    }
    return EMPTY_FRAUD_DATA;
  } catch {
    return EMPTY_FRAUD_DATA;
  }
}

export function buildFraudPreventionHeaders(
  requestHeaders: Headers,
  clientData: ClientFraudData,
  userId: string,
  userEmail: string | null | undefined
): Record<string, string> {
  const headers: Record<string, string> = {};

  const vendorPublicIP = process.env.VENDOR_PUBLIC_IP ?? "";
  const appVersion = process.env.APP_VERSION ?? "1.0.0";

  // --- Static ---
  headers["Gov-Client-Connection-Method"] = "WEB_APP_VIA_SERVER";
  headers["Gov-Vendor-Product-Name"] = "Flonancial";
  headers["Gov-Vendor-Version"] = `Flonancial=${pct(appVersion)}`;

  // --- From browser (passed in POST body, custom header, or cookie) ---
  if (clientData.browserJSUserAgent) {
    headers["Gov-Client-Browser-JS-User-Agent"] = clientData.browserJSUserAgent;
  }
  if (clientData.deviceId) {
    headers["Gov-Client-Device-ID"] = clientData.deviceId;
  }
  if (clientData.screens) {
    headers["Gov-Client-Screens"] = clientData.screens;
  }
  if (clientData.timezone) {
    headers["Gov-Client-Timezone"] = clientData.timezone;
  }
  if (clientData.windowSize) {
    headers["Gov-Client-Window-Size"] = clientData.windowSize;
  }

  // --- Client public IP + TCP source port ---
  const clientIP = getClientPublicIP(requestHeaders);
  if (clientIP) {
    headers["Gov-Client-Public-IP"] = clientIP;
    headers["Gov-Client-Public-IP-Timestamp"] = new Date().toISOString();
  }

  const clientPort = getClientPublicPort(requestHeaders);
  if (clientPort) {
    headers["Gov-Client-Public-Port"] = clientPort;
  }

  // --- User IDs ---
  const userIdParts: string[] = [];
  if (userEmail) userIdParts.push(`email=${pct(userEmail)}`);
  userIdParts.push(`internal=${pct(userId)}`);
  headers["Gov-Client-User-IDs"] = userIdParts.join("&");

  // --- Vendor License IDs ---
  // Flonancial is free; per-user identifier suffices to satisfy HMRC's
  // "header required" check. Anonymous routes pass userId="<route>".
  headers["Gov-Vendor-License-IDs"] = `flonancial=${pct(userId)}`;

  // --- Vendor IP + forwarded (only if env var is set) ---
  if (vendorPublicIP) {
    headers["Gov-Vendor-Public-IP"] = vendorPublicIP;
    if (clientIP) {
      headers["Gov-Vendor-Forwarded"] =
        `by=${pct(vendorPublicIP)}&for=${pct(clientIP)}`;
    }
  }

  return headers;
}
