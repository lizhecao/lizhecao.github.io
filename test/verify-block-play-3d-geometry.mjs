import assert from 'node:assert/strict';
import {components} from '../source/block-play/scene-geometry.mjs';
const piece={x:0,z:0,y:0,w:2,d:1,c:'blue'};
const brick=components(piece);
assert.equal(brick.filter(p=>p.type==='stud').length,8);
assert.equal(brick[0].size[1],.6);
assert.equal(components({...piece,kind:'plate'})[0].size[1],.3);
assert.equal(components({...piece,kind:'baseplate'})[0].position[1],-.04);
for(const kind of ['window','door']){
 const c=components({...piece,kind});
 const center=[.6,kind==='door'?.9:.6,.5];
 assert.ok(!c.filter(p=>p.type==='box').some(p=>center.every((v,i)=>Math.abs(v-p.position[i])<p.size[i]/2)),`${kind} must have an opening`);
}
assert.ok(components({...piece,kind:'door'}).some(c=>c.rotation&&c.color==='brown'),'Door includes an open leaf');
for(const kind of ['curve','roof']){
 const c=components({...piece,kind});
 assert.equal(c.filter(p=>p.type==='stud').length,4);
 assert.ok(c.some(p=>p.type==='profile'));
 assert.equal(components({...piece,kind,flip:true}).find(p=>p.type==='stud').position[0],1.25);
}
const slide=components({...piece,w:4,kind:'slide'});
assert.equal(slide.filter(p=>p.type==='stud').length,0);
assert.ok(Math.abs(slide.find(p=>p.type==='profile').points[0][1]-1.8)<1e-9,'High end mates at three brick heights');
const mirroredSlide=components({...piece,w:4,kind:'slide',flip:true});
assert.equal(mirroredSlide.find(p=>p.type==='profile').points.at(-1)[0],4,'Mirrored high contact moves to the platform end');
assert.ok(slide.length>=3,'Sliding channel and two side rails');
console.log('PASS: body/stud proportions, plate/baseplate, real door/window openings, directional caps and slide contact');
