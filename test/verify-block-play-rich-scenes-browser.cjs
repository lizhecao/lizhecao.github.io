const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1024,height:1366},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.argv[2]||'http://127.0.0.1:8765/block-play/');await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);
 await page.locator('[data-filter="complete"]').click();
 await page.locator('[data-model="scene-courtyard-home"]').click();await page.evaluate(()=>move(80));
 await page.locator('[data-model="scene-courtyard-home-v2"]').click();assert.equal(await page.evaluate(()=>current),0);
 await page.evaluate(()=>move(35));await page.locator('[data-model="scene-courtyard-home"]').click();assert.equal(await page.evaluate(()=>current),80);
 await page.locator('[data-model="scene-courtyard-home-v2"]').click();assert.equal(await page.evaluate(()=>current),35);
 await page.locator('[data-scene-toggle]').first().click();await page.waitForSelector('canvas');
 const models=await page.evaluate(()=>SCENE_MODELS.map(m=>m.id));
 for(const id of models){
  await page.locator('[data-model="'+id+'"]').click();await page.locator('#finished-preview').click();
  for(const section of ['first','second','yard','roof','all']){
   await page.locator('#scene-sections [data-section="'+section+'"]').click();
   const n=await page.evaluate(async()=>{const {visibleParts}=await import('./scene-state.mjs');return visibleParts(model,{current,preview,section:previewSection,openWalls:true}).length;});
   assert.equal(Number(await page.locator('canvas').getAttribute('data-parts')),n);
   assert.ok((await page.locator('canvas').boundingBox()).height>=600);
  }
  if(id==='scene-courtyard-home'){for(const name of ['front','side','back']){if(name!=='front')await page.evaluate(()=>{for(let i=0;i<5;i++)window.blockScene.viewer.command('left');});await page.locator('#stage-view').screenshot({path:'/tmp/block-play-3d-'+name+'.png'});}}
  if(id.endsWith('-v2')){
   await page.locator('#scene-sections [data-section="second"]').click();
   const buttons=page.locator('.scene-object-list button');assert.ok(await buttons.count()>=4);
   for(let i=0;i<await buttons.count();i++){await buttons.nth(i).click();assert.ok(await page.locator('.scene-object-detail details').count());}
   await page.locator('button[data-object="second-bed'+(id.includes('school')?'-a':'')+'"]').click();
   const saved=await page.evaluate(()=>localStorage.getItem('block-lab-progress-v4'));
   const canvas=page.locator('canvas');await canvas.tap();assert.match(await page.locator('.scene-object-detail > strong').textContent(),/床/);
   const cdp=await context.newCDPSession(page),box=await canvas.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-40,y},{x:x+40,y}]});
   for(let k=0;k<8;k++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-40-k*5,y:y+k*2},{x:x+40+k*5,y:y+k*2}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
   assert.equal(await page.evaluate(()=>localStorage.getItem('block-lab-progress-v4')),saved);
   await page.locator('#view').click();assert.equal(await page.evaluate(()=>mirror),true);assert.ok(await page.locator('canvas').getAttribute('data-object'),'Mirror keeps furniture selection');
   await page.locator('button[data-object="second-bed'+(id.includes('school')?'-b':'')+'"]').click();
   if(id.includes('school'))assert.match(await page.locator('.scene-object-detail > strong').textContent(),/B/);
   await page.locator('#view').click();
   await page.locator('[data-scene-action="reset"]').first().click();
   if(id.includes('home')){
    await page.locator('#scene-sections [data-section="first"]').click();await page.locator('#stage-view').screenshot({path:'/tmp/block-play-rich-home-first.png'});
    await page.locator('#scene-sections [data-section="second"]').click();await page.locator('#stage-view').screenshot({path:'/tmp/block-play-rich-home-second.png'});
   }
   await page.locator('#finished-preview').click();
   const floorIndex=await page.evaluate(()=>model.steps.findIndex(s=>s.pieces[0].zone==='second')+1);
   await page.evaluate(n=>move(n),floorIndex);assert.equal(await page.evaluate(()=>sceneSection),'second');
   await page.locator('#scene-sections [data-section="first"]').click();await page.evaluate(n=>move(n+1),floorIndex);assert.equal(await page.evaluate(()=>sceneSection),'second','A selected floor cannot hide the next part');
   const before=await page.evaluate(()=>window.blockScene.viewer.snapshot());await page.evaluate(n=>move(n+2),floorIndex);
   const after=await page.evaluate(()=>window.blockScene.viewer.snapshot());before.position.forEach((v,i)=>assert.ok(Math.abs(v-after.position[i])<1e-8));
   await page.evaluate(()=>move(0));
  }
 }
 const metrics=await page.evaluate(async()=>{const seed=MODELS.find(m=>m.id==='scene-courtyard-home-v2'),steps=seed.steps.slice();while(steps.length<500){const i=steps.length-seed.steps.length;steps.push({pieces:[{x:i%12,z:Math.floor(i/12)%12,y:11+Math.floor(i/144),w:1,d:1,c:['red','blue','yellow','green','cream','orange','brown'][i%7],zone:'roof'}]});}window.blockScene.viewer.setModel({...seed,id:'stress-500',steps},{current:500,preview:true,section:'all',openWalls:true});await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);return window.blockScene.viewer.metrics();});
 assert.equal(metrics.parts,500);assert.ok(metrics.calls<100,'Repeated parts are instanced');assert.ok(metrics.geometries<100,'Shared geometry stays bounded');console.log('Desktop software WebGL metrics (not iPad performance): '+JSON.stringify(metrics));
 await page.evaluate(()=>{chooseModel('ref-turtle');move(2);});assert.equal(await page.locator('canvas').count(),0);await page.locator('#layer-view').click();assert.match(await page.locator('#stage').textContent(),/从上往下看/);
 await page.evaluate(()=>{chooseModel('scene-play-school-v2');move(0);});await page.waitForSelector('canvas');
 assert.deepEqual(errors,[]);
 await page.setViewportSize({width:390,height:844});await page.locator('#next').click();assert.equal(await page.locator('#zoom-dialog').evaluate(el=>el.open),true);
 assert.ok((await page.locator('canvas').boundingBox()).height>=170);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 for(const b of await page.locator('#zoom-dialog .scene-toolbar button').all())assert.ok((await b.boundingBox()).height>=44);
 console.log('PASS: six interactive scenes, three distinct layouts, old step 80 and new progress independent, multi-bed picking, touch pinch/pan and mirror, cross-floor reveal, same-floor camera, phone/iPad dimensions');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
