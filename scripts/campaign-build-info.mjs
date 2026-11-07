import fs from 'node:fs';
import assert from 'node:assert/strict';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const read=file=>JSON.parse(fs.readFileSync(`dist/${file}-${version}.json`,'utf8').replace(/^\uFEFF/,''));
const tap=fs.readFileSync(`dist/ENGINE-${version}.tap`,'utf8'),engine=Object.fromEntries(['tests','pass','fail'].map(k=>[k,Number(tap.match(new RegExp(`^# ${k} (\\d+)`,'m'))?.[1])]));
assert.equal(engine.tests,493);assert.equal(engine.pass,493);assert.equal(engine.fail,0);
const browser=read('BROWSER'),followUp=read('BROWSER-FINAL-UI'),specs=suites=>suites.flatMap(s=>[...(s.specs||[]),...specs(s.suites||[])]),cases=specs(browser.suites),followCases=specs(followUp.suites);
assert.equal(cases.length,269);assert.equal(browser.stats.expected,264);assert.equal(browser.stats.unexpected,5);assert.equal(browser.stats.flaky,0);assert.equal(browser.stats.skipped,0);
assert.equal(followCases.length,20);assert.equal(followUp.stats.expected,20);assert.equal(followUp.stats.unexpected,0);assert.equal(followUp.stats.flaky,0);assert.equal(followUp.stats.skipped,0);
const key=s=>s.file+'\0'+s.title,passed=s=>s.tests.every(t=>t.status==='expected'&&t.results.length===1),initialReport=`BROWSER-${version}.json`,followReport=`BROWSER-FINAL-UI-${version}.json`;
const validated=new Map(cases.map(s=>[key(s),{file:s.file,title:s.title,passed:passed(s),source:initialReport}]));
for(const s of followCases){assert.ok(validated.has(key(s)));assert.ok(passed(s));validated.set(key(s),{file:s.file,title:s.title,passed:true,source:followReport});}
assert.equal(validated.size,269);assert.ok([...validated.values()].every(s=>s.passed));
const browserValidation={version,passed:269,failed:0,initialRun:{report:initialReport,passed:264,failed:5},followUpRun:{report:followReport,passed:20,failed:0},resolvedFailures:cases.filter(s=>!passed(s)).map(s=>({file:s.file,title:s.title})),cases:[...validated.values()],completedAt:new Date().toISOString()};
const native=read('ANDROID-CAMPAIGN'),finalNative=read('ANDROID-CAMPAIGN-FINAL'),visual=read('CAMPAIGN-VISUAL'),bundle=read('BUNDLE-CHECK');
assert.deepEqual(native.consoleErrors,[]);assert.deepEqual(finalNative.consoleErrors,[]);assert.deepEqual(visual.errors,[]);assert.equal(native.installedApkSha256,finalNative.fullAuditApkSha256);assert.equal(finalNative.installedApkSha256,bundle.sha256);assert.equal(finalNative.onlyUiPolishChanged,true);assert.equal(finalNative.allOtherWebAssetsIdentical,true);assert.equal(finalNative.savePreserved,true);assert.equal(finalNative.nativeTouchCampaignMap,true);assert.ok(finalNative.shinyCloseTouchSize.width>=44&&finalNative.shinyCloseTouchSize.height>=44);assert.equal(bundle.webAssetCount,136);assert.equal(bundle.allWebAssetsMatchSource,true);assert.equal(bundle.lintErrors,0);
fs.writeFileSync(`dist/BROWSER-VALIDATED-${version}.json`,JSON.stringify(browserValidation,null,2)+'\n');
const report={version,versionCode:34,apk:`DaoLinhThu-${version}.apk`,source:`source-${version}.zip`,engine,browser:{passed:269,failed:0,initialRun:browserValidation.initialRun,followUpRun:browserValidation.followUpRun,skipped:0,flaky:0,automaticRetries:0,report:`BROWSER-VALIDATED-${version}.json`},visual:{scenes:visual.frames.length,report:`CAMPAIGN-VISUAL-${version}.json`},android:{report:`ANDROID-CAMPAIGN-${version}.json`,finalPackageReport:`ANDROID-CAMPAIGN-FINAL-${version}.json`,upgrade:native.upgrade,offline:true,systemUiAnrRecoveries:native.systemUiAnrRecoveries+finalNative.systemUiAnrRecoveries,physicalPhoneTested:false},bundle,completedAt:new Date().toISOString()};
fs.writeFileSync(`dist/BUILD-INFO-${version}.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,bundle:{sha256:bundle.sha256,webAssets:bundle.webAssetCount}},null,2));
