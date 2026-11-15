import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = new URL("../", import.meta.url);
const library = await fs.readFile(new URL("standalone/library.gz.b64", root), "utf8");
const stockfish = await fs.readFile(new URL("node_modules/stockfish.js/stockfish.js", root));
const expectedStockfish = "VtbI9eXlyH0iLETxBo+yJZD0egEZcin9R4ntQlcrrKjRYSTQmdhoiY/jGV9SGw4Q";
if (createHash("sha384").update(stockfish).digest("base64") !== expectedStockfish) {
  throw new Error("Stockfish does not match the pinned engine");
}

const bundle = await build({
  entryPoints: [fileURLToPath(new URL("standalone/app.js", root))],
  bundle: true,
  write: false,
  format: "iife",
  minify: true,
  define: { __LIBRARY_GZIP__: JSON.stringify(library) },
  legalComments: "inline",
});

// Keep the upstream asm.js source intact inside a normal JavaScript function.
const engine = `function chessStockfishRuntime(postMessage, close, setTimeout, clearTimeout) {
var onmessage;
${stockfish.toString("utf8")}
return data => onmessage({ data });
}
`;
const script = (engine + bundle.outputFiles[0].text)
  .replace(/\r\n?/g, "\n").replace(/<\/script/gi, "<\\/script");
const hash = createHash("sha256").update(script).digest("base64");
const policy = [
  "default-src 'none'",
  `script-src 'sha256-${hash}'`,
  "style-src 'unsafe-inline'",
  "img-src data:",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

let html = await fs.readFile(new URL("standalone/template.html", root), "utf8");
const styles = await fs.readFile(new URL("standalone/style.css", root), "utf8");
const license = await fs.readFile(new URL("node_modules/stockfish.js/Copying.txt", root), "utf8");
html = html.replace("<!-- CSP -->", () => `<meta http-equiv="Content-Security-Policy" content="${policy}">`);
html = html.replace("<!-- STYLES -->", () => `<style>${styles}</style>`);
html = html.replace("<!-- APPLICATION -->", () => `<script>${script}</script>`);
html = html.replace("<!-- STOCKFISH LICENSE -->", () => `<!--\n${license.replaceAll("--", "—")}\n-->`);
await fs.mkdir(new URL("dist/tess/", root), { recursive: true });
await fs.writeFile(new URL("dist/tess/index.html", root), html);
console.log(`Tess export: ${Buffer.byteLength(html)} bytes → dist/tess/index.html`);
