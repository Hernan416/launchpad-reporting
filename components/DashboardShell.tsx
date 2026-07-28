import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export function DashboardShell({
  title,
  topNav,
  children,
}: {
  title: string;
  topNav?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f6fa] dark:bg-[#16181d]">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#1e2128]">
        <div className="h-1.5 bg-gradient-to-r from-[#0067eb] to-[#ffcf00]" />
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold text-[#0067eb] dark:text-[#4d9fff]">{title}</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
        {topNav && <div className="mx-auto max-w-6xl">{topNav}</div>}
      </header>
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">{children}</main>
    </div>
  );
}
