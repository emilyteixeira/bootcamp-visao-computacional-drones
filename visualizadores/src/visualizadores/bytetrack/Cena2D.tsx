// Vista 2D de topo em SVG: alternativa à cena 3D quando não há WebGL (ou o contexto é perdido)
// e opção de leitura mais simples. Mostra as mesmas camadas, exceto o modo espaço-tempo.
import type { ReactNode } from 'react';
import { ALTURA, LARGURA } from './cenarios.ts';
import { COR_ETAPA, corDoId } from './cores.ts';
import type { FaseQuadro } from './Cena3D.tsx';
import type { Caixa, Camadas, Cena, Cenario, Instantaneo } from './tipos.ts';

function Caixa2D({ c, cor, largura = 3, tracejado = false, opacidade = 1 }: { c: Caixa; cor: string; largura?: number; tracejado?: boolean; opacidade?: number }) {
  return (
    <rect x={c[0]} y={c[1]} width={Math.max(0, c[2] - c[0])} height={Math.max(0, c[3] - c[1])} fill="none" stroke={cor} strokeWidth={largura} strokeDasharray={tracejado ? '10 7' : undefined} opacity={opacidade} vectorEffect="non-scaling-stroke" />
  );
}

function Rotulo({ x, y, cor, children, contorno = false }: { x: number; y: number; cor: string; children: ReactNode; contorno?: boolean }) {
  return (
    <text x={x} y={y} className={`rotulo-2d ${contorno ? 'contorno' : ''}`} fill={contorno ? cor : '#111'} style={contorno ? undefined : { paintOrder: 'stroke', stroke: cor, strokeWidth: 14 }}>
      {children}
    </text>
  );
}

interface Props {
  cenario: Cenario;
  cena: Cena;
  resultados: Instantaneo[];
  quadro: number;
  camadas: Camadas;
  faseQuadro?: FaseQuadro;
  limiarAlta?: number;
  destaque?: number | null;
  rotulo?: string;
}

export default function Cena2D({ cenario, cena, resultados, quadro, camadas, faseQuadro = 'resultado', limiarAlta = 0.25, destaque = null, rotulo }: Props) {
  const res = resultados[quadro];
  const nascidas = new Set(res.log.novas.map((n) => n.trilha));
  const pares = [
    ...(faseQuadro === 'etapa1' || faseQuadro === 'etapa2' ? res.log.etapa1.map((e) => ({ ...e, etapa: 1 as const })) : []),
    ...(faseQuadro === 'etapa2' ? res.log.etapa2.map((e) => ({ ...e, etapa: 2 as const })) : []),
  ];
  const porInterno = new Map(res.trilhas.map((t) => [t.interno, t]));
  const centro = (c: Caixa) => [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2];
  const emFase = faseQuadro !== 'resultado';
  const descricao = `${rotulo ?? 'Vista 2D'}, quadro ${quadro}: ${res.deteccoes.length} detecções, ${res.trilhas.filter((t) => t.id >= 0).length} trilhas com ID.`;

  return (
    <svg className="cena-2d" viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="img" aria-label={descricao}>
      <rect width={LARGURA} height={ALTURA} fill="#56663f" />
      <rect x={0} y={272} width={LARGURA} height={206} fill="#3b3c3f" />
      {cenario.estrada === 'cruz' && <rect x={600} y={0} width={140} height={ALTURA} fill="#3b3c3f" />}
      <line x1={0} x2={LARGURA} y1={376} y2={376} stroke="#e2b93b" strokeWidth={5} />
      {[323, 427].map((y) => <line key={y} x1={0} x2={LARGURA} y1={y} y2={y} stroke="#e8e8e8" strokeWidth={2} strokeDasharray="26 22" />)}

      {cenario.oclusores.map((o, i) => (
        <g key={i} opacity={camadas.raioX ? 0.25 : 0.85}>
          {o.tipo === 'viaduto'
            ? <rect x={o.caixa[0]} y={o.caixa[1]} width={o.caixa[2] - o.caixa[0]} height={o.caixa[3] - o.caixa[1]} fill="#9b958c" />
            : <ellipse cx={(o.caixa[0] + o.caixa[2]) / 2} cy={(o.caixa[1] + o.caixa[3]) / 2} rx={(o.caixa[2] - o.caixa[0]) / 2} ry={(o.caixa[3] - o.caixa[1]) / 2} fill="#3d6b34" />}
          <text x={o.caixa[0] + 6} y={o.caixa[1] + 26} className="rotulo-2d contorno" fill="#eee">{o.tipo === 'viaduto' ? 'viaduto' : 'copa'}</text>
        </g>
      ))}

      {camadas.verdade && cena.verdade[quadro].map((g) => (
        <rect key={g.id} x={g.caixa[0]} y={g.caixa[1]} width={g.caixa[2] - g.caixa[0]} height={g.caixa[3] - g.caixa[1]} fill="#c7ccd4" opacity={camadas.raioX || g.visivel > 0.5 ? 0.9 : 0.35} rx={4} />
      ))}

      {camadas.descartadas && res.descartadas.map((d, i) => <Caixa2D key={`x${i}`} c={d.caixa} cor={COR_ETAPA.detector} largura={2} tracejado opacidade={0.7} />)}

      {emFase && res.trilhas.filter((t) => !nascidas.has(t.interno)).map((t) => (
        <g key={`p${t.interno}`}>
          <Caixa2D c={t.caixaPrevista} cor={corDoId(t.id)} largura={2} tracejado />
          <Rotulo x={t.caixaPrevista[0]} y={t.caixaPrevista[1] - 8} cor={corDoId(t.id)} contorno>{t.id >= 0 ? `#${t.id}` : 'tent.'} prevista</Rotulo>
        </g>
      ))}

      {(emFase || camadas.deteccoes) && res.deteccoes.map((d, i) => {
        const par = pares.find((p) => p.det === i);
        const cor = emFase ? (par ? COR_ETAPA[par.etapa] : d.score >= limiarAlta ? COR_ETAPA[1] : COR_ETAPA.descartada) : d.etapa != null ? COR_ETAPA[d.etapa] : COR_ETAPA.descartada;
        const tracejado = emFase ? d.score < limiarAlta : d.etapa !== 1;
        return (
          <g key={`d${i}`}>
            <Caixa2D c={d.caixa} cor={cor} largura={2.5} tracejado={tracejado} />
            {camadas.scores && <text x={d.caixa[0]} y={d.caixa[3] + 24} className="rotulo-2d contorno" fill="#ddd">{d.score.toFixed(2)}</text>}
          </g>
        );
      })}

      {pares.map((p) => {
        const t = porInterno.get(p.trilha);
        const d = res.deteccoes[p.det];
        if (!t || !d) return null;
        const [ax, ay] = centro(t.caixaPrevista);
        const [bx, by] = centro(d.caixa);
        return (
          <g key={`l${p.etapa}-${p.trilha}`}>
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke={COR_ETAPA[p.etapa]} strokeWidth={4} />
            <text x={(ax + bx) / 2} y={(ay + by) / 2 - 10} className="rotulo-2d contorno" fill="#fff">IoU {p.iou.toFixed(2)}</text>
          </g>
        );
      })}

      {!emFase && camadas.trilhas && res.trilhas.map((t) => {
        const perdida = t.semAtualizar > 0;
        const cor = corDoId(t.id);
        const c = t.caixa.map((v, k) => v + (k < 2 ? -5 : 5)) as Caixa;
        return (
          <g key={`t${t.interno}`}>
            <Caixa2D c={c} cor={cor} largura={t.id >= 0 ? 4 : 2} tracejado={perdida || t.id < 0} opacidade={perdida ? 0.8 : 1} />
            <Rotulo x={c[0]} y={c[1] - 8} cor={cor} contorno={perdida}>
              {t.id >= 0 ? `#${t.id}` : 'tentativa'}{perdida ? ` perdida ${t.semAtualizar}/${t.maxPerdido}` : ''}
            </Rotulo>
          </g>
        );
      })}

      {destaque !== null && res.deteccoes[destaque] && <Caixa2D c={res.deteccoes[destaque].caixa.map((v, k) => v + (k < 2 ? -10 : 10)) as Caixa} cor="#f08a24" largura={4} />}
    </svg>
  );
}
