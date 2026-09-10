/**
 * Espelho backend da config de campos por ministério (frontend: ministerioCampos.ts)
 * Usado para validar detalhes de atribuição e limites por função.
 */

export const LIMITES_FUNCAO = {
  louvor: {
    vocal: 4,
    violao: 2,
    guitarra: 2,
    teclado: 2,
    piano: 1,
    bateria: 1,
    baixo: 1,
  },
};

export const MINISTERIO_CAMPOS = [
  {
    palavrasChave: ["louvor", "música", "worship", "ministério de louvor"],
    chaveLimite: "louvor",
    campos: [
      {
        chave: "instrumento",
        tipo: "select",
        opcoes: [
          "vocal",
          "violao",
          "guitarra",
          "teclado",
          "piano",
          "bateria",
          "baixo",
          "percussao",
          "violino",
          "violoncelo",
          "saxofone",
          "trompete",
          "outro",
        ],
      },
    ],
  },
  {
    palavrasChave: ["som", "áudio", "audio"],
    campos: [
      {
        chave: "funcao",
        tipo: "select",
        opcoes: ["operador_som", "projecao", "transmissao", "mesa", "outro"],
      },
    ],
  },
  {
    palavrasChave: ["recepção", "recepcao", "acolhida", "portaria", "voluntários", "voluntarios"],
    campos: [
      {
        chave: "funcao",
        tipo: "select",
        opcoes: ["portaria", "boas_vindas", "cadastro", "coordenacao", "outro"],
      },
    ],
  },
];

export function getConfigPorArea(nomeArea) {
  const nomeNorm = String(nomeArea || "")
    .toLowerCase()
    .trim();
  return (
    MINISTERIO_CAMPOS.find((m) =>
      m.palavrasChave.some((p) => nomeNorm.includes(p.toLowerCase()))
    ) || null
  );
}

export function getLimitesPorArea(nomeArea) {
  const config = getConfigPorArea(nomeArea);
  if (!config?.chaveLimite) return null;
  return LIMITES_FUNCAO[config.chaveLimite] || null;
}
