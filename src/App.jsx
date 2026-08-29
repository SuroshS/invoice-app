import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import AuthGate from "./components/AuthGate";

// Public routes — loaded eagerly since they're lightweight and may be
// accessed before the user is authenticated (no benefit to lazy loading them)
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";

// Protected routes — lazy loaded so only Dashboard code downloads on first
// login. Dashboard.jsx prefetches these other chunks (and pdf.js) during
// idle time once it mounts, so navigation to them is instant in practice.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const CreateInvoice = lazy(() => import("./pages/CreateInvoice"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Clients = lazy(() => import("./pages/Clients"));

export default function App() {
  return (
    <Routes>
      {/* Public routes — outside AuthGate */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      {/* Protected routes — wrapped in AuthGate and Suspense.
          fallback={null} means no flash of a spinner between navigations
          since each page already shows its own skeleton loading state. */}
      <Route path="/*" element={
        <AuthGate>
          <Suspense fallback={null}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/create" element={<CreateInvoice />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/clients" element={<Clients />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthGate>
      } />
    </Routes>
  );
}