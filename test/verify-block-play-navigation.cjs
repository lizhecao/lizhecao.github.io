const {chromium}=require('playwright'),assert=require('node:assert/strict');
const url=process.argv[2]||'http://127.0.0.1:8765/block-play/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);
 assert.equal(await page.locator('#app-tabs a').count(),4,'Four page navigation tabs');
 assert.equal(await page.locator('[data-page]:visible').count(),1,'Only one page at a time');
 await page.locator('#model-search').fill('小狗');await page.locator('[data-model="play-puppy"]').click();await page.waitForURL('**/#/build/play-puppy');
 assert.equal(await page.locator('#choose').isVisible(),false);assert.equal(await page.evaluate(()=>current),0);
 await page.locator('#next').click();assert.equal(await page.evaluate(()=>current),1);
 await page.locator('#stage').click();for(let i=0;i<3;i++)await page.locator('#zoom-stage').tap();assert.equal(await page.evaluate(()=>current),1);
 await page.locator('#zoom-close').click();await page.locator('#route-back').click();await page.waitForURL('**/#/models');assert.equal(await page.locator('#model-search').inputValue(),'小狗');
 await page.goForward();await page.waitForURL('**/#/build/play-puppy');assert.equal(await page.evaluate(()=>current),1);
 await page.locator('#lesson-science [data-lab]').click();await page.waitForURL('**/#/lab/*');await page.locator('[data-story-next]').click();const story=await page.locator('.story-progress').textContent();
 await page.locator('[data-practice]').last().click();await page.waitForURL('**/#/build/*');await page.locator('#route-back').click();assert.equal(await page.locator('.story-progress').textContent(),story);
 await page.goto(url+'#/scenes');assert.equal(await page.locator('[data-model]').count(),6);
 await page.evaluate(()=>{progress['scene-courtyard-home']=80;localStorage.setItem('block-lab-progress-v4',JSON.stringify(progress));});
 await page.locator('[data-model="scene-courtyard-home"]').click();assert.equal(await page.evaluate(()=>current),80);
 const saved=await page.evaluate(()=>localStorage.getItem('block-lab-progress-v4'));
 await page.locator('#finished-preview').click();await page.waitForURL('**/#/preview/scene-courtyard-home');await page.waitForSelector('#stage-view canvas');
 assert.equal(await page.locator('[data-scene-toggle]:visible').count(),0,'No diagram toggle in finished 3D');
 await page.locator('#scene-sections [data-section="second"]').click();assert.ok(await page.locator('button[data-object="second-bed"]').count());await page.locator('#route-back').click();
 assert.equal(await page.evaluate(()=>current),80);assert.equal(await page.evaluate(()=>preview),false);assert.equal(await page.evaluate(()=>localStorage.getItem('block-lab-progress-v4')),saved);
 await page.goto(url+'#/lab');assert.equal(await page.locator('[data-open-lab]').count(),12);await page.locator('[data-open-lab="locking"]').click();await page.reload();assert.match(await page.locator('#lab-content').textContent(),/小猪|大灰狼/);
 await page.goto(url+'#/missions');assert.equal(await page.locator('[data-open-mission]').count(),6);await page.locator('[data-open-mission]').first().click();await page.waitForURL('**/#/missions/*');assert.equal(await page.locator('#mission-detail').isVisible(),true);
 await page.goto(url+'#learning');await page.waitForURL('**/#/lab');await page.goto(url+'#/build/unknown');await page.waitForURL('**/#/models');assert.match(await page.locator('#route-notice').textContent(),/找到/);
 await page.locator('[data-filter="big"]').click();await page.locator('[data-category="all"]').click();await page.locator('#more-models').click();
 const card=page.locator('#models [data-model]').nth(10);await card.scrollIntoViewIfNeeded();const position=await page.evaluate(()=>scrollY);const count=await page.locator('#models [data-model]').count();await card.click();await page.locator('#route-back').click();await page.waitForFunction(y=>Math.abs(scrollY-y)<8,position);assert.equal(await page.locator('#models [data-model]').count(),count);assert.equal(await page.evaluate(()=>document.activeElement.closest('[hidden]')),null);
 for(const id of await page.evaluate(()=>PLAY_MODELS.map(m=>m.id))){
  await page.evaluate(id=>window.blockPlayNav.go('build/'+id),id);const n=await page.evaluate(()=>current);await page.locator('#next').click();assert.equal(await page.evaluate(()=>current),n+1);
  await page.locator('#finished-preview').click();assert.equal(await page.locator('#stage [data-part]').count(),await page.evaluate(()=>model.steps.length));await page.locator('#route-back').click();assert.equal(await page.evaluate(()=>current),n+1);
 }
 for(const viewport of [{width:390,height:844},{width:768,height:1024},{width:1024,height:768},{width:1194,height:834}]){
  await page.setViewportSize(viewport);await page.goto(url+'#/build/play-bunny');const next=await page.locator('#next').boundingBox();assert.ok(next.height>=44);assert.ok(next.y+next.height<=viewport.height,'Step buttons visible');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 await context.setOffline(true);await page.goto(url+'#/lab/locking');await page.reload();assert.ok(await page.locator('.lab-story').isVisible());
 await page.goto(url+'#/preview/scene-play-school-v2');await page.reload();await page.waitForSelector('canvas');assert.equal(await page.evaluate(()=>MODELS.length),76);
 assert.deepEqual(errors,[]);console.log('PASS: four tabs, direct pages, search/history/story restoration, no tap advance, old80, direct 3D, deep links/legacy/invalid routes, viewport controls and offline first routes');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
