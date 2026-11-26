import React, { useCallback, useEffect, useState } from "react";
import segurancaService, { SituacaoUsuario } from "../../services/segurancaService";
import { getErrorMessage } from "../../utils/errorUtils";
import { formatarDataHora } from "../../utils/eventosSeguranca";
import ConfirmModal from "../ui/ConfirmModal";

type Pedido = { titulo: string; mensagem: string; botao: string; perigo?: boolean; acao: () => Promise<unknown> };

/**
 * Gerenciamento → painel do usuário: situação de segurança da pessoa e o que o admin pode fazer
 * (liberar acesso pausado, desconectar aparelhos, remover 2FA de quem perdeu o celular).
 */
const SegurancaUsuario: React.FC<{ idUsuario: number }> = ({ idUsuario }) => {
  const [sit, setSit] = useState<SituacaoUsuario | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  // Confirmação no próprio site (nunca a caixa do navegador)
  const [pedido, setPedido] = useState<Pedido | null>(null);

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

  const agir = async (acao: () => Promise<unknown>) => {
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
              onClick={() =>
                setPedido({
                  titulo: "Desconectar de todos os aparelhos?",
                  mensagem: "A pessoa sai na hora em todos os aparelhos e precisa entrar de novo com a senha.",
                  botao: "Desconectar",
                  acao: () => segurancaService.encerrarSessoesDoUsuario(idUsuario),
                })
              }>
              Desconectar aparelhos
            </button>
          )}
          {sit.totp_ativo && (
            <button type="button" className="sc-btn sc-btn--perigo" disabled={ocupado}
              onClick={() =>
                setPedido({
                  titulo: "Remover a verificação em duas etapas?",
                  mensagem: "Só faça isso se a própria pessoa pediu (perdeu o celular e os códigos). Ela poderá ativar de novo no Perfil.",
                  botao: "Remover",
                  perigo: true,
                  acao: () => segurancaService.removerDoisFatores(idUsuario),
                })
              }>
              Remover duas etapas
            </button>
          )}
        </div>
      )}
      {mensagem && <p className="gr-dica" role="status">{mensagem}</p>}
      {erro && <p className="gr-erro" role="alert">{erro}</p>}
      <ConfirmModal
        open={!!pedido}
        title={pedido?.titulo ?? ""}
        message={pedido?.mensagem ?? ""}
        confirmLabel={pedido?.botao}
        cancelLabel="Cancelar"
        variant={pedido?.perigo ? "danger" : "default"}
        onConfirm={async () => {
          const p = pedido;
          setPedido(null);
          if (p) await agir(p.acao);
        }}
        onCancel={() => setPedido(null)}
      />
    </div>
  );
};

export default SegurancaUsuario;
