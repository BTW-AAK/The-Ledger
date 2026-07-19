"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCents } from "@/lib/money";
import { CURRENCIES } from "@/lib/currency";

type Account = {
  id: string;
  name: string;
  type: string;
  currency: string;
  startingBalance: number;
  balanceCents: number;
  balanceHomeCents: number;
};

const ACCOUNT_TYPES = [
  { value: "CHECKING", label: "Checking" },
  { value: "SAVINGS", label: "Savings" },
  { value: "CREDIT_CARD", label: "Credit card" },
  { value: "LOAN", label: "Loan" },
  { value: "CASH", label: "Cash" },
  { value: "INVESTMENT", label: "Investment" },
];

const LIABILITY_TYPES = new Set(["CREDIT_CARD", "LOAN"]);

export default function AccountsClient({
  accounts,
  homeCurrency,
  ratesKnown,
}: {
  accounts: Account[];
  homeCurrency: string;
  ratesKnown: string[];
}) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"none" | "create" | string>("none");
  const [name, setName] = useState("");
  const [type, setType] = useState("CHECKING");
  const [currency, setCurrency] = useState(homeCurrency);
  const [balanceInput, setBalanceInput] = useState("");
  const [saving, setSaving] = useState(false);

  const isLiability = LIABILITY_TYPES.has(type);
  const editingAccount = accounts.find((a) => a.id === formMode) ?? null;
  const foreignCurrenciesMissingRate = Array.from(
    new Set(accounts.map((a) => a.currency).filter((c) => c !== homeCurrency && !ratesKnown.includes(c)))
  );

  function openCreateForm() {
    setName("");
    setType("CHECKING");
    setCurrency(homeCurrency);
    setBalanceInput("");
    setFormMode("create");
  }

  function openEditForm(a: Account) {
    setName(a.name);
    setType(a.type);
    setCurrency(a.currency);
    setBalanceInput(String(Math.abs(a.startingBalance) / 100));
    setFormMode(a.id);
  }

  async function handleSave() {
    if (!name.trim()) return;
    const parsed = parseFloat(balanceInput || "0");
    const magnitude = Math.round((Number.isNaN(parsed) ? 0 : parsed) * 100);
    const startingBalance = isLiability ? -Math.abs(magnitude) : magnitude;

    setSaving(true);
    if (formMode === "create") {
      await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, currency, startingBalance }),
      });
    } else {
      await fetch(`/api/accounts/${formMode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, currency, startingBalance }),
      });
    }
    setSaving(false);
    setFormMode("none");
    router.refresh();
  }

  async function handleArchive(id: string) {
    if (!confirm("Archive this account? Its transaction history stays intact.")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="max-w-[640px]">
      <div className="flex items-center justify-between mb-5">
        <div className="font-display text-xl text-paper">Accounts</div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="text-sm text-sage flex items-center gap-1.5">
            <i className="ti ti-currency-dollar text-[15px]" aria-hidden="true" />
            {homeCurrency}
          </Link>
          <button
            data-tour="add-account"
            onClick={openCreateForm}
            className="flex items-center gap-1.5 text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg"
          >
            <i className="ti ti-plus text-[15px]" aria-hidden="true" />
            Add account
          </button>
        </div>
      </div>

      {foreignCurrenciesMissingRate.length > 0 && (
        <div className="bg-panel border border-rust/40 rounded-[10px] p-3 mb-4 text-xs text-sage flex items-center gap-2 flex-wrap">
          <i className="ti ti-alert-triangle text-[14px] text-rust shrink-0" aria-hidden="true" />
          <span>
            No exchange rate set for {foreignCurrenciesMissingRate.join(", ")} yet — net worth totals
            treat these as 1:1 with {homeCurrency} until you refresh rates.
          </span>
          <Link href="/settings" className="text-gold whitespace-nowrap">
            Go to Settings →
          </Link>
        </div>
      )}

      {formMode !== "none" && (
        <div className="bg-panel rounded-[10px] p-4 mb-4">
          <div className="mb-3">
            <div className="text-[11px] text-sage tracking-wide mb-1.5">Name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chase checking"
              className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Type</div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Currency</div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <div className="text-[11px] text-sage tracking-wide mb-1.5">
              {isLiability ? `Current amount owed (${currency})` : `Starting balance (${currency})`}
            </div>
            <input
              inputMode="decimal"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold font-mono"
            />
          </div>
          {isLiability && (
            <div className="text-xs text-sage mb-3">
              Enter this as a positive number — it will be tracked as a liability automatically.
            </div>
          )}
          {editingAccount && (
            <div className="text-xs text-sage mb-3">
              Editing the starting balance shifts this account's whole balance history — use it to
              correct a mistake, not to record a new transaction.
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg"
            >
              {editingAccount ? "Save changes" : "Create account"}
            </button>
            <button onClick={() => setFormMode("none")} className="text-sm text-sage px-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-panel rounded-[10px] overflow-hidden">
        {accounts.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 px-4 py-3.5 border-t border-lineSoft first:border-t-0 group"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm text-paper truncate">{a.name}</div>
              <div className="text-[11px] text-sage">
                {ACCOUNT_TYPES.find((t) => t.value === a.type)?.label ?? a.type}
                {a.currency !== homeCurrency ? ` · ${a.currency}` : ""}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className={`font-mono text-sm ${a.balanceCents < 0 ? "text-rust" : "text-paper"}`}>
                {formatCents(a.balanceCents, a.currency)}
              </div>
              {a.currency !== homeCurrency && (
                <div className="font-mono text-[11px] text-sage">
                  ≈ {formatCents(a.balanceHomeCents, homeCurrency)}
                </div>
              )}
            </div>
            <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => openEditForm(a)} aria-label="Edit account">
                <i className="ti ti-edit text-[15px] text-sage" aria-hidden="true" />
              </button>
              <button onClick={() => handleArchive(a.id)} aria-label="Archive account">
                <i className="ti ti-archive text-[15px] text-sage" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="text-sm text-sage py-8 text-center">
            No accounts yet. Add your first one above.
          </div>
        )}
      </div>
    </div>
  );
}
