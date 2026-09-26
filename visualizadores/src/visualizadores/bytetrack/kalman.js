// Filtro de Kalman de velocidade constante no estado [cx, cy, w, h, vcx, vcy, vw, vh].
// Como F, H e os ruídos são diagonais por coordenada, o filtro 8D se decompõe em
// quatro filtros 2D independentes (posição, velocidade) — mesma matemática, menos código.
// Pesos de ruído proporcionais ao tamanho da caixa, como no ByteTrack original.
const PESO_POS = 1 / 20;
const PESO_VEL = 1 / 160;

export function criarKalman([cx, cy, w, h]) {
  const escala = [h, h, w, h];
  const x = [cx, cy, w, h].map((m) => [m, 0]);
  const P = escala.map((e) => [
    [(2 * PESO_POS * e) ** 2, 0],
    [0, (10 * PESO_VEL * e) ** 2],
  ]);
  return { x, P };
}

// congelarTamanho: como no ByteTrack original, trilhas fora do estado "ativa" zeram a
// velocidade de tamanho para a caixa prevista não encolher até sumir durante a oclusão.
export function prever(kf, congelarTamanho = false) {
  if (congelarTamanho) { kf.x[2][1] = 0; kf.x[3][1] = 0; }
  const h = kf.x[3][0];
  const escala = [h, h, kf.x[2][0], h];
  kf.x = kf.x.map(([p, v]) => [p + v, v]);
  kf.P = kf.P.map((P, k) => {
    const q = [(PESO_POS * escala[k]) ** 2, (PESO_VEL * escala[k]) ** 2];
    // P' = F P Fᵀ + Q, com F = [[1,1],[0,1]]
    const a = P[0][0] + P[0][1] + P[1][0] + P[1][1] + q[0];
    const b = P[0][1] + P[1][1];
    const d = P[1][1] + q[1];
    return [[a, b], [b, d]];
  });
  return kf;
}

export function corrigir(kf, [cx, cy, w, h]) {
  const med = [cx, cy, w, h];
  const escala = [kf.x[3][0], kf.x[3][0], kf.x[2][0], kf.x[3][0]];
  kf.x = kf.x.map(([p, v], k) => {
    const P = kf.P[k];
    const r = (PESO_POS * escala[k]) ** 2;
    const S = P[0][0] + r;
    const K0 = P[0][0] / S;
    const K1 = P[1][0] / S;
    const inov = med[k] - p;
    kf.P[k] = [
      [(1 - K0) * P[0][0], (1 - K0) * P[0][1]],
      [P[1][0] - K1 * P[0][0], P[1][1] - K1 * P[0][1]],
    ];
    return [p + K0 * inov, v + K1 * inov];
  });
  return kf;
}

export const estadoCentro = (kf) => kf.x.map(([p]) => p);
export const velocidade = (kf) => [kf.x[0][1], kf.x[1][1]];
