import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FocusTrapComponent from "../components/ui/FocusTrap";
import "../style/EventosAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ConfirmModal from "../components/ui/ConfirmModal";
import Toast from "../components/ui/Toast";
import Icone from "../components/ui/Icone";
import {
  type Evento,
  listarEventos,
  criarEvento,
  atualizarEvento,
  excluirEvento,
  uploadImagemEvento,
  reordenarEventos,
  urlImagemEvento,
} from "../services/eventoService";
import { getErrorMessage } from "../utils/errorUtils";

/** Mesmas regras do servidor (routes/eventoRoutes.js): até 5 MB, jpg/png/gif/webp */
const TAMANHO_MAX = 5 * 1024 * 1024;
const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_TITULO = 255;
const MAX_DESCRICAO = 1000;

type Aviso = { texto: string; tipo: "success" | "error" };
type FormEvento = { titulo: string; descricao: string; ativo: boolean };
const FORM_VAZIO: FormEvento = { titulo: "", descricao: "", ativo: true };

/** Problema do arquivo escolhido, ou null se pode enviar */
function erroDaImagem(arquivo: File): string | null {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) return "Escolha uma imagem JPG, PNG, GIF ou WEBP.";
  if (arquivo.size > TAMANHO_MAX) return "A imagem passa de 5 MB. Escolha uma menor.";
  return null;
}

/** Card do evento; arrastado pela alça para mudar a ordem do carrossel */
function CardEvento({
  evento,
  posicao,
  onEditar,
  onAlternar,
  onExcluir,
}: {
  evento: Evento;
  posicao: number;
  onEditar: () => void;
  onAlternar: () => void;
  onExcluir: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: evento.id_evento,
  });
  const nome = evento.titulo || "Evento sem título";
  const [imagemQuebrada, setImagemQuebrada] = useState(false);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`ev-card${evento.ativo ? "" : " ev-card--inativo"}${isDragging ? " ev-card--arrastando" : ""}`}
    >
      <div className="ev-card__midia">
        {imagemQuebrada ? (
          <div className="ev-card__sem-imagem">
            <Icone nome="imagem" tamanho={28} />
            <span>Imagem indisponível</span>
          </div>
        ) : (
          <img src={urlImagemEvento(evento.imagem_url)} alt="" loading="lazy" onError={() => setImagemQuebrada(true)} />
        )}
        <button
          type="button"
          className="ev-card__alca"
          aria-label={`Arrastar "${nome}" para mudar a ordem (posição ${posicao})`}
          title="Arraste para mudar a ordem"
          {...attributes}
          {...listeners}
        >
          <Icone nome="arrastar" tamanho={18} />
          <span className="ev-card__posicao">{posicao}</span>
        </button>
        <span className={`ev-card__status ${evento.ativo ? "ev-card__status--ativo" : ""}`}>
          {evento.ativo ? "No carrossel" : "Oculto"}
        </span>
      </div>
      <div className="ev-card__corpo">
        <h3 className={`ev-card__titulo${evento.titulo ? "" : " ev-card__titulo--vazio"}`}>{nome}</h3>
        {evento.descricao && <p className="ev-card__descricao">{evento.descricao}</p>}
        <div className="ev-card__acoes">
          <button type="button" className="ev-btn ev-btn--suave" onClick={onEditar}>
            <Icone nome="editar" tamanho={15} /> Editar
          </button>
          <button
            type="button"
            className="ev-btn ev-btn--suave"
            onClick={onAlternar}
            aria-label={evento.ativo ? `Ocultar "${nome}" do carrossel` : `Mostrar "${nome}" no carrossel`}
          >
            <Icone nome={evento.ativo ? "olhoFechado" : "olho"} tamanho={15} />
            {evento.ativo ? "Ocultar" : "Mostrar"}
          </button>
          <button
            type="button"
            className="ev-btn ev-btn--icone ev-btn--perigo"
            onClick={onExcluir}
            aria-label={`Excluir "${nome}"`}
            title="Excluir"
          >
            <Icone nome="lixeira" tamanho={16} />
          </button>
        </div>
      </div>
    </li>
  );
}

const EventosAdmin: React.FC = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [formData, setFormData] = useState<FormEvento>(FORM_VAZIO);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [erroImagem, setErroImagem] = useState<string | null>(null);
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false);
  /** Etapa do salvamento, para mostrar progresso e evitar envio duplo */
  const [salvando, setSalvando] = useState<null | "imagem" | "dados">(null);
  const [eventoToDelete, setEventoToDelete] = useState<Evento | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const tituloRef = useRef<HTMLInputElement>(null);

  const avisar = (texto: string, tipo: Aviso["tipo"] = "success") => setAviso({ texto, tipo });

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchEventos();
  }, []);

  // Libera a prévia local (URL.createObjectURL) quando ela muda ou a tela fecha
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fetchEventos = async () => {
    setLoading(true);
    try {
      setEventos(await listarEventos());
    } catch (error) {
      avisar(getErrorMessage(error, "Não foi possível carregar os eventos."), "error");
    } finally {
      setLoading(false);
    }
  };

  /** Solta o card: mostra a nova ordem na hora e salva; se falhar, volta como estava */
  const aoSoltar = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const antes = eventos;
    const de = antes.findIndex((e) => e.id_evento === active.id);
    const para = antes.findIndex((e) => e.id_evento === over.id);
    const nova = arrayMove(antes, de, para);
    setEventos(nova);
    setSalvandoOrdem(true);
    try {
      setEventos(await reordenarEventos(nova.map((e) => e.id_evento)));
      avisar("Ordem do carrossel salva.");
    } catch (error) {
      setEventos(antes);
      avisar(getErrorMessage(error, "Não foi possível salvar a nova ordem."), "error");
    } finally {
      setSalvandoOrdem(false);
    }
  };

  const escolherArquivo = (arquivo: File | undefined) => {
    if (!arquivo) return;
    const problema = erroDaImagem(arquivo);
    if (problema) {
      setErroImagem(problema);
      return;
    }
    setErroImagem(null);
    setSelectedFile(arquivo);
    setPreviewUrl(URL.createObjectURL(arquivo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    if (!selectedFile && !editingEvento) {
      setErroImagem("Escolha a imagem do evento.");
      return;
    }

    try {
      let imagem_url = editingEvento?.imagem_url ?? "";
      if (selectedFile) {
        setSalvando("imagem");
        imagem_url = (await uploadImagemEvento(selectedFile)).imagem_url;
      }

      setSalvando("dados");
      const dados = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        ativo: formData.ativo,
        imagem_url,
      };
      if (editingEvento) {
        await atualizarEvento(editingEvento.id_evento, dados);
      } else {
        await criarEvento(dados);
      }

      const editando = !!editingEvento;
      await fetchEventos();
      closeModal();
      avisar(editando ? "Evento salvo." : "Evento criado. Ele entrou no fim do carrossel.");
    } catch (error) {
      avisar(getErrorMessage(error, "Não foi possível salvar o evento."), "error");
    } finally {
      setSalvando(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!eventoToDelete) return;
    try {
      await excluirEvento(eventoToDelete.id_evento);
      await fetchEventos();
      avisar("Evento excluído.");
    } catch (error) {
      avisar(getErrorMessage(error, "Não foi possível excluir o evento."), "error");
    } finally {
      // fecha só depois de terminar: o modal mostra o andamento
      setEventoToDelete(null);
    }
  };

  const handleToggleAtivo = async (evento: Evento) => {
    try {
      await atualizarEvento(evento.id_evento, { ativo: !evento.ativo });
      setEventos((lista) => lista.map((e) => (e.id_evento === evento.id_evento ? { ...e, ativo: !e.ativo } : e)));
      avisar(evento.ativo ? "Evento oculto do carrossel." : "Evento de volta ao carrossel.");
    } catch (error) {
      avisar(getErrorMessage(error, "Não foi possível alterar o evento."), "error");
    }
  };

  const openModal = (evento?: Evento) => {
    setEditingEvento(evento ?? null);
    setFormData(
      evento ? { titulo: evento.titulo || "", descricao: evento.descricao || "", ativo: !!evento.ativo } : FORM_VAZIO
    );
    setPreviewUrl(evento ? urlImagemEvento(evento.imagem_url) : null);
    setSelectedFile(null);
    setErroImagem(null);
    setShowModal(true);
    setTimeout(() => tituloRef.current?.focus(), 60);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvento(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setErroImagem(null);
    setFormData(FORM_VAZIO);
  };

  const ativos = eventos.filter((e) => e.ativo).length;
  const posicaoDe = (id: UniqueIdentifier) => eventos.findIndex((e) => e.id_evento === id) + 1;
  const nomeNaPosicao = (id: UniqueIdentifier) => {
    const ev = eventos.find((e) => e.id_evento === id);
    return `"${ev?.titulo || "Evento sem título"}"`;
  };

  const modal = showModal
    ? createPortal(
        <FocusTrapComponent
          active={showModal}
          focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: false, returnFocusOnDeactivate: true }}
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            className="ev-modal-fundo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ev-modal-titulo"
            onKeyDown={(e) => {
              if (e.key === "Escape" && !salvando) closeModal();
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !salvando) closeModal();
            }}
          >
            <div className="ev-modal">
              <div className="ev-modal__topo">
                <div>
                  <p className="ev-modal__sobretitulo">Carrossel da página inicial</p>
                  <h2 id="ev-modal-titulo">{editingEvento ? "Editar evento" : "Novo evento"}</h2>
                </div>
                <button
                  type="button"
                  className="ev-modal__fechar"
                  onClick={closeModal}
                  disabled={!!salvando}
                  aria-label="Fechar"
                >
                  <Icone nome="fechar" tamanho={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="ev-modal__form" noValidate>
                <div className="ev-modal__grade">
                  <div className="ev-campo">
                    <span className="ev-campo__rotulo" id="ev-imagem-rotulo">
                      Imagem {!editingEvento && <span className="ev-obrigatorio">obrigatória</span>}
                    </span>
                    <div
                      className={`ev-imagem${previewUrl ? " ev-imagem--com" : ""}${arrastandoArquivo ? " ev-imagem--sobre" : ""}${erroImagem ? " ev-imagem--erro" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setArrastandoArquivo(true);
                      }}
                      onDragLeave={() => setArrastandoArquivo(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setArrastandoArquivo(false);
                        escolherArquivo(e.dataTransfer.files?.[0]);
                      }}
                    >
                      {previewUrl ? (
                        <img src={previewUrl} alt="Prévia da imagem do evento" />
                      ) : (
                        <div className="ev-imagem__vazia">
                          <Icone nome="imagem" tamanho={34} />
                          <strong>Arraste a imagem aqui</strong>
                          <span>ou clique para escolher</span>
                        </div>
                      )}
                      <button
                        type="button"
                        className={previewUrl ? "ev-imagem__trocar" : "ev-imagem__area"}
                        onClick={() => inputArquivo.current?.click()}
                        disabled={!!salvando}
                        aria-labelledby="ev-imagem-rotulo"
                        aria-describedby="ev-imagem-dica"
                      >
                        {previewUrl ? (
                          <>
                            <Icone nome="imagem" tamanho={16} /> Trocar imagem
                          </>
                        ) : (
                          <span className="sr-only">Escolher imagem</span>
                        )}
                      </button>
                      <input
                        ref={inputArquivo}
                        type="file"
                        accept={TIPOS_ACEITOS.join(",")}
                        className="sr-only"
                        tabIndex={-1}
                        aria-hidden
                        onChange={(e) => {
                          escolherArquivo(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </div>
                    {erroImagem ? (
                      <p className="ev-campo__erro" role="alert">
                        {erroImagem}
                      </p>
                    ) : (
                      <p className="ev-campo__dica" id="ev-imagem-dica">
                        Formato horizontal (16:9) fica melhor. JPG, PNG ou WEBP até 5 MB.
                      </p>
                    )}
                  </div>

                  <div className="ev-modal__dados">
                    <div className="ev-campo">
                      <label className="ev-campo__rotulo" htmlFor="ev-titulo">
                        Título <span className="ev-opcional">opcional</span>
                      </label>
                      <input
                        id="ev-titulo"
                        ref={tituloRef}
                        className="ev-input"
                        type="text"
                        value={formData.titulo}
                        maxLength={MAX_TITULO}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        placeholder="Ex.: Conferência de Jovens"
                      />
                    </div>

                    <div className="ev-campo">
                      <label className="ev-campo__rotulo" htmlFor="ev-descricao">
                        Descrição <span className="ev-opcional">opcional</span>
                      </label>
                      <textarea
                        id="ev-descricao"
                        className="ev-input ev-input--area"
                        value={formData.descricao}
                        maxLength={MAX_DESCRICAO}
                        rows={4}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="Data, local e um convite curto"
                      />
                      <span className="ev-contador" aria-live="polite">
                        {formData.descricao.length}/{MAX_DESCRICAO}
                      </span>
                    </div>

                    <label className="ev-chave" htmlFor="ev-ativo">
                      <input
                        id="ev-ativo"
                        type="checkbox"
                        role="switch"
                        checked={formData.ativo}
                        onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      />
                      <span className="ev-chave__trilho" aria-hidden />
                      <span className="ev-chave__texto">
                        <strong>{formData.ativo ? "Aparece no carrossel" : "Oculto do carrossel"}</strong>
                        <small>
                          {editingEvento
                            ? "A posição muda arrastando o card na lista."
                            : "O evento novo entra no fim do carrossel. Depois é só arrastar para mudar a posição."}
                        </small>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="ev-modal__rodape">
                  <button type="button" className="ev-btn ev-btn--fantasma" onClick={closeModal} disabled={!!salvando}>
                    Cancelar
                  </button>
                  <button type="submit" className="ev-btn ev-btn--primario" disabled={!!salvando} aria-busy={!!salvando}>
                    {salvando ? (
                      <>
                        <span className="btn-spinner" aria-hidden />
                        {salvando === "imagem" ? "Enviando imagem…" : "Salvando…"}
                      </>
                    ) : editingEvento ? (
                      "Salvar alterações"
                    ) : (
                      "Criar evento"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </FocusTrapComponent>,
        document.body
      )
    : null;

  return (
    <div className="page-with-fixed-header ev-pagina">
      <Header />

      <main id="main-content" className="container eventos-admin" tabIndex={-1}>
        <h1 className="page-title">Gerenciar Eventos</h1>

        <div className="ev-barra">
          <p className="ev-barra__info">
            {loading
              ? "Carregando…"
              : `${eventos.length} ${eventos.length === 1 ? "evento" : "eventos"} · ${ativos} no carrossel`}
            {eventos.length > 1 && (
              <span className="ev-barra__dica">
                <Icone nome="arrastar" tamanho={14} /> Arraste os cards para mudar a ordem do carrossel
              </span>
            )}
          </p>
          <div className="ev-barra__acoes">
            {salvandoOrdem && (
              <span className="ev-salvando" role="status">
                <span className="btn-spinner" aria-hidden /> Salvando ordem…
              </span>
            )}
            <button type="button" className="ev-btn ev-btn--primario" onClick={() => openModal()}>
              + Novo evento
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : eventos.length === 0 ? (
          <div className="ev-vazio">
            <Icone nome="imagem" tamanho={36} />
            <p>Nenhum evento ainda. Crie o primeiro para aparecer no carrossel da página inicial.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensores}
            collisionDetection={closestCenter}
            onDragEnd={aoSoltar}
            accessibility={{
              screenReaderInstructions: {
                draggable:
                  "Para mudar a ordem, aperte espaço ou Enter, use as setas para mover e aperte espaço ou Enter de novo para soltar. Esc cancela.",
              },
              announcements: {
                onDragStart: ({ active }) => `Pegou ${nomeNaPosicao(active.id)}.`,
                onDragOver: ({ active, over }) =>
                  over ? `${nomeNaPosicao(active.id)} sobre a posição ${posicaoDe(over.id)}.` : undefined,
                onDragEnd: ({ active, over }) =>
                  over ? `${nomeNaPosicao(active.id)} solto na posição ${posicaoDe(over.id)}.` : undefined,
                onDragCancel: ({ active }) => `Cancelado. ${nomeNaPosicao(active.id)} voltou ao lugar.`,
              },
            }}
          >
            <SortableContext items={eventos.map((e) => e.id_evento)} strategy={rectSortingStrategy}>
              <h2 className="sr-only">Eventos na ordem do carrossel</h2>
              <ol className="ev-grade" aria-label="Eventos na ordem do carrossel">
                {eventos.map((evento, i) => (
                  <CardEvento
                    key={evento.id_evento}
                    evento={evento}
                    posicao={i + 1}
                    onEditar={() => openModal(evento)}
                    onAlternar={() => handleToggleAtivo(evento)}
                    onExcluir={() => setEventoToDelete(evento)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {modal}

      <ConfirmModal
        open={!!eventoToDelete}
        title="Excluir evento"
        message={`Excluir "${eventoToDelete?.titulo || "este evento"}"? Ele sai do carrossel e a imagem é apagada. Para só tirar do carrossel, use "Ocultar".`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        textoCarregando="Excluindo…"
        onCancel={() => setEventoToDelete(null)}
      />
      {aviso && <Toast message={aviso.texto} onClose={() => setAviso(null)} variant={aviso.tipo} />}

      <Footer />
    </div>
  );
};

export default EventosAdmin;
