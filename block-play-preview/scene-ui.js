'use strict';
window.blockScene=(()=>{
 let getState,viewer,loading,enabled=false,failed=false,objects=[],key='',modelId='';
 const $=id=>document.getElementById(id),hosts={},bars={};
 const panel=document.createElement('div');panel.className='scene-object-panel';panel.hidden=true;
 const list=document.createElement('div');list.className='scene-object-list';list.setAttribute('aria-label','定位家具');
 const detail=document.createElement('div');detail.className='scene-object-detail';detail.setAttribute('aria-live','polite');panel.append(list,detail);
 const actions=[['left','↶ 左转'],['right','右转 ↷'],['in','＋ 放大'],['out','－ 缩小'],['up','向后移'],['down','向前移'],['top','俯视'],['reset','复位']];
 for(const prefix of ['','zoom-']){
  const host=document.createElement('div');host.className='scene-canvas';host.hidden=true;$(prefix+'stage-view').append(host);hosts[prefix]=host;
  const bar=document.createElement('div');bar.className='scene-toolbar';bar.hidden=true;
  bar.innerHTML='<button type="button" data-scene-toggle aria-pressed="false">3D 旋转查看</button><span class="scene-tools" hidden>'+actions.map(([a,t])=>`<button type="button" data-scene-action="${a}">${t}</button>`).join('')+'<button type="button" data-scene-walls aria-pressed="true">显示外墙</button>'+(prefix?'':'<button type="button" data-scene-fullscreen>⤢ 全屏</button>')+'</span><span class="scene-status" role="status"></span>';
  $(prefix+'stage-view').after(bar);bars[prefix]=bar;
  bar.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b)return;
   if(b.hasAttribute('data-scene-toggle')){enabled=!enabled;failed=false;sync();}
   else if(b.dataset.sceneAction)viewer?.command(b.dataset.sceneAction);
   else if(b.hasAttribute('data-scene-walls')){getState().toggleWalls();sync();}
   else if(b.hasAttribute('data-scene-fullscreen'))getState().openZoom();
  });
 }
 function fallback(message){enabled=false;failed=true;viewer?.dispose();viewer=null;for(const b of Object.values(bars))b.querySelector('.scene-status').textContent=message||'暂时无法打开三维画面，可以继续用搭建图。';sync();}
 async function ensure(){if(viewer||loading||failed)return;for(const b of Object.values(bars))b.querySelector('.scene-status').textContent='正在打开三维场景…';
  loading=import('./scene-viewer.mjs').then(({createViewer})=>{if(!enabled)return;viewer=createViewer(hosts[getState().fullscreen?'zoom-':''],{colors:getState().colors,onPick:showObject,onFailure:fallback});key='';for(const b of Object.values(bars))b.querySelector('.scene-status').textContent='单指旋转 · 双指缩放、平移';}).catch(()=>fallback()).finally(()=>{loading=null;sync();});
 }
 function showObject(object){
  if(!objects.some(o=>o.id===object.id))return;
  const state=getState(),indices=state.model.steps.flatMap((s,i)=>s.pieces.some(p=>p.objectId===object.id||(!p.objectId&&object.parts.some(q=>q.index===i)))?[i]:[]);
  detail.replaceChildren();const title=document.createElement('strong');title.textContent=object.name;const p=document.createElement('p');p.textContent=object.description;detail.append(title,p);const back=document.createElement('button');back.type='button';back.className='quiet';back.textContent='回到楼层视图';back.addEventListener('click',clearFocus);detail.append(back);const materials=document.createElement('div');materials.className='object-materials';materials.innerHTML=state.materials(object.parts);detail.append(materials);
  const tutorial=document.createElement('details'),summary=document.createElement('summary');summary.textContent=`看它怎么搭 · 第 ${indices[0]+1}–${indices.at(-1)+1} 步`;
  const steps=document.createElement('ol');steps.start=indices[0]+1;
  for(const i of indices){const li=document.createElement('li');li.value=i+1;li.textContent=state.model.steps[i].text;const art=document.createElement('div');art.className='object-step-art';art.innerHTML=state.pieceArt(state.model.steps[i].pieces[0]);li.prepend(art);steps.append(li);}
  tutorial.append(summary,steps);detail.append(tutorial);
  for(const b of list.children)b.setAttribute('aria-pressed',String(b.dataset.object===object.id));
 }
 function clearFocus(){viewer?.clearFocus();detail.replaceChildren();for(const b of list.children)b.setAttribute('aria-pressed','false');}
 function sync(){if(!getState)return;const state=getState(),complete=state.model.level==='complete',active=enabled&&complete&&!failed,prefix=state.fullscreen?'zoom-':'';
  if(modelId!==state.model.id){modelId=state.model.id;detail.replaceChildren();}
  for(const p of ['','zoom-']){
   bars[p].hidden=!complete;hosts[p].hidden=!active||p!==prefix;$(p+'stage').hidden=active;
   bars[p].querySelector('[data-scene-toggle]').textContent=active?'查看搭建图':'3D 旋转查看';bars[p].querySelector('[data-scene-toggle]').setAttribute('aria-pressed',String(active));bars[p].querySelector('.scene-tools').hidden=!active;
   bars[p].querySelector('[data-scene-walls]').textContent=state.openWalls?'显示外墙':'打开外墙';bars[p].querySelector('[data-scene-walls]').setAttribute('aria-pressed',String(!state.openWalls));
   if(active){$(p+'room-furniture').hidden=true;bars[p].querySelector('.scene-status').textContent=(state.model.sections[state.section]||'全景')+' · 单指旋转，双指缩放/平移';}
  }
  panel.hidden=!active;
  if(!active){if(viewer){viewer.dispose();viewer=null;key='';}return;}
  bars[prefix].after(panel);
  if(!viewer){ensure();return;}
  if(viewer.canvas.parentElement!==hosts[prefix])viewer.attach(hosts[prefix]);
  const nextKey=JSON.stringify([state.model.id,state.current,state.preview,state.section,state.openWalls,state.mirror]);
  if(key!==nextKey){objects=viewer.setModel(state.model,state);key=nextKey;detail.replaceChildren();list.replaceChildren();for(const o of objects){const b=document.createElement('button');b.type='button';b.textContent=(state.model.rooms?.find(r=>r.id===state.model.objects?.[o.id]?.roomId)?.name||'')+(state.model.rooms?' · ':'')+o.name;b.dataset.object=o.id;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>viewer.focus(o.id));list.append(b);}const selected=objects.find(o=>o.id===viewer.selectedId);if(selected)showObject(selected);}
  if(state.fullscreen)$('zoom-status').textContent=(state.preview?'完整成品':`第 ${state.current} / ${state.model.steps.length} 步`)+' · 转动查看，再点「我搭好了」';
 }
 return {clearFocus,configure(fn){getState=fn;sync();},sync,get active(){return Boolean(enabled&&!failed&&getState&&getState().model.level==='complete');},get viewer(){return viewer;}};
})();
