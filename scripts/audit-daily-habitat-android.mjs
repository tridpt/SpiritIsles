import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import * as E from '../web/js/engine.js';
import * as H from '../web/js/habitat-engine.js';
import {eventFixture} from '../tests/ruins-route-fixtures.mjs';

const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const adb='C:/Users/ASUS/AppData/Local/Android/Sdk/platform-tools/adb.exe',serial='emulator-5580',pkg='vn.spiritisles.game',apk=`dist/DaoLinhThu-${version}.apk`;
const readAdb=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true,timeout:45000,stdio:['ignore','pipe','pipe']}).trim();
const owned=()=>assert.equal(readAdb('emu','avd','name').split(/\r?\n/)[0].trim(),'SpiritIslesAudit110');
const mutate=(...args)=>{owned();return readAdb(...args);};
const stable=s=>Object.fromEntries(Object.entries(s).filter(([key])=>key!=='lastSeen'));
const errors=[],screens=[];let browser,page,recoveries=0;
const log=text=>console.log(new Date().toISOString(),text);
async function disconnect(){const previous=browser;browser=null;if(previous)await Promise.race([previous.close().catch(()=>{}),delay(1500)]);}
async function focus(){
  for(let i=0;i<25;i++){
    const current=readAdb('shell','dumpsys','window','displays').split('\n').find(line=>line.includes('mCurrentFocus='))||'';
    if(current.includes(pkg))return;
    if(current.includes('Application Not Responding: com.android.systemui')){
      mutate('shell','uiautomator','dump','/sdcard/daily-habitat-audit.xml');
      const xml=readAdb('shell','cat','/sdcard/daily-habitat-audit.xml');assert.match(xml,/System UI (?:isn't|is not) responding/);
      const match=xml.match(/<node[^>]*resource-id="android:id\/aerr_close"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);assert.ok(match);
      mutate('shell','input','tap',String(Math.floor((+match[1]+ +match[3])/2)),String(Math.floor((+match[2]+ +match[4])/2)));recoveries++;mutate('shell','am','start','-n',pkg+'/.MainActivity');
    }
    await delay(400);
  }
  assert.fail('Audit game must hold native focus before input');
}
async function foreground(){
  mutate('shell','am','start','-n',pkg+'/.MainActivity');await focus();
  for(let i=0;i<35;i++)try{
    const pid=readAdb('shell','pidof',pkg);mutate('forward','tcp:9228',`localabstract:webview_devtools_remote_${pid}`);
    browser=await chromium.connectOverCDP('http://127.0.0.1:9228',{noDefaults:true,timeout:2000});
    page=browser.contexts()[0].pages().find(p=>p.url().startsWith('https://spirit.isles'));assert.ok(page);
    await page.waitForSelector('.game-hud',{timeout:6000});await page.evaluate(()=>document.fonts.ready);
    page.on('pageerror',e=>errors.push(e.message));return;
  }catch{await disconnect();await delay(400);}
  assert.fail('Could not connect to the audit WebView');
}
async function restart(){await disconnect();mutate('shell','am','force-stop',pkg);await foreground();}
async function tap(locator){
  await expect(locator).toBeVisible();await focus();owned();
  const point=await locator.evaluate(element=>{
    element.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
    const r=element.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
    return {x,y,clear:element.contains(document.elementFromPoint(x,y))};
  });assert.ok(point.clear,'WebView touch target must be unobstructed');
  const cdp=await page.context().newCDPSession(page);
  try{owned();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});owned();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}finally{await cdp.detach();}
}
const save=async()=>JSON.parse(await page.evaluate(()=>AndroidApp.readSave())).state;
const menu=async destination=>{await tap(page.locator('[data-action="game-menu"]'));await tap(page.locator(`.game-menu-item[data-page="${destination}"]`));};
const hint=()=>page.locator('.lobby-habitat-hint');
async function back(){await focus();mutate('shell','input','keyevent','4');}
function screenshot(scene){
  owned();const path=`dist/screenshots/daily-habitat-native-${scene}-${version}.png`;
  fs.writeFileSync(path,execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{windowsHide:true,timeout:30000}));screens.push(path);
}
async function record(){const button=page.locator('[data-action="habitat-scene-record"]');await expect(button).toBeEnabled({timeout:15000});await tap(button);await expect(page.locator('[data-habitat-scene-status]')).toContainText('Đã ghi kỷ niệm mới');}

try{
  owned();let booted=false;
  for(let i=0;i<80;i++){
    try{if(readAdb('shell','getprop','sys.boot_completed')==='1'&&/phone: found/.test(readAdb('shell','service','check','phone'))){booted=true;break;}}catch{}
    await delay(500);
  }
  assert.ok(booted,'Owned audit AVD must finish booting');
  mutate('shell','am','force-stop',pkg);mutate('install','-r','-d','dist/DaoLinhThu-1.28.0.apk');
  mutate('shell','wm','size','390x900');mutate('shell','wm','density','160');mutate('shell','svc','wifi','disable');mutate('shell','svc','data','disable');
  await foreground();
  // The prior save may open its delayed welcome dialog 450 ms after startup.
  await delay(600);if(await page.locator('.offline-welcome').isVisible())await tap(page.getByRole('button',{name:'Đóng',exact:true}));
  await tap(page.locator('[data-action="game-menu"]'));await tap(page.getByRole('button',{name:'Cài đặt',exact:true}));
  const fixture=eventFixture('chest');fixture.pets.forEach(p=>p.bond=50);H.discoverMoment(fixture,'mossfox','shade-nap');
  owned();await page.evaluate(raw=>{const input=document.querySelector('#import-file'),transfer=new DataTransfer();transfer.items.add(new File([raw],'daily-habitat-audit.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));},E.serialize(fixture));
  await tap(page.locator('[data-action="confirm-import"]'));const before=await save();assert.deepEqual(before.ruins,fixture.ruins);
  log('Prepared the previous APK with a saved memory and an unresolved offline route.');
  await disconnect();mutate('shell','am','force-stop',pkg);mutate('install','-r',apk);await foreground();
  assert.deepEqual(stable(await save()),stable(E.validateSave(E.serialize(before))));
  log('Upgrade 1.28.0 → '+version+' preserved the full save.');
  await menu('island');const expected=H.dailyHabitatHint(before),id=await hint().getAttribute('data-id'),moment=await hint().getAttribute('data-moment');
  assert.equal(id,expected.pet.id);assert.equal(moment,expected.moment.id);screenshot('island');
  await tap(hint());await expect(page.locator('#habitat-pet')).toHaveValue(id);await expect(page.locator('.habitat-card.featured')).toHaveAttribute('data-moment',moment);
  await tap(page.locator('.habitat-card.featured [data-action="habitat-play"]'));await record();
  const first=await save();assert.equal(first.pets.find(p=>p.id===id).bond,before.pets.find(p=>p.id===id).bond+2);
  assert.deepEqual(first.ruins,before.ruins);assert.deepEqual(first.resources,before.resources);assert.deepEqual(first.team,before.team);
  assert.notEqual(`${await hint().getAttribute('data-id')}:${await hint().getAttribute('data-moment')}`,`${id}:${moment}`);screenshot('recorded');
  await tap(page.locator('[data-action="game-menu"]'));await back();await expect(page.locator('.habitat-scene')).toBeVisible();await back();await expect(page.locator('.habitat-scene')).toHaveCount(0);
  await tap(hint());await tap(page.locator('.habitat-card.featured [data-action="habitat-play"]'));await focus();mutate('shell','input','keyevent','3');
  await expect.poll(()=>page.evaluate(()=>document.hidden)).toBe(true);const held=await page.locator('[data-habitat-progress]').getAttribute('style');await delay(1000);assert.equal(await page.locator('[data-habitat-progress]').getAttribute('style'),held);
  assert.deepEqual((await save()).habitat,first.habitat);mutate('shell','am','start','-n',pkg+'/.MainActivity');await focus();await expect.poll(()=>page.evaluate(()=>document.hidden)).toBe(false);
  await record();const second=await save();assert.equal(Object.keys(second.habitat.discovered).length,Object.keys(before.habitat.discovered).length+2);
  await restart();assert.deepEqual(stable(await save()),stable(second));await menu('habitat');await expect(page.locator('.habitat-daily')).toBeVisible();screenshot('book');
  await tap(page.locator('[data-action="game-menu"]'));await expect(page.locator('.game-menu-item[data-page="habitat"]')).toHaveAttribute('aria-current','page');await tap(page.getByRole('button',{name:'Cài đặt',exact:true}));await expect(page.locator('.settings-brand')).toContainText(version);
  const installedPath=readAdb('shell','pm','path',pkg).split('\n')[0].replace('package:','').trim(),installed=readAdb('shell','sha256sum',installedPath).split(' ')[0],hash=crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');
  assert.equal(installed,hash);assert.match(readAdb('shell','dumpsys','package',pkg),/versionCode=36/);assert.match(readAdb('shell','dumpsys','connectivity'),/Active default network: none/);assert.deepEqual(errors,[]);
  fs.writeFileSync(`dist/ANDROID-DAILY-HABITAT-${version}.json`,JSON.stringify({version,versionCode:36,emulator:'SpiritIslesAudit110',upgrade:'1.28.0 → '+version,androidApi:Number(readAdb('shell','getprop','ro.build.version.sdk')),offline:true,savePreserved:true,oldMemoriesPreserved:true,unresolvedRouteAndRngPreserved:true,resourcesAndTeamPreserved:true,webViewTouch:true,nativeBackClosesMenuThenScene:true,nativeHomePausesObservation:true,nativeResumeKeepsScene:true,forceStopPreservesProgress:true,newMemoriesRecorded:2,immediateHintAdvance:true,installedApkSha256:hash,screenshots:screens,consoleErrors:errors,systemUiRecoveries:recoveries,physicalPhoneTested:false,completedAt:new Date().toISOString()},null,2)+'\n');
  log('Offline native memory flow, Back/Home, restart, package hash and save preservation passed.');
}finally{await disconnect();}
