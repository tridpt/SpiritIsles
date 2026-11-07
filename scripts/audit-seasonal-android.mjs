import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import {E,festivalGame} from '../tests/seasonal-fixtures.mjs';
import {C,campaignGame} from '../tests/campaign-fixtures.mjs';
import {project} from '../web/js/island-layout.js';

const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const adb='C:/Users/ASUS/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const serial='emulator-5580',pkg='vn.spiritisles.game',apk='dist/DaoLinhThu-'+version+'.apk';
const readAdb=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true,timeout:60000,stdio:['ignore','pipe','pipe']}).trim();
const owned=()=>assert.equal(readAdb('emu','avd','name').split(/\r?\n/)[0].trim(),'SpiritIslesAudit110');
const mutate=(...args)=>{owned();return readAdb(...args);};
const stable=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='lastSeen'));
const errors=[];
let browser,page,completed=false,recoveries=0;
const log=s=>{console.log(s);fs.appendFileSync('dist/NATIVE-SEASONAL-PROGRESS-'+version+'.log',new Date().toISOString()+' '+s+'\n');};
async function disconnect(){const b=browser;browser=null;if(b)await Promise.race([b.close().catch(()=>{}),delay(1500)]);}
async function focus(){
  for(let i=0;i<30;i++){
    const current=readAdb('shell','dumpsys','window','displays').split('\n').find(l=>l.includes('mCurrentFocus='))||'';
    if(current.includes(pkg))return;
    if(current.includes('Application Not Responding: com.android.systemui')){
      mutate('shell','uiautomator','dump','/sdcard/seasonal-audit.xml');
      const xml=readAdb('shell','cat','/sdcard/seasonal-audit.xml');assert.match(xml,/System UI (?:isn't|is not) responding/);
      const close=xml.match(/<node[^>]*resource-id="android:id\/aerr_close"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);assert.ok(close);
      mutate('shell','input','tap',String(Math.floor((+close[1]+ +close[3])/2)),String(Math.floor((+close[2]+ +close[4])/2)));recoveries++;
      mutate('shell','am','start','-n',pkg+'/.MainActivity');
    }
    await delay(500);
  }
  assert.fail('Game must hold native focus');
}
async function foreground(){
  mutate('shell','am','start','-n',pkg+'/.MainActivity');await focus();
  for(let i=0;i<35;i++)try{
    const pid=readAdb('shell','pidof',pkg);mutate('forward','tcp:9228','localabstract:webview_devtools_remote_'+pid);
    browser=await chromium.connectOverCDP('http://127.0.0.1:9228',{noDefaults:true,timeout:2000});
    page=browser.contexts()[0].pages().find(p=>p.url()==='https://spirit.isles/index.html');assert.ok(page);
    await page.waitForSelector('.game-hud',{timeout:6000});await page.evaluate(()=>document.fonts.ready);
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});return;
  }catch{await disconnect();await delay(400);}
  assert.fail('Game WebView did not connect');
}
async function restart(){await disconnect();mutate('shell','am','force-stop',pkg);await foreground();}
async function touchPoint(x,y){
  await focus();owned();const cdp=await page.context().newCDPSession(page);
  try{
    owned();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    owned();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }finally{await cdp.detach();}
}
async function tap(locator){
  await expect(locator).toBeVisible();let point;
  for(let i=0;i<8;i++){
    owned();point=await locator.evaluate(e=>{
      e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
      const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
      return {x,y,clear:e.contains(document.elementFromPoint(x,y))};
    });
    if(point.clear)break;await delay(100);
  }
  assert.ok(point.clear,'Native touch target must be unobstructed');await touchPoint(point.x,point.y);
}
const close=()=>tap(page.getByRole('button',{name:'Đóng',exact:true}));
const menu=async id=>{await tap(page.getByRole('button',{name:'Mở menu đảo',exact:true}));await tap(page.locator('.island-menu [data-page="'+id+'"]'));};
const tab=id=>tap(page.locator('.festival-tabs [data-id="'+id+'"]'));
const save=async()=>JSON.parse(await page.evaluate(()=>AndroidApp.readSave())).state;
async function importFixture(s){
  E.validateSave(E.serialize(s));
  if(await page.locator('#game-dialog[open]').isVisible())await close();
  await tap(page.getByRole('button',{name:'Mở menu đảo',exact:true}));await tap(page.getByRole('button',{name:'Cài đặt',exact:true}));
  owned();await page.evaluate(raw=>{
    const input=document.querySelector('#import-file'),transfer=new DataTransfer();
    transfer.items.add(new File([raw],'seasonal-audit.json',{type:'application/json'}));
    input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  },E.serialize(s));
  await tap(page.locator('[data-action="confirm-import"]'));await page.waitForSelector('.game-hud');
}
async function screenshot(name){
  owned();await page.screenshot();await delay(500);let frame,colors=0;
  for(let attempt=0;attempt<10;attempt++){
    await focus();owned();frame=execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{windowsHide:true,timeout:30000});
    colors=await page.evaluate(async data=>{
      const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=32;canvas.height=64;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,32,64);const p=ctx.getImageData(0,0,32,64).data,seen=new Set();
      for(let y=6;y<57;y++)for(let x=1;x<31;x++){const i=(y*32+x)*4;seen.add((p[i]>>4)*256+(p[i+1]>>4)*16+(p[i+2]>>4));}
      return seen.size;
    },frame.toString('base64'));
    if(colors>12)break;await delay(250);
  }
  assert.ok(colors>12,'Native frame must be painted');
  fs.writeFileSync('dist/screenshots/festival-native-'+name+'-'+version+'.png',frame);
}
try{
  assert.ok(fs.existsSync(apk));owned();assert.equal(readAdb('shell','getprop','sys.boot_completed'),'1');
  mutate('shell','am','force-stop',pkg);mutate('install','-r','-d','dist/DaoLinhThu-1.27.0.apk');
  mutate('shell','svc','wifi','disable');mutate('shell','svc','data','disable');await foreground();
  if(await page.locator('#game-dialog[open] .offline-welcome').isVisible())await close();
  fs.writeFileSync('dist/seasonal-owned-original-'+version+'.json',JSON.stringify(await save(),null,2)+'\n');
  const legacy=campaignGame();legacy.stats.hatches=88;legacy.stats.feeds=12;
  assert.ok(!C.startCampaign(legacy,'forest-1').error);assert.ok(!E.chooseRoute(legacy,0,()=>.5).error);delete legacy.seasonal;
  await importFixture(legacy);const before=await save();assert.ok(before.expedition?.battle);assert.equal(before.seasonal,undefined);
  fs.writeFileSync('dist/seasonal-native-before-upgrade-'+version+'.json',JSON.stringify(before,null,2)+'\n');
  await disconnect();mutate('shell','am','force-stop',pkg);mutate('install','-r',apk);await foreground();
  const after=await save(),oldFields=structuredClone(after);delete oldFields.seasonal;
  assert.deepEqual(stable(oldFields),stable(before));assert.equal(after.seasonal.baseline.hatches,88);assert.equal(after.seasonal.currency,0);
  assert.equal(after.seasonal.claimedMissions.length,0);assert.ok(Math.abs(after.seasonal.started-Date.now())<60000);
  await menu('seasonal');await expect(page.locator('[data-festival-day]')).toHaveText('Ngày 1/30');
  assert.deepEqual((await save()).expedition,before.expedition);
  log('Offline 1.27 → 1.28 upgrade preserves pets, resources and a live campaign battle; the new season begins at day one.');

  await importFixture(festivalGame({now:Date.now()-1000}));await menu('seasonal');
  await tap(page.locator('[data-action="seasonal-week"][data-id="0"]'));
  await tap(page.locator('[data-seasonal-mission="0:hatch"] button'));
  for(const id of ['story','tower','memories'])await tap(page.locator('[data-seasonal-challenge="'+id+'"] button'));
  assert.equal((await save()).seasonal.currency,410);await screenshot('journey');
  await tab('shop');const beforeBuy=await save();await tap(page.locator('[data-seasonal-shop="lantern"] button'));
  await expect(page.locator('.festival-reward-reveal')).toBeVisible();
  const size=await page.getByRole('button',{name:'Đóng',exact:true}).evaluate(e=>{const r=e.getBoundingClientRect();return [r.width,r.height];});assert.ok(size.every(n=>n>=44));
  const bought=await save();assert.equal(bought.seasonal.currency,50);assert.equal(bought.seasonal.earned,410);assert.deepEqual(bought.resources,beforeBuy.resources);
  await screenshot('arch-unlock');await tap(page.locator('#game-dialog [data-action="seasonal-place"]'));
  await expect(page.locator('.editor-catalog-item[data-id="starlitlantern"]')).toBeEnabled();await tap(page.locator('[data-action="island-edit-choose"][data-id="starlitlantern"]'));
  const box=await page.locator('.editor-world').boundingBox(),grid=project(6.5,5);
  await touchPoint(box.x+grid.x*box.width/1000,box.y+grid.y*box.width/1000);
  await expect(page.locator('[data-editor-saved]')).toContainText('chưa lưu');await tap(page.locator('[data-action="island-edit-save"]'));
  const placed=await save();assert.deepEqual(placed.islandLayout.placed.at(-1),{id:'i1',type:'starlitlantern',x:6,y:5,rotation:0});
  await screenshot('island');await restart();assert.deepEqual((await save()).islandLayout,placed.islandLayout);assert.deepEqual((await save()).seasonal,placed.seasonal);
  await menu('seasonal');await tab('shop');await expect(page.locator('[data-seasonal-shop="lantern"] button')).toBeDisabled();
  await tab('prizes');const beforePrizes=await save();await tap(page.locator('[data-action="seasonal-prize"][data-id="dawn"]'));await close();
  assert.equal((await save()).resources.tickets,beforePrizes.resources.tickets+2);
  await tap(page.locator('[data-action="seasonal-prize"][data-id="moon"]'));await close();
  assert.equal((await save()).resources.crystals,beforePrizes.resources.crystals+160);
  await expect(page.locator('[data-action="seasonal-prize"][data-id="moon"]')).toBeDisabled();await screenshot('milestones');
  log('Native touches claim real stars, buy the arch once, place it in the editor and claim milestones; all persist across force-stop.');

  await importFixture(festivalGame({now:Date.now()-1000,day:31}));await menu('seasonal');
  await expect(page.locator('.festival-season-ended')).toBeVisible();const ended=await save(),expected=structuredClone(ended);
  const result=E.startNextSeason(expected);assert.ok(!result.error);
  await tap(page.locator('[data-action="seasonal-next"]'));await expect(page.locator('.festival-reward-reveal')).toContainText('+2440 sao lễ hội');await close();
  const next=await save();assert.equal(next.seasonal.id,'starlit-festival-2');assert.equal(next.seasonal.currency,2440);assert.equal(next.seasonal.carried,2440);assert.equal(next.seasonal.earned,0);
  assert.equal(next.seasonal.baseline.hatches,28);assert.equal(next.seasonal.progress.hatches,0);assert.deepEqual(next.resources,expected.resources);assert.equal(next.shiny.fragments,15);
  assert.deepEqual(next.seasonal.unlockedDecorations,['starlitlantern']);await expect(page.locator('[data-festival-day]')).toHaveText('Ngày 1/30');
  await tab('shop');await tap(page.locator('[data-seasonal-shop="food"] button'));const spent=await save();
  assert.equal(spent.seasonal.currency,2400);assert.equal(spent.seasonal.earned,0);assert.equal(spent.resources.food,next.resources.food+120);
  await restart();const persisted=await save();assert.deepEqual(persisted.seasonal,spent.seasonal);assert.deepEqual(persisted.resources,spent.resources);assert.deepEqual(persisted.shiny,spent.shiny);
  await menu('seasonal');await screenshot('new-season');
  log('An ended season banks all 32 missions, three challenges and five milestones; carried stars, Shiny fragments and the permanent arch survive a restart offline.');

  const installed=readAdb('shell','pm','path',pkg).split('\n')[0].replace('package:','').trim();
  const hash=crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');
  assert.equal(readAdb('shell','sha256sum',installed).split(' ')[0],hash);
  assert.match(readAdb('shell','dumpsys','connectivity'),/Active default network: none/);assert.deepEqual(errors,[]);
  fs.writeFileSync('dist/ANDROID-SEASONAL-'+version+'.json',JSON.stringify({
    version,versionCode:35,androidApi:Number(readAdb('shell','getprop','ro.build.version.sdk')),emulator:'SpiritIslesAudit110',
    upgrade:'1.27.0 → 1.28.0',saveMigratedAndLiveBattlePreserved:true,nativeTouch:true,nativeFramesPainted:true,
    missionsAndChallengesPayOnce:true,spendingKeepsEarnedMilestones:true,archUnlockAndRealPlacementPersist:true,
    ownedArchCannotBeRepurchased:true,milestoneResourcesPayOnce:true,nextSeasonBanksAllReadyRewards:true,
    carriedCurrencyAndPermanentArchPersist:true,shinyFragmentsPersist:true,forceStopPreservesSnapshot:true,
    offline:true,installedApkSha256:hash,consoleErrors:errors,systemUiAnrRecoveries:recoveries,
    physicalPhoneTested:false,completedAt:new Date().toISOString()
  },null,2)+'\n');completed=true;log('Seasonal Android audit passed.');
}finally{await disconnect();if(completed)try{mutate('emu','kill');}catch{}}
