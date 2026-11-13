import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Casa dos Discípulos – Página inicial",
  "/home": "Casa dos Discípulos – Página inicial",
  "/login": "Casa dos Discípulos – Entrar",
  "/criar-senha": "Casa dos Discípulos – Crie sua senha",
  "/sobre-nos": "Casa dos Discípulos – Sobre nós",
  "/celulas": "Casa dos Discípulos – Células",
  "/portal/admin": "Casa dos Discípulos – Portal Admin",
  "/portal/usuario": "Casa dos Discípulos – Portal do Discípulo",
  "/admin/usuarios": "Casa dos Discípulos – Gerenciar usuários",
  "/admin/celulas": "Casa dos Discípulos – Gerenciar células",
  "/admin/licoes": "Casa dos Discípulos – Lições",
  "/admin/formularios": "Casa dos Discípulos – Formulários",
  "/admin/modulos": "Casa dos Discípulos – Módulos",
  "/admin/quizzes": "Casa dos Discípulos – Quiz",
  "/admin/eventos": "Casa dos Discípulos – Eventos",
  "/usuario/modulos": "Casa dos Discípulos – Meus módulos",
  "/usuario/licoes": "Casa dos Discípulos – Lições",
  "/usuario/formularios": "Casa dos Discípulos – Formulários",
  "/usuario/escala": "Casa dos Discípulos – Escala",
  "/usuario/escala/mapa": "Casa dos Discípulos – Mapa da escala",
  "/usuario/escala/meus-ministerios": "Casa dos Discípulos – Meus ministérios",
  "/usuario/fala-ai": "Casa dos Discípulos – Fala Aí, Discípulo",
  "/perfil": "Casa dos Discípulos – Meu perfil",
  "/usuario/staff": "Casa dos Discípulos – Staff e Estrutura",
  "/admin/staff": "Casa dos Discípulos – Staff e Estrutura",
  "/usuario/fala-ai/admin": "Casa dos Discípulos – Fala Aí (gerenciar)",
};

/**
 * Atualiza o título da página conforme a rota.
 * Essencial para usuários de leitores de tela saberem onde estão.
 */
export function usePageTitle() {
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    const baseTitle = "Casa dos Discípulos";
    let title = ROUTE_TITLES[path];

    if (!title) {
      if (path.startsWith("/admin/modulos/editar")) title = `${baseTitle} – Editar módulo`;
      else if (path.startsWith("/admin/modulos/criar")) title = `${baseTitle} – Novo módulo`;
      else if (path.startsWith("/admin/quizzes/editar")) title = `${baseTitle} – Editar quiz`;
      else if (path.startsWith("/admin/quizzes/criar")) title = `${baseTitle} – Novo quiz`;
      else if (path.startsWith("/usuario/modulos/preencher"))
        title = `${baseTitle} – Preencher módulo`;
      else title = baseTitle;
    }

    document.title = title;
  }, [path]);
}
