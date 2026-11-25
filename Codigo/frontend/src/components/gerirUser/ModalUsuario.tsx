import React, { useId, useState } from "react";
import SegurancaUsuario from "./SegurancaUsuario";
import Gaveta, { ChipsMarcaveis, SecaoGaveta } from "./Gaveta";
import { formatarTelefoneInput } from "../../utils/telefoneUtils";
import type { Ministerio } from "../../services/ministerioService";
import type { Nivel, UsuarioModal } from "./tipos";
import BotaoCarregando from "../ui/BotaoCarregando";
import CampoSenha from "../ui/CampoSenha";

interface Props {
  usuarioModal: UsuarioModal;
  handleChange: (
    campo: keyof UsuarioModal,
    valor: string | File | null | number | boolean | number[]
  ) => void;
  niveisAtivos: Nivel[];
  ministerios: Ministerio[];
  onFechar: () => void;
  onSalvar: () => void;
  /** true enquanto salva: mostra progresso e bloqueia fechar/salvar de novo */
  salvando?: boolean;
  /** Gera uma senha temporária para o usuário (só na edição). Devolve a senha gerada. */
  onRedefinirSenha?: () => Promise<string>;
}

const TIPOS: Array<{ valor: UsuarioModal["tipo"]; nome: string; descricao: string }> = [
  { valor: "membro", nome: "Membro", descricao: "Trilha, escala e conteúdos" },
  { valor: "lider", nome: "Líder", descricao: "Célula e/ou ministérios" },
  { valor: "administrador", nome: "Administrador", descricao: "Acesso total à gestão" },
];

/** Painel de cadastro/edição de usuário */
const ModalUsuario: React.FC<Props> = ({
  usuarioModal,
  handleChange,
  niveisAtivos,
  ministerios,
  onFechar,
  onSalvar,
  salvando = false,
  onRedefinirSenha,
}) => {
  const id = useId();
  const editando = !!usuarioModal.id_usuario;
  const [senhaTemporaria, setSenhaTemporaria] = useState<string | null>(null);
  const [redefinindo, setRedefinindo] = useState(false);
  const [erroRedefinir, setErroRedefinir] = useState("");
  const [copiado, setCopiado] = useState(false);
  const ativos = ministerios.filter((m) => m.ativo).map((m) => ({ id: m.id_ministerio, nome: m.nome }));

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

  const camposSenha = (
    <div className="gr-grade">
      <div className="gr-campo">
        <label htmlFor={`${id}-senha`}>{editando ? "Nova senha provisória" : "Senha provisória"}</label>
        <CampoSenha
          id={`${id}-senha`}
          value={usuarioModal.senha || ""}
          onChange={(e) => handleChange("senha", e.target.value)}
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          aria-describedby={`${id}-senha-dica`}
        />
      </div>
      <div className="gr-campo">
        <label htmlFor={`${id}-confirmar`}>Repita a senha</label>
        <CampoSenha
          id={`${id}-confirmar`}
          value={usuarioModal.confirmarSenha || ""}
          onChange={(e) => handleChange("confirmarSenha", e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <p id={`${id}-senha-dica`} className="gr-dica gr-campo--inteiro">
        É provisória: no primeiro acesso a pessoa cria a própria senha.
      </p>
    </div>
  );

  return (
    <Gaveta
      titulo={editando ? usuarioModal.nome || "Editar usuário" : "Novo usuário"}
      subtitulo={editando ? "Dados, acesso e ministérios desta pessoa" : "Cadastre alguém para acessar o Portal"}
      icone="pessoa"
      onFechar={onFechar}
      onSalvar={onSalvar}
      salvando={salvando}
      rotuloSalvar={editando ? "Salvar alterações" : "Criar usuário"}
    >
      <SecaoGaveta titulo="Identificação">
        <div className="gr-grade">
          <div className="gr-campo gr-campo--inteiro">
            <label htmlFor={`${id}-nome`}>Nome completo</label>
            <input
              id={`${id}-nome`}
              value={usuarioModal.nome || ""}
              onChange={(e) => handleChange("nome", e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="gr-campo">
            <label htmlFor={`${id}-email`}>E-mail (login)</label>
            <input
              id={`${id}-email`}
              type="email"
              value={usuarioModal.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="gr-campo">
            <label htmlFor={`${id}-telefone`}>Telefone / WhatsApp</label>
            <input
              id={`${id}-telefone`}
              type="tel"
              inputMode="numeric"
              value={usuarioModal.telefone || ""}
              onChange={(e) => handleChange("telefone", formatarTelefoneInput(e.target.value))}
              placeholder="31999990000 (só números, com DDD)"
            />
          </div>
        </div>
      </SecaoGaveta>

      <SecaoGaveta titulo="Acesso" descricao="O tipo define o que a pessoa vê no Portal.">
        <fieldset className="gr-opcoes-tipo">
          <legend className="sr-only">Tipo de usuário</legend>
          {TIPOS.map((t) => (
            <label key={t.valor} className={`gr-tipo${usuarioModal.tipo === t.valor ? " gr-tipo--ativo" : ""}`}>
              <input
                type="radio"
                name={`${id}-tipo`}
                value={t.valor}
                checked={usuarioModal.tipo === t.valor}
                onChange={() => handleChange("tipo", t.valor)}
              />
              <span className="gr-tipo__nome">{t.nome}</span>
              <span className="gr-tipo__desc">{t.descricao}</span>
            </label>
          ))}
        </fieldset>

        <div className="gr-campo">
          <label htmlFor={`${id}-nivel`}>Nível na Escola de Discípulos</label>
          <select
            id={`${id}-nivel`}
            value={usuarioModal.id_nivel != null && usuarioModal.id_nivel !== 0 ? String(usuarioModal.id_nivel) : ""}
            onChange={(e) => handleChange("id_nivel", e.target.value ? parseInt(e.target.value, 10) : null)}
          >
            <option value="">Sem nível atribuído</option>
            {niveisAtivos.map((n) => <option key={n.id_nivel} value={String(n.id_nivel)}>{n.nome}</option>)}
          </select>
        </div>

        {usuarioModal.tipo === "lider" && (
          <div className="gr-bloco">
            <label className="gr-interruptor">
              <input
                type="checkbox"
                role="switch"
                aria-label="Líder de célula"
                checked={usuarioModal.lider_celula ?? true}
                onChange={(e) => handleChange("lider_celula", e.target.checked)}
              />
              <span className="gr-interruptor__trilho" aria-hidden />
              <span>
                <strong>Líder de célula</strong>
                <span className="gr-dica">Acessa Lições e Formulários da Secretaria das Células.</span>
              </span>
            </label>
            <p className="gr-rotulo">Ministérios que lidera <span className="gr-dica">(monta a escala deles)</span></p>
            <ChipsMarcaveis
              legenda="Ministérios que lidera"
              opcoes={ativos}
              marcados={usuarioModal.id_ministerios_lider ?? []}
              onMudar={(ids) => handleChange("id_ministerios_lider", ids)}
              vazio="Cadastre ministérios na aba Ministérios."
            />
          </div>
        )}
      </SecaoGaveta>

      <SecaoGaveta titulo="Ministérios em que serve" descricao="Usado na escala para sugerir quem pode servir em cada área.">
        <ChipsMarcaveis
          legenda="Ministérios em que participa"
          opcoes={ativos}
          marcados={usuarioModal.id_ministerios_participa ?? []}
          onMudar={(ids) => handleChange("id_ministerios_participa", ids)}
          vazio="Nenhum ministério cadastrado."
        />
      </SecaoGaveta>

      <SecaoGaveta titulo="Senha">
        {!editando && camposSenha}

        {editando && onRedefinirSenha && (
          <div className="gr-bloco">
            {senhaTemporaria ? (
              <div className="gr-senha-temp" role="status">
                <p className="gr-rotulo">Senha temporária</p>
                <div className="gr-senha-temp__linha">
                  <code>{senhaTemporaria}</code>
                  <button type="button" className="sc-btn sc-btn--contorno" onClick={copiar}>
                    {copiado ? "Copiada!" : "Copiar"}
                  </button>
                </div>
                <p className="gr-dica">
                  Envie por um canal privado. A pessoa cria uma senha nova ao entrar. Esta senha não aparece de
                  novo e os aparelhos dessa pessoa foram desconectados.
                </p>
              </div>
            ) : (
              <>
                <p className="gr-dica">Esqueceu a senha? Gere uma temporária: a pessoa cria uma nova no próximo acesso.</p>
                <BotaoCarregando
                  type="button"
                  className="sc-btn sc-btn--contorno gr-auto"
                  onClick={redefinir}
                  carregando={redefinindo}
                  textoCarregando="Gerando…"
                  disabled={salvando}
                >
                  Gerar senha temporária
                </BotaoCarregando>
              </>
            )}
            {erroRedefinir && <p className="gr-erro" role="alert">{erroRedefinir}</p>}
            <details className="gr-detalhes">
              <summary>Prefiro definir a senha provisória eu mesmo</summary>
              {camposSenha}
            </details>
          </div>
        )}
      </SecaoGaveta>

      {editando && (
        <SecaoGaveta titulo="Segurança da conta">
          <SegurancaUsuario idUsuario={Number(usuarioModal.id_usuario)} />
        </SecaoGaveta>
      )}
    </Gaveta>
  );
};

export default ModalUsuario;
