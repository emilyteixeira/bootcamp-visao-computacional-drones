// Replays do trackers.ByteTrackTracker 2.6.1 (Python) sobre as mesmas detecções da cena.
// Gerados por scripts/exportar-replays-bytetrack.py; carregados sob demanda (import dinâmico).
// Não são execução do Python no navegador: são a saída gravada, com versões e hash das detecções.
import type { Cena, Deteccao, DeteccaoNoQuadro, EtapaDeteccao, Instantaneo, LogQuadro, ParametrosByteTrack, TrackSnapshot } from '../visualizadores/bytetrack/tipos.ts';
import type { Caixa } from '../nucleo/geometria.ts';

export interface Replay {
  schemaVersion: number;
  nome: string;
  cenario: string;
  hashDeteccoes: string;
  parametros: ParametrosByteTrack & { limiar_detector: number };
  ambiente: Record<string, string>;
  quadros: { ids: number[]; trilhas: number[][] }[];
}

export const REPLAYS: Record<string, () => Promise<Replay>> = {
  'oclusao-nb02': () => import('./replays/oclusao-nb02.json').then((m) => m.default as Replay),
  'oclusao-nb02-buffer60': () => import('./replays/oclusao-nb02-buffer60.json').then((m) => m.default as Replay),
};

// Texto canônico das detecções: o hash dele liga o replay à cena que o gerou.
export const textoDeteccoes = (dets: Deteccao[][]) => JSON.stringify(dets.map((q) => q.map((d) => [...d.caixa, d.score])));
export const hashDeteccoes = (dets: Deteccao[][], sha256: (t: string) => string) => sha256(textoDeteccoes(dets));

// O Python devolve só tracker_id. A etapa de cada detecção é inferida: com ID e score alto → etapa 1;
// com ID e score baixo → etapa 2; sem ID e alta → nova tentativa (ou sem ativação); sem ID e baixa → sem par.
function etapaInferida(id: number, score: number, p: ParametrosByteTrack): EtapaDeteccao {
  const alta = score >= p.high_conf_det_threshold;
  if (id >= 0) return alta ? 1 : 2;
  if (!alta) return 'descartada';
  return score >= p.track_activation_threshold ? 'nova' : 'sem-ativacao';
}

export function instantaneosDoReplay(replay: Replay, cena: Cena): Instantaneo[] {
  const p = replay.parametros;
  const maxPerdido = p.lost_track_buffer === 0 ? 0 : Math.max(1, Math.ceil((p.frame_rate / 30) * p.lost_track_buffer));
  const vistos = new Set<number>();
  return replay.quadros.map((q, t) => {
    const entrada = cena.deteccoes[t].filter((d) => d.score >= p.limiar_detector);
    const deteccoes: DeteccaoNoQuadro[] = entrada.map((d, i) => {
      const id = q.ids[i];
      return { caixa: d.caixa, score: d.score, gtId: d.gtId, etapa: etapaInferida(id, d.score, p), id: id >= 0 ? id : null, interno: id >= 0 ? id : null };
    });
    const trilhas: TrackSnapshot[] = q.trilhas.map(([id, sem, ...caixa], k) => ({
      interno: id >= 0 ? id : -1 - k,
      id,
      estado: id < 0 ? 'tentativa' : sem > 0 ? 'perdida' : 'ativa',
      caixa: caixa as Caixa,
      caixaPrevista: caixa as Caixa,
      semAtualizar: sem,
      maxPerdido,
      score: 0,
    }));
    const confirmadas = [...new Set(q.ids.filter((id) => id >= 0 && !vistos.has(id)))];
    confirmadas.forEach((id) => vistos.add(id));
    const log: LogQuadro = {
      quadro: t,
      etapa1: [],
      etapa2: deteccoes.flatMap((d, i) => (d.etapa === 2 && d.id !== null ? [{ trilha: d.id, det: i, iou: Number.NaN, score: d.score, recuperada: false, id: d.id }] : [])),
      novas: [],
      confirmadas,
      perdidas: [],
      removidas: [],
      descartadasDetector: cena.deteccoes[t].length - entrada.length,
      baixasSemPar: [],
      altasSemAtivacao: [],
    };
    return { log, deteccoes, descartadas: cena.deteccoes[t].filter((d) => d.score < p.limiar_detector), trilhas };
  });
}
