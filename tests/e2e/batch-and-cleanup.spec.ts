import { test, expect } from '@playwright/test';
// These journeys explicitly discard intermediate work; dedicated guard tests cover staying.
test.beforeEach(async ({page}) => { page.on('dialog', dialog => dialog.accept()); });
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';

const pngPath=path.resolve('tests/fixtures/sample.png');
for(const [route,kind] of [['format-converter','jpeg'],['resize','png'],['compress','webp']] as const) {
  test(`${route}: batch keeps duplicate names, isolates corrupt files and exports a verified ZIP`,async({page})=>{
    await page.goto(`/tools/${route}`);await page.getByRole('button',{name:'Multiple files',exact:true}).click();
    const batch=page.getByRole('region',{name:'Batch image files'});const input=await readFile(pngPath);
    await batch.locator('input[type=file]').setInputFiles([{name:'same.png',mimeType:'image/png',buffer:input},{name:'same.png',mimeType:'image/png',buffer:input},{name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')}]);
    await expect(batch.getByRole('listitem')).toHaveCount(3);
    if(route==='format-converter')await batch.getByLabel('Output format').selectOption('jpeg');
    if(route==='resize'){await batch.getByLabel('Batch width (px)').fill('64');await batch.getByLabel('Batch height (px)').fill('32');}
    await batch.getByRole('button',{name:'Process 3 images',exact:true}).click();
    await expect(batch.getByRole('status')).toContainText('2 of 3 ready');
    await expect(batch.getByRole('listitem').filter({hasText:'broken.png'})).toContainText('error');
    await page.getByRole('button',{name:'Single file',exact:true}).click();await page.getByRole('button',{name:'Multiple files',exact:true}).click();
    await expect(batch.getByRole('status')).toContainText('2 of 3 ready');
    const pending=page.waitForEvent('download');await batch.getByRole('button',{name:'Save finished images as ZIP',exact:true}).click();
    const download=await pending;expect(await download.failure()).toBeNull();
    const zip=await JSZip.loadAsync(await readFile((await download.path())!));
    const names=Object.keys(zip.files).filter(name=>name!=='batch-report.json');expect(names).toHaveLength(2);expect(new Set(names).size).toBe(2);
    for(const name of names){const bytes=await zip.file(name)!.async('nodebuffer');if(kind==='jpeg')expect(bytes.subarray(0,2).toString('hex')).toBe('ffd8');if(kind==='webp')expect(bytes.subarray(8,12).toString()).toBe('WEBP');if(kind==='png'){expect(bytes.readUInt32BE(16)).toBe(64);expect(bytes.readUInt32BE(20)).toBe(32);}}
    const report=JSON.parse(await zip.file('batch-report.json')!.async('string'));expect(report.filter((item:{status:string})=>item.status==='done')).toHaveLength(2);expect(report.find((item:{input:string})=>item.input==='broken.png').status).toBe('error');
    await batch.getByRole('button',{name:'Clear batch',exact:true}).click();await expect(batch.getByRole('status')).toContainText('0 of 0 ready');
  });
}

test('batch Stop preserves the current result and leaves later files queued',async({page})=>{
  await page.addInitScript(()=>{const decode=window.createImageBitmap.bind(window);let first=true;Object.defineProperty(window,'createImageBitmap',{value:async(source:ImageBitmapSource)=>{const image=await decode(source);if(first){first=false;await new Promise<void>(resolve=>Object.defineProperty(window,'__finishBatchImage',{value:resolve}));}return image;}});});
  await page.goto('/tools/format-converter');await page.getByRole('button',{name:'Multiple files',exact:true}).click();
  const batch=page.getByRole('region',{name:'Batch image files'});const png=await readFile(pngPath);
  await batch.locator('input[type=file]').setInputFiles([{name:'first.png',mimeType:'image/png',buffer:png},{name:'second.png',mimeType:'image/png',buffer:png}]);
  await batch.getByRole('button',{name:'Process 2 images'}).click();await expect(batch.getByRole('listitem').first()).toContainText('working');
  await batch.getByRole('button',{name:'Stop after this file'}).click();await expect.poll(()=>page.evaluate(()=>typeof (window as unknown as {__finishBatchImage?:()=>void}).__finishBatchImage)).toBe('function');
  await page.evaluate(()=>(window as unknown as {__finishBatchImage:()=>void}).__finishBatchImage());
  await expect(batch.getByRole('status')).toContainText('1 of 2 ready');await expect(batch.getByRole('listitem').last()).toContainText('queued');await expect(batch.getByRole('button',{name:'Save finished images as ZIP'})).toBeEnabled();
  await batch.getByLabel('Output format').selectOption('jpeg');
  await batch.getByRole('button',{name:'Resume remaining files',exact:true}).click();
  await expect(batch.getByRole('status')).toContainText('2 of 2 ready');
  const resumed=page.waitForEvent('download');await batch.getByRole('button',{name:'Save finished images as ZIP'}).click();
  const zip=await JSZip.loadAsync(await readFile((await (await resumed).path())!));
  expect(Object.keys(zip.files).filter(name=>name.endsWith('.png'))).toHaveLength(2);
});

test('batch selection bounds the queue and rejects invalid dimensions without discarding inputs',async({page})=>{
  await page.goto('/tools/resize');await page.getByRole('button',{name:'Multiple files',exact:true}).click();const batch=page.getByRole('region',{name:'Batch image files'});const png=await readFile(pngPath);
  await batch.locator('input[type=file]').setInputFiles(Array.from({length:21},(_,i)=>({name:`image-${i}.png`,mimeType:'image/png',buffer:png})));
  await expect(batch.getByRole('listitem')).toHaveCount(20);await expect(page.getByText(/1 file\(s\) exceeded the batch limits/)).toBeVisible();
  await batch.getByLabel('Batch width (px)').fill('-1');await batch.getByRole('button',{name:'Process 20 images'}).click();await expect(page.getByText('Enter at least one dimension, using whole pixels between 1 and 16,384.')).toBeVisible();await expect(batch.getByRole('listitem')).toHaveCount(20);await expect(batch.getByRole('status')).toContainText('0 of 20 ready');
});

test('visible-edge cleanup previews and exports the actual crop, without claiming SynthID removal',async({page})=>{
  await page.goto('/tools/image-cleanup');await expect(page.getByText('This tool does not detect SynthID or verify its removal.',{exact:false})).toBeVisible();
  await page.locator('input[type=file]').setInputFiles(pngPath);await expect(page.getByLabel('Bottom trim (px)')).toBeEnabled();
  await page.getByLabel('Bottom trim (px)').fill('99999');await page.getByRole('button',{name:'Create cropped preview',exact:true}).click();await expect(page.getByText(/Enter whole non-negative edge trims/)).toBeVisible();
  const original=await page.locator('main img').first().evaluate(async element=>{const image=element as HTMLImageElement;await image.decode();return {width:image.naturalWidth,height:image.naturalHeight};});
  await page.getByLabel('Bottom trim (px)').fill('10');await page.getByLabel('Right trim (px)').fill('12');await page.getByRole('button',{name:'Create cropped preview',exact:true}).click();await expect(page.getByAltText('Cropped image preview')).toBeVisible();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save cropped PNG',exact:true}).click();const download=await pending;const png=await readFile((await download.path())!);expect(png.readUInt32BE(16)).toBe(original.width-12);expect(png.readUInt32BE(20)).toBe(original.height-10);
  await expect(page.getByAltText('sample.png')).toBeVisible();
});
