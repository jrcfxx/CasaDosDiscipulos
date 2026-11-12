import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import StaffOrganograma from "../components/staff/StaffOrganograma";
import { getEstrutura, type StaffEstrutura } from "../services/staffService";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errorUtils";
import "../style/Portal.css";
import "../style/Staff.css";

/** Staff e estrutura da Casa — somente visualização (membros e líderes, após login) */
const StaffUser: React.FC = () => {
  const { isAdmin } = useAuth();
  const [estrutura, setEstrutura] = useState<StaffEstrutura | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    getEstrutura()
      .then(setEstrutura)
      .catch((err) => setErro(getErrorMessage(err, "Não foi possível carregar o organograma.")));
  }, []);

  return (
    <div className="portal-user">
      <Header />
      <main id="main-content" className="portal-wrap staff-pagina" tabIndex={-1}>
        <header className="portal-hero">
          <p className="portal-hero__label">Casa dos Discípulos</p>
          <h1 className="portal-hero__title">{estrutura?.titulo || "Staff e Estrutura"}</h1>
          {estrutura?.subtitulo && <p className="portal-hero__subtitle">{estrutura.subtitulo}</p>}
        </header>

        {isAdmin && (
          <p className="staff-pagina__aviso">
            Você é administrador: <Link to="/admin/staff">editar o organograma</Link>.
          </p>
        )}

        {erro && <p className="staff-pagina__erro" role="alert">{erro}</p>}
        {!erro && !estrutura && <p className="staff-pagina__carregando">Carregando…</p>}
        {estrutura && <StaffOrganograma estrutura={estrutura} mostrarCabecalho={false} />}

        <p className="staff-pagina__voltar">
          <Link to={isAdmin ? "/portal/admin" : "/portal/usuario"}>← Voltar ao Portal</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default StaffUser;
