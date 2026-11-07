const EXTERNAL_HOSTS = new Set(['github.com', 'gurtejbirsingh.vercel.app']);
function canOpenExternal(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.port && EXTERNAL_HOSTS.has(url.hostname); }
  catch { return false; }
}
function isAppUrl(value, origin) {
  try { return new URL(value).origin === origin; } catch { return false; }
}
module.exports = { canOpenExternal, isAppUrl };
