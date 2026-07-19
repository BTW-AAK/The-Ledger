"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteCode }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create your account.");
      }

      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error) {
        throw new Error("Account created, but sign-in failed. Try logging in directly.");
      }
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-[340px] bg-panel rounded-card p-6">
        <div className="font-display text-xl text-paper mb-1">Ledger</div>
        <div className="text-sm text-sage mb-6">Create your own account.</div>

        <div className="mb-3">
          <div className="text-[11px] text-sage tracking-wide mb-1.5">Name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold"
          />
        </div>

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

        <div className="mb-3">
          <div className="text-[11px] text-sage tracking-wide mb-1.5">Password</div>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold"
          />
          <div className="text-[11px] text-sage mt-1">At least 8 characters.</div>
        </div>

        <div className="mb-5">
          <div className="text-[11px] text-sage tracking-wide mb-1.5">Invite code</div>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Ask whoever shared this with you"
            className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper outline-none focus:border-gold"
          />
        </div>

        {error && <div className="text-xs text-[#F0C9BC] mb-3">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-gold text-goldText text-sm disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        <div className="text-center text-xs text-sage mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-gold">
            Sign in
          </a>
        </div>
      </form>
    </div>
  );
}
