import React from "react";
import { Navigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import EditorModulo from "../components/modulos/EditorModulo";

/** Editar módulo: o editor é o mesmo da criação (components/modulos/EditorModulo) */
const EditarModulosEscolaDiscipulosAdmin: React.FC = () => {
  const { id_modulo } = useParams<{ id_modulo: string }>();
  const id = Number(id_modulo);
  if (!Number.isInteger(id) || id <= 0) return <Navigate to="/admin/modulos" replace />;
  return (
    <div className="page-with-fixed-header">
      <Header />
      <main id="main-content" tabIndex={-1}>
        {/* key: trocar de módulo pela URL recria o editor do zero */}
        <EditorModulo key={id} idModulo={id} />
      </main>
      <Footer />
    </div>
  );
};

export default EditarModulosEscolaDiscipulosAdmin;
