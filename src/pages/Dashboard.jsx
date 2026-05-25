import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const styles = `
.dash {
  max-width: 960px;
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
.dash-title { font-size: 1.1rem; font-weight: 600; color: #111; margin: 0; }
.dash-subtitle { font-size: 0.8rem; color: #bbb; margin: 0.2rem 0 0; }
.dash-actions { display: flex; gap: 0.5rem; }
.btn { padding: 0.55rem 1.1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; border: none; font-family: system-ui, sans-serif; }
.btn-dark { background: #111; color: #fff; }
.btn-dark:hover { background: #333; }
.btn-light { background: #f0f0f0; color: #444; }
.btn-light:hover { background: #e5e5e5; }

.hero {
  background: #111;
  border-radius: 14px;
  display: grid;
  grid-template-columns: 1fr 1px 1fr 1px 1fr 1px 1fr;
  margin-bottom: 1rem;
  overflow: hidden;
}
.hero-divider { background: #222; margin: 1.5rem 0; }
.hero-item { padding: 1.6rem 1.75rem; }
.hero-label { font-size: 0.68rem; color: #666; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 500; margin-bottom: 0.5rem; }
.hero-value { font-size: 1.5rem; font-weight: 600; color: #fff; line-height: 1; margin-bottom: 0.375rem; }
.hero-sub { font-size: 0.68rem; color: #555; }
.hero-up { color: #34c77b; }
.hero-down { color: #f56565; }

.tiles {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.tile { background: #fff; border: 1px solid #ebebeb; border-radius: 12px; padding: 1.1rem 1.25rem 1rem; }
.tile-label { font-size: 0.68rem; color: #bbb; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; margin-bottom: 0.5rem; }
.tile-value { font-size: 1.4rem; font-weight: 600; color: #111; line-height: 1; margin-bottom: 0.2rem; }
.tile-sub { font-size: 0.68rem; color: #ccc; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.grid-3 { display: grid; grid-template-columns: 1.2fr 1fr 0.85fr; gap: 1rem; }

@media (max-width: 720px) {
  .hero { grid-template-columns: 1fr 1fr; }
  .hero-divider { display: none; }
  .tiles { grid-template-columns: repeat(3, 1fr); }
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
}

.panel { background: #fff; border: 1px solid #ebebeb; border-radius: 12px; padding: 1.4rem 1.5rem; }
.panel-label {
  font-size: 0.68rem; color: #bbb; text-transform: uppercase; letter-spacing: 0.06em;
  font-weight: 500; margin-bottom: 1.1rem;
  display: flex; justify-content: space-between; align-items: center;
}
.panel-link { font-size: 0.68rem; color: #ccc; cursor: pointer; text-decoration: underline; text-transform: none; letter-spacing: 0; font-weight: 400; }

.bars { display: flex; align-items: flex-end; gap: 6px; height: 100px; }
.b-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; gap: 3px; }
.b-amt { font-size: 0.58rem; color: #ccc; white-space: nowrap; }
.b-track { flex: 1; width: 100%; background: #f5f5f5; border-radius: 4px; display: flex; align-items: flex-end; overflow: hidden; }
.b-fill { width: 100%; background: #111; border-radius: 4px 4px 0 0; min-height: 2px; }
.b-fill.cur { background: #34c77b; }
.b-lbl { font-size: 0.6rem; color: #bbb; font-weight: 500; }

.qa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.qa-btn {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border: 1px solid #ebebeb; border-radius: 10px; background: #fff;
  cursor: pointer; font-family: system-ui, sans-serif; transition: background 0.12s; text-align: left;
}
.qa-btn:hover { background: #fafafa; }
.qa-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 13px; font-weight: 700; }
.qa-icon.dark { background: #111; color: #fff; }
.qa-icon.light { background: #f5f5f5; color: #555; }
.qa-label { font-size: 0.78rem; font-weight: 500; color: #111; display: block; }
.qa-sub { font-size: 0.65rem; color: #bbb; display: block; margin-top: 1px; }

.feed { display: flex; flex-direction: column; }
.feed-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 0; border-bottom: 1px solid #f5f5f5; }
.feed-row:last-child { border-bottom: none; }
.feed-badge { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.04em; padding: 0.2rem 0.45rem; border-radius: 4px; flex-shrink: 0; }
.feed-badge.inv { background: #f0f0f0; color: #555; }
.feed-badge.quo { background: #f0eefe; color: #7c5cbf; }
.feed-info { flex: 1; min-width: 0; }
.feed-num { font-size: 0.8rem; font-weight: 500; color: #222; display: block; }
.feed-client { font-size: 0.7rem; color: #bbb; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.feed-right { text-align: right; flex-shrink: 0; }
.feed-amt { font-size: 0.85rem; font-weight: 600; color: #111; display: block; }
.feed-date { font-size: 0.68rem; color: #ccc; display: block; }

.client-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 0; border-bottom: 1px solid #f5f5f5; }
.client-row:last-child { border-bottom: none; }
.c-rank { font-size: 0.68rem; color: #ddd; font-weight: 600; width: 14px; flex-shrink: 0; }
.c-info { flex: 1; min-width: 0; }
.c-name { font-size: 0.82rem; color: #333; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.c-sub { font-size: 0.65rem; color: #ccc; }
.c-prog { height: 3px; background: #f0f0f0; border-radius: 99px; overflow: hidden; margin-top: 3px; }
.c-prog-fill { height: 100%; background: #111; border-radius: 99px; }
.c-total { font-size: 0.82rem; font-weight: 600; color: #111; flex-shrink: 0; }

.meter-track { height: 5px; background: #f0f0f0; border-radius: 99px; overflow: hidden; margin: 8px 0 6px; }
.meter-fill { height: 100%; background: #111; border-radius: 99px; }
.meter-labels { display: flex; justify-content: space-between; font-size: 0.65rem; color: #bbb; }

.stat-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
.stat-row:last-child { border-bottom: none; }
.stat-row-label { font-size: 0.78rem; color: #888; }
.stat-row-value { font-size: 0.78rem; font-weight: 600; color: #111; }

.empty { font-size: 0.85rem; color: #ccc; padding: 0.5rem 0; }
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
    const biggestJob = allInvoices.reduce((max, inv) => (inv.total || 0) > max ? (inv.total || 0) : max, 0);

    const now = new Date();

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), month: d.getMonth(), revenue: 0, isCurrent: i === 5 };
    });
    allInvoices.forEach(inv => {
      const d = new Date(inv.date);
      const match = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (match) match.revenue += inv.total || 0;
    });

    const thisMonth = months[5].revenue;
    const lastMonth = months[4].revenue;
    const monthDiff = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

    const thisYearRevenue = allInvoices
      .filter(inv => new Date(inv.date).getFullYear() === now.getFullYear())
      .reduce((acc, inv) => acc + (inv.total || 0), 0);

    const clientMap = {};
    allInvoices.forEach(inv => {
      const name = inv.billToName || "Unknown";
      if (!clientMap[name]) clientMap[name] = { name, total: 0, count: 0 };
      clientMap[name].total += inv.total || 0;
      clientMap[name].count += 1;
    });
    const topClients = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 5);
    const maxClientTotal = topClients[0]?.total || 1;

    const recent = [...invoices]
      .sort((a, b) => new Date(b.savedAt || b.date) - new Date(a.savedAt || a.date))
      .slice(0, 7);

    const conversionRate = (allInvoices.length + quotes.length) > 0
      ? Math.round((allInvoices.length / (allInvoices.length + quotes.length)) * 100)
      : 0;

    const busiestMonth = [...months].sort((a, b) => b.revenue - a.revenue)[0];

    return {
      totalRevenue, avgValue, biggestJob, thisMonth, lastMonth, monthDiff,
      thisYearRevenue, invoiceCount: allInvoices.length, quoteCount: quotes.length,
      clientCount: topClients.length, conversionRate, months, topClients,
      maxClientTotal, recent, busiestMonth,
    };
  }, [invoices]);

  const maxMonthly = Math.max(...stats.months.map(m => m.revenue), 1);

  function fmt(n) {
    return (n || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtShort(n) {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return n > 0 ? `$${Math.round(n)}` : "$0";
  }

  const today = new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <style>{styles}</style>
      <div className="dash">

        <div className="dash-header">
          <div>
            <p className="dash-title">{data.settings.businessName}</p>
            <p className="dash-subtitle">{today}</p>
          </div>
          <div className="dash-actions">
            <button className="btn btn-light" onClick={() => navigate("/invoices")}>All records</button>
            <button className="btn btn-dark" onClick={() => navigate("/create")}>+ New</button>
          </div>
        </div>

        <div className="hero">
          <div className="hero-item">
            <div className="hero-label">Total revenue</div>
            <div className="hero-value">${fmt(stats.totalRevenue)}</div>
            <div className="hero-sub">{stats.invoiceCount} invoice{stats.invoiceCount !== 1 ? "s" : ""} all time</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-item">
            <div className="hero-label">This month</div>
            <div className="hero-value">${fmt(stats.thisMonth)}</div>
            <div className="hero-sub">
              {stats.monthDiff !== null
                ? <span className={stats.monthDiff >= 0 ? "hero-up" : "hero-down"}>{stats.monthDiff >= 0 ? "↑" : "↓"} {Math.abs(stats.monthDiff)}% vs last month</span>
                : "No prior data"}
            </div>
          </div>
          <div className="hero-divider" />
          <div className="hero-item">
            <div className="hero-label">This year</div>
            <div className="hero-value">${fmt(stats.thisYearRevenue)}</div>
            <div className="hero-sub">{new Date().getFullYear()} total</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-item">
            <div className="hero-label">Avg invoice</div>
            <div className="hero-value">${fmt(stats.avgValue)}</div>
            <div className="hero-sub">per invoice</div>
          </div>
        </div>

        <div className="tiles">
          <div className="tile">
            <div className="tile-label">Invoices sent</div>
            <div className="tile-value">{stats.invoiceCount}</div>
            <div className="tile-sub">all time</div>
          </div>
          <div className="tile">
            <div className="tile-label">Quotes sent</div>
            <div className="tile-value">{stats.quoteCount}</div>
            <div className="tile-sub">all time</div>
          </div>
          <div className="tile">
            <div className="tile-label">Unique clients</div>
            <div className="tile-value">{stats.clientCount}</div>
            <div className="tile-sub">invoiced</div>
          </div>
          <div className="tile">
            <div className="tile-label">Biggest job</div>
            <div className="tile-value">{fmtShort(stats.biggestJob)}</div>
            <div className="tile-sub">single invoice</div>
          </div>
          <div className="tile">
            <div className="tile-label">Best month</div>
            <div className="tile-value">{fmtShort(stats.busiestMonth?.revenue || 0)}</div>
            <div className="tile-sub">{stats.busiestMonth?.label || "—"}</div>
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-label">Revenue — last 6 months</div>
            <div className="bars">
              {stats.months.map((m, i) => (
                <div key={i} className="b-col">
                  <span className="b-amt">{fmtShort(m.revenue)}</span>
                  <div className="b-track">
                    <div className={`b-fill${m.isCurrent ? " cur" : ""}`} style={{ height: `${(m.revenue / maxMonthly) * 100}%` }} />
                  </div>
                  <span className="b-lbl">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-label">Quick actions</div>
            <div className="qa-grid">
              <button className="qa-btn" onClick={() => navigate("/create")}>
                <div className="qa-icon dark">+</div>
                <div><span className="qa-label">New invoice</span><span className="qa-sub">Bill a client</span></div>
              </button>
              <button className="qa-btn" onClick={() => navigate("/create")}>
                <div className="qa-icon light">Q</div>
                <div><span className="qa-label">New quote</span><span className="qa-sub">Send estimate</span></div>
              </button>
              <button className="qa-btn" onClick={() => navigate("/invoices")}>
                <div className="qa-icon light">↓</div>
                <div><span className="qa-label">All records</span><span className="qa-sub">View & download</span></div>
              </button>
              <button className="qa-btn" onClick={() => navigate("/settings")}>
                <div className="qa-icon light">⚙</div>
                <div><span className="qa-label">Settings</span><span className="qa-sub">Business details</span></div>
              </button>
            </div>
          </div>
        </div>

        <div className="grid-3">

          <div className="panel">
            <div className="panel-label">
              Recent activity
              <span className="panel-link" onClick={() => navigate("/invoices")}>view all</span>
            </div>
            {stats.recent.length === 0 ? (
              <p className="empty">No records yet.</p>
            ) : (
              <div className="feed">
                {stats.recent.map((inv, i) => {
                  const isQuote = inv.type === "Quote";
                  return (
                    <div key={i} className="feed-row">
                      <span className={`feed-badge ${isQuote ? "quo" : "inv"}`}>{isQuote ? "QUO" : "INV"}</span>
                      <div className="feed-info">
                        <span className="feed-num">{inv.invoiceNumber}</span>
                        <span className="feed-client">{inv.billToName || "—"}</span>
                      </div>
                      <div className="feed-right">
                        <span className="feed-amt">${fmt(inv.total || 0)}</span>
                        <span className="feed-date">{new Date(inv.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-label">Top clients</div>
            {stats.topClients.length === 0 ? (
              <p className="empty">No clients yet.</p>
            ) : (
              <div>
                {stats.topClients.map((c, i) => (
                  <div key={i} className="client-row">
                    <span className="c-rank">{i + 1}</span>
                    <div className="c-info">
                      <span className="c-name">{c.name}</span>
                      <span className="c-sub">{c.count} invoice{c.count !== 1 ? "s" : ""}</span>
                      <div className="c-prog"><div className="c-prog-fill" style={{ width: `${(c.total / stats.maxClientTotal) * 100}%` }} /></div>
                    </div>
                    <span className="c-total">${fmt(c.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="panel">
              <div className="panel-label">Quote conversion</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#111", lineHeight: 1, marginBottom: 6 }}>{stats.conversionRate}%</div>
              <div className="meter-track"><div className="meter-fill" style={{ width: `${stats.conversionRate}%` }} /></div>
              <div className="meter-labels"><span>{stats.quoteCount} quotes</span><span>{stats.invoiceCount} invoices</span></div>
            </div>

            <div className="panel">
              <div className="panel-label">At a glance</div>
              {[
                ["Last month", `$${fmt(stats.lastMonth)}`],
                ["This month", `$${fmt(stats.thisMonth)}`],
                ["Biggest job", `$${fmt(stats.biggestJob)}`],
                ["Avg per job", `$${fmt(stats.avgValue)}`],
                ["Total clients", stats.clientCount],
              ].map(([label, value]) => (
                <div key={label} className="stat-row">
                  <span className="stat-row-label">{label}</span>
                  <span className="stat-row-value">{value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}