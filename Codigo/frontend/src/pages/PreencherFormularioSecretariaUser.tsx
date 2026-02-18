import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import "../style/PreencherFormularioSecretariaUser.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function PreencherFormularioSecretariaUser() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation() as { state?: { titulo?: string } };

  const [titulo, setTitulo] = useState("Formulário");
  useEffect(() => {
    const viaState = location.state?.titulo?.trim();
    setTitulo(viaState || (id ? `Formulário ${id}` : "Formulário"));
  }, [id, location.state]);

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [modulo, setModulo] = useState("");
  const [feedback, setFeedback] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!showSuccess) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSuccess(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSuccess]);

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
  };

  return (
    <div className="page-with-fixed-header">
      <Header />

      <main className="pfu-main container-centered">
        <h1 className="pfu-title">{titulo}</h1>

        <form className="pfu-card" onSubmit={salvar}>
          <div className="pfu-row">
            <div className="pfu-field">
              <label className="pfu-label" htmlFor="nome">
                Nome
              </label>
              <input
                id="nome"
                className="pfu-input"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome"
                required
              />
            </div>

            <div className="pfu-field">
              <label className="pfu-label" htmlFor="sobrenome">
                Sobrenome
              </label>
              <input
                id="sobrenome"
                className="pfu-input"
                type="text"
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
                placeholder="Digite seu sobrenome"
              />
            </div>
          </div>

          <div className="pfu-row">
            <div className="pfu-field">
              <label className="pfu-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="pfu-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                required
              />
            </div>

            <div className="pfu-field">
              <label className="pfu-label" htmlFor="modulo">
                Módulo atual
              </label>
              <select
                id="modulo"
                className="pfu-select"
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Módulo 1">Módulo 1</option>
                <option value="Módulo 2">Módulo 2</option>
                <option value="Módulo 3">Módulo 3</option>
              </select>
            </div>
          </div>

          <div className="pfu-row single">
            <div className="pfu-field">
              <label className="pfu-label" htmlFor="feedback">
                Feedback*
              </label>
              <textarea
                id="feedback"
                className="pfu-textarea"
                placeholder="Digite aqui seu feedback..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pfu-actions">
            <button type="submit" className="pfu-save">
              Enviar resposta
            </button>
          </div>
        </form>
      </main>

      <Footer />

      {showSuccess && (
        <div
          className="pfu-modal-overlay"
          onClick={() => setShowSuccess(false)}
          role="presentation"
        >
          <div
            className="pfu-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pfu-success-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="pfu-success-title" className="pfu-modal-title">
              Resposta enviada ✅
            </h3>
            <p className="pfu-modal-text">
              Recebemos suas informações com sucesso.
            </p>
            <div className="pfu-modal-actions">
              <button
                className="pfu-btn pfu-btn-primary"
                onClick={() => setShowSuccess(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
