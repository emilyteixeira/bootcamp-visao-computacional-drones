// Índice da aula: capítulos, duração e progresso; cada item leva ao primeiro passo do capítulo.
import { resumoCapitulo } from '../progresso.ts';
import type { Aula, Posicao, ProgressoCurso } from '../tipos.ts';

interface Props {
  aula: Aula;
  prog: ProgressoCurso;
  aoIr: (p: Posicao) => void;
}

export default function IndiceCapitulos({ aula, prog, aoIr }: Props) {
  return (
    <nav className="indice" aria-label="Capítulos da aula">
      <ol>
        {aula.capitulos.map((c, i) => {
          const r = resumoCapitulo(aula, prog, i);
          const atual = prog.posicao.capitulo === i;
          return (
            <li key={c.id}>
              <button type="button" className={atual ? 'atual' : ''} aria-current={atual ? 'step' : undefined} onClick={() => aoIr({ capitulo: i, passo: 0 })}>
                <span className="indice-num">{c.numero}</span>
                <span className="indice-titulo">{c.titulo}</span>
                <span className="indice-meta mono">{r.visitados}/{r.total} · {c.duracaoMin} min</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
