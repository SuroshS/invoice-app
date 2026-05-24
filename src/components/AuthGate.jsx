import { useState } from "react";

// ── Change this to whatever password you want ──────────────────
const APP_PASSWORD = "coatcure143!";
// ──────────────────────────────────────────────────────────────

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
  max-width: 360px;
}
.auth-logo {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111;
  margin: 0 0 0.25rem;
}
.auth-sub {
  font-size: 0.8rem;
  color: #bbb;
  margin: 0 0 2rem;
}
.auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
}
.auth-field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.auth-field input {
  padding: 0.65rem 0.875rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  font-family: system-ui, sans-serif;
  transition: border 0.15s;
}
.auth-field input:focus { border-color: #111; }
.auth-submit {
  width: 100%;
  padding: 0.7rem;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  font-family: system-ui, sans-serif;
  transition: opacity 0.15s;
}
.auth-submit:hover { opacity: 0.85; }
.auth-submit:disabled { opacity: 0.4; cursor: not-allowed; }
.auth-error {
  background: #fff5f5;
  color: #c0392b;
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  font-size: 0.8rem;
  margin-bottom: 1rem;
}
`;

export default function AuthGate({ children }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem("app_unlocked") === "true"
  );

  if (unlocked) return children;

  function handleSubmit() {
    if (input === APP_PASSWORD) {
      sessionStorage.setItem("app_unlocked", "true");
      setUnlocked(true);
    } else {
      setError("Incorrect password.");
      setInput("");
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <>
      <style>{styles}</style>
      <div className="auth-wrap">
        <div className="auth-card">
          <p className="auth-logo">InvoicePro</p>
          <p className="auth-sub">Enter your password to continue</p>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="••••••••"
              autoFocus
            />
          </div>

          <button
            className="auth-submit"
            onClick={handleSubmit}
            disabled={!input}
          >
            Enter
          </button>
        </div>
      </div>
    </>
  );
}