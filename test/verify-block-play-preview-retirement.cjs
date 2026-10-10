const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),http=require('node:http'),{execFileSync}=require('node:child_process');
(async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'block-play-preview-retirement-')),oldRef=process.argv[2]||'e2c51df';
 const files=execFileSync('git',['ls-tree','-r','--name-only',oldRef,'block-play','block-play-preview'],{encoding:'utf8'}).trim().split('\n');
 for(const file of files){const target=path.join(temp,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,execFileSync('git',['show',oldRef+':'+file]));}
 const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.join(temp,pathname.endsWith('/')?pathname+'index.html':pathname);if(!file.startsWith(temp+path.sep))throw Error();const data=await fs.readFile(file);res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);}catch{res.statusCode=404;res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox']});
 try{
  const context=await browser.newContext(),page=await context.newPage();
  await page.goto(base+'block-play/');await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);
  await page.evaluate(()=>{chooseModel('scene-courtyard-home');move(80);});
  await page.goto(base+'block-play-preview/');await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);
  await page.evaluate(()=>{chooseModel('scene-courtyard-home');move(2);});
  const productionKeys=await page.evaluate(async()=>(await caches.keys()).filter(key=>key.startsWith('block-play-offline-%2Fblock-play%2F-')));
  await context.setOffline(true);await page.reload();await page.evaluate(()=>chooseModel('scene-courtyard-home'));assert.equal(await page.evaluate(()=>current),2,'Old preview really has an offline cache');await context.setOffline(false);
  const retirement=await fs.readFile('tools/block-play-3d/retire-preview-sw.js');
  await fs.rm(path.join(temp,'block-play-preview'),{recursive:true});await fs.mkdir(path.join(temp,'block-play-preview'));await fs.writeFile(path.join(temp,'block-play-preview/sw.js'),retirement);
  for(const endpoint of ['block-play-preview/','block-play-preview/benchmark.html'])assert.equal((await fetch(base+endpoint)).status,404);
  await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});
  await page.waitForURL(base+'block-play/');await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);
  await page.waitForFunction(async()=>!(await navigator.serviceWorker.getRegistrations()).some(r=>new URL(r.scope).pathname==='/block-play-preview/'));
  const keys=await page.evaluate(()=>caches.keys());assert.ok(!keys.some(key=>key.startsWith('block-play-offline-%2Fblock-play-preview%2F-')));for(const key of productionKeys)assert.ok(keys.includes(key),'Keep production caches');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('block-lab-preview-progress-v4'))['scene-courtyard-home']),2,'Do not erase saved preview progress');
  await page.evaluate(()=>chooseModel('scene-courtyard-home'));assert.equal(await page.evaluate(()=>current),80,'Keep production progress');
  await context.setOffline(true);await page.reload();await page.evaluate(()=>chooseModel('scene-courtyard-home'));assert.equal(await page.evaluate(()=>current),80,'Production still works offline');
  console.log('PASS: preview/benchmark 404, cached preview redirected, preview SW unregistered and its caches removed, production progress/cache/offline use preserved');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));await fs.rm(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exit(1)});
