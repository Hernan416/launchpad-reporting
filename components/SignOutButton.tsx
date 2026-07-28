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
        className="text-sm font-medium text-slate-500 hover:text-[#0067eb] dark:text-white/55 dark:hover:text-[#ffcf00]"
      >
        Sign out
      </button>
    </form>
  );
}
