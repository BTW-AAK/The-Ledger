import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-ink min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 min-w-0">{children}</main>
    </div>
  );
}
