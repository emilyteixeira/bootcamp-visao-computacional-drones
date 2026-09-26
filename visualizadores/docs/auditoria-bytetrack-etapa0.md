# Etapa 0 — Baseline e auditoria (ByteTrack + Supervision)

Data: 26/09/2026. Base: `main@df5e24f`. Branch: `claude/sleepy-darwin-avgnii`.
Referência Python: `trackers==2.6.1`, `supervision==0.30.5`, `numpy==2.3.5`, `scipy==1.17.1`, Python 3.11.15 (os notebooks declaram 3.12; o tracker não depende de GPU nem de recursos de 3.12).

## 1. Baseline reproduzido

| Comando | Resultado |
|:--|:--|
| `npm ci` | ok (Node 22.22.2) |
| `npm test` | 5/5 (antes das fixtures) |
| `npm run test:visual` | 6/6 (Chromium do contêiner em `/opt/pw-browsers`) |
| `npm run build` | ok; `ByteTrackVisualizador` 1.010 KB (273 KB gzip) |
| `npm run build:link` | `dist-link/laboratorio-bytetrack.html` = **1.679 KiB** (HANDOVER dizia ~1,2 MB) |

## 2. Auditoria dos notebooks (células de código)

| Notebook | Células-chave | Uso na aula |
|:--|:--|:--|
| `01_supervision` | 15 (`predict(threshold=0.25)`, RGB), 16–17 (campos de `sv.Detections`), 18–19 (adaptadores; `from_inference` verificado em memória), 22 (máscara classe & `confidence >= 0.35`), 26–28 (xyxy/xywh/cxcywh), 36 (âncoras `CENTER`/`BOTTOM_CENTER`), 39 (`PolygonZone`) | Capítulos 2 e 6 |
| `02_tracking` | 15 (`LIMIAR_DETECTOR = 0.10`), 17 (`detectar`), 22 (tracker: 0,25 / 0,35 / 2 / 0,10 / 30, `frame_rate=info.fps`), 28 (`update` + filtro `tracker_id != -1`), 29 (“ID zero é válido”), 39 (experimentos: detector 0,50; confirmação 3; buffer) | Capítulos 3–5 |
| `03_projeto_final` | 11 (1920×1080, 806 quadros, 29,97 FPS), 21–22 (YOLOv8x, `conf=0.30`, `from_ultralytics`), 25–26 (alta 0,60, ativação 0,30), 26 (`LineZone` 4 cantos), 36 (`update` → filtro `>= 0` → `trigger`) | Capítulo 7 |

Notas:
- As anotações do PDF (p. 78) usavam `score`/`classes`; os notebooks já usam `confidence`/`class_id`. A correção do plano §4 vale para o texto da aula, não para os notebooks.
- No notebook 03, ativação 0,30 < alta 0,60: só detecções ≥ 0,60 nascem. O limiar de ativação efetivo é 0,60 (a célula 25 já explica).

## 3. Leitura de `trackers.ByteTrackTracker` 2.6.1

Arquivos: `trackers/core/bytetrack/{tracker,tracklet,utils}.py`, `core/base.py`, `utils/state_representations.py`.

1. `predict` em todas as trilhas; `number_of_successful_consecutive_updates` zera se a trilha já estava sem atualização.
2. Alta = `confidence >= high_conf_det_threshold`; baixa = restante.
3. Etapa 1: **todas** as trilhas × altas. `linear_sum_assignment(IoU, maximize=True)` e **depois** rejeição por `>= minimum_iou_threshold`.
4. Etapa 2: **todas as trilhas livres da etapa 1** (tentativas, ativas e perdidas) × baixas, mesmo `minimum_iou_threshold`.
5. Altas livres: saem com `-1`; nascem se `confidence >= track_activation_threshold`. **O ID nunca é emitido no nascimento**, só num `update` posterior com `consecutivas >= minimum_consecutive_frames`.
6. Sobrevive quem está no orçamento **e** (tem ID, ou `consecutivas >= mínimo`, ou foi atualizada no quadro).
7. Orçamento: `0` se buffer 0; senão `max(1, ceil(frame_rate/30 · lost_track_buffer))`; mantém enquanto `time_since_update <= orçamento`.
8. IDs começam em **0**.
9. Kalman padrão: `XYXYStateEstimator` (8D, cantos + velocidades), `R × 0,1`, `Q × 0,01`, sem congelar tamanho.

## 4. Matriz de diferenças (JS `bytetrack.js` × Python 2.6.1)

Fixtures: `tests/fixtures/bytetrack/*.json` (16), geradas por `scripts/exportar-fixtures-bytetrack.py`. Comparação: `tests/fixtures-python.test.js`, IDs normalizados por ordem de emissão.

| Cód. | Diferença | JS | Python 2.6.1 | Fixture | Impacto didático |
|:--|:--|:--|:--|:--|:--|
| D1 | Candidatas da etapa 2 | só `ativa` | tentativas, ativas e perdidas | `etapa2-tentativa`, `etapa2-perdida` | Alto: capítulo 4. No Python uma caixa 0,20 confirma tentativa e recupera trilha perdida |
| D2 | Estado do Kalman | cx,cy,w,h, ruído ∝ tamanho, congela tamanho fora de `ativa` | x1,y1,x2,y2, sem congelar | `kalman-oclusao` | Médio: IDs iguais; caixa prevista diverge até **6,6 px** após 5 quadros de oclusão (velocidade JS ≈ 10,8 vs 12 px/quadro) |
| D3 | `minimum_consecutive_frames = 1` | ID no nascimento | ID no 2º `update` | `confirmacao-1-quadro` | Alto: invalida “1 → 75 IDs” do HANDOVER §5; no Python um falso positivo de 1 quadro não recebe ID |
| D4 | Escala do buffer | `max(1, round(·))` | `0` se buffer 0; senão `max(1, ceil(·))` | `buffer-zero`, `buffer-fps-25` | Baixo a 30 FPS; muda com 25 FPS (4 vs 5) e buffer 0 |
| D5 | Primeiro ID | 1 | 0 | `nascimento` | Médio: contradiz o notebook 02, célula 29 (“ID zero é válido”) |
| D6 | Aceite do par | `>= mínimo` e `> 0` | `>= mínimo` | — | Só com `minimum_iou_threshold = 0` |
| D7 | Modo por timestamp | ausente | `update(..., timestamp=)` | — | Nenhum nos notebooks (FPS fixo) |

Equivalências confirmadas (fixtures passam): nascimento, quadros vazios, limites exatos 0,25/0,34/0,35, baixa isolada sem ID, microcena 0,18 (filtro 0,10 × 0,25), confirmação interrompida, buffer 3 com lacunas 3 e 4, **atribuição ótima seguida de rejeição** (`ambiguidade-limiar`: ambos perdem o par B×d1 válido), Kalman com mesmos IDs.

## 5. Afirmações dos documentos que precisam de correção

| Documento | Afirmação | Fato verificado |
|:--|:--|:--|
| HANDOVER §3, passo 5 | Etapa 2: trilhas `ativa` livres × baixas | Python usa todas as livres (D1) |
| HANDOVER §3, simplificações | Mesmo IoU nas duas etapas é simplificação (“o artigo usa 0,5”) | trackers 2.6.1 também usa o mesmo limiar; a diferença é em relação ao repositório original do artigo |
| HANDOVER §3 / plano §8 | Original usa xyah | Verdade para o repositório do artigo; a referência dos notebooks (trackers 2.6.1) usa XYXY |
| HANDOVER §4, problema 2 | Congelar tamanho “como no original” | Existe no repositório do artigo, não em trackers 2.6.1 |
| HANDOVER §5 | `minimum_consecutive_frames` 1 → 75 IDs | Artefato de D3 |
| Plano §8 | Verificar se `associarPorIou` perde pares por limiar posterior | Perde, e o Python também: comportamento equivalente |
| HANDOVER §1 | build:link ~1,2 MB | 1.679 KiB medidos |

## 6. Decisões pendentes (da autora)

1. Alinhar D1, D3, D4, D5 ao Python antes da narrativa (etapa 3) ou manter e rotular como simplificação.
2. D2: adotar XYXY do trackers 2.6.1 ou manter cx,cy,w,h rotulado. Risco: remover o congelamento de tamanho pode reintroduzir o problema 2 do HANDOVER §4 (IDs novos após o viaduto) — validar na cena `oclusao` com buffer 60.
3. Ordem: correções do motor antes ou depois da migração TypeScript (o plano proíbe misturar as duas no mesmo commit, não define a ordem).

## 7. Como regenerar

```text
python -m venv .venv && .venv/bin/pip install trackers==2.6.1 supervision==0.30.5 numpy==2.3.5
.venv/bin/python scripts/exportar-fixtures-bytetrack.py   # reescreve tests/fixtures/bytetrack/
npm test                                                  # 23 testes: 16 ok, 7 todo (D1, D3, D4, D5)
```
