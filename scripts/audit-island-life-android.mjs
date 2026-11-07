import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import * as E from '../web/js/engine.js';
import {eventFixture} from '../tests/ruins-route-fixtures.mjs';

const version='1.14.0',apk=`dist/DaoLinhThu-${version}.apk`,adb='C:/Users/ASUS/AppData/Local/Android/Sdk/platform-tools/adb.exe',serial='emulator-5580',pkg='vn.spiritisles.game';
const readAdb=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true,timeout:60000,stdio:['ignore','pipe','pipe']}).trim();
const owned=()=>assert.equal(readAdb('emu','avd','name').split(/\r?\n/)[0].trim(),'SpiritIslesAudit110');
const mutate=(...args)=>{owned();return readAdb(...args);};
const stable=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='lastSeen'));
const write=(name,data)=>fs.writeFileSync(`dist/${name}`,JSON.stringify(data,null,2)+'\n');
let browser,page,recoveries=0;const errors=[];
async function connect(){
 browser=null;
 for(let i=0;i<70;i++){try{const pid=readAdb('shell','pidof',pkg);mutate('forward','tcp:9228',`localabstract:webview_devtools_remote_${pid}`);browser=await chromium.connectOverCDP('http://127.0.0.1:9228',{noDefaults:true,timeout:1800});break;}catch{await delay(400);}}
 assert.ok(browser);page=browser.contexts()[0].pages()[0];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));await page.waitForSelector('.game-hud');await page.evaluate(()=>document.fonts.ready);
}
async function nativeFocus(){
 for(let i=0;i<30;i++){
  const focus=readAdb('shell','dumpsys','window','displays').split('\n').find(l=>l.includes('mCurrentFocus='))||'';
  if(focus.includes('Application Not Responding: com.android.systemui')){
   mutate('shell','uiautomator','dump','/sdcard/island-life-audit.xml');const xml=readAdb('shell','cat','/sdcard/island-life-audit.xml');assert.match(xml,/System UI (?:isn't|is not) responding/);
   const m=xml.match(/<node[^>]*resource-id="android:id\/aerr_close"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);assert.ok(m);mutate('shell','input','tap',String(Math.floor((+m[1]+ +m[3])/2)),String(Math.floor((+m[2]+ +m[4])/2)));recoveries++;
  }else if(focus.includes(pkg))return;
  await delay(500);
 }
 assert.fail('game must hold native focus');
}
async function foreground(){mutate('shell','am','start','-n',`${pkg}/.MainActivity`);await expect.poll(()=>readAdb('shell','dumpsys','activity','activities'),{timeout:30000}).toMatch(/topResumedActivity=.*vn\.spiritisles\.game/);}
async function restart(){if(browser)await browser.close();browser=null;mutate('shell','am','force-stop',pkg);await foreground();await connect();}
const read=async()=>JSON.parse(await page.evaluate(()=>AndroidApp.readSave())).state;
async function menu(){owned();await page.getByRole('button',{name:'Mở menu đảo',exact:true}).click();await expect(page.locator('.island-menu[open]')).toBeVisible();}
async function nav(id){await menu();owned();await page.locator(`.game-menu-grid [data-page="${id}"]`).click();await expect(page.locator('.game-shell')).toHaveAttribute('data-screen',id);}
async function back(){await nativeFocus();mutate('shell','input','keyevent','4');}
try{
 let ready=false;for(let i=0;i<100;i++){try{if(readAdb('shell','getprop','sys.boot_completed')==='1'&&/phone: found/.test(readAdb('shell','service','check','phone'))){ready=true;break;}}catch{}await delay(600);}assert.ok(ready);owned();
 mutate('install','-r','-d','dist/DaoLinhThu-1.13.1.apk');mutate('shell','wm','size','320x720');mutate('shell','wm','density','160');mutate('shell','svc','wifi','disable');mutate('shell','svc','data','disable');mutate('shell','settings','put','global','mobile_data','0');await restart();await nativeFocus();
 const fixture=eventFixture('chest');fixture.pets[0].bond=35;fixture.resources.food=140;fixture.settings.motion=true;E.validateSave(E.serialize(fixture));
 await menu();owned();await page.getByRole('button',{name:'Cài đặt',exact:true}).click();owned();await page.evaluate(raw=>{const input=document.querySelector('#import-file'),transfer=new DataTransfer();transfer.items.add(new File([raw],'island-life-audit.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));},E.serialize(fixture));owned();await page.locator('[data-action="confirm-import"]').click();await expect(page.locator('.route-event')).toBeVisible();const before=await read();write('island-life-native-before.json',before);
 await browser.close();browser=null;mutate('shell','am','force-stop',pkg);mutate('install','-r',apk);await foreground();await connect();assert.deepEqual(stable(await read()),stable(before));write('island-life-native-after-upgrade.json',await read());console.log('1.13.1 → 1.14.0 preserves the complete prior save offline.');
 await nav('island');await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','roaming');await expect(page.locator('.mobile-nav,.desktop-nav,.game-dock')).toHaveCount(0);
 owned();await page.locator('.island-pet[data-id="mossfox"]').click();await expect(page.locator('#island-care')).toBeVisible();await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','interacting');
 const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));assert.equal(viewport.width,320);
 const careControls=await page.locator('#island-care button').evaluateAll(es=>es.map(el=>{const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {name:el.getAttribute('aria-label'),width:b.width,height:b.height,inViewport:b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight,tappable:!!hit&&el.contains(hit)};}));assert.ok(careControls.every(c=>c.width>=44&&c.height>=44&&c.inViewport&&c.tappable));
 owned();await page.getByRole('button',{name:'Vuốt ve Cáo Mầm',exact:true}).click();const patted=await read();assert.equal(patted.pets[0].bond,before.pets[0].bond+1);owned();await page.getByRole('button',{name:'Vuốt ve Cáo Mầm',exact:true}).click();assert.equal((await read()).pets[0].bond,patted.pets[0].bond);
 await page.screenshot({path:`dist/screenshots/island-care-native-${version}.png`});
 const expected=structuredClone(patted);E.feed(expected,expected.team[1]);
 const from=await page.locator('.island-food').boundingBox(),to=await page.locator(`.island-pet[data-id="${expected.team[1]}"]`).boundingBox(),cdp=await page.context().newCDPSession(page);
 const touch=(type,points)=>{owned();return cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y])=>({x,y}))});};
 await touch('touchStart',[[from.x+from.width/2,from.y+from.height/2]]);await touch('touchMove',[[from.x+from.width/2+15,from.y+from.height/2+10]]);await touch('touchMove',[[to.x+to.width/2,to.y+to.height*.65]]);await touch('touchEnd',[]);await cdp.detach();
 await expect.poll(async()=>(await read()).stats.feeds).toBe(expected.stats.feeds);const fed=await read();assert.deepEqual(fed.pets,expected.pets);assert.deepEqual(fed.resources,expected.resources);assert.deepEqual(fed.ruins,before.ruins);await expect(page.locator('.island-food-ghost')).toHaveCount(0);
 await back();await expect(page.locator('#island-care')).toBeHidden();await expect(page.locator('.game-lobby')).toBeVisible();await menu();await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','paused');await back();await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','roaming');console.log('Native touch drag feeds once; petting, care controls and Back work at 320 px.');
 owned();await page.locator('.island-pet[data-id="mossfox"]').click();await nativeFocus();mutate('shell','input','keyevent','3');await expect.poll(()=>readAdb('shell','dumpsys','activity','activities'),{timeout:30000}).toMatch(/topResumedActivity=.*com\.android\.launcher3/);
 await expect.poll(()=>page.evaluate(()=>document.querySelector('.game-lobby').dataset.islandLife),{timeout:10000}).toBe('paused');await foreground();await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','roaming');assert.deepEqual(stable(await read()),stable(fed));
 await restart();assert.deepEqual(stable(await read()),stable(fed));await expect(page.locator('.route-event')).toBeVisible();await nav('island');owned();await page.locator('.island-pet[data-id="mossfox"]').click();owned();await page.getByRole('button',{name:'Vuốt ve Cáo Mầm',exact:true}).click();assert.equal((await read()).pets[0].bond,fed.pets[0].bond);await back();
 await menu();owned();await page.getByRole('button',{name:'Cài đặt',exact:true}).click();await expect(page.locator('.settings-brand')).toContainText(version);owned();await page.getByRole('switch',{name:'Chuyển động',exact:true}).click();owned();await page.getByRole('button',{name:'Đóng',exact:true}).click();await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','still');
 await page.screenshot({path:`dist/screenshots/island-life-native-${version}.png`});
 const installedPath=readAdb('shell','pm','path',pkg).split('\n')[0].replace('package:','').trim(),installed=readAdb('shell','sha256sum',installedPath).split(' ')[0],hash=crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');assert.equal(installed,hash);assert.match(readAdb('shell','dumpsys','connectivity'),/Active default network: none/);assert.deepEqual(errors,[]);
 write(`ANDROID-ISLAND-LIFE-${version}.json`,{version,versionCode:19,upgrade:'1.13.1 → 1.14.0',androidApi:Number(readAdb('shell','getprop','ro.build.version.sdk')),emulator:'SpiritIslesAudit110',priorSavePreserved:true,routeEventAndRngPreserved:true,careControls,viewport,pettingSaved:true,pettingCooldownPersists:true,nativeTouchDragFeedsOnce:true,nativeBackClosesCareFirst:true,nativeBackClosesMenuFirst:true,nativeHomePausesAndPreserves:true,nativeForceStopPreserves:true,reducedMotionWorks:true,offline:true,noBottomNavigation:true,installedApkSha256:hash,consoleErrors:errors,systemUiRecoveries:recoveries,physicalPhoneTested:false,completedAt:new Date().toISOString()});
 console.log('Android offline care, upgrade, Back/HOME, force-stop and installed APK hash passed.');
}finally{if(browser)await browser.close();}
