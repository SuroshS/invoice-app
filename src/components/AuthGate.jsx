import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import logo from "../assets/paivleblack.png";

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
.auth-logo {
  width: 140px;
  height: auto;
  display: block;
  margin: 0 auto 12px;
}
.auth-logo-wrap {
  text-align: center;
  margin-bottom: 8px;
}
.auth-sub {
  font-size: 0.8rem;
  color: #bbb;
  margin: 0 0 2rem;
  text-align: center;
}
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
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background: #f0eefe;
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  font-size: 0.8rem;
  color: #533483;
  margin-bottom: 1.5rem;
  text-align: center;
}
.trial-badge span { font-weight: 600; }
.auth-forgot {
  text-align: right;
  margin-top: -6px;
  margin-bottom: 12px;
}
.auth-forgot button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 0.75rem;
  cursor: pointer;
  font-family: system-ui;
  padding: 0;
  transition: color 0.15s;
}
.auth-forgot button:hover { color: #111; }
.auth-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f7f7f7; font-family: system-ui, sans-serif; color: #bbb; font-size: 0.875rem; }
`;

export default function AuthGate({ children }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Auth session error:", error);
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }

      setAuthLoading(false);
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleForgotPassword() {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Check your email — we've sent you a password reset link.");
    }

    setLoading(false);
  }

  async function handleLogin() {
    setError("");
    setSuccess("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setError("Please confirm your email before signing in. Check your inbox for a confirmation link.");
      } else if (error.message.includes("Invalid login credentials")) {
        setError("Incorrect email or password. Please try again.");
      } else {
        setError(error.message);
      }
    }

    setLoading(false);
  }

  async function handleSignup() {
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setError("An account with this email already exists. Try signing in instead.");
      } else {
        setError(error.message);
      }
    } else {
      setSuccess("Account created! Check your email to confirm your account, then sign in.");
      setPassword("");
      setConfirmPassword("");
    }

    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter") {
      mode === "login" ? handleLogin() : handleSignup();
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

  if (user) return children;

  if (mode === "forgot") {
    return (
      <>
        <style>{styles}</style>
        <div className="auth-wrap">
          <div className="auth-card">
            <div className="auth-logo-wrap">
              <img src={logo} alt="Paivle" className="auth-logo" />
            </div>

            <p className="auth-sub">Enter your email and we'll send you a reset link</p>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            {!success && (
              <>
                <div className="auth-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>

                <button
                  className="auth-submit"
                  onClick={handleForgotPassword}
                  disabled={!email || loading}
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </>
            )}

            <div className="auth-toggle">
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccess("");
                }}
              >
                ← Back to sign in
              </button>
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
          <div className="auth-logo-wrap">
            <img src={logo} alt="Paivle" className="auth-logo" />
          </div>

          <p className="auth-sub">
            {mode === "login"
              ? "Sign in to continue"
              : "Create your account and start invoicing"}
          </p>

          {mode === "signup" && (
            <div className="trial-badge">
              <span>14 days free</span> — no credit card required
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          {info && <div className="auth-info">{info}</div>}

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKey}
              placeholder="••••••••"
            />
          </div>

          {mode === "login" && (
            <div className="auth-forgot">
              <button
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setSuccess("");
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {mode === "signup" && (
            <div className="auth-field">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account — Free"}
          </button>

          <div className="auth-toggle">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setSuccess("");
                    setInfo("");
                  }}
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess("");
                    setInfo("");
                  }}
                >
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