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
import { ReservationsPage } from "../pages/Reservations";
import { RagDataPage } from "../pages/RagData";
import { ApprovalsPage } from "../pages/Approvals";
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
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/calls", element: <CallsPage /> },
          { path: "/calls/:callId", element: <CallDetailPage /> },
          { path: "/customers", element: <CustomersPage /> },
          { path: "/reservations", element: <ReservationsPage /> },
          { path: "/rag", element: <RagDataPage /> },
          { path: "/approvals", element: <ApprovalsPage /> },
          { path: "/settings", element: <SettingsPage /> },
          // Daxili dizayn istinadi — sidebar-da gorunmur.
          { path: "/ui", element: <UiKitPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
