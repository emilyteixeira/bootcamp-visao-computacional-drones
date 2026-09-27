// Cores semânticas das etapas (fixas) e cores de identidade das trilhas (por tracker_id).
export const COR_ETAPA: Record<'1' | '2' | 'nova' | 'descartada' | 'sem-ativacao' | 'detector', string> = {
  1: '#f4f4f4',            // etapa 1: detecção alta associada
  2: '#ffb02e',            // etapa 2: detecção baixa que manteve uma trilha
  nova: '#35d0c0',         // detecção alta que abriu uma trilha (tentativa)
  descartada: '#8c8c8c',   // baixa sem par: o tracker ignora
  'sem-ativacao': '#b58cd9', // alta sem par, mas abaixo de track_activation_threshold
  detector: '#ff5a5a',     // abaixo do limiar do detector: nem chega ao tracker
};

const PALETA_IDS = ['#3987e5', '#e0569a', '#9085e9', '#e66767', '#5cb85c', '#e0a800', '#4fc3f7', '#c0ca33'];
export const corDoId = (id: number): string => (id >= 0 ? PALETA_IDS[id % PALETA_IDS.length] : '#35d0c0');
