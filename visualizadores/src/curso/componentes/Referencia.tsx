// Fontes de um passo ou capítulo, resolvidas no catálogo de fontes.ts.
import { FONTES } from '../fontes.ts';

const TIPO = { artigo: 'Artigo', documentacao: 'Documentação', notebook: 'Notebook', codigo: 'Código', anotacoes: 'Anotações' } as const;

export default function Referencia({ ids, titulo = 'Fontes' }: { ids: string[]; titulo?: string }) {
  if (!ids.length) return null;
  return (
    <details className="fontes">
      <summary>{titulo} ({ids.length})</summary>
      <ul>
        {ids.map((id) => {
          const f = FONTES[id];
          if (!f) return null;
          return (
            <li key={id}>
              <span className="fonte-tipo">{TIPO[f.tipo]}</span>
              {f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.rotulo}</a> : <span>{f.rotulo}</span>}
              {f.detalhe && <small>{f.detalhe}</small>}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
