import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const {version}=read('package.json');assert.equal(version,'1.22.0');
const bundle=read(`dist/BUNDLE-CHECK-${version}.json`),source=read(`dist/SOURCE-CHECK-${version}.json`),engine=read(`dist/ENGINE-${version}.json`),browser=read(`dist/BROWSER-${version}.json`),visual=read(`dist/FOREST-VISUAL-${version}.json`),extras=read(`dist/FOREST-EXTRAS-${version}.json`),android=read(`dist/ANDROID-FOREST-${version}.json`);
assert.equal(engine.passed,360);assert.equal(engine.failed,0);assert.equal(engine.skipped,0);
assert.equal(browser.stats.expected,200);assert.equal(browser.stats.unexpected,0);assert.equal(browser.stats.flaky,0);assert.equal(browser.stats.skipped,0);
assert.equal(visual.views.length,30);assert.deepEqual(visual.errors,[]);assert.deepEqual(extras.errors,[]);assert.equal(extras.motion.length,3);assert.equal(extras.audio.length,2);assert.deepEqual(extras.svg,{invalid:false,missing:0});
assert.equal(bundle.bundledFilesVerified,112);assert.equal(bundle.forestJourneyPrecached,true);assert.equal(bundle.lintErrors,0);assert.equal(bundle.sameSignerAsPrevious,true);assert.equal(bundle.versionCode,29);
assert.equal(hash(`dist/DaoLinhThu-${version}.apk`),bundle.sha256);assert.equal(hash(`dist/source-${version}.zip`),source.sha256);assert.equal(android.installedApkSha256,bundle.sha256);assert.deepEqual(android.consoleErrors,[]);
for(const key of ['savePreserved','nativeTouch','nativeFramesPainted','manualDodgeMatchesEngine','autoDodgesWarning','oneActionPerTurn','persistentWorldAndPet','plannerAndHomePause','nativeBackClosesPlanner','forceStopPreservesSquad','autoOffOnReopen','completeTripFourReports','onePayoutOnly','controlledClockForAuto','offline'])assert.equal(android[key],true,key);
for(const previousVersion of ['1.19.0','1.20.0','1.21.0']){const previous=read(`dist/BUILD-INFO-${previousVersion}.json`);assert.equal(hash(`dist/DaoLinhThu-${previousVersion}.apk`),previous.sha256);assert.equal(hash(`dist/source-${previousVersion}.zip`),previous.sourceSha256);}
const result={version,versionCode:29,apk:`dist/DaoLinhThu-${version}.apk`,bytes:bundle.bytes,sha256:bundle.sha256,source:`dist/source-${version}.zip`,sourceFiles:source.filesVerified,sourceBytes:source.bytes,sourceSha256:source.sha256,engine,browser:{passed:200,failed:0,flaky:0,skipped:0,report:`dist/BROWSER-${version}.json`},visual:{frames:30,viewports:[...new Set(visual.views.map(v=>`${v.width}×${v.height}`))],report:`dist/FOREST-VISUAL-${version}.json`},extras,android,bundledWebFiles:112,signatureV2Verified:bundle.signatureV2Verified,sameSignerAsPrevious:true,previousReleasesPreserved:true,lint:{errors:bundle.lintErrors,warnings:bundle.lintWarnings},completedAt:new Date().toISOString()};
fs.writeFileSync(`dist/BUILD-INFO-${version}.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({version,sha256:result.sha256,sourceSha256:result.sourceSha256,engine:360,browser:200,forestFrames:30,androidOfflineUpgrade:true},null,2));
