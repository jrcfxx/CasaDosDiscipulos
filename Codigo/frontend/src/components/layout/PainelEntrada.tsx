import React from "react";
import foto from "../../assets/IMG_6936.jpg";

/** Painel decorativo com foto ao lado dos formulários de entrada (Login e Criar senha). */
const PainelEntrada: React.FC = () => (
  <aside className="entrada-foto" aria-hidden>
    <div className="entrada-foto__imagem" style={{ backgroundImage: `url(${foto})` }} />
    <p className="entrada-foto__cantos">
      <span>Portal do Discípulo</span>
      <span>Casa dos Discípulos</span>
    </p>
    <p className="entrada-foto__frase">
      Aqui é a <em>nossa Casa.</em>
    </p>
  </aside>
);

export default PainelEntrada;
