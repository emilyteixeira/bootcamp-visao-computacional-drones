# Handover: visualizadores (ByteTrack)

Atualizado em 26/09/2026. Branch: `claude/modest-feynman-ooop2k`.

## 1. Estado atual

| Item | Estado |
|:--|:--|
| Módulo ByteTrack | Pronto e publicado em https://claude.ai/artifact/VwfuEtPjrsJmJoM7Y8AX4j (privado até ser compartilhado) |
| Testes | `npm test`: 5/5 passam. `npm run test:visual`: 6/6 passam em 3 execuções seguidas |
| GitHub Pages | Workflow pronto, mas ainda não publicado: depende do merge na `main` e de Settings → Pages → Source: GitHub Actions |
| `useblender-cli` | Cancelada pela autora em 26/09/2026. O visual continua com R3F e drei |
| Build | `npm run build:link`: arquivo único de aproximadamente 1,2 MB, 350 KB com gzip |
| Vagas reservadas | `iou-nms`, `kalman`, `linezone`, `homografia` (status `planejado` em `src/registro.js`) |

## 2. Decisões tomadas

| Decisão | Motivo |
|:--|:--|
| Vite + React 19 + R3F 9 + drei 10 + three 0.186, em JavaScript (JSX), sem TypeScript | Stack pedida. JS é a linguagem conhecida pela autora |
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

## 6. Próximos passos sugeridos

1. Compartilhar o Artifact pelo menu *Share* para os alunos.
2. Implementar a vaga `kalman` reaproveitando `bytetrack/kalman.js` (elipses de covariância).
3. Implementar `linezone`, espelhando `sv.LineZone` com âncoras nos 4 cantos (projeto final).
4. Opcional: publicar `dist/` no GitHub Pages para ter um link público sem login.

## 7. Como retomar em 5 minutos

`cd visualizadores && npm install && npm test && npm run dev`, depois abra `http://localhost:5173/#bytetrack`. Para republicar, rode `npm run build:link` e publique `dist-link/laboratorio-bytetrack.html` no mesmo URL do Artifact.
