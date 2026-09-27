// Métricas simplificadas contra a verdade de solo (inspiradas em CLEAR-MOT).
// Casamento GT × trilhas confirmadas visíveis por quadro com IoU ≥ 0,3 (tolerante a caixas pequenas e recortadas).
import { matrizIou } from '../../nucleo/geometria.js';
import { associarPorIou } from '../../nucleo/hungaro.js';

export const IOU_AVALIACAO = 0.3;

export function avaliar(cena, resultados) {
  let gtTotal = 0, fn = 0, fp = 0, idsw = 0, frag = 0;
  const ultimoId = new Map();       // gtId → último tracker_id casado
  const estavaCoberto = new Map();  // gtId → coberto no quadro anterior?
  const primeiroQuadro = new Map();
  const atrasos = [];
  const eventos = [];               // marcadores para a linha do tempo
  const idsVistos = new Set();

  resultados.forEach((res, t) => {
    const gts = cena.verdade[t].filter((g) => g.visivel > 0.05);
    const tracks = res.trilhas.filter((tr) => tr.id >= 0 && tr.semAtualizar === 0);
    tracks.forEach((tr) => idsVistos.add(tr.id));
    gtTotal += gts.length;
    const m = associarPorIou(matrizIou(gts.map((g) => g.caixa), tracks.map((tr) => tr.caixa)), IOU_AVALIACAO, tracks.length);
    fn += m.linhasLivres.length;
    fp += m.colunasLivres.length;
    const cobertos = new Set();
    for (const [i, j] of m.pares) {
      const g = gts[i];
      const id = tracks[j].id;
      cobertos.add(g.id);
      if (!primeiroQuadro.has(g.id)) {
        primeiroQuadro.set(g.id, t);
        atrasos.push(t - cena.verdade.findIndex((q) => q.some((x) => x.id === g.id)));
      }
      const anterior = ultimoId.get(g.id);
      if (anterior !== undefined && anterior !== id) {
        idsw += 1;
        eventos.push({ quadro: t, tipo: 'troca', texto: `Veículo ${g.id}: ID #${anterior} → #${id}` });
      }
      if (estavaCoberto.get(g.id) === false) {
        frag += 1;
        eventos.push({ quadro: t, tipo: 'fragmento', texto: `Veículo ${g.id} volta a ser coberto (#${id})` });
      }
      ultimoId.set(g.id, id);
    }
    for (const g of gts) {
      if (!cobertos.has(g.id) && estavaCoberto.get(g.id)) estavaCoberto.set(g.id, false);
      else if (cobertos.has(g.id)) estavaCoberto.set(g.id, true);
    }
    res.log.etapa2.filter((e) => e.id >= 0).forEach((e) => eventos.push({ quadro: t, tipo: 'etapa2', texto: `#${e.id} mantida pela etapa 2 (score ${e.score.toFixed(2)})` }));
    res.log.confirmadas.forEach((id) => eventos.push({ quadro: t, tipo: 'nova', texto: `ID #${id} confirmado` }));
  });

  const veiculos = new Set(cena.verdade.flat().map((g) => g.id)).size;
  return {
    veiculos,
    idsCriados: idsVistos.size,
    trocasId: idsw,
    fragmentacoes: frag,
    cobertura: gtTotal ? 1 - fn / gtTotal : 0,
    falsosPositivos: fp,
    mota: gtTotal ? 1 - (fn + fp + idsw) / gtTotal : 0,
    atrasoMedio: atrasos.length ? atrasos.reduce((a, b) => a + b, 0) / atrasos.length : null,
    eventos,
  };
}
