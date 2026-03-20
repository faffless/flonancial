"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { demoBusinesses } from "@/data/demo-businesses";

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const faqs = [
  { q: "What is Making Tax Digital for Income Tax?", a: "From 6 April 2026, sole traders and landlords earning over £50,000 must keep digital records and submit quarterly updates to HMRC using compatible software. This replaces the single annual Self Assessment tax return with four quarterly submissions plus a year-end Final Declaration." },
  { q: "Do I have to stop using my spreadsheet?", a: "No. That's the whole point of bridging software. You keep your records in your spreadsheet exactly as you do now. Flonancial reads your file, extracts the figures, and submits them to HMRC. Your workflow doesn't change." },
  { q: "What about the Final Declaration?", a: "Flonancial handles your four quarterly updates. For the year-end Final Declaration (due 31 January), you can use HMRC's own online service or another compatible product. We plan to add Final Declaration support in a future update." },
  { q: "Is Flonancial free?", a: "Flonancial is free during the beta period. We plan to introduce pricing after the beta — well below what the big accounting platforms charge. You'll get plenty of notice before any charges apply." },
  { q: "Is my data safe?", a: "Your data is stored on encrypted UK-based servers. We use HMRC's official OAuth process to connect to your tax account — we never see or store your HMRC password. HMRC access tokens are stored in secure, encrypted cookies and are never exposed to the browser." },
  { q: "Do I need an accountant?", a: "Flonancial is a software tool, not tax advice. If your affairs are straightforward — simple sole trade or rental income — you can handle your quarterly updates yourself. If you're unsure about anything, we'd always recommend speaking to a qualified accountant." },
  { q: "What if the £50,000 threshold drops?", a: "HMRC has confirmed the threshold will drop to £30,000 from April 2027 and to £20,000 from April 2028. Flonancial will support all thresholds as they come into effect." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#B8D0EB]">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-[#0F1C2E] transition hover:text-[#2E88D0]">
        <span>{q}</span>
        <span className="ml-4 shrink-0 text-[#3B5A78]">{open ? "−" : "+"}</span>
      </button>
      {open ? <p className="pb-4 text-sm leading-6 text-[#3B5A78]">{a}</p> : null}
    </div>
  );
}

function formatBusinessType(value: string) {
  if (value === "sole_trader") return "Sole trader";
  if (value === "uk_property") return "UK property";
  if (value === "overseas_property") return "Overseas property";
  return value;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag a demo business card into the drop zone
  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("demo_business_id", id);
    setDraggingId(id);
  }

  function handleDragEnd() {
    setDraggingId(null);
  }

  function handleDropZoneDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDropActive(true);
  }

  function handleDropZoneDragLeave() {
    setDropActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropActive(false);
    setDraggingId(null);

    // Check if it's a demo business card
    const demoId = e.dataTransfer.getData("demo_business_id");
    if (demoId) {
      router.push(`/demo?business=${demoId}`);
      return;
    }

    // Otherwise treat as file upload (future AI path)
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadError("AI-powered spreadsheet import coming soon. Try one of the example businesses on the left!");
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadError("AI-powered spreadsheet import coming soon. Try one of the example businesses on the left!");
    }
  }

  return (
    <main className="min-h-screen text-[#0F1C2E]">
      <SiteHeader />
      <section className="mx-auto w-full max-w-[1000px] px-6 py-6 sm:px-8 lg:px-10">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-[28px] border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-10">
          <img src="/wave.png" alt="" className="pointer-events-none absolute bottom-[-60px] left-1/2 z-0 w-[980px] max-w-none -translate-x-1/2 opacity-[0.05]" />
          <div className="relative z-10 mx-auto max-w-[680px] text-center">
            <h1 className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#0F1C2E] sm:text-[2.6rem] lg:text-[3.2rem]">
              Submit MTD<br />Quarterly Updates.<br />Keep Your Spreadsheet.
            </h1>
            <p className="mx-auto mt-4 max-w-[600px] text-base leading-7 text-[#3B5A78]">
              Flonancial is bridging software for Making Tax Digital. Upload your spreadsheet, review your figures, and submit directly to HMRC. Built for sole traders and landlords.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/login" className="rounded-2xl bg-[#2E88D0] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">Get started free</Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#3B5A78]">Free during beta · No credit card required</p>
          </div>
        </div>

        {/* Try it out */}
        <div className="mt-5">
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0F1C2E]">Try it out</h2>
            <p className="mt-2 text-sm text-[#3B5A78]">Pick an example business and drag it into the box — no sign up needed</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">

            {/* Left — example businesses */}
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#3B5A78]">Choose an example business</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {demoBusinesses.map((b) => (
                  <div
                    key={b.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, b.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => router.push(`/demo?business=${b.id}`)}
                    className={`cursor-grab rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-4 transition select-none active:cursor-grabbing hover:border-[#2E88D0] hover:bg-white ${draggingId === b.id ? "opacity-50 scale-95" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[#0F1C2E]">{b.emoji} {b.name}</p>
                        <p className="mt-0.5 text-xs text-[#3B5A78]">{b.tagline}</p>
                        <span className="mt-2 inline-block rounded-full border border-[#B8D0EB] bg-[#DEE9F8] px-2 py-0.5 text-[10px] text-[#3B5A78]">
                          {formatBusinessType(b.business_type)}
                        </span>
                      </div>
                      <span className="mt-0.5 shrink-0 text-lg text-[#B8D0EB]">⠿</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#3B5A78]">Tap a card or drag it into the box →</p>
            </div>

            {/* Right — drop zone */}
            <div className="flex flex-col">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#3B5A78]">Drop zone</p>
              <div
                onDrop={handleDrop}
                onDragOver={handleDropZoneDragOver}
                onDragLeave={handleDropZoneDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-1 min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-12 text-center transition ${
                  dropActive
                    ? "border-[#2E88D0] bg-[#2E88D0]/10 scale-[1.01]"
                    : "border-[#B8D0EB] bg-[#DEE9F8] hover:border-[#2E88D0] hover:bg-[#CCE0F5]"
                }`}
              >
                <label htmlFor="file-upload" className="sr-only">Upload spreadsheet</label>
<input id="file-upload" ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
                {dropActive ? (
                  <>
                    <div className="mb-3 text-5xl">📂</div>
                    <p className="text-sm font-medium text-[#2E88D0]">Drop it!</p>
                  </>
                ) : (
                  <>
                    <div className="mb-3 text-5xl">👈</div>
                    <p className="text-sm font-medium text-[#0F1C2E]">Drag an example business here</p>
                    <p className="mt-2 text-xs text-[#3B5A78]">or tap any card on the left</p>
                    <div className="mt-6 border-t border-[#B8D0EB] pt-6 w-full">
                      <p className="text-xs text-[#3B5A78]">Have your own spreadsheet?</p>
                      <p className="mt-1 text-xs text-[#3B5A78]">AI-powered import coming soon</p>
                    </div>
                  </>
                )}
              </div>

              {uploadError ? (
                <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                  <p className="text-xs text-amber-700">{uploadError}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Upload your files", text: "Keep your records in Excel, CSV, or Google Sheets — however you already work. Upload your file and Flonancial reads your figures automatically. No retyping. No reformatting." },
            { title: "Review your figures", text: "See your income and expenses broken down by quarter. Check everything looks right before you submit. You're always in control of what goes to HMRC." },
            { title: "Submit to HMRC", text: "One click sends your quarterly update directly to HMRC through their official API. You get instant confirmation. Done in minutes, not hours." },
          ].map(({ title, text }) => (
            <div key={title} className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 text-center">
              <p className="text-sm font-medium text-[#0F1C2E]">{title}</p>
              <p className="mt-2 text-sm leading-6 text-[#3B5A78]">{text}</p>
            </div>
          ))}
        </div>

        {/* Built for people */}
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-8">
          <img src="/wave.png" alt="" className="pointer-events-none absolute bottom-[-60px] left-1/2 z-0 w-[980px] max-w-none -translate-x-1/2 opacity-[0.05]" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-[#0F1C2E]">Built for people who already keep good records</h2>
            <ul className="mt-4 space-y-2">
              {[
                "Compliant HMRC bridging software — your spreadsheet is the digital link",
                "Supports sole trader and UK property income",
                "Cumulative quarterly updates, exactly as HMRC requires",
                "Your data stays in the UK on secure, encrypted servers",
                "We never see your HMRC password — we use HMRC's official OAuth process",
                "Operated by Flonancial Ltd (Company No. 17090724)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[#3B5A78]">
                  <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Is Flonancial right for you */}
        <div className="mt-5">
          <h2 className="text-lg font-semibold text-[#0F1C2E]">Is Flonancial right for you?</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { icon: "🔧", title: "Self-employed", text: "Sole traders earning over £50,000 who need to comply with MTD from April 2026" },
              { icon: "🏠", title: "Landlords", text: "UK property landlords with rental income over £50,000 who need quarterly reporting" },
              { icon: "📊", title: "Spreadsheet users", text: "Anyone who already tracks income and expenses in Excel or Google Sheets and wants to keep it that way" },
            ].map(({ icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5">
                <p className="text-2xl">{icon}</p>
                <p className="mt-2 text-sm font-medium text-[#0F1C2E]">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[#3B5A78]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-8">
          <img src="/wave.png" alt="" className="pointer-events-none absolute bottom-[-60px] left-1/2 z-0 w-[980px] max-w-none -translate-x-1/2 opacity-[0.05]" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-[#0F1C2E]">Frequently asked questions</h2>
            <div className="mt-4">
              {faqs.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-5 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-10 text-center">
          <h2 className="text-xl font-semibold text-[#0F1C2E]">MTD starts in 20 days. Get ready now.</h2>
          <p className="mt-2 text-sm leading-6 text-[#3B5A78]">Join the beta and be among the first to submit your quarterly updates through Flonancial.</p>
          <div className="mt-6">
            <Link href="/login" className="rounded-2xl bg-[#2E88D0] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">Join the beta — it's free</Link>
          </div>
        </div>

      </section>

      <footer className="mt-10 border-t border-[#B8D0EB]">
        <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 py-8 text-sm text-[#3B5A78] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Flonancial Ltd</p>
            <div className="flex flex-wrap gap-6">
              <Link href="/about" className="hover:text-[#0F1C2E]">About</Link>
              <Link href="/privacy" className="hover:text-[#0F1C2E]">Privacy</Link>
              <Link href="/terms" className="hover:text-[#0F1C2E]">Terms</Link>
              <Link href="/disclaimer" className="hover:text-[#0F1C2E]">Disclaimer</Link>
              <a href="mailto:hello@flonancial.co.uk" className="hover:text-[#0F1C2E]">hello@flonancial.co.uk</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}