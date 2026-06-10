import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useApp } from "../context/AppContext";
import logo from "../assets/transparentbglogo.png";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "⊞" },
  { to: "/invoices", label: "Invoices", icon: "≡" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

const css = `
html,
body,
#root {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
  background: #f7f7f7;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.app-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  font-family: system-ui, sans-serif;
  background: #f7f7f7;
}

.app-sidebar {
  width: 240px;
  min-width: 240px;
  max-width: 240px;
  height: 100vh;
  background: #111;
  padding: 22px 16px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.app-logo-image {
  width: 115px;
  height: auto;
  display: block;
  margin: 0 0 30px 0;
}

.app-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-nav-link {
  color: #8a8a8a;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 11px 14px;
  border-radius: 9px;
  transition: all 0.15s;
  display: block;
  line-height: 1.2;
  white-space: nowrap;
}

.app-nav-link:hover {
  color: #fff;
  background: #1c1c1c;
}

.app-nav-link.active {
  color: #fff;
  background: #2a2a2a;
}

.app-sidebar-spacer {
  flex: 1;
}

.app-trial-badge {
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 18px;
  text-align: center;
}

.app-sidebar-user {
  border-top: 1px solid #2a2a2a;
  padding-top: 18px;
}

.app-signout-btn {
  background: transparent;
  border: 1px solid #2a2a2a;
  color: #888;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 0.82rem;
  cursor: pointer;
  text-align: left;
  width: 100%;
  font-family: system-ui;
  font-weight: 600;
  transition: all 0.15s;
}

.app-signout-btn:hover {
  color: #fff;
  border-color: #444;
}

.app-main {
  flex: 1;
  min-width: 0;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  background: #f7f7f7;
  padding: 32px;
}

.app-mobile-topbar {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: #111;
  z-index: 200;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
}

.app-mobile-logo-image {
  height: 26px;
  width: auto;
  display: block;
}

.app-mobile-trial-pill {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 6px;
}

.app-mobile-bottomnav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 62px;
  background: #111;
  border-top: 1px solid #1e1e1e;
  z-index: 200;
  align-items: stretch;
}

.app-bnav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  text-decoration: none;
  color: #555;
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: color 0.15s;
  border: none;
  background: none;
  cursor: pointer;
  font-family: system-ui;
  padding: 6px 0;
}

.app-bnav-item.active {
  color: #fff;
}

.app-bnav-icon {
  font-size: 20px;
  line-height: 1;
}

.app-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 400;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.app-sheet-overlay.open {
  opacity: 1;
  pointer-events: all;
}

.app-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 18px 18px 0 0;
  padding: 12px 20px 32px;
  z-index: 500;
  transform: translateY(100%);
  transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
}

.app-sheet.open {
  transform: translateY(0);
}

.app-sheet-handle {
  width: 36px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 99px;
  margin: 0 auto 20px;
}

.app-sheet-btn {
  width: 100%;
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  font-family: system-ui;
  border: none;
  text-align: left;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-sheet-signout {
  background: #fff5f5;
  color: #c0392b;
}

.app-sheet-cancel {
  background: #f5f5f5;
  color: #555;
}

@media (max-width: 768px) {
  .app-sidebar {
    display: none;
  }

  .app-mobile-topbar {
    display: flex;
  }

  .app-mobile-bottomnav {
    display: flex;
  }

  .app-layout {
    display: block;
    height: 100vh;
  }

  .app-main {
    width: 100%;
    height: calc(100vh - 52px);
    margin-top: 52px;
    padding: 16px 14px 80px;
  }
}
`;

export default function Layout() {
  const { signOut, daysLeft } = useApp();
  const [showSheet, setShowSheet] = useState(false);

  const showTrial = daysLeft > 0 && daysLeft <= 14;

  const trialColor =
    daysLeft <= 3
      ? { background: "#fde8e8", color: "#c0392b" }
      : daysLeft <= 7
      ? { background: "#fef6e4", color: "#a06b10" }
      : { background: "#f0eefe", color: "#533483" };

  return (
    <>
      <style>{css}</style>

      <div className="app-mobile-topbar">
        <img src={logo} alt="PAYVLE" className="app-mobile-logo-image" />

        {showTrial && (
          <span className="app-mobile-trial-pill" style={trialColor}>
            {daysLeft}d left in trial
          </span>
        )}
      </div>

      <div className="app-layout">
        <aside className="app-sidebar">
          <img src={logo} alt="PAYVLE" className="app-logo-image" />

          <nav className="app-nav">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `app-nav-link${isActive ? " active" : ""}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="app-sidebar-spacer" />

          {showTrial && (
            <div className="app-trial-badge" style={trialColor}>
              {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in trial
            </div>
          )}

          <div className="app-sidebar-user">
            <button className="app-signout-btn" onClick={signOut}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      <nav className="app-mobile-bottomnav">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `app-bnav-item${isActive ? " active" : ""}`
            }
          >
            <span className="app-bnav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}

        <button className="app-bnav-item" onClick={() => setShowSheet(true)}>
          <span className="app-bnav-icon">···</span>
          More
        </button>
      </nav>

      <div
        className={`app-sheet-overlay${showSheet ? " open" : ""}`}
        onClick={() => setShowSheet(false)}
      />

      <div className={`app-sheet${showSheet ? " open" : ""}`}>
        <div className="app-sheet-handle" />

        {showTrial && (
          <div
            style={{
              ...trialColor,
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: "0.85rem",
              fontWeight: 500,
              marginBottom: 14,
              textAlign: "center",
            }}
          >
            {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in your free trial
          </div>
        )}

        <button
          className="app-sheet-btn app-sheet-signout"
          onClick={() => {
            setShowSheet(false);
            signOut();
          }}
        >
          🚪 Sign out
        </button>

        <button
          className="app-sheet-btn app-sheet-cancel"
          onClick={() => setShowSheet(false)}
        >
          Cancel
        </button>
      </div>
    </>
  );
}