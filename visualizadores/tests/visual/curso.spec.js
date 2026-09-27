import { test, expect } from '@playwright/test';

// Rota #curso-bytetrack: estrutura da aula guiada (etapa 2 do plano).
test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
});

async function abrirCurso(page) {
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  await page.goto('/#curso-bytetrack');
  await page.locator('.viewport canvas').waitFor();
  await page.waitForTimeout(2500);
  return erros;
}

const proximo = (page) => page.getByRole('button', { name: 'Próximo →' });

test('primeiro passo da aula começa pausado no quadro 60', async ({ page }) => {
  const erros = await abrirCurso(page);
  await expect(page.getByRole('heading', { name: 'O mesmo carro?' })).toBeVisible();
  await expect(page.locator('.cursor-quadro b')).toHaveText('60');
  await expect(page.getByRole('button', { name: 'Reproduzir' })).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot('curso-passo-1.png');
  expect(erros).toEqual([]);
});

test('avançar, responder, recarregar e retomar', async ({ page }) => {
  await abrirCurso(page);
  await proximo(page).click();
  await expect(page.getByRole('heading', { name: 'Quem é quem no quadro seguinte?' })).toBeVisible();
  await expect(page.locator('.cursor-quadro b')).toHaveText('61');
  await page.getByRole('radio', { name: /onde esperamos encontrar/ }).check();
  await expect(page.locator('.feedback')).toContainText('Correto.');
  await page.reload();
  await page.locator('.viewport canvas').waitFor();
  await expect(page.getByRole('status')).toContainText('Retomando de onde você parou');
  await expect(page.getByRole('heading', { name: 'Quem é quem no quadro seguinte?' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /onde esperamos encontrar/ })).toBeChecked();
  // Voltar e recomeçar
  await page.getByRole('button', { name: '← Anterior' }).click();
  await expect(page.getByRole('heading', { name: 'Um quadro visto do drone' })).toBeVisible();
  await page.locator('.indice-aula summary').click();
  await page.getByRole('button', { name: /Desafio do drone alto/ }).click();
  await expect(page.getByRole('heading', { name: 'Carros de 26 × 13 pixels' })).toBeVisible();
  await expect(page.locator('.cursor-quadro b')).toHaveText('120');
});

test('progresso incompatível recomeça do início com aviso', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('curso-bytetrack:progresso', JSON.stringify({ versaoConteudo: 'antiga', posicao: { capitulo: 3, passo: 0 }, respostas: {}, visitados: [] }));
  });
  await abrirCurso(page);
  await expect(page.getByRole('status')).toContainText('progresso salvo anteriormente não é compatível');
  await expect(page.getByRole('heading', { name: 'O mesmo carro?' })).toBeVisible();
});

test('laboratório livre continua acessível a partir da aula', async ({ page }) => {
  await abrirCurso(page);
  await page.getByRole('link', { name: 'Abrir o laboratório livre' }).click();
  await expect(page.getByRole('heading', { name: 'Cada caixa conta, até as fracas' })).toBeVisible();
});
