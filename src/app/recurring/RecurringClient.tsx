"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/money";
import { advanceByCadence, CADENCE_LABELS } from "@/lib/cadence";

type Account = { id: string; name: string };
type Category = { id: string; name: string; icon: string; color: string };
type Template = {
  id: string;
  name: string;
  merchant: string | null;
  amount: number;
  cadence: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "YEARLY";
  nextDueDate: string;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  category: Category | null;
};

const CADENCES: Template["cadence"][] = ["WEEKLY", "BIWEEKLY", "MONTHLY", "YEARLY"];

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function RecurringClient({
  templates,
  accounts,
  categories,
}: {
  templates: Template[];
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"none" | "create" | string>("none");
  const [name, setName] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cadence, setCadence] = useState<Template["cadence"]>("MONTHLY");
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const dueSoon = useMemo(
    () => templates.filter((t) => daysUntil(t.nextDueDate) <= 7).sort((a, b) => daysUntil(a.nextDueDate) - daysUntil(b.nextDueDate)),
    [templates]
  );

  const dueDatesThisMonth = useMemo(() => {
    const now = new Date();
    const map = new Map<number, Template[]>();
    templates.forEach((t) => {
      const d = new Date(t.nextDueDate);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const day = d.getDate();
        map.set(day, [...(map.get(day) ?? []), t]);
      }
    });
    return map;
  }, [templates]);

  function openCreateForm() {
    setName("");
    setAmountInput("");
    setIsExpense(true);
    setAccountId(accounts[0]?.id ?? "");
    setCategoryId(null);
    setCadence("MONTHLY");
    setNextDueDate(new Date().toISOString().slice(0, 10));
    setFormMode("create");
  }

  function openEditForm(t: Template) {
    setName(t.name);
    setAmountInput(String(Math.abs(t.amount) / 100));
    setIsExpense(t.amount < 0);
    setAccountId(t.accountId);
    setCategoryId(t.categoryId);
    setCadence(t.cadence);
    setNextDueDate(t.nextDueDate.slice(0, 10));
    setFormMode(t.id);
  }

  async function handleSaveTemplate() {
    const parsed = parseFloat(amountInput);
    if (!name.trim() || Number.isNaN(parsed) || parsed <= 0 || !accountId) return;
    const amount = Math.round(parsed * 100) * (isExpense ? -1 : 1);

    setSaving(true);
    const payload = { name, merchant: name, amount, categoryId, accountId, cadence, nextDueDate };
    if (formMode === "create") {
      await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`/api/recurring/${formMode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setFormMode("none");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this recurring template?")) return;
    await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleLogNow(t: Template) {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: t.accountId,
        categoryId: t.categoryId,
        date: new Date().toISOString(),
        amount: t.amount,
        merchant: t.merchant ?? t.name,
      }),
    });
    const next = advanceByCadence(new Date(t.nextDueDate), t.cadence);
    await fetch(`/api/recurring/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextDueDate: next.toISOString() }),
    });
    router.refresh();
  }

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  return (
    <div className="max-w-[720px]">
      <div className="flex items-center justify-between mb-5">
        <div className="font-display text-xl text-paper">Bills</div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg"
        >
          <i className="ti ti-plus text-[15px]" aria-hidden="true" />
          Add recurring
        </button>
      </div>

      {formMode !== "none" && (
        <div className="bg-panel rounded-[10px] p-4 mb-4">
          <div className="mb-3">
            <div className="text-[11px] text-sage tracking-wide mb-1.5">Name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rent"
              className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold"
            />
          </div>
          <div className="flex bg-ink rounded-lg p-[3px] gap-[3px] mb-3 max-w-[220px]">
            <button
              className={`flex-1 text-center py-1.5 rounded-md text-sm ${isExpense ? "bg-rustSoft text-[#E2A38F]" : "text-sage"}`}
              onClick={() => setIsExpense(true)}
            >
              Expense
            </button>
            <button
              className={`flex-1 text-center py-1.5 rounded-md text-sm ${!isExpense ? "bg-[#2A2E1E] text-gold" : "text-sage"}`}
              onClick={() => setIsExpense(false)}
            >
              Income
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Amount</div>
              <input
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold font-mono"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Cadence</div>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as Template["cadence"])}
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none"
              >
                {CADENCES.map((c) => (
                  <option key={c} value={c}>
                    {CADENCE_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Next due</div>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex-1 min-w-0">
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
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-sage tracking-wide mb-1.5">Category</div>
              <select
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveTemplate} disabled={saving} className="text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg">
              {formMode === "create" ? "Create" : "Save changes"}
            </button>
            <button onClick={() => setFormMode("none")} className="text-sm text-sage px-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {dueSoon.length > 0 && (
        <div className="mb-5">
          <div className="text-sm text-paper mb-2.5">Due soon</div>
          <div className="bg-panel rounded-[10px] overflow-hidden">
            {dueSoon.map((t) => {
              const days = daysUntil(t.nextDueDate);
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-t border-lineSoft first:border-t-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#22332C" }}
                  >
                    <i
                      className={`ti ${t.category?.icon ?? "ti-repeat"} text-[14px]`}
                      style={{ color: t.category?.color ?? "#8FA39A" }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-paper truncate">{t.name}</div>
                    <div className="text-[11px] text-sage">
                      {days <= 0 ? "Due today" : days === 1 ? "Due tomorrow" : `Due in ${days} days`}
                    </div>
                  </div>
                  <div className="font-mono text-sm text-paper shrink-0">{formatCents(t.amount)}</div>
                  <button
                    onClick={() => handleLogNow(t)}
                    className="text-xs bg-gold text-goldText px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap"
                  >
                    Log now
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-5">
        <div className="text-sm text-paper mb-2.5">
          {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
        <div className="bg-panel rounded-[10px] p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-sage mb-1.5">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === now.getDate();
              const hasDue = dueDatesThisMonth.has(day);
              return (
                <div
                  key={day}
                  className={`aspect-square flex flex-col items-center justify-center rounded-md text-[11px] ${
                    isToday ? "bg-lineSoft text-paper" : "text-sage"
                  }`}
                >
                  {day}
                  {hasDue && <span className="w-1 h-1 rounded-full bg-gold mt-0.5" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-sm text-paper mb-2.5">All recurring</div>
      <div className="bg-panel rounded-[10px] overflow-hidden">
        {templates.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-t border-lineSoft first:border-t-0 group">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-paper truncate">{t.name}</div>
              <div className="text-[11px] text-sage">
                {CADENCE_LABELS[t.cadence]} · {t.accountName} · next{" "}
                {new Date(t.nextDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
            <div className="font-mono text-sm text-paper shrink-0">{formatCents(t.amount)}</div>
            <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => openEditForm(t)} aria-label="Edit">
                <i className="ti ti-edit text-[15px] text-sage" aria-hidden="true" />
              </button>
              <button onClick={() => handleDelete(t.id)} aria-label="Delete">
                <i className="ti ti-trash text-[15px] text-sage" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="text-sm text-sage py-8 text-center">No recurring bills yet. Add one above.</div>
        )}
      </div>
    </div>
  );
}
