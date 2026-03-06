"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Calendar, ChevronRight, Download } from "lucide-react";
import { SiteShell } from "@/components/site-shell";

type Role = "sole_trader" | "landlord" | "both" | "neither";

export default function CheckerPage() {
  const [role, setRole] = useState<Role>("sole_trader");
  const [sa, setSa] = useState<"yes" | "no" | "not_sure">("yes");
  const [incomeBand, setIncomeBand] = useState<"over" | "under" | "not_sure">("not_sure");

  const result = useMemo(() => {
    if (role === "neither") {
      return {
        label: "Likely not in scope",
        tone: "bg-white/70 border-slate-200",
        summary:
          "MTD for Income Tax mainly affects people with self-employment and/or property income. If that’s not you, you’re probably not in scope.",
        bullets: ["If your situation changes, re-check.", "For edge cases, confirm with HMRC guidance or a professional."],
      };
    }

    if (incomeBand === "under") {
      return {
        label: "May not be in scope (depends on thresholds and your circumstances)",
        tone: "bg-amber-50/70 border-amber-200",
        summary:
          "Based on what you selected, you might not be required immediately — but it can depend on thresholds and HMRC rules.",
        bullets: [
          "Download the calendar so you’re ready if you do become in scope.",
          "Start keeping records digitally if you can (spreadsheets are fine).",
          "If you’re close to thresholds, plan early.",
        ],
      };
    }

    if (incomeBand === "over") {
      return {
        label: "Likely in scope (prepare now)",
        tone: "bg-emerald-50/70 border-emerald-200",
        summary:
          "If you’re a sole trader and/or landlord and your income is over the relevant thresholds, you’re likely to be brought into MTD for Income Tax.",
        bullets: [
          "You’ll need digital records, quarterly updates, and an end-of-year submission.",
          "You don’t need HMRC integration to prepare — start with clean categories.",
          "Grab the deadlines calendar and set reminders.",
        ],
      };
    }

    return {
      label: "Possibly in scope — do a quick income check",
      tone: "bg-sky-50/70 border-sky-200",
      summary:
        "You’re in the main audience group (sole trader / landlord). Next step: confirm whether your income is over the relevant thresholds.",
      bullets: [
        "Download the calendar and start basic digital record-keeping.",
        "If you’re unsure, check your last Self Assessment figures or ask your accountant.",
        "Re-run this checker once you know your income band.",
      ],
    };
  }, [role, incomeBand]);

  const roleText =
    role === "sole_trader"
      ? "Sole trader"
      : role === "landlord"
      ? "Landlord"
      : role === "both"
      ? "Both"
      : "Neither";

  return (
    <SiteShell cta="Back to home">
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">MTD for Income Tax checker</h1>
        <p className="mt-2 text-slate-700">Quick, plain-English guidance. Not tax advice. No HMRC connection.</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border bg-white/70 p-6">
            <h2 className="text-lg font-semibold">Your situation</h2>

            <div className="mt-5 space-y-6">
              <Field label="Which best describes you?">
                <Select value={role} onChange={(v) => setRole(v as Role)}>
                  <option value="sole_trader">Self-employed / sole trader</option>
                  <option value="landlord">Landlord (UK property income)</option>
                  <option value="both">Both</option>
                  <option value="neither">Neither</option>
                </Select>
              </Field>

              <Field label="Do you currently file a Self Assessment tax return?">
                <RadioRow
                  value={sa}
                  onChange={setSa}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "not_sure", label: "Not sure" },
                  ]}
                />
              </Field>

              <Field label="Is your combined self-employment and/or property income over the relevant threshold?">
                <RadioRow
                  value={incomeBand}
                  onChange={setIncomeBand}
                  options={[
                    { value: "over", label: "Over" },
                    { value: "under", label: "Under" },
                    { value: "not_sure", label: "Not sure" },
                  ]}
                />
                <p className="mt-2 text-xs text-slate-600">
                  Tip: If you’re unsure, check your latest Self Assessment or ask your accountant/agent.
                </p>
              </Field>
            </div>
          </div>

          <div className={`rounded-3xl border p-6 ${result.tone}`}>
            <h2 className="text-lg font-semibold">Result</h2>

            <div className="mt-4 rounded-2xl bg-white/70 p-4">
              <p className="text-sm text-slate-700">
                Based on: <span className="font-semibold">{roleText}</span> • Self Assessment:{" "}
                <span className="font-semibold">{sa.replace("_", " ")}</span> • Income:{" "}
                <span className="font-semibold">{incomeBand}</span>
              </p>

              <p className="mt-3 text-xl font-bold">{result.label}</p>
              <p className="mt-2 text-slate-700">{result.summary}</p>

              <ul className="mt-4 space-y-2 text-slate-700">
                {result.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href="/api/ics"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Download className="h-4 w-4" /> Download calendar (.ics)
              </a>
              <Link
                href="/checklist"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border bg-white/70 px-4 py-3 text-sm font-semibold hover:bg-white"
              >
                <Calendar className="h-4 w-4" /> Preparation checklist
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-600">
              Not tax advice. For definitive rules, check HMRC guidance or speak to a qualified professional.
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border bg-white/80 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
    >
      {children}
    </select>
  );
}

function RadioRow({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: any) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold ${
            value === o.value ? "bg-slate-900 text-white border-slate-900" : "bg-white/70 hover:bg-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}