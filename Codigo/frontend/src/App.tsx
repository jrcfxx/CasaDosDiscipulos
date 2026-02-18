import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

// Componentes
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas Públicas
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import SobreNos from "./pages/SobreNos";

// Páginas Autenticadas - Admin
import PortalDoDiscipuloAdmin from "./pages/PortalDoDiscipuloAdmin";
import GerirUser from "./pages/GerirUser";
import LicoesSecretariaAdmin from "./pages/LicoesSecretariaAdmin";
import CriarLicoesSecretariaAdmin from "./pages/CriarLicoesSecretariaAdmin";
import EditarLicoesSecretariaAdmin from "./pages/EditarLicoesSecretariaAdmin";
import FormulariosSecretariaCelulasAdmin from "./pages/FormulariosSecretariaCelulasAdmin";
import CriarFormulariosSecretariaCelulasAdmin from "./pages/CriarFormulariosSecretariaCelulasAdmin";
import ModulosEscolaDiscipulosAdmin from "./pages/ModulosEscolaDiscipulosAdmin";
import CriarModulosEscolaDiscipulosAdmin from "./pages/CriarModulosEscolaDiscipulosAdmin";
import EditarModulosEscolaDiscipulosAdmin from "./pages/EditarModulosEscolaDiscipulosAdmin";
import QuizzesSecretariaCelulasAdmin from "./pages/QuizzesSecretariaCelulasAdmin";
import CriarQuizzesSecretariaCelulasAdmin from "./pages/CriarQuizzesSecretariaCelulasAdmin";
import EditarQuizzesSecretariaCelulas from "./pages/EditarQuizzesSecretariaCelulas";
import EventosAdmin from "./pages/EventosAdmin";

// Páginas Autenticadas - Usuário
import PortalDoDiscipuloUser from "./pages/PortalDoDiscipuloUser";
import ModulosEscolaDiscipulosUser from "./pages/ModulosEscolaDiscipulosUser";
import PreencherModulosEscolaDiscipulosUser from "./pages/PreencherModulosEscolaDiscipulosUser";
import LicaoSecretariaCelulaUser from "./pages/LicaoSecretariaCelulaUser";
import InicioFormularioSecretariaUser from "./pages/InicioFormularioSecretariaUser";
import FormulariosSecretariaCelulasLeader from "./pages/FormulariosSecretariaCelulasLeader";
import PreencherFormularioSecretariaUser from "./pages/PreencherFormularioSecretariaUser";

// Páginas Comuns
import Perfil from "./pages/Perfil";

/**
 * App Component
 * Gerencia rotas e autenticação da aplicação
 *
 * Regras de Autorização:
 *
 * ADMINISTRADOR:
 * - Acessa todas as rotas de /admin/*
 * - Portal admin, gestão de usuários, módulos, quizzes, lições, formulários, eventos
 *
 * LÍDER:
 * - Módulos: Listagem, realização e ranking
 * - Formulários: Visualização e preenchimento
 * - Lições: Visualização
 *
 * MEMBRO:
 * - Módulos: Realização apenas
 */
export default function App() {
  const { isAuthenticated, isAdmin, userType, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  // Determina o portal correto baseado no tipo de usuário
  const getPortalPath = () => {
    if (!isAuthenticated || !userType) return "/";

    if (userType === "administrador") {
      return "/portal/admin";
    }
    return "/portal/usuario";
  };

  return (
    <Routes>
      {/* ==================== ROTAS PÚBLICAS ==================== */}

      {/* Página Inicial (Landing Page) - mesma para logados e não logados */}
      <Route path="/" element={<HomePage />} />

      {/* Home Page - Alias para compatibilidade */}
      <Route path="/home" element={<HomePage />} />

      {/* A casa */}
      <Route path="/sobre-nos" element={<SobreNos />} />

      {/* Login - Redireciona para portal se já autenticado */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getPortalPath()} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* ==================== ROTAS PROTEGIDAS - ADMIN ==================== */}

      {/* Portal Admin */}
      <Route
        path="/portal/admin"
        element={
          <ProtectedRoute requireAdmin>
            <PortalDoDiscipuloAdmin
              onNavigate={(tela) => {
                if (tela === "logout") handleLogout();
              }}
            />
          </ProtectedRoute>
        }
      />

      {/* Gerenciar Usuários */}
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute requireAdmin>
            <GerirUser />
          </ProtectedRoute>
        }
      />

      {/* Lições - Admin */}
      <Route
        path="/admin/licoes"
        element={
          <ProtectedRoute requireAdmin>
            <LicoesSecretariaAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/licoes/criar"
        element={
          <ProtectedRoute requireAdmin>
            <CriarLicoesSecretariaAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/licoes/editar/:id"
        element={
          <ProtectedRoute requireAdmin>
            <EditarLicoesSecretariaAdmin />
          </ProtectedRoute>
        }
      />

      {/* Formulários - Admin */}
      <Route
        path="/admin/formularios"
        element={
          <ProtectedRoute requireAdmin>
            <FormulariosSecretariaCelulasAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/formularios/criar"
        element={
          <ProtectedRoute requireAdmin>
            <CriarFormulariosSecretariaCelulasAdmin />
          </ProtectedRoute>
        }
      />

      {/* Módulos - Admin */}
      <Route
        path="/admin/modulos"
        element={
          <ProtectedRoute requireAdmin>
            <ModulosEscolaDiscipulosAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/modulos/criar"
        element={
          <ProtectedRoute requireAdmin>
            <CriarModulosEscolaDiscipulosAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/modulos/editar/:id_modulo"
        element={
          <ProtectedRoute requireAdmin>
            <EditarModulosEscolaDiscipulosAdmin />
          </ProtectedRoute>
        }
      />

      {/* Quizzes - Admin */}
      <Route
        path="/admin/quizzes"
        element={
          <ProtectedRoute requireAdmin>
            <QuizzesSecretariaCelulasAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/quizzes/criar"
        element={
          <ProtectedRoute requireAdmin>
            <CriarQuizzesSecretariaCelulasAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/quizzes/editar/:id"
        element={
          <ProtectedRoute requireAdmin>
            <EditarQuizzesSecretariaCelulas />
          </ProtectedRoute>
        }
      />

      {/* Eventos - Admin */}
      <Route
        path="/admin/eventos"
        element={
          <ProtectedRoute requireAdmin>
            <EventosAdmin />
          </ProtectedRoute>
        }
      />

      {/* ==================== ROTAS PROTEGIDAS - USUÁRIO ==================== */}

      {/* Portal Usuário - Líder e Membro */}
      <Route
        path="/portal/usuario"
        element={
          <ProtectedRoute allowedRoles={["lider", "membro"]}>
            <PortalDoDiscipuloUser />
          </ProtectedRoute>
        }
      />

      {/* Módulos - Líder (listagem + realização) e Membro (apenas realização) */}
      <Route
        path="/usuario/modulos"
        element={
          <ProtectedRoute allowedRoles={["lider", "membro"]}>
            <ModulosEscolaDiscipulosUser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuario/modulos/preencher/:id"
        element={
          <ProtectedRoute allowedRoles={["lider", "membro"]}>
            <PreencherModulosEscolaDiscipulosUser />
          </ProtectedRoute>
        }
      />

      {/* Lições - Apenas Líder */}
      <Route
        path="/usuario/licoes"
        element={
          <ProtectedRoute allowedRoles="lider">
            <LicaoSecretariaCelulaUser />
          </ProtectedRoute>
        }
      />

      {/* Formulários - Apenas Líder */}
      <Route
        path="/usuario/formularios"
        element={
          <ProtectedRoute allowedRoles="lider">
            <FormulariosSecretariaCelulasLeader />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuario/formularios/preencher/:id"
        element={
          <ProtectedRoute allowedRoles="lider">
            <PreencherFormularioSecretariaUser />
          </ProtectedRoute>
        }
      />

      {/* ==================== ROTAS COMUNS (AUTENTICADAS) ==================== */}

      {/* Perfil */}
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        }
      />

      {/* ==================== ROTAS DE COMPATIBILIDADE (DEPRECATED) ==================== */}

      {/* Redirecionamentos para manter compatibilidade com URLs antigas */}
      <Route path="/HomePage" element={<Navigate to="/home" replace />} />
      <Route
        path="/portal"
        element={
          <Navigate
            to={isAdmin ? "/portal/admin" : "/portal/usuario"}
            replace
          />
        }
      />
      <Route
        path="/GerenciarUsuarios"
        element={<Navigate to="/admin/usuarios" replace />}
      />
      <Route
        path="/LicoesSecretariaAdmin"
        element={<Navigate to="/admin/licoes" replace />}
      />
      <Route
        path="/FormulariosSecretariaCelulasAdmin"
        element={<Navigate to="/admin/formularios" replace />}
      />
      <Route
        path="/CriarFormulariosSecretariaCelulasAdmin"
        element={<Navigate to="/admin/formularios/criar" replace />}
      />
      <Route
        path="/ModulosEscolaDiscipulosAdmin"
        element={<Navigate to="/admin/modulos" replace />}
      />
      <Route
        path="/CriarModulosEscolaDiscipulosAdmin"
        element={<Navigate to="/admin/modulos/criar" replace />}
      />
      <Route
        path="/EditarModulosEscolaDiscipulosAdmin/:id_modulo"
        element={<EditarModulosEscolaDiscipulosAdmin />}
      />
      <Route
        path="/QuizzesSecretariaCelulasAdmin"
        element={<Navigate to="/admin/quizzes" replace />}
      />

      {/* ==================== FALLBACK ==================== */}

      {/* Rota padrão - Redireciona baseado no estado de autenticação e tipo de usuário */}
      <Route path="*" element={<Navigate to={getPortalPath()} replace />} />
    </Routes>
  );
}
