// Estado da aula guiada com persistência local. localStorage pode estar indisponível
// (modo privado, bloqueio de dados do site, testes): toda leitura e escrita é protegida,
// e a aula funciona do início nesse caso.
import { useCallback, useEffect, useState } from 'react';
import {
  anterior, CHAVE_ARMAZENAMENTO, desserializar, irPara, passoEm, progressoInicial, proximo, responder, serializar,
} from './progresso.ts';
import type { Aula, Posicao, ProgressoCurso } from './tipos.ts';

export type OrigemProgresso = 'novo' | 'retomado' | 'reiniciado';

function lerArmazenado(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_ARMAZENAMENTO);
  } catch {
    return null;
  }
}

function gravar(texto: string | null) {
  try {
    if (texto === null) window.localStorage.removeItem(CHAVE_ARMAZENAMENTO);
    else window.localStorage.setItem(CHAVE_ARMAZENAMENTO, texto);
  } catch {
    // Sem armazenamento: o progresso vale só para esta visita.
  }
}

function carregar(aula: Aula): { prog: ProgressoCurso; origem: OrigemProgresso } {
  const texto = lerArmazenado();
  const salvo = desserializar(aula, texto);
  if (salvo) return { prog: salvo, origem: 'retomado' };
  // Havia algo salvo, mas de outra versão do conteúdo ou corrompido.
  return { prog: progressoInicial(aula), origem: texto ? 'reiniciado' : 'novo' };
}

export function usarAula(aula: Aula) {
  const [{ prog, origem }, setEstado] = useState(() => carregar(aula));

  useEffect(() => { gravar(serializar(prog)); }, [prog]);

  const mudar = useCallback((f: (p: ProgressoCurso) => ProgressoCurso) => {
    // Depois da primeira navegação, o aviso de retomada deixa de ser útil.
    setEstado((e) => ({ origem: 'novo', prog: f(e.prog) }));
  }, []);

  const avancar = useCallback(() => mudar((p) => { const n = proximo(aula, p.posicao); return n ? irPara(aula, p, n) : p; }), [aula, mudar]);
  const voltar = useCallback(() => mudar((p) => { const n = anterior(aula, p.posicao); return n ? irPara(aula, p, n) : p; }), [aula, mudar]);
  const ir = useCallback((pos: Posicao) => mudar((p) => irPara(aula, p, pos)), [aula, mudar]);
  const escolher = useCallback((questaoId: string, opcao: number) => mudar((p) => responder(aula, p, questaoId, opcao)), [aula, mudar]);
  const recomecar = useCallback(() => setEstado({ prog: progressoInicial(aula), origem: 'novo' }), [aula]);

  return {
    prog,
    origem,
    passo: passoEm(aula, prog.posicao),
    capitulo: aula.capitulos[prog.posicao.capitulo],
    temProximo: proximo(aula, prog.posicao) !== null,
    temAnterior: anterior(aula, prog.posicao) !== null,
    avancar,
    voltar,
    ir,
    escolher,
    recomecar,
  };
}
