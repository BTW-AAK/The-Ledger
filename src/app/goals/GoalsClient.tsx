"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/money";

type Account = { id: string; name: string };
type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
};

export default function GoalsClient({ goals, accounts }: { goals: Goal[]; accounts: Account[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const parsedTarget = parseFloat(target);
    if (!name.trim() || Number.isNaN(parsedTarget) || parsedTarget <= 0) return;

    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        targetAmount: Math.round(parsedTarget * 100),
        currentAmount: Math.round((parseFloat(current) || 0) * 100),
        targetDate: date || null,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setName("");
    setTarget("");
    setCurrent("");
    setDate("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this goal?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="max-w-[640px]">
      <div className="flex items-center justify-between mb-5">
        <div className="font-display text-xl text-paper">Goals</div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg"
        >
          <i className="ti ti-plus text-[15px]" aria-hidden="true" />
          Add goal
        </button>
      </div>

      {showForm && (
        <div className="bg-panel rounded-[10px] p-4 mb-4">
          <div className="mb-3">
            <div className="text-[11px] text-sage tracking-wide mb-1.5">Goal name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency fund"
              className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold"
            />
          </div>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Target amount</div>
              <input
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="10,000"
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold font-mono"
              />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Already saved</div>
              <input
                inputMode="decimal"
                value={current}
                onChange={(e) => setCurrent(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold font-mono"
              />
            </div>
          </div>
          <div className="mb-3">
            <div className="text-[11px] text-sage tracking-wide mb-1.5">Target date (optional)</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg"
            >
              Create goal
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-sage px-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
          return (
            <div key={g.id} className="bg-panel rounded-[10px] p-4 group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-paper">{g.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-sage">
                    {formatCents(g.currentAmount)} / {formatCents(g.targetAmount)}
                  </span>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete goal"
                  >
                    <i className="ti ti-trash text-[14px] text-sage" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="h-[5px] bg-line rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
              </div>
              {g.targetDate && (
                <div className="text-[11px] text-sage mt-1.5">
                  Target: {new Date(g.targetDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
              )}
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="text-sm text-sage py-8 text-center bg-panel rounded-[10px]">
            No goals yet. Add one above.
          </div>
        )}
      </div>
    </div>
  );
}
