# Histórico da sessão: 29/09/2026, etapas 3, 4 e 5 e PR

## Pedido

Seguir para a etapa 3 começando pela comparação A/B; depois etapa 4; depois etapa 5; ao final, abrir uma PR se todos os testes, inclusive os visuais, passarem.

## O que foi feito

1. **Etapa 3** (`399f568`): comparação A/B sincronizada (mesmas detecções, quadro, camadas e câmeras), microcena 0,18 conferida no trackers 2.6.1, passo a passo do quadro com IoU, linha de estados, associação manual no cap. 1.
2. **Etapa 4** (`ca24fa3`): replay do `ByteTrackTracker` em Python como lado B, com versões e hash das detecções; trechos Python executados nas versões fixadas; inspetor de `sv.Detections` sincronizado; tabela de adaptadores.
3. **Etapa 5**: vista 2D sem WebGL, atalhos `PageUp`/`PageDown` e foco, resumo final, axe WCAG A/AA sem violações graves, medições de desempenho.

## Problemas encontrados

- Script temporário de inspeção commitado por engano (`7662384` o removeu; padrão `.*.tmp.mjs` no `.gitignore`).
- JetBrains Mono mostrava `!=` como `≠` em código: ligaduras desligadas.
- R3F dispara `webglcontextlost` ao desmontar um `Canvas`, o que ligava a vista 2D sem motivo: corrigido e coberto por teste.
- `dist-link/laboratorio-bytetrack.html` não abre direto no navegador (sem `<meta charset>`), já no commit base: é o formato do publicador; testar com `dist-link/index.html`.
- Contraste de textos secundários abaixo de 4,5:1: `--texto-3` ajustado (afeta também o laboratório; referência do celular atualizada após revisão).

## Pontos para a autora

- A meta de < 100 ms por interação foi atingida na vista 2D (20 ms) e no cálculo (≤ 15 ms), mas não pôde ser verificada no 3D: este contêiner renderiza WebGL por software (~290–360 ms). Medir numa máquina com GPU.
- Replays de vídeo real ficam para quando houver ambiente com pesos e GPU.
