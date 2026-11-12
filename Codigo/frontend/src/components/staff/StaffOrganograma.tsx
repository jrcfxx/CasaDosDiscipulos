import React from "react";
import type { StaffEstrutura, StaffItem } from "../../services/staffService";
import "./StaffOrganograma.css";

/** Pessoas de uma função; vazio aparece como "A definir" */
const Pessoas: React.FC<{ pessoas: string | null }> = ({ pessoas }) =>
  pessoas ? (
    <span className="staff-org__pessoas">{pessoas}</span>
  ) : (
    <span className="staff-org__pessoas staff-org__pessoas--vago">A definir</span>
  );

/** Função (folha) ou subgrupo (com itens dentro, desenhados com uma linha guia) */
const No: React.FC<{ item: StaffItem }> = ({ item }) => {
  const temFilhos = item.filhos.length > 0;
  return (
    <li className={`staff-org__no${temFilhos ? " staff-org__no--subgrupo" : ""}`}>
      <div className="staff-org__cartao">
        <span className="staff-org__funcao">{item.titulo}</span>
        {(item.pessoas || !temFilhos) && <Pessoas pessoas={item.pessoas} />}
      </div>
      {temFilhos && (
        <ul className="staff-org__lista staff-org__lista--aninhada">
          {item.filhos.map((f) => (
            <No key={f.id_staff_item} item={f} />
          ))}
        </ul>
      )}
    </li>
  );
};

interface Props {
  estrutura: StaffEstrutura;
  /** Mostra título e subtítulo no topo (desligado quando a página já tem cabeçalho próprio) */
  mostrarCabecalho?: boolean;
}

/**
 * Organograma da Casa, somente leitura.
 * Grupos do topo viram colunas; no celular as colunas empilham.
 */
const StaffOrganograma: React.FC<Props> = ({ estrutura, mostrarCabecalho = true }) => {
  if (!estrutura.itens.length) {
    return <p className="staff-org__vazio">O organograma ainda não foi preenchido.</p>;
  }
  return (
    <div className="staff-org">
      {mostrarCabecalho && (
        <div className="staff-org__topo">
          <h2 className="staff-org__titulo">{estrutura.titulo}</h2>
          {estrutura.subtitulo && <p className="staff-org__subtitulo">{estrutura.subtitulo}</p>}
        </div>
      )}
      <div className="staff-org__grupos">
        {estrutura.itens.map((grupo) => (
          <section key={grupo.id_staff_item} className="staff-org__grupo" aria-label={grupo.titulo}>
            <h3 className="staff-org__grupo-titulo">{grupo.titulo}</h3>
            {grupo.pessoas && (
              <p className="staff-org__grupo-pessoas">
                <Pessoas pessoas={grupo.pessoas} />
              </p>
            )}
            {grupo.filhos.length > 0 && (
              <ul className="staff-org__lista">
                {grupo.filhos.map((f) => (
                  <No key={f.id_staff_item} item={f} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};

export default StaffOrganograma;
