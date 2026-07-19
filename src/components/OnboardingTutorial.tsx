"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type Step = {
  id: string;
  title: string;
  body: string;
  path: string | null; // page to auto-navigate to, or null if it works on any page
  target: string | null; // data-tour value to spotlight, or null for a centered card
  gated?: "account-created";
};

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to Ledger",
    body: "This isn't a bank-sync app — you type every transaction in yourself. Let's get you set up: pick a currency and add your first account. Takes under a minute.",
    path: null,
    target: null,
  },
  {
    id: "currency",
    title: "Set your home currency",
    body: "This is what your net worth, budgets, and reports will be shown in. You can change it later, and each account can still use its own currency if you're tracking money abroad.",
    path: "/settings",
    target: "home-currency",
  },
  {
    id: "account",
    title: "Add your first account",
    body: "Click here. For credit cards or loans, enter what you currently owe — Ledger handles the sign automatically.",
    path: "/accounts",
    target: "add-account",
    gated: "account-created",
  },
  {
    id: "transaction",
    title: "This is where you'll spend most your time",
    body: "Click here, or press N from anywhere in the app, to log something right now.",
    path: "/",
    target: "add-transaction",
  },
  {
    id: "budgets",
    title: "Set a budget on your biggest category",
    body: "Groceries or dining is usually the place to start.",
    path: null,
    target: "nav-budgets",
  },
  {
    id: "bills",
    title: "Never forget a recurring bill",
    body: "Add rent, subscriptions, or anything recurring here — you'll get a due-soon reminder instead of a surprise.",
    path: null,
    target: "nav-bills",
  },
  {
    id: "palette",
    title: "Press ⌘K anytime",
    body: "Jump to any page or search without touching the sidebar.",
    path: null,
    target: null,
  },
];

const CARD_WIDTH = 340;

function findVisibleElement(tourId: string): HTMLElement | null {
  const els = document.querySelectorAll<HTMLElement>(`[data-tour="${tourId}"]`);
  for (const el of Array.from(els)) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return el;
  }
  return null;
}

function computeCardPosition(rect: DOMRect) {
  const margin = 14;
  const cardHeightEstimate = 210;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Narrow targets near the left edge (sidebar/nav items) look better with the card to their side.
  if (rect.left < 220 && rect.right + margin + CARD_WIDTH < vw) {
    return {
      top: Math.min(Math.max(rect.top, margin), vh - cardHeightEstimate - margin),
      left: rect.right + margin,
    };
  }
  if (rect.bottom + margin + cardHeightEstimate < vh) {
    return {
      top: rect.bottom + margin,
      left: Math.min(Math.max(rect.left, margin), vw - CARD_WIDTH - margin),
    };
  }
  return {
    top: Math.max(margin, rect.top - cardHeightEstimate - margin),
    left: Math.min(Math.max(rect.left, margin), vw - CARD_WIDTH - margin),
  };
}

export default function OnboardingTutorial({
  forceShow,
  onClose,
}: {
  forceShow: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [gateSatisfied, setGateSatisfied] = useState(false);

  const gateBaselineRef = useRef<number | null>(null);
  const gateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = STEPS[stepIndex];

  // Decide whether to show at all, on mount.
  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      setStepIndex(0);
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
          setStepIndex(0);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [forceShow]);

  // Navigate to the step's page if we're not already there.
  useEffect(() => {
    if (!visible) return;
    if (step.path && pathname !== step.path) {
      router.push(step.path);
    }
  }, [visible, step, pathname, router]);

  // Locate and track the target element for the current step.
  const measure = useCallback(() => {
    if (!step.target) {
      setRect(null);
      return;
    }
    const el = findVisibleElement(step.target);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useEffect(() => {
    if (!visible) return;
    if (!step.target) {
      setRect(null);
      return;
    }
    if (step.path && pathname !== step.path) return; // wait for navigation to land first

    setRect(null);
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      const el = findVisibleElement(step.target!);
      if (el) {
        setRect(el.getBoundingClientRect());
        clearInterval(interval);
      } else if (attempts > 40) {
        clearInterval(interval); // give up gracefully - falls back to a centered card
      }
    }, 75);

    return () => clearInterval(interval);
  }, [visible, step, pathname]);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [visible, measure]);

  // Gated step: poll until an account actually exists, then auto-advance.
  useEffect(() => {
    if (!visible || step.gated !== "account-created") {
      setGateSatisfied(false);
      gateBaselineRef.current = null;
      return;
    }

    let cancelled = false;
    fetch("/api/accounts")
      .then((res) => (res.ok ? res.json() : []))
      .then((accounts: unknown[]) => {
        if (cancelled) return;
        if (accounts.length > 0) {
          setGateSatisfied(true);
          return;
        }
        gateIntervalRef.current = setInterval(async () => {
          const res = await fetch("/api/accounts");
          if (!res.ok) return;
          const data = await res.json();
          if (data.length > 0) {
            setGateSatisfied(true);
            if (gateIntervalRef.current) clearInterval(gateIntervalRef.current);
          }
        }, 1500);
      });

    return () => {
      cancelled = true;
      if (gateIntervalRef.current) clearInterval(gateIntervalRef.current);
    };
  }, [visible, step]);

  useEffect(() => {
    if (gateSatisfied) {
      const t = setTimeout(() => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1)), 1200);
      return () => clearTimeout(t);
    }
  }, [gateSatisfied]);

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

  function goNext() {
    if (stepIndex === STEPS.length - 1) finish();
    else setStepIndex((i) => i + 1);
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function skipGatedStep() {
    const targetIndex = STEPS.findIndex((s) => s.id === "transaction");
    setStepIndex(targetIndex === -1 ? stepIndex + 1 : targetIndex);
  }

  if (!loaded || !visible) return null;

  const isGated = step.gated === "account-created";
  const isLast = stepIndex === STEPS.length - 1;

  const cardContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === stepIndex ? "bg-gold" : "bg-lineSoft"}`} />
          ))}
        </div>
        <button onClick={finish} className="text-xs text-sage">
          Skip tutorial
        </button>
      </div>

      <div className="font-display text-lg text-paper mb-2">{step.title}</div>

      {isGated && gateSatisfied ? (
        <div className="text-sm text-gold flex items-center gap-1.5 mb-6">
          <i className="ti ti-check text-[14px]" aria-hidden="true" />
          Nice, you're set up.
        </div>
      ) : (
        <div className="text-sm text-sage leading-relaxed mb-6">{step.body}</div>
      )}

      {isGated && !gateSatisfied ? (
        <div className="flex items-center justify-between">
          <div className="text-xs text-sage flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Waiting for you to add one…
          </div>
          <button onClick={skipGatedStep} className="text-xs text-sage underline">
            I'll do this later
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          {stepIndex > 0 && (
            <button onClick={goBack} className="flex-1 text-center py-2.5 rounded-lg border border-line text-sage text-sm">
              Back
            </button>
          )}
          <button onClick={goNext} className="flex-[2] text-center py-2.5 rounded-lg bg-gold text-goldText text-sm">
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      )}
    </>
  );

  if (!rect) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
        <div className="w-full max-w-[380px] bg-panel rounded-card p-6">{cardContent}</div>
      </div>
    );
  }

  const pad = 6;
  const spotTop = rect.top - pad;
  const spotLeft = rect.left - pad;
  const spotRight = rect.right + pad;
  const spotBottom = rect.bottom + pad;
  const cardPos = computeCardPosition(rect);

  return (
    <>
      <div className="fixed left-0 right-0 top-0 bg-black/60 z-[70]" style={{ height: Math.max(0, spotTop) }} />
      <div
        className="fixed left-0 right-0 bottom-0 bg-black/60 z-[70]"
        style={{ top: spotBottom }}
      />
      <div
        className="fixed left-0 bg-black/60 z-[70]"
        style={{ top: spotTop, height: spotBottom - spotTop, width: Math.max(0, spotLeft) }}
      />
      <div
        className="fixed right-0 bg-black/60 z-[70]"
        style={{ top: spotTop, height: spotBottom - spotTop, left: spotRight }}
      />
      <div
        className="fixed rounded-lg pointer-events-none z-[75]"
        style={{
          top: spotTop,
          left: spotLeft,
          width: spotRight - spotLeft,
          height: spotBottom - spotTop,
          boxShadow: "0 0 0 2px #C99A4E, 0 0 22px 4px rgba(201,154,78,0.55)",
        }}
      />
      <div
        className="fixed bg-panel rounded-card p-6 z-[80]"
        style={{ top: cardPos.top, left: cardPos.left, width: CARD_WIDTH }}
      >
        {cardContent}
      </div>
    </>
  );
}
