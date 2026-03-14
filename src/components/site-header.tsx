"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function SiteHeader() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });
  }, []);

  return (
    <header className="border-b border-[#B8D0EB] bg-transparent">
      <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
        <div className="flex items-end justify-between py-4">
          <Link href="/" className="flex flex-col items-center transition hover:opacity-90">
            <div className="flex h-20 w-20 items-center justify-center">
              <img src="/brand/995.png" alt="Flonancial" className="h-full w-full object-contain" />
            </div>
            <p className="mt-0 text-lg font-bold tracking-tight text-[#0F1C2E]">Flonancial</p>
          </Link>
          {loggedIn ? (
            <Link href="/account" className="text-lg font-bold tracking-tight text-[#0F1C2E] transition hover:opacity-75">
              Account
            </Link>
          ) : (
            <Link href="/login" className="text-lg font-bold tracking-tight text-[#0F1C2E] transition hover:opacity-75">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}