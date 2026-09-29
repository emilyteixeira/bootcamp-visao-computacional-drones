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

// Abre a aula já num passo (capítulo e passo contados a partir de 0).
async function abrirNoPasso(page, capitulo, passo) {
  await page.goto('/#curso-bytetrack');
  await page.locator('.viewport canvas').first().waitFor();
  await page.locator('.indice-aula summary').click();
  await page.locator('.indice button').nth(capitulo).click();
  for (let i = 0; i < passo; i++) await proximo(page).click();
  await page.waitForTimeout(1500);
}

test('replay do trackers 2.6.1 carrega sob demanda com proveniência', async ({ page }) => {
  await abrirNoPasso(page, 4, 5);
  await expect(page.getByRole('heading', { name: 'O mesmo clipe no trackers 2.6.1' })).toBeVisible();
  await expect(page.locator('.origem-replay')).toHaveText('Replay Python · trackers 2.6.1');
  await expect(page.locator('.proveniencia')).toContainText('B é uma gravação, não uma simulação');
  await expect(page.locator('.proveniencia')).toContainText('supervision 0.30.5');
  await expect(page.locator('.viewport canvas')).toHaveCount(2);
});

test('inspetor destaca a linha focada e alterna formatos', async ({ page }) => {
  await abrirNoPasso(page, 1, 0);
  const linha = page.locator('.inspetor tbody tr').first();
  await linha.focus();
  await expect(linha).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'cxcywh' }).click();
  await expect(page.locator('.inspetor thead')).toContainText('cxcywh');
  await expect(page.locator('.codigo .selo-validacao.ok').first()).toContainText('trackers 2.6.1');
});

test('sair de uma comparação A/B não troca a aula para a vista 2D', async ({ page }) => {
  await abrirNoPasso(page, 4, 4);
  await expect(page.locator('.viewport canvas')).toHaveCount(2);
  await page.getByRole('button', { name: '← Anterior' }).click();
  await page.waitForTimeout(800);
  await expect(page.locator('.viewport canvas')).toHaveCount(1);
  await expect(page.locator('.cena-2d')).toHaveCount(0);
  await expect(page.getByText('descartou o contexto WebGL')).toHaveCount(0);
});
