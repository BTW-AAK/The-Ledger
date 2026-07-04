"use client";

import { useEffect, useMemo, useState } from "react";

type Account = { id: string; name: string };
type Category = { id: string; name: string; icon: string; color: string };
type RecurringTemplate = {
  id: string;
  name: string;
  merchant: string | null;
  amount: number;
  accountId: string;
  categoryId: string | null;
};
type MerchantMemory = { merchant: string; categoryId: string }[];

export type TransactionDraft = {
  id?: string;
  accountId: string;
  categoryId: string | null;
  date: string;
  amountCents: number;
  isExpense: boolean;
  merchant: string;
  notes: string;
};

export default function TransactionModal({
  open,
  onClose,
  onSaved,
  accounts,
  categories,
  templates,
  merchantMemory,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  accounts: Account[];
  categories: Category[];
  templates: RecurringTemplate[];
  merchantMemory: MerchantMemory;
  initial?: TransactionDraft;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const [isExpense, setIsExpense] = useState(initial ? initial.amountCents < 0 : true);
  const [amountInput, setAmountInput] = useState(
    initial ? String(Math.abs(initial.amountCents) / 100) : ""
  );
  const [merchant, setMerchant] = useState(initial?.merchant ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [accountId, setAccountId] = useState(initial?.accountId ?? accounts[0]?.id ?? "");
  const [date, setDate] = useState(initial?.date ?? today);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setIsExpense(initial ? initial.amountCents < 0 : true);
    setAmountInput(initial ? String(Math.abs(initial.amountCents) / 100) : "");
    setMerchant(initial?.merchant ?? "");
    setCategoryId(initial?.categoryId ?? null);
    setAccountId(initial?.accountId ?? accounts[0]?.id ?? "");
    setDate(initial?.date ?? today);
    setNotes(initial?.notes ?? "");
    setError(null);
  }, [open, initial]);

  const suggestedCategory = useMemo(() => {
    if (!merchant) return null;
    const match = merchantMemory.find(
      (m) => m.merchant.toLowerCase() === merchant.toLowerCase()
    );
    return match ? categories.find((c) => c.id === match.categoryId) ?? null : null;
  }, [merchant, merchantMemory, categories]);

  useEffect(() => {
    if (suggestedCategory && !categoryId) {
      setCategoryId(suggestedCategory.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedCategory]);

  if (!open) return null;

  async function handleSave() {
    setError(null);
    const parsed = parseFloat(amountInput);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!merchant.trim()) {
      setError("Enter a merchant or description.");
      return;
    }
    if (!accountId) {
      setError("Choose an account.");
      return;
    }

    const amountCents = Math.round(parsed * 100) * (isExpense ? -1 : 1);

    setSaving(true);
    try {
      const payload = {
        accountId,
        categoryId,
        date,
        amount: amountCents,
        merchant: merchant.trim(),
        notes: notes.trim() || null,
      };

      const res = await fetch(initial?.id ? `/api/transactions/${initial.id}` : "/api/transactions", {
        method: initial?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save transaction.");
      }

      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function applyTemplate(t: RecurringTemplate) {
    setAmountInput(String(Math.abs(t.amount) / 100));
    setIsExpense(t.amount < 0);
    setMerchant(t.merchant ?? t.name);
    setCategoryId(t.categoryId);
    setAccountId(t.accountId);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Enter" && !(e.target as HTMLElement).matches("textarea")) {
          e.preventDefault();
          handleSave();
        }
      }}
    >
      <div className="w-full max-w-[380px] bg-panel rounded-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display text-[17px] text-paper">
            {initial?.id ? "Edit transaction" : "Add transaction"}
          </div>
          <button onClick={onClose} aria-label="Close">
            <i className="ti ti-x text-[17px] text-sage" aria-hidden="true" />
          </button>
        </div>

        <div className="flex bg-ink rounded-lg p-[3px] gap-[3px] mb-4">
          <button
            className={`flex-1 text-center py-1.5 rounded-md text-sm ${
              isExpense ? "bg-rustSoft text-[#E2A38F]" : "text-sage"
            }`}
            onClick={() => setIsExpense(true)}
          >
            Expense
          </button>
          <button
            className={`flex-1 text-center py-1.5 rounded-md text-sm ${
              !isExpense ? "bg-[#2A2E1E] text-gold" : "text-sage"
            }`}
            onClick={() => setIsExpense(false)}
          >
            Income
          </button>
        </div>

        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-1">
            <span className="font-mono text-2xl text-sage">$</span>
            <input
              autoFocus
              inputMode="decimal"
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9.]/g, ""))}
              className="font-mono text-4xl bg-transparent text-paper text-center w-[160px] outline-none"
            />
          </div>
        </div>

        {templates.length > 0 && (
          <>
            <div className="text-[11px] text-sage tracking-wide mb-1.5">Quick templates</div>
            <div className="flex gap-1.5 mb-4 overflow-x-auto">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-line text-sage whitespace-nowrap hover:text-paper"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mb-3.5">
          <div className="text-[11px] text-sage tracking-wide mb-1.5">Merchant</div>
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Blue Bottle Coffee"
            className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold"
            list="merchant-history"
          />
          <datalist id="merchant-history">
            {merchantMemory.map((m) => (
              <option key={m.merchant} value={m.merchant} />
            ))}
          </datalist>
          {suggestedCategory && (
            <div className="flex items-center gap-2 mt-1 text-xs text-sage">
              <i className={`ti ${suggestedCategory.icon} text-[13px]`} style={{ color: suggestedCategory.color }} aria-hidden="true" />
              Usually {suggestedCategory.name}
            </div>
          )}
        </div>

        <div className="mb-3.5">
          <div className="text-[11px] text-sage tracking-wide mb-1.5">Category</div>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`text-xs px-2.5 py-1.5 rounded-full border flex items-center gap-1.5 ${
                  categoryId === c.id
                    ? "border-rust text-[#F0C9BC] bg-rustSoft"
                    : "border-line text-sage"
                }`}
              >
                <i className={`ti ${c.icon} text-[12px]`} aria-hidden="true" />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2.5 mb-4">
          <div className="flex-1">
            <div className="text-[11px] text-sage tracking-wide mb-1.5">Account</div>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-ink border border-line rounded-lg px-2.5 py-2 text-sm text-paper outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-sage tracking-wide mb-1.5">Date</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-ink border border-line rounded-lg px-2.5 py-2 text-sm text-paper outline-none"
            />
          </div>
        </div>

        {error && <div className="text-xs text-[#F0C9BC] mb-3">{error}</div>}

        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 text-center py-2.5 rounded-lg border border-line text-sage text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] text-center py-2.5 rounded-lg bg-gold text-goldText text-sm disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save transaction"}
          </button>
        </div>
        <div className="text-center text-[11px] text-sage mt-2">Press enter to save</div>
      </div>
    </div>
  );
}
