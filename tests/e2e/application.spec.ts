import { test, expect, type Page, type Download } from '@playwright/test';
// These journeys explicitly discard intermediate work; dedicated guard tests cover staying.
test.beforeEach(async ({page}) => { page.on('dialog', dialog => dialog.accept()); });
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

const fixture = (name: string) => path.resolve('tests/fixtures', name==='form.pdf'?'form.pdf':`sample.${name}`);
const routes = ['/', '/report', ...['audio-studio','bg-remover','compress','file-converter','format-converter','image-enhancer','image-cleanup','image-modifier','pdf-organizer','png-to-favicon','qr-generator','resize','video-converter','video-downloader','video-to-audio','video-to-image','video-upscaler','watermark-remover'].map(name=>`/tools/${name}`)];
async function bytes(download: Download) { expect(await download.failure()).toBeNull(); return readFile((await download.path())!); }
async function downloadAfter(page: Page, action: () => Promise<unknown>) { const pending=page.waitForEvent('download'); await action(); return pending; }

test('all 20 pages render at desktop and mobile widths, without runtime errors or horizontal overflow', async ({page}) => {
  const errors: string[]=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('response',r=>{if(r.status()>=500)errors.push(`${r.status()} ${r.url()}`);}); page.on('requestfailed',r=>{if(r.url().includes('/_next/static/') && r.failure()?.errorText !== 'net::ERR_ABORTED')errors.push(`Asset failed: ${r.url()}`);});
  for(const width of [1440,390,320]) {
    await page.setViewportSize({width,height:900});
    for(const route of routes) {
      const response=await page.goto(route); expect(response?.status(),route).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), `${route} at ${width}px overflows`).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test('keyboard skip link and reduced-motion preference work', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'}); await page.goto('/'); await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'Skip to workbench'})).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#main-content')).toBeFocused();
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});

test('mobile tool navigation expands by keyboard and closes after choosing another tool', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/tools/qr-generator');
  const navigation=page.getByRole('navigation',{name:'Media tools',includeHidden:true});
  await expect(navigation).toBeHidden();
  const toggle=page.getByRole('button',{name:'Choose another tool',exact:true});
  await toggle.focus();await page.keyboard.press('Enter');
  await expect(navigation).toBeVisible();await expect(page.getByRole('button',{name:'Close tool list'})).toHaveAttribute('aria-expanded','true');
  await navigation.getByRole('link',{name:/Image resizer/}).click();
  await expect(page).toHaveURL(/\/tools\/resize$/);await expect(navigation).toBeHidden();
  await expect(page.getByRole('button',{name:'Choose another tool',exact:true})).toBeVisible();
});

test('QR export keeps its generated format after settings change and survives blocked storage', async ({page}) => {
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}});});
  await page.goto('/tools/qr-generator'); await page.getByLabel('Text or URL').fill('https://example.com/mediaforge');
  await page.getByRole('button',{name:'Generate locally',exact:true}).click(); await expect(page.getByAltText('Generated QR code')).toBeVisible();
  await page.getByRole('button',{name:'SVG',exact:true}).click();
  const download=await downloadAfter(page,()=>page.getByRole('button',{name:/Download/}).first().click());
  expect(download.suggestedFilename()).toBe('qr-code.png'); expect((await bytes(download)).subarray(1,4).toString()).toBe('PNG');
  await page.goto('/'); await expect(page.locator('h1')).toBeVisible();
});

test('QR PNG, JPEG and SVG outputs contain the corresponding bytes, with repeatable exports and persisted counters', async ({page})=>{
  await page.goto('/tools/qr-generator');await page.getByLabel('Text or URL').fill('A local workflow');
  for(const format of ['PNG','JPG','SVG']) {
    await page.getByRole('button',{name:format,exact:true}).click();await page.getByRole('button',{name:'Generate locally',exact:true}).click();await expect(page.getByRole('button',{name:'Generate locally',exact:true})).toBeEnabled();
    const data=await bytes(await downloadAfter(page,()=>page.getByRole('button',{name:/Download/}).first().click()));
    if(format==='PNG')expect(data.subarray(1,4).toString()).toBe('PNG');
    if(format==='JPG')expect(data.subarray(0,2).toString('hex')).toBe('ffd8');
    if(format==='SVG')expect(data.toString()).toContain('<svg');
  }
  await page.reload(); expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('mediaforge.localActivity.v1')!).totalExports)).toBe(3);
});

for(const [route,button,signature] of [['format-converter','Convert to','PNG'],['compress','Compress Image','WEBP'],['resize','Resize Image','PNG'],['png-to-favicon','Generate','ZIP']] as const) {
  test(`local ${route} accepts a file and generates a real download`,async({page})=>{
    const uploads: string[]=[];page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/convert/'))uploads.push(r.url());});
    await page.goto(`/tools/${route}`);await page.locator('input[type=file]').setInputFiles(fixture('png'));
    if(route==='format-converter')await page.getByRole('button',{name:/^png$/i,exact:true}).click();
    if(route==='png-to-favicon')await page.getByRole('button',{name:new RegExp(`^${button}`)}).click();
    const output=await bytes(await downloadAfter(page,()=>page.getByRole('button',{name:route==='png-to-favicon'?/Download/:new RegExp(`^${button}`)}).click()));
    if(signature==='PNG')expect(output.subarray(1,4).toString()).toBe('PNG');
    if(signature==='WEBP')expect(output.subarray(8,12).toString()).toBe('WEBP');
    if(signature==='ZIP') {
      const zip=await JSZip.loadAsync(output);expect(Object.keys(zip.files).some(n=>n.endsWith('favicon.ico'))).toBe(true);
      const png=await zip.file(Object.keys(zip.files).find(n=>n.endsWith('favicon-32x32.png'))!)!.async('uint8array');
      const alpha=await page.evaluate(async(data)=>{const image=await createImageBitmap(new Blob([new Uint8Array(data)],{type:'image/png'}));const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const context=canvas.getContext('2d')!;context.drawImage(image,0,0);return [context.getImageData(0,0,1,1).data[3],context.getImageData(16,16,1,1).data[3]];},Array.from(png));
      expect(alpha).toEqual([0,255]);
    }
    expect(uploads).toEqual([]);
  });
}

test('image modifier and detailer complete preview to export, invalid dimensions recover',async({page})=>{
  await page.goto('/tools/image-modifier');await page.locator('input[type=file]').setInputFiles(fixture('png'));
  await page.getByRole('button',{name:/Modify|Apply|Process/}).click();await expect(page.getByAltText('Modified output')).toBeVisible();
  expect((await bytes(await downloadAfter(page,()=>page.getByRole('button',{name:/Download/}).first().click()))).length).toBeGreaterThan(100);
  await page.goto('/tools/resize');await page.locator('input[type=file]').setInputFiles(fixture('png'));await page.getByLabel('Width (px)').fill('-1');await page.getByRole('button',{name:'Resize Image'}).click();await expect(page.getByText('Dimensions must be whole numbers between 1 and 16,384.')).toBeVisible();
  await page.getByLabel('Width (px)').fill('120');const png=await bytes(await downloadAfter(page,()=>page.getByRole('button',{name:'Resize Image'}).click()));expect(png.readUInt32BE(16)).toBe(120);
  await page.goto('/tools/image-enhancer');await page.locator('input[type=file]').setInputFiles(fixture('png'));await page.getByRole('button',{name:'Create Detail Upscale',exact:true}).click();
  expect((await bytes(await downloadAfter(page,()=>page.getByRole('button',{name:/Download/}).first().click()))).subarray(1,4).toString()).toBe('PNG');
});

test('a slow old image cannot overwrite the next image dimensions or an edited export size',async({page})=>{
  await page.addInitScript(()=>{
    const decode=window.createImageBitmap.bind(window);let first=true;
    Object.defineProperty(window,'createImageBitmap',{value:async(source:ImageBitmapSource)=>{
      const bitmap=await decode(source);
      if(first){first=false;await new Promise<void>(resolve=>{Object.defineProperty(window,'__finishOldImage',{value:resolve});});}
      return bitmap;
    }});
  });
  await page.goto('/tools/resize');await page.locator('input[type=file]').setInputFiles(fixture('png'));
  await expect(page.getByLabel('Width (px)')).toBeDisabled();
  await page.getByRole('button',{name:'Remove file',exact:true}).click();
  await page.locator('input[type=file]').setInputFiles(fixture('png'));
  await expect(page.getByLabel('Width (px)')).toBeEnabled();await page.getByLabel('Width (px)').fill('96');
  await page.evaluate(()=>(window as unknown as {__finishOldImage:()=>void}).__finishOldImage());
  const output=await bytes(await downloadAfter(page,()=>page.getByRole('button',{name:'Resize Image',exact:true}).click()));
  expect(output.readUInt32BE(16)).toBe(96);
});

test('universal converter preserves CSV data and supports its displayed SVG output',async({page})=>{
  await page.goto('/tools/file-converter');await page.locator('input[type=file]').setInputFiles(fixture('csv'));
  const data=await bytes(await downloadAfter(page,()=>page.getByRole('button',{name:'Convert to JSON',exact:true}).click()));expect(JSON.parse(data.toString())[0]).toEqual({name:'Ada, L',note:'line one\nline two'});
  await page.getByRole('button',{name:'Remove File'}).click();await page.locator('input[type=file]').setInputFiles(fixture('png'));await page.getByRole('button',{name:'SVG',exact:true}).click();
  expect((await bytes(await downloadAfter(page,()=>page.getByRole('button',{name:'Convert to SVG',exact:true}).click()))).toString()).toContain('<svg');
});

for(const [name,extension] of [['Audio to WAV','wav'],['Video to audio','mp4'],['Trim / ringtone','wav'],['Merge audio','wav'],['Normalize','wav'],['Volume','wav'],['Reverse','wav'],['Speed','wav']]) {
  test(`Audio Studio: ${name} generates decodable WAV`,async({page})=>{
    await page.goto('/tools/audio-studio');await page.locator('button').filter({hasText:new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`)}).first().click();
    await page.locator('input[type=file]').setInputFiles(name==='Merge audio'?[fixture(extension),fixture(extension)]:fixture(extension));
    await page.getByRole('button',{name:`Run ${name}`,exact:true}).click();
    const wav=await bytes(await downloadAfter(page,()=>page.getByRole('button',{name:/Download/}).first().click()));expect(wav.subarray(0,4).toString()).toBe('RIFF');expect(wav.subarray(8,12).toString()).toBe('WAVE');expect(wav.length).toBeGreaterThan(44);const duration=wav.readUInt32LE(40)/(wav.readUInt32LE(24)*wav.readUInt16LE(32));expect(duration).toBeGreaterThan(name==='Merge audio'?1.9:0.9);expect(duration).toBeLessThan(name==='Merge audio'?2.1:1.1);
  });
}

const documents: Array<[string,string,number?]>=[['Merge PDF','pdf',6],['Split PDF','pdf',3],['Extract pages','pdf',3],['Organize PDF','pdf',3],['Scan to PDF','png',1],['Compress PDF','pdf',3],['Repair PDF','pdf',3],['JPG to PDF','png',1],['Word to PDF','docx',1],['PowerPoint to PDF','pptx',1],['Excel to PDF','xlsx',1],['HTML to PDF','html',1],['Rotate PDF','pdf',3],['Add page numbers','pdf',3],['Add watermark','pdf',3],['Crop PDF','pdf',3],['Edit PDF','pdf',3],['PDF forms','form.pdf',3],['Sign PDF','pdf',3]];
for(const [name,extension,count] of documents) {
  test(`Document Studio: ${name} exports a readable PDF`,async({page})=>{
    await page.goto('/tools/pdf-organizer');await page.locator('button').filter({hasText:new RegExp(`^${name}`)}).first().click();
    await page.locator('input[type=file]').setInputFiles(name==='Merge PDF'?[fixture(extension),fixture(extension)]:fixture(extension));
    const data=await bytes(await downloadAfter(page,()=>page.getByRole('button',{name:`Run ${name}`,exact:true}).click()));
    const pdf=await PDFDocument.load(data);expect(pdf.getPageCount()).toBe(count);if(name==='PDF forms')expect(pdf.getForm().getFields()).toHaveLength(0);
  });
}
for(const name of ['PDF to JPG','PDF to Word','PDF to PowerPoint','PDF to Excel','Compare PDF']) {
  test(`Document Studio: ${name} returns a real export`,async({page})=>{
    await page.goto('/tools/pdf-organizer');await page.locator('button').filter({hasText:new RegExp(`^${name}`)}).first().click();await page.locator('input[type=file]').setInputFiles(name==='Compare PDF'?[fixture('pdf'),fixture('pdf')]:fixture('pdf'));
    const output=await bytes(await downloadAfter(page,()=>page.getByRole('button',{name:`Run ${name}`,exact:true}).click()));
    if(name==='Compare PDF')expect(output.toString()).toMatch(/page|identical|differences/i);else expect(Object.keys((await JSZip.loadAsync(output)).files).length).toBeGreaterThan(0);
  });
}

test('feedback failure preserves the message and exposes a direct issue fallback',async({page})=>{
  await page.goto('/report');await page.getByLabel('03 / What should I know?').fill('The sample feedback must remain available after failure.');
  await page.getByRole('button',{name:'Send report',exact:true}).click();await expect(page.locator('form [role=alert]')).toContainText('not been sent');await expect(page.getByLabel('03 / What should I know?')).toHaveValue('The sample feedback must remain available after failure.');await expect(page.getByRole('link',{name:'Open GitHub issue'})).toHaveAttribute('href',/github.com\/Gurtejhundal\/MediaForge\/issues\/new/);
});
test('API boundaries reject unsafe inputs and retired uploads',async({request})=>{
  expect((await request.post('/api/fetch-url',{data:{url:'http://127.0.0.1'}})).status()).toBe(410);
  for(const body of [null,[],{url:'file:///etc/passwd'},{url:'http://127.0.0.1/test.mp4'},{url:'http://[::1]/test.mp4'}])expect((await request.post('/api/convert/yt-download',{data:body})).status()).toBeGreaterThanOrEqual(400);
  for(const name of ['bg-remove','file-converter','image-modifier','pdf-organizer','png-to-favicon','qr','video-converter','video-to-image','upscale','watermark-remove','image-enhance','retired'])expect((await request.post(`/api/convert/${name}`,{data:{}})).status()).toBe(410);
  expect((await request.post('/api/report',{data:null})).status()).toBe(400);
  expect((await request.post('/api/report',{data:{message:'valid enough message'},headers:{origin:'https://attacker.example'}})).status()).toBe(403);
});

test('invalid structured input preserves the source and valid PDF page removal recovers after error',async({page})=>{
  await page.goto('/tools/file-converter');await page.locator('input[type=file]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await page.getByRole('button',{name:'Convert to CSV',exact:true}).click();await expect(page.getByText('invalid.json',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Convert to CSV',exact:true})).toBeEnabled();
  await page.goto('/tools/pdf-organizer');await page.locator('button').filter({hasText:/^Remove pages/}).first().click();await page.locator('input[type=file]').setInputFiles(fixture('pdf'));await page.getByLabel('Pages',{exact:true}).fill('1-999999999999');await page.getByRole('button',{name:'Run Remove pages',exact:true}).click();await expect(page.getByText('Page range must be between 1 and 3.',{exact:true})).toBeVisible();await page.getByLabel('Pages',{exact:true}).fill('2');const data=await bytes(await downloadAfter(page,()=>page.getByRole('button',{name:'Run Remove pages',exact:true}).click()));expect((await PDFDocument.load(data)).getPageCount()).toBe(2);
});

test('client-side navigation releases selected image Blob URLs',async({page})=>{
  await page.addInitScript(()=>{const revoked:string[]=[];Object.defineProperty(window,'__revokedUrls',{value:revoked});const original=URL.revokeObjectURL.bind(URL);URL.revokeObjectURL=(url:string)=>{revoked.push(url);original(url);};});
  await page.goto('/tools/resize');await page.locator('input[type=file]').setInputFiles(fixture('png'));const url=await page.locator('main img').first().getAttribute('src');expect(url).toMatch(/^blob:/);await page.locator('main a[href="/tools/compress"]').first().click();await expect(page).toHaveURL(/\/tools\/compress$/);await expect.poll(()=>page.evaluate((blobUrl)=>(window as unknown as {__revokedUrls:string[]}).__revokedUrls.includes(blobUrl!),url)).toBe(true);
});

test('downloader failures preserve input and recover for another request',async({page})=>{
  await page.goto('/tools/video-downloader');const input=page.getByLabel('Media URL');await input.fill('http://127.0.0.1/private.mp4');await page.getByRole('button',{name:'Download Now',exact:true}).click();await expect(page.getByText('Private, loopback, and reserved network addresses are not allowed.',{exact:true})).toBeVisible();await expect(input).toHaveValue('http://127.0.0.1/private.mp4');await expect(page.getByRole('button',{name:'Download Now',exact:true})).toBeEnabled();
  await input.fill('https://example.com/platform-page');await page.getByRole('button',{name:'Download Now',exact:true}).click();await expect(page.getByText('This server supports direct media links. Platform links require the owner to configure a trusted download provider.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Download Now',exact:true})).toBeEnabled();
});
