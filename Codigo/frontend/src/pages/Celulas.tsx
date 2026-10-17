import React, { useEffect, useMemo, useState } from "react";
import HeaderHome from "../components/layout/HeaderHome";
import Footer from "../components/layout/Footer";
import celulaService, {
  Celula,
  getCelulaImageUrl,
} from "../services/celulaService";
import heroCelulas from "../assets/celulas/hero-celulas.jpg";
import "../style/Celulas.css";

const DIA_LABEL: Record<string, string> = {
  segunda: "Segunda-feira",
  terça: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sábado: "Sábado",
  domingo: "Domingo",
};

function formatHorario(h?: string) {
  if (!h) return "";
  const s = String(h);
  const hhmm = s.length >= 5 ? s.substring(0, 5) : s;
  const [hh, mm] = hhmm.split(":");
  if (mm === "00") return `${Number(hh)}H`;
  if (mm === "30") return `${hh}H30`;
  return `${hh}H${mm}`;
}

function CelulaCard({ celula }: { celula: Celula }) {
  const img = getCelulaImageUrl(celula.imagem_url) || heroCelulas;
  const dia = DIA_LABEL[celula.dia_reuniao || ""] || celula.dia_reuniao || "";
  const hora = formatHorario(celula.horario_reuniao);
  const quando = [dia, hora].filter(Boolean).join(", ");
  const local =
    celula.modalidade === "online"
      ? "Online"
      : celula.endereco || "Belo Horizonte/MG";
  const categoriaCurta = (celula.categoria || "Célula")
    .replace(/^Célula de\s+/i, "")
    .trim();

  return (
    <article className="celula-card">
      <div className="celula-card__media">
        <img src={img} alt={`Célula ${celula.nome}`} loading="lazy" />
        <div className="celula-card__badge" aria-hidden="true">
          <span className="celula-card__badge-icon">⌕</span>
          <span>
            Célula de <strong>{categoriaCurta}</strong>
          </span>
        </div>
      </div>
      <div className="celula-card__footer">
        <h2 className="celula-card__nome">{celula.nome}</h2>
        <div className="celula-card__meta">
          {quando && <p className="celula-card__quando">{quando}</p>}
          <p className="celula-card__local">{local}</p>
          {celula.nome_lider && (
            <p className="celula-card__lider">Líder: {celula.nome_lider}</p>
          )}
        </div>
      </div>
    </article>
  );
}

const Celulas: React.FC = () => {
  const [celulas, setCelulas] = useState<Celula[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await celulaService.getPublicas();
        setCelulas((data || []).filter((c) => c.ativa !== false));
      } catch {
        setErro("Não foi possível carregar as células. Tente novamente.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return celulas;
    return celulas.filter((c) => {
      const blob = [
        c.nome,
        c.categoria,
        c.endereco,
        c.dia_reuniao,
        c.nome_lider,
        c.modalidade,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [celulas, busca]);

  const grupos = useMemo(() => {
    const map = new Map<string, Celula[]>();
    for (const c of filtradas) {
      const dia = c.dia_reuniao || "outros";
      const hora = formatHorario(c.horario_reuniao);
      const key = `${DIA_LABEL[dia] || dia}${hora ? ` ${hora}` : ""}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtradas]);

  return (
    <div className="celulas-page">
      <HeaderHome />

      <main id="main-content" className="celulas-main" tabIndex={-1}>
        <section className="celulas-hero">
          <img
            src={heroCelulas}
            alt=""
            className="celulas-hero__bg"
            aria-hidden="true"
          />
          <div className="celulas-hero__veil" />
          <div className="celulas-hero__content">
            <label className="celulas-search" htmlFor="busca-celula">
              <span className="celulas-search__icon" aria-hidden>
                ⌕
              </span>
              <input
                id="busca-celula"
                type="search"
                placeholder="Encontre a mais próxima de você!"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoComplete="off"
              />
            </label>
            <h1 className="celulas-hero__title">
              <span>Células</span>
              <em>da Casa</em>
            </h1>
          </div>
        </section>

        <section className="celulas-lista">
          {loading && <p className="celulas-status">Carregando células…</p>}
          {erro && (
            <p className="celulas-status celulas-status--erro" role="alert">
              {erro}
            </p>
          )}
          {!loading && !erro && filtradas.length === 0 && (
            <p className="celulas-status">Nenhuma célula encontrada.</p>
          )}

          {grupos.map(([titulo, items]) => (
            <div key={titulo} className="celulas-grupo">
              <h2 className="celulas-grupo__titulo">{titulo}</h2>
              <div className="celulas-grid">
                {items.map((c) => (
                  <CelulaCard key={c.id_celula} celula={c} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Celulas;
