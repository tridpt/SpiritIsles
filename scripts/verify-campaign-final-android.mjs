import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import {serialize,validateSave} from '../web/js/engine.js';

const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const prior=read(`dist/campaign-before-copy-fix-${version}/BUNDLE-CHECK-${version}.json`);
const bundle=read(`dist/BUNDLE-CHECK-${version}.json`),audit=read(`dist/ANDROID-CAMPAIGN-${version}.json`);
assert.equal(audit.installedApkSha256,prior.sha256);
assert.equal(bundle.webAssetCount,prior.webAssetCount);
const changed=bundle.assets.filter(a=>prior.assets.find(p=>p.path===a.path)?.sha256!==a.sha256).map(a=>a.path).sort();
assert.deepEqual(changed,['js/campaign-ui.js','shiny.css']);
const oldHint='Mở Chỉnh đảo → Kho đồ → Kỷ vật để đặt lên đảo.',newHint='Mở Chỉnh đảo → Kho đồ → Báu vật để đặt lên đảo.';
const ui=fs.readFileSync('web/js/campaign-ui.js','utf8');
assert.ok(ui.includes(newHint));
assert.equal(crypto.createHash('sha256').update(ui.replace(newHint,oldHint)).digest('hex'),prior.assets.find(a=>a.path==='js/campaign-ui.js').sha256);
const oldCss=fs.readFileSync(`dist/campaign-before-copy-fix-${version}/shiny-before-touch-fix.css`,'utf8');
const closeRule='.game-dialog:has(.prism-compare,.prism-help,.prism-reward-card) .modal-header>.icon-button{width:44px;height:44px;min-width:44px;min-height:44px;flex-shrink:0}';
assert.equal(crypto.createHash('sha256').update(oldCss).digest('hex'),prior.assets.find(a=>a.path==='shiny.css').sha256);
assert.equal(fs.readFileSync('web/shiny.css','utf8').trimEnd(),oldCss.trimEnd()+'\n'+closeRule);

const adb='C:/Users/ASUS/AppData/Local/Android/Sdk/platform-tools/adb.exe',serial='emulator-5580',pkg='vn.spiritisles.game';
const readAdb=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true,timeout:60000,stdio:['ignore','pipe','pipe']}).trim();
const owned=()=>assert.equal(readAdb('emu','avd','name').split(/\r?\n/)[0].trim(),'SpiritIslesAudit110');
const mutate=(...args)=>{owned();return readAdb(...args);};
let browser,page,completed=false,recoveries=0,fixtureRestored=false;const errors=[];
async function disconnect(){if(browser)await browser.close().catch(()=>{});browser=null;}
async function focus(){
  for(let i=0;i<30;i++){
    const current=readAdb('shell','dumpsys','window','displays').split('\n').find(l=>l.includes('mCurrentFocus='))||'';
    if(current.includes(pkg))return;
    if(current.includes('Application Not Responding: com.android.systemui')){
      mutate('shell','uiautomator','dump','/sdcard/campaign-final.xml');
      const xml=readAdb('shell','cat','/sdcard/campaign-final.xml');assert.match(xml,/System UI (?:isn't|is not) responding/);
      const close=xml.match(/<node[^>]*resource-id="android:id\/aerr_close"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);assert.ok(close);
      mutate('shell','input','tap',String(Math.floor((+close[1]+ +close[3])/2)),String(Math.floor((+close[2]+ +close[4])/2)));recoveries++;
      mutate('shell','am','start','-n',`${pkg}/.MainActivity`);
    }
    await delay(500);
  }
  assert.fail('Game must hold native focus');
}
async function foreground(){
  mutate('shell','am','start','-n',`${pkg}/.MainActivity`);await focus();
  for(let i=0;i<30;i++)try{
    const pid=readAdb('shell','pidof',pkg);mutate('forward','tcp:9228',`localabstract:webview_devtools_remote_${pid}`);
    browser=await chromium.connectOverCDP('http://127.0.0.1:9228',{noDefaults:true,timeout:2000});
    page=browser.contexts()[0].pages().find(p=>p.url()==='https://spirit.isles/index.html');assert.ok(page);
    await page.waitForSelector('.game-hud',{timeout:6000});await page.evaluate(()=>document.fonts.ready);
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});return;
  }catch{await disconnect();await delay(500);}
  assert.fail('Game WebView did not connect');
}
async function tap(locator){
  await focus();await expect(locator).toBeVisible();owned();
  const p=await locator.evaluate(e=>{e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return{x,y,clear:e.contains(document.elementFromPoint(x,y))};});assert.ok(p.clear);
  const cdp=await page.context().newCDPSession(page);
  try{owned();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});owned();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}finally{await cdp.detach();}
}
const save=async()=>JSON.parse(await page.evaluate(()=>AndroidApp.readSave())).state;
const stable=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='lastSeen'));
try{
  let ready=false;for(let i=0;i<40;i++){try{owned();if(readAdb('shell','getprop','sys.boot_completed')==='1'){ready=true;break;}}catch{}await delay(1000);}assert.ok(ready,'Owned emulator must finish booting');
  if(!readAdb('shell','pm','path',pkg)){
    mutate('install',`dist/campaign-before-copy-fix-${version}/DaoLinhThu-${version}.apk`);fixtureRestored=true;
  }
  mutate('shell','svc','wifi','disable');mutate('shell','svc','data','disable');await foreground();
  if(fixtureRestored){
    const fixture=validateSave(serialize(read(`dist/campaign-native-before-upgrade-${version}.json`)));
    owned();await page.evaluate(raw=>{if(!AndroidApp.storeSave(raw))throw new Error('Could not restore owned audit fixture');},serialize(fixture));
    owned();await page.reload();await page.waitForSelector('.game-hud');
  }
  const before=await save();await disconnect();mutate('shell','am','force-stop',pkg);
  mutate('install','-r',`dist/DaoLinhThu-${version}.apk`);await foreground();assert.deepEqual(stable(await save()),stable(before));
  if(await page.locator('#game-dialog[open] .offline-welcome').isVisible())await tap(page.getByRole('button',{name:'Đóng',exact:true}));
  await tap(page.getByRole('button',{name:'Mở menu đảo',exact:true}));await tap(page.locator('.island-menu [data-page="campaign"]'));
  await expect(page.locator('.campaign-node')).toHaveCount(8);
  const debuggerSession=await page.context().newCDPSession(page);let uiScript;
  debuggerSession.on('Debugger.scriptParsed',s=>{if(s.url==='https://spirit.isles/js/campaign-ui.js')uiScript=s.scriptId;});
  try{await debuggerSession.send('Debugger.enable');await expect.poll(()=>!!uiScript).toBe(true);const packaged=await debuggerSession.send('Debugger.getScriptSource',{scriptId:uiScript});assert.equal(packaged.scriptSource,ui);}finally{await debuggerSession.detach();}
  await tap(page.getByRole('button',{name:'Mở menu đảo',exact:true}));await tap(page.locator('.island-menu [data-page="shiny"]'));
  await tap(page.locator('.prism-specimen .prism-portrait').first());
  const closeButton=page.getByRole('button',{name:'Đóng',exact:true}),touchSize=await closeButton.evaluate(e=>{const r=e.getBoundingClientRect();return{width:r.width,height:r.height};});
  assert.ok(touchSize.width>=44&&touchSize.height>=44);await tap(closeButton);
  const installed=readAdb('shell','pm','path',pkg).split('\n')[0].replace('package:','').trim();
  const hash=readAdb('shell','sha256sum',installed).split(' ')[0];assert.equal(hash,bundle.sha256);
  assert.match(readAdb('shell','dumpsys','package',pkg),/versionCode=34/);assert.match(readAdb('shell','dumpsys','connectivity'),/Active default network: none/);assert.deepEqual(errors,[]);
  const report={version,installedApkSha256:hash,fullAuditApkSha256:audit.installedApkSha256,changedWebAssets:changed,onlyUiPolishChanged:true,allOtherWebAssetsIdentical:true,auditFixtureRestoredOnEmptyEmulator:fixtureRestored,savePreserved:true,nativeTouchCampaignMap:true,packagedHintVerified:true,shinyCloseTouchSize:touchSize,offline:true,consoleErrors:errors,systemUiAnrRecoveries:recoveries,physicalPhoneTested:false,completedAt:new Date().toISOString()};
  fs.writeFileSync(`dist/ANDROID-CAMPAIGN-FINAL-${version}.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));completed=true;
}finally{await disconnect();if(completed)try{mutate('emu','kill');}catch{}}
