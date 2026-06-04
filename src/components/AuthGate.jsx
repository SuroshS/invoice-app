import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const styles = `
.auth-wrap {
  min-height: 100vh;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
}
.auth-card {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 14px;
  padding: 2.5rem;
  width: 100%;
  max-width: 380px;
}
.auth-logo { font-size: 1.1rem; font-weight: 600; color: #111; margin: 0 0 0.25rem; }
.auth-sub { font-size: 0.8rem; color: #bbb; margin: 0 0 2rem; }
.auth-field { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; }
.auth-field label { font-size: 0.75rem; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
.auth-field input {
  padding: 0.65rem 0.875rem; border: 1px solid #e5e5e5; border-radius: 8px;
  font-size: 0.9rem; outline: none; font-family: system-ui, sans-serif; transition: border 0.15s;
  width: 100%; box-sizing: border-box;
}
.auth-field input:focus { border-color: #111; }
.auth-submit {
  width: 100%; padding: 0.7rem; background: #111; color: #fff; border: none;
  border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
  margin-top: 0.5rem; font-family: system-ui, sans-serif; transition: opacity 0.15s;
}
.auth-submit:hover { opacity: 0.85; }
.auth-submit:disabled { opacity: 0.4; cursor: not-allowed; }
.auth-error { background: #fff5f5; color: #c0392b; border-radius: 8px; padding: 0.625rem 0.875rem; font-size: 0.8rem; margin-bottom: 1rem; }
.auth-success { background: #f0faf5; color: #2a7a50; border-radius: 8px; padding: 0.625rem 0.875rem; font-size: 0.8rem; margin-bottom: 1rem; }
.auth-toggle { text-align: center; margin-top: 1.25rem; font-size: 0.78rem; color: #bbb; }
.auth-toggle button { background: none; border: none; color: #111; font-weight: 600; cursor: pointer; font-size: 0.78rem; padding: 0; font-family: system-ui, sans-serif; text-decoration: underline; }
.trial-badge { display: flex; align-items: center; gap: 8px; background: #f0eefe; border-radius: 8px; padding: 0.625rem 0.875rem; font-size: 0.8rem; color: #533483; margin-bottom: 1.5rem; }
.trial-badge span { font-weight: 600; }
.auth-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f7f7f7; font-family: system-ui, sans-serif; color: #bbb; font-size: 0.875rem; }
.paywall-wrap { min-height: 100vh; background: #f7f7f7; display: flex; align-items: center; justify-content: center; font-family: system-ui, sans-serif; }
.paywall-card { background: #fff; border: 1px solid #ebebeb; border-radius: 14px; padding: 2.5rem; width: 100%; max-width: 420px; text-align: center; }
.paywall-icon { font-size: 2.5rem; margin-bottom: 1rem; }
.paywall-card h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
.paywall-card p { font-size: 0.875rem; color: #888; margin-bottom: 2rem; line-height: 1.6; }
.paywall-plans { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.5rem; }
.paywall-plan { border: 1px solid #ebebeb; border-radius: 10px; padding: 1.25rem; cursor: pointer; transition: all 0.2s; text-align: left; background: #fff; }
.paywall-plan:hover { border-color: #111; }
.paywall-plan.selected { border-color: #533483; background: #f0eefe; }
.paywall-plan .plan-name { font-size: 0.78rem; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.paywall-plan.selected .plan-name { color: #533483; }
.paywall-plan .plan-price { font-size: 1.4rem; font-weight: 600; color: #111; line-height: 1; margin-bottom: 3px; }
.paywall-plan .plan-period { font-size: 0.72rem; color: #aaa; }
.paywall-plan .plan-save { font-size: 0.7rem; color: #533483; font-weight: 500; margin-top: 4px; }
.paywall-btn { width: 100%; padding: 0.75rem; background: #111; color: #fff; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: system-ui, sans-serif; transition: opacity 0.15s; margin-bottom: 0.75rem; }
.paywall-btn:hover { opacity: 0.85; }
.paywall-signout { background: none; border: none; color: #bbb; font-size: 0.78rem; cursor: pointer; font-family: system-ui, sans-serif; text-decoration: underline; }
`;

export default function AuthGate({ children }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [daysLeft, setDaysLeft] = useState(14);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkTrial(session.user);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkTrial(session.user);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function checkTrial(user) {
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const diffDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    const remaining = 14 - diffDays;
    setDaysLeft(Math.max(0, remaining));

    // Check if user has active subscription in settings
    const { data: settingsRow } = await supabase
      .from("settings")
      .select("data")
      .eq("user_id", user.id)
      .single();

    const hasPaid = settingsRow?.data?.subscriptionActive === true;
    if (!hasPaid && diffDays >= 14) {
      setTrialExpired(true);
    }
  }

  if (authLoading) {
    return (
      <>
        <style>{styles}</style>
        <div className="auth-loading">Loading...</div>
      </>
    );
  }

  // Show paywall if trial expired
  if (user && trialExpired) {
    return (
      <>
        <style>{styles}</style>
        <div className="paywall-wrap">
          <div className="paywall-card">
            <div className="paywall-icon">⏰</div>
            <h2>Your free trial has ended</h2>
            <p>You've had 14 days free. Choose a plan to keep sending invoices and growing your business.</p>
            <div className="paywall-plans">
              <div className={`paywall-plan ${selectedPlan === 'monthly' ? 'selected' : ''}`} onClick={() => setSelectedPlan('monthly')}>
                <div className="plan-name">Monthly</div>
                <div className="plan-price">$13.99</div>
                <div className="plan-period">per month</div>
              </div>
              <div className={`paywall-plan ${selectedPlan === 'yearly' ? 'selected' : ''}`} onClick={() => setSelectedPlan('yearly')}>
                <div className="plan-name">Yearly</div>
                <div className="plan-price">$69.99</div>
                <div className="plan-period">per year</div>
                <div className="plan-save">Save $97 — 5 months free</div>
              </div>
            </div>
            <button className="paywall-btn">Continue with {selectedPlan === 'yearly' ? '$69.99/year' : '$13.99/month'} →</button>
            <br />
            <button className="paywall-signout" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </div>
      </>
    );
  }

  // Logged in and trial active
  if (user) return children;

  async function handleLogin() {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleSignup() {
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Account created! You have 14 days free. Signing you in...");
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter") mode === "login" ? handleLogin() : handleSignup();
  }

  return (
    <>
      <style>{styles}</style>
      <div className="auth-wrap">
        <div className="auth-card">
          <p className="auth-logo">InvoicePro</p>
          <p className="auth-sub">{mode === "login" ? "Sign in to your account" : "Create your account"}</p>

          {mode === "signup" && (
            <div className="trial-badge">
              🎉 <span>14 days free</span> — no credit card required
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKey}
              placeholder="you@example.com"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKey}
              placeholder="••••••••"
            />
          </div>

          {mode === "signup" && (
            <div className="auth-field">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={handleKey}
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            className="auth-submit"
            onClick={mode === "login" ? handleLogin : handleSignup}
            disabled={!email || !password || loading}
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account — Free"}
          </button>

          <div className="auth-toggle">
            {mode === "login" ? (
              <>Don't have an account?{" "}
                <button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}>
                  Sign up free
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}