import type { DefaultSession } from "next-auth";
import type { Role } from "@/types";

declare module "next-auth" {
  interface User {
    role: Role;
    clientSlug?: string;
  }

  interface Session {
    user: {
      role: Role;
      clientSlug?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    clientSlug?: string;
  }
}
