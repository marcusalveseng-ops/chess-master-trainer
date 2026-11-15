# Pacote de publicação da Tess

O bot e a biblioteca de 17.831 partidas foram integrados na `main` pelo commit `3537a94f46cf5f95aa90878fc4fc51e29452cfc9` (PR #5). O pacote usa o código e a base compactada presentes no checkout; não baixa nem regenera a biblioteca.

Na raiz do repositório, com as dependências instaladas:

```sh
pnpm release:tess
```

O comando chama o exportador existente e mantém `pnpm build:tess` e `dist/tess/index.html` intactos. Depois copia os mesmos bytes para o pacote e calcula os metadados sobre a cópia final:

| Arquivo | Caminho relativo à raiz |
| --- | --- |
| HTML para substituir a página | `dist/tess/release/Chess-Unificado-Tess.html` |
| Manifesto de verificação | `dist/tess/release/manifest.json` |

Neste checkout, os caminhos absolutos são:

```text
C:\Codex\App - chess-master-trainer\dist\tess\release\Chess-Unificado-Tess.html
C:\Codex\App - chess-master-trainer\dist\tess\release\manifest.json
```

O manifesto registra `artifact`, `sha256`, `sizeBytes`, `version` (de `package.json`), `commit` (HEAD completo) e `dirty`. `dirty: true` significa que havia alterações ou arquivos não rastreados no checkout antes do build; nesse caso o commit sozinho não identifica todo o conteúdo local. Arquivos ignorados pelo Git não entram nesse indicador. A versão do pacote pode permanecer igual entre commits; confira também o commit. O SHA-256 identifica os bytes exatos do HTML gerado.

Para uma release reproduzível, use um checkout do commit desejado, com as dependências do lockfile (`pnpm install --frozen-lockfile`), e confirme `dirty: false`. O script não altera nem descarta arquivos locais. Os dois documentos locais já existentes e não rastreados, `PUBLICAR_NA_TESS.md` e `REVISAO_CODEX_2026-10-21.md`, também fazem o indicador ficar `true`, mesmo sem mudanças no código.

## Conferir antes de substituir a página

Execute no PowerShell a partir da raiz do repositório:

```powershell
$releaseDir = Join-Path (Get-Location) 'dist/tess/release'
$manifest = Get-Content -LiteralPath (Join-Path $releaseDir 'manifest.json') -Raw | ConvertFrom-Json
$htmlPath = Join-Path $releaseDir $manifest.artifact
$actualHash = (Get-FileHash -LiteralPath $htmlPath -Algorithm SHA256).Hash.ToLowerInvariant()
$actualSize = (Get-Item -LiteralPath $htmlPath).Length
if ($actualHash -ne $manifest.sha256 -or $actualSize -ne $manifest.sizeBytes) {
    throw 'HTML diferente do manifesto: gere novamente o pacote antes de publicar.'
}
$manifest | Format-List
```

Confira também se `commit` é o commit pretendido. Para verificar um arquivo transferido ou renomeado, aponte `$htmlPath` para essa cópia antes de calcular o hash e o tamanho. Guarde o manifesto junto do HTML aprovado; recalcular um manifesto sobre um arquivo desconhecido não comprova sua origem.

Anexe **o HTML dentro de `dist/tess/release/`** à conversa original da Tess e solicite a substituição da página existente em https://xadrez-stockfish.tess.page/, mantendo o endereço. A cópia manual `Chess-Unificado-Tess.html` na raiz não é atualizada automaticamente e pode estar antiga. `pnpm release:tess` apenas prepara arquivos locais; não publica na Tess. O diretório `dist/` é ignorado pelo Git e pode ser removido por outros builds; regenere o pacote depois de qualquer mudança de código ou novo build.

Após publicar, confira a resposta do bot depois de `e4` e os filtros Carlsen + Nakamura + Caro-Kann (7 partidas na base atual). A conferência local do hash comprova qual arquivo foi selecionado, sem comprovar que a Tess publicou os mesmos bytes.
