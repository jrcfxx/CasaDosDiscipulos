import React, { useCallback, useEffect, useState } from "react";
import segurancaService, { SituacaoUsuario } from "../../services/segurancaService";
import { getErrorMessage } from "../../utils/errorUtils";
import { formatarDataHora } from "../../utils/eventosSeguranca";

/**
 * Gerenciamento → painel do usuário: situação de segurança da pessoa e o que o admin pode fazer
 * (liberar acesso pausado, desconectar aparelhos, remover 2FA de quem perdeu o celular).
 */
const SegurancaUsuario: React.FC<{ idUsuario: number }> = ({ idUsuario }) => {
  const [sit, setSit] = useState<SituacaoUsuario | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setSit(await segurancaService.situacaoUsuario(idUsuario));
    } catch (e) {
      setErro(getErrorMessage(e, "Não foi possível carregar a segurança da conta"));
    }
  }, [idUsuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const agir = async (acao: () => Promise<unknown>, confirmacao?: string) => {
    if (confirmacao && !window.confirm(confirmacao)) return;
    setOcupado(true);
    setErro("");
    setMensagem("");
    try {
      const r = (await acao()) as { message?: string } | undefined;
      setMensagem(r?.message || "Feito");
      await carregar();
    } catch (e) {
      setErro(getErrorMessage(e, "Não foi possível concluir"));
    } finally {
      setOcupado(false);
    }
  };

  if (!sit) {
    return erro ? <p className="gr-erro" role="alert">{erro}</p> : <p className="gr-dica" role="status">Carregando…</p>;
  }

  return (
    <div className="gr-bloco">
      <dl className="gr-situacao">
        <div>
          <dt>Último acesso</dt>
          <dd>{sit.ultimo_login ? formatarDataHora(sit.ultimo_login) : "Nunca entrou"}</dd>
        </div>
        <div>
          <dt>Acesso</dt>
          <dd className={sit.bloqueado ? "gr-situacao--alerta" : undefined}>
            {sit.bloqueado ? `Pausado até ${formatarDataHora(sit.bloqueado_ate)}` : "Normal"}
          </dd>
        </div>
        <div>
          <dt>Duas etapas</dt>
          <dd className={sit.totp_ativo ? "gr-situacao--ok" : undefined}>{sit.totp_ativo ? "Ativa" : "Desligada"}</dd>
        </div>
        <div>
          <dt>Aparelhos</dt>
          <dd>{sit.sessoes_ativas} conectado(s)</dd>
        </div>
      </dl>
      {(sit.bloqueado || sit.sessoes_ativas > 0 || sit.totp_ativo) && (
        <div className="gr-acoes-linha">
          {sit.bloqueado && (
            <button type="button" className="sc-btn sc-btn--contorno" disabled={ocupado}
              onClick={() => agir(() => segurancaService.desbloquear(idUsuario))}>
              Liberar acesso agora
            </button>
          )}
          {sit.sessoes_ativas > 0 && (
            <button type="button" className="sc-btn sc-btn--contorno" disabled={ocupado}
              onClick={() => agir(() => segurancaService.encerrarSessoesDoUsuario(idUsuario), "Desconectar essa pessoa de todos os aparelhos?")}>
              Desconectar aparelhos
            </button>
          )}
          {sit.totp_ativo && (
            <button type="button" className="sc-btn sc-btn--perigo" disabled={ocupado}
              onClick={() => agir(() => segurancaService.removerDoisFatores(idUsuario),
                "Remover a verificação em duas etapas? Só faça isso se a própria pessoa pediu (perdeu o celular e os códigos).")}>
              Remover duas etapas
            </button>
          )}
        </div>
      )}
      {mensagem && <p className="gr-dica" role="status">{mensagem}</p>}
      {erro && <p className="gr-erro" role="alert">{erro}</p>}
    </div>
  );
};

export default SegurancaUsuario;
