const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.argv[2]||'http://127.0.0.1:8765/block-play/';
 await page.goto(base);
 await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady,{timeout:20000});
 assert.equal(await page.evaluate(()=>MODELS.length),64);
 assert.equal(await page.evaluate(()=>LABS.length),12);
 assert.equal(await page.locator('.model-card').count(),8);
 await page.locator('#more-models').click();assert.equal(await page.locator('.model-card').count(),16);
 await page.locator('#model-search').fill('皇家四塔城堡');
 await page.locator('[data-model="royalfort"]').click();
 await page.locator('#next').click();if(await page.locator('#zoom-dialog').evaluate(el=>el.open))await page.locator('#zoom-close').click();
 assert.equal(await page.evaluate(()=>current),1);
 await page.locator('#layer-view').click();assert.match(await page.locator('#stage').textContent(),/从上往下看/);
 await page.locator('#stage').click();assert.equal(await page.locator('#zoom-dialog').evaluate(el=>el.open),true);
 await page.locator('#zoom-stage').click();assert.equal(await page.evaluate(()=>current),2);
 await page.locator('#zoom-close').click();
 await page.reload();await page.locator('#model-search').fill('皇家四塔城堡');await page.locator('[data-model="royalfort"]').click();
 assert.equal(await page.evaluate(()=>current),2);
 await page.locator('#model-search').fill('');await page.locator('[data-filter="big"]').click();
 for (const category of ['animals','plants','buildings','vehicles','characters','scenes']) {
  await page.locator('[data-category="'+category+'"]').click();
  assert.ok(await page.locator('.model-card').count()>0,'empty category '+category);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 await page.locator('[data-category="new"]').click();while(await page.locator('#more-models').isVisible())await page.locator('#more-models').click();
 const additions=await page.evaluate(()=>MODELS.filter(m=>m.reference).map(m=>({id:m.id,steps:m.steps.length})));
 await page.evaluate(()=>{sound=false;soundChoice=true;});
 for (const m of additions) {
  await page.locator('[data-model="'+m.id+'"]').click();
  await page.locator('#restart').click();
  assert.ok(await page.locator('#step-content a[href*="xiaohongshu"]').count());
  for(let i=1;i<=m.steps;i++) {
   await page.locator('#next').click();if(await page.locator('#zoom-dialog').evaluate(el=>el.open))await page.locator('#zoom-close').click();
   assert.equal(await page.evaluate(()=>current),i);
   assert.ok(await page.locator('#stage svg').count());
   if(await page.evaluate(()=>model.steps[current-1].pieces[0].kind==='curve')) {
    const direction=await page.evaluate(()=>model.steps[current-1].pieces[0].flip?'右':'左');
    assert.match(await page.locator('.kid-line').textContent(),new RegExp('高端朝'+direction));
    await page.locator('#view').click();
    assert.match(await page.locator('.kid-line').textContent(),new RegExp('高端朝'+(direction==='右'?'左':'右')));
    await page.locator('#view').click();
   }
  }
  await page.locator('#layer-view').click();assert.match(await page.locator('#stage').textContent(),/从上往下看/);
 }
 await page.evaluate(()=>{model=MODELS.find(m=>m.id==='ref-bus');current=model.steps.length;layerOnly=false;render();});
 assert.equal(await page.locator('#stage [data-part="window"]').count(),2);
 assert.equal(await page.locator('#stage [data-part="wheelbase"]').count(),1);
 assert.equal(await page.locator('#stage [data-part="curve"]').count(),2);
 for (let i=0;i<12;i++) {
  await page.locator('[data-lab-index="'+i+'"]').click();
  assert.equal(await page.locator('.lab-story').count(),1);
  const scenes=await page.evaluate(()=>LAB_STORIES[LABS[activeLab].id].scenes);
  await page.evaluate(()=>{window.speechSynthesis.speak=u=>{window.lastStoryNarration=u.text;};});
  await page.locator('[data-lab-listen]').click();
  assert.ok((await page.evaluate(()=>window.lastStoryNarration)).includes(scenes[0].text));
  assert.equal(await page.locator('[data-story-prev]').isDisabled(),true);
  for(let scene=0;scene<5;scene++) {
   assert.match(await page.locator('.story-progress').textContent(),new RegExp((scene+1)+' / 5'));
   assert.ok((await page.locator('.story-task').textContent()).length>5);
   assert.equal(await page.locator('.story-scene > p').first().textContent(),scenes[scene].text);
   assert.equal(await page.evaluate(()=>labMode),scenes[scene].mode);
   if(scene<4)await page.locator('[data-story-next]').click();
  }
  assert.equal(await page.locator('[data-story-next]').isDisabled(),true);
  await page.locator('[data-story-prev]').click();
  assert.match(await page.locator('.story-progress').textContent(),/4 \/ 5/);
  await page.locator('[data-lab-mode="0"]').click();
  assert.match(await page.locator('.story-progress').textContent(),/4 \/ 5/);
  await page.locator('[data-answer="'+await page.evaluate(()=>LABS[activeLab].correct)+'"]').click();
  assert.match(await page.locator('#quiz-feedback').textContent(),/你发现了/);
  if(await page.locator('.lab-story [data-practice]').count()) {
   await page.locator('.lab-story [data-practice]').click();
   assert.equal(await page.evaluate(()=>model.id),'ref-house');
  }
  await page.locator('#lab-content > .lab-copy > [data-practice]').click();
  assert.ok(await page.locator('#stage svg').count());
 }
 const geometry=await page.evaluate(()=>MODELS.reduce((n,m)=>n+allPieces(m).length,0));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await context.setOffline(true);await page.reload();
 assert.equal(await page.evaluate(()=>MODELS.length),64);
 assert.equal(await page.locator('.lab-story').count(),1);
 assert.equal(await page.locator('[data-lab-index]').count(),12);
 const offlineStep=await page.evaluate(()=>current);await page.locator('#restart').click();await page.locator('#next').click();if(await page.locator('#zoom-dialog').evaluate(el=>el.open))await page.locator('#zoom-close').click();assert.equal(await page.evaluate(()=>current),1);
 const swScope=await page.evaluate(async()=>(await navigator.serviceWorker.getRegistration()).scope);
 assert.equal(swScope,base);
 assert.deepEqual(errors,[]);
 await page.screenshot({path:'/tmp/block-play-mobile.png',fullPage:true});
 console.log('PASS: 64 models, 12 story labs, 20 reference tutorials, 6 categories, '+geometry+' total pieces, search/pagination, steps/layer/fullscreen, saved progress, mobile layout, offline reload; scope='+swScope);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
