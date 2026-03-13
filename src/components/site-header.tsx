import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
};

export function SiteHeader({
  navItems,
}: {
  navItems: NavItem[];
}) {
  const navLinkClass =
    "text-base font-semibold tracking-[-0.03em] text-white transition hover:opacity-85";

  return (
    <header className="border-b border-white/10 bg-transparent">
      <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link
            href="/"
            className="flex flex-col items-center justify-center transition hover:opacity-90"
          >
            <div className="flex h-12 w-12 items-center justify-center sm:h-14 sm:w-14">
              <img
                src="/brand/990.png"
                alt="Flonancial"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="mt-px min-w-0 text-center">
              <p className="text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">
                Flonancial
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}