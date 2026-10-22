# Chess — Stockfish e Assistente

Repositório principal da aplicação unificada: `marcusalveseng-ops/chess-master-trainer`.

Endereço de publicação existente: **https://xadrez-stockfish.tess.page/**.

A integração incorpora o aplicativo publicado pela Tess (205 partidas em PGN, Stockfish e salvamento local) e o assistente desenvolvido neste repositório. O repositório `xadrez-stockfish`, que continha apenas um README, deixa de ser uma fonte independente de desenvolvimento. O endereço da Tess é preservado; não há contratação de outro domínio.

## Versão publicada na Tess

```sh
pnpm install --frozen-lockfile
pnpm build:tess
```

O resultado é `dist/tess/index.html`: um arquivo HTML para atualizar **a página existente na mesma conversa da Tess**, sem criar outra Tess Page. O GitHub não está configurado para publicar automaticamente na Tess. Fazer commit ou merge não comprova publicação.

Essa versão executa no navegador: Stockfish 10.0.2 sob demanda, três variantes com explicações locais de vantagens/riscos, simulação de linhas sem alterar a partida, navegação, promoção, importação/exportação PGN e biblioteca com 205 partidas. Usa chess.js 1.4.0 e o mesmo motor local de apoio em `shared/chess-coach.ts`. Se o Stockfish não carregar, o assistente local continua calculando, com profundidade limitada.

A hospedagem Tess bloqueia Workers criados por URLs Blob. A exportação executa os motores no contexto da página, sem Workers, usando a política de scripts já oferecida pela Tess. O download do Stockfish verifica uma assinatura de integridade fixa. Cada busca do Stockfish solicita 220 ms e o apoio local tem orçamento de 160 ms; a profundidade exibida é a efetivamente concluída. Esses tempos são metas de busca, não uma garantia de latência: aparelhos lentos podem apresentar pequenas pausas na interface. O runtime cancela seus temporizadores ao sair da página.

As partidas salvas mantêm a chave `xsf_saved` e ficam associadas ao navegador e ao endereço da página. Faça backup com **Baixar histórico PGN**. A aplicação não envia essas partidas a um servidor. A exportação usa a posição exibida; voltar e jogar outro lance cria uma nova continuação.

O restante do projeto React/Express/MySQL e a integração de explicação online permanecem preservados no repositório. Esses recursos de servidor exigem hospedagem Node.js, banco e credenciais; não são executados por uma Tess Page estática. A publicação atual usa análise local, sem expor chaves de API.

## Validação

```sh
pnpm check
pnpm test
pnpm build
pnpm build:tess
```

Os testes de integração da exportação constroem o HTML, verificam cliques, histórico, FEN, subpromoção, salvamento compatível, PGN inválido, funcionamento sem Workers e sem CDN, sincronização das buscas UCI e cancelamento dos temporizadores. Os testes anteriores e o relatório da simulação prolongada estão preservados em `docs/`.

## Origem e reversão

- Código principal antes da integração: `a9e81a9f339de7d51a07c80bb3a82f341f12ca05`.
- Repositório de referência da Tess: `marcusalveseng-ops/xadrez-stockfish`, commit `89f2a77cd20d6623a0c04971588e0154cfa03789` (apenas README).
- O HTML anterior publicado foi recuperado diretamente da URL existente e sua biblioteca PGN foi validada integralmente: 205 partidas, 17.135 meios-lances, sem erro de leitura.
- Para reverter o código, reverta o commit de integração. Para reverter o site, publique a exportação anterior na mesma conversa da Tess. Ações no GitHub não alteram automaticamente a Tess Page.

Stockfish é distribuído pelos autores sob GPLv3 e carregado do cdnjs. [Código-fonte do motor](https://github.com/niklasf/stockfish.js). As observações e avaliações indicam possibilidades, não garantem a resposta do adversário.
