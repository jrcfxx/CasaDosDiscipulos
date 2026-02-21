import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/ModulosEscolaDiscipulosAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import RankingCard, { type RankItem } from "../components/modulos/RankingCard";
import ConfirmModal from "../components/ui/ConfirmModal";
import DarPontosModal from "../components/ui/DarPontosModal";
import Toast from "../components/ui/Toast";
import { formatarConteudoCampo } from "../utils/moduloConteudoUtils";
import moduloService from "../services/moduloService";
import usuarioService from "../services/usuarioService";
import { Modulo } from "../types";

const ModulosEscolaDiscipulosAdmin: React.FC = () => {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [selectedModulo, setSelectedModulo] = useState<Modulo | null>(null);
  const [quizVinculado, setQuizVinculado] = useState<any>(null);
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchModulos(), fetchRanking()]);
    setLoading(false);
  };

  const fetchModulos = async () => {
    try {
      const data = await moduloService.getAll();
      setModulos(data);
      if (data.length > 0 && !selectedModulo) {
        const primeiroModulo = data[0];
        setSelectedModulo(primeiroModulo);
        await loadQuizVinculado(primeiroModulo.id_modulo);
      }
    } catch (error) {
      console.error("Erro ao carregar módulos:", error);
    }
  };

  const fetchRanking = async () => {
    try {
      const topUsuarios = await moduloService.getRanking(20);
      setRanking(topUsuarios as RankItem[]);
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await moduloService.toggleActive(id);
      const data = await moduloService.getAll();
      setModulos(data);

      // Se o módulo alterado é o que está selecionado, atualizar a visualização
      if (selectedModulo && selectedModulo.id_modulo === id) {
        const moduloAtualizado = data.find((m) => m.id_modulo === id);
        if (moduloAtualizado) {
          setSelectedModulo(moduloAtualizado);
          await loadQuizVinculado(moduloAtualizado.id_modulo);
        }
      }
    } catch (error) {
      console.error("Erro ao alternar módulo:", error);
    }
  };

  const loadQuizVinculado = async (moduloId: number) => {
    try {
      const quiz = await moduloService.getQuizVinculado(moduloId);
      setQuizVinculado(quiz);
    } catch (error) {
      console.error("Erro ao carregar quiz vinculado:", error);
      setQuizVinculado(null);
    }
  };

  const handleSelectModulo = async (modulo: Modulo) => {
    setSelectedModulo(modulo);
    await loadQuizVinculado(modulo.id_modulo);
  };

  const [excluindo, setExcluindo] = useState(false);
  const [showConfirmExcluir, setShowConfirmExcluir] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [modalDarPontosAberto, setModalDarPontosAberto] = useState(false);

  const executarExclusao = async () => {
    if (!selectedModulo) return;
    setShowConfirmExcluir(false);
    setExcluindo(true);
    try {
      await moduloService.deletePermanente(selectedModulo.id_modulo);
      const data = await moduloService.getAll();
      setModulos(data);
      setSelectedModulo(data.length > 0 ? data[0] : null);
      if (data.length > 0) {
        await loadQuizVinculado(data[0].id_modulo);
      } else {
        setQuizVinculado(null);
      }
      setToast("Módulo excluído com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir módulo:", error);
      setToast("Erro ao excluir módulo. Tente novamente.");
    } finally {
      setExcluindo(false);
    }
  };

  const handleDarPontos = async (id_usuario: number, pontos: number, motivo: string) => {
    const usuario = await usuarioService.addPontuacaoManual(id_usuario, { pontos, motivo });
    setToast(`Pontuação atribuída! ${pontos} pts para ${usuario.nome}.`);
    await fetchRanking();
  };

  return (
    <div className="modulos-page page-with-fixed-header">
      <Header />
      <main id="main-content" className="page" tabIndex={-1}>
        <h1 className="page-title">ESCOLA DE DISCÍPULOS</h1>

        {loading && <p className="loading-message">Carregando...</p>}

        <section className="modules-layout">
          {/* Coluna esquerda - Lista de Módulos */}
          <aside className="panel modules-left" aria-label="Lista de módulos">
            <div className="list-header">
              <h2>Módulos</h2>
              <span className="count">{modulos.length}</span>
            </div>
            <div className="list">
              {modulos.map((modulo) => (
                <div
                  key={modulo.id_modulo}
                  className={`mod-item ${
                    selectedModulo?.id_modulo === modulo.id_modulo
                      ? "selected"
                      : ""
                  } ${!modulo.ativo ? "inactive" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectModulo(modulo)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (e.target as HTMLElement).click(); } }}
                >
                  <div className="mod-item__info">
                    <span className="mod-item__ordem">#{modulo.ordem}</span>
                    <span className="mod-item__name">{modulo.titulo}</span>
                    {modulo.obrigatorio === false && (
                      <span className="mod-item__opcional-badge">Opcional</span>
                    )}
                  </div>
                  <button
                    className={`btn-status ${
                      modulo.ativo ? "active" : "inactive"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(modulo.id_modulo);
                    }}
                    title={modulo.ativo ? "Desativar módulo" : "Ativar módulo"}
                  >
                    {modulo.ativo ? "Ativo" : "Inativo"}
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn-create"
              onClick={() => navigate("/admin/modulos/criar")}
            >
              + CRIAR MÓDULO
            </button>
          </aside>

          {/* Coluna central - Visualização do Módulo */}
          <section
            className="panel modules-center"
            aria-label="Detalhes do módulo"
          >
            {selectedModulo ? (
              <div className="module-card">
                <div className="module-header">
                  <div className="module-title-area">
                    <h2 className="module-title">{selectedModulo.titulo}</h2>
                    <span
                      className={`badge badge-${
                        selectedModulo.ativo ? "active" : "inactive"
                      }`}
                    >
                      {selectedModulo.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="module-header-actions">
                    <button
                      className="btn-edit"
                      onClick={() =>
                        navigate(
                          `/admin/modulos/editar/${selectedModulo.id_modulo}`
                        )
                      }
                    >
                      Editar
                    </button>
                    <button
                      className="btn-excluir"
                      onClick={() => setShowConfirmExcluir(true)}
                      disabled={excluindo}
                      title="Excluir módulo permanentemente"
                    >
                      {excluindo ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </div>

                {selectedModulo.descricao && (
                  <div className="module-description">
                    <h3>Descrição</h3>
                    <p>{selectedModulo.descricao}</p>
                  </div>
                )}

                <div className="module-meta">
                  {selectedModulo.obrigatorio === false && (
                    <div className="meta-item">
                      <span className="meta-label">Tipo:</span>
                      <span className="meta-value meta-value-opcional">Opcional</span>
                    </div>
                  )}
                  {selectedModulo.obrigatorio !== false && selectedModulo.id_nivel != null && (
                    <div className="meta-item">
                      <span className="meta-label">Nível:</span>
                      <span className="meta-value">{selectedModulo.nivel_nome ?? `#${selectedModulo.id_nivel}`}</span>
                    </div>
                  )}
                  {(selectedModulo as any).pre_requisitos?.length > 0 && (
                    <div className="meta-item meta-item-block">
                      <span className="meta-label">Pré-requisitos:</span>
                      <span className="meta-value">
                        {modulos
                          .filter((m) => (selectedModulo as any).pre_requisitos?.includes(m.id_modulo))
                          .map((m) => m.titulo)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="meta-item">
                    <span className="meta-label">Ordem:</span>
                    <span className="meta-value">{selectedModulo.ordem}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Campos:</span>
                    <span className="meta-value">
                      {selectedModulo.campos?.length || 0}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Quiz:</span>
                    <span className="meta-value">
                      {quizVinculado ? (
                        <span className="quiz-linked">
                          {quizVinculado.titulo ||
                            `Quiz #${quizVinculado.id_quiz}`}
                        </span>
                      ) : (
                        <span className="quiz-none">Nenhum</span>
                      )}
                    </span>
                  </div>
                </div>

                {selectedModulo.campos && selectedModulo.campos.length > 0 ? (
                  <div className="module-fields">
                    <h3>Campos Personalizados</h3>
                    <div className="campos-grid">
                      {selectedModulo.campos.map((campo, index) => (
                        <div key={index} className="campo-card">
                          <div className="campo-label">
                            {campo.label || "Sem label"}
                          </div>
                          <div className="campo-conteudo">
                            {formatarConteudoCampo(campo.conteudo)}
                          </div>
                          {campo.obrigatorio && (
                            <span className="campo-required">Obrigatório</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="module-empty">
                    <p>Este módulo não possui campos cadastrados.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="module-placeholder">
                <p>Selecione um módulo na lista para visualizar</p>
              </div>
            )}
          </section>

          {/* Coluna direita - Ranking (igual ao User/Leader) */}
          <aside className="panel modules-right" aria-label="Ranking">
            <RankingCard
              ranking={ranking}
              limit={20}
              title="RANKING"
              subtitle="Top 20 Discípulos"
              theme="light"
              headerAction={
                <button
                  type="button"
                  className="ranking-btn-dar-pontos"
                  onClick={() => setModalDarPontosAberto(true)}
                >
                  + Dar pontos
                </button>
              }
            />
          </aside>
        </section>
      </main>

      <Footer />

      <DarPontosModal
        open={modalDarPontosAberto}
        onConfirm={handleDarPontos}
        onCancel={() => setModalDarPontosAberto(false)}
      />
      <ConfirmModal
        open={showConfirmExcluir}
        title="Tem certeza?"
        message={`O módulo "${selectedModulo?.titulo ?? ""}" será excluído permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={executarExclusao}
        onCancel={() => setShowConfirmExcluir(false)}
      />
      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
          variant={toast.includes("Erro") ? "error" : "success"}
        />
      )}
    </div>
  );
};

export default ModulosEscolaDiscipulosAdmin;
