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
        className="text-sm font-medium text-slate-500 hover:text-[#0067eb]"
      >
        Sign out
      </button>
    </form>
  );
}
