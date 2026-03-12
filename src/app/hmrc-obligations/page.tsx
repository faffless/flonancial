"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/utils/supabase/client";

type Obligation = {
  business_id: number;
  business_name: string;
  hmrc_business_id: string;
  type_of_business: string;
  period_key: string | null;
  status: string | null;
  quarter_start: string | null;
  quarter_end: string | null;
  due_date: string | null;
  received_date: string | null;
};

type ObligationsResponse = {
  obligations?: Obligation[];
  error?: string;
  status?: number;
};

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(value: string | null) {
  if (!value) return "Unknown";
  if (value === "fulfilled") return "Fulfilled";
  if (value === "open") return "Open";
  return value;
}

export default function HmrcObligationsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [obligations, setObligations] = useState<Obligation[]>([]);

  useEffect(() => {
    async function loadPage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/hmrc/obligations", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = (await response.json()) as ObligationsResponse;

      if (!response.ok) {
        setErrorMessage(data.error || "Could not load HMRC obligations.");
        setLoading(false);
        return;
      }

      setObligations(data.obligations ?? []);
      setLoading(false);
    }

    loadPage();
  }, [router, supabase]);

  const openCount = obligations.filter((item) => item.status === "open").length;
  const fulfilledCount = obligations.filter(
    (item) => item.status === "fulfilled"
  ).length;

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Private tester
              </p>
              <h1 className="mt-2 text-2xl font-normal tracking-tight text-white">
                HMRC obligations
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                View the quarterly obligations HMRC currently expects for your
                linked business.
              </p>
            </div>

            <Link
              href="/account"
              className="text-sm text-white/70 underline underline-offset-4 transition hover:text-white"
            >
              Back to account
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-white/70">Loading HMRC obligations...</p>
          ) : errorMessage ? (
            <div className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 p-4">
              <p className="text-sm text-red-100">{errorMessage}</p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Total
                  </p>
                  <p className="mt-2 text-2xl text-white">{obligations.length}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Open
                  </p>
                  <p className="mt-2 text-2xl text-white">{openCount}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Fulfilled
                  </p>
                  <p className="mt-2 text-2xl text-white">{fulfilledCount}</p>
                </div>
              </div>

              {obligations.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {obligations.map((item, index) => (
                    <div
                      key={`${item.hmrc_business_id}-${item.quarter_start}-${item.quarter_end}-${index}`}
                      className="rounded-xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {item.business_name}
                          </p>
                          <p className="mt-1 text-xs text-white/45">
                            HMRC business ID: {item.hmrc_business_id}
                          </p>
                        </div>

                        <div
                          className={`rounded-full border px-3 py-1 text-xs ${
                            item.status === "fulfilled"
                              ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
                              : item.status === "open"
                              ? "border-amber-400/30 bg-amber-400/15 text-amber-300"
                              : "border-white/10 bg-white/[0.04] text-white/70"
                          }`}
                        >
                          {formatStatus(item.status)}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                            Period start
                          </p>
                          <p className="mt-1 text-sm text-white">
                            {formatDate(item.quarter_start)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                            Period end
                          </p>
                          <p className="mt-1 text-sm text-white">
                            {formatDate(item.quarter_end)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                            Due date
                          </p>
                          <p className="mt-1 text-sm text-white">
                            {formatDate(item.due_date)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                            Received date
                          </p>
                          <p className="mt-1 text-sm text-white">
                            {formatDate(item.received_date)}
                          </p>
                        </div>
                      </div>

                      {item.period_key ? (
                        <p className="mt-3 text-xs text-white/45">
                          HMRC period key: {item.period_key}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-white/80">
                    No HMRC obligations found for your linked business yet.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}