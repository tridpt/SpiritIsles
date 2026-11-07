import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const read=name=>JSON.parse(fs.readFileSync(`dist/${name}-${version}.json`,'utf8').replace(/^\uFEFF/,''));
const tap=fs.readFileSync(`dist/ENGINE-${version}.tap`,'utf8');
const engine=Object.fromEntries(['tests','pass','fail','skipped'].map(key=>[key,Number(tap.match(new RegExp('^# '+key+' (\\d+)','m'))?.[1])]));
assert.equal(engine.tests,514);assert.equal(engine.pass,514);assert.equal(engine.fail,0);assert.equal(engine.skipped,0);
const browser=read('BROWSER'),followup=read('BROWSER-FOLLOWUP'),native=read('ANDROID-DAILY-HABITAT'),bundle=read('BUNDLE-CHECK'),visual=read('DAILY-HABITAT-VISUAL'),source=read('SOURCE-CHECK'),bond=read('DAILY-BOND');
const specs=suites=>suites.flatMap(s=>[...(s.specs||[]),...specs(s.suites||[])]);
assert.equal(specs(browser.suites).length,290);assert.equal(browser.stats.expected,287);assert.equal(browser.stats.unexpected,3);
assert.equal(specs(followup.suites).length,19);assert.equal(followup.stats.expected,19);
for(const report of [browser,followup])for(const key of ['skipped','flaky'])assert.equal(report.stats[key],0);
assert.equal(followup.stats.unexpected,0);
const key=s=>`${s.file}:${s.title}`,rechecked=new Map(specs(followup.suites).map(s=>[key(s),s]));
const cases=specs(browser.suites).map(s=>{
  const replacement=rechecked.get(key(s)),final=replacement||s;
  assert.ok(final.tests.every(t=>t.status==='expected'&&t.results.length===1));
  return {file:s.file,title:s.title,passed:true,validation:replacement?'followup':'initial',corrected:s.tests.some(t=>t.status!=='expected')};
});
assert.equal(cases.filter(c=>c.corrected).length,3);
const browserValidation={version,passed:cases.length,failed:0,initialRun:{passed:287,failed:3,report:`BROWSER-${version}.json`},followUpRun:{passed:19,failed:0,report:`BROWSER-FOLLOWUP-${version}.json`},fix:'Prevent the new lobby-bottom empty area from intercepting existing island shortcuts.',cases};
fs.writeFileSync(`dist/BROWSER-VALIDATED-${version}.json`,JSON.stringify(browserValidation,null,2)+'\n');
assert.equal(native.upgrade,'1.28.0 → '+version);assert.deepEqual(native.consoleErrors,[]);
for(const key of ['offline','savePreserved','oldMemoriesPreserved','unresolvedRouteAndRngPreserved','resourcesAndTeamPreserved','webViewTouch','nativeBackClosesMenuThenScene','nativeHomePausesObservation','nativeResumeKeepsScene','forceStopPreservesProgress','immediateHintAdvance'])assert.equal(native[key],true);
assert.equal(native.newMemoriesRecorded,2);assert.equal(native.physicalPhoneTested,false);
assert.equal(bond.pettingFrom9To10ImmediatelyUnlocksHint,true);assert.equal(bond.appSha256,crypto.createHash('sha256').update(fs.readFileSync('web/js/app.js')).digest('hex'));
assert.equal(bundle.allWebAssetsMatchSource,true);assert.equal(bundle.signingKeyMatchesPrevious,true);assert.equal(bundle.versionCode,36);assert.equal(bundle.lintErrors,0);assert.equal(native.installedApkSha256,bundle.sha256);
assert.equal(visual.frames.length,16);assert.deepEqual(visual.consoleErrors,[]);
assert.equal(source.allSourceFilesMatch,true);assert.equal(source.version,version);
for(const frame of [...visual.frames,...native.screenshots.map(path=>({path}))]){
  const image=fs.readFileSync(frame.path);assert.equal(image.readUInt32BE(0),0x89504e47);
}
const apk=fs.readFileSync(`dist/DaoLinhThu-${version}.apk`),zip=fs.readFileSync(`dist/source-${version}.zip`),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(apk),bundle.sha256);assert.equal(hash(zip),source.sha256);
assert.ok(fs.existsSync('dist/DaoLinhThu-1.28.0.apk'));assert.ok(fs.existsSync('dist/source-1.28.0.zip'));
const report={version,versionCode:36,apk:`DaoLinhThu-${version}.apk`,source:`source-${version}.zip`,engine,browser:{passed:290,failed:0,skipped:0,automaticRetries:0,initialRun:browserValidation.initialRun,followUpRun:browserValidation.followUpRun,report:`BROWSER-VALIDATED-${version}.json`},visual:{browserFrames:16,nativeFrames:native.screenshots.length,report:`DAILY-HABITAT-VISUAL-${version}.json`},android:{report:`ANDROID-DAILY-HABITAT-${version}.json`,upgrade:native.upgrade,offline:true,webViewTouch:true,nativeBackAndHome:true,physicalPhoneTested:false},sourceBytes:zip.length,sourceSha256:source.sha256,sourceFileCount:source.filesVerified,bundle,previousReleasePreserved:true,completedAt:new Date().toISOString()};
fs.writeFileSync(`dist/BUILD-INFO-${version}.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({version,engine:engine.pass,browser:cases.length,apkSha256:bundle.sha256,sourceSha256:source.sha256,sourceFiles:source.filesVerified,lintErrors:bundle.lintErrors,lintWarnings:bundle.lintWarnings,nativeUpgrade:native.upgrade},null,2));
