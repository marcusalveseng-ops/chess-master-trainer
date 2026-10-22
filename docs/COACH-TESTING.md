# Assistente durante a partida — 21/10/2026

Implementação baseada no commit `15b746eafbd5306e4794f5b16418764cfacfafc6`.

## Uso

1. Abra `/play` e mova as peças clicando na origem e no destino.
2. O assistente calcula até três alternativas para o lado que tem a vez.
3. Leia a sequência, a avaliação, os pontos positivos e os riscos. Em **Explorar variante**, percorra a simulação com as setas, sem modificar a partida.
4. Para explicações adicionais, entre na conta e use **Explicar planos com IA online**. A credencial do serviço permanece no servidor.
5. Use **Carregar PGN** para aplicar o texto completo. Entrada inválida preserva a partida atual. **Nova partida** limpa o tabuleiro. Voltar e jogar outro lance cria uma nova continuação.

## O que foi implementado

- Histórico real com `history()`, reconstrução por `undo()`, preservação de cabeçalhos FEN e repetição. Navegação informa a posição correta ao assistente.
- Movimentos legais, roque, en passant, escolha das quatro promoções, empate e mate; tabuleiro responsivo e casas identificadas por nome acessível.
- Motor local de IA clássica: negamax/alpha-beta, aprofundamento iterativo até três meios-lances, orçamento padrão de 1.200 ms / 30 mil nós, avaliação de material e posicionamento. Só publica iterações completas para comparar alternativas na mesma profundidade.
- Web Worker com debounce de 250 ms e encerramento ao trocar a posição ou desativar o assistente. Não depende de API externa para calcular as linhas.
- Explicação online opcional pela integração Manus/Forge existente (`BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`). Requer usuário autenticado; valida FEN e cada lance antes da chamada, limita entrada/saída e usa cancelamento de 15 segundos. Não repete erros permanentes de HTTP.
- IDs reais ao salvar/importar, importação abre a partida, exportação não fica bloqueada por uma consulta desativada. Validação e leitura de PGN usam chess.js e rejeitam lances inválidos.

## Verificação realizada

- `node node_modules/typescript/bin/tsc --noEmit`: passou.
- `node node_modules/vitest/vitest.mjs run`: **30 testes passaram**, em seis arquivos. Incluem cliques e navegação em jsdom, subpromoção, recuperação de PGN inválido, descarte de resultado antigo, mate, empate, repetição, variantes legais, orçamento de busca, autenticação, validação antes de usar IA, falha do provedor e contratos de persistência com banco simulado.
- `npm run build`: passou e gerou o worker separado. Permanecem avisos de analytics sem configuração e tamanho do bundle.
- Não foi validada uma chamada real ao provedor de IA ou ao MySQL: não há credenciais locais configuradas. Os testes desses limites usam mocks.
- A abertura do navegador de teste expirou; os testes de componentes não substituem verificação visual em navegador/dispositivos reais.

## Simulação prolongada concluída

Execução confirmada em 21/10/2026, das 14h29min48s às 17h59min49s de São Paulo (210 minutos). Resultado: **3.916 simulações, 412.948 meios-lances, 105.628 análises e zero falhas**. Foram 3.100 mates, 396 empates e 420 partidas truncadas. A maior chamada de análise medida foi de 125 ms com orçamento de 100 ms neste teste. Essa medição não garante latência em outros dispositivos.

O script `scripts/chess-soak.mjs` mistura escolhas pseudoaleatórias reproduzíveis e sugestões do motor. Confere cada sequência de análise, ida e volta PGN/FEN e navegação. Cada jogo limita-se a 180 meios-lances; partidas truncadas são contabilizadas separadamente. O processo para na primeira falha, salvando PGN, FEN e semente.

```sh
node scripts/chess-soak.mjs --minutes 2 --seed 20261021
```

Requer Node com suporte a remoção de tipos TypeScript (validado com Node 26.7). Para esta tarde, foi iniciado com `--minutes 210 --output test-results/afternoon`. Resultados incrementais em `test-results/afternoon/progress.json`; falhas em `failures.jsonl`. Esses arquivos locais não são versionados. O acompanhamento agendado foi pausado após a confirmação do término. O resumo final reproduzível está em `docs/afternoon-results.json`.

## Limites e pendências

Este motor é experimental, de busca curta; **não é Stockfish** e pode deixar passar táticas além do horizonte. A pontuação é da perspectiva do lado que joga na posição analisada. As observações locais descrevem fatos e respostas calculadas; a explicação generativa pode errar. Nenhuma variante garante a reação humana.

O trabalho não resolve todos os problemas da revisão anterior, incluindo autorização de posições-chave em rotas antigas, autenticação OAuth, desafios de finais, análise pós-partida e dependências vulneráveis. Não houve deploy, merge nem migração de banco. O PR deve permanecer em rascunho até revisão e validação do ambiente integrado.
