/** All monetary values in the database are integer cents. These helpers convert for display. */

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function formatCents(cents: number): string {
  const dollars = centsToDollars(cents);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(dollars));
  return dollars < 0 ? `-${formatted}` : formatted;
}

export function formatSignedCents(cents: number): string {
  const dollars = centsToDollars(cents);
  const formatted = formatCents(Math.abs(cents));
  return dollars >= 0 ? `+${formatted}` : `-${formatted}`;
}

export function currentMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
