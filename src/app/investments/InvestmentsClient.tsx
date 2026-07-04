"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCents } from "@/lib/money";

type Account = { id: string; name: string };
type Holding = {
  id: string;
  name: string;
  ticker: string | null;
  quantity: number;
  costBasis: number;
  currentValue: number;
  accountName: string;
  accountId: string;
};

const COLORS = ["#C99A4E", "#C1603F", "#5B8266", "#7C8DA6", "#8FA39A"];

export default function InvestmentsClient({
  holdings,
  accounts,
}: {
  holdings: Holding[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalCostBasis = holdings.reduce((s, h) => s + h.costBasis, 0);
  const gainLoss = totalValue - totalCostBasis;

  async function handleCreate() {
    const qty = parseFloat(quantity);
    const value = parseFloat(currentValue);
    if (!name.trim() || !accountId || Number.isNaN(qty) || Number.isNaN(value)) return;

    setSaving(true);
    await fetch("/api/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        name,
        ticker: ticker || null,
        quantity: qty,
        costBasis: Math.round((parseFloat(costBasis) || 0) * 100),
        currentValue: Math.round(value * 100),
      }),
    });
    setSaving(false);
    setShowForm(false);
    setName("");
    setTicker("");
    setQuantity("");
    setCostBasis("");
    setCurrentValue("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this holding?")) return;
    await fetch(`/api/holdings/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (accounts.length === 0) {
    return (
      <div className="max-w-[640px]">
        <div className="font-display text-xl text-paper mb-3">Investments</div>
        <div className="bg-panel rounded-[10px] p-6 text-sm text-sage">
          Create an account with type "Investment" first, then come back here to add holdings.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px]">
      <div className="flex items-center justify-between mb-5">
        <div className="font-display text-xl text-paper">Investments</div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg"
        >
          <i className="ti ti-plus text-[15px]" aria-hidden="true" />
          Add holding
        </button>
      </div>

      {holdings.length > 0 && (
        <div className="bg-panel rounded-[10px] p-4 mb-4 flex items-center gap-4">
          <div className="w-[90px] h-[90px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={holdings} dataKey="currentValue" nameKey="name" innerRadius={28} outerRadius={44} strokeWidth={0}>
                  {holdings.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1B2A25", border: "1px solid #2C4038", borderRadius: 8, fontSize: 12, color: "#EDEAE0" }}
                  formatter={(value: number, name: string) => [formatCents(value), name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="font-mono text-xl text-paper">{formatCents(totalValue)}</div>
            <div className={`font-mono text-xs mt-1 ${gainLoss >= 0 ? "text-gold" : "text-rust"}`}>
              {gainLoss >= 0 ? "+" : ""}
              {formatCents(gainLoss)} all-time
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-panel rounded-[10px] p-4 mb-4">
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Name</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. VTI"
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold"
              />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Ticker (optional)</div>
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="VTI"
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold"
              />
            </div>
          </div>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Quantity</div>
              <input
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold font-mono"
              />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Cost basis</div>
              <input
                inputMode="decimal"
                value={costBasis}
                onChange={(e) => setCostBasis(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold font-mono"
              />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Current value</div>
              <input
                inputMode="decimal"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold font-mono"
              />
            </div>
          </div>
          <div className="mb-3">
            <div className="text-[11px] text-sage tracking-wide mb-1.5">Account</div>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg">
              Add holding
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-sage px-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-panel rounded-[10px] overflow-hidden">
        {holdings.map((h) => (
          <div key={h.id} className="flex items-center gap-3 px-4 py-3 border-t border-lineSoft first:border-t-0 group">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-paper">{h.name}{h.ticker ? ` (${h.ticker})` : ""}</div>
              <div className="text-[11px] text-sage">{h.accountName} · {h.quantity} shares</div>
            </div>
            <div className="font-mono text-sm text-paper">{formatCents(h.currentValue)}</div>
            <button onClick={() => handleDelete(h.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove holding">
              <i className="ti ti-trash text-[14px] text-sage" aria-hidden="true" />
            </button>
          </div>
        ))}
        {holdings.length === 0 && (
          <div className="text-sm text-sage py-8 text-center">No holdings yet. Add one above.</div>
        )}
      </div>
    </div>
  );
}
