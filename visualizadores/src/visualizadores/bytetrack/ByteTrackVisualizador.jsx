// Visualizador ByteTrack: cena 3D + linha do tempo + painéis didáticos.
import { useMemo, useRef, useState } from 'react';
import Viewport3D, { VISTAS } from '../../nucleo/Viewport3D.jsx';
import LinhaDoTempo from '../../nucleo/ui/LinhaDoTempo.jsx';
import { usarReproducao } from '../../nucleo/usarReproducao.js';
import { CENARIOS, gerarCena } from './cenarios.ts';
import { executar } from './bytetrack.ts';
import { avaliar } from './metricas.ts';
import { PREDEFINICOES } from './parametros.ts';
import { COR_ETAPA } from './cores.ts';
import Cena3D from './Cena3D.jsx';
import { PainelConceito, PainelImpacto, PainelParametros, PainelQuadro } from './Paineis.jsx';

const ABAS = [
  { id: 'parametros', rotulo: 'Parâmetros' },
  { id: 'quadro', rotulo: 'Etapas' },
  { id: 'impacto', rotulo: 'Impacto' },
  { id: 'conceito', rotulo: 'Conceito' },
];

const CAMADAS = [
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
  { cor: COR_ETAPA['sem-ativacao'], texto: 'Alta sem ativação', estilo: 'tracejado' },
];

function faixasEtapa2(resultados) {
  const faixas = [];
  let inicio = null;
  resultados.forEach((r, t) => {
    const tem = r.log.etapa2.some((e) => e.id >= 0);
    if (tem && inicio === null) inicio = t;
    if ((!tem || t === resultados.length - 1) && inicio !== null) {
      faixas.push({ chave: inicio, inicio, fim: tem ? t : t - 1, classe: 'etapa2', texto: 'Etapa 2 mantendo trilhas' });
      inicio = null;
    }
  });
  return faixas;
}

export default function ByteTrackVisualizador() {
  const [cenarioId, setCenarioId] = useState('oclusao');
  const [semente, setSemente] = useState(0);
  const [parametros, setParametros] = useState({ ...PREDEFINICOES[0].valores });
  const [aba, setAba] = useState('parametros');
  const [camadas, setCamadas] = useState({ verdade: true, deteccoes: true, trilhas: true, scores: false, descartadas: false, raioX: false, espacoTempo: false });
  const viewport = useRef();

  const cenario = CENARIOS[cenarioId];
  const cena = useMemo(() => gerarCena(cenario, cenario.semente + semente), [cenario, semente]);
  const resultados = useMemo(() => executar(cena, parametros), [cena, parametros]);
  const metricas = useMemo(() => avaliar(cena, resultados), [cena, resultados]);
  const rep = usarReproducao(cenario.quadros);
  const res = resultados[rep.quadro];

  const marcadores = useMemo(() => metricas.eventos.filter((e) => e.tipo === 'nova' || e.tipo === 'troca'), [metricas]);
  const faixas = useMemo(() => faixasEtapa2(resultados), [resultados]);

  const alternarCamada = (id) => {
    setCamadas((c) => ({ ...c, [id]: !c[id] }));
    if (id === 'espacoTempo' && !camadas.espacoTempo) viewport.current?.irPara('perspectiva');
  };

  const confirmadas = res.trilhas.filter((t) => t.id >= 0 && t.semAtualizar === 0).length;
  const perdidas = res.trilhas.filter((t) => t.id >= 0 && t.semAtualizar > 0).length;

  return (
    <div className="bt">
      <section className="bt-palco">
        <div className="bt-cabecalho">
          <div>
            <p className="rotulo">Rastreamento multiobjeto · ByteTrack</p>
            <h1>Cada caixa conta, até as fracas</h1>
          </div>
          <div className="segmentado" role="group" aria-label="Cenário">
            {Object.values(CENARIOS).map((c) => (
              <button key={c.id} type="button" className={c.id === cenarioId ? 'ativo' : ''} onClick={() => { setCenarioId(c.id); rep.irPara(0); }}>
                {c.titulo}
              </button>
            ))}
          </div>
        </div>
        <p className="bt-resumo">{cenario.resumo}</p>

        <div className="bt-viewport">
          <Viewport3D ref={viewport} vistaInicial="perspectiva">
            <Cena3D cenario={cenario} cena={cena} resultados={resultados} quadro={rep.quadro} camadas={camadas} />
          </Viewport3D>
          <div className="hud hud-topo">
            <span className="mono">Q {String(rep.quadro).padStart(3, '0')} · {(rep.quadro / 30).toFixed(2)} s</span>
            <span><b className="mono">{confirmadas}</b> ativas</span>
            <span><b className="mono">{perdidas}</b> perdidas</span>
            <span><b className="mono">{res.log.etapa2.length}</b> pela etapa 2</span>
          </div>
          <div className="hud hud-vistas" role="group" aria-label="Vistas da câmera">
            {Object.entries(VISTAS).map(([k, v]) => (
              <button key={k} type="button" onClick={() => viewport.current?.irPara(k)} title={`Tecla ${v.tecla}`}>
                <kbd>{v.tecla}</kbd> {v.rotulo}
              </button>
            ))}
          </div>
          <ul className="hud hud-legenda" aria-label="Legenda">
            {LEGENDA.map((l) => (
              <li key={l.texto}><i className={l.estilo} style={{ '--cor': l.cor }} />{l.texto}</li>
            ))}
            <li><i className="trilha" />Trilha (cor = ID)</li>
          </ul>
        </div>

        <div className="bt-transporte">
          <div className="botoes-transporte">
            <button type="button" onClick={() => rep.irPara(0)} aria-label="Início">⏮</button>
            <button type="button" onClick={() => { rep.setTocando(false); rep.irPara(rep.quadro - 1); }} aria-label="Quadro anterior">◀</button>
            <button type="button" className="play" onClick={() => rep.setTocando(!rep.tocando)} aria-label={rep.tocando ? 'Pausar' : 'Reproduzir'}>
              {rep.tocando ? '❚❚' : '▶'}
            </button>
            <button type="button" onClick={() => { rep.setTocando(false); rep.irPara(rep.quadro + 1); }} aria-label="Próximo quadro">▶</button>
            <select value={rep.velocidade} onChange={(e) => rep.setVelocidade(Number(e.target.value))} aria-label="Velocidade">
              {[0.1, 0.25, 0.5, 1].map((v) => <option key={v} value={v}>{v}×</option>)}
            </select>
            <button type="button" className="chip" onClick={() => setSemente((s) => s + 1)} title="Mesma cena, outro sorteio de ruído do detector">
              Novo ruído {semente > 0 && <span className="mono">+{semente}</span>}
            </button>
          </div>
          <LinhaDoTempo total={cenario.quadros} quadro={rep.quadro} irPara={(q) => { rep.setTocando(false); rep.irPara(q); }} marcadores={marcadores} faixas={faixas} />
          <p className="legenda-tempo">
            <span><i className="losango-mini nova" />ID confirmado</span>
            <span><i className="losango-mini troca" />Troca de ID</span>
            <span><i className="faixa-mini" />Etapa 2 em ação</span>
          </p>
        </div>

        <div className="camadas" role="group" aria-label="Camadas">
          {CAMADAS.map((c) => (
            <label key={c.id} className="alternador">
              <input type="checkbox" checked={camadas[c.id]} onChange={() => alternarCamada(c.id)} />
              {c.rotulo}
            </label>
          ))}
        </div>
      </section>

      <aside className="bt-painel">
        <div className="abas" role="tablist">
          {ABAS.map((a) => (
            <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} className={aba === a.id ? 'ativa' : ''} onClick={() => setAba(a.id)}>
              {a.rotulo}
            </button>
          ))}
        </div>
        {aba === 'parametros' && <PainelParametros parametros={parametros} setParametros={setParametros} />}
        {aba === 'quadro' && <PainelQuadro res={res} quadro={rep.quadro} parametros={parametros} />}
        {aba === 'impacto' && <PainelImpacto cena={cena} parametros={parametros} metricas={metricas} />}
        {aba === 'conceito' && <PainelConceito />}
      </aside>
    </div>
  );
}
