import { Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import CreateInvoice from "./pages/CreateInvoice";
import Invoices from "./pages/Invoices";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/create" element={<CreateInvoice />} />
        <Route path="/invoices" element={<Invoices />} />
      </Route>
    </Routes>
  );
}