"use client";

import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/money";

type CategorySpend = { name: string; color: string; amountCents: number };
type BudgetLine = { id: string; name: string; color: string; budgetCents: number; spentCents: number };
type TopTxn = { id: string; merchant: string; amount: number; date: string; categoryName: string };

function shiftMonth(month: string, delta: number): string {
  const [year, mo] = month.split("-").map(Number);
  const d = new Date(year, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportClient({
  month,
  homeCurrency,
  spendingByCategory,
  incomeCents,
  expensesCents,
  budgetProgress,
  netWorthCents,
  topTransactions,
}: {
  month: string;
  homeCurrency: string;
  spendingByCategory: CategorySpend[];
  incomeCents: number;
  expensesCents: number;
  budgetProgress: BudgetLine[];
  netWorthCents: number;
  topTransactions: TopTxn[];
}) {
  const router = useRouter();
  const monthLabel = new Date(`${month}-01`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const net = incomeCents - expensesCents;

  return (
    <div className="max-w-[760px]">
      <div className="no-print flex items-center justify-between mb-5">
        <div className="font-display text-xl text-paper">Reports</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/reports?month=${shiftMonth(month, -1)}`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-line text-sage"
            aria-label="Previous month"
          >
            <i className="ti ti-chevron-left text-[15px]" aria-hidden="true" />
          </button>
          <button
            onClick={() => router.push(`/reports?month=${shiftMonth(month, 1)}`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-line text-sage"
            aria-label="Next month"
          >
            <i className="ti ti-chevron-right text-[15px]" aria-hidden="true" />
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg ml-2"
          >
            <i className="ti ti-file-download text-[15px]" aria-hidden="true" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Printable report - deliberately light-themed regardless of app theme, since this is meant to be saved/printed as a document. */}
      <div className="bg-[#F7F5EF] rounded-card p-8 text-[#1A1A18]">
        <div className="flex items-center justify-between mb-1">
          <div className="font-display text-2xl">Ledger</div>
          <div className="text-sm text-[#6B6B63]">Monthly report</div>
        </div>
        <div className="text-sm text-[#6B6B63] mb-6">{monthLabel} · amounts in {homeCurrency}</div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div>
            <div className="text-xs text-[#6B6B63] mb-1">Income</div>
            <div className="font-mono text-lg">{formatCents(incomeCents, homeCurrency)}</div>
          </div>
          <div>
            <div className="text-xs text-[#6B6B63] mb-1">Expenses</div>
            <div className="font-mono text-lg">{formatCents(expensesCents, homeCurrency)}</div>
          </div>
          <div>
            <div className="text-xs text-[#6B6B63] mb-1">Net</div>
            <div className={`font-mono text-lg ${net >= 0 ? "text-[#7A5A1E]" : "text-[#9C3E24]"}`}>
              {net >= 0 ? "+" : ""}
              {formatCents(net, homeCurrency)}
            </div>
          </div>
        </div>

        <div className="text-sm font-medium mb-2.5 border-b border-[#D8D4C6] pb-1.5">
          Spending by category
        </div>
        {spendingByCategory.length === 0 ? (
          <div className="text-sm text-[#6B6B63] mb-8">No spending logged this month.</div>
        ) : (
          <div className="mb-8">
            {spendingByCategory.map((c) => (
              <div key={c.name} className="flex items-center gap-2 py-1.5 text-sm">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="flex-1">{c.name}</span>
                <span className="font-mono">{formatCents(c.amountCents, homeCurrency)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-sm font-medium mb-2.5 border-b border-[#D8D4C6] pb-1.5">
          Budget performance
        </div>
        {budgetProgress.length === 0 ? (
          <div className="text-sm text-[#6B6B63] mb-8">No budgets set this month.</div>
        ) : (
          <div className="mb-8">
            {budgetProgress.map((b) => {
              const over = b.spentCents > b.budgetCents;
              return (
                <div key={b.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <span className="flex-1">{b.name}</span>
                  <span className={`font-mono ${over ? "text-[#9C3E24]" : ""}`}>
                    {formatCents(b.spentCents, homeCurrency)} / {formatCents(b.budgetCents, homeCurrency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-sm font-medium mb-2.5 border-b border-[#D8D4C6] pb-1.5">
          Largest transactions
        </div>
        <div className="mb-8">
          {topTransactions.map((t) => (
            <div key={t.id} className="flex items-center gap-2 py-1.5 text-sm">
              <span className="flex-1 truncate">{t.merchant}</span>
              <span className="text-[#6B6B63] text-xs">{t.categoryName}</span>
              <span className="font-mono w-[90px] text-right">{formatCents(t.amount, homeCurrency)}</span>
            </div>
          ))}
          {topTransactions.length === 0 && (
            <div className="text-sm text-[#6B6B63]">No transactions this month.</div>
          )}
        </div>

        <div className="border-t border-[#D8D4C6] pt-4 flex justify-between text-sm">
          <span className="text-[#6B6B63]">Net worth as of today</span>
          <span className="font-mono">{formatCents(netWorthCents, homeCurrency)}</span>
        </div>
      </div>
    </div>
  );
}
