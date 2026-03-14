// src/utils/hmrc/fraud-prevention.ts

export type ClientFraudData = {
  browserJSUserAgent: string;
  deviceId: string;
  screens: string;      // e.g. "width=1920&height=1080&scaling-factor=1&colour-depth=24"
  timezone: string;     // e.g. "UTC+00:00"
  windowSize: string;   // e.g. "width=1256&height=803"
};

function pct(value: string): string {
  return encodeURIComponent(value);
}

function getClientPublicIP(requestHeaders: Headers): string | null {
  const forwarded = requestHeaders.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return null;
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

  // --- From browser (passed in POST body) ---
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

  // --- Client public IP (Vercel sets x-forwarded-for reliably) ---
  const clientIP = getClientPublicIP(requestHeaders);
  if (clientIP) {
    headers["Gov-Client-Public-IP"] = clientIP;
    headers["Gov-Client-Public-IP-Timestamp"] = new Date().toISOString();
  }

  // --- User IDs ---
  const userIdParts: string[] = [];
  if (userEmail) userIdParts.push(`email=${pct(userEmail)}`);
  userIdParts.push(`internal=${pct(userId)}`);
  headers["Gov-Client-User-IDs"] = userIdParts.join("&");

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