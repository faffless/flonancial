import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
};

export function SiteHeader({ navItems }: { navItems: NavItem[] }) {
  return (
    <header className="border-b border-white/10 bg-transparent">
      <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
        <div className="flex items-end justify-between gap-4 py-4">
          <Link
            href="/"
            className="flex flex-col items-center transition hover:opacity-90"
          >
            <div className="flex h-12 w-12 items-center justify-center">
              <img
                src="/brand/990.png"
                alt="Flonancial"
                className="h-full w-full object-contain"
              />
            </div>
            <p className="mt-1 text-base font-semibold tracking-[-0.03em] text-white">
              Flonancial
            </p>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-base font-semibold tracking-[-0.03em] text-white transition hover:opacity-85"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}