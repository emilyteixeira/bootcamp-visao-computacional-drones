// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO DE VISUALIZADORES
// Para adicionar um novo conceito de Visão Computacional:
//   1. copie src/visualizadores/_modelo/ para src/visualizadores/<id>/
//   2. adicione uma entrada abaixo com status 'pronto' e carregar: () => import(...)
//   3. `npm run dev` e abra http://localhost:5173/#<id>
// Entradas 'planejado' aparecem no menu como vagas reservadas (sem código ainda).
// ─────────────────────────────────────────────────────────────────────────────
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

interface VisualizadorPronto {
  id: string;
  titulo: string;
  subtitulo: string;
  status: 'pronto';
  Componente: LazyExoticComponent<ComponentType>;
}

export interface VisualizadorPlanejado {
  id: string;
  titulo: string;
  subtitulo: string;
  status: 'planejado';
  ideia: string;
}

export type EntradaRegistro = VisualizadorPronto | VisualizadorPlanejado;

export const VISUALIZADORES: EntradaRegistro[] = [
  {
    id: 'bytetrack',
    titulo: 'ByteTrack',
    subtitulo: 'Associação em duas etapas e impacto dos parâmetros',
    status: 'pronto',
    Componente: lazy(() => import('./visualizadores/bytetrack/ByteTrackVisualizador.tsx')),
  },
  {
    id: 'iou-nms',
    titulo: 'IoU e NMS',
    subtitulo: 'Sobreposição de caixas e supressão de não máximos',
    status: 'planejado',
    ideia: 'Arrastar duas caixas em 3D, ver interseção/união e o efeito do iou_threshold do NMS sobre detecções duplicadas.',
  },
  {
    id: 'kalman',
    titulo: 'Filtro de Kalman',
    subtitulo: 'Previsão, incerteza e correção',
    status: 'planejado',
    ideia: 'Elipsoides de covariância crescendo durante a oclusão e encolhendo a cada medição (reutiliza bytetrack/kalman.js).',
  },
  {
    id: 'linezone',
    titulo: 'LineZone e âncoras',
    subtitulo: 'Quando uma caixa “cruza” uma linha',
    status: 'planejado',
    ideia: 'Comparar âncoras (4 cantos × CENTER × BOTTOM_CENTER) e minimum_crossing_threshold no contador do projeto final.',
  },
  {
    id: 'homografia',
    titulo: 'Coordenadas e homografia',
    subtitulo: 'Da imagem do drone ao plano do solo',
    status: 'planejado',
    ideia: 'Câmera do drone com frustum, raios de projeção e a homografia imagem → solo em metros.',
  },
];

export const visualizadorPorId = (id: string): EntradaRegistro => VISUALIZADORES.find((v) => v.id === id) ?? VISUALIZADORES[0];
