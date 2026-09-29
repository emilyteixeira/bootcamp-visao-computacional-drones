// Casca da aula guiada: palco 3D (mesma cena do laboratório) + roteiro.
// O passo atual impõe cenário, parâmetros, quadro, camadas e vista; a pessoa pode explorar
// (tocar, arrastar a linha do tempo, ligar camadas, mover o parâmetro liberado) e tudo volta
// ao estado do passo quando ela navega. A cena é recalculada de forma determinística.
// Em passos com comparação, o palco mostra A e B lado a lado: mesmas detecções, mesmo quadro,
// mesmas camadas e câmeras sincronizadas; só um parâmetro muda.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Viewport3D, { VISTAS, type ControleViewport, type NomeVista, type Vetor3 } from '../nucleo/Viewport3D.tsx';
import LinhaDoTempo from '../nucleo/ui/LinhaDoTempo.tsx';
import { usarReproducao } from '../nucleo/usarReproducao.ts';
import { gerarCena } from '../visualizadores/bytetrack/cenarios.ts';
import { executar } from '../visualizadores/bytetrack/bytetrack.ts';
import { avaliar } from '../visualizadores/bytetrack/metricas.ts';
import { COR_ETAPA } from '../visualizadores/bytetrack/cores.ts';
import Cena3D, { type FaseQuadro } from '../visualizadores/bytetrack/Cena3D.tsx';
import { PainelQuadro } from '../visualizadores/bytetrack/Paineis.tsx';
import type { Camadas, Instantaneo, Metricas, ParametrosByteTrack } from '../visualizadores/bytetrack/tipos.ts';
import { cenarioDoCurso, parametrosB, parametrosDoPasso } from './cenaDoPasso.ts';
import AssociacaoManual from './componentes/AssociacaoManual.tsx';
import IndiceCapitulos from './componentes/IndiceCapitulos.tsx';
import InspetorDetections from './componentes/InspetorDetections.tsx';
import LinhaDeEstados from './componentes/LinhaDeEstados.tsx';
import PainelRoteiro from './componentes/PainelRoteiro.tsx';
import ResumoClipe from './componentes/ResumoClipe.tsx';
import ResumoComparacao from './componentes/ResumoComparacao.tsx';
import type { Aula } from './tipos.ts';
import type { usarAula } from './usarAula.ts';

const SEM_CAMADAS: Camadas = { verdade: false, deteccoes: false, trilhas: false, scores: false, descartadas: false, raioX: false, espacoTempo: false };

const CAMADAS: { id: keyof Camadas; rotulo: string }[] = [
  { id: 'verdade', rotulo: 'Veículos reais' },
  { id: 'deteccoes', rotulo: 'Detecções' },
  { id: 'trilhas', rotulo: 'Trilhas' },
  { id: 'scores', rotulo: 'Scores' },
  { id: 'descartadas', rotulo: 'Abaixo do detector' },
  { id: 'raioX', rotulo: 'Raio-X oclusores' },
  { id: 'espacoTempo', rotulo: 'Espaço-tempo (t ↑)' },
];

const LEGENDA = [
  { cor: COR_ETAPA[1], texto: 'Etapa 1 · alta', estilo: 'solido' },
  { cor: COR_ETAPA[2], texto: 'Etapa 2 · baixa', estilo: 'tracejado' },
  { cor: COR_ETAPA.nova, texto: 'Nova tentativa', estilo: 'tracejado' },
  { cor: COR_ETAPA.descartada, texto: 'Baixa sem par', estilo: 'tracejado' },
];

const FASES: { id: FaseQuadro; rotulo: string; explicacao: string }[] = [
  { id: 'previsao', rotulo: '1 · Previsão', explicacao: 'Caixas tracejadas: onde o Kalman prevê cada trilha. Detecções separadas em alta (sólidas) e baixa (tracejadas cinza).' },
  { id: 'etapa1', rotulo: '2 · Etapa 1', explicacao: 'Pares aceitos entre previsões e detecções ALTAS, com o IoU de cada par.' },
  { id: 'etapa2', rotulo: '3 · Etapa 2', explicacao: 'Trilhas que sobraram × detecções BAIXAS. Os pares laranja são a contribuição do BYTE.' },
  { id: 'resultado', rotulo: '4 · Resultado', explicacao: 'Estado depois do quadro: IDs, trilhas perdidas e novas tentativas.' },
];

type EstadoAula = ReturnType<typeof usarAula>;

interface Lado {
  chave: 'A' | 'B';
  rotulo: string;
  parametros: ParametrosByteTrack;
  resultados: Instantaneo[];
  metricas: Metricas;
}

export default function AulaShell({ aula, estado }: { aula: Aula; estado: EstadoAula }) {
  const { passo, capitulo, prog } = estado;
  const alvo = passo.cena;
  const cenario = cenarioDoCurso(alvo.cenario);
  const comp = passo.comparacao;

  // Exploração local, reiniciada a cada passo. Com comparação, o parâmetro livre altera B.
  const [parametros, setParametros] = useState(() => parametrosDoPasso(alvo));
  const [paramsB, setParamsB] = useState(() => (comp ? parametrosB(alvo, comp) : null));
  const [camadas, setCamadas] = useState<Camadas>({ ...SEM_CAMADAS, ...alvo.camadas });
  const [fase, setFase] = useState<FaseQuadro>('resultado');
  const [animando, setAnimando] = useState(false);
  const vpA = useRef<ControleViewport>(null);
  const vpB = useRef<ControleViewport>(null);
  const rep = usarReproducao(cenario.quadros, 30, false, alvo.quadro);

  useEffect(() => {
    setParametros(parametrosDoPasso(alvo));
    setParamsB(comp ? parametrosB(alvo, comp) : null);
    setCamadas({ ...SEM_CAMADAS, ...alvo.camadas });
    setFase('resultado');
    setAnimando(false);
    rep.setTocando(false);
    rep.irPara(alvo.quadro);
    if (alvo.vista) vpA.current?.irPara(alvo.vista);
    // Reage só à troca de passo: `alvo` e `rep` mudam de identidade a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo.id]);

  // Animação das fases do quadro: avança uma fase a cada 1,4 s e para no resultado.
  useEffect(() => {
    if (!animando) return;
    if (fase === 'resultado') { setAnimando(false); return; }
    const id = window.setTimeout(() => setFase(FASES[FASES.findIndex((f) => f.id === fase) + 1].id), 1400);
    return () => window.clearTimeout(id);
  }, [animando, fase]);

  const cena = useMemo(() => gerarCena(cenario), [cenario]);
  const resA = useMemo(() => executar(cena, parametros), [cena, parametros]);
  const metA = useMemo(() => avaliar(cena, resA), [cena, resA]);
  const resB = useMemo(() => (paramsB ? executar(cena, paramsB) : null), [cena, paramsB]);
  const metB = useMemo(() => (resB ? avaliar(cena, resB) : null), [cena, resB]);

  const lados: Lado[] = [{ chave: 'A', rotulo: comp?.rotuloA ?? '', parametros, resultados: resA, metricas: metA }];
  if (comp && paramsB && resB && metB) lados.push({ chave: 'B', rotulo: comp.rotuloB, parametros: paramsB, resultados: resB, metricas: metB });

  const quadro = Math.min(rep.quadro, cenario.quadros - 1);
  const res = resA[quadro];
  const marcadores = useMemo(() => metA.eventos.filter((e) => e.tipo === 'nova' || e.tipo === 'troca'), [metA]);

  const livre = passo.parametroLivre;
  const alvoLivre = comp && paramsB ? paramsB : parametros;
  const referenciaLivre = comp ? parametrosB(alvo, comp) : parametrosDoPasso(alvo);
  const alterado = livre && alvoLivre[livre] !== referenciaLivre[livre];
  const mudarLivre = (v: number) => {
    if (!livre) return;
    if (comp) setParamsB((p) => (p ? { ...p, [livre]: v } : p));
    else setParametros((p) => ({ ...p, [livre]: v }));
  };

  const sincronizar = (destino: typeof vpA) => (pos: Vetor3, alvoCam: Vetor3) => destino.current?.definirCamera(pos, alvoCam);
  const irQuadro = (q: number) => { rep.setTocando(false); rep.irPara(q); };

  const extras = (
    <>
      {passo.associacaoManual && (
        <AssociacaoManual
          resA={resA[passo.associacaoManual.quadroA]}
          resB={resA[passo.associacaoManual.quadroB]}
          quadroA={passo.associacaoManual.quadroA}
          quadroB={passo.associacaoManual.quadroB}
        />
      )}
      {comp && metB && <ResumoComparacao a={metA} b={metB} rotuloA={comp.rotuloA} rotuloB={comp.rotuloB} />}
      {!comp && passo.mostrarResumo && <ResumoClipe m={metA} />}
      {passo.mostrarEstados && <LinhaDeEstados resultados={resA} quadro={quadro} irPara={irQuadro} />}
      {passo.mostrarDeteccoes && (
        <details className="extra" open>
          <summary>Detecções do quadro {quadro}</summary>
          <InspetorDetections res={res} />
        </details>
      )}
      {passo.mostrarEtapas && (
        <details className="extra" open>
          <summary>Etapas do quadro {quadro}</summary>
          <PainelQuadro res={res} quadro={quadro} parametros={parametros} />
        </details>
      )}
    </>
  );

  return (
    <div className="bt aula">
      <section className="bt-palco">
        <p className="bt-resumo">
          <strong>{cenario.titulo}.</strong> {cenario.resumo}
        </p>
        <div className={`palco-lados ${lados.length > 1 ? 'ab' : ''}`}>
          {lados.map((l) => {
            const r = l.resultados[quadro];
            return (
              <div key={l.chave} className="bt-viewport">
                <Viewport3D
                  ref={l.chave === 'A' ? vpA : vpB}
                  vistaInicial={alvo.vista ?? 'perspectiva'}
                  atalhos={l.chave === 'A'}
                  aoMoverCamera={lados.length > 1 ? sincronizar(l.chave === 'A' ? vpB : vpA) : undefined}
                  rotulo={`Cena 3D${lados.length > 1 ? ` ${l.chave}: ${l.rotulo}` : ''}, quadro ${quadro}`}
                >
                  <Cena3D cenario={cenario} cena={cena} resultados={l.resultados} quadro={quadro} camadas={camadas} faseQuadro={fase} limiarAlta={l.parametros.high_conf_det_threshold} />
                </Viewport3D>
                <div className="hud hud-topo">
                  {lados.length > 1 && <span className={`selo-ab ${l.chave === 'B' ? 'b' : ''}`}>{l.chave}</span>}
                  {lados.length > 1 && <span>{l.rotulo}</span>}
                  <span className="mono">Q {String(quadro).padStart(3, '0')} · {(quadro / 30).toFixed(2)} s</span>
                  {lados.length > 1 && <span><b className="mono">{r.trilhas.filter((t) => t.id >= 0 && t.semAtualizar === 0).length}</b> IDs visíveis</span>}
                  {lados.length === 1 && quadro !== alvo.quadro && <span>quadro do passo: <b className="mono">{alvo.quadro}</b></span>}
                  {alterado && (l.chave === 'B' || lados.length === 1) && <span className="hud-alterado">parâmetro alterado</span>}
                </div>
                {l.chave === 'A' && (
                  <div className="hud hud-vistas" role="group" aria-label="Vistas da câmera">
                    {(Object.entries(VISTAS) as [NomeVista, (typeof VISTAS)[NomeVista]][]).map(([k, v]) => (
                      <button key={k} type="button" onClick={() => vpA.current?.irPara(k)} title={`Tecla ${v.tecla}`}>
                        <kbd>{v.tecla}</kbd> {v.rotulo}
                      </button>
                    ))}
                  </div>
                )}
                {lados.length === 1 && (
                  <ul className="hud hud-legenda" aria-label="Legenda">
                    {LEGENDA.map((lg) => (
                      <li key={lg.texto}><i className={lg.estilo} style={{ '--cor': lg.cor } as CSSProperties} />{lg.texto}</li>
                    ))}
                    <li><i className="trilha" />Trilha (cor = ID)</li>
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {passo.faseQuadro && (
          <div className="fases-quadro" role="group" aria-label="Passo a passo do quadro">
            <span className="rotulo">Passo a passo do quadro {quadro}</span>
            <div className="segmentado">
              {FASES.map((f) => (
                <button key={f.id} type="button" className={fase === f.id ? 'ativo' : ''} aria-pressed={fase === f.id} onClick={() => { setAnimando(false); setFase(f.id); }}>
                  {f.rotulo}
                </button>
              ))}
            </div>
            <button type="button" className="chip" onClick={() => { setFase('previsao'); setAnimando(true); }}>▶ Animar as fases</button>
            <p className="nota" aria-live="polite">{FASES.find((f) => f.id === fase)!.explicacao}</p>
          </div>
        )}

        <div className="bt-transporte">
          <div className="botoes-transporte">
            <button type="button" onClick={() => irQuadro(alvo.quadro)} title="Voltar ao quadro deste passo">⟲ Quadro {alvo.quadro}</button>
            <button type="button" onClick={() => irQuadro(quadro - 1)} aria-label="Quadro anterior">◀</button>
            <button type="button" className="play" onClick={() => rep.setTocando(!rep.tocando)} aria-label={rep.tocando ? 'Pausar' : 'Reproduzir'}>
              {rep.tocando ? '❚❚' : '▶'}
            </button>
            <button type="button" onClick={() => irQuadro(quadro + 1)} aria-label="Próximo quadro">▶</button>
            <select value={rep.velocidade} onChange={(e) => rep.setVelocidade(Number(e.target.value))} aria-label="Velocidade">
              {[0.1, 0.25, 0.5, 1].map((v) => <option key={v} value={v}>{v}×</option>)}
            </select>
            <a className="chip" href="#bytetrack">Abrir o laboratório livre</a>
          </div>
          <LinhaDoTempo total={cenario.quadros} quadro={quadro} irPara={irQuadro} marcadores={marcadores} />
        </div>

        <div className="camadas" role="group" aria-label="Camadas">
          {CAMADAS.map((c) => (
            <label key={c.id} className="alternador">
              <input type="checkbox" checked={camadas[c.id]} onChange={() => setCamadas((k) => ({ ...k, [c.id]: !k[c.id] }))} />
              {c.rotulo}
            </label>
          ))}
        </div>
      </section>

      <aside className="bt-painel">
        <details className="indice-aula">
          <summary>Índice da aula</summary>
          <IndiceCapitulos aula={aula} prog={prog} aoIr={estado.ir} />
        </details>
        <PainelRoteiro
          aula={aula}
          capitulo={capitulo}
          passo={passo}
          prog={prog}
          parametros={alvoLivre}
          aoMudarParametro={mudarLivre}
          aoEscolher={estado.escolher}
          aoVoltar={estado.voltar}
          aoAvancar={estado.avancar}
          temAnterior={estado.temAnterior}
          temProximo={estado.temProximo}
          extras={extras}
        />
      </aside>
    </div>
  );
}
