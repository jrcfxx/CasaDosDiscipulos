/**
 * Planilhas de cada relatório do sistema (o que vai em cada aba e em que ordem).
 * A geração do arquivo em si fica em exportarExcel.ts.
 */
import { exportarExcel, type AbaExcel } from "./exportarExcel";
import { funcaoDe } from "./funcaoEscala";
import type { EventoUnificado, EstatisticasEscala } from "../services/escalaService";
import type { RelatorioFormulario } from "../services/formularioRespostaService";
import type { Celula } from "../services/celulaService";
import type { Ministerio } from "../services/ministerioService";
import type { Usuario } from "../components/gerirUser/tipos";
import type { RankItem } from "../components/modulos/RankingCard";

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const hojeTexto = () => new Date().toLocaleDateString("pt-BR");
const diaDaSemana = (iso: string) => DIAS[new Date(`${iso.slice(0, 10)}T12:00:00`).getDay()];

// ---------------------------------------------------------------- Escala

/** Uma linha por pessoa escalada (evento, área, função) + vagas abertas + resumo do período */
export async function exportarEscala(titulo: string, eventos: EventoUnificado[], estatisticas?: EstatisticasEscala | null) {
  const ordenados = [...eventos].sort((a, b) => `${a.data} ${a.horaInicio}`.localeCompare(`${b.data} ${b.horaInicio}`));

  type Linha = { ev: EventoUnificado; area: string; funcao: string; pessoa: string };
  const escalados: Linha[] = [];
  type Vaga = { ev: EventoUnificado; area: string; funcao: string; preenchidas: number; limite: number };
  const vagas: Vaga[] = [];
  for (const ev of ordenados) {
    const slots = Object.values(ev.instrumentos || {}).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    for (const s of slots) {
      for (const m of s.membros) {
        escalados.push({
          ev,
          area: s.areaNome,
          funcao: funcaoDe(m.detalhes, s.areaNome) || (s.tipo !== "_geral" ? s.nome : ""),
          pessoa: m.usuario.nome,
        });
      }
      if (s.limite != null && s.membros.length < s.limite) {
        vagas.push({ ev, area: s.areaNome, funcao: s.tipo !== "_geral" ? s.nome : "", preenchidas: s.membros.length, limite: s.limite });
      }
    }
  }

  const status = (s: string) => ({ publicada: "Publicada", rascunho: "Rascunho", cancelada: "Cancelada" })[s] || s;
  const abas: AbaExcel<never>[] = [
    {
      nome: "Escala",
      cabecalho: [titulo, `Gerado em ${hojeTexto()}`],
      linhas: escalados as never[],
      colunas: [
        { titulo: "Data", tipo: "data", valor: (l: Linha) => l.ev.data },
        { titulo: "Dia", valor: (l: Linha) => diaDaSemana(l.ev.data) },
        { titulo: "Início", valor: (l: Linha) => l.ev.horaInicio },
        { titulo: "Fim", valor: (l: Linha) => l.ev.horaFim },
        { titulo: "Evento", valor: (l: Linha) => l.ev.nome },
        { titulo: "Status", valor: (l: Linha) => status(l.ev.status) },
        { titulo: "Área", valor: (l: Linha) => l.area },
        { titulo: "Função", valor: (l: Linha) => l.funcao },
        { titulo: "Pessoa", valor: (l: Linha) => l.pessoa },
      ] as never,
    },
    {
      nome: "Vagas abertas",
      cabecalho: [`${titulo} — vagas ainda não preenchidas`],
      linhas: vagas as never[],
      colunas: [
        { titulo: "Data", tipo: "data", valor: (v: Vaga) => v.ev.data },
        { titulo: "Início", valor: (v: Vaga) => v.ev.horaInicio },
        { titulo: "Evento", valor: (v: Vaga) => v.ev.nome },
        { titulo: "Área", valor: (v: Vaga) => v.area },
        { titulo: "Função", valor: (v: Vaga) => v.funcao },
        { titulo: "Preenchidas", tipo: "numero", valor: (v: Vaga) => v.preenchidas },
        { titulo: "Vagas", tipo: "numero", valor: (v: Vaga) => v.limite },
        { titulo: "Faltam", tipo: "numero", valor: (v: Vaga) => v.limite - v.preenchidas },
      ] as never,
    },
  ];

  if (estatisticas) {
    type Pessoa = { nome: string; totalEscalas: number; diasEscalado?: number; funcoesPrincipais?: { nome: string }[] };
    const pessoas = new Map<string, Pessoa>();
    for (const p of [...(estatisticas.pessoasMaisEscaladas || []), ...(estatisticas.pessoasMenosEscaladas || [])]) {
      pessoas.set(p.nome, p);
    }
    abas.push({
      nome: "Pessoas",
      cabecalho: [`${titulo} — quantas vezes cada pessoa serviu`],
      linhas: [...pessoas.values()].sort((a, b) => b.totalEscalas - a.totalEscalas) as never[],
      colunas: [
        { titulo: "Pessoa", valor: (p: Pessoa) => p.nome },
        { titulo: "Escalas", tipo: "numero", valor: (p: Pessoa) => p.totalEscalas },
        { titulo: "Dias", tipo: "numero", valor: (p: Pessoa) => p.diasEscalado ?? null },
        { titulo: "Funções principais", valor: (p: Pessoa) => (p.funcoesPrincipais || []).map((f) => f.nome).join(", ") },
      ] as never,
    });
    const resumo: [string, number | string | null | undefined][] = [
      ["Eventos", estatisticas.totalEventos],
      ["Escalações", estatisticas.totalPessoas],
      ["Pessoas diferentes", estatisticas.pessoasUnicas],
      ["Vagas no total", estatisticas.vagasTotal],
      ["Vagas preenchidas", estatisticas.vagasPreenchidas],
      ["Vagas abertas", estatisticas.vagasDisponiveis],
      ["Preenchimento (%)", estatisticas.taxaPreenchimento],
      ["Média de pessoas por evento", estatisticas.mediaPessoasPorEvento],
    ];
    abas.unshift({
      nome: "Resumo",
      cabecalho: [titulo, `Gerado em ${hojeTexto()}`],
      linhas: resumo.filter(([, v]) => v !== undefined && v !== null) as never[],
      colunas: [
        { titulo: "Indicador", valor: (r: [string, unknown]) => r[0], largura: 32 },
        { titulo: "Valor", tipo: "numero", valor: (r: [string, number]) => r[1], largura: 14 },
      ] as never,
    });
  }

  await exportarExcel(`Escala – ${titulo}`, abas);
}

// ---------------------------------------------------------------- Formulários

/** Aba "Resumo" (números do período) e "Por célula" (uma coluna por semana/mês) */
export async function exportarRelatorioFormulario(tituloFormulario: string, periodo: string, r: RelatorioFormulario) {
  const sit = { enviado: "Enviado", faltou: "Não enviado", aguardando: "Em andamento" } as const;
  type Cel = RelatorioFormulario["celulas"][number];
  const resumo: [string, number | null][] = [
    ["Células acompanhadas", r.resumo.celulas],
    ["Células em dia", r.resumo.emDia],
    ["Células com pendência", r.resumo.atrasadas],
    ["Relatórios recebidos", r.resumo.respostas],
    ["Relatórios esperados (períodos encerrados)", r.resumo.enviosEsperados],
    ["Relatórios no prazo", r.resumo.enviosCumpridos],
    ["Pontualidade (%)", r.resumo.pontualidade],
    ...r.resumo.totais.flatMap((t): [string, number | null][] => [
      [`${t.label} — total`, t.soma],
      [`${t.label} — média por relatório`, t.media],
    ]),
  ];
  const cabecalho = [`${tituloFormulario} — ${periodo}`, `Contando pela ${r.criterioData.label.toLowerCase()} · gerado em ${hojeTexto()}`];

  await exportarExcel(`Relatório – ${tituloFormulario} – ${periodo}`, [
    {
      nome: "Resumo",
      cabecalho,
      linhas: resumo.filter(([, v]) => v !== null) as never[],
      colunas: [
        { titulo: "Indicador", valor: (x: [string, number]) => x[0], largura: 44 },
        { titulo: "Valor", tipo: "numero", valor: (x: [string, number]) => x[1], largura: 12 },
      ] as never,
    },
    {
      nome: "Por célula",
      cabecalho,
      linhas: r.celulas as never[],
      colunas: [
        { titulo: "Célula", valor: (c: Cel) => c.nome + (c.ativa ? "" : " (inativa)") },
        { titulo: "Líderes", valor: (c: Cel) => c.lideres.join(", ") },
        ...(r.frequencia
          ? r.janelas.map((j, i) => ({
              titulo: j.rotulo + (j.estado === "em_andamento" ? " (atual)" : ""),
              valor: (c: Cel) => {
                const s = c.janelas[i];
                return s.situacao === "enviado" && s.envios > 1 ? `Enviado (${s.envios})` : sit[s.situacao];
              },
            }))
          : []),
        { titulo: "Relatórios", tipo: "numero", valor: (c: Cel) => c.respostas },
        ...(r.frequencia
          ? [
              { titulo: "Pendências", tipo: "numero", valor: (c: Cel) => c.faltas },
              { titulo: "Situação", valor: (c: Cel) => (c.faltas === 0 ? "Em dia" : "Atrasada") },
            ]
          : []),
        { titulo: "Último envio", tipo: "data", valor: (c: Cel) => c.ultimoEnvio },
        ...r.resumo.totais.map((t) => ({
          titulo: t.label,
          tipo: "numero",
          valor: (c: Cel) => c.totais.find((x) => x.id === t.id)?.soma ?? null,
        })),
      ] as never,
    },
  ]);
}

export interface ExportacaoRespostas {
  campos: { id: number; label: string; tipo: string }[];
  respostas: {
    id_resposta: number;
    nome_celula: string | null;
    nome_lider: string | null;
    data_resposta: string;
    data_referencia: string;
    valores: Record<number, string | null>;
  }[];
}

/** Uma linha por resposta, uma coluna por campo do formulário */
export async function exportarRespostasFormulario(
  tituloFormulario: string,
  dados: ExportacaoRespostas,
  idsVisiveis: Set<number> | null,
  urlArquivo: (caminho: string) => string
) {
  type R = ExportacaoRespostas["respostas"][number];
  const linhas = dados.respostas
    .filter((r) => !idsVisiveis || idsVisiveis.has(r.id_resposta))
    .sort((a, b) => b.data_referencia.localeCompare(a.data_referencia));
  const campoData = dados.campos.find((c) => c.tipo === "data");
  const valorCampo = (v: string | null | undefined, tipo: string) => {
    if (v == null || v === "") return null;
    if (tipo === "upload" && v.startsWith("/")) return urlArquivo(v);
    return v;
  };
  await exportarExcel(`Respostas – ${tituloFormulario}`, [
    {
      nome: "Respostas",
      cabecalho: [
        `${tituloFormulario} — respostas`,
        `${linhas.length} ${linhas.length === 1 ? "resposta" : "respostas"}${idsVisiveis ? " (com os filtros aplicados)" : ""} · gerado em ${hojeTexto()}`,
      ],
      linhas: linhas as never[],
      colunas: [
        { titulo: "Célula", valor: (r: R) => r.nome_celula },
        { titulo: "Respondente", valor: (r: R) => r.nome_lider },
        ...(campoData ? [] : [{ titulo: "Data", tipo: "data", valor: (r: R) => r.data_referencia }]),
        ...dados.campos.map((c) => ({
          titulo: c.label || "Campo",
          tipo: c.tipo === "numero" ? "numero" : c.tipo === "data" ? "data" : "texto",
          largura: c.tipo === "textarea" ? 50 : undefined,
          valor: (r: R) => valorCampo(r.valores[c.id], c.tipo),
        })),
        { titulo: "Enviado em", tipo: "data", valor: (r: R) => r.data_resposta },
      ] as never,
    },
  ]);
}

// ---------------------------------------------------------------- Gerenciamento

export async function exportarUsuarios(usuarios: Usuario[], ministerios: Ministerio[]) {
  const lidera = (id?: number) =>
    ministerios.filter((m) => (m.lideres || []).some((l) => l.id_usuario === id)).map((m) => m.nome).join(", ");
  const tipo = { administrador: "Administrador", lider: "Líder", membro: "Membro" } as const;
  const linhas = [...usuarios].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  await exportarExcel(`Usuários – ${hojeTexto().replace(/\//g, "-")}`, [
    {
      nome: "Usuários",
      cabecalho: ["Usuários da Casa dos Discípulos", `${linhas.length} pessoas · gerado em ${hojeTexto()}`],
      linhas: linhas as never[],
      colunas: [
        { titulo: "Nome", valor: (u: Usuario) => u.nome },
        { titulo: "E-mail", valor: (u: Usuario) => u.email },
        { titulo: "Telefone", valor: (u: Usuario) => u.telefone },
        { titulo: "Tipo", valor: (u: Usuario) => tipo[u.tipo] || u.tipo },
        { titulo: "Nível", valor: (u: Usuario) => u.nivel_exibir || u.nivel_nome },
        { titulo: "Escola de Discípulos", valor: (u: Usuario) => u.nivel_escola_nome },
        { titulo: "Líder de célula", valor: (u: Usuario) => (u.lider_celula ? "Sim" : "Não") },
        { titulo: "Lidera ministérios", valor: (u: Usuario) => lidera(u.id_usuario) },
        { titulo: "Situação", valor: (u: Usuario) => (u.ativo === false ? "Inativo" : "Ativo") },
      ] as never,
    },
  ]);
}

export async function exportarCelulas(celulas: Celula[]) {
  const dia = (d?: string) => (d ? d.charAt(0).toUpperCase() + d.slice(1) : "");
  const linhas = [...celulas].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  await exportarExcel(`Células – ${hojeTexto().replace(/\//g, "-")}`, [
    {
      nome: "Células",
      cabecalho: ["Células da Casa dos Discípulos", `${linhas.length} células · gerado em ${hojeTexto()}`],
      linhas: linhas as never[],
      colunas: [
        { titulo: "Célula", valor: (c: Celula) => c.nome },
        { titulo: "Líderes", valor: (c: Celula) => (c.lideres || []).map((l) => l.nome).join(", ") || c.nome_lider },
        { titulo: "Dia", valor: (c: Celula) => dia(c.dia_reuniao) },
        { titulo: "Horário", valor: (c: Celula) => c.horario_reuniao?.slice(0, 5) },
        { titulo: "Modalidade", valor: (c: Celula) => (c.modalidade ? dia(c.modalidade) : "") },
        { titulo: "Categoria", valor: (c: Celula) => c.categoria },
        { titulo: "Endereço", valor: (c: Celula) => c.endereco },
        { titulo: "GD mãe", valor: (c: Celula) => c.gd_mae },
        { titulo: "Situação", valor: (c: Celula) => (c.ativa ? "Ativa" : "Inativa") },
      ] as never,
    },
  ]);
}

// ---------------------------------------------------------------- Ranking

export async function exportarRanking(ranking: RankItem[]) {
  const linhas = ranking.map((r, i) => ({ ...r, posicao: i + 1 }));
  type L = (typeof linhas)[number];
  await exportarExcel(`Ranking – ${hojeTexto().replace(/\//g, "-")}`, [
    {
      nome: "Ranking",
      cabecalho: ["Ranking da Escola de Discípulos", `Gerado em ${hojeTexto()}`],
      linhas: linhas as never[],
      colunas: [
        { titulo: "Posição", tipo: "numero", valor: (r: L) => r.posicao, largura: 9 },
        { titulo: "Nome", valor: (r: L) => r.nome },
        { titulo: "Pontos", tipo: "numero", valor: (r: L) => r.pontuacao },
        { titulo: "Nível na escola", valor: (r: L) => r.nivel_escola_nome ?? r.nivel_escola },
      ] as never,
    },
  ]);
}
