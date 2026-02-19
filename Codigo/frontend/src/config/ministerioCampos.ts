/**
 * Configuração de campos por ministério para atribuições da Escala
 * O nome da área é comparado (case-insensitive) para determinar quais campos exibir
 */

export type CampoTipo = "text" | "textarea" | "select";

export interface CampoConfig {
  chave: string;
  label: string;
  tipo: CampoTipo;
  opcoes?: { value: string; label: string }[];
  placeholder?: string;
  obrigatorio?: boolean;
}

export interface MinisteriosCamposConfig {
  palavrasChave: string[]; // Nomes que identificam este ministério
  campos: CampoConfig[];
}

/** Mapeamento de ministérios para seus campos específicos */
export const MINISTERIO_CAMPOS: MinisteriosCamposConfig[] = [
  {
    palavrasChave: ["louvor", "música", "worship", "ministério de louvor"],
    campos: [
      {
        chave: "instrumento",
        label: "Instrumento / Função",
        tipo: "select",
        opcoes: [
          { value: "vocal", label: "Vocal" },
          { value: "violao", label: "Violão" },
          { value: "guitarra", label: "Guitarra" },
          { value: "teclado", label: "Teclado" },
          { value: "piano", label: "Piano" },
          { value: "bateria", label: "Bateria" },
          { value: "baixo", label: "Baixo" },
          { value: "percussao", label: "Percussão" },
          { value: "violino", label: "Violino" },
          { value: "violoncelo", label: "Violoncelo" },
          { value: "saxofone", label: "Saxofone" },
          { value: "trompete", label: "Trompete" },
          { value: "outro", label: "Outro" },
        ],
      },
      {
        chave: "musicas",
        label: "Músicas do evento",
        tipo: "textarea",
        placeholder: "Liste as músicas na ordem (ex: 1. Hosana, 2. Te louvarei...)",
      },
      {
        chave: "tom",
        label: "Tom das músicas",
        tipo: "text",
        placeholder: "Ex: C, D, G, Am",
      },
      {
        chave: "observacoes",
        label: "Observações",
        tipo: "textarea",
        placeholder: "Informações adicionais",
      },
    ],
  },
  {
    palavrasChave: ["som", "áudio", "audio"],
    campos: [
      {
        chave: "funcao",
        label: "Função",
        tipo: "select",
        opcoes: [
          { value: "operador_som", label: "Operador de som" },
          { value: "projecao", label: "Projeção / slides" },
          { value: "transmissao", label: "Transmissão ao vivo" },
          { value: "mesa", label: "Mesa de som" },
          { value: "outro", label: "Outro" },
        ],
      },
      {
        chave: "equipamentos",
        label: "Equipamentos / Setup",
        tipo: "textarea",
        placeholder: "Equipamentos que vai utilizar ou configurar",
      },
      {
        chave: "observacoes",
        label: "Observações",
        tipo: "textarea",
      },
    ],
  },
  {
    palavrasChave: ["recepção", "recepcao", "acolhida", "portaria"],
    campos: [
      {
        chave: "funcao",
        label: "Função",
        tipo: "select",
        opcoes: [
          { value: "portaria", label: "Portaria" },
          { value: "boas_vindas", label: "Boas-vindas" },
          { value: "cadastro", label: "Cadastro / Visitantes" },
          { value: "coordenacao", label: "Coordenação" },
          { value: "outro", label: "Outro" },
        ],
      },
      {
        chave: "observacoes",
        label: "Observações",
        tipo: "textarea",
      },
    ],
  },
  {
    palavrasChave: ["intercessão", "intercessao", "oração", "oracao"],
    campos: [
      {
        chave: "horario",
        label: "Horário de oração",
        tipo: "text",
        placeholder: "Ex: 18h às 19h, durante o culto",
      },
      {
        chave: "tipo",
        label: "Tipo",
        tipo: "select",
        opcoes: [
          { value: "pre_culto", label: "Pré-culto" },
          { value: "durante", label: "Durante o culto" },
          { value: "pos_culto", label: "Pós-culto" },
          { value: "vigilia", label: "Vigília" },
          { value: "outro", label: "Outro" },
        ],
      },
      {
        chave: "observacoes",
        label: "Observações",
        tipo: "textarea",
      },
    ],
  },
  {
    palavrasChave: ["infantil", "crianças", "criancas", "kids", "minikids"],
    campos: [
      {
        chave: "faixa_etaria",
        label: "Faixa etária",
        tipo: "select",
        opcoes: [
          { value: "0_3", label: "0 a 3 anos" },
          { value: "4_6", label: "4 a 6 anos" },
          { value: "7_9", label: "7 a 9 anos" },
          { value: "10_12", label: "10 a 12 anos" },
          { value: "todas", label: "Todas as idades" },
        ],
      },
      {
        chave: "atividades",
        label: "Atividades planejadas",
        tipo: "textarea",
        placeholder: "Descreva as atividades, lição bíblica, etc.",
      },
      {
        chave: "materiais",
        label: "Materiais necessários",
        tipo: "textarea",
        placeholder: "Lista de materiais que precisa",
      },
      {
        chave: "observacoes",
        label: "Observações",
        tipo: "textarea",
      },
    ],
  },
  {
    palavrasChave: ["mídia", "midia", "projeção", "projecao", "multimídia"],
    campos: [
      {
        chave: "funcao",
        label: "Função",
        tipo: "select",
        opcoes: [
          { value: "slides", label: "Slides / PowerPoint" },
          { value: "videos", label: "Vídeos" },
          { value: "transmissao", label: "Transmissão ao vivo" },
          { value: "graficos", label: "Gráficos / letras" },
          { value: "outro", label: "Outro" },
        ],
      },
      {
        chave: "arquivos",
        label: "Arquivos / Links",
        tipo: "textarea",
        placeholder: "Links de vídeos, drive, etc.",
      },
      {
        chave: "observacoes",
        label: "Observações",
        tipo: "textarea",
      },
    ],
  },
  {
    palavrasChave: ["liturgia", "condução", "conducao"],
    campos: [
      {
        chave: "partes",
        label: "Partes do culto que conduz",
        tipo: "textarea",
        placeholder: "Ex: Abertura, leitura bíblica, avisos, benção final",
      },
      {
        chave: "textos",
        label: "Textos / Leituras",
        tipo: "textarea",
        placeholder: "Referências bíblicas ou textos para ler",
      },
      {
        chave: "observacoes",
        label: "Observações",
        tipo: "textarea",
      },
    ],
  },
  {
    palavrasChave: ["diaconia", "diácono", "diacono", "serviço", "servico"],
    campos: [
      {
        chave: "tipo_servico",
        label: "Tipo de serviço",
        tipo: "select",
        opcoes: [
          { value: "santa_ceia", label: "Santa Ceia" },
          { value: "coleta", label: "Coleta / Ofertas" },
          { value: "comunhao", label: "Comunhão" },
          { value: "ordem", label: "Ordem / Segurança" },
          { value: "outro", label: "Outro" },
        ],
      },
      {
        chave: "observacoes",
        label: "Observações",
        tipo: "textarea",
      },
    ],
  },
  {
    palavrasChave: ["hospitalidade", "café", "cafe", "lanche", "alimentação"],
    campos: [
      {
        chave: "funcao",
        label: "Função",
        tipo: "select",
        opcoes: [
          { value: "cafe", label: "Café" },
          { value: "lanche", label: "Lanche" },
          { value: "jantar", label: "Jantar" },
          { value: "coordenacao", label: "Coordenação" },
          { value: "outro", label: "Outro" },
        ],
      },
      {
        chave: "itens",
        label: "Itens a providenciar",
        tipo: "textarea",
        placeholder: "Lista do que precisa trazer ou preparar",
      },
      {
        chave: "observacoes",
        label: "Observações",
        tipo: "textarea",
      },
    ],
  },
  {
    palavrasChave: ["ensino", "pregação", "pregacao", "palavra"],
    campos: [
      {
        chave: "tema",
        label: "Tema / Texto base",
        tipo: "text",
        placeholder: "Ex: Romanos 12:1-2",
      },
      {
        chave: "duracao",
        label: "Duração estimada",
        tipo: "text",
        placeholder: "Ex: 30 min",
      },
      {
        chave: "recurso",
        label: "Recursos (slides, vídeo)",
        tipo: "textarea",
      },
      {
        chave: "observacoes",
        label: "Observações",
        tipo: "textarea",
      },
    ],
  },
  {
    palavrasChave: ["conducao", "condução geral", "coordenacao"],
    campos: [
      {
        chave: "funcao",
        label: "Papel no evento",
        tipo: "text",
        placeholder: "Ex: Condução geral, Abertura, Encerramento",
      },
      {
        chave: "observacoes",
        label: "Observações",
        tipo: "textarea",
      },
    ],
  },
];

/** Retorna os campos configurados para um nome de área */
export function getCamposPorArea(nomeArea: string): CampoConfig[] {
  const nomeNorm = nomeArea.toLowerCase().trim();
  const config = MINISTERIO_CAMPOS.find((m) =>
    m.palavrasChave.some((p) => nomeNorm.includes(p.toLowerCase()))
  );
  return config?.campos ?? [{ chave: "observacoes", label: "Observações", tipo: "textarea" }];
}
