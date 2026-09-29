import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Etapa 5: aula completa sem WebGL e só com teclado; verificação automática WCAG 2 A/AA (axe).
test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
});

async function semWebGL(page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (tipo, ...resto) {
      if (/webgl/i.test(tipo)) return null;
      return original.call(this, tipo, ...resto);
    };
  });
}

test('aula completa sem WebGL, só com teclado (vista 2D)', async ({ page }) => {
  test.setTimeout(180_000);
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  await semWebGL(page);
  await page.goto('/#curso-bytetrack');
  await expect(page.getByRole('status').first()).toContainText('não oferece WebGL');
  await expect(page.locator('.cena-2d').first()).toBeVisible();
  await expect(page.locator('.viewport canvas')).toHaveCount(0);

  const total = Number((await page.locator('.roteiro-cabecalho .rotulo').innerText()).match(/de (\d+)$/i)[1]);
  for (let n = 1; n <= total; n++) {
    await expect(page.locator('.roteiro-cabecalho .rotulo')).toContainText(`passo ${n} de ${total}`, { ignoreCase: true });
    // Responde à questão do passo, se houver, só com teclado: foca a primeira opção e usa as setas.
    const opcoes = page.locator('.questao input[type="radio"]');
    if (await opcoes.count()) {
      await opcoes.first().focus();
      await page.keyboard.press('Space');
      await expect(page.locator('.feedback p')).toBeVisible();
    }
    if (n < total) {
      await page.keyboard.press('PageDown');
      await expect(page.locator('.roteiro-passo h3')).toBeFocused();
    }
  }
  await page.getByRole('button', { name: 'Concluir a aula' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Resumo da aula' })).toBeVisible();
  expect(erros).toEqual([]);
});

test('vista 2D no celular, na comparação A/B, sem rolagem horizontal', async ({ page }) => {
  await semWebGL(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#curso-bytetrack');
  await page.locator('.indice-aula summary').click();
  await page.locator('.indice button').nth(1).click();
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Próximo →' }).click();
  await expect(page.locator('.cena-2d')).toHaveCount(2);
  const [largura, janela] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(largura).toBeLessThanOrEqual(janela);
});

for (const [nome, capitulo, passo] of [['primeiro passo', 0, 0], ['comparação A/B', 1, 2], ['replay Python', 4, 5], ['inspetor e trechos', 1, 0]]) {
  test(`axe (WCAG 2 A/AA): ${nome}`, async ({ page }) => {
    await semWebGL(page);
    await page.goto('/#curso-bytetrack');
    await page.locator('.indice-aula summary').click();
    await page.locator('.indice button').nth(capitulo).click();
    for (let i = 0; i < passo; i++) await page.getByRole('button', { name: 'Próximo →' }).click();
    await page.waitForTimeout(800);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(graves.map((v) => `${v.id}: ${v.nodes.length} nó(s) — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}

test('referência visual: vista 2D na comparação A/B (capítulo 4, microcena)', async ({ page }) => {
  await semWebGL(page);
  await page.goto('/#curso-bytetrack');
  await page.locator('.indice-aula summary').click();
  await page.locator('.indice button').nth(3).click();
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Próximo →' }).click();
  await expect(page.getByRole('heading', { name: 'Microcena: uma caixa de 0,18' })).toBeVisible();
  await page.getByRole('button', { name: '3 · Etapa 2' }).click();
  await expect(page.locator('.palco-lados')).toHaveScreenshot('curso-2d-microcena-etapa2.png');
});
