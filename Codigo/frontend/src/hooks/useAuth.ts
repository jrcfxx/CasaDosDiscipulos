import { useState, useEffect } from "react";
import authService, { Usuario, UserType } from "../services/authService";

interface UseAuthReturn {
  user: Usuario | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLider: boolean;
  isMembro: boolean;
  userType: UserType | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
}

/**
 * Hook customizado para autenticação
 * Fornece estado e métodos relacionados à autenticação
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega o usuário do localStorage ao montar
  useEffect(() => {
    refreshUser();
  }, []);

  const refreshUser = () => {
    setLoading(true);
    const currentUser = authService.getUser();
    setUser(currentUser);
    setLoading(false);
  };

  const login = async (email: string, senha: string) => {
    setLoading(true);
    try {
      await authService.login({ email, senha });
      refreshUser();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return {
    user,
    isAuthenticated: authService.isAuthenticated(),
    isAdmin: authService.isAdmin(),
    isLider: authService.isLider(),
    isMembro: authService.isMembro(),
    userType: authService.getUserType(),
    loading,
    login,
    logout,
    refreshUser,
  };
};
