import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import * as E from '../web/js/engine.js';
import {project} from '../web/js/island-layout.js';
import {eventFixture} from '../tests/ruins-route-fixtures.mjs';

const version='1.15.0',apk=`dist/DaoLinhThu-${version}.apk`,adb='C:/Users/ASUS/AppData/Local/Android/Sdk/platform-tools/adb.exe',serial='emulator-5580',pkg='vn.spiritisles.game';
const readAdb=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true,timeout:60000,stdio:['ignore','pipe','pipe']}).trim();
const owned=()=>assert.equal(readAdb('emu','avd','name').split(/\r?\n/)[0].trim(),'SpiritIslesAudit110');
const mutate=(...args)=>{owned();return readAdb(...args);};
const stable=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='lastSeen'));
const write=(name,data)=>fs.writeFileSync(`dist/${name}`,JSON.stringify(data,null,2)+'\n');
let browser,page,recoveries=0;const errors=[];
async function connect(){
 browser=null;
 for(let i=0;i<70;i++){try{const pid=readAdb('shell','pidof',pkg);mutate('forward','tcp:9228',`localabstract:webview_devtools_remote_${pid}`);browser=await chromium.connectOverCDP('http://127.0.0.1:9228',{noDefaults:true,timeout:1800});break;}catch{await delay(400);}}
 assert.ok(browser);page=browser.contexts()[0].pages()[0]||await browser.contexts()[0].waitForEvent('page',{timeout:30000});page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));await page.waitForSelector('.game-hud');await page.evaluate(()=>document.fonts.ready);
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
 mutate('install','-r','-d','dist/DaoLinhThu-1.14.0.apk');mutate('shell','wm','size','320x720');mutate('shell','wm','density','160');mutate('shell','svc','wifi','disable');mutate('shell','svc','data','disable');mutate('shell','settings','put','global','mobile_data','0');await restart();await nativeFocus();
 const fixture=eventFixture('chest');delete fixture.islandLayout;fixture.settings.motion=true;
 await menu();owned();await page.getByRole('button',{name:'Cài đặt',exact:true}).click();owned();await page.evaluate(raw=>{const input=document.querySelector('#import-file'),transfer=new DataTransfer();transfer.items.add(new File([raw],'island-layout-audit.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));},E.serialize(fixture));owned();await page.locator('[data-action="confirm-import"]').click();await expect(page.locator('.route-event')).toBeVisible();const before=await read();assert.equal(Object.hasOwn(before,'islandLayout'),false);write('island-layout-native-before.json',before);
 await browser.close();browser=null;mutate('shell','am','force-stop',pkg);mutate('install','-r',apk);await foreground();await connect();
 assert.deepEqual(stable(await read()),stable(E.validateSave(E.serialize(before))));write('island-layout-native-after-upgrade.json',await read());console.log('1.14.0 → 1.15.0 keeps the complete save and migrates a legacy island offline.');
 await nav('island');await expect(page.locator('.mobile-nav,.desktop-nav,.game-dock')).toHaveCount(0);owned();await page.getByRole('button',{name:'Chỉnh đảo',exact:true}).click();await expect(page.locator('.island-editor')).toHaveAttribute('data-zoom',/^\d+\.\d+$/);
 const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));assert.equal(viewport.width,320);
 const controls=await page.locator('.editor-heading button,.editor-tools button,.editor-inspector button').evaluateAll(es=>es.map(el=>{const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {name:el.getAttribute('aria-label')||el.textContent.trim(),width:b.width,height:b.height,inViewport:b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight,tappable:!!hit&&el.contains(hit)};}));assert.ok(controls.every(c=>c.width>=44&&c.height>=44&&c.inViewport&&c.tappable));
 const initial=(await read()).islandLayout,bounds=await page.locator('.editor-world').boundingBox(),g=project(7,4),from={x:bounds.x+g.x*bounds.width/1000,y:bounds.y+g.y*bounds.width/1000},cdp=await page.context().newCDPSession(page);
 const touch=(type,points)=>{owned();return cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});};
 await touch('touchStart',[from]);await touch('touchMove',[{x:from.x,y:from.y+25}]);await touch('touchCancel',[]);await expect(page.locator('.placement-ghost')).toHaveCount(0);await expect(page.locator('[data-editor-saved]')).toHaveText('Bố cục đã lưu');
 await touch('touchStart',[from]);await touch('touchMove',[{x:from.x,y:from.y+30*bounds.width/1000}]);await touch('touchEnd',[]);await cdp.detach();await expect(page.locator('[data-editor-saved]')).toContainText('chưa lưu');assert.deepEqual((await read()).islandLayout,initial);
 owned();await page.locator('[data-action="island-edit-save"]').click();const saved=await read();assert.deepEqual(saved.islandLayout.placed.find(p=>p.id==='base-flowers'),{id:'base-flowers',type:'flowers',x:8,y:5,rotation:0});assert.deepEqual(saved.ruins,before.ruins);assert.deepEqual(saved.resources,before.resources);assert.deepEqual(saved.pets,before.pets);
 console.log('Native touch drag moves one decoration, cancellation keeps the saved layout, production and route.');
 owned();await page.getByRole('button',{name:'Chỉnh đảo',exact:true}).click();owned();await page.locator('.island-layout-layer [data-layout-id="base-nursery"]').focus();owned();await page.keyboard.press('Enter');owned();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-editor-saved]')).toContainText('chưa lưu');
 await back();await expect(page.locator('.island-discard')).toBeVisible();await back();await expect(page.locator('.island-discard')).toHaveCount(0);await expect(page.locator('.island-editor')).toBeVisible();
 await nativeFocus();mutate('shell','input','keyevent','3');await expect.poll(()=>readAdb('shell','dumpsys','activity','activities'),{timeout:30000}).toMatch(/topResumedActivity=.*com\.android\.launcher3/);await expect.poll(()=>page.evaluate(()=>document.hidden)).toBe(true);
 await foreground();await expect(page.locator('[data-editor-saved]')).toContainText('chưa lưu');assert.deepEqual((await read()).islandLayout,saved.islandLayout);await page.screenshot({path:`dist/screenshots/island-editor-native-${version}.png`});
 await back();await expect(page.locator('.island-discard')).toBeVisible();owned();await page.getByRole('button',{name:'Bỏ thay đổi',exact:true}).click();await expect(page.locator('.game-lobby')).toBeVisible();assert.deepEqual((await read()).islandLayout,saved.islandLayout);
 await restart();assert.deepEqual(stable(await read()),stable(saved));await expect(page.locator('.route-event')).toBeVisible();await nav('island');await page.screenshot({path:`dist/screenshots/island-layout-native-${version}.png`});
 await menu();await back();await expect(page.locator('.game-lobby')).toBeVisible();await menu();owned();await page.getByRole('button',{name:'Cài đặt',exact:true}).click();await expect(page.locator('.settings-brand')).toContainText(version);await back();
 const installedPath=readAdb('shell','pm','path',pkg).split('\n')[0].replace('package:','').trim(),installed=readAdb('shell','sha256sum',installedPath).split(' ')[0],hash=crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');assert.equal(installed,hash);assert.match(readAdb('shell','dumpsys','connectivity'),/Active default network: none/);assert.deepEqual(errors,[]);
 write(`ANDROID-ISLAND-LAYOUT-${version}.json`,{version,versionCode:20,upgrade:'1.14.0 → 1.15.0',androidApi:Number(readAdb('shell','getprop','ro.build.version.sdk')),emulator:'SpiritIslesAudit110',legacyLayoutMigrated:true,priorSavePreserved:true,routeEventAndRngPreserved:true,resourcesAndPetsPreserved:true,controls,viewport,nativeTouchDragMovesOnce:true,nativeTouchCancelSafe:true,explicitSaveRequired:true,nativeBackWarnsBeforeDiscard:true,nativeBackClosesMenuFirst:true,nativeHomeKeepsDraft:true,nativeForceStopPreserves:true,offline:true,noBottomNavigation:true,installedApkSha256:hash,consoleErrors:errors,systemUiRecoveries:recoveries,physicalPhoneTested:false,completedAt:new Date().toISOString()});
 console.log('Android offline layout, upgrade, Back/HOME, force-stop and installed APK hash passed.');
}finally{if(browser)await browser.close();}
