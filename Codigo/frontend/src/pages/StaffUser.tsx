import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import StaffOrganograma from "../components/staff/StaffOrganograma";
import { getEstrutura, type StaffEstrutura } from "../services/staffService";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errorUtils";
import BotoesExportar from "../components/ui/BotoesExportar";
import { exportarPdf } from "../utils/exportarPdf";
import { AberturaPortal } from "../components/portal/PortalInicio";
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
    <div className="pt">
      <Header />
      <main id="main-content" className="pt-paineis staff-pagina" tabIndex={-1}>
        <AberturaPortal
          etiqueta="Na Casa"
          titulo={estrutura?.titulo || "Staff e Estrutura"}
          descricao={estrutura?.subtitulo}
        />

        {estrutura && (
          <BotoesExportar
            className="staff-pagina__exportar"
            onPdf={() => exportarPdf(estrutura.titulo || "Staff e Estrutura", { paisagem: true })}
          />
        )}

        {isAdmin && (
          <p className="staff-pagina__aviso">
            Você é administrador: <Link to="/admin/staff">editar o organograma</Link>.
          </p>
        )}

        {erro && <p className="staff-pagina__erro" role="alert">{erro}</p>}
        {!erro && !estrutura && <p className="staff-pagina__carregando">Carregando…</p>}
        {estrutura && (
          <section className="staff-painel staff-painel--previa" aria-label="Organograma">
            <StaffOrganograma estrutura={estrutura} mostrarCabecalho={false} />
          </section>
        )}

        <p className="staff-pagina__voltar no-print">
          <Link to={isAdmin ? "/portal/admin" : "/portal/usuario"}>← Voltar ao Portal</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default StaffUser;
