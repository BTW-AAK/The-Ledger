"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Step = {
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    title: "Welcome to Ledger",
    body: "This isn't a bank-sync app — every transaction here is one you typed in yourself. That sounds like more work, but it's the whole point: you actually know where your money goes, because you're the one who wrote it down.",
  },
  {
    title: "Start with your accounts",
    body: "Add each bank account, credit card, or cash stash you want to track. For credit cards and loans, just enter what you currently owe — Ledger handles the rest automatically.",
  },
  {
    title: "Logging should take five seconds",
    body: "Hit Add transaction, or press N anywhere to jump straight to it. Type a merchant once and Ledger remembers its category — most entries after that are just a tap.",
  },
  {
    title: "Get around fast",
    body: "Press ⌘K (or Ctrl+K) anytime to search or jump to any page without touching the sidebar.",
  },
  {
    title: "Set a few budgets, and never forget a bill",
    body: "Give your biggest categories — groceries, dining — a monthly amount, and Ledger tracks progress as you log. Add recurring bills under Bills and you'll get a due-soon reminder instead of a surprise.",
  },
  {
    title: "See where you stand",
    body: "Your Dashboard shows net worth and spending at a glance. Reports gives you a clean monthly summary you can export as a PDF anytime.",
  },
];

export default function OnboardingTutorial({
  forceShow,
  onClose,
}: {
  forceShow: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      setStep(0);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && data.hasSeenOnboarding === false) {
          setVisible(true);
          setStep(0);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [forceShow]);

  async function finish() {
    setVisible(false);
    if (!forceShow) {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasSeenOnboarding: true }),
      });
    }
    onClose();
    router.refresh();
  }

  if (!loaded || !visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-[420px] bg-panel rounded-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === step ? "bg-gold" : "bg-lineSoft"}`}
              />
            ))}
          </div>
          <button onClick={finish} className="text-xs text-sage">
            Skip tutorial
          </button>
        </div>

        <div className="text-[11px] text-sage tracking-wide mb-2">
          Step {step + 1} of {STEPS.length}
        </div>
        <div className="font-display text-xl text-paper mb-2.5">{current.title}</div>
        <div className="text-sm text-sage leading-relaxed mb-7">{current.body}</div>

        <div className="flex items-center gap-2.5">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 text-center py-2.5 rounded-lg border border-line text-sage text-sm"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
            className="flex-[2] text-center py-2.5 rounded-lg bg-gold text-goldText text-sm"
          >
            {isLast ? "Get started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
