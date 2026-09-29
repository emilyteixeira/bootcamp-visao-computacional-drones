# Plano de implementação — Aula 1: ByteTrack e Supervision

Data: 26/09/2026. Estado: planejamento concluído; implementação ainda não iniciada.
Base auditada: `main@df5e24f4c44f0c6db9f55bc892a16800ec81eeaf`.
Escopo solicitado: evoluir o visualizador existente para um curso interativo em React e TypeScript, com animações 3D inspiradas no Blender.

## 1. Resultado pretendido

A primeira aula será “Como manter a identidade quando a detecção falha?”. Público presumido: alunos que já entendem caixas, classes e confiança, mas estão começando tracking. Duração proposta: 50–65 minutos, com exploração livre depois.

Ao terminar, o aluno deverá conseguir:
- Distinguir detecção, associação temporal e contagem.
- Explicar por que uma caixa de baixa confiança pode ajudar uma trajetória existente.
- Inspecionar previsão, associação e ciclo de vida quadro a quadro.
- Reconhecer o papel de Supervision e do pacote Trackers no código Python.
- Ajustar um parâmetro de cada vez e justificar o efeito observado.
- Identificar limites do exemplo sintético e a necessidade de validação em vídeo real.

Entregável desta etapa: plano e atualização de HANDOVER. A migração e a aula serão implementadas nas etapas abaixo.

## 2. Leitura da codebase

| Parte existente | Evidência e responsabilidade | Decisão |
|---|---|---|
| Repositório | Notebooks introdutórios, aula-02, projetos 1–3, dados e visualizadores | Integrar o curso à aplicação existente |
| `visualizadores/package.json` | React 19, Vite 8, Three, R3F e drei; fontes locais; sem TypeScript | Acrescentar tipagem sem trocar a stack 3D |
| `src/App.jsx`, `registro.js` | Casca com importação lazy e rotas por hash | Preservar `#bytetrack`; acrescentar `#curso-bytetrack` |
| `nucleo/Viewport3D.jsx` | Grade, órbita, gizmo, câmeras e atalhos | Reutilizar; acrescentar alternativa 2D e tratamento de perda de WebGL |
| `usarReproducao.js`, `LinhaDoTempo.jsx` | Reprodução por quadros, velocidade e eventos | Tornar controláveis pela aula e pelos checkpoints |
| `bytetrack/cenarios.js` | Árvore/viaduto, cruzamento e drone alto; 240 quadros, sementes fixas | Reaproveitar os três cenários e adicionar um microcenário sem ruído |
| `bytetrack.js`, `kalman.js`, `nucleo/hungaro.js` | Motor didático independente de React | Tipar, instrumentar e auditar antes de alegar equivalência com Python |
| `Paineis.jsx`, `parametros.js` | Etapas, parâmetros, conceitos e predefinições dos notebooks | Extrair componentes para aula guiada e laboratório livre |
| `metricas.js` | Avaliação sintética com IoU ≥ 0,3 | Manter rótulo de métricas didáticas; não chamar de HOTA/IDF1 oficial |
| `projeto-3/` | Supervision, tracking e projeto final; versões Python fixadas | Vincular exemplos e exportações a essas versões |
| CI | Testes Node, Playwright e build Pages; deploy em main | Incluir typecheck; preservar publicação atual |

A leitura cobriu fontes do visualizador, testes, configurações, HANDOVER e documentação do projeto 3. Os três notebooks excederam o limite de conteúdo do conector: retornaram conteúdo vazio ou erro de tamanho. O mapeamento de seus objetivos vem dos READMEs, REFERENCIAS e predefinições existentes; a auditoria célula a célula permanece uma tarefa explícita da etapa 0.

Verificação executada em uma cópia dos arquivos do commit: **5/5 testes de lógica passaram** com Node. Build e Playwright não foram executados nesta etapa documental. Os resultados anteriores de publicação/testes visuais no HANDOVER são históricos.

## 3. Curadoria científica

Critério: fontes primárias, contribuição diretamente associada a um objetivo da aula e limites explícitos. Não se pretende comparar rankings de protocolos diferentes.

| Prioridade | Fonte | Uso didático e limite |
|---|---|---|
| Central | Zhang et al., [ByteTrack: Multi-Object Tracking by Associating Every Detection Box](https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136820001.pdf), ECCV 2022; [arXiv](https://arxiv.org/abs/2110.06864) | Seção 3, algoritmo 1 e figura 2: associação de alta confiança seguida da recuperação com baixa confiança. BYTE é o método de associação; o tracker do artigo combina-o com YOLOX. O exemplo com RF-DETR/YOLOv8 é outra composição |
| Fundamento | Bewley et al., [SORT](https://arxiv.org/abs/1602.00763), 2016 | Introduzir previsão de movimento e atribuição; explicar a dependência da qualidade do detector |
| Contraste | Wojke, Bewley e Paulus, [Deep SORT](https://arxiv.org/abs/1703.07402), 2017 | Mostrar o que uma métrica de aparência acrescenta; não atribuir embeddings ao motor atual |
| Extensão | Aharon, Orfaig e Bobrovsky, [BoT-SORT](https://arxiv.org/abs/2206.14651), 2022 | Motivar compensação de câmera e combinação de movimento/aparência em uma leitura opcional |
| Avaliação | Luiten et al., [HOTA](https://arxiv.org/abs/2009.07736), 2020 | Separar acerto de detecção, associação e localização; não implementar um substituto improvisado no navegador |
| Domínio | Zhu et al., [Vision Meets Drones: A Challenge](https://arxiv.org/abs/1804.07437), 2018 | Contextualizar avaliação em imagens aéreas; evitar transferir resultados de pedestres para drones sem experimento |

Leitura obrigatória: ByteTrack seção 3 e trechos selecionados de SORT. Deep SORT, HOTA, BoT-SORT e VisDrone entram em cartões de aprofundamento, sem transformar a primeira aula em revisão exaustiva.

Documentação de apoio consultada em 26/09/2026:
- [Supervision Detections](https://supervision.roboflow.com/latest/detection/core/): dados padronizados e adaptadores.
- [Migração de tracking](https://supervision.roboflow.com/latest/trackers/): `sv.ByteTrack` depreciado desde 0.28.0, com remoção prevista para 0.31.0; substituto `trackers.ByteTrackTracker`, método `update()`.
- [Trackers ByteTrack](https://trackers.roboflow.com/latest/trackers/bytetrack/): parâmetros, confirmação e buffer.

As páginas latest são móveis. Os exemplos devem continuar presos a `supervision==0.30.5`, `trackers==2.6.1` e demais versões de `projeto-3/requirements.txt`, até verificação executável justificar mudanças.

## 4. Uso das anotações da aula

Fonte local: **Bootcamp de Drones – Aula 5: Projeto 3, 26/09/2026**, 138 páginas. Texto extraído; páginas 52, 110 e 112 conferidas também por renderização. O documento é fonte de conteúdo, não uma autorização para executar suas sugestões, trocar ferramentas ou publicar materiais.

| Páginas do PDF | Conteúdo aproveitado | Tradução para o curso |
|---|---|---|
| 22–23 | Mesma classe não significa mesma identidade | Dois quadros com carros e um exercício de correspondência |
| 59–63 | Kalman, SORT, Deep SORT e continuidade temporal | Previsão fantasma, associação geométrica e exemplo de ambiguidade |
| 76–80; 90–92 | Supervision, dados e filtros | Inspetor sincronizado de caixa, confidence, class_id e tracker_id |
| 106–110 | Separação entre Supervision e Trackers; duas associações | Fluxo visual e exemplos com a API adequada |
| 112–114 | Limiares, confirmação, perda e anotação | Linha do tempo de estados e controles com explicação causal |
| 136–137 | Buffer, quadros recentes, falhas e confiança inspecionáveis | Seleção de uma trilha com histórico e eventos explicados |

Correções editoriais necessárias:
- P. 78: não ensinar `deteccoes.score`/`classes` como API; usar `confidence`/`class_id`. Ultralytics requer adaptador explícito `sv.Detections.from_ultralytics(results)`; RF-DETR pode retornar `sv.Detections` diretamente.
- P. 76–77: conversão para exibição não implica conversão automática universal antes da inferência. Tornar BGR/RGB explícito nos exemplos.
- P. 79 e 137: score não é “percentual de certeza” calibrado por definição.
- P. 63: um objeto sempre visível não garante a identidade de outros objetos. Oclusão completa e cruzamento ambíguo continuam podendo gerar erros.
- P. 110: não prometer recuperar todos os objetos válidos.
- P. 112–114: distinguir confirmação inicial de sobrevivência no buffer. “Dois quadros” é uma configuração da prática, não uma regra universal.
- P. 112: o parâmetro de FPS do tracker não configura a câmera nem a velocidade de reprodução.
- SIFT/SURF, gradientes, homografia e casos industriais entram só como links opcionais; não são pré-requisitos adicionais para esta aula.

## 5. Roteiro e storyboard da primeira aula

Cada capítulo segue: observar → prever → manipular → explicar → conferir uma questão curta. Texto em português; termos originais aparecem junto aos nomes de API.

| Capítulo | Tempo | Animação/interação | Evidência de aprendizado |
|---|---:|---|---|
| 1. O mesmo carro? | 5 min | Dois frames e cinco carros; associar manualmente antes de revelar IDs | Distinguir classe de identidade |
| 2. Do detector ao Detections | 8 min | Caixa e linha da tabela destacadas juntas; alternar xyxy e xywh; filtrar por classe/score | Indicar qual dado se perde ao filtrar cedo |
| 3. Prever antes de associar | 7 min | Caixa prevista translúcida, medição e deslocamento; pausar no intervalo sem detecção | Separar previsão de observação |
| 4. Por que duas etapas? | 12 min | Árvore reduz score; destacar alta/baixa, matriz IoU e pares; comparar A/B sincronizado | Explicar por que uma caixa fraca mantém uma trilha e não inicia outra |
| 5. Nascer, confirmar, perder, remover | 8 min | Viaduto e linha de estados; variar confirmação e buffer separadamente | Explicar ID -1, confirmação e expiração |
| 6. Supervision na prática | 10 min | Mesmo frame em vista 3D, tabela e trecho Python; ativar caixas/rótulos/rastros | Reconstruir detector → Detections → tracker → anotadores |
| 7. Desafio do drone alto | 10 min | Objetos pequenos, score modesto e limiar excessivo; diagnóstico com replay | Justificar ajuste e apontar um erro residual |

Abertura sugerida: “O carro não desapareceu do mundo. Por que desapareceu do rastreamento?”

Microcena pedagógica proposta: uma trilha confirmada encontra uma detecção de score 0,18; filtro do detector 0,10 e separação alta/baixa 0,25. Com compatibilidade espacial suficiente, a segunda etapa pode associá-la. Elevar o filtro do detector a 0,25 remove essa possibilidade. Uma caixa fraca isolada não deve produzir um novo ID. Essa cena será construída como fixture explícita, não escolhida por sorteio até dar o resultado desejado.

Comparação A/B: mesmas detecções, semente, quadro e câmeras; apenas um parâmetro ou a ablação da segunda etapa muda. Chamar o baseline de “somente alta confiança”; não rotulá-lo de SORT completo.

Questões com feedback:
1. “Uma detecção de 0,18 deve sempre ser descartada?” Não; depende do filtro de entrada e da associação à trajetória.
2. “Aumentar o buffer garante o mesmo ID?” Não; preserva candidatas, mas não resolve toda ambiguidade.
3. “17 IDs confirmados significam 17 veículos únicos?” Não; fragmentação pode produzir vários IDs para o mesmo veículo.
4. “Onde o Supervision entra?” Padronização/manipulação dos resultados e anotação; o rastreador utilizado vem de Trackers.

## 6. Direção visual

Manter o tema escuro, grade, gizmo e atalhos já existentes. “Estilo Blender” significa uma cena 3D manipulável e uma linha do tempo com eventos, sem dependência obrigatória de Blender/CLI.

Palco principal com veículos simples, árvore e viaduto; painéis laterais de roteiro e inspeção. No modo guiado, revelar uma camada por vez. No livre, disponibilizar controles completos. Mostrar desenho sólido/tracejado e rótulos além de cores.

Animação da câmera, do quadro e da explicação deve usar um estado comum. Câmera pode interpolar; associação só muda nos instantes dos frames. Ao selecionar uma trilha, destacar suas caixas e seu histórico, com explicação textual acessível.

No celular, empilhar palco e painel. Ações por toque/teclado substituem hover. Respeitar prefers-reduced-motion, começar a aula pausada e oferecer “pular animação”. Uma tabela e cena 2D devem permitir completar a aula sem WebGL. A representação 3D atual é ilustrativa: escala de pixels para mundo não equivale a calibração física ou homografia.

## 7. Arquitetura proposta

Manter motor, conteúdo e renderização separados:

```text
visualizadores/
  src/curso/
    CursoByteTrack.tsx
    AulaShell.tsx
    capitulos/aula01.ts
    tipos.ts
    usarAula.ts
    componentes/
      PainelRoteiro.tsx
      Questao.tsx
      InspetorDetections.tsx
      ComparacaoAB.tsx
      Referencia.tsx
  src/visualizadores/bytetrack/
    tipos.ts
    usarExperimento.ts
    [módulos existentes migrados gradualmente para .ts/.tsx]
  src/nucleo/
    [viewport, reprodução e UI reutilizados]
  public/aulas/bytetrack/
    manifest.json
    fixtures/
  scripts/exportar-fixtures-bytetrack.py
  docs/plano-curso-bytetrack-supervision.md
  HANDOVER.md
```

Contratos propostos:
- `Detection`: id estável por frame, caixa xyxy, confidence, classId. groundTruthId fica em estrutura de avaliação separada e nunca influencia o tracker.
- `TrackSnapshot`: id interno, trackerId opcional, estado, caixa prevista/corrigida, idade sem atualização.
- `AssociationEvent`: frame, fase, candidatos, custo, pares aceitos/rejeitados e razão.
- `LessonStep`: objetivo, fonte/página, cenário, preset, frame ou evento-alvo, camadas, texto e questão.
- `ExperimentManifest`: schemaVersion, fonte sintética/real, FPS, tamanho, seed, versões, detector, parâmetros, licença e hashes.
- `CourseProgress`: versão do conteúdo, capítulo, questões e último checkpoint; localStorage com recuperação segura se indisponível/incompatível.

A lógica calcula instantâneos; React apresenta o frame selecionado; a aula controla presets e checkpoints. Não ler estado do Canvas para decidir acertos pedagógicos. Reproduzir, voltar ou saltar para um frame deve mostrar o mesmo resultado.

Migrar primeiro tipos, geometria, RNG, associação, Kalman, cenários e métricas; depois componentes, registro e App. Introduzir TypeScript, tipos React/Three e `tsc --noEmit`, com strict nos arquivos migrados e allowJs temporário. Acrescentar um runner compatível com testes TypeScript (proposta: tsx + node:test), ajustando scripts e CI sem depender implicitamente da versão local de Node. Não misturar migração mecânica com correções matemáticas.

## 8. Fidelidade e integração Python

O browser continuará executando uma simulação didática. Supervision e Trackers são bibliotecas Python; trechos de código e replays exportados não serão apresentados como execução dessas bibliotecas no navegador.

Antes de anunciar equivalência:
1. Conferir notebooks e fontes dos pacotes nas versões fixadas.
2. Exportar pequenas sequências determinísticas de detecções e saídas Python, sem exigir GPU.
3. Comparar estados, correspondências e persistência de identidade; normalizar numeração de IDs quando só a ordem de emissão diferir.
4. Registrar divergências intencionais e suas consequências; para demonstrar comportamento exato, preferir replay da implementação Python.

Auditoria prioritária:
- Kalman local usa xywh e quatro filtros independentes; não afirmar equivalência integral ao estado xyah original.
- `associarPorIou` aplica o limiar depois da atribuição. Verificar se candidatos proibidos influenciam o ótimo e causam rejeições evitáveis; incluir caso adversarial.
- Etapas de tentativas/confirmadas/perdidas, limites inclusivos de confiança, nascimento e expiração precisam de fixtures.
- `minimum_matching_threshold = 1 - IoU` não deve ser apresentado como tradução universal entre APIs: custo com fusão de score e etapas diferentes exige conferência.
- O mesmo IoU nas duas etapas e tratamento de tentativas são escolhas do simulador. Conferir implementação original antes de atribuir limiares específicos ao artigo.
- A primeira associação genérica de BYTE admite aparência em variantes; esta prática usa geometria, sem ReID.
- Diferenciar FPS da fonte, taxa de amostragem efetiva, FPS informado ao tracker e velocidade visual. Alterar um não deve modificar silenciosamente os demais.

Replays reais: começar pelos vídeos já documentados em `projeto-3/assets/videos/`, com caixas em JSON e metadados verificáveis. Gerar no ambiente Python de referência; carregar sob demanda. Não incluir pesos, inferência em browser, backend, upload, RTSP ou autenticação no MVP. Para vídeo comprimido, validar alinhamento temporal e oferecer frames extraídos quando a inspeção exata exigir.

## 9. Etapas de implementação e critérios de aceite

| Etapa | Trabalho | Critério de conclusão |
|---|---|---|
| 0. Baseline e auditoria | Ler células dos notebooks; capturar ambiente; revisar semântica e fontes | Matriz de diferenças e fixtures mínimas; build/testes atuais reproduzidos |
| 1. TypeScript | Migração em incrementos, tipos e typecheck na CI | Sem alteração intencional do comportamento; testes e build Pages verdes |
| 2. Estrutura do curso | Nova rota, capítulos, checkpoints, fontes e progresso local | Avançar, voltar, recarregar e retomar sem perder estado válido; laboratório original acessível |
| 3. Narrativa ByteTrack | Microcena, associação por fase, estados e comparação A/B | Alterar parâmetro preserva as detecções de entrada; segunda etapa explicável por quadro |
| 4. Supervision | Inspetor de dados, adaptadores explicados e replay Python | Snippets validados nas versões fixadas; proveniência e distinção simulação/replay visíveis |
| 5. Entrega da aula | Exercícios, acessibilidade, responsividade e desempenho | Aula completa navegável por teclado; fallback 2D; CI e revisão visual aprovadas |

Testes relevantes: nascimento sem trilhas, detecções vazias, caixas inválidas, limites exatos dos thresholds, baixa isolada sem nascimento, confirmação interrompida, buffer antes/no/depois do limite, ambiguidade na atribuição, reset entre execuções, seek determinístico e isolamento de ground truth. Manter os cinco testes existentes e os seis cenários Playwright; atualizar referências apenas após revisão do resultado.

Metas iniciais, a medir em máquina/navegador documentados: interação de controles abaixo de 100 ms nas cenas padrão e navegação 3D fluida em desktop. Se varredura de parâmetros bloquear a UI, adotar debounce e Web Worker; não introduzir worker antes de medir. Replays e modelos 3D opcionais devem ser carregados sob demanda; não embutir vídeos grandes no build singlefile.

## 10. Continuidade

A cada avanço, atualizar `visualizadores/HANDOVER.md` com: commit/branch, etapa concluída, arquivos alterados, decisões, fontes/versões, comandos e resultados realmente executados, limitações e próximo passo reproduzível. Preservar o histórico anterior e marcar decisões substituídas.

Próximo passo concreto: etapa 0, seguida da migração TypeScript em uma mudança separada da lógica e da narrativa. Este plano não declara implementados recursos novos nem valida a execução dos notebooks.


## 11. Atualizações

- **27/09/2026 — decisões da autora.** Público mantido conforme §1, sem encurtar capítulos e com explicações detalhadas em todos eles. Motor alinhado ao `trackers` 2.6.1 (D1, D3, D4, D5) antes da migração TypeScript; Kalman didático (D2) mantido e rotulado. Detalhes e números: `docs/auditoria-bytetrack-etapa0.md` §6 e §8.
- **Consequências para o roteiro (§5):** capítulo 4 deve mostrar que a etapa 2 também atende trilhas perdidas e tentativas; capítulo 5 deve explicar que o ID só sai a partir do 2º quadro (mínimo 1 ou 2 têm o mesmo atraso), que o primeiro ID é 0 e que o efeito do buffer depende da caixa prevista não encolher (no `trackers` 2.6.1 a cena do viaduto perde o ID).
- **§8, auditoria prioritária:** atribuição com limiar posterior é equivalente ao Python (fixture `ambiguidade-limiar`); o mesmo IoU nas duas etapas também é o comportamento do `trackers` 2.6.1; o Kalman de referência é XYXY, não xyah.
- **27/09/2026 — etapa 2 concluída.** Rota `#curso-bytetrack` com os 7 capítulos do §5 roteirizados (33 passos, 7 questões), contratos do §7 (`Passo` ≈ LessonStep, `ProgressoCurso` ≈ CourseProgress), progresso local com recuperação segura e testes. Desvio do §7: `InspetorDetections` e `Referencia` já existem em versão básica; `ComparacaoAB` fica para a etapa 3. Fixtures do curso permanecem em `tests/fixtures/`, não em `public/aulas/` (ainda não há replays).
- **29/09/2026 — etapas 3, 4 e 5 concluídas.** Comparação A/B sincronizada, microcena conferida no Python, fases do quadro, linha de estados e associação manual (etapa 3); replay do trackers 2.6.1 com hash das detecções, trechos Python executados nas versões fixadas e inspetor sincronizado (etapa 4); vista 2D, teclado, resumo final, axe WCAG A/AA e medições de desempenho (etapa 5). Desvios: replays usam as cenas sintéticas (vídeo real exige pesos e GPU); a meta de 100 ms no 3D não foi verificada com GPU. Detalhes no HANDOVER §13–15.
