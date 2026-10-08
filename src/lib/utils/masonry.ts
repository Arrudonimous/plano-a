export interface Placement {
  column: number;
  y: number;
}

/**
 * Distribui blocos (alturas em px) em colunas, sempre na mais curta (estilo
 * mural). Devolve a posição de cada bloco e a altura total usada.
 */
export function masonryLayout(
  heights: number[],
  columns: number,
  gap: number,
): { placements: Placement[]; height: number } {
  const bottoms = Array.from({ length: columns }, () => 0);
  const placements = heights.map((h) => {
    let column = 0;
    for (let c = 1; c < columns; c++) if (bottoms[c] < bottoms[column]) column = c;
    const y = bottoms[column];
    bottoms[column] = y + h + gap;
    return { column, y };
  });
  return { placements, height: Math.max(0, Math.max(...bottoms) - gap) };
}
