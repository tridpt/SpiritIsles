import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import {autoRoute,autoOrder} from '../web/js/auto-play.js';
import {combatScene} from '../web/js/combat-stage.js';
import {E,turn} from '../tests/squad-fixtures.mjs';
import {forestFixture} from '../tests/forest-fixtures.mjs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const adb='C:/Users/ASUS/AppData/Local/Android/Sdk/platform-tools/adb.exe',serial='emulator-5580',pkg='vn.spiritisles.game',apk=`dist/DaoLinhThu-${version}.apk`;
const readAdb=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true,timeout:60000,stdio:['ignore','pipe','pipe']}).trim();
const owned=()=>assert.equal(readAdb('emu','avd','name').split(/\r?\n/)[0].trim(),'SpiritIslesAudit110');
const mutate=(...args)=>{owned();return readAdb(...args);};
const stable=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='lastSeen'));
const log=s=>{fs.appendFileSync(`dist/NATIVE-FOREST-PROGRESS-${version}.log`,`${new Date().toISOString()} ${s}\n`);console.log(s);};
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
async function foreground(){mutate('shell','am','start','-n',`${pkg}/.MainActivity`);await connect();await nativeFocus();}
async function restart(){await disconnect();mutate('shell','am','force-stop',pkg);await foreground();}
async function tap(locator) {
  await nativeFocus();owned();await expect(locator).toBeVisible();
  let r;
  for(let i=0;i<8;i++) {
    r=await locator.evaluate(e=>{e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return {x,y,hit:e.contains(hit),obstruction:hit?.outerHTML.slice(0,180),name:e.getAttribute('aria-label')||e.dataset.action||e.dataset.duel};});
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
  fs.writeFileSync(`dist/screenshots/forest-native-${name}-${version}.png`,frame);
}
async function validArt(selector){
  const result=await page.locator(selector).evaluateAll(es=>es.map(e=>({invalid:!!new DOMParser().parseFromString(e.outerHTML,'image/svg+xml').querySelector('parsererror'),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
  assert.ok(result.length&&result.every(r=>!r.invalid&&r.width>0&&r.height>0));return result;
}
async function importFixture(s){
  E.validateSave(E.serialize(s));
  if(await page.locator('#combat-stage[open]').isVisible())await tap(page.locator('#combat-stage [data-duel="close"]').first());
  await tap(page.getByRole('button',{name:'Mở menu đảo',exact:true}));await tap(page.getByRole('button',{name:'Cài đặt',exact:true}));
  owned();await page.evaluate(raw=>{const input=document.querySelector('#import-file'),transfer=new DataTransfer();transfer.items.add(new File([raw],'forest-audit.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));},E.serialize(s));
  await tap(page.locator('[data-action="confirm-import"]'));await expect(page.locator('[data-action="journey-open"]')).toBeVisible();
}
async function controlledTime(){owned();await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));clockActive=true;await page.reload();await page.waitForSelector('.game-hud');owned();await page.evaluate(()=>{Math.random=()=>.5;});}
try{
  let booted=false;for(let i=0;i<100;i++){try{if(readAdb('shell','getprop','sys.boot_completed')==='1'){booted=true;break;}}catch{}await delay(600);}assert.ok(booted);owned();
  const installedVersion=readAdb('shell','dumpsys','package',pkg);
  if(!/versionName=1\.21\.0/.test(installedVersion)){mutate('shell','am','force-stop',pkg);mutate('install','-r','-d','dist/DaoLinhThu-1.21.0.apk');}
  mutate('shell','svc','wifi','disable');mutate('shell','svc','data','disable');await restart();
  if(await page.locator('#game-dialog[open] .offline-welcome').isVisible())await tap(page.locator('#game-dialog [data-action="close-modal"]'));
  const before=await save();fs.writeFileSync(`dist/forest-native-prior-audit-save-${version}.json`,JSON.stringify(before,null,2)+'\n');
  await disconnect();mutate('shell','am','force-stop',pkg);mutate('install','-r',apk);await foreground();
  assert.deepEqual(stable(await save()),stable(before));log('Offline 1.21 → 1.22 upgrade preserves pets, resources, island, active squad, plans, presets and journal.');

  const fixture=forestFixture({boss:true,warning:true,motion:true});await importFixture(fixture);await controlledTime();await tap(page.locator('[data-action="journey-open"]'));await expect(page.locator('.forest-warning')).toBeVisible();await validArt('.forest-backdrop');await screenshot('warning');
  const expected=structuredClone(await save()),result=turn(expected,'explore','evade');assert.ok(result.evaded);await tap(page.locator('[data-duel="evade"]'));
  assert.deepEqual((await save()).expedition,expected.expedition);owned();await page.clock.runFor(400);await screenshot('dodge');
  owned();await page.clock.runFor(1500);assert.deepEqual((await save()).expedition,expected.expedition);await tap(page.locator('[data-duel="auto"]'));
  owned();await page.clock.runFor(901);await tap(page.locator('[data-duel="auto"]'));owned();await page.clock.runFor(1500);const afterAuto=await save();assert.equal(afterAuto.expedition.battle.round,4);await screenshot('battle');
  await restart();clockActive=false;assert.deepEqual(stable(await save()),stable(afterAuto));await controlledTime();await tap(page.locator('[data-action="journey-open"]'));await expect(page.locator('[data-duel="auto"]')).toHaveAttribute('aria-checked','false');owned();await page.clock.runFor(60000);assert.deepEqual((await save()).expedition,afterAuto.expedition);
  log('Native dodge matches the real engine, AUTO performs one next turn, force-stop preserves the squad and AUTO reopens off.');

  const autoFixture=forestFixture({boss:true,warning:true});await importFixture(autoFixture);await tap(page.locator('[data-action="journey-auto"]'));owned();await page.clock.runFor(901);await tap(page.locator('[data-duel="auto"]'));owned();await page.clock.runFor(200);
  assert.equal((await save()).expedition.battle.round,3);assert.match((await save()).expedition.battle.tactics.last,/Né Rễ trồi/);
  await tap(page.locator('[data-duel="planner"]'));const paused=(await save()).expedition;owned();await page.clock.runFor(60000);assert.deepEqual((await save()).expedition,paused);
  mutate('shell','input','keyevent','3');await expect.poll(()=>page.evaluate(()=>document.hidden),{timeout:10000}).toBe(true);owned();await page.clock.runFor(60000);assert.deepEqual((await save()).expedition,paused);mutate('shell','am','start','-n',`${pkg}/.MainActivity`);await nativeFocus();
  mutate('shell','input','keyevent','4');await expect(page.locator('#auto-planner')).not.toBeVisible();assert.deepEqual((await save()).expedition,paused);
  log('Native AUTO dodges the root warning; planner, Home and Android Back preserve the paused encounter.');

  const trip=forestFixture({travel:true,level:20,motion:true});await importFixture(trip);await tap(page.locator('[data-action="journey-auto"]'));await expect(page.locator('.forest-field.is-walking')).toBeVisible();await screenshot('travel');
  owned();await page.evaluate(()=>{window.auditForestField=document.querySelector('.forest-field');window.auditForestPet=document.querySelector('[data-friend="mossfox"]');});
  owned();await page.clock.runFor(2301);assert.equal(await page.locator('.forest-field').getAttribute('data-phase'),'battle');assert.equal(await page.evaluate(()=>window.auditForestField===document.querySelector('.forest-field')&&window.auditForestPet===document.querySelector('[data-friend="mossfox"]')),true);
  owned();await page.clock.runFor(120000);await expect(page.locator('.duel-end h2')).toHaveText('Đã hoàn thành hành trình!');const finished=await save();assert.equal(finished.expedition,null);assert.equal(finished.stats.expeditions,trip.stats.expeditions+1);assert.equal(finished.combatJournal.reports.length,4);await screenshot('complete');
  owned();await page.clock.runFor(60000);assert.deepEqual((await save()).resources,finished.resources);await restart();clockActive=false;assert.deepEqual((await save()).combatJournal,finished.combatJournal);assert.deepEqual((await save()).resources,finished.resources);
  const installed=readAdb('shell','pm','path',pkg).split('\n')[0].replace('package:','').trim(),hash=crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');assert.equal(readAdb('shell','sha256sum',installed).split(' ')[0],hash);assert.match(readAdb('shell','dumpsys','connectivity'),/Active default network: none/);assert.deepEqual(errors,[]);
  const report={version,versionCode:29,androidApi:Number(readAdb('shell','getprop','ro.build.version.sdk')),emulator:'SpiritIslesAudit110',upgrade:'1.21.0 → 1.22.0',savePreserved:true,nativeTouch:true,nativeFramesPainted:true,manualDodgeMatchesEngine:true,autoDodgesWarning:true,oneActionPerTurn:true,persistentWorldAndPet:true,plannerAndHomePause:true,nativeBackClosesPlanner:true,forceStopPreservesSquad:true,autoOffOnReopen:true,completeTripFourReports:true,onePayoutOnly:true,controlledClockForAuto:true,offline:true,installedApkSha256:hash,consoleErrors:errors,systemUiAnrRecoveries:recoveries,physicalPhoneTested:false,completedAt:new Date().toISOString()};
  fs.writeFileSync(`dist/ANDROID-FOREST-${version}.json`,JSON.stringify(report,null,2)+'\n');completed=true;log('Forest Android audit passed: complete offline trip, four real reports, single reward and APK hash.');
}finally{await disconnect();if(completed)try{mutate('emu','kill');}catch{}}
