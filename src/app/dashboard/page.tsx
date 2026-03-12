import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { DeleteUpdateButton } from "@/components/delete-update-button";
import { createClient } from "@/utils/supabase/server";

type Business = {
  id: number;
  name: string;
  trading_name: string | null;
  business_type: string | null;
  start_date: string | null;
  accounting_year_end: string | null;
  hmrc_business_id: string | null;
  created_at: string;
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
  created_at: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: QuarterlyUpdate["status"]) {
  return status === "submitted" ? "Submitted" : "Draft";
}

function formatBusinessType(value: string | null) {
  if (!value) return "Not set";
  if (value === "sole_trader") return "Sole trader";
  if (value === "uk_property") return "UK property";
  if (value === "overseas_property") return "Overseas property";
  if (value === "other") return "Other";
  return value;
}

function formatAccountingYearEnd(value: string | null) {
  if (!value) return "Not set";
  if (value === "04-05") return "5 April";
  if (value === "03-31") return "31 March";
  if (value === "12-31") return "31 December";
  return value;
}

function getCurrentTaxYear(accountingYearEnd: string | null): {
  label: string;
  start: Date;
  end: Date;
} {
  const yearEnd = accountingYearEnd ?? "04-05";
  const [endMonth, endDay] = yearEnd.split("-").map(Number);

  const now = new Date();
  const yearEndThisYear = new Date(now.getFullYear(), endMonth - 1, endDay);

  const taxYearEndDate =
    now <= yearEndThisYear
      ? yearEndThisYear
      : new Date(now.getFullYear() + 1, endMonth - 1, endDay);

  const taxYearStartDate = new Date(taxYearEndDate);
  taxYearStartDate.setFullYear(taxYearStartDate.getFullYear() - 1);
  taxYearStartDate.setDate(taxYearStartDate.getDate() + 1);

  const startYear = taxYearStartDate.getFullYear();
  const endYear = taxYearEndDate.getFullYear();

  return {
    label: `${startYear}–${String(endYear).slice(2)}`,
    start: taxYearStartDate,
    end: taxYearEndDate,
  };
}

function getUpdatesForTaxYear(
  updates: QuarterlyUpdate[],
  businessId: number,
  taxYearStart: Date,
  taxYearEnd: Date
) {
  return updates.filter((u) => {
    if (u.business_id !== businessId) return false;
    const qs = new Date(`${u.quarter_start}T00:00:00`);
    return qs >= taxYearStart && qs <= taxYearEnd;
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: businessesData } = await supabase
    .from("businesses")
    .select(
      "id, name, trading_name, business_type, start_date, accounting_year_end, hmrc_business_id, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const { data: updatesData } = await supabase
    .from("quarterly_updates")
    .select(
      "id, business_id, user_id, period_key, quarter_start, quarter_end, turnover, expenses, status, submitted_at, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const businesses: Business[] = businessesData ?? [];
  const updates: QuarterlyUpdate[] = updatesData ?? [];

  const businessById = new Map(businesses.map((b) => [b.id, b]));
  const businessNameById = new Map(businesses.map((b) => [b.id, b.name]));

  const totalTurnover = updates.reduce((sum, u) => sum + Number(u.turnover), 0);
  const totalExpenses = updates.reduce((sum, u) => sum + Number(u.expenses), 0);
  const draftCount = updates.filter((u) => u.status === "draft").length;
  const submittedCount = updates.filter((u) => u.status === "submitted").length;
  const linkedHmrcCount = businesses.filter((b) => !!b.hmrc_business_id).length;
  const latestUpdate = updates[0] ?? null;

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
                Dashboard
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Signed in as {user.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/add-business"
                className="rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-black transition hover:opacity-90"
              >
                Add business
              </Link>
              <Link
                href="/add-update"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white"
              >
                Add quarterly update
              </Link>
              <Link
                href="/account"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white"
              >
                Account
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
          {[
            { label: "Businesses", value: businesses.length },
            { label: "HMRC linked", value: linkedHmrcCount },
            { label: "Updates", value: updates.length },
            { label: "Drafts", value: draftCount },
            { label: "Submitted", value: submittedCount },
            { label: "Total turnover", value: formatCurrency(totalTurnover) },
            { label: "Total expenses", value: formatCurrency(totalExpenses) },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                {label}
              </p>
              <p className="mt-2 text-2xl text-white">{value}</p>
            </div>
          ))}
        </div>

        {latestUpdate ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              Latest update
            </p>
            <h2 className="mt-2 text-xl font-normal text-white">
              {businessNameById.get(latestUpdate.business_id) ??
                `Business #${latestUpdate.business_id}`}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              {formatDate(latestUpdate.quarter_start)} to{" "}
              {formatDate(latestUpdate.quarter_end)}
            </p>
            <p className="mt-1 text-sm text-white/70">
              Status: {formatStatus(latestUpdate.status)}
            </p>
          </div>
        ) : null}

        {businesses.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              This tax year
            </p>

            <div className="mt-4 space-y-4">
              {businesses.map((business) => {
                const taxYear = getCurrentTaxYear(business.accounting_year_end);
                const taxYearUpdates = getUpdatesForTaxYear(
                  updates,
                  business.id,
                  taxYear.start,
                  taxYear.end
                );
                const submittedThisYear = taxYearUpdates.filter(
                  (u) => u.status === "submitted"
                ).length;
                const draftThisYear = taxYearUpdates.filter(
                  (u) => u.status === "draft"
                ).length;
                const completedQuarters = submittedThisYear;
                const totalQuarters = 4;

                return (
                  <div
                    key={business.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-white">
                            {business.name}
                          </p>
                          {business.hmrc_business_id ? (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2.5 py-1 text-[11px] text-emerald-300">
                              HMRC linked
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-0.5 text-xs text-white/45">
                          Tax year {taxYear.label}
                        </p>
                      </div>

                      <p className="text-sm text-white/70">
                        {completedQuarters}/{totalQuarters} submitted
                        {draftThisYear > 0 ? (
                          <span className="ml-2 text-amber-300/70">
                            {draftThisYear} draft
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-400/60 transition-all"
                        style={{
                          width: `${(completedQuarters / totalQuarters) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex gap-1">
                      {Array.from({ length: totalQuarters }).map((_, i) => {
                        const update = taxYearUpdates[i];
                        const isSubmitted = update?.status === "submitted";
                        const isDraft = update?.status === "draft";
                        return (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full ${
                              isSubmitted
                                ? "bg-emerald-400/60"
                                : isDraft
                                ? "bg-amber-400/40"
                                : "bg-white/10"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-normal text-white">Businesses</h2>
              <span className="text-xs text-white/45">{businesses.length} total</span>
            </div>

            {businesses.length > 0 ? (
              <div className="mt-4 space-y-3">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-white">
                            {business.name}
                          </p>
                          {business.hmrc_business_id ? (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2.5 py-1 text-[11px] text-emerald-300">
                              HMRC linked
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60">
                              Not linked
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {[
                            {
                              label: "Trading name",
                              value: business.trading_name || "Not set",
                            },
                            {
                              label: "Business type",
                              value: formatBusinessType(business.business_type),
                            },
                            {
                              label: "Start date",
                              value: business.start_date
                                ? formatDate(business.start_date)
                                : "Not set",
                            },
                            {
                              label: "Year end",
                              value: formatAccountingYearEnd(
                                business.accounting_year_end
                              ),
                            },
                            {
                              label: "HMRC business ID",
                              value: business.hmrc_business_id || "Not linked",
                            },
                          ].map(({ label, value }) => (
                            <div
                              key={label}
                              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                            >
                              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                                {label}
                              </p>
                              <p className="mt-1 text-sm text-white">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Link
                        href={`/edit-business/${business.id}`}
                        className="text-sm text-white/70 transition hover:text-white"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/80">
                  No businesses yet. Start by adding your first business.
                </p>
                <div className="mt-4">
                  <Link
                    href="/add-business"
                    className="rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-black transition hover:opacity-90"
                  >
                    Add business
                  </Link>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-normal text-white">Quarterly updates</h2>
              <span className="text-xs text-white/45">{updates.length} total</span>
            </div>

            {updates.length > 0 ? (
              <div className="mt-4 space-y-3">
                {updates.map((update) => {
                  const business = businessById.get(update.business_id);
                  const isHmrcLinked = Boolean(business?.hmrc_business_id);

                  return (
                    <div
                      key={update.id}
                      className="rounded-xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-white">
                              {businessNameById.get(update.business_id) ??
                                `Business #${update.business_id}`}
                            </p>
                            {isHmrcLinked ? (
                              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2.5 py-1 text-[11px] text-emerald-300">
                                HMRC linked
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 text-xs text-white/45">
                            {formatDate(update.quarter_start)} to{" "}
                            {formatDate(update.quarter_end)}
                          </p>
                          {update.period_key ? (
                            <p className="mt-1 text-xs text-white/30">
                              {update.period_key}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-full border px-3 py-1 text-xs ${
                              update.status === "submitted"
                                ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
                                : "border-amber-400/30 bg-amber-400/15 text-amber-300"
                            }`}
                          >
                            {formatStatus(update.status)}
                          </div>

                          {update.status === "draft" ? (
                            <>
                              <Link
                                href={`/edit-update/${update.id}`}
                                className="text-sm text-white/70 transition hover:text-white"
                              >
                                Edit
                              </Link>

                              {isHmrcLinked ? (
                                <Link
                                  href={`/hmrc-submit?updateId=${update.id}`}
                                  className="text-sm text-emerald-300 transition hover:text-emerald-200"
                                >
                                  Submit to HMRC
                                </Link>
                              ) : null}

                              <DeleteUpdateButton updateId={update.id} />
                            </>
                          ) : isHmrcLinked ? (
                            <>
                              <Link
                                href={`/edit-update/${update.id}`}
                                className="text-sm text-white/70 transition hover:text-white"
                              >
                                Edit
                              </Link>

                              <Link
                                href={`/hmrc-submit?updateId=${update.id}`}
                                className="text-sm text-emerald-300 transition hover:text-emerald-200"
                              >
                                Review HMRC submission
                              </Link>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                            Turnover
                          </p>
                          <p className="mt-1 text-sm text-white">
                            {formatCurrency(Number(update.turnover))}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                            Expenses
                          </p>
                          <p className="mt-1 text-sm text-white">
                            {formatCurrency(Number(update.expenses))}
                          </p>
                        </div>
                      </div>

                      {update.submitted_at ? (
                        <p className="mt-3 text-xs text-white/45">
                          Submitted {formatDate(update.submitted_at.slice(0, 10))}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : businesses.length === 0 ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/80">
                  Add a business first, then you can add your first quarterly update.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/80">
                  No quarterly updates yet. Add your first one now.
                </p>
                <div className="mt-4">
                  <Link
                    href="/add-update"
                    className="rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-black transition hover:opacity-90"
                  >
                    Add quarterly update
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </SiteShell>
  );
}