import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
const fixture=path.resolve('tests/fixtures/sample.mp4');
for(const [route,button] of [['video-converter','Export Local WEBM'],['video-upscaler','Upscale'],['watermark-remover','Clean Selected Area Locally']]) {
  test(`${route}: real WebM export from a short video`,async({page})=>{
    await page.goto(`/tools/${route}`);await page.locator('input[type=file]').setInputFiles(fixture);
    const video=page.locator('video');await expect.poll(()=>video.evaluate((element:HTMLVideoElement)=>element.readyState)).toBeGreaterThanOrEqual(2);
    const pending=page.waitForEvent('download');await page.getByRole('button',{name:new RegExp(button,'i')}).click();
    const download=await pending;const data=await readFile((await download.path())!);expect(data.subarray(0,4).toString('hex')).toBe('1a45dfa3');expect(data.length).toBeGreaterThan(100);
  });
}
test('frame extractor packages real image frames',async({page})=>{
  await page.goto('/tools/video-to-image');await page.locator('input[type=file]').setInputFiles(fixture);await page.getByRole('button',{name:'12 FPS',exact:true}).click();await page.getByRole('button',{name:'Extract all frames to ZIP',exact:true}).click();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:/Download/}).first().click();const download=await pending;const zip=await JSZip.loadAsync(await readFile((await download.path())!));const frames=Object.keys(zip.files).filter(n=>n.endsWith('.png'));expect(frames).toHaveLength(12);expect((await zip.file(frames[0])!.async('nodebuffer')).subarray(1,4).toString()).toBe('PNG');
});
