"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

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
      setTime(new Date().toLocaleTimeString("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }));
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

export function SiteHeader() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const daysToMtd50k = useDaysUntil("2026-04-06");
  const daysToMtd30k = useDaysUntil("2027-04-06");
  const daysToDeadline = useDaysUntil("2026-05-05");
  const time = useCurrentTime();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-[#B8D0EB] bg-transparent">
      <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
        <div className="flex items-end justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex flex-col items-center transition hover:opacity-90">
            <div className="flex h-[80px] w-[140px] items-center justify-center">
              <img src="/brand/99D.png" alt="Flonancial" className="h-full w-full object-contain" />
            </div>
            <p className="mt-0 text-lg font-bold tracking-tight text-[#0F1C2E]">Flonancial</p>
          </Link>

          {/* Countdowns — hidden on mobile */}
          <div className="hidden flex-col items-center gap-2 sm:flex">
            {time ? (
              <p className="text-xs text-[#5A7896]">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric" })} &middot; {time} GMT
              </p>
            ) : null}
            <p className="text-xs font-medium text-[#0F1C2E]">
              Making Tax Digital becomes mandatory for income over £50,000 (06/04/26) in <span className="font-bold text-[#2E88D0]">{daysToMtd50k} days</span>
            </p>
            <p className="text-xs font-medium text-[#0F1C2E]">
              Next quarterly submission deadline (05/05/26) in <span className="font-bold text-[#2E88D0]">{daysToDeadline} days</span>
            </p>
            <p className="text-xs font-medium text-[#0F1C2E]">
              Making Tax Digital becomes mandatory for income over £30,000 (06/04/27) in <span className="font-bold text-[#2E88D0]">{daysToMtd30k} days</span>
            </p>
          </div>

          {/* Right side */}
          {loggedIn ? (
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="text-lg font-bold tracking-tight text-[#0F1C2E] transition hover:opacity-75 disabled:opacity-50"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
              <Link href="/dashboard" className="text-lg font-bold tracking-tight text-[#0F1C2E] transition hover:opacity-75">
                Dashboard
              </Link>
            </div>
          ) : (
            <Link href="/login" className="text-lg font-bold tracking-tight text-[#0F1C2E] transition hover:opacity-75">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}