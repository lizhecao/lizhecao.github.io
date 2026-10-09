import {cp,mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
const destination=process.argv[2];
if(!destination)throw Error('Usage: node tools/block-play-3d/prepare-preview.mjs <empty preview directory>');
const out=resolve(destination),root=new URL('../../',import.meta.url);
let exists=false;try{await access(out);exists=true;}catch{}
if(exists)throw Error('Preview target must not already exist; inspect any existing release first.');
await mkdir(out,{recursive:true});await cp(new URL('public/block-play/',root),out,{recursive:true});
async function transform(file,fn){await writeFile(resolve(out,file),fn(await readFile(resolve(out,file),'utf8')));}
await transform('app.js',s=>s.replaceAll('block-lab-','block-lab-preview-'));
await transform('index.html',s=>s.replace('小小双手，大大想象','新版验收预览 · 进度单独保存').replace('<main>','<main><p class="header-note">新版验收预览 · <a href="./benchmark.html">打开 30 秒性能测试 ↗</a></p>'));
await transform('sw.js',s=>s.replaceAll('20261009-v17','20261009-v17-preview1').replace("'./index.html',","'./index.html', './benchmark.html',").replaceAll("isNavigation ? new URL('./index.html', scope).href : cleanURL.href","isNavigation && !CORE_URLS.has(cleanURL.href) ? new URL('./index.html', scope).href : cleanURL.href"));
await transform('pwa.js',s=>s.replaceAll('20261009-v17','20261009-v17-preview1'));
await writeFile(resolve(out,'benchmark.html'),(await readFile(new URL('test/block-play-3d-benchmark.html',root),'utf8')).replaceAll('../source/block-play/','./'));
await writeFile(resolve(out,'.gitattributes'),'vendor/three-0.186.1.mjs linguist-generated=true -whitespace\n');
console.log('Prepared isolated acceptance preview:',out);
