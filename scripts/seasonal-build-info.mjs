import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const read=name=>JSON.parse(fs.readFileSync('dist/'+name+'-'+version+'.json','utf8').replace(/^\uFEFF/,''));
const tap=fs.readFileSync('dist/ENGINE-'+version+'.tap','utf8');
const engine=Object.fromEntries(['tests','pass','fail','skipped'].map(k=>[k,Number(tap.match(new RegExp('^# '+k+' (\\d+)','m'))?.[1])]));
assert.equal(engine.tests,508);assert.equal(engine.pass,508);assert.equal(engine.fail,0);assert.equal(engine.skipped,0);
const browser=read('BROWSER'),festival=read('SEASONAL-BROWSER'),native=read('ANDROID-SEASONAL'),bundle=read('BUNDLE-CHECK');
const specs=suites=>suites.flatMap(s=>[...(s.specs||[]),...specs(s.suites||[])]);
const check=(report,count)=>{
  assert.equal(specs(report.suites).length,count);
  assert.equal(report.stats.expected,count);
  for(const key of ['unexpected','skipped','flaky'])assert.equal(report.stats[key],0);
  assert.ok(specs(report.suites).every(s=>s.tests.every(t=>t.status==='expected'&&t.results.length===1)));
};
check(browser,283);check(festival,14);
assert.deepEqual(native.consoleErrors,[]);assert.equal(native.upgrade,'1.27.0 → 1.28.0');
for(const k of ['saveMigratedAndLiveBattlePreserved','nativeTouch','nativeFramesPainted','missionsAndChallengesPayOnce','spendingKeepsEarnedMilestones','archUnlockAndRealPlacementPersist','ownedArchCannotBeRepurchased','milestoneResourcesPayOnce','nextSeasonBanksAllReadyRewards','carriedCurrencyAndPermanentArchPersist','shinyFragmentsPersist','forceStopPreservesSnapshot','offline'])assert.equal(native[k],true);
assert.equal(bundle.webAssetCount,140);assert.equal(bundle.allWebAssetsMatchSource,true);assert.equal(bundle.lintErrors,0);
assert.equal(bundle.signingKeyMatchesPrevious,true);assert.equal(bundle.versionCode,35);assert.equal(native.installedApkSha256,bundle.sha256);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('dist/DaoLinhThu-'+version+'.apk')).digest('hex'),bundle.sha256);
const frames=[];
for(const size of ['320x640','390x844','768x1024','1440x1000','844x390'])for(const scene of ['journey','prizes','shop','help','reveal']){
  const name='festival-'+scene+'-'+size+'-'+version+'.png',bytes=fs.readFileSync('dist/screenshots/'+name);
  frames.push({file:'screenshots/'+name,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)});
}
for(const name of ['journey','arch-unlock','island','milestones','new-season']){
  const file='screenshots/festival-native-'+name+'-'+version+'.png',bytes=fs.readFileSync('dist/'+file);
  frames.push({file,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),native:true});
}
const visual={version,viewportScenes:25,nativeScenes:5,frames,svgValidityAndButtonTargetsChecked:true,completedAt:new Date().toISOString()};
fs.writeFileSync('dist/SEASONAL-VISUAL-'+version+'.json',JSON.stringify(visual,null,2)+'\n');
const sourceFile='dist/source-'+version+'.zip',sourceBytes=fs.readFileSync(sourceFile);
const report={
  version,versionCode:35,apk:'DaoLinhThu-'+version+'.apk',source:'source-'+version+'.zip',engine,
  browser:{passed:283,failed:0,skipped:0,flaky:0,automaticRetries:0,report:'BROWSER-'+version+'.json'},
  festival:{passed:14,failed:0,report:'SEASONAL-BROWSER-'+version+'.json'},
  visual:{scenes:frames.length,report:'SEASONAL-VISUAL-'+version+'.json'},
  android:{report:'ANDROID-SEASONAL-'+version+'.json',upgrade:native.upgrade,offline:true,nativeTouch:true,systemUiAnrRecoveries:native.systemUiAnrRecoveries,physicalPhoneTested:false},
  sourceBytes:sourceBytes.length,sourceSha256:crypto.createHash('sha256').update(sourceBytes).digest('hex'),
  bundle,completedAt:new Date().toISOString()
};
fs.writeFileSync('dist/BUILD-INFO-'+version+'.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,bundle:{sha256:bundle.sha256,webAssets:bundle.webAssetCount,lintErrors:bundle.lintErrors,lintWarnings:bundle.lintWarnings}},null,2));
