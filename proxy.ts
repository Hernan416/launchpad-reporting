import { NextResponse } from "next/server";
import { auth, getAllowedClientSlugs } from "@/lib/auth";

// Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts`.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { role } = session.user;
  const requestedSlug = pathname.split("/")[2];
  const allowedSlugs = getAllowedClientSlugs(session.user);

  // A "client" role may only view their own slug(s); redirect them to the
  // first one otherwise.
  if (role === "client" && !allowedSlugs.includes(requestedSlug)) {
    return NextResponse.redirect(
      new URL(`/dashboard/${allowedSlugs[0]}`, req.url)
    );
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
