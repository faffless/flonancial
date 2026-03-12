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
  "mt-3 text-base font-semibold tracking-[-0.03em] text-white transition hover:opacity-85";

  return (
    <header className="border-b border-white/10 bg-transparent">
      <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 transition hover:opacity-90"
          >
            <div className="flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
              <img
                src="/brand/555.png"
                alt="Flonancial"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0 mt-3">
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