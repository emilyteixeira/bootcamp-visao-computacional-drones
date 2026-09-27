// Compara o motor didático (bytetrack.js) com saídas reais de trackers.ByteTrackTracker 2.6.1.
// Fixtures geradas por scripts/exportar-fixtures-bytetrack.py; ver docs/auditoria-bytetrack-etapa0.md.
// D1, D3, D4 e D5 foram alinhados: IDs e ciclo de vida precisam coincidir exatamente.
// D2 (Kalman cx,cy,w,h com tamanho congelado) é simplificação mantida; não altera IDs nestas fixtures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarRastreador, quadrosMaximosPerdidos } from '../src/visualizadores/bytetrack/bytetrack.js';

const PASTA = new URL('./fixtures/bytetrack/', import.meta.url);
const ler = (nome) => JSON.parse(readFileSync(new URL(nome, PASTA), 'utf8'));
const { fixtures } = ler('manifest.json');

function executarJs(fx) {
  const r = criarRastreador(fx.parametros);
  return fx.quadros.map((q, t) => r.atualizar(q.deteccoes.map((d) => ({ caixa: d.xyxy, score: d.confidence })), t));
}

// Detecções que passaram pelo filtro do detector, na ordem de entrada: tracker_id de cada uma.
const idsJs = (inst) => inst.deteccoes.map((d) => (d.id == null ? -1 : d.id));
const idsPython = (q) => q.saida.map((a) => a.tracker_id);

// Ciclo de vida: trilhas vivas ao fim do quadro, como pares [tracker_id, quadros sem atualizar].
const ordenar = (pares) => pares.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const vivasJs = (inst) => ordenar(inst.trilhas.map((t) => [t.id, t.semAtualizar]));
const vivasPython = (q) => ordenar(q.trilhas.map((t) => [t.tracker_id, t.sem_atualizar]));

for (const nome of fixtures) {
  const fx = ler(`${nome}.json`);
  test(`fixture Python: ${nome}`, () => {
    const js = executarJs(fx);
    fx.quadros.forEach((q, t) => {
      assert.deepEqual(idsJs(js[t]), idsPython(q), `${fx.descricao} · tracker_id no quadro ${t}`);
      assert.deepEqual(vivasJs(js[t]), vivasPython(q), `${fx.descricao} · trilhas vivas no quadro ${t}`);
    });
  });
}

test('buffer escalado coincide com maximum_frames_without_update em todas as fixtures', () => {
  for (const nome of fixtures) {
    const p = ler(`${nome}.json`).parametros;
    assert.equal(quadrosMaximosPerdidos(p), p.maximum_frames_without_update, nome);
  }
});

test('buffer usa a mesma ordem de operações do Python (ponto flutuante)', () => {
  // Python: max(1, ceil(frame_rate / 30.0 * lost_track_buffer)).
  assert.equal(quadrosMaximosPerdidos({ lost_track_buffer: 30, frame_rate: 30000 / 1001 }), 30);
  assert.equal(quadrosMaximosPerdidos({ lost_track_buffer: 3, frame_rate: 15 }), 2);
  assert.equal(quadrosMaximosPerdidos({ lost_track_buffer: 1, frame_rate: 5 }), 1);
  assert.equal(quadrosMaximosPerdidos({ lost_track_buffer: 0, frame_rate: 60 }), 0);
});

test('D2 mantida: caixa prevista difere do Python em poucos pixels, IDs iguais', () => {
  const fx = ler('kalman-oclusao.json');
  const js = executarJs(fx);
  let maior = 0;
  fx.quadros.forEach((q, t) => {
    const a = js[t].trilhas[0]?.caixa, b = q.trilhas[0]?.xyxy;
    if (a && b) maior = Math.max(maior, ...a.map((v, i) => Math.abs(v - b[i])));
  });
  assert.ok(maior > 0 && maior < 10, `divergência máxima ${maior.toFixed(2)} px`);
});
