import { mkdir, readFile, writeFile, cp, rename } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

await mkdir('public', { recursive: true });
await cp('web', 'public', { recursive: true });
await cp('src/alert-parser.js', 'public/alert-parser.js');
await rename('public/index.html', 'public/planner.html');
for (const name of ['forecast', 'sample', 'money', 'imports', 'insights', 'category-model']) {
  const source = await readFile(`src/${name}.ts`, 'utf8');
  await writeFile(`public/${name}.js`, stripTypeScriptTypes(source, { mode: 'strip' }).replaceAll("from './money.ts'", "from './money.js'").replaceAll("from './forecast.ts'", "from './forecast.js'"));
}
console.log('Built static interface with the tested forecast engine.');
