# Bot e biblioteca — 05/11/2026

## Comportamento

Nova partida inicia contra o bot. O usuário escolhe brancas ou pretas e três níveis de busca (sem equivalência prometida com rating Elo). O bot responde pelo Stockfish; se o motor não iniciar ou não responder dentro do prazo, uma busca local limitada escolhe um lance legal. O bot funciona mesmo com as dicas automáticas desligadas. Navegar, importar ou iniciar outra partida cancela respostas antigas. Importar PGN ou abrir uma partida da biblioteca entra em Estudo, onde os dois lados podem ser movidos.

Para treinar uma defesa: abra Biblioteca, selecione Defesa, escolha uma partida e navegue até a posição desejada. Escolha sua cor e use Treinar desta posição. Essa ação cria uma continuação a partir do lance selecionado. A partida original continua na biblioteca. Em uma partida pessoal, salve o jogo completo antes de iniciar outra continuação.

Abertura, defesa e dois campos de jogadores podem ser combinados. Jogadores são encontrados em qualquer cor; resultados são paginados em grupos de 50. Caro-Kann e Italiana são classificações distintas: por exemplo, 1.e4 c6 pertence à defesa Caro-Kann, enquanto 1.e4 e5 2.Nf3 Nc6 3.Bc4 identifica a Italiana. Combinações incompatíveis retornam zero resultados.

## Base e classificação

- PGNs: https://www.pgnmentor.com/players/Carlsen.zip e https://www.pgnmentor.com/players/Nakamura.zip, disponíveis gratuitamente no catálogo https://www.pgnmentor.com/files.html, somados à base original.
- Catálogo de nomes: https://github.com/lichess-org/chess-openings (CC0); licença copiada em standalone/openings-CC0.txt.
- A coleção contém registros de lances e metadados; comentários são removidos. Não se atribui uma licença CC0 aos PGNs do PGN Mentor.
- Cada partida incluída é lida legalmente por chess.js. Duplicatas são removidas por jogadores, data, FEN inicial e sequência de lances. Contagens, rejeições e hashes das fontes estão em library-validation.json.
- Classificação pelo prefixo mais longo reconhecido no catálogo, com famílias em português para filtros. Não cobre todas as transposições nem pretende atribuir uma abertura e defesa independentes a qualquer posição. O nome detalhado e o ECO reconhecidos aparecem no resultado.
- A base pré-processada é compactada no HTML e descompactada de forma assíncrona no navegador. Exige suporte a DecompressionStream (Chrome atualizado). Apenas o PGN escolhido é reconstruído no tabuleiro, evitando analisar milhares de partidas durante a abertura da tela.

## Atualização da base

A atualização contém **17.831 partidas**, com 412 duplicatas removidas e nenhuma partida rejeitada na leitura legal. Os filtros apresentam 26 categorias de abertura e 19 de defesa (incluindo Não especificada).

## Verificação

- Regressão reproduzida antes da correção: depois de e4, o histórico permanecia em 1/1, sem resposta do adversário.
- 54 testes passaram em 9 arquivos, incluindo resposta offline, escolha de pretas, cancelamento ao navegar, dicas desligadas, importação, filtros, histórico e salvamento. TypeScript sem erros.
- Chrome com a política de scripts da Tess: resposta real e4/d5 confirmada. Filtros Carlsen + Nakamura + Caro-Kann retornaram 7 partidas.

## Regerar os dados

Baixe e extraia os dois ZIPs em review/library-source/carlsen e review/library-source/nakamura; baixe a.tsv até e.tsv do repositório chess-openings em review/library-source. Execute `node scripts/prepare-library.mjs`, confira docs/library-validation.json e então `node scripts/build-tess.mjs`. A compilação normal usa a base já versionada e não depende de rede.

## Publicação

A exportação é dist/tess/index.html. O arquivo Chess-Unificado-Tess.html é uma cópia para substituir a página existente da Tess no mesmo endereço. Merge não faz deploy automático. Nenhuma API paga ou serviço multiplayer foi adicionado.
