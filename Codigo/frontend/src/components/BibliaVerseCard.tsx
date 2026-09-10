import React, { useEffect, useState } from "react";
import {
  buscarVersiculo,
  formatarVersiculoParaConteudo,
  parseReferenciaBiblica,
  type VersiculoResultado,
} from "../utils/bibliaUtils";
import {
  detectarTemaBiblico,
  TEMA_ROTULO,
  type TemaBiblico,
} from "../utils/bibliaTema";
import "../style/BibliaVerseCard.css";

type Props = {
  referencia: string;
  /** No formulário admin: botão para colar no conteúdo */
  onInserir?: (bloco: string) => void;
  /** Já revelado ao montar (ex.: feed) */
  autoReveal?: boolean;
  className?: string;
};

const BibliaScene: React.FC<{ tema: TemaBiblico }> = ({ tema }) => (
  <div className={`biblia-scene biblia-scene--${tema}`} aria-hidden>
    <div className="biblia-scene__rays" />
    <div className="biblia-scene__halo" />
    <div className="biblia-scene__particles">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
    <svg
      className="biblia-scene__figure"
      viewBox="0 0 120 140"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* silhueta suave de Cristo (braços abertos) */}
      <ellipse cx="60" cy="28" rx="14" ry="16" fill="currentColor" opacity="0.92" />
      <path
        d="M60 44c-10 0-18 6-22 14l-18 38c-1.5 3 0.5 6 4 6h12l8-22v46c0 3 2 5 5 5h22c3 0 5-2 5-5V80l8 22h12c3.5 0 5.5-3 4-6L82 58c-4-8-12-14-22-14z"
        fill="currentColor"
        opacity="0.88"
      />
      {/* manto / movimento */}
      <path
        d="M38 70c8 10 36 10 44 0-6 18-38 18-44 0z"
        fill="currentColor"
        opacity="0.35"
      />
    </svg>
    <span className="biblia-scene__label">{TEMA_ROTULO[tema]}</span>
  </div>
);

const BibliaVerseCard: React.FC<Props> = ({
  referencia,
  onInserir,
  autoReveal = false,
  className = "",
}) => {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [versiculo, setVersiculo] = useState<VersiculoResultado | null>(null);
  const [reveal, setReveal] = useState(autoReveal);

  useEffect(() => {
    const refTrim = referencia.trim();
    setReveal(false);

    if (!refTrim || !parseReferenciaBiblica(refTrim)) {
      setVersiculo(null);
      setErro(null);
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setErro(null);

    const t = window.setTimeout(async () => {
      try {
        const result = await buscarVersiculo(refTrim, ac.signal);
        if (ac.signal.aborted) return;
        if (!result) {
          setVersiculo(null);
          setErro("Referência não reconhecida. Ex.: Salmos 23:1");
        } else {
          setVersiculo(result);
          setErro(null);
          requestAnimationFrame(() => setReveal(true));
        }
      } catch (err: unknown) {
        if (ac.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg =
          err instanceof Error ? err.message : "Não foi possível buscar o versículo";
        setVersiculo(null);
        setErro(msg);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, autoReveal ? 0 : 650);

    return () => {
      ac.abort();
      window.clearTimeout(t);
    };
  }, [referencia, autoReveal]);

  if (!referencia.trim()) return null;

  if (loading) {
    return (
      <div
        className={`biblia-verse-card biblia-verse-card--loading ${className}`}
        aria-live="polite"
      >
        <div className="biblia-verse-shimmer" />
        <p>Buscando a Palavra...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div
        className={`biblia-verse-card biblia-verse-card--erro ${className}`}
        role="alert"
      >
        {erro}
      </div>
    );
  }

  if (!versiculo) return null;

  const tema = detectarTemaBiblico(
    versiculo.referencia,
    versiculo.versiculos.map((v) => v.texto)
  );

  return (
    <div
      className={`biblia-verse-card ${reveal ? "biblia-verse-card--reveal" : ""} ${className}`}
      aria-live="polite"
    >
      <div className="biblia-verse-card__glow" aria-hidden />
      <BibliaScene tema={tema} />
      <div className="biblia-verse-card__body">
        <div className="biblia-verse-card__badge">{versiculo.versao}</div>
        <blockquote className="biblia-verse-card__quote">
          {versiculo.versiculos.map((v) => (
            <p key={v.numero}>
              {versiculo.versiculos.length > 1 && (
                <sup className="biblia-verse-card__num">{v.numero}</sup>
              )}
              {v.texto}
            </p>
          ))}
        </blockquote>
        <cite className="biblia-verse-card__ref">{versiculo.referencia}</cite>
        {onInserir && (
          <button
            type="button"
            className="biblia-verse-card__insert"
            onClick={() => onInserir(formatarVersiculoParaConteudo(versiculo))}
          >
            Inserir no conteúdo
          </button>
        )}
      </div>
    </div>
  );
};

export default BibliaVerseCard;
