"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { collectFraudData } from "@/utils/hmrc/collect-fraud-data";

type SubmitPreviewResponse = {
  ok?: boolean;
  submitted?: boolean;
  submission_method?: string;
  tax_year?: string;
  business?: { id: number; name: string; hmrc_business_id: string; business_type?: string; };
  update?: { id: number; period_key: string | null; quarter_start: string; quarter_end: string; turnover: number; expenses: number; status: string; submitted_at?: string | null; };
  hmrc_endpoint?: string;
  hmrc_response?: unknown;
  note?: string;
  error?: string;
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function HmrcSubmitContent() {
  const searchParams = useSearchParams();
  const updateId = searchParams.get("updateId");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<SubmitPreviewResponse | null>(null);

  // Amend fields
  const [turnover, setTurnover] = useState("");
  const [expenses, setExpenses] = useState("");

  useEffect(() => {
    async function loadPreview() {
      if (!updateId) { setErrorMessage("No update selected. Please go back to the dashboard."); setLoading(false); return; }
      const response = await fetch(`/api/hmrc/submit-update/${updateId}`, { method: "GET", credentials: "include", cache: "no-store" });
      const json = (await response.json()) as SubmitPreviewResponse;
      if (!response.ok) { setErrorMessage("We could not load this submission. Please go back to the dashboard and try again."); setLoading(false); return; }
      setData(json);
      if (json.update) {
        setTurnover(String(json.update.turnover));
        setExpenses(String(json.update.expenses));
      }
      setLoading(false);
    }
    loadPreview();
  }, [updateId]);

  const isAmend = data?.update?.status === "submitted";

  const turnoverChanged = isAmend && Number(turnover) !== Number(data?.update?.turnover);
  const expensesChanged = isAmend && Number(expenses) !== Number(data?.update?.expenses);
  const figuresChanged = turnoverChanged || expensesChanged;

  async function handleSubmit() {
    if (!updateId || !data?.update) return;
    setSubmitting(true);
    setErrorMessage("");
    const fraudData = collectFraudData();

    const body: Record<string, unknown> = { fraudData };
    if (isAmend && figuresChanged) {
      body.turnover = Number(turnover);
      body.expenses = Number(expenses);
    }

    const response = await fetch(`/api/hmrc/submit-update/${updateId}`, {
      method: "POST", credentials: "include", cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await response.json()) as SubmitPreviewResponse;
    if (!response.ok) { setErrorMessage("The submission failed. Please check your figures and try again, or go back to the dashboard."); setSubmitting(false); return; }
    setData(json);
    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
      <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">
            {submitted ? "Submitted to HMRC" : isAmend ? "Amend HMRC submission" : "Submit to HMRC"}
          </h1>
          <Link href="/dashboard" className="text-sm text-[#5A7896] underline underline-offset-4 transition hover:text-[#0F1C2E]">Dashboard</Link>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-[#5A7896]">Loading...</p>
        ) : errorMessage && !data ? (
          <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <div className="mt-4">
              <Link href="/dashboard" className="rounded-xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]">
                Back to dashboard
              </Link>
            </div>
          </div>
        ) : data?.business && data.update ? (
          <>
            {submitted ? (
              <div className="mt-6 rounded-xl border border-emerald-600/20 bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-700">Your figures have been sent to HMRC.</p>
                <p className="mt-2 text-sm text-emerald-700/70">
                  {data.business.name} &mdash; {formatDate(data.update.quarter_start)} to {formatDate(data.update.quarter_end)}
                </p>
                <div className="mt-5">
                  <Link href="/dashboard" className="rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90">
                    Back to dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-4 text-sm leading-6 text-[#5A7896]">
                  {isAmend
                    ? "This period was already submitted. Update the figures below if they have changed, then send the amendment to HMRC."
                    : "Check your figures below. Once you submit, they will be sent to HMRC."}
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    { label: "Business", value: data.business.name },
                    { label: "Period", value: `${formatDate(data.update.quarter_start)} to ${formatDate(data.update.quarter_end)}` },
                    { label: "Tax year", value: data.tax_year ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#5A7896]">{label}</p>
                      <p className="mt-1.5 text-sm text-[#0F1C2E]">{value}</p>
                    </div>
                  ))}

                  {isAmend ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="turnover" className="mb-2 block text-sm text-[#0F1C2E]">Turnover</label>
                        <input
                          id="turnover"
                          type="number"
                          min="0"
                          step="0.01"
                          value={turnover}
                          onChange={(e) => setTurnover(e.target.value)}
                          className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]"
                        />
                      </div>
                      <div>
                        <label htmlFor="expenses" className="mb-2 block text-sm text-[#0F1C2E]">Expenses</label>
                        <input
                          id="expenses"
                          type="number"
                          min="0"
                          step="0.01"
                          value={expenses}
                          onChange={(e) => setExpenses(e.target.value)}
                          className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Turnover", value: formatCurrency(Number(data.update.turnover)) },
                        { label: "Expenses", value: formatCurrency(Number(data.update.expenses)) },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[#5A7896]">{label}</p>
                          <p className="mt-1.5 text-sm text-[#0F1C2E]">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isAmend && !figuresChanged ? (
                  <p className="mt-4 text-xs text-[#5A7896]">Change at least one figure above to send an amendment.</p>
                ) : null}

                {errorMessage ? (
                  <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4">
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || (isAmend && !figuresChanged)}
                    className="rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : isAmend ? "Send amended figures to HMRC" : "Submit to HMRC"}
                  </button>
                  <Link href="/dashboard" className="rounded-xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]">
                    Cancel
                  </Link>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4">
            <p className="text-sm text-[#0F1C2E]">No submission found. Please go back to the dashboard.</p>
            <div className="mt-4">
              <Link href="/dashboard" className="rounded-xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]">
                Back to dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function HmrcSubmitPage() {
  return (
    <SiteShell>
      <Suspense fallback={<p className="p-10 text-sm text-[#5A7896]">Loading...</p>}>
        <HmrcSubmitContent />
      </Suspense>
    </SiteShell>
  );
}
