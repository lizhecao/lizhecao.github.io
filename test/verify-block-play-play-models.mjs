import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const root=new URL('../source/block-play/',import.meta.url),ctx=vm.createContext({});
for(const f of ['patterns.js','stories.js','scenes.js','scenes-v2.js','play-models.js'])vm.runInContext(await readFile(new URL(f,root),'utf8'),ctx);
const app=await readFile(new URL('app.js',root),'utf8');vm.runInContext(app.slice(0,app.indexOf('let soundChoice='))+';globalThis.models=MODELS;globalThis.height=pieceHeight;globalThis.cols=studColumns;',ctx);
assert.equal(ctx.models.length,76);assert.equal(new Set(ctx.models.map(m=>m.id)).size,76);
const added=ctx.models.filter(m=>m.collection==='play');assert.equal(added.length,12);
const baseline=vm.createContext({});
for(const f of ['patterns.js','stories.js','scenes.js','scenes-v2.js'])vm.runInContext(execFileSync('git',['show','74a792c:source/block-play/'+f],{encoding:'utf8'}),baseline);
const oldApp=execFileSync('git',['show','74a792c:source/block-play/app.js'],{encoding:'utf8'});vm.runInContext(oldApp.slice(0,oldApp.indexOf('let soundChoice='))+';globalThis.models=MODELS;',baseline);
for(const old of baseline.models)assert.deepEqual(JSON.parse(JSON.stringify(ctx.models.find(m=>m.id===old.id))),JSON.parse(JSON.stringify(old)),old.id+': preserve existing tutorial exactly');
for(const m of added){
 assert.equal(m.level,'big');assert.ok(m.category);assert.equal(m.ideas.length,3);assert.ok(m.reference.startsWith('https://www.lego.com/')||m.reference.startsWith('https://education.lego.com/'));
 assert.match(m.adaptation,/原创/);assert.ok(m.steps.length>=6);
 const placed=[],links=[];
 for(const [i,s] of m.steps.entries()){
  assert.equal(s.pieces.length,1);assert.ok(s.title&&s.text&&s.kidText);
  const p=s.pieces[0],h=ctx.height;
  assert.ok([p.x,p.y,p.z||0].every(n=>Number.isInteger(n*2)));assert.ok(['brick','eye','wheelbase'].includes(p.kind||'brick'));
  if(p.kind!=='wheelbase')assert.ok([1,2].includes(p.w*(p.d||1)),'Only real standard large bricks');
  const area=q=>Math.max(0,Math.min(p.x+p.w,q.x+q.w)-Math.max(p.x,q.x))*Math.max(0,Math.min((p.z||0)+(p.d||1),(q.z||0)+(q.d||1))-Math.max(p.z||0,q.z||0));
  assert.ok(!placed.some(q=>q.y<p.y+h(p)&&q.y+h(q)>p.y&&area(q)>0),`${m.id}: collision at ${i} ${s.title}`);
  const contact=placed.flatMap((q,j)=>q.y+h(q)===p.y&&area(q)>=.5?[j]:[]);if(p.y>0)assert.ok(contact.length,`${m.id}: unsupported ${i} ${s.title}`);
  links.push(contact);placed.push(p);
 }
 const reached=new Set([0]);let changed=true;
 while(changed){changed=false;links.forEach((list,i)=>list.forEach(j=>{if(reached.has(i)||reached.has(j))for(const k of [i,j])if(!reached.has(k)){reached.add(k);changed=true;}}));}
 assert.equal(reached.size,placed.length,m.id+': all bricks connected');
}
console.log('PASS: 12 original play models, 76 unique IDs, complete steps/ideas/sources, stud alignment, no collisions, supported and connected bricks');
