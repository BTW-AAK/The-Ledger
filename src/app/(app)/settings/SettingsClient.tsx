"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CURRENCIES } from "@/lib/currency";

type Rate = { currency: string; rateToHome: number; updatedAt: string };

export default function SettingsClient({
  homeCurrency: initialHomeCurrency,
  email,
  rates,
  currenciesInUse,
}: {
  homeCurrency: string;
  email: string;
  rates: Rate[];
  currenciesInUse: string[];
}) {
  const router = useRouter();
  const [homeCurrency, setHomeCurrency] = useState(initialHomeCurrency);
  const [savingHome, setSavingHome] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [editingCurrency, setEditingCurrency] = useState<string | null>(null);
  const [manualRate, setManualRate] = useState("");

  const rateMap = new Map(rates.map((r) => [r.currency, r]));
  const foreignCurrencies = currenciesInUse.filter((c) => c !== homeCurrency);

  async function handleHomeCurrencyChange(next: string) {
    setHomeCurrency(next);
    setSavingHome(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeCurrency: next }),
    });
    setSavingHome(false);
    router.refresh();
  }

  async function handleRefreshRates() {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/currency-rates/refresh", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not refresh rates.");
      }
      router.refresh();
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setRefreshing(false);
    }
  }

  function startManualEdit(currency: string) {
    const existing = rateMap.get(currency);
    setManualRate(existing ? String(existing.rateToHome) : "");
    setEditingCurrency(currency);
  }

  async function saveManualRate() {
    if (!editingCurrency) return;
    const parsed = parseFloat(manualRate);
    if (Number.isNaN(parsed) || parsed <= 0) return;

    await fetch("/api/currency-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: editingCurrency, rateToHome: parsed }),
    });
    setEditingCurrency(null);
    router.refresh();
  }

  return (
    <div className="max-w-[560px]">
      <div className="font-display text-xl text-paper mb-5">Settings</div>

      <div className="bg-panel rounded-[10px] p-4 mb-5">
        <div className="text-sm text-paper mb-1">Signed in as</div>
        <div className="text-sm text-sage">{email}</div>
      </div>

      <div className="bg-panel rounded-[10px] p-4 mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-paper mb-1">Tutorial</div>
          <div className="text-xs text-sage">Replay the getting-started walkthrough.</div>
        </div>
        <Link href="/?tutorial=1" className="text-sm bg-gold text-goldText px-3.5 py-2 rounded-lg shrink-0">
          Replay
        </Link>
      </div>

      <div className="bg-panel rounded-[10px] p-4 mb-5">
        <div className="text-sm text-paper mb-1">Home currency</div>
        <div className="text-xs text-sage mb-3">
          Net worth, budgets, and reports are all shown in this currency.
        </div>
        <select
          data-tour="home-currency"
          value={homeCurrency}
          onChange={(e) => handleHomeCurrencyChange(e.target.value)}
          disabled={savingHome}
          className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-panel rounded-[10px] p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm text-paper">Exchange rates</div>
          <button
            onClick={handleRefreshRates}
            disabled={refreshing || foreignCurrencies.length === 0}
            className="flex items-center gap-1.5 text-xs bg-gold text-goldText px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            <i className={`ti ti-refresh text-[13px] ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            {refreshing ? "Refreshing…" : "Refresh rates"}
          </button>
        </div>
        <div className="text-xs text-sage mb-3">
          How many {homeCurrency} one unit of each currency is worth. Refresh pulls live rates from a
          free exchange rate service; you can also enter a rate manually.
        </div>

        {refreshError && <div className="text-xs text-[#F0C9BC] mb-3">{refreshError}</div>}

        {foreignCurrencies.length === 0 ? (
          <div className="text-sm text-sage py-4 text-center">
            All your accounts use {homeCurrency}, so no conversion is needed yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {foreignCurrencies.map((currency) => {
              const rate = rateMap.get(currency);
              const isEditing = editingCurrency === currency;
              return (
                <div key={currency} className="flex items-center gap-2.5 py-2 border-t border-lineSoft first:border-t-0">
                  <span className="text-sm text-paper w-14 shrink-0">{currency}</span>
                  {isEditing ? (
                    <>
                      <input
                        autoFocus
                        inputMode="decimal"
                        value={manualRate}
                        onChange={(e) => setManualRate(e.target.value.replace(/[^0-9.]/g, ""))}
                        className="flex-1 min-w-0 bg-ink border border-line rounded-lg px-2.5 py-1.5 text-sm text-paper outline-none focus:border-gold font-mono"
                      />
                      <button onClick={saveManualRate} className="text-xs bg-gold text-goldText px-2.5 py-1.5 rounded-lg shrink-0">
                        Save
                      </button>
                      <button onClick={() => setEditingCurrency(null)} className="text-xs text-sage px-1 shrink-0">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-mono text-sm text-sage">
                        {rate ? `1 ${currency} = ${rate.rateToHome.toFixed(4)} ${homeCurrency}` : "Not set"}
                      </span>
                      <button onClick={() => startManualEdit(currency)} className="text-xs text-sage shrink-0">
                        Edit
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
