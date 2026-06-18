import { Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import AuthGate from "./components/AuthGate";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import CreateInvoice from "./pages/CreateInvoice";
import Invoices from "./pages/Invoices";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    <Routes>
      {/* Public route — outside AuthGate so unauthenticated users can reset password */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes — wrapped in AuthGate */}
      <Route path="/*" element={
        <AuthGate>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/create" element={<CreateInvoice />} />
              <Route path="/invoices" element={<Invoices />} />
            </Route>
          </Routes>
        </AuthGate>
      } />
    </Routes>
  );
}