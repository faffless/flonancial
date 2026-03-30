/**
 * HMRC API configuration.
 *
 * Set HMRC_ENV=production in your environment to point at the live HMRC APIs.
 * Defaults to sandbox (test-api) when unset or any other value.
 */

const isProduction = process.env.HMRC_ENV === "production";

/** Base URL for HMRC REST APIs (Business Details, Obligations, SE, Property, etc.) */
export const HMRC_API_BASE = isProduction
  ? "https://api.service.hmrc.gov.uk"
  : "https://test-api.service.hmrc.gov.uk";

/** Base URL for the HMRC OAuth authorize page (Government Gateway login) */
export const HMRC_AUTH_BASE = isProduction
  ? "https://www.tax.service.gov.uk"
  : "https://test-www.tax.service.gov.uk";

/** Full URL for the OAuth token endpoint */
export const HMRC_TOKEN_URL = `${HMRC_API_BASE}/oauth/token`;

/** Full URL for the OAuth authorize endpoint */
export const HMRC_AUTHORIZE_URL = `${HMRC_AUTH_BASE}/oauth/authorize`;
