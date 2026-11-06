/* alive25d — a 2.5D VTuber-style puppet from one illustration plus rig layers.
   Layers per character (in /assets/chars/): <id>.webp, <id>-depth.webp, <id>-blink.webp, <id>-mouth.webp, rig25.json.
   Depth turns the character in 2.5D (drag to rotate, it springs back), the head turns on its own towards the
   cursor, eyes blink, the mouth talks with a speech bubble on click, hair and loose parts sway, the body breathes.
   API (kept from alive2d): Alive2D.mount(el).set({src, neck, hip}) */
(()=>{
const VS=`#version 300 es
in vec2 p;out vec2 uv;out float vShade;
uniform sampler2D depth;uniform float t,neck,hip,yaw,pitch,hyaw,hpitch,roll,breath,hop,aspect,sway;
void main(){
  float d=texture(depth,p).r;            // 0 far .. 1 near
  float z=d-.45;
  float y=p.y;vec2 q=p;
  float head=smoothstep(neck+.05,neck-.05,y);
  float torso=smoothstep(neck-.02,neck+.06,y)*smoothstep(hip+.1,hip-.05,y);
  // breathing
  q.y-=torso*breath*.005+head*breath*.006;q.x+=(p.x-.5)*torso*breath*.01;
  // whole-body 2.5D turn: near parts move more than far ones
  float Y=yaw,P=pitch;
  q.x+=z*Y*.16;q.y+=z*P*.12;
  q.x=.5+(q.x-.5)*(1.-abs(Y)*.06);
  // head turns on its own around the neck
  float HY=hyaw*head,HP=hpitch*head;
  q.x+=HY*(.012+z*.07);q.y+=HP*(.008+z*.05);
  float ang=head*(roll*.06+sin(t*.8)*.012);
  vec2 piv=vec2(.5,neck);vec2 dd=q-piv;dd.x*=aspect;dd=vec2(dd.x*cos(ang)-dd.y*sin(ang),dd.x*sin(ang)+dd.y*cos(ang));dd.x/=aspect;q=piv+dd;
  // far, loose parts (back hair, tails, wings) sway with a lag
  float loose=(1.-d)*smoothstep(neck-.04,1.,y);
  q.x+=loose*(sin(t*1.3+y*5.)*.006+sway*.02)*(.4+abs(p.x-.5)*2.);
  // hop
  q.y=1.-(1.-q.y)*(1.+hop*.05);q.x=.5+(q.x-.5)*(1.-hop*.025);q.y-=hop*.03;
  vShade=z*(Y*.6+HY*.4);
  uv=p;gl_Position=vec4(q.x*2.-1.,1.-q.y*2.,0.,1.);
}`;
const FS=`#version 300 es
precision mediump float;in vec2 uv;in float vShade;out vec4 o;
uniform sampler2D img,blinkT,mouthT;uniform float blink,mouth,fade,rim;uniform vec3 rimCol;
void main(){
  vec4 c=texture(img,uv);
  vec4 b=texture(blinkT,uv);c.rgb=mix(c.rgb,b.rgb,b.a*blink);
  vec4 m=texture(mouthT,uv);c.rgb=mix(c.rgb,m.rgb,m.a*mouth);
  c.rgb+=rimCol*clamp(vShade*rim,0.,.07);   // light catches the side that turns towards us
  o=vec4(c.rgb*c.a,c.a)*fade;
}`;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const LINES={mimi:['Ня! Привет ♡','Погладишь ушки?','Мурр… донат — и я спою!'],lumi:['Добрый вечер…','Посидим в тишине?','Я рядом ✦'],momo:['Хоп-хоп! ✿','Хочешь клубничку?','Волшебство включено!'],
  vexa:['Доступ получен.','Твой ПК мой, хе-хе','Го в рейд?'],kairo:['Йо! Музыку погромче','Ловишь бит?','Город не спит'],nyx:['Хе-хе, попался!','Страшилки на ночь?','Рогами не трогать!']};
let rigP=null;const rig=()=>rigP??=fetch('/assets/chars/rig25.json').then(r=>r.json()).catch(()=>({}));
let px=null,py=null;addEventListener('pointermove',e=>{px=e.clientX;py=e.clientY},{passive:true});

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
  const U={};for(const n of['t','neck','hip','yaw','pitch','hyaw','hpitch','roll','breath','hop','aspect','sway','blink','mouth','fade','rim','rimCol','depth','img','blinkT','mouthT'])U[n]=gl.getUniformLocation(pr,n);
  const tex=[0,1,2,3].map(()=>gl.createTexture());// img, depth, blink, mouth
  [U.img,U.depth,U.blinkT,U.mouthT].forEach((u,i)=>gl.uniform1i(u,i));
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  const blank=new Uint8Array([0,0,0,0]);
  function upload(i,im){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex[i]);if(im){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR)}else{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,blank);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)}gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)}
  [0,1,2,3].forEach(i=>upload(i,null));
  const img=src=>new Promise(res=>{const im=new Image();im.crossOrigin='anonymous';im.decoding='async';im.onload=()=>res(im);im.onerror=()=>res(null);im.src=src});
  const st={neck:.19,hip:.5,alt:'open',id:'',loaded:false,visible:true,t:Math.random()*9,
    yaw:0,pitch:0,vy:0,vp:0,hy:0,hp:0,roll:0,hop:0,hopV:0,fade:0,blink:0,nextBlink:1.5,blinkT:-1,talk:0,talkUntil:0,sway:0,drag:null,lastYaw:0,neon:false};
  const bubble=document.createElement('div');bubble.className='alive-bubble';bubble.hidden=true;el.appendChild(bubble);
  function fit(){const r=el.getBoundingClientRect(),dp=Math.min(devicePixelRatio||1,2);let w=r.width,h=r.height;if(!w||!h)return;if(w/h>2/3)w=h*2/3;else h=w*1.5;cv.style.width=w+'px';cv.style.height=h+'px';cv.width=Math.round(w*dp);cv.height=Math.round(h*dp);gl.viewport(0,0,cv.width,cv.height)}
  new ResizeObserver(fit).observe(el);fit();
  new IntersectionObserver(e=>st.visible=e[0].isIntersecting).observe(el);
  let seq=0;
  async function set(o){
    const my=++seq;const id=(o.id||String(o.src||'').match(/chars\/([a-z0-9]+)\.webp/)?.[1]||'');const base=`/assets/chars/${id}`;
    const [R,a,d,b,m]=await Promise.all([rig(),img(o.src||base+'.webp'),img(base+'-depth.webp'),img(base+'-blink.webp'),img(base+'-mouth.webp')]);
    if(my!==seq||!a)return;
    const r=R[id]||{};st.id=id;st.neck=o.neck??r.neck??.19;st.hip=o.hip??r.hip??.5;st.alt=r.alt||'open';
    st.neon=!!el.closest('[data-mood=neon],[data-style=neon]');
    upload(0,a);upload(1,d);upload(2,b);upload(3,m);st.fade=0;st.loaded=true;st.hopV=reduce?0:3;
    el.classList.add('ready');el.dispatchEvent(new CustomEvent('alive-ready',{bubbles:true}))}
  function say(){const L=LINES[st.id]||['Привет!'];bubble.textContent=L[Math.floor(Math.random()*L.length)];bubble.hidden=false;bubble.classList.remove('pop');void bubble.offsetWidth;bubble.classList.add('pop');st.talkUntil=st.t+1.6;clearTimeout(bubble._h);bubble._h=setTimeout(()=>bubble.hidden=true,2600)}
  // drag to turn the character; a short tap makes it hop and talk
  cv.addEventListener('pointerdown',e=>{st.drag={x:e.clientX,y:e.clientY,yaw:st.yaw,pitch:st.pitch,moved:0};cv.setPointerCapture(e.pointerId);el.classList.add('dragging')});
  cv.addEventListener('pointermove',e=>{if(!st.drag)return;const dx=e.clientX-st.drag.x,dy=e.clientY-st.drag.y;st.drag.moved=Math.max(st.drag.moved,Math.hypot(dx,dy));st.yaw=Math.max(-.85,Math.min(.85,st.drag.yaw+dx/200));st.pitch=Math.max(-.45,Math.min(.45,st.drag.pitch+dy/300))});
  const up=()=>{if(!st.drag)return;st.wasDrag=st.drag.moved>=6;if(!st.wasDrag){st.hopV=reduce?0:5;say()}st.drag=null;el.classList.remove('dragging')};
  cv.addEventListener('click',e=>{if(st.wasDrag){e.stopPropagation();st.wasDrag=false}});
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.style.touchAction='pan-y';
  let last=performance.now();
  (function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(!st.visible||document.hidden||!st.loaded)return;st.t+=dt;const t=st.t;
    // head follows the cursor (or wanders when there is none)
    let tx=Math.sin(t*.37)*.35,ty=Math.sin(t*.23)*.1;
    if(px!=null){const r=el.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(px-(r.left+r.width/2))/(innerWidth*.4)));ty=Math.max(-1,Math.min(1,(py-(r.top+r.height*.2))/(innerHeight*.6)))}
    const k=1-Math.exp(-dt*6);st.hy+=(tx-st.hy)*k;st.hp+=(ty*.7-st.hp)*k;st.roll+=(-tx*.4-st.roll)*k*.5;
    // body: springs back to the idle sway when released
    if(!st.drag){const iy=reduce?0:Math.sin(t*.45)*.12+st.hy*.25,ip=0;st.vy+=((iy-st.yaw)*30-st.vy*7)*dt;st.vp+=((ip-st.pitch)*30-st.vp*7)*dt;st.yaw+=st.vy*dt;st.pitch+=st.vp*dt}
    const yv=(st.yaw-st.lastYaw)/Math.max(dt,1e-3);st.lastYaw=st.yaw;st.sway+=(-yv*.04-st.sway)*(1-Math.exp(-dt*4));
    // blink: random, sometimes double
    if(t>st.nextBlink){st.blinkT=0;st.nextBlink=t+(Math.random()<.2?.35:2+Math.random()*3.5)}
    if(st.blinkT>=0){st.blinkT+=dt;const p=st.blinkT/.17;st.blink=p<1?Math.sin(p*Math.PI):0;if(p>=1)st.blinkT=-1}
    // talking rhythm
    const talking=t<st.talkUntil;const open=talking?Math.max(0,Math.sin(t*17)*.5+Math.sin(t*9.3)*.5):0;st.talk+=(open-st.talk)*(1-Math.exp(-dt*25));
    const mouthMix=st.alt==='open'?st.talk:(talking?1-st.talk:0);
    st.hopV+=(-st.hop*90-st.hopV*9)*dt;st.hop+=st.hopV*dt;st.fade=Math.min(1,st.fade+dt*2.4);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    const f=(n,x)=>gl.uniform1f(U[n],x);
    f('t',reduce?0:t);f('neck',st.neck);f('hip',st.hip);f('yaw',st.yaw);f('pitch',st.pitch);f('hyaw',reduce?0:st.hy*.8);f('hpitch',reduce?0:st.hp*.6);f('roll',reduce?0:st.roll);
    f('breath',reduce?0:Math.sin(t*1.7)*.5+.5);f('hop',st.hop);f('aspect',cv.width/cv.height);f('sway',st.sway);f('blink',st.blink);f('mouth',mouthMix);f('fade',st.fade);f('rim',.5);
    gl.uniform3fv(U.rimCol,st.neon?[.55,.25,.6]:[.45,.35,.5]);
    gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_SHORT,0)})(last);
  if(opt.src)set(opt);
  return{set,el,say};
}
window.Alive2D={mount};
})();
