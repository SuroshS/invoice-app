import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useApp } from "../context/AppContext";

const NAV_ITEMS = [
  { to: "/",         label: "Dashboard", icon: "⊞" },
  { to: "/create",   label: "Create",    icon: "+" },
  { to: "/invoices", label: "Invoices",  icon: "≡" },
  { to: "/settings", label: "Settings",  icon: "⚙" },
];

const css = `
  .layout-container {
    display: flex;
    height: 100vh;
    width: 100vw;
    font-family: system-ui;
    overflow: hidden;
    position: fixed;
    top: 0; left: 0;
  }

  /* SIDEBAR — desktop */
  .layout-sidebar {
    width: 220px;
    height: 100%;
    background: #111;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }
  .sidebar-logo {
    margin: 0 0 24px;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.01em;
  }
  .sidebar-link {
    color: #888;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
    padding: 8px 12px;
    border-radius: 8px;
    transition: all 0.15s;
    display: block;
  }
  .sidebar-link:hover { color: #fff; }
  .sidebar-link.active { color: #fff; background: #2a2a2a; }
  .sidebar-spacer { flex: 1; }
  .trial-badge {
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 0.75rem;
    font-weight: 500;
    margin-bottom: 8px;
    text-align: center;
  }
  .sidebar-user {
    border-top: 1px solid #2a2a2a;
    padding-top: 16px;
  }
  .signout-btn {
    background: none;
    border: 1px solid #2a2a2a;
    color: #888;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 0.8rem;
    cursor: pointer;
    text-align: left;
    width: 100%;
    font-family: system-ui;
    transition: all 0.15s;
  }
  .signout-btn:hover { color: #fff; border-color: #444; }

  /* MAIN */
  .layout-main {
    flex: 1;
    height: 100%;
    overflow-y: auto;
    background: #f7f7f7;
    padding: 30px;
  }

  /* MOBILE TOP BAR */
  .mobile-topbar {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 52px;
    background: #111;
    z-index: 200;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px;
  }
  .mobile-logo {
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.01em;
  }
  .mobile-trial-pill {
    font-size: 0.7rem;
    font-weight: 500;
    padding: 3px 9px;
    border-radius: 6px;
  }

  /* MOBILE BOTTOM NAV */
  .mobile-bottomnav {
    display: none;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 62px;
    background: #111;
    border-top: 1px solid #1e1e1e;
    z-index: 200;
    align-items: stretch;
  }
  .bnav-item {
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
  .bnav-item.active { color: #fff; }
  .bnav-item:hover { color: #aaa; }
  .bnav-icon { font-size: 20px; line-height: 1; }

  /* BOTTOM SHEET */
  .sheet-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 400;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }
  .sheet-overlay.open {
    opacity: 1;
    pointer-events: all;
  }
  .sheet {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: #fff;
    border-radius: 18px 18px 0 0;
    padding: 12px 20px 32px;
    z-index: 500;
    transform: translateY(100%);
    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  .sheet.open { transform: translateY(0); }
  .sheet-handle {
    width: 36px; height: 4px; background: #e0e0e0;
    border-radius: 99px; margin: 0 auto 20px;
  }
  .sheet-btn {
    width: 100%; padding: 14px 16px;
    border-radius: 10px; font-size: 0.9rem;
    font-weight: 500; cursor: pointer;
    font-family: system-ui; border: none;
    text-align: left; margin-bottom: 8px;
    display: flex; align-items: center; gap: 10px;
  }
  .sheet-signout { background: #fff5f5; color: #c0392b; }
  .sheet-cancel { background: #f5f5f5; color: #555; }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .layout-sidebar { display: none; }
    .mobile-topbar { display: flex; }
    .mobile-bottomnav { display: flex; }
    .layout-main {
      padding: 16px 14px 80px;
      margin-top: 52px;
      height: calc(100vh - 52px);
    }
  }
`;

export default function Layout() {
  const { signOut, daysLeft } = useApp();
  const [showSheet, setShowSheet] = useState(false);

  const showTrial = daysLeft > 0 && daysLeft <= 14;
  const trialColor = daysLeft <= 3
    ? { background: "#fde8e8", color: "#c0392b" }
    : daysLeft <= 7
    ? { background: "#fef6e4", color: "#a06b10" }
    : { background: "#f0eefe", color: "#533483" };

  return (
    <>
      <style>{css}</style>

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <span className="mobile-logo">PAYVLE</span>
        {showTrial && (
          <span className="mobile-trial-pill" style={trialColor}>
            {daysLeft}d left in trial
          </span>
        )}
      </div>

      <div className="layout-container">

        {/* Desktop sidebar */}
        <aside className="layout-sidebar">
          <h2 className="sidebar-logo">PAYVLE</h2>
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              {label}
            </NavLink>
          ))}
          <div className="sidebar-spacer" />
          {showTrial && (
            <div className="trial-badge" style={trialColor}>
              {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in trial
            </div>
          )}
          <div className="sidebar-user">
            <button className="signout-btn" onClick={signOut}>Sign out</button>
          </div>
        </aside>

        {/* Main */}
        <main className="layout-main">
          <Outlet />
        </main>

      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottomnav">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `bnav-item${isActive ? " active" : ""}`}
          >
            <span className="bnav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
        <button className="bnav-item" onClick={() => setShowSheet(true)}>
          <span className="bnav-icon">···</span>
          More
        </button>
      </nav>

      {/* Bottom sheet */}
      <div className={`sheet-overlay${showSheet ? " open" : ""}`} onClick={() => setShowSheet(false)} />
      <div className={`sheet${showSheet ? " open" : ""}`}>
        <div className="sheet-handle" />
        {showTrial && (
          <div style={{ ...trialColor, borderRadius: 10, padding: "10px 14px", fontSize: "0.85rem", fontWeight: 500, marginBottom: 14, textAlign: "center" }}>
            {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in your free trial
          </div>
        )}
        <button className="sheet-btn sheet-signout" onClick={() => { setShowSheet(false); signOut(); }}>
          🚪 Sign out
        </button>
        <button className="sheet-btn sheet-cancel" onClick={() => setShowSheet(false)}>
          Cancel
        </button>
      </div>
    </>
  );
}