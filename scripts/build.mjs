import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

await mkdir('dist', { recursive: true });
await cp('web', 'dist', { recursive: true });
for (const name of ['forecast', 'sample', 'money']) {
  const source = await readFile(`src/${name}.ts`, 'utf8');
  await writeFile(`dist/${name}.js`, stripTypeScriptTypes(source, { mode: 'strip' }));
}
console.log('Built static interface with the tested forecast engine.');
