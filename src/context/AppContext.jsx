import { createContext, useContext, useEffect, useState } from "react";
import logo from "../assets/logo.png";

const AppContext = createContext();

const STORAGE_KEY = "invoice_app_v1";

const defaultData = {
  settings: {
    businessName: "COAT&CURE PTY LTD",
    abn: "34695334742",
    qbcc: "15576833",
    address: "",
    bankName: "Ahmad Hussain Nazari Ibrahim",
    bsb: "064236",
    accountNumber: "10130392",
    logoDataUrl: logo,
    invoicePrefix: "INV-",
    nextInvoiceNumber: 1,
  },
  invoices: [],
};

export function AppProvider({ children }) {

  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultData;
  });

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