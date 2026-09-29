# Histórico da sessão: 27/09/2026, etapa 2 — rota #curso-bytetrack

## Pedido

Seguir para a etapa 2 do plano: rota `#curso-bytetrack`. Mantidas as decisões anteriores: público do plano §1, capítulos sem encurtamento e bem explicados, D2 mantida.

## O que foi feito

1. Contratos do curso (`src/curso/tipos.ts`) e catálogo de fontes com páginas das anotações, artigos, documentação e células dos notebooks.
2. Roteiro completo dos 7 capítulos (60 min, 33 passos, 7 questões com feedback por opção), cada passo ancorado em cenário, quadro, camadas e vista. Todos os números do texto foram medidos no motor e são verificados por `tests/curso.test.ts`.
3. Casca da aula: palco 3D reaproveitado, linha do tempo, camadas, parâmetro livre por passo, painéis de etapas/detecções/resumo, índice, navegação, progresso local com aviso de retomada e de conteúdo incompatível.
4. Acessibilidade inicial: começa pausada, `prefers-reduced-motion` faz a câmera saltar, questões em `fieldset`/rádio com `aria-live`, barra de progresso com `role="progressbar"`, navegação por botões.
5. Testes: 39/39 unitários; 10/10 visuais em 3 execuções; referências do laboratório não foram alteradas.

## Problemas encontrados e corrigidos

- Palco estreito: `.bt` com `margin: auto` dentro de grid encolhia → `.curso .bt { width: 100% }`.
- Tabela de detecções estourava o painel → `min-width: 0` nos filhos e `overflow-x: hidden`.
- Rótulo “Aula 1 · ByteTrack” quebrava a barra de abas e deslocava o laboratório → “Aula 1”.
- Playwright comparou build antiga por causa de um `vite preview` manual aberto na porta 4173.

## Próximo passo

Etapa 3: interações específicas (microcena 0,18 como fixture, animação das duas associações, linha de estados, comparação A/B sincronizada, associação manual no capítulo 1).
