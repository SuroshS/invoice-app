import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const styles = `
.dash {
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 2rem;
  font-family: system-ui, sans-serif;
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dash-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111;
  margin: 0;
}

.dash-subtitle {
  font-size: 0.8rem;
  color: #bbb;
  margin: 0.2rem 0 0;
}

.dash-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  font-family: system-ui, sans-serif;
}

.btn-dark { background: #111; color: #fff; }
.btn-dark:hover { background: #333; }
.btn-light { background: #f0f0f0; color: #444; }
.btn-light:hover { background: #e5e5e5; }

/* Hero strip */
.hero {
  background: #111;
  border-radius: 14px;
  display: grid;
  grid-template-columns: 1fr 1px 1fr 1px 1fr;
  margin-bottom: 1rem;
  overflow: hidden;
}

.hero-divider {
  background: #222;
  margin: 1.5rem 0;
}

.hero-item {
  padding: 1.75rem 2rem;
}

.hero-label {
  font-size: 0.7rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.hero-value {
  font-size: 1.6rem;
  font-weight: 600;
  color: #fff;
  line-height: 1;
  margin-bottom: 0.375rem;
}

.hero-sub {
  font-size: 0.72rem;
  color: #555;
}

/* Stat tiles */
.tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.tile {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 12px;
  padding: 1.25rem 1.25rem 1rem;
}

.tile-label {
  font-size: 0.7rem;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.tile-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.tile-sub {
  font-size: 0.7rem;
  color: #ccc;
}

/* Bottom grid */
.bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 680px) {
  .hero { grid-template-columns: 1fr; }
  .hero-divider { display: none; }
  .tiles { grid-template-columns: repeat(2, 1fr); }
  .bottom { grid-template-columns: 1fr; }
}

.panel {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 12px;
  padding: 1.5rem;
}

.panel-label {
  font-size: 0.7rem;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
  margin-bottom: 1.25rem;
}

/* Activity */
.feed { display: flex; flex-direction: column; }

.feed-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.feed-row:last-child { border-bottom: none; }

.feed-badge {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  flex-shrink: 0;
}

.feed-badge.inv { background: #f0f0f0; color: #555; }
.feed-badge.quo { background: #f0eefe; color: #7c5cbf; }

.feed-info { flex: 1; min-width: 0; }

.feed-num {
  font-size: 0.82rem;
  font-weight: 500;
  color: #222;
  display: block;
}

.feed-client {
  font-size: 0.72rem;
  color: #bbb;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feed-right { text-align: right; flex-shrink: 0; }

.feed-amt {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111;
  display: block;
}

.feed-date {
  font-size: 0.7rem;
  color: #ccc;
  display: block;
}

/* Clients */
.clients { display: flex; flex-direction: column; }

.client-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.client-row:last-child { border-bottom: none; }

.c-rank {
  font-size: 0.7rem;
  color: #ddd;
  font-weight: 600;
  width: 14px;
  flex-shrink: 0;
}

.c-name {
  font-size: 0.85rem;
  color: #333;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.c-count {
  font-size: 0.72rem;
  color: #ccc;
  flex-shrink: 0;
}

.c-total {
  font-size: 0.85rem;
  font-weight: 600;
  color: #111;
  flex-shrink: 0;
  min-width: 72px;
  text-align: right;
}

.empty {
  font-size: 0.85rem;
  color: #ccc;
  padding: 0.5rem 0;
}
`;

export default function Dashboard() {
  const { data } = useApp();
  const navigate = useNavigate();
  const { invoices } = data;

  const stats = useMemo(() => {
    const allInvoices = invoices.filter(i => i.type === "Invoice" || !i.type);
    const quotes = invoices.filter(i => i.type === "Quote");
    const totalRevenue = allInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    const avgValue = allInvoices.length > 0 ? totalRevenue / allInvoices.length : 0;

    const now = new Date();
    const thisMonthRevenue = allInvoices
      .filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, inv) => acc + (inv.total || 0), 0);

    const clientMap = {};
    allInvoices.forEach(inv => {
      const name = inv.billToName || "Unknown";
      if (!clientMap[name]) clientMap[name] = { name, total: 0, count: 0 };
      clientMap[name].total += inv.total || 0;
      clientMap[name].count += 1;
    });
    const topClients = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 6);

    const recent = [...invoices]
      .sort((a, b) => new Date(b.savedAt || b.date) - new Date(a.savedAt || a.date))
      .slice(0, 6);

    return {
      totalRevenue, avgValue, thisMonthRevenue,
      invoiceCount: allInvoices.length,
      quoteCount: quotes.length,
      clientCount: topClients.length,
      topClients, recent,
    };
  }, [invoices]);

  function fmt(n) {
    return (n || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtShort(n) {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${Math.round(n || 0)}`;
  }

  return (
    <>
      <style>{styles}</style>
      <div className="dash">

        {/* Header */}
        <div className="dash-header">
          <div>
            <p className="dash-title">{data.settings.businessName}</p>
            <p className="dash-subtitle">Overview</p>
          </div>
          <div className="dash-actions">
            <button className="btn btn-light" onClick={() => navigate("/invoices")}>All Records</button>
            <button className="btn btn-dark" onClick={() => navigate("/create")}>+ New</button>
          </div>
        </div>

        {/* Hero */}
        <div className="hero">
          <div className="hero-item">
            <div className="hero-label">Total Revenue</div>
            <div className="hero-value">${fmt(stats.totalRevenue)}</div>
            <div className="hero-sub">{stats.invoiceCount} invoice{stats.invoiceCount !== 1 ? "s" : ""} all time</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-item">
            <div className="hero-label">This Month</div>
            <div className="hero-value">${fmt(stats.thisMonthRevenue)}</div>
            <div className="hero-sub">current month</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-item">
            <div className="hero-label">Avg Invoice</div>
            <div className="hero-value">${fmt(stats.avgValue)}</div>
            <div className="hero-sub">per invoice</div>
          </div>
        </div>

        {/* Tiles */}
        <div className="tiles">
          <div className="tile">
            <div className="tile-label">Invoices Sent</div>
            <div className="tile-value">{stats.invoiceCount}</div>
            <div className="tile-sub">all time</div>
          </div>
          <div className="tile">
            <div className="tile-label">Quotes Sent</div>
            <div className="tile-value">{stats.quoteCount}</div>
            <div className="tile-sub">all time</div>
          </div>
          <div className="tile">
            <div className="tile-label">Unique Clients</div>
            <div className="tile-value">{stats.clientCount}</div>
            <div className="tile-sub">invoiced</div>
          </div>
          <div className="tile">
            <div className="tile-label">This Month</div>
            <div className="tile-value">{fmtShort(stats.thisMonthRevenue)}</div>
            <div className="tile-sub">revenue</div>
          </div>
        </div>

        {/* Bottom */}
        <div className="bottom">

          <div className="panel">
            <div className="panel-label">Recent Activity</div>
            {stats.recent.length === 0 ? (
              <p className="empty">No records yet.</p>
            ) : (
              <div className="feed">
                {stats.recent.map((inv, i) => {
                  const isQuote = inv.type === "Quote";
                  return (
                    <div key={i} className="feed-row">
                      <span className={`feed-badge ${isQuote ? "quo" : "inv"}`}>
                        {isQuote ? "QUOTE" : "INV"}
                      </span>
                      <div className="feed-info">
                        <span className="feed-num">{inv.invoiceNumber}</span>
                        <span className="feed-client">{inv.billToName || "—"}</span>
                      </div>
                      <div className="feed-right">
                        <span className="feed-amt">${fmt(inv.total || 0)}</span>
                        <span className="feed-date">
                          {new Date(inv.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-label">Top Clients</div>
            {stats.topClients.length === 0 ? (
              <p className="empty">No clients yet.</p>
            ) : (
              <div className="clients">
                {stats.topClients.map((c, i) => (
                  <div key={i} className="client-row">
                    <span className="c-rank">{i + 1}</span>
                    <span className="c-name">{c.name}</span>
                    <span className="c-count">{c.count} inv</span>
                    <span className="c-total">${fmt(c.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}