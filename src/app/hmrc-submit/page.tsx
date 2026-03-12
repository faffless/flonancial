"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/site-shell";

type SubmitPreviewResponse = {
  ok?: boolean;
  submitted?: boolean;
  submission_method?: string;
  tax_year?: string;
  business?: {
    id: number;
    name: string;
    hmrc_business_id: string;
    business_type?: string;
  };
  update?: {
    id: number;
    period_key: string | null;
    quarter_start: string;
    quarter_end: string;
    turnover: number;
    expenses: number;
    status: string;
    submitted_at?: string | null;
  };
  hmrc_endpoint?: string;
  hmrc_response?: unknown;
  note?: string;
  error?: string;
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
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

function getStatusLabel(status: string) {
  if (status === "submitted") return "Submitted";
  if (status === "draft") return "Draft";
  return status || "Not set";
}

function getIntroText(status?: string) {
  if (status === "submitted") {
    return "Review the HMRC submission preview for this linked update. This period has already been submitted once and can be amended and sent again.";
  }
  return "Review the HMRC submission preview for this linked draft.";
}

function getButtonText(submitting: boolean, submitted?: boolean, status?: string) {
  if (submitting) return "Submitting...";
  if (submitted) return "Submitted to HMRC";
  if (status === "submitted") return "Submit amended figures";
  return "Submit now";
}

function getSuccessMessage(status?: string) {
  if (status === "submitted") return "Amended figures submitted to HMRC successfully.";
  return "Submitted to HMRC successfully.";
}

function getConfirmMessage(status?: string) {
  if (status === "submitted") return "Submit amended cumulative figures for this HMRC-linked period now?";
  return "Submit this HMRC-linked draft to HMRC now?";
}

function HmrcSubmitContent() {
  const searchParams = useSearchParams();
  const updateId = searchParams.get("updateId");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [data, setData] = useState<SubmitPreviewResponse | null>(null);

  useEffect(() => {
    async function loadPreview() {
      if (!updateId) {
        setErrorMessage("Missing update ID");
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/hmrc/submit-update/${updateId}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const json = (await response.json()) as SubmitPreviewResponse;
      if (!response.ok) {
        setErrorMessage(json.error || "Could not load HMRC submission preview.");
        setLoading(false);
        return;
      }
      setData(json);
      setLoading(false);
    }
    loadPreview();
  }, [updateId]);

  async function handleSubmitToHmrc() {
    if (!updateId || !data?.update) {
      setErrorMessage("Missing update ID");
      return;
    }
    const confirmed = window.confirm(getConfirmMessage(data.update.status));
    if (!confirmed) return;
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    const response = await fetch(`/api/hmrc/submit-update/${updateId}`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
    const json = (await response.json()) as SubmitPreviewResponse;
    if (!response.ok) {
      setErrorMessage(json.error || "HMRC submission failed.");
      setSubmitting(false);
      return;
    }
    setData(json);
    setSuccessMessage(getSuccessMessage(data.update.status));
    setSubmitting(false);
  }

  return (
    <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Private tester</p>
            <h1 className="mt-2 text-2xl font-normal tracking-tight text-white">HMRC submission</h1>
            <p className="mt-3 text-sm leading-6 text-white/70">{getIntroText(data?.update?.status)}</p>
          </div>
          <Link href="/dashboard" className="text-sm text-white/70 underline underline-offset-4 transition hover:text-white">
            Back to dashboard
          </Link>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-white/70">Loading HMRC submission preview...</p>
        ) : errorMessage ? (
          <div className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 p-4">
            <p className="text-sm text-red-100">{errorMessage}</p>
          </div>
        ) : data?.business && data.update ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Submission method</p>
                <p className="mt-2 text-sm text-white">{data.submission_method ?? "Not set"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Tax year</p>
                <p className="mt-2 text-sm text-white">{data.tax_year ?? "Not set"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">HMRC business ID</p>
                <p className="mt-2 text-sm text-white">{data.business.hmrc_business_id}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Business</p>
                <p className="mt-2 text-sm text-white">{data.business.name}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Period</p>
                <p className="mt-2 text-sm text-white">{formatDate(data.update.quarter_start)} to {formatDate(data.update.quarter_end)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Update status</p>
                <p className="mt-2 text-sm text-white">{getStatusLabel(data.update.status)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Turnover</p>
                <p className="mt-2 text-sm text-white">{formatCurrency(Number(data.update.turnover))}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Expenses</p>
                <p className="mt-2 text-sm text-white">{formatCurrency(Number(data.update.expenses))}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Period key</p>
                <p className="mt-2 text-sm text-white">{data.update.period_key ?? "Not set"}</p>
              </div>
            </div>

            {data.update.status === "submitted" ? (
              <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4">
                <p className="text-sm text-emerald-200">This period was already submitted once. You can send amended cumulative figures for the same HMRC period.</p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSubmitToHmrc}
                disabled={submitting || data.submitted === true}
                className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-200 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {getButtonText(submitting, data.submitted, data.update.status)}
              </button>
              <Link href="/dashboard" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white">
                Back to dashboard
              </Link>
            </div>

            {successMessage ? (
              <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4">
                <p className="text-sm text-emerald-200">{successMessage}</p>
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">HMRC endpoint preview</p>
              <p className="mt-2 break-all text-sm text-white/80">{data.hmrc_endpoint ?? "Not set"}</p>
              {data.note ? <p className="mt-2 text-xs text-white/45">{data.note}</p> : null}
            </div>

            {data.hmrc_response ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">HMRC response</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-white/80">
                  {JSON.stringify(data.hmrc_response, null, 2)}
                </pre>
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-white/80">No HMRC submission preview available.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function HmrcSubmitPage() {
  return (
    <SiteShell>
      <Suspense fallback={<p className="p-10 text-sm text-white/70">Loading...</p>}>
        <HmrcSubmitContent />
      </Suspense>
    </SiteShell>
  );
}