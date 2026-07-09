"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TransactionModal, { TransactionDraft } from "@/components/TransactionModal";
import { formatSignedCents } from "@/lib/money";

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
type Txn = {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  category: { id: string; name: string; icon: string; color: string } | null;
  notes: string | null;
  tags: string[];
};

export default function TransactionsClient({
  initialTransactions,
  accounts,
  categories,
  templates,
  merchantMemory,
}: {
  initialTransactions: Txn[];
  accounts: Account[];
  categories: Category[];
  templates: RecurringTemplate[];
  merchantMemory: { merchant: string; categoryId: string }[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Txn | null>(null);
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const allTags = useMemo(() => {
    const set = new Set<string>();
    initialTransactions.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [initialTransactions]);

  const filtered = useMemo(() => {
    return initialTransactions.filter((t) => {
      if (search && !t.merchant.toLowerCase().includes(search.toLowerCase())) return false;
      if (accountFilter && t.accountId !== accountFilter) return false;
      if (categoryFilter && t.categoryId !== categoryFilter) return false;
      if (tagFilter && !t.tags.includes(tagFilter)) return false;
      return true;
    });
  }, [initialTransactions, search, accountFilter, categoryFilter, tagFilter]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function openEdit(t: Txn) {
    setEditing(t);
    setModalOpen(true);
  }

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  const editDraft: TransactionDraft | undefined = editing
    ? {
        id: editing.id,
        accountId: editing.accountId,
        categoryId: editing.categoryId,
        date: editing.date.slice(0, 10),
        amountCents: editing.amount,
        isExpense: editing.amount < 0,
        merchant: editing.merchant,
        notes: editing.notes ?? "",
        tags: editing.tags,
      }
    : undefined;

  return (
    <div className="max-w-[900px]">
      <div className="flex items-center justify-between mb-5">
        <div className="font-display text-xl text-paper">Transactions</div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg"
        >
          <i className="ti ti-plus text-[15px]" aria-hidden="true" />
          Add transaction
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <input
          placeholder="Search merchant"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-0 bg-panel border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold"
        />
        <div className="flex gap-2.5">
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="flex-1 min-w-0 bg-panel border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 min-w-0 bg-panel border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="flex-1 min-w-0 bg-panel border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none"
            >
              <option value="">All tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="bg-panel rounded-[10px] overflow-hidden">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 border-t border-lineSoft first:border-t-0 group"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#22332C" }}
            >
              <i
                className={`ti ${t.category?.icon ?? "ti-dots"} text-[14px]`}
                style={{ color: t.category?.color ?? "#8FA39A" }}
                aria-hidden="true"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-paper truncate">{t.merchant}</div>
              <div className="text-[11px] text-sage truncate">
                {t.category?.name ?? "Uncategorized"} · {t.accountName} ·{" "}
                {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
              {t.tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-lineSoft text-sage rounded-full px-1.5 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div
              className={`font-mono text-sm shrink-0 ${t.amount > 0 ? "text-gold" : "text-paper"}`}
            >
              {formatSignedCents(t.amount)}
            </div>
            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => openEdit(t)} aria-label="Edit">
                <i className="ti ti-edit text-[15px] text-sage" aria-hidden="true" />
              </button>
              <button onClick={() => handleDelete(t.id)} aria-label="Delete">
                <i className="ti ti-trash text-[15px] text-sage" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-sage py-8 text-center">No transactions match.</div>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => router.refresh()}
        accounts={accounts}
        categories={categories}
        templates={templates}
        merchantMemory={merchantMemory}
        initial={editDraft}
      />
    </div>
  );
}
