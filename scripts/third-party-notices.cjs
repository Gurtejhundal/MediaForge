const { readFile, readdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

async function writeNotices(root, destination) {
  const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
  const sections = ['MediaForge third-party licenses\n\nApplication license: AGPL-3.0-only. Dependencies retain their own terms.\nSource and build instructions: https://github.com/Gurtejhundal/MediaForge\n'];
  for (const [location, record] of Object.entries(lock.packages).sort()) {
    if (!location || record.dev || record.link) continue;
    const directory = path.join(root, location);
    let manifest;
    try { manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT' && record.optional) continue; throw error; }
    const files = (await readdir(directory, { withFileTypes: true }))
      .filter(entry => entry.isFile() && /^(licen[sc]e|copying|notice|copyright|ofl|thirdpartylicenses)([.-]|$)/i.test(entry.name))
      .map(entry => entry.name).sort();
    const license = typeof manifest.license === 'string' ? manifest.license : JSON.stringify(manifest.license || record.license || 'See upstream notices');
    const notices = await Promise.all(files.map(async name => `\n--- ${name} ---\n${await readFile(path.join(directory, name), 'utf8')}`));
    sections.push(`\n${'='.repeat(72)}\n${manifest.name}@${manifest.version}\nLicense: ${license}\nPackage source: ${record.resolved || 'See package-lock.json'}\n${notices.join('\n')}`);
  }
  for (const name of (await readdir(path.join(root, 'docs/licenses'))).sort()) {
    sections.push(`\n${'='.repeat(72)}\nFont notice: ${name}\n${await readFile(path.join(root, 'docs/licenses', name), 'utf8')}`);
  }
  await writeFile(destination, sections.join('\n'));
  console.log(`Preserved notices for ${sections.length - 4} installed production packages and three fonts.`);
}
module.exports = { writeNotices };
