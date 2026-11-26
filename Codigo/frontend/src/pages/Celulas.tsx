import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HeaderHome from "../components/layout/HeaderHome";
import Footer from "../components/layout/Footer";
import Icone from "../components/ui/Icone";
import celulaService, { Celula, getCelulaImageUrl } from "../services/celulaService";
import heroCelulas from "../assets/celulas/hero-celulas.jpg";
import "../style/homeModerna.css";
import "../style/celulasModerna.css";

const INSTAGRAM = "https://www.instagram.com/casadosdiscipulos/";

const DIAS: Record<string, { nome: string; curto: string; ordem: number }> = {
  domingo: { nome: "Domingo", curto: "Domingo", ordem: 0 },
  segunda: { nome: "Segunda-feira", curto: "Segunda", ordem: 1 },
  terça: { nome: "Terça-feira", curto: "Terça", ordem: 2 },
  quarta: { nome: "Quarta-feira", curto: "Quarta", ordem: 3 },
  quinta: { nome: "Quinta-feira", curto: "Quinta", ordem: 4 },
  sexta: { nome: "Sexta-feira", curto: "Sexta", ordem: 5 },
  sábado: { nome: "Sábado", curto: "Sábado", ordem: 6 },
};

/** "20:00:00" → "20h"; "20:30:00" → "20h30" */
function formatarHora(h?: string) {
  if (!h) return "";
  const [hh, mm] = String(h).substring(0, 5).split(":");
  return mm && mm !== "00" ? `${Number(hh)}h${mm}` : `${Number(hh)}h`;
}

/** Público da célula sem o prefixo: "Célula de Mulheres" → "Mulheres" */
function publico(c: Celula) {
  return (c.categoria || "Todos").replace(/^Célula de\s+/i, "").trim();
}

/** Endereço por extenso, sem abreviar o estado. */
function local(c: Celula) {
  if (c.modalidade === "online") return "Encontro online";
  const e = (c.endereco || "Belo Horizonte, Minas Gerais").trim();
  return e
    .replace(/\s*\/\s*MG\b/, ", Minas Gerais")
    .replace(/\s+-\s+MG\b/, " – Minas Gerais")
    .replace(/\bapto\.?(?=\s|$)/gi, "apartamento")
    .replace(/\s+-\s+/g, " – ");
}

function lideres(c: Celula) {
  const nomes = c.lideres?.map((l) => l.nome).filter(Boolean) ?? [];
  if (nomes.length) return nomes.join(" e ");
  return c.nome_lider || "";
}

function CartaoCelula({ celula }: { celula: Celula }) {
  const foto = getCelulaImageUrl(celula.imagem_url) || heroCelulas;
  const dia = DIAS[celula.dia_reuniao || ""]?.nome || celula.dia_reuniao || "";
  const hora = formatarHora(celula.horario_reuniao);
  const lider = lideres(celula);
  const online = celula.modalidade === "online";

  return (
    <li className="cl-cartao">
      <div className="cl-cartao__foto">
        <img src={foto} alt="" loading="lazy" />
        <span className="cl-selo">{publico(celula)}</span>
        {online && <span className="cl-selo cl-selo--online">Online</span>}
      </div>
      <div className="cl-cartao__corpo">
        <h3 className="cl-cartao__nome">{celula.nome}</h3>
        <ul className="cl-cartao__dados">
          {(dia || hora) && (
            <li>
              <Icone nome="calendario" tamanho={16} />
              <span>{[dia, hora].filter(Boolean).join(", às ")}</span>
            </li>
          )}
          <li>
            <Icone nome="mapa" tamanho={16} />
            <span>{local(celula)}</span>
          </li>
          {lider && (
            <li>
              <Icone nome="pessoa" tamanho={16} />
              <span><span className="sr-only">Liderança: </span>{lider}</span>
            </li>
          )}
        </ul>
      </div>
    </li>
  );
}

const TODOS = "";

/**
 * Células (/celulas) — mesma linguagem das páginas Início e A Casa (painéis escuros, títulos condensados,
 * dourado champanhe), com um localizador: busca livre + filtros por dia e por público, e resultados
 * organizados como uma agenda (dia e horário fixos à esquerda, células à direita).
 */
const Celulas: React.FC = () => {
  const [celulas, setCelulas] = useState<Celula[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [dia, setDia] = useState(TODOS);
  const [grupo, setGrupo] = useState(TODOS);

  useEffect(() => {
    celulaService
      .getPublicas()
      .then((d) => setCelulas((d || []).filter((c) => c.ativa !== false)))
      .catch(() => setErro("Não foi possível carregar as células. Tente novamente em instantes."))
      .finally(() => setCarregando(false));
  }, []);

  const diasDisponiveis = useMemo(
    () =>
      Array.from(new Set(celulas.map((c) => c.dia_reuniao || "").filter(Boolean))).sort(
        (a, b) => (DIAS[a]?.ordem ?? 9) - (DIAS[b]?.ordem ?? 9),
      ),
    [celulas],
  );

  const publicosDisponiveis = useMemo(
    () => Array.from(new Set(celulas.map(publico))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [celulas],
  );

  const filtradas = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    return celulas.filter((c) => {
      if (dia && c.dia_reuniao !== dia) return false;
      if (grupo && publico(c) !== grupo) return false;
      if (!q) return true;
      return [c.nome, c.categoria, local(c), c.dia_reuniao, lideres(c), c.modalidade]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(q);
    });
  }, [celulas, busca, dia, grupo]);

  /** Agrupa por dia + horário, na ordem da semana. */
  const agenda = useMemo(() => {
    const mapa = new Map<string, { dia: string; hora: string; itens: Celula[] }>();
    for (const c of filtradas) {
      const chave = `${c.dia_reuniao || "outros"}|${c.horario_reuniao || ""}`;
      if (!mapa.has(chave)) mapa.set(chave, { dia: c.dia_reuniao || "", hora: c.horario_reuniao || "", itens: [] });
      mapa.get(chave)!.itens.push(c);
    }
    return Array.from(mapa.values()).sort(
      (a, b) => (DIAS[a.dia]?.ordem ?? 9) - (DIAS[b.dia]?.ordem ?? 9) || a.hora.localeCompare(b.hora),
    );
  }, [filtradas]);

  const temFiltro = Boolean(busca || dia || grupo);
  const limpar = () => {
    setBusca("");
    setDia(TODOS);
    setGrupo(TODOS);
  };

  const totalOnline = celulas.filter((c) => c.modalidade === "online").length;

  return (
    <div className="hm">
      <HeaderHome />

      <main id="main-content" tabIndex={-1} className="hm-paineis">
        {/* ---------- Abertura ---------- */}
        <section className="hm-painel hm-painel--hero cl-abertura" aria-labelledby="cl-titulo">
          <div className="hm-painel__foto" style={{ backgroundImage: `url(${heroCelulas})` }} aria-hidden />
          <div className="hm-painel__veu hm-painel__veu--forte" aria-hidden />
          <p className="hm-cantos" aria-hidden>
            <span>Comunhão nas casas</span>
            <span>Belo Horizonte</span>
          </p>
          <div className="hm-painel__conteudo">
            <p className="hm-pre">Casa dos Discípulos</p>
            <h1 id="cl-titulo" className="hm-display hm-display--gigante">
              Células <em>da Casa</em>
            </h1>
            <p className="hm-frase">
              Pequenos grupos que se reúnem nas casas para compartilhar a vida, estudar a Palavra e fortalecer
              os laços de amor na família de Deus.
            </p>
            {celulas.length > 0 && (
              <dl className="cl-numeros">
                <div><dt>Células</dt><dd>{celulas.length}</dd></div>
                <div><dt>Dias de encontro</dt><dd>{diasDisponiveis.length}</dd></div>
                {totalOnline > 0 && <div><dt>Online</dt><dd>{totalOnline}</dd></div>}
              </dl>
            )}
            <a href="#encontre" className="hm-pilula hm-pilula--ouro">Encontre a sua</a>
          </div>
        </section>

        {/* ---------- Localizador ---------- */}
        <section id="encontre" className="hm-painel cl-localizador" aria-labelledby="cl-encontre">
          <p className="hm-cantos" aria-hidden><span>Encontre a sua</span><span>Perto de você</span></p>
          <div className="cl-localizador__conteudo">
            <h2 id="cl-encontre" className="hm-display">Qual célula é <em>a sua?</em></h2>

            <div className="cl-busca">
              <Icone nome="busca" tamanho={20} />
              <label htmlFor="cl-busca" className="sr-only">Buscar por nome, bairro, rua ou liderança</label>
              <input
                id="cl-busca"
                type="search"
                placeholder="Busque por bairro, rua, nome ou liderança"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoComplete="off"
              />
            </div>

            {diasDisponiveis.length > 1 && (
              <div className="cl-filtro" role="group" aria-labelledby="cl-filtro-dia">
                <span id="cl-filtro-dia" className="cl-filtro__rotulo">Dia</span>
                <button type="button" className="cl-chip" aria-pressed={dia === TODOS} onClick={() => setDia(TODOS)}>
                  Todos
                </button>
                {diasDisponiveis.map((d) => (
                  <button key={d} type="button" className="cl-chip" aria-pressed={dia === d} onClick={() => setDia(d)}>
                    {DIAS[d]?.curto || d}
                  </button>
                ))}
              </div>
            )}

            {publicosDisponiveis.length > 1 && (
              <div className="cl-filtro" role="group" aria-labelledby="cl-filtro-publico">
                <span id="cl-filtro-publico" className="cl-filtro__rotulo">Para quem</span>
                <button type="button" className="cl-chip" aria-pressed={grupo === TODOS} onClick={() => setGrupo(TODOS)}>
                  Todas
                </button>
                {publicosDisponiveis.map((p) => (
                  <button key={p} type="button" className="cl-chip" aria-pressed={grupo === p} onClick={() => setGrupo(p)}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            <p className="cl-contagem" role="status" aria-live="polite">
              {carregando
                ? "Carregando células…"
                : `${filtradas.length} ${filtradas.length === 1 ? "célula encontrada" : "células encontradas"}`}
              {temFiltro && !carregando && (
                <button type="button" className="cl-limpar" onClick={limpar}>Limpar filtros</button>
              )}
            </p>
          </div>
        </section>

        {/* ---------- Agenda de células ---------- */}
        <section className="cl-agenda" aria-label="Lista de células">
          {erro && <p className="cl-aviso" role="alert">{erro}</p>}

          {carregando && (
            <div className="cl-linha" aria-hidden>
              <div className="cl-linha__quando"><span className="cl-esqueleto cl-esqueleto--titulo" /></div>
              <ul className="cl-grade">
                {[0, 1, 2].map((i) => <li key={i} className="cl-cartao cl-esqueleto" />)}
              </ul>
            </div>
          )}

          {!carregando && !erro && filtradas.length === 0 && (
            <div className="cl-aviso">
              <p>Nenhuma célula encontrada com esses filtros.</p>
              <button type="button" className="hm-pilula hm-pilula--pequena" onClick={limpar}>Ver todas as células</button>
            </div>
          )}

          {agenda.map((g) => (
            <div key={`${g.dia}|${g.hora}`} className="cl-linha">
              <h2 className="cl-linha__quando">
                <span className="cl-linha__dia">{DIAS[g.dia]?.nome || g.dia || "Outros dias"}</span>
                {g.hora && <span className="cl-linha__hora">{formatarHora(g.hora)}</span>}
                <span className="cl-linha__total">
                  {g.itens.length} {g.itens.length === 1 ? "célula" : "células"}
                </span>
              </h2>
              <ul className="cl-grade">
                {g.itens.map((c) => <CartaoCelula key={c.id_celula} celula={c} />)}
              </ul>
            </div>
          ))}
        </section>

        {/* ---------- Ajuda para escolher ---------- */}
        <section className="hm-painel hm-painel--campanha cl-ajuda" aria-labelledby="cl-ajuda">
          <p className="hm-cantos" aria-hidden><span>Primeira vez?</span><span>A gente te ajuda</span></p>
          <div className="cl-ajuda__conteudo">
            <h2 id="cl-ajuda" className="hm-display hm-display--escuro">
              Ainda não sabe <em>qual escolher?</em>
            </h2>
            <ol className="cl-passos">
              <li>
                <span aria-hidden>01</span>
                <p>Venha ao culto de domingo, às 18h30, e conheça a família da Casa.</p>
              </li>
              <li>
                <span aria-hidden>02</span>
                <p>Fale com a gente no Instagram: indicamos a célula mais perto de você.</p>
              </li>
              <li>
                <span aria-hidden>03</span>
                <p>Chegue no dia do encontro. Não precisa levar nada, só a vontade de estar junto.</p>
              </li>
            </ol>
            <div className="hm-acoes cl-ajuda__acoes">
              <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="hm-pilula hm-pilula--tinta">
                Falar no Instagram <span className="sr-only">(abre em nova aba)</span>
              </a>
              <Link to="/#programacao" className="hm-pilula hm-pilula--tinta-contorno">Ver programação</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Celulas;
