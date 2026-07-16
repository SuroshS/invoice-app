import logo from "../assets/paivleblack.png";

const styles = `
.startup-wrap {
  min-height: 100vh;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
  gap: 20px;
}
.startup-logo { width: 140px; height: auto; }
.startup-spinner {
  width: 26px; height: 26px; border: 3px solid #ebebeb; border-top-color: #111;
  border-radius: 50%; animation: startupSpin 0.7s linear infinite;
}
@keyframes startupSpin { to { transform: rotate(360deg); } }
.startup-error { text-align: center; max-width: 340px; padding: 0 20px; }
.startup-error p { font-size: 0.85rem; color: #888; line-height: 1.6; margin: 10px 0 18px; }
.startup-retry {
  padding: 10px 22px; background: #111; color: #fff; border: none; border-radius: 8px;
  font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: system-ui;
}
.startup-retry:hover { opacity: 0.85; }
`;

// Full-screen branded screen shown for the entire startup window — session
// restore, subscription/settings/invoice fetch — so the app never renders a
// protected page on default/placeholder data. Also doubles as the recovery
// screen for startup failures (session restore or initial data fetch).
export default function StartupScreen({ error, onRetry }) {
  return (
    <>
      <style>{styles}</style>
      <div className="startup-wrap">
        <img src={logo} alt="Payvle" className="startup-logo" width={360} height={142} />
        {error ? (
          <div className="startup-error">
            <p>{error}</p>
            <button className="startup-retry" onClick={onRetry || (() => window.location.reload())}>
              Try again
            </button>
          </div>
        ) : (
          <div className="startup-spinner" />
        )}
      </div>
    </>
  );
}
