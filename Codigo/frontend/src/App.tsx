import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { usePageTitle } from "./hooks/usePageTitle";

// Componentes
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas Públicas
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import SobreNos from "./pages/SobreNos";

// Páginas Autenticadas - Admin
import PortalDoDiscipuloAdmin from "./pages/PortalDoDiscipuloAdmin";
import GerirUser from "./pages/GerirUser";
import GerirCelulas from "./pages/GerirCelulas";
import LicoesSecretariaAdmin from "./pages/LicoesSecretariaAdmin";
import FormulariosSecretariaCelulasAdmin from "./pages/FormulariosSecretariaCelulasAdmin";
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
import FormulariosSecretariaCelulasLeader from "./pages/FormulariosSecretariaCelulasLeader";
import EscalaUser from "./pages/EscalaUser";
import EscalaMapa from "./pages/EscalaMapa";
import FalaAiDiscipulo from "./pages/FalaAiDiscipulo";
import FalaAiDiscipuloAdmin from "./pages/FalaAiDiscipuloAdmin";

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
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, userType, logout } = useAuth();
  usePageTitle(); // Atualiza título para leitores de tela

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
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

      {/* Células - Admin */}
      <Route
        path="/admin/celulas"
        element={
          <ProtectedRoute requireAdmin>
            <GerirCelulas />
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

      {/* Lições - Apenas Líder de Célula */}
      <Route
        path="/usuario/licoes"
        element={
          <ProtectedRoute requireLiderCelula>
            <LicaoSecretariaCelulaUser />
          </ProtectedRoute>
        }
      />

      {/* Formulários - Apenas Líder de Célula */}
      <Route
        path="/usuario/formularios"
        element={
          <ProtectedRoute requireLiderCelula>
            <FormulariosSecretariaCelulasLeader />
          </ProtectedRoute>
        }
      />

      {/* Escala - Todos os usuários (visualização); admin/líder podem editar */}
      <Route
        path="/usuario/escala"
        element={
          <ProtectedRoute>
            <EscalaUser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuario/escala/mapa"
        element={
          <ProtectedRoute>
            <EscalaMapa />
          </ProtectedRoute>
        }
      />

      {/* Fala Aí Discípulo - Devocional e Palavra do dia */}
      <Route
        path="/usuario/fala-ai"
        element={
          <ProtectedRoute>
            <FalaAiDiscipulo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuario/fala-ai/admin"
        element={
          <ProtectedRoute allowedRoles={["lider", "administrador"]}>
            <FalaAiDiscipuloAdmin />
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

      {/* ==================== ROTAS DE COMPATIBILIDADE ==================== */}
      {/* Redirecionamentos para URLs antigas (bookmarks, links externos) */}
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
        element={<Navigate to="/admin/formularios" replace />}
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
        element={
          <ProtectedRoute requireAdmin>
            <EditarModulosEscolaDiscipulosAdmin />
          </ProtectedRoute>
        }
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
