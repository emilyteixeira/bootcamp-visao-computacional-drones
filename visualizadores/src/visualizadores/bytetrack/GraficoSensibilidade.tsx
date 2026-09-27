// Varredura de um parâmetro (demais fixos) sobre a mesma cena: mostra o impacto isolado.
import { useState, type PointerEvent, type ReactNode } from 'react';
import type { Metricas } from './tipos.ts';

// Um ponto da varredura: valor do parâmetro (v) e as métricas numéricas obtidas com ele.
type PontoVarredura = { v: number } & Omit<Metricas, 'eventos'>;
type ChaveSerie = 'idsCriados' | 'trocasId' | 'cobertura';

interface Serie {
  chave: ChaveSerie;
  rotulo: string;
  cor: string;
}

interface PropsGrafico {
  inteiro: boolean;
  titulo: string;
  valores: PontoVarredura[];
  series: Serie[];
  referencia?: { valor: number; rotulo: string };
  atual: number;
  formatarY: (v: number) => ReactNode;
  maxY: number;
  rotuloX: string;
}

const L = 320, A = 150, M = { e: 34, d: 12, t: 12, b: 26 };

function Grafico({ inteiro, titulo, valores, series, referencia, atual, formatarY, maxY, rotuloX }: PropsGrafico) {
  const [foco, setFoco] = useState<number | null>(null);
  const xs = valores.map((p) => p.v);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const sx = (v: number) => M.e + ((v - x0) / (x1 - x0 || 1)) * (L - M.e - M.d);
  const sy = (v: number) => A - M.b - (v / maxY) * (A - M.t - M.b);
  const ticksY = [0, maxY / 2, maxY];
  const aoMover = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * L;
    let melhor = 0;
    valores.forEach((p, i) => { if (Math.abs(sx(p.v) - x) < Math.abs(sx(valores[melhor].v) - x)) melhor = i; });
    setFoco(melhor);
  };
  const p = foco !== null ? valores[foco] : null;
  return (
    <figure className="grafico">
      <figcaption>
        {titulo}
        {series.length > 1 && (
          <span className="legenda-grafico">
            {series.map((s) => <span key={s.chave}><i style={{ background: s.cor }} />{s.rotulo}</span>)}
          </span>
        )}
      </figcaption>
      <div className="grafico-area">
        <svg viewBox={`0 0 ${L} ${A}`} onPointerMove={aoMover} onPointerLeave={() => setFoco(null)} role="img" aria-label={titulo}>
          {ticksY.map((t) => (
            <g key={t}>
              <line x1={M.e} x2={L - M.d} y1={sy(t)} y2={sy(t)} className="grade" />
              <text x={M.e - 6} y={sy(t) + 3} textAnchor="end" className="eixo">{formatarY(t)}</text>
            </g>
          ))}
          {[x0, (x0 + x1) / 2, x1].map((t) => (
            <text key={t} x={sx(t)} y={A - 8} textAnchor="middle" className="eixo">{inteiro ? Math.round(t) : t.toFixed(2)}</text>
          ))}
          {referencia && (
            <g>
              <line x1={M.e} x2={L - M.d} y1={sy(referencia.valor)} y2={sy(referencia.valor)} className="referencia" />
              <text x={M.e + 4} y={sy(referencia.valor) - 4} className="eixo">{referencia.rotulo}</text>
            </g>
          )}
          <line x1={sx(atual)} x2={sx(atual)} y1={M.t} y2={A - M.b} className="atual" />
          {series.map((s) => (
            <g key={s.chave}>
              <polyline fill="none" stroke={s.cor} strokeWidth="2" strokeLinejoin="round" points={valores.map((q) => `${sx(q.v)},${sy(q[s.chave])}`).join(' ')} />
              {series.length <= 4 && (
                <text x={sx(x1) - 2} y={sy(valores[valores.length - 1][s.chave]) - 6} textAnchor="end" className="rotulo-direto">{formatarY(valores[valores.length - 1][s.chave])}</text>
              )}
            </g>
          ))}
          {p && (
            <g>
              <line x1={sx(p.v)} x2={sx(p.v)} y1={M.t} y2={A - M.b} className="mira" />
              {series.map((s) => <circle key={s.chave} cx={sx(p.v)} cy={sy(p[s.chave])} r="4" fill={s.cor} stroke="var(--painel)" strokeWidth="2" />)}
            </g>
          )}
        </svg>
        {p && (
          <div className="dica" style={{ left: `${(sx(p.v) / L) * 100}%` }}>
            <strong className="mono">{rotuloX} = {p.v}</strong>
            {series.map((s) => <span key={s.chave}><i style={{ background: s.cor }} />{s.rotulo}: <b className="mono">{formatarY(p[s.chave])}</b></span>)}
          </div>
        )}
      </div>
    </figure>
  );
}

interface PropsGraficoSensibilidade {
  varredura: PontoVarredura[];
  atual: number;
  veiculos: number;
  rotuloX: string;
  inteiro: boolean;
}

export default function GraficoSensibilidade({ varredura, atual, veiculos, rotuloX, inteiro }: PropsGraficoSensibilidade) {
  const maxIds = Math.max(veiculos + 2, ...varredura.map((p) => Math.max(p.idsCriados, p.trocasId)));
  const teto = Math.ceil(maxIds / 5) * 5;
  const pontos = varredura.map((p) => ({ ...p, cobertura: p.cobertura * 100 }));
  return (
    <div className="graficos">
      <Grafico
        inteiro={inteiro}
        titulo="Identidades"
        valores={pontos}
        series={[
          { chave: 'idsCriados', rotulo: 'IDs criados', cor: '#3987e5' },
          { chave: 'trocasId', rotulo: 'Trocas de ID', cor: '#d95926' },
        ]}
        referencia={{ valor: veiculos, rotulo: `${veiculos} veículos reais` }}
        atual={atual}
        maxY={teto}
        formatarY={(v) => Math.round(v)}
        rotuloX={rotuloX}
      />
      <Grafico
        inteiro={inteiro}
        titulo="Cobertura da verdade de solo (%)"
        valores={pontos}
        series={[{ chave: 'cobertura', rotulo: 'Cobertura', cor: '#1baf7a' }]}
        atual={atual}
        maxY={100}
        formatarY={(v) => `${Math.round(v)}`}
        rotuloX={rotuloX}
      />
    </div>
  );
}
