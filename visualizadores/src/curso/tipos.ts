// Contratos do curso guiado (plano §7: LessonStep e CourseProgress).
// O conteúdo é dado puro: nenhum passo lê o Canvas para decidir algo; a cena é recalculada
// de forma determinística a partir de cenário, predefinição, ajustes e quadro.
import type { IdCenario } from '../visualizadores/bytetrack/cenarios.ts';
import type { Camadas, ChaveParametro, ParametrosByteTrack } from '../visualizadores/bytetrack/tipos.ts';
import type { NomeVista } from '../nucleo/Viewport3D.tsx';

// Ciclo de cada capítulo: observar → prever → manipular → explicar → conferir (plano §5).
export type Fase = 'observar' | 'prever' | 'manipular' | 'explicar' | 'conferir';

export type IdPredefinicao = 'nb02' | 'nb03' | 'sv' | 'erro';

export interface OpcaoQuestao {
  texto: string;
  correta: boolean;
  // Explica por que a opção está certa ou errada; aparece depois da resposta.
  feedback: string;
}

export interface Questao {
  id: string;
  enunciado: string;
  opcoes: OpcaoQuestao[];
}

export interface TrechoCodigo {
  // Origem exata no repositório, por exemplo "projeto-3/02_tracking.ipynb, célula 22".
  origem: string;
  codigo: string;
}

// Estado da cena que um passo impõe ao palco 3D.
export interface CenaDoPasso {
  cenario: IdCenario;
  predefinicao: IdPredefinicao;
  ajustes?: Partial<ParametrosByteTrack>;
  quadro: number;
  camadas: Partial<Camadas>;
  vista?: NomeVista;
}

export interface Passo {
  id: string;
  fase: Fase;
  titulo: string;
  // Parágrafos; aceitam `código` e **negrito** (ver componentes/TextoRico.tsx).
  texto: string[];
  cena: CenaDoPasso;
  // Único parâmetro liberado para manipulação neste passo (um fator por vez).
  parametroLivre?: ChaveParametro;
  // Painéis auxiliares ao lado do roteiro.
  mostrarEtapas?: boolean;
  mostrarDeteccoes?: boolean;
  mostrarResumo?: boolean;
  codigo?: TrechoCodigo[];
  questao?: Questao;
  fontes: string[];
}

export interface Capitulo {
  id: string;
  numero: number;
  titulo: string;
  duracaoMin: number;
  objetivo: string;
  // Evidência de aprendizado esperada ao fim do capítulo (plano §5).
  evidencia: string;
  passos: Passo[];
  aprofundamento?: string[];
}

export interface Aula {
  id: string;
  // Muda sempre que capítulos ou passos forem reordenados: invalida progresso antigo.
  versaoConteudo: string;
  titulo: string;
  publico: string;
  abertura: string;
  capitulos: Capitulo[];
}

export interface Fonte {
  id: string;
  rotulo: string;
  detalhe?: string;
  url?: string;
  tipo: 'artigo' | 'documentacao' | 'notebook' | 'codigo' | 'anotacoes';
}

// Posição no roteiro: índices de capítulo e passo.
export interface Posicao {
  capitulo: number;
  passo: number;
}

// Progresso salvo localmente (sem backend no MVP).
export interface ProgressoCurso {
  versaoConteudo: string;
  posicao: Posicao;
  // id da questão → índice da opção escolhida.
  respostas: Record<string, number>;
  // ids dos passos já visitados.
  visitados: string[];
}
