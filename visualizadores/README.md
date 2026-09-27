# Visualizadores de Visão Computacional

Laboratório 3D para ensinar conceitos de Visão Computacional. Primeiro módulo: **ByteTrack** e o impacto dos parâmetros do tracker usados no [projeto-3](../projeto-3/README.md).

**Link compartilhável:** https://claude.ai/artifact/VwfuEtPjrsJmJoM7Y8AX4j. O link é privado até ser compartilhado pelo menu *Share* da página.

## Stack

| Camada | Biblioteca | Versão |
|:--|:--|:--|
| UI | React | 19.3 |
| 3D | three.js | 0.186 |
| Renderizador React | @react-three/fiber | 9.8 |
| Utilitários 3D (grade, gizmo e órbita no estilo do Blender, rótulos HTML, linhas) | @react-three/drei | 10.7 |
| Linguagem | TypeScript (strict), testes com tsx + node:test | 7.0 / 4.23 |
| Build | Vite 8 e vite-plugin-singlefile | 8.3 / 2.3 |

Nenhuma biblioteca JavaScript é "baseada em Blender". A interação segue as convenções do Blender: `GizmoViewport` com eixos X vermelho, Y verde e Z azul, grade infinita, atalhos numéricos de vista (7, 1, 3, 0), Espaço para reproduzir, ←/→ para mudar de quadro e marcadores em losango na linha do tempo. Um modelo `.glb` exportado do Blender pode ser carregado com `useGLTF` do drei.

## Comandos

```bash
cd visualizadores
npm install
npm run dev          # http://localhost:5173/#bytetrack (laboratório) e #curso-bytetrack (Aula 1)
npm run typecheck    # tsc strict (TypeScript 7)
npm test             # testes da lógica (tsx + node:test), incluindo fixtures do trackers 2.6.1
npm run test:visual  # testes visuais Playwright (6 cenários, referências em tests/visual/referencias/)
npm run build:pages  # dist/ com base /bootcamp-visao-computacional-drones/ (GitHub Pages)
npm run build        # dist/ (vários arquivos, para hospedagem estática)
npm run build:link   # dist-link/laboratorio-bytetrack.html (arquivo único, para publicar)
```

## Estrutura

```
src/
  registro.ts                 ← lista de visualizadores (menu + rotas #id)
  App.tsx                     ← casca: barra superior, roteamento por âncora
  nucleo/                     ← peças reutilizáveis por qualquer visualizador
    Viewport3D.tsx            ← Canvas, grade, gizmo, vistas 7/1/3/0, pxParaMundo()
    usarReproducao.ts         ← play/pausa/velocidade/atalhos de quadro
    ui/Controle.tsx, ui/LinhaDoTempo.tsx
    rng.ts, geometria.ts (IoU), hungaro.ts (atribuição + associarPorIou)
  visualizadores/
    bytetrack/                ← módulo pronto
      tipos.ts                ← contratos (Detection, TrackSnapshot, Instantaneo…)
      cenarios.ts             ← 3 cenas sintéticas + detector simulado
      kalman.ts, bytetrack.ts ← tracker didático (associação e ciclo de vida do trackers 2.6.1; Kalman simplificado)
      metricas.ts             ← IDs, trocas, cobertura, falsos positivos, atraso
      parametros.ts           ← textos didáticos, predefinições e varredura
      Cena3D.tsx, Paineis.tsx, GraficoSensibilidade.tsx, ByteTrackVisualizador.tsx
    _modelo/                  ← ponto de partida para novos visualizadores
tests/bytetrack.test.ts, tests/fixtures-python.test.ts, tests/fixtures/bytetrack/*.json
scripts/exportar-fixtures-bytetrack.py   ← regenera as fixtures com o ByteTrackTracker real
```

## Adicionar um visualizador

1. Copie `src/visualizadores/_modelo/` para `src/visualizadores/<id>/`.
2. Em `src/registro.ts`, mude a entrada para `status: 'pronto'` e adicione `Componente: lazy(() => import('./visualizadores/<id>/<Nome>.tsx'))`. As vagas reservadas são `iou-nms`, `kalman`, `linezone` e `homografia`.
3. Mantenha a matemática em `.ts` puro (sem React) e crie `tests/<id>.test.ts`.
4. Rode `npm run build:link` e republique o HTML no mesmo link.

## GitHub Pages

O workflow `.github/workflows/visualizadores-pages.yml` roda `npm run typecheck`, `npm test`, os testes visuais e a build. Em push na `main`, ele publica em `https://emilyteixeira.github.io/bootcamp-visao-computacional-drones/#bytetrack`. Pré-requisito: em Settings → Pages, escolha Source: **GitHub Actions**. Localmente, `CHROMIUM_PATH=/opt/pw-browsers/chromium` aponta o Chromium do container.

Documentos de continuidade: [HANDOVER.md](HANDOVER.md) e [docs/historico/](docs/historico/).
