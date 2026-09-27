# Histórico da sessão: 27/09/2026, alinhamento do motor ByteTrack

## Pedido

Seguir as três sugestões da etapa 0: alinhar D1, D3, D4 e D5 ao `trackers` 2.6.1; manter D2; corrigir o motor antes da migração TypeScript. O público da aula segue o plano §1, sem encurtar capítulos, com tudo bem explicado.

## Pontos levados à autora

1. **Contradição encontrada:** o `trackers` 2.6.1 real encolhe a caixa prevista durante a oclusão, exatamente o problema 2 do HANDOVER §4. Mantendo D2, o laboratório mostra o buffer preservando IDs no viaduto (buffer 60 → 5 IDs) enquanto o Python perde o ID em qualquer buffer (9 IDs). Registrado para o capítulo 5; nada alterado no Kalman.
2. O efeito calibrado “`minimum_consecutive_frames` 1 → 75 IDs” deixou de existir: com a semântica do Python, 1 e 2 dão 10 IDs; 3 dá 9.

## O que foi feito

1. `bytetrack.js` reescrito com a ordem do `ByteTrackTracker`; `quadrosMaximosPerdidos()` exportada.
2. UI: IDs a partir de 0 (`id >= 0`) em 6 arquivos; textos das abas Etapas, Parâmetros e Conceito; buffer aceita 0.
3. Testes: 26/26; fixtures comparam IDs brutos e trilhas vivas quadro a quadro; 2 fixtures novas.
4. Testes visuais: 2 referências revisadas e atualizadas; 6/6 em 3 execuções.
5. Auditoria §6/§8, HANDOVER (§1, §2, §3, §4, §5, §6, §10) e plano §11 atualizados.
6. Migração TypeScript (etapa 1) em commit separado, sem mudança de comportamento.
