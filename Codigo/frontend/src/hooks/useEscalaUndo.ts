import { useCallback, useState } from "react";
import escalaService, { EscalaEventoCompleto } from "../services/escalaService";

/**
 * Pilha local + desfazer via API (último snapshot do histórico).
 */
export function useEscalaUndo(
  onRestaurado: (ev: EscalaEventoCompleto) => void,
  onErro: (msg: string) => void
) {
  const [podeDesfazer, setPodeDesfazer] = useState(false);

  const marcarAlteracao = useCallback(() => {
    setPodeDesfazer(true);
  }, []);

  const desfazer = useCallback(
    async (idEvento: number) => {
      try {
        const ev = await escalaService.desfazer(idEvento);
        onRestaurado(ev);
        setPodeDesfazer(false);
      } catch {
        onErro("Não foi possível desfazer a última alteração");
      }
    },
    [onRestaurado, onErro]
  );

  return { podeDesfazer, marcarAlteracao, desfazer };
}
