import React from "react";
import { Navigate } from "react-router-dom";
import authService, { UserType } from "../services/authService";

type AllowedRole = UserType | UserType[];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: AllowedRole;
}

/**
 * ProtectedRoute Component
 * Protege rotas que requerem autenticação e autorização
 *
 * Regras de acesso:
 * - Administrador: Acessa todas as rotas de admin
 * - Líder: Acessa portal (módulos, formulários, lições)
 * - Membro: Acessa apenas realização de módulos
 *
 * @param requireAdmin - Requer que o usuário seja administrador
 * @param allowedRoles - Tipos de usuário permitidos (administrador, lider, membro)
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  allowedRoles,
}) => {
  const isAuthenticated = authService.isAuthenticated();
  const userType = authService.getUserType();

  // Se não estiver autenticado, redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se requer admin e não é admin, bloqueia acesso
  if (requireAdmin && userType !== "administrador") {
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
