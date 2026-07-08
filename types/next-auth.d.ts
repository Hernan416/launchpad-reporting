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

// The `token` param in callbacks is typed against @auth/core's own JWT
// (imported internally via a relative "./jwt.js" path), not the
// "next-auth/jwt" re-export — augmenting the latter alone doesn't merge
// into the type actually used by NextAuth's callback signatures.
declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    clientSlug?: string;
  }
}
