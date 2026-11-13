import React, { useEffect, useId, useRef, useState } from "react";

export interface ItemMenu {
  rotulo: string;
  onSelecionar: () => void;
  perigo?: boolean;
  desativado?: boolean;
  /** Linha separadora antes deste item */
  separar?: boolean;
}

/** Botão "Mais" com menu suspenso (fecha com Esc, clique fora ou ao escolher) */
const MenuAcoes: React.FC<{ rotulo?: string; itens: ItemMenu[]; alinhar?: "esquerda" | "direita"; acima?: boolean }> = ({
  rotulo = "Mais",
  itens,
  alinhar = "direita",
  acima = false,
}) => {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        raiz.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", tecla);
    // Foco no primeiro item ao abrir
    raiz.current?.querySelector<HTMLButtonElement>("[role=menuitem]:not(:disabled)")?.focus();
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  const visiveis = itens.filter(Boolean);
  if (visiveis.length === 0) return null;

  return (
    <div className="esc-menu" ref={raiz}>
      <button
        type="button"
        className="esc-btn esc-btn--fantasma"
        aria-label={rotulo}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={id}
        onClick={() => setAberto((v) => !v)}
      >
        {rotulo}
        <span aria-hidden className="esc-menu__seta">▾</span>
      </button>
      {aberto && (
        <div
          id={id}
          role="menu"
          tabIndex={-1}
          className={`esc-menu__lista esc-menu__lista--${alinhar}${acima ? " esc-menu__lista--acima" : ""}`}
          onKeyDown={(e) => {
            if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
            e.preventDefault();
            const botoes = Array.from(
              e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not(:disabled)")
            );
            const i = botoes.indexOf(document.activeElement as HTMLButtonElement);
            const prox = e.key === "ArrowDown" ? (i + 1) % botoes.length : (i - 1 + botoes.length) % botoes.length;
            botoes[prox]?.focus();
          }}
        >
          {visiveis.map((it) => (
            <React.Fragment key={it.rotulo}>
              {it.separar && <div className="esc-menu__sep" role="separator" />}
              <button
                type="button"
                role="menuitem"
                className={`esc-menu__item${it.perigo ? " perigo" : ""}`}
                disabled={it.desativado}
                onClick={() => {
                  setAberto(false);
                  it.onSelecionar();
                }}
              >
                {it.rotulo}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuAcoes;
