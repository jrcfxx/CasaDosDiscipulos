import React, { useState, useRef, useEffect } from "react";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import "./AccessibilityBar.css";

/**
 * Barra de recursos de acessibilidade (tamanho do texto, alto contraste).
 * Útil para pessoas com baixa visão.
 */
const AccessibilityBar: React.FC = () => {
  const ctx = useAccessibility();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!ctx) return null;

  const { fontSize, highContrast, setFontSize, setHighContrast } = ctx;

  return (
    <div className="a11y-bar" ref={ref} role="region" aria-label="Recursos de acessibilidade: tamanho do texto e alto contraste">
      <button
        type="button"
        className="a11y-bar__trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Abrir opções de acessibilidade: alterar tamanho do texto e alto contraste"
        title="Recursos de acessibilidade (tamanho do texto, alto contraste)"
      >
        <span className="a11y-bar__icon" aria-hidden>
          ♿
        </span>
      </button>
      {open && (
        <div className="a11y-bar__dropdown" role="menu">
          <div className="a11y-bar__group">
            <span className="a11y-bar__label">Tamanho do texto</span>
            <div className="a11y-bar__options">
              {(["100", "110", "125", "150"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="menuitemradio"
                  aria-checked={fontSize === s}
                  onClick={() => setFontSize(s)}
                  className={`a11y-bar__opt ${fontSize === s ? "active" : ""}`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>
          <div className="a11y-bar__group">
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={highContrast}
              onClick={() => setHighContrast(!highContrast)}
              className={`a11y-bar__opt a11y-bar__opt--wide ${highContrast ? "active" : ""}`}
            >
              Alto contraste
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityBar;
