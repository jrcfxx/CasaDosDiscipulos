import React from "react";
import "./SkipLink.css";

/**
 * Link para pular para o conteúdo principal (acessibilidade).
 * Aparece ao receber foco (teclado) para usuários de leitores de tela e navegação por teclado.
 */
const SkipLink: React.FC = () => (
  <a href="#main-content" className="skip-link">
    Pular para o conteúdo principal
  </a>
);

export default SkipLink;
