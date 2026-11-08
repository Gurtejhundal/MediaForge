// Build a separate static copy. Never move/delete routes in the developer's checkout.
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { writeNotices } = require('./third-party-notices.cjs');
const root = path.resolve(__dirname, '..');
(async () => {
  const androidVersion = /versionName '([0-9]+\.[0-9]+\.[0-9]+)'/.exec(await fs.readFile(path.join(root, 'android/app/build.gradle'), 'utf8'))?.[1];
  if (!androidVersion) throw new Error('Invalid Android version');
  const stage = path.join(root, 'work/android-web');
  await fs.rm(stage, { recursive: true, force: true });
  await fs.mkdir(stage, { recursive: true });
  for (const name of ['src', 'public', 'package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.mjs']) {
    await fs.cp(path.join(root, name), path.join(stage, name), { recursive: true });
  }
  await fs.rm(path.join(stage, 'src/app/api'), { recursive: true });
  await fs.rm(path.join(stage, 'src/proxy.ts'));
  await fs.symlink(path.join(root, 'node_modules'), path.join(stage, 'node_modules'), 'junction');
  await fs.writeFile(path.join(stage, 'next.config.mjs'), `export default { output: 'export', trailingSlash: true, images: { unoptimized: true }, turbopack: { root: ${JSON.stringify(root)} } };\n`);
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build'], {
    cwd: stage, stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_MEDIAFORGE_ANDROID: '1', NEXT_PUBLIC_MEDIAFORGE_ANDROID_SOURCE: `android-v${androidVersion}` },
  });
  if (result.status !== 0) throw new Error('Android web build failed');
  const assets = path.join(root, 'android/app/src/main/assets/public');
  await fs.rm(assets, { recursive: true, force: true });
  await fs.cp(path.join(stage, 'out'), assets, { recursive: true });
  await fs.mkdir(path.join(assets, 'licenses'), { recursive: true });
  for (const name of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) await fs.copyFile(path.join(root, name), path.join(assets, 'licenses', name));
  await writeNotices(root, path.join(assets, 'licenses/THIRD_PARTY_LICENSES.txt'));
  await fs.appendFile(path.join(assets, 'licenses/THIRD_PARTY_LICENSES.txt'), '\nAndroidX and Kotlin Android runtime components: Apache-2.0. Versions: android/app/build.gradle and its resolved Gradle dependency graph. Source: https://android.googlesource.com/platform/frameworks/support/ and https://github.com/JetBrains/kotlin\n' + await fs.readFile(path.join(root, 'docs/android-runtime-LICENSE.txt'), 'utf8'));
  console.log('Bundled Android assets ready (no server routes or local environment files).');
})().catch(error => { console.error(error); process.exitCode = 1; });
