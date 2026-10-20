const {chromium}=require('playwright'),assert=require('node:assert/strict');
const url=process.argv[2]||'http://127.0.0.1:8765/block-play/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const context=await browser.newContext({viewport:{width:1024,height:768},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);
 const ids=await page.evaluate(()=>SCENE_MODELS.map(m=>m.id));
 for(const id of ids){
  await page.evaluate(id=>window.blockPlayNav.go('preview/'+id),id);await page.waitForSelector('canvas');
  for(const section of ['first','second','yard','roof','all']){
   await page.locator('#scene-sections [data-section="'+section+'"]').click();
   const n=await page.evaluate(async()=>{const {visibleParts}=await import('./scene-state.mjs');return visibleParts(model,{current,preview,section:previewSection,openWalls:true}).length;});assert.equal(Number(await page.locator('canvas').getAttribute('data-parts')),n);
  }
  if(id.endsWith('-v2')){
   await page.locator('#scene-sections [data-section="second"]').click();
   const buttons=page.locator('.scene-object-list button');assert.ok(await buttons.count()>=4);
   for(const b of await buttons.all()){await b.click();assert.ok(await page.locator('.scene-object-detail details').count());}
   const saved=await page.evaluate(()=>localStorage.getItem('block-lab-progress-v4'));
   const cdp=await context.newCDPSession(page),box=await page.locator('canvas').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-40,y},{x:x+40,y}]});
   for(let k=0;k<6;k++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-40-k*5,y:y+k*2},{x:x+40+k*5,y:y+k*2}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();assert.equal(await page.evaluate(()=>localStorage.getItem('block-lab-progress-v4')),saved);
  }
 }
 for(let i=0;i<5;i++){await page.evaluate(()=>window.blockPlayNav.go('models'));assert.equal(await page.locator('canvas').count(),0,'No hidden viewer');await page.evaluate(()=>window.blockPlayNav.go('preview/scene-courtyard-home-v2'));await page.waitForSelector('canvas');assert.equal(await page.locator('canvas').count(),1);}
 const metrics=await page.evaluate(async()=>{const seed=MODELS.find(m=>m.id==='scene-courtyard-home-v2'),steps=seed.steps.slice();while(steps.length<500){const i=steps.length-seed.steps.length;steps.push({pieces:[{x:i%12,z:Math.floor(i/12)%12,y:11+Math.floor(i/144),w:1,d:1,c:'blue',zone:'roof'}]});}window.blockScene.viewer.setModel({...seed,id:'stress-500',steps},{current:500,preview:true,section:'all',openWalls:true});await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);return window.blockScene.viewer.metrics();});assert.equal(metrics.parts,500);assert.equal(Number(await page.locator('canvas').getAttribute('data-parts')),500);assert.ok(metrics.triangles>50000,'Stress scene actually renders all 500 pieces');assert.ok(metrics.calls<100);assert.ok(metrics.geometries<100);
 await page.evaluate(()=>window.blockPlayNav.go('build/play-bunny'));await page.locator('#finished-preview').click();assert.equal(await page.locator('canvas').count(),0);assert.equal(await page.locator('#stage [data-part]').count(),await page.evaluate(()=>model.steps.length));
 assert.deepEqual(errors,[]);console.log('PASS: six scene routes/all floors, all furniture details, simulated pinch/pan, five viewer disposal cycles and ordinary SVG preview; desktop software renderer stress metrics: '+JSON.stringify(metrics));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
