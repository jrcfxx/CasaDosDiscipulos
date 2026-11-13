import React, { useState } from "react";
import { createPortal } from "react-dom";
import { formatarTelefoneInput } from "../../utils/telefoneUtils";
import type { Ministerio } from "../../services/ministerioService";
import type { Nivel, UsuarioModal } from "./tipos";
import BotaoCarregando from "../ui/BotaoCarregando";

/** Ícone de mostrar/ocultar senha */
const IconeOlho: React.FC<{ visivel: boolean }> = ({ visivel }) =>
  visivel ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

interface Props {
  usuarioModal: UsuarioModal;
  handleChange: (
    campo: keyof UsuarioModal,
    valor: string | File | null | number | boolean | number[]
  ) => void;
  niveisAtivos: Nivel[];
  ministerios: Ministerio[];
  showSenha: boolean;
  setShowSenha: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmarSenha: boolean;
  setShowConfirmarSenha: React.Dispatch<React.SetStateAction<boolean>>;
  onFechar: () => void;
  onSalvar: () => void;
  /** true enquanto salva: mostra progresso e bloqueia fechar/salvar de novo */
  salvando?: boolean;
  /** Gera uma senha temporária para o usuário (só na edição). Devolve a senha gerada. */
  onRedefinirSenha?: () => Promise<string>;
}

/** Modal de cadastro/edição de usuário (renderizado no body para não herdar estilos do container) */
const ModalUsuario: React.FC<Props> = ({
  usuarioModal,
  handleChange,
  niveisAtivos,
  ministerios,
  showSenha,
  setShowSenha,
  showConfirmarSenha,
  setShowConfirmarSenha,
  onFechar,
  onSalvar,
  salvando = false,
  onRedefinirSenha,
}) => {
  const [senhaTemporaria, setSenhaTemporaria] = useState<string | null>(null);
  const [redefinindo, setRedefinindo] = useState(false);
  const [erroRedefinir, setErroRedefinir] = useState("");
  const [copiado, setCopiado] = useState(false);

  const redefinir = async () => {
    if (!onRedefinirSenha) return;
    setRedefinindo(true);
    setErroRedefinir("");
    try {
      setSenhaTemporaria(await onRedefinirSenha());
    } catch (e) {
      setErroRedefinir(e instanceof Error ? e.message : "Não foi possível redefinir a senha");
    } finally {
      setRedefinindo(false);
    }
  };

  const copiar = async () => {
    if (!senhaTemporaria) return;
    try {
      await navigator.clipboard.writeText(senhaTemporaria);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sem permissão de área de transferência: a senha continua visível na tela */
    }
  };

  return createPortal(
    <div className="modal-fundo" role="dialog" aria-modal="true">
      <div className="modal modal-usuario">
        <div className="cd-modal-header">
          <div className="cd-modal-header-content">
            <span className="cd-modal-icon" aria-hidden>👤</span>
            <div>
              <h2 className="cd-modal-title">
                {usuarioModal.id_usuario ? "Editar Usuário" : "Novo Usuário"}
              </h2>
              <p className="cd-modal-subtitle">
                {usuarioModal.id_usuario
                  ? "Atualize os dados e permissões deste usuário"
                  : "Preencha os dados para cadastrar um novo usuário"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="cd-modal-close"
            onClick={onFechar}
            disabled={salvando}
            title="Fechar"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="modal-content modal-usuario-grid">
          <div className="form-field">
            <label htmlFor="usuarioModalNome">Nome Completo</label>
            <input
              id="usuarioModalNome"
              type="text"
              value={usuarioModal.nome || ""}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Digite o nome completo"
            />
          </div>

          <div className="form-field">
            <label htmlFor="usuarioModalEmail">Email</label>
            <input
              id="usuarioModalEmail"
              type="email"
              value={usuarioModal.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Digite o email"
            />
          </div>

          <div className="form-field">
            <label htmlFor="usuarioModalTelefone">Telefone / WhatsApp</label>
            <input
              id="usuarioModalTelefone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={usuarioModal.telefone || ""}
              onChange={(e) => handleChange("telefone", formatarTelefoneInput(e.target.value))}
              placeholder="11999999999 (apenas números)"
            />
          </div>

          <div className="form-field">
            <label htmlFor="usuarioModalTipo">Tipo de Usuário</label>
            <select
              id="usuarioModalTipo"
              value={usuarioModal.tipo}
              onChange={(e) => handleChange("tipo", e.target.value)}
            >
              <option value="">Selecione o tipo</option>
              <option value="membro">Membro</option>
              <option value="lider">Líder</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="usuarioModalNivel">Nível</label>
            <select
              id="usuarioModalNivel"
              key={`nivel-${usuarioModal.id_usuario ?? "new"}-${usuarioModal.id_nivel ?? "x"}`}
              value={
                usuarioModal.id_nivel != null && usuarioModal.id_nivel !== 0
                  ? String(usuarioModal.id_nivel)
                  : ""
              }
              onChange={(e) =>
                handleChange(
                  "id_nivel",
                  e.target.value ? parseInt(e.target.value, 10) : null
                )
              }
            >
              <option value="">Sem nível atribuído</option>
              {niveisAtivos.map((nivel) => (
                <option key={nivel.id_nivel} value={String(nivel.id_nivel)}>
                  {nivel.nome}
                </option>
              ))}
            </select>
          </div>

          {usuarioModal.tipo === "lider" && (
            <div className="form-field form-field-full lider-permissoes">
              <p className="lider-permissoes-title">Permissões do líder</p>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={usuarioModal.lider_celula ?? true}
                  onChange={(e) => handleChange("lider_celula", e.target.checked)}
                />
                <span>Líder de célula (acesso à Secretaria das Células)</span>
              </label>
              <div className="ministerios-lider-box ministerios-grid">
                <p className="lider-permissoes-title">Ministérios que lidera (acesso à Escala)</p>
                {ministerios.filter((m) => m.ativo).map((m) => (
                  <label key={m.id_ministerio} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={(usuarioModal.id_ministerios_lider ?? []).includes(m.id_ministerio)}
                      onChange={(e) => {
                        const prev = usuarioModal.id_ministerios_lider ?? [];
                        const next = e.target.checked
                          ? [...prev, m.id_ministerio]
                          : prev.filter((id) => id !== m.id_ministerio);
                        handleChange("id_ministerios_lider", next);
                      }}
                    />
                    <span>{m.nome}</span>
                  </label>
                ))}
                {ministerios.filter((m) => m.ativo).length === 0 && (
                  <p className="hint">Cadastre ministérios na aba Ministérios</p>
                )}
              </div>
            </div>
          )}

          <div className="form-field form-field-full">
            <span>Ministérios em que participa</span>
            <div className="ministerios-participa-box ministerios-grid">
            {ministerios.filter((m) => m.ativo).map((m) => (
              <label key={m.id_ministerio} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={(usuarioModal.id_ministerios_participa ?? []).includes(m.id_ministerio)}
                  onChange={(e) => {
                    const prev = usuarioModal.id_ministerios_participa ?? [];
                    const next = e.target.checked
                      ? [...prev, m.id_ministerio]
                      : prev.filter((id) => id !== m.id_ministerio);
                    handleChange("id_ministerios_participa", next);
                  }}
                />
                <span>{m.nome}</span>
              </label>
            ))}
            {ministerios.filter((m) => m.ativo).length === 0 && (
              <p className="hint">Nenhum ministério cadastrado</p>
            )}
            </div>
          </div>

          {usuarioModal.id_usuario && onRedefinirSenha && (
            <div className="form-field form-field-full redefinir-senha">
              <span className="lider-permissoes-title">Esqueceu a senha?</span>
              {senhaTemporaria ? (
                <div className="redefinir-senha__resultado" role="status">
                  <p>
                    Senha temporária: <strong className="redefinir-senha__valor">{senhaTemporaria}</strong>{" "}
                    <button type="button" className="redefinir-senha__copiar" onClick={copiar}>
                      {copiado ? "Copiada!" : "Copiar"}
                    </button>
                  </p>
                  <p className="hint">
                    Envie para a pessoa por um canal privado. Ela vai criar uma nova senha ao entrar. Esta
                    senha não será mostrada de novo, e as sessões abertas dessa pessoa foram encerradas.
                  </p>
                </div>
              ) : (
                <>
                  <p className="hint">
                    Gera uma senha temporária. A pessoa cria uma nova no próximo acesso.
                  </p>
                  <BotaoCarregando
                    type="button"
                    className="redefinir-senha__botao"
                    onClick={redefinir}
                    carregando={redefinindo}
                    textoCarregando="Gerando…"
                    disabled={salvando}
                  >
                    Gerar senha temporária
                  </BotaoCarregando>
                </>
              )}
              {erroRedefinir && <p className="hint redefinir-senha__erro" role="alert">{erroRedefinir}</p>}
            </div>
          )}

          <div className="form-field form-field-full form-field-senhas">
            <div className="form-field">
              <label htmlFor="usuarioModalSenha">
                Senha{" "}
                {usuarioModal.id_usuario && "(Deixar vazio para não alterar)"}
              </label>
              <div className="password-input-wrapper">
                <input
                  id="usuarioModalSenha"
                  type={showSenha ? "text" : "password"}
                  value={usuarioModal.senha || ""}
                  onChange={(e) => handleChange("senha", e.target.value)}
                  placeholder={
                    usuarioModal.id_usuario
                      ? "Nova senha (opcional)"
                      : "Mínimo 6 caracteres"
                  }
                  aria-describedby="usuarioModalSenhaDica"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowSenha((v) => !v)}
                  tabIndex={-1}
                  aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  <IconeOlho visivel={showSenha} />
                </button>
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="usuarioModalConfirmarSenha">Confirmar Senha</label>
              <div className="password-input-wrapper">
                <input
                  id="usuarioModalConfirmarSenha"
                  type={showConfirmarSenha ? "text" : "password"}
                  value={usuarioModal.confirmarSenha || ""}
                  onChange={(e) => handleChange("confirmarSenha", e.target.value)}
                  placeholder="Repita a senha"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmarSenha((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  <IconeOlho visivel={showConfirmarSenha} />
                </button>
              </div>
            </div>
            <p id="usuarioModalSenhaDica" className="hint form-field-full">
              A senha definida aqui é provisória: a pessoa cria a própria no primeiro acesso.
            </p>
          </div>
        </div>

        <div className="modal-buttons">
          <button onClick={onFechar} disabled={salvando}>Cancelar</button>
          <BotaoCarregando onClick={onSalvar} carregando={salvando} textoCarregando="Salvando…">
            {usuarioModal.id_usuario
              ? "Salvar Alterações"
              : "Criar Usuário"}
          </BotaoCarregando>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalUsuario;
