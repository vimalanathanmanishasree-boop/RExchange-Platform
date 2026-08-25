import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";

type Step = "login" | "signup" | "otp";

export default function Auth() {
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.login(email, password);
      await refresh();
      navigate("/feed");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.signup(email, password, name);
      setDevOtp(res.devOtp);
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.verifyOtp(email, otp);
      await refresh();
      navigate("/feed");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="font-display text-4xl font-black mb-2">
        {step === "login" ? "Welcome back" : step === "signup" ? "Join the board" : "Verify your email"}
      </h1>
      <p className="text-sm text-ink/70 mb-6">
        {step === "otp"
          ? "We sent a 6-digit code to your inbox. Since this demo has no email provider wired up, the code is shown below (dev mode)."
          : "Restricted to whitelisted college email domains."}
      </p>

      {step === "login" && (
        <form onSubmit={handleLogin} className="card space-y-4">
          <div>
            <label className="label">College email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@greyfriars.edu" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-rust text-sm font-mono">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
          <button type="button" className="text-sm underline w-full text-center" onClick={() => setStep("signup")}>
            New here? Create an account
          </button>
        </form>
      )}

      {step === "signup" && (
        <form onSubmit={handleSignup} className="card space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">College email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@greyfriars.edu" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-rust text-sm font-mono">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
          <button type="button" className="text-sm underline w-full text-center" onClick={() => setStep("login")}>
            Already verified? Sign in
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleOtp} className="card space-y-4">
          {devOtp && (
            <div className="border-2 border-dashed border-gold bg-gold/10 p-3 font-mono text-sm">
              Dev mode OTP: <strong className="text-lg">{devOtp}</strong>
            </div>
          )}
          <div>
            <label className="label">6-digit code</label>
            <input className="input" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
          </div>
          {error && <p className="text-rust text-sm font-mono">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Verifying..." : "Verify & continue"}</button>
        </form>
      )}
    </div>
  );
}
