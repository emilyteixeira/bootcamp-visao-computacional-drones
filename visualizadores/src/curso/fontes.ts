// Catálogo de fontes citadas na aula (plano §3 e §4). Páginas do PDF de anotações são
// apenas referência: o PDF não é publicado no repositório.
import type { Fonte } from './tipos.ts';

const lista: Fonte[] = [
  {
    id: 'bytetrack',
    tipo: 'artigo',
    rotulo: 'Zhang et al., ByteTrack: Multi-Object Tracking by Associating Every Detection Box (ECCV 2022)',
    detalhe: 'Seção 3 e Algoritmo 1: associação das caixas de alta confiança e, depois, das de baixa confiança.',
    url: 'https://arxiv.org/abs/2110.06864',
  },
  {
    id: 'sort',
    tipo: 'artigo',
    rotulo: 'Bewley et al., Simple Online and Realtime Tracking (SORT, 2016)',
    detalhe: 'Filtro de Kalman de velocidade constante e atribuição húngara por IoU.',
    url: 'https://arxiv.org/abs/1602.00763',
  },
  {
    id: 'deepsort',
    tipo: 'artigo',
    rotulo: 'Wojke, Bewley e Paulus, Deep SORT (2017)',
    detalhe: 'Acrescenta uma métrica de aparência aprendida à associação.',
    url: 'https://arxiv.org/abs/1703.07402',
  },
  {
    id: 'botsort',
    tipo: 'artigo',
    rotulo: 'Aharon, Orfaig e Bobrovsky, BoT-SORT (2022)',
    detalhe: 'Compensação do movimento da câmera e combinação de movimento com aparência.',
    url: 'https://arxiv.org/abs/2206.14651',
  },
  {
    id: 'hota',
    tipo: 'artigo',
    rotulo: 'Luiten et al., HOTA: A Higher Order Metric for Evaluating Multi-Object Tracking (2020)',
    detalhe: 'Separa acerto de detecção, de associação e de localização.',
    url: 'https://arxiv.org/abs/2009.07736',
  },
  {
    id: 'visdrone',
    tipo: 'artigo',
    rotulo: 'Zhu et al., Vision Meets Drones: A Challenge (VisDrone, 2018)',
    detalhe: 'Benchmark de imagens aéreas, com objetos pequenos e densos.',
    url: 'https://arxiv.org/abs/1804.07437',
  },
  {
    id: 'sv-detections',
    tipo: 'documentacao',
    rotulo: 'Supervision: Detections e adaptadores',
    detalhe: 'Consultado em 26/09/2026; versão fixada no projeto: supervision==0.30.5.',
    url: 'https://supervision.roboflow.com/latest/detection/core/',
  },
  {
    id: 'sv-migracao',
    tipo: 'documentacao',
    rotulo: 'Supervision: migração de tracking para o pacote trackers',
    detalhe: 'sv.ByteTrack depreciado desde 0.28.0, remoção prevista para 0.31.0.',
    url: 'https://supervision.roboflow.com/latest/trackers/',
  },
  {
    id: 'trackers-doc',
    tipo: 'documentacao',
    rotulo: 'Trackers: ByteTrackTracker',
    detalhe: 'Parâmetros, confirmação e buffer; versão fixada: trackers==2.6.1.',
    url: 'https://trackers.roboflow.com/latest/trackers/bytetrack/',
  },
  {
    id: 'trackers-src',
    tipo: 'codigo',
    rotulo: 'Código de trackers 2.6.1: trackers/core/bytetrack/tracker.py e utils.py',
    detalhe: 'Referência executável conferida pelas fixtures de tests/fixtures/bytetrack/.',
  },
  {
    id: 'nb01',
    tipo: 'notebook',
    rotulo: 'projeto-3/01_supervision.ipynb',
    detalhe: 'Células 3 e 15 (BGR/RGB), 16–17 (campos de Detections), 18–19 (adaptadores), 22 (filtro por máscara).',
  },
  {
    id: 'nb02',
    tipo: 'notebook',
    rotulo: 'projeto-3/02_tracking.ipynb',
    detalhe: 'Células 11 (detecção × identidade), 15–17 (detector e filtro 0,10), 22 (tracker), 28–29 (update e ID −1), 39 (experimentos).',
  },
  {
    id: 'nb03',
    tipo: 'notebook',
    rotulo: 'projeto-3/03_projeto_final.ipynb',
    detalhe: 'Células 20–26 (YOLOv8x, conf 0,30, alta 0,60, ativação 0,30), 42 (três quantidades), 49 e 55 (validação e limitações).',
  },
  {
    id: 'pdf-identidade',
    tipo: 'anotacoes',
    rotulo: 'Anotações da Aula 5 (Projeto 3), p. 22–23',
    detalhe: 'Mesma classe não significa mesma identidade.',
  },
  {
    id: 'pdf-kalman',
    tipo: 'anotacoes',
    rotulo: 'Anotações da Aula 5 (Projeto 3), p. 59–63',
    detalhe: 'Kalman, SORT, Deep SORT e continuidade temporal.',
  },
  {
    id: 'pdf-supervision',
    tipo: 'anotacoes',
    rotulo: 'Anotações da Aula 5 (Projeto 3), p. 76–80 e 90–92',
    detalhe: 'Supervision, dados e filtros. Corrigido aqui: os campos são confidence e class_id.',
  },
  {
    id: 'pdf-byte',
    tipo: 'anotacoes',
    rotulo: 'Anotações da Aula 5 (Projeto 3), p. 106–110',
    detalhe: 'Separação entre Supervision e Trackers; duas associações.',
  },
  {
    id: 'pdf-ciclo',
    tipo: 'anotacoes',
    rotulo: 'Anotações da Aula 5 (Projeto 3), p. 112–114 e 136–137',
    detalhe: 'Limiares, confirmação, perda, buffer e anotação.',
  },
];

export const FONTES: Record<string, Fonte> = Object.fromEntries(lista.map((f) => [f.id, f]));
