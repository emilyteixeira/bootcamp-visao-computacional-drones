// Linha do tempo no estilo Blender: régua de quadros, cursor azul e marcadores-losango (keyframes).
import { useRef } from 'react';

export default function LinhaDoTempo({ total, quadro, irPara, marcadores = [], faixas = [], fps = 30 }) {
  const ref = useRef();
  const px = (q) => `${(q / (total - 1)) * 100}%`;
  const aoPonteiro = (e) => {
    if (e.buttons !== 1 && e.type !== 'pointerdown') return;
    const r = ref.current.getBoundingClientRect();
    irPara(Math.round(((e.clientX - r.left) / r.width) * (total - 1)));
  };
  const reguas = [];
  for (let q = 0; q < total; q += 10) reguas.push(q);

  return (
    <div className="linha-tempo">
      <div
        ref={ref}
        className="linha-tempo-area"
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
        {marcadores.map((m, i) => (
          <button
            key={i}
            type="button"
            className={`losango ${m.tipo}`}
            style={{ left: px(m.quadro) }}
            title={`Quadro ${m.quadro}: ${m.texto}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => irPara(m.quadro)}
          />
        ))}
        <span className="cursor-quadro" style={{ left: px(quadro) }}>
          <b className="mono">{quadro}</b>
        </span>
      </div>
    </div>
  );
}
