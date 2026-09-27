// Rota #curso-bytetrack: aula 1 guiada (ByteTrack + Supervision) sobre o laboratório existente.
import AulaShell from './AulaShell.tsx';
import { AULA_01 } from './capitulos/aula01.ts';
import { usarAula } from './usarAula.ts';

export default function CursoByteTrack() {
  const estado = usarAula(AULA_01);
  const duracao = AULA_01.capitulos.reduce((s, c) => s + c.duracaoMin, 0);
  const { capitulo, passo } = estado;

  return (
    <div className="curso">
      <header className="curso-cabecalho">
        <div>
          <p className="rotulo">Aula 1 · ByteTrack e Supervision · {AULA_01.capitulos.length} capítulos · {duracao} min</p>
          <h1>{AULA_01.titulo}</h1>
          <p className="bt-resumo">{AULA_01.abertura} <span className="curso-publico">{AULA_01.publico}</span></p>
        </div>
      </header>
      {estado.origem === 'retomado' && (
        <p className="aviso-info" role="status">
          Retomando de onde você parou: capítulo {capitulo.numero}, “{passo.titulo}”.{' '}
          <button type="button" className="chip" onClick={estado.recomecar}>Recomeçar a aula</button>
        </p>
      )}
      {estado.origem === 'reiniciado' && (
        <p className="aviso" role="status">O conteúdo da aula foi atualizado e o progresso salvo anteriormente não é compatível. A aula recomeçou do início.</p>
      )}
      <AulaShell aula={AULA_01} estado={estado} />
    </div>
  );
}
