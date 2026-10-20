import {parseRoute} from './routes.mjs';
import {stepGuidance,visibleParts} from './scene-state.mjs';

const missionIds=['locking-engineer','animal-town','bridge-repair','future-city','upgrade','symmetry'];
const ids={models:MODELS.map(m=>m.id),labs:LABS.map(l=>l.id),missions:missionIds.slice(0,MISSIONS.length)};
$('route-bar').append($('restart'));
const memories=new Map();let route=null,entry=null,serial=history.state?.blockPlay?.key||0;
const path=r=>'#/'+r.page+(r.id?'/'+r.id:'');
function remember(){
 if(!route)return;
 memories.set(path(route),{scroll:scrollY,filter,category,visibleLimit,search:$('model-search').value,activeLab,labMode,storyStep,
  mirror,layerOnly,sceneSection,previewSection,sceneOpenWalls,previewOpenWalls,scene:window.blockScene.capture()});
}
function go(hash,replace=false){
 const next=hash.startsWith('#')?hash:'#/'+hash;
 if(next===location.hash)return;
 remember();history[replace?'replaceState':'pushState']({blockPlay:{key:++serial,from:replace?null:location.hash}},'',next);show();
}
function fallback(){
 if(route.page==='preview')return 'build/'+model.id;
 if(['build','ideas'].includes(route.page))return model.level==='complete'?'scenes':'models';
 return route.page==='lab'?'lab':route.page==='missions'?'missions':'models';
}
function back(){if(history.state?.blockPlay?.from)history.back();else go(fallback(),true);}
function show(){
 const token=location.hash+':'+history.state?.blockPlay?.key;if(token===entry)return;
 remember();const next=parseRoute(location.hash,ids,model.id),hash=path(next),saved=memories.get(hash);
 if(hash!==location.hash||!history.state?.blockPlay)history.replaceState({blockPlay:{key:++serial,from:history.state?.blockPlay?.from||null}},'',hash);
 route=next;entry=location.hash+':'+history.state.blockPlay.key;
 const detail=['build','preview','ideas'].includes(next.page),labDetail=next.page==='lab'&&next.id,missionDetail=next.page==='missions'&&next.id;
 const page=next.page==='scenes'?'models':next.page==='preview'?'build':labDetail?'lab-detail':missionDetail?'mission-detail':next.page;
 if($('zoom-dialog').open)closeZoom();
 document.querySelectorAll('[data-page]').forEach(el=>{el.hidden=el.dataset.page!==page;});
 document.body.dataset.route=next.page;$('app-tabs').hidden=['build','preview'].includes(next.page);
 $('route-bar').hidden=!next.id&&next.page!=='settings';$('restart').hidden=next.page!=='build';$('route-notice').textContent=next.notice||'';
 document.querySelectorAll('[data-tab]').forEach(el=>{const active=el.dataset.tab===next.page;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 if(detail){
  if(model.id!==next.id){model=MODELS.find(m=>m.id===next.id);mirror=false;layerOnly=false;sceneSection='all';previewSection='all';sceneOpenWalls=true;previewOpenWalls=true;}
  current=Math.max(0,Math.min(model.steps.length,Number(progress[model.id])||0));preview=next.page==='preview';
  if(saved)({mirror,layerOnly,sceneSection,previewSection,sceneOpenWalls,previewOpenWalls}=saved);
  const guide=guidance();if(guide&&!saved){sceneSection=guide.section;sceneOpenWalls=true;}
  $('route-title').textContent=(preview?'成品 · ':next.page==='ideas'?'自己改一改 · ':'')+model.name;
  window.blockScene.restoreView(saved?.scene||null);render();
 }else if(page==='models'){
  filter=next.page==='scenes'?'complete':saved?.filter||'play';category=saved?.category||'new';visibleLimit=saved?.visibleLimit||8;$('model-search').value=saved?.search||'';
  document.querySelectorAll('[data-filter]').forEach(el=>el.classList.toggle('active',el.dataset.filter===filter));document.querySelectorAll('[data-category]').forEach(el=>el.classList.toggle('active',el.dataset.category===category));
  $('choose').querySelector('h2').textContent=next.page==='scenes'?'选一座可以走进去的积木世界':'今天想搭什么？';renderCards();
 }else if(labDetail){
  activeLab=LABS.findIndex(l=>l.id===next.id);storyStep=saved?.storyStep||0;labMode=saved?.labMode??LAB_STORIES[next.id].scenes[storyStep].mode;renderLab();$('route-title').textContent=LAB_STORIES[next.id].title;
 }else if(missionDetail){
  const i=missionIds.indexOf(next.id),m=MISSIONS[i];$('mission-detail').innerHTML=`<span class="tag">创意任务 ${i+1}</span><h2>${m[0]}</h2><p class="kid-line">${m[1]}</p><p>${m[2]}</p><button class="primary" data-start-model="${m[3]}">选个起点，开始搭 →</button>`;$('route-title').textContent=m[0];
 }else if(next.page==='settings')$('route-title').textContent='安装与离线设置';
 window.blockScene.sync();document.title=($('route-bar').hidden?{models:'造型库',scenes:'完整场景',lab:'结构实验室',missions:'创意任务'}[next.page]:$('route-title').textContent)+' · 积木工坊';
 const heading=$('route-bar').hidden?document.querySelector('[data-page]:not([hidden]) h2'):$('route-title');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});
 requestAnimationFrame(()=>scrollTo({top:saved?.scroll||0,behavior:'instant'}));
}
function guidance(){return route?.page==='build'?stepGuidance(model,current):null;}
function guideStep(){const guide=guidance();if(guide){sceneSection=guide.section;sceneOpenWalls=true;}}
function drawing(){
 const guide=guidance();if(!guide)return null;
 const full=visibleParts(model,{current:model.steps.length,preview:true,section:guide.section,openWalls:true,mirror:false}).filter(p=>p.objectId===guide.id);
 const built=visibleParts(model,{current,preview:false,section:guide.section,openWalls:true,mirror:false});
 const area=full.length?full:[model.steps[current-1].pieces[0]],minX=Math.min(...area.map(p=>p.x))-.5,maxX=Math.max(...area.map(p=>p.x+p.w))+.5,minZ=Math.min(...area.map(p=>p.z))-.5,maxZ=Math.max(...area.map(p=>p.z+p.d))+.5;
 const parts=built.filter(p=>p.objectId===guide.id||((p.role==='floor'||p.role==='base')&&p.x<maxX&&p.x+p.w>minX&&p.z<maxZ&&p.z+p.d>minZ));
 const last=model.steps[current-1].pieces[0],steps=parts.filter(p=>p.index!==current-1).map(p=>({pieces:[p]}));steps.push({pieces:[last]});
 return svg({steps},steps.length,true,mirror);
}
$('lab-cards').innerHTML=LABS.map(l=>`<button class="directory-card" data-open-lab="${l.id}"><span class="number">${l.icon} ${l.keyword}</span><h3>${LAB_STORIES[l.id].title}</h3><p>${KIDLABS[l.id].line}</p><span>听故事，动手试一试 →</span></button>`).join('');
$('missions').innerHTML=MISSIONS.map((m,i)=>`<button class="directory-card" data-open-mission="${missionIds[i]}"><span class="number">创意任务 ${i+1}</span><h3>${m[0]}</h3><p>${m[1]}</p><span>进入任务 →</span></button>`).join('');
document.addEventListener('click',e=>{
 const link=e.target.closest('a[href^="#/"]');if(link){e.preventDefault();go(link.getAttribute('href'));return;}
 const b=e.target.closest('[data-open-lab],[data-open-mission],[data-start-model]');if(!b)return;
 if(b.dataset.openLab)go('lab/'+b.dataset.openLab);else if(b.dataset.openMission)go('missions/'+b.dataset.openMission);else go('build/'+b.dataset.startModel);
});
$('route-back').addEventListener('click',back);
window.addEventListener('popstate',show);window.addEventListener('hashchange',show);
window.blockPlayNav={go,back,guidance,guideStep,drawing,get route(){return route;}};show();
