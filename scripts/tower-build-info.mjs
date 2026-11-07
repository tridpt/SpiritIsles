import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const full=read('dist/BROWSER-1.25.0.json'),rerun=read('dist/BROWSER-TOWER-REGRESSIONS-1.25.0.json');
function specs(suites){return suites.flatMap(s=>[...(s.specs||[]),...specs(s.suites||[])]);}
const key=s=>`${s.file}:${s.line}:${s.column}:${s.title.replace(/\b(six|seven)\b/g,'SEVEN')}`;
const fresh=new Map(specs(rerun.suites).map(s=>[key(s),s]));
const cases=specs(full.suites).map(s=>{
  const update=fresh.get(key(s)),used=update||s;
  return {file:used.file,line:used.line,title:used.title,passed:used.tests.every(t=>t.status==='expected'),source:update?'BROWSER-TOWER-REGRESSIONS-1.25.0.json':'BROWSER-1.25.0.json',initialPassed:s.tests.every(t=>t.status==='expected')};
});
assert.equal(cases.length,242);assert.ok(cases.every(s=>s.passed));assert.equal(rerun.stats.unexpected,0);assert.equal(rerun.stats.skipped,0);
const browser={version:'1.25.0',passed:cases.length,failed:0,skipped:0,validation:'Full suite plus focused rerun after updating menu/catalog counts and the settings version label.',initial:full.stats,focused:rerun.stats,cases};
fs.writeFileSync('dist/BROWSER-VALIDATED-1.25.0.json',JSON.stringify(browser,null,2)+'\n');
const tap=fs.readFileSync('dist/ENGINE-1.25.0.tap','utf8'),engine={tests:Number(tap.match(/^# tests (\d+)/m)[1]),passed:Number(tap.match(/^# pass (\d+)/m)[1]),failed:Number(tap.match(/^# fail (\d+)/m)[1])};
assert.deepEqual(engine,{tests:428,passed:428,failed:0});
const native=read('dist/ANDROID-TOWER-1.25.0.json'),final=read('dist/ANDROID-TOWER-FINAL-1.25.0.json'),bundle=read('dist/BUNDLE-CHECK-1.25.0.json'),visual=read('dist/TOWER-VISUAL-1.25.0.json'),delta=read('dist/TOWER-FINAL-APK-DIFF-1.25.0.json');
assert.equal(final.installedApkSha256,bundle.sha256);assert.deepEqual(final.consoleErrors,[]);assert.deepEqual(native.consoleErrors,[]);assert.deepEqual(visual.errors,[]);
const report={version:'1.25.0',versionCode:32,apk:'DaoLinhThu-1.25.0.apk',engine,browser:{passed:242,failed:0,skipped:0,report:'BROWSER-VALIDATED-1.25.0.json'},visual:{scenes:visual.results.length,report:'TOWER-VISUAL-1.25.0.json'},android:{fullAudit:'ANDROID-TOWER-1.25.0.json',finalAudit:'ANDROID-TOWER-FINAL-1.25.0.json',finalApkDifference:delta,systemUiAnrRecoveries:native.systemUiAnrRecoveries+final.systemUiAnrRecoveries,physicalPhoneTested:false},bundle,completedAt:new Date().toISOString()};
fs.writeFileSync('dist/BUILD-INFO-1.25.0.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({engine,browser:report.browser,visual:report.visual,sha256:bundle.sha256},null,2));
