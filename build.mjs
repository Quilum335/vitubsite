import {build} from 'esbuild';
await build({entryPoints:['src/viewer.js'],bundle:true,minify:true,format:'esm',outfile:'dist/assets/viewer.js',target:['es2022'],legalComments:'eof'});
console.log('3D viewer bundled');
