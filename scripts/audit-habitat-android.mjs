import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import * as E from '../web/js/engine.js';
import {eventFixture} from '../tests/ruins-route-fixtures.mjs';

const version='1.16.0',apk=`dist/DaoLinhThu-${version}.apk`,adb='C:/Users/ASUS/AppData/Local/Android/Sdk/platform-tools/adb.exe',serial='emulator-5580',pkg='vn.spiritisles.game';
const readAdb=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true,timeout:60000,stdio:['ignore','pipe','pipe']}).trim();
const owned=()=>assert.equal(readAdb('emu','avd','name').split(/\r?\n/)[0].trim(),'SpiritIslesAudit110');
const mutate=(...args)=>{owned();return readAdb(...args);};
const stable=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='lastSeen'));
const write=(name,data)=>fs.writeFileSync(`dist/${name}`,JSON.stringify(data,null,2)+'\n');
let browser,page,recoveries=0;const errors=[];
async function connect(){
  browser=null;
  for(let i=0;i<30;i++){
    try{
      const pid=readAdb('shell','pidof',pkg);mutate('forward','tcp:9228',`localabstract:webview_devtools_remote_${pid}`);browser=await chromium.connectOverCDP('http://127.0.0.1:9228',{noDefaults:true,timeout:1800});
      const c=browser.contexts()[0];page=c.pages().find(p=>p.url().startsWith('https://spirit.isles'))||c.pages().at(-1)||await c.waitForEvent('page',{timeout:5000});
      await page.waitForSelector('.game-hud',{timeout:5000});await page.evaluate(()=>document.fonts.ready);page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));return;
    }catch{if(browser)await browser.close().catch(()=>{});browser=null;await delay(400);}
  }
  assert.fail('could not attach to the loaded game WebView');
}
async function nativeFocus(){
  for(let i=0;i<30;i++){
    const focus=readAdb('shell','dumpsys','window','displays').split('\n').find(l=>l.includes('mCurrentFocus='))||'';
    if(focus.includes('Application Not Responding: com.android.systemui')){
      mutate('shell','uiautomator','dump','/sdcard/habitat-audit.xml');const xml=readAdb('shell','cat','/sdcard/habitat-audit.xml');assert.match(xml,/System UI (?:isn't|is not) responding/);
      const m=xml.match(/<node[^>]*resource-id="android:id\/aerr_close"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);assert.ok(m);mutate('shell','input','tap',String(Math.floor((+m[1]+ +m[3])/2)),String(Math.floor((+m[2]+ +m[4])/2)));recoveries++;
    }else if(focus.includes(pkg))return;
    await delay(500);
  }
  assert.fail('game must hold native focus');
}
async function foreground(){mutate('shell','am','start','-n',`${pkg}/.MainActivity`);await expect.poll(()=>readAdb('shell','dumpsys','activity','activities'),{timeout:30000}).toMatch(/topResumedActivity=.*vn\.spiritisles\.game/);}
async function restart(){if(browser)await browser.close();browser=null;mutate('shell','am','force-stop',pkg);await foreground();await connect();}
const read=async()=>JSON.parse(await page.evaluate(()=>AndroidApp.readSave())).state;
async function click(locator){owned();await locator.click();}
async function menu(){await click(page.getByRole('button',{name:'Mở menu đảo',exact:true}));await expect(page.locator('.island-menu[open]')).toBeVisible();}
async function nav(id){await menu();await click(page.locator(`.game-menu-grid [data-page="${id}"]`));await expect(page.locator('.game-shell')).toHaveAttribute('data-screen',id);}
async function book(){await nav('pets');await click(page.locator('.habitat-entry'));await expect(page.locator('#habitat-pet')).toBeVisible();}
async function play(id){await click(page.locator(`.habitat-card[data-moment="${id}"] [data-action="habitat-play"]`));await expect(page.locator('.habitat-scene')).toBeVisible();}
async function back(){await nativeFocus();mutate('shell','input','keyevent','4');}
const screenshot=name=>{owned();fs.writeFileSync(`dist/screenshots/habitat-native-${name}-${version}.png`,execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{windowsHide:true,timeout:30000}));};
async function touchRecord(){
  const b=page.locator('[data-action="habitat-scene-record"]');await expect(b).toBeEnabled({timeout:15000});const r=await b.boundingBox(),cdp=await page.context().newCDPSession(page);
  owned();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});owned();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();await expect(page.locator('[data-habitat-scene-status]')).toContainText('Đã ghi kỷ niệm mới');
}
try{
  let ready=false;for(let i=0;i<100;i++){try{if(readAdb('shell','getprop','sys.boot_completed')==='1'&&/phone: found/.test(readAdb('shell','service','check','phone'))){ready=true;break;}}catch{}await delay(600);}assert.ok(ready);owned();
  mutate('install','-r','-d','dist/DaoLinhThu-1.15.1.apk');mutate('shell','wm','size','390x900');mutate('shell','wm','density','160');mutate('shell','svc','wifi','disable');mutate('shell','svc','data','disable');mutate('shell','settings','put','global','mobile_data','0');await restart();await nativeFocus();
  const fixture=eventFixture('chest');delete fixture.habitat;fixture.pets[0].bond=20;
  await menu();await click(page.getByRole('button',{name:'Cài đặt',exact:true}));owned();await page.evaluate(raw=>{const input=document.querySelector('#import-file'),transfer=new DataTransfer();transfer.items.add(new File([raw],'habitat-audit.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));},E.serialize(fixture));await click(page.locator('[data-action="confirm-import"]'));await expect(page.locator('.route-event')).toBeVisible();const before=await read();assert.equal(Object.hasOwn(before,'habitat'),false);write('habitat-native-before-upgrade.json',before);
  await browser.close();browser=null;mutate('shell','am','force-stop',pkg);mutate('install','-r',apk);await foreground();await connect();assert.deepEqual(stable(await read()),stable(E.validateSave(E.serialize(before))));write('habitat-native-after-upgrade.json',await read());console.log('Upgrade 1.15.1 → 1.16.0 preserved the complete offline save and migrated the memory book.');
  await nav('island');await click(page.locator('.island-pet[data-id="mossfox"]'));await click(page.getByRole('button',{name:'Rủ Cáo Mầm chơi với đồ trang trí',exact:true}));await play('shade-nap');await touchRecord();
  const first=await read();assert.equal(first.pets[0].bond,22);assert.deepEqual(first.ruins,before.ruins);assert.deepEqual(first.resources,before.resources);screenshot('recorded-nap');
  await menu();await back();await expect(page.locator('.habitat-scene')).toBeVisible();await back();await expect(page.locator('.habitat-scene')).toHaveCount(0);await expect(page.locator('.game-lobby')).toBeVisible();
  await book();await play('flower-sniff');await nativeFocus();mutate('shell','input','keyevent','3');await expect.poll(()=>readAdb('shell','dumpsys','activity','activities'),{timeout:30000}).toMatch(/topResumedActivity=.*com\.android\.launcher3/);await expect.poll(()=>page.evaluate(()=>document.hidden)).toBe(true);
  const held=await page.locator('[data-habitat-progress]').getAttribute('style');await delay(1500);assert.equal(await page.locator('[data-habitat-progress]').getAttribute('style'),held);assert.deepEqual((await read()).habitat,first.habitat);
  await foreground();await expect(page.locator('.habitat-scene')).toBeVisible();await touchRecord();const second=await read();assert.equal(second.pets[0].bond,24);assert.equal(Object.keys(second.habitat.discovered).length,2);screenshot('recorded-flowers');
  await restart();await expect(page.locator('.route-event')).toBeVisible();assert.deepEqual(stable(await read()),stable(second));await book();await click(page.locator('[data-action="habitat-filter"][data-id="found"]'));await expect(page.locator('.habitat-card')).toHaveCount(2);screenshot('book');await play('shade-nap');await expect(page.locator('[data-action="habitat-scene-record"]')).toBeDisabled();assert.deepEqual((await read()).habitat,second.habitat);
  const controls=await page.locator('.habitat-scene button').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {action:e.dataset.action,width:b.width,height:b.height,reachable:b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight&&!!hit&&e.contains(hit)};}));assert.ok(controls.every(b=>b.reachable&&b.width>=44&&b.height>=44));
  const installedPath=readAdb('shell','pm','path',pkg).split('\n')[0].replace('package:','').trim(),installed=readAdb('shell','sha256sum',installedPath).split(' ')[0],hash=crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');assert.equal(installed,hash);assert.match(readAdb('shell','dumpsys','connectivity'),/Active default network: none/);assert.deepEqual(errors,[]);
  write(`ANDROID-HABITAT-${version}.json`,{version,versionCode:22,upgrade:'1.15.1 → 1.16.0',androidApi:Number(readAdb('shell','getprop','ro.build.version.sdk')),emulator:'SpiritIslesAudit110',legacyBookMigrated:true,priorSavePreserved:true,routeEventAndRngPreserved:true,resourcesAndTeamPreserved:true,recordedMemories:2,bondAwarded:4,nativeTouchRecord:true,nativeBackClosesMenuThenScene:true,nativeHomePausesObservation:true,nativeResumeKeepsScene:true,forceStopPreservesProgress:true,replayCannotReclaim:true,offline:true,controls,installedApkSha256:hash,consoleErrors:errors,systemUiRecoveries:recoveries,physicalPhoneTested:false,completedAt:new Date().toISOString()});console.log('Android offline memories, native touch, Back/HOME, force-stop, replay and APK hash passed.');
}finally{if(browser)await browser.close();}
