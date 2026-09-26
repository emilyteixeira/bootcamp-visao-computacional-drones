// Compara o motor didático (bytetrack.js) com saídas reais de trackers.ByteTrackTracker 2.6.1.
// Fixtures geradas por scripts/exportar-fixtures-bytetrack.py; ver docs/auditoria-bytetrack-etapa0.md.
// Divergências conhecidas ficam marcadas como `todo`: aparecem no relatório sem quebrar a suíte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarRastreador } from '../src/visualizadores/bytetrack/bytetrack.js';

const PASTA = new URL('./fixtures/bytetrack/', import.meta.url);
const ler = (nome) => JSON.parse(readFileSync(new URL(nome, PASTA), 'utf8'));
const { fixtures } = ler('manifest.json');

// Código da matriz de diferenças → fixtures afetadas.
const DIVERGENCIAS = {
  'buffer-zero': 'D4: buffer 0 vira 1 quadro no JS (Python: 0)',
  'buffer-fps-25': 'D4: JS usa round(), Python usa ceil() ao escalar o buffer',
  'etapa2-tentativa': 'D1: etapa 2 do JS só aceita trilhas ativas; Python aceita todas as livres',
  'etapa2-perdida': 'D1: trilha perdida não participa da etapa 2 no JS',
  'confirmacao-1-quadro': 'D3: com minimum_consecutive_frames=1 o JS emite ID no nascimento',
};

// Normaliza IDs pela ordem de emissão (D5: Python começa em 0, JS em 1).
function normalizar(sequencia) {
  const mapa = new Map();
  return sequencia.map((quadro) => quadro.map((id) => {
    if (id < 0) return -1;
    if (!mapa.has(id)) mapa.set(id, mapa.size);
    return mapa.get(id);
  }));
}

function executarJs(fx) {
  const p = fx.parametros;
  const r = criarRastreador({ ...p, limiar_detector: p.limiar_detector });
  return fx.quadros.map((q, t) => {
    const brutas = q.deteccoes.map((d) => ({ caixa: d.xyxy, score: d.confidence }));
    const inst = r.atualizar(brutas, t);
    // inst.deteccoes segue a ordem das brutas que passaram pelo filtro do detector.
    return inst.deteccoes.map((d) => (d.id == null ? -1 : d.id));
  });
}

const idsPython = (fx) => fx.quadros.map((q) => q.saida.map((a) => a.tracker_id));

for (const nome of fixtures) {
  const fx = ler(`${nome}.json`);
  test(`fixture Python: ${nome}`, { todo: DIVERGENCIAS[nome] }, () => {
    assert.deepEqual(normalizar(executarJs(fx)), normalizar(idsPython(fx)), fx.descricao);
  });
}

test('D5: primeiro tracker_id emitido é 0, como no Python', { todo: 'D5: JS começa em 1' }, () => {
  const fx = ler('nascimento.json');
  assert.equal(executarJs(fx)[1][0], idsPython(fx)[1][0]);
});

test('buffer escalado coincide com maximum_frames_without_update', { todo: DIVERGENCIAS['buffer-fps-25'] }, () => {
  for (const nome of ['buffer-lacuna-3', 'buffer-fps-25', 'buffer-zero']) {
    const p = ler(`${nome}.json`).parametros;
    assert.equal(criarRastreador(p).maxPerdido, p.maximum_frames_without_update, nome);
  }
});
