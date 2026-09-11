import React, { useEffect, useMemo, useState } from "react";
import ConfirmModal from "../ui/ConfirmModal";
import escalaService, {
  EscalaEventoCompleto,
  EscalaTemplate,
  EscalaTemplatePayload,
} from "../../services/escalaService";
import { getErrorMessage } from "../../utils/errorUtils";
import "./EscalaTemplatesModal.css";

type ToastVariant = "success" | "error" | "info";
type View = "lista" | "form" | "aplicar";

interface MinisterioOpt {
  id_ministerio: number;
  nome: string;
  ordem?: number;
}

interface UsuarioOpt {
  id_usuario: number;
  nome: string;
}

interface FormState {
  nome: string;
  titulo: string;
  descricao: string;
  id_ministerios: number[];
  /** pessoas por ministério */
  slotsPorMinisterio: Record<number, number[]>;
}

interface Props {
  open: boolean;
  templates: EscalaTemplate[];
  ministerios: MinisterioOpt[];
  usuarios: UsuarioOpt[];
  eventoAberto?: EscalaEventoCompleto | null;
  /** Abre direto no formulário preenchido com o evento aberto */
  startComEvento?: boolean;
  onClose: () => void;
  onToast: (msg: string, variant?: ToastVariant) => void;
  onChanged: () => Promise<void> | void;
  onAplicado: (idEvento: number) => void;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function proximoDomingoIso() {
  const agora = new Date();
  agora.setDate(agora.getDate() + ((7 - agora.getDay()) % 7 || 7));
  return toIsoDate(agora);
}

function formVazio(): FormState {
  return {
    nome: "",
    titulo: "",
    descricao: "",
    id_ministerios: [],
    slotsPorMinisterio: {},
  };
}

function payloadToForm(payload?: EscalaTemplatePayload | null, nomeFallback = ""): FormState {
  const areas = payload?.areas || [];
  const ids =
    payload?.id_ministerios?.length
      ? [...payload.id_ministerios]
      : areas
          .map((a) => a.id_ministerio)
          .filter((id): id is number => typeof id === "number" && id > 0);

  const slotsPorMinisterio: Record<number, number[]> = {};
  for (const area of areas) {
    const mid = area.id_ministerio;
    if (typeof mid !== "number" || mid <= 0) continue;
    slotsPorMinisterio[mid] = (area.slots || [])
      .map((s) => s.id_usuario)
      .filter((id) => typeof id === "number");
  }

  return {
    nome: nomeFallback,
    titulo: payload?.titulo || "",
    descricao: payload?.descricao || "",
    id_ministerios: ids,
    slotsPorMinisterio,
  };
}

function eventoToForm(evento: EscalaEventoCompleto): FormState {
  const ids = (evento.ministerios || []).map((m) => m.id_ministerio);
  const slotsPorMinisterio: Record<number, number[]> = {};
  for (const area of evento.areas || []) {
    const mid = area.id_ministerio;
    if (typeof mid !== "number" || mid <= 0) continue;
    const atuais = slotsPorMinisterio[mid] || [];
    for (const at of area.atribuicoes || []) {
      if (!atuais.includes(at.id_usuario)) atuais.push(at.id_usuario);
    }
    slotsPorMinisterio[mid] = atuais;
  }
  return {
    nome: `Template — ${evento.titulo}`,
    titulo: evento.titulo || "",
    descricao: evento.descricao || "",
    id_ministerios: ids,
    slotsPorMinisterio,
  };
}

function formToPayload(form: FormState, ministerios: MinisterioOpt[]): EscalaTemplatePayload {
  const selected = ministerios
    .filter((m) => form.id_ministerios.includes(m.id_ministerio))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || a.nome.localeCompare(b.nome));

  return {
    titulo: form.titulo.trim() || form.nome.trim(),
    descricao: form.descricao.trim() || null,
    id_ministerios: selected.map((m) => m.id_ministerio),
    areas: selected.map((m, ordem) => ({
      nome: m.nome,
      ordem,
      id_ministerio: m.id_ministerio,
      slots: (form.slotsPorMinisterio[m.id_ministerio] || []).map((id_usuario) => ({
        id_usuario,
        detalhes: null,
      })),
    })),
  };
}

const EscalaTemplatesModal: React.FC<Props> = ({
  open,
  templates,
  ministerios,
  usuarios,
  eventoAberto,
  startComEvento = false,
  onClose,
  onToast,
  onChanged,
  onAplicado,
}) => {
  const [view, setView] = useState<View>("lista");
  const [form, setForm] = useState<FormState>(formVazio());
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [excluirTarget, setExcluirTarget] = useState<EscalaTemplate | null>(null);
  const [aplicarTarget, setAplicarTarget] = useState<EscalaTemplate | null>(null);
  const [aplicarData, setAplicarData] = useState(proximoDomingoIso());
  const [aplicarHora, setAplicarHora] = useState("19:00");
  const [pessoaDraft, setPessoaDraft] = useState<Record<number, string>>({});

  const usuariosPorId = useMemo(() => {
    const map = new Map<number, string>();
    usuarios.forEach((u) => map.set(u.id_usuario, u.nome));
    return map;
  }, [usuarios]);

  useEffect(() => {
    if (!open) return;
    if (startComEvento && eventoAberto) {
      setEditandoId(null);
      setForm(eventoToForm(eventoAberto));
      setView("form");
    } else {
      setView("lista");
      setEditandoId(null);
      setForm(formVazio());
    }
    setExcluirTarget(null);
    setAplicarTarget(null);
    setAplicarData(proximoDomingoIso());
    setAplicarHora("19:00");
    setPessoaDraft({});
    // Só reinicia ao abrir o modal (não a cada mudança do evento)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startComEvento]);

  if (!open) return null;

  const abrirNovo = () => {
    setEditandoId(null);
    setForm(formVazio());
    setView("form");
  };

  const abrirEditar = (t: EscalaTemplate) => {
    setEditandoId(t.id_escala_template);
    setForm(payloadToForm(t.payload, t.nome));
    setView("form");
  };

  const preencherDoEvento = () => {
    if (!eventoAberto) {
      onToast("Abra um evento na escala para copiar a estrutura.", "info");
      return;
    }
    const base = eventoToForm(eventoAberto);
    setForm((prev) => ({
      ...base,
      nome: prev.nome.trim() || base.nome,
    }));
    onToast("Estrutura do evento carregada no formulário", "success");
  };

  const toggleMinisterio = (id: number) => {
    setForm((prev) => {
      const checked = prev.id_ministerios.includes(id);
      const id_ministerios = checked
        ? prev.id_ministerios.filter((x) => x !== id)
        : [...prev.id_ministerios, id];
      const slotsPorMinisterio = { ...prev.slotsPorMinisterio };
      if (checked) delete slotsPorMinisterio[id];
      else if (!slotsPorMinisterio[id]) slotsPorMinisterio[id] = [];
      return { ...prev, id_ministerios, slotsPorMinisterio };
    });
  };

  const adicionarPessoa = (idMinisterio: number) => {
    const raw = pessoaDraft[idMinisterio];
    const idUsuario = Number(raw);
    if (!idUsuario) {
      onToast("Selecione uma pessoa", "error");
      return;
    }
    setForm((prev) => {
      const atuais = prev.slotsPorMinisterio[idMinisterio] || [];
      if (atuais.includes(idUsuario)) return prev;
      return {
        ...prev,
        slotsPorMinisterio: {
          ...prev.slotsPorMinisterio,
          [idMinisterio]: [...atuais, idUsuario],
        },
      };
    });
    setPessoaDraft((prev) => ({ ...prev, [idMinisterio]: "" }));
  };

  const removerPessoa = (idMinisterio: number, idUsuario: number) => {
    setForm((prev) => ({
      ...prev,
      slotsPorMinisterio: {
        ...prev.slotsPorMinisterio,
        [idMinisterio]: (prev.slotsPorMinisterio[idMinisterio] || []).filter((id) => id !== idUsuario),
      },
    }));
  };

  const salvar = async () => {
    if (!form.nome.trim()) {
      onToast("Informe o nome do template", "error");
      return;
    }
    if (form.id_ministerios.length === 0) {
      onToast("Selecione ao menos um ministério", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(form, ministerios);
      if (editandoId) {
        await escalaService.atualizarTemplate(editandoId, {
          nome: form.nome.trim(),
          payload,
        });
        onToast("Template atualizado", "success");
      } else {
        await escalaService.criarTemplate({
          nome: form.nome.trim(),
          payload,
        });
        onToast("Template criado", "success");
      }
      await onChanged();
      setView("lista");
      setEditandoId(null);
      setForm(formVazio());
    } catch (err) {
      onToast(getErrorMessage(err, "Erro ao salvar template"), "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmarExcluir = async () => {
    if (!excluirTarget) return;
    try {
      await escalaService.excluirTemplate(excluirTarget.id_escala_template);
      onToast("Template excluído", "success");
      setExcluirTarget(null);
      await onChanged();
    } catch (err) {
      onToast(getErrorMessage(err, "Erro ao excluir template"), "error");
    }
  };

  const abrirAplicar = (t: EscalaTemplate) => {
    setAplicarTarget(t);
    setAplicarData(proximoDomingoIso());
    setAplicarHora("19:00");
    setView("aplicar");
  };

  const confirmarAplicar = async () => {
    if (!aplicarTarget) return;
    if (!aplicarData || !aplicarHora) {
      onToast("Informe data e horário", "error");
      return;
    }
    setSaving(true);
    try {
      const data_hora = `${aplicarData} ${aplicarHora}:00`;
      const result = await escalaService.aplicarTemplate(aplicarTarget.id_escala_template, {
        data_hora,
        titulo: aplicarTarget.payload?.titulo || aplicarTarget.nome,
      });
      onToast(
        result.warnings?.length
          ? `Template aplicado com ${result.warnings.length} aviso(s)`
          : "Template aplicado — evento criado",
        "success"
      );
      await onChanged();
      onClose();
      if (result.dados?.id_escala_evento) onAplicado(result.dados.id_escala_evento);
    } catch (err) {
      onToast(getErrorMessage(err, "Erro ao aplicar template"), "error");
    } finally {
      setSaving(false);
    }
  };

  const ministeriosSelecionados = ministerios
    .filter((m) => form.id_ministerios.includes(m.id_ministerio))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || a.nome.localeCompare(b.nome));

  const resumoTemplate = (t: EscalaTemplate) => {
    const mins = t.payload?.id_ministerios?.length ?? t.payload?.areas?.length ?? 0;
    const pessoas =
      t.payload?.areas?.reduce((acc, a) => acc + (a.slots?.length || 0), 0) ?? 0;
    return `${mins} ministério${mins === 1 ? "" : "s"} · ${pessoas} pessoa${pessoas === 1 ? "" : "s"}`;
  };

  const tituloView =
    view === "lista"
      ? "Templates de escala"
      : view === "aplicar"
        ? "Aplicar template"
        : editandoId
          ? "Editar template"
          : "Novo template";

  const subtituloView =
    view === "lista"
      ? "Crie, edite e reutilize estruturas de escala."
      : view === "aplicar"
        ? aplicarTarget
          ? `Cria um evento com a estrutura de “${aplicarTarget.nome}”.`
          : ""
        : "Defina nome, ministérios e pessoas padrão.";

  return (
    <>
      <div className="modal-tpl-overlay" role="presentation" onClick={onClose}>
        <div
          className={`modal-tpl ${view !== "lista" ? "modal-tpl--wide" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="templates-titulo"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-tpl-header">
            <div className="modal-tpl-header-content">
              <span className="modal-tpl-icon" aria-hidden>
                {view === "aplicar" ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8 4h8a2 2 0 012 2v14l-6-3-6 3V6a2 2 0 012-2z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <div>
                <h2 id="templates-titulo" className="modal-tpl-title">
                  {tituloView}
                </h2>
                <p className="modal-tpl-subtitle">{subtituloView}</p>
              </div>
            </div>
            <button type="button" className="modal-tpl-close" onClick={onClose} aria-label="Fechar">
              ×
            </button>
          </div>

          <div className="modal-tpl-body">
            {view === "lista" && (
              <>
                <div className="modal-tpl-lista-top">
                  <button type="button" className="btn-tpl-novo" onClick={abrirNovo}>
                    + Novo template
                  </button>
                </div>

                {templates.length === 0 ? (
                  <p className="modal-tpl-vazio">
                    Nenhum template ainda. Clique em <strong>Novo template</strong> para começar.
                  </p>
                ) : (
                  <ul className="lista-templates">
                    {templates.map((t) => (
                      <li key={t.id_escala_template}>
                        <div className="template-info">
                          <strong>{t.nome}</strong>
                          <span className="template-meta">
                            {resumoTemplate(t)}
                            {t.criador_nome ? ` · por ${t.criador_nome}` : ""}
                          </span>
                        </div>
                        <div className="template-acoes">
                          <button type="button" className="btn-tpl-sec" onClick={() => abrirEditar(t)}>
                            Editar
                          </button>
                          <button type="button" className="btn-tpl-pri-sm" onClick={() => abrirAplicar(t)}>
                            Aplicar
                          </button>
                          <button
                            type="button"
                            className="btn-excluir-template"
                            onClick={() => setExcluirTarget(t)}
                          >
                            Excluir
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {view === "form" && (
              <div className="tpl-form">
                {eventoAberto && (
                  <button type="button" className="tpl-btn-importar" onClick={preencherDoEvento}>
                    Preencher com o evento aberto — {eventoAberto.titulo}
                  </button>
                )}

                <div className="form-group">
                  <label htmlFor="tpl-nome">Nome do template *</label>
                  <input
                    id="tpl-nome"
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex.: Culto domingo padrão"
                    maxLength={150}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tpl-titulo">Título padrão do evento</label>
                  <input
                    id="tpl-titulo"
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Usado ao aplicar o template"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tpl-desc">Descrição</label>
                  <textarea
                    id="tpl-desc"
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    rows={2}
                    placeholder="Opcional"
                  />
                </div>

                <div className="form-group form-group--ministerios">
                  <div className="tpl-min-header">
                    <label>Ministérios *</label>
                    <span className="tpl-count">
                      {form.id_ministerios.length} selecionado
                      {form.id_ministerios.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="tpl-ministerios-grid" role="group" aria-label="Ministérios">
                    {ministerios.map((m) => {
                      const checked = form.id_ministerios.includes(m.id_ministerio);
                      return (
                        <label
                          key={m.id_ministerio}
                          className={`tpl-ministerio-chip ${checked ? "selecionado" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMinisterio(m.id_ministerio)}
                          />
                          <span className="tpl-ministerio-chip__mark" aria-hidden />
                          <span className="tpl-ministerio-chip__nome">{m.nome}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {ministeriosSelecionados.length > 0 && (
                  <div className="tpl-areas">
                    <h3 className="tpl-areas-title">Pessoas por ministério</h3>
                    <p className="tpl-areas-hint">Opcional — quem costuma entrar em cada área.</p>
                    {ministeriosSelecionados.map((m) => {
                      const slots = form.slotsPorMinisterio[m.id_ministerio] || [];
                      return (
                        <div key={m.id_ministerio} className="tpl-area">
                          <div className="tpl-area-head">
                            <strong>{m.nome}</strong>
                            <span className="tpl-count">
                              {slots.length} pessoa{slots.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          {slots.length > 0 && (
                            <ul className="tpl-pessoas">
                              {slots.map((idUsuario) => (
                                <li key={idUsuario}>
                                  <span>
                                    {usuariosPorId.get(idUsuario) || `Usuário #${idUsuario}`}
                                  </span>
                                  <button
                                    type="button"
                                    className="tpl-remover-pessoa"
                                    onClick={() => removerPessoa(m.id_ministerio, idUsuario)}
                                    aria-label="Remover pessoa"
                                  >
                                    Remover
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="tpl-add-pessoa">
                            <div className="tpl-select-wrap">
                              <select
                                value={pessoaDraft[m.id_ministerio] || ""}
                                onChange={(e) =>
                                  setPessoaDraft((prev) => ({
                                    ...prev,
                                    [m.id_ministerio]: e.target.value,
                                  }))
                                }
                                aria-label={`Adicionar pessoa em ${m.nome}`}
                              >
                                <option value="">Adicionar pessoa…</option>
                                {usuarios
                                  .filter((u) => !slots.includes(u.id_usuario))
                                  .map((u) => (
                                    <option key={u.id_usuario} value={u.id_usuario}>
                                      {u.nome}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <button
                              type="button"
                              className="btn-tpl-add"
                              onClick={() => adicionarPessoa(m.id_ministerio)}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {view === "aplicar" && aplicarTarget && (
              <div className="tpl-form">
                <div className="tpl-aplicar-card">
                  <strong>{aplicarTarget.nome}</strong>
                  <span>{resumoTemplate(aplicarTarget)}</span>
                </div>
                <div className="tpl-aplicar-grid">
                  <div className="form-group">
                    <label htmlFor="tpl-aplicar-data">Data *</label>
                    <input
                      id="tpl-aplicar-data"
                      type="date"
                      value={aplicarData}
                      onChange={(e) => setAplicarData(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tpl-aplicar-hora">Horário *</label>
                    <input
                      id="tpl-aplicar-hora"
                      type="time"
                      value={aplicarHora}
                      onChange={(e) => setAplicarHora(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-tpl-actions">
            {view === "lista" && (
              <button type="button" className="btn-tpl-cancelar" onClick={onClose}>
                Fechar
              </button>
            )}
            {view === "form" && (
              <>
                <button
                  type="button"
                  className="btn-tpl-cancelar"
                  onClick={() => {
                    setView("lista");
                    setEditandoId(null);
                  }}
                  disabled={saving}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  className="btn-tpl-salvar"
                  onClick={() => void salvar()}
                  disabled={saving}
                >
                  {saving ? "Salvando…" : editandoId ? "Salvar alterações" : "Criar template"}
                </button>
              </>
            )}
            {view === "aplicar" && (
              <>
                <button
                  type="button"
                  className="btn-tpl-cancelar"
                  onClick={() => {
                    setView("lista");
                    setAplicarTarget(null);
                  }}
                  disabled={saving}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  className="btn-tpl-salvar"
                  onClick={() => void confirmarAplicar()}
                  disabled={saving}
                >
                  {saving ? "Aplicando…" : "Criar evento"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(excluirTarget)}
        title="Excluir template?"
        message={
          excluirTarget
            ? `Excluir o template "${excluirTarget.nome}"? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => void confirmarExcluir()}
        onCancel={() => setExcluirTarget(null)}
      />
    </>
  );
};

export default EscalaTemplatesModal;
