import React from "react";
import { FREQUENCIA_OPCOES } from "../../services/formularioService";
import type { StatusCelulas } from "./statusCelulas";

interface Props extends StatusCelulas {
  frequenciaFormulario: string;
  filtroDataDashboardInicio: string;
  setFiltroDataDashboardInicio: (v: string) => void;
  filtroDataDashboardFim: string;
  setFiltroDataDashboardFim: (v: string) => void;
}

/** Aba "Dashboard" dos formulários: quais células enviaram no período (em dia) e quais estão atrasadas */
const PainelStatusCelulas: React.FC<Props> = ({
  temFrequencia,
  periodoValido,
  celulasEmDia,
  celulasAtrasadas,
  totalCelulas,
  emDiaCount,
  pendentesCount,
  percentualEmDia,
  frequenciaFormulario,
  filtroDataDashboardInicio,
  setFiltroDataDashboardInicio,
  filtroDataDashboardFim,
  setFiltroDataDashboardFim,
}) => (
    <div className="dashboard-section">
      <div className="dashboard-header">
        <p className="dashboard-subtitle">
          {temFrequencia
            ? `Status por célula — formulário ${FREQUENCIA_OPCOES.find((o) => o.value === frequenciaFormulario)?.label?.toLowerCase() ?? frequenciaFormulario}`
            : "Defina a frequência do formulário (na edição) para ver quais células estão em dia"}
        </p>
        {temFrequencia && (
          <div className="dashboard-filtro-data">
            <label htmlFor="filtro-data-inicio">Período:</label>
            <input
              id="filtro-data-inicio"
              type="date"
              value={filtroDataDashboardInicio}
              onChange={(e) => setFiltroDataDashboardInicio(e.target.value)}
              aria-label="Data inicial do período"
            />
            <span className="dashboard-filtro-ate">até</span>
            <input
              id="filtro-data-fim"
              type="date"
              value={filtroDataDashboardFim}
              onChange={(e) => setFiltroDataDashboardFim(e.target.value)}
              aria-label="Data final do período"
            />
            <span className="dashboard-filtro-info">
              Frequência: {FREQUENCIA_OPCOES.find((o) => o.value === frequenciaFormulario)?.label?.toLowerCase() ?? frequenciaFormulario}
            </span>
          </div>
        )}
      </div>

      {!temFrequencia && (
        <p className="dashboard-sem-frequencia muted">
          Edite o formulário e selecione a frequência esperada de envio (semanal, quinzenal, mensal ou bimestral) para que o dashboard calcule automaticamente quais células estão em dia.
        </p>
      )}

      {temFrequencia && (
      <>
      {!periodoValido && (
        <p className="dashboard-periodo-invalido muted">
          Selecione um período válido (data inicial antes da final).
        </p>
      )}
      {periodoValido && (
      <>
      <div className="dashboard-metrics">
        <div className="metric-card metric-total">
          <span className="metric-value">{totalCelulas}</span>
          <span className="metric-label">Células</span>
        </div>
        <div className="metric-card metric-ok">
          <span className="metric-value">{emDiaCount}</span>
          <span className="metric-label">Em dia</span>
        </div>
        <div className="metric-card metric-pending">
          <span className="metric-value">{pendentesCount}</span>
          <span className="metric-label">Atrasadas</span>
        </div>
        <div className="metric-card metric-pct">
          <span className="metric-value">{percentualEmDia}%</span>
          <span className="metric-label">Em dia</span>
        </div>
      </div>

      <div className="dashboard-progress">
        <div
          className="dashboard-progress-bar"
          style={{
            width: `${percentualEmDia}%`,
          }}
        />
      </div>

      <div className="dashboard-cards">
        {celulasEmDia.map((c) => (
          <div
            key={c.id_celula}
            className="dashboard-cell-card card-ok"
          >
            <span className="cell-card-icon">✓</span>
            <span className="cell-card-nome">{c.nome}</span>
            <span className="cell-card-count">
              {c.count} resposta{c.count !== 1 ? "s" : ""}
            </span>
          </div>
        ))}
        {celulasAtrasadas.map((c) => (
          <div
            key={c.id_celula}
            className="dashboard-cell-card card-pending"
          >
            <span className="cell-card-icon">⏳</span>
            <span className="cell-card-nome">{c.nome}</span>
            <span className="cell-card-count">Atrasada</span>
          </div>
        ))}
      </div>

      {temFrequencia && totalCelulas === 0 && (
        <p className="dashboard-empty muted">
          Nenhuma célula cadastrada.
        </p>
      )}
      </>
      )}
      </>
      )}
    </div>
);

export default PainelStatusCelulas;
