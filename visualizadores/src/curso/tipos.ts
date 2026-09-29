// Contratos do curso guiado (plano §7: LessonStep e CourseProgress).
// O conteúdo é dado puro: nenhum passo lê o Canvas para decidir algo; a cena é recalculada
// de forma determinística a partir de cenário, predefinição, ajustes e quadro.
import type { IdCenarioCurso } from './cenaDoPasso.ts';
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

// Estado da cena que um passo impõe ao palco 3D.
export interface CenaDoPasso {
  cenario: IdCenarioCurso;
  predefinicao: IdPredefinicao;
  ajustes?: Partial<ParametrosByteTrack>;
  quadro: number;
  camadas: Partial<Camadas>;
  vista?: NomeVista;
}

// Comparação A/B: mesmas detecções, mesma semente, mesmo quadro e câmeras sincronizadas.
// A usa os parâmetros do passo; B = A + ajustesB (o parâmetro livre, se houver, altera B).
// Com replayB, o lado B mostra a saída gravada do trackers 2.6.1 em Python (etapa 4).
export interface Comparacao {
  rotuloA: string;
  rotuloB: string;
  ajustesB?: Partial<ParametrosByteTrack>;
  replayB?: string;
}

// Associação manual (capítulo 1): ligar as caixas de um quadro às do quadro seguinte.
export interface AssociacaoManual {
  quadroA: number;
  quadroB: number;
}

// Tabela curta no roteiro (células aceitam `código` e **negrito**).
export interface TabelaPasso {
  legenda: string;
  colunas: string[];
  linhas: string[][];
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
  // Linha do tempo de estados das trilhas (tentativa, ativa, perdida, removida).
  mostrarEstados?: boolean;
  // Passo a passo dentro do quadro: previsão → etapa 1 → etapa 2 → resultado.
  faseQuadro?: boolean;
  comparacao?: Comparacao;
  associacaoManual?: AssociacaoManual;
  // ids de src/curso/trechos.json (validados por scripts/validar-trechos.py).
  codigo?: string[];
  tabela?: TabelaPasso;
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
