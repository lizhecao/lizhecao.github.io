const {chromium}=require('playwright'),assert=require('node:assert/strict');
const url=process.argv[2]||'http://127.0.0.1:8765/block-play/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true}),page=await context.newPage();
 await page.goto(url+'#/build/scene-play-school-v2');
 await page.evaluate(()=>{if(model.id!=='scene-play-school-v2')chooseModel('scene-play-school-v2');});
 const beds=await page.evaluate(()=>Object.keys(model.objects).filter(id=>id.includes('bed')));assert.ok(beds.length>=2);
 for(const id of beds){
  await page.evaluate(id=>move(model.steps.findIndex(s=>s.pieces[0].objectId===id)+1),id);assert.equal(await page.evaluate(()=>window.blockScene.active),true,'Indoor steps automatically enable 3D');await page.waitForSelector('#stage-view canvas');
  assert.equal(await page.evaluate(()=>window.blockScene.viewer.selectedId),id);assert.equal(await page.evaluate(()=>sceneOpenWalls),true);
  assert.ok(await page.locator('#stage-view canvas').getAttribute('data-current'));
  const before=await page.evaluate(()=>window.blockScene.viewer.snapshot());await page.locator('[data-scene-action="left"]').first().click();const rotated=await page.evaluate(()=>window.blockScene.viewer.snapshot());assert.notDeepEqual(rotated,before);
  await page.locator('#next').click();assert.deepEqual(await page.evaluate(()=>window.blockScene.viewer.snapshot()),rotated,'Same furniture keeps the camera');
  const step=await page.evaluate(()=>current);await page.locator('[data-step-view]:visible').click();assert.equal(await page.evaluate(()=>current),step);assert.equal(await page.evaluate(()=>window.blockScene.viewer.selectedId),id);
  await page.locator('#view').click();assert.equal(await page.evaluate(()=>mirror),true);assert.equal(await page.evaluate(()=>window.blockScene.viewer.selectedId),id);await page.locator('#view').click();
 }
 const saved=await page.evaluate(()=>localStorage.getItem('block-lab-progress-v4'));await page.locator('#finished-preview').click();await page.waitForSelector('canvas');await page.locator('#route-back').click();await page.waitForSelector('canvas');assert.equal(await page.evaluate(()=>window.blockScene.viewer.selectedId),beds.at(-1));assert.equal(await page.evaluate(()=>localStorage.getItem('block-lab-progress-v4')),saved);
 await page.evaluate(()=>document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));await page.waitForSelector('#stage svg');assert.equal(await page.locator('#stage').getAttribute('data-focus'),beds.at(-1));
 const count=await page.evaluate(()=>current);await page.locator('#stage').click();await page.locator('#zoom-stage').click();assert.equal(await page.evaluate(()=>current),count);
 await context.close();const fallback=await browser.newContext();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){return t==='webgl2'?null:get.call(this,t,...args);};});const fp=await fallback.newPage();await fp.goto(url+'#/build/scene-courtyard-home');await fp.evaluate(()=>move(model.steps.findIndex(s=>s.pieces[0].role==='bed')+1));await fp.waitForFunction(()=>document.querySelector('#stage').dataset.focus==='first-bed');assert.ok(await fp.locator('#stage svg').isVisible());
 console.log('PASS: indoor automatic 3D/floor/furniture, same-object camera, distinct beds, step reset, mirror, preview restoration, context-loss and no-WebGL SVG close-up');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
