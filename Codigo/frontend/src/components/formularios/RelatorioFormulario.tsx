import React, { useEffect, useMemo, useState } from "react";
import formularioRespostaService, { type RelatorioFormulario as Relatorio } from "../../services/formularioRespostaService";
import { FREQUENCIA_OPCOES } from "../../services/formularioService";
import { atalhosDoPeriodo, formatarDiaMes, haQuantoTempo, rotuloCurto } from "./periodoRelatorio";
import "../../style/RelatorioFormulario.css";
import BotoesExportar from "../ui/BotoesExportar";
import { exportarRelatorioFormulario } from "../../utils/exportacoes";
import { exportarPdf } from "../../utils/exportarPdf";
import Icone from "../ui/Icone";

interface Props {
  idFormulario: number;
  frequencia: string | null | undefined;
  /** Título do formulário (nome dos arquivos exportados) */
  titulo?: string;
}

const fmtNumero = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/**
 * Aba "Relatório" dos formulários: quem enviou em cada semana/mês do período, quem está em dia,
 * pontualidade e totais dos campos numéricos (presentes, visitantes...).
 */
const RelatorioFormulario: React.FC<Props> = ({ idFormulario, frequencia, titulo = "Formulário" }) => {
  const freq = frequencia || "";
  const atalhos = useMemo(() => atalhosDoPeriodo(freq), [freq]);
  const [atalho, setAtalho] = useState(atalhos[0].id);
  const [inicio, setInicio] = useState(atalhos[0].inicio);
  const [fim, setFim] = useState(atalhos[0].fim);
  const [dados, setDados] = useState<Relatorio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Trocou de formulário (ou de frequência): volta ao atalho padrão dele
  useEffect(() => {
    setAtalho(atalhos[0].id);
    setInicio(atalhos[0].inicio);
    setFim(atalhos[0].fim);
  }, [idFormulario, atalhos]);

  useEffect(() => {
    if (!inicio || !fim || inicio > fim) return;
    let vivo = true;
    setCarregando(true);
    setErro(null);
    formularioRespostaService
      .relatorio(idFormulario, inicio, fim)
      .then((r) => vivo && setDados(r))
      .catch(() => vivo && setErro("Não foi possível carregar o relatório."))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [idFormulario, inicio, fim]);

  const escolherAtalho = (id: string) => {
    const a = atalhos.find((x) => x.id === id);
    if (!a) return;
    setAtalho(id);
    setInicio(a.inicio);
    setFim(a.fim);
  };

  const nomeFreq = FREQUENCIA_OPCOES.find((o) => o.value === freq)?.label?.toLowerCase();
  const unidade = { semanal: "semana", quinzenal: "quinzena", mensal: "mês", bimestral: "bimestre" }[freq] || "período";
  // "na semana" / "no mês": artigo conforme o gênero da unidade
  const feminino = freq === "semanal" || freq === "quinzenal";
  const naUnidade = `${feminino ? "na" : "no"} ${unidade}`;
  const aPrimeira = `${feminino ? "A primeira" : "O primeiro"} ${unidade}`;
  const r = dados?.resumo;
  const periodoTexto =
    atalhos.find((a) => a.id === atalho)?.rotulo ?? `${formatarDiaMes(inicio)} a ${formatarDiaMes(fim)}`;

  return (
    <section className="rel" aria-label="Relatório do formulário">
      <div className="rel-periodo">
        <div className="rel-atalhos" role="group" aria-label="Período">
          {atalhos.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`rel-atalho${atalho === a.id ? " ativo" : ""}`}
              aria-pressed={atalho === a.id}
              onClick={() => escolherAtalho(a.id)}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
        <BotoesExportar
          tema="claro"
          onExcel={dados ? () => exportarRelatorioFormulario(titulo, periodoTexto, dados) : undefined}
          onPdf={dados ? () => exportarPdf(`Relatório – ${titulo} – ${periodoTexto}`, { paisagem: true }) : undefined}
        />
        <div className="rel-datas">
          <label>
            De
            <input
              type="date"
              value={inicio}
              max={fim || undefined}
              onChange={(e) => {
                setAtalho("");
                setInicio(e.target.value);
              }}
            />
          </label>
          <label>
            Até
            <input
              type="date"
              value={fim}
              min={inicio || undefined}
              onChange={(e) => {
                setAtalho("");
                setFim(e.target.value);
              }}
            />
          </label>
        </div>
      </div>

      <h2 className="rel-titulo-impressao">
        {titulo} — {periodoTexto}
      </h2>

      {!freq && (
        <p className="rel-aviso">
          Este formulário não tem frequência definida, então não dá para dizer quem está em dia. Edite o
          formulário e escolha a frequência esperada (semanal, quinzenal, mensal ou bimestral).
        </p>
      )}

      {inicio > fim && <p className="rel-aviso">A data inicial precisa ser anterior à final.</p>}
      {erro && (
        <p className="rel-aviso rel-aviso--erro" role="alert">
          {erro}
        </p>
      )}

      {carregando && !dados ? (
        <div className="rel-carregando" aria-busy="true">
          Carregando relatório…
        </div>
      ) : dados && r ? (
        <div className={carregando ? "rel-atualizando" : undefined}>
          <p className="rel-criterio">
            {nomeFreq ? `Formulário ${nomeFreq}. ` : ""}
            Cada relatório conta {naUnidade} da <strong>{dados.criterioData.label.toLowerCase()}</strong>
            {dados.criterioData.tipo === "campo" ? " informada" : ""}.
            {freq === "semanal" && " Semanas de domingo a sábado."}
            {dados.inicioUso > inicio &&
              ` Contando a partir de ${formatarDiaMes(dados.inicioUso)}, quando chegou o primeiro relatório deste formulário.`}
            {dados.inicioEfetivo < inicio &&
              ` ${aPrimeira} conta ${feminino ? "inteira" : "inteiro"}, desde ${formatarDiaMes(dados.inicioEfetivo)}.`}
          </p>

          <div className="rel-kpis">
            {r.emDia !== null && (
              <div className={`rel-kpi${r.atrasadas ? " rel-kpi--alerta" : " rel-kpi--ok"}`}>
                <span className="rel-kpi__valor">
                  {r.emDia}
                  <small> de {r.celulas}</small>
                </span>
                <span className="rel-kpi__rotulo">células em dia</span>
              </div>
            )}
            {r.pontualidade !== null && (
              <div className="rel-kpi">
                <span className="rel-kpi__valor">{r.pontualidade}%</span>
                <span className="rel-kpi__rotulo">
                  dos relatórios no prazo
                  <small>
                    {r.enviosCumpridos} de {r.enviosEsperados} esperados
                  </small>
                </span>
              </div>
            )}
            <div className="rel-kpi">
              <span className="rel-kpi__valor">{r.respostas}</span>
              <span className="rel-kpi__rotulo">{r.respostas === 1 ? "relatório recebido" : "relatórios recebidos"}</span>
            </div>
            {r.totais.map((t) => (
              <div key={t.id} className="rel-kpi">
                <span className="rel-kpi__valor">{fmtNumero(t.soma)}</span>
                <span className="rel-kpi__rotulo">
                  {rotuloCurto(t.label)}
                  {t.media !== null && <small>média de {fmtNumero(t.media)} por relatório</small>}
                </span>
              </div>
            ))}
          </div>

          {dados.celulas.length === 0 ? (
            <p className="rel-aviso">Nenhuma célula ativa para acompanhar.</p>
          ) : (
            <>
              <div className="rel-tabela-wrap" role="region" aria-label="Envios por célula" tabIndex={0}>
                <table className="rel-tabela">
                  <thead>
                    <tr>
                      <th scope="col" className="rel-col-celula">
                        Célula
                      </th>
                      {freq &&
                        dados.janelas.map((j) => (
                          <th key={j.inicio} scope="col" className={j.estado === "em_andamento" ? "atual" : undefined}>
                            {j.rotulo}
                            {j.estado === "em_andamento" && <small>atual</small>}
                          </th>
                        ))}
                      {!freq && <th scope="col">Relatórios</th>}
                      {freq && <th scope="col">Situação</th>}
                      <th scope="col">Último envio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.celulas.map((c) => (
                      <tr key={c.id_celula}>
                        <th scope="row" className="rel-col-celula">
                          <span className="rel-celula-nome">
                            {c.nome}
                            {!c.ativa && <em> (inativa)</em>}
                          </span>
                          <span className="rel-celula-lider">{c.lideres.length ? c.lideres.join(", ") : "Sem líder"}</span>
                        </th>
                        {freq &&
                          c.janelas.map((s, i) => (
                            <td key={dados.janelas[i].inicio} className={`rel-marca rel-marca--${s.situacao}`}>
                              <span
                                title={
                                  s.situacao === "enviado"
                                    ? `${s.envios} ${s.envios === 1 ? "relatório" : "relatórios"} em ${dados.janelas[i].rotulo}`
                                    : s.situacao === "faltou"
                                      ? `Sem relatório em ${dados.janelas[i].rotulo}`
                                      : `${unidade} em andamento`
                                }
                              >
                                {s.situacao === "enviado" ? (
                                  <>
                                    <Icone nome="check" tamanho={15} />
                                    {s.envios > 1 && s.envios}
                                  </>
                                ) : s.situacao === "faltou" ? (
                                  <Icone nome="fechar" tamanho={15} />
                                ) : (
                                  "·"
                                )}
                              </span>
                              <span className="sr-only">
                                {s.situacao === "enviado" ? "enviado" : s.situacao === "faltou" ? "não enviado" : "em andamento"}
                              </span>
                            </td>
                          ))}
                        {!freq && <td>{c.respostas}</td>}
                        {freq && (
                          <td>
                            {c.faltas === 0 ? (
                              <span className="rel-chip rel-chip--ok">Em dia</span>
                            ) : (
                              <span className="rel-chip rel-chip--atraso">
                                {c.faltas} {c.faltas === 1 ? "pendente" : "pendentes"}
                              </span>
                            )}
                          </td>
                        )}
                        <td className="rel-ultimo">
                          {c.ultimoEnvio ? (
                            <>
                              {formatarDiaMes(c.ultimoEnvio)}
                              <small>{haQuantoTempo(c.ultimoEnvio)}</small>
                            </>
                          ) : (
                            <span className={c.faltas > 0 ? "rel-nunca" : "rel-sem-envio"}>Nenhum no período</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {freq && (
                <p className="rel-legenda">
                  <span className="rel-marca--enviado"><Icone nome="check" tamanho={13} /></span> enviado
                  <span className="rel-marca--faltou"><Icone nome="fechar" tamanho={13} /></span> não enviado
                  <span className="rel-marca--aguardando">·</span> {unidade} em andamento (ainda não conta como atraso)
                </p>
              )}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
};

export default RelatorioFormulario;
