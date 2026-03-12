"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/utils/supabase/client";

type Business = {
  id: number;
  name: string;
  hmrc_business_id: string | null;
};

type QuarterlyUpdate = {
  id: number;
  business_id: number;
  user_id: string;
  period_key: string | null;
  quarter_start: string;
  quarter_end: string;
  turnover: number;
  expenses: number;
  status: "draft" | "submitted";
  submitted_at: string | null;
};

function formatCurrencyPreview(value: string) {
  if (value === "") return "£0.00";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "£0.00";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}

function addMonths(dateString: string, months: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date;
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getSuggestedQuarterEnd(start: string) {
  if (!start) return "";
  const end = addMonths(start, 3);
  end.setDate(end.getDate() - 1);
  return toInputDate(end);
}

export default function EditUpdatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const updateId = Number(params.id);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [periodKey, setPeriodKey] = useState<string | null>(null);
  const [quarterStart, setQuarterStart] = useState("");
  const [quarterEnd, setQuarterEnd] = useState("");
  const [turnover, setTurnover] = useState("");
  const [expenses, setExpenses] = useState("");
  const [status, setStatus] = useState<"draft" | "submitted">("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState("");

  const selectedBusiness =
    businesses.find((business) => String(business.id) === businessId) ?? null;

  const isHmrcLinked = Boolean(selectedBusiness?.hmrc_business_id);
  const canEditFields = status === "draft" || isHmrcLinked;

  useEffect(() => {
    async function loadPage() {
      if (!Number.isFinite(updateId)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: businessesData, error: businessesError } = await supabase
        .from("businesses")
        .select("id, name, hmrc_business_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (businessesError) {
        setMessage(businessesError.message);
        setLoading(false);
        return;
      }

      setBusinesses(businessesData ?? []);

      const { data: updateData, error: updateError } = await supabase
        .from("quarterly_updates")
        .select(
          "id, business_id, user_id, period_key, quarter_start, quarter_end, turnover, expenses, status, submitted_at"
        )
        .eq("id", updateId)
        .eq("user_id", user.id)
        .single();

      if (updateError || !updateData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setBusinessId(String(updateData.business_id));
      setPeriodKey(updateData.period_key ?? null);
      setQuarterStart(updateData.quarter_start);
      setQuarterEnd(updateData.quarter_end);
      setTurnover(String(updateData.turnover));
      setExpenses(String(updateData.expenses));
      setStatus(updateData.status);
      setLoading(false);
    }

    loadPage();
  }, [router, supabase, updateId]);

  function handleQuarterStartChange(value: string) {
    setQuarterStart(value);
    if (!value) {
      setQuarterEnd("");
      return;
    }
    setQuarterEnd(getSuggestedQuarterEnd(value));
  }

  function validateForm() {
    if (!businessId) {
      setMessage("Select a business");
      return false;
    }
    if (!quarterStart || !quarterEnd) {
      setMessage("Enter quarter start and end dates");
      return false;
    }
    if (quarterEnd < quarterStart) {
      setMessage("Quarter end must be after quarter start");
      return false;
    }
    if (turnover === "" || expenses === "") {
      setMessage("Enter turnover and expenses");
      return false;
    }
    const turnoverNumber = Number(turnover);
    const expensesNumber = Number(expenses);
    if (!Number.isFinite(turnoverNumber) || turnoverNumber < 0) {
      setMessage("Enter a valid turnover amount");
      return false;
    }
    if (!Number.isFinite(expensesNumber) || expensesNumber < 0) {
      setMessage("Enter a valid expenses amount");
      return false;
    }
    return true;
  }

  function buildPeriodKey() {
    if (periodKey) return periodKey;
    if (quarterStart && quarterEnd) return `${quarterStart}_${quarterEnd}`;
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canEditFields) {
      setMessage("Submitted updates cannot be edited");
      return;
    }

    if (!validateForm()) return;

    setSaving(true);
    setMessage("Saving...");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You need to log in");
      setSaving(false);
      router.push("/login");
      return;
    }

    let query = supabase
      .from("quarterly_updates")
      .update({
        business_id: Number(businessId),
        period_key: buildPeriodKey(),
        quarter_start: quarterStart,
        quarter_end: quarterEnd,
        turnover: Number(turnover),
        expenses: Number(expenses),
      })
      .eq("id", updateId)
      .eq("user_id", user.id);

    if (!isHmrcLinked) {
      query = query.eq("status", "draft");
    }

    const { error } = await query;

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  async function handleFinalise() {
    if (isHmrcLinked) {
      setMessage(
        "HMRC-linked updates cannot be finalised here. Use the HMRC submission page."
      );
      return;
    }

    if (status !== "draft") {
      setMessage("This update is already submitted");
      return;
    }

    if (!validateForm()) return;

    const confirmed = window.confirm(
      "Finalise this quarterly update? You will not be able to edit it afterwards."
    );

    if (!confirmed) return;

    setSubmitting(true);
    setMessage("Finalising...");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You need to log in");
      setSubmitting(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("quarterly_updates")
      .update({
        business_id: Number(businessId),
        period_key: buildPeriodKey(),
        quarter_start: quarterStart,
        quarter_end: quarterEnd,
        turnover: Number(turnover),
        expenses: Number(expenses),
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", updateId)
      .eq("user_id", user.id)
      .eq("status", "draft");

    if (error) {
      setMessage(error.message);
      setSubmitting(false);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

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
                Edit quarterly update
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Edit figures for this update before sending them on.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="text-sm text-white/70 transition hover:text-white"
            >
              Back to dashboard
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-white/70">Loading update...</p>
          ) : notFound ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/80">
                Update not found, or you do not have access to it.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Status
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {status === "submitted" ? "Submitted" : "Draft"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Period
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {buildPeriodKey() ?? "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Turnover preview
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {formatCurrencyPreview(turnover)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Expenses preview
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {formatCurrencyPreview(expenses)}
                  </p>
                </div>
              </div>

              {isHmrcLinked ? (
                <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4">
                  <p className="text-sm text-emerald-200">
                    This update belongs to an HMRC-linked business.
                  </p>
                  <p className="mt-2 text-xs text-emerald-200/80">
                    You can amend the figures here and then send the same period
                    to HMRC again from the HMRC submission page.
                  </p>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
                <div>
                  <label
                    htmlFor="business"
                    className="mb-2 block text-sm text-white/80"
                  >
                    Business
                  </label>

                  <select
                    id="business"
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    disabled={!canEditFields || isHmrcLinked}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25 disabled:opacity-60"
                  >
                    {businesses.map((business) => (
                      <option
                        key={business.id}
                        value={business.id}
                        className="bg-[#0D1115] text-white"
                      >
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="quarterStart"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Quarter start
                    </label>

                    <input
                      id="quarterStart"
                      type="date"
                      value={quarterStart}
                      onChange={(e) => handleQuarterStartChange(e.target.value)}
                      disabled={!canEditFields || isHmrcLinked}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="quarterEnd"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Quarter end
                    </label>

                    <input
                      id="quarterEnd"
                      type="date"
                      value={quarterEnd}
                      onChange={(e) => setQuarterEnd(e.target.value)}
                      disabled={!canEditFields || isHmrcLinked}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25 disabled:opacity-60"
                    />
                  </div>
                </div>

                <p className="text-xs leading-5 text-white/45">
                  {isHmrcLinked
                    ? "For HMRC-linked businesses, the obligation period stays locked to the HMRC period."
                    : "Quarter end must be exactly 3 months minus 1 day after quarter start."}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="turnover"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Turnover
                    </label>

                    <input
                      id="turnover"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={turnover}
                      onChange={(e) => setTurnover(e.target.value)}
                      disabled={!canEditFields}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/25 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="expenses"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Expenses
                    </label>

                    <input
                      id="expenses"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={expenses}
                      onChange={(e) => setExpenses(e.target.value)}
                      disabled={!canEditFields}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/25 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {canEditFields ? (
                    <button
                      type="submit"
                      disabled={saving || submitting}
                      className="rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  ) : null}

                  {isHmrcLinked ? (
                    <Link
                      href={`/hmrc-submit?updateId=${updateId}`}
                      className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-200 transition hover:bg-emerald-400/15"
                    >
                      Review HMRC submission
                    </Link>
                  ) : status === "draft" ? (
                    <button
                      type="button"
                      onClick={handleFinalise}
                      disabled={saving || submitting}
                      className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-200 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Finalising..." : "Finalise update"}
                    </button>
                  ) : null}

                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    Cancel
                  </Link>
                </div>

                {!canEditFields ? (
                  <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4">
                    <p className="text-sm text-emerald-200">
                      This update has been finalised and can no longer be edited.
                    </p>
                  </div>
                ) : null}

                {message ? (
                  <p className="text-sm text-white/70">{message}</p>
                ) : null}
              </form>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}