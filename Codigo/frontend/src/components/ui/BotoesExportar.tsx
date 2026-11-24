import React, { useState } from "react";
import "./BotoesExportar.css";

interface Props {
  /** Gera e baixa o .xlsx; sem ela o botão de Excel não aparece */
  onExcel?: () => Promise<void> | void;
  /** Gera e baixa o .pdf; sem ela o botão de PDF não aparece */
  onPdf?: () => Promise<void> | void;
  /** "claro" para painéis brancos (Formulários), "escuro" para o resto do site */
  tema?: "claro" | "escuro";
  className?: string;
  /** Texto do botão de Excel (padrão "Exportar Excel") */
  rotuloExcel?: string;
}

/** Botões "Exportar Excel" e "Exportar PDF" (somem no próprio PDF) */
const BotoesExportar: React.FC<Props> = ({ onExcel, onPdf, tema = "escuro", className, rotuloExcel = "Exportar Excel" }) => {
  const [gerando, setGerando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const excel = async () => {
    if (!onExcel || gerando) return;
    setGerando(true);
    setErro(null);
    try {
      await onExcel();
    } catch {
      setErro("Não foi possível gerar a planilha. Tente de novo.");
    } finally {
      setGerando(false);
    }
  };

  const pdf = async () => {
    if (!onPdf || gerandoPdf) return;
    setGerandoPdf(true);
    setErro(null);
    try {
      await onPdf();
    } catch {
      setErro("Não foi possível gerar o PDF. Tente de novo.");
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <div className={`exportar-barra exportar-barra--${tema}${className ? ` ${className}` : ""}`}>
      {onExcel && (
        <button type="button" className="exportar-btn" onClick={excel} disabled={gerando} aria-busy={gerando}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M3 15h18M9 3v18" />
          </svg>
          {gerando ? "Gerando…" : rotuloExcel}
        </button>
      )}
      {onPdf && (
        <button type="button" className="exportar-btn" onClick={pdf} disabled={gerandoPdf} aria-busy={gerandoPdf}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M9 13h6M9 17h4" />
          </svg>
          {gerandoPdf ? "Gerando PDF…" : "Exportar PDF"}
        </button>
      )}
      {erro && (
        <span className="exportar-erro" role="alert">
          {erro}
        </span>
      )}
    </div>
  );
};

export default BotoesExportar;
