const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.argv[2]||'http://127.0.0.1:8765/block-play/';
 await page.goto(base);await page.waitForFunction(()=>window.blockPlayPWA?.getState().offlineReady);
 assert.equal(await page.locator('[data-filter="complete"]').count(),1,'Complete scenes need a separate column');
 await page.locator('[data-filter="complete"]').click();
 assert.equal(await page.locator('.model-card').count(),3);
 assert.equal(await page.locator('#big-categories').isVisible(),false);
 const scenes=await page.evaluate(()=>SCENE_MODELS.map(m=>({id:m.id,name:m.name,steps:m.steps.length})));
 for(const scene of scenes){
  await page.locator('[data-model="'+scene.id+'"]').click();
  assert.ok(await page.locator('#step-content').textContent().then(t=>t.includes('门框')));
  assert.ok(await page.locator('#step-content').textContent().then(t=>t.includes('滑梯')));
  await page.locator('#next').click();assert.equal(await page.locator('#zoom-dialog').evaluate(x=>x.open),true);
  await page.locator('#zoom-next').click();assert.equal(await page.evaluate(()=>current),2);
  await page.locator('#zoom-close').click();
  const saved=await page.evaluate(()=>localStorage.getItem('block-lab-progress-v4'));
  for(const fullscreen of [false,true]){
   if(fullscreen)await page.locator('#stage').click();
   const prefix=fullscreen?'zoom-':'',stage='#'+prefix+'stage',sections='#'+prefix+'scene-sections';
   await page.locator('#'+prefix+'finished-preview').click();
   for(const zone of ['first','second','roof','yard','all']){
    await page.locator(sections+' [data-section="'+zone+'"]').click();
    assert.equal(await page.evaluate(()=>preview),true,'Selecting a room must keep completed preview active');
    assert.equal(await page.evaluate(()=>current),2);
    const expected=await page.evaluate(zone=>allPieces(model).filter(p=>zone==='all'||p.zone===zone).length,zone);
    assert.equal(await page.locator(stage+' [data-part]').count(),expected,'Preview must include unbuilt furniture in each region');
    assert.doesNotMatch(await page.locator(stage).textContent(),/还没搭到/);
    assert.equal(await page.locator(sections+' [data-section="'+zone+'"]').getAttribute('aria-pressed'),'true');
    if(['first','second'].includes(zone)){
     assert.ok(await page.locator(stage+' [data-role="bed"]').count());
     const furniture='#'+prefix+'room-furniture';
     assert.equal(await page.locator(furniture).isVisible(),true,'Room views must explain the furniture');
     assert.match(await page.locator(furniture+' summary').textContent(),/床.*书桌/);
     if(fullscreen&&!await page.locator(furniture).evaluate(el=>el.open))await page.locator(furniture+' summary').click();
     assert.equal(await page.locator(furniture+' [data-furniture="bed"] [data-part]').count(),await page.locator(stage+' [data-role="bed"]').count());
     assert.equal(await page.locator(furniture+' [data-furniture="desk"] [data-role="book"]').count(),1);
     const drawnHeight=await page.locator(furniture+' [data-furniture="bed"] svg').evaluate(el=>{const box=el.getBoundingClientRect(),v=el.viewBox.baseVal;return el.querySelector('g').getBBox().height*Math.min(box.width/v.width,box.height/v.height);});
     assert.ok(drawnHeight>=65,'Furniture close-ups should crop excess blank space');
     assert.match(await page.locator(furniture+' [data-furniture="desk"]').textContent(),/红色书本/);
    }

   }
   await page.locator('#'+prefix+'finished-preview').click();
   assert.equal(await page.locator(stage+' [data-part]').count(),2,'Returning to the build must restore current progress');
   if(fullscreen)await page.locator('#zoom-close').click();
  }
  await page.locator('#scene-sections [data-section="second"]').click();
  assert.match(await page.locator('#stage').textContent(),/还没搭到/);
  await page.locator('#finished-preview').click();await page.locator('#scene-sections [data-section="first"]').click();
  assert.ok(await page.locator('#stage [data-role="bed"]').count());
  await page.locator('#finished-preview').click();
  assert.equal(await page.locator('#scene-sections [data-section="second"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#stage').textContent(),/还没搭到/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('block-lab-progress-v4')),saved);
  const phases=await page.evaluate(()=>model.steps.map((s,i)=>i===model.steps.length-1||s.phase!==model.steps[i+1].phase?i+1:0).filter(Boolean));
  for(const n of phases){await page.evaluate(n=>move(n),n);assert.ok(await page.locator('#stage svg').count());}
  assert.equal(await page.locator('#stage [data-part="door"]').count()>0,true);
  assert.equal(await page.locator('#stage [data-part="slide"]').count(),1);
  assert.equal(await page.locator('#stage [data-part]').first().getAttribute('data-part'),'baseplate','Draw the foundation before the yard so it cannot cover furniture');
  await page.locator('#scene-sections [data-section="first"]').click();
  assert.ok(await page.locator('#stage [data-role="bed"]').count());
  assert.ok(await page.locator('#stage [data-role="table"]').count());
  assert.equal(await page.locator('#stage [data-zone="second"]').count(),0);
  await page.locator('#stage').click();
  await page.locator('#zoom-scene-sections [data-section="second"]').click();
  assert.equal(await page.locator('#zoom-stage [data-zone="first"]').count(),0);
  assert.ok(await page.locator('#zoom-stage [data-zone="second"]').count());
  await page.locator('#zoom-finished-preview').click();
  assert.equal(await page.locator('#zoom-stage [data-part]').count(),scene.steps);
  assert.equal(await page.evaluate(()=>current),scene.steps);
  await page.locator('#zoom-finished-preview').click();
  assert.equal(await page.locator('#zoom-stage [data-zone="first"]').count(),0);
  await page.locator('#zoom-close').click();
  await page.locator('#scene-sections [data-section="yard"]').click();
  assert.ok(await page.locator('#stage [data-role="tree"]').count());
  assert.ok(await page.locator('#stage [data-role="slide"]').count());
  assert.equal(await page.locator('#stage [data-role="bed"]').count(),0);
  await page.locator('#scene-sections [data-section="all"]').click();
  await page.locator('#layer-view').click();assert.match(await page.locator('#stage').textContent(),/从上往下看/);
  await page.locator('#layer-view').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 await page.reload();await page.locator('[data-filter="complete"]').click();await page.locator('[data-model="'+scenes[2].id+'"]').click();
 assert.equal(await page.evaluate(()=>current),scenes[2].steps);
 await context.setOffline(true);await page.reload();
 assert.equal(await page.evaluate(()=>SCENE_MODELS.length),3);
 await page.locator('[data-filter="complete"]').click();await page.locator('[data-model="'+scenes[0].id+'"]').click();
 await page.locator('#scene-sections [data-section="first"]').click();assert.ok(await page.locator('#stage [data-role="bed"]').count());
 await page.locator('#restart').click();await page.locator('#finished-preview').click();
 await page.locator('#scene-sections [data-section="second"]').click();
 assert.equal(await page.evaluate(()=>current),0);assert.ok(await page.locator('#stage [data-role="bed"]').count());
 assert.doesNotMatch(await page.locator('#stage').textContent(),/还没搭到/);
 await context.setOffline(false);
 const tablet=await browser.newContext({viewport:{width:1024,height:1400},isMobile:true,hasTouch:true});const ipad=await tablet.newPage();await ipad.goto(base);
 await ipad.locator('[data-filter="complete"]').click();await ipad.locator('[data-model="'+scenes[0].id+'"]').click();await ipad.locator('#finished-preview').click();
 await ipad.locator('#scene-sections [data-section="second"]').click();assert.ok(await ipad.locator('#stage [data-role="bed"]').count());
 assert.equal(await ipad.evaluate(()=>current),0);
 assert.ok((await ipad.locator('#stage svg').boundingBox()).height>=500);
 assert.equal(await ipad.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await ipad.locator('#stage-view').screenshot({path:'/tmp/block-scenes-ipad.png'});
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: complete catalog, 3 scenes, new parts, all phases, floor/yard views, fullscreen preview, saved progress, offline use and iPad layout');
})().catch(e=>{console.error(e);process.exit(1)});
