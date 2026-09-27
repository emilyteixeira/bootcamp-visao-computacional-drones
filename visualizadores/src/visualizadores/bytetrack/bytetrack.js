// ByteTrack didático, alinhado a trackers.ByteTrackTracker (trackers==2.6.1), a API usada em
// projeto-3/02_tracking.ipynb e 03_projeto_final.ipynb. Conferido contra saídas reais do Python
// em tests/fixtures-python.test.js (ver docs/auditoria-bytetrack-etapa0.md).
//
// Por quadro:
//   0. filtro do detector (limiar_detector) — acontece ANTES do tracker, como em detectar()
//   1. prever todas as trilhas (Kalman); quem já estava sem atualização zera a contagem seguida
//   2. separar detecções em ALTA (score ≥ high_conf_det_threshold) e BAIXA
//   3. etapa 1: TODAS as trilhas (tentativas, ativas, perdidas) × ALTAS (IoU, húngaro, depois limiar)
//   4. etapa 2: TODAS as trilhas livres da etapa 1 × BAIXAS (mesmo IoU mínimo)
//   5. ao associar: se seguidas ≥ minimum_consecutive_frames e ainda sem ID, recebe tracker_id
//      (IDs começam em 0; nunca são emitidos no nascimento)
//   6. ALTAS livres com score ≥ track_activation_threshold nascem como tentativas (tracker_id −1)
//   7. sobrevive quem está no buffer E (tem ID, ou seguidas ≥ mínimo, ou foi atualizada agora)
//
// Simplificação mantida (D2): Kalman em [cx, cy, w, h] com tamanho congelado fora de "ativa";
// o Python usa XYXYStateEstimator. Os IDs coincidem nas fixtures; a caixa prevista pode diferir
// alguns pixels durante oclusões longas.
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

// Mesma conta e mesma ordem de operações de BaseTracker._compute_maximum_frames_without_update:
// buffer 0 → 0 (a trilha cai na primeira falta); senão max(1, ceil(frame_rate / 30 · buffer)).
export function quadrosMaximosPerdidos({ lost_track_buffer: buffer, frame_rate: fps }) {
  if (buffer === 0) return 0;
  return Math.max(1, Math.ceil((fps / 30) * buffer));
}

const caixaDoKalman = (kf) => centroParaCaixa(...estadoCentro(kf));

export function criarRastreador(p) {
  let proximoInterno = 0;
  let proximoId = 0; // como no Python: o primeiro tracker_id é 0 (válido)
  let trilhas = [];
  const maxPerdido = quadrosMaximosPerdidos(p);

  function atualizar(deteccoesBrutas, quadro) {
    const log = { quadro, etapa1: [], etapa2: [], novas: [], confirmadas: [], perdidas: [], removidas: [], descartadasDetector: 0, baixasSemPar: [], altasSemAtivacao: [] };

    const dets = deteccoesBrutas.filter((d) => d.score >= p.limiar_detector);
    log.descartadasDetector = deteccoesBrutas.length - dets.length;
    dets.forEach((d, i) => { d.indice = i; d.etapa = null; d.trilha = null; });

    // 1. Previsão: avança o relógio de ausência; uma falha anterior interrompe a sequência.
    for (const t of trilhas) {
      prever(t.kf, t.estado !== 'ativa');
      t.caixaPrevista = caixaDoKalman(t.kf);
      if (t.semAtualizar > 0) t.acertosSeguidos = 0;
      t.semAtualizarAntes = t.semAtualizar;
      t.semAtualizar += 1;
    }

    const altas = dets.filter((d) => d.score >= p.high_conf_det_threshold);
    const baixas = dets.filter((d) => d.score < p.high_conf_det_threshold);

    const registrar = (t, d, iouValor, etapa) => {
      corrigir(t.kf, caixaParaCentro(d.caixa));
      t.caixa = caixaDoKalman(t.kf);
      t.score = d.score;
      t.semAtualizar = 0;
      t.acertosSeguidos += 1;
      t.idade += 1;
      if (t.id === -1 && t.acertosSeguidos >= p.minimum_consecutive_frames) {
        t.id = proximoId++;
        log.confirmadas.push(t.interno);
      }
      if (t.id !== -1) t.estado = 'ativa';
      d.etapa = etapa;
      d.trilha = t;
      (etapa === 1 ? log.etapa1 : log.etapa2).push({ trilha: t.interno, det: d.indice, iou: iouValor, score: d.score, recuperada: t.semAtualizarAntes > 0 });
    };

    // Etapa 1: todas as trilhas × detecções altas
    const m1 = associarPorIou(matrizIou(trilhas.map((t) => t.caixaPrevista), altas.map((d) => d.caixa)), p.minimum_iou_threshold, altas.length);
    m1.pares.forEach(([i, j, v]) => registrar(trilhas[i], altas[j], v, 1));

    // Etapa 2: todas as trilhas que sobraram (tentativas, ativas e perdidas) × detecções baixas
    const livres1 = m1.linhasLivres.map((i) => trilhas[i]);
    const m2 = associarPorIou(matrizIou(livres1.map((t) => t.caixaPrevista), baixas.map((d) => d.caixa)), p.minimum_iou_threshold, baixas.length);
    m2.pares.forEach(([i, j, v]) => registrar(livres1[i], baixas[j], v, 2));
    m2.colunasLivres.forEach((j) => { baixas[j].etapa = 'descartada'; log.baixasSemPar.push(baixas[j].indice); });

    // Nascimento: detecções altas livres acima do limiar de ativação (sempre sem ID neste quadro)
    const nascidas = [];
    for (const j of m1.colunasLivres) {
      const d = altas[j];
      if (d.score < p.track_activation_threshold) { d.etapa = 'sem-ativacao'; log.altasSemAtivacao.push(d.indice); continue; }
      const t = {
        interno: proximoInterno++, id: -1, estado: 'tentativa', kf: criarKalman(caixaParaCentro(d.caixa)),
        caixa: d.caixa, caixaPrevista: d.caixa, score: d.score, semAtualizar: 0, acertosSeguidos: 1, idade: 1, nascimento: quadro,
      };
      d.etapa = 'nova';
      d.trilha = t;
      log.novas.push({ trilha: t.interno, det: d.indice, score: d.score });
      nascidas.push(t);
    }

    // Ciclo de vida (_get_alive_tracklets): buffer E (confirmada, ou madura, ou atualizada agora)
    const sobreviventes = [];
    for (const t of [...trilhas, ...nascidas]) {
      const noBuffer = t.semAtualizar <= maxPerdido;
      const madura = t.id !== -1 || t.acertosSeguidos >= p.minimum_consecutive_frames;
      if (noBuffer && (madura || t.semAtualizar === 0)) {
        if (t.semAtualizar > 0) {
          if (t.id !== -1) t.estado = 'perdida';
          log.perdidas.push({ trilha: t.interno, id: t.id, semAtualizar: t.semAtualizar, max: maxPerdido });
        }
        sobreviventes.push(t);
        continue;
      }
      const motivo = noBuffer ? 'tentativa sem par' : `perdida > ${maxPerdido} quadros`;
      log.removidas.push({ trilha: t.interno, id: t.id, motivo });
    }
    trilhas = sobreviventes;

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
