import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
const [originArg,mode='draft']=process.argv.slice(2);
if(!originArg||!['draft','public'].includes(mode))throw Error('Usage: node prepare-seo.mjs https://your-domain public|draft');
const url=new URL(originArg);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Use a plain HTTPS origin');
const origin=url.origin;
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(dir,x.name)):[path.join(dir,x.name)])}
const routes=[];
for(const file of files('dist').filter(x=>x.endsWith('index.html'))){let s=readFileSync(file,'utf8');const route='/'+path.relative('dist',path.dirname(file)).replaceAll('\\','/')+(path.dirname(file)==='dist'?'':'/');const canonical=origin+(route==='/'?'/':route);routes.push(canonical);s=s.replace(/<link rel="canonical"[^>]*>/g,'').replace(/<meta property="og:url"[^>]*>/g,'');s=s.replace('</head>',`<link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"></head>`);s=s.replace(/<meta name="robots" content="[^"]*">/,`<meta name="robots" content="${mode==='public'?'index,follow':'noindex,nofollow'}">`);writeFileSync(file,s)}
writeFileSync('dist/robots.txt',mode==='public'?`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
writeFileSync('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(x=>`<url><loc>${x}</loc></url>`).join('')}</urlset>`);
console.log(`SEO ${mode}: ${routes.length} pages, canonical origin ${origin}`);
