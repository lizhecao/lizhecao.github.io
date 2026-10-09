import {dimensions,BRICK_HEIGHT} from './scene-state.mjs';
// Primitive descriptions are shared by geometry checks and the actual renderer.
export function components(p) {
 const {width:w,depth:d,height:h}=dimensions(p),result=[];
 const box=(size,position)=>result.push({type:'box',size,position});
 const profile=(points,depth,z=0)=>result.push({type:'profile',points,depth,position:[0,0,z]});
 if(p.kind==='baseplate')box([w,.08,d],[w/2,-.04,d/2]);
 else if(['window','door'].includes(p.kind)){
  const t=.14;box([t,h,d],[t/2,h/2,d/2]);box([t,h,d],[w-t/2,h/2,d/2]);box([w,t,d],[w/2,h-t/2,d/2]);
  if(p.kind==='door'){const angle=.65,length=w-2*t,x=t+length/2*Math.cos(angle);result.push({type:'box',size:[length,h-.28,.08],position:[p.flip?w-x:x,h/2,.15-length/2*Math.sin(angle)],rotation:p.flip?-angle:angle,color:'brown'});}
  if(p.kind==='window'){box([w,t,d],[w/2,t/2,d/2]);box([t,h,.1],[w/2,h/2,d/2]);}
 } else if(['curve','roof'].includes(p.kind)){
  const cap=Math.min(1,w);
  const pts=p.kind==='roof'?[[0,0],[w,0],[w,.08],[cap,h],[0,h]]:[[0,0],[w,0],[w,.05],[w-.1,.22],[w-.3,.4],[cap,h],[0,h]];
  profile(p.flip?pts.map(([x,y])=>[w-x,y]).reverse():pts,d);
 }else if(p.kind==='slide'){
  const pts=[[0,3*BRICK_HEIGHT],[1,3*BRICK_HEIGHT],[w,.12],[w,.02],[1,3*BRICK_HEIGHT-.1],[0,3*BRICK_HEIGHT-.1]];
  const directed=points=>p.flip?points.map(([x,y])=>[w-x,y]).reverse():points;
  profile(directed(pts),d);
  for(const z of [0,d-.08])profile(directed(pts.map(([x,y],i)=>[x,y+(i<3?.15:0)])),.08,z);
 }else box([w-.012,h,d-.012],[w/2,h/2,d/2]);
 if(p.kind!=='slide'){
  const capped=['curve','roof'].includes(p.kind),start=capped&&p.flip?(w-1)*2:0,end=capped?start+2:w*2;
  for(let x=start;x<end;x++)for(let z=0;z<d*2;z++)result.push({type:'stud',size:[.15,.12],position:[x*.5+.25,h+.06,z*.5+.25]});
 }
 return result;
}
