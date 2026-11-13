import { pointerWithin, rectIntersection, type CollisionDetection } from "@dnd-kit/core";

/**
 * Onde a pessoa vai cair ao soltar: o que está SOB O PONTEIRO, preferindo a área (slot) ao
 * card do evento que a contém. O padrão do dnd-kit (maior sobreposição) às vezes escolhia o card
 * inteiro e a pessoa caía numa área diferente da que o líder mirou.
 */
export const colisaoEscala: CollisionDetection = (args) => {
  const sob = pointerWithin(args);
  if (sob.length) {
    const slots = sob.filter((c) => String(c.id).startsWith("slot-") || String(c.id).startsWith("area-"));
    return slots.length ? slots : sob;
  }
  // Sem ponteiro (teclado) ou fora de tudo: cai na maior sobreposição
  return rectIntersection(args);
};
