// Tabela das detecções do quadro que chegaram ao rastreador, como linhas de um sv.Detections.
import type { EtapaDeteccao, Instantaneo } from '../../visualizadores/bytetrack/tipos.ts';

const DESTINO: Record<string, string> = {
  1: 'etapa 1',
  2: 'etapa 2',
  nova: 'nova tentativa',
  descartada: 'baixa sem par',
  'sem-ativacao': 'alta sem ativação',
};
const destino = (e: EtapaDeteccao) => (e == null ? '—' : DESTINO[String(e)]);

export default function InspetorDetections({ res }: { res: Instantaneo }) {
  return (
    <div className="inspetor">
      <table>
        <caption>Detecções que entraram no <code>update()</code> neste quadro</caption>
        <thead>
          <tr><th scope="col">i</th><th scope="col">xyxy (px)</th><th scope="col">confidence</th><th scope="col">destino</th><th scope="col">tracker_id</th></tr>
        </thead>
        <tbody>
          {res.deteccoes.map((d, i) => (
            <tr key={i}>
              <td className="mono">{i}</td>
              <td className="mono">{d.caixa.map((v) => Math.round(v)).join(', ')}</td>
              <td className="mono">{d.score.toFixed(2)}</td>
              <td>{destino(d.etapa)}</td>
              <td className="mono">{d.id ?? -1}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {res.descartadas.length > 0 && <p className="nota">{res.descartadas.length} caixa(s) abaixo do limiar do detector não chegaram ao rastreador.</p>}
    </div>
  );
}
