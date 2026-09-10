export type TemaBiblico =
  | "luz"
  | "amor"
  | "pastor"
  | "paz"
  | "cruz"
  | "palavra";

const REGRAS: Array<{ tema: TemaBiblico; palavras: string[] }> = [
  {
    tema: "pastor",
    palavras: [
      "pastor",
      "ovelha",
      "pasto",
      "rebanho",
      "vara",
      "cajado",
      "salmo 23",
      "salmos 23",
    ],
  },
  {
    tema: "luz",
    palavras: ["luz", "lâmpada", "lampeira", "brilho", "ilumina", "sol", "claridade"],
  },
  {
    tema: "amor",
    palavras: ["amou", "amor", "ama", "amado", "caridade", "joão 3:16", "joao 3:16"],
  },
  {
    tema: "paz",
    palavras: ["paz", "sossego", "descanso", "tranquil", "consolo", "consola"],
  },
  {
    tema: "cruz",
    palavras: [
      "cruz",
      "crucific",
      "sangue",
      "ressusc",
      "ressurrei",
      "salvação",
      "salvacao",
      "redent",
    ],
  },
];

export function detectarTemaBiblico(
  referencia: string,
  textosVersiculo: string[] = []
): TemaBiblico {
  const blob = `${referencia} ${textosVersiculo.join(" ")}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const regra of REGRAS) {
    if (regra.palavras.some((p) => blob.includes(p.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))) {
      return regra.tema;
    }
  }
  return "palavra";
}

export const TEMA_ROTULO: Record<TemaBiblico, string> = {
  luz: "Luz do mundo",
  amor: "Amor de Cristo",
  pastor: "Bom Pastor",
  paz: "Paz que excede",
  cruz: "Cruz e vida",
  palavra: "Palavra viva",
};
