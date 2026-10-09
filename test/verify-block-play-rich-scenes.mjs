import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../source/block-play/',import.meta.url),context=vm.createContext({});
for(const file of ['patterns.js','stories.js','scenes.js','scenes-v2.js'])vm.runInContext(await readFile(new URL(file,root),'utf8'),context);
const app=await readFile(new URL('app.js',root),'utf8');vm.runInContext(app.slice(0,app.indexOf('let soundChoice='))+';globalThis.models=MODELS;globalThis.height=pieceHeight;globalThis.columns=studColumns;',context);
const models=context.models.filter(m=>m.layoutVersion===2);assert.equal(models.length,3);assert.equal(context.models.length,64);
for(const m of models){
 assert.ok(context.models.some(old=>old.id===m.originalModelId));
 assert.ok(m.rooms.length>=4);assert.ok(m.steps.length>=200);
 const placed=[];
 for(const [i,s] of m.steps.entries()){
  assert.equal(s.pieces.length,1);const p=s.pieces[0];
  assert.ok(p.x>=0&&p.z>=0&&p.x+p.w<=12&&p.z+p.d<=12,`${m.id}: within 24 x 24 studs`);
  if(p.w<1||p.d<1)assert.equal(p.kind,'thin','Narrow pieces must be identified double-height Duplo 4066, never invented single-stud cubes');
  if(p.kind==='thin'){assert.equal(p.w*p.d,.5);assert.equal(context.height(p),2);}
  assert.ok([p.x,p.y,p.z,p.w,p.d].every(n=>Number.isInteger(n*2)));
  const overlap=q=>Math.max(0,Math.min(q.x+q.w,p.x+(p.kind==='slide'?1:p.w))-Math.max(q.x,p.x))*Math.max(0,Math.min(q.z+q.d,p.z+p.d)-Math.max(q.z,p.z));
  if(p.kind!=='slide')assert.ok(!placed.some(q=>q.kind!=='slide'&&q.y<p.y+context.height(p)&&q.y+context.height(q)>p.y&&overlap(q)>0),`${m.id}: overlapping ${s.title} (${i})`);
  const contact=p.kind==='slide'?p.y+3:p.y;
  if(p.kind!=='baseplate')assert.ok(placed.some(q=>Math.abs(q.y+context.height(q)-contact)<.001&&context.columns(q).length&&overlap(q)>=.25),`${m.id}: unsupported ${s.title} (${i})`);
  if(p.objectId){assert.ok(m.objects[p.objectId]);assert.ok(m.rooms.some(r=>r.id===p.roomId));}
  placed.push(p);
 }
 for(const zone of ['first','second']){
  const ground=zone==='first'?0:4.5;
  for(const p of placed.filter(p=>p.zone===zone&&p.objectId))assert.ok(!(p.x<5&&p.x+p.w>4&&p.z<9&&p.z+p.d>6),`${m.id}: leave central passage free`);
  assert.ok(placed.filter(p=>p.zone===zone&&p.objectId).length,'Each floor has a furnished function');
  assert.ok(placed.filter(p=>p.zone===zone&&p.objectId).every(p=>p.y>=ground&&p.y+context.height(p)<=ground+4));
 }
 for(const [id,o] of Object.entries(m.objects)){assert.ok(o.name.length>1);assert.ok(placed.filter(p=>p.objectId===id).length>=2,`${id}: recognizable multi-part object`);}
}
const school=models.find(m=>m.id.includes('school'));
assert.ok(Object.keys(school.objects).filter(id=>id.includes('bed')).length>=2,'Separate nap beds');
const home=models.find(m=>m.id.includes('home'));
for(const type of ['sofa','chair','kitchen','bed','shelf','desk'])assert.ok(Object.keys(home.objects).some(id=>id.includes(type)));
console.log('PASS: three new scene IDs, 64 preserved models, room metadata, multi-part furniture, clear passages, all parts supported and no collisions');
