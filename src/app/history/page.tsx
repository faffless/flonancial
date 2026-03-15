import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SiteShell } from "@/components/site-shell";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

function formatPeriod(start: string, end: string) {
  return `${formatDate(start)} to ${formatDate(end)}`;
}

type BusinessesField = {
  name: string;
  business_type: string;
} | {
  name: string;
  business_type: string;
}[] | null;

type HistoryRow = {
  id: number;
  business_id: number;
  period_key: string;
  quarter_start: string;
  quarter_end: string;
  turnover: number;
  expenses: number;
  tax_year: string;
  action: "submitted" | "Amendment sent";
  submitted_at: string;
  businesses: BusinessesField;
};

type GroupedHistory = {
  business_id: number;
  business_name: string;
  business_type: string;
  entries: HistoryRow[];
};

function getBusinessName(businesses: BusinessesField): string {
  if (!businesses) return "Unknown business";
  if (Array.isArray(businesses)) return businesses[0]?.name ?? "Unknown business";
  return businesses.name ?? "Unknown business";
}

function getBusinessType(businesses: BusinessesField): string {
  if (!businesses) return "";
  if (Array.isArray(businesses)) return businesses[0]?.business_type ?? "";
  return businesses.business_type ?? "";
}

export default async function HistoryPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows, error } = await supabase
    .from("submission_history")
    .select(`
      id,
      business_id,
      period_key,
      quarter_start,
      quarter_end,
      turnover,
      expenses,
      tax_year,
      action,
      submitted_at,
      businesses (
        name,
        business_type
      )
    `)
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false });

  if (error) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10 py-10">
          <p className="text-[#5A7896]">Unable to load submission history.</p>
        </div>
      </SiteShell>
    );
  }

  const grouped: GroupedHistory[] = [];
  const seen = new Map<number, GroupedHistory>();

  for (const row of (rows ?? []) as unknown as HistoryRow[]) {
    if (!seen.has(row.business_id)) {
      const group: GroupedHistory = {
        business_id: row.business_id,
        business_name: getBusinessName(row.businesses),
        business_type: getBusinessType(row.businesses),
        entries: [],
      };
      seen.set(row.business_id, group);
      grouped.push(group);
    }
    seen.get(row.business_id)!.entries.push(row);
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10 py-10">
        <h1 className="text-2xl font-bold text-[#0F1C2E] mb-1">Submission History</h1>
        <p className="text-sm text-[#5A7896] mb-8">
          A record of every submission and amendment sent to HMRC from this account.
        </p>

        {grouped.length === 0 ? (
          <div className="rounded-2xl bg-[#CCE0F5] border border-[#B8D0EB] px-6 py-10 text-center">
            <p className="text-[#5A7896] text-sm">No submissions yet. Once you submit a quarterly update to HMRC it will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {grouped.map((group) => (
              <div key={group.business_id}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-lg font-bold text-[#0F1C2E]">{group.business_name}</h2>
                  <span className="text-xs font-medium text-[#5A7896] bg-[#CCE0F5] border border-[#B8D0EB] rounded-full px-3 py-0.5">
                    {group.business_type === "sole_trader" ? "Sole trader" : "UK property"}
                  </span>
                </div>

                <div className="rounded-2xl border border-[#B8D0EB] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#CCE0F5] text-[#5A7896] text-xs uppercase tracking-wide">
                        <th className="text-left px-5 py-3 font-semibold">Period</th>
                        <th className="text-left px-5 py-3 font-semibold">Tax year</th>
                        <th className="text-right px-5 py-3 font-semibold">Turnover</th>
                        <th className="text-right px-5 py-3 font-semibold">Expenses</th>
                        <th className="text-left px-5 py-3 font-semibold">Action</th>
                        <th className="text-left px-5 py-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.entries.map((entry, i) => (
                        <tr
                          key={entry.id}
                          className={i % 2 === 0 ? "bg-white" : "bg-[#f4f8fd]"}
                        >
                          <td className="px-5 py-3 text-[#0F1C2E]">
                            {formatPeriod(entry.quarter_start, entry.quarter_end)}
                          </td>
                          <td className="px-5 py-3 text-[#5A7896]">{entry.tax_year}</td>
                          <td className="px-5 py-3 text-right text-[#0F1C2E] font-medium">
                            {formatCurrency(entry.turnover)}
                          </td>
                          <td className="px-5 py-3 text-right text-[#0F1C2E] font-medium">
                            {formatCurrency(entry.expenses)}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                              entry.action === "amended"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}>
                              {entry.action === "amended" ? "Amended" : "Submitted"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[#5A7896] whitespace-nowrap">
                            {formatDate(entry.submitted_at)} at {formatTime(entry.submitted_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}