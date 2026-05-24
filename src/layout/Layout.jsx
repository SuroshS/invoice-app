import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {

  function handleSignOut() {
    sessionStorage.removeItem("app_unlocked");
    window.location.reload();
  }

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>InvoicePro</h2>

        {[
          { to: "/", label: "Dashboard" },
          { to: "/create", label: "Create" },
          { to: "/invoices", label: "Invoices" },
          { to: "/settings", label: "Settings" },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.linkActive : {}),
            })}
          >
            {label}
          </NavLink>
        ))}

        <div style={styles.spacer} />

        <div style={styles.userSection}>
          <button style={styles.signOutBtn} onClick={handleSignOut}>Sign out</button>
        </div>
      </aside>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "system-ui",
  },
  sidebar: {
    width: 220,
    background: "#111",
    color: "#fff",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  logo: {
    margin: "0 0 24px",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.01em",
  },
  link: {
    color: "#888",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: "0.9rem",
    padding: "8px 12px",
    borderRadius: 8,
    transition: "all 0.15s",
  },
  linkActive: {
    color: "#fff",
    background: "#2a2a2a",
  },
  spacer: {
    flex: 1,
  },
  userSection: {
    borderTop: "1px solid #2a2a2a",
    paddingTop: 16,
  },
  signOutBtn: {
    background: "none",
    border: "1px solid #2a2a2a",
    color: "#888",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: "0.8rem",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    transition: "all 0.15s",
    fontFamily: "system-ui",
  },
  main: {
    flex: 1,
    padding: 30,
    background: "#f7f7f7",
    overflowY: "auto",
  },
};