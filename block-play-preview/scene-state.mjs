// One coordinate unit is a 2 x 2 Duplo brick: body 80 x 48 x 80 LDU.
// Dimension reference: https://library.ldraw.org/parts/6083 (3437.dat).
export const BRICK_HEIGHT = .6;
export function dimensions(p) {
 const height=p.kind==='baseplate'?0:p.kind==='plate'?.5:p.kind==='door'?3:p.kind==='window'||p.kind==='thin'?2:p.kind==='slide'?3.5:1;
 return {width:p.w,depth:p.d||1,height:height*BRICK_HEIGHT,bottom:p.y*BRICK_HEIGHT,top:(p.y+height)*BRICK_HEIGHT};
}
export function visibleParts(model,view) {
 const count=view.preview?model.steps.length:view.current;
 return model.steps.slice(0,count).flatMap((s,i)=>s.pieces.map(p=>({...p,index:i,objectId:p.objectId||(p.role&&['bed','table','book','chair'].includes(p.role)?`${p.zone}-${p.role==='book'?'table':p.role}`:null)})))
 .filter(p=>view.section==='all'||p.zone===view.section||((view.section==='first')&&p.zone==='base'))
 .filter(p=>!(view.section!=='all'&&view.openWalls&&p.shell))
 .map(p=>view.mirror?{...p,x:12-p.x-p.w,flip:!p.flip}:p);
}
export function furnitureObjects(model,parts) {
 const objects=new Map();
 for(const p of parts)if(p.objectId){
  if(!objects.has(p.objectId))objects.set(p.objectId,{id:p.objectId,name:model.objects?.[p.objectId]?.name||({bed:'床',table:'书桌',chair:'椅子'}[p.role]||'家具'),description:model.objects?.[p.objectId]?.description||'点选查看位置与搭建段落。',parts:[]});
  objects.get(p.objectId).parts.push(p);
 }
 return [...objects.values()];
}
export function hitObject(parts,index){return parts.find(p=>p.index===index)?.objectId||null;}
export class ViewMemory {
 constructor(){this.views=new Map();}
 clear(id){for(const preview of [false,true])this.views.delete(`${id}:${preview}`);}
 save(id,preview,view){this.views.set(`${id}:${preview}`,structuredClone(view));}
 restore(id,preview){const view=this.views.get(`${id}:${preview}`);return view?structuredClone(view):null;}
}
