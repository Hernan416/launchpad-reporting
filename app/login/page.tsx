import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  // Default to "/" rather than "/dashboard" so role-based routing goes
  // through app/page.tsx's redirect() (a real client-side navigation),
  // instead of relying on proxy.ts's redirect during the post-login RSC
  // transition, which doesn't update the browser's address bar.
  const destination = callbackUrl || "/";

  async function authenticate(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        username: formData.get("username"),
        password: formData.get("password"),
        redirectTo: destination,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(
          `/login?error=1&callbackUrl=${encodeURIComponent(destination)}`
        );
      }
      throw err;
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f4f6fa] px-4 dark:bg-[#16181d]">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#1e2128]">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white/90">
          Launchpad AI Reporting
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-white/55">
          Sign in to view your reports.
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            Invalid username or password.
          </p>
        )}

        <form action={authenticate} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-700 dark:text-white/70"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#0067eb] focus:outline-none focus:ring-1 focus:ring-[#0067eb] dark:border-white/15 dark:bg-[#16181d] dark:text-white/90"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-white/70"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#0067eb] focus:outline-none focus:ring-1 focus:ring-[#0067eb] dark:border-white/15 dark:bg-[#16181d] dark:text-white/90"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-[#0067eb] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0052ba]"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
