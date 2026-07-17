export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "ti-layout-dashboard" },
  { href: "/transactions", label: "Transactions", icon: "ti-list" },
  { href: "/budgets", label: "Budgets", icon: "ti-chart-pie" },
  { href: "/accounts", label: "Accounts", icon: "ti-building-bank" },
  { href: "/goals", label: "Goals", icon: "ti-target" },
  { href: "/investments", label: "Investments", icon: "ti-chart-candle" },
  { href: "/recurring", label: "Bills", icon: "ti-calendar-repeat" },
  { href: "/reports", label: "Reports", icon: "ti-file-text" },
  { href: "/settings", label: "Settings", icon: "ti-settings" },
];

/** Subset shown in the mobile bottom nav - keep this short, the rest is reachable via the command palette. */
export const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Home", icon: "ti-layout-dashboard" },
  { href: "/transactions", label: "Activity", icon: "ti-list" },
  { href: "/budgets", label: "Budgets", icon: "ti-chart-pie" },
  { href: "/accounts", label: "Accounts", icon: "ti-building-bank" },
];
