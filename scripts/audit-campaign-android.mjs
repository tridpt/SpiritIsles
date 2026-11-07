import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import {autoRoute,autoOrder} from '../web/js/auto-play.js';
import {combatScene} from '../web/js/combat-stage.js';
import {E,C,campaignGame,unlockTo,campaignNow} from '../tests/campaign-fixtures.mjs';
import {CAMPAIGN_CHAPTERS} from '../web/js/campaign-data.js';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const adb='C:/Users/ASUS/AppData/Local/Android/Sdk/platform-tools/adb.exe',serial='emulator-5580',pkg='vn.spiritisles.game',apk=`dist/DaoLinhThu-${version}.apk`;
const readAdb=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true,timeout:60000,stdio:['ignore','pipe','pipe']}).trim();
const owned=()=>assert.equal(readAdb('emu','avd','name').split(/\r?\n/)[0].trim(),'SpiritIslesAudit110');
const mutate=(...args)=>{owned();return readAdb(...args);};
const stable=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='lastSeen'));
const log=s=>{fs.appendFileSync(`dist/NATIVE-CAMPAIGN-PROGRESS-${version}.log`,`${new Date().toISOString()} ${s}\n`);console.log(s);};
let browser,page,completed=false,recoveries=0,clockActive=false;const errors=[];
async function disconnect(){const b=browser;browser=null;if(b)await Promise.race([b.close().catch(()=>{}),delay(1500)]);}
async function connect() {
  for(let i=0;i<35;i++)try {
    const pid=readAdb('shell','pidof',pkg);mutate('forward','tcp:9228',`localabstract:webview_devtools_remote_${pid}`);
    browser=await chromium.connectOverCDP('http://127.0.0.1:9228',{noDefaults:true,timeout:2000});
    page=browser.contexts()[0].pages().find(p=>p.url()==='https://spirit.isles/index.html');
    assert.ok(page);await page.waitForSelector('.game-hud',{timeout:6000});await page.evaluate(()=>document.fonts.ready);
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});return;
  }catch{await disconnect();await delay(400);}
  assert.fail('Game WebView did not connect');
}
async function nativeFocus() {
  for(let i=0;i<30;i++) {
    const focus=readAdb('shell','dumpsys','window','displays').split('\n').find(l=>l.includes('mCurrentFocus='))||'';
    if(focus.includes(pkg))return;
    if(focus.includes('Application Not Responding: com.android.systemui')) {
      mutate('shell','uiautomator','dump','/sdcard/graphics-audit.xml');
      const xml=readAdb('shell','cat','/sdcard/graphics-audit.xml');assert.match(xml,/System UI (?:isn't|is not) responding/);
      const close=xml.match(/<node[^>]*resource-id="android:id\/aerr_close"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);assert.ok(close);
      mutate('shell','input','tap',String(Math.floor((+close[1]+ +close[3])/2)),String(Math.floor((+close[2]+ +close[4])/2)));recoveries++;
      mutate('shell','am','start','-n',`${pkg}/.MainActivity`);
    }
    await delay(500);
  }
  assert.fail('The game must hold native focus before touch or screenshots');
}
async function foreground(){mutate('shell','am','start','-n',`${pkg}/.MainActivity`);await nativeFocus();await connect();}
async function restart(){await disconnect();mutate('shell','am','force-stop',pkg);await foreground();}
async function tap(locator) {
  await nativeFocus();owned();await expect(locator).toBeVisible();
  let r;
  for(let i=0;i<8;i++) {
    owned();r=await locator.evaluate(e=>{e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return {x,y,hit:e.contains(hit),obstruction:hit?.outerHTML.slice(0,180),name:e.getAttribute('aria-label')||e.dataset.action||e.dataset.duel};});
    if(r.hit)break;await delay(100);
  }
  assert.ok(r.hit,`Touch target must be unobstructed: ${JSON.stringify(r)}`);
  const cdp=await page.context().newCDPSession(page);owned();
  try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x,y:r.y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}finally{await cdp.detach();}
}
async function menu(pageId){await tap(page.getByRole('button',{name:'Mở menu đảo',exact:true}));await tap(page.locator(`.island-menu [data-page="${pageId}"]`));}
const save=async()=>JSON.parse(await page.evaluate(()=>AndroidApp.readSave())).state;
async function screenshot(name) {
  // Wait for the native WebView compositor as well as the DOM update.
  owned();if(clockActive)await page.clock.runFor(40);
  await page.screenshot();
  await delay(500);
  let frame,colors=0;
  for(let attempt=0;attempt<10;attempt++) {
    await nativeFocus();owned();frame=execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{windowsHide:true,timeout:30000});
    colors=await page.evaluate(async data=>{
      const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=32;canvas.height=64;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,32,64);const pixels=ctx.getImageData(0,0,32,64).data,seen=new Set();
      for(let y=6;y<57;y++)for(let x=1;x<31;x++){const i=(y*32+x)*4;seen.add((pixels[i]>>4)*256+(pixels[i+1]>>4)*16+(pixels[i+2]>>4));}
      return seen.size;
    },frame.toString('base64'));
    if(colors>12)break;await delay(250);
  }
  assert.ok(colors>12,`Native ${name} frame must have painted beyond the blank WebView background`);
  fs.writeFileSync(`dist/screenshots/campaign-native-${name}-${version}.png`,frame);
}
async function validArt(selector){
  const result=await page.locator(selector).evaluateAll(es=>es.map(e=>({invalid:!!new DOMParser().parseFromString(e.outerHTML,'image/svg+xml').querySelector('parsererror'),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
  assert.ok(result.length&&result.every(r=>!r.invalid&&r.width>0&&r.height>0));return result;
}
async function importFixture(s){
  E.validateSave(E.serialize(s));
  if(await page.locator('#combat-stage[open]').isVisible())await tap(page.locator('#combat-stage [data-duel="close"]').first());
  await tap(page.getByRole('button',{name:'Mở menu đảo',exact:true}));await tap(page.getByRole('button',{name:'Cài đặt',exact:true}));
  owned();await page.evaluate(raw=>{const input=document.querySelector('#import-file'),transfer=new DataTransfer();transfer.items.add(new File([raw],'campaign-audit.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));},E.serialize(s));
  await tap(page.locator('[data-action="confirm-import"]'));await page.waitForSelector('.game-hud');
}
async function controlledTime(){owned();await page.clock.install();owned();await page.clock.pauseAt(new Date(Date.now()+1000));clockActive=true;owned();await page.reload();await page.waitForSelector('.game-hud');owned();await page.evaluate(()=>{Math.random=()=>.5;});}
const card=id=>page.locator(`[data-shiny-specimen="${id}"]`);
const close=()=>tap(page.getByRole('button',{name:'Đóng',exact:true}));

function volcanoFixture(){
  const s=unlockTo(campaignGame(),'volcano-8');C.startCampaign(s,'volcano-8',campaignNow);
  for(let i=0;i<90&&s.expedition.stage<2;i++){if(!s.expedition.battle)E.chooseRoute(s,0,()=>.5);else{const {reason,...order}=autoOrder(combatScene(s,'explore'),{plan:s.autoTactics.plan});const r=E.battleTurn(s,order,()=>.5);assert.ok(!r.error);}}
  assert.equal(s.expedition.stage,2);E.chooseRoute(s,0,()=>.5);s.expedition.battle.hp=56;s.expedition.squad.enemies[0].hp=56;return s;
}
const advance=async ms=>{owned();await page.clock.runFor(ms);};
try{
  assert.ok(fs.existsSync(apk));owned();assert.equal(readAdb('shell','getprop','sys.boot_completed'),'1');
  const oldVersion=readAdb('shell','dumpsys','package',pkg).match(/versionName=([^\s]+)/)?.[1];
  if(oldVersion!=='1.26.0'){
    mutate('shell','am','force-stop',pkg);mutate('install','-r','-d','dist/DaoLinhThu-1.26.0.apk');
  }
  mutate('shell','svc','wifi','disable');mutate('shell','svc','data','disable');await foreground();
  if(await page.locator('#game-dialog[open] .offline-welcome').isVisible())await close();
  const before=await save();delete before.campaign;const migrated=E.validateSave(E.serialize(before));
  fs.writeFileSync(`dist/campaign-native-before-upgrade-${version}.json`,JSON.stringify(before,null,2)+'\n');
  await disconnect();mutate('shell','am','force-stop',pkg);mutate('install','-r',apk);await foreground();
  assert.deepEqual(stable(await save()),stable(migrated));
  log('Offline 1.26 → 1.27 upgrade preserves the original pets, Shiny, resources and all previous progress.');
  await importFixture(campaignGame());await controlledTime();await menu('campaign');await expect(page.locator('.campaign-node')).toHaveCount(8);await screenshot('map');
  await tap(page.locator('.campaign-node[data-id="forest-1"]'));await expect(page.locator('.campaign-goals li')).toHaveCount(3);await screenshot('story');
  const food=(await save()).resources.food;await tap(page.locator('[data-action="campaign-start"]'));assert.equal((await save()).resources.food,food-10);
  const expected=structuredClone(await save());E.chooseRoute(expected,0,()=>.5);await tap(page.locator('[data-duel="route"]').first());assert.deepEqual((await save()).expedition,expected.expedition);
  E.battleTurn(expected,'attack',()=>.5);await tap(page.locator('[data-move="attack"]'));await tap(page.locator('[data-duel="skip"]'));await advance(1500);assert.deepEqual((await save()).expedition,expected.expedition);await screenshot('manual');
  const checkpoint=(await save()).expedition;await restart();clockActive=false;assert.deepEqual((await save()).expedition,checkpoint);await controlledTime();await tap(page.locator('[data-action="active-battle"][data-id="explore"]'));await expect(page.locator('[data-duel="auto"]')).toHaveAttribute('aria-checked','false');await tap(page.locator('[data-duel="auto"]'));await advance(180000);
  await expect(page.locator('.campaign-result')).toBeVisible();const won=await save();assert.equal(won.expedition,null);assert.equal(won.campaign.stages['forest-1'].stars,3);await screenshot('first-clear');await tap(page.locator('[data-action="campaign-map"]'));
  await tap(page.locator('.campaign-node[data-id="forest-1"]'));const sweepExpected=structuredClone(await save()),sweep=C.sweepCampaign(sweepExpected,'forest-1',5);assert.ok(!sweep.error);await tap(page.locator('[data-action="campaign-sweep"][data-count="5"]'));assert.deepEqual((await save()).resources,sweepExpected.resources);assert.deepEqual((await save()).campaign,won.campaign);await screenshot('sweep');await tap(page.locator('[data-action="campaign-map"]'));
  const swept=await save();await restart();clockActive=false;assert.deepEqual((await save()).campaign,swept.campaign);assert.deepEqual((await save()).resources,swept.resources);
  log('Native touch manual combat and AUTO match engine saves; first clear, stars and paid ×5 sweep persist across force-stop.');
  await importFixture(unlockTo(campaignGame(),'reef-1'));await menu('campaign');await tap(page.locator('[data-action="campaign-chapter"][data-id="forest"]'));const chestExpected=structuredClone(await save());C.claimCampaignChest(chestExpected,'forest',8);await tap(page.locator('[data-action="campaign-chest"][data-stars="8"]'));assert.deepEqual((await save()).resources,chestExpected.resources);await close();await expect(page.locator('[data-action="campaign-chest"][data-stars="8"]')).toBeDisabled();await screenshot('star-chest');
  await importFixture(volcanoFixture());await controlledTime();await tap(page.locator('[data-action="active-battle"][data-id="explore"]'));await expect(page.locator('.forest-field [data-side="enemy"]')).toHaveCount(1);await tap(page.locator('[data-duel="auto"]'));
  for(let i=0;i<15;i++){await advance(950);if((await save()).expedition?.battle?.campaignPhase===2)break;}
  assert.equal((await save()).expedition.battle.campaignPhase,2);await tap(page.locator('[data-duel="auto"]'));await advance(1500);await expect(page.locator('.forest-field [data-side="enemy"]')).toHaveCount(3);await expect(page.locator('.forest-boss-unit')).toHaveCount(1);await expect(page.locator('#combat-stage .campaign-run-goals')).toContainText('PHA 2/2');await screenshot('boss-reinforcements');
  const phase=(await save()).expedition;await restart();clockActive=false;assert.deepEqual((await save()).expedition,phase);await controlledTime();await tap(page.locator('[data-action="active-battle"][data-id="explore"]'));await tap(page.locator('[data-duel="auto"]'));await advance(180000);await expect(page.locator('.campaign-decoration-unlock')).toContainText('Hải Đăng Bình Minh');const completedSave=await save();assert.equal(completedSave.campaign.stages['volcano-8'].wins,1);await screenshot('chapter-finale');await tap(page.locator('[data-action="campaign-map"]'));
  await menu('island');await tap(page.locator('[data-action="island-edit-open"]'));await tap(page.locator('[data-action="island-edit-catalog"]'));await tap(page.locator('[data-action="island-edit-category"][data-id="treasure"]'));for(const ch of CAMPAIGN_CHAPTERS)await expect(page.locator(`.editor-catalog-item[data-id="${ch.decoration}"]`)).toBeEnabled();await validArt('.editor-catalog-item[data-id="dawnbeacon"] svg');await screenshot('chapter-ornaments');
  log('Native offline boss transitions into phase two, shows two helpers, survives restart and unlocks the chapter ornament.');
  const installed=readAdb('shell','pm','path',pkg).split('\n')[0].replace('package:','').trim(),hash=crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');assert.equal(readAdb('shell','sha256sum',installed).split(' ')[0],hash);assert.match(readAdb('shell','dumpsys','connectivity'),/Active default network: none/);assert.deepEqual(errors,[]);
  const report={version,versionCode:34,androidApi:Number(readAdb('shell','getprop','ro.build.version.sdk')),emulator:'SpiritIslesAudit110',upgrade:'1.26.0 → 1.27.0',saveMigratedAndPreserved:true,nativeTouch:true,nativeFramesPainted:true,manualAndAutoMatchEngine:true,forceStopPreservesSnapshot:true,autoOffOnReopen:true,threeStarsAndRewardsPersist:true,sweepPaysOnlyRepeatedRewards:true,starChestPaysOnce:true,bossPhaseAndHelpersPersist:true,chapterOrnamentUnlocks:true,controlledClockForAuto:true,offline:true,installedApkSha256:hash,consoleErrors:errors,systemUiAnrRecoveries:recoveries,physicalPhoneTested:false,completedAt:new Date().toISOString()};
  fs.writeFileSync(`dist/ANDROID-CAMPAIGN-${version}.json`,JSON.stringify(report,null,2)+'\n');completed=true;log('Campaign Android audit passed.');
}finally{await disconnect();if(completed)try{mutate('emu','kill');}catch{}}
