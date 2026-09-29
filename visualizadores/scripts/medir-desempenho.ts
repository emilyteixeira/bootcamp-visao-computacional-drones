// Mede o custo de recalcular um clipe (executar + avaliar), que é o trabalho feito a cada
// movimento de controle. Uso: npx tsx scripts/medir-desempenho.ts
import { cpus } from 'node:os';
import { CENARIOS, gerarCena } from '../src/visualizadores/bytetrack/cenarios.ts';
import { executar, PARAMETROS_PADRAO } from '../src/visualizadores/bytetrack/bytetrack.ts';
import { avaliar } from '../src/visualizadores/bytetrack/metricas.ts';

const REPETICOES = 30;
console.log(`Node ${process.version} · ${cpus()[0]?.model ?? 'CPU desconhecida'} · ${REPETICOES} repetições`);
for (const [id, c] of Object.entries(CENARIOS)) {
  const cena = gerarCena(c);
  for (let i = 0; i < 5; i++) avaliar(cena, executar(cena, PARAMETROS_PADRAO)); // aquecimento
  const tempos: number[] = [];
  for (let i = 0; i < REPETICOES; i++) {
    const t0 = performance.now();
    avaliar(cena, executar(cena, { ...PARAMETROS_PADRAO, limiar_detector: 0.1 + (i % 5) * 0.01 }));
    tempos.push(performance.now() - t0);
  }
  tempos.sort((a, b) => a - b);
  const med = tempos[Math.floor(REPETICOES / 2)];
  const p95 = tempos[Math.floor(REPETICOES * 0.95)];
  console.log(`${id.padEnd(10)} ${c.quadros} quadros · mediana ${med.toFixed(1)} ms · p95 ${p95.toFixed(1)} ms`);
}
