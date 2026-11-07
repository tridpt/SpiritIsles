import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import * as E from '../web/js/engine.js';
import {squadReady} from '../tests/squad-fixtures.mjs';
import {discoverMoment} from '../web/js/habitat-engine.js';

const version='1.18.0',apk=`dist/DaoLinhThu-${version}.apk`,adb='C:/Users/ASUS/AppData/Local/Android/Sdk/platform-tools/adb.exe',serial='emulator-5580',pkg='vn.spiritisles.game';
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
      mutate('shell','uiautomator','dump','/sdcard/roles-audit.xml');const xml=readAdb('shell','cat','/sdcard/roles-audit.xml');assert.match(xml,/System UI (?:isn't|is not) responding/);
      const m=xml.match(/<node[^>]*resource-id="android:id\/aerr_close"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);assert.ok(m);mutate('shell','input','tap',String(Math.floor((+m[1]+ +m[3])/2)),String(Math.floor((+m[2]+ +m[4])/2)));recoveries++;
    }else if(focus.includes(pkg))return;
    await delay(500);
  }
  assert.fail('game must hold native focus');
}
async function foreground(){mutate('shell','am','start','-n',`${pkg}/.MainActivity`);await expect.poll(()=>readAdb('shell','dumpsys','activity','activities'),{timeout:30000}).toMatch(/topResumedActivity=.*vn\.spiritisles\.game/);await nativeFocus();}
async function disconnect(){const b=browser;browser=null;if(b)await Promise.race([b.close().catch(()=>{}),delay(1500)]);}
async function restart(){await disconnect();mutate('shell','am','force-stop',pkg);await foreground();await connect();}
const read=async()=>JSON.parse(await page.evaluate(()=>AndroidApp.readSave())).state;
async function click(locator){owned();await locator.click();}
async function menu(){await click(page.getByRole('button',{name:'Mở menu đảo',exact:true}));await expect(page.locator('.island-menu[open]')).toBeVisible();}
async function back(){await nativeFocus();mutate('shell','input','keyevent','4');}
async function screenshot(name){await nativeFocus();owned();fs.writeFileSync(`dist/screenshots/roles-native-${name}-${version}.png`,execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{windowsHide:true,timeout:30000}));}
async function touch(locator){
  await nativeFocus();await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox(),cdp=await page.context().newCDPSession(page);
  owned();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});owned();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
}
try{
  let ready=false;for(let i=0;i<100;i++){try{if(readAdb('shell','getprop','sys.boot_completed')==='1'&&/phone: found/.test(readAdb('shell','service','check','phone'))){ready=true;break;}}catch{}await delay(600);}assert.ok(ready);owned();
  mutate('install','-r','-d','dist/DaoLinhThu-1.17.0.apk');mutate('shell','wm','size','390x900');mutate('shell','wm','density','160');mutate('shell','svc','wifi','disable');mutate('shell','svc','data','disable');mutate('shell','settings','put','global','mobile_data','0');await restart();
  await delay(650);if(await page.locator('#game-dialog[open] .offline-welcome').isVisible())await click(page.locator('#game-dialog [data-action="close-modal"]'));
  const fixture=squadReady('explore',['pebbleturtle','axolotl','cottonbun']);fixture.expedition.power=120;fixture.expedition.battle.power=80;fixture.expedition.battle.tactics.cooldowns.axolotl=2;fixture.expedition.squad.allies[0].cover=1;fixture.expedition.squad.allies[0].ward=3;discoverMoment(fixture,'mossfox','shade-nap');
  await menu();await click(page.getByRole('button',{name:'Cài đặt',exact:true}));owned();await page.evaluate(raw=>{const input=document.querySelector('#import-file'),transfer=new DataTransfer();transfer.items.add(new File([raw],'roles-audit.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));},E.serialize(fixture));await click(page.locator('[data-action="confirm-import"]'));await expect(page.locator('.battle-arena')).toBeVisible();const before=await read();write(`roles-native-before-upgrade-${version}.json`,before);
  await disconnect();mutate('shell','am','force-stop',pkg);mutate('install','-r',apk);await foreground();await connect();assert.deepEqual(stable(await read()),stable(before));write(`roles-native-after-upgrade-${version}.json`,await read());console.log('Offline 1.17.0 → 1.18.0 upgrade preserves the active 3v3 battle, HP, ward, cover, cooldowns, memories and resources.');
  owned();await page.evaluate(()=>{Math.random=()=>.5;});await click(page.locator('[data-action="active-battle"][data-id="explore"]').first());await expect(page.locator('.squad-unit')).toHaveCount(6);await expect(page.locator('[data-move="pet:axolotl"]')).toBeDisabled();
  await touch(page.locator('[data-move="pet:cottonbun"]'));await expect(page.locator('.duel-preview-note')).toContainText('Tiếp sức: Kỳ Nhông Mây giảm thêm 1 lượt chờ');await back();await expect(page.locator('.duel-meter')).toHaveCount(0);assert.deepEqual((await read()).expedition,before.expedition);
  const expected=structuredClone(before),support=E.battleTurn(expected,{move:'pet:cottonbun',foe:'enemy-0',stance:'balanced'},()=>.5);assert.equal(support.haste,1);
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));await touch(page.locator('[data-move="pet:cottonbun"]'));await touch(page.locator('[data-duel="skip"]'));await expect(page.locator('.duel-team-aura[data-caster="cottonbun"]')).toHaveAttribute('data-recipient','axolotl');await page.clock.runFor(410);await screenshot('support');await page.clock.runFor(850);
  const afterSupport=await read();assert.deepEqual(afterSupport.expedition,expected.expedition);assert.equal(afterSupport.expedition.battle.tactics.cooldowns.axolotl,0);assert.equal(afterSupport.expedition.battle.round,before.expedition.battle.round+1);await expect(page.locator('[data-move="pet:axolotl"]')).toBeEnabled();
  await touch(page.locator('[data-friend="cottonbun"]'));const healedExpected=structuredClone(afterSupport),healing=E.battleTurn(healedExpected,{move:'pet:axolotl',ally:'cottonbun',foe:'enemy-0',stance:'balanced'},()=>.5);assert.ok(healing.overhealWard>0);
  await touch(page.locator('[data-move="pet:axolotl"]'));await expect(page.locator('.duel-preview-note')).toContainText('Dưỡng hộ: +');await touch(page.locator('[data-duel="skip"]'));await expect(page.locator('.duel-team-aura[data-caster="axolotl"]')).toHaveAttribute('data-recipient','cottonbun');await page.clock.runFor(410);await screenshot('overheal');await page.clock.runFor(850);
  const after=await read();assert.deepEqual(after.expedition,healedExpected.expedition);assert.deepEqual(after.resources,before.resources);assert.deepEqual(after.habitat,before.habitat);assert.equal(after.expedition.battle.focus,afterSupport.expedition.battle.focus-2);assert.equal(after.expedition.battle.round,before.expedition.battle.round+2);E.validateSave(E.serialize(after));write(`roles-native-after-casts-${version}.json`,after);
  await back();await expect(page.locator('#combat-stage')).not.toBeVisible();await restart();assert.deepEqual(stable(await read()),stable(after));await click(page.locator('[data-action="active-battle"][data-id="explore"]').first());await expect(page.locator('[data-friend="cottonbun"] [data-unit-hp]')).toContainText(`🛡 ${healing.overhealWard}`);await screenshot('restored');
  const controls=await page.locator('.squad-unit').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect();return {id:e.dataset.unit,width:b.width,height:b.height,inViewport:b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight};}));assert.ok(controls.every(b=>b.inViewport));
  const installedPath=readAdb('shell','pm','path',pkg).split('\n')[0].replace('package:','').trim(),installed=readAdb('shell','sha256sum',installedPath).split(' ')[0],hash=crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');assert.equal(installed,hash);assert.match(readAdb('shell','dumpsys','connectivity'),/Active default network: none/);assert.deepEqual(errors,[]);
  write(`ANDROID-ROLES-${version}.json`,{version,versionCode:25,upgrade:'1.17.0 → 1.18.0',androidApi:Number(readAdb('shell','getprop','ro.build.version.sdk')),emulator:'SpiritIslesAudit110',priorSavePreserved:true,activeSquadPreserved:true,individualHpWardCoverCooldownPreserved:true,memoriesAndResourcesPreserved:true,supportExtraCooldownReduction:1,supportEnablesNextCast:true,overhealWard:healing.overhealWard,supportAndHealAurasReachRecipients:true,nativeTouchCommit:true,nativeBackCancelsPreview:true,actionsCommitted:2,healEnergySpent:2,forceStopPreservesIndividualHpAndWards:true,offline:true,unitBounds:controls,installedApkSha256:hash,consoleErrors:errors,systemUiAnrRecoveries:recoveries,physicalPhoneTested:false,completedAt:new Date().toISOString()});console.log('Android role skills, targets, native Back, offline upgrade, force-stop and APK hash passed.');
}finally{
  const closing=disconnect();try{mutate('emu','kill');}catch{}await closing;
}
