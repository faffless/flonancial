"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type SiteHeaderProps = {
  businessEmoji?: string;
  businessName?: string;
  businessTagline?: string;
  businessType?: string;
  hmrcReady?: boolean | null;
  isDemo?: boolean;
  editBusinessHref?: string;
  showBrandOnMobile?: boolean;
};

function useDaysUntil(targetDate: string): number {
  const target = new Date(`${targetDate}T00:00:00Z`);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function useCurrentTime(): string {
  const [time, setTime] = useState("");
  useEffect(() => {
    function update() {
      setTime(new Date().toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

function formatBusinessType(value: string) {
  if (value === "sole_trader") return "Sole trader";
  if (value === "uk_property") return "UK property";
  if (value === "overseas_property") return "Overseas property";
  return value;
}

export function SiteHeader({ businessEmoji, businessName, businessTagline, businessType, hmrcReady, isDemo, editBusinessHref, showBrandOnMobile }: SiteHeaderProps = {}) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const daysToMtd50k = useDaysUntil("2026-04-06");
  const daysToMtd30k = useDaysUntil("2027-04-06");
  const daysToDeadline = useDaysUntil("2026-05-05");
  const time = useCurrentTime();

  const showBusinessInfo = Boolean(businessName);
  const showCountdown = !showBusinessInfo;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-[#B8D0EB]/40 bg-white/70 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
        <div className="relative flex items-center justify-between gap-4 py-4">

          {/* Logo + brand name (horizontal) */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5 transition hover:opacity-90">
            <div className="w-[72px] sm:w-[112px]">
              <img src="/brand/77h.png" alt="Flonancial" className="h-full w-full object-contain" />
            </div>
            <span className={`${showBrandOnMobile ? "inline" : "hidden sm:inline"} text-xl font-bold tracking-tight text-[#0F1C2E]`}>Flonancial</span>
          </Link>

          {/* Centre */}
          {showBusinessInfo ? (
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-4 text-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {isDemo ? (
                  <span className="rounded-full bg-[#2E88D0] px-2 py-0.5 text-[10px] font-semibold text-white">DEMO</span>
                ) : null}
                <p className="text-lg font-semibold text-[#0F1C2E]">
                  {businessEmoji ? `${businessEmoji} ` : ""}{businessName}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {businessTagline ? <span className="text-xs text-[#2E4A63]">{businessTagline}</span> : null}
                {businessType ? (
                  <span className="rounded-full border border-[#B8D0EB] bg-[#F0F5FB] px-2 py-0.5 text-[10px] text-[#2E4A63]">
                    {formatBusinessType(businessType)}
                  </span>
                ) : null}
                {hmrcReady === true ? (
                  <span className="rounded-full border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">HMRC ready</span>
                ) : hmrcReady === false ? (
                  <span className="rounded-full border border-amber-600/20 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">Not matched to HMRC</span>
                ) : null}
                {editBusinessHref ? (
                  <Link href={editBusinessHref} className="rounded-full border border-[#B8D0EB] bg-[#F0F5FB] px-2 py-0.5 text-[10px] text-[#2E4A63] transition hover:bg-[#DEE9F8] hover:text-[#0F1C2E]">
                    Edit business
                  </Link>
                ) : null}
              </div>
            </div>
          ) : showCountdown ? (
            <div className="pointer-events-none absolute inset-x-0 hidden flex-col items-center gap-1.5 sm:flex">
              {time ? (
                <p className="text-xs text-[#2E4A63]">
                  {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric" })} · {time} GMT
                </p>
              ) : null}
              <p className="text-xs font-medium text-[#0F1C2E]">
                MTD mandatory for income over £50,000 (06/04/26) in{" "}
                <span className="font-bold text-[#2E88D0]">{daysToMtd50k} days</span>
              </p>
              <p className="text-xs font-medium text-[#0F1C2E]">
                Next quarterly deadline (05/05/26) in{" "}
                <span className="font-bold text-[#2E88D0]">{daysToDeadline} days</span>
              </p>
              <p className="text-xs font-medium text-[#0F1C2E]">
                MTD mandatory for income over £30,000 (06/04/27) in{" "}
                <span className="font-bold text-[#2E88D0]">{daysToMtd30k} days</span>
              </p>
            </div>
          ) : null}

          {/* Right side — nav links + auth */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            {/* Nav links */}
            <nav className="flex items-center gap-1 sm:gap-3">
              <Link href="/blog" className="rounded-lg px-2 py-1.5 text-xs font-medium text-[#2E4A63] transition hover:bg-[#F0F5FB] hover:text-[#0F1C2E] sm:text-sm">Guides</Link>
              <Link href="/tools/tax-calculator" className="rounded-lg px-2 py-1.5 text-xs font-medium text-[#2E4A63] transition hover:bg-[#F0F5FB] hover:text-[#0F1C2E] sm:text-sm">Calculator</Link>
              <Link href="/demo" className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-[#2E4A63] transition hover:bg-[#F0F5FB] hover:text-[#0F1C2E] sm:block sm:text-sm">Demo</Link>
            </nav>

            <div className="h-5 w-px bg-[#B8D0EB]" />

            {/* Auth buttons */}
            {loggedIn ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="text-xs font-medium text-[#2E4A63] transition hover:text-[#0F1C2E] sm:text-sm">Dashboard</Link>
                <button type="button" onClick={handleSignOut} disabled={signingOut} className="text-xs font-medium text-[#2E4A63] transition hover:text-[#0F1C2E] disabled:opacity-50 sm:text-sm">
                  {signingOut ? "..." : "Sign out"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/login" className="text-xs font-medium text-[#2E4A63] transition hover:text-[#0F1C2E] sm:text-sm">Log in</Link>
                <Link href="/signup" className="rounded-xl bg-[#2E88D0] px-3 py-2 text-xs font-semibold text-white shadow-md shadow-[#2E88D0]/20 transition hover:shadow-lg hover:shadow-[#2E88D0]/30 sm:px-5 sm:py-2.5 sm:text-sm">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
