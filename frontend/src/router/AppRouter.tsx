import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CurrencyProvider } from "@/hooks/useCurrency";

import DashboardPage from "@/pages/dashboard/DashboardPage";
import AddTransactionPage from "@/pages/transaction/AddTransactionPage";
import TransactionsPage from "@/pages/transaction/TransactionsPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import IntelligencePage from "@/pages/intelligence/IntelligencePage";
import CurrencyOnboardingPage from "@/pages/onboarding/CurrencyOnboardingPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import RegisterPage from "@/pages/auth/RegisterPage";
import LoginPage from "@/pages/auth/LoginPage";
import {
  ProtectedRoute,
  PublicRoute,
} from "@/components/layout/ProtectedRoute";

export default function AppRouter() {
  return (
    <AuthProvider>
      {/* CurrencyProvider must be inside AuthProvider so it can read the user */}
      <CurrencyProvider>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Onboarding — needs auth but NOT a currency yet */}
          <Route
            path="/onboarding/currency"
            element={
              <ProtectedRoute>
                <CurrencyOnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="add" element={<AddTransactionPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="intelligence" element={<IntelligencePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </CurrencyProvider>
    </AuthProvider>
  );
}
