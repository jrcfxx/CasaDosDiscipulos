import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUserProfile } from "../../services/usuario";
import { ASSETS_BASE } from "../../config/api";
import { useAuth } from "../../hooks/useAuth";
import NotificationsDropdown, { NotificationsBell } from "../NotificationsDropdown";
import "../../style/layout.css";
import iconeIgreja from "../../assets/logo.png";

const ProfileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

/**
 * Header Component Unificado
 *
 * Exibe opções baseadas no tipo de usuário:
 * - Administrador: Todas as opções
 * - Líder: Home, Portal, Módulos, Formulários, Lições, Perfil
 * - Membro: Home, Portal, Módulos, Perfil
 */
const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isLiderCelula, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRefreshTrigger, setNotifRefreshTrigger] = useState(0);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalDropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUserPhoto() {
      try {
        const data = await getUserProfile();
        if (data?.foto) {
          const fotoUrl = data.foto.startsWith("http")
            ? data.foto
            : `${ASSETS_BASE}${data.foto}`;
          setUserPhoto(fotoUrl);
        }
      } catch (err) {
        console.error("Erro ao carregar foto do usuário:", err);
      }
    }

    fetchUserPhoto();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handlePerfil = () => {
    setDropdownOpen(false);
    navigate("/perfil");
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const togglePortalDropdown = () => {
    setPortalDropdownOpen(!portalDropdownOpen);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        portalDropdownRef.current &&
        !portalDropdownRef.current.contains(event.target as Node)
      ) {
        setPortalDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };

    if (dropdownOpen || portalDropdownOpen || notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen, portalDropdownOpen, notifOpen]);

  return (
    <div className="top-bar-wrapper">
      <header className="cd-header">
        <Link to="/" className="header-icone header-logo-link">
          <img src={iconeIgreja} alt="Casa dos Discípulos" />
        </Link>

        <nav className="header-links" aria-label="Menu principal">
          <Link to="/home">HOME</Link>

          <div className="nav-dropdown-container" ref={portalDropdownRef}>
            <button
              className="nav-dropdown-btn"
              onClick={togglePortalDropdown}
              aria-expanded={portalDropdownOpen}
              aria-haspopup="true"
              aria-label="Abrir menu Portal do Discípulo"
            >
              PORTAL DO DISCÍPULO
              <svg
                className={`dropdown-arrow ${portalDropdownOpen ? "open" : ""}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {portalDropdownOpen && (
              <div className="nav-dropdown-menu">
                <div className="nav-dropdown-section nav-dropdown-portal">
                  <Link
                    to={isAdmin ? "/portal/admin" : "/portal/usuario"}
                    onClick={() => setPortalDropdownOpen(false)}
                  >
                    Portal
                  </Link>
                </div>

                {/* Na Casa - Todos os usuários */}
                <div className="nav-dropdown-section">
                  <p className="nav-dropdown-title">NA CASA</p>
                  <Link
                    to="/usuario/escala"
                    onClick={() => setPortalDropdownOpen(false)}
                  >
                    Escala (Calendário)
                  </Link>
                  <Link
                    to="/usuario/escala/mapa"
                    onClick={() => setPortalDropdownOpen(false)}
                  >
                    Mapa da Escala
                  </Link>
                  <Link
                    to="/usuario/fala-ai"
                    onClick={() => setPortalDropdownOpen(false)}
                  >
                    Fala Aí, Discípulo
                  </Link>
                </div>

                {/* Secretaria das Células - Admin e Líder de Célula */}
                {(isAdmin || isLiderCelula) && (
                  <div className="nav-dropdown-section">
                    <p className="nav-dropdown-title">SECRETARIA DAS CÉLULAS</p>
                    {isAdmin && (
                      <Link
                        to="/admin/celulas"
                        onClick={() => setPortalDropdownOpen(false)}
                      >
                        Células
                      </Link>
                    )}
                    <Link
                      to={isAdmin ? "/admin/licoes" : "/usuario/licoes"}
                      onClick={() => setPortalDropdownOpen(false)}
                    >
                      Lições
                    </Link>
                    <Link
                      to={
                        isAdmin ? "/admin/formularios" : "/usuario/formularios"
                      }
                      onClick={() => setPortalDropdownOpen(false)}
                    >
                      Formulários
                    </Link>
                  </div>
                )}

                {/* Escola de Discípulos - Todos */}
                <div className="nav-dropdown-section">
                  <p className="nav-dropdown-title">ESCOLA DE DISCÍPULOS</p>
                  <Link
                    to={isAdmin ? "/admin/modulos" : "/usuario/modulos"}
                    onClick={() => setPortalDropdownOpen(false)}
                  >
                    Módulos
                  </Link>

                  {/* Quiz - Apenas Admin */}
                  {isAdmin && (
                    <Link
                      to="/admin/quizzes"
                      onClick={() => setPortalDropdownOpen(false)}
                    >
                      Quiz
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Gerenciar Usuários - Apenas Admin */}
          {isAdmin && (
            <Link
              to="/admin/usuarios"
              aria-current={location.pathname === "/admin/usuarios" ? "page" : undefined}
            >
              GERENCIAMENTO
            </Link>
          )}
        </nav>

        <div className="header-right-group">
          <div className="header-notif-container" ref={notifRef}>
            <NotificationsBell
              refreshTrigger={notifRefreshTrigger}
              onClick={() => setNotifOpen(!notifOpen)}
              ariaExpanded={notifOpen}
            />
            {notifOpen && (
              <NotificationsDropdown
                onClose={() => setNotifOpen(false)}
                onRefresh={() => setNotifRefreshTrigger((v) => v + 1)}
              />
            )}
          </div>
          <div className="header-profile-container" ref={dropdownRef}>
          <button
            className="header-profile-btn"
            title="Perfil"
            onClick={toggleDropdown}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="Abrir menu do perfil"
          >
            {userPhoto ? (
              <img
                src={userPhoto}
                alt="Foto de perfil"
                className="header-profile-photo"
              />
            ) : (
              <ProfileIcon />
            )}
          </button>

          {dropdownOpen && (
            <div className="profile-dropdown">
              <button className="dropdown-item" onClick={handlePerfil}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Editar Perfil
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sair
              </button>
            </div>
          )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
