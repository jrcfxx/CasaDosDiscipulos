/**
 * AuthContext – Estado de autenticação centralizado
 *
 * Garante que login/logout propaguem para todos os consumidores e evita
 * inconsistências entre localStorage e estado React.
 */

import React, { createContext, useCallback, useContext, useState } from "react";
import authService, { Usuario, UserType } from "../services/authService";

interface AuthContextValue {
  user: Usuario | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLider: boolean;
  isLiderCelula: boolean;
  isLiderMinisterio: boolean;
  isMembro: boolean;
  userType: UserType | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<Usuario>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() => authService.getUser());
  const [loading, setLoading] = useState(false);

  const refreshUser = useCallback(() => {
    setUser(authService.getUser());
  }, []);

  const login = useCallback(
    async (email: string, senha: string): Promise<Usuario> => {
      setLoading(true);
      try {
        const { usuario } = await authService.login({ email, senha });
        setUser(usuario);
        return usuario;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.tipo === "administrador",
    isLider: user?.tipo === "lider",
    isLiderCelula: user?.tipo === "lider" && (user?.lider_celula ?? true),
    isLiderMinisterio: user?.tipo === "lider" && !!user?.lider_ministerio,
    isMembro: user?.tipo === "membro",
    userType: user?.tipo ?? null,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
