import {build} from 'esbuild';
import {copyFile} from 'node:fs/promises';
const root=new URL('../../source/block-play/vendor/',import.meta.url);
await build({entryPoints:[new URL('entry.mjs',import.meta.url).pathname],outfile:new URL('three-0.186.1.mjs',root).pathname,bundle:true,format:'esm',target:'es2020',minify:true});
await copyFile(new URL('node_modules/three/LICENSE',import.meta.url),new URL('THREE-LICENSE.txt',root));
