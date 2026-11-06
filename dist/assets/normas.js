/* NORMAS UI: header, search palette, moodboard, folders, brief. No dependencies. */
(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cfg=window.NORMAS||{};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isHome=!!$('#characters');
const CH=window.NORMAS_CHARS||[];const byId=Object.fromEntries(CH.map(c=>[c.id,c]));
const STYLE={pastel:'Pastel Kawaii',neon:'Neon Cyberpunk'};

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

/* hero waves: soft pastel dunes by day, neon dunes by night */
const cv=$('canvas.waves');const heroCard=$('.hero-card');
if(cv){
  const ctx=cv.getContext('2d');let w=0,h=0,dpr=1,t=0,visible=true,last=0,mix=heroCard?.dataset.mood==='neon'?1:0;
  const P=[[255,214,232],[255,196,224],[236,208,255],[214,196,255],[196,226,255],[178,214,255],[255,240,246]];
  const N=[[139,92,246],[120,70,220],[255,60,172],[96,48,180],[0,160,200],[60,30,130],[30,20,70]];
  const layers=[...Array(7)].map((_,i)=>({y:.56+i*.065,amp:12+i*6,f1:.0035+i*.0004,f2:.009+i*.0007,ph:i*1.7,i}));
  const lerp=(a,b,k)=>a+(b-a)*k;
  const resize=()=>{const r=cv.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,1.5);w=r.width;h=r.height;cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw()};
  const crest=(L,x)=>h*L.y+Math.sin(x*L.f1+t*.5+L.ph)*L.amp+Math.sin(x*L.f2-t*.35+L.ph*2)*L.amp*.35;
  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const L of layers){
      const c=P[L.i].map((v,k)=>lerp(v,N[L.i][k],mix)|0);
      ctx.beginPath();ctx.moveTo(0,h);for(let x=0;x<=w+8;x+=8)ctx.lineTo(x,crest(L,x));ctx.lineTo(w,h);ctx.closePath();
      const g=ctx.createLinearGradient(0,h*L.y-L.amp,0,h);
      g.addColorStop(0,`rgba(${c[0]},${c[1]},${c[2]},${lerp(.85,.9,mix)})`);g.addColorStop(1,`rgba(${lerp(255,19,mix)|0},${lerp(255,17,mix)|0},${lerp(255,38,mix)|0},${lerp(.9,.95,mix)})`);
      ctx.fillStyle=g;ctx.fill();
      ctx.strokeStyle=mix>.5?`rgba(${c[0]},${c[1]},${c[2]},.9)`:'rgba(255,255,255,.9)';ctx.lineWidth=mix>.5?1.4:1.2;ctx.shadowColor=mix>.5?`rgb(${c})`:'transparent';ctx.shadowBlur=mix>.5?10:0;
      ctx.beginPath();for(let x=0;x<=w+8;x+=8){const y=crest(L,x);x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.shadowBlur=0;
    }
  }
  const sparks=[...Array(60)].map(()=>({x:Math.random(),y:Math.random(),r:.8+Math.random()*1.8,v:.01+Math.random()*.03,p:Math.random()*6.28,k:Math.random()<.18}));
  const drawSparks=dt=>{for(const s of sparks){s.y-=s.v*dt;s.x+=Math.sin(t*.6+s.p)*.0004;if(s.y<-.02){s.y=1.02;s.x=Math.random()}const a=.3+.6*Math.max(0,Math.sin(t*2+s.p));const X=s.x*w,Y=s.y*h*.8;
    if(s.k&&mix<.5){ctx.fillStyle=`rgba(226,86,154,${a*.7})`;ctx.font=`${8+s.r*5}px sans-serif`;ctx.fillText('♡',X,Y)}
    else{ctx.beginPath();ctx.fillStyle=mix>.5?`rgba(${s.k?'255,60,172':'0,229,255'},${a})`:`rgba(255,255,255,${a})`;ctx.shadowColor=mix>.5?'rgba(0,229,255,.9)':'rgba(197,163,255,.9)';ctx.shadowBlur=8;ctx.arc(X,Y,s.r,0,6.283);ctx.fill()}}ctx.shadowBlur=0};
  const loop=now=>{requestAnimationFrame(loop);if(!visible||document.hidden||now-last<33)return;const dt=(now-last)/1000;t+=dt;last=now;const target=heroCard?.dataset.mood==='neon'?1:0;mix+=(target-mix)*Math.min(1,dt*2);draw();drawSparks(dt)};
  new ResizeObserver(resize).observe(cv);resize();
  new IntersectionObserver(e=>visible=e[0].isIntersecting).observe(cv);
  if(!reduce)requestAnimationFrame(n=>{last=n;loop(n)});
}

/* cursor light + character appearance */
const card=$('.hero-card');
if(card&&!reduce){card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--mx',(e.clientX-r.left)+'px');card.style.setProperty('--my',(e.clientY-r.top)+'px')},{passive:true})}
function burst(x,y,neon){const sy=neon?['✦','✧','◆','⚡']:['♡','✦','♡','✿'];for(let i=0;i<9;i++){const el=document.createElement('span');el.className='burst';el.textContent=sy[i%sy.length];const ang=Math.random()*6.28,d=50+Math.random()*70;el.style.cssText=`left:${x}px;top:${y}px;color:${neon?['#FF3CAC','#00E5FF','#8B5CF6'][i%3]:['#E2569A','#8A5CF0','#3E9BDB'][i%3]};--dx:${Math.cos(ang)*d}px;--dy:${Math.sin(ang)*d-40}px;--rot:${(Math.random()-.5)*90}deg`;document.body.append(el);setTimeout(()=>el.parentNode&&el.parentNode.removeChild(el),1000)}}
const mounts=new Map();
function alive(el){if(!window.Alive2D||!el)return null;if(!mounts.has(el))mounts.set(el,Alive2D.mount(el,{}));return mounts.get(el)}
$$('[data-alive-hero]').forEach(el=>{alive(el)?.set({src:el.dataset.src,neck:+el.dataset.neck,hip:+el.dataset.hip});el.addEventListener('click',e=>burst(e.clientX,e.clientY,heroCard?.dataset.mood==='neon'))});
$$('[data-hero-char]').forEach(b=>b.addEventListener('click',()=>{const c=byId[b.dataset.heroChar];if(!c)return;
  $$('[data-hero-char]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',on)});
  if(heroCard)heroCard.dataset.mood=c.style;const n=$('[data-hero-name]'),st=$('[data-hero-style]'),op=$('[data-hero-open]');if(n)n.textContent=c.name;if(st)st.textContent=STYLE[c.style];if(op)op.dataset.openChar=c.id;
  const el=$('.hero-stage [data-alive-hero]');const ph=el?.querySelector('.ph');if(ph)ph.src=`/assets/chars/${c.id}-sm.webp`;alive(el)?.set({src:`/assets/chars/${c.id}.webp`,neck:c.neck,hip:c.hip})}));


/* moodboard (likes) */
const KEY='normas-mood';
let mood=[];try{mood=JSON.parse(localStorage.getItem(KEY)||'[]').filter(x=>typeof x==='string'&&(!CH.length||byId[x]))}catch{}
const bar=$('.moodbar');
function syncMood(){
  try{localStorage.setItem(KEY,JSON.stringify(mood))}catch{}
  $$('.like').forEach(b=>b.setAttribute('aria-pressed',mood.includes(b.dataset.like)));
  if(!bar)return;
  bar.classList.toggle('has',mood.length>0);
  $('.txt strong',bar).textContent=mood.length?`В мудборде: ${mood.length} ${plural(mood.length,['персонаж','персонажа','персонажей'])}`:'Здесь соберётся твой мудборд';
  $('.txt span',bar).textContent=mood.length?'Добавим их в бриф как референсы':'Отмечай сердечком персонажей, которые откликаются';
  $('.mood-faces',bar).innerHTML=mood.slice(-5).map(id=>`<img src="/assets/chars/${esc(id)}-face.webp" alt="">`).join('');
}
const plural=(n,f)=>f[(n%10===1&&n%100!==11)?0:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?1:2];
$$('.like').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const id=b.dataset.like;mood=mood.includes(id)?mood.filter(x=>x!==id):[...mood,id];b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');syncMood()}));
if(bar){const gal=$('#characters');new IntersectionObserver(e=>bar.classList.toggle('show',e[0].isIntersecting||mood.length>0&&scrollY>innerHeight),{rootMargin:'0px 0px -30% 0px'}).observe(gal);addEventListener('scroll',()=>{if(mood.length&&scrollY>innerHeight*.8)bar.classList.add('show')},{passive:true})}
syncMood();

/* gallery filter + search */
const cards=$$('.char[data-name]');
let filter='all',q='';
function applyFilter(){let shown=0;cards.forEach(c=>{const okF=filter==='all'||c.dataset.style===filter;const okQ=!q||(c.dataset.name+' '+c.dataset.text).toLowerCase().includes(q);c.hidden=!(okF&&okQ);if(!c.hidden)shown++});const em=$('.gallery-empty');if(em)em.hidden=shown>0}
$$('.filters button').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('.filters button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});applyFilter()}));
$('#gallery-search')?.addEventListener('input',e=>{q=e.target.value.trim().toLowerCase();applyFilter()});

/* glass folders */
$$('.folder').forEach(f=>{const obj=$('.folder-obj',f),tog=$('.folder-toggle',f);const toggle=()=>{const open=f.classList.toggle('open');obj?.setAttribute('aria-expanded',open);tog?.setAttribute('aria-expanded',open)};obj?.addEventListener('click',toggle);obj?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});tog?.addEventListener('click',toggle)});

/* dialogs */
let opener;
$$('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()});d.addEventListener('close',()=>opener?.focus?.())});
$$('.x').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
const cd=$('#char-dialog');
function openChar(id,src){const c=byId[id];if(!c)return;if(!cd){location.href='/#c-'+id;return}opener=src||document.activeElement;$$('dialog[open]').forEach(d=>d!==cd&&d.close());
  $('#char-title',cd).textContent=c.name;$('[data-c-style]',cd).textContent=STYLE[c.style];$('[data-c-tagline]',cd).textContent=c.tagline;$('[data-c-desc]',cd).textContent=c.desc;
  $('[data-c-traits]',cd).innerHTML=c.traits.map(t=>`<span>${esc(t)}</span>`).join('');$('[data-c-palette]',cd).innerHTML=c.palette.map(p=>`<i style="background:${esc(p)}" title="${esc(p)}"></i>`).join('');
  $('.char-stage',cd).dataset.style=c.style;const lk=$('#char-like',cd);lk.dataset.like=c.id;lk.setAttribute('aria-pressed',mood.includes(c.id));
  cd.showModal();alive($('[data-alive-dialog]',cd))?.set({src:`/assets/chars/${c.id}.webp`,neck:c.neck,hip:c.hip})}
$('[data-alive-dialog]')?.addEventListener('click',e=>burst(e.clientX,e.clientY,$('.char-stage')?.dataset.style==='neon'));
document.addEventListener('click',e=>{const o=e.target.closest('[data-open-char]');if(o){e.preventDefault();openChar(o.dataset.openChar,o);return}const c=e.target.closest('.char[data-char]');if(c&&!e.target.closest('.like'))openChar(c.dataset.char,c)});
$$('.char[data-char]').forEach(c=>c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openChar(c.dataset.char,c)}}));
const hc=location.hash.match(/^#c-(\w+)/);if(hc&&byId[hc[1]])setTimeout(()=>openChar(hc[1]),300);


/* contacts */
$$('[data-contact]').forEach(a=>{const v=cfg[a.dataset.contact];if(!v)return;if(a.dataset.contact==='email'){if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))a.href='mailto:'+v}else if(/^https:\/\/t\.me\/[\w]+\/?$/.test(v)){a.href=v;a.target='_blank';a.rel='noopener'}});

/* brief */
const brief=$('#brief-dialog'),form=$('#brief-form');
function openBrief(src){opener=src||document.activeElement;$$('dialog[open]').forEach(d=>d!==brief&&d.close());const refs=$('[name=refs]',form);if(refs&&mood.length&&!refs.value.trim())refs.value='Нравятся концепты NORMAS: '+mood.map(id=>byId[id]?.name||id).join(', ');brief?.showModal()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-brief]');if(b){e.preventDefault();openBrief(b)}});
const briefText=()=>{const d=Object.fromEntries(new FormData(form));return `БРИФ НА VTUBER-ПЕРСОНАЖА / NORMAS\n\nИмя: ${d.name}\nПрограмма: ${d.platform}\nЗадача: ${d.service}\n\nПерсонаж:\n${d.idea}\n\nРеференсы: ${d.refs||'—'}\nБюджет: ${d.budget||'Обсудим'}\nСрок: ${d.deadline||'Обсудим'}\n`};
const result=t=>{const el=$('#brief-result');if(!el)return;el.hidden=false;el.textContent=t};
form?.addEventListener('submit',e=>{e.preventDefault();const blob=new Blob([briefText()],{type:'text/plain;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='NORMAS-brief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);result('Бриф скачан. Отправь файл нам в Telegram или на почту — ответим с оценкой.')});
$('#copy-brief')?.addEventListener('click',async()=>{if(!form.reportValidity())return;try{await navigator.clipboard.writeText(briefText());result('Бриф скопирован. Вставь его в сообщение в Telegram.')}catch{result('Браузер не дал скопировать — нажми «Скачать бриф».')}});
$('#bar-brief')?.addEventListener('click',e=>openBrief(e.currentTarget));

/* command palette */
const pal=$('#palette');
if(pal){
  const input=$('input',pal),list=$('.pal-list',pal);let items=[],sel=0;
  const pages=[
    ['VTuber-модель на заказ','Услуга · состав, цена, этапы','/services/3d-vtuber-model/','✳'],
    ['Риггинг и мимика','Услуга · скелет, blend shapes','/services/rigging/','◎'],
    ['VRM и подготовка к эфиру','Услуга · VSeeFace, Warudo, VRChat','/services/vrm/','▶'],
    ['Сколько стоит 3D VTuber-модель','Журнал · бюджет','/journal/3d-vtuber-price/','₽'],
    ['2D или 3D VTuber','Журнал · формат','/journal/2d-or-3d/','◐'],
    ['Как подготовить референсы','Журнал · бриф','/journal/vtuber-brief/','✎'],
    ['О концептах и технологиях','Как оживают персонажи','/credits/','i'],
  ];
  const actions=[['Заказать модель','Telegram · '+(cfg.telegram||'').replace('https://t.me/','@'),cfg.telegram||'#','✦'],['Составить бриф','Опиши персонажа за 2 минуты','brief','✦'],['Написать в Telegram',(cfg.telegram||'').replace('https://t.me/','@'),cfg.telegram||'#','✈']];
  function render(){
    const s=input.value.trim().toLowerCase();const m=(t)=>!s||t.toLowerCase().includes(s);
    const ms=CH.filter(x=>m(x.name+' '+x.tagline+' '+x.keywords+' '+x.traits.join(' ')+' '+STYLE[x.style])).map(x=>({g:'Концепты',t:x.name,d:x.tagline,img:`/assets/chars/${x.id}-face.webp`,act:()=>openChar(x.id)}));
    const ps=pages.filter(p=>m(p[0]+' '+p[1])).map(p=>({g:'Страницы',t:p[0],d:p[1],ico:p[3],act:()=>location.href=p[2]}));
    const as=actions.filter(a=>m(a[0]+' '+a[1])).map(a=>({g:'Действия',t:a[0],d:a[1],ico:a[3],act:()=>{if(a[2]==='brief'){pal.close();openBrief()}else window.open(a[2],'_blank','noopener')}}));
    items=[...ms,...ps,...as];sel=Math.min(sel,Math.max(items.length-1,0));
    if(!items.length){list.innerHTML=`<div class="pal-empty">Ничего не нашли по «${esc(input.value)}». Попробуй «неко», «демон», «риг» или «цена».</div>`;return}
    let g='',html='';items.forEach((it,i)=>{if(it.g!==g){g=it.g;html+=`<div class="pal-group">${g}</div>`}html+=`<button class="pal-item${i===sel?' sel':''}" data-i="${i}" role="option" aria-selected="${i===sel}">${it.img?`<img src="${esc(it.img)}" alt="">`:`<span class="ico">${esc(it.ico)}</span>`}<span>${esc(it.t)}<small>${esc(it.d)}</small></span><span class="hint">↵</span></button>`});
    list.innerHTML=html;$('.pal-item.sel',list)?.scrollIntoView({block:'nearest'});
  }
  const run=i=>{const it=items[i];if(!it)return;pal.close();it.act()};
  list.addEventListener('click',e=>{const b=e.target.closest('.pal-item');if(b)run(+b.dataset.i)});
  list.addEventListener('mousemove',e=>{const b=e.target.closest('.pal-item');if(b&&+b.dataset.i!==sel){sel=+b.dataset.i;$$('.pal-item',list).forEach(x=>x.classList.toggle('sel',+x.dataset.i===sel))}});
  input.addEventListener('input',()=>{sel=0;render()});
  input.addEventListener('keydown',e=>{if(!items.length)return;if(e.key==='ArrowDown'){e.preventDefault();sel=(sel+1)%items.length;render()}else if(e.key==='ArrowUp'){e.preventDefault();sel=(sel-1+items.length)%items.length;render()}else if(e.key==='Enter'){e.preventDefault();run(sel)}});
  const open=src=>{opener=src||document.activeElement;input.value='';sel=0;render();pal.showModal();input.focus()};
  $$('[data-search]').forEach(b=>b.addEventListener('click',()=>open(b)));
  addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'||e.key==='/'&&!/input|textarea|select/i.test(document.activeElement.tagName)){e.preventDefault();pal.open?pal.close():open()}});
  if(location.hash==='#search')open();
}
})();
