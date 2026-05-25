import { useState } from "react";
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
  max-width: 360px;
}
.auth-logo { font-size: 1.1rem; font-weight: 600; color: #111; margin: 0 0 0.25rem; }
.auth-sub { font-size: 0.8rem; color: #bbb; margin: 0 0 2rem; }
.auth-field { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; }
.auth-field label { font-size: 0.75rem; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
.auth-field input {
  padding: 0.65rem 0.875rem; border: 1px solid #e5e5e5; border-radius: 8px;
  font-size: 0.9rem; outline: none; font-family: system-ui, sans-serif; transition: border 0.15s;
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
`;

export default function AuthGate({ children }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const stored = sessionStorage.getItem("app_user");
  const [currentUser, setCurrentUser] = useState(stored ? JSON.parse(stored) : null);

  if (currentUser) return children;

  async function handleSubmit() {
    setError("");
    setLoading(true);

    const { data, error: fetchError } = await supabase
      .from("users")
      .select("id, username, password")
      .eq("username", username.trim().toLowerCase())
      .single();

    if (fetchError || !data || data.password !== password) {
      setError("Incorrect username or password.");
      setPassword("");
      setLoading(false);
      return;
    }

    const user = { username: data.username, userId: data.id };
    sessionStorage.setItem("app_user", JSON.stringify(user));
    window.dispatchEvent(new Event("storage"));
    setCurrentUser(user);
    setLoading(false);
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
          <p className="auth-sub">Sign in to continue</p>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKey}
              placeholder="your username"
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

          <button
            className="auth-submit"
            onClick={handleSubmit}
            disabled={!username || !password || loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </>
  );
}