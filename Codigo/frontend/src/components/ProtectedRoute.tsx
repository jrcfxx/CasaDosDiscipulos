import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserType } from "../services/authService";

type AllowedRole = UserType | UserType[];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireLiderCelula?: boolean;
  requireLiderMinisterio?: boolean;
  allowedRoles?: AllowedRole;
}

/**
 * ProtectedRoute Component
 * Protege rotas que requerem autenticação e autorização
 *
 * Regras de acesso:
 * - Administrador: Acessa todas as rotas de admin
 * - Líder: Acessa portal (módulos, formulários, lições) conforme permissões
 * - Membro: Acessa apenas realização de módulos
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireLiderCelula = false,
  requireLiderMinisterio = false,
  allowedRoles,
}) => {
  const { isAuthenticated, userType, isAdmin, isLiderCelula, isLiderMinisterio } = useAuth();

  // Se não estiver autenticado, redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se requer admin e não é admin, bloqueia acesso
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/portal/usuario" replace />;
  }

  // Se requer líder de célula (ex: Lições, Formulários), apenas líderes com essa permissão ou admin
  if (requireLiderCelula && !isAdmin && !isLiderCelula) {
    return <Navigate to="/portal/usuario" replace />;
  }

  // Se requer líder de ministério (ex: Escala), apenas líderes com essa permissão ou admin
  if (requireLiderMinisterio && !isAdmin && !isLiderMinisterio) {
    return <Navigate to="/portal/usuario" replace />;
  }

  // Se há roles específicas permitidas, verifica se o usuário tem permissão
  if (allowedRoles && userType) {
    const rolesArray = Array.isArray(allowedRoles)
      ? allowedRoles
      : [allowedRoles];

    if (!rolesArray.includes(userType)) {
      // Redireciona baseado no tipo de usuário
      if (userType === "administrador") {
        return <Navigate to="/portal/admin" replace />;
      }
      return <Navigate to="/portal/usuario" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
