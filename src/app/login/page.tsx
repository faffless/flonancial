"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/dashboard");
        return;
      }

      setCheckingSession(false);
    }

    checkSession();
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Enter email and password");
      return;
    }

    setWorking(true);
    setMessage("Working...");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        setWorking(false);
        return;
      }

      setMessage("Account created. You can now log in.");
      setMode("login");
      setPassword("");
      setWorking(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setWorking(false);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Private tester
              </p>
              <h1 className="mt-2 text-2xl font-normal tracking-tight text-white">
                {mode === "login" ? "Log in" : "Create account"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Use your email and password to access the tester dashboard.
              </p>
            </div>

            <Link
              href="/"
              className="text-sm text-white/70 underline underline-offset-4 transition hover:text-white"
            >
              Back to homepage
            </Link>
          </div>

          {checkingSession ? (
            <p className="mt-6 text-sm text-white/70">Checking session...</p>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-xl border px-4 py-2 text-sm transition ${
                    mode === "login"
                      ? "border-sky-400 bg-sky-400 text-black"
                      : "border-white/10 bg-white/[0.04] text-white/80 hover:border-white/20 hover:bg-white/[0.07]"
                  }`}
                >
                  Log in
                </button>

                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`rounded-xl border px-4 py-2 text-sm transition ${
                    mode === "signup"
                      ? "border-sky-400 bg-sky-400 text-black"
                      : "border-white/10 bg-white/[0.04] text-white/80 hover:border-white/20 hover:bg-white/[0.07]"
                  }`}
                >
                  Sign up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm text-white/80"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/25"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm text-white/80"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/25"
                  />
                </div>

                <button
                  type="submit"
                  disabled={working}
                  className="rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {working
                    ? "Working..."
                    : mode === "login"
                    ? "Log in"
                    : "Create account"}
                </button>
              </form>

              {message ? (
                <p className="mt-4 text-sm text-white/70">{message}</p>
              ) : null}
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}