import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const config = await readFile(new URL("../_config.yml", import.meta.url), "utf8");
assert.ok(config.includes("  - 'block-play/**'"), "Hexo must preserve the standalone app");
const root = new URL("../source/block-play/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", root), "utf8"));
assert.equal(manifest.start_url, "./");
assert.equal(manifest.scope, "./");
const html = await readFile(new URL("index.html", root), "utf8");
assert.match(html, /61 个创意造型/);
assert.equal((html.match(/<script defer src="https:\/\/cloud\.umami\.is\/script\.js" data-website-id="d144413e-4aba-4522-9d75-3add8504e963"><\/script>/g)||[]).length,1,"Include the requested Umami tracker exactly once");
const cloudflareScripts=[...html.matchAll(/<script type='module' src='https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js' data-cf-beacon='([^']+)'><\/script>/g)];
assert.equal(cloudflareScripts.length,1,"Include the requested Cloudflare tracker exactly once");
assert.equal(JSON.parse(cloudflareScripts[0][1]).token,"ee4db0d0b49347958f3e8b596f171665");
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
