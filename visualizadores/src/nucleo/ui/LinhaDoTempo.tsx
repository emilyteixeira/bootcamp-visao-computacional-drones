// Linha do tempo no estilo Blender: régua de quadros, cursor azul e marcadores-losango (keyframes).
import { useRef, type PointerEvent } from 'react';

export interface Marcador {
  quadro: number;
  tipo: string;
  texto: string;
}

export interface Faixa {
  chave: number | string;
  inicio: number;
  fim: number;
  classe: string;
  texto: string;
}

interface PropsLinhaDoTempo {
  total: number;
  quadro: number;
  irPara: (q: number) => void;
  marcadores?: Marcador[];
  faixas?: Faixa[];
  fps?: number;
}

export default function LinhaDoTempo({ total, quadro, irPara, marcadores = [], faixas = [], fps = 30 }: PropsLinhaDoTempo) {
  const ref = useRef<HTMLDivElement>(null);
  const px = (q: number) => `${(q / (total - 1)) * 100}%`;
  const aoPonteiro = (e: PointerEvent<HTMLElement>) => {
    if (e.buttons !== 1 && e.type !== 'pointerdown') return;
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    irPara(Math.round(((e.clientX - r.left) / r.width) * (total - 1)));
  };
  const reguas: number[] = [];
  for (let q = 0; q < total; q += 10) reguas.push(q);

  // O trilho (role="slider") e os marcadores são irmãos: controles interativos não podem ficar
  // aninhados dentro do slider (WCAG, axe "nested-interactive").
  return (
    <div className="linha-tempo">
      <div ref={ref} className="linha-tempo-area">
        <div
          className="linha-tempo-trilho"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); aoPonteiro(e); }}
          onPointerMove={aoPonteiro}
          role="slider"
          aria-label="Quadro atual"
          aria-valuemin={0}
          aria-valuemax={total - 1}
          aria-valuenow={quadro}
          tabIndex={0}
        >
          {reguas.map((q) => (
            <span key={q} className={`regua ${q % 30 === 0 ? 'forte' : ''}`} style={{ left: px(q) }}>
              {q % 30 === 0 && <em>{q / fps}s</em>}
            </span>
          ))}
          {faixas.map((f) => (
            <span key={f.chave} className={`faixa ${f.classe}`} style={{ left: px(f.inicio), width: `${((f.fim - f.inicio + 1) / total) * 100}%` }} title={f.texto} />
          ))}
          <span className="cursor-quadro" style={{ left: px(quadro) }}>
            <b className="mono">{quadro}</b>
          </span>
        </div>
        {marcadores.map((m, i) => (
          <button
            key={i}
            type="button"
            className={`losango ${m.tipo}`}
            style={{ left: px(m.quadro) }}
            title={`Quadro ${m.quadro}: ${m.texto}`}
            aria-label={`Ir ao quadro ${m.quadro}: ${m.texto}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => irPara(m.quadro)}
          />
        ))}
      </div>
    </div>
  );
}
