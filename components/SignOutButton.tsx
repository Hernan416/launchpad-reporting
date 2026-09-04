import { signOut } from "@/lib/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="rounded-sm text-sm font-medium text-slate-500 transition-[color,transform] duration-150 ease-snappy hover:text-[#0067eb] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50 dark:text-white/55 dark:hover:text-[#ffcf00]"
      >
        Sign out
      </button>
    </form>
  );
}
