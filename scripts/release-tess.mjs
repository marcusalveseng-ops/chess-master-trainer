import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const cwd = fileURLToPath(root);
const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const { version } = JSON.parse(await fs.readFile(new URL('package.json', root), 'utf8'));
const commit = git('rev-parse', 'HEAD');
// Include untracked files: a commit alone cannot identify an edited source tree.
const dirty = git('status', '--porcelain', '--untracked-files=normal') !== '';

// Keep the existing export command and its output unchanged.
execFileSync(process.execPath, [fileURLToPath(new URL('scripts/build-tess.mjs', root))], {
  cwd,
  stdio: 'inherit',
});

const release = new URL('dist/tess/release/', root);
const artifact = 'Chess-Unificado-Tess.html';
await fs.mkdir(release, { recursive: true });
await fs.copyFile(new URL('dist/tess/index.html', root), new URL(artifact, release));
const bytes = await fs.readFile(new URL(artifact, release));
const manifest = {
  artifact,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  sizeBytes: bytes.length,
  version,
  commit,
  dirty,
};
await fs.writeFile(new URL('manifest.json', release), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Release HTML: ${fileURLToPath(new URL(artifact, release))}`);
console.log(`Manifest: ${fileURLToPath(new URL('manifest.json', release))}`);
console.log(`Version: ${version} | commit: ${commit} | dirty: ${dirty}`);
console.log(`SHA-256: ${manifest.sha256} | size: ${manifest.sizeBytes} bytes`);
