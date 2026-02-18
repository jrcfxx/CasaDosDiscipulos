import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/InicioFormularioSecretariaUser.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

interface Formulario {
  id: number;
  nome: string;
}

export default function InicioFormularioSecretariaUser() {
  const navigate = useNavigate();

  const [formularios] = useState<Formulario[]>([
    { id: 1, nome: "Formulário 1" },
    { id: 2, nome: "Formulário 2" },
    { id: 3, nome: "Formulário 3" },
    { id: 4, nome: "Formulário 4" },
  ]);

  return (
    <div className="page-with-fixed-header">
      <Header />

      <main className="fs-page">
        <h1 className="fs-title">SECRETARIA DAS CÉLULAS</h1>

        <div className="fs-card">
          <h2 className="fs-subtitle">FORMULÁRIOS</h2>

          {formularios.map((form) => (
            <div className="fs-row" key={form.id}>
              <span className="fs-form-nome">{form.nome.toUpperCase()}</span>
              <button
                className="fs-eye-btn"
                onClick={() => navigate(`/visualizar-formulario/${form.id}`)}
                title="Visualizar formulário"
                aria-label={`Visualizar ${form.nome}`}
              >
                👁
              </button>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
