// Tabela das detecções do quadro que chegaram ao rastreador, como linhas de um sv.Detections.
// Passar o mouse, focar ou clicar numa linha destaca a mesma caixa na cena 3D (laranja).
// O formato da caixa e a máscara booleana são só de leitura: não mudam o rastreador.
import { useState } from 'react';
import type { Caixa } from '../../nucleo/geometria.ts';
import type { EtapaDeteccao, Instantaneo } from '../../visualizadores/bytetrack/tipos.ts';

const DESTINO: Record<string, string> = {
  1: 'etapa 1',
  2: 'etapa 2',
  nova: 'nova tentativa',
  descartada: 'baixa sem par',
  'sem-ativacao': 'alta sem ativação',
};
const destino = (e: EtapaDeteccao) => (e == null ? '—' : DESTINO[String(e)]);

type Formato = 'xyxy' | 'xywh' | 'cxcywh';
const FORMATOS: { id: Formato; formula: string }[] = [
  { id: 'xyxy', formula: '(x1, y1, x2, y2)' },
  { id: 'xywh', formula: '(x1, y1, w, h) = sv.xyxy_to_xywh(xyxy)' },
  { id: 'cxcywh', formula: '(cx, cy, w, h), com cx = (x1 + x2) / 2' },
];

function converter(c: Caixa, f: Formato): number[] {
  const w = c[2] - c[0], h = c[3] - c[1];
  if (f === 'xywh') return [c[0], c[1], w, h];
  if (f === 'cxcywh') return [c[0] + w / 2, c[1] + h / 2, w, h];
  return c;
}

interface Props {
  res: Instantaneo;
  destaque?: number | null;
  aoDestacar?: (i: number | null) => void;
}

export default function InspetorDetections({ res, destaque = null, aoDestacar }: Props) {
  const [formato, setFormato] = useState<Formato>('xyxy');
  const [limiar, setLimiar] = useState(0.35);
  const mantidas = res.deteccoes.filter((d) => d.score >= limiar).length;
  const f = FORMATOS.find((x) => x.id === formato)!;

  return (
    <div className="inspetor">
      <div className="inspetor-controles">
        <div className="segmentado" role="group" aria-label="Formato da caixa">
          {FORMATOS.map((x) => (
            <button key={x.id} type="button" className={formato === x.id ? 'ativo' : ''} aria-pressed={formato === x.id} onClick={() => setFormato(x.id)}>{x.id}</button>
          ))}
        </div>
        <code className="inspetor-formula">{f.formula}</code>
      </div>
      <table>
        <caption>Detecções que entraram no <code>update()</code> neste quadro · passe o mouse ou foque uma linha para destacá-la na cena</caption>
        <thead>
          <tr>
            <th scope="col">i</th>
            <th scope="col">{formato} (px)</th>
            <th scope="col">confidence</th>
            <th scope="col">class_name</th>
            <th scope="col">destino</th>
            <th scope="col">tracker_id</th>
          </tr>
        </thead>
        <tbody onMouseLeave={() => aoDestacar?.(null)}>
          {res.deteccoes.map((d, i) => (
            <tr
              key={i}
              tabIndex={0}
              aria-selected={destaque === i}
              className={`${destaque === i ? 'destacada' : ''} ${d.score < limiar ? 'fora-mascara' : ''}`}
              onMouseEnter={() => aoDestacar?.(i)}
              onFocus={() => aoDestacar?.(i)}
              onBlur={() => aoDestacar?.(null)}
            >
              <td className="mono">{i}</td>
              <td className="mono">{converter(d.caixa, formato).map((v) => Math.round(v)).join(', ')}</td>
              <td className="mono">{d.score.toFixed(2)}</td>
              <td>car</td>
              <td>{destino(d.etapa)}</td>
              <td className="mono">{d.id ?? -1}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <label className="inspetor-mascara">
        <span className="mono">mascara = deteccoes.confidence &gt;= {limiar.toFixed(2)}</span>
        <input type="range" min={0.05} max={0.95} step={0.05} value={limiar} onChange={(e) => setLimiar(Number(e.target.value))} aria-label="Limiar da máscara de exemplo" />
        <span className="mono">len(deteccoes[mascara]) = {mantidas} de {res.deteccoes.length}</span>
      </label>
      <p className="nota">A máscara acima é só uma consulta aos dados, como no notebook 01 (célula 22): as linhas apagadas ficariam de fora, mas o rastreador deste quadro já as recebeu. Cena simulada com uma única classe.</p>
      {res.descartadas.length > 0 && <p className="nota">{res.descartadas.length} caixa(s) abaixo do limiar do detector não chegaram ao rastreador.</p>}
    </div>
  );
}
