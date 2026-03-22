import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export default function NotFound() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[640px] px-6 py-20 sm:px-8 text-center">
        <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">Page not found</h1>
        <p className="mt-3 text-sm text-[#2E4A63]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
            className="rounded-xl bg-[#2E88D0] px-5 py-2.5 text-sm text-white transition hover:opacity-90"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-5 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
