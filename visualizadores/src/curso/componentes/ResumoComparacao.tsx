// Métricas do clipe lado a lado para a comparação A/B (mesmas detecções, um parâmetro diferente).
import type { Metricas } from '../../visualizadores/bytetrack/tipos.ts';

const fmt = (v: number | null, pct = false) => (v === null ? '—' : pct ? `${(v * 100).toFixed(1).replace('.', ',')}%` : String(Math.round(v * 10) / 10).replace('.', ','));

export default function ResumoComparacao({ a, b, rotuloA, rotuloB }: { a: Metricas; b: Metricas; rotuloA: string; rotuloB: string }) {
  const linhas: [string, number | null, number | null, boolean][] = [
    ['IDs criados', a.idsCriados, b.idsCriados, false],
    ['Trocas de ID', a.trocasId, b.trocasId, false],
    ['Cobertura', a.cobertura, b.cobertura, true],
    ['Falsos positivos', a.falsosPositivos, b.falsosPositivos, false],
    ['Atraso do 1º ID (q)', a.atrasoMedio, b.atrasoMedio, false],
  ];
  return (
    <div className="resumo-ab">
      <table>
        <caption>Clipe inteiro · {a.veiculos} veículo(s) real(is) · métrica didática (IoU ≥ 0,3)</caption>
        <thead>
          <tr><th scope="col">Métrica</th><th scope="col"><span className="selo-ab">A</span> {rotuloA}</th><th scope="col"><span className="selo-ab b">B</span> {rotuloB}</th></tr>
        </thead>
        <tbody>
          {linhas.map(([nome, va, vb, pct]) => (
            <tr key={nome} className={va !== vb ? 'difere' : ''}>
              <th scope="row">{nome}</th>
              <td className="mono">{fmt(va, pct)}</td>
              <td className="mono">{fmt(vb, pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
