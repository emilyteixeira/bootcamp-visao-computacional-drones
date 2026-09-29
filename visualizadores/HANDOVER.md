# Handover: visualizadores (ByteTrack)

Atualizado em 26/09/2026. Branch: `claude/sleepy-darwin-avgnii` (base `main@df5e24f`).

> **Etapa 0 concluída** e **motor alinhado ao `trackers` 2.6.1** (D1, D3, D4, D5), conferido contra saídas reais do Python: ver [auditoria](docs/auditoria-bytetrack-etapa0.md) §8. D2 (Kalman) mantida como simplificação. **Etapa 1 concluída:** todo `src/` e os testes de lógica em TypeScript strict. **Etapas 2 a 5 concluídas** (29/09/2026): aula completa em `#curso-bytetrack` com A/B, microcena, replay Python, trechos validados, vista 2D e verificação de acessibilidade. PR aberta a partir de `claude/sleepy-darwin-avgnii`. Pendente: medir desempenho 3D em máquina com GPU (ver §15).

> O curso guiado e a migração TypeScript estão planejados, ainda não implementados. Consulte o [plano completo](docs/plano-curso-bytetrack-supervision.md). Os registros de publicação abaixo descrevem a sessão anterior; não são uma nova verificação de deploy.

## 1. Estado atual

| Item | Estado |
|:--|:--|
| Módulo ByteTrack | Pronto e publicado em https://claude.ai/artifact/VwfuEtPjrsJmJoM7Y8AX4j (privado até ser compartilhado) |
| Typecheck | `npm run typecheck` (tsc 7.0.2, strict, sem `allowJs`): 0 erros. Roda na CI antes de `npm test` |
| Curso | `#curso-bytetrack` (aba **Aula 1**): 7 capítulos, 35 passos, 7 questões, 60 min, `versaoConteudo` `2026-09-29.3`. Conteúdo em `src/curso/capitulos/aula01.ts` |
| Testes | `npm test` (tsx + node:test): 39/39 (inclui 13 do curso). `npm run test:visual`: 10/10 em 3 execuções (6 do laboratório sem atualizar referências + 4 do curso). Contagem anterior: 26/26 (5 originais + 18 fixtures Python + 3 de buffer/Kalman). `npm run test:visual`: 6/6 em 3 execuções seguidas, com 2 referências atualizadas após revisão (27/09/2026) |
| GitHub Pages | Publicado em https://emilyteixeira.github.io/bootcamp-visao-computacional-drones/#bytetrack (run 36253508693, deploy às 15:55 UTC de 26/09/2026). Cada push na `main` que altere `visualizadores/` republica |
| `useblender-cli` | Cancelada pela autora em 26/09/2026. O visual continua com R3F e drei |
| Build | `npm run build:link`: arquivo único de 1.739 KiB com o curso (1.680 KiB antes da etapa 2; 1.679 KiB (medido na etapa 0; o valor anterior de ~1,2 MB estava desatualizado) |
| Vagas reservadas | `iou-nms`, `kalman`, `linezone`, `homografia` (status `planejado` em `src/registro.js`) |

## 2. Decisões tomadas

| Decisão | Motivo |
|:--|:--|
| Vite + React 19 + R3F 9 + drei 10 + three 0.186 + TypeScript 7 | Stack preservada; TypeScript por pedido da autora (26/09/2026), migração concluída em 27/09/2026. Imports com extensão explícita (`.ts`/`.tsx`, `allowImportingTsExtensions`) |
| Build em arquivo único (`vite-plugin-singlefile`) | O publicador de Artifacts só aceita scripts de CDNs permitidos. Com tudo embutido, não há dependência de CDN |
| O tracker é reimplementado em JS e não chama o Python | Precisa rodar no navegador e responder aos controles na hora. Uma varredura de 14 valores leva cerca de 200 ms |
| Nomes e semântica de `trackers.ByteTrackTracker` (trackers==2.6.1) | São os usados em `projeto-3/02_tracking.ipynb` e `03_projeto_final.ipynb`. `sv.ByteTrack` aparece só como mapeamento. Associação e ciclo de vida alinhados e verificados por fixtures (27/09/2026) |
| **Inegociável:** Kalman didático cx,cy,w,h com tamanho congelado (D2) | Decisão da autora (27/09/2026). Rotulado como simplificação; não trocar por XYXY sem pedido |
| **Inegociável:** público da aula 1 = plano §1 (entende detecção, começa em tracking) | Decisão da autora (27/09/2026): nenhum capítulo encurtado, tudo explicado em detalhe |
| Ordem: motor alinhado → migração TS → curso | Decisão da autora (27/09/2026); cada passo em commit próprio |
| Cenas sintéticas e determinísticas (semente) | Permitem comparar parâmetros na mesma cena e medir contra verdade de solo |
| Tema escuro único, inspirado no Blender | Escolha deliberada para o viewport 3D |
| Roteamento por `#id` | O link do Artifact só preserva âncoras simples. Por isso a posição na aula fica no `localStorage`, não na âncora |
| Aula = dado puro (`Aula`/`Capitulo`/`Passo` em `src/curso/tipos.ts`) | Cada passo declara cenário, predefinição, ajustes, quadro, camadas e vista; a cena é recalculada de forma determinística. Nada lê o Canvas |
| Progresso em `localStorage` (`curso-bytetrack:progresso`) com `versaoConteudo` | Sem backend no MVP. Versão diferente, JSON inválido ou posição fora do roteiro → recomeça com aviso. **Mudar a ordem de passos exige subir `versaoConteudo`** |
| Números citados no roteiro são testados | `tests/curso.test.ts` falha se motor/cenas/predefinições mudarem os valores do texto; revisar o texto antes de atualizar o teste |
| Rótulo da aba = “Aula 1” | “Aula 1 · ByteTrack” quebrava a barra de abas em 2 linhas a 1440 px e deslocava o laboratório |

## 3. Semântica do tracker (bytetrack.js) — igual a trackers 2.6.1

Ordem em cada quadro:
1. Filtro `limiar_detector` (fora do tracker, como `detectar()` nos notebooks).
2. Previsão de Kalman de todas as trilhas; quem já estava sem atualização zera a contagem seguida; `semAtualizar += 1`.
3. Separação em ALTA (≥ `high_conf_det_threshold`) e BAIXA.
4. Etapa 1: **todas** as trilhas × ALTAS (húngaro maximizando IoU, depois rejeição por `minimum_iou_threshold`).
5. Etapa 2: **todas as trilhas livres da etapa 1** (tentativas, ativas e perdidas) × BAIXAS, mesmo IoU mínimo.
6. Ao associar: seguidas += 1; se seguidas ≥ `minimum_consecutive_frames` e sem ID → `tracker_id` (começa em **0**).
7. Nascimento: ALTA livre com score ≥ `track_activation_threshold`, com seguidas = 1 e `tracker_id` −1. **O ID nunca sai no nascimento**: com mínimo 1 ou 2, o ID sai no 2º quadro.
8. Sobrevive quem tem `semAtualizar ≤ quadrosMaximosPerdidos` **e** (tem ID, ou seguidas ≥ mínimo, ou foi atualizada agora). `quadrosMaximosPerdidos` = 0 se buffer 0; senão `max(1, ceil(frame_rate / 30 × buffer))`.

Simplificações mantidas: Kalman em cx,cy,w,h com tamanho congelado fora de `ativa` (D2; Python usa XYXY sem congelar); sem compensação de movimento da câmera; sem modo por timestamp (D7); aceite exige IoU > 0 (D6, só importa com IoU mínimo 0); avaliação com IoU ≥ 0,3.

Mapeamento para `sv.ByteTrack`: `track_activation_threshold` separa alta de baixa; `det_thresh` = ativação + 0,1; `minimum_matching_threshold` = 1 − IoU mínimo; piso fixo em 0,1.

## 4. Problemas resolvidos (não reintroduzir)

| Problema | Causa | Correção |
|:--|:--|:--|
| Nenhuma trilha nascia | `associarPorIou` deduzia `nCol` da matriz, que fica vazia quando há 0 trilhas | `nCol` passou a ser um argumento explícito em todas as chamadas |
| IDs novos depois do viaduto, mesmo com buffer 60 | A velocidade de tamanho do Kalman encolhia a caixa prevista até sumir | `prever(kf, congelarTamanho)` zera vw e vh quando a trilha não está `ativa`, como no repositório do artigo. **Atenção:** o `trackers` 2.6.1 tem esse comportamento (caixa encolhe); o JS diverge de propósito (D2, auditoria §8) |
| Trocas de ID artificiais no cenário "Drone alto" | Carros da mesma faixa com velocidades diferentes se atravessavam | Velocidade fixada por faixa |
| Teste visual da vista topo instável (3% de pixels) | A animação da câmera parava a menos de 0,01 do destino, em ponto variável | Encaixe exato no destino em `AnimadorDeVista` |
| Testes visuais falharam na CI em 4 de 6 cenários (3–11% de pixels) | Fontes de fallback do sistema diferentes entre este contêiner e a imagem do Playwright | Fontes Barlow e JetBrains Mono embutidas via `@fontsource` (sem Google Fonts) |
| Aba ativa de módulo planejado ilegível | `.aba-modulo.planejado` sobrescrevia a cor de `.ativa` | Regra `.aba-modulo.ativa.planejado` |
| Teste visual do celular falhou na CI (~2,05%, tolerância de 2%) | Canvas WebGL ocupa ~62% da tela; rasterização por software varia entre máquinas | Canvas mascarado só nesse teste de layout. O 3D segue coberto pelos testes de desktop |
| Terminal travado | `cat > arquivo` sem heredoc ficou esperando stdin | Sempre usar heredoc |
| Testes visuais comparando build antiga | Um `vite preview` manual na porta 4173 ficou aberto e o Playwright o reaproveitou (`reuseExistingServer`) | Encerrar previews manuais antes de `npm run test:visual`; não usar `pkill -f "vite preview"` no mesmo comando (mata o próprio shell) |

## 5. Efeitos calibrados (27/09/2026, motor alinhado; Notebook 02 como base; IDs/trocas/cobertura)

- Árvore e viaduto, `lost_track_buffer`: 5 → 9/4/88%; 30 → 7/2/89%; 60 → 5/0/91%. No Python real: 9 IDs nos três casos (efeito de D2, auditoria §8).
- Árvore e viaduto, `limiar_detector` 0,10 → 0,25: 7/2/89% → 8/3/82% (etapa 2 sem candidatas).
- Drone alto, `high_conf_det_threshold`: 0,25 → 10/0/91%; 0,6 → 4/0/29%. Armadilha do Notebook 03 em objetos pequenos. Python: 10 e 4 IDs.
- Drone alto, `minimum_consecutive_frames`: 1 → 10; 2 → 10; 3 → 9 (1 falso positivo a menos). O valor antigo “1 → 75 IDs” era artefato de D3.
- Drone alto, `minimum_iou_threshold` 0,5: 67/136/78% (fragmentação).
- Cenas completas × Python (parâmetros padrão): Drone alto idêntico (0 de 1.644 IDs diferentes); Árvore/viaduto 7 × 9 IDs; Cruzamento 6 × 8 IDs.

## 6. Próximos passos atuais

1. ~~Auditar notebooks e implementação Python~~ — feito (etapa 0).
2. ~~Criar fixtures pequenas~~ — feito: 16 fixtures em `tests/fixtures/bytetrack/`.
3. ~~Decisão da autora sobre D1–D5~~ — alinhados (27/09/2026). D2 mantida.
4. ~~Migrar para TypeScript~~ — feito (27/09/2026), sem mudança de comportamento. Pendente opcional: `tests/visual/*.spec.js` e `playwright.config.js` seguem em JS.
5. ~~Rota do curso, roteiro, etapas 3, 4 e 5~~ — feito (27–29/09/2026).
6. Medir a latência da interação 3D numa máquina com GPU (meta: < 100 ms). Se não atingir, sugestão: `frameloop="demand"` no `Canvas` com `invalidate()` no `AnimadorDeVista`.
7. Replays de vídeo real (`projeto-3/assets/videos/`) exigem rodar RF-DETR/YOLO com pesos: fora do escopo deste ambiente.
6. Validar aula, acessibilidade, build e testes; registrar resultados antes de publicação.

As vagas Kalman, LineZone e homografia continuam reservadas, mas a prioridade atual é a primeira aula ByteTrack + Supervision.

## 7. Como retomar em 5 minutos

`cd visualizadores && npm ci && npm run typecheck && npm test && npm run dev`, depois abra `http://localhost:5173/#bytetrack`. Para republicar, rode `npm run build:link` e publique `dist-link/laboratorio-bytetrack.html` no mesmo URL do Artifact.

## 8. Sessão de planejamento do curso — 26/09/2026

### Pedido e escopo
Ler o repositório e as anotações, fazer curadoria científica e planejar um curso interativo no visualizador em React e TypeScript, com animações no estilo Blender. Nesta sessão foram alterados apenas documentos.

### Trabalho concluído
- Mapeados arquitetura, motor didático, cenários, UI, configuração e testes do visualizador.
- Lidos README, REFERENCIAS e requirements do projeto 3.
- Extraído o texto das 138 páginas do PDF da aula; examinadas seções relevantes e conferidas visualmente páginas 52, 110 e 112.
- Elaborado [plano de implementação](docs/plano-curso-bytetrack-supervision.md), com roteiro, fontes, correções editoriais, contratos de dados, etapas e critérios de aceite.
- Curadoria: ByteTrack (central), SORT, Deep SORT, BoT-SORT, HOTA e VisDrone; fontes e limites no plano.
- Confirmada na documentação oficial a depreciação de sv.ByteTrack e a separação entre Supervision e Trackers.
- Executados os cinco testes de lógica existentes em uma cópia dos arquivos do commit auditado: **5 aprovados, 0 falhas**.

### Decisões
- Reaproveitar R3F/drei e a cena existente; acrescentar modo guiado e manter exploração livre.
- Nova rota proposta: #curso-bytetrack; preservar #bytetrack.
- Priorizar TypeScript por solicitação atual da autora.
- Python continua como referência executável; navegador oferece simulação identificada e replays exportados.
- Cada capítulo terá fonte, interação e avaliação curta; progresso local, sem backend no MVP.
- PDF é material de estudo. Sugestões internas de ferramentas/modelos/publicação não foram tratadas como comandos da autora.
- Não publicar o PDF ou seus trechos extensos no repositório; registrar apenas síntese e páginas.

### Pontos a revisar antes de implementar
- Atribuição húngara com rejeição posterior por IoU; fronteiras de limiares; confirmação e expiração.
- Não assumir mapeamento universal de minimum_matching_threshold para IoU sem examinar fusão de score.
- Kalman xywh local não é implementação integral do original xyah.
- A observação histórica de “0,5 na etapa 2” precisa ser vinculada à implementação adequada; não atribuí-la automaticamente ao texto do artigo.
- Métricas atuais são didáticas; não equivalem a avaliação oficial HOTA/IDF1.
- Corrigir confusões das anotações: confidence/class_id, adaptadores, BGR/RGB, score versus certeza, confirmação versus buffer.

### Limitações e validação
Os notebooks de 4–14 MB não puderam ser lidos integralmente pelo conector (resposta vazia/erro de tamanho); a leitura célula a célula continua pendente. Não houve execução de inferência, instalação Python, build frontend ou Playwright nesta sessão. Relatos antigos de 6/6 testes visuais e deploy foram preservados como histórico.

### Como continuar
Começar pela etapa 0 do plano; depois separar migração mecânica de correções do motor. Ao concluir cada etapa, atualizar este arquivo com commit, arquivos, decisões, testes realmente executados, limitações e próximo passo. Não declarar a aula pronta com base apenas neste planejamento.

### Persistência desta sessão
A gravação original foi recusada (HTTP 403). *Resolvido:* plano e HANDOVER versionados no commit `46b0f78` da branch `claude/sleepy-darwin-avgnii`; plano movido para `docs/plano-curso-bytetrack-supervision.md`.


## 9. Sessão etapa 0 — baseline e auditoria — 26/09/2026

Histórico: [docs/historico/2026-09-26-sessao-etapa0-auditoria.md](docs/historico/2026-09-26-sessao-etapa0-auditoria.md).

### Feito
- Baseline reproduzido: `npm ci`, `npm test` 5/5, `npm run test:visual` 6/6, `build` e `build:link` ok (Node 22.22.2).
- Notebooks 01/02/03 lidos célula a célula (fontes, sem saídas). Mapa célula → capítulo na auditoria §2.
- Código de `trackers` 2.6.1 lido e executado (Python 3.11.15, sem GPU).
- `scripts/exportar-fixtures-bytetrack.py`: 16 fixtures com entrada + saída real do `ByteTrackTracker`.
- `tests/fixtures-python.test.js`: compara IDs (normalizados). 11 fixtures equivalentes; divergências como `todo`.
- Matriz D1–D7 e lista de afirmações corrigidas em `docs/auditoria-bytetrack-etapa0.md`.

### Decisões desta etapa
- Fixtures de teste em `tests/fixtures/bytetrack/` (não em `public/aulas/…` do plano §7): são dados de verificação e não devem entrar no build. Replays para a aula continuam previstos em `public/`.
- Divergências registradas como `todo` do `node:test`: aparecem no relatório sem quebrar a CI. Ao corrigir uma, remover a entrada de `DIVERGENCIAS` no teste.
- Nenhuma alteração no motor, na UI ou nas imagens de referência.

### Pendências para a autora
Ver auditoria §6: alinhar D1/D3/D4/D5; D2 (XYXY) com risco de reintroduzir o problema 2 do §4; ordem correções × TypeScript.

### Como continuar
`cd visualizadores && npm ci && npm test` → esperar 16 ok / 7 todo. Para regenerar fixtures: auditoria §7.

## 10. Sessão de alinhamento do motor — 27/09/2026

Histórico: [docs/historico/2026-09-27-sessao-alinhamento-motor.md](docs/historico/2026-09-27-sessao-alinhamento-motor.md).

- Motor: `src/visualizadores/bytetrack/bytetrack.js` (nova função exportada `quadrosMaximosPerdidos`).
- UI: `id >= 0` em `metricas.js`, `ByteTrackVisualizador.jsx`, `Cena3D.jsx`, `Paineis.jsx`, `cores.js` (cor por `id % n`: mesma cor por ordem de emissão). Textos em `Paineis.jsx` e `parametros.js`.
- Testes: `tests/fixtures-python.test.js` sem `todo`; IDs brutos e trilhas vivas. 18 fixtures.
- Referências visuais atualizadas após revisão: `perspectiva-q120` (rótulos #0–#4, fórmula do buffer, mais etapa 2 na linha do tempo) e `impacto` (cobertura 89,1%, varredura começa em buffer 0).
- Para o capítulo 5: explicar que o efeito do buffer depende da caixa prevista não encolher; no `trackers` 2.6.1 a mesma cena perde o ID.

## 11. Etapa 1 — migração TypeScript — 27/09/2026

- Commits: `a64ad9a` (1a: lógica em `.ts`, `tipos.ts`, tsconfig, tsx) e `d276187` (1b: componentes `.tsx`, `registro.ts`, `usarReproducao.ts`, `main.tsx`; `allowJs` removido).
- Contratos em `src/visualizadores/bytetrack/tipos.ts`: `ParametrosByteTrack`, `Deteccao`, `TrackSnapshot`, `LogQuadro`, `Instantaneo`, `Cenario`, `Cena`, `Metricas`, `Camadas`.
- Única mudança interna: `atualizar()` copia as detecções de entrada em vez de mutá-las (sem efeito observável; `executar` já passava cópias).
- Verificação: typecheck 0 erros; 26/26; build e build:link (1.680 KiB); 6/6 visuais **sem atualizar referências**; calibração do §5 idêntica antes/depois.
- Dependências novas (dev): `typescript@7.0.2`, `tsx@4.23.15`, `@types/react`, `@types/react-dom` 19.3, `@types/three` 0.186, `@types/node` 22.

## 12. Etapa 2 — rota `#curso-bytetrack` — 27/09/2026

Histórico: [docs/historico/2026-09-27-sessao-etapa2-curso.md](docs/historico/2026-09-27-sessao-etapa2-curso.md).

### Arquivos
- `src/curso/tipos.ts` (contratos), `fontes.ts` (catálogo de 18 fontes), `capitulos/aula01.ts` (roteiro), `progresso.ts` (navegação/persistência puras), `cenaDoPasso.ts`, `usarAula.ts` (hook + `localStorage` protegido), `AulaShell.tsx` (palco + roteiro), `CursoByteTrack.tsx` (entrada da rota).
- `src/curso/componentes/`: `PainelRoteiro`, `Questao`, `Referencia`, `TextoRico`, `InspetorDetections`, `ResumoClipe`, `IndiceCapitulos`.
- Alterados: `registro.ts` (entrada `curso-bytetrack`), `usarReproducao.ts` (`iniciarTocando`, `quadroInicial`; laboratório inalterado), `Viewport3D.tsx` (salto de câmera com `prefers-reduced-motion`), `estilos.css`.
- Testes: `tests/curso.test.ts` (13), `tests/visual/curso.spec.js` (4) + referência `curso-passo-1.png`.

### Comportamento
- Cada passo: fase (observar/prever/manipular/explicar/conferir), texto, cena imposta, opcionalmente 1 parâmetro livre, painéis (etapas do quadro, detecções, resumo do clipe), trecho de notebook com origem, questão com feedback por opção, fontes.
- A aula começa pausada no quadro do passo; trocar de passo restaura parâmetros, camadas, quadro e vista. Botão “⟲ Quadro N” volta ao quadro do passo; link para `#bytetrack`.
- Quadros-chave usados (motor alinhado, notebook 02): q60–61 (identidade, FP 0,18), q63/q67 (etapa 2 sob a árvore), q95 (#1 perdida 17/30), q106 (#1 recuperada, score 0,17, IoU 0,12), q1–2 (tentativas, IDs 0 e 1), q175–q200 (#3 perdida, removida no 185, #5 no 200). Drone alto com notebook 03: 4 IDs / 29,2%.
- O D2 é explicado no texto dos capítulos 3 e 5 (Python real perde o ID no viaduto).

### Como continuar
`npm run dev` → `http://localhost:5173/#curso-bytetrack`. Para limpar o progresso: botão “Recomeçar a aula” ou `localStorage.removeItem('curso-bytetrack:progresso')`.

## 13. Etapa 3 — narrativa ByteTrack — 29/09/2026

- **Comparação A/B** (`Passo.comparacao`): dois viewports com as mesmas detecções, quadro, camadas e câmeras sincronizadas (`Viewport3D.definirCamera`/`aoMoverCamera`; só A responde às teclas 7/1/3/0). B = A + `ajustesB`; o parâmetro livre altera B. Tabela `ResumoComparacao`. Usada nos caps. 2, 3, 4 (duas vezes), 5 e 7. Teste garante que cada comparação muda exatamente um parâmetro.
- **Ablação "somente alta confiança"** = filtro do detector no valor do limiar alta × baixa. Equivalente a desligar a etapa 2, porque caixas baixas sem par nunca abrem trilha. Não é chamada de SORT.
- **Microcena** (`bytetrack/microcena.ts`, cenário `micro`, só no curso): 30 quadros, carro com 0,18 nos quadros 10–17, FP isolado de 0,18 nos quadros 12–16, buffer 5. Fixtures Python `microcena-filtro-010/025`: filtro 0,10 → `#0` o tempo todo, FP sempre −1; filtro 0,25 → `#0` removido, tentativa no q18, `#1` no q19. Motor JS idêntico quadro a quadro.
- **Passo a passo do quadro** (`faseQuadro`): Previsão → Etapa 1 → Etapa 2 → Resultado, com caixas previstas, conectores e IoU (`CamadaFase` em `Cena3D.tsx`); botão "Animar as fases" (1,4 s por fase). `TrackSnapshot.caixaPrevista` novo.
- **Linha de estados** (`LinhaDeEstados.tsx`) nos passos do cap. 5 e na microcena.
- **Associação manual** (`AssociacaoManual.tsx`) no cap. 1, quadros 60 → 61; "Real" = verdade de solo, "Rastreador" = tracker_id.
- `versaoConteudo` → `2026-09-29.1` (34 passos): progresso antigo recomeça com aviso.
- Verificação: typecheck 0; `npm test` 47/47 (20 fixtures Python); visuais 10/10 sem atualizar referências.

## 14. Etapa 4 — Supervision, trechos validados e replay Python — 29/09/2026

- **Replay do trackers 2.6.1** (`src/curso/replay.ts`, `src/curso/replays/*.json`, ~40 KB cada, import dinâmico): saída gravada do `ByteTrackTracker` sobre as mesmas detecções da cena "Árvore e viaduto" (notebook 02; e com buffer 60). Gerado por `npx tsx scripts/exportar-cenas.ts oclusao > cena.json` + `python scripts/exportar-replays-bytetrack.py cena.json oclusao-nb02 [lost_track_buffer=60]`. Cada replay guarda versões e **sha256 das detecções**; `tests/curso.test.ts` falha se a cena mudar sem regenerar. Etapas das caixas no replay são inferidas (score × tracker_id).
- Passo novo `c5-python` (A = simulação JS, B = replay): caixa prevista de `#1` no Python 26 → 17 → 7 px (q95/100/106) contra 54 px no JS; veículo 3 vira `#5` no q110; Python 9 IDs / 4 trocas (também com buffer 60) contra 7 / 2 no JS. Faixa de proveniência sob o palco; selo "Replay Python · trackers 2.6.1" no HUD e "Simulação JS" no lado A.
- **Trechos Python validados**: fonte única `src/curso/trechos.json` (6 trechos); `scripts/validar-trechos.py` executa os "executado" (preparo + código + verificação) e confere a API dos "ilustrativo" (dependem de RF-DETR/ultralytics e pesos). Resultado em `src/curso/validacao-trechos.json` (supervision 0.30.5, trackers 2.6.1, numpy 2.3.5, opencv 5.0.0.93, Python 3.11.15), com saída impressa e hash do código. Teste falha se um trecho for editado sem revalidar. **A CI não roda Python**: revalidar localmente ao editar trechos.
- **Inspetor `sv.Detections`**: linha ↔ caixa destacada na cena (mouse/foco), formatos xyxy/xywh/cxcywh, máscara `confidence >= …` só de consulta. Tabela de adaptadores no cap. 6.
- Ligaduras desligadas em código (`!=` e `>=` apareciam como ≠ e ≥).
- **Problema encontrado, pré-existente (já no commit base `df5e24f`)**: `dist-link/laboratorio-bytetrack.html` aberto direto no navegador dá `SyntaxError` por falta de `<meta charset>`; é intencional (fragmento para o publicador de Artifacts, que envolve o documento). Para testar localmente, abrir `dist-link/index.html`. Replay conferido nesse arquivo.
- `versaoConteudo` → `2026-09-29.3` (35 passos). Verificação: typecheck 0; `npm test` 50/50; visuais 12/12.

## 15. Etapa 5 — entrega da aula — 29/09/2026

- **Vista 2D** (`bytetrack/Cena2D.tsx`, SVG de topo): automática sem WebGL (`nucleo/webgl.ts`), automática se o navegador descartar o contexto, e alternável pelo botão "Vista 2D/3D". Mesmas camadas e fases do quadro; sem espaço-tempo. **Problema resolvido:** o R3F força `webglcontextlost` ao desmontar um `Canvas` (ex.: sair de um passo A/B); o tratador agora só reage se o viewport continuar montado (`Viewport3D`, verificação após `setTimeout 0`). Teste de regressão em `curso.spec.js`.
- **Teclado**: `PageDown`/`PageUp` avançam/voltam passos (padrão de passadores de slides; ignorados em campos de texto, listas e sliders); foco vai para o título do passo a cada troca; blocos de código roláveis focáveis; marcadores da linha do tempo com `aria-label`.
- **Resumo final** (`ResumoAula.tsx`): "Concluir a aula" mostra passos vistos e acertos por capítulo e próximos passos nos notebooks.
- **Acessibilidade (axe, WCAG 2 A/AA)**: 0 violações sérias/críticas em 4 passos representativos. Corrigido: contraste de `--texto-3` (#8a8883 → #a4a29c, ≥ 4,5:1 sobre todos os painéis; afeta também o laboratório), controles aninhados na linha do tempo (marcadores agora são irmãos do `role="slider"`), `pre` roláveis sem foco. Linhas fora da máscara do inspetor riscadas em vez de translúcidas.
- **Aula completa sem WebGL e só com teclado**: teste percorre os 35 passos com `PageDown`, responde às 7 questões com `Espaço` e conclui. Celular 390 px na comparação A/B em 2D: sem rolagem horizontal.
- **Desempenho** (`npx tsx scripts/medir-desempenho.ts`; Node 22.22.2, Intel Xeon 2,10 GHz): recalcular um clipe de 240 quadros (executar + avaliar) leva 9–13 ms de mediana, p95 ≤ 15 ms. No Chromium headless deste contêiner (WebGL por software, SwiftShader): interação na vista 2D **20 ms** (mediana, do evento ao quadro pintado); na vista 3D A/B **~290–360 ms**, dominados pela renderização por software (quadro ocioso ≈ 78 ms com dois canvases). **Não medido com GPU**: a meta de 100 ms no 3D continua a verificar em máquina real.
- Referências visuais: `bytetrack-celular.png` atualizada após revisão (aba "Aula 1" e contraste novo); nova `curso-2d-microcena-etapa2.png`.
- Verificação final: typecheck 0; `npm test` 50/50; `npm run test:visual` 20/20 em 3 execuções; `build`, `build:pages` e `build:link` ok (`laboratorio-bytetrack.html` 1.861 KiB; replays inline no arquivo único).
