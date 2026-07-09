import { addDays, addMonths, addYears } from "date-fns";

export function advanceByCadence(date: Date, cadence: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "YEARLY"): Date {
  switch (cadence) {
    case "WEEKLY":
      return addDays(date, 7);
    case "BIWEEKLY":
      return addDays(date, 14);
    case "MONTHLY":
      return addMonths(date, 1);
    case "YEARLY":
      return addYears(date, 1);
  }
}

export const CADENCE_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};
