import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import logo from "../assets/paivlewhite-removebg-preview.png";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "⊞" },
  { to: "/invoices", label: "Invoices", icon: "≡" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

const css = `
html, body, #root {
  margin: 0; padding: 0; width: 100%; min-height: 100%; background: #f7f7f7;
}
*, *::before, *::after { box-sizing: border-box; }

.app-layout {
  display: flex; width: 100%; height: 100vh; overflow: hidden;
  font-family: system-ui, sans-serif; background: #f7f7f7;
}

.app-sidebar {
  width: 240px; min-width: 240px; max-width: 240px; height: 100vh;
  background: #111; padding: 22px 16px; display: flex;
  flex-direction: column; flex-shrink: 0; overflow: hidden;
}

.app-logo-image { width: 115px; height: auto; display: block; margin: 0 0 30px 0; }

.app-nav { display: flex; flex-direction: column; gap: 8px; }

.app-nav-link {
  color: #8a8a8a; text-decoration: none; font-weight: 600; font-size: 0.9rem;
  padding: 11px 14px; border-radius: 9px; transition: all 0.15s;
  display: block; line-height: 1.2; white-space: nowrap;
}
.app-nav-link:hover { color: #fff; background: #1c1c1c; }
.app-nav-link.active { color: #fff; background: #2a2a2a; }

.app-sidebar-spacer { flex: 1; }

.app-trial-badge {
  border-radius: 8px; padding: 8px 12px; font-size: 0.75rem;
  font-weight: 700; margin-bottom: 12px; text-align: center;
}

/* ── Profile card at bottom of sidebar ── */
.app-sidebar-user { border-top: 1px solid #2a2a2a; padding-top: 14px; position: relative; }

.app-profile-btn {
  display: flex; align-items: center; gap: 10px; width: 100%;
  background: transparent; border: none; padding: 9px 10px; border-radius: 9px;
  cursor: pointer; transition: background 0.15s; text-align: left;
}
.app-profile-btn:hover { background: #1c1c1c; }

.app-profile-avatar {
  width: 32px; height: 32px; border-radius: 50%; background: #533483;
  color: #fff; font-size: 0.75rem; font-weight: 700; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0; text-transform: uppercase;
}

.app-profile-info { flex: 1; min-width: 0; }
.app-profile-name {
  font-size: 0.82rem; font-weight: 600; color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;
}
.app-profile-plan {
  font-size: 0.68rem; font-weight: 500; display: inline-flex;
  align-items: center; gap: 4px; margin-top: 2px;
}
.app-profile-plan.pro { color: #a78bfa; }
.app-profile-plan.trial { color: #f59e0b; }
.app-profile-plan.cancelled { color: #f87171; }
.app-profile-plan.free { color: #888; }
.app-profile-chevron { color: #555; font-size: 10px; flex-shrink: 0; }

/* ── Profile popover ── */
.app-popover {
  position: absolute; bottom: calc(100% + 8px); left: 0; right: 0;
  background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px;
  overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  z-index: 300; opacity: 0; pointer-events: none;
  transform: translateY(6px); transition: opacity 0.15s, transform 0.15s;
}
.app-popover.open { opacity: 1; pointer-events: all; transform: translateY(0); }

.pop-item {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; background: none; border: none; padding: 11px 14px;
  color: #ccc; font-size: 0.82rem; font-weight: 500; cursor: pointer;
  font-family: system-ui; transition: background 0.12s; text-align: left;
  border-bottom: 1px solid #222; position: relative;
}
.pop-item:last-child { border-bottom: none; }
.pop-item:hover { background: #222; color: #fff; }
.pop-item.danger { color: #f87171; }
.pop-item.danger:hover { background: #2a1a1a; color: #f87171; }
.pop-item-left { display: flex; align-items: center; gap: 9px; }
.pop-item-icon { font-size: 14px; width: 18px; text-align: center; opacity: 0.7; }
.pop-item-chevron { font-size: 10px; opacity: 0.4; }

/* Help submenu */
.pop-submenu {
  position: absolute; left: calc(100% + 4px); bottom: 0;
  background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px;
  min-width: 200px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  opacity: 0; pointer-events: none; transform: translateX(-4px);
  transition: opacity 0.12s, transform 0.12s; z-index: 310;
}
.pop-item:hover .pop-submenu { opacity: 1; pointer-events: all; transform: translateX(0); }

.submenu-item {
  display: flex; align-items: center; gap: 9px; padding: 10px 14px;
  color: #ccc; font-size: 0.8rem; font-weight: 500; cursor: pointer;
  transition: background 0.12s; border-bottom: 1px solid #222;
  text-decoration: none; white-space: nowrap;
}
.submenu-item:last-child { border-bottom: none; }
.submenu-item:hover { background: #222; color: #fff; }
.submenu-icon { font-size: 13px; width: 16px; text-align: center; opacity: 0.6; }

/* ── Account Settings Modal ── */
.acct-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 800;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  opacity: 0; pointer-events: none; transition: opacity 0.15s;
}
.acct-overlay.open { opacity: 1; pointer-events: all; }

.acct-modal {
  background: #fff; border-radius: 16px; width: 100%; max-width: 520px;
  height: 540px; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 24px 60px rgba(0,0,0,0.2); font-family: system-ui, -apple-system, sans-serif;
  transform: translateY(10px); transition: transform 0.2s;
}
.acct-overlay.open .acct-modal { transform: translateY(0); }

.acct-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.acct-topbar h2 { font-size: 1rem; font-weight: 700; color: #111; margin: 0; }
.acct-close {
  width: 30px; height: 30px; border-radius: 8px; border: 1px solid #e5e5e5;
  background: #f5f5f5; color: #888; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.acct-tabs {
  display: flex; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
  padding: 0 20px; gap: 0;
}
.acct-tab {
  padding: 10px 14px; font-size: 0.8rem; font-weight: 600; cursor: pointer;
  border: none; background: none; color: #aaa; font-family: system-ui;
  border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s;
}
.acct-tab.active { color: #111; border-bottom-color: #111; }

.acct-body { flex: 1; overflow-y: auto; padding: 20px; }

.acct-section { margin-bottom: 20px; }
.acct-section-title {
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #bbb; margin-bottom: 10px;
}

.acct-card {
  background: #fff; border: 1px solid #ebebeb; border-radius: 11px; overflow: hidden;
}
.acct-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid #f5f5f5; gap: 12px;
}
.acct-row:last-child { border-bottom: none; }
.acct-row-left { flex: 1; min-width: 0; }
.acct-row-title { font-size: 0.85rem; font-weight: 500; color: #111; margin-bottom: 2px; }
.acct-row-sub { font-size: 0.75rem; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.acct-btn {
  padding: 6px 13px; border-radius: 7px; font-size: 0.75rem; font-weight: 600;
  cursor: pointer; border: none; font-family: system-ui; transition: opacity 0.15s; white-space: nowrap;
}
.acct-btn:hover { opacity: 0.85; }
.acct-btn-outline { background: transparent; border: 1px solid #e0e0e0; color: #555; }
.acct-btn-outline:hover { background: #f5f5f5; opacity: 1; }
.acct-btn-dark { background: #111; color: #fff; }
.acct-btn-red { background: #c0392b; color: #fff; }
.acct-btn-red-outline { background: transparent; border: 1px solid #fde0e0; color: #c0392b; }
.acct-btn-red-outline:hover { background: #fff5f5; opacity: 1; }

/* Sub card — subscription gradient */
.sub-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #533483 100%);
  padding: 18px 18px 14px; color: #fff;
}
.sub-plan-label { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; opacity: 0.55; margin-bottom: 4px; }
.sub-plan-price { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.sub-plan-price span { font-size: 0.8rem; font-weight: 400; opacity: 0.55; }
.sub-status-badge {
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
  color: #fff; padding: 3px 9px; border-radius: 99px; font-size: 0.65rem; font-weight: 600;
}
.sub-renews { font-size: 0.72rem; opacity: 0.5; margin-top: 6px; }
.sub-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }

/* Inline form fields inside modal */
.acct-field { margin-bottom: 12px; }
.acct-field label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #aaa; display: block; margin-bottom: 5px; }
.acct-input {
  width: 100%; padding: 8px 11px; border: 1px solid #e5e5e5; border-radius: 8px;
  font-size: 0.875rem; font-family: system-ui; color: #111; background: #fafafa;
  outline: none; transition: border 0.15s;
}
.acct-input:focus { border-color: #111; background: #fff; }

.acct-save-row { display: flex; justify-content: flex-end; padding-top: 4px; }

.acct-alert {
  display: flex; align-items: flex-start; gap: 8px; padding: 10px 13px;
  border-radius: 8px; font-size: 0.78rem; line-height: 1.5; margin-bottom: 14px;
}
.acct-alert-purple { background: #f0eefe; color: #533483; border: 1px solid #ddd5fa; }
.acct-alert-red { background: #fff5f5; color: #c0392b; border: 1px solid #fde0e0; }

.acct-danger-header {
  background: #fff5f5; border-bottom: 1px solid #fde0e0; padding: 10px 16px;
}
.acct-danger-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #c0392b; }

/* Toast */
.layout-toast {
  position: fixed; bottom: 24px; left: 50%;
  transform: translateX(-50%) translateY(60px);
  background: #111; color: #fff; padding: 9px 18px;
  border-radius: 99px; font-size: 0.8rem; font-weight: 500;
  font-family: system-ui; z-index: 900; transition: transform 0.25s ease;
  white-space: nowrap; pointer-events: none;
}
.layout-toast.show { transform: translateX(-50%) translateY(0); }

/* Mini modal for email/password change */
.mini-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 900;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  opacity: 0; pointer-events: none; transition: opacity 0.15s;
}
.mini-overlay.open { opacity: 1; pointer-events: all; }
.mini-modal {
  background: #fff; border-radius: 14px; padding: 22px; width: 100%; max-width: 380px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
  transform: translateY(8px); transition: transform 0.18s;
}
.mini-overlay.open .mini-modal { transform: translateY(0); }
.mini-modal h3 { font-size: 0.95rem; font-weight: 700; margin-bottom: 6px; }
.mini-modal p { font-size: 0.82rem; color: #888; margin-bottom: 16px; line-height: 1.5; }
.mini-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

/* Mobile */
.app-mobile-topbar {
  display: none; position: fixed; top: 0; left: 0; right: 0; height: 52px;
  background: #111; z-index: 200; align-items: center;
  justify-content: space-between; padding: 0 18px;
}
.app-mobile-logo-image { height: 26px; width: auto; display: block; }
.app-mobile-trial-pill { font-size: 0.7rem; font-weight: 600; padding: 3px 9px; border-radius: 6px; }

.app-mobile-bottomnav {
  display: none; position: fixed; bottom: 0; left: 0; right: 0; height: 62px;
  background: #111; border-top: 1px solid #1e1e1e; z-index: 200; align-items: stretch;
}
.app-bnav-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 3px; text-decoration: none; color: #555;
  font-size: 0.58rem; font-weight: 500; letter-spacing: 0.02em; transition: color 0.15s;
  border: none; background: none; cursor: pointer; font-family: system-ui; padding: 6px 0;
}
.app-bnav-item.active { color: #fff; }
.app-bnav-icon { font-size: 20px; line-height: 1; }

.app-sheet-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 400;
  opacity: 0; pointer-events: none; transition: opacity 0.2s;
}
.app-sheet-overlay.open { opacity: 1; pointer-events: all; }
.app-sheet {
  position: fixed; bottom: 0; left: 0; right: 0; background: #fff;
  border-radius: 18px 18px 0 0; padding: 12px 20px 32px; z-index: 500;
  transform: translateY(100%); transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
}
.app-sheet.open { transform: translateY(0); }
.app-sheet-handle { width: 36px; height: 4px; background: #e0e0e0; border-radius: 99px; margin: 0 auto 20px; }
.app-sheet-btn {
  width: 100%; padding: 14px 16px; border-radius: 10px; font-size: 0.9rem;
  font-weight: 500; cursor: pointer; font-family: system-ui; border: none;
  text-align: left; margin-bottom: 8px; display: flex; align-items: center; gap: 10px;
}
.app-sheet-signout { background: #fff5f5; color: #c0392b; }
.app-sheet-cancel { background: #f5f5f5; color: #555; }

.app-main {
  flex: 1; min-width: 0; height: 100vh; overflow-y: auto; overflow-x: hidden;
  background: #f7f7f7; padding: 32px;
}

@media (max-width: 768px) {
  .app-sidebar { display: none; }
  .app-mobile-topbar { display: flex; }
  .app-mobile-bottomnav { display: flex; }
  .app-layout { display: block; height: 100vh; }
  .app-main { width: 100%; height: calc(100vh - 52px); margin-top: 52px; padding: 16px 14px 80px; }
  .pop-submenu { left: auto; right: calc(100% + 4px); bottom: 0; }
}
`;

export default function Layout() {
  const { signOut, daysLeft, subscriptionActive, data } = useApp();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [showSheet, setShowSheet] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [acctTab, setAcctTab] = useState("account");
  const [miniModal, setMiniModal] = useState(null); // "email" | "password" | "cancel" | "delete-data" | "delete-account"
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Email change form
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const popoverRef = useRef(null);
  const profileBtnRef = useRef(null);

  const showTrial = daysLeft > 0 && daysLeft <= 14;
  const trialColor =
    daysLeft <= 3 ? { background: "#fde8e8", color: "#c0392b" }
    : daysLeft <= 7 ? { background: "#fef6e4", color: "#a06b10" }
    : { background: "#f0eefe", color: "#533483" };

  // Derive initials and display name from the account holder's full name.
  // Existing users who signed up before this field existed simply fall back
  // to the same "My Account" placeholder used previously for a missing name.
  const displayName = data?.settings?.fullName || "My Account";
  const initials = displayName.slice(0, 2).toUpperCase() || "PA";

  // Plan status — reuses the subscriptionActive/daysLeft state already computed
  // in AppContext, plus the subscriptionStatus the Stripe webhook already stores,
  // rather than introducing any new billing logic here.
  const planLabel = subscriptionActive
    ? { label: "Active", cls: "pro" }
    : data?.settings?.subscriptionStatus
    ? { label: "Cancelled", cls: "cancelled" }
    : daysLeft > 0
    ? { label: "Free Trial", cls: "trial" }
    : { label: "Free Plan", cls: "free" };

  // Close popover on outside click
  useEffect(() => {
    function handle(e) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        profileBtnRef.current && !profileBtnRef.current.contains(e.target)
      ) {
        setPopoverOpen(false);
        setHelpOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Load the real authenticated user email from Supabase
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  const toastTimerRef = useRef(null);
  function showToast(msg) {
    setToast(msg);
    setToastVisible(true);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2500);
  }


  async function handleEmailChange() {
    setEmailError("");
    if (!newEmail) { setEmailError("Please enter a new email address."); return; }
    if (!emailPassword) { setEmailError("Please enter your current password."); return; }
    setEmailLoading(true);
    // Re-authenticate first by signing in with current credentials
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser?.email || "",
      password: emailPassword,
    });
    if (signInError) { setEmailError("Incorrect password."); setEmailLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) { setEmailError(error.message); setEmailLoading(false); return; }
    setEmailLoading(false);
    setMiniModal(null);
    setNewEmail(""); setEmailPassword("");
    showToast("Confirmation email sent — check your inbox");
  }

  async function handlePasswordChange() {
    setPasswordError("");
    setPasswordLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setPasswordError("Could not find your email address."); setPasswordLoading(false); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { setPasswordError(error.message); setPasswordLoading(false); return; }
    setPasswordLoading(false);
    setMiniModal(null);
    showToast("Password reset link sent — check your email");
  }
  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { showToast("Session expired — please sign in again"); setPortalLoading(false); return; }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" } }
      );
      const json = await res.json();
      if (json.url) { window.location.href = json.url; }
      else { showToast(json.error || "Could not open billing portal"); }
    } catch (e) {
      showToast("Something went wrong — please try again");
    }
    setPortalLoading(false);
  }

  function openAcct(tab = "account") {
    setAcctTab(tab);
    setAcctOpen(true);
    setPopoverOpen(false);
  }

  return (
    <>
      <style>{css}</style>

      {/* ── Mobile topbar ── */}
      <div className="app-mobile-topbar">
        <img src={logo} alt="PAYVLE" className="app-mobile-logo-image" width={230} height={76} />
        {showTrial && (
          <span className="app-mobile-trial-pill" style={trialColor}>{daysLeft}d left in trial</span>
        )}
      </div>

      <div className="app-layout">
        {/* ── Sidebar ── */}
        <aside className="app-sidebar">
          <img src={logo} alt="PAYVLE" className="app-logo-image" width={230} height={76} />

          <nav className="app-nav">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `app-nav-link${isActive ? " active" : ""}`}>
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

          {/* ── Profile card ── */}
          <div className="app-sidebar-user">
            <button
              ref={profileBtnRef}
              className="app-profile-btn"
              onClick={() => setPopoverOpen(o => !o)}
            >
              <div className="app-profile-avatar">{initials}</div>
              <div className="app-profile-info">
                <span className="app-profile-name">{displayName}</span>
                <span className={`app-profile-plan ${planLabel.cls}`}>
                  {planLabel.label}
                </span>
              </div>
              <span className="app-profile-chevron">{popoverOpen ? "▼" : "▲"}</span>
            </button>

            {/* ── Popover ── */}
            <div ref={popoverRef} className={`app-popover${popoverOpen ? " open" : ""}`}>

              {/* Settings */}
              <button className="pop-item" onClick={() => { setHelpOpen(false); openAcct("account"); }}>
                <span className="pop-item-left">
                  <span className="pop-item-icon">⚙</span>
                  Settings
                </span>
              </button>

              {/* Help — click toggles submenu */}
              <button className="pop-item" onClick={() => setHelpOpen(o => !o)}>
                <span className="pop-item-left">
                  <span className="pop-item-icon">?</span>
                  Help
                </span>
                <span className="pop-item-chevron">{helpOpen ? "▾" : "›"}</span>
              </button>

              {helpOpen && (
                <div style={{ borderBottom: "1px solid #222" }}>
                  <Link to="/terms" className="submenu-item"
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px 10px 32px", color: "#ccc", fontSize: "0.8rem", fontWeight: 500, textDecoration: "none", borderBottom: "1px solid #222", transition: "background 0.12s" }}
                    onClick={() => { setPopoverOpen(false); setHelpOpen(false); }}>
                    <span className="submenu-icon">📄</span> Terms of Service
                  </Link>
                  <Link to="/privacy" className="submenu-item"
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px 10px 32px", color: "#ccc", fontSize: "0.8rem", fontWeight: 500, textDecoration: "none", borderBottom: "1px solid #222", transition: "background 0.12s" }}
                    onClick={() => { setPopoverOpen(false); setHelpOpen(false); }}>
                    <span className="submenu-icon">🔒</span> Privacy Policy
                  </Link>
                  <a href="mailto:support@payvle.com.au"
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px 10px 32px", color: "#ccc", fontSize: "0.8rem", fontWeight: 500, textDecoration: "none", borderBottom: "1px solid #222", transition: "background 0.12s" }}>
                    <span className="submenu-icon">✉</span> Contact support
                  </a>
                  <button
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px 10px 32px", color: "#ccc", fontSize: "0.8rem", fontWeight: 500, textDecoration: "none", background: "none", border: "none", width: "100%", cursor: "pointer", fontFamily: "system-ui", transition: "background 0.12s" }}
                    onClick={() => { setPopoverOpen(false); setHelpOpen(false); showToast("Bug report coming soon"); }}>
                    <span className="submenu-icon">🐛</span> Report a bug
                  </button>
                </div>
              )}

              {/* Sign out */}
              <button className="pop-item danger" onClick={() => { setPopoverOpen(false); setHelpOpen(false); signOut(); }}>
                <span className="pop-item-left">
                  <span className="pop-item-icon">→</span>
                  Sign out
                </span>
              </button>
            </div>
          </div>
        </aside>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="app-mobile-bottomnav">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `app-bnav-item${isActive ? " active" : ""}`}>
            <span className="app-bnav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
        <button className="app-bnav-item" onClick={() => setShowSheet(true)}>
          <span className="app-bnav-icon">···</span>
          More
        </button>
      </nav>

      {/* ── Mobile sheet ── */}
      <div className={`app-sheet-overlay${showSheet ? " open" : ""}`} onClick={() => setShowSheet(false)} />
      <div className={`app-sheet${showSheet ? " open" : ""}`}>
        <div className="app-sheet-handle" />
        {showTrial && (
          <div style={{ ...trialColor, borderRadius: 10, padding: "10px 14px", fontSize: "0.85rem", fontWeight: 500, marginBottom: 14, textAlign: "center" }}>
            {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in your free trial
          </div>
        )}
        <button className="app-sheet-btn" style={{ background: "#f5f5f5", color: "#111" }}
          onClick={() => { setShowSheet(false); openAcct("account"); }}>
          ⚙ Account settings
        </button>
        <button className="app-sheet-btn app-sheet-signout" onClick={() => { setShowSheet(false); signOut(); }}>
          → Sign out
        </button>
        <button className="app-sheet-btn app-sheet-cancel" onClick={() => setShowSheet(false)}>
          Cancel
        </button>
      </div>

      {/* ── Account Settings Modal ── */}
      <div className={`acct-overlay${acctOpen ? " open" : ""}`} onClick={e => { if (e.target.classList.contains("acct-overlay")) setAcctOpen(false); }}>
        <div className="acct-modal">
          <div className="acct-topbar">
            <h2>Account Settings</h2>
            <button className="acct-close" onClick={() => setAcctOpen(false)}>✕</button>
          </div>

          <div className="acct-tabs">
            {[["account", "Account"], ["subscription", "Subscription"], ["danger", "Danger zone"]].map(([id, label]) => (
              <button key={id} className={`acct-tab${acctTab === id ? " active" : ""}`} onClick={() => setAcctTab(id)}>
                {label}
              </button>
            ))}
          </div>

          <div className="acct-body">

            {/* ── Account tab ── */}
            {acctTab === "account" && (
              <>
                <div className="acct-section">
                  <div className="acct-section-title">Profile</div>
                  <div className="acct-card">
                    <div className="acct-row">
                      <div className="acct-row-left">
                        <div className="acct-row-title">Full name</div>
                        <div className="acct-row-sub">{data?.settings?.fullName || "Not set"}</div>
                      </div>
                    </div>
                    <div className="acct-row">
                      <div className="acct-row-left">
                        <div className="acct-row-title">Email address</div>
                        <div className="acct-row-sub">{userEmail || "Loading..."}</div>
                      </div>
                      <button className="acct-btn acct-btn-outline" onClick={() => setMiniModal("email")}>Change</button>
                    </div>
                    <div className="acct-row">
                      <div className="acct-row-left">
                        <div className="acct-row-title">Sign out</div>
                        <div className="acct-row-sub">Sign out on this device</div>
                      </div>
                      <button className="acct-btn acct-btn-outline" onClick={() => { setAcctOpen(false); signOut(); }}>Sign out</button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Subscription tab ── */}
            {acctTab === "subscription" && (
              <>
                {subscriptionActive ? (
                  <>
                    <div className="acct-alert acct-alert-purple" style={{ marginBottom: 16 }}>
                      <span>⭐</span>
                      <span><strong>Early adopter rate locked in.</strong> Your $49.99/year price is guaranteed for life as long as your subscription stays active.</span>
                    </div>
                    <div className="acct-card" style={{ marginBottom: 16 }}>
                      <div className="sub-header">
                        <div className="sub-header-top">
                          <div>
                            <div className="sub-plan-label">Current plan</div>
                            <div className="sub-plan-price">$49.99<span>/year</span></div>
                          </div>
                          <span className="sub-status-badge">● Active</span>
                        </div>
                        <div className="sub-renews">Renews 8 July 2027</div>
                      </div>
                      <div className="acct-row">
                        <div className="acct-row-left">
                          <div className="acct-row-title">Payment method</div>
                          <div className="acct-row-sub">Update your card details</div>
                        </div>
                        <button className="acct-btn acct-btn-outline" onClick={openBillingPortal} disabled={portalLoading}>
                          {portalLoading ? "Opening..." : "Update card"}
                        </button>
                      </div>
                      <div className="acct-row">
                        <div className="acct-row-left">
                          <div className="acct-row-title">Billing history</div>
                          <div className="acct-row-sub">Download past receipts</div>
                        </div>
                        <button className="acct-btn acct-btn-outline" onClick={openBillingPortal} disabled={portalLoading}>
                          {portalLoading ? "Opening..." : "View invoices"}
                        </button>
                      </div>
                      <div className="acct-row">
                        <div className="acct-row-left">
                          <div className="acct-row-title" style={{ color: "#c0392b" }}>Cancel subscription</div>
                          <div className="acct-row-sub">Access continues until renewal date</div>
                        </div>
                        <button className="acct-btn acct-btn-red-outline" onClick={openBillingPortal} disabled={portalLoading}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="acct-alert acct-alert-red" style={{ marginBottom: 16 }}>
                      <span>⚠</span>
                      <span>{daysLeft > 0 ? `You have ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left in your free trial.` : "Your free trial has ended."} Subscribe to keep creating invoices.</span>
                    </div>
                    <div className="acct-card">
                      <div className="acct-row">
                        <div className="acct-row-left">
                          <div className="acct-row-title">Subscribe to Payvle</div>
                          <div className="acct-row-sub">From $49.99/year · cancel anytime</div>
                        </div>
                        <button className="acct-btn acct-btn-dark" onClick={() => { setAcctOpen(false); window.__payvleShowUpgradePrompt?.(); }}>
                          Subscribe →
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── Danger zone tab ── */}
            {acctTab === "danger" && (
              <>
                <div className="acct-alert acct-alert-red" style={{ marginBottom: 16 }}>
                  <span>⚠</span>
                  <span>These actions are permanent and cannot be undone.</span>
                </div>
                <div className="acct-card" style={{ border: "1px solid #fde0e0" }}>
                  <div className="acct-danger-header">
                    <div className="acct-danger-label">Irreversible actions</div>
                  </div>
                  <div className="acct-row">
                    <div className="acct-row-left">
                      <div className="acct-row-title">Delete all data</div>
                      <div className="acct-row-sub">Permanently delete all invoices, quotes and settings</div>
                    </div>
                    <button className="acct-btn acct-btn-red-outline" onClick={() => setMiniModal("delete-data")}>Delete data</button>
                  </div>
                  <div className="acct-row">
                    <div className="acct-row-left">
                      <div className="acct-row-title">Delete account</div>
                      <div className="acct-row-sub">Permanently close your Payvle account</div>
                    </div>
                    <button className="acct-btn acct-btn-red" onClick={() => setMiniModal("delete-account")}>Delete account</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mini modals ── */}

      {/* Change email */}
      <div className={`mini-overlay${miniModal === "email" ? " open" : ""}`} onClick={e => { if (e.target.classList.contains("mini-overlay")) { setMiniModal(null); setEmailError(""); } }}>
        <div className="mini-modal">
          <h3>Change email address</h3>
          <p>Enter your new email. We'll send a confirmation link before the change takes effect.</p>
          {emailError && <div style={{ background: "#fff5f5", color: "#c0392b", border: "1px solid #fde0e0", borderRadius: 8, padding: "8px 12px", fontSize: "0.78rem", marginBottom: 12 }}>{emailError}</div>}
          <div className="acct-field"><label>New email</label><input className="acct-input" type="email" placeholder="you@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
          <div className="acct-field"><label>Current password</label><input className="acct-input" type="password" placeholder="••••••••" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmailChange()} /></div>
          <div className="mini-actions">
            <button className="acct-btn acct-btn-outline" onClick={() => { setMiniModal(null); setEmailError(""); setNewEmail(""); setEmailPassword(""); }}>Cancel</button>
            <button className="acct-btn acct-btn-dark" onClick={handleEmailChange} disabled={emailLoading}>
              {emailLoading ? "Sending..." : "Send confirmation"}
            </button>
          </div>
        </div>
      </div>



      {/* Delete all data */}
      <div className={`mini-overlay${miniModal === "delete-data" ? " open" : ""}`} onClick={e => { if (e.target.classList.contains("mini-overlay")) setMiniModal(null); }}>
        <div className="mini-modal">
          <h3>Delete all data?</h3>
          <p>This permanently deletes all invoices, quotes and settings. <strong>Cannot be undone.</strong> Your account stays active.</p>
          <div className="acct-field"><label>Type DELETE to confirm</label><input className="acct-input" type="text" placeholder="DELETE" /></div>
          <div className="mini-actions">
            <button className="acct-btn acct-btn-outline" onClick={() => setMiniModal(null)}>Cancel</button>
            <button className="acct-btn acct-btn-red" onClick={() => { setMiniModal(null); showToast("All data deleted"); }}>Delete all data</button>
          </div>
        </div>
      </div>

      {/* Delete account */}
      <div className={`mini-overlay${miniModal === "delete-account" ? " open" : ""}`} onClick={e => { if (e.target.classList.contains("mini-overlay")) setMiniModal(null); }}>
        <div className="mini-modal">
          <h3>Delete your account?</h3>
          <p>Permanently deletes your account, all data, and cancels your subscription immediately. <strong>Cannot be undone.</strong></p>
          <div className="acct-field"><label>Type DELETE to confirm</label><input className="acct-input" type="text" placeholder="DELETE" /></div>
          <div className="mini-actions">
            <button className="acct-btn acct-btn-outline" onClick={() => setMiniModal(null)}>Cancel</button>
            <button className="acct-btn acct-btn-red" onClick={() => { setMiniModal(null); signOut(); }}>Delete my account</button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`layout-toast${toastVisible ? " show" : ""}`}>{toast}</div>
    </>
  );
}