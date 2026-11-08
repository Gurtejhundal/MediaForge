const { createHash } = require('node:crypto');
const { createReadStream } = require('node:fs');
const { readdir, readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');

async function verifyRelease(directory, version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('A plain semantic version is required.');
  const suffixes = ['linux-x64.AppImage', 'linux-x64.deb', 'win-x64.exe', 'mac-arm64.dmg', 'mac-arm64.zip', 'mac-x64.dmg', 'mac-x64.zip'];
  const expected = new Set(suffixes.map(suffix => `MediaForge-${version}-${suffix}`));
  const files = await readdir(directory);
  const covered = new Set();
  const lines = [];
  for (const manifest of files.filter(name => /^SHA256SUMS-(linux|darwin|win32)-(x64|arm64)\.txt$/.test(name)).sort()) {
    for (const line of (await readFile(path.join(directory, manifest), 'utf8')).trim().split(/\r?\n/)) {
      const match = /^([a-f0-9]{64})  ([A-Za-z0-9.-]+)$/.exec(line);
      if (!match || !expected.has(match[2]) || covered.has(match[2])) throw new Error(`Unexpected or duplicate checksum entry in ${manifest}.`);
      const hash = createHash('sha256');
      for await (const chunk of createReadStream(path.join(directory, match[2]))) hash.update(chunk);
      if (hash.digest('hex') !== match[1]) throw new Error(`Checksum mismatch: ${match[2]}`);
      covered.add(match[2]); lines.push(line);
    }
  }
  if (covered.size !== expected.size) throw new Error('A required native platform/format is missing.');
  for (const name of files.filter(name => /^MediaForge-/.test(name))) {
    if (!expected.has(name) && name !== `MediaForge-${version}-source.zip`) throw new Error(`Unexpected release file: ${name}`);
  }
  await writeFile(path.join(directory, 'SHA256SUMS.txt'), lines.sort().join('\n') + '\n');
  return [...covered].sort();
}
module.exports = { verifyRelease };
if (require.main === module) verifyRelease(path.resolve(process.argv[2] || 'release'), process.argv[3] || require('../package.json').version)
  .then(files => console.log(`Verified ${files.length} native release files across all four targets.`))
  .catch(error => { console.error(error.message); process.exitCode = 1; });
