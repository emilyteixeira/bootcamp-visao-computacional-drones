// Metadados didáticos de cada parâmetro. Nomes de `trackers.ByteTrackTracker` (trackers==2.6.1),
// a API usada nos notebooks do projeto-3, com o equivalente aproximado em `sv.ByteTrack`
// (API antiga do Supervision, substituída pelo pacote `trackers`).
export const PARAMETROS = [
  {
    chave: 'limiar_detector',
    rotulo: 'Limiar do detector',
    codigo: 'model.predict(conf=…) / LIMIAR_DETECTOR',
    sv: 'Filtro antes do tracker. sv.ByteTrack ainda descarta internamente score ≤ 0,1.',
    min: 0.01, max: 0.9, passo: 0.01,
    papel: 'Menor score que chega ao tracker. Abaixo dele a caixa nunca existiu para o ByteTrack.',
    sobe: 'Menos falsos positivos, mas a etapa 2 fica sem candidatas: oclusões viram trilhas perdidas.',
    desce: 'Mais evidência fraca para a etapa 2; mais ruído (só é problema se virar trilha).',
  },
  {
    chave: 'high_conf_det_threshold',
    rotulo: 'Limiar alta × baixa',
    codigo: 'high_conf_det_threshold',
    sv: 'track_activation_threshold (em sv o mesmo valor separa as faixas).',
    min: 0.05, max: 0.95, passo: 0.01,
    papel: 'Separa detecções da etapa 1 (alta) das da etapa 2 (baixa).',
    sobe: 'Mais caixas caem na etapa 2, que não cria trilhas: objetos pequenos podem nunca nascer.',
    desce: 'A etapa 1 fica mais permissiva; falsos positivos passam a disputar trilhas e a nascer.',
  },
  {
    chave: 'track_activation_threshold',
    rotulo: 'Score para nascer',
    codigo: 'track_activation_threshold',
    sv: 'det_thresh interno = track_activation_threshold + 0,1.',
    min: 0.05, max: 0.95, passo: 0.01,
    papel: 'Score mínimo de uma detecção alta sem par para abrir uma nova trilha.',
    sobe: 'Menos trilhas espúrias; objetos com score modesto demoram ou não nascem.',
    desce: 'Nascimento mais fácil. Abaixo do limiar alta × baixa não tem efeito extra.',
  },
  {
    chave: 'minimum_iou_threshold',
    rotulo: 'IoU mínimo',
    codigo: 'minimum_iou_threshold',
    sv: 'minimum_matching_threshold = 1 − IoU mínimo (0,8 → IoU ≥ 0,2 na etapa 1).',
    min: 0.01, max: 0.9, passo: 0.01,
    papel: 'Sobreposição mínima entre a caixa prevista (Kalman) e a detecção para aceitar o par.',
    sobe: 'Objetos rápidos, pequenos ou com caixa instável deixam de casar: fragmentação e IDs novos.',
    desce: 'Pares mais tolerantes; em cenas densas uma trilha pode “roubar” a caixa do vizinho.',
  },
  {
    chave: 'lost_track_buffer',
    rotulo: 'Buffer de perda',
    codigo: 'lost_track_buffer',
    sv: 'lost_track_buffer (mesmo nome).',
    min: 0, max: 120, passo: 1,
    papel: 'Quantos quadros (referência 30 FPS) uma trilha sem par sobrevive só com a previsão.',
    sobe: 'Atravessa oclusões longas mantendo o ID; trilhas-fantasma vivem mais.',
    desce: 'Oclusões curtas já geram um ID novo quando o objeto reaparece. Com 0, a trilha cai na primeira falta.',
  },
  {
    chave: 'minimum_consecutive_frames',
    rotulo: 'Quadros para confirmar',
    codigo: 'minimum_consecutive_frames',
    sv: 'minimum_consecutive_frames (mesmo nome).',
    min: 1, max: 10, passo: 1,
    papel: 'Quadros seguidos com par exigidos para emitir um tracker_id (antes disso −1). O nascimento conta como o 1º, mas o ID nunca sai no nascimento: 1 e 2 dão o mesmo atraso.',
    sobe: 'Filtra falsos positivos que duram poucos quadros; o ID aparece com atraso.',
    desce: 'Até 2, o ID sai no 2º quadro. Com 1, uma tentativa sem par ainda sobrevive um quadro.',
  },
  {
    chave: 'frame_rate',
    rotulo: 'FPS informado',
    codigo: 'frame_rate',
    sv: 'frame_rate (mesmo nome).',
    min: 5, max: 60, passo: 1,
    papel: 'Converte o buffer: máximo de quadros perdidos = max(1, ⌈frame_rate / 30 × lost_track_buffer⌉) (0 se buffer 0). O vídeo simulado tem 30 FPS.',
    sobe: 'Informar mais FPS que o real alonga a tolerância em segundos.',
    desce: 'Informar menos FPS encurta a tolerância: IDs caem mais cedo.',
  },
];

export const PREDEFINICOES = [
  {
    id: 'nb02',
    rotulo: 'Notebook 02',
    descricao: 'projeto-3/02_tracking.ipynb (RF-DETR, rodovia)',
    valores: { limiar_detector: 0.1, high_conf_det_threshold: 0.25, track_activation_threshold: 0.35, minimum_iou_threshold: 0.1, lost_track_buffer: 30, minimum_consecutive_frames: 2, frame_rate: 30 },
  },
  {
    id: 'nb03',
    rotulo: 'Notebook 03',
    descricao: 'projeto-3/03_projeto_final.ipynb (YOLOv8x, rotatória)',
    valores: { limiar_detector: 0.3, high_conf_det_threshold: 0.6, track_activation_threshold: 0.3, minimum_iou_threshold: 0.1, lost_track_buffer: 30, minimum_consecutive_frames: 2, frame_rate: 30 },
  },
  {
    id: 'sv',
    rotulo: 'sv.ByteTrack padrão',
    descricao: 'Padrões da API antiga convertidos (aprox.): 0,25 / det_thresh 0,35 / IoU 0,2 / 30 / 1',
    valores: { limiar_detector: 0.1, high_conf_det_threshold: 0.25, track_activation_threshold: 0.35, minimum_iou_threshold: 0.2, lost_track_buffer: 30, minimum_consecutive_frames: 1, frame_rate: 30 },
  },
  {
    id: 'erro',
    rotulo: 'Armadilha',
    descricao: 'Filtrar tudo abaixo de 0,6 antes do tracker e buffer curto',
    valores: { limiar_detector: 0.6, high_conf_det_threshold: 0.6, track_activation_threshold: 0.6, minimum_iou_threshold: 0.3, lost_track_buffer: 5, minimum_consecutive_frames: 1, frame_rate: 30 },
  },
];

// Faixas para o gráfico de sensibilidade (valores inteiros onde o parâmetro é inteiro).
export function valoresVarredura(meta, n = 14) {
  const vals = [];
  for (let i = 0; i < n; i++) {
    const v = meta.min + ((meta.max - meta.min) * i) / (n - 1);
    vals.push(meta.passo >= 1 ? Math.round(v) : Math.round(v * 100) / 100);
  }
  return [...new Set(vals)];
}
