import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Layout } from "../components/Layout";
import { LoginPage } from "../pages/Login";
import { ForgotPasswordPage } from "../pages/ForgotPassword";
import { ResetPasswordPage } from "../pages/ResetPassword";
import { DashboardPage } from "../pages/Dashboard";
import { CallsPage } from "../pages/Calls";
import { CallDetailPage } from "../pages/CallDetail";
import { CustomersPage } from "../pages/Customers";
import { CatalogPage } from "../pages/Catalog";
import { CampaignsPage } from "../pages/Campaigns";
import { RagDataPage } from "../pages/RagData";
import { IntegrationsPage } from "../pages/Integrations";
import { ApprovalsPage } from "../pages/Approvals";
import { TeamPage } from "../pages/Team";
import { RolesPage } from "../pages/Roles";
import { BillingPage } from "../pages/Billing";
import { SettingsPage } from "../pages/Settings";
import { UiKitPage } from "../pages/UiKit";

function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  // Public: giriş etməmiş istifadəçi üçün. Şifrə sıfırlama linki e-poçtdan buraya gəlir.
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  // UI Kit birbaşa baxış üçün
  { path: "/ui", element: <UiKitPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/calls", element: <CallsPage /> },
          { path: "/calls/:callId", element: <CallDetailPage /> },
          { path: "/campaigns", element: <CampaignsPage /> },
          { path: "/customers", element: <CustomersPage /> },
          { path: "/catalog", element: <CatalogPage /> },
          { path: "/rag", element: <RagDataPage /> },
          { path: "/integrations", element: <IntegrationsPage /> },
          { path: "/approvals", element: <ApprovalsPage /> },
          { path: "/team", element: <TeamPage /> },
          { path: "/roles", element: <RolesPage /> },
          { path: "/billing", element: <BillingPage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
