import * as T from './vendor/three-0.186.1.mjs';
import {visibleParts,furnitureObjects,dimensions,ViewMemory} from './scene-state.mjs';
import {components} from './scene-geometry.mjs';

export function createViewer(host,{colors,onPick,onFailure}) {
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','三维场景：单指旋转，双指缩放和平移；也可使用下方按钮');canvas.tabIndex=0;
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#f5f1e8');
 host.append(canvas);
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-8,8,8,-8,.01,200),controls=new T.OrbitControls(camera,canvas);
 controls.enableDamping=false;controls.minZoom=.4;controls.maxZoom=8;controls.maxPolarAngle=Math.PI*.49;
 scene.add(new T.HemisphereLight(0xffffff,0x79715d,2.3));const sun=new T.DirectionalLight(0xffffff,2);sun.position.set(-8,14,6);scene.add(sun);
 let root=new T.Group();scene.add(root);
 const geometry=new Map(),materials=new Map(),memory=new ViewMemory(),ray=new T.Raycaster(),pointer=new T.Vector2();
 let parts=[],model=null,view=null,selected=null,frame=0,lost=false,drag=null,pointers=new Set(),multitouch=false;
 const draw=()=>{if(!frame&&!lost)frame=requestAnimationFrame(()=>{frame=0;renderer.render(scene,camera);});};
 controls.addEventListener('change',draw);
 const size=()=>{const rect=canvas.parentElement.getBoundingClientRect();if(!rect.width||!rect.height)return;const ratio=rect.width/rect.height;camera.left=-8*ratio;camera.right=8*ratio;camera.top=8;camera.bottom=-8;camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height,false);draw();};
 const observer=new ResizeObserver(size);observer.observe(host);
 function snapshot(){return {position:camera.position.toArray(),target:controls.target.toArray(),zoom:camera.zoom};}
 function restore(c){camera.position.fromArray(c.position);controls.target.fromArray(c.target);camera.zoom=c.zoom;camera.updateProjectionMatrix();controls.update();draw();}
 function framingParts(){const selectedParts=selected?parts.filter(p=>p.objectId===selected):[];return selectedParts.length?selectedParts:view.section==='first'?visibleParts(model,{...view,openWalls:false}).filter(p=>p.zone==='first'):parts;}
 function fit(list=framingParts(),top=false) {
  const box=new T.Box3();for(const p of list){const d=dimensions(p);box.expandByPoint(new T.Vector3(p.x,d.bottom,p.z||0));box.expandByPoint(new T.Vector3(p.x+d.width,d.top+.12,(p.z||0)+d.depth));}
  if(box.isEmpty()){box.min.set(0,0,0);box.max.set(12,1,12);}
  const center=box.getCenter(new T.Vector3());
  controls.target.copy(center);camera.position.copy(center).add(top?new T.Vector3(0,20,.001):new T.Vector3(12,13,16));
  camera.zoom=1;camera.updateProjectionMatrix();controls.update();
  const projected=new T.Box3();for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])projected.expandByPoint(new T.Vector3(x,y,z).project(camera));
  const extent=projected.getSize(new T.Vector3());camera.zoom=Math.min(6,Math.max(.4,Math.min(1.7/Math.max(.01,extent.x),1.6/Math.max(.01,extent.y))));
  camera.updateProjectionMatrix();controls.update();draw();
 }
 function primitive(c) {
  const key=JSON.stringify(c.type==='profile'?{type:c.type,points:c.points,depth:c.depth}:{type:c.type,size:c.size});
  if(!geometry.has(key)){
   let g;if(c.type==='box')g=new T.BoxGeometry(...c.size);
   else if(c.type==='stud')g=new T.CylinderGeometry(c.size[0],c.size[0],c.size[1],12);
   else{const shape=new T.Shape();c.points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();g=new T.ExtrudeGeometry(shape,{depth:c.depth,bevelEnabled:false,steps:1,curveSegments:6});}
   geometry.set(key,g);
  }
  return [key,geometry.get(key)];
 }
 function clear(){scene.remove(root);root.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.userData.outline){o.geometry.dispose();o.material.dispose();}});root=new T.Group();scene.add(root);}
 function rebuild(){
  clear();const batches=new Map();
  const selectedZone=selected?parts.find(p=>p.objectId===selected)?.zone:null;
  const drawn=selected?parts.filter(p=>p.objectId===selected||(p.role==='floor'&&p.zone===selectedZone)||(p.role==='base'&&selectedZone==='first')):parts;
  for(const p of drawn)for(const c of components(p)){
   const [key,g]=primitive(c),color=colors[c.color||p.c]?.hex||colors[c.color||p.c]||'#7bac69',batchKey=key+color;
   if(!batches.has(batchKey))batches.set(batchKey,{g,color,items:[]});batches.get(batchKey).items.push({p,c});
  }
  const transform=new T.Object3D();
  for(const {g,color,items} of batches.values()){
   if(!materials.has(color))materials.set(color,new T.MeshLambertMaterial({color}));
   const mesh=new T.InstancedMesh(g,materials.get(color),items.length);mesh.userData.parts=items.map(x=>x.p);
   items.forEach(({p,c},i)=>{transform.rotation.set(0,c.rotation||0,0);transform.position.set(p.x+c.position[0],p.y*.6+c.position[1],(p.z||0)+c.position[2]);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);});
   mesh.computeBoundingSphere();root.add(mesh);
  }
  // A single boundary outline keeps opened walls legible without a wire cage.
  const shell=(view.section!=='all'&&view.openWalls)||selected?visibleParts(model,{...view,section:selectedZone||view.section,openWalls:false}).filter(p=>p.shell):[];
  const boundary=new T.Box3();for(const p of shell){const d=dimensions(p);boundary.expandByPoint(new T.Vector3(p.x,d.bottom,p.z));boundary.expandByPoint(new T.Vector3(p.x+d.width,d.top,p.z+d.depth));}
  const outlines=[];
  if(!boundary.isEmpty()){const size=boundary.getSize(new T.Vector3()),center=boundary.getCenter(new T.Vector3());outlines.push({size:size.toArray(),position:center.toArray(),color:'#b5b0a5'});}
  for(const p of [...shell.filter(p=>['door','window'].includes(p.kind)),...parts.filter(p=>(selected&&p.objectId===selected)||(!view.preview&&p.index===view.current-1))]){
   const d=dimensions(p);outlines.push({size:[d.width+.02,Math.max(.08,d.height)+.02,d.depth+.02],position:[p.x+d.width/2,d.bottom+d.height/2,p.z+d.depth/2],color:shell.includes(p)?'#b5b0a5':'#d35c2d'});
  }
  for(const o of outlines){
   const g=new T.BoxGeometry(...o.size),edge=new T.EdgesGeometry(g);g.dispose();
   const line=new T.LineSegments(edge,new T.LineBasicMaterial({color:o.color}));
   line.position.fromArray(o.position);line.userData.outline=true;root.add(line);
  }
  canvas.dataset.parts=String(drawn.length);canvas.dataset.object=selected||'';canvas.dataset.objects=String(furnitureObjects(model,parts).length);draw();
 }
 function setModel(next,nextView){
  const changed=model?.id!==next.id,modeChanged=!changed&&view?.preview!==nextView.preview,sectionChanged=!changed&&view?.section!==nextView.section;
  const mirrorChanged=!changed&&view?.mirror!==nextView.mirror,previousSelected=selected;
  if(model)memory.save(model.id,view.preview,{section:view.section,selected,camera:snapshot()});
  if(changed)memory.clear(next.id);
  const saved=modeChanged?memory.restore(next.id,nextView.preview):null;
  model=next;view={...nextView};parts=visibleParts(model,view);const requested=saved?.selected||(mirrorChanged?previousSelected:null);selected=requested&&parts.some(p=>p.objectId===requested)?requested:null;rebuild();
  if(saved&&saved.section===view.section)restore(saved.camera);else if(changed||modeChanged||sectionChanged||(mirrorChanged&&selected))fit();
  return furnitureObjects(model,parts);
 }
 function clearFocus(){selected=null;rebuild();fit();}
 function focus(id){const object=furnitureObjects(model,parts).find(o=>o.id===id);if(!object)return;selected=id;rebuild();fit(object.parts);onPick(object);}
 canvas.addEventListener('pointerdown',e=>{pointers.add(e.pointerId);if(pointers.size>1)multitouch=true;drag={x:e.clientX,y:e.clientY,moved:false};});
 canvas.addEventListener('pointermove',e=>{if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7)drag.moved=true;});
 canvas.addEventListener('pointerup',e=>{
  const click=drag&&!drag.moved&&!multitouch&&pointers.size===1;pointers.delete(e.pointerId);if(!pointers.size)multitouch=false;
  if(!click)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
  const hit=ray.intersectObjects(root.children,false).find(h=>h.object.isInstancedMesh);
  const p=hit?.object.userData.parts[hit.instanceId];if(p?.objectId)focus(p.objectId);
 });
 canvas.addEventListener('pointercancel',()=>{pointers.clear();drag=null;multitouch=false;});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(lost)return;lost=true;onFailure('三维画面中断，已切换为搭建图。');});
 function command(action){
  if(action==='reset')fit();else if(action==='top')fit(framingParts(),true);
  else if(action==='in'||action==='out'){camera.zoom=Math.max(.4,Math.min(8,camera.zoom*(action==='in'?1.25:.8)));camera.updateProjectionMatrix();draw();}
  else if(action==='left'||action==='right'){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new T.Vector3(0,1,0),action==='left'?.3:-.3);camera.position.copy(controls.target).add(offset);controls.update();}
  else if(action==='up'||action==='down'){const delta=new T.Vector3(0,0,action==='up'?-.5:.5);camera.position.add(delta);controls.target.add(delta);controls.update();}
 }
 canvas.addEventListener('keydown',e=>{const actions={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down','+':'in','-':'out',Home:'reset'};if(actions[e.key]){e.preventDefault();command(actions[e.key]);}});
 size();
 return {get selectedId(){return selected;},canvas,setModel,focus,clearFocus,command,snapshot,metrics(){return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,parts:parts.length};},attach(parent){parent.append(canvas);observer.disconnect();observer.observe(parent);size();},dispose(){lost=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();clear();for(const g of geometry.values())g.dispose();for(const m of materials.values())m.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();}};
}
