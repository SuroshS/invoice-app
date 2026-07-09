import { Link } from "react-router-dom";
import logo from "../assets/paivleblack.png";

const styles = `
.policy-wrap {
  min-height: 100vh;
  background: #f7f7f7;
  font-family: system-ui, -apple-system, sans-serif;
  color: #111;
}

.policy-topbar {
  background: #fff;
  border-bottom: 1px solid #ebebeb;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.policy-logo { height: 28px; width: auto; }
.policy-back {
  font-size: 0.8rem;
  font-weight: 600;
  color: #888;
  text-decoration: none;
}
.policy-back:hover { color: #111; }

.policy-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}

.policy-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}

.policy-updated {
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 2rem;
}

.policy-body {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 14px;
  padding: 2rem;
  font-size: 0.92rem;
  line-height: 1.7;
  color: #333;
}

.policy-body h2 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #111;
  margin: 1.75rem 0 0.75rem;
}
.policy-body h2:first-child { margin-top: 0; }

.policy-body p { margin: 0 0 1rem; }
.policy-body ul, .policy-body ol { margin: 0 0 1rem; padding-left: 1.4rem; }
.policy-body li { margin-bottom: 0.4rem; }
.policy-body a { color: #111; font-weight: 600; text-decoration: underline; }

@media (max-width: 600px) {
  .policy-content { padding: 1.5rem 1rem 3rem; }
  .policy-body { padding: 1.25rem; }
  .policy-title { font-size: 1.25rem; }
}
`;

/**
 * Shared static-page layout for legal/policy documents.
 * Pass `title`, `lastUpdated`, and `children` (the actual policy content as JSX).
 * Sits outside AuthGate — accessible whether logged in or not, since people need
 * to read these before signing up too.
 */
export default function PolicyPage({ title, lastUpdated, children }) {
  return (
    <>
      <style>{styles}</style>
      <div className="policy-wrap">
        <div className="policy-topbar">
          <img src={logo} alt="Payvle" className="policy-logo" />
          <Link to="/" className="policy-back">← Back to Payvle</Link>
        </div>

        <div className="policy-content">
          <h1 className="policy-title">{title}</h1>
          {lastUpdated && (
            <p className="policy-updated">Last updated: {lastUpdated}</p>
          )}
          <div className="policy-body">{children}</div>
        </div>
      </div>
    </>
  );
}