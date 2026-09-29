// Parâmetros e cenário efetivos de um passo: predefinição dos notebooks + ajustes do roteiro.
import { CENARIOS, type IdCenario } from '../visualizadores/bytetrack/cenarios.ts';
import { MICROCENA } from '../visualizadores/bytetrack/microcena.ts';
import { PREDEFINICOES } from '../visualizadores/bytetrack/parametros.ts';
import type { Cenario, ParametrosByteTrack } from '../visualizadores/bytetrack/tipos.ts';
import type { CenaDoPasso, Comparacao } from './tipos.ts';

// O curso usa as três cenas do laboratório e a microcena, que não aparece no laboratório livre.
export type IdCenarioCurso = IdCenario | 'micro';

export function cenarioDoCurso(id: IdCenarioCurso): Cenario {
  return id === 'micro' ? MICROCENA : CENARIOS[id];
}

export function parametrosDoPasso(cena: CenaDoPasso): ParametrosByteTrack {
  const base = PREDEFINICOES.find((p) => p.id === cena.predefinicao);
  if (!base) throw new Error(`Predefinição desconhecida: ${cena.predefinicao}`);
  return { ...base.valores, ...cena.ajustes };
}

// Lado B de uma comparação: exatamente os parâmetros de A, trocando só o que ajustesB declara.
export function parametrosB(cena: CenaDoPasso, comparacao: Comparacao): ParametrosByteTrack {
  return { ...parametrosDoPasso(cena), ...comparacao.ajustesB };
}
