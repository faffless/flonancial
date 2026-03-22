import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/account",
  "/add-business",
  "/add-update",
  "/edit-business",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Handle Supabase auth code exchange (email confirmation, password reset, etc.)
  const { searchParams, pathname } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    const url = request.nextUrl.clone();
    url.searchParams.delete("code");
    if (pathname === "/") {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  if (tokenHash && type) {
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email" | "recovery" | "invite",
    });
    const url = request.nextUrl.clone();
    url.searchParams.delete("token_hash");
    url.searchParams.delete("type");
    if (pathname === "/") {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|wave|swap).*)"],
};
