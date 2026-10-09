const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),http=require('node:http');
(async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'block-play-cache-upgrade-')),app=path.join(temp,'block-play');
 await fs.cp(path.resolve('source/block-play'),app,{recursive:true});
 const sw=await fs.readFile(path.join(app,'sw.js'),'utf8'),pwa=await fs.readFile(path.join(app,'pwa.js'),'utf8'),viewer=await fs.readFile(path.join(app,'scene-viewer.mjs'),'utf8');
 const version=/20261009-v\d+/.exec(sw)[0],broken=version+'-test-broken',rollback=version+'-test-rollback';
 await fs.writeFile(path.join(app,'sw.js'),sw.replaceAll(version,broken));await fs.writeFile(path.join(app,'pwa.js'),pwa.replaceAll(version,broken));
 await fs.writeFile(path.join(app,'scene-viewer.mjs'),'throw new Error("injected broken viewer");');
 const server=http.createServer(async(req,res)=>{try{const clean=new URL(req.url,'http://localhost').pathname;const file=path.join(temp,clean.endsWith('/')?clean+'index.html':clean);if(!file.startsWith(temp+path.sep))throw Error();const data=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')||file.endsWith('.mjs')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);}catch{res.statusCode=404;res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/block-play/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext(),page=await context.newPage();await page.goto(url);await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);
  await page.locator('[data-filter="complete"]').click();await page.locator('[data-model="scene-courtyard-home"]').click();await page.evaluate(()=>move(80));
  await page.locator('[data-scene-toggle]').first().click();await page.waitForFunction(()=>document.querySelector('.scene-status').textContent.includes('暂时'));
  assert.equal(await page.locator('#stage').isVisible(),true);
  // Restore functional assets using a fresh SW version; old poisoned cache must disappear.
  await fs.writeFile(path.join(app,'scene-viewer.mjs'),viewer);await fs.writeFile(path.join(app,'sw.js'),sw.replaceAll(version,rollback));await fs.writeFile(path.join(app,'pwa.js'),pwa.replaceAll(version,rollback));
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.waitForFunction(async version=>{const keys=await caches.keys();return keys.some(k=>k.endsWith(version))&&!keys.some(k=>k.includes('test-broken'));},rollback);
  await page.reload();await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);await context.setOffline(true);
  await page.locator('[data-filter="complete"]').click();await page.locator('[data-model="scene-courtyard-home"]').click();assert.equal(await page.evaluate(()=>current),80);
  await page.locator('[data-scene-toggle]').first().click();await page.waitForSelector('canvas');
  assert.ok(await page.locator('canvas').count());console.log('PASS: injected broken module -> SVG; fresh-version rollback removes poisoned cache, restores offline 3D and preserves step 80');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));await fs.rm(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exit(1)});
