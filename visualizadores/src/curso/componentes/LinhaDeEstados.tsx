// Linha do tempo de estados de cada trilha que chegou a ter ID: tentativa → ativa ⇄ perdida → removida.
// Um clique leva ao quadro. Tentativas que nunca confirmaram aparecem só como contagem.
import type { MouseEvent } from 'react';
import { corDoId } from '../../visualizadores/bytetrack/cores.ts';
import type { EstadoTrilha, Instantaneo } from '../../visualizadores/bytetrack/tipos.ts';

interface Linha {
  interno: number;
  id: number;
  estados: (EstadoTrilha | null)[];
  inicio: number;
  fim: number;
}

export function linhasDeEstado(resultados: Instantaneo[]) {
  const porInterno = new Map<number, Linha>();
  resultados.forEach((r, q) => {
    for (const t of r.trilhas) {
      let l = porInterno.get(t.interno);
      if (!l) {
        l = { interno: t.interno, id: -1, estados: Array(resultados.length).fill(null), inicio: q, fim: q };
        porInterno.set(t.interno, l);
      }
      l.estados[q] = t.estado;
      l.fim = q;
      if (t.id >= 0) l.id = t.id;
    }
  });
  const todas = [...porInterno.values()];
  return {
    confirmadas: todas.filter((l) => l.id >= 0).sort((a, b) => a.id - b.id),
    tentativasDescartadas: todas.filter((l) => l.id < 0 && l.fim < resultados.length - 1).length,
  };
}

const ALTURA = 16;
const ROTULO = 34;

interface Props {
  resultados: Instantaneo[];
  quadro: number;
  irPara: (q: number) => void;
}

export default function LinhaDeEstados({ resultados, quadro, irPara }: Props) {
  const { confirmadas, tentativasDescartadas } = linhasDeEstado(resultados);
  const total = resultados.length;
  const largura = 300;
  const escala = (largura - ROTULO) / total;
  const altura = confirmadas.length * ALTURA + 18;
  const aoClicar = (e: MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * largura - ROTULO;
    if (x >= 0) irPara(Math.min(total - 1, Math.floor(x / escala)));
  };
  const descricao = confirmadas.map((l) => `#${l.id}: quadros ${l.inicio}–${l.fim}${l.fim < total - 1 ? ', removida' : ''}`).join('; ');

  return (
    <figure className="estados">
      <figcaption>Estados das trilhas confirmadas · clique para ir ao quadro</figcaption>
      <svg viewBox={`0 0 ${largura} ${altura}`} onClick={aoClicar} role="img" aria-label={`Linha de estados. ${descricao}`}>
        {confirmadas.map((l, i) => {
          const y = i * ALTURA + 2;
          const cor = corDoId(l.id);
          const segs: { de: number; ate: number; estado: EstadoTrilha }[] = [];
          l.estados.forEach((e, q) => {
            if (!e) return;
            const ult = segs[segs.length - 1];
            if (ult && ult.estado === e && ult.ate === q - 1) ult.ate = q;
            else segs.push({ de: q, ate: q, estado: e });
          });
          return (
            <g key={l.interno}>
              <text x={0} y={y + 11} className="estados-rotulo" fill={cor}>#{l.id}</text>
              {segs.map((s) => (
                <rect
                  key={s.de}
                  x={ROTULO + s.de * escala}
                  y={y + (s.estado === 'ativa' ? 2 : 5)}
                  width={Math.max(1, (s.ate - s.de + 1) * escala)}
                  height={s.estado === 'ativa' ? 10 : 4}
                  fill={s.estado === 'tentativa' ? '#35d0c0' : cor}
                  opacity={s.estado === 'perdida' ? 0.45 : 1}
                />
              ))}
              {l.fim < total - 1 && <text x={ROTULO + (l.fim + 1) * escala + 1} y={y + 11} className="estados-x">×</text>}
            </g>
          );
        })}
        <line x1={ROTULO + quadro * escala} x2={ROTULO + quadro * escala} y1={0} y2={altura - 14} className="estados-cursor" />
        <text x={ROTULO} y={altura - 3} className="estados-eixo">0</text>
        <text x={largura} y={altura - 3} textAnchor="end" className="estados-eixo">{total - 1}</text>
      </svg>
      <p className="estados-legenda">
        <span><i className="e-tent" />tentativa (−1)</span>
        <span><i className="e-ativa" />ativa</span>
        <span><i className="e-perdida" />perdida (só previsão)</span>
        <span>× removida</span>
      </p>
      {tentativasDescartadas > 0 && <p className="nota">{tentativasDescartadas} tentativa(s) removida(s) antes de confirmar não aparecem nas linhas.</p>}
    </figure>
  );
}
