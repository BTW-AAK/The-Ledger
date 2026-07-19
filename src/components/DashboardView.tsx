"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import TransactionModal from "./TransactionModal";
import MetricCard from "./MetricCard";
import LedgerRule from "./LedgerRule";
import NetWorthChart from "./NetWorthChart";
import SpendingDonut from "./SpendingDonut";
import BudgetBar from "./BudgetBar";
import { formatCents, formatSignedCents } from "@/lib/money";

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

export default function DashboardView({
  homeCurrency,
  netWorthCents,
  netWorthDeltaCents,
  netWorthSeries,
  incomeCents,
  expensesCents,
  savingsRatePct,
  spendingByCategory,
  budgetProgress,
  recentTransactions,
  accounts,
  categories,
  templates,
  merchantMemory,
}: {
  homeCurrency: string;
  netWorthCents: number;
  netWorthDeltaCents: number;
  netWorthSeries: { date: string; netWorthCents: number }[];
  incomeCents: number;
  expensesCents: number;
  savingsRatePct: number;
  spendingByCategory: { name: string; color: string; amountCents: number }[];
  budgetProgress: { id: string; name: string; color: string; budgetCents: number; spentCents: number }[];
  recentTransactions: {
    id: string;
    merchant: string;
    amount: number;
    date: string;
    currency: string;
    category: { name: string; icon: string; color: string } | null;
  }[];
  accounts: Account[];
  categories: Category[];
  templates: RecurringTemplate[];
  merchantMemory: { merchant: string; categoryId: string }[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const hasMultipleCurrencies = accounts.some((a) => a.currency !== homeCurrency);

  return (
    <div className="flex flex-col gap-5 max-w-[900px]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs text-sage">
          Net worth ·{" "}
          {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          {hasMultipleCurrencies ? ` · shown in ${homeCurrency}` : ""}
        </div>
        <button
          data-tour="add-transaction"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg shrink-0"
        >
          <i className="ti ti-plus text-[15px]" aria-hidden="true" />
          Add transaction
        </button>
      </div>

      <div>
        <div className="font-display text-[40px] text-paper leading-none">
          {formatCents(netWorthCents, homeCurrency)}
        </div>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className={`font-mono text-sm ${netWorthDeltaCents >= 0 ? "text-gold" : "text-rust"}`}>
            {formatSignedCents(netWorthDeltaCents, homeCurrency)}
          </span>
          <span className="text-sm text-sage">since last month</span>
        </div>
        <div className="mt-2.5">
          <LedgerRule />
        </div>
      </div>

      <NetWorthChart data={netWorthSeries} currency={homeCurrency} />

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <MetricCard label="Income" value={formatCents(incomeCents, homeCurrency)} />
        <MetricCard label="Expenses" value={formatCents(expensesCents, homeCurrency)} />
        <MetricCard label="Savings rate" value={`${savingsRatePct}%`} valueClassName="text-gold" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="bg-panel rounded-[10px] p-4">
          <div className="text-sm text-paper mb-2.5">Spending by category</div>
          <SpendingDonut data={spendingByCategory.map((c) => ({ ...c }))} currency={homeCurrency} />
        </div>
        <div className="bg-panel rounded-[10px] p-4">
          <div className="text-sm text-paper mb-2.5">Budgets</div>
          {budgetProgress.length === 0 ? (
            <div className="text-sm text-sage py-6 text-center">
              No budgets set for this month yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {budgetProgress.map((b) => (
                <BudgetBar
                  key={b.id}
                  name={b.name}
                  spentCents={b.spentCents}
                  budgetCents={b.budgetCents}
                  color={b.color}
                  currency={homeCurrency}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-panel rounded-[10px] p-4">
        <div className="text-sm text-paper mb-2">Recent transactions</div>
        <div className="flex flex-col">
          {recentTransactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2.5 py-2 border-t border-lineSoft first:border-t-0"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#22332C" }}
              >
                <i
                  className={`ti ${t.category?.icon ?? "ti-dots"} text-[13px]`}
                  style={{ color: t.category?.color ?? "#8FA39A" }}
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-paper truncate">{t.merchant}</div>
                <div className="text-[11px] text-sage">
                  {t.category?.name ?? "Uncategorized"} ·{" "}
                  {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {t.currency !== homeCurrency ? ` · ${t.currency}` : ""}
                </div>
              </div>
              <div
                className={`font-mono text-sm shrink-0 ${t.amount > 0 ? "text-gold" : "text-paper"}`}
              >
                {formatSignedCents(t.amount, t.currency)}
              </div>
            </div>
          ))}
          {recentTransactions.length === 0 && (
            <div className="text-sm text-sage py-6 text-center">
              No transactions yet. Add your first one above.
            </div>
          )}
        </div>
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => router.refresh()}
        accounts={accounts}
        categories={categories}
        templates={templates}
        merchantMemory={merchantMemory}
        homeCurrency={homeCurrency}
      />
    </div>
  );
}
