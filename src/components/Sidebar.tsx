"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "ti-layout-dashboard" },
  { href: "/transactions", label: "Transactions", icon: "ti-list" },
  { href: "/budgets", label: "Budgets", icon: "ti-chart-pie" },
  { href: "/accounts", label: "Accounts", icon: "ti-building-bank" },
  { href: "/goals", label: "Goals", icon: "ti-target" },
  { href: "/investments", label: "Investments", icon: "ti-chart-candle" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[180px] shrink-0 bg-panelDeep border-r border-lineSoft flex flex-col gap-1 p-4 min-h-screen">
      <div className="font-display text-lg text-paper mb-6 px-2">Ledger</div>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              active ? "bg-lineSoft text-paper" : "text-sage hover:text-paper"
            }`}
          >
            <i className={`ti ${item.icon} text-[16px] ${active ? "text-gold" : ""}`} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-auto flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sage hover:text-paper transition-colors"
      >
        <i className="ti ti-logout text-[16px]" aria-hidden="true" />
        Sign out
      </button>
    </div>
  );
}
