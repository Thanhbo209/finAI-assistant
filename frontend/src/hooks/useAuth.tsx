import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { LoginPayload, RegisterPayload, User } from "../types/auth";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.api";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await authApi.me();
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUser();
  }, [loadUser]);

  const login = async (payload: LoginPayload) => {
    const data = await authApi.login(payload);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    navigate("/dashboard");
  };

  const register = async (payload: RegisterPayload) => {
    await authApi.register(payload);

    navigate("/login");
  };

  const updateUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }, []);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("preferredCurrency");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
