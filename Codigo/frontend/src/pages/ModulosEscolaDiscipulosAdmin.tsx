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
import PaginaSecretaria, {
  DetalheSecretaria,
  DetalheVazio,
  ItemSecretaria,
  ListaSecretaria,
  filtrarItens,
  type FiltroStatus,
} from "../components/secretaria/PaginaSecretaria";
import { TIPOS_CONTEUDO } from "../components/conteudo/EditorBlocos";

const NOME_TIPO: Record<string, string> = Object.fromEntries(TIPOS_CONTEUDO.map((t) => [t.tipo, t.nome]));
import { getErrorMessage } from "../utils/errorUtils";

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
  podeArrastar,
  onSelecionar,
  onAlternar,
}: {
  modulo: Modulo;
  posicao: number;
  selecionado: boolean;
  podeArrastar: boolean;
  onSelecionar: () => void;
  onAlternar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: modulo.id_modulo,
    disabled: !podeArrastar,
  });
  const n = modulo.campos?.length || 0;
  return (
    <ItemSecretaria
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      arrastando={isDragging}
      titulo={modulo.titulo}
      meta={`${n} ${n === 1 ? "conteúdo" : "conteúdos"}`}
      selo={modulo.obrigatorio === false ? "Opcional" : undefined}
      ativo={Boolean(modulo.ativo)}
      selecionado={selecionado}
      icone="formatura"
      onSelecionar={onSelecionar}
      onAlternar={onAlternar}
      antes={
        <button
          type="button"
          className="sc-item__alca"
          aria-label={
            podeArrastar
              ? `Arrastar "${modulo.titulo}" para mudar a ordem da trilha (posição ${posicao})`
              : `Posição ${posicao} na trilha (limpe a busca e o filtro para reordenar)`
          }
          title={podeArrastar ? "Arraste para mudar a ordem" : "Limpe a busca e o filtro para reordenar"}
          {...attributes}
          {...listeners}
        >
          {podeArrastar && <Icone nome="arrastar" tamanho={15} />}
          <span className="sc-item__posicao">{posicao}</span>
        </button>
      }
    />
  );
}

const ModulosEscolaDiscipulosAdmin: React.FC = () => {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [selectedModulo, setSelectedModulo] = useState<Modulo | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");
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

  const filtrando = busca.trim() !== "" || filtro !== "todos";
  const modulosVisiveis = filtrarItens(modulos, busca, filtro, (m) => m.titulo, (m) => Boolean(m.ativo));
  const ativosMod = modulos.filter((m) => m.ativo).length;

  return (
    <>
      <PaginaSecretaria
        area="Escola de Discípulos"
        titulo="Módulos"
        icone="formatura"
        descricao="A trilha de formação do discípulo. Cada módulo reúne aulas (vídeos, textos, arquivos) e pode ter um quiz. A ordem da lista é a ordem da trilha."
        acao={{ rotulo: "Novo módulo", onClick: () => navigate("/admin/modulos/criar") }}
        numeros={[
          { valor: modulos.length, rotulo: modulos.length === 1 ? "módulo" : "módulos" },
          { valor: ativosMod, rotulo: ativosMod === 1 ? "liberado" : "liberados" },
          { valor: modulos.filter((m) => m.obrigatorio === false).length, rotulo: "opcionais" },
        ]}
      >
        <div className="sc-corpo sc-corpo--com-ranking">
          <ListaSecretaria
            titulo="Trilha"
            total={modulos.length}
            busca={busca}
            onBusca={setBusca}
            filtro={filtro}
            onFiltro={setFiltro}
            placeholderBusca="Buscar módulo pelo nome"
            dica={
              modulos.length > 1 ? (
                <>
                  <Icone nome="arrastar" tamanho={13} />
                  {salvandoOrdem
                    ? "Salvando a ordem…"
                    : filtrando
                      ? "Limpe a busca e o filtro para reordenar."
                      : "Arraste pela alça para mudar a ordem da trilha."}
                </>
              ) : undefined
            }
            vazio={loading ? "Carregando…" : modulos.length ? "Nenhum módulo com esse filtro." : "Nenhum módulo ainda. Crie o primeiro no botão Novo módulo."}
            quantidadeVisivel={modulosVisiveis.length}
          >
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
              <SortableContext items={modulosVisiveis.map((m) => m.id_modulo)} strategy={verticalListSortingStrategy}>
                {modulosVisiveis.map((modulo) => (
                  <ItemModulo
                    key={modulo.id_modulo}
                    modulo={modulo}
                    posicao={modulos.findIndex((m) => m.id_modulo === modulo.id_modulo) + 1}
                    selecionado={selectedModulo?.id_modulo === modulo.id_modulo}
                    podeArrastar={!filtrando}
                    onSelecionar={() => handleSelectModulo(modulo)}
                    onAlternar={() => handleToggle(modulo.id_modulo)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </ListaSecretaria>

          {selectedModulo ? (
            <DetalheSecretaria
              titulo={selectedModulo.titulo}
              ativo={Boolean(selectedModulo.ativo)}
              status={`${selectedModulo.ativo ? "Liberado para os discípulos" : "Escondido dos discípulos"} · ${
                selectedModulo.obrigatorio === false ? "opcional" : "obrigatório"
              }`}
              acoes={
                <>
                  <button
                    type="button"
                    className="sc-btn sc-btn--primario"
                    onClick={() => navigate(`/admin/modulos/editar/${selectedModulo.id_modulo}`)}
                  >
                    <Icone nome="editar" tamanho={15} /> Editar módulo
                  </button>
                  <button
                    type="button"
                    className="sc-btn sc-btn--perigo"
                    onClick={pedirExclusao}
                    disabled={excluindo}
                    aria-busy={excluindo}
                    aria-label={`Excluir o módulo ${selectedModulo.titulo}`}
                    title="Excluir módulo"
                  >
                    {excluindo ? <span className="btn-spinner" aria-hidden /> : <Icone nome="lixeira" tamanho={16} />}
                  </button>
                </>
              }
            >
              {selectedModulo.descricao && (
                <p className="sc-descricao">
                  <strong>Descrição</strong>
                  {selectedModulo.descricao}
                </p>
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


              <h3 className="sc-subtitulo">
                <Icone nome="olho" tamanho={17} /> Como o discípulo vê
              </h3>
              {selectedModulo.campos && selectedModulo.campos.length > 0 ? (
                <ol className="ec-previa">
                  {selectedModulo.campos.map((campo, index) => (
                    <li key={index} className="campo-card campo-card--pergunta">
                      <span className="ec-selo ec-selo--pergunta">
                        {index + 1}. {NOME_TIPO[String(campo.tipo_campo)] || "Conteúdo"}
                      </span>
                      <div className="campo-label">{campo.label || "Sem título"}</div>
                      <div className="campo-conteudo">{formatarConteudoCampo(campo.conteudo)}</div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="sc-vazio-conteudo">Este módulo ainda não tem conteúdo. Clique em Editar módulo para adicionar vídeos, textos e arquivos.</p>
              )}
            </DetalheSecretaria>
          ) : (
            <DetalheVazio
              icone="formatura"
              texto={modulos.length ? "Escolha um módulo na lista para ver as aulas." : "Ainda não há módulos. Crie o primeiro da trilha."}
              acao={{ rotulo: "Novo módulo", onClick: () => navigate("/admin/modulos/criar") }}
            />
          )}

          <aside className="sc-lateral" aria-label="Ranking">
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
        </div>
      </PaginaSecretaria>

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
    </>
  );
};

export default ModulosEscolaDiscipulosAdmin;
