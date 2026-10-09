'use strict';
// New IDs keep every original tutorial and saved step intact. Layouts use the
// same brick coordinates for instructions, inventory, SVG and interactive 3D.
(() => {
 const themes=[
  {old:'scene-courtyard-home',id:'scene-courtyard-home-v2',name:'庭院之家 · 客厅餐厨与卧室书房',color:'yellow',rooms:['客厅','餐厅与厨房','卧室','书房']},
  {old:'scene-forest-lodge',id:'scene-forest-lodge-v2',name:'森林小屋 · 营地休息与观察室',color:'brown',rooms:['营地休息区','装备与餐食区','树屋卧室','森林观察室']},
  {old:'scene-play-school',id:'scene-play-school-v2',name:'幼儿园 · 阅读教室与午睡活动室',color:'cream',rooms:['阅读角','课堂活动区','午睡室','手工活动室']}
 ];
 for(const theme of themes){
  const original=SCENE_MODELS.find(m=>m.id===theme.old),school=theme.id.includes('school'),forest=theme.id.includes('forest');
  const m={...original,id:theme.id,originalModelId:theme.old,layoutVersion:2,name:theme.name,subtitle:'新版完整场景 · 分层探索与独立家具',steps:[],objects:{},rooms:theme.rooms.map((name,i)=>({id:`room-${i}`,name,zone:i<2?'first':'second'})),notes:original.notes+' 新版主体占 16×12 凸点，中央留 2 凸点宽通道。楼板沿用 8×4 凸点半高板，实物需确认板件刚度、墙体承托和滑梯接口；请由大人协助盖楼板。家具侧板与靠背另需 1×2 凸点双高窄砖（DUPLO 4066），不可用普通高度窄砖替代。'};
  function add(title,phase,p){m.steps.push({title,phase,text:`${title}。位置：从基板左前角数，向右 ${p.x*2} 个凸点，向后 ${p.z*2} 个凸点，高度 ${p.y} 块普通砖。`,pieces:[p]});}
  function part(x,z,y,w=1,d=1,c=theme.color,extra={}){return {x,z,y,w,d,c,...extra};}
  add('铺好庭院基板','庭院与基础',part(0,0,0,12,12,'green',{zone:'base',role:'base',kind:'baseplate'}));
  function walls(zone,ground){
   const phase=(zone==='first'?'一层':'二层')+'墙体与门窗';
   add('安装三高门框',phase,part(4,5,ground,2,1,'yellow',{zone,role:'door',kind:'door',shell:true}));
   add('安装后墙双高窗框',phase,part(3,10,ground,2,1,'blue',{zone,role:'window',kind:'window',shell:true}));
   for(let y=0;y<4;y++){
    for(const z of [5,10]){
     const cells=Array.from({length:8},(_,i)=>i+1).filter(x=>!(z===5&&x>=4&&x<6&&y<3)&&!(z===10&&x>=3&&x<5&&y<2));
     // Separate contiguous runs so a brick cannot accidentally cover an opening.
     let i=0;while(i<cells.length){const start=cells[i];let size=(i===0&&y%2)?1:cells[i+1]===start+1?2:1;
      add('交错围好墙角与外墙',phase,part(start,z,ground+y,size,1,theme.color,{zone,role:'wall',shell:true}));i+=size;}
    }
    for(const x of [1,8]){let z=6;while(z<10){const d=z===6&&y%2?1:Math.min(2,10-z);add('交错围好侧墙',phase,part(x,z,ground+y,1,d,theme.color,{zone,role:'wall',shell:true}));z+=d;}}
   }
  }
  function object(id,name,description,room,type,x,z,ground){
   const zone=m.rooms[room].zone,phase=m.rooms[room].name+'家具';m.objects[id]={name,description,roomId:m.rooms[room].id};
   const place=(label,dx,dz,dy,w=1,d=1,c='brown',kind)=>add(name+'：'+label,phase,part(x+dx,z+dz,ground+dy,w,d,c,{zone,role:type,objectId:id,roomId:m.rooms[room].id,...(kind?{kind}:{})}));
   if(type==='bed'){
    place('连接床架',0,0,0,2,2);place('铺蓝色床垫',0,0,1,2,1,'blue','plate');place('竖起床头靠板',0,1,1,2,1,'cream');place('放低枕头',0,0,1.5,1,1,'cream','plate');
   }else if(type==='sofa'){
    place('沙发中央底座',.5,0,0,1,2);place('靠背',0,1,1,2,1,'orange');place('座垫',.5,0,1,1,1,'orange','plate');place('左扶手：双高窄砖',0,0,0,.5,1,'yellow','thin');place('右扶手：双高窄砖',1.5,0,0,.5,1,'yellow','thin');place('小抱枕',.5,0,1.5,1,1,'cream','plate');
   }else if(type==='chair'){
    place('稳固底座',0,.5,0,1,1);place('椅面',0,.5,1,1,1,'blue','plate');place('靠背：双高窄砖',0,0,0,1,.5,'blue','thin');
   }else if(type==='shelf'){
    place('柜底',0,0,0,2,1);place('左侧板：双高窄砖',0,0,1,.5,1,'brown','thin');place('右侧板：双高窄砖',1.5,0,1,.5,1,'brown','thin');place('顶板',0,0,3,2,1,'yellow','plate');place('隔间内的红色书本',.5,0,1,1,1,'red','plate');place('隔间内的蓝色书本',.5,0,1.5,1,1,'blue','plate');
   }else if(type==='telescope'){
    place('稳固观察台',0,0,0,2,1,'brown');place('镜筒高端',0,0,1,2,1,'blue','curve');place('黄色观察目镜',0,0,2,1,1,'yellow','plate');
   }else if(type==='kitchen'){
    for(const dx of [0,1]){place('柜体下层',dx,0,0);place('柜体上层',dx,0,1);place('料理台面',dx,0,2,1,1,'cream','plate');}
    place('蓝色薄板代表水槽',0,0,2.5,1,1,'blue','plate');place('红色薄板代表灶台',1,0,2.5,1,1,'red','plate');
   }else{
    place('左桌腿',0,0,0);place('右桌腿',1,0,0);place('桌面',0,0,1,2,1,'yellow','plate');place(forest?'观察记录本':'红色书本',0,0,1.5,1,1,'red','plate');
   }
  }
  function furnish(zone){const upper=zone==='second',g=upper?4.5:0,left=upper?2:0,right=left+1,prefix=upper?'second':'first';
   if(school){
    if(upper){object('second-bed-a','午睡床 A','蓝色床垫和低枕头，床头朝后；与旁边的小床分别搭建。',left,'bed',2,6,g);object('second-bed-b','午睡床 B','独立床架与床头；走道保持空出来。',left,'bed',2,8,g);}
    else{object('first-shelf','阅读书架','高侧板和顶板与红色书本，书架开口朝向教室。',left,'shelf',2,9,g);object('first-sofa','阅读沙发','宽座面、靠背和两侧扶手，坐在这里听故事。',left,'sofa',2,6,g);}
    object(prefix+'-desk',upper?'手工桌':'课堂桌','两条桌腿支撑黄色桌面，桌上的红色板是书本。',right,'table',6,8,g);
    object(prefix+'-chair',upper?'手工椅':'课堂椅','蓝色座面和直立靠背；靠背与桌子之间留活动空间。',right,'chair',6,6,g);
    object(prefix+'-shelf',upper?'作品柜':'材料柜','左右侧板托住高侧板和顶板，用来存放作品与材料。',right,'shelf',6,9,g);
   }else{
    if(upper||forest)object(prefix+'-bed',upper?'卧室床':'营地休息床','棕色床架、蓝色床垫、米白枕头和竖起的床头。',left,'bed',2,6,g);
    else object('first-shelf','客厅书架','开放式高侧板和顶板与红色书本，走道在书架右边。',left,'shelf',2,6,g);
    object(prefix+'-sofa',upper?'卧室小沙发':forest?'营地长椅':'客厅沙发','橙色靠背与座垫，黄色两侧扶手围住小抱枕。',left,'sofa',2,8,g);
    object(prefix+'-desk',upper?(forest?'观察记录桌':'书桌'):'餐桌','两条独立桌腿和宽桌面，红色薄板是书本。',right,'table',6,8,g);
    object(prefix+'-chair',upper?'书桌椅':'餐椅','蓝色座面与靠背分开搭，让椅子可以辨认。',right,'chair',6,6,g);
    if(forest)object(prefix+(upper?'-telescope':'-shelf'),upper?'森林望远镜':'营地装备柜',upper?'蓝色弧形镜筒、黄色目镜与棕色观察台；面向窗外观察树木。':'开放式隔层存放记录本和露营装备。',right,upper?'telescope':'shelf',6,9,g);
    else object(prefix+(upper?'-shelf':'-kitchen'),upper?'书柜':'厨房料理台',upper?'开放储物隔间与红色书本，柜门方向朝室内。':'米白台面，蓝色薄板代表水槽，红色薄板代表灶台。',right,upper?'shelf':'kitchen',6,9,g);
   }
  }
  walls('first',0);furnish('first');
  for(const x of [1,5])for(const z of [5,7,9])add('沿外墙铺二层楼板','二层承托楼板',part(x,z,4,4,2,'cream',{zone:'second',role:'floor',kind:'plate'}));
  walls('second',4.5);furnish('second');
  for(const x of [1,5])for(const z of [5,7,9])add('盖可移开的屋顶底板','可拆屋顶',part(x,z,8.5,4,2,'cream',{zone:'roof',role:'floor',kind:'plate'}));
  for(const z of [5,6,7,8,9,10])for(const x of [1,3,5,7]){const edge=x===1||x===7;add(edge?'铺坡面屋顶，高端朝中间':'连接平顶的中央屋脊','可拆屋顶',part(x,z,9,2,1,'red',{zone:'roof',role:'roof',...(edge?{kind:'roof',flip:x===1}:{})}));}
  for(const x of [1,8]){
   for(let y=0;y<3;y++)add('门外种一棵树：树干','庭院游乐',part(x,1,y,1,1,'brown',{zone:'yard',role:'tree'}));
   add('门外种一棵树：树冠','庭院游乐',part(x-.5,.5,3,2,2,'green',{zone:'yard',role:'tree'}));
  }
  for(let y=0;y<3;y++)add('搭滑梯高端平台','庭院游乐',part(7,3,y,1,1,'yellow',{zone:'yard',role:'platform'}));
  add('高端扣在安装平台，斜槽朝向院子','庭院游乐',part(7,3,0,4,1,'blue',{zone:'yard',role:'slide',kind:'slide'}));
  for(const x of [4,5])for(const z of [2,3,4])add('铺从大门通向庭院的小路','庭院游乐',part(x,z,0,1,1,'cream',{zone:'yard',role:'path',kind:'plate'}));
  SCENE_MODELS.push(m);
 }
})();
