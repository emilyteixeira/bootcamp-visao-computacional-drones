// Exercício do capítulo 1: ligar cada caixa de um quadro a uma caixa do quadro anterior,
// antes de ver os IDs. A resposta certa vem da verdade de solo; a do rastreador, dos tracker_id.
import { useState } from 'react';
import type { Instantaneo } from '../../visualizadores/bytetrack/tipos.ts';

const LETRAS = 'ABCDEFGHIJ';
const NENHUMA = 'nenhuma';

function Quadro({ titulo, res, rotulo }: { titulo: string; res: Instantaneo; rotulo: (i: number) => string }) {
  return (
    <figure className="manual-quadro">
      <figcaption>{titulo}</figcaption>
      <svg viewBox="0 225 1280 280" role="img" aria-label={`${titulo}: ${res.deteccoes.length} caixas`}>
        <rect x={0} y={272} width={1280} height={206} fill="#3b3c3f" />
        {res.deteccoes.map((d, i) => {
          // Rótulos alternados acima/abaixo da caixa para não se sobreporem em carros vizinhos.
          const acima = i % 2 === 0;
          return (
            <g key={i}>
              <rect x={d.caixa[0]} y={d.caixa[1]} width={d.caixa[2] - d.caixa[0]} height={d.caixa[3] - d.caixa[1]} fill="none" stroke="#f4f4f4" strokeWidth={5} strokeDasharray={d.score < 0.25 ? '12 8' : undefined} />
              <text x={(d.caixa[0] + d.caixa[2]) / 2} y={acima ? d.caixa[1] - 10 : d.caixa[3] + 44} textAnchor="middle" className="manual-rotulo">{rotulo(i)}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

interface Props {
  resA: Instantaneo;
  resB: Instantaneo;
  quadroA: number;
  quadroB: number;
}

export default function AssociacaoManual({ resA, resB, quadroA, quadroB }: Props) {
  const [escolhas, setEscolhas] = useState<Record<number, string>>({});
  const [conferido, setConferido] = useState(false);
  const letra = (i: number) => LETRAS[i];
  const certa = (j: number) => {
    const g = resB.deteccoes[j].gtId;
    const i = g == null ? -1 : resA.deteccoes.findIndex((d) => d.gtId === g);
    return i < 0 ? NENHUMA : letra(i);
  };
  const doRastreador = (j: number) => {
    const id = resB.deteccoes[j].id ?? -1;
    const i = id < 0 ? -1 : resA.deteccoes.findIndex((d) => d.id === id);
    return i < 0 ? NENHUMA : letra(i);
  };
  const completo = resB.deteccoes.every((_, j) => escolhas[j]);
  const acertos = resB.deteccoes.filter((_, j) => escolhas[j] === certa(j)).length;

  return (
    <div className="manual">
      <Quadro titulo={`Quadro ${quadroA}`} res={resA} rotulo={letra} />
      <Quadro titulo={`Quadro ${quadroB}`} res={resB} rotulo={(j) => String(j + 1)} />
      <table>
        <caption>Para cada caixa do quadro {quadroB}, escolha a caixa do quadro {quadroA} que é o mesmo objeto.</caption>
        <thead>
          <tr><th scope="col">Caixa</th><th scope="col">Sua escolha</th>{conferido && <><th scope="col">Real</th><th scope="col">Rastreador</th></>}</tr>
        </thead>
        <tbody>
          {resB.deteccoes.map((d, j) => (
            <tr key={j}>
              <th scope="row">{j + 1} <small className="mono">({d.score.toFixed(2)})</small></th>
              <td>
                <select aria-label={`Caixa ${j + 1} do quadro ${quadroB}`} value={escolhas[j] ?? ''} onChange={(e) => { setEscolhas({ ...escolhas, [j]: e.target.value }); setConferido(false); }}>
                  <option value="" disabled>escolha…</option>
                  {resA.deteccoes.map((_, i) => <option key={i} value={letra(i)}>{letra(i)}</option>)}
                  <option value={NENHUMA}>nenhuma (novo ou falso)</option>
                </select>
              </td>
              {conferido && (
                <>
                  <td className={escolhas[j] === certa(j) ? 'certa' : 'errada'}>{certa(j)}</td>
                  <td>{doRastreador(j)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="linha-acoes">
        <button type="button" className="chip" disabled={!completo} onClick={() => setConferido(true)}>Conferir</button>
        {conferido && <span aria-live="polite">{acertos} de {resB.deteccoes.length} certas. “Real” vem da verdade de solo; “Rastreador” compara os tracker_id dos dois quadros.</span>}
      </div>
    </div>
  );
}
