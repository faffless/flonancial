import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-transparent">
      <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
        <div className="flex items-end justify-between py-4">
          <Link
            href="/"
            className="flex flex-col items-center transition hover:opacity-90"
          >
            <div className="flex h-20 w-20 items-center justify-center">
              <img
                src="/brand/990.png"
                alt="Flonancial"
                className="h-full w-full object-contain"
              />
            </div>
            <p className="mt-0 text-lg font-bold tracking-tight text-white">
              Flonancial
            </p>
          </Link>
          <Link
            href="/login"
            className="text-lg font-bold tracking-tight text-white transition hover:opacity-75"
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}