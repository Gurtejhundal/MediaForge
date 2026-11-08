const { cp, mkdir, rm, writeFile, readFile, readdir } = require('node:fs/promises');
const path = require('node:path');
const { writeNotices } = require('./third-party-notices.cjs');
async function main() {
  const root = path.resolve(__dirname, '..');
  const destination = path.join(root, 'desktop-app');
  const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  await rm(destination, { recursive: true, force: true });
  await mkdir(path.join(destination, 'node_modules'), { recursive: true });
  await cp(path.join(root, '.next/standalone'), path.join(destination, 'web'), { recursive: true, dereference: true });
  // Next standalone includes local env files by default. Never ship developer credentials.
  async function removeEnv(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.env')) await rm(path.join(directory, entry.name), { force: true });
      else if (entry.isDirectory() && entry.name !== 'node_modules') await removeEnv(path.join(directory, entry.name));
    }
  }
  await removeEnv(path.join(destination, 'web'));
  await cp(path.join(root, '.next/static'), path.join(destination, 'web/.next/static'), { recursive: true });
  await cp(path.join(root, 'public'), path.join(destination, 'web/public'), { recursive: true });
  for (const name of ['main.cjs', 'policy.cjs']) await cp(path.join(root, 'desktop', name), path.join(destination, name));
  await cp(path.join(root, 'public/android-chrome-512x512.png'), path.join(destination, 'icon.png'));
  await cp(path.join(root, 'LICENSE'), path.join(destination, 'LICENSE'));
  await cp(path.join(root, 'THIRD_PARTY_NOTICES.md'), path.join(destination, 'THIRD_PARTY_NOTICES.md'));
  await writeNotices(root, path.join(destination, 'THIRD_PARTY_LICENSES.txt'));
  await writeFile(path.join(destination, 'package.json'), JSON.stringify({ name: 'mediaforge-desktop', productName: 'MediaForge', desktopName: 'MediaForge', version: manifest.version, license: manifest.license, description: manifest.description, author: manifest.author, homepage: manifest.homepage, main: 'main.cjs', dependencies: {}, private: true }, null, 2));
  console.log('Prepared desktop-app with standalone web runtime and no environment files.');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
