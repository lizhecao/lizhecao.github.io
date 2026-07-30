import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sourcePath = new URL("../source/dca/index.html", import.meta.url);
const builtPath = new URL("../public/dca/index.html", import.meta.url);
const configPath = new URL("../_config.yml", import.meta.url);

const [source, built, config] = await Promise.all([
  readFile(sourcePath, "utf8"),
  readFile(builtPath, "utf8"),
  readFile(configPath, "utf8"),
]);

assert.match(source, /中外长期定投组合/, "DCA page title is missing");
assert.match(source, /不考虑现有持仓/, "standalone portfolio disclaimer is missing");
assert.match(config, /skip_render:[\s\S]*?-\s*['"]?dca\/\*\*['"]?/, "dca directory must bypass Hexo rendering");
assert.equal(built, source, "Hexo must publish the DCA page without modifying it");

console.log("DCA GitHub Pages verification passed");
