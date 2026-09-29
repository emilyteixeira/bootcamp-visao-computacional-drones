// Métricas didáticas do clipe inteiro com os parâmetros do passo (não são HOTA/IDF1 oficiais).
import type { Metricas } from '../../visualizadores/bytetrack/tipos.ts';

export default function ResumoClipe({ m }: { m: Metricas }) {
  const itens: [string, string][] = [
    ['Veículos reais', String(m.veiculos)],
    ['IDs criados', String(m.idsCriados)],
    ['Trocas de ID', String(m.trocasId)],
    ['Cobertura', `${(m.cobertura * 100).toFixed(1).replace('.', ',')}%`],
    ['Falsos positivos', String(m.falsosPositivos)],
    ['Atraso do 1º ID', m.atrasoMedio === null ? '—' : `${m.atrasoMedio.toFixed(1).replace('.', ',')} q`],
  ];
  return (
    <div className="resumo-clipe">
      <p className="rotulo">Resumo do clipe (240 quadros)</p>
      <dl>
        {itens.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd className="mono">{v}</dd></div>
        ))}
      </dl>
      <p className="nota">Casamento com a verdade de solo por IoU ≥ 0,3: métrica didática desta cena.</p>
    </div>
  );
}
