const { createHash } = require('node:crypto');
const { createReadStream } = require('node:fs');
const { readdir, writeFile, rename } = require('node:fs/promises');
const path = require('node:path');
(async()=>{
  const directory=path.resolve(process.argv[2]||'release');
  // Native Linux packaging tools use distro architecture aliases in filenames.
  for (const name of await readdir(directory)) {
    if (!/^MediaForge-[\d.]+-linux-(x86_64|amd64|aarch64)\.(AppImage|deb)$/.test(name)) continue;
    const normalized=name.replace(/-(x86_64|amd64)\./,'-x64.').replace(/-aarch64\./,'-arm64.');
    await rename(path.join(directory,name),path.join(directory,normalized));
  }
  const names=(await readdir(directory)).filter(name=>/^MediaForge-[\d.]+-(linux|win|mac)-(x64|arm64)\.(AppImage|deb|exe|dmg|zip)$/.test(name)).sort();
  if(!names.length)throw new Error('No MediaForge release artifacts found.');
  const lines=[];
  for(const name of names){const hash=createHash('sha256');for await(const chunk of createReadStream(path.join(directory,name)))hash.update(chunk);lines.push(`${hash.digest('hex')}  ${name}`);}
  const filename=`SHA256SUMS-${process.platform}-${process.arch}.txt`;
  await writeFile(path.join(directory,filename),lines.join('\n')+'\n');
  console.log(`Wrote ${filename} for ${names.length} artifacts.`);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
