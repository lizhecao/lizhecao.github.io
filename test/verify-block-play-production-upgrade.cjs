const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),http=require('node:http'),{execFileSync}=require('node:child_process');
(async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'block-play-production-upgrade-')),oldRef=process.argv[2]||'e2c51df';
 const files=execFileSync('git',['ls-tree','-r','--name-only',oldRef,'block-play'],{encoding:'utf8'}).trim().split('\n');
 for(const file of files){const target=path.join(temp,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,execFileSync('git',['show',oldRef+':'+file]));}
 const oldSW=await fs.readFile(path.join(temp,'block-play/sw.js'),'utf8');assert.match(oldSW,/20261009-v17/,'Use the last production snapshot, not the preview app');
 const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.join(temp,pathname.endsWith('/')?pathname+'index.html':pathname);if(!file.startsWith(temp+path.sep))throw Error();const data=await fs.readFile(file);res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);}catch{res.statusCode=404;res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/block-play/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext(),page=await context.newPage();await page.goto(url);await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);
  assert.equal(await page.evaluate(()=>MODELS.length),64);
  await page.evaluate(async()=>{chooseModel('scene-courtyard-home');move(80);localStorage.setItem('block-lab-preview-progress-v4','{"scene-courtyard-home-v2":35}');await caches.open('block-play-offline-%2Fblock-play-preview%2F-20261009-v17-preview1');});
  await fs.cp(path.resolve('public/block-play'),path.join(temp,'block-play'),{recursive:true});
  await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});
  await page.waitForFunction(async()=>{const keys=await caches.keys();return keys.includes('block-play-offline-%2Fblock-play%2F-20261010-v18')&&!keys.includes('block-play-offline-%2Fblock-play%2F-20261009-v17');});
  await page.reload();await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);assert.equal(await page.evaluate(()=>MODELS.length),64);
  await page.evaluate(()=>chooseModel('scene-courtyard-home'));assert.equal(await page.evaluate(()=>current),80);
  await page.evaluate(()=>chooseModel('scene-courtyard-home-v2'));assert.equal(await page.evaluate(()=>current),0,'Preview progress is never migrated into production');
  assert.equal(await page.evaluate(()=>localStorage.getItem('block-lab-preview-progress-v4')),'{"scene-courtyard-home-v2":35}');
  assert.ok(await page.evaluate(async()=>(await caches.keys()).includes('block-play-offline-%2Fblock-play-preview%2F-20261009-v17-preview1')));
  await context.setOffline(true);await page.reload();await page.locator('[data-filter="complete"]').click();await page.locator('[data-model="scene-courtyard-home-v2"]').click();await page.locator('#finished-preview').click();await page.locator('[data-scene-toggle]').first().click();await page.waitForSelector('canvas');
  await page.locator('#scene-sections [data-section="second"]').click();assert.ok(await page.locator('button[data-object="second-bed"]').count());
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('block-lab-progress-v4'))['scene-courtyard-home']),80);
  console.log('PASS: real production v17 -> v18 SW upgrade, 64 models, old step 80 preserved, preview storage/cache untouched, offline first 3D');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));await fs.rm(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exit(1)});
