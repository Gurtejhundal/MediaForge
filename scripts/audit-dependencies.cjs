const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['audit','--omit=dev','--json'],{encoding:'utf8',shell:process.platform==='win32'});
let report;
try { report=JSON.parse(result.stdout); } catch { console.error('Dependency audit did not return JSON.'); process.exit(1); }
if(!report.metadata || report.error){console.error('Dependency audit service is unavailable or returned an error.');process.exit(1);}
const lock=JSON.parse(readFileSync(path.join(__dirname,'../package-lock.json'),'utf8'));
const exception=JSON.parse(readFileSync(path.join(__dirname,'../docs/dependency-exception.json'),'utf8'));
const allowed=new Set(['zod','@imgly/background-removal']);
const active=Date.now()<Date.parse(exception.expires)&&Object.entries(exception.versions).every(([name,version])=>lock.packages[`node_modules/${name}`]?.version===version);
let blocked=false;
for(const [name,entry] of Object.entries(report.vulnerabilities||{})) {
  if(!['high','critical'].includes(entry.severity))continue;
  const advisories=entry.via.filter(value=>typeof value==='object');
  const reviewed=active && allowed.has(name) && (advisories.length?advisories.every(value=>value.url===exception.advisory):entry.via.every(value=>allowed.has(value)));
  console.log(`${entry.severity}: ${name} — ${reviewed?'reviewed, time-limited browser configuration exception':'BLOCKED'}`);
  if(!reviewed)blocked=true;
}
console.log('Production advisory totals:',JSON.stringify(report.metadata.vulnerabilities));
if(!active)console.error('The dependency exception expired or its dependency versions changed; review it again.');
process.exitCode=blocked?1:0;
