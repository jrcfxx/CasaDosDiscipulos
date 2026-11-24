import { describe, it, expect, vi, beforeEach } from "vitest";
import ExcelJS from "exceljs";
import { nomeDeAba, nomeDeArquivo, valorDaCelula } from "./exportarExcel";
import { exportarEscala, exportarRelatorioFormulario, exportarRespostasFormulario, exportarRanking } from "./exportacoes";
import type { EventoUnificado } from "../services/escalaService";
import type { RelatorioFormulario } from "../services/formularioRespostaService";

/** Intercepta o download e devolve a planilha gerada já aberta */
let baixados: { nome: string; blob: Blob }[] = [];
beforeEach(() => {
  baixados = [];
  let ultimoBlob: Blob | null = null;
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: (b: Blob) => {
      ultimoBlob = b;
      return "blob:teste";
    },
    revokeObjectURL: () => {},
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    baixados.push({ nome: this.download, blob: ultimoBlob! });
  });
});

async function abrirUltima() {
  // O Blob do jsdom não tem arrayBuffer(): lê com FileReader
  const blob = baixados[baixados.length - 1].blob;
  const buf = await new Promise<ArrayBuffer>((ok, erro) => {
    const fr = new FileReader();
    fr.onload = () => ok(fr.result as ArrayBuffer);
    fr.onerror = () => erro(fr.error);
    fr.readAsArrayBuffer(blob);
  });
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  return wb;
}

/** Valores de uma linha (sem a célula 0 do exceljs) */
const linha = (ws: ExcelJS.Worksheet, n: number) => (ws.getRow(n).values as unknown[]).slice(1);

describe("ajudantes", () => {
  it("nome de aba: até 31 caracteres, sem caracteres proibidos e sem repetir", () => {
    const usados = new Set<string>();
    expect(nomeDeAba("Relatório: semanal/mensal", usados)).toBe("Relatório  semanal mensal");
    expect(nomeDeAba("x".repeat(40), usados)).toHaveLength(31);
    expect(nomeDeAba("Escala", usados)).toBe("Escala");
    expect(nomeDeAba("escala", usados)).toBe("escala (2)");
  });
  it("nome de arquivo sem caracteres inválidos no Windows", () => {
    expect(nomeDeArquivo('Escala: "nov" 1/2', "xlsx")).toBe("Escala nov 1 2.xlsx");
  });
  it("números e datas viram números e datas de verdade", () => {
    expect(valorDaCelula("12", "numero")).toBe(12);
    expect(valorDaCelula("7,5", "numero")).toBe(7.5);
    expect(valorDaCelula("2026-11-23", "data")).toEqual(new Date(2026, 10, 23));
    expect(valorDaCelula("", "texto")).toBeNull();
  });
});

describe("planilhas geradas", () => {
  it("escala: uma linha por pessoa, vagas abertas e data como data", async () => {
    const ev = {
      id: 1, escalaId: 1, nome: "Culto de Domingo", tipo: "culto", data: "2026-11-22", horaInicio: "19:00", horaFim: "21:00",
      data_hora: "2026-11-22T19:00", status: "publicada",
      instrumentos: {
        v: { tipo: "violao", nome: "Violão", icone: "", limite: 2, atual: 1, ordem: 1, chaveDetalhe: "instrumento", id_escala_area: 9, areaNome: "Louvor", podeGerenciar: true,
          membros: [{ id: 1, membroEscalaId: 1, ordem: 0, id_escala_area: 9, tipoSlot: "violao", usuario: { id: 5, nome: "Lucas" } }] },
        m: { tipo: "_geral", nome: "Mídia", icone: "", limite: null, atual: 1, ordem: 2, chaveDetalhe: null, id_escala_area: 10, areaNome: "Mídia", podeGerenciar: true,
          membros: [{ id: 2, membroEscalaId: 2, ordem: 0, id_escala_area: 10, tipoSlot: "_geral", usuario: { id: 6, nome: "Amanda" } }] },
      },
      totais: { instrumentos: 2, vagasTotal: 2, vagasPreenchidas: 1, vagasDisponiveis: 1, totalPessoas: 2 },
    } as unknown as EventoUnificado;

    await exportarEscala("Novembro 2026", [ev], null);
    expect(baixados[0].nome).toBe("Escala – Novembro 2026.xlsx");
    const wb = await abrirUltima();
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Escala", "Vagas abertas"]);
    const ws = wb.getWorksheet("Escala")!;
    expect(linha(ws, 1)[0]).toBe("Novembro 2026");
    expect(linha(ws, 4)).toEqual(["Data", "Dia", "Início", "Fim", "Evento", "Status", "Área", "Função", "Pessoa"]);
    const l1 = linha(ws, 5);
    expect(l1[0]).toBeInstanceOf(Date);
    expect(l1.slice(1)).toEqual(["domingo", "19:00", "21:00", "Culto de Domingo", "Publicada", "Louvor", "Violão", "Lucas"]);
    // Mídia não tem função: a coluna "Função" fica vazia
    expect(linha(ws, 6).slice(6)).toEqual(["Mídia", undefined, "Amanda"]);
    const vagas = wb.getWorksheet("Vagas abertas")!;
    expect(linha(vagas, 4).slice(2)).toEqual(["Culto de Domingo", "Louvor", "Violão", 1, 2, 1]);
  });

  it("relatório de formulário: resumo e uma coluna por semana", async () => {
    const r: RelatorioFormulario = {
      frequencia: "semanal", inicio: "2026-11-01", fim: "2026-11-23", inicioEfetivo: "2026-11-01", fimEfetivo: "2026-11-28", inicioUso: "2026-10-12",
      criterioData: { tipo: "campo", label: "Data da reunião" },
      janelas: [
        { inicio: "2026-11-01", fim: "2026-11-07", rotulo: "1–7 nov", estado: "encerrada" },
        { inicio: "2026-11-22", fim: "2026-11-28", rotulo: "22–28 nov", estado: "em_andamento" },
      ],
      celulas: [{
        id_celula: 1, nome: "Farol", ativa: true, lideres: ["Luana"], respostas: 2, encerradas: 1, cumpridas: 1, faltas: 0, emDia: true,
        ultimoEnvio: "2026-11-22",
        janelas: [{ envios: 1, situacao: "enviado" }, { envios: 0, situacao: "aguardando" }],
        totais: [{ id: 36, label: "Presentes", soma: 14, media: 7, preenchidos: 2 }],
      }],
      resumo: { celulas: 1, emDia: 1, atrasadas: 0, respostas: 2, enviosEsperados: 1, enviosCumpridos: 1, pontualidade: 100,
        totais: [{ id: 36, label: "Presentes", soma: 14, media: 7, preenchidos: 2 }] },
    };
    await exportarRelatorioFormulario("Relatório de Célula", "Últimas 4 semanas", r);
    const wb = await abrirUltima();
    const res = wb.getWorksheet("Resumo")!;
    expect(linha(res, 5)).toEqual(["Células acompanhadas", 1]);
    const pc = wb.getWorksheet("Por célula")!;
    expect(linha(pc, 4)).toEqual(["Célula", "Líderes", "1–7 nov", "22–28 nov (atual)", "Relatórios", "Pendências", "Situação", "Último envio", "Presentes"]);
    const l = linha(pc, 5);
    expect(l.slice(0, 7)).toEqual(["Farol", "Luana", "Enviado", "Em andamento", 2, 0, "Em dia"]);
    expect(l[7]).toBeInstanceOf(Date);
    expect(l[8]).toBe(14);
  });

  it("respostas: uma coluna por campo, respeita os filtros e monta o link dos arquivos", async () => {
    await exportarRespostasFormulario(
      "Relatório de Célula",
      {
        campos: [
          { id: 35, label: "Data da reunião", tipo: "data" },
          { id: 36, label: "Presentes", tipo: "numero" },
          { id: 40, label: "Foto", tipo: "upload" },
        ],
        respostas: [
          { id_resposta: 1, nome_celula: "Farol", nome_lider: "Luana", data_resposta: "2026-11-02T22:00:00Z", data_referencia: "2026-11-01", valores: { 35: "2026-11-01", 36: "8", 40: "/uploads/a.jpg" } },
          { id_resposta: 2, nome_celula: "Reino", nome_lider: "Ana", data_resposta: "2026-11-09T22:00:00Z", data_referencia: "2026-11-08", valores: { 35: "2026-11-08", 36: "12" } },
        ],
      },
      new Set([1]),
      (p) => `https://site${p}`
    );
    const ws = (await abrirUltima()).getWorksheet("Respostas")!;
    expect(linha(ws, 4)).toEqual(["Célula", "Respondente", "Data da reunião", "Presentes", "Foto", "Enviado em"]);
    const l = linha(ws, 5);
    expect(l[0]).toBe("Farol");
    expect(l[3]).toBe(8);
    expect(l[4]).toBe("https://site/uploads/a.jpg");
    expect(ws.getRow(6).values).toEqual([]); // a resposta filtrada (Reino) ficou de fora
  });

  it("ranking com posição", async () => {
    await exportarRanking([
      { id_usuario: 1, nome: "Ana", pontuacao: 120, nivel_escola_nome: "Discipulado 3" },
      { id_usuario: 2, nome: "Bia", pontuacao: 90 },
    ]);
    const ws = (await abrirUltima()).getWorksheet("Ranking")!;
    expect(linha(ws, 5)).toEqual([1, "Ana", 120, "Discipulado 3"]);
    expect(linha(ws, 6).slice(0, 3)).toEqual([2, "Bia", 90]);
  });
});
