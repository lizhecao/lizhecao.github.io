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
assert.match(source, /data-view="plan"/, "plan tab is missing");
assert.match(source, /data-view="logic"/, "portfolio logic tab is missing");
assert.match(source, /id="logicPanel"/, "portfolio logic panel is missing");
assert.match(source, /全球权益[\s\S]*?40%/, "global equity rationale must explain the 40% weight");
assert.match(source, /中国及港股权益[\s\S]*?30%/, "China equity rationale must explain the 30% weight");
assert.match(source, /防守资产[\s\S]*?30%/, "defensive allocation rationale must explain the 30% weight");
assert.match(source, /P\/E[\s\S]*?23\.64/, "latest ACWI valuation must appear in the logic panel");
assert.match(source, /function selectView\(/, "top-level tab interaction is missing");
assert.match(source, /A股红利低波/, "dividend low-volatility allocation is missing");
assert.match(source, /A股红利质量/, "dividend quality allocation is missing");

const domesticTabPosition = source.indexOf('data-channel="domestic"');
const overseasTabPosition = source.indexOf('data-channel="overseas"');
assert.ok(domesticTabPosition !== -1 && domesticTabPosition < overseasTabPosition, "domestic account tab must appear first");
assert.match(source, /aria-selected="true" data-channel="domestic"/, "domestic account tab must be selected by default");
assert.match(source, /id="domestic" class="channel-panel active"/, "domestic account panel must be open by default");

const allocationBlock = source.match(/const allocation = \[([\s\S]*?)\n    \];/)?.[1] ?? "";
const weights = [...allocationBlock.matchAll(/\bweight:\s*(\d+)/g)].map((match) => Number(match[1]));
assert.equal(weights.reduce((total, weight) => total + weight, 0), 100, "allocation weights must total 100%");
assert.match(source, /id:\s*'global'[\s\S]*?weight:\s*40/, "global equity weight must be 40%");
assert.match(config, /skip_render:[\s\S]*?-\s*['"]?dca\/\*\*['"]?/, "dca directory must bypass Hexo rendering");
assert.equal(built, source, "Hexo must publish the DCA page without modifying it");

console.log("DCA GitHub Pages verification passed");
