# Repertório de exercícios

A seção **Exercícios** do export independente inclui 153 posições: 135 da [base aberta de problemas do Lichess (CC0)](https://database.lichess.org/#puzzles) e 18 atividades clássicas. O filtro de origem permite escolher todos os clássicos ou um autor, e cada atividade identifica a obra e a passagem usada.

- José Raúl Capablanca (3): [Chess Fundamentals](https://www.gutenberg.org/ebooks/33870). A abertura segue o exemplo 18; os dois mates elementares são composições didáticas próprias inspiradas no capítulo I.
- Emanuel Lasker (4): [Common Sense in Chess](https://commons.wikimedia.org/wiki/File:Common_sense_in_chess_(IA_commonsenseinche00laskrich).pdf), lições 1 e 3.
- Edward Lasker (8): [Chess and Checkers: The Way to Mastership](https://www.gutenberg.org/ebooks/4913), combinações e finais.
- Richard Réti (3): [estudos de peões 1.1–1.3](https://www.arves.org/arves/images/PDF/JohnBeasley/reti1.pdf), na compilação de John Beasley.

Os exercícios clássicos apresentam uma linha da obra, às vezes interrompida assim que o plano fica demonstrado. Os enunciados e comentários são próprios.

O recorte do Lichess tem 45 posições por fase (abertura, meio-jogo e final), com 15 em cada uma de três faixas de rating. A primeira jogada do CSV é do adversário e serve para montar a posição inicial. As demais formam a linha do exercício. O app verifica essa linha e reproduz as respostas previstas, sem chamar o motor e sem alterar a partida em andamento.

Para renovar o recorte, use `node scripts/prepare-exercises.mjs` com Node que ofereça `createZstdDecompress` (validado no Node 26). O script amostra o início do arquivo do Lichess, valida os lances e grava `standalone/exercises.json`. A versão desta seleção veio do arquivo com ETag `"6ae6f0f4-12766d85"`. Como a base evolui, uma nova seleção pode mudar os exercícios disponíveis. O build normal usa o JSON versionado e funciona sem baixar a base.
