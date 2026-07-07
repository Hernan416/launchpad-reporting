import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getAppUsers } from "@/lib/users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = getAppUsers().find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.email,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
          clientSlug: user.clientSlug,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.clientSlug = user.clientSlug;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role;
      session.user.clientSlug = token.clientSlug;
      return session;
    },
  },
});
