"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import CommandPalette from "./CommandPalette";
import OnboardingTutorial from "./OnboardingTutorial";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceShowTutorial = searchParams.get("tutorial") === "1";

  function closeTutorial() {
    if (forceShowTutorial) {
      router.replace("/");
    }
  }

  return (
    <div className="flex bg-ink min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 min-w-0 max-w-full overflow-x-hidden">
        {children}
      </main>
      <MobileBottomNav onMore={() => setPaletteOpen(true)} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <OnboardingTutorial forceShow={forceShowTutorial} onClose={closeTutorial} />
    </div>
  );
}
