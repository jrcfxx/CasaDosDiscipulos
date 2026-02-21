/**
 * Modal para admin atribuir pontuação manual a um usuário.
 * Permite pesquisar por nome, selecionar a pessoa, informar pontos e motivo.
 */
import React, { useEffect, useState, useRef } from "react";
import { FocusTrap } from "focus-trap-react";
import "./DarPontosModal.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FocusTrapComponent = FocusTrap as any;
import usuarioService from "../../services/usuarioService";

export interface DarPontosModalProps {
  open: boolean;
  onConfirm: (id_usuario: number, pontos: number, motivo: string) => Promise<void>;
  onCancel: () => void;
}

const DarPontosModal: React.FC<DarPontosModalProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const [usuarios, setUsuarios] = useState<{ id_usuario: number; nome: string }[]>([]);
  const [busca, setBusca] = useState("");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<{ id_usuario: number; nome: string } | null>(null);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [pontos, setPontos] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const buscaRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  const usuariosFiltrados = busca.trim()
    ? usuarios.filter((u) =>
        u.nome.toLowerCase().includes(busca.toLowerCase().trim())
      )
    : usuarios;

  useEffect(() => {
    if (open) {
      setBusca("");
      setUsuarioSelecionado(null);
      setPontos("");
      setMotivo("");
      setErro(null);
      setMostrarLista(false);
      setLoadingUsers(true);
      usuarioService
        .getAll()
        .then((list) => {
          setUsuarios(
            list
              .filter((u) => u.ativo === true || u.ativo === 1)
              .map((u) => ({ id_usuario: u.id_usuario, nome: u.nome }))
              .sort((a, b) => a.nome.localeCompare(b.nome))
          );
        })
        .catch(() => setUsuarios([]))
        .finally(() => setLoadingUsers(false));
    }
  }, [open]);

  useEffect(() => {
    if (open && !usuarioSelecionado) {
      buscaRef.current?.focus();
    }
  }, [open, usuarioSelecionado]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
  };

  const handleClickFora = (e: React.MouseEvent) => {
    if (
      listaRef.current &&
      !listaRef.current.contains(e.target as Node) &&
      buscaRef.current &&
      !buscaRef.current.contains(e.target as Node)
    ) {
      setMostrarLista(false);
    }
  };

  const handleSelectUsuario = (u: { id_usuario: number; nome: string }) => {
    setUsuarioSelecionado(u);
    setBusca(u.nome);
    setMostrarLista(false);
  };

  const handleLimparSelecao = () => {
    setUsuarioSelecionado(null);
    setBusca("");
    buscaRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSelecionado) {
      setErro("Selecione a pessoa que receberá os pontos.");
      return;
    }

    const pts = parseInt(pontos, 10);
    const motivoTrim = motivo.trim();

    if (isNaN(pts) || pts <= 0) {
      setErro("Informe uma quantidade válida de pontos (número positivo).");
      return;
    }
    if (motivoTrim.length < 3) {
      setErro("O motivo deve ter no mínimo 3 caracteres.");
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      await onConfirm(usuarioSelecionado.id_usuario, pts, motivoTrim);
      onCancel();
    } catch (err: any) {
      setErro(err?.response?.data?.error || "Erro ao atribuir pontos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <FocusTrapComponent
      active={open}
      focusTrapOptions={{
        allowOutsideClick: true,
        escapeDeactivates: false,
        returnFocusOnDeactivate: true,
      }}
    >
      <div
        className="dar-pontos-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dar-pontos-modal-title"
        onClick={handleClickFora}
        onKeyDown={handleKeyDown}
      >
      <div className="dar-pontos-modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="dar-pontos-modal-title" className="dar-pontos-modal-title">
          Atribuir pontos
        </h2>

        <form onSubmit={handleSubmit} className="dar-pontos-modal-form">
          <div className="dar-pontos-modal-field dar-pontos-modal-field-pessoa">
            <label htmlFor="dar-pontos-busca">Pessoa *</label>
            <div className="dar-pontos-pessoa-wrapper">
              <input
                ref={buscaRef}
                id="dar-pontos-busca"
                type="text"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setUsuarioSelecionado(null);
                  setMostrarLista(true);
                }}
                onFocus={() => setMostrarLista(true)}
                placeholder="Pesquisar por nome..."
                disabled={loading}
                autoComplete="off"
              />
              {usuarioSelecionado && (
                <button
                  type="button"
                  className="dar-pontos-limpar"
                  onClick={handleLimparSelecao}
                  title="Limpar seleção"
                  aria-label="Limpar seleção"
                >
                  ×
                </button>
              )}
              {mostrarLista && (
                <div
                  ref={listaRef}
                  className="dar-pontos-lista-usuarios"
                  role="listbox"
                >
                  {loadingUsers ? (
                    <div className="dar-pontos-lista-loading">Carregando...</div>
                  ) : usuariosFiltrados.length === 0 ? (
                    <div className="dar-pontos-lista-vazia">
                      Nenhuma pessoa encontrada
                    </div>
                  ) : (
                    usuariosFiltrados.map((u) => (
                      <button
                        key={u.id_usuario}
                        type="button"
                        role="option"
                        aria-selected={usuarioSelecionado?.id_usuario === u.id_usuario}
                        className={`dar-pontos-lista-item ${
                          usuarioSelecionado?.id_usuario === u.id_usuario
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => handleSelectUsuario(u)}
                      >
                        {u.nome}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="dar-pontos-modal-field">
            <label htmlFor="dar-pontos-input">Pontos *</label>
            <input
              id="dar-pontos-input"
              type="number"
              min={1}
              value={pontos}
              onChange={(e) => setPontos(e.target.value)}
              placeholder="Ex: 10"
              disabled={loading}
            />
          </div>
          <div className="dar-pontos-modal-field">
            <label htmlFor="dar-pontos-motivo">
              Motivo * (ex: dinâmica presencial, participação em evento)
            </label>
            <textarea
              id="dar-pontos-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo dos pontos..."
              rows={3}
              disabled={loading}
              required
            />
          </div>

          {erro && <p className="dar-pontos-modal-erro">{erro}</p>}

          <div className="dar-pontos-modal-actions">
            <button
              type="button"
              className="dar-pontos-modal-btn dar-pontos-modal-btn-cancel"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="dar-pontos-modal-btn dar-pontos-modal-btn-confirm"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Atribuir pontos"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </FocusTrapComponent>
  );
};

export default DarPontosModal;
