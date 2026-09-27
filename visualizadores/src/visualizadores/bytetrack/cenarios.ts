// Cenas sintéticas vistas de um drone (imagem 1280×720 px, 30 FPS).
// Cada cena tem verdade de solo (ground truth), oclusores e um modelo de detector.
// Tudo é determinístico: mesma semente → mesmas detecções.
import { criarRng } from '../../nucleo/rng.ts';
import { area, centroParaCaixa, type Caixa } from '../../nucleo/geometria.ts';
import type { Cena, Cenario, Deteccao, GtNoQuadro, Oclusor } from './tipos.ts';

export const LARGURA = 1280;
export const ALTURA = 720;
export const FPS_VIDEO = 30;

// Trajetória retilínea com velocidade em px/quadro e, opcionalmente, parada.
const reta = (x0: number, y0: number, vx: number, vy: number, parada?: { inicio: number; fim: number }) => (t: number): [number, number] => {
  let tt = t;
  if (parada && t > parada.inicio) tt = t < parada.fim ? parada.inicio : t - (parada.fim - parada.inicio);
  return [x0 + vx * tt, y0 + vy * tt];
};

export type IdCenario = 'oclusao' | 'cruzamento' | 'alto';

export const CENARIOS: Record<IdCenario, Cenario> = {
  oclusao: {
    id: 'oclusao',
    titulo: 'Árvore e viaduto',
    resumo:
      'Rodovia com uma copa de árvore (oclusão parcial → scores baixos) e um viaduto (oclusão total por ~1 s). Mostra a 2ª etapa do BYTE e o papel do lost_track_buffer.',
    quadros: 240,
    semente: 7,
    estrada: 'horizontal',
    veiculos: [
      { id: 1, inicio: 0, w: 74, h: 36, pos: reta(-40, 300, 4.2, 0) },
      { id: 2, inicio: 10, w: 80, h: 38, pos: reta(-40, 345, 6.5, 0) },
      { id: 3, inicio: 0, w: 72, h: 36, pos: reta(1320, 410, -5.2, 0) },
      { id: 4, inicio: 40, w: 90, h: 40, pos: reta(1320, 455, -3.6, 0) },
      { id: 5, inicio: 70, w: 74, h: 36, pos: reta(-40, 300, 5.4, 0) },
    ],
    oclusores: [
      { tipo: 'arvore', caixa: [280, 250, 440, 380], densidade: 0.72 },
      { tipo: 'viaduto', caixa: [760, 150, 930, 600], densidade: 1 },
    ],
    detector: { score: [0.72, 0.93], ruido: 0.035, falsosPorQuadro: 0.25, scoreFalso: [0.05, 0.3], perda: 0.02 },
  },
  cruzamento: {
    id: 'cruzamento',
    titulo: 'Ultrapassagem e cruzamento',
    resumo:
      'Veículos lado a lado em faixas vizinhas e um cruzamento em T. Caixas próximas tornam o IoU ambíguo: bom cenário para minimum_iou_threshold e trocas de ID.',
    quadros: 240,
    semente: 11,
    estrada: 'cruz',
    veiculos: [
      { id: 1, inicio: 0, w: 76, h: 36, pos: reta(-40, 318, 5.0, 0) },
      { id: 2, inicio: 0, w: 76, h: 36, pos: reta(-130, 346, 5.8, 0) },
      { id: 3, inicio: 20, w: 36, h: 76, pos: reta(640, -40, 0, 4.4, { inicio: 60, fim: 95 }) },
      { id: 4, inicio: 0, w: 78, h: 38, pos: reta(1320, 420, -5.6, 0) },
      { id: 5, inicio: 50, w: 36, h: 74, pos: reta(700, 760, 0, -4.8) },
      { id: 6, inicio: 90, w: 76, h: 36, pos: reta(-40, 335, 7.2, 0) },
    ],
    oclusores: [{ tipo: 'arvore', caixa: [420, 280, 600, 380], densidade: 0.8 }],
    detector: { score: [0.55, 0.9], ruido: 0.08, falsosPorQuadro: 0.35, scoreFalso: [0.05, 0.35], perda: 0.06 },
  },
  alto: {
    id: 'alto',
    titulo: 'Drone alto (120 m)',
    resumo:
      'Objetos pequenos (≈24×12 px), scores modestos, caixas instáveis e falsos positivos. Um limiar alto demais impede o nascimento de trajetórias.',
    quadros: 240,
    semente: 23,
    estrada: 'horizontal',
    veiculos: Array.from({ length: 9 }, (_, i) => {
      const leste = i % 2 === 0;
      const faixa = [305, 330, 395, 420][i % 4];
      const v = [3.0, 2.6, 3.4, 2.8][i % 4]; // mesma faixa, mesma velocidade: sem carros se atravessando
      return {
        id: i + 1,
        inicio: i * 18,
        w: 26,
        h: 13,
        pos: reta(leste ? -20 : 1300, faixa, leste ? v : -v, 0),
      };
    }),
    oclusores: [{ tipo: 'arvore', caixa: [540, 280, 640, 360], densidade: 0.65 }],
    detector: { score: [0.32, 0.68], ruido: 0.12, falsosPorQuadro: 1.4, scoreFalso: [0.05, 0.42], perda: 0.08 },
  },
};

// Visibilidade = fração não coberta pelos oclusores, ponderada pela densidade.
function visibilidade(caixa: Caixa, oclusores: Oclusor[]): number {
  const a = area(caixa) || 1;
  let perda = 0;
  for (const o of oclusores) {
    const ix = Math.max(0, Math.min(caixa[2], o.caixa[2]) - Math.max(caixa[0], o.caixa[0]));
    const iy = Math.max(0, Math.min(caixa[3], o.caixa[3]) - Math.max(caixa[1], o.caixa[1]));
    perda += ((ix * iy) / a) * o.densidade;
  }
  return Math.max(0, 1 - perda);
}

// Detector vê só a parte visível quando um oclusor denso corta o veículo lateralmente.
function recortarVisivel(caixa: Caixa, oclusores: Oclusor[]): Caixa {
  let [x1, y1, x2, y2] = caixa;
  for (const o of oclusores) {
    if (o.densidade < 0.9) continue;
    const cobreAltura = o.caixa[1] <= y1 && o.caixa[3] >= y2;
    if (!cobreAltura) continue;
    if (o.caixa[0] <= x1 && o.caixa[2] > x1) x1 = Math.min(x2, o.caixa[2]);
    if (o.caixa[2] >= x2 && o.caixa[0] < x2) x2 = Math.max(x1, o.caixa[0]);
  }
  return [x1, y1, x2, y2];
}

// Gera { verdade: [[{id, caixa, visivel}]], deteccoes: [[{caixa, score, gtId}]] } por quadro.
export function gerarCena(cenario: Cenario, semente = cenario.semente): Cena {
  const rng = criarRng(semente);
  const { detector: d } = cenario;
  const baseScore: Record<number, number> = {};
  for (const v of cenario.veiculos) baseScore[v.id] = rng.entre(d.score[0], d.score[1]);

  const verdade: GtNoQuadro[][] = [];
  const deteccoes: Deteccao[][] = [];
  for (let t = 0; t < cenario.quadros; t++) {
    const gts: GtNoQuadro[] = [];
    const dets: Deteccao[] = [];
    for (const v of cenario.veiculos) {
      if (t < v.inicio) continue;
      const [cx, cy] = v.pos(t - v.inicio);
      const caixa = centroParaCaixa(cx, cy, v.w, v.h);
      if (caixa[2] < 0 || caixa[0] > LARGURA || caixa[3] < 0 || caixa[1] > ALTURA) continue;
      const vis = visibilidade(caixa, cenario.oclusores);
      gts.push({ id: v.id, caixa, visivel: vis });

      if (vis < 0.22 || rng.proximo() < d.perda) continue; // não detectado
      const recorte = recortarVisivel(caixa, cenario.oclusores);
      const s = d.ruido;
      const base = caixa.map((c, k) => c * 0.65 + recorte[k] * 0.35) as Caixa;
      const jitter = [rng.normal() * s * v.w, rng.normal() * s * v.h, rng.normal() * s * v.w, rng.normal() * s * v.h];
      const caixaDet = base.map((c, k) => c + jitter[k]) as Caixa;
      if (caixaDet[2] - caixaDet[0] < 4 || caixaDet[3] - caixaDet[1] < 4) continue;
      const score = Math.min(0.99, Math.max(0.01, baseScore[v.id] * Math.pow(vis, 1.6) + rng.normal() * 0.05));
      dets.push({ caixa: caixaDet, score, gtId: v.id });
    }
    // Falsos positivos: caixas de score baixo espalhadas pela via.
    let nFalsos = Math.floor(d.falsosPorQuadro) + (rng.proximo() < d.falsosPorQuadro % 1 ? 1 : 0);
    while (nFalsos-- > 0) {
      const w = rng.entre(0.4, 1.1) * (cenario.veiculos[0].w);
      const h = w * rng.entre(0.4, 0.7);
      const cx = rng.entre(40, LARGURA - 40);
      const cy = rng.entre(260, 500);
      dets.push({ caixa: centroParaCaixa(cx, cy, w, h), score: rng.entre(d.scoreFalso[0], d.scoreFalso[1]), gtId: null });
    }
    verdade.push(gts);
    deteccoes.push(dets);
  }
  return { verdade, deteccoes };
}
