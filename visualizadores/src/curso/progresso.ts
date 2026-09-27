// Navegação e progresso do curso: funções puras, sem React nem localStorage,
// para que avançar, voltar, recarregar e retomar sejam testáveis em Node.
import type { Aula, Passo, Posicao, ProgressoCurso } from './tipos.ts';

export const CHAVE_ARMAZENAMENTO = 'curso-bytetrack:progresso';

export const passoEm = (aula: Aula, p: Posicao): Passo => aula.capitulos[p.capitulo].passos[p.passo];

export const totalPassos = (aula: Aula): number => aula.capitulos.reduce((s, c) => s + c.passos.length, 0);

// Índice linear do passo (0 … total − 1), útil para barra de progresso e "passo n de m".
export function indiceLinear(aula: Aula, p: Posicao): number {
  let n = 0;
  for (let c = 0; c < p.capitulo; c++) n += aula.capitulos[c].passos.length;
  return n + p.passo;
}

export function posicaoValida(aula: Aula, p: Posicao): boolean {
  const cap = aula.capitulos[p.capitulo];
  return Number.isInteger(p.capitulo) && Number.isInteger(p.passo) && !!cap && p.passo >= 0 && p.passo < cap.passos.length;
}

export function proximo(aula: Aula, p: Posicao): Posicao | null {
  if (p.passo + 1 < aula.capitulos[p.capitulo].passos.length) return { capitulo: p.capitulo, passo: p.passo + 1 };
  if (p.capitulo + 1 < aula.capitulos.length) return { capitulo: p.capitulo + 1, passo: 0 };
  return null;
}

export function anterior(aula: Aula, p: Posicao): Posicao | null {
  if (p.passo > 0) return { capitulo: p.capitulo, passo: p.passo - 1 };
  if (p.capitulo > 0) return { capitulo: p.capitulo - 1, passo: aula.capitulos[p.capitulo - 1].passos.length - 1 };
  return null;
}

export function progressoInicial(aula: Aula): ProgressoCurso {
  const posicao = { capitulo: 0, passo: 0 };
  return { versaoConteudo: aula.versaoConteudo, posicao, respostas: {}, visitados: [passoEm(aula, posicao).id] };
}

export function irPara(aula: Aula, prog: ProgressoCurso, posicao: Posicao): ProgressoCurso {
  if (!posicaoValida(aula, posicao)) return prog;
  const id = passoEm(aula, posicao).id;
  const visitados = prog.visitados.includes(id) ? prog.visitados : [...prog.visitados, id];
  return { ...prog, posicao, visitados };
}

// Responder de novo é permitido: a última escolha vale (a aula é formativa, não uma prova).
export function responder(aula: Aula, prog: ProgressoCurso, questaoId: string, opcao: number): ProgressoCurso {
  const q = todasQuestoes(aula).get(questaoId);
  if (!q || !Number.isInteger(opcao) || opcao < 0 || opcao >= q.opcoes.length) return prog;
  return { ...prog, respostas: { ...prog.respostas, [questaoId]: opcao } };
}

export function todasQuestoes(aula: Aula) {
  const mapa = new Map<string, NonNullable<Passo['questao']>>();
  for (const c of aula.capitulos) for (const p of c.passos) if (p.questao) mapa.set(p.questao.id, p.questao);
  return mapa;
}

// Resumo do capítulo: passos visitados e acertos nas questões respondidas.
export function resumoCapitulo(aula: Aula, prog: ProgressoCurso, capitulo: number) {
  const passos = aula.capitulos[capitulo].passos;
  const questoes = passos.flatMap((p) => (p.questao ? [p.questao] : []));
  const respondidas = questoes.filter((q) => q.id in prog.respostas);
  const acertos = respondidas.filter((q) => q.opcoes[prog.respostas[q.id]]?.correta).length;
  return {
    visitados: passos.filter((p) => prog.visitados.includes(p.id)).length,
    total: passos.length,
    questoes: questoes.length,
    respondidas: respondidas.length,
    acertos,
  };
}

export const serializar = (prog: ProgressoCurso): string => JSON.stringify(prog);

// Lê progresso salvo com recuperação segura: JSON inválido, versão de conteúdo diferente
// ou posição fora do roteiro devolvem null (o chamador recomeça do início).
// Respostas e visitados que não existem mais no conteúdo são descartados.
export function desserializar(aula: Aula, texto: string | null): ProgressoCurso | null {
  if (!texto) return null;
  let dado: unknown;
  try {
    dado = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!dado || typeof dado !== 'object') return null;
  const d = dado as Partial<ProgressoCurso>;
  if (d.versaoConteudo !== aula.versaoConteudo) return null;
  const pos = d.posicao;
  if (!pos || typeof pos !== 'object' || !posicaoValida(aula, pos as Posicao)) return null;

  const questoes = todasQuestoes(aula);
  const respostas: Record<string, number> = {};
  if (d.respostas && typeof d.respostas === 'object') {
    for (const [id, v] of Object.entries(d.respostas)) {
      const q = questoes.get(id);
      if (q && Number.isInteger(v) && v >= 0 && v < q.opcoes.length) respostas[id] = v;
    }
  }
  const idsPassos = new Set(aula.capitulos.flatMap((c) => c.passos.map((p) => p.id)));
  const visitados = Array.isArray(d.visitados) ? d.visitados.filter((v): v is string => typeof v === 'string' && idsPassos.has(v)) : [];
  const posicao = { capitulo: pos.capitulo, passo: pos.passo };
  const atual = passoEm(aula, posicao).id;
  return { versaoConteudo: aula.versaoConteudo, posicao, respostas, visitados: visitados.includes(atual) ? visitados : [...visitados, atual] };
}
