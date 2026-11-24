import { ValidationError } from "./AppError.js";

/**
 * Regras comuns dos campos de formulários e módulos (o que a pessoa monta no editor).
 * Ficam aqui para a criação e a edição validarem do mesmo jeito.
 */

/** Texto do campo como vai para o banco (coluna TEXT) */
export function conteudoParaTexto(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** "nome", " Nome " e "NOME" são o mesmo nome de campo */
const chaveDoNome = (label) => String(label || "").trim().toLocaleLowerCase("pt-BR");

/**
 * Confere a lista de campos: precisa ter pelo menos um, cada um com nome, nomes sem repetir
 * e tipo permitido para a entidade.
 * @param {Array} campos
 * @param {{ tiposPermitidos: Map<number,string>, oQue: string }} opcoes
 *   tiposPermitidos: id_campo -> tipo_campo; oQue: "formulário" | "módulo" (para as mensagens)
 */
export function validarListaDeCampos(campos, { tiposPermitidos, oQue, exigirUm = true }) {
  const lista = Array.isArray(campos) ? campos : [];
  if (exigirUm && lista.length === 0) {
    throw new ValidationError(`Adicione pelo menos um campo ao ${oQue}.`);
  }
  const vistos = new Set();
  lista.forEach((c, i) => {
    const label = String(c?.label ?? "").trim();
    if (!label) throw new ValidationError(`O ${i + 1}º campo está sem nome.`);
    if (!tiposPermitidos.has(Number(c.id_campo))) {
      throw new ValidationError(`O campo "${label}" tem um tipo que não pode ser usado em ${oQue}.`);
    }
    const chave = chaveDoNome(label);
    if (vistos.has(chave)) {
      throw new ValidationError(`Há dois campos chamados "${label}". Use nomes diferentes.`);
    }
    vistos.add(chave);
  });
}

/** http(s)://algo.dominio */
export function ehUrl(texto) {
  try {
    const u = new URL(String(texto).trim());
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * Conteúdo de módulo: o módulo é o material que o aluno vê, então cada bloco precisa ter conteúdo
 * (texto preenchido, link/vídeo válido, arquivo enviado).
 */
export function validarConteudoDeModulo(campos, tiposPermitidos) {
  for (const c of campos || []) {
    const label = String(c.label ?? "").trim();
    const tipo = tiposPermitidos.get(Number(c.id_campo));
    const valor = conteudoParaTexto(c.conteudo).trim();
    if (!valor) throw new ValidationError(`Preencha o conteúdo de "${label}".`);
    if ((tipo === "link" || tipo === "video") && !ehUrl(valor)) {
      throw new ValidationError(`"${label}" precisa ser um link completo (começando com https://).`);
    }
    if (tipo === "upload" && !valor.startsWith("/uploads/")) {
      throw new ValidationError(`Envie o arquivo de "${label}".`);
    }
    if (tipo === "numero" && !Number.isFinite(Number(valor.replace(",", ".")))) {
      throw new ValidationError(`"${label}" precisa ser um número.`);
    }
    if (tipo === "data" && !/^\d{4}-\d{2}-\d{2}/.test(valor)) {
      throw new ValidationError(`"${label}" precisa ser uma data.`);
    }
  }
}

/** ID de rota (:id) válido, senão 400 em vez de erro de banco */
export function idDaRota(id, oQue = "registro") {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new ValidationError(`ID de ${oQue} inválido`);
  return n;
}
