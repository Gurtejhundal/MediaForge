const { chromium, expect }=require('@playwright/test');
const { mkdir }=require('node:fs/promises');
const path=require('node:path');
(async()=>{
  const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROME_CHANNEL?{channel:'chrome'}:{});
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();
  const base=process.env.MEDIAFORGE_CAPTURE_URL||'http://127.0.0.1:4317';
  await mkdir('docs/readme',{recursive:true});await mkdir('work/readme-frames',{recursive:true});
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>!document.body.innerText.includes("Checking"));
  await page.screenshot({path:'docs/readme/workbench-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/readme/workbench-mobile.png'});
  await page.setViewportSize({width:1280,height:900});
  await page.goto(`${base}/tools/qr-generator`);await page.locator('section[aria-label="QR generator workspace"]').scrollIntoViewIfNeeded();
  const frame=async(index)=>{await page.screenshot({path:`work/readme-frames/frame-${String(index).padStart(2,'0')}.png`});};
  await frame(0);await page.getByLabel('Text or URL').fill('https://example.com/my-portfolio');await frame(1);
  await page.getByRole('button',{name:'Generate locally',exact:true}).click();await page.getByAltText('Generated QR code').waitFor();await frame(2);
  await page.locator('section[aria-label="QR generator workspace"]').screenshot({path:'docs/readme/qr-workspace.png'});
  await page.getByRole('button',{name:'SVG',exact:true}).click();await page.getByRole('button',{name:'Generate locally',exact:true}).click();await expect(page.getByRole('button',{name:'Generate locally',exact:true})).toBeEnabled();await frame(3);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download QR code',exact:true}).click();const output=await pending;await output.saveAs(path.resolve('work/readme-frames/qr-code.svg'));await frame(4);
  await page.setViewportSize({width:390,height:844});await page.locator('section[aria-label="QR generator workspace"]').screenshot({path:'docs/readme/qr-mobile.png'});
  await browser.close();
  console.log('Captured real workbench, mobile and QR workflow screenshots.');
})().catch(error=>{console.error(error);process.exitCode=1;});
// Encode sampled real states using ffmpeg (no fake product animation):
// ffmpeg -framerate 1 -i work/readme-frames/frame-%02d.png -vf 'scale=760:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse' -loop 0 docs/readme/qr-workflow.gif
