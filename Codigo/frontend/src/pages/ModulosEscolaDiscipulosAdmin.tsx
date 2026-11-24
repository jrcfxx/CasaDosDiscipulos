import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "../style/ModulosEscolaDiscipulosAdmin.css";
import "../style/editorCasa.css";
import Icone from "../components/ui/Icone";
import { getErrorMessage } from "../utils/errorUtils";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import RankingCard, { type RankItem } from "../components/modulos/RankingCard";
import BotoesExportar from "../components/ui/BotoesExportar";
import { exportarRanking } from "../utils/exportacoes";
import ConfirmModal from "../components/ui/ConfirmModal";
import DarPontosModal from "../components/ui/DarPontosModal";
import Toast from "../components/ui/Toast";
import { formatarConteudoCampo } from "../utils/moduloConteudoUtils";
import moduloService, { type QuizVinculado } from "../services/moduloService";
import usuarioService from "../services/usuarioService";
import { Modulo } from "../types";

/** Item da lista de módulos: arrastado pela alça para mudar a ordem da trilha */
function ItemModulo({
  modulo,
  posicao,
  selecionado,
  onSelecionar,
  onAlternar,
}: {
  modulo: Modulo;
  posicao: number;
  selecionado: boolean;
  onSelecionar: () => void;
  onAlternar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: modulo.id_modulo });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`mod-item ${selecionado ? "selected" : ""} ${!modulo.ativo ? "inactive" : ""}${isDragging ? " mod-item--arrastando" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onSelecionar}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelecionar();
        }
      }}
    >
      <div className="mod-item__info">
        <button
          type="button"
          className="mod-item__alca"
          aria-label={`Arrastar "${modulo.titulo}" para mudar a ordem da trilha (posição ${posicao})`}
          title="Arraste para mudar a ordem"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <Icone nome="arrastar" tamanho={16} />
        </button>
        <span className="mod-item__ordem">{posicao}</span>
        <span className="mod-item__name">{modulo.titulo}</span>
        {modulo.obrigatorio === false && <span className="mod-item__opcional-badge">Opcional</span>}
      </div>
      <button
        className={`btn-status ${modulo.ativo ? "active" : "inactive"}`}
        onClick={(e) => {
          e.stopPropagation();
          onAlternar();
        }}
        title={modulo.ativo ? "Esconder dos discípulos" : "Liberar para os discípulos"}
      >
        {modulo.ativo ? "Ativo" : "Inativo"}
      </button>
    </div>
  );
}

const ModulosEscolaDiscipulosAdmin: React.FC = () => {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [selectedModulo, setSelectedModulo] = useState<Modulo | null>(null);
  const [quizVinculado, setQuizVinculado] = useState<QuizVinculado | null>(null);
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);
  const [progressoExcluir, setProgressoExcluir] = useState<{ alunos: number; concluidos: number } | null>(null);
  const navigate = useNavigate();
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /** Solta o módulo: mostra a nova ordem na hora e salva; se falhar, volta como estava */
  const aoSoltar = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const antes = modulos;
    const nova = arrayMove(
      antes,
      antes.findIndex((m) => m.id_modulo === active.id),
      antes.findIndex((m) => m.id_modulo === over.id)
    );
    setModulos(nova);
    setSalvandoOrdem(true);
    try {
      await moduloService.reordenar(nova.map((m) => m.id_modulo));
      setToast("Ordem da trilha salva.");
    } catch (error) {
      setModulos(antes);
      setToast(`Erro: ${getErrorMessage(error, "não foi possível salvar a nova ordem.")}`);
    } finally {
      setSalvandoOrdem(false);
    }
  };

  const pedirExclusao = async () => {
    if (!selectedModulo) return;
    try {
      setProgressoExcluir(await moduloService.totalProgresso(selectedModulo.id_modulo));
    } catch {
      setProgressoExcluir({ alunos: 0, concluidos: 0 });
    }
    setShowConfirmExcluir(true);
  };

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
      setShowConfirmExcluir(false);
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
        <h1 className="page-title">Escola de Discípulos</h1>

        {loading && <p className="loading-message">Carregando...</p>}

        <section className="modules-layout">
          {/* Coluna esquerda - Lista de Módulos */}
          <aside className="panel modules-left" aria-label="Lista de módulos">
            <div className="list-header">
              <h2>Módulos</h2>
              <span className="count">{modulos.length}</span>
            </div>
            {modulos.length > 1 && (
              <p className="mod-lista-dica">
                <Icone nome="arrastar" tamanho={13} />
                {salvandoOrdem ? "Salvando a ordem…" : "Arraste pela alça para mudar a ordem da trilha."}
              </p>
            )}
            <DndContext
              sensors={sensores}
              collisionDetection={closestCenter}
              onDragEnd={aoSoltar}
              accessibility={{
                screenReaderInstructions: {
                  draggable:
                    "Para mudar a ordem, aperte espaço ou Enter, use as setas e aperte espaço ou Enter de novo para soltar. Esc cancela.",
                },
                announcements: {
                  onDragStart: () => "Módulo pego.",
                  onDragOver: ({ over }) =>
                    over ? `Sobre a posição ${modulos.findIndex((m) => m.id_modulo === over.id) + 1}.` : undefined,
                  onDragEnd: ({ over }) =>
                    over ? `Solto na posição ${modulos.findIndex((m) => m.id_modulo === over.id) + 1}.` : undefined,
                  onDragCancel: () => "Cancelado. O módulo voltou ao lugar.",
                },
              }}
            >
              <SortableContext items={modulos.map((m) => m.id_modulo)} strategy={verticalListSortingStrategy}>
                <div className="list">
                  {modulos.map((modulo, i) => (
                    <ItemModulo
                      key={modulo.id_modulo}
                      modulo={modulo}
                      posicao={i + 1}
                      selecionado={selectedModulo?.id_modulo === modulo.id_modulo}
                      onSelecionar={() => handleSelectModulo(modulo)}
                      onAlternar={() => handleToggle(modulo.id_modulo)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
                      {selectedModulo.ativo ? "Liberado para os discípulos" : "Escondido dos discípulos"}
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
                      onClick={pedirExclusao}
                      disabled={excluindo}
                      title="Excluir módulo permanentemente"
                     aria-busy={excluindo}>
                      {excluindo ? <><span className="btn-spinner" aria-hidden />Excluindo…</> : "Excluir"}
                    </button>
                  </div>
                </div>

                {selectedModulo.descricao && (
                  <div className="module-description">
                    <h3>Descrição</h3>
                    <p>{selectedModulo.descricao}</p>
                  </div>
                )}

                <div className="ec-numeros">
                  <div>
                    <strong>{modulos.findIndex((m) => m.id_modulo === selectedModulo.id_modulo) + 1}º</strong>
                    <span>na trilha</span>
                  </div>
                  <div>
                    <strong>{selectedModulo.campos?.length || 0}</strong>
                    <span>{(selectedModulo.campos?.length || 0) === 1 ? "conteúdo" : "conteúdos"}</span>
                  </div>
                  <div>
                    <strong className="ec-numeros__texto">{quizVinculado ? "Com quiz" : "Sem quiz"}</strong>
                    <span>{quizVinculado?.titulo || "conclusão manual"}</span>
                  </div>
                </div>
                <p className="ec-lembrete">
                  <Icone nome="alerta" tamanho={15} />
                  {selectedModulo.obrigatorio === false
                    ? "Opcional: o discípulo faz quando quiser; não bloqueia outros módulos e não conta para o nível."
                    : (selectedModulo.pre_requisitos?.length ?? 0) > 0
                      ? `Obrigatório: libera depois de concluir ${modulos
                          .filter((m) => selectedModulo.pre_requisitos?.includes(m.id_modulo))
                          .map((m) => `"${m.titulo}"`)
                          .join(", ")}.`
                      : "Obrigatório: libera quando o discípulo concluir os módulos obrigatórios anteriores na trilha."}
                  {selectedModulo.obrigatorio !== false && selectedModulo.id_nivel != null
                    ? ` Ao concluir, chega ao nível ${selectedModulo.nivel_nome ?? `#${selectedModulo.id_nivel}`}.`
                    : ""}
                </p>

                {selectedModulo.campos && selectedModulo.campos.length > 0 ? (
                  <div className="module-fields">
                    <h3>Conteúdo das aulas</h3>
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
                    <p>Este módulo ainda não tem conteúdo. Clique em Editar para adicionar vídeos, textos e arquivos.</p>
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
                <div className="ranking-acoes">
                  <BotoesExportar
                    tema="claro"
                    rotuloExcel="Excel"
                    onExcel={async () => exportarRanking(await moduloService.getRankingCompleto())}
                  />
                  <button
                    type="button"
                    className="ranking-btn-dar-pontos"
                    onClick={() => setModalDarPontosAberto(true)}
                  >
                    + Dar pontos
                  </button>
                </div>
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
        title="Excluir módulo"
        message={
          progressoExcluir && progressoExcluir.alunos > 0
            ? `"${selectedModulo?.titulo ?? ""}" já foi começado por ${progressoExcluir.alunos} ${progressoExcluir.alunos === 1 ? "discípulo" : "discípulos"} (${progressoExcluir.concluidos} concluíram). Excluir apaga esse progresso e não tem volta. Para só tirar da trilha, deixe o módulo Inativo.`
            : `Excluir "${selectedModulo?.titulo ?? ""}"? Esta ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={executarExclusao}
        textoCarregando="Excluindo…"
        onCancel={() => setShowConfirmExcluir(false)}
      />
      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
          variant={toast.startsWith("Erro") ? "error" : "success"}
        />
      )}
    </div>
  );
};

export default ModulosEscolaDiscipulosAdmin;
