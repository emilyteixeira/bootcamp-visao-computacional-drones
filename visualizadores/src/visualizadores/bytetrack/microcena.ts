// Microcena do plano §5, construída à mão (não sorteada): um carro em velocidade constante passa
// sob uma copa de árvore nos quadros 10–17, onde o detector o vê com score 0,18; um falso positivo
// isolado de 0,18 aparece nos quadros 12–16 em outro lugar da pista.
// A mesma sequência é executada no trackers 2.6.1 por scripts/exportar-fixtures-bytetrack.py
// (fixtures microcena-filtro-010 e microcena-filtro-025); tests/fixtures-python.test.ts confere
// que as detecções são idênticas.
import { centroParaCaixa } from '../../nucleo/geometria.ts';
import type { Cenario, Deteccao } from './tipos.ts';

export const QUADROS_MICRO = 30;
export const SCORE_FRACO = 0.18;
export const FRACO_DE = 10;
export const FRACO_ATE = 17;

const carro = (t: number) => centroParaCaixa(300 + 12 * t, 345, 74, 36);

export function deteccoesMicrocena(): Deteccao[][] {
  return Array.from({ length: QUADROS_MICRO }, (_, t) => {
    const fraco = t >= FRACO_DE && t <= FRACO_ATE;
    const dets: Deteccao[] = [{ caixa: carro(t), score: fraco ? SCORE_FRACO : 0.9, gtId: 1 }];
    if (t >= 12 && t <= 16) dets.push({ caixa: centroParaCaixa(900, 440, 50, 26), score: SCORE_FRACO, gtId: null });
    return dets;
  });
}

export const MICROCENA: Cenario = {
  id: 'micro',
  titulo: 'Microcena: uma caixa fraca',
  resumo:
    'Um carro, 30 quadros. Sob a copa (quadros 10–17) o detector só o vê com score 0,18. Um falso positivo de 0,18 aparece sozinho nos quadros 12–16. Sequência construída à mão e conferida no trackers 2.6.1.',
  quadros: QUADROS_MICRO,
  semente: 1,
  estrada: 'horizontal',
  veiculos: [{ id: 1, inicio: 0, w: 74, h: 36, pos: (t) => [300 + 12 * t, 345] }],
  oclusores: [{ tipo: 'arvore', caixa: [400, 300, 540, 390], densidade: 0.7 }],
  detector: { score: [0.9, 0.9], ruido: 0, falsosPorQuadro: 0, scoreFalso: [0, 0], perda: 0 },
  deteccoesFixas: deteccoesMicrocena(),
};
