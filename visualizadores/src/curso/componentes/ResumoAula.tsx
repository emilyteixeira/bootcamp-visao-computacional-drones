// Fechamento da aula: progresso e acertos por capítulo, e como continuar nos notebooks.
import { resumoCapitulo } from '../progresso.ts';
import type { Aula, Posicao, ProgressoCurso } from '../tipos.ts';

interface Props {
  aula: Aula;
  prog: ProgressoCurso;
  aoIr: (p: Posicao) => void;
  aoVoltar: () => void;
  aoRecomecar: () => void;
}

export default function ResumoAula({ aula, prog, aoIr, aoVoltar, aoRecomecar }: Props) {
  const linhas = aula.capitulos.map((c, i) => ({ c, i, r: resumoCapitulo(aula, prog, i) }));
  const acertos = linhas.reduce((s, l) => s + l.r.acertos, 0);
  const questoes = linhas.reduce((s, l) => s + l.r.questoes, 0);
  const respondidas = linhas.reduce((s, l) => s + l.r.respondidas, 0);
  return (
    <section className="resumo-aula" aria-labelledby="titulo-resumo">
      <h3 id="titulo-resumo" tabIndex={-1}>Resumo da aula</h3>
      <p>Você respondeu {respondidas} de {questoes} questões e acertou {acertos}. As questões são formativas: volte a qualquer capítulo e responda de novo.</p>
      <table>
        <thead><tr><th scope="col">Capítulo</th><th scope="col">Passos vistos</th><th scope="col">Acertos</th></tr></thead>
        <tbody>
          {linhas.map(({ c, i, r }) => (
            <tr key={c.id}>
              <th scope="row"><button type="button" className="link" onClick={() => aoIr({ capitulo: i, passo: 0 })}>{c.numero}. {c.titulo}</button></th>
              <td className="mono">{r.visitados}/{r.total}</td>
              <td className="mono">{r.acertos}/{r.questoes}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Para continuar nos notebooks</h4>
      <ul>
        <li><code>projeto-3/02_tracking.ipynb</code>, célula 39: suba <code>LIMIAR_DETECTOR</code> para 0,50 e observe quais observações deixam de chegar à etapa 2.</li>
        <li>No mesmo notebook, compare <code>minimum_consecutive_frames</code> 2 e 3 e reduza o buffer; mude um parâmetro por vez.</li>
        <li><code>projeto-3/03_projeto_final.ipynb</code>: faça a referência manual (células 15–19) antes de olhar a contagem automática.</li>
        <li>No <a href="#bytetrack">laboratório livre</a>, repita as comparações em outras cenas e com outros valores.</li>
      </ul>
      <div className="linha-acoes">
        <button type="button" className="chip" onClick={aoVoltar}>← Voltar ao último passo</button>
        <button type="button" className="chip" onClick={aoRecomecar}>Recomeçar a aula</button>
      </div>
    </section>
  );
}
