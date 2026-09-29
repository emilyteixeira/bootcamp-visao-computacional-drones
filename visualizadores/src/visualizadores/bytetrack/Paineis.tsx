// Painéis laterais do visualizador ByteTrack: parâmetros, quadro atual, impacto e conceito.
import { useMemo, useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import Controle from '../../nucleo/ui/Controle.tsx';
import { PARAMETROS, PREDEFINICOES, valoresVarredura } from './parametros.ts';
import { executar, quadrosMaximosPerdidos } from './bytetrack.ts';
import { avaliar } from './metricas.ts';
import GraficoSensibilidade from './GraficoSensibilidade.tsx';
import { COR_ETAPA, corDoId } from './cores.ts';
import { iou, type Caixa } from '../../nucleo/geometria.ts';
import type { Cena, ChaveParametro, Instantaneo, Metricas, ParametrosByteTrack } from './tipos.ts';

const fmt = (v: number, passo: number) => (passo >= 1 ? String(v) : v.toFixed(2));

interface PropsPainelParametros {
  parametros: ParametrosByteTrack;
  setParametros: Dispatch<SetStateAction<ParametrosByteTrack>>;
}

export function PainelParametros({ parametros, setParametros }: PropsPainelParametros) {
  const alterar = (chave: ChaveParametro, v: number) => setParametros((p) => ({ ...p, [chave]: v }));
  const ativa = PREDEFINICOES.find((pr) => Object.entries(pr.valores).every(([k, v]) => parametros[k as ChaveParametro] === v));
  const maxPerdido = quadrosMaximosPerdidos(parametros);
  const avisos: string[] = [];
  if (parametros.limiar_detector >= parametros.high_conf_det_threshold)
    avisos.push('Limiar do detector ≥ limiar alta × baixa: nenhuma detecção baixa chega ao tracker e a etapa 2 fica vazia.');
  if (parametros.track_activation_threshold <= parametros.high_conf_det_threshold)
    avisos.push('Score para nascer ≤ limiar alta × baixa: ele não filtra nada além da etapa 1.');
  if (parametros.frame_rate !== 30)
    avisos.push(`Vídeo real a 30 FPS, informado ${parametros.frame_rate} FPS: tolerância efetiva de ${maxPerdido} quadros (${(maxPerdido / 30).toFixed(2)} s).`);

  return (
    <div className="painel-secao">
      <p className="rotulo">Predefinições</p>
      <div className="predefinicoes">
        {PREDEFINICOES.map((pr) => (
          <button key={pr.id} type="button" className={`chip ${ativa?.id === pr.id ? 'ativo' : ''}`} onClick={() => setParametros({ ...pr.valores })} title={pr.descricao}>
            {pr.rotulo}
          </button>
        ))}
      </div>
      {ativa && <p className="nota">{ativa.descricao}</p>}
      {avisos.map((a) => <p key={a} className="aviso">{a}</p>)}
      <p className="nota mono">Buffer efetivo: {parametros.lost_track_buffer === 0 ? 'buffer 0 → 0 quadros' : `max(1, ⌈${parametros.frame_rate}/30 × ${parametros.lost_track_buffer}⌉) = ${maxPerdido} quadros`}</p>
      {PARAMETROS.map((m) => (
        <Controle
          key={m.chave}
          id={`p-${m.chave}`}
          rotulo={m.rotulo}
          codigo={m.codigo}
          valor={parametros[m.chave]}
          min={m.min}
          max={m.max}
          passo={m.passo}
          formatar={(v) => fmt(v, m.passo)}
          aoMudar={(v) => alterar(m.chave, v)}
        >
          <p className="controle-papel">{m.papel}</p>
          <dl className="efeitos">
            <dt>↑</dt><dd>{m.sobe}</dd>
            <dt>↓</dt><dd>{m.desce}</dd>
          </dl>
          <p className="controle-sv"><span>sv.ByteTrack</span> {m.sv}</p>
        </Controle>
      ))}
    </div>
  );
}

interface PropsPasso {
  n: string;
  titulo: string;
  cor?: string;
  contagem?: number;
  children?: ReactNode;
}

function Passo({ n, titulo, cor, contagem, children }: PropsPasso) {
  return (
    <li className="passo">
      <span className="passo-n" style={cor ? { background: cor } : undefined}>{n}</span>
      <div>
        <p className="passo-titulo">{titulo} {contagem !== undefined && <b className="mono">{contagem}</b>}</p>
        {children}
      </div>
    </li>
  );
}

const Id = ({ id }: { id: number }) => <span className="id-chip" style={{ '--cor': corDoId(id) } as CSSProperties}>{id >= 0 ? `#${id}` : 'tent.'}</span>;

export function PainelQuadro({ res, quadro, parametros }: { res: Instantaneo; quadro: number; parametros: ParametrosByteTrack }) {
  const { log } = res;
  const altas = res.deteccoes.filter((d) => d.score >= parametros.high_conf_det_threshold).length;
  const baixas = res.deteccoes.length - altas;
  const ativas = res.trilhas.filter((t) => t.semAtualizar === 0 && t.id >= 0).length;
  return (
    <div className="painel-secao">
      <p className="rotulo">Quadro {quadro} · {(quadro / 30).toFixed(2)} s</p>
      <ol className="pipeline">
        <Passo n="0" titulo="Detector entrega caixas" contagem={res.deteccoes.length + log.descartadasDetector}>
          <p>{log.descartadasDetector} abaixo de {parametros.limiar_detector.toFixed(2)} descartadas antes do tracker.</p>
        </Passo>
        <Passo n="1" titulo="Kalman prevê cada trilha">
          <p>A caixa prevista (não a última observada) é comparada às detecções.</p>
        </Passo>
        <Passo n="2" titulo="Separar por score">
          <p><b className="mono">{altas}</b> altas (≥ {parametros.high_conf_det_threshold.toFixed(2)}) · <b className="mono">{baixas}</b> baixas</p>
        </Passo>
        <Passo n="3" titulo="Etapa 1 · altas × todas as trilhas" cor={COR_ETAPA[1]} contagem={log.etapa1.length}>
          <ul className="pares">
            {log.etapa1.map((e) => <li key={e.trilha}><Id id={e.id ?? -1} /> ← score {e.score.toFixed(2)} · IoU {e.iou.toFixed(2)}{e.recuperada && <em> reencontrada</em>}</li>)}
          </ul>
        </Passo>
        <Passo n="4" titulo="Etapa 2 · baixas × trilhas livres da etapa 1" cor={COR_ETAPA[2]} contagem={log.etapa2.length}>
          <ul className="pares">
            {log.etapa2.map((e) => <li key={e.trilha}><Id id={e.id ?? -1} /> ← score {e.score.toFixed(2)} · IoU {e.iou.toFixed(2)}{e.recuperada && <em> reencontrada</em>}</li>)}
          </ul>
          {log.baixasSemPar.length > 0 && <p>{log.baixasSemPar.length} baixa(s) sem par ignoradas: baixa nunca cria trilha.</p>}
        </Passo>
        <Passo n="5" titulo="Trilhas sem par" contagem={log.perdidas.length + log.removidas.length}>
          <ul className="pares">
            {log.perdidas.map((e) => <li key={e.trilha}><Id id={e.id} /> perdida {e.semAtualizar}/{e.max} quadros</li>)}
            {log.removidas.map((e) => <li key={`r${e.trilha}`}><Id id={e.id} /> removida: {e.motivo}</li>)}
          </ul>
        </Passo>
        <Passo n="6" titulo="Nascimento e confirmação" cor={COR_ETAPA.nova} contagem={log.novas.length}>
          {log.altasSemAtivacao.length > 0 && <p>{log.altasSemAtivacao.length} alta(s) sem par abaixo de {parametros.track_activation_threshold.toFixed(2)}: não nascem.</p>}
          {log.novas.length > 0 && <p>{log.novas.length} tentativa(s) nova(s), com tracker_id −1 neste quadro. O ID sai numa associação seguinte, quando houver {Math.max(2, parametros.minimum_consecutive_frames)} quadro(s) seguido(s) com par (o nascimento conta como o 1º).</p>}
          {log.confirmadas.length > 0 && <p>Confirmado(s): {log.confirmadas.map((id) => <Id key={id} id={id} />)}</p>}
        </Passo>
      </ol>
      <p className="nota">Saída do quadro: {ativas} trilha(s) com tracker_id visível (o ID 0 é válido). Tentativas saem com tracker_id = −1 e são filtradas antes de anotar.</p>
    </div>
  );
}

type ChaveCartao = 'veiculos' | 'idsCriados' | 'trocasId' | 'cobertura' | 'falsosPositivos' | 'atrasoMedio';

interface Cartao {
  chave: ChaveCartao;
  rotulo: string;
  f: (v: number | null) => ReactNode;
  melhor?: 'perto' | 'menor' | 'maior';
}

const CARTOES: Cartao[] = [
  { chave: 'veiculos', rotulo: 'Veículos reais', f: (v) => v },
  { chave: 'idsCriados', rotulo: 'IDs criados', f: (v) => v, melhor: 'perto' },
  { chave: 'trocasId', rotulo: 'Trocas de ID', f: (v) => v, melhor: 'menor' },
  { chave: 'cobertura', rotulo: 'Cobertura', f: (v) => `${((v ?? 0) * 100).toFixed(1)}%`, melhor: 'maior' },
  { chave: 'falsosPositivos', rotulo: 'Caixas falsas', f: (v) => v, melhor: 'menor' },
  { chave: 'atrasoMedio', rotulo: 'Atraso do 1º ID', f: (v) => (v === null ? '—' : `${v.toFixed(1)} q`), melhor: 'menor' },
];

export function PainelImpacto({ cena, parametros, metricas }: { cena: Cena; parametros: ParametrosByteTrack; metricas: Metricas }) {
  const [paramVarrido, setParamVarrido] = useState<ChaveParametro>('lost_track_buffer');
  const [referencia, setReferencia] = useState<Metricas | null>(null);
  const meta = PARAMETROS.find((m) => m.chave === paramVarrido)!;
  const varredura = useMemo(
    () => valoresVarredura(meta).map((v) => ({ v, ...avaliar(cena, executar(cena, { ...parametros, [paramVarrido]: v })) })),
    [cena, parametros, paramVarrido, meta],
  );
  const delta = (c: Cartao) => {
    const atualV = metricas[c.chave];
    const refV = referencia?.[c.chave] ?? null;
    if (!referencia || c.chave === 'veiculos' || atualV === null || refV === null) return null;
    const d = atualV - refV;
    if (Math.abs(d) < 1e-9) return <small className="delta">=</small>;
    const bom = c.melhor === 'maior' ? d > 0 : c.melhor === 'menor' ? d < 0 : Math.abs(atualV - metricas.veiculos) < Math.abs(refV - metricas.veiculos);
    const txt = c.chave === 'cobertura' ? `${(d * 100).toFixed(1)} pp` : d.toFixed(c.chave === 'atrasoMedio' ? 1 : 0);
    return <small className={`delta ${bom ? 'bom' : 'ruim'}`}>{bom ? '▲' : '▼'} {d > 0 ? '+' : ''}{txt}</small>;
  };
  return (
    <div className="painel-secao">
      <div className="cartoes">
        {CARTOES.map((c) => (
          <div key={c.chave} className="cartao">
            <span>{c.rotulo}</span>
            <b className="mono">{c.f(metricas[c.chave])}</b>
            {delta(c)}
          </div>
        ))}
      </div>
      <div className="linha-acoes">
        <button type="button" className="chip" onClick={() => setReferencia(metricas)}>Fixar como referência</button>
        {referencia && <button type="button" className="chip" onClick={() => setReferencia(null)}>Limpar</button>}
      </div>
      <p className="nota">Casamento com a verdade de solo por IoU ≥ 0,3. Métricas simplificadas no espírito do CLEAR-MOT, só para comparar configurações nesta cena.</p>

      <label className="rotulo" htmlFor="varrer">Varrer um parâmetro (demais fixos)</label>
      <select id="varrer" value={paramVarrido} onChange={(e) => setParamVarrido(e.target.value as ChaveParametro)}>
        {PARAMETROS.map((m) => <option key={m.chave} value={m.chave}>{m.codigo === m.chave ? m.chave : m.rotulo}</option>)}
      </select>
      <GraficoSensibilidade varredura={varredura} atual={parametros[paramVarrido]} veiculos={metricas.veiculos} rotuloX={meta.chave} inteiro={meta.passo >= 1} />
      <p className="nota">{meta.papel}</p>
    </div>
  );
}

function DemoIou() {
  const [desloc, setDesloc] = useState(30);
  const a: Caixa = [20, 20, 100, 70];
  const b: Caixa = [20 + desloc, 30, 100 + desloc, 80];
  const v = iou(a, b);
  const inter = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
  return (
    <div className="demo-iou">
      <svg viewBox="0 0 220 100" role="img" aria-label={`IoU ${v.toFixed(2)}`}>
        {inter[2] > inter[0] && <rect x={inter[0]} y={inter[1]} width={inter[2] - inter[0]} height={inter[3] - inter[1]} fill="#ffb02e" opacity="0.45" />}
        <rect x={a[0]} y={a[1]} width={80} height={50} fill="none" stroke="#3987e5" strokeWidth="2" strokeDasharray="5 4" />
        <rect x={b[0]} y={b[1]} width={80} height={50} fill="none" stroke="#f4f4f4" strokeWidth="2" />
        <text x={a[0]} y={a[1] - 5} className="eixo">prevista</text>
        <text x={b[0] + 80} y={b[3] + 13} textAnchor="end" className="eixo">detecção</text>
      </svg>
      <Controle id="iou-desloc" rotulo="Deslocamento da detecção" valor={desloc} min={0} max={100} passo={1} aoMudar={setDesloc} formatar={(x) => `${x} px`}>
        <p className="controle-papel mono">IoU = interseção / união = {v.toFixed(2)}</p>
      </Controle>
    </div>
  );
}

export function PainelConceito() {
  return (
    <div className="painel-secao texto">
      <h3>A ideia do BYTE</h3>
      <p>Um detector devolve caixas com score. Filtrar as de score baixo antes do rastreamento joga fora objetos parcialmente ocluídos. O ByteTrack associa <b>todas</b> as caixas, em duas etapas no mesmo quadro:</p>
      <ol>
        <li><b style={{ color: COR_ETAPA[1] }}>Etapa 1</b>: caixas de score alto × todas as trilhas (ativas, perdidas e tentativas).</li>
        <li><b style={{ color: COR_ETAPA[2] }}>Etapa 2</b>: caixas de score baixo × todas as trilhas que sobraram da etapa 1 (ativas, perdidas e tentativas). Aqui a copa da árvore deixa de apagar o carro.</li>
        <li>Caixa baixa sem par é ignorada: <b>evidência fraca mantém, mas não cria</b> trilhas.</li>
        <li>Caixa alta sem par, com score ≥ ativação, abre uma <b style={{ color: COR_ETAPA.nova }}>tentativa</b> com tracker_id −1; o ID (a partir de 0) só aparece numa associação posterior, após a confirmação.</li>
      </ol>
      <h3>IoU: a medida de compatibilidade</h3>
      <DemoIou />
      <p>A comparação é entre a caixa <i>prevista</i> pelo filtro de Kalman e a detecção. Sem aparência: dois carros iguais em posições trocadas enganam o tracker.</p>
      <h3>Supervision × trackers</h3>
      <p>Os notebooks do projeto 3 usam <code>trackers.ByteTrackTracker</code> (trackers 2.6.1) e o Supervision 0.30.5 para <code>Detections</code>, anotadores e <code>LineZone</code>. O antigo <code>sv.ByteTrack</code> foi substituído pelo pacote <code>trackers</code>; cada controle mostra o nome equivalente na API antiga.</p>
      <h3>Atalhos (estilo Blender)</h3>
      <dl className="atalhos">
        <dt><kbd>Espaço</kbd></dt><dd>reproduzir / pausar</dd>
        <dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>quadro anterior / seguinte</dd>
        <dt><kbd>Shift</kbd>+<kbd>←</kbd></dt><dd>voltar ao início</dd>
        <dt><kbd>7</kbd> <kbd>1</kbd> <kbd>3</kbd> <kbd>0</kbd></dt><dd>vista topo, frente, direita, perspectiva</dd>
        <dt>arrastar</dt><dd>orbitar · botão direito move · roda aproxima</dd>
      </dl>
      <h3>Limites da simulação</h3>
      <p>Cenas e detector são sintéticos e determinísticos. As regras de associação e de ciclo de vida seguem o <code>trackers</code> 2.6.1 (conferidas contra o Python). Diferença mantida: o Kalman usa centro, largura e altura e congela o tamanho da caixa enquanto a trilha está perdida; o Python usa os cantos (XYXY) e deixa a caixa prevista encolher, o que em oclusões longas pode gerar IDs novos que aqui não aparecem. Sem compensação de movimento da câmera. Serve para intuição; os valores dos notebooks precisam ser validados no vídeo real.</p>
    </div>
  );
}
