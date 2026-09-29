// Controle deslizante didático: nome no código, valor, papel e efeito de subir/descer.
import type { ReactNode } from 'react';

interface PropsControle {
  id: string;
  rotulo: string;
  codigo?: string;
  valor: number;
  min: number;
  max: number;
  passo: number;
  aoMudar: (v: number) => void;
  formatar?: (v: number) => ReactNode;
  children?: ReactNode;
  destaque?: boolean;
}

export default function Controle({ id, rotulo, codigo, valor, min, max, passo, aoMudar, formatar = (v) => v, children, destaque }: PropsControle) {
  return (
    <div className={`controle ${destaque ? 'destaque' : ''}`}>
      <div className="controle-cabecalho">
        <label htmlFor={id}>{rotulo}</label>
        <output htmlFor={id} className="mono">{formatar(valor)}</output>
      </div>
      {codigo && <code className="controle-codigo">{codigo}</code>}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        onChange={(e) => aoMudar(Number(e.target.value))}
      />
      {children}
    </div>
  );
}
