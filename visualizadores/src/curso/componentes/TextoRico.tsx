// Parágrafo com marcação mínima: `código` e **negrito**. Sem HTML arbitrário no conteúdo.
import { Fragment, type ReactNode } from 'react';

export function formatar(texto: string): ReactNode[] {
  return texto.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean).map((parte, i) => {
    if (parte.startsWith('`')) return <code key={i}>{parte.slice(1, -1)}</code>;
    if (parte.startsWith('**')) return <strong key={i}>{parte.slice(2, -2)}</strong>;
    return <Fragment key={i}>{parte}</Fragment>;
  });
}

export default function TextoRico({ paragrafos }: { paragrafos: string[] }) {
  return (
    <div className="texto-rico">
      {paragrafos.map((p, i) => <p key={i}>{formatar(p)}</p>)}
    </div>
  );
}
