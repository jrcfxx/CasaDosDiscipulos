import React from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import EditorModulo from "../components/modulos/EditorModulo";

/** Criar módulo: o editor é o mesmo da edição (components/modulos/EditorModulo) */
const CriarModulosEscolaDiscipulosAdmin: React.FC = () => (
  <div className="page-with-fixed-header">
    <Header />
    <main id="main-content" tabIndex={-1}>
      <EditorModulo />
    </main>
    <Footer />
  </div>
);

export default CriarModulosEscolaDiscipulosAdmin;
