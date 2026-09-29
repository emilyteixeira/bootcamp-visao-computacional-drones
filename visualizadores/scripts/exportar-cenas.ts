// Exporta as detecções de uma cena do laboratório (as mesmas que o navegador gera) para o
// script Python de replay. Uso: npx tsx scripts/exportar-cenas.ts oclusao > cena.json
import { createHash } from 'node:crypto';
import { CENARIOS, gerarCena, type IdCenario } from '../src/visualizadores/bytetrack/cenarios.ts';
import { hashDeteccoes } from '../src/curso/replay.ts';

const id = process.argv[2] as IdCenario;
if (!CENARIOS[id]) throw new Error(`Cena desconhecida: ${id}`);
const cena = gerarCena(CENARIOS[id]);
process.stdout.write(JSON.stringify({
  cenario: id,
  hashDeteccoes: hashDeteccoes(cena.deteccoes, (t) => createHash('sha256').update(t).digest('hex')),
  quadros: cena.deteccoes.map((q) => q.map((d) => ({ xyxy: d.caixa, confidence: d.score }))),
}));
