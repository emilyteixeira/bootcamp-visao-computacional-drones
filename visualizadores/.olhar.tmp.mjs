import { chromium } from '@playwright/test';
const S = process.argv[2]; const ids = process.argv.slice(3);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 950 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const aula = await import('./src/curso/capitulos/aula01.ts').catch(() => null);
for (const alvo of ids) {
  const [c, s] = alvo.split(':').map(Number);
  await p.goto('http://localhost:4173/#curso-bytetrack');
  await p.evaluate(([c, s]) => { const v = JSON.parse(localStorage.getItem('curso-bytetrack:progresso') || 'null'); localStorage.setItem('curso-bytetrack:progresso', JSON.stringify({ ...(v || {}), versaoConteudo: '2026-09-29.1', posicao: { capitulo: c, passo: s }, respostas: {}, visitados: [] })); }, [c, s]);
  await p.reload(); await p.locator('.viewport canvas').first().waitFor(); await p.waitForTimeout(3000);
  await p.screenshot({ path: `${S}/e3-${c}-${s}.png`, fullPage: true });
  for (const sel of ['.manual', '.resumo-ab', '.estados']) if (await p.locator(sel).count()) await p.locator(sel).first().screenshot({ path: `${S}/e3-${c}-${s}${sel.replace('.', '-')}.png` });
}
console.log('erros', erros); await b.close();
