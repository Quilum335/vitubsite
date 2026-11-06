/* NORMAS UI: header, search palette, moodboard, folders, brief. No dependencies. */
(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cfg=window.NORMAS||{};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isHome=!!$('#characters');

/* header */
const header=$('.site-header');
const onScroll=()=>header?.classList.toggle('scrolled',scrollY>20);
addEventListener('scroll',onScroll,{passive:true});onScroll();
$('.menu-btn')?.addEventListener('click',e=>{const open=document.body.classList.toggle('menu-open');e.currentTarget.setAttribute('aria-expanded',open)});
$$('.drawer a').forEach(a=>a.addEventListener('click',()=>{document.body.classList.remove('menu-open');$('.menu-btn')?.setAttribute('aria-expanded','false')}));
const segLinks=$$('.seg a[href^="#"],.seg a[href^="/#"]');
if(isHome&&segLinks.length&&'IntersectionObserver' in window){
  const map=new Map(segLinks.map(a=>[a.getAttribute('href').replace('/',''),a]));
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){segLinks.forEach(a=>a.classList.remove('active'));map.get('#'+e.target.id)?.classList.add('active')}}),{rootMargin:'-45% 0px -50% 0px'});
  map.forEach((a,id)=>{const el=$(id);if(el)io.observe(el)});
}

/* reveal */
if('IntersectionObserver' in window&&!reduce){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});$$('.rv').forEach(el=>io.observe(el))}else $$('.rv').forEach(el=>el.classList.add('in'));

/* hero waves (stippled dunes) */
const cv=$('canvas.waves');
if(cv){
  const ctx=cv.getContext('2d');let w=0,h=0,dpr=1,t=0,visible=true,last=0;
  const layers=[...Array(7)].map((_,i)=>({y:.5+i*.075,amp:12+i*7,f1:.0035+i*.0004,f2:.009+i*.0007,ph:i*1.7,col:[[150,130,235],[132,112,226],[112,92,206],[92,74,184],[70,56,156],[50,40,120],[30,24,72]][i],dots:.55-i*.04}));
  const resize=()=>{const r=cv.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,1.5);w=r.width;h=r.height;cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw()};
  const crest=(L,x)=>h*L.y+Math.sin(x*L.f1+t*.5+L.ph)*L.amp+Math.sin(x*L.f2-t*.35+L.ph*2)*L.amp*.35;
  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const L of layers){
      ctx.beginPath();ctx.moveTo(0,h);
      for(let x=0;x<=w+8;x+=8)ctx.lineTo(x,crest(L,x));
      ctx.lineTo(w,h);ctx.closePath();
      const g=ctx.createLinearGradient(0,h*L.y-L.amp,0,h);const[c0,c1,c2]=L.col;
      g.addColorStop(0,`rgba(${c0+40},${c1+40},${c2+20},.95)`);g.addColorStop(.25,`rgb(${c0},${c1},${c2})`);g.addColorStop(1,'rgb(12,10,26)');
      ctx.fillStyle=g;ctx.fill();
      ctx.fillStyle=`rgba(235,228,255,${L.dots})`;
      for(let x=0;x<=w;x+=3){const y=crest(L,x);const n=(Math.sin(x*12.9898+L.ph*78.233)*43758.5453)%1;const j=Math.abs(n);ctx.fillRect(x,y+j*9-2,1.2,1.2);if(j>.6)ctx.fillRect(x+1,y+j*18,1,1)}
    }
  }
  const sparks=[...Array(70)].map(()=>({x:Math.random(),y:Math.random(),r:.6+Math.random()*1.6,v:.01+Math.random()*.03,p:Math.random()*6.28}));
  const drawSparks=dt=>{for(const s of sparks){s.y-=s.v*dt;s.x+=Math.sin(t*.6+s.p)*.0004;if(s.y<-.02){s.y=1.02;s.x=Math.random()}const a=.25+.6*Math.max(0,Math.sin(t*2+s.p));ctx.beginPath();ctx.fillStyle=`rgba(255,250,255,${a*.8})`;ctx.shadowColor='rgba(216,204,255,.9)';ctx.shadowBlur=8;ctx.arc(s.x*w,s.y*h*.75,s.r,0,6.283);ctx.fill()}ctx.shadowBlur=0};
  const loop=now=>{requestAnimationFrame(loop);if(!visible||document.hidden||now-last<33)return;const dt=(now-last)/1000;t+=dt;last=now;draw();drawSparks(dt)};
  new ResizeObserver(resize).observe(cv);resize();
  new IntersectionObserver(e=>visible=e[0].isIntersecting).observe(cv);
  if(!reduce)requestAnimationFrame(n=>{last=n;loop(n)});
}

/* cursor light + character appearance */
const card=$('.hero-card');
if(card&&!reduce){card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--mx',(e.clientX-r.left)+'px');card.style.setProperty('--my',(e.clientY-r.top)+'px')},{passive:true})}
document.addEventListener('model-ready',e=>{const st=e.target.closest?.('.hero-stage');if(st){st.classList.remove('ready');void st.offsetWidth;st.classList.add('ready')}});

/* moodboard (likes) */
const KEY='normas-mood';
let mood=[];try{mood=JSON.parse(localStorage.getItem(KEY)||'[]').filter(x=>typeof x==='string')}catch{}
const bar=$('.moodbar');
function syncMood(){
  try{localStorage.setItem(KEY,JSON.stringify(mood))}catch{}
  $$('.like').forEach(b=>b.setAttribute('aria-pressed',mood.includes(b.dataset.like)));
  if(!bar)return;
  bar.classList.toggle('has',mood.length>0);
  $('.txt strong',bar).textContent=mood.length?`В мудборде: ${mood.length} ${plural(mood.length,['персонаж','персонажа','персонажей'])}`:'Здесь соберётся твой мудборд';
  $('.txt span',bar).textContent=mood.length?'Добавим их в бриф как референсы':'Отмечай сердечком персонажей, которые откликаются';
  $('.mood-faces',bar).innerHTML=mood.slice(-5).map(id=>`<img src="/assets/${esc(id)}-poster.png" alt="">`).join('');
}
const plural=(n,f)=>f[(n%10===1&&n%100!==11)?0:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?1:2];
$$('.like').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const id=b.dataset.like;mood=mood.includes(id)?mood.filter(x=>x!==id):[...mood,id];b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');syncMood()}));
if(bar){const gal=$('#characters');new IntersectionObserver(e=>bar.classList.toggle('show',e[0].isIntersecting||mood.length>0&&scrollY>innerHeight),{rootMargin:'0px 0px -30% 0px'}).observe(gal);addEventListener('scroll',()=>{if(mood.length&&scrollY>innerHeight*.8)bar.classList.add('show')},{passive:true})}
syncMood();

/* gallery filter + search */
const cards=$$('.card[data-name]');
let filter='all',q='';
function applyFilter(){let shown=0;cards.forEach(c=>{const okF=filter==='all'||c.dataset.kind.split(' ').includes(filter);const okQ=!q||(c.dataset.name+' '+c.dataset.text).toLowerCase().includes(q);c.hidden=!(okF&&okQ);if(!c.hidden)shown++});const em=$('.gallery-empty');if(em)em.hidden=shown>0}
$$('.filters button').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('.filters button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});applyFilter()}));
$('#gallery-search')?.addEventListener('input',e=>{q=e.target.value.trim().toLowerCase();applyFilter()});

/* glass folders */
$$('.folder').forEach(f=>{const obj=$('.folder-obj',f),tog=$('.folder-toggle',f);const toggle=()=>{const open=f.classList.toggle('open');obj?.setAttribute('aria-expanded',open);tog?.setAttribute('aria-expanded',open)};obj?.addEventListener('click',toggle);obj?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});tog?.addEventListener('click',toggle)});

/* dialogs */
let opener;
$$('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()});d.addEventListener('close',()=>opener?.focus?.())});
$$('.x').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));

/* contacts */
$$('[data-contact]').forEach(a=>{const v=cfg[a.dataset.contact];if(!v)return;if(a.dataset.contact==='email'){if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))a.href='mailto:'+v}else if(/^https:\/\/t\.me\/[\w]+\/?$/.test(v)){a.href=v;a.target='_blank';a.rel='noopener'}});

/* brief */
const brief=$('#brief-dialog'),form=$('#brief-form');
function openBrief(src){opener=src||document.activeElement;$$('dialog[open]').forEach(d=>d!==brief&&d.close());const refs=$('[name=refs]',form);if(refs&&mood.length&&!refs.value.trim())refs.value='Нравятся персонажи NORMAS: '+mood.join(', ');brief?.showModal()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-brief]');if(b){e.preventDefault();openBrief(b)}});
const briefText=()=>{const d=Object.fromEntries(new FormData(form));return `БРИФ НА 3D-ПЕРСОНАЖА / NORMAS\n\nИмя: ${d.name}\nПрограмма: ${d.platform}\nЗадача: ${d.service}\n\nПерсонаж:\n${d.idea}\n\nРеференсы: ${d.refs||'—'}\nБюджет: ${d.budget||'Обсудим'}\nСрок: ${d.deadline||'Обсудим'}\n`};
const result=t=>{const el=$('#brief-result');if(!el)return;el.hidden=false;el.textContent=t};
form?.addEventListener('submit',e=>{e.preventDefault();const blob=new Blob([briefText()],{type:'text/plain;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='NORMAS-brief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);result('Бриф скачан. Отправь файл нам в Telegram или на почту — ответим с оценкой.')});
$('#copy-brief')?.addEventListener('click',async()=>{if(!form.reportValidity())return;try{await navigator.clipboard.writeText(briefText());result('Бриф скопирован. Вставь его в сообщение в Telegram.')}catch{result('Браузер не дал скопировать — нажми «Скачать бриф».')}});
$('#bar-brief')?.addEventListener('click',e=>openBrief(e.currentTarget));

/* command palette */
const pal=$('#palette');
if(pal){
  const input=$('input',pal),list=$('.pal-list',pal);let items=[],sel=0,models=null;
  const pages=[
    ['3D VTuber-модель на заказ','Услуга · состав, цена, этапы','/services/3d-vtuber-model/','✳'],
    ['Риггинг и мимика','Услуга · скелет, blend shapes','/services/rigging/','◎'],
    ['VRM и подготовка к эфиру','Услуга · VSeeFace, Warudo, VRChat','/services/vrm/','▶'],
    ['Сколько стоит 3D VTuber-модель','Журнал · бюджет','/journal/3d-vtuber-price/','₽'],
    ['2D или 3D VTuber','Журнал · формат','/journal/2d-or-3d/','◐'],
    ['Как подготовить референсы','Журнал · бриф','/journal/vtuber-brief/','✎'],
    ['О моделях и технологии','Источники и лицензии','/credits/','i'],
    ['Каталог моделей на Renigt','Поиск и фильтры по персонажам','https://renigt.online/','↗'],
  ];
  const actions=[['Составить бриф','Опиши персонажа за 2 минуты','brief','✦'],['Написать в Telegram',(cfg.telegram||'').replace('https://t.me/','@'),cfg.telegram||'#','✈']];
  async function loadModels(){if(models)return models;try{models=await (await fetch('/assets/models.json')).json()}catch{models=[]}return models}
  function render(){
    const s=input.value.trim().toLowerCase();const m=(t)=>!s||t.toLowerCase().includes(s);
    const ms=(models||[]).filter(x=>m(x.name+' '+x.caption+' '+(x.keywords||'')+' '+(x.tag||''))).map(x=>({g:'Персонажи',t:x.name,d:x.caption,img:x.poster,act:()=>{if(isHome&&$('#model-dialog')){const b=document.createElement('button');b.dataset.model=x.id;b.hidden=true;document.body.append(b);b.click();b.remove()}else location.href='/#m-'+x.id}}));
    const ps=pages.filter(p=>m(p[0]+' '+p[1])).map(p=>({g:'Страницы',t:p[0],d:p[1],ico:p[3],act:()=>location.href=p[2]}));
    const as=actions.filter(a=>m(a[0]+' '+a[1])).map(a=>({g:'Действия',t:a[0],d:a[1],ico:a[3],act:()=>{if(a[2]==='brief'){pal.close();openBrief()}else window.open(a[2],'_blank','noopener')}}));
    items=[...ms,...ps,...as];sel=Math.min(sel,Math.max(items.length-1,0));
    if(!items.length){list.innerHTML=`<div class="pal-empty">Ничего не нашли по «${esc(input.value)}». Попробуй «кошка», «риг» или «цена».</div>`;return}
    let g='',html='';items.forEach((it,i)=>{if(it.g!==g){g=it.g;html+=`<div class="pal-group">${g}</div>`}html+=`<button class="pal-item${i===sel?' sel':''}" data-i="${i}" role="option" aria-selected="${i===sel}">${it.img?`<img src="${esc(it.img)}" alt="">`:`<span class="ico">${esc(it.ico)}</span>`}<span>${esc(it.t)}<small>${esc(it.d)}</small></span><span class="hint">↵</span></button>`});
    list.innerHTML=html;$('.pal-item.sel',list)?.scrollIntoView({block:'nearest'});
  }
  const run=i=>{const it=items[i];if(!it)return;pal.close();it.act()};
  list.addEventListener('click',e=>{const b=e.target.closest('.pal-item');if(b)run(+b.dataset.i)});
  list.addEventListener('mousemove',e=>{const b=e.target.closest('.pal-item');if(b&&+b.dataset.i!==sel){sel=+b.dataset.i;$$('.pal-item',list).forEach(x=>x.classList.toggle('sel',+x.dataset.i===sel))}});
  input.addEventListener('input',()=>{sel=0;render()});
  input.addEventListener('keydown',e=>{if(!items.length)return;if(e.key==='ArrowDown'){e.preventDefault();sel=(sel+1)%items.length;render()}else if(e.key==='ArrowUp'){e.preventDefault();sel=(sel-1+items.length)%items.length;render()}else if(e.key==='Enter'){e.preventDefault();run(sel)}});
  const open=async src=>{opener=src||document.activeElement;input.value='';sel=0;render();pal.showModal();input.focus();await loadModels();render()};
  $$('[data-search]').forEach(b=>b.addEventListener('click',()=>open(b)));
  addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'||e.key==='/'&&!/input|textarea|select/i.test(document.activeElement.tagName)){e.preventDefault();pal.open?pal.close():open()}});
  if(location.hash==='#search')open();
}
})();
