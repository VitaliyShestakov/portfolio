import { copyFile, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkSite, root } from './lib/site.mjs';

export async function buildRelease(output = resolve(root, 'dist')) {
  const files = await checkSite();
  await rm(output, { recursive: true, force: true });
  let bytes = 0;
  for (const file of files) {
    const source = resolve(root, file);
    const destination = resolve(output, file);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
    bytes += (await stat(destination)).size;
  }
  return { output, files, bytes };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const release = await buildRelease();
  console.log(`Release ready: ${release.output} (${release.files.length} files, ${(release.bytes / 1024 / 1024).toFixed(2)} MiB).`);
}
