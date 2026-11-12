import React from "react";

export interface BotaoCarregandoProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** true enquanto a ação está em andamento */
  carregando: boolean;
  /** Texto mostrado durante a ação (ex.: "Salvando…", "Enviando imagem…") */
  textoCarregando?: string;
}

/**
 * Botão que mostra spinner + texto de andamento e fica desativado enquanto a ação roda
 * (evita clique duplo e deixa claro que o sistema está trabalhando).
 */
const BotaoCarregando = React.forwardRef<HTMLButtonElement, BotaoCarregandoProps>(
  ({ carregando, textoCarregando = "Salvando…", disabled, children, ...props }, ref) => (
    <button {...props} ref={ref} disabled={disabled || carregando} aria-busy={carregando}>
      {carregando ? (
        <>
          <span className="btn-spinner" aria-hidden />
          {textoCarregando}
        </>
      ) : (
        children
      )}
    </button>
  )
);
BotaoCarregando.displayName = "BotaoCarregando";

export default BotaoCarregando;
