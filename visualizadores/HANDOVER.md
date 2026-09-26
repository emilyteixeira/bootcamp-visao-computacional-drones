# Handover: visualizadores (ByteTrack)

Atualizado em 26/09/2026. Branch proposta: `codex/plano-curso-bytetrack-supervision` (não criada; escrita pelo conector recusada com HTTP 403).
Base lida: `main@df5e24f4c44f0c6db9f55bc892a16800ec81eeaf`.

> O curso guiado e a migração TypeScript estão planejados, ainda não implementados. Consulte o [plano completo](docs/plano-curso-bytetrack-supervision.md). Os registros de publicação abaixo descrevem a sessão anterior; não são uma nova verificação de deploy.

## 1. Estado atual

| Item | Estado |
|:--|:--|
| Módulo ByteTrack | Pronto e publicado em https://claude.ai/artifact/VwfuEtPjrsJmJoM7Y8AX4j (privado até ser compartilhado) |
| Testes | `npm test`: 5/5 passam. `npm run test:visual`: 6/6 passam em 3 execuções seguidas |
| GitHub Pages | Publicado em https://emilyteixeira.github.io/bootcamp-visao-computacional-drones/#bytetrack (run 36253508693, deploy às 15:55 UTC de 26/09/2026). Cada push na `main` que altere `visualizadores/` republica |
| `useblender-cli` | Cancelada pela autora em 26/09/2026. O visual continua com R3F e drei |
| Build | `npm run build:link`: arquivo único de aproximadamente 1,2 MB, 350 KB com gzip |
| Vagas reservadas | `iou-nms`, `kalman`, `linezone`, `homografia` (status `planejado` em `src/registro.js`) |

## 2. Decisões tomadas

| Decisão | Motivo |
|:--|:--|
| Vite + React 19 + R3F 9 + drei 10 + three 0.186 | Stack existente preservada. A decisão anterior de permanecer sem TypeScript foi substituída pelo pedido explícito de React + TypeScript em 26/09/2026; migração pendente |
| Build em arquivo único (`vite-plugin-singlefile`) | O publicador de Artifacts só aceita scripts de CDNs permitidos. Com tudo embutido, não há dependência de CDN |
| O tracker é reimplementado em JS e não chama o Python | Precisa rodar no navegador e responder aos controles na hora. Uma varredura de 14 valores leva cerca de 200 ms |
| Semântica e nomes de `trackers.ByteTrackTracker` (trackers==2.6.1) | São os usados em `projeto-3/02_tracking.ipynb` e `03_projeto_final.ipynb`. `sv.ByteTrack` aparece só como mapeamento |
| Cenas sintéticas e determinísticas (semente) | Permitem comparar parâmetros na mesma cena e medir contra verdade de solo |
| Tema escuro único, inspirado no Blender | Escolha deliberada para o viewport 3D |
| Roteamento por `#id` | O link do Artifact só preserva âncoras simples |

## 3. Semântica do tracker (bytetrack.js)

Ordem em cada quadro:
1. Filtro `limiar_detector`.
2. Previsão de Kalman.
3. Separação das detecções em ALTA (≥ `high_conf_det_threshold`) e BAIXA.
4. Etapa 1: todas as trilhas × ALTAS.
5. Etapa 2: trilhas `ativa` livres × BAIXAS.
6. Tentativa sem par é removida. Ativa sem par passa a `perdida`.
7. Remoção quando `semAtualizar > round(lost_track_buffer × frame_rate / 30)`.
8. Nascimento: ALTA livre com score ≥ `track_activation_threshold`.
9. `tracker_id` emitido após `minimum_consecutive_frames` associações seguidas. Antes disso, −1.

Simplificações conhecidas: Kalman em xywh (o original usa xyah); o mesmo `minimum_iou_threshold` nas duas etapas (o artigo usa 0,5 na etapa 2); sem compensação de movimento da câmera; avaliação com IoU ≥ 0,3.

Mapeamento para `sv.ByteTrack`: `track_activation_threshold` separa alta de baixa; `det_thresh` = ativação + 0,1; `minimum_matching_threshold` = 1 − IoU mínimo; piso fixo em 0,1.

## 4. Problemas resolvidos (não reintroduzir)

| Problema | Causa | Correção |
|:--|:--|:--|
| Nenhuma trilha nascia | `associarPorIou` deduzia `nCol` da matriz, que fica vazia quando há 0 trilhas | `nCol` passou a ser um argumento explícito em todas as chamadas |
| IDs novos depois do viaduto, mesmo com buffer 60 | A velocidade de tamanho do Kalman encolhia a caixa prevista até sumir | `prever(kf, congelarTamanho)` zera vw e vh quando a trilha não está `ativa`, como no original |
| Trocas de ID artificiais no cenário "Drone alto" | Carros da mesma faixa com velocidades diferentes se atravessavam | Velocidade fixada por faixa |
| Teste visual da vista topo instável (3% de pixels) | A animação da câmera parava a menos de 0,01 do destino, em ponto variável | Encaixe exato no destino em `AnimadorDeVista` |
| Testes visuais falharam na CI em 4 de 6 cenários (3–11% de pixels) | Fontes de fallback do sistema diferentes entre este contêiner e a imagem do Playwright | Fontes Barlow e JetBrains Mono embutidas via `@fontsource` (sem Google Fonts) |
| Aba ativa de módulo planejado ilegível | `.aba-modulo.planejado` sobrescrevia a cor de `.ativa` | Regra `.aba-modulo.ativa.planejado` |
| Teste visual do celular falhou na CI (~2,05%, tolerância de 2%) | Canvas WebGL ocupa ~62% da tela; rasterização por software varia entre máquinas | Canvas mascarado só nesse teste de layout. O 3D segue coberto pelos testes de desktop |
| Terminal travado | `cat > arquivo` sem heredoc ficou esperando stdin | Sempre usar heredoc |

## 5. Efeitos calibrados (Notebook 02 como base, formato IDs/trocas/cobertura)

- Árvore e viaduto, `lost_track_buffer`: 5 → 12/7/83%; 30 → 7/2/85%; 60 → 5/0/86%.
- Drone alto, `high_conf_det_threshold`: 0,25 → 11/1/90%; 0,6 → 3/0/20%. É a armadilha do Notebook 03 em objetos pequenos.
- Drone alto, `minimum_consecutive_frames`: 1 → 75 IDs (falsos positivos confirmados); 2 → 11.
- `minimum_iou_threshold` ≥ 0,5 fragmenta: no Drone alto, 67 IDs e 134 trocas.

## 6. Próximos passos atuais

1. Auditar as células dos três notebooks do projeto 3 e a implementação Python fixada; o conector não retornou o conteúdo dos arquivos grandes nesta sessão.
2. Criar fixtures pequenas para separar simplificações didáticas de comportamento Python.
3. Migrar incrementalmente o visualizador para TypeScript, preservando o laboratório atual.
4. Implementar a rota de curso guiado, a narrativa em sete capítulos e o inspetor de Supervision conforme o plano.
5. Validar aula, acessibilidade, build e testes; registrar resultados antes de publicação.

As vagas Kalman, LineZone e homografia continuam reservadas, mas a prioridade atual é a primeira aula ByteTrack + Supervision.

## 7. Como retomar em 5 minutos

`cd visualizadores && npm install && npm test && npm run dev`, depois abra `http://localhost:5173/#bytetrack`. Para republicar, rode `npm run build:link` e publique `dist-link/laboratorio-bytetrack.html` no mesmo URL do Artifact.

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
Plano e HANDOVER atualizados foram salvos localmente. A tentativa de criar a branch e gravar os documentos no GitHub foi recusada com HTTP 403, Resource not accessible by integration. Nenhum commit, branch ou PR foi criado. Aplicar o patch de documentação ao repositório quando houver acesso de escrita e registrar o commit resultante aqui.

