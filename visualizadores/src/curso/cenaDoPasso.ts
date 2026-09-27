// Parâmetros efetivos de um passo: predefinição dos notebooks + ajustes declarados no roteiro.
import { PREDEFINICOES } from '../visualizadores/bytetrack/parametros.ts';
import type { ParametrosByteTrack } from '../visualizadores/bytetrack/tipos.ts';
import type { CenaDoPasso } from './tipos.ts';

export function parametrosDoPasso(cena: CenaDoPasso): ParametrosByteTrack {
  const base = PREDEFINICOES.find((p) => p.id === cena.predefinicao);
  if (!base) throw new Error(`Predefinição desconhecida: ${cena.predefinicao}`);
  return { ...base.valores, ...cena.ajustes };
}
