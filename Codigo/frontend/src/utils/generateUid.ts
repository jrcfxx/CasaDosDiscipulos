/**
 * Gera um identificador único temporário para itens em lista (ex: campos antes de persistir).
 * Usado em formulários dinâmicos, quizzes, lições.
 */
export function generateUid(): number {
  return Date.now() + Math.floor(Math.random() * 10000);
}
