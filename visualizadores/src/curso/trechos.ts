// Trechos Python da aula e o resultado da validação nas versões fixadas (scripts/validar-trechos.py).
import lista from './trechos.json';
import validacao from './validacao-trechos.json';

export interface Trecho {
  id: string;
  origem: string;
  execucao: 'executado' | 'ilustrativo';
  codigo: string;
  motivo?: string;
  requer?: string[];
  preparo?: string;
  verificacao?: string;
}

export interface ResultadoValidacao {
  status: 'ok' | 'falhou';
  saida: string;
  execucao: Trecho['execucao'];
  hashCodigo: string;
  erro?: string;
}

export const TRECHOS: Record<string, Trecho> = Object.fromEntries((lista as Trecho[]).map((t) => [t.id, t]));
export const VALIDACAO = validacao as { data: string; ambiente: Record<string, string>; resultados: Record<string, ResultadoValidacao> };
