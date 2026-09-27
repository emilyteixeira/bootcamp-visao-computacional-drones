// Casca da aula guiada: palco 3D (mesma cena do laboratório) + roteiro.
// O passo atual impõe cenário, parâmetros, quadro, camadas e vista; a pessoa pode explorar
// (tocar, arrastar a linha do tempo, ligar camadas, mover o parâmetro liberado) e tudo volta
// ao estado do passo quando ela navega. A cena é recalculada de forma determinística.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Viewport3D, { VISTAS, type ControleViewport, type NomeVista } from '../nucleo/Viewport3D.tsx';
import LinhaDoTempo from '../nucleo/ui/LinhaDoTempo.tsx';
import { usarReproducao } from '../nucleo/usarReproducao.ts';
import { CENARIOS, gerarCena } from '../visualizadores/bytetrack/cenarios.ts';
import { executar } from '../visualizadores/bytetrack/bytetrack.ts';
import { avaliar } from '../visualizadores/bytetrack/metricas.ts';
import { COR_ETAPA } from '../visualizadores/bytetrack/cores.ts';
import Cena3D from '../visualizadores/bytetrack/Cena3D.tsx';
import { PainelQuadro } from '../visualizadores/bytetrack/Paineis.tsx';
import type { Camadas } from '../visualizadores/bytetrack/tipos.ts';
import { parametrosDoPasso } from './cenaDoPasso.ts';
import IndiceCapitulos from './componentes/IndiceCapitulos.tsx';
import InspetorDetections from './componentes/InspetorDetections.tsx';
import PainelRoteiro from './componentes/PainelRoteiro.tsx';
import ResumoClipe from './componentes/ResumoClipe.tsx';
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

type EstadoAula = ReturnType<typeof usarAula>;

export default function AulaShell({ aula, estado }: { aula: Aula; estado: EstadoAula }) {
  const { passo, capitulo, prog } = estado;
  const alvo = passo.cena;
  const cenario = CENARIOS[alvo.cenario];

  // Exploração local, reiniciada a cada passo.
  const [parametros, setParametros] = useState(() => parametrosDoPasso(alvo));
  const [camadas, setCamadas] = useState<Camadas>({ ...SEM_CAMADAS, ...alvo.camadas });
  const viewport = useRef<ControleViewport>(null);
  const rep = usarReproducao(cenario.quadros, 30, false, alvo.quadro);

  useEffect(() => {
    setParametros(parametrosDoPasso(alvo));
    setCamadas({ ...SEM_CAMADAS, ...alvo.camadas });
    rep.setTocando(false);
    rep.irPara(alvo.quadro);
    if (alvo.vista) viewport.current?.irPara(alvo.vista);
    // Reage só à troca de passo: `alvo` e `rep` mudam de identidade a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo.id]);

  const cena = useMemo(() => gerarCena(cenario), [cenario]);
  const resultados = useMemo(() => executar(cena, parametros), [cena, parametros]);
  const metricas = useMemo(() => avaliar(cena, resultados), [cena, resultados]);
  const quadro = Math.min(rep.quadro, cenario.quadros - 1);
  const res = resultados[quadro];
  const marcadores = useMemo(() => metricas.eventos.filter((e) => e.tipo === 'nova' || e.tipo === 'troca'), [metricas]);

  const alterado = passo.parametroLivre && parametros[passo.parametroLivre] !== parametrosDoPasso(alvo)[passo.parametroLivre];

  const extras = (
    <>
      {passo.mostrarResumo && <ResumoClipe m={metricas} />}
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
        <div className="bt-viewport">
          <Viewport3D ref={viewport} vistaInicial={alvo.vista ?? 'perspectiva'}>
            <Cena3D cenario={cenario} cena={cena} resultados={resultados} quadro={quadro} camadas={camadas} />
          </Viewport3D>
          <div className="hud hud-topo">
            <span className="mono">Q {String(quadro).padStart(3, '0')} · {(quadro / 30).toFixed(2)} s</span>
            {quadro !== alvo.quadro && <span>quadro do passo: <b className="mono">{alvo.quadro}</b></span>}
            {alterado && <span className="hud-alterado">parâmetro alterado neste passo</span>}
          </div>
          <div className="hud hud-vistas" role="group" aria-label="Vistas da câmera">
            {(Object.entries(VISTAS) as [NomeVista, (typeof VISTAS)[NomeVista]][]).map(([k, v]) => (
              <button key={k} type="button" onClick={() => viewport.current?.irPara(k)} title={`Tecla ${v.tecla}`}>
                <kbd>{v.tecla}</kbd> {v.rotulo}
              </button>
            ))}
          </div>
          <ul className="hud hud-legenda" aria-label="Legenda">
            {LEGENDA.map((l) => (
              <li key={l.texto}><i className={l.estilo} style={{ '--cor': l.cor } as CSSProperties} />{l.texto}</li>
            ))}
            <li><i className="trilha" />Trilha (cor = ID)</li>
          </ul>
        </div>

        <div className="bt-transporte">
          <div className="botoes-transporte">
            <button type="button" onClick={() => { rep.setTocando(false); rep.irPara(alvo.quadro); }} title="Voltar ao quadro deste passo">
              ⟲ Quadro {alvo.quadro}
            </button>
            <button type="button" onClick={() => { rep.setTocando(false); rep.irPara(quadro - 1); }} aria-label="Quadro anterior">◀</button>
            <button type="button" className="play" onClick={() => rep.setTocando(!rep.tocando)} aria-label={rep.tocando ? 'Pausar' : 'Reproduzir'}>
              {rep.tocando ? '❚❚' : '▶'}
            </button>
            <button type="button" onClick={() => { rep.setTocando(false); rep.irPara(quadro + 1); }} aria-label="Próximo quadro">▶</button>
            <select value={rep.velocidade} onChange={(e) => rep.setVelocidade(Number(e.target.value))} aria-label="Velocidade">
              {[0.1, 0.25, 0.5, 1].map((v) => <option key={v} value={v}>{v}×</option>)}
            </select>
            <a className="chip" href="#bytetrack">Abrir o laboratório livre</a>
          </div>
          <LinhaDoTempo total={cenario.quadros} quadro={quadro} irPara={(q) => { rep.setTocando(false); rep.irPara(q); }} marcadores={marcadores} />
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
          parametros={parametros}
          aoMudarParametro={(v) => passo.parametroLivre && setParametros((p) => ({ ...p, [passo.parametroLivre!]: v }))}
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
