import test from 'node:test';
import assert from 'node:assert/strict';
import { isPublicAddress, publicUrl, fetchPublic, readJson } from '../../src/lib/network.ts';
import { canOpenExternal, isAppUrl } from '../../desktop/policy.cjs';

test('reserved address families, mapped IPs, metadata and private networks are denied', () => {
  for (const address of ['127.0.0.1','0.0.0.0','10.2.3.4','169.254.169.254','172.16.0.1','192.168.1.2','100.64.0.1','224.0.0.1','192.0.2.1','::1','::','::ffff:127.0.0.1','fe80::1','fc00::1','2001:db8::1','64:ff9b::7f00:1']) assert.equal(isPublicAddress(address),false,address);
  for (const address of ['93.184.216.34','2606:4700:4700::1111']) assert.equal(isPublicAddress(address),true,address);
});
test('public URLs reject ambiguous destinations, credentials and active schemes', () => {
  for (const value of ['file:///etc/passwd','javascript:alert(1)','http://user:pass@example.com','https://example.com:8080','not-url']) assert.throws(()=>publicUrl(value));
  assert.equal(publicUrl('https://example.com/video.mp4?q=1').protocol,'https:');
});
test('DNS-resolved loopback is blocked before making a connection', async () => {
  for (const url of ['http://127.1/media.mp4','http://2130706433/media.mp4','http://[::1]/media.mp4']) await assert.rejects(fetchPublic(url),/Private, loopback/);
});
test('JSON request boundary rejects cross-origin forms, malformed and oversized payloads', async () => {
  const make=(body,headers={})=>new Request('http://localhost/api/report',{method:'POST',headers:{'content-type':'application/json',...headers},body});
  for(const body of ['null','[]','{bad']) await assert.rejects(readJson(make(body)));
  await assert.rejects(readJson(make('{}',{'origin':'https://attacker.example'})),/Cross-origin/);
  await assert.rejects(readJson(make('{}',{'content-type':'text/plain'})),/application\/json/);
  await assert.rejects(readJson(make(JSON.stringify({message:'x'.repeat(20000)}))),/too large/);
  assert.deepEqual(await readJson(make('{"type":"bug"}')),{type:'bug'});
  assert.deepEqual(await readJson(make('{"type":"bug"}',{origin:'http://127.0.0.1:4317',host:'127.0.0.1:4317'})),{type:'bug'});
});
test('desktop cannot navigate to lookalike origins or execute external protocols', () => {
  assert.equal(isAppUrl('http://127.0.0.1:4318/tools/resize','http://127.0.0.1:4318'),true);
  assert.equal(isAppUrl('http://127.0.0.1:4318.evil.example','http://127.0.0.1:4318'),false);
  for(const url of ['file:///etc/passwd','javascript:alert(1)','https://github.com.attacker.com','https://user@github.com','https://github.com:444','http://github.com']) assert.equal(canOpenExternal(url),false,url);
  assert.equal(canOpenExternal('https://github.com/Gurtejhundal/MediaForge/issues'),true);
});
