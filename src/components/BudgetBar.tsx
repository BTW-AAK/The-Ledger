import { formatCents } from "@/lib/money";

export default function BudgetBar({
  name,
  spentCents,
  budgetCents,
  color,
  currency = "USD",
}: {
  name: string;
  spentCents: number;
  budgetCents: number;
  color: string;
  currency?: string;
}) {
  const pct = budgetCents > 0 ? Math.min(100, Math.round((spentCents / budgetCents) * 100)) : 0;
  const over = spentCents > budgetCents;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-sage">{name}</span>
        <span className="font-mono text-paper">
          {formatCents(spentCents, currency)} / {formatCents(budgetCents, currency)}
        </span>
      </div>
      <div className="h-[5px] bg-line rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: over ? "#C1603F" : color }}
        />
      </div>
    </div>
  );
}
