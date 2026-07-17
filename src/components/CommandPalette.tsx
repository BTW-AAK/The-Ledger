"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import TransactionModal from "./TransactionModal";

type Account = { id: string; name: string; currency: string };
type Category = { id: string; name: string; icon: string; color: string };
type RecurringTemplate = {
  id: string;
  name: string;
  merchant: string | null;
  amount: number;
  accountId: string;
  categoryId: string | null;
};
type QuickAddContext = {
  accounts: Account[];
  categories: Category[];
  templates: RecurringTemplate[];
  merchantMemory: { merchant: string; categoryId: string }[];
  homeCurrency: string;
};

type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  run: () => void;
};

export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [context, setContext] = useState<QuickAddContext | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function openQuickAdd() {
    if (!context) {
      try {
        const res = await fetch("/api/quick-add-context");
        if (res.ok) setContext(await res.json());
      } catch {
        // If this fails the modal will just show empty selects - not fatal.
      }
    }
    onOpenChange(false);
    setQuickAddOpen(true);
  }

  // Global shortcuts: Cmd/Ctrl+K opens the palette from anywhere; 'n' opens quick-add
  // unless the person is typing in a field or the palette is already open.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT";

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      } else if (e.key.toLowerCase() === "n" && !isTyping && !open && !quickAddOpen) {
        e.preventDefault();
        openQuickAdd();
      } else if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quickAddOpen, context]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const commands: Command[] = useMemo(
    () => [
      {
        id: "add-transaction",
        label: "Add transaction",
        hint: "N",
        icon: "ti-plus",
        run: () => openQuickAdd(),
      },
      ...NAV_ITEMS.map((item) => ({
        id: item.href,
        label: `Go to ${item.label}`,
        icon: item.icon,
        run: () => {
          router.push(item.href);
          onOpenChange(false);
        },
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [context]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[12vh] z-50 p-4"
          onClick={() => onOpenChange(false)}
        >
          <div
            className="w-full max-w-[440px] bg-panel rounded-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                filtered[selectedIndex]?.run();
              }
            }}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-lineSoft">
              <i className="ti ti-search text-[15px] text-sage" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search or jump to…"
                className="flex-1 bg-transparent text-sm text-paper outline-none"
              />
              <span className="text-[10px] text-sage border border-line rounded px-1.5 py-0.5">
                esc
              </span>
            </div>
            <div className="max-h-[320px] overflow-y-auto py-1.5">
              {filtered.map((c, i) => (
                <button
                  key={c.id}
                  onClick={c.run}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left ${
                    i === selectedIndex ? "bg-lineSoft text-paper" : "text-sage"
                  }`}
                >
                  <i className={`ti ${c.icon} text-[14px]`} aria-hidden="true" />
                  {c.label}
                  {c.hint && (
                    <span className="ml-auto text-[10px] border border-line rounded px-1.5 py-0.5">
                      {c.hint}
                    </span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-sm text-sage text-center py-6">No matches.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {context && (
        <TransactionModal
          open={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          onSaved={() => router.refresh()}
          accounts={context.accounts}
          categories={context.categories}
          templates={context.templates}
          merchantMemory={context.merchantMemory}
          homeCurrency={context.homeCurrency}
        />
      )}
    </>
  );
}
