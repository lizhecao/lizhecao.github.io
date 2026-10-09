const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const context=await browser.newContext(),page=await context.newPage(),base=process.argv[2]||'http://127.0.0.1:8765/';
 await page.goto(base+'block-play/');await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);
 await page.evaluate(()=>{localStorage.setItem('block-lab-progress-v4',JSON.stringify({'scene-courtyard-home':80}));localStorage.setItem('block-lab-voice','off');});
 const response=await page.goto(base+'block-play-preview/');assert.equal(response.status(),200,'Acceptance preview must have a usable link');
 await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);
 await page.evaluate(()=>chooseModel('scene-courtyard-home'));assert.equal(await page.evaluate(()=>current),0,'Preview does not read production progress');
 await page.evaluate(()=>move(2));assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('block-lab-progress-v4'))['scene-courtyard-home']),80);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('block-lab-preview-progress-v4'))['scene-courtyard-home']),2);
 const keys=await page.evaluate(()=>caches.keys());assert.ok(keys.some(k=>k.includes(encodeURIComponent('/block-play/'))));assert.ok(keys.some(k=>k.includes(encodeURIComponent('/block-play-preview/'))));
 await context.setOffline(true);await page.reload();await page.evaluate(()=>chooseModel('scene-courtyard-home'));assert.equal(await page.evaluate(()=>current),2);
 await page.locator('[data-scene-toggle]').first().click();await page.waitForSelector('canvas');
 const benchmark=await page.goto(base+'block-play-preview/benchmark.html');assert.equal(benchmark.status(),200);await page.waitForSelector('canvas');await page.waitForFunction(()=>document.querySelector('#result').textContent.includes('metrics'));assert.match(await page.locator('#result').textContent(),/metrics|initial/);
 await page.goto(base+'block-play/');await page.evaluate(()=>chooseModel('scene-courtyard-home'));assert.equal(await page.evaluate(()=>current),80);
 console.log('PASS: preview URL, isolated progress and scoped SW caches, offline first 3D and benchmark page, original tutorial still at step 80');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
