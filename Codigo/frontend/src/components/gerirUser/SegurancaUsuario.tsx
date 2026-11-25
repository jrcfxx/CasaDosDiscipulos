import React, { useCallback, useEffect, useState } from "react";
import segurancaService, { SituacaoUsuario } from "../../services/segurancaService";
import { getErrorMessage } from "../../utils/errorUtils";
import { formatarDataHora } from "../../utils/eventosSeguranca";

/**
 * Gerenciar Usuários → modal: situação de segurança da pessoa e o que o admin pode fazer
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

  const agir = async (acao: () => Promise<{ message?: string } | unknown>, confirmacao?: string) => {
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
    return erro ? <p className="hint redefinir-senha__erro" role="alert">{erro}</p> : null;
  }

  return (
    <div className="form-field form-field-full redefinir-senha">
      <span className="lider-permissoes-title">Segurança da conta</span>
      <ul className="hint seguranca-usuario__lista">
        <li>
          Último acesso: <strong>{sit.ultimo_login ? formatarDataHora(sit.ultimo_login) : "nunca entrou"}</strong>
        </li>
        <li>
          Acesso:{" "}
          {sit.bloqueado ? (
            <strong>pausado até {formatarDataHora(sit.bloqueado_ate)} (senha errada várias vezes)</strong>
          ) : (
            <strong>normal</strong>
          )}
        </li>
        <li>
          Verificação em duas etapas: <strong>{sit.totp_ativo ? "ativa" : "desligada"}</strong>
        </li>
        <li>
          Aparelhos conectados: <strong>{sit.sessoes_ativas}</strong>
        </li>
      </ul>
      <div className="seguranca-usuario__acoes">
        {sit.bloqueado && (
          <button type="button" className="redefinir-senha__botao" disabled={ocupado}
            onClick={() => agir(() => segurancaService.desbloquear(idUsuario))}>
            Liberar acesso agora
          </button>
        )}
        {sit.sessoes_ativas > 0 && (
          <button type="button" className="redefinir-senha__botao" disabled={ocupado}
            onClick={() => agir(() => segurancaService.encerrarSessoesDoUsuario(idUsuario), "Desconectar essa pessoa de todos os aparelhos?")}>
            Desconectar de todos os aparelhos
          </button>
        )}
        {sit.totp_ativo && (
          <button type="button" className="redefinir-senha__botao" disabled={ocupado}
            onClick={() => agir(() => segurancaService.removerDoisFatores(idUsuario),
              "Remover a verificação em duas etapas? Só faça isso se a própria pessoa pediu (perdeu o celular e os códigos).")}>
            Remover verificação em duas etapas
          </button>
        )}
      </div>
      {mensagem && <p className="hint" role="status">{mensagem}</p>}
      {erro && <p className="hint redefinir-senha__erro" role="alert">{erro}</p>}
    </div>
  );
};

export default SegurancaUsuario;
