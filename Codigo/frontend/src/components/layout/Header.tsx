import React, { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getUserProfile } from "../../services/usuario";
import { ASSETS_BASE } from "../../config/api";
import { useAuth } from "../../hooks/useAuth";
import NotificationsDropdown, { NotificationsBell } from "../NotificationsDropdown";
import Icone, { type NomeIcone } from "../ui/Icone";
import FocusTrap from "../ui/FocusTrap";
import "../../style/layout.css";
import "../../style/cabecalho.css";
import iconeIgreja from "../../assets/logo_mark.png";

interface ItemMenu {
  to: string;
  nome: string;
  descricao: string;
  icone: NomeIcone;
}
interface GrupoMenu {
  titulo: string;
  itens: ItemMenu[];
}

const TIPOS: Record<string, string> = { administrador: "Administrador", lider: "Líder", membro: "Membro" };

/** Itens do Portal conforme o papel (mesmas regras de acesso das rotas) */
function gruposPortal(admin: boolean, liderCelula: boolean, liderMinisterio: boolean): GrupoMenu[] {
  const grupos: GrupoMenu[] = [
    {
      titulo: "Na Casa",
      itens: [
        { to: "/usuario/escala", nome: "Escala", descricao: "Calendário e onde você serve", icone: "calendario" },
        ...(admin || liderMinisterio
          ? [{ to: "/usuario/escala/meus-ministerios", nome: "Meus ministérios", descricao: "Monte a escala da sua equipe", icone: "equipe" as NomeIcone }]
          : []),
        { to: "/usuario/escala/mapa", nome: "Mapa da Escala", descricao: "Visão geral dos eventos", icone: "mapa" },
        { to: "/usuario/fala-ai", nome: "Fala Aí, Discípulo", descricao: "Devocional e palavra do dia", icone: "conversa" },
      ],
    },
  ];
  if (admin || liderCelula) {
    grupos.push({
      titulo: "Secretaria das Células",
      itens: [
        ...(admin ? [{ to: "/admin/celulas", nome: "Células", descricao: "Grupos, líderes e endereços", icone: "casa" as NomeIcone }] : []),
        { to: admin ? "/admin/licoes" : "/usuario/licoes", nome: "Lições", descricao: "Material dos encontros", icone: "livro" },
        { to: admin ? "/admin/formularios" : "/usuario/formularios", nome: "Formulários", descricao: "Relatórios das células", icone: "lista" },
      ],
    });
  }
  grupos.push({
    titulo: "Escola de Discípulos",
    itens: [
      {
        to: admin ? "/admin/modulos" : "/usuario/modulos",
        nome: admin ? "Módulos" : "Minha trilha",
        descricao: admin ? "Conteúdo e ordem da formação" : "Seus módulos e progresso",
        icone: "formatura",
      },
      ...(admin ? [{ to: "/admin/quizzes", nome: "Quizzes", descricao: "Perguntas dos módulos", icone: "concluido" as NomeIcone }] : []),
    ],
  });
  return grupos;
}

const GESTAO: ItemMenu[] = [
  { to: "/admin/usuarios", nome: "Gerenciamento", descricao: "Usuários, níveis e ministérios", icone: "equipe" },
  { to: "/admin/eventos", nome: "Eventos", descricao: "Agenda e inscrições", icone: "calendario" },
  { to: "/admin/staff", nome: "Staff e Estrutura", descricao: "Organograma da Casa", icone: "coordenacao" },
  { to: "/admin/seguranca", nome: "Segurança", descricao: "Acessos, aparelhos e bloqueios", icone: "escudo" },
];

type Menu = "portal" | "gestao" | "perfil" | "notificacoes" | null;

/**
 * Cabeçalho das áreas logadas: marca, Portal (por papel), Gestão (admin), notificações e menu do usuário.
 * No celular os menus viram uma gaveta lateral.
 */
const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isLiderCelula, isLiderMinisterio, logout } = useAuth();
  const [aberto, setAberto] = useState<Menu>(null);
  const [gaveta, setGaveta] = useState(false);
  const [notifRefresh, setNotifRefresh] = useState(0);
  const [foto, setFoto] = useState<string | null>(null);
  const barraRef = useRef<HTMLDivElement>(null);
  const botaoGaveta = useRef<HTMLButtonElement>(null);
  const ids = useId();

  const grupos = gruposPortal(isAdmin, isLiderCelula, isLiderMinisterio);
  const portalInicio = isAdmin ? "/portal/admin" : "/portal/usuario";
  const caminho = location.pathname;
  const emPortal = grupos.some((g) => g.itens.some((i) => caminho.startsWith(i.to))) || caminho.startsWith("/portal");
  const emGestao = GESTAO.some((i) => caminho.startsWith(i.to));
  const primeiroNome = (user?.nome || "").split(" ")[0] || "Perfil";
  const iniciais = (user?.nome || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  useEffect(() => {
    getUserProfile()
      .then((d) => d?.foto && setFoto(d.foto.startsWith("http") ? d.foto : `${ASSETS_BASE}${d.foto}`))
      .catch(() => {});
  }, []);

  // Fecha tudo ao trocar de página
  useEffect(() => {
    setAberto(null);
    setGaveta(false);
  }, [caminho, location.hash]);

  // Clique fora e Esc fecham o menu aberto (Esc devolve o foco ao botão)
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest?.(`[data-menu="${aberto}"]`)) setAberto(null);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const botao = barraRef.current?.querySelector<HTMLButtonElement>(`[data-menu="${aberto}"] > button`);
      setAberto(null);
      botao?.focus();
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  useEffect(() => {
    if (!gaveta) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fecharGaveta();
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
    };
  }, [gaveta]);

  const fecharGaveta = () => {
    setGaveta(false);
    botaoGaveta.current?.focus();
  };

  const alternar = (m: Exclude<Menu, null>) => setAberto((a) => (a === m ? null : m));

  const sair = () => {
    logout();
    navigate("/", { replace: true });
  };

  const avatar = (tamanho: "p" | "g" = "p") => (
    <span className={`cb-avatar cb-avatar--${tamanho}`} aria-hidden>
      {foto ? <img src={foto} alt="" /> : iniciais}
    </span>
  );

  const linkItem = (i: ItemMenu, aoClicar?: () => void) => (
    <NavLink key={i.to} to={i.to} end className="cb-item" onClick={aoClicar}>
      <span className="cb-item__icone" aria-hidden><Icone nome={i.icone} tamanho={18} /></span>
      <span className="cb-item__texto">
        <span className="cb-item__nome">{i.nome}</span>
        <span className="cb-item__desc">{i.descricao}</span>
      </span>
    </NavLink>
  );

  return (
    <div className="top-bar-wrapper cb-wrapper">
      <header className="cd-header cb" ref={barraRef}>
        <Link to="/" className="cb-marca" aria-label="Casa dos Discípulos, página inicial">
          <span className="cb-marca__selo"><img src={iconeIgreja} alt="" /></span>
          <span className="cb-marca__texto" aria-hidden>
            <span className="cb-marca__linha1">Casa dos</span>
            <span className="cb-marca__linha2">Discípulos</span>
          </span>
        </Link>

        <nav className="cb-nav" aria-label="Menu principal">
          <NavLink to={portalInicio} end className={({ isActive }) => `cb-link${isActive ? " cb-link--ativo" : ""}`}>
            Início
          </NavLink>

          <div className="cb-menu" data-menu="portal">
            <button
              type="button"
              className={`cb-link${emPortal && !caminho.startsWith("/portal") ? " cb-link--ativo" : ""}${aberto === "portal" ? " cb-link--aberto" : ""}`}
              aria-expanded={aberto === "portal"}
              aria-controls={`${ids}-portal`}
              onClick={() => alternar("portal")}
            >
              Portal do Discípulo <Icone nome="abrir" tamanho={15} />
            </button>
            {aberto === "portal" && (
              <div id={`${ids}-portal`} className="cb-painel cb-painel--portal">
                <div className="cb-painel__grupos">
                  {grupos.map((g) => (
                    <section key={g.titulo} className="cb-grupo" aria-label={g.titulo}>
                      <p className="cb-grupo__titulo" aria-hidden>{g.titulo}</p>
                      {g.itens.map((i) => linkItem(i))}
                    </section>
                  ))}
                </div>
                <Link to={portalInicio} className="cb-painel__rodape">
                  <Icone nome="portal" tamanho={16} /> Ver todo o Portal
                  <Icone nome="proximo" tamanho={16} />
                </Link>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="cb-menu" data-menu="gestao">
              <button
                type="button"
                className={`cb-link${emGestao ? " cb-link--ativo" : ""}${aberto === "gestao" ? " cb-link--aberto" : ""}`}
                aria-expanded={aberto === "gestao"}
                aria-controls={`${ids}-gestao`}
                onClick={() => alternar("gestao")}
              >
                Gestão <Icone nome="abrir" tamanho={15} />
              </button>
              {aberto === "gestao" && (
                <div id={`${ids}-gestao`} className="cb-painel cb-painel--estreito">
                  <section className="cb-grupo" aria-label="Gestão">
                    <p className="cb-grupo__titulo" aria-hidden>Administração</p>
                    {GESTAO.map((i) => linkItem(i))}
                  </section>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="cb-direita">
          <div className="cb-menu header-notif-container" data-menu="notificacoes">
            <NotificationsBell
              refreshTrigger={notifRefresh}
              onClick={() => alternar("notificacoes")}
              ariaExpanded={aberto === "notificacoes"}
            />
            {aberto === "notificacoes" && (
              <NotificationsDropdown onClose={() => setAberto(null)} onRefresh={() => setNotifRefresh((v) => v + 1)} />
            )}
          </div>

          <div className="cb-menu cb-so-desktop" data-menu="perfil">
            <button
              type="button"
              className={`cb-perfil${aberto === "perfil" ? " cb-perfil--aberto" : ""}`}
              aria-expanded={aberto === "perfil"}
              aria-controls={`${ids}-perfil`}
              aria-label={`Menu de ${primeiroNome}`}
              onClick={() => alternar("perfil")}
            >
              {avatar()}
              <span className="cb-perfil__nome" aria-hidden>{primeiroNome}</span>
              <Icone nome="abrir" tamanho={15} />
            </button>
            {aberto === "perfil" && (
              <div id={`${ids}-perfil`} className="cb-painel cb-painel--perfil">
                <div className="cb-conta">
                  {avatar("g")}
                  <div className="cb-conta__texto">
                    <span className="cb-conta__nome">{user?.nome}</span>
                    <span className="cb-conta__email">{user?.email}</span>
                    {user?.tipo && <span className="cb-conta__tipo">{TIPOS[user.tipo] || user.tipo}</span>}
                  </div>
                </div>
                <div className="cb-lista">
                  <Link to="/perfil" className="cb-acao"><Icone nome="pessoa" tamanho={17} /> Meu perfil</Link>
                  <Link to="/perfil#duas-etapas" className="cb-acao"><Icone nome="escudo" tamanho={17} /> Segurança da conta</Link>
                  <Link to={portalInicio} className="cb-acao"><Icone nome="portal" tamanho={17} /> Meu portal</Link>
                </div>
                <button type="button" className="cb-acao cb-acao--sair" onClick={sair}>
                  <Icone nome="sair" tamanho={17} /> Sair
                </button>
              </div>
            )}
          </div>

          <button
            ref={botaoGaveta}
            type="button"
            className="cb-hamburguer"
            aria-expanded={gaveta}
            aria-controls={`${ids}-gaveta`}
            aria-label="Abrir menu"
            onClick={() => setGaveta(true)}
          >
            <Icone nome="menu" tamanho={22} />
          </button>
        </div>
      </header>

      {gaveta && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div className="cb-gaveta-fundo" onMouseDown={(e) => e.target === e.currentTarget && fecharGaveta()}>
          <FocusTrap focusTrapOptions={{ escapeDeactivates: false, allowOutsideClick: true }}>
            <div id={`${ids}-gaveta`} className="cb-gaveta" role="dialog" aria-modal="true" aria-label="Menu">
              <div className="cb-gaveta__topo">
                <div className="cb-conta">
                  {avatar("g")}
                  <div className="cb-conta__texto">
                    <span className="cb-conta__nome">{user?.nome}</span>
                    {user?.tipo && <span className="cb-conta__tipo">{TIPOS[user.tipo] || user.tipo}</span>}
                  </div>
                </div>
                <button type="button" className="cb-gaveta__fechar" onClick={fecharGaveta} aria-label="Fechar menu">
                  <Icone nome="fechar" tamanho={20} />
                </button>
              </div>
              <nav className="cb-gaveta__corpo" aria-label="Menu principal">
                <Link to={portalInicio} className="cb-gaveta__destaque">
                  <Icone nome="portal" tamanho={18} /> Início do Portal
                </Link>
                {grupos.map((g) => (
                  <section key={g.titulo} className="cb-grupo" aria-label={g.titulo}>
                    <p className="cb-grupo__titulo" aria-hidden>{g.titulo}</p>
                    {g.itens.map((i) => linkItem(i))}
                  </section>
                ))}
                {isAdmin && (
                  <section className="cb-grupo" aria-label="Gestão">
                    <p className="cb-grupo__titulo" aria-hidden>Gestão</p>
                    {GESTAO.map((i) => linkItem(i))}
                  </section>
                )}
                <section className="cb-grupo" aria-label="Minha conta">
                  <p className="cb-grupo__titulo" aria-hidden>Minha conta</p>
                  <Link to="/perfil" className="cb-acao"><Icone nome="pessoa" tamanho={17} /> Meu perfil</Link>
                  <Link to="/perfil#duas-etapas" className="cb-acao"><Icone nome="escudo" tamanho={17} /> Segurança da conta</Link>
                  <button type="button" className="cb-acao cb-acao--sair" onClick={sair}>
                    <Icone nome="sair" tamanho={17} /> Sair
                  </button>
                </section>
              </nav>
            </div>
          </FocusTrap>
        </div>
      )}
    </div>
  );
};

export default Header;
