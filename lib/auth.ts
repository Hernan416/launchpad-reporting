import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getAppUsers } from "@/lib/users";

/** clientSlugs (multi-client) takes precedence over the legacy single clientSlug — see AppUser.clientSlugs. */
export function getAllowedClientSlugs(user: {
  clientSlug?: string;
  clientSlugs?: string[];
}): string[] {
  if (user.clientSlugs?.length) return user.clientSlugs;
  return user.clientSlug ? [user.clientSlug] : [];
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const user = getAppUsers().find(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        );
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.username,
          name: user.name ?? user.username,
          role: user.role,
          clientSlug: user.clientSlug,
          clientSlugs: user.clientSlugs,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.clientSlug = user.clientSlug;
        token.clientSlugs = user.clientSlugs;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role;
      session.user.clientSlug = token.clientSlug;
      session.user.clientSlugs = token.clientSlugs;
      return session;
    },
  },
});
