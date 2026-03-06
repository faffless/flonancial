// src/app/checklist/page.tsx
import { SiteShell } from "@/components/site-shell";

export default function ChecklistPage() {
  return (
    <SiteShell cta="Open the checker">
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">MTD preparation checklist</h1>
        <p className="mt-2 text-slate-700">A practical “start now” list that doesn’t require HMRC integration.</p>

        <div className="mt-8 space-y-6">
          <Card title="1) Get your categories straight">
            <ul className="list-disc space-y-2 pl-5 text-slate-700">
              <li>Separate business vs personal where possible.</li>
              <li>Use consistent categories (income / expenses / property types).</li>
              <li>Keep basic evidence: invoices, receipts, statements.</li>
            </ul>
          </Card>

          <Card title="2) Start digital record-keeping (simple is fine)">
            <ul className="list-disc space-y-2 pl-5 text-slate-700">
              <li>A spreadsheet is okay for v1 preparation.</li>
              <li>Capture: date, amount, category, description, supplier/customer.</li>
              <li>Monthly tidy-up beats quarterly panic.</li>
            </ul>
          </Card>

          <Card title="3) Put your deadlines somewhere you’ll see them">
            <p className="text-slate-700">Download the calendar file and import it into your calendar app.</p>
            <div className="mt-3">
              <a
                href="/api/ics"
                className="inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Download deadlines calendar (.ics)
              </a>
            </div>
          </Card>

          <Card title="4) If you use an accountant/agent">
            <ul className="list-disc space-y-2 pl-5 text-slate-700">
              <li>Ask what format they want your records in.</li>
              <li>Agree who will handle quarterly updates (you vs agent).</li>
              <li>Decide the software path later — get clean data now.</li>
            </ul>
          </Card>

          <div className="rounded-2xl border bg-white/70 p-4 text-sm text-slate-700">
            Not tax advice. Always confirm official deadlines and eligibility rules with HMRC guidance or a professional.
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border bg-white/70 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}