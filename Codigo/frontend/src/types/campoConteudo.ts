/**
 * Conteúdo dos campos dinâmicos (módulos, lições, quizzes e formulários).
 *
 * O backend guarda o conteúdo como texto; para alguns tipos esse texto é JSON:
 * - multipla_escolha / checkbox → { alternativas: [{ texto, correta }] }
 * - select                       → { opcoes: [...], correta }
 * - demais tipos                 → texto simples (texto, link, caminho de upload, data...)
 * - upload ainda não enviado      → File (vira caminho /uploads/... após o upload)
 */

export interface Alternativa {
  texto: string;
  correta: boolean;
}

export interface ConteudoAlternativas {
  alternativas: Alternativa[];
}

export interface ConteudoSelect {
  opcoes: string[];
  correta: string;
}

import type { ComponentType } from "react";

/** Qualquer valor que um campo dinâmico pode carregar */
export type ValorCampo =
  | string
  | number
  | boolean
  | null
  | undefined
  | string[]
  | File
  | ConteudoAlternativas
  | ConteudoSelect
  | Record<string, unknown>;

export function isRecord(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function normalizarAlternativas(lista: unknown[]): Alternativa[] {
  return lista.map((alt) => {
    const a = isRecord(alt) ? alt : {};
    // Mesma regra do código original: alt.texto || ""
    return { texto: (a.texto as string) || "", correta: Boolean(a.correta) };
  });
}

/**
 * Lê o conteúdo de múltipla escolha / checkbox.
 * Texto que não é JSON vira uma alternativa correta com esse texto (compatível com dados antigos).
 */
export function parseAlternativas(valor: unknown): ConteudoAlternativas {
  if (typeof valor === "string" && valor.trim()) {
    try {
      const parsed: unknown = JSON.parse(valor);
      if (isRecord(parsed) && Array.isArray(parsed.alternativas)) {
        return { alternativas: normalizarAlternativas(parsed.alternativas) };
      }
      return { alternativas: [{ texto: valor, correta: true }] };
    } catch {
      return { alternativas: [{ texto: valor, correta: true }] };
    }
  }
  if (isRecord(valor) && Array.isArray(valor.alternativas)) {
    return { alternativas: normalizarAlternativas(valor.alternativas) };
  }
  return { alternativas: [] };
}

/**
 * Lê o conteúdo de select (opções + resposta correta).
 * Texto que não é JSON vira uma única opção, que também é a correta.
 */
export function parseSelect(valor: unknown): ConteudoSelect {
  if (typeof valor === "string" && valor.trim()) {
    try {
      const parsed: unknown = JSON.parse(valor);
      if (isRecord(parsed) && Array.isArray(parsed.opcoes)) {
        return {
          opcoes: parsed.opcoes as string[],
          correta: (parsed.correta as string) || "",
        };
      }
      return { opcoes: [valor], correta: valor };
    } catch {
      return { opcoes: [valor], correta: valor };
    }
  }
  if (isRecord(valor) && Array.isArray(valor.opcoes)) {
    return valor as unknown as ConteudoSelect;
  }
  return { opcoes: [], correta: "" };
}

/**
 * Valor para o atributo `value` de <input>/<textarea>.
 * Texto e número passam (inclusive o número 0); qualquer outra coisa vira "".
 */
export function valorDeInput(valor: unknown): string | number {
  if (typeof valor === "string") return valor;
  if (typeof valor === "number") return Number.isNaN(valor) ? "" : valor;
  return "";
}

/** Valor aceito pelo UploadField: arquivo escolhido, caminho já enviado, ou nada */
export function valorUpload(valor: unknown): File | string | null {
  if (valor instanceof File || typeof valor === "string") return valor;
  return null;
}

/**
 * Contrato comum dos componentes escolhidos dinamicamente pelo tipo do campo
 * (TextField, UploadField, VideoField...). Cada componente aceita um subconjunto
 * de ValorCampo; as telas que montam o campo pelo tipo usam este contrato.
 */
export interface CampoDinamicoProps {
  id?: string;
  name: string;
  label: string;
  value: ValorCampo;
  onChange: (valor: ValorCampo) => void;
  [prop: string]: unknown;
}

export type CampoDinamico = ComponentType<CampoDinamicoProps>;

/** Campo como vem da API, já vinculado a um módulo, lição, quiz ou formulário */
export interface CampoVinculado {
  id?: number;
  id_campo: number;
  tipo_campo?: string;
  label?: string;
  conteudo?: ValorCampo;
  obrigatorio?: boolean | number;
  ordem?: number;
}
