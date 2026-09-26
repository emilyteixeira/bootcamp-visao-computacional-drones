// Atribuição ótima (algoritmo húngaro, O(n³)) para matrizes retangulares de custo.
// Equivalente didático de scipy.optimize.linear_sum_assignment.
export function atribuicaoHungara(custo) {
  const nLin = custo.length;
  const nCol = nLin ? custo[0].length : 0;
  if (!nLin || !nCol) return [];
  const n = Math.max(nLin, nCol);
  const GRANDE = 1e6;
  const c = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i < nLin && j < nCol ? custo[i][j] : GRANDE)),
  );
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const caminho = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const usado = new Array(n + 1).fill(false);
    do {
      usado[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (usado[j]) continue;
        const cur = c[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; caminho[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (usado[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = caminho[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const pares = [];
  for (let j = 1; j <= n; j++) {
    const i = p[j] - 1;
    if (i < nLin && j - 1 < nCol) pares.push([i, j - 1]);
  }
  return pares;
}

// Associa linhas (trilhas) e colunas (detecções) exigindo IoU mínimo.
// Retorna { pares: [[i, j, iou]], linhasLivres, colunasLivres }.
// nCol é explícito: com zero trilhas a matriz fica vazia, mas as detecções continuam livres.
export function associarPorIou(matriz, iouMinimo, nCol) {
  const nLin = matriz.length;
  const pares = [];
  if (nLin && nCol) {
    const custo = matriz.map((linha) => linha.map((v) => 1 - v));
    for (const [i, j] of atribuicaoHungara(custo)) {
      if (matriz[i][j] >= iouMinimo && matriz[i][j] > 0) pares.push([i, j, matriz[i][j]]);
    }
  }
  const li = new Set(pares.map((p) => p[0]));
  const co = new Set(pares.map((p) => p[1]));
  return {
    pares,
    linhasLivres: [...Array(nLin).keys()].filter((i) => !li.has(i)),
    colunasLivres: [...Array(nCol).keys()].filter((j) => !co.has(j)),
  };
}
