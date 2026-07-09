"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV_ITEMS } from "@/lib/nav";

export default function MobileBottomNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();

  return (
    <div className="md:hidden no-print fixed bottom-0 left-0 right-0 bg-panelDeep border-t border-lineSoft flex items-center z-40">
      {MOBILE_NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
          >
            <i
              className={`ti ${item.icon} text-[19px] ${active ? "text-gold" : "text-sage"}`}
              aria-hidden="true"
            />
            <span className={`text-[10px] ${active ? "text-paper" : "text-sage"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
      <button onClick={onMore} className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5">
        <i className="ti ti-dots text-[19px] text-sage" aria-hidden="true" />
        <span className="text-[10px] text-sage">More</span>
      </button>
    </div>
  );
}
