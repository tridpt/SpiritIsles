import fs from 'node:fs';
import assert from 'node:assert/strict';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const sources=[`dist/BROWSER-${version}.json`,`dist/BROWSER-CATALOG-${version}.json`,`dist/BROWSER-REEF-FINAL-${version}.json`];
const records=new Map(),runs=[],initialFailures=[];
function collect(suite,path,initial){
  for(const spec of suite.specs||[])for(const test of spec.tests||[]){
    const key=`${spec.file}::${spec.title}::${test.projectName}`,last=test.results.at(-1);
    assert.ok(last);if(initial&&last.status!=='passed')initialFailures.push({key,title:spec.title,file:spec.file,status:last.status,error:last.error?.message});
    if(!initial)assert.equal(last.status,'passed',key);
    records.set(key,{file:spec.file,title:spec.title,project:test.projectName,status:last.status,source:path});
  }
  for(const child of suite.suites||[])collect(child,path,initial);
}
for(const [i,path]of sources.entries()){
  const data=JSON.parse(fs.readFileSync(path,'utf8').replace(/^\uFEFF/,''));assert.equal(data.stats.skipped,0);assert.equal(data.stats.flaky,0);if(i)assert.equal(data.stats.unexpected,0);
  runs.push({source:path,...data.stats});for(const suite of data.suites)collect(suite,path,i===0);
}
assert.equal(initialFailures.length,1);assert.match(initialFailures[0].file,/island-layout/);assert.match(initialFailures[0].title,/small screens/);
assert.equal(records.size,215);assert.ok([...records.values()].every(r=>r.status==='passed'));
const report={version,kind:'consolidated-validation',passed:records.size,failed:0,skipped:0,runs,initialFailures,correction:'Catalog expectation updated from 21 to 24 after adding three regional decorations. The corrected five-viewport test and all 15 coastal cases passed on the final CSS.',tests:[...records.values()]};
fs.writeFileSync(`dist/BROWSER-VALIDATED-${version}.json`,JSON.stringify(report,null,2)+'\n');console.log(`${records.size} distinct browser scenarios validated; original full-run report and targeted follow-ups retained.`);
