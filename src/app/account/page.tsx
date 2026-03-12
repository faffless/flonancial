The file on your computer still has the bad version. Let's just rewrite it cleanly. 

In Notepad, select **all the text** (Ctrl+A), delete it, then paste this exact code in:

```tsx
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

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setUserEmail(user.email ?? "");
      setLoading(false);
    }
    loadUser();
  }, [router, supabase]);

  useEffect(() => {
    const hmrc = searchParams.get("hmrc");
    const hmrcError = searchParams.get("hmrc_error");
    if (hmrc === "connected") { setMessage("HMRC sandbox connected."); return; }
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
    <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
      <div className="max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Private tester</p>
            <h1 className="mt-2 text-2xl font-normal tracking-tight text-white">Account</h1>
            <p className="mt-3 text-sm leading-6 text-white/70">Your current tester login details and HMRC sandbox connection.</p>
          </div>
          <Link href="/dashboard" className="text-sm text-white/70 underline underline-offset-4 transition hover:text-white">
            Back to dashboard
          </Link>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-white/70">Loading account...</p>
        ) : (
          <>
            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Signed in email</p>
              <p className="mt-2 text-sm text-white">{userEmail}</p>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">HMRC sandbox</p>
              <p className="mt-2 text-sm leading-6 text-white/70">Connect your HMRC sandbox test user to Flonancial.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="/api/hmrc/start" className="rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-black transition hover:opacity-90">Connect HMRC sandbox</a>
                <a href="/api/hmrc/business-details" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white">Check HMRC business details</a>
                <a href="/api/hmrc/obligations" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white">Check HMRC obligations</a>
              </div>
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
```

Save it, then in PowerShell:
```
git add .
git commit -m "fix account"
git push
```