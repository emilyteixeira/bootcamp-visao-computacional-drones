# Histórico da sessão: 26/09/2026, visualizador ByteTrack

## Pedido

Criar um visualizador com link compartilhável e bem didático, em ReactJS, Three.js e "as melhores libs baseadas em Blender", para explicar o ByteTrack e o impacto dos parâmetros no Supervision. O código deve deixar espaço para novos visualizadores de Visão Computacional.

## Contexto levantado no repositório

- `projeto-3/requirements.txt`: supervision 0.30.5, trackers 2.6.1.
- Os notebooks 02 e 03 usam `trackers.ByteTrackTracker`, não `sv.ByteTrack`.
- Valores do notebook 02: 0,10 / 0,25 / 0,35 / IoU 0,10 / buffer 30 / 2 quadros.
- Valores do notebook 03: conf 0,30 / alta 0,60 / ativação 0,30 / IoU 0,10 / 30 / 2.

## Pontos de atenção levados à autora

1. **Contradição com o repositório:** o pedido fala em "parâmetros no Supervision", mas o projeto usa o pacote `trackers`, que substitui `sv.ByteTrack`. O visualizador usa os nomes do `trackers` e mostra o equivalente `sv.ByteTrack` em cada controle.
2. Não existe biblioteca JS "baseada em Blender". Foram usados React Three Fiber e drei, com as convenções de interação do Blender.

## O que foi feito

1. Criado o projeto Vite em `visualizadores/`, com núcleo reutilizável e registro de módulos.
2. ByteTrack didático em JS (Kalman, húngaro, duas etapas), com cenas sintéticas e métricas.
3. Interface com cena 3D (oclusores físicos, modo espaço-tempo, raio-X), linha do tempo, painéis Parâmetros, Etapas, Impacto (varredura e referência) e Conceito (demo de IoU).
4. Bugs encontrados e corrigidos (ver HANDOVER §4): `nCol` implícito e encolhimento da caixa no Kalman.
5. 5 testes em `tests/bytetrack.test.js`.
6. Publicado em https://claude.ai/artifact/VwfuEtPjrsJmJoM7Y8AX4j.
7. Commit e push na branch `claude/modest-feynman-ooop2k`.

## Segunda rodada: useblender-cli, testes visuais e GitHub Pages

- Pedido: adaptar o visual com `useblender-cli` (indicada pelo professor), refazer os testes, incluindo os visuais, e publicar no GitHub Pages.
- `useblender-cli` não foi encontrada no npm (404), no PyPI nem na web. Nenhum pacote de nome parecido foi instalado, para evitar typosquatting. A autora precisa enviar o link exato.
- Testes visuais Playwright (6 cenários) criados. Instabilidade da câmera corrigida. 6/6 passam em execuções repetidas.
- Workflow do GitHub Pages criado. A publicação só acontece após o merge na `main` e a ativação de Pages.

## Terceira rodada: decisão da autora

- Inserção da `useblender-cli` cancelada por enquanto.
- A autora vai abrir o pull request da branch `claude/modest-feynman-ooop2k` para a `main` do fork `emilyteixeira/bootcamp-visao-computacional-drones`.
