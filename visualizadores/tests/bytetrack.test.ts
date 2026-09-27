import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iou } from '../src/nucleo/geometria.ts';
import { atribuicaoHungara } from '../src/nucleo/hungaro.ts';
import { CENARIOS, gerarCena } from '../src/visualizadores/bytetrack/cenarios.ts';
import { executar, PARAMETROS_PADRAO } from '../src/visualizadores/bytetrack/bytetrack.ts';
import { avaliar } from '../src/visualizadores/bytetrack/metricas.ts';
import type { Metricas } from '../src/visualizadores/bytetrack/tipos.ts';

test('IoU de caixas idênticas é 1 e disjuntas é 0', () => {
  assert.equal(iou([0, 0, 10, 10], [0, 0, 10, 10]), 1);
  assert.equal(iou([0, 0, 10, 10], [20, 20, 30, 30]), 0);
  assert.ok(Math.abs(iou([0, 0, 10, 10], [5, 0, 15, 10]) - 1 / 3) < 1e-9);
});

test('húngaro encontra a atribuição de custo mínimo', () => {
  const pares = atribuicaoHungara([[4, 1, 3], [2, 0, 5], [3, 2, 2]]);
  const custo = pares.reduce((s, [i, j]) => s + [[4, 1, 3], [2, 0, 5], [3, 2, 2]][i][j], 0);
  assert.equal(custo, 5);
});

test('cena é determinística para a mesma semente', () => {
  const a = gerarCena(CENARIOS.oclusao);
  const b = gerarCena(CENARIOS.oclusao);
  assert.deepEqual(a.deteccoes[100].map((d) => d.score), b.deteccoes[100].map((d) => d.score));
});

test('etapa 2 do BYTE só atua quando há detecções baixas no tracker', () => {
  const cena = gerarCena(CENARIOS.oclusao);
  const comBaixas = avaliar(cena, executar(cena, PARAMETROS_PADRAO));
  const semBaixas = avaliar(cena, executar(cena, { ...PARAMETROS_PADRAO, limiar_detector: 0.25 }));
  const recuperadas = (m: Metricas) => m.eventos.filter((e) => e.tipo === 'etapa2').length;
  assert.ok(recuperadas(comBaixas) > 0);
  assert.equal(recuperadas(semBaixas), 0);
  assert.ok(comBaixas.cobertura > semBaixas.cobertura);
});

test('buffer maior reduz IDs criados após a oclusão do viaduto', () => {
  const cena = gerarCena(CENARIOS.oclusao);
  const curto = avaliar(cena, executar(cena, { ...PARAMETROS_PADRAO, lost_track_buffer: 5 }));
  const longo = avaliar(cena, executar(cena, { ...PARAMETROS_PADRAO, lost_track_buffer: 60 }));
  assert.ok(longo.idsCriados < curto.idsCriados, `${longo.idsCriados} < ${curto.idsCriados}`);
});
