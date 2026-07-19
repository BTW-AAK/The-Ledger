"use client";

import { Suspense, useState } from "react";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import CommandPalette from "./CommandPalette";
import TutorialGate from "./TutorialGate";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="flex bg-ink min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 min-w-0 max-w-full overflow-x-hidden">
        {children}
      </main>
      <MobileBottomNav onMore={() => setPaletteOpen(true)} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <Suspense fallback={null}>
        <TutorialGate />
      </Suspense>
    </div>
  );
}
