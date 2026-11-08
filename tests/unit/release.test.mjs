import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { verifyRelease } from '../../scripts/verify-release.cjs';

test('release gate rejects corrupt downloads and missing platforms before publication', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'mediaforge-release-'));
  try {
    const names = ['linux-x64.AppImage','linux-x64.deb','win-x64.exe','mac-arm64.dmg','mac-arm64.zip','mac-x64.dmg','mac-x64.zip'].map(s => `MediaForge-0.2.0-${s}`);
    const entries = [];
    for (const name of names) {
      const bytes = Buffer.from(`synthetic artifact ${name}`);
      await writeFile(path.join(directory, name), bytes);
      entries.push(`${createHash('sha256').update(bytes).digest('hex')}  ${name}`);
    }
    const manifest = path.join(directory, 'SHA256SUMS-linux-x64.txt');
    await writeFile(manifest, entries.slice(1).join('\n'));
    await assert.rejects(verifyRelease(directory, '0.2.0'), /missing/);
    await writeFile(manifest, entries.join('\n'));
    await writeFile(path.join(directory, names[0]), 'corrupted transfer');
    await assert.rejects(verifyRelease(directory, '0.2.0'), /Checksum mismatch/);
    await writeFile(path.join(directory, names[0]), `synthetic artifact ${names[0]}`);
    assert.equal((await verifyRelease(directory, '0.2.0')).length, 7);
    assert.equal((await readFile(path.join(directory, 'SHA256SUMS.txt'), 'utf8')).trim().split('\n').length, 7);
    await writeFile(manifest, entries.join('\n') + '\n' + entries[0]);
    await assert.rejects(verifyRelease(directory, '0.2.0'), /duplicate/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
