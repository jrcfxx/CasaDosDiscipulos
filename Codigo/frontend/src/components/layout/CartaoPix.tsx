import React, { useState } from "react";

export const CHAVE_PIX = "34.455.752/0001-69";

/** Cartão escuro com QR Code, chave PIX para copiar e dados bancários (páginas públicas, estilos hm-oferta). */
const CartaoPix: React.FC = () => {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(CHAVE_PIX);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* sem permissão: a chave continua visível para copiar à mão */
    }
  };

  return (
    <div className="hm-oferta" role="group" aria-label="Como contribuir">
      <div className="hm-oferta__pix">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=0&data=${encodeURIComponent(CHAVE_PIX)}`}
          alt={`QR Code do PIX, chave ${CHAVE_PIX}`}
          className="hm-oferta__qr"
          width={140}
          height={140}
        />
        <div className="hm-oferta__chave">
          <span className="hm-oferta__rotulo">Chave PIX (CNPJ)</span>
          <strong>{CHAVE_PIX}</strong>
          <button type="button" className="hm-pilula hm-pilula--pequena" onClick={copiar}>
            {copiado ? "Chave copiada" : "Copiar chave"}
          </button>
          <span className="sr-only" role="status" aria-live="polite">{copiado ? "Chave PIX copiada" : ""}</span>
        </div>
      </div>
      <dl className="hm-oferta__conta">
        <div><dt>Banco</dt><dd>Stone (197)</dd></div>
        <div><dt>Agência</dt><dd>0001</dd></div>
        <div><dt>Conta corrente</dt><dd>574293-7</dd></div>
        <div><dt>CNPJ</dt><dd>{CHAVE_PIX}</dd></div>
        <div className="hm-oferta__inteiro"><dt>Favorecido</dt><dd>Comunidade Cristã Casa dos Discípulos</dd></div>
      </dl>
    </div>
  );
};

export default CartaoPix;
