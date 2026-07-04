"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/money";

type Account = {
  id: string;
  name: string;
  type: string;
  startingBalance: number;
  balanceCents: number;
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

export default function AccountsClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("CHECKING");
  const [balanceInput, setBalanceInput] = useState("");
  const [saving, setSaving] = useState(false);

  const isLiability = LIABILITY_TYPES.has(type);

  async function handleCreate() {
    if (!name.trim()) return;
    const parsed = parseFloat(balanceInput || "0");
    const magnitude = Math.round((Number.isNaN(parsed) ? 0 : parsed) * 100);
    const startingBalance = isLiability ? -Math.abs(magnitude) : magnitude;

    setSaving(true);
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, startingBalance }),
    });
    setSaving(false);
    setShowForm(false);
    setName("");
    setBalanceInput("");
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
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg"
        >
          <i className="ti ti-plus text-[15px]" aria-hidden="true" />
          Add account
        </button>
      </div>

      {showForm && (
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
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
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
            <div className="flex-1">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">
                {isLiability ? "Current amount owed" : "Starting balance"}
              </div>
              <input
                inputMode="decimal"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold font-mono"
              />
            </div>
          </div>
          {isLiability && (
            <div className="text-xs text-sage mb-3">
              Enter this as a positive number — it will be tracked as a liability automatically.
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg"
            >
              Create account
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-sage px-2">
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
              <div className="text-sm text-paper">{a.name}</div>
              <div className="text-[11px] text-sage">
                {ACCOUNT_TYPES.find((t) => t.value === a.type)?.label ?? a.type}
              </div>
            </div>
            <div
              className={`font-mono text-sm ${a.balanceCents < 0 ? "text-rust" : "text-paper"}`}
            >
              {formatCents(a.balanceCents)}
            </div>
            <button
              onClick={() => handleArchive(a.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Archive account"
            >
              <i className="ti ti-archive text-[15px] text-sage" aria-hidden="true" />
            </button>
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
