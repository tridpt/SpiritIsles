import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import {autoRoute,autoOrder} from '../web/js/auto-play.js';
import {combatScene} from '../web/js/combat-stage.js';
import {E,turn} from '../tests/squad-fixtures.mjs';
import {T,towerReady,towerGame,climb,towerNow} from '../tests/tower-fixtures.mjs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const adb='C:/Users/ASUS/AppData/Local/Android/Sdk/platform-tools/adb.exe',serial='emulator-5580',pkg='vn.spiritisles.game',apk=`dist/DaoLinhThu-${version}.apk`;
const readAdb=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true,timeout:60000,stdio:['ignore','pipe','pipe']}).trim();
const owned=()=>assert.equal(readAdb('emu','avd','name').split(/\r?\n/)[0].trim(),'SpiritIslesAudit110');
const mutate=(...args)=>{owned();return readAdb(...args);};
const stable=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='lastSeen'));
const log=s=>{fs.appendFileSync(`dist/NATIVE-TOWER-FINAL-PROGRESS-${version}.log`,`${new Date().toISOString()} ${s}\n`);console.log(s);};
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
  fs.writeFileSync(`dist/screenshots/tower-native-final-${name}-${version}.png`,frame);
}
async function validArt(selector){
  const result=await page.locator(selector).evaluateAll(es=>es.map(e=>({invalid:!!new DOMParser().parseFromString(e.outerHTML,'image/svg+xml').querySelector('parsererror'),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
  assert.ok(result.length&&result.every(r=>!r.invalid&&r.width>0&&r.height>0));return result;
}
async function importFixture(s){
  E.validateSave(E.serialize(s));
  if(await page.locator('#combat-stage[open]').isVisible())await tap(page.locator('#combat-stage [data-duel="close"]').first());
  await tap(page.getByRole('button',{name:'Mở menu đảo',exact:true}));await tap(page.getByRole('button',{name:'Cài đặt',exact:true}));
  owned();await page.evaluate(raw=>{const input=document.querySelector('#import-file'),transfer=new DataTransfer();transfer.items.add(new File([raw],'tower-audit.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));},E.serialize(s));
  await tap(page.locator('[data-action="confirm-import"]'));await expect(page.locator('.tower-page')).toBeVisible();
}
async function controlledTime(){owned();await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));clockActive=true;await page.reload();await page.waitForSelector('.game-hud');owned();await page.evaluate(()=>{Math.random=()=>.5;});}
try{
  let booted=false;for(let i=0;i<100;i++){try{if(readAdb('shell','getprop','sys.boot_completed')==='1'){booted=true;break;}}catch{}await delay(500);}assert.ok(booted);owned();
  mutate('shell','svc','wifi','disable');mutate('shell','svc','data','disable');await restart();
  const before=await save();E.validateSave(E.serialize(before));
  await disconnect();mutate('shell','am','force-stop',pkg);mutate('install','-r',apk);await foreground();assert.deepEqual(stable(await save()),stable(before));
  await tap(page.getByRole('button',{name:'Mở menu đảo',exact:true}));await tap(page.getByRole('button',{name:'Cài đặt',exact:true}));await expect(page.locator('.settings-brand')).toContainText(version);await screenshot('version');mutate('shell','input','keyevent','4');
  await tap(page.locator('[data-action="active-battle"][data-id="tower"]'));await expect(page.locator('[data-duel="auto"]')).toHaveAttribute('aria-checked','false');await expect(page.locator('.duel-skill .tower-pet-crown')).toHaveCount(3);const expected=structuredClone(await save());T.towerBattleTurn(expected,'guard',Date.now(),'auto');await tap(page.locator('[data-move="guard"]'));await tap(page.locator('[data-duel="skip"]'));await expect.poll(async()=>((await save()).tower.run.battle.turn)).toBe(expected.tower.run.battle.turn);assert.deepEqual((await save()).tower.run,expected.tower.run);await screenshot('battle');
  const after=await save();await restart();assert.deepEqual((await save()).tower,after.tower);assert.deepEqual((await save()).resources,after.resources);
  const installed=readAdb('shell','pm','path',pkg).split('\n')[0].replace('package:','').trim(),hash=crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');assert.equal(readAdb('shell','sha256sum',installed).split(' ')[0],hash);assert.match(readAdb('shell','dumpsys','connectivity'),/Active default network: none/);assert.deepEqual(errors,[]);
  const report={version,versionCode:32,emulator:'SpiritIslesAudit110',finalApkReinstalledOffline:true,savePreserved:true,settingsVersionCorrect:true,crownRenders:true,manualGuardMatchesEngine:true,forceStopPreservesProgress:true,autoOffOnReopen:true,nativeTouch:true,nativeFramesPainted:true,installedApkSha256:hash,consoleErrors:errors,systemUiAnrRecoveries:recoveries,physicalPhoneTested:false,completedAt:new Date().toISOString()};fs.writeFileSync(`dist/ANDROID-TOWER-FINAL-${version}.json`,JSON.stringify(report,null,2)+'\n');completed=true;log('Final APK: version label, offline update, crown, manual guard, restart and installed hash verified.');
}finally{await disconnect();if(completed)try{mutate('emu','kill');}catch{}}
