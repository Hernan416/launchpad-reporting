import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts`.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { role, clientSlug } = session.user;
  const requestedSlug = pathname.split("/")[2];

  // A "client" role may only view their own slug; redirect them there otherwise.
  if (role === "client" && requestedSlug !== clientSlug) {
    return NextResponse.redirect(
      new URL(`/dashboard/${clientSlug}`, req.url)
    );
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
