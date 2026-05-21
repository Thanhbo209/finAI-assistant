import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  CURRENCY_ONBOARDING_SENTINEL,
  isSupportedCurrency,
} from "@/types/currency.types";

/** Returns true when the user still needs to pick a currency (fresh account). */
function needsOnboarding(preferredCurrency?: string | null): boolean {
  return (
    !preferredCurrency ||
    preferredCurrency === CURRENCY_ONBOARDING_SENTINEL ||
    !isSupportedCurrency(preferredCurrency)
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Gate: redirect to onboarding if currency is not yet set
  const mustChooseCurrency = needsOnboarding(user?.preferredCurrency);

  if (mustChooseCurrency && location.pathname !== "/onboarding/currency") {
    return <Navigate to="/onboarding/currency" replace />;
  }

  if (!mustChooseCurrency && location.pathname === "/onboarding/currency") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
