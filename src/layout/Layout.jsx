import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>InvoicePro</h2>

        <NavLink to="/" style={styles.link}>Dashboard</NavLink>
        <NavLink to="/create" style={styles.link}>Create Invoice</NavLink>
        <NavLink to="/invoices" style={styles.link}>Invoices</NavLink>
        <NavLink to="/settings" style={styles.link}>Settings</NavLink>
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
    fontFamily: "system-ui"
  },
  sidebar: {
    width: 220,
    background: "#111",
    color: "#fff",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 15
  },
  logo: {
    marginBottom: 20
  },
  link: {
    color: "#ccc",
    textDecoration: "none",
    fontWeight: 500
  },
  main: {
    flex: 1,
    padding: 30,
    background: "#f7f7f7"
  }
};