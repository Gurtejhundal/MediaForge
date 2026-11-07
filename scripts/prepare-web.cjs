const { cp, rm } = require('node:fs/promises');
const path = require('node:path');
(async()=>{
  const root=path.resolve(__dirname,'..');
  await cp(path.join(root,'public'),path.join(root,'.next/standalone/public'),{recursive:true});
  await cp(path.join(root,'.next/static'),path.join(root,'.next/standalone/.next/static'),{recursive:true});
  // These developer-local files are not runtime assets.
  for(const file of ['.env','.env.local','.env.production','.env.production.local']) await rm(path.join(root,'.next/standalone',file),{force:true});
})().catch(error=>{console.error(error);process.exitCode=1;});
