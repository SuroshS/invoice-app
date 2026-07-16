import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session) {
        setValidLink(true);
      }

      setChecking(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setValidLink(true);
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleReset() {
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password updated successfully. You can now sign in.");
      setPassword("");
      setConfirm("");
    }

    setLoading(false);
  }

  const styles = `
    .rp-wrap { min-height: 100vh; background: #f7f7f7; display: flex; align-items: center; justify-content: center; font-family: system-ui; padding: 20px; }
    .rp-card { background: #fff; border: 1px solid #ebebeb; border-radius: 14px; padding: 2.5rem; width: 100%; max-width: 380px; }
    .rp-title { font-size: 1.1rem; font-weight: 600; color: #111; margin: 0 0 6px; }
    .rp-sub { font-size: 0.8rem; color: #bbb; margin: 0 0 1.5rem; }
    .rp-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
    .rp-field label { font-size: 0.72rem; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
    .rp-field input { padding: 10px 12px; border: 1px solid #e5e5e5; border-radius: 8px; font-size: 0.9rem; outline: none; font-family: system-ui; width: 100%; box-sizing: border-box; }
    .rp-field input:focus { border-color: #111; }
    .rp-btn { width: 100%; padding: 0.7rem; background: #111; color: #fff; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: system-ui; }
    .rp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .rp-error { background: #fff5f5; color: #c0392b; border: 1px solid #fde0e0; border-radius: 8px; padding: 10px 12px; font-size: 0.8rem; margin-bottom: 14px; }
    .rp-success { background: #f0faf5; color: #2a7a50; border: 1px solid #c3e6d8; border-radius: 8px; padding: 10px 12px; font-size: 0.8rem; margin-bottom: 14px; }
    .rp-invalid { text-align: center; color: #888; font-size: 0.875rem; }
    .rp-checking { text-align: center; color: #888; font-size: 0.875rem; }
  `;

  return (
    <>
      <style>{styles}</style>

      <div className="rp-wrap">
        <div className="rp-card">
          <h1 className="rp-title">Reset your password</h1>
          <p className="rp-sub">Enter a new password for your account</p>

          {error && <div className="rp-error">{error}</div>}

          {success && (
            <div className="rp-success">
              {success}
              <br />
              <a
                href="/"
                style={{
                  color: "#2a7a50",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                Go to sign in →
              </a>
            </div>
          )}

          {!success && checking && (
            <div className="rp-checking">
              <p>Checking reset link...</p>
            </div>
          )}

          {!success && !checking && !validLink && (
            <div className="rp-invalid">
              <p style={{ marginBottom: 12 }}>
                ⚠️ This link is invalid or has expired.
              </p>
              <a href="/" style={{ color: "#111", fontSize: "0.875rem" }}>
                ← Back to sign in
              </a>
            </div>
          )}

          {!success && !checking && validLink && (
            <>
              <div className="rp-field">
                <label>New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                />
              </div>

              <div className="rp-field">
                <label>Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                />
              </div>

              <button
                className="rp-btn"
                onClick={handleReset}
                disabled={loading || !password || !confirm}
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}