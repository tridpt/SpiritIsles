import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import * as E from '../web/js/engine.js';
import {eventFixture} from '../tests/ruins-route-fixtures.mjs';
import {picnicFixture} from '../tests/picnic-fixtures.mjs';

const {version}=JSON.parse(fs.readFileSync('package.json','utf8')),previousVersion='1.30.0',versionCode=38;
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
      mutate('shell','uiautomator','dump','/sdcard/island-friends-audit.xml');
      const xml=readAdb('shell','cat','/sdcard/island-friends-audit.xml');assert.match(xml,/System UI (?:isn't|is not) responding/);
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
const memory=()=>page.locator('#island-memory'),camera=()=>memory().locator('button');
const actor=id=>page.locator(`.island-pet[data-id="${id}"]`);
async function back(){await focus();mutate('shell','input','keyevent','4');}
async function invite(){await tap(actor('mossfox'));await tap(page.locator('[data-action="island-invite-friend"]'));}
function screenshot(scene){
  owned();const path=`dist/screenshots/island-friends-native-${scene}-${version}.png`;
  fs.writeFileSync(path,execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{windowsHide:true,timeout:30000}));screens.push(path);
}
async function pairReady(){
  await expect(page.locator('.island-pet[data-habitat-pose="friends"]')).toHaveCount(2,{timeout:30000});
  await expect(memory()).toBeVisible();
}
try{
  owned();let booted=false;
  for(let i=0;i<70;i++){
    try{if(readAdb('shell','getprop','sys.boot_completed')==='1'&&/phone: found/.test(readAdb('shell','service','check','phone'))){booted=true;break;}}catch{}
    await delay(500);
  }
  assert.ok(booted,'Owned audit AVD must finish booting');
  mutate('shell','am','force-stop',pkg);mutate('install','-r','-d',`dist/DaoLinhThu-${previousVersion}.apk`);
  mutate('shell','wm','size','390x900');mutate('shell','wm','density','160');mutate('shell','svc','wifi','disable');mutate('shell','svc','data','disable');
  await foreground();await delay(600);
  if(await page.locator('.offline-welcome').isVisible())await tap(page.getByRole('button',{name:'Đóng',exact:true}));
  await tap(page.locator('[data-action="game-menu"]'));await tap(page.getByRole('button',{name:'Cài đặt',exact:true}));
  const fixture=eventFixture('chest');picnicFixture(fixture,fixture.team);fixture.settings.motion=true;
  // Retain a pre-existing memory while the island's new picnic uses the bench.
  fixture.habitat.discovered['mossfox:shade-nap']={at:Date.now(),decoration:'sapling'};
  E.validateSave(E.serialize(fixture));
  owned();await page.evaluate(raw=>{const input=document.querySelector('#import-file'),transfer=new DataTransfer();transfer.items.add(new File([raw],'island-friends-audit.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));},E.serialize(fixture));
  await tap(page.locator('[data-action="confirm-import"]'));const before=await save();assert.deepEqual(before.ruins,fixture.ruins);
  await disconnect();mutate('shell','am','force-stop',pkg);mutate('install','-r',apk);await foreground();
  assert.deepEqual(stable(await save()),stable(E.validateSave(E.serialize(before))));
  log(`Upgrade ${previousVersion} → ${version} preserved the complete offline save.`);
  await menu('island');await pairReady();
  const host=await camera().getAttribute('data-id'),partner=await camera().getAttribute('data-partner');
  assert.ok(before.team.includes(partner));assert.notEqual(host,partner);assert.deepEqual((await save()).habitat,before.habitat);assert.deepEqual((await save()).pets,before.pets);screenshot('autonomous');
  await tap(page.locator('[data-action="game-menu"]'));await expect(memory()).toBeHidden();await back();await expect(memory()).toBeVisible();
  await tap(actor(partner));await expect(memory()).toBeHidden();await expect(page.locator('.island-picnic')).toHaveCount(0);await expect(page.locator('#island-care')).toBeVisible();await back();await expect(page.locator('#island-care')).toBeHidden();
  await invite();await pairReady();
  await focus();mutate('shell','input','keyevent','3');await expect.poll(()=>page.evaluate(()=>document.hidden)).toBe(true);
  const held=await page.locator('.island-memory-progress>b').getAttribute('style'),poses=await page.locator('.island-pet[data-life-partner]').evaluateAll(es=>es.map(e=>e.style.transform));
  await delay(1200);assert.equal(await page.locator('.island-memory-progress>b').getAttribute('style'),held);assert.deepEqual((await save()).habitat,before.habitat);
  mutate('shell','am','start','-n',pkg+'/.MainActivity');await focus();await expect.poll(()=>page.evaluate(()=>document.hidden)).toBe(false);
  await pairReady();assert.deepEqual(await page.locator('.island-pet[data-life-partner]').evaluateAll(es=>es.map(e=>e.style.transform)),poses);
  await expect(camera()).toBeEnabled({timeout:12000});const actualPartner=await camera().getAttribute('data-partner');screenshot('ready');await tap(camera());await expect(camera()).toBeDisabled();await expect(memory()).toContainText('Đã ghi');
  const recorded=await save();assert.equal(recorded.pets.find(p=>p.id==='mossfox').bond,before.pets.find(p=>p.id==='mossfox').bond+2);
  assert.equal(recorded.habitat.discovered['mossfox:picnic-friends'].partner,actualPartner);assert.equal(Object.keys(recorded.habitat.discovered).length,Object.keys(before.habitat.discovered).length+1);
  assert.deepEqual(recorded.ruins,before.ruins);assert.deepEqual(recorded.resources,before.resources);assert.deepEqual(recorded.team,before.team);assert.deepEqual(recorded.pets.slice(1),before.pets.slice(1));assert.deepEqual(recorded.habitat.discovered['mossfox:shade-nap'],before.habitat.discovered['mossfox:shade-nap']);screenshot('recorded');
  await restart();assert.deepEqual(stable(await save()),stable(recorded));
  await menu('island');await tap(page.locator('[data-action="game-menu"]'));await tap(page.getByRole('button',{name:'Cài đặt',exact:true}));await expect(page.locator('.settings-brand')).toContainText(version);
  await tap(page.getByRole('switch',{name:'Chuyển động',exact:true}));await tap(page.getByRole('button',{name:'Đóng',exact:true}));await invite();await pairReady();
  await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','still');const at=await page.locator('.island-pet[data-life-partner]').evaluateAll(es=>es.map(e=>e.style.transform));
  await delay(700);assert.deepEqual(await page.locator('.island-pet[data-life-partner]').evaluateAll(es=>es.map(e=>e.style.transform)),at);assert.deepEqual((await save()).habitat,recorded.habitat);screenshot('reduced-motion');
  await tap(camera());await expect(page.locator('.habitat-card.featured')).toHaveAttribute('data-moment','picnic-friends');await tap(page.locator('.habitat-card.featured [data-action="habitat-play"]'));
  const name=recorded.pets.find(p=>p.id===actualPartner).species;assert.equal(name,actualPartner);
  await expect(page.locator('.habitat-scene-partner .creature')).toHaveAttribute('data-species',name);
  assert.deepEqual((await save()).habitat,recorded.habitat);screenshot('replay');
  const installedPath=readAdb('shell','pm','path',pkg).split('\n')[0].replace('package:','').trim(),installed=readAdb('shell','sha256sum',installedPath).split(' ')[0],hash=crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');
  assert.equal(installed,hash);assert.match(readAdb('shell','dumpsys','package',pkg),new RegExp('versionCode='+versionCode));assert.match(readAdb('shell','dumpsys','connectivity'),/Active default network: none/);assert.deepEqual(errors,[]);
  fs.writeFileSync(`dist/ANDROID-ISLAND-FRIENDS-${version}.json`,JSON.stringify({version,versionCode,emulator:'SpiritIslesAudit110',upgrade:previousVersion+' → '+version,androidApi:Number(readAdb('shell','getprop','ro.build.version.sdk')),offline:true,savePreserved:true,oldMemoriesPreserved:true,unresolvedRouteAndRngPreserved:true,resourcesAndTeamPreserved:true,autonomousPairVisit:true,bothPetTouchTargets:true,explicitRecordOnly:true,actualPartnerSaved:true,replayUsesSavedPartner:true,webViewTouch:true,nativeBackClosesMenuThenCare:true,nativeHomePausesObservation:true,nativeResumeKeepsBothPoses:true,forceStopPreservesProgress:true,reducedMotionPairVisit:true,newMemoriesRecorded:1,installedApkSha256:hash,screenshots:screens,consoleErrors:errors,systemUiRecoveries:recoveries,physicalPhoneTested:false,completedAt:new Date().toISOString()},null,2)+'\n');
  log('Native picnic, explicit record, exact partner replay, Back/Home and restart passed offline.');
}finally{await disconnect();}
