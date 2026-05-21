import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/api/auth.api";
import { useAuth } from "@/hooks/useAuth";
import {
  type CurrencyCode,
  getLocaleCurrency,
  isSupportedCurrency,
} from "@/types/currency.types";

// ── Constants ─────────────────────────────────────────────────────────────────

const LS_KEY = "preferredCurrency";

// ── Context ───────────────────────────────────────────────────────────────────

interface CurrencyContextValue {
  /** The user's current preferred currency — source of truth for the whole app */
  currency: CurrencyCode;
  /** Persist a new currency to the backend + localStorage + context state */
  setCurrency: (code: CurrencyCode) => Promise<void>;
  /** True while setCurrency is saving to the backend */
  isSaving: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Read preferred currency from localStorage for a fast first render.
 * Falls back to browser locale detection, then USD.
 */
function readCachedCurrency(): CurrencyCode {
  const cached = localStorage.getItem(LS_KEY);
  if (isSupportedCurrency(cached)) return cached;
  return getLocaleCurrency();
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();

  const [cachedCurrency, setCachedCurrency] =
    useState<CurrencyCode>(readCachedCurrency);
  const [isSaving, setIsSaving] = useState(false);
  const preferredCurrency = user?.preferredCurrency;
  const currency = isSupportedCurrency(preferredCurrency)
    ? preferredCurrency
    : cachedCurrency;

  // Sync with the user object whenever it changes (login / getMe response)
  useEffect(() => {
    if (isSupportedCurrency(preferredCurrency)) {
      localStorage.setItem(LS_KEY, preferredCurrency);
    }
  }, [preferredCurrency]);

  const setCurrency = useCallback(async (code: CurrencyCode) => {
    setIsSaving(true);
    try {
      const updatedUser = await authApi.updateCurrency(code);
      setCachedCurrency(code);
      localStorage.setItem(LS_KEY, code);
      updateUser(updatedUser);
    } finally {
      setIsSaving(false);
    }
  }, [updateUser]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isSaving }}>
      {children}
    </CurrencyContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
