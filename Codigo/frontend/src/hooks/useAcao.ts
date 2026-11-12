import { useCallback, useRef, useState } from "react";

/**
 * Controla uma ação assíncrona (salvar, enviar, excluir...):
 * - `executando` fica true enquanto a ação roda (para mostrar progresso);
 * - um segundo clique enquanto a primeira ainda roda é ignorado (sem envio duplo).
 */
export function useAcao() {
  const [executando, setExecutando] = useState(false);
  const emAndamento = useRef(false);

  const executar = useCallback(async <T,>(acao: () => Promise<T>): Promise<T | undefined> => {
    if (emAndamento.current) return undefined;
    emAndamento.current = true;
    setExecutando(true);
    try {
      return await acao();
    } finally {
      emAndamento.current = false;
      setExecutando(false);
    }
  }, []);

  return { executando, executar };
}

export default useAcao;
