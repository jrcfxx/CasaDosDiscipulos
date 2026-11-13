import React, { useState } from "react";
import "../../style/campoSenha.css";

export type CampoSenhaProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Campo de senha com botão para mostrar/ocultar (ajuda a não errar no celular).
 * Aceita as mesmas props de um <input>.
 */
const CampoSenha = React.forwardRef<HTMLInputElement, CampoSenhaProps>(({ className, ...props }, ref) => {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="campo-senha">
      <input {...props} ref={ref} type={visivel ? "text" : "password"} className={className} />
      <button
        type="button"
        className="campo-senha__alternar"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
        aria-controls={props.id}
        disabled={props.disabled}
      >
        {visivel ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
});

CampoSenha.displayName = "CampoSenha";

export default CampoSenha;
