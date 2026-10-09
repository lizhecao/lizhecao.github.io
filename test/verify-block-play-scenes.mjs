import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../source/block-play/',import.meta.url);
const context=vm.createContext({});
for(const file of ['patterns.js','stories.js'])vm.runInContext(await readFile(new URL(file,root),'utf8'),context);
vm.runInContext(await readFile(new URL('scenes.js',root),'utf8').catch(()=> 'const SCENE_MODELS=[];'),context);
const app=await readFile(new URL('app.js',root),'utf8');
vm.runInContext(app.slice(0,app.indexOf('let soundChoice='))+';globalThis.sceneModels=MODELS.filter(m=>m.level==="complete");globalThis.height=pieceHeight;globalThis.columns=studColumns;globalThis.name=pieceName;',context);
const {sceneModels,height,columns,name}=context;
assert.equal(sceneModels.length,3,'Provide three complete scenes in their own catalog');
for(const model of sceneModels){
 assert.equal(model.level,'complete');
 assert.ok(model.references.length>0);
 for(const zone of ['first','second','yard'])assert.ok(model.sections[zone]);
 const roles=new Set(model.steps.flatMap(s=>s.pieces.map(p=>p.role)).filter(Boolean));
 for(const role of ['door','tree','slide','bed','table'])assert.ok(roles.has(role),`${model.id}: ${role} missing`);
 for(const zone of ['first','second']){
  const furniture=model.steps.filter(s=>s.pieces[0].zone===zone);
  const pillow=furniture.find(s=>s.title.includes('枕头')).pieces[0];
  assert.equal(pillow.kind,'plate','A pillow should be low instead of a tall cube');
  assert.equal(pillow.c,'cream');
  assert.equal(furniture.find(s=>s.title.includes('床垫')).pieces[0].c,'blue');
  assert.ok(furniture.some(s=>s.pieces[0].role==='book'&&s.pieces[0].kind==='plate'),'The red object must be an identified flat book');
 }
 const placed=[],links=[];
 for(const step of model.steps){
  assert.equal(step.pieces.length,1);
  const p=step.pieces[0];
  assert.ok(model.sections[p.zone]||p.zone==='base');
  assert.ok(Number.isInteger(p.y*2));
  for(const n of [p.x,p.z||0])assert.ok(Number.isInteger(n*2));
  assert.ok(name(p).length>2);
  if(p.kind==='slide')assert.match(step.kidText,/高端扣在安装平台/);
  if(p.kind==='roof')assert.match(step.kidText,/坡面朝/);
  if(p.kind==='slide')assert.equal(columns(p).length,0,'Do not draw studs over the sliding surface');
  const footprint=(q,top=false)=>{
   const cap=top&&['curve','roof'].includes(q.kind);
   const qx=q.x+(cap&&q.flip?q.w-1:0),qw=cap?1:q.w;
   const pw=p.kind==='slide'?1:p.w;
   return Math.max(0,Math.min(qx+qw,p.x+pw)-Math.max(qx,p.x))*Math.max(0,Math.min((q.z||0)+(q.d||1),(p.z||0)+(p.d||1))-Math.max(q.z||0,p.z||0));
  };
  // 滑梯仅以高端安装台连接，斜槽下方的支柱不属于体积碰撞。
  if(p.kind!=='slide')assert.ok(!placed.some(q=>q.kind!=='slide'&&q.y<p.y+height(p)&&q.y+height(q)>p.y&&footprint(q)>0),`${model.id}: overlapping ${step.title}`);
  const contact=p.kind==='slide'?p.y+3:p.y;
  const supports=placed.flatMap((q,i)=>Math.abs(q.y+height(q)-contact)<.001&&columns(q).length&&footprint(q,true)>=.5?[i]:[]);
  if(p.kind!=='baseplate')assert.ok(supports.length,`${model.id}: unsupported ${step.title} at ${JSON.stringify(p)}`);
  links.push(supports);placed.push(p);
 }
 const reached=new Set([0]);let changed=true;
 while(changed){changed=false;links.forEach((list,i)=>list.forEach(j=>{if(reached.has(i)||reached.has(j))for(const k of [i,j])if(!reached.has(k)){reached.add(k);changed=true;}}));}
 assert.equal(reached.size,placed.length,`${model.id}: all rooms and yard must attach to the base`);
}
assert.equal(height({kind:'door'}),3);
assert.equal(height({kind:'plate'}),.5);
assert.equal(height({kind:'baseplate'}),0);
assert.equal(columns({kind:'roof',w:2,flip:true}).join(','),'2,3');
console.log('PASS: 3 complete scenes, rooms and yard, doors/trees/slides/beds/tables, stud alignment, supports and connected assemblies');
