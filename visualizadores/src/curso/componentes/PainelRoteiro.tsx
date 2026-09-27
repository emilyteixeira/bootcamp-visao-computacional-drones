// Painel lateral da aula: passo atual (texto, código, parâmetro livre, questão, fontes) e navegação.
import type { ReactNode } from 'react';
import Controle from '../../nucleo/ui/Controle.tsx';
import { PARAMETROS } from '../../visualizadores/bytetrack/parametros.ts';
import type { ParametrosByteTrack } from '../../visualizadores/bytetrack/tipos.ts';
import { indiceLinear, totalPassos } from '../progresso.ts';
import type { Aula, Capitulo, Fase, Passo, ProgressoCurso } from '../tipos.ts';
import Questao from './Questao.tsx';
import Referencia from './Referencia.tsx';
import TextoRico from './TextoRico.tsx';

const FASE: Record<Fase, string> = {
  observar: 'Observar',
  prever: 'Prever',
  manipular: 'Manipular',
  explicar: 'Explicar',
  conferir: 'Conferir',
};

interface Props {
  aula: Aula;
  capitulo: Capitulo;
  passo: Passo;
  prog: ProgressoCurso;
  parametros: ParametrosByteTrack;
  aoMudarParametro: (v: number) => void;
  aoEscolher: (questaoId: string, opcao: number) => void;
  aoVoltar: () => void;
  aoAvancar: () => void;
  temAnterior: boolean;
  temProximo: boolean;
  // Painéis auxiliares do passo (etapas do quadro, detecções, resumo do clipe).
  extras?: ReactNode;
}

export default function PainelRoteiro(props: Props) {
  const { aula, capitulo, passo, prog, parametros } = props;
  const n = indiceLinear(aula, prog.posicao) + 1;
  const total = totalPassos(aula);
  const meta = passo.parametroLivre ? PARAMETROS.find((m) => m.chave === passo.parametroLivre) : undefined;
  const primeiroDoCapitulo = prog.posicao.passo === 0;

  return (
    <div className="roteiro">
      <div className="roteiro-progresso" role="progressbar" aria-label="Progresso na aula" aria-valuemin={1} aria-valuemax={total} aria-valuenow={n}>
        <span style={{ width: `${(n / total) * 100}%` }} />
      </div>
      <header className="roteiro-cabecalho">
        <p className="rotulo">Capítulo {capitulo.numero} de {aula.capitulos.length} · {capitulo.duracaoMin} min · passo {n} de {total}</p>
        <h2>{capitulo.titulo}</h2>
        {primeiroDoCapitulo && (
          <dl className="objetivo">
            <dt>Objetivo</dt><dd>{capitulo.objetivo}</dd>
            <dt>Ao final</dt><dd>{capitulo.evidencia}</dd>
          </dl>
        )}
      </header>

      <section className="roteiro-passo" aria-labelledby={`titulo-${passo.id}`}>
        <p className={`fase fase-${passo.fase}`}>{FASE[passo.fase]}</p>
        <h3 id={`titulo-${passo.id}`}>{passo.titulo}</h3>
        <TextoRico paragrafos={passo.texto} />

        {passo.codigo?.map((c) => (
          <figure key={c.origem} className="codigo">
            <figcaption>{c.origem}</figcaption>
            <pre><code>{c.codigo}</code></pre>
          </figure>
        ))}

        {meta && (
          <Controle
            id={`livre-${meta.chave}`}
            rotulo={meta.rotulo}
            codigo={meta.codigo}
            valor={parametros[meta.chave]}
            min={meta.min}
            max={meta.max}
            passo={meta.passo}
            formatar={(v) => (meta.passo >= 1 ? String(v) : v.toFixed(2))}
            aoMudar={props.aoMudarParametro}
            destaque
          >
            <p className="controle-papel">{meta.papel}</p>
          </Controle>
        )}

        {props.extras}

        {passo.questao && (
          <Questao questao={passo.questao} escolhida={prog.respostas[passo.questao.id]} aoEscolher={(o) => props.aoEscolher(passo.questao!.id, o)} />
        )}

        <Referencia ids={passo.fontes} />
        {capitulo.aprofundamento && passo === capitulo.passos[capitulo.passos.length - 1] && (
          <Referencia ids={capitulo.aprofundamento} titulo="Para ir além" />
        )}
      </section>

      <nav className="roteiro-nav" aria-label="Navegação da aula">
        <button type="button" onClick={props.aoVoltar} disabled={!props.temAnterior}>← Anterior</button>
        <button type="button" className="primario" onClick={props.aoAvancar} disabled={!props.temProximo}>
          {props.temProximo ? 'Próximo →' : 'Fim da aula'}
        </button>
      </nav>
    </div>
  );
}
