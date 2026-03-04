import { createContext, useContext, useEffect, useState } from "react";

const AppContext = createContext();

const STORAGE_KEY = "invoice_app_v1";

const defaultData = {
  settings: {
    businessName: "",
    abn: "",
    qbcc: "",
    address: "",
    bankName: "",
    bsb: "",
    accountNumber: "",
    logoDataUrl: "",
    invoicePrefix: "INV-",
    nextInvoiceNumber: 1,
  },
  invoices: [],
};

export function AppProvider({ children }) {
  const [data, setData] = useState(defaultData);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  return (
    <AppContext.Provider value={{ data, setData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}