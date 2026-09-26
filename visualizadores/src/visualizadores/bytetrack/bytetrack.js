// ByteTrack didático, espelhando a semântica de trackers.ByteTrackTracker (trackers==2.6.1),
// usado em projeto-3/02_tracking.ipynb e 03_projeto_final.ipynb.
//
// Por quadro:
//   0. filtro do detector (limiar_detector) — acontece ANTES do tracker
//   1. prever todas as trilhas (Kalman)
//   2. separar detecções em ALTA (score ≥ high_conf_det_threshold) e BAIXA
//   3. etapa 1: trilhas ativas + perdidas + tentativas  × detecções ALTAS (IoU, húngaro)
//   4. etapa 2: trilhas ativas ainda livres            × detecções BAIXAS
//   5. tentativas sem par são removidas; ativas sem par viram "perdidas"
//   6. detecções ALTAS livres com score ≥ track_activation_threshold nascem como tentativas
//   7. tentativa confirmada após minimum_consecutive_frames → recebe tracker_id
//   8. perdidas há mais que lost_track_buffer·frame_rate/30 quadros são removidas
import { matrizIou } from '../../nucleo/geometria.js';
import { associarPorIou } from '../../nucleo/hungaro.js';
import { centroParaCaixa, caixaParaCentro } from '../../nucleo/geometria.js';
import { criarKalman, prever, corrigir, estadoCentro } from './kalman.js';

export const PARAMETROS_PADRAO = {
  limiar_detector: 0.1,
  high_conf_det_threshold: 0.25,
  track_activation_threshold: 0.35,
  minimum_iou_threshold: 0.1,
  lost_track_buffer: 30,
  minimum_consecutive_frames: 2,
  frame_rate: 30,
};

const caixaDoKalman = (kf) => centroParaCaixa(...estadoCentro(kf));

export function criarRastreador(p) {
  let proximoInterno = 0;
  let proximoId = 1; // IDs só são emitidos na confirmação: sem lacunas por tentativas descartadas
  let trilhas = [];
  const maxPerdido = Math.max(1, Math.round((p.lost_track_buffer * p.frame_rate) / 30));

  function atualizar(deteccoesBrutas, quadro) {
    const log = { quadro, etapa1: [], etapa2: [], novas: [], confirmadas: [], perdidas: [], removidas: [], descartadasDetector: 0, baixasSemPar: [], altasSemAtivacao: [] };

    const dets = deteccoesBrutas.filter((d) => d.score >= p.limiar_detector);
    log.descartadasDetector = deteccoesBrutas.length - dets.length;
    dets.forEach((d, i) => { d.indice = i; d.etapa = null; d.trilha = null; });

    for (const t of trilhas) { prever(t.kf, t.estado !== 'ativa'); t.caixaPrevista = caixaDoKalman(t.kf); }

    const altas = dets.filter((d) => d.score >= p.high_conf_det_threshold);
    const baixas = dets.filter((d) => d.score < p.high_conf_det_threshold);

    const registrar = (t, d, iouValor, etapa) => {
      corrigir(t.kf, caixaParaCentro(d.caixa));
      t.caixa = caixaDoKalman(t.kf);
      t.score = d.score;
      t.semAtualizar = 0;
      t.acertosSeguidos += 1;
      t.idade += 1;
      if (t.estado === 'perdida') t.estado = 'ativa';
      d.etapa = etapa;
      d.trilha = t;
      (etapa === 1 ? log.etapa1 : log.etapa2).push({ trilha: t.interno, det: d.indice, iou: iouValor, score: d.score, recuperada: t.semAtualizarAntes > 0 });
    };

    // Etapa 1: todas as trilhas × detecções altas
    trilhas.forEach((t) => { t.semAtualizarAntes = t.semAtualizar; });
    const m1 = associarPorIou(matrizIou(trilhas.map((t) => t.caixaPrevista), altas.map((d) => d.caixa)), p.minimum_iou_threshold, altas.length);
    m1.pares.forEach(([i, j, v]) => registrar(trilhas[i], altas[j], v, 1));

    // Etapa 2: trilhas ativas (não perdidas, já confirmadas) livres × detecções baixas
    const livres1 = m1.linhasLivres.map((i) => trilhas[i]);
    const candidatas2 = livres1.filter((t) => t.estado === 'ativa');
    const m2 = associarPorIou(matrizIou(candidatas2.map((t) => t.caixaPrevista), baixas.map((d) => d.caixa)), p.minimum_iou_threshold, baixas.length);
    m2.pares.forEach(([i, j, v]) => registrar(candidatas2[i], baixas[j], v, 2));
    m2.colunasLivres.forEach((j) => { baixas[j].etapa = 'descartada'; log.baixasSemPar.push(baixas[j].indice); });

    // Trilhas sem par neste quadro
    const pareadas = new Set([...m1.pares.map(([i]) => trilhas[i]), ...m2.pares.map(([i]) => candidatas2[i])]);
    const sobreviventes = [];
    for (const t of trilhas) {
      if (pareadas.has(t)) {
        if (t.estado === 'tentativa' && t.acertosSeguidos >= p.minimum_consecutive_frames) {
          t.estado = 'ativa';
          t.id = proximoId++;
          log.confirmadas.push(t.interno);
        }
        sobreviventes.push(t);
        continue;
      }
      t.acertosSeguidos = 0;
      t.semAtualizar += 1;
      if (t.estado === 'tentativa') { log.removidas.push({ trilha: t.interno, id: -1, motivo: 'tentativa sem par' }); continue; }
      if (t.estado === 'ativa') t.estado = 'perdida';
      if (t.semAtualizar > maxPerdido) { log.removidas.push({ trilha: t.interno, id: t.id, motivo: `perdida > ${maxPerdido} quadros` }); continue; }
      log.perdidas.push({ trilha: t.interno, id: t.id, semAtualizar: t.semAtualizar, max: maxPerdido });
      sobreviventes.push(t);
    }
    trilhas = sobreviventes;

    // Nascimento: detecções altas livres acima do limiar de ativação
    for (const j of m1.colunasLivres) {
      const d = altas[j];
      if (d.score < p.track_activation_threshold) { d.etapa = 'sem-ativacao'; log.altasSemAtivacao.push(d.indice); continue; }
      const t = {
        interno: proximoInterno++, id: -1, estado: 'tentativa', kf: criarKalman(caixaParaCentro(d.caixa)),
        caixa: d.caixa, caixaPrevista: d.caixa, score: d.score, semAtualizar: 0, acertosSeguidos: 1, idade: 1, nascimento: quadro,
      };
      if (p.minimum_consecutive_frames <= 1) { t.estado = 'ativa'; t.id = proximoId++; log.confirmadas.push(t.interno); }
      d.etapa = 'nova';
      d.trilha = t;
      log.novas.push({ trilha: t.interno, det: d.indice, score: d.score });
      trilhas.push(t);
    }

    // Instantâneo imutável para a visualização
    const instantaneo = {
      log,
      deteccoes: dets.map((d) => ({ caixa: d.caixa, score: d.score, gtId: d.gtId, etapa: d.etapa, id: d.trilha ? d.trilha.id : null, interno: d.trilha ? d.trilha.interno : null })),
      descartadas: deteccoesBrutas.filter((d) => d.score < p.limiar_detector).map((d) => ({ caixa: d.caixa, score: d.score, gtId: d.gtId })),
      trilhas: trilhas.map((t) => ({ interno: t.interno, id: t.id, estado: t.estado, caixa: t.semAtualizar === 0 ? t.caixa : t.caixaPrevista, semAtualizar: t.semAtualizar, maxPerdido, score: t.score })),
    };
    const porInterno = new Map(instantaneo.trilhas.map((t) => [t.interno, t]));
    for (const k of ['etapa1', 'etapa2', 'novas']) log[k].forEach((e) => { e.id = porInterno.get(e.trilha)?.id ?? -1; });
    log.confirmadas = log.confirmadas.map((i) => porInterno.get(i)?.id);
    return instantaneo;
  }

  return { atualizar, maxPerdido };
}

// Executa o rastreador sobre todos os quadros de uma cena já gerada.
export function executar(cena, parametros) {
  const r = criarRastreador(parametros);
  return cena.deteccoes.map((dets, t) => r.atualizar(dets.map((d) => ({ ...d })), t));
}
