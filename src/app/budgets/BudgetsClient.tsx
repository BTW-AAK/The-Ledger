"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BudgetBar from "@/components/BudgetBar";
import { formatCents } from "@/lib/money";

type Category = { id: string; name: string; icon: string; color: string; kind: string };
type Progress = { id: string; name: string; color: string; budgetCents: number; spentCents: number };

export default function BudgetsClient({
  categories,
  progress,
  month,
}: {
  categories: Category[];
  progress: Progress[];
  month: string;
}) {
  const router = useRouter();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [rollover, setRollover] = useState(false);
  const [saving, setSaving] = useState(false);

  const budgetedNames = new Set(progress.map((p) => p.name));
  const totalBudget = progress.reduce((s, p) => s + p.budgetCents, 0);
  const totalSpent = progress.reduce((s, p) => s + p.spentCents, 0);

  function startEdit(categoryId: string, currentCents?: number) {
    setEditingCategoryId(categoryId);
    setAmountInput(currentCents ? String(currentCents / 100) : "");
  }

  async function saveBudget() {
    if (!editingCategoryId) return;
    const parsed = parseFloat(amountInput);
    if (Number.isNaN(parsed) || parsed <= 0) return;

    setSaving(true);
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: editingCategoryId,
        month,
        amount: Math.round(parsed * 100),
        rollover,
      }),
    });
    setSaving(false);
    setEditingCategoryId(null);
    router.refresh();
  }

  return (
    <div className="max-w-[640px]">
      <div className="flex items-center justify-between mb-1">
        <div className="font-display text-xl text-paper">Budgets</div>
        <div className="text-sm text-sage">
          {new Date(`${month}-01`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
      </div>
      <div className="text-sm text-sage mb-5">
        {formatCents(totalSpent)} spent of {formatCents(totalBudget)} budgeted
      </div>

      <div className="flex flex-col gap-4">
        {categories.map((c) => {
          const p = progress.find((pr) => pr.name === c.name);
          const isEditing = editingCategoryId === c.id;

          return (
            <div key={c.id} className="bg-panel rounded-[10px] p-4">
              <div className="flex items-center gap-2 mb-2">
                <i className={`ti ${c.icon} text-[14px]`} style={{ color: c.color }} aria-hidden="true" />
                <span className="text-sm text-paper">{c.name}</span>
                <button
                  onClick={() => startEdit(c.id, p?.budgetCents)}
                  className="ml-auto text-xs text-sage"
                >
                  {p ? "Edit" : "Set budget"}
                </button>
              </div>

              {isEditing ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    autoFocus
                    inputMode="decimal"
                    placeholder="Monthly amount"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="flex-1 bg-ink border border-line rounded-lg px-3 py-1.5 text-sm text-paper outline-none focus:border-gold font-mono"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-sage">
                    <input
                      type="checkbox"
                      checked={rollover}
                      onChange={(e) => setRollover(e.target.checked)}
                    />
                    Rollover
                  </label>
                  <button
                    onClick={saveBudget}
                    disabled={saving}
                    className="text-xs bg-gold text-goldText px-3 py-1.5 rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingCategoryId(null)}
                    className="text-xs text-sage px-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : p ? (
                <BudgetBar name="" spentCents={p.spentCents} budgetCents={p.budgetCents} color={c.color} />
              ) : (
                <div className="text-xs text-sage">No budget set for this month.</div>
              )}
            </div>
          );
        })}
        {!categories.some((c) => budgetedNames.has(c.name)) && (
          <div className="text-xs text-sage">
            Tip: set a budget on your most frequent categories first — groceries and dining are a
            good place to start.
          </div>
        )}
      </div>
    </div>
  );
}
