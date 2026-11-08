import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';
const routes=['/','/report','/tools/qr-generator','/tools/resize','/tools/pdf-organizer','/tools/audio-studio','/tools/video-downloader','/tools/image-cleanup'];
test('principal surfaces meet automated WCAG A/AA checks',async({page})=>{
  test.setTimeout(90_000);
  for(const route of routes){await page.goto(route);await page.evaluate(()=>document.fonts.ready);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),route).toEqual([]);}
});
test('QR preview and keyboard video-region controls fit a mobile screen',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/tools/qr-generator');await page.getByLabel('Text or URL').fill('MediaForge');await page.getByRole('button',{name:'Generate locally',exact:true}).click();await expect(page.getByAltText('Generated QR code')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('/tools/watermark-remover');await page.locator('input[type=file]').setInputFiles(path.resolve('tests/fixtures/sample.mp4'));await page.getByLabel('Width',{exact:true}).fill('80');await expect(page.getByLabel('Width',{exact:true})).toHaveValue('80');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('batch controls and results remain accessible after selecting multiple files',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/tools/compress');await page.getByRole('button',{name:'Multiple files',exact:true}).click();
  const batch=page.getByRole('region',{name:'Batch image files'});await batch.locator('input[type=file]').setInputFiles([path.resolve('tests/fixtures/sample.png'),path.resolve('tests/fixtures/sample.svg')]);
  await batch.getByRole('button',{name:'Process 2 images',exact:true}).click();await expect(batch.getByRole('button',{name:'Save finished images as ZIP'})).toBeEnabled();
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
