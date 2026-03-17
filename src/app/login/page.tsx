"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { router.replace("/dashboard"); return; }
      setCheckingSession(false);
    }
    checkSession();
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setMessage("Enter email and password"); return; }
    setWorking(true);
    setMessage("Working...");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) { setMessage(error.message); setWorking(false); return; }
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
        <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">Log in</h1>
            <Link
              href="/"
              className="text-sm text-[#3B5A78] underline underline-offset-4 transition hover:text-[#0F1C2E]"
            >
              Home
            </Link>
          </div>

          {checkingSession ? (
            <p className="mt-6 text-sm text-[#3B5A78]">Checking session...</p>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm text-[#0F1C2E]">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition placeholder:text-[#3B5A78] focus:border-[#2E88D0]"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm text-[#0F1C2E]">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition placeholder:text-[#3B5A78] focus:border-[#2E88D0]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={working}
                  className="rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {working ? "Working..." : "Log in"}
                </button>
              </form>

              {message ? (
                <p className="mt-4 text-sm text-[#3B5A78]">{message}</p>
              ) : null}
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}