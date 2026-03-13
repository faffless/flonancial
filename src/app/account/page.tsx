"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/utils/supabase/client";

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [hmrcConnected, setHmrcConnected] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadPage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setUserEmail(user.email ?? "");
      const statusRes = await fetch("/api/hmrc/status", { credentials: "include", cache: "no-store" });
      const statusJson = await statusRes.json();
      setHmrcConnected(statusJson.connected === true);
      setLoading(false);
    }
    loadPage();
  }, [router, supabase]);

  useEffect(() => {
    const hmrc = searchParams.get("hmrc");
    const hmrcError = searchParams.get("hmrc_error");
    if (hmrc === "connected") { setMessage("HMRC connected successfully."); return; }
    if (hmrcError) { setMessage(`HMRC connection failed: ${hmrcError}`); }
  }, [searchParams]);

  async function handleSignOut() {
    setWorking(true);
    setMessage("Signing out...");
    const { error } = await supabase.auth.signOut();
    if (error) { setMessage(error.message); setWorking(false); return; }
    router.refresh();
    router.push("/login");
  }

  return (
    <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-normal tracking-tight text-white">Account</h1>
          <Link href="/dashboard" className="text-sm text-white/70 underline underline-offset-4 transition hover:text-white">Dashboard</Link>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-white/70">Loading...</p>
        ) : (
          <>
            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Signed in as</p>
              <p className="mt-2 text-sm text-white">{userEmail}</p>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">HMRC connection</p>

              {hmrcConnected === true ? (
                <div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    <p className="text-sm text-emerald-200">Connected</p>
                  </div>
                  <p className="mt-2 text-xs text-white/45">Your HMRC account is connected. You can submit quarterly updates from the dashboard.</p>
                  <div className="mt-4">
                    <a href="/api/hmrc/start" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white">Reconnect HMRC</a>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-white/20" />
                    <p className="text-sm text-white/70">Not connected</p>
                  </div>
                  <p className="mt-2 text-xs text-white/45">Connect your HMRC account to submit quarterly updates directly from Flonancial.</p>
                  <div className="mt-4">
                    <a href="/api/hmrc/start" className="rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-black transition hover:opacity-90">Connect HMRC</a>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-black transition hover:opacity-90">Go to dashboard</Link>
              <button type="button" onClick={handleSignOut} disabled={working} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
                {working ? "Signing out..." : "Sign out"}
              </button>
            </div>

            {message ? <p className="mt-4 text-sm text-white/70">{message}</p> : null}
          </>
        )}
      </div>
    </section>
  );
}

export default function AccountPage() {
  return (
    <SiteShell>
      <Suspense fallback={<p className="p-10 text-sm text-white/70">Loading...</p>}>
        <AccountContent />
      </Suspense>
    </SiteShell>
  );
}