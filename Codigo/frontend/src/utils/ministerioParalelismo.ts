/**
 * Mapa: id_ministerio -> ids de ministérios com os quais pode haver a mesma pessoa no mesmo evento.
 */
export type ParalelismoMapa = Record<number, number[]>;

export function permiteParalelismoMinisterios(
  idA: number | null | undefined,
  idB: number | null | undefined,
  mapa: ParalelismoMapa
): boolean {
  const a = Number(idA);
  const b = Number(idB);
  if (!a || !b || a === b) return false;
  const listaA = mapa[a] || [];
  const listaB = mapa[b] || [];
  return listaA.includes(b) || listaB.includes(a);
}

export function mapaParalelismoDeMinisterios(
  ministerios: { id_ministerio: number; id_paralelismos?: number[] }[]
): ParalelismoMapa {
  const mapa: ParalelismoMapa = {};
  for (const m of ministerios) {
    mapa[m.id_ministerio] = m.id_paralelismos || [];
  }
  return mapa;
}
