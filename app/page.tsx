import { redirect } from "next/navigation";
import { auth, getAllowedClientSlugs } from "@/lib/auth";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "master") {
    redirect("/dashboard");
  }

  redirect(`/dashboard/${getAllowedClientSlugs(session.user)[0]}`);
}
