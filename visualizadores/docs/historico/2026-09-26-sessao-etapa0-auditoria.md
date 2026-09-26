# Histórico da sessão: 26/09/2026, curso ByteTrack — etapa 0

## Pedido

Implementar, etapa por etapa, a primeira aula do curso interativo (ByteTrack + Supervision) em React + TypeScript, com visual 3D estilo Blender e sequência: aula guiada pelas notas → experimentos comparativos do laboratório → exemplos ligados aos notebooks. Anexos: `HANDOVER.md` e `PLANO-CURSO-BYTETRACK-SUPERVISION.md` (produzidos com o Codex).

## Pontos levados à autora

1. **Contradição de público:** o plano (§1) presume alunos “começando tracking”; o pedido fala em público com experiência em detecção **e** tracking. Afeta a duração dos capítulos 1 e 3.
2. **Contradição de fidelidade:** o HANDOVER afirmava que o motor JS espelha `trackers.ByteTrackTracker` 2.6.1. A etapa 0 encontrou 5 divergências de comportamento (D1, D3, D4, D5, D6) e uma de modelo (D2).
3. “Estilo Blender” segue o plano §6 (R3F + drei; `useblender-cli` cancelada). Sem conflito.

## O que foi feito

1. Commit `46b0f78`: plano e HANDOVER versionados (gravação anterior recusada por 403). Plano em `docs/plano-curso-bytetrack-supervision.md`.
2. Baseline: `npm test` 5/5, `test:visual` 6/6, builds ok; `build:link` = 1.679 KiB (não ~1,2 MB).
3. Notebooks 01/02/03 lidos por células; `trackers` 2.6.1 instalado e lido.
4. `scripts/exportar-fixtures-bytetrack.py` + 16 fixtures + `tests/fixtures-python.test.js`.
5. `docs/auditoria-bytetrack-etapa0.md`: matriz D1–D7, correções de afirmações, decisões pendentes.
6. HANDOVER atualizado (§1, §3, §5, §6, nova §9).

## Resultados

- `npm test`: 23 testes, 16 ok, 0 falhas, 7 `todo`.
- Divergência de Kalman: até 6,6 px na caixa prevista após 5 quadros de oclusão; IDs iguais.
- Efeito calibrado “`minimum_consecutive_frames` 1 → 75 IDs” é artefato do JS (D3).

## Decisões pendentes

Ver auditoria §6 e resposta final desta sessão.
