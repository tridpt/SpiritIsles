import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import * as E from '../web/js/engine.js';
import {squadReady,squadGame} from '../tests/squad-fixtures.mjs';
import {discoverMoment} from '../web/js/habitat-engine.js';
import {autoOrder} from '../web/js/auto-play.js';
import {combatScene} from '../web/js/combat-stage.js';
import {profilePlan} from '../web/js/auto-tactics.js';

const version='1.20.0',apk=`dist/DaoLinhThu-${version}.apk`,adb='C:/Users/ASUS/AppData/Local/Android/Sdk/platform-tools/adb.exe',serial='emulator-5580',pkg='vn.spiritisles.game';
const readAdb=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true,timeout:60000,stdio:['ignore','pipe','pipe']}).trim();
const owned=()=>assert.equal(readAdb('emu','avd','name').split(/\r?\n/)[0].trim(),'SpiritIslesAudit110');
const mutate=(...args)=>{owned();return readAdb(...args);};
const stable=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='lastSeen'));
const write=(name,data)=>fs.writeFileSync(`dist/${name}`,JSON.stringify(data,null,2)+'\n');
const log=message=>{fs.appendFileSync(`dist/NATIVE-TACTICS-PROGRESS-${version}.log`,`${new Date().toISOString()} ${message}\n`);console.log(message);};
let browser,page,recoveries=0,completed=false;const errors=[];
async function connect(){
  browser=null;
  for(let i=0;i<30;i++){
    try{
      const pid=readAdb('shell','pidof',pkg);mutate('forward','tcp:9228',`localabstract:webview_devtools_remote_${pid}`);browser=await chromium.connectOverCDP('http://127.0.0.1:9228',{noDefaults:true,timeout:1800});
      const c=browser.contexts()[0];page=c.pages().find(p=>p.url()==='https://spirit.isles/index.html');
      await page.waitForSelector('.game-hud',{timeout:5000});await page.evaluate(()=>document.fonts.ready);page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));return;
    }catch{if(browser)await Promise.race([browser.close().catch(()=>{}),delay(1500)]);browser=null;await delay(400);}
  }
  assert.fail('could not attach to the loaded game WebView');
}
async function nativeFocus(){
  for(let i=0;i<30;i++){
    const focus=readAdb('shell','dumpsys','window','displays').split('\n').find(l=>l.includes('mCurrentFocus='))||'';
    if(focus.includes('Application Not Responding: com.android.systemui')){
      mutate('shell','uiautomator','dump','/sdcard/auto-audit.xml');const xml=readAdb('shell','cat','/sdcard/auto-audit.xml');assert.match(xml,/System UI (?:isn't|is not) responding/);
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
async function back(){
  await nativeFocus();const snapshot=()=>page.evaluate(()=>({planner:!!document.querySelector('#auto-planner[open]'),stage:!!document.querySelector('#combat-stage[open]'),auto:document.querySelector('[data-duel="auto"]')?.getAttribute('aria-checked'),meter:!!document.querySelector('.duel-meter'),modal:!!document.querySelector('#game-dialog[open]')}));
  const before=await snapshot();mutate('shell','input','keyevent','4');await expect.poll(snapshot,{timeout:12000}).not.toEqual(before);
}
async function screenshot(name){await nativeFocus();owned();fs.writeFileSync(`dist/screenshots/tactics-native-${name}-${version}.png`,execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{windowsHide:true,timeout:30000}));}
async function touch(locator){
  await nativeFocus();let r;
  for(let i=0;i<6;i++){
    r=await locator.evaluate(e=>{const key=e.dataset.duel;if(['auto','speed'].includes(key))e=document.querySelector(`[data-duel="${key}"]`);if(!e?.isConnected)return null;e.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(!r.width||!r.height||!hit||!e.contains(hit))return null;return {x:r.x,y:r.y,width:r.width,height:r.height,key:e.dataset.duel||e.dataset.action||e.dataset.planner,checked:e.getAttribute('aria-checked')};});
    if(r)break;await delay(80);
  }
  assert.ok(r,'native touch must hit the currently connected, visible control');
  log(`Touch ${r.key} ${r.checked||''} at ${Math.round(r.x+r.width/2)},${Math.round(r.y+r.height/2)}`);
  const cdp=await page.context().newCDPSession(page);
  owned();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
}
async function importSave(s){
  E.validateSave(E.serialize(s));await menu();await click(page.getByRole('button',{name:'Cài đặt',exact:true}));owned();await page.evaluate(raw=>{const input=document.querySelector('#import-file'),transfer=new DataTransfer();transfer.items.add(new File([raw],'auto-audit.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));},E.serialize(s));await click(page.locator('[data-action="confirm-import"]'));await expect(page.locator('[data-action="journey-auto"]')).toBeVisible();
}
const auto=()=>page.locator('[data-duel="auto"]');
function replay(s,count){const next=structuredClone(s);for(let i=0;i<count;i++){const {reason,...order}=autoOrder(combatScene(next,'explore'));const result=E.battleTurn(next,order,()=>.5);assert.ok(!result.error,result.error);}return next;}
async function controlledTime(){await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));await page.reload();await page.waitForSelector('.game-hud');owned();await page.evaluate(()=>{Math.random=()=>.5;});}
async function backgrounded(value){await expect.poll(()=>page.evaluate(()=>document.hidden||document.querySelector('#combat-stage')?.classList.contains('auto-paused')),{timeout:15000}).toBe(value);}
try{
  let ready=false;for(let i=0;i<100;i++){try{if(readAdb('shell','getprop','sys.boot_completed')==='1'&&/phone: found/.test(readAdb('shell','service','check','phone'))){ready=true;break;}}catch{}await delay(600);}assert.ok(ready);owned();
  mutate('install','-r','-d','dist/DaoLinhThu-1.19.0.apk');mutate('shell','wm','size','390x900');mutate('shell','wm','density','160');mutate('shell','svc','wifi','disable');mutate('shell','svc','data','disable');mutate('shell','settings','put','global','mobile_data','0');await restart();
  if(await page.locator('#game-dialog[open] .offline-welcome').isVisible())await click(page.locator('#game-dialog [data-action="close-modal"]'));
  const fixture=squadReady('explore',['pebbleturtle','axolotl','cottonbun']);fixture.settings.motion=false;fixture.pets.forEach(p=>p.level=20);fixture.expedition.power=120;fixture.expedition.battle.power=80;fixture.expedition.battle.tactics.cooldowns.axolotl=2;fixture.expedition.squad.allies[0].cover=1;fixture.expedition.squad.allies[0].ward=3;fixture.expedition.squad.allies[0].hp=10;fixture.expedition.hp=fixture.expedition.squad.allies.reduce((n,u)=>n+u.hp,0);discoverMoment(fixture,'mossfox','shade-nap');delete fixture.autoTactics;delete fixture.combatJournal;
  await importSave(fixture);const before=await read();write(`tactics-native-before-upgrade-${version}.json`,before);await disconnect();mutate('shell','am','force-stop',pkg);mutate('install','-r',apk);await foreground();await connect();
  const upgraded=await read(),migrated=E.validateSave(E.serialize(before));assert.deepEqual(stable(upgraded),stable(migrated));log('Offline 1.19 → 1.20 upgrade keeps active squad, ward/cover/cooldowns, pets, memories and resources.');
  await controlledTime();await touch(page.locator('[data-action="active-battle"][data-id="explore"]').first());await touch(page.locator('[data-duel="planner"]'));await touch(page.locator('[data-planner="profile"][data-profile="boss"]'));owned();await page.locator('[data-plan-field="healAt"]').selectOption('40');await touch(page.locator('[data-planner="apply"]'));await touch(page.locator('[data-tab="teams"]'));owned();await page.locator('[data-preset-name="0"]').fill('Săn thủ vệ');await touch(page.locator('[data-planner="save-team"][data-slot="0"]'));await expect(page.locator('[data-planner="load-team"][data-slot="0"]')).toBeDisabled();const configured=await read();assert.deepEqual(configured.autoTactics.plan,{...profilePlan('boss'),healAt:40});assert.deepEqual(configured.autoTactics.slots[0].team,fixture.team);await screenshot('saved-team');await back();await expect(page.locator('#auto-planner')).not.toBeVisible();await expect(auto()).toHaveAttribute('aria-checked','false');
  await touch(auto());await page.clock.runFor(901);const one=await read();assert.equal(one.expedition.battle.round,1);assert.equal(one.combatJournal.active.turns,1);await touch(page.locator('[data-duel="planner"]'));await page.clock.runFor(60000);assert.deepEqual((await read()).expedition,one.expedition);
  mutate('shell','input','keyevent','3');await backgrounded(true);await page.clock.runFor(60000);assert.deepEqual((await read()).expedition,one.expedition);await foreground();await expect(page.locator('#auto-planner')).toBeVisible();await page.clock.runFor(5000);assert.deepEqual((await read()).expedition,one.expedition);
  await touch(page.locator('[data-planner="profile"][data-profile="safe"]'));owned();await page.locator('[data-plan-field="healAt"]').selectOption('70');await touch(page.locator('[data-planner="apply"]'));await back();await expect(auto()).toHaveAttribute('aria-checked','true');await page.clock.runFor(899);assert.equal((await read()).expedition.battle.round,1);await page.clock.runFor(2);assert.equal((await read()).expedition.battle.round,2);await back();await expect(auto()).toHaveAttribute('aria-checked','false');await page.clock.runFor(1500);
  const two=await read(),expected=structuredClone(configured);for(const plan of [configured.autoTactics.plan,{...profilePlan('safe'),healAt:70}]){const {reason,...order}=autoOrder(combatScene(expected,'explore'),{plan});assert.ok(!E.battleTurn(expected,order,()=>.5).error);}assert.deepEqual(two.expedition,expected.expedition);assert.deepEqual(two.combatJournal,expected.combatJournal);await touch(page.locator('[data-duel="reports"]'));await expect(page.locator('[data-report-pet="axolotl"] [data-report-stat="heal"]')).toHaveText(String(two.combatJournal.active.members.find(m=>m.id==='axolotl').heal));await screenshot('report');await back();await back();log('Native touch edits rules/saves a team, pauses AUTO in planner and Home, Back resumes one scheduled turn, support/heal and report match the production engines.');
  await restart();const reopened=await read();assert.deepEqual(stable(reopened),stable(two));await controlledTime();await touch(page.locator('[data-action="active-battle"][data-id="explore"]').first());await expect(auto()).toHaveAttribute('aria-checked','false');await touch(page.locator('[data-duel="planner"]'));await expect(page.locator('[data-plan-field="healAt"]')).toHaveValue('70');await back();await back();
  await click(page.locator('[data-action="retreat"]'));await click(page.locator('[data-action="confirm-retreat"]'));if(await page.locator('#game-dialog[open]').isVisible())await click(page.locator('[data-action="nav"][data-page="island"]').last());
  await menu();await click(page.locator('.island-menu [data-page="pets"]'));await click(page.locator('[data-action="auto-planner"]'));await touch(page.locator('[data-tab="teams"]'));await touch(page.locator('[data-planner="load-team"][data-slot="0"]'));assert.deepEqual((await read()).autoTactics.plan,configured.autoTactics.slots[0].plan);assert.deepEqual((await read()).team,configured.autoTactics.slots[0].team);await back();
  await menu();await click(page.locator('.island-menu [data-page="explore"]'));await click(page.locator('[data-action="auto-expedition"][data-id="forest"]'));await page.clock.runFor(60000);await expect(page.locator('.duel-end h2')).toHaveText('Đã hoàn thành hành trình!');const finished=await read();assert.ok(finished.combatJournal.reports.length>=2);assert.equal(finished.combatJournal.active,null);assert.ok(finished.combatJournal.reports.length<=8);await screenshot('complete');await page.clock.runFor(60000);assert.deepEqual((await read()).resources,finished.resources);E.validateSave(E.serialize(finished));
  await restart();assert.deepEqual((await read()).combatJournal,finished.combatJournal);assert.deepEqual((await read()).autoTactics,finished.autoTactics);const installedPath=readAdb('shell','pm','path',pkg).split('\n')[0].replace('package:','').trim(),installed=readAdb('shell','sha256sum',installedPath).split(' ')[0],hash=crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');assert.equal(installed,hash);assert.match(readAdb('shell','dumpsys','connectivity'),/Active default network: none/);assert.deepEqual(errors,[]);
  write(`ANDROID-AUTO-TACTICS-${version}.json`,{version,versionCode:27,upgrade:'1.19.0 → 1.20.0',androidApi:Number(readAdb('shell','getprop','ro.build.version.sdk')),emulator:'SpiritIslesAudit110',oldSaveMigrated:true,activeSquadWardCoverCooldownPreserved:true,memoriesPetsResourcesPreserved:true,nativeTouchProfilesRulesAndSaveTeam:true,activeTeamSwapsLocked:true,plannerAndHomeSuspendNoCatchup:true,nativeBackClosesPlannerThenStopsAuto:true,autoSupportHealAndReportsMatchEngine:true,presetLoadsAfterRetreat:true,completeJourneyArchivesReports:true,onePayoutOnly:true,forceStopKeepsRulesPresetsAndJournal:true,autoOffOnReopen:true,controlledClockForTurnAssertions:true,offline:true,installedApkSha256:hash,consoleErrors:errors,systemUiAnrRecoveries:recoveries,physicalPhoneTested:false,completedAt:new Date().toISOString()});completed=true;log('Native offline upgrade, settings/presets/report persistence, full AUTO trip and APK hash passed.');
}finally{const closing=disconnect();if(completed)try{mutate('emu','kill');}catch{}await closing;}
