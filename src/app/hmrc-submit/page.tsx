"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { collectFraudData } from "@/utils/hmrc/collect-fraud-data";
import TaxEstimate from "@/components/tax-estimate";

type PreviewResponse = {
  ok?: boolean;
  is_amend?: boolean;
  tax_year?: string;
  business?: {
    id: number;
    name: string;
    hmrc_business_id: string;
    business_type?: string;
  };
  period?: {
    quarter_start: string;
    quarter_end: string;
    period_key: string;
  };
  totals?: {
    turnover: number;
    expenses: number;
  };
  existing_submission?: {
    id: number;
    turnover: number;
    expenses: number;
    status: string;
    submitted_at: string | null;
  } | null;
  error?: string;
};

type SubmitResponse = {
  ok?: boolean;
  submitted?: boolean;
  is_amend?: boolean;
  tax_year?: string;
  business?: { id: number; name: string };
  period?: { quarter_start: string; quarter_end: string };
  totals?: { turnover: number; expenses: number };
  submitted_at?: string;
  error?: string;
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function HmrcSubmitContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("businessId");
  const periodKey = searchParams.get("periodKey");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);

  useEffect(() => {
    async function loadPreview() {
      if (!businessId || !periodKey) {
        setErrorMessage("Missing parameters. Please go back and try again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/hmrc/submit-business?businessId=${businessId}&periodKey=${encodeURIComponent(periodKey)}`,
        { method: "GET", credentials: "include", cache: "no-store" }
      );
      const json = (await response.json()) as PreviewResponse;

      if (!response.ok) {
        setErrorMessage(
          "We could not load this submission. Please go back and try again."
        );
        setLoading(false);
        return;
      }

      setPreview(json);
      setLoading(false);
    }
    loadPreview();
  }, [businessId, periodKey]);

  const isAmend = preview?.is_amend ?? false;

  // For amend — check if transaction totals differ from submitted figures
  const figuresChanged =
    isAmend &&
    preview?.existing_submission != null &&
    preview?.totals != null &&
    (Number(preview.totals.turnover) !==
      Number(preview.existing_submission.turnover) ||
      Number(preview.totals.expenses) !==
        Number(preview.existing_submission.expenses));

  async function handleSubmit() {
    if (!businessId || !periodKey) return;
    setSubmitting(true);
    setErrorMessage("");

    const fraudData = collectFraudData();

    const response = await fetch(
      `/api/hmrc/submit-business?businessId=${businessId}&periodKey=${encodeURIComponent(periodKey)}`,
      {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fraudData }),
      }
    );

    const json = (await response.json()) as SubmitResponse;

    if (!response.ok) {
      if (json.error === "no_changes_to_submit") {
        setErrorMessage(
          "Your transaction totals match what was already submitted — nothing to amend."
        );
      } else {
        setErrorMessage(
          "The submission failed. Please check your connection and try again."
        );
      }
      setSubmitting(false);
      return;
    }

    setSubmitResult(json);
    setSubmitted(true);
    setSubmitting(false);
  }

  const backHref = businessId ? `/business/${businessId}` : "/dashboard";

  return (
    <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
      <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">
            {submitted
              ? "Submitted to HMRC"
              : isAmend
              ? "Amend HMRC submission"
              : "Submit to HMRC"}
          </h1>
          <Link
            href={backHref}
            className="text-sm text-[#2E4A63] underline underline-offset-4 transition hover:text-[#0F1C2E]"
          >
            Back
          </Link>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-[#2E4A63]">Loading...</p>
        ) : errorMessage && !preview ? (
          <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <div className="mt-4">
              <Link
                href={backHref}
                className="rounded-xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]"
              >
                Go back
              </Link>
            </div>
          </div>
        ) : submitted && submitResult ? (
          <div className="mt-6 rounded-xl border border-emerald-600/20 bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-700">
              {submitResult.is_amend
                ? "Amendment sent to HMRC."
                : "Your figures have been sent to HMRC."}
            </p>
            {submitResult.business && submitResult.period ? (
              <p className="mt-2 text-sm text-emerald-700/70">
                {submitResult.business.name} —{" "}
                {formatDate(submitResult.period.quarter_start)} to{" "}
                {formatDate(submitResult.period.quarter_end)}
              </p>
            ) : null}
            {submitResult.totals ? (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-emerald-700/70">
                  Turnover submitted:{" "}
                  {formatCurrency(submitResult.totals.turnover)}
                </p>
                <p className="text-xs text-emerald-700/70">
                  Expenses submitted:{" "}
                  {formatCurrency(submitResult.totals.expenses)}
                </p>
              </div>
            ) : null}
            <div className="mt-5 flex gap-3">
              <Link
                href={backHref}
                className="rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90"
              >
                Back to business
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]"
              >
                Dashboard
              </Link>
            </div>
          </div>
        ) : preview?.business && preview.period && preview.totals ? (
          <>
            <p className="mt-4 text-sm leading-6 text-[#2E4A63]">
              {isAmend
                ? "This period was already submitted. The figures below are calculated from your current transactions. If they differ from your previous submission, you can send an amendment."
                : "Review the figures below. These are calculated from your transactions. Once you submit, they will be sent to HMRC."}
            </p>

            <div className="mt-6 space-y-3">
              {[
                { label: "Business", value: preview.business.name },
                {
                  label: "Period",
                  value: `${formatDate(preview.period.quarter_start)} to ${formatDate(preview.period.quarter_end)}`,
                },
                { label: "Tax year", value: preview.tax_year ?? "—" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#2E4A63]">
                    {label}
                  </p>
                  <p className="mt-1.5 text-sm text-[#0F1C2E]">{value}</p>
                </div>
              ))}

              {/* Current transaction totals */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Turnover (from transactions)",
                    value: formatCurrency(preview.totals.turnover),
                  },
                  {
                    label: "Expenses (from transactions)",
                    value: formatCurrency(preview.totals.expenses),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4"
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#2E4A63]">
                      {label}
                    </p>
                    <p className="mt-1.5 text-sm text-[#0F1C2E]">{value}</p>
                  </div>
                ))}
              </div>

              {/* Previous submission for amend */}
              {isAmend && preview.existing_submission ? (
                <div className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#2E4A63]">
                    Previously submitted
                  </p>
                  <p className="mt-1.5 text-sm text-[#0F1C2E]">
                    Turnover:{" "}
                    {formatCurrency(
                      Number(preview.existing_submission.turnover)
                    )}{" "}
                    · Expenses:{" "}
                    {formatCurrency(
                      Number(preview.existing_submission.expenses)
                    )}
                  </p>
                  {preview.existing_submission.submitted_at ? (
                    <p className="mt-1 text-xs text-[#2E4A63]">
                      Submitted{" "}
                      {formatDate(
                        preview.existing_submission.submitted_at.slice(0, 10)
                      )}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Tax estimate — show right before submit */}
            {preview.totals && (
              <div className="mt-4">
                <TaxEstimate
                  turnover={preview.totals.turnover}
                  expenses={preview.totals.expenses}
                  isQuarterly
                  compact
                />
              </div>
            )}

            {isAmend && !figuresChanged ? (
              <div className="mt-4 rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4">
                <p className="text-sm text-[#2E4A63]">
                  Your transaction totals match your previous submission — there
                  is nothing to amend. Update your transactions first if you
                  need to make a change.
                </p>
              </div>
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
                {submitting
                  ? "Submitting..."
                  : isAmend
                  ? "Send amendment to HMRC"
                  : "Submit to HMRC"}
              </button>
              <Link
                href={backHref}
                className="rounded-xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]"
              >
                Cancel
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4">
            <p className="text-sm text-[#0F1C2E]">
              No submission found. Please go back and try again.
            </p>
            <div className="mt-4">
              <Link
                href={backHref}
                className="rounded-xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]"
              >
                Go back
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
      <Suspense fallback={<p className="p-10 text-sm text-[#2E4A63]">Loading...</p>}>
        <HmrcSubmitContent />
      </Suspense>
    </SiteShell>
  );
}