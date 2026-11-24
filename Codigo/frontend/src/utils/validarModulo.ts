/**
 * Conferência do módulo antes de salvar (criar e editar), com as mesmas regras do backend
 * (backend/src/utils/camposEntidade.js), para a pessoa ver o problema na hora e com o nome do campo.
 */

export interface ConteudoParaValidar {
  tipo: string;
  label: string;
  conteudo?: unknown;
}

/** http(s)://algo.dominio */
export function ehUrl(texto: string): boolean {
  try {
    const u = new URL(texto.trim());
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Mensagem do primeiro problema encontrado, ou null se está tudo certo */
export function erroDoModulo({
  titulo,
  conteudos,
  temBlocoQuiz = false,
  quizEscolhido = null,
}: {
  titulo: string;
  conteudos: ConteudoParaValidar[];
  temBlocoQuiz?: boolean;
  quizEscolhido?: number | null;
}): string | null {
  if (titulo.trim().length < 3) return "O nome do módulo precisa ter pelo menos 3 letras.";

  const vistos = new Set<string>();
  for (const [i, c] of conteudos.entries()) {
    const nome = c.label.trim();
    if (!nome) return `O ${i + 1}º conteúdo está sem nome.`;
    const chave = nome.toLocaleLowerCase("pt-BR");
    if (vistos.has(chave)) return `Há dois conteúdos chamados "${nome}". Use nomes diferentes.`;
    vistos.add(chave);

    const v = c.conteudo;
    // Arquivo escolhido e ainda não enviado conta como preenchido (é enviado ao salvar)
    if (typeof File !== "undefined" && v instanceof File) continue;
    const texto = v === null || v === undefined ? "" : String(v).trim();
    if (!texto) return `Preencha o conteúdo de "${nome}".`;
    if ((c.tipo === "link" || c.tipo === "video") && !ehUrl(texto)) {
      return `"${nome}" precisa ser um link completo (começando com https://).`;
    }
  }

  if (temBlocoQuiz && !quizEscolhido) return "Escolha o quiz do módulo ou remova o bloco de quiz.";
  return null;
}
