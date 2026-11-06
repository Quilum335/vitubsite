/* VTuber puppet renderer (v3).
   Per character in /assets/chars/: <id>.webp, <id>-rig.webp (R hair, G head, B eyes), <id>-blink.webp, <id>-mouth.webp,
   optional <id>-depth.webp, and rig25.json (neck, hip, which mouth shape the overlay is).
   Motion: the head tilts, nods and turns as one piece, hair and tails hang on damped springs and swing with a lag,
   eyes look at the cursor, blink and talk; the body breathes and leans when dragged, then springs back.
   API: Alive2D.mount(el).set({src, neck, hip}) */
(()=>{
const VS=`#version 300 es
in vec2 p;out vec2 uv;
uniform sampler2D rigT,depthT;
uniform float t,neck,hip,aspect,breath,hop,lean,hRoll,hX,hY,hYaw,hairX,hairY,wind;
vec2 rot(vec2 v,vec2 c,float a){vec2 d=v-c;d.x*=aspect;d=vec2(d.x*cos(a)-d.y*sin(a),d.x*sin(a)+d.y*cos(a));d.x/=aspect;return c+d;}
void main(){
  vec4 r=texture(rigT,p);float hair=r.r,head=r.g;float d=texture(depthT,p).r;
  float y=p.y;vec2 q=p;
  float torso=smoothstep(neck-.02,neck+.05,y)*smoothstep(hip+.08,hip-.04,y);
  q.y-=(torso+head)*breath*.0045;q.x+=(p.x-.5)*torso*breath*.008;
  float fall=pow(smoothstep(neck-.1,1.,y),1.15);
  float side=sign(p.x-.5);
  q.x+=hair*fall*(hairX*.06+wind*.012*(1.+.4*side)+sin(t*1.7+y*7.)*.0025);
  q.y+=hair*fall*hairY*.03;
  vec2 hq=rot(q,vec2(.5,neck),hRoll);
  hq.x+=hX*.014+hYaw*(.006+(d-.5)*.03);hq.y+=hY*.012;
  q=mix(q,hq,head);
  float up=pow(1.-y,1.3);q.x+=lean*up*.06;q.y+=abs(lean)*up*.006;
  q.y=1.-(1.-q.y)*(1.+hop*.05);q.x=.5+(q.x-.5)*(1.-hop*.025);q.y-=hop*.03;
  uv=p;gl_Position=vec4(q.x*2.-1.,1.-q.y*2.,0.,1.);
}`;
const FS=`#version 300 es
precision mediump float;in vec2 uv;out vec4 o;
uniform sampler2D img,blinkT,mouthT,rigT;uniform float blink,mouth,fade,lookX,lookY;
void main(){
  float eye=texture(rigT,uv).b;
  vec2 u2=uv-eye*vec2(lookX*.0042,lookY*.0028);
  vec4 c=texture(img,mix(uv,u2,smoothstep(.15,.6,eye)));
  vec4 b=texture(blinkT,uv);c.rgb=mix(c.rgb,b.rgb,b.a*blink);
  vec4 m=texture(mouthT,uv);c.rgb=mix(c.rgb,m.rgb,m.a*mouth);
  o=vec4(c.rgb*c.a,c.a)*fade;
}`;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const LINES={mimi:['Ня! Привет ♡','Погладишь ушки?','Мурр… донат — и я спою!'],lumi:['Добрый вечер…','Посидим в тишине?','Я рядом ✦'],momo:['Хоп-хоп! ✿','Хочешь клубничку?','Волшебство включено!'],
  vexa:['Доступ получен.','Твой ПК мой, хе-хе','Го в рейд?'],kairo:['Йо! Музыку погромче','Ловишь бит?','Город не спит'],nyx:['Хе-хе, попался!','Страшилки на ночь?','Рогами не трогать!']};
let rigP=null;const rigJSON=()=>rigP??=fetch('/assets/chars/rig25.json').then(r=>r.json()).catch(()=>({}));
let px=null,py=null;addEventListener('pointermove',e=>{px=e.clientX;py=e.clientY},{passive:true});
const spring=(s,target,k,c,dt)=>{s.v+=((target-s.x)*k-s.v*c)*dt;s.x+=s.v*dt};

function mount(el,opt={}){
  const cv=document.createElement('canvas');cv.className='alive-canvas';el.appendChild(cv);
  const gl=cv.getContext('webgl2',{premultipliedAlpha:true,alpha:true,antialias:true});
  if(!gl){el.classList.add('no-gl');return{set(o){const i=el.querySelector('img');if(i&&o.src)i.src=o.src}}}
  const sh=(ty,src)=>{const s=gl.createShader(ty);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(s);return s};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
  const N=110,M=165,v=[],idx=[];
  for(let j=0;j<=M;j++)for(let i=0;i<=N;i++)v.push(i/N,j/M);
  for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;idx.push(a,b,c,b,d,c)}
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
  const U={};for(const n of['t','neck','hip','aspect','breath','hop','lean','hRoll','hX','hY','hYaw','hairX','hairY','wind','blink','mouth','fade','lookX','lookY','img','blinkT','mouthT','rigT','depthT'])U[n]=gl.getUniformLocation(pr,n);
  const tex=[0,1,2,3,4].map(()=>gl.createTexture());
  [U.img,U.blinkT,U.mouthT,U.rigT,U.depthT].forEach((u,i)=>gl.uniform1i(u,i));
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  function upload(i,im,fallback=[0,0,0,0]){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex[i]);
    if(im){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR)}
    else{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(fallback));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)}
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)}
  [0,1,2,3].forEach(i=>upload(i,null));upload(4,null,[128,128,128,255]);
  const img=src=>new Promise(res=>{const im=new Image();im.crossOrigin='anonymous';im.decoding='async';im.onload=()=>res(im);im.onerror=()=>res(null);im.src=src});
  const S=()=>({x:0,v:0});
  const st={neck:.19,hip:.5,alt:'open',id:'',loaded:false,visible:true,t:Math.random()*9,fade:0,
    lean:S(),roll:S(),hx:S(),hy:S(),hairX:S(),hairY:S(),lx:0,ly:0,hop:0,hopV:0,blink:0,nextBlink:1.5,blinkT:-1,talk:0,talkUntil:0,
    drag:null,wasDrag:false,tilt:0,nextTilt:4,prevRoll:0,prevLean:0,prevHop:0};
  const bubble=document.createElement('div');bubble.className='alive-bubble';bubble.hidden=true;el.appendChild(bubble);
  function fit(){const r=el.getBoundingClientRect(),dp=Math.min(devicePixelRatio||1,2);let w=r.width,h=r.height;if(!w||!h)return;if(w/h>2/3)w=h*2/3;else h=w*1.5;cv.style.width=w+'px';cv.style.height=h+'px';cv.width=Math.round(w*dp);cv.height=Math.round(h*dp);gl.viewport(0,0,cv.width,cv.height)}
  new ResizeObserver(fit).observe(el);fit();
  new IntersectionObserver(e=>st.visible=e[0].isIntersecting).observe(el);
  let seq=0;
  async function set(o){
    const my=++seq;const id=(o.id||String(o.src||'').match(/chars\/([a-z0-9]+)\.webp/)?.[1]||'');const base=`/assets/chars/${id}`;
    const [R,a,b,m,rg,d]=await Promise.all([rigJSON(),img(o.src||base+'.webp'),img(base+'-blink.webp'),img(base+'-mouth.webp'),img(base+'-rig.webp'),img(base+'-depth.webp')]);
    if(my!==seq||!a)return;
    const r=R[id]||{};st.id=id;st.neck=o.neck??r.neck??.19;st.hip=o.hip??r.hip??.5;st.alt=r.alt||'open';
    upload(0,a);upload(1,b);upload(2,m);upload(3,rg);upload(4,d,[128,128,128,255]);
    st.fade=0;st.loaded=true;st.hopV=reduce?0:3;st.hairY.v=-2;
    el.classList.add('ready');el.dispatchEvent(new CustomEvent('alive-ready',{bubbles:true}))}
  function say(){const L=LINES[st.id]||['Привет!'];bubble.textContent=L[Math.floor(Math.random()*L.length)];bubble.hidden=false;bubble.classList.remove('pop');void bubble.offsetWidth;bubble.classList.add('pop');st.talkUntil=st.t+1.6;clearTimeout(bubble._h);bubble._h=setTimeout(()=>bubble.hidden=true,2600)}
  cv.addEventListener('pointerdown',e=>{st.drag={x:e.clientX,y:e.clientY,moved:0,dx:0,dy:0};try{cv.setPointerCapture(e.pointerId)}catch{}el.classList.add('dragging')});
  cv.addEventListener('pointermove',e=>{if(!st.drag)return;st.drag.dx=e.clientX-st.drag.x;st.drag.dy=e.clientY-st.drag.y;st.drag.moved=Math.max(st.drag.moved,Math.hypot(st.drag.dx,st.drag.dy))});
  const up=()=>{if(!st.drag)return;st.wasDrag=st.drag.moved>=6;if(!st.wasDrag){st.hopV=reduce?0:5;say()}st.drag=null;el.classList.remove('dragging')};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('click',e=>{if(st.wasDrag){e.stopPropagation();st.wasDrag=false}});
  cv.style.touchAction='pan-y';
  let last=performance.now();
  (function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.04);last=now;if(!st.visible||document.hidden||!st.loaded)return;st.t+=dt;const t=st.t;
    let tx=Math.sin(t*.37)*.4,ty=Math.sin(t*.23)*.15;
    if(px!=null){const r=el.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(px-(r.left+r.width/2))/(innerWidth*.35)));ty=Math.max(-1,Math.min(1,(py-(r.top+r.height*.18))/(innerHeight*.55)))}
    let leanT=reduce?0:Math.sin(t*.5)*.12;
    if(st.drag){leanT=Math.max(-1.3,Math.min(1.3,st.drag.dx/170));tx=Math.max(-1,Math.min(1,st.drag.dx/140));ty=Math.max(-1,Math.min(1,st.drag.dy/180))}
    if(t>st.nextTilt){st.tilt=(Math.random()<.5?-1:1)*(.6+Math.random()*.5);st.nextTilt=t+5+Math.random()*5;setTimeout(()=>st.tilt=0,1400)}
    spring(st.lean,leanT,st.drag?60:38,st.drag?14:5.5,dt);
    spring(st.hx,tx,55,13,dt);spring(st.hy,ty,55,13,dt);
    spring(st.roll,-tx*.055+st.tilt*.09+Math.sin(t*.8)*.012,40,9,dt);
    const dRoll=(st.roll.x-st.prevRoll)/dt,dLean=(st.lean.x-st.prevLean)/dt,dHop=(st.hop-st.prevHop)/dt;st.prevRoll=st.roll.x;st.prevLean=st.lean.x;st.prevHop=st.hop;
    st.hairX.v+=(-dRoll*1.6-dLean*.35)*dt*6;st.hairY.v+=(dHop*.4)*dt*6;
    spring(st.hairX,0,26,3.2,dt);spring(st.hairY,0,30,4,dt);
    st.hairX.x=Math.max(-1,Math.min(1,st.hairX.x));st.hairY.x=Math.max(-1,Math.min(1,st.hairY.x));
    st.lx+=(tx-st.lx)*(1-Math.exp(-dt*14));st.ly+=(ty-st.ly)*(1-Math.exp(-dt*14));
    if(t>st.nextBlink){st.blinkT=0;st.nextBlink=t+(Math.random()<.2?.35:2+Math.random()*3.5)}
    if(st.blinkT>=0){st.blinkT+=dt;const q=st.blinkT/.16;st.blink=q<1?Math.sin(q*Math.PI):0;if(q>=1)st.blinkT=-1}
    const talking=t<st.talkUntil;const open=talking?Math.max(0,Math.sin(t*17)*.5+Math.sin(t*9.3)*.5):0;st.talk+=(open-st.talk)*(1-Math.exp(-dt*25));
    const mouthMix=st.alt==='open'?st.talk:(talking?1-st.talk:0);
    st.hopV+=(-st.hop*90-st.hopV*9)*dt;st.hop+=st.hopV*dt;st.fade=Math.min(1,st.fade+dt*2.4);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    const f=(n,x)=>gl.uniform1f(U[n],x);const R0=reduce?0:1;
    f('t',t*R0);f('neck',st.neck);f('hip',st.hip);f('aspect',cv.width/cv.height);f('breath',R0*(Math.sin(t*1.7)*.5+.5));f('hop',st.hop);
    f('lean',st.lean.x);f('hRoll',R0*st.roll.x);f('hX',R0*st.hx.x);f('hY',R0*st.hy.x*.6);f('hYaw',R0*st.hx.x);
    f('hairX',R0*st.hairX.x);f('hairY',R0*st.hairY.x);f('wind',R0*Math.sin(t*.9)*Math.sin(t*.37));
    f('blink',st.blink);f('mouth',mouthMix);f('fade',st.fade);f('lookX',R0*st.lx);f('lookY',R0*st.ly);
    gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_SHORT,0)})(last);
  if(opt.src)set(opt);
  return{set,el,say};
}
window.Alive2D={mount};
})();
