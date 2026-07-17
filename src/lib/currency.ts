export function getCurrencySymbol(currencyCode: string): string {
  try {
    const parts = new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currencyCode;
  } catch {
    return currencyCode;
  }
}

export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "INR", name: "Indian Rupee" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "AED", name: "UAE Dirham" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "BRL", name: "Brazilian Real" },
];

/**
 * Converts an amount in `currency` to home-currency cents using the provided rate map.
 * `rates` maps currency code -> how many home-currency units 1 unit of that currency is worth.
 * The home currency itself is not in the map and always converts 1:1.
 */
export function convertToHomeCents(
  amountCents: number,
  currency: string,
  homeCurrency: string,
  rates: Map<string, number>
): number {
  if (currency === homeCurrency) return amountCents;
  const rate = rates.get(currency);
  if (!rate) return amountCents; // No rate yet - fall back to treating it as 1:1 rather than crashing.
  return Math.round(amountCents * rate);
}

/**
 * Fetches live exchange rates from Frankfurter (free, no API key, ECB reference rates)
 * for the given currencies relative to the home currency. Returns a map of
 * currency -> rateToHome (how many home-currency units 1 unit of that currency is worth).
 */
export async function fetchLiveRates(
  homeCurrency: string,
  currencies: string[]
): Promise<Map<string, number>> {
  const symbols = currencies.filter((c) => c !== homeCurrency);
  const rates = new Map<string, number>();
  if (symbols.length === 0) return rates;

  const url = `https://api.frankfurter.app/latest?base=${homeCurrency}&symbols=${symbols.join(",")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not reach the exchange rate service.");

  const data = await res.json();
  // Frankfurter returns "1 base = X symbol", so invert to get "1 symbol = Y base".
  for (const [currency, rateFromHome] of Object.entries<number>(data.rates ?? {})) {
    if (rateFromHome > 0) rates.set(currency, 1 / rateFromHome);
  }
  return rates;
}
