import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import "../style/CriarQuizzesSecretariaCelulasAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";

type Campo = { id: number; rotulo: string };

export default function EditarQuizzesSecretariaCelulas() {
  const location = useLocation() as { state?: { titulo?: string; data?: any } };
  const params = useParams<{ titulo?: string }>();

  // 🔹 Título da página
  const titulo = useMemo(() => {
    const viaState = location.state?.titulo?.trim();
    const viaParam = params.titulo?.trim();
    const viaQuery = new URLSearchParams(window.location.search)
      .get("titulo")
      ?.trim();
    return viaState || viaParam || viaQuery || "Editar Quiz";
  }, [location.state, params.titulo]);

  // 🔹 Estados principais
  const [descricao, setDescricao] = useState("");
  const [campos, setCampos] = useState<Campo[]>([]);
  const [liberado, setLiberado] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);

  // 🔹 Modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Carrega dados iniciais ---
  useEffect(() => {
    const savedData = location.state?.data;
    if (savedData) {
      setDescricao(savedData.descricao || "");
      setCampos(savedData.campos || []);
      setLiberado(savedData.liberado_para_alunos || false);
    }
  }, [location.state]);

  // --- Manipuladores ---
  const abrirSeletorArquivo = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setArquivo(f);
  };

  const adicionarCampo = () =>
    setCampos((prev) => [...prev, { id: Date.now(), rotulo: "" }]);

  const atualizarRotulo = (idx: number, valor: string) => {
    setCampos((prev) => {
      const novo = [...prev];
      novo[idx] = { ...novo[idx], rotulo: valor };
      return novo;
    });
  };

  const removerCampo = (id: number) =>
    setCampos((prev) => prev.filter((c) => c.id !== id));

  const mover = (idx: number, dir: "up" | "down") => {
    setCampos((prev) => {
      const arr = [...prev];
      if (dir === "up" && idx > 0)
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      if (dir === "down" && idx < arr.length - 1)
        [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
      return arr;
    });
  };

  // --- SALVAR (simula update) ---
  const salvarAlteracoes = () => {
    setToast("Alterações salvas com sucesso ✅");
  };

  // --- EXCLUIR FORMULÁRIO ---
  const excluirFormulario = () => {
    setShowDeleteModal(false);
    setDescricao("");
    setCampos([]);
    setArquivo(null);
    setLiberado(false);
    setToast("Formulário excluído.");
  };

  useEffect(() => {
    if (showDeleteModal && confirmBtnRef.current) confirmBtnRef.current.focus();
  }, [showDeleteModal]);

  const onModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setShowDeleteModal(false);
  };

  const PaperClipIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.5 12.5l5.3-5.3a3 3 0 1 1 4.24 4.24l-7.07 7.07a5 5 0 0 1-7.07-7.07l7.07-7.07"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  return (
    <div className="page-with-fixed-header">
      <Header />

      <main className="cf-main container-centered">
        <h1 className="cf-title">{titulo.toUpperCase()}</h1>

        <div className="cf-grid">
          <section className="cf-card cf-left" aria-labelledby="perguntas-h2">
            <div className="cf-card-inner">
              <h2 id="perguntas-h2" className="cf-card-title">
                Editar Perguntas
              </h2>

              <div className="cf-block">
                <div className="cf-label-row">
                  <span className="cf-label">Descrição</span>
                </div>
                <textarea
                  className="cf-textarea"
                  placeholder="Edite a descrição…"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
                <div className="cf-sep" />
              </div>

              <div className="cf-block">
                <div className="cf-add-row">
                  <span className="cf-label">Campos</span>
                  <button
                    type="button"
                    className="cf-icon-btn"
                    title="Adicionar novo campo"
                    onClick={adicionarCampo}
                  >
                    +
                  </button>
                </div>

                <div className="cf-list">
                  {campos.map((c, idx) => (
                    <div key={c.id} className="cf-item">
                      <input
                        className="cf-input-inline"
                        placeholder="Edite o campo…"
                        value={c.rotulo}
                        onChange={(e) => atualizarRotulo(idx, e.target.value)}
                      />
                      <div className="cf-item-actions">
                        <button
                          className="cf-mini"
                          onClick={() => mover(idx, "up")}
                        >
                          ↑
                        </button>
                        <button
                          className="cf-mini"
                          onClick={() => mover(idx, "down")}
                        >
                          ↓
                        </button>
                        <button
                          className="cf-mini danger"
                          onClick={() => removerCampo(c.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cf-sep" />
              </div>

              <div className="cf-block">
                <div className="cf-label-row">
                  <span className="cf-label">Anexar novo arquivo</span>
                </div>

                <div className="cf-file-row">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="cf-file-hidden"
                    onChange={onFileChange}
                  />
                  <button
                    type="button"
                    className="cf-clip-btn"
                    onClick={abrirSeletorArquivo}
                  >
                    <PaperClipIcon />
                  </button>
                  <span className="cf-file-name">
                    {arquivo ? arquivo.name : "Nenhum arquivo selecionado."}
                  </span>
                </div>
              </div>

              <div className="cf-actions">
                <button className="cf-save" onClick={salvarAlteracoes}>
                  Salvar Alterações
                </button>
                <button
                  className="cf-delete-trigger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Excluir formulário
                </button>
              </div>
            </div>
          </section>

          <aside className="cf-card cf-right" aria-label="Liberar para alunos">
            <button
              type="button"
              className="cf-right-inner"
              onClick={() => setLiberado((v) => !v)}
            >
              <div className="cf-right-row">
                <span className="cf-right-text">Liberar para alunos</span>
                <span className="cf-eye" aria-hidden>
                  👁
                </span>
              </div>
              <div className="cf-right-rule" />
              <div className={`cf-right-status ${liberado ? "ok" : "off"}`}>
                {liberado ? "Liberado" : "Não liberado"}
              </div>
            </button>
          </aside>
        </div>
      </main>

      <Footer />

      {showDeleteModal && (
        <div
          className="cf-modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="cf-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cf-modal-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onModalKeyDown}
          >
            <h3 id="cf-modal-title" className="cf-modal-title center">
              Excluir formulário?
            </h3>
            <p className="cf-modal-text center">
              Esta ação não pode ser desfeita.
            </p>

            <div className="cf-modal-actions">
              <button
                ref={confirmBtnRef}
                className="cf-btn cf-btn-danger"
                onClick={excluirFormulario}
              >
                Excluir
              </button>
              <button
                className="cf-btn cf-btn-neutral"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} variant="success" />
      )}
    </div>
  );
}
