import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const read=name=>JSON.parse(fs.readFileSync(`dist/${name}-${version}.json`,'utf8').replace(/^\uFEFF/,''));
const tap=fs.readFileSync(`dist/ENGINE-${version}.tap`,'utf8');
const engine=Object.fromEntries(['tests','pass','fail','skipped'].map(key=>[key,Number(tap.match(new RegExp('^# '+key+' (\\d+)','m'))?.[1])]));
assert.equal(engine.tests,524);assert.equal(engine.pass,524);assert.equal(engine.fail,0);assert.equal(engine.skipped,0);
const browser=read('BROWSER'),final=read('ISLAND-FRIENDS-FINAL'),native=read('ANDROID-ISLAND-FRIENDS'),bundle=read('BUNDLE-CHECK'),visual=read('ISLAND-FRIENDS-VISUAL'),source=read('SOURCE-CHECK');
function cases(suites){return suites.flatMap(s=>[...(s.specs||[]).flatMap(spec=>(spec.tests||[]).map(t=>({key:`${spec.file}:${spec.title}`,file:spec.file,title:spec.title,status:t.status,attempts:t.results.length}))),...cases(s.suites||[])]);}
const related=cases(browser.suites).filter(c=>!c.file.endsWith('island-friends.spec.mjs')),focused=cases(final.suites);
assert.equal(related.length,44);assert.equal(focused.length,12);
for(const c of [...related,...focused]){assert.equal(c.status,'expected',c.key);assert.equal(c.attempts,1);}
for(const c of cases(browser.suites).filter(c=>c.status!=='expected'))assert.ok(focused.some(f=>f.key===c.key&&f.status==='expected'));
for(const r of [browser,final])for(const k of ['skipped','flaky'])assert.equal(r.stats[k],0);
assert.equal(final.stats.unexpected,0);
assert.equal(native.upgrade,'1.30.0 → '+version);assert.equal(native.physicalPhoneTested,false);assert.deepEqual(native.consoleErrors,[]);
for(const k of ['offline','savePreserved','oldMemoriesPreserved','unresolvedRouteAndRngPreserved','resourcesAndTeamPreserved','autonomousPairVisit','bothPetTouchTargets','explicitRecordOnly','actualPartnerSaved','replayUsesSavedPartner','webViewTouch','nativeBackClosesMenuThenCare','nativeHomePausesObservation','nativeResumeKeepsBothPoses','forceStopPreservesProgress','reducedMotionPairVisit'])assert.equal(native[k],true,k);
assert.equal(native.newMemoriesRecorded,1);assert.equal(bundle.versionCode,38);assert.equal(bundle.lintErrors,0);assert.equal(bundle.allWebAssetsMatchSource,true);assert.equal(bundle.signingKeyMatchesPrevious,true);assert.equal(native.installedApkSha256,bundle.sha256);
assert.equal(visual.frames.length,17);assert.deepEqual(visual.consoleErrors,[]);assert.equal(source.allSourceFilesMatch,true);
for(const frame of [...visual.frames,...native.screenshots.map(path=>({path}))])assert.equal(fs.readFileSync(frame.path).readUInt32BE(0),0x89504e47);
const apk=fs.readFileSync(`dist/DaoLinhThu-${version}.apk`),zip=fs.readFileSync(`dist/source-${version}.zip`),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(hash(apk),bundle.sha256);assert.equal(hash(zip),source.sha256);
for(const path of ['dist/DaoLinhThu-1.30.0.apk','dist/source-1.30.0.zip','dist/BUILD-INFO-1.30.0.json'])assert.ok(fs.existsSync(path));
const report={version,versionCode:38,apk:`DaoLinhThu-${version}.apk`,source:`source-${version}.zip`,engine,browser:{uniqueCasesValidated:related.length+focused.length,relatedCasesPassed:related.length,finalNewFlowCasesPassed:focused.length,finalFailures:0,skipped:0,automaticRetries:0,initialRun:browser.stats,note:'The initial path-order test sampled every 240 ms and could miss a short route; the final suite pauses the clock before navigation and samples every 40 ms. All twelve focused cases pass after this test timing fix and the final layout changes.',reports:[`BROWSER-${version}.json`,`ISLAND-FRIENDS-FINAL-${version}.json`]},visual:{browserFrames:visual.frames.length,nativeFrames:native.screenshots.length,report:`ISLAND-FRIENDS-VISUAL-${version}.json`},android:{report:`ANDROID-ISLAND-FRIENDS-${version}.json`,upgrade:native.upgrade,offline:true,webViewTouch:true,nativeBackAndHome:true,physicalPhoneTested:false},sourceBytes:zip.length,sourceSha256:source.sha256,sourceFileCount:source.filesVerified,bundle,previousReleasePreserved:true,completedAt:new Date().toISOString()};
fs.writeFileSync(`dist/BUILD-INFO-${version}.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({version,engine:engine.pass,browser:report.browser.uniqueCasesValidated,apkSha256:bundle.sha256,sourceFiles:source.filesVerified,nativeUpgrade:native.upgrade},null,2));
