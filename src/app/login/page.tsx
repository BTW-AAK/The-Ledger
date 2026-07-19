"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[340px] bg-panel rounded-card p-6"
      >
        <div className="font-display text-xl text-paper mb-1">Ledger</div>
        <div className="text-sm text-sage mb-6">Sign in to your books.</div>

        <div className="mb-3">
          <div className="text-[11px] text-sage tracking-wide mb-1.5">Email</div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold"
          />
        </div>

        <div className="mb-5">
          <div className="text-[11px] text-sage tracking-wide mb-1.5">Password</div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold"
          />
        </div>

        {error && <div className="text-xs text-[#F0C9BC] mb-3">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-gold text-goldText text-sm disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="text-center text-xs text-sage mt-4">
          New here?{" "}
          <a href="/signup" className="text-gold">
            Create an account
          </a>
        </div>
      </form>
    </div>
  );
}
