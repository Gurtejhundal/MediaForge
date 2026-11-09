import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import { spawn } from 'node:child_process';
const sample = path.resolve('tests/fixtures/sample.png');

test('tool search works with keyboard, clear and no matches on mobile', async ({page}) => {
  await page.setViewportSize({width:390,height:844}); await page.goto('/');
  const directory=page.locator('#tool-index');
  await page.getByLabel('Find a tool').fill('resize');
  await expect(directory.getByRole('link',{name:/Image resizer/})).toBeVisible();
  await page.getByLabel('Find a tool').fill('no-such-tool');
  await expect(directory.getByRole('status')).toContainText('No matching tools');
  await page.getByRole('button',{name:'Clear search',exact:true}).click();
  await expect(directory.getByRole('status')).toContainText('18 of 18');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('leaving a working image asks before discarding and Cancel keeps the draft', async ({page}) => {
  await page.goto('/tools/resize'); await page.locator('input[type=file]').setInputFiles(sample);
  await page.getByLabel('Width (px)',{exact:true}).fill('123');
  page.once('dialog', dialog=>dialog.dismiss());
  await page.getByRole('link',{name:'MediaForge home',exact:true}).click();
  await expect(page).toHaveURL(/\/tools\/resize/); await expect(page.getByLabel('Width (px)',{exact:true})).toHaveValue('123');
  page.once('dialog', dialog=>dialog.accept());
  await page.getByRole('link',{name:'MediaForge home',exact:true}).click(); await expect(page).toHaveURL(/\/$/);
});

test('batch preferences survive reopening without persisting files or image content', async ({page}) => {
  await page.addInitScript(() => {
    const original = window.setTimeout.bind(window);
    window.setTimeout = ((...args: Parameters<typeof window.setTimeout>) => original(args[0], args[1] === 0 ? 300 : args[1], ...args.slice(2))) as typeof window.setTimeout;
  });
  await page.goto('/tools/resize'); await page.getByRole('button',{name:'Multiple files',exact:true}).click();
  await page.getByLabel('Batch width (px)').fill('91'); await page.getByLabel('Batch height (px)').fill('47');
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('mediaforge.setting.batch.resize.width'))).toBe('"91"');
  await page.reload(); await page.getByRole('button',{name:'Multiple files',exact:true}).click();
  await expect(page.getByLabel('Batch width (px)')).toHaveValue('91'); await expect(page.getByLabel('Batch height (px)')).toHaveValue('47');
  expect(await page.evaluate(()=>Object.values(localStorage).join(' '))).not.toContain('sample.png');
});

test('retry failed batch items preserves finished bytes rather than reprocessing successes', async ({page}) => {
  await page.goto('/tools/format-converter'); await page.getByRole('button',{name:'Multiple files',exact:true}).click();
  const region=page.getByRole('region',{name:'Batch image files'});
  await region.locator('input[type=file]').setInputFiles([{name:'good.png',mimeType:'image/png',buffer:await readFile(sample)},{name:'bad.png',mimeType:'image/png',buffer:Buffer.from('broken')}]);
  await region.getByRole('button',{name:'Process 2 images',exact:true}).click(); await expect(region.getByRole('status')).toContainText('1 of 2 ready');
  const downloadBefore=page.waitForEvent('download'); await region.getByRole('button',{name:'Save good.png',exact:true}).click(); const before=await readFile((await (await downloadBefore).path())!);
  // A changed setting must not replace successful results during retry.
  await region.getByLabel('Output format').selectOption('jpeg');
  await region.getByRole('button',{name:'Retry failed files',exact:true}).click(); await expect(region.getByRole('button',{name:'Retry failed files'})).toBeEnabled();
  const downloadAfter=page.waitForEvent('download'); await region.getByRole('button',{name:'Save good.png',exact:true}).click(); const after=await readFile((await (await downloadAfter).path())!);
  expect(after).toEqual(before);
  const zipped=page.waitForEvent('download'); await region.getByRole('button',{name:'Save finished images as ZIP'}).click(); const zip=await JSZip.loadAsync(await readFile((await (await zipped).path())!));
  const report=JSON.parse(await zip.file('batch-report.json')!.async('string')); expect(report[0].status).toBe('done'); expect(report[1].status).toBe('error');
});

test('corrupt cropper input stops loading and offers recovery', async ({page}) => {
  await page.goto('/tools/image-cleanup');
  await page.locator('input[type=file]').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('broken')});
  await expect(page.getByRole('button',{name:'Choose another image',exact:true})).toBeVisible();
  await expect(page.getByText('Reading image dimensions…',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Choose another image',exact:true}).click();
  await page.locator('input[type=file]').setInputFiles(sample); await expect(page.getByLabel('Bottom trim (px)')).toBeEnabled();
});

test('a transient encoder failure can recover without stale error or rerunning successes', async ({page}) => {
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.toBlob;let count=0;HTMLCanvasElement.prototype.toBlob=function(callback,...args){count++;if(count===2){callback(null);return;}return original.call(this,callback,...args);};});
  await page.goto('/tools/format-converter');await page.getByRole('button',{name:'Multiple files',exact:true}).click();
  const batch=page.getByRole('region',{name:'Batch image files'});const png=await readFile(sample);
  await batch.locator('input[type=file]').setInputFiles([{name:'first.png',mimeType:'image/png',buffer:png},{name:'retry.png',mimeType:'image/png',buffer:png}]);
  await batch.getByRole('button',{name:'Process 2 images',exact:true}).click();await expect(batch.getByRole('status')).toContainText('1 of 2 ready');
  await batch.getByRole('button',{name:'Retry failed files',exact:true}).click();await expect(batch.getByRole('status')).toContainText('2 of 2 ready');
  await expect(batch.getByRole('button',{name:'Retry failed files',exact:true})).toHaveCount(0);
  await expect(batch.getByRole('listitem').last()).not.toContainText('error');
});

test('browser connects to the actual authenticated local companion and handles unavailable CUDA', async ({page,baseURL}) => {
  const child=spawn(process.env.pythonLocation ? path.join(process.env.pythonLocation, process.platform==='win32'?'python.exe':'bin/python3') : process.platform==='win32'?'python':'python3',['services/invisible-watermarks/companion.py','--port','0','--origin',baseURL!],{stdio:['ignore','pipe','pipe']});
  try {
    const connection=await new Promise<{port:string;token:string}>((resolve,reject)=>{
      let output='';let stderr='';const timeout=setTimeout(()=>reject(new Error('Local companion startup timed out: '+stderr)),30000);
      child.stderr.on('data',data=>{stderr=(stderr+data.toString()).slice(-2000)});
      child.once('exit',code=>{clearTimeout(timeout);reject(new Error(`Local companion exited (${code}): ${stderr}`))});
      child.once('error',error=>{clearTimeout(timeout);reject(error)});
      child.stdout.on('data',data=>{output+=data.toString();const port=/Local companion: http:\/\/127\.0\.0\.1:(\d+)/.exec(output)?.[1];const token=/Session token \(paste into MediaForge; never share\): ([A-Za-z0-9_-]+)/.exec(output)?.[1];if(port&&token){clearTimeout(timeout);resolve({port,token})}});
    });
    await page.goto('/tools/image-cleanup');await page.getByText('Experimental invisible-watermark processing · Local NVIDIA GPU',{exact:true}).click();
    const panel=page.getByLabel('Experimental local GPU processing');await panel.getByLabel('Companion port').fill(connection.port);await panel.getByLabel('Session token (kept in this tab only)').fill(connection.token);
    await panel.getByRole('button',{name:'Check local GPU connection',exact:true}).click();await expect(panel.getByRole('status')).toContainText('not installed');
    await expect(panel.getByRole('button',{name:'Regenerate selected images locally'})).toBeDisabled();
  } finally {child.kill();}
});

test('GPU panel refuses a missing engine and does not send files', async ({page}) => {
  let submitted=0;
  await page.route('http://127.0.0.1:8765/**', async route=>{
    if(route.request().method()==='POST')submitted++;
    await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({status:'unavailable',message:'No NVIDIA CUDA engine is installed.'})});
  });
  await page.goto('/tools/image-cleanup'); await page.getByText('Experimental invisible-watermark processing · Local NVIDIA GPU',{exact:true}).click();
  const panel=page.getByLabel('Experimental local GPU processing');
  await panel.getByLabel('Session token (kept in this tab only)').fill('test-only-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  await panel.getByRole('button',{name:'Check local GPU connection',exact:true}).click();
  await expect(panel.getByRole('status')).toContainText('No NVIDIA CUDA');
  await expect(panel.getByRole('button',{name:'Regenerate selected images locally'})).toBeDisabled(); expect(submitted).toBe(0);
  expect(await page.evaluate(()=>Object.values(localStorage).join(' '))).not.toContain('test-only-token');
});

test('video export retains a real audible soundtrack and cancellation releases processing', async ({page}) => {
  test.setTimeout(60000);
  await page.goto('/tools/video-converter');
  const input=await page.evaluate(async()=>{
    const canvas=document.createElement('canvas'); canvas.width=96; canvas.height=64;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='orange';ctx.fillRect(0,0,96,64);
    const audio=new AudioContext();await audio.resume(); const oscillator=audio.createOscillator();oscillator.frequency.value=440;
    const destination=audio.createMediaStreamDestination();oscillator.connect(destination);const stream=canvas.captureStream(12);destination.stream.getAudioTracks().forEach(track=>stream.addTrack(track));
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8,opus'});const chunks:BlobPart[]=[];
    const result=new Promise<Blob>(resolve=>{recorder.ondataavailable=event=>chunks.push(event.data);recorder.onstop=()=>resolve(new Blob(chunks,{type:'video/webm'}));});
    const draw=setInterval(()=>{ctx.fillRect(0,0,96,64)},60);oscillator.start();recorder.start();await new Promise(resolve=>setTimeout(resolve,1200));recorder.stop();
    const bytes=Array.from(new Uint8Array(await (await result).arrayBuffer())); clearInterval(draw);oscillator.stop();stream.getTracks().forEach(track=>track.stop());await audio.close();return bytes;
  });
  await page.locator('input[type=file]').setInputFiles({name:'tone.webm',mimeType:'video/webm',buffer:Buffer.from(input)});
  const saved=page.waitForEvent('download'); await page.getByRole('button',{name:'Export Local WEBM',exact:true}).click(); const output=await readFile((await (await saved).path())!);
  const sound=await page.evaluate(async bytes=>{const context=new AudioContext();try {const audio=await context.decodeAudioData(new Uint8Array(bytes).buffer);const pcm=audio.getChannelData(0);return {duration:audio.duration,rms:Math.sqrt(pcm.reduce((sum,value)=>sum+value*value,0)/pcm.length)};}finally{await context.close();}},Array.from(output));
  expect(sound.duration).toBeGreaterThan(0.8); expect(sound.rms).toBeGreaterThan(0.01);
  await page.getByRole('button',{name:'Muted Local Export',exact:true}).click();
  const muted=page.waitForEvent('download');await page.getByRole('button',{name:'Export Local WEBM',exact:true}).click();
  const silent=await readFile((await (await muted).path())!);expect(silent.includes(Buffer.from('OpusHead'))).toBe(false);
  let extraDownloads=0;page.on('download',()=>extraDownloads++);
  await page.getByRole('button',{name:'Export Local WEBM',exact:true}).click(); await page.getByRole('button',{name:'Cancel processing',exact:true}).click();
  await expect(page.getByRole('button',{name:'Export Local WEBM',exact:true})).toBeEnabled(); expect(extraDownloads).toBe(0);
});

test('background model download can be cancelled without a partial result and restarted after failure', async ({page, context}) => {
  let modelRequested = false;
  let release: (() => void) | undefined;
  const held = new Promise<void>(resolve => { release = resolve; });
  await context.route('https://staticimgly.com/**', async route => {
    modelRequested = true;
    await held;
    await route.fulfill({status:503,body:'Synthetic model outage',headers:{'Access-Control-Allow-Origin':'*'}}).catch(()=>{});
  });
  await page.goto('/tools/bg-remover');
  await page.locator('input[type=file]').setInputFiles(sample);
  await page.getByRole('button',{name:'Generate transparent PNG',exact:true}).click();
  await expect.poll(()=>modelRequested).toBe(true);
  await page.getByRole('button',{name:'Cancel processing',exact:true}).click();
  await expect(page.getByRole('button',{name:'Generate transparent PNG',exact:true})).toBeEnabled();
  await expect(page.getByRole('button',{name:'Download Transparent PNG',exact:true})).toHaveCount(0);
  release!();
  await page.getByRole('button',{name:'Generate transparent PNG',exact:true}).click();
  await expect(page.getByRole('button',{name:'Generate transparent PNG',exact:true})).toBeEnabled({timeout:15000});
  await expect(page.getByRole('button',{name:'Download Transparent PNG',exact:true})).toHaveCount(0);
});

test('an invalid GPU selection disarms previous files and requires renewed consent', async ({page}) => {
  await page.route('http://127.0.0.1:8765/check', route=>route.fulfill({contentType:'application/json',body:JSON.stringify({status:'ready_for_trial',gpu:'Simulated test GPU',gpu_free_bytes:12*1024**3})}));
  await page.goto('/tools/image-cleanup');
  await page.getByText('Experimental invisible-watermark processing · Local NVIDIA GPU',{exact:true}).click();
  const panel=page.getByLabel('Experimental local GPU processing');
  await panel.getByLabel('Session token (kept in this tab only)').fill('a'.repeat(43));
  await panel.getByRole('button',{name:'Check local GPU connection',exact:true}).click();
  const input=panel.locator('input[type=file]');
  await input.setInputFiles(sample);
  const consent=panel.getByRole('checkbox'); await consent.check();
  await expect(panel.getByRole('button',{name:'Regenerate selected images locally',exact:true})).toBeEnabled();
  const bytes=await readFile(sample);
  await input.setInputFiles(Array.from({length:21},(_,index)=>({name:`image-${index}.png`,mimeType:'image/png',buffer:bytes})));
  await expect(panel.getByRole('status')).toContainText('Selection exceeds');
  await expect(consent).not.toBeChecked();
  await expect(panel.getByRole('button',{name:'Regenerate selected images locally',exact:true})).toBeDisabled();
  expect(await input.evaluate(element=>(element as HTMLInputElement).files?.length)).toBe(0);
});
