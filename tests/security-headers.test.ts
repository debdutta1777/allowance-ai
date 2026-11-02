import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../next.config.ts';

test('all responses prevent framing and content sniffing; planner only executes same-origin scripts', async () => {
  const rules = await (config.headers as () => Promise<Array<{source:string;headers:Array<{key:string;value:string}>}>>)();
  const global = Object.fromEntries(rules.find(rule => rule.source === '/:path*')!.headers.map(header => [header.key, header.value]));
  assert.equal(global['X-Frame-Options'], 'DENY');
  assert.equal(global['X-Content-Type-Options'], 'nosniff');
  assert.match(global['Permissions-Policy'], /camera=\(\)/);
  const planner = rules.find(rule => rule.source === '/planner.html')!.headers.find(header => header.key === 'Content-Security-Policy')!.value;
  assert.match(planner, /script-src 'self';/);
  assert.match(planner, /connect-src 'self';/);
  assert.match(planner, /object-src 'none';/);
  assert.match(planner, /frame-ancestors 'none';/);
  assert.doesNotMatch(planner, /unsafe-inline|unsafe-eval|https:\/\//);
});
