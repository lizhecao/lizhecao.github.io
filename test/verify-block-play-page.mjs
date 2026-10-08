import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const config = await readFile(new URL("../_config.yml", import.meta.url), "utf8");
assert.ok(config.includes("  - 'block-play/**'"), "Hexo must preserve the standalone app");
const root = new URL("../source/block-play/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", root), "utf8"));
assert.equal(manifest.start_url, "./");
assert.equal(manifest.scope, "./");
const html = await readFile(new URL("index.html", root), "utf8");
assert.match(html, /44 个创意造型/);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
const files = new Set(["index.html", "sw.js", ...manifest.icons.map(icon => icon.src)]);
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (!/^(?:#|https?:)/.test(match[1])) files.add(match[1]);
}
const sw = await readFile(new URL("sw.js", root), "utf8");
const core = sw.match(/const CORE = \[([\s\S]*?)\]/)[1];
for (const match of core.matchAll(/'([^']+)'/g)) files.add(match[1] === "./" ? "index.html" : match[1]);
assert.match(sw, /new URL\(path, self.registration.scope\)/);
assert.match(sw, /key.startsWith\(CACHE_PREFIX\)/, "Cache cleanup must stay within the app");
for (const file of files) {
  const source = await readFile(new URL(file, root));
  const built = await readFile(new URL(file, new URL("../public/block-play/", import.meta.url)));
  assert.deepEqual(built, source, `Hexo must preserve ${file}`);
}
console.log(`PASS: standalone app paths, offline assets, and ${files.size} generated files`);
