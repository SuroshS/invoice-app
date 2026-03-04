import { useApp } from "../context/AppContext";
import "./Invoices.css";

export default function Invoices() {
  const { data, setData } = useApp();

  function toggleStatus(index) {
    const updated = [...data.invoices];
    updated[index].status =
      updated[index].status === "Paid" ? "Unpaid" : "Paid";

    setData(prev => ({
      ...prev,
      invoices: updated
    }));
  }

  function deleteInvoice(index) {
    const updated = data.invoices.filter((_, i) => i !== index);

    setData(prev => ({
      ...prev,
      invoices: updated
    }));
  }

  const totalRevenue = data.invoices.reduce(
    (acc, inv) => acc + inv.total,
    0
  );

  return (
    <div className="invoices-wrapper">
      <h1 className="page-title">Invoices</h1>

      <div className="invoice-stats">
        <div className="stat-card">
          <p>Total Invoices</p>
          <h2>{data.invoices.length}</h2>
        </div>

        <div className="stat-card">
          <p>Total Revenue</p>
          <h2>${totalRevenue.toFixed(2)}</h2>
        </div>
      </div>

      <div className="table-card">
        {data.invoices.length === 0 ? (
          <p>No invoices yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {data.invoices.map((invoice, index) => (
                <tr key={index}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{invoice.billToName}</td>
                  <td>{invoice.date}</td>
                  <td>${invoice.total.toFixed(2)}</td>
                  <td>
                    <span
                      className={
                        invoice.status === "Paid"
                          ? "status-paid"
                          : "status-unpaid"
                      }
                    >
                      {invoice.status || "Unpaid"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="small-btn"
                      onClick={() => toggleStatus(index)}
                    >
                      Toggle Status
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteInvoice(index)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}