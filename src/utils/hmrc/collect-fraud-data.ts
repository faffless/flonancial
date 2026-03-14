// Can live in src/utils/hmrc/collect-fraud-data.ts
// "use client" must be in effect when this runs (browser only)

import type { ClientFraudData } from "@/utils/hmrc/fraud-prevention";

function getOrCreateDeviceId(): string {
  const cookieName = "flo_device_id";
  const existing = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${cookieName}=`))
    ?.split("=")[1];

  if (existing) return existing;

  // Generate a UUID v4
  const uuid = crypto.randomUUID();
  const maxAge = 60 * 60 * 24 * 365 * 10; // 10 years
  document.cookie = `${cookieName}=${uuid}; max-age=${maxAge}; path=/; SameSite=Strict`;
  return uuid;
}

export function collectFraudData(): ClientFraudData {
  const screen = window.screen;
  const scalingFactor = window.devicePixelRatio ?? 1;

  const screens = [
    `width=${screen.width}`,
    `height=${screen.height}`,
    `scaling-factor=${scalingFactor}`,
    `colour-depth=${screen.colorDepth}`,
  ].join("&");

  const offset = -new Date().getTimezoneOffset(); // minutes, positive = east
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  const timezone = `UTC${sign}${hh}:${mm}`;

  return {
    browserJSUserAgent: navigator.userAgent,
    deviceId: getOrCreateDeviceId(),
    screens,
    timezone,
    windowSize: `width=${window.innerWidth}&height=${window.innerHeight}`,
  };
}