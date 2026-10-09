import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const app = await readFile(new URL("../source/block-play/app.js", import.meta.url), "utf8");
const context = vm.createContext({});
vm.runInContext(await readFile(new URL("../source/block-play/patterns.js", import.meta.url), "utf8"), context);
const storySource = await readFile(new URL("../source/block-play/stories.js", import.meta.url), "utf8").catch(() => "const STORY_LABS=[];const LAB_STORIES={};");
vm.runInContext(storySource, context);
vm.runInContext(await readFile(new URL('../source/block-play/scenes.js', import.meta.url), 'utf8'), context);
vm.runInContext(app.slice(0, app.indexOf("let soundChoice=")) + ";globalThis.models=MODELS;globalThis.concepts=CONCEPT_MAP;globalThis.labs=LABS;globalThis.stories=LAB_STORIES;", context);
const { models, concepts, labs, stories } = context;
const ids = new Set(models.map(model => model.id));
assert.equal(ids.size, models.length, "Model IDs must be unique to preserve saved progress");
assert.equal(models.length, 61);
const added = models.filter(model => model.collection === "reference");
assert.equal(added.length, 20);
assert.equal(labs.length, 12);
for (const lab of labs) {
 assert.ok(ids.has(lab.practice), `${lab.id}: practice must exist`);
 const story=stories[lab.id];
 if (story?.practice) assert.ok(ids.has(story.practice));
 assert.ok(story, `${lab.id}: story missing`);
 assert.equal(story.scenes.length, 5);
 for (const scene of story.scenes) {
  assert.ok(scene.title && scene.text && scene.task);
  assert.ok([0, 1].includes(scene.mode));
 }
 assert.equal(lab.answers.length, 3);
 assert.ok(lab.correct >= 0 && lab.correct < 3);
}
assert.match(stories.locking.scenes.map(s=>s.text).join(""), /草.*木.*砖/);
assert.match(stories.locking.scenes.map(s=>s.text).join(""), /大灰狼/);
for (const model of models.filter(m => m.collection === "reference" || m.collection === "lab")) {
  assert.ok(labs.some(lab => lab.id === concepts[model.id]), `${model.id}: structure experiment missing`);
  assert.equal(model.ideas.length, 3);
  const placed = [];
  const links = [];
  for (const step of model.steps) {
    assert.equal(step.pieces.length, 1, `${model.id}: one brick per step`);
    const p = step.pieces[0];
    const kind = p.kind || "brick";
    assert.ok(["brick", "curve", "eye", "window", "wheelbase"].includes(kind));
    if (kind === "brick" || kind === "eye") assert.ok([1, 2].includes(p.w * (p.d || 1)));
    if (kind === "curve") assert.equal(p.w, 1.5);
    if (kind === "window") assert.equal(p.w, 2);
    if (kind === "wheelbase") { assert.equal(p.w, 3); assert.equal(p.y, 0); }
    for (const coordinate of [p.x, p.z || 0]) assert.ok(Number.isInteger(coordinate * 2), `${model.id}: align to studs`);
    const height = q => q.kind === "window" ? 2 : 1;
    const overlap = (q, top = false) => {
      const left = q.x + (top && q.kind === "curve" && q.flip ? .5 : 0);
      const width = top && q.kind === "curve" ? 1 : q.w;
      return Math.max(0, Math.min(left + width, p.x + p.w) - Math.max(left, p.x)) * Math.max(0, Math.min((q.z || 0) + (q.d || 1), (p.z || 0) + (p.d || 1)) - Math.max(q.z || 0, p.z || 0));
    };
    assert.ok(!placed.some(q => q.y < p.y + height(p) && q.y + height(q) > p.y && overlap(q) > 0), `${model.id}: bricks overlap`);
    const supports = placed.flatMap((q, i) => q.y + height(q) === p.y && overlap(q, true) >= .5 ? [i] : []);
    if (p.y > 0) assert.ok(supports.length, `${model.id}: unsupported brick`);
    links.push(supports);
    placed.push(p);
  }
  const connected = new Set([0]);
  let changed = true;
  while (changed) {
    changed = false;
    links.forEach((supports, i) => supports.forEach(j => {
      if (connected.has(i) || connected.has(j)) {
        for (const k of [i, j]) if (!connected.has(k)) { connected.add(k); changed = true; }
      }
    }));
  }
  assert.equal(connected.size, placed.length, `${model.id}: the finished model must connect as one piece`);
}
const special = new Set(added.flatMap(model => model.steps.map(step => step.pieces[0].kind).filter(Boolean)));
assert.ok(["curve", "window", "wheelbase", "eye"].every(kind => special.has(kind)));
for (const model of models.filter(model => model.level === "big")) assert.ok(model.category, `${model.id}: category missing`);
console.log("PASS: 20 reference patterns, 6 practice models, 12 story lessons, special parts, categories, stud alignment, supported geometry, connected finished models");
