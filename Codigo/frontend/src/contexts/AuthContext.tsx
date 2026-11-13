/**
 * AuthContext – Estado de autenticação centralizado
 *
 * Garante que login/logout propaguem para todos os consumidores e evita
 * inconsistências entre localStorage e estado React.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import authService, { Usuario, UserType } from "../services/authService";
import { getUserProfile } from "../services/usuario";

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
  /** true enquanto a pessoa usa senha provisória */
  precisaTrocarSenha: boolean;
  login: (email: string, senha: string) => Promise<Usuario>;
  trocarSenha: (senhaAtual: string, novaSenha: string) => Promise<Usuario>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() => authService.getUser());
  const [loading, setLoading] = useState(false);
  // Quem entrou antes do cookie HttpOnly tem token antigo: converte antes de o app fazer chamadas
  const [pronto, setPronto] = useState(() => !temTokenAntigo());

  const refreshUser = useCallback(() => {
    setUser(authService.getUser());
  }, []);

  // Revalida perfil no boot (usuário desativado / flags atualizadas / sessão expirada)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await authService.migrarSessaoAntiga();
      if (cancelled) return;
      setPronto(true);
      if (!authService.getUser()) {
        setUser(null);
        return;
      }
      try {
        const perfil = await getUserProfile();
        if (cancelled) return;
        if (perfil?.ativo === false) {
          authService.logout();
          setUser(null);
          return;
        }
        authService.updateStoredUser(perfil as Usuario);
        setUser(perfil as Usuario);
      } catch {
        // 401 já é tratado pelo apiClient
      }
    })();
    return () => {
      cancelled = true;
    };
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

  const trocarSenha = useCallback(async (senhaAtual: string, novaSenha: string): Promise<Usuario> => {
    const usuario = await authService.trocarSenha(senhaAtual, novaSenha);
    setUser(usuario);
    return usuario;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    // A validade real da sessão (cookie HttpOnly) é conferida pelo servidor a cada chamada
    isAuthenticated: !!user,
    isAdmin: user?.tipo === "administrador",
    isLider: user?.tipo === "lider",
    isLiderCelula: user?.tipo === "lider" && !!user?.lider_celula,
    isLiderMinisterio: user?.tipo === "lider" && !!user?.lider_ministerio,
    isMembro: user?.tipo === "membro",
    userType: user?.tipo ?? null,
    loading,
    precisaTrocarSenha: !!user?.trocar_senha,
    login,
    trocarSenha,
    logout,
    refreshUser,
  };

  // Só durante a conversão do token antigo (uma requisição): evita chamadas sem sessão
  if (!pronto) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function temTokenAntigo(): boolean {
  try {
    return !!localStorage.getItem("token");
  } catch {
    return false;
  }
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
