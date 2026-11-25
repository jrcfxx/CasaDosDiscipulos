/**
 * AuthContext – Estado de autenticação centralizado
 *
 * Garante que login/logout propaguem para todos os consumidores e evita
 * inconsistências entre localStorage e estado React.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import authService, { Usuario, UserType } from "../services/authService";

/** Resultado do login: a pessoa entrou, ou falta o código da verificação em duas etapas */
export type ResultadoLogin = { usuario: Usuario } | { precisa2fa: true };
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
  login: (email: string, senha: string) => Promise<ResultadoLogin>;
  /** Segundo passo do login com 2FA */
  confirmarCodigo: (codigo: string) => Promise<Usuario>;
  trocarSenha: (senhaAtual: string, novaSenha: string) => Promise<Usuario>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() => {
    // Token do formato antigo não vale mais no servidor: apaga antes de montar o app
    authService.limparSessaoAntiga();
    return authService.getUser();
  });
  const [loading, setLoading] = useState(false);

  const refreshUser = useCallback(() => {
    setUser(authService.getUser());
  }, []);

  // Revalida perfil no boot (usuário desativado / flags atualizadas / sessão expirada)
  useEffect(() => {
    let cancelled = false;
    (async () => {
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
    async (email: string, senha: string): Promise<ResultadoLogin> => {
      setLoading(true);
      try {
        const r = await authService.login({ email, senha });
        if ("precisa_2fa" in r) return { precisa2fa: true };
        setUser(r.usuario);
        return { usuario: r.usuario };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const confirmarCodigo = useCallback(async (codigo: string): Promise<Usuario> => {
    const { usuario } = await authService.confirmarCodigo(codigo);
    setUser(usuario);
    return usuario;
  }, []);

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
    confirmarCodigo,
    trocarSenha,
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
