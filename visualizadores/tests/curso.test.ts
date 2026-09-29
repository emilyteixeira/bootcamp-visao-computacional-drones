// Curso guiado (#curso-bytetrack): integridade do roteiro, navegação, progresso salvo
// e conferência de cada número citado no texto da aula contra o motor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AULA_01 } from '../src/curso/capitulos/aula01.ts';
import { FONTES } from '../src/curso/fontes.ts';
import { cenarioDoCurso, parametrosB, parametrosDoPasso } from '../src/curso/cenaDoPasso.ts';
import {
  anterior, desserializar, indiceLinear, irPara, progressoInicial, proximo, responder, resumoCapitulo, serializar, totalPassos,
} from '../src/curso/progresso.ts';
import { CENARIOS, gerarCena, type IdCenario } from '../src/visualizadores/bytetrack/cenarios.ts';
import { executar } from '../src/visualizadores/bytetrack/bytetrack.ts';
import { avaliar } from '../src/visualizadores/bytetrack/metricas.ts';
import { PARAMETROS, PREDEFINICOES } from '../src/visualizadores/bytetrack/parametros.ts';
import type { ParametrosByteTrack } from '../src/visualizadores/bytetrack/tipos.ts';

const aula = AULA_01;
const passos = aula.capitulos.flatMap((c) => c.passos);

// ─── Integridade do conteúdo ────────────────────────────────────────────────
test('roteiro: 7 capítulos, 60 minutos, ids únicos', () => {
  assert.equal(aula.capitulos.length, 7);
  assert.equal(aula.capitulos.reduce((s, c) => s + c.duracaoMin, 0), 60);
  const ids = [...aula.capitulos.map((c) => c.id), ...passos.map((p) => p.id), ...passos.flatMap((p) => (p.questao ? [p.questao.id] : []))];
  assert.equal(new Set(ids).size, ids.length);
  aula.capitulos.forEach((c, i) => assert.equal(c.numero, i + 1));
});

test('roteiro: cada capítulo tem avaliação curta, e cada questão exatamente uma opção certa', () => {
  for (const c of aula.capitulos) {
    assert.ok(c.passos.some((p) => p.questao), `capítulo ${c.numero} sem questão`);
    assert.ok(c.passos.some((p) => p.fase === 'conferir'), `capítulo ${c.numero} sem passo "conferir"`);
  }
  for (const p of passos) {
    if (!p.questao) continue;
    assert.equal(p.questao.opcoes.filter((o) => o.correta).length, 1, p.questao.id);
    for (const o of p.questao.opcoes) assert.ok(o.feedback.length > 20, `${p.questao.id}: feedback curto`);
  }
});

test('roteiro: fontes, cenas, predefinições e parâmetros existem', () => {
  const chaves = new Set(PARAMETROS.map((m) => m.chave));
  for (const p of passos) {
    assert.ok(p.fontes.length > 0, `${p.id} sem fonte`);
    for (const f of p.fontes) assert.ok(FONTES[f], `${p.id}: fonte ${f}`);
    assert.ok(p.texto.length > 0 && p.texto.every((t) => t.trim().length > 0), `${p.id}: texto vazio`);
    const cen = cenarioDoCurso(p.cena.cenario);
    assert.ok(p.cena.quadro >= 0 && p.cena.quadro < cen.quadros, `${p.id}: quadro fora da cena`);
    assert.ok(PREDEFINICOES.some((pr) => pr.id === p.cena.predefinicao), `${p.id}: predefinição`);
    for (const k of Object.keys(p.cena.ajustes ?? {})) assert.ok(chaves.has(k as keyof ParametrosByteTrack), `${p.id}: ajuste ${k}`);
    if (p.parametroLivre) assert.ok(chaves.has(p.parametroLivre), `${p.id}: parâmetro livre`);
  }
  for (const c of aula.capitulos) for (const f of c.aprofundamento ?? []) assert.ok(FONTES[f], `${c.id}: ${f}`);
});

test('roteiro: marcação inline balanceada (` e **)', () => {
  const textos = passos.flatMap((p) => [...p.texto, ...(p.questao ? [p.questao.enunciado, ...p.questao.opcoes.flatMap((o) => [o.texto, o.feedback])] : [])]);
  for (const t of textos) {
    assert.equal((t.match(/`/g) ?? []).length % 2, 0, t);
    assert.equal((t.match(/\*\*/g) ?? []).length % 2, 0, t);
    // TextoRico não aninha marcações: crase dentro de negrito apareceria literal.
    t.split('**').filter((_, i) => i % 2 === 1).forEach((negrito) => assert.ok(!negrito.includes('`'), t));
  }
});

// ─── Navegação e progresso ──────────────────────────────────────────────────
test('avançar percorre todos os passos em ordem e voltar retorna ao início', () => {
  let pos = { capitulo: 0, passo: 0 };
  const vistos = [indiceLinear(aula, pos)];
  for (let n = proximo(aula, pos); n; n = proximo(aula, pos)) { pos = n; vistos.push(indiceLinear(aula, pos)); }
  assert.deepEqual(vistos, [...Array(totalPassos(aula)).keys()]);
  let voltas = 0;
  for (let n = anterior(aula, pos); n; n = anterior(aula, pos)) { pos = n; voltas += 1; }
  assert.deepEqual(pos, { capitulo: 0, passo: 0 });
  assert.equal(voltas, totalPassos(aula) - 1);
});

test('recarregar retoma posição, respostas e visitados', () => {
  let prog = progressoInicial(aula);
  prog = irPara(aula, prog, { capitulo: 3, passo: 2 });
  prog = responder(aula, prog, 'q-c1-criterio', 2);
  const lido = desserializar(aula, serializar(prog));
  assert.deepEqual(lido, prog);
  assert.equal(resumoCapitulo(aula, prog, 0).acertos, 1);
});

test('progresso incompatível ou corrompido recomeça com segurança', () => {
  const prog = irPara(aula, progressoInicial(aula), { capitulo: 2, passo: 1 });
  assert.equal(desserializar(aula, null), null);
  assert.equal(desserializar(aula, '{não é json'), null);
  assert.equal(desserializar(aula, '[]'), null);
  assert.equal(desserializar(aula, serializar({ ...prog, versaoConteudo: 'antiga' })), null);
  assert.equal(desserializar(aula, serializar({ ...prog, posicao: { capitulo: 9, passo: 0 } })), null);
  assert.equal(desserializar(aula, serializar({ ...prog, posicao: { capitulo: 0, passo: 99 } })), null);
});

test('respostas e visitados desconhecidos são descartados na leitura', () => {
  const prog = progressoInicial(aula);
  const sujo = { ...prog, respostas: { 'q-c1-criterio': 1, 'q-inexistente': 0, 'q-c2-baixa': 42 }, visitados: ['c1-observar', 'passo-removido'] };
  const lido = desserializar(aula, JSON.stringify(sujo))!;
  assert.deepEqual(lido.respostas, { 'q-c1-criterio': 1 });
  assert.deepEqual(lido.visitados, ['c1-observar']);
});

test('responder ignora questão ou opção inválida', () => {
  const prog = progressoInicial(aula);
  assert.equal(responder(aula, prog, 'q-inexistente', 0), prog);
  assert.equal(responder(aula, prog, 'q-c1-criterio', 9), prog);
  assert.equal(irPara(aula, prog, { capitulo: 7, passo: 0 }), prog);
});

// ─── Números citados no roteiro ─────────────────────────────────────────────
// Se o motor, as cenas ou as predefinições mudarem, estes testes apontam o texto a revisar.
const nb = (id: string) => PREDEFINICOES.find((p) => p.id === id)!.valores;
const cenas = new Map<IdCenario, ReturnType<typeof gerarCena>>();
const cenaDe = (k: IdCenario) => { if (!cenas.has(k)) cenas.set(k, gerarCena(CENARIOS[k])); return cenas.get(k)!; };
const rodar = (k: IdCenario, p: ParametrosByteTrack) => executar(cenaDe(k), p);
const metricas = (k: IdCenario, p: ParametrosByteTrack) => avaliar(cenaDe(k), rodar(k, p));
const pct = (v: number) => Math.round(v * 1000) / 10;

test('texto dos capítulos 1–5: métricas do clipe "Árvore e viaduto"', () => {
  const casos: [Partial<ParametrosByteTrack>, number, number, number | null][] = [
    [{}, 7, 2, 89.1],
    [{ limiar_detector: 0.25 }, 8, 3, 81.9],
    [{ lost_track_buffer: 60 }, 5, 0, null],
    [{ lost_track_buffer: 5 }, 9, 4, null],
    [{ minimum_iou_threshold: 0.3 }, 9, 4, null],
    [{ minimum_iou_threshold: 0.5 }, 9, 4, null],
  ];
  for (const [aj, ids, trocas, cob] of casos) {
    const m = metricas('oclusao', { ...nb('nb02'), ...aj });
    assert.equal(m.idsCriados, ids, JSON.stringify(aj));
    assert.equal(m.trocasId, trocas, JSON.stringify(aj));
    if (cob !== null) assert.equal(pct(m.cobertura), cob, JSON.stringify(aj));
    assert.equal(m.veiculos, 5);
  }
});

test('texto dos capítulos 1–5: eventos nos quadros citados', () => {
  const r = rodar('oclusao', nb('nb02'));
  const c = cenaDe('oclusao');
  // Cap. 1: score do carro sob a árvore cai de 0,34 (q60) para 0,23 (q61); q61 tem um FP de 0,18.
  assert.equal(c.deteccoes[60].find((d) => d.gtId === 2)!.score.toFixed(2), '0.34');
  assert.deepEqual(r[61].deteccoes.filter((d) => d.score < 0.25).map((d) => d.score.toFixed(2)).sort(), ['0.18', '0.23']);
  // Cap. 2 e 4: #2 mantido pela etapa 2 com 0,19 (q63) e 0,13 (q67, reencontrado).
  assert.deepEqual(r[63].log.etapa2.map((e) => [e.id, e.score.toFixed(2)]), [[2, '0.19']]);
  assert.deepEqual(r[67].log.etapa2.map((e) => [e.id, e.score.toFixed(2), e.recuperada]), [[2, '0.13', true]]);
  // Cap. 3: #1 perdida 17/30 no q95; recuperada pela etapa 2 com 0,17 no q106.
  assert.ok(r[95].trilhas.some((t) => t.id === 1 && t.semAtualizar === 17 && t.maxPerdido === 30));
  assert.ok(r[106].log.etapa2.some((e) => e.id === 1 && e.score.toFixed(2) === '0.17' && e.iou.toFixed(2) === '0.12' && e.recuperada));
  // Cap. 5: tentativas no q1, IDs 0 e 1 no q2; #3 perdida 21 no q175, removida no q185, #5 no q200.
  assert.equal(r[1].trilhas.filter((t) => t.id === -1).length, 2);
  assert.deepEqual(r[2].log.confirmadas, [0, 1]);
  assert.ok(r[175].trilhas.some((t) => t.id === 3 && t.semAtualizar === 21));
  assert.ok(r[185].log.removidas.some((e) => e.id === 3));
  assert.deepEqual(r[200].log.confirmadas, [5]);
  // Cap. 4: com filtro 0,25 o veículo 3 vira #5 no q110.
  const f = avaliar(c, rodar('oclusao', { ...nb('nb02'), limiar_detector: 0.25 }));
  assert.ok(f.eventos.some((e) => e.quadro === 110 && e.tipo === 'troca' && e.texto.includes('#1 → #5')));
  // Cap. 5: com buffer 60, o veículo 4 mantém #3 no q200.
  const b60 = rodar('oclusao', { ...nb('nb02'), lost_track_buffer: 60 });
  assert.ok(b60[200].deteccoes.some((d) => d.gtId === 4 && d.id === 3));
});

test('texto do capítulo 7: drone alto com valores do notebook 03', () => {
  const casos: [number, number, number, number, number | null][] = [
    [0.6, 4, 0, 29.2, null],
    [0.5, 7, 0, 58.1, null],
    [0.4, 10, 1, 84.5, null],
    [0.35, 11, 1, 85.5, 1],
  ];
  for (const [alta, ids, trocas, cob, fp] of casos) {
    const m = metricas('alto', { ...nb('nb03'), high_conf_det_threshold: alta });
    assert.deepEqual([m.idsCriados, m.trocasId, pct(m.cobertura)], [ids, trocas, cob], `alta ${alta}`);
    if (fp !== null) assert.equal(m.falsosPositivos, fp);
    assert.equal(m.veiculos, 9);
  }
  assert.equal(Math.round(metricas('alto', nb('nb03')).atrasoMedio!), 15);
});

test('parâmetros do passo = predefinição + ajustes', () => {
  const p = passos.find((x) => x.id === 'c7-limites')!;
  assert.deepEqual(parametrosDoPasso(p.cena), { ...nb('nb03'), high_conf_det_threshold: 0.35 });
});

// ─── Etapa 3: comparação A/B, microcena, associação manual ─────────────────
test('comparações A/B mudam exatamente um parâmetro (ou só o motor, no replay)', () => {
  for (const p of passos) {
    if (!p.comparacao) continue;
    const a = parametrosDoPasso(p.cena);
    // Com replay, o que muda é o motor (JS × Python); os parâmetros precisam ser os mesmos.
    if (p.comparacao.replayB) {
      assert.equal(p.comparacao.ajustesB, undefined, p.id);
      assert.equal(p.parametroLivre, undefined, `${p.id}: replay não aceita parâmetro livre`);
      continue;
    }
    const b = parametrosB(p.cena, p.comparacao);
    const diferentes = (Object.keys(a) as (keyof ParametrosByteTrack)[]).filter((k) => a[k] !== b[k]);
    assert.equal(diferentes.length, 1, `${p.id}: ${diferentes.join(', ')}`);
    if (p.parametroLivre) assert.equal(diferentes[0], p.parametroLivre, `${p.id}: parâmetro livre deve ser o comparado`);
  }
});

test('alterar parâmetros não altera as detecções de entrada (A e B veem a mesma cena)', () => {
  for (const id of ['oclusao', 'micro'] as const) {
    const cena = gerarCena(cenarioDoCurso(id));
    const antes = JSON.stringify(cena.deteccoes);
    executar(cena, nb('nb02'));
    executar(cena, { ...nb('nb02'), limiar_detector: 0.25, lost_track_buffer: 5 });
    assert.equal(JSON.stringify(cena.deteccoes), antes, id);
  }
});

test('texto das comparações: IDs citados em A e B', () => {
  const idDe = (r: ReturnType<typeof rodar>, q: number, gt: number) => r[q].deteccoes.find((d) => d.gtId === gt)?.id;
  const base = rodar('oclusao', nb('nb02'));
  // Cap. 4 (A/B somente alta): veículo 3 é #1 em A e #5 em B no q110.
  assert.equal(idDe(base, 110, 3), 1);
  assert.equal(idDe(rodar('oclusao', { ...nb('nb02'), limiar_detector: 0.25 }), 110, 3), 5);
  // Cap. 5 (buffer): veículo 4 é #5 em A e #3 em B no q200.
  assert.equal(idDe(base, 200, 4), 5);
  assert.equal(idDe(rodar('oclusao', { ...nb('nb02'), lost_track_buffer: 60 }), 200, 4), 3);
  // Cap. 3 (IoU 0,50): o par de IoU 0,12 que recupera #1 no q106 é recusado.
  const iou50 = rodar('oclusao', { ...nb('nb02'), minimum_iou_threshold: 0.5 });
  assert.ok(!iou50[106].log.etapa2.some((e) => e.id === 1));
});

test('texto da microcena: A mantém #0; B perde o ID e o carro vira #1 no quadro 19', () => {
  const micro = cenarioDoCurso('micro');
  const cena = gerarCena(micro);
  const p = { ...nb('nb02'), lost_track_buffer: 5 };
  const a = executar(cena, p);
  const b = executar(cena, { ...p, limiar_detector: 0.25 });
  const carro = (r: typeof a, q: number) => r[q].deteccoes.find((d) => d.gtId === 1)?.id;
  for (let q = 1; q < 30; q++) assert.equal(carro(a, q), 0, `A q${q}`);
  for (let q = 12; q <= 16; q++) assert.equal(a[q].deteccoes.find((d) => d.gtId === null)!.id ?? -1, -1, `FP q${q}`);
  assert.equal(carro(b, 9), 0);
  assert.equal(carro(b, 18), -1);
  assert.equal(carro(b, 19), 1);
  assert.equal(avaliar(cena, a).idsCriados, 1);
  assert.equal(avaliar(cena, b).idsCriados, 2);
});

test('associação manual do cap. 1: rastreador acerta todas as caixas do quadro 61', () => {
  const r = rodar('oclusao', nb('nb02'));
  const [a, b] = [r[60].deteccoes, r[61].deteccoes];
  for (const d of b) {
    const real = d.gtId == null ? -1 : a.findIndex((x) => x.gtId === d.gtId);
    const doRastreador = (d.id ?? -1) < 0 ? -1 : a.findIndex((x) => x.id === d.id);
    assert.equal(doRastreador, real);
  }
});

// ─── Etapa 4: replays do trackers 2.6.1 ─────────────────────────────────────
test('replays: ligados às detecções atuais da cena e ao notebook 02', async () => {
  const { createHash } = await import('node:crypto');
  const { REPLAYS, hashDeteccoes } = await import('../src/curso/replay.ts');
  const cena = cenaDe('oclusao');
  const hash = hashDeteccoes(cena.deteccoes, (t) => createHash('sha256').update(t).digest('hex'));
  for (const [nome, carregar] of Object.entries(REPLAYS)) {
    const r = await carregar();
    assert.equal(r.hashDeteccoes, hash, `${nome}: detecções da cena mudaram; regenere o replay`);
    assert.equal(r.ambiente.trackers, '2.6.1');
    assert.equal(r.quadros.length, cena.deteccoes.length);
    const { lost_track_buffer: _b, limiar_detector: lim, ...resto } = r.parametros;
    const { lost_track_buffer: _b2, limiar_detector: lim2, ...restoNb } = nb('nb02');
    assert.deepEqual({ ...resto, lim }, { ...restoNb, lim: lim2 }, nome);
  }
});

test('texto do passo c5-python: números do replay', async () => {
  const { REPLAYS, instantaneosDoReplay } = await import('../src/curso/replay.ts');
  const cena = cenaDe('oclusao');
  const py = instantaneosDoReplay(await REPLAYS['oclusao-nb02'](), cena);
  const largura = (r: typeof py, q: number) => { const t = r[q].trilhas.find((x) => x.id === 1)!; return Math.round(t.caixa[2] - t.caixa[0]); };
  assert.deepEqual([95, 100, 106].map((q) => largura(py, q)), [26, 17, 7]);
  assert.equal(largura(rodar('oclusao', nb('nb02')), 95), 54);
  assert.equal(py[106].deteccoes.find((d) => d.gtId === 3)!.id, null);
  assert.equal(py[110].deteccoes.find((d) => d.gtId === 3)!.id, 5);
  const m = avaliar(cena, py);
  assert.deepEqual([m.idsCriados, m.trocasId], [9, 4]);
  const m60 = avaliar(cena, instantaneosDoReplay(await REPLAYS['oclusao-nb02-buffer60'](), cena));
  assert.deepEqual([m60.idsCriados, m60.trocasId], [9, 4]);
});

test('trechos Python: todos validados nas versões fixadas e sem edição posterior', async () => {
  const { createHash } = await import('node:crypto');
  const { TRECHOS, VALIDACAO } = await import('../src/curso/trechos.ts');
  assert.equal(VALIDACAO.ambiente.supervision, '0.30.5');
  assert.equal(VALIDACAO.ambiente.trackers, '2.6.1');
  const usados = new Set(passos.flatMap((p) => p.codigo ?? []));
  for (const id of usados) assert.ok(TRECHOS[id], `trecho ${id} inexistente`);
  for (const t of Object.values(TRECHOS)) {
    const v = VALIDACAO.resultados[t.id];
    assert.ok(v, `${t.id}: sem validação; rode scripts/validar-trechos.py`);
    assert.equal(v.status, 'ok', t.id);
    assert.equal(v.execucao, t.execucao, t.id);
    assert.equal(v.hashCodigo, createHash('sha256').update(t.codigo).digest('hex'), `${t.id}: código mudou depois da validação`);
    if (t.execucao === 'ilustrativo') assert.ok(t.motivo && t.requer?.length, `${t.id}: ilustrativo precisa de motivo e API conferida`);
  }
});
