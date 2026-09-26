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

## Quarta rodada: PR emilyteixeira/bootcamp-visao-computacional-drones#1

- CI: `testes` passou; `testes-visuais` falhou em 4 de 6 cenários por diferença de fontes do sistema. O teste da vista topo, só com 3D, passou.
- Correção: fontes embutidas com `@fontsource` e testes bloqueando requisições externas. O teste também revelou o contraste da aba ativa de módulo planejado, que foi corrigido.
- Referências regeneradas. 6/6 passam localmente em duas rodadas.

## Quinta rodada: merge e publicação

- CI verde no commit `b515aa5`. PR #1 mesclado às 15:53 UTC.
- Run 36253508693 na `main`: `testes`, `testes-visuais` e `publicar` passaram. O deploy terminou às 15:55:16 UTC.
- A autora já tinha ativado o Pages antes do PR. Nada falhou: o site só levou ~2 min para sair após o merge, porque o deploy espera os testes visuais.
- O acesso ao `github.io` a partir do ambiente de desenvolvimento é bloqueado pela política de rede. A confirmação foi feita pela API do GitHub Actions.

## Sexta rodada: PR de documentação

- A autora confirmou no próprio navegador que a página do GitHub Pages abre.
- Aberto um PR só de documentação (HANDOVER e histórico) para a `main` refletir a publicação. O merge dispara testes e republicação com o mesmo conteúdo.
