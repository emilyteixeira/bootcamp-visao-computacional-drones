import { test, expect } from '@playwright/test';

// As fontes vêm do bundle (@fontsource): nenhuma requisição externa durante o teste.
test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
});

const erros = [];
async function abrirNoQuadro(page, quadro, hash = '#bytetrack') {
  page.on('pageerror', (e) => erros.push(String(e)));
  await page.goto(`/${hash}`);
  await page.locator('.viewport canvas').waitFor();
  await page.waitForTimeout(1500);
  await page.keyboard.press('Space');            // pausa
  await page.keyboard.press('Shift+ArrowLeft');  // quadro 0
  for (let i = 0; i < quadro; i++) await page.keyboard.press('ArrowRight');
  await page.mouse.move(0, 0);
  await page.waitForTimeout(800);
}

test('cena de oclusão, quadro 120, vista perspectiva', async ({ page }) => {
  await abrirNoQuadro(page, 120);
  await expect(page.locator('.cursor-quadro b')).toHaveText('120');
  await expect(page).toHaveScreenshot('bytetrack-perspectiva-q120.png');
  expect(erros).toEqual([]);
});

test('vista do drone (tecla 7)', async ({ page }) => {
  await abrirNoQuadro(page, 60);
  await page.keyboard.press('7');
  await page.waitForTimeout(2500);
  await expect(page.locator('.bt-viewport')).toHaveScreenshot('bytetrack-topo-q60.png');
});

test('aba Impacto com gráfico de sensibilidade', async ({ page }) => {
  await abrirNoQuadro(page, 0);
  await page.getByRole('tab', { name: 'Impacto' }).click();
  await expect(page.getByText('Identidades')).toBeVisible();
  await expect(page.locator('.bt-painel')).toHaveScreenshot('bytetrack-impacto.png');
});

test('predefinição Armadilha mostra avisos', async ({ page }) => {
  await abrirNoQuadro(page, 0);
  await page.getByRole('button', { name: 'Armadilha' }).click();
  await expect(page.locator('.aviso').first()).toContainText('etapa 2 fica vazia');
});

test('vaga planejada renderiza', async ({ page }) => {
  await page.goto('/#kalman');
  await expect(page.getByRole('heading', { name: 'Filtro de Kalman' })).toBeVisible();
  await expect(page).toHaveScreenshot('vaga-kalman.png');
});

test('layout de celular sem rolagem horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirNoQuadro(page, 30);
  const larguras = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(larguras[0]).toBeLessThanOrEqual(larguras[1]);
  // Este teste valida o layout em 390 px. O canvas WebGL ocupa ~62% da tela e sua rasterização
  // por software varia entre máquinas; o render 3D já é coberto pelos testes de desktop acima.
  await expect(page).toHaveScreenshot('bytetrack-celular.png', { mask: [page.locator('.viewport canvas')] });
});
