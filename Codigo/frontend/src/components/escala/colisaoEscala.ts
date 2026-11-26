import { pointerWithin, rectIntersection, type CollisionDetection, type Modifier } from "@dnd-kit/core";
import { getEventCoordinates } from "@dnd-kit/utilities";

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

/**
 * O rótulo que segue o ponteiro fica CENTRALIZADO no cursor. Antes ele herdava a posição e o
 * tamanho do card original (largo): parecia que a pessoa ia cair num lugar e caía em outro.
 */
export const centralizarNoCursor: Modifier = ({ activatorEvent, draggingNodeRect, overlayNodeRect, transform }) => {
  if (!draggingNodeRect || !activatorEvent) return transform;
  const coords = getEventCoordinates(activatorEvent);
  if (!coords) return transform;
  const largura = overlayNodeRect?.width ?? 0;
  const altura = overlayNodeRect?.height ?? 0;
  return {
    ...transform,
    x: transform.x + coords.x - draggingNodeRect.left - largura / 2,
    y: transform.y + coords.y - draggingNodeRect.top - altura / 2,
  };
};

/** O DragOverlay usa o tamanho do card original por padrão; aqui ele fica do tamanho do rótulo */
export const estiloOverlay = { width: "auto", height: "auto", zIndex: 20000 } as const;
