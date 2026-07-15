import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useApp } from "../context/AppContext";
import logo from "../assets/paivleblack.png";

export const CURRENT_TERMS_VERSION = "1.0";
export const CURRENT_PRIVACY_VERSION = "1.0";

const SESSION_PROMPT_KEY = "payvle_upgrade_prompt_shown";
const LAST_USER_KEY = "payvle_last_user_id";

const styles = `
.auth-wrap {
  min-height: 100vh;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
}
.upgrade-modal-logo {
  width: 150px;
  height: auto;
  display: block;
  margin: 0 auto 1rem;
}
.auth-card {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 14px;
  padding: 2.5rem;
  width: 100%;
  max-width: 380px;
}
.auth-logo {
  width: 140px;
  height: auto;
  display: block;
  margin: 0 auto 12px;
}
.auth-logo-wrap { text-align: center; margin-bottom: 8px; }
.auth-sub { font-size: 0.8rem; color: #bbb; margin: 0 0 2rem; text-align: center; }
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
.auth-error { background: #fff5f5; color: #c0392b; border-radius: 8px; padding: 0.625rem 0.875rem; font-size: 0.8rem; margin-bottom: 1rem; border: 1px solid #fde0e0; }
.auth-success { background: #f0faf5; color: #2a7a50; border-radius: 8px; padding: 0.625rem 0.875rem; font-size: 0.8rem; margin-bottom: 1rem; border: 1px solid #c3e6d8; }
.auth-info { background: #f0eefe; color: #533483; border-radius: 8px; padding: 0.625rem 0.875rem; font-size: 0.8rem; margin-bottom: 1rem; border: 1px solid #d4c8f8; }
.auth-toggle { text-align: center; margin-top: 1.25rem; font-size: 0.78rem; color: #bbb; }
.auth-toggle button { background: none; border: none; color: #111; font-weight: 600; cursor: pointer; font-size: 0.78rem; padding: 0; font-family: system-ui, sans-serif; text-decoration: underline; }
.trial-badge {
  display: flex; justify-content: center; align-items: center; gap: 8px;
  background: #533483; border-radius: 8px; padding: 0.625rem 0.875rem;
  font-size: 0.8rem; color: #ffffffff; margin-bottom: 1.5rem; text-align: center;
}
.trial-badge span { font-weight: 600; }
.auth-forgot { text-align: right; margin-top: -6px; margin-bottom: 12px; }
.auth-forgot button {
  background: none; border: none; color: #aaa; font-size: 0.75rem; cursor: pointer;
  font-family: system-ui; padding: 0; transition: color 0.15s;
}
.auth-forgot button:hover { color: #111; }

.auth-terms-row {
  display: flex; align-items: flex-start; gap: 9px; margin: 14px 0 6px;
  font-size: 0.78rem; color: #888; line-height: 1.5;
}
.auth-terms-row input[type="checkbox"] {
  margin-top: 2px; width: 15px; height: 15px; flex-shrink: 0;
  cursor: pointer; accent-color: #111;
}
.auth-terms-row label { cursor: pointer; }
.auth-terms-row a { color: #111; font-weight: 600; text-decoration: underline; }

/* ============ UPGRADE PROMPT MODAL ============ */
.upgrade-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 900;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  animation: upgradeOverlayIn 0.15s ease;
}
@keyframes upgradeOverlayIn { from { opacity: 0 } to { opacity: 1 } }
.upgrade-modal {
  background: #fff; border-radius: 16px; width: 100%; max-width: 400px;
  overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.18);
  animation: upgradeModalIn 0.2s ease;
}
@keyframes upgradeModalIn { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
.upgrade-modal-top { padding: 1.75rem 1.75rem 1.25rem; text-align: center; }
.upgrade-modal-title { font-size: 1.05rem; font-weight: 700; color: #111; margin: 0 0 6px; letter-spacing: -0.01em; }
.upgrade-modal-body { font-size: 0.82rem; color: #888; line-height: 1.6; margin: 0; }
.upgrade-modal-pricing { padding: 0 1.75rem 1.5rem; }
.upgrade-plan-toggle {
  display: flex; background: #f5f5f5; border-radius: 9px;
  padding: 3px; gap: 3px; margin-bottom: 1rem;
}
.upgrade-plan-btn {
  flex: 1; padding: 7px 10px; border: none; border-radius: 7px;
  background: transparent; font-size: 0.78rem; font-weight: 600;
  cursor: pointer; font-family: system-ui; color: #888; transition: all 0.15s;
}
.upgrade-plan-btn.active { background: #fff; color: #111; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.upgrade-save-badge {
  display: inline-block; background: #f0eefe; color: #533483;
  font-size: 0.58rem; font-weight: 700; padding: 2px 5px; border-radius: 4px;
  margin-left: 4px; vertical-align: middle; text-transform: uppercase; letter-spacing: 0.03em;
}
.upgrade-price-row { display: flex; align-items: baseline; justify-content: center; gap: 3px; margin-bottom: 3px; }
.upgrade-price-amount { font-size: 1.9rem; font-weight: 800; color: #111; letter-spacing: -0.02em; }
.upgrade-price-period { font-size: 0.82rem; font-weight: 500; color: #aaa; }
.upgrade-price-sub { text-align: center; font-size: 0.72rem; color: #bbb; margin-bottom: 1rem; }
.upgrade-modal-error { background: #fff5f5; color: #c0392b; border-radius: 7px; padding: 8px 12px; font-size: 0.78rem; margin-bottom: 10px; border: 1px solid #fde0e0; }
.upgrade-subscribe-btn {
  width: 100%; padding: 0.75rem; background: #111; color: #fff; border: none;
  border-radius: 9px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
  font-family: system-ui; transition: opacity 0.15s;
}
.upgrade-subscribe-btn:hover { opacity: 0.85; }
.upgrade-subscribe-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.upgrade-modal-footer {
  padding: 0.875rem 1.75rem; border-top: 1px solid #f5f5f5; background: #fafafa;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.upgrade-dismiss-btn {
  background: none; border: none; color: #bbb; font-size: 0.75rem;
  cursor: pointer; font-family: system-ui; text-decoration: underline; transition: color 0.15s;
}
.upgrade-dismiss-btn:hover { color: #888; }
.upgrade-data-note { font-size: 0.72rem; color: #aaa; text-align: right; line-height: 1.4; }
`;

const UPGRADE_FEATURES = [
  "Create new invoices and quotes",
  "Edit and update existing records",
  "Convert quotes to invoices",
  "Access your full revenue dashboard",
];

export default function AuthGate({ children }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);

  // Upgrade prompt state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Optimistic auth — only activate for the SAME user as last time.
  // If a different (or unknown) user opens the app, always show the login
  // form first. This prevents one user's data briefly flashing for another.
  const lastUserId = localStorage.getItem(LAST_USER_KEY);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) console.error("Auth session error:", error);

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthResolved(true);

      // Store the user ID (not just a boolean) so we can verify identity
      // on the next page load before showing any cached data.
      if (currentUser) {
        localStorage.setItem(LAST_USER_KEY, currentUser.id);
      } else {
        localStorage.removeItem(LAST_USER_KEY);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthResolved(true);
      if (currentUser) {
        localStorage.setItem(LAST_USER_KEY, currentUser.id);
      } else {
        localStorage.removeItem(LAST_USER_KEY);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function handleSubscribe() {
    setCheckoutError("");
    setCheckoutLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCheckoutError("Your session expired. Please sign in again.");
        setCheckoutLoading(false);
        return;
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ plan: selectedPlan }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.url) {
        if (json.error === "Not authenticated." || json.error?.includes("session")) {
          setCheckoutError("Your session has expired. Please sign out and sign back in, then try again.");
        } else {
          setCheckoutError(json.error || "Could not start checkout. Please try again.");
        }
        setCheckoutLoading(false);
        return;
      }
      window.location.href = json.url;
    } catch (e) {
      console.error("Checkout error:", e);
      setCheckoutError("Something went wrong. Please try again.");
      setCheckoutLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) { setError("Please enter your email address."); return; }
    setError(""); setSuccess(""); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { setError(error.message); } else { setSuccess("Check your email — we've sent you a password reset link."); }
    setLoading(false);
  }

  async function handleLogin() {
    setError(""); setSuccess(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Email not confirmed")) setError("Please confirm your email before signing in. Check your inbox for a confirmation link.");
      else if (error.message.includes("Invalid login credentials")) setError("Incorrect email or password. Please try again.");
      else setError(error.message);
    }
    setLoading(false);
  }

  async function handleSignup() {
    setError(""); setSuccess("");
    const trimmedFullName = fullName.trim();
    if (!trimmedFullName || !email || !password) { setError("Please fill in all fields."); return; }
    if (trimmedFullName.length < 2) { setError("Full name must be at least 2 characters."); return; }
    if (trimmedFullName.length > 100) { setError("Full name must be 100 characters or fewer."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!agreedToTerms) { setError("Please agree to the Terms & Conditions and Privacy Policy to continue."); return; }
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: trimmedFullName } },
    });
    if (error) {
      if (error.message.includes("already registered")) setError("An account with this email already exists. Try signing in instead.");
      else setError(error.message);
      setLoading(false);
      return;
    }
    const newUserId = signUpData?.user?.id;
    if (newUserId) {
      const { error: acceptError } = await supabase.from("settings").upsert(
        { user_id: newUserId, data: { fullName: trimmedFullName, termsAcceptedAt: new Date().toISOString(), policyVersions: { terms: CURRENT_TERMS_VERSION, privacy: CURRENT_PRIVACY_VERSION } }, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      if (acceptError) console.error("Recording terms acceptance failed (non-fatal):", acceptError);
    }
    setSuccess("Account created! Check your email to confirm your account, then sign in.");
    setPassword(""); setConfirmPassword(""); setAgreedToTerms(false); setFullName("");
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter") mode === "login" ? handleLogin() : handleSignup();
  }

  // Optimistic rendering rules:
  // - Before auth resolves: only show app shell if the SAME user was logged in last time
  //   (matched by stored user ID). New users and different users always see login first.
  // - After auth resolves: switch to real state immediately.
  const isSameReturningUser = !!lastUserId;
  const showApp = authResolved ? !!user : isSameReturningUser;

  if (showApp) {
    return (
      <>
        <style>{styles}</style>

        {showUpgradePrompt && (
          <div className="upgrade-overlay" onClick={() => setShowUpgradePrompt(false)}>
            <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
              <div className="upgrade-modal-top">
                <img src={logo} alt="Payvle" className="upgrade-modal-logo" width={360} height={142} />
                <h2 className="upgrade-modal-title">Subscribe to continue</h2>
                <p className="upgrade-modal-body">
                  Your free trial has ended. Subscribe to create and edit invoices — your existing records are safe and still accessible.
                </p>
              </div>

              <div className="upgrade-modal-pricing">
                <div className="upgrade-plan-toggle">
                  <button className={`upgrade-plan-btn${selectedPlan === "monthly" ? " active" : ""}`} onClick={() => setSelectedPlan("monthly")}>Monthly</button>
                  <button className={`upgrade-plan-btn${selectedPlan === "yearly" ? " active" : ""}`} onClick={() => setSelectedPlan("yearly")}>
                    Yearly <span className="upgrade-save-badge">Save 68%</span>
                  </button>
                </div>
                <div className="upgrade-price-row">
                  <span className="upgrade-price-amount">{selectedPlan === "monthly" ? "$12.99" : "$49.99"}</span>
                  <span className="upgrade-price-period">{selectedPlan === "monthly" ? "/month" : "/year"}</span>
                </div>
                <p className="upgrade-price-sub">
                  {selectedPlan === "monthly" ? "Billed monthly · cancel anytime" : "Just $4.17/month · cancel anytime"}
                </p>
                {checkoutError && <div className="upgrade-modal-error">⚠ {checkoutError}</div>}
                <button className="upgrade-subscribe-btn" onClick={handleSubscribe} disabled={checkoutLoading}>
                  {checkoutLoading ? "Redirecting to checkout..." : `Subscribe — ${selectedPlan === "monthly" ? "$12.99/mo" : "$49.99/yr"} →`}
                </button>
              </div>

              <div className="upgrade-modal-footer">
                <button className="upgrade-dismiss-btn" onClick={() => setShowUpgradePrompt(false)}>Not now</button>
                <span className="upgrade-data-note">Your data is safe and waiting</span>
              </div>
            </div>
          </div>
        )}

        <UpgradePromptController onShowPrompt={() => setShowUpgradePrompt(true)} />
        <UpgradePromptBridge setShow={setShowUpgradePrompt} />
        {children}
      </>
    );
  }

  if (mode === "forgot") {
    return (
      <>
        <style>{styles}</style>
        <div className="auth-wrap">
          <div className="auth-card">
            <div className="auth-logo-wrap"><img src={logo} alt="Paivle" className="auth-logo" width={360} height={142} /></div>
            <p className="auth-sub">Enter your email and we'll send you a reset link</p>
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}
            {!success && (
              <>
                <div className="auth-field">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleForgotPassword()} placeholder="you@example.com" autoFocus />
                </div>
                <button className="auth-submit" onClick={handleForgotPassword} disabled={!email || loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </>
            )}
            <div className="auth-toggle">
              <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>← Back to sign in</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo-wrap"><img src={logo} alt="Paivle" className="auth-logo" width={360} height={142} /></div>
          <p className="auth-sub">
            {mode === "login" ? "Sign in to continue" : "Create your account and start invoicing"}
          </p>
          {mode === "signup" && (
            <div className="trial-badge"><span>14 days free</span> — no credit card required</div>
          )}
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          {info && <div className="auth-info">{info}</div>}
          {mode === "signup" && (
            <div className="auth-field">
              <label>Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} onKeyDown={handleKey} placeholder="Jane Smith" autoFocus />
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} placeholder="you@example.com" autoFocus={mode !== "signup"} />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} placeholder="••••••••" />
          </div>
          {mode === "login" && (
            <div className="auth-forgot">
              <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}>Forgot password?</button>
            </div>
          )}
          {mode === "signup" && (
            <>
              <div className="auth-field">
                <label>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={handleKey} placeholder="••••••••" />
              </div>
              <div className="auth-terms-row">
                <input type="checkbox" id="terms-checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} />
                <label htmlFor="terms-checkbox">
                  I have read and agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </label>
              </div>
            </>
          )}
          <button
            className="auth-submit"
            onClick={mode === "login" ? handleLogin : handleSignup}
            disabled={!email || !password || loading || (mode === "signup" && !agreedToTerms)}
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account — Free"}
          </button>
          <div className="auth-toggle">
            {mode === "login" ? (
              <>Don't have an account?{" "}<button onClick={() => { setMode("signup"); setError(""); setSuccess(""); setInfo(""); }}>Sign up free</button></>
            ) : (
              <>Already have an account?{" "}<button onClick={() => { setMode("login"); setError(""); setSuccess(""); setInfo(""); }}>Sign in</button></>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function UpgradePromptController({ onShowPrompt }) {
  const { isReadOnly } = useApp();
  useEffect(() => {
    if (!isReadOnly) return;
    const alreadyShown = sessionStorage.getItem(SESSION_PROMPT_KEY);
    if (!alreadyShown) {
      const timer = setTimeout(() => {
        onShowPrompt();
        sessionStorage.setItem(SESSION_PROMPT_KEY, "1");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isReadOnly]);
  return null;
}

function UpgradePromptBridge({ setShow }) {
  useEffect(() => {
    window.__payvleShowUpgradePrompt = () => setShow(true);
    return () => { delete window.__payvleShowUpgradePrompt; };
  }, [setShow]);
  return null;
}