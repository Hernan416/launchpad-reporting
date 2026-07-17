import { SignOutButton } from "@/components/SignOutButton";

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
    <div className="min-h-screen bg-[#f0f4f8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 via-indigo-500 to-emerald-500" />
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold text-blue-700">{title}</h1>
          <SignOutButton />
        </div>
        {topNav && <div className="mx-auto max-w-6xl">{topNav}</div>}
      </header>
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">{children}</main>
    </div>
  );
}
