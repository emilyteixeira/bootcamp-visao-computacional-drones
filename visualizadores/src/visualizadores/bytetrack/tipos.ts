// Contratos de dados do motor ByteTrack didático (plano §7).
// A lógica produz instantâneos imutáveis por quadro; React apenas os apresenta.
import type { Caixa } from '../../nucleo/geometria.ts';

export type { Caixa };

// Parâmetros com os nomes de trackers.ByteTrackTracker (trackers==2.6.1), mais o filtro do detector.
export interface ParametrosByteTrack {
  limiar_detector: number;
  high_conf_det_threshold: number;
  track_activation_threshold: number;
  minimum_iou_threshold: number;
  lost_track_buffer: number;
  minimum_consecutive_frames: number;
  frame_rate: number;
}

export type ChaveParametro = keyof ParametrosByteTrack;

// Detecção entregue pelo detector. gtId pertence à avaliação e nunca influencia o tracker.
export interface Deteccao {
  caixa: Caixa;
  score: number;
  gtId?: number | null;
}

// Destino de uma detecção no quadro: etapa 1, etapa 2, nova tentativa, baixa sem par ou alta sem ativação.
export type EtapaDeteccao = 1 | 2 | 'nova' | 'descartada' | 'sem-ativacao' | null;

// tentativa: tracker_id −1; ativa: tem ID e foi atualizada; perdida: tem ID e está sem atualização.
export type EstadoTrilha = 'tentativa' | 'ativa' | 'perdida';

export interface EventoAssociacao {
  trilha: number;
  det: number;
  iou: number;
  score: number;
  recuperada: boolean;
  id?: number;
}

export interface EventoNascimento {
  trilha: number;
  det: number;
  score: number;
  id?: number;
}

export interface EventoPerdida {
  trilha: number;
  id: number;
  semAtualizar: number;
  max: number;
}

export interface EventoRemocao {
  trilha: number;
  id: number;
  motivo: string;
}

export interface LogQuadro {
  quadro: number;
  etapa1: EventoAssociacao[];
  etapa2: EventoAssociacao[];
  novas: EventoNascimento[];
  // Durante o quadro guarda ids internos; no instantâneo final guarda os tracker_id emitidos.
  confirmadas: number[];
  perdidas: EventoPerdida[];
  removidas: EventoRemocao[];
  descartadasDetector: number;
  baixasSemPar: number[];
  altasSemAtivacao: number[];
}

export interface DeteccaoNoQuadro {
  caixa: Caixa;
  score: number;
  gtId?: number | null;
  etapa: EtapaDeteccao;
  id: number | null;
  interno: number | null;
}

export interface TrackSnapshot {
  interno: number;
  id: number;
  estado: EstadoTrilha;
  caixa: Caixa;
  semAtualizar: number;
  maxPerdido: number;
  score: number;
}

export interface Instantaneo {
  log: LogQuadro;
  deteccoes: DeteccaoNoQuadro[];
  descartadas: Deteccao[];
  trilhas: TrackSnapshot[];
}

// Cenários sintéticos
export interface GtNoQuadro {
  id: number;
  caixa: Caixa;
  visivel: number;
}

export interface Cena {
  verdade: GtNoQuadro[][];
  deteccoes: Deteccao[][];
}

export interface Oclusor {
  tipo: 'arvore' | 'viaduto';
  caixa: Caixa;
  densidade: number;
}

export interface Veiculo {
  id: number;
  inicio: number;
  w: number;
  h: number;
  pos: (t: number) => [number, number];
}

export interface ModeloDetector {
  score: [number, number];
  ruido: number;
  falsosPorQuadro: number;
  scoreFalso: [number, number];
  perda: number;
}

export interface Cenario {
  id: string;
  titulo: string;
  resumo: string;
  quadros: number;
  semente: number;
  estrada: 'horizontal' | 'cruz';
  veiculos: Veiculo[];
  oclusores: Oclusor[];
  detector: ModeloDetector;
}

export type TipoEvento = 'troca' | 'fragmento' | 'etapa2' | 'nova';

export interface EventoLinhaDoTempo {
  quadro: number;
  tipo: TipoEvento;
  texto: string;
}

export interface Metricas {
  veiculos: number;
  idsCriados: number;
  trocasId: number;
  fragmentacoes: number;
  cobertura: number;
  falsosPositivos: number;
  mota: number;
  atrasoMedio: number | null;
  eventos: EventoLinhaDoTempo[];
}

// Camadas visuais que o usuário liga e desliga no palco 3D.
export interface Camadas {
  verdade: boolean;
  deteccoes: boolean;
  trilhas: boolean;
  scores: boolean;
  descartadas: boolean;
  raioX: boolean;
  espacoTempo: boolean;
}
