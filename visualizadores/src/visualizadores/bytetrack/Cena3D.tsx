// Cena 3D do ByteTrack: solo com a via, oclusores físicos, veículos reais (verdade de solo)
// e as sobreposições de anotação (detecções e trilhas) desenhadas por cima, como na imagem do drone.
import { useMemo, type CSSProperties } from 'react';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { pxParaMundo, ESCALA } from '../../nucleo/Viewport3D.tsx';
import { LARGURA, ALTURA } from './cenarios.ts';
import { COR_ETAPA, corDoId } from './cores.ts';
import type { Caixa, Camadas, Cena, Cenario, GtNoQuadro, Instantaneo, Oclusor as DadosOclusor } from './tipos.ts';

type Ponto3 = [number, number, number];

interface Segmento {
  tipo: 'obs' | 'prev';
  pontos: Ponto3[];
  fim: number;
}

const PASSO_TEMPO = 0.025; // altura por quadro no modo espaço-tempo (240 quadros → 6 unidades)
const Y_ANOTACAO = 0.34;

function retangulo(caixa: Caixa, y: number): Ponto3[] {
  const [x1, z1] = pxParaMundo(caixa[0], caixa[1]);
  const [x2, z2] = pxParaMundo(caixa[2], caixa[3]);
  return [[x1, y, z1], [x2, y, z1], [x2, y, z2], [x1, y, z2], [x1, y, z1]];
}

interface PropsRetangulo {
  caixa: Caixa;
  y: number;
  cor: string;
  espessura?: number;
  tracejado?: boolean;
  opacidade?: number;
}

function Retangulo({ caixa, y, cor, espessura = 1.5, tracejado = false, opacidade = 1 }: PropsRetangulo) {
  return (
    <Line
      points={retangulo(caixa, y)}
      color={cor}
      lineWidth={espessura}
      dashed={tracejado}
      dashSize={0.06}
      gapSize={0.05}
      transparent
      opacity={opacidade}
      depthTest={false}
      renderOrder={10}
    />
  );
}

// Textura do solo desenhada em canvas: grama, asfalto e faixas.
function usarTexturaSolo(estrada: Cenario['estrada']) {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = LARGURA; c.height = ALTURA;
    const g = c.getContext('2d')!;
    g.fillStyle = '#56663f'; g.fillRect(0, 0, LARGURA, ALTURA);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(${30 + (i % 40)},${60 + (i % 50)},${20 + (i % 30)},0.25)`;
      g.fillRect((i * 97) % LARGURA, (i * 53) % ALTURA, 6, 6);
    }
    const via = (x: number, y: number, w: number, h: number) => { g.fillStyle = '#3b3c3f'; g.fillRect(x, y, w, h); };
    via(0, 272, LARGURA, 206);
    if (estrada === 'cruz') via(600, 0, 140, ALTURA);
    g.strokeStyle = '#e8e8e8'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 276); g.lineTo(LARGURA, 276); g.moveTo(0, 474); g.lineTo(LARGURA, 474); g.stroke();
    g.setLineDash([26, 22]); g.lineWidth = 2;
    for (const y of [323, 427]) { g.beginPath(); g.moveTo(0, y); g.lineTo(LARGURA, y); g.stroke(); }
    g.setLineDash([]); g.strokeStyle = '#e2b93b'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 373); g.lineTo(LARGURA, 373); g.moveTo(0, 379); g.lineTo(LARGURA, 379); g.stroke();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [estrada]);
}

function Solo({ estrada }: { estrada: Cenario['estrada'] }) {
  const textura = usarTexturaSolo(estrada);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[LARGURA * ESCALA, ALTURA * ESCALA]} />
      <meshStandardMaterial map={textura} roughness={0.95} />
    </mesh>
  );
}

function Oclusor({ o, raioX }: { o: DadosOclusor; raioX: boolean }) {
  const [x1, z1] = pxParaMundo(o.caixa[0], o.caixa[1]);
  const [x2, z2] = pxParaMundo(o.caixa[2], o.caixa[3]);
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, w = x2 - x1, d = z2 - z1;
  const mat = { transparent: true, opacity: raioX ? 0.18 : 1, depthWrite: !raioX };
  if (o.tipo === 'viaduto') {
    return (
      <group>
        <mesh position={[cx, 0.95, cz]}>
          <boxGeometry args={[w, 0.16, d]} />
          <meshStandardMaterial color="#9b958c" {...mat} />
        </mesh>
        {[z1 + 0.25, z2 - 0.25].map((z) => (
          <mesh key={z} position={[cx, 0.45, z]}>
            <boxGeometry args={[w * 0.5, 0.9, 0.22]} />
            <meshStandardMaterial color="#7d776f" {...mat} />
          </mesh>
        ))}
        <Html position={[cx, 1.15, z1]} center className="rotulo-3d">viaduto · oclusão total</Html>
      </group>
    );
  }
  const r = Math.min(w, d) / 2;
  const copas = [[0, 0, 1], [-0.45, 0.2, 0.7], [0.45, -0.15, 0.75], [0.1, 0.35, 0.65], [-0.2, -0.4, 0.6]];
  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.7, 8]} />
        <meshStandardMaterial color="#5a4330" {...mat} />
      </mesh>
      {copas.map(([dx, dz, s], i) => (
        <mesh key={i} position={[dx * r, 0.85 + s * 0.1, dz * r]}>
          <icosahedronGeometry args={[r * 0.7 * s, 1]} />
          <meshStandardMaterial color="#3d6b34" flatShading {...mat} opacity={raioX ? 0.14 : o.densidade + 0.2} transparent />
        </mesh>
      ))}
      <Html position={[0, 1.35, 0]} center className="rotulo-3d">copa · oclusão parcial</Html>
    </group>
  );
}

function Veiculo({ g }: { g: GtNoQuadro }) {
  const [x1, z1] = pxParaMundo(g.caixa[0], g.caixa[1]);
  const [x2, z2] = pxParaMundo(g.caixa[2], g.caixa[3]);
  const w = x2 - x1, d = z2 - z1;
  const horizontal = w >= d;
  return (
    <group position={[(x1 + x2) / 2, 0, (z1 + z2) / 2]}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[w * 0.96, 0.13, d * 0.9]} />
        <meshStandardMaterial color="#c7ccd4" metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <boxGeometry args={horizontal ? [w * 0.5, 0.09, d * 0.78] : [w * 0.78, 0.09, d * 0.5]} />
        <meshStandardMaterial color="#39414d" roughness={0.3} />
      </mesh>
    </group>
  );
}

function trajetorias(resultados: Instantaneo[], ate: number): Map<number, Segmento[]> {
  // Para cada tracker_id confirmado: segmentos contínuos observados e segmentos só previstos.
  const porId = new Map<number, Segmento[]>();
  for (let t = 0; t <= ate; t++) {
    for (const tr of resultados[t].trilhas) {
      if (tr.id < 0) continue;
      const [x, z] = pxParaMundo((tr.caixa[0] + tr.caixa[2]) / 2, (tr.caixa[1] + tr.caixa[3]) / 2);
      const tipo: Segmento['tipo'] = tr.semAtualizar === 0 ? 'obs' : 'prev';
      if (!porId.has(tr.id)) porId.set(tr.id, []);
      const segs = porId.get(tr.id)!;
      const ultimo = segs[segs.length - 1];
      const ponto: Ponto3 = [x, t * PASSO_TEMPO, z];
      if (!ultimo || ultimo.tipo !== tipo || ultimo.fim !== t - 1) {
        const novo: Segmento = { tipo, pontos: ultimo && ultimo.fim === t - 1 ? [ultimo.pontos[ultimo.pontos.length - 1]] : [], fim: t };
        segs.push(novo);
      }
      const seg = segs[segs.length - 1];
      seg.pontos.push(ponto);
      seg.fim = t;
    }
  }
  return porId;
}

function trajetoriasVerdade(verdade: GtNoQuadro[][], ate: number): Map<number, Ponto3[]> {
  const porId = new Map<number, Ponto3[]>();
  for (let t = 0; t <= ate; t++) {
    for (const g of verdade[t]) {
      const [x, z] = pxParaMundo((g.caixa[0] + g.caixa[2]) / 2, (g.caixa[1] + g.caixa[3]) / 2);
      if (!porId.has(g.id)) porId.set(g.id, []);
      porId.get(g.id)!.push([x, t * PASSO_TEMPO, z]);
    }
  }
  return porId;
}

// Passo a passo dentro de um quadro (curso): o que o rastreador sabe em cada momento.
export type FaseQuadro = 'previsao' | 'etapa1' | 'etapa2' | 'resultado';

const centro = (c: Caixa): [number, number] => pxParaMundo((c[0] + c[2]) / 2, (c[1] + c[3]) / 2);

// Mostra previsões e pares de uma fase: caixas previstas (tracejadas, cor do ID), detecções
// separadas em alta e baixa e um conector com o IoU para cada par aceito até a fase atual.
function CamadaFase({ res, fase, y, limiarAlta }: { res: Instantaneo; fase: Exclude<FaseQuadro, 'resultado'>; y: number; limiarAlta: number }) {
  const nascidas = new Set(res.log.novas.map((n) => n.trilha));
  const existentes = res.trilhas.filter((t) => !nascidas.has(t.interno));
  const porInterno = new Map(res.trilhas.map((t) => [t.interno, t]));
  const pares = [
    ...(fase !== 'previsao' ? res.log.etapa1.map((e) => ({ ...e, etapa: 1 as const })) : []),
    ...(fase === 'etapa2' ? res.log.etapa2.map((e) => ({ ...e, etapa: 2 as const })) : []),
  ];
  const usadas = new Set(pares.map((p) => p.det));
  return (
    <group>
      {existentes.map((t) => (
        <group key={`p${t.interno}`}>
          <Retangulo caixa={t.caixaPrevista} y={y + 0.01} cor={corDoId(t.id)} espessura={1.4} tracejado opacidade={0.9} />
          <Html position={[pxParaMundo(t.caixaPrevista[0], t.caixaPrevista[1])[0], y, pxParaMundo(t.caixaPrevista[0], t.caixaPrevista[1])[1]]} className="rotulo-trilha perdida" style={{ '--cor': corDoId(t.id) } as CSSProperties} zIndexRange={[20, 10]}>
            {t.id >= 0 ? `#${t.id}` : 'tent.'} <small>prevista</small>
          </Html>
        </group>
      ))}
      {res.deteccoes.map((d, i) => {
        const alta = d.score >= limiarAlta;
        const par = pares.find((p) => p.det === i);
        const cor = par ? COR_ETAPA[par.etapa] : alta ? COR_ETAPA[1] : COR_ETAPA.descartada;
        return <Retangulo key={`d${i}`} caixa={d.caixa} y={y} cor={cor} espessura={par || alta ? 1.6 : 1.2} tracejado={!alta} opacidade={usadas.has(i) || fase === 'previsao' ? 0.95 : 0.6} />;
      })}
      {pares.map((p) => {
        const t = porInterno.get(p.trilha);
        const d = res.deteccoes[p.det];
        if (!t || !d) return null;
        const [ax, az] = centro(t.caixaPrevista);
        const [bx, bz] = centro(d.caixa);
        return (
          <group key={`l${p.etapa}-${p.trilha}`}>
            <Line points={[[ax, y + 0.02, az], [bx, y + 0.02, bz]]} color={COR_ETAPA[p.etapa]} lineWidth={2.5} depthTest={false} renderOrder={12} />
            <Html position={[(ax + bx) / 2, y + 0.02, (az + bz) / 2]} center className="rotulo-iou" zIndexRange={[30, 20]}>
              IoU {p.iou.toFixed(2)}
            </Html>
          </group>
        );
      })}
    </group>
  );
}

interface PropsCena3D {
  cenario: Cenario;
  cena: Cena;
  resultados: Instantaneo[];
  quadro: number;
  camadas: Camadas;
  faseQuadro?: FaseQuadro;
  limiarAlta?: number;
  // Índice da detecção destacada pelo inspetor (curso).
  destaque?: number | null;
}

export default function Cena3D({ cenario, cena, resultados, quadro, camadas, faseQuadro = 'resultado', limiarAlta = 0.25, destaque = null }: PropsCena3D) {
  const res = resultados[quadro];
  const yAnot = camadas.espacoTempo ? quadro * PASSO_TEMPO + 0.02 : Y_ANOTACAO;
  const trajs = useMemo(() => (camadas.espacoTempo ? trajetorias(resultados, quadro) : null), [camadas.espacoTempo, resultados, quadro]);
  const trajsGt = useMemo(() => (camadas.espacoTempo && camadas.verdade ? trajetoriasVerdade(cena.verdade, quadro) : null), [camadas.espacoTempo, camadas.verdade, cena, quadro]);

  return (
    <group>
      <Solo estrada={cenario.estrada} />
      {cenario.oclusores.map((o, i) => <Oclusor key={i} o={o} raioX={camadas.raioX} />)}
      {camadas.verdade && cena.verdade[quadro].map((g) => <Veiculo key={g.id} g={g} />)}

      {camadas.descartadas && res.descartadas.map((d, i) => (
        <Retangulo key={`x${i}`} caixa={d.caixa} y={yAnot} cor={COR_ETAPA.detector} espessura={1} tracejado opacidade={0.7} />
      ))}

      {faseQuadro !== 'resultado' && <CamadaFase res={res} fase={faseQuadro} y={yAnot} limiarAlta={limiarAlta} />}

      {destaque !== null && res.deteccoes[destaque] && (
        <Retangulo caixa={res.deteccoes[destaque].caixa.map((v, k) => v + (k < 2 ? -9 : 9)) as Caixa} y={yAnot + 0.03} cor="#f08a24" espessura={3.5} />
      )}

      {faseQuadro === 'resultado' && camadas.deteccoes && res.deteccoes.map((d, i) => (
        <group key={`d${i}`}>
          <Retangulo
            caixa={d.caixa}
            y={yAnot}
            cor={d.etapa != null ? COR_ETAPA[d.etapa] : COR_ETAPA.descartada}
            espessura={d.etapa === 1 ? 1.6 : 1.3}
            tracejado={d.etapa !== 1}
            opacidade={d.etapa === 'descartada' ? 0.55 : 0.95}
          />
          {camadas.scores && (
            <Html position={[pxParaMundo(d.caixa[0], d.caixa[3])[0], yAnot, pxParaMundo(d.caixa[0], d.caixa[3])[1]]} className="rotulo-score" zIndexRange={[5, 0]}>
              {d.score.toFixed(2)}
            </Html>
          )}
        </group>
      ))}

      {faseQuadro === 'resultado' && camadas.trilhas && res.trilhas.map((t) => {
        const perdida = t.semAtualizar > 0;
        const cor = corDoId(t.id);
        const [lx, lz] = pxParaMundo(t.caixa[0], t.caixa[1]);
        return (
          <group key={`t${t.interno}`}>
            <Retangulo caixa={t.caixa.map((v, k) => v + (k < 2 ? -4 : 4)) as Caixa} y={yAnot + 0.01} cor={cor} espessura={t.id >= 0 ? 3 : 1.2} tracejado={perdida || t.id < 0} opacidade={perdida ? 0.8 : 1} />
            <Html position={[lx, yAnot, lz]} className={`rotulo-trilha ${perdida ? 'perdida' : ''}`} style={{ '--cor': cor } as CSSProperties} zIndexRange={[20, 10]}>
              {t.id >= 0 ? `#${t.id}` : 'tentativa'}
              {perdida && <small> perdida {t.semAtualizar}/{t.maxPerdido}</small>}
            </Html>
          </group>
        );
      })}

      {camadas.espacoTempo && (
        <group>
          <mesh position={[0, quadro * PASSO_TEMPO, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[LARGURA * ESCALA, ALTURA * ESCALA]} />
            <meshBasicMaterial color="#4772b3" transparent opacity={0.08} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          {trajsGt && [...trajsGt.entries()].map(([id, pts]) => pts.length > 1 && (
            <Line key={`g${id}`} points={pts} color="#9aa0a8" lineWidth={1} transparent opacity={0.5} />
          ))}
          {trajs && [...trajs.entries()].flatMap(([id, segs]) => segs.filter((s) => s.pontos.length > 1).map((s, i) => (
            <Line key={`s${id}-${i}`} points={s.pontos} color={corDoId(id)} lineWidth={s.tipo === 'obs' ? 3 : 1.5} dashed={s.tipo === 'prev'} dashSize={0.05} gapSize={0.05} />
          )))}
        </group>
      )}
    </group>
  );
}
