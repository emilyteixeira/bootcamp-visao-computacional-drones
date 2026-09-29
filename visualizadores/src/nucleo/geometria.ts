// Caixas no formato [x1, y1, x2, y2], em pixels da imagem (x → direita, y → baixo).
export type Caixa = [number, number, number, number];
// Caixa centrada [cx, cy, w, h].
export type CaixaCentro = [number, number, number, number];

export function iou(a: Caixa, b: Caixa): number {
  const ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0]));
  const iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const inter = ix * iy;
  const uniao = area(a) + area(b) - inter;
  return uniao > 0 ? inter / uniao : 0;
}

export function area(c: Caixa): number {
  return Math.max(0, c[2] - c[0]) * Math.max(0, c[3] - c[1]);
}

export function matrizIou(as: Caixa[], bs: Caixa[]): number[][] {
  return as.map((a) => bs.map((b) => iou(a, b)));
}

export const centroParaCaixa = (cx: number, cy: number, w: number, h: number): Caixa => [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
export const caixaParaCentro = (c: Caixa): CaixaCentro => [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2, c[2] - c[0], c[3] - c[1]];
