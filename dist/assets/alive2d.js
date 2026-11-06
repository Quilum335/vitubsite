/* alive2d — makes a flat character illustration feel alive (breathing, head and hair sway,
   looking at the cursor, a hop on click). One textured grid mesh, deformed in a vertex shader.
   Usage: const a = Alive2D.mount(container, {src, neck:.27, hip:.55}); a.set({src}); */
(()=>{
const VS=`#version 300 es
in vec2 p;out vec2 uv;uniform float t,neck,hip,lookX,lookY,breath,hop,aspect;
void main(){
  vec2 q=p;float y=p.y; // y: 0 top .. 1 bottom
  float above=smoothstep(neck+.06,neck-.04,y);          // head area weight
  float torso=smoothstep(neck-.02,neck+.06,y)*smoothstep(hip+.08,hip-.04,y);
  // breathing: chest rises and widens a touch
  q.y-= torso*breath*.006 + above*breath*.007;
  q.x+= (p.x-.5)*torso*breath*.012;
  // head: tilt around the neck pivot, follow the cursor
  float ang=above*(sin(t*.9)*.018+lookX*.07);
  vec2 piv=vec2(.5,neck);vec2 d=q-piv;d.x*=aspect;
  d=vec2(d.x*cos(ang)-d.y*sin(ang),d.x*sin(ang)+d.y*cos(ang));d.x/=aspect;q=piv+d;
  q.x+=above*lookX*.012;q.y+=above*lookY*.008;
  // hair and loose parts on the sides sway, more towards the bottom
  float side=smoothstep(.14,.34,abs(p.x-.5));
  q.x+=side*smoothstep(neck-.05,1.,y)*sin(t*1.25+y*5.)*.007;
  // whole body leans slightly towards the cursor
  q.x+=lookX*.014*(1.-y);
  // hop on click: squash and stretch around the feet
  q.y=1.-(1.-q.y)*(1.+hop*.06);q.x=.5+(q.x-.5)*(1.-hop*.03);q.y-=hop*.035;
  uv=p;gl_Position=vec4(q.x*2.-1.,1.-q.y*2.,0.,1.);
}`;
const FS=`#version 300 es
precision mediump float;in vec2 uv;out vec4 o;uniform sampler2D img;uniform float fade;
void main(){vec4 c=texture(img,uv);o=vec4(c.rgb*c.a,c.a)*fade;}`;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let px=null,py=null;addEventListener('pointermove',e=>{px=e.clientX;py=e.clientY},{passive:true});

function mount(el,opt={}){
  const cv=document.createElement('canvas');cv.className='alive-canvas';el.appendChild(cv);
  const gl=cv.getContext('webgl2',{premultipliedAlpha:true,alpha:true,antialias:true});
  if(!gl){el.classList.add('no-gl');return{set(o){const i=el.querySelector('img');if(i&&o.src)i.src=o.src}}}
  const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(s);return s};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
  const N=48,M=72,v=[],idx=[];
  for(let j=0;j<=M;j++)for(let i=0;i<=N;i++)v.push(i/N,j/M);
  for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;idx.push(a,b,c,b,d,c)}
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
  const U=n=>gl.getUniformLocation(pr,n);const u={t:U('t'),neck:U('neck'),hip:U('hip'),lookX:U('lookX'),lookY:U('lookY'),breath:U('breath'),hop:U('hop'),aspect:U('aspect'),fade:U('fade')};
  const tex=gl.createTexture();gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  const st={neck:opt.neck??.27,hip:opt.hip??.55,lx:0,ly:0,hop:0,hopV:0,fade:0,loaded:false,visible:true,t:Math.random()*10};
  function fit(){const r=el.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);const ar=2/3;let w=r.width,h=r.height;if(w/h>ar)w=h*ar;else h=w/ar;cv.style.width=w+'px';cv.style.height=h+'px';cv.width=Math.round(w*d);cv.height=Math.round(h*d);gl.viewport(0,0,cv.width,cv.height)}
  new ResizeObserver(fit).observe(el);fit();
  new IntersectionObserver(e=>st.visible=e[0].isIntersecting).observe(el);
  function load(src){return new Promise((res,rej)=>{const im=new Image();im.crossOrigin='anonymous';im.decoding='async';im.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);res()};im.onerror=rej;im.src=src})}
  async function set(o){if(o.neck!=null)st.neck=o.neck;if(o.hip!=null)st.hip=o.hip;st.fade=0;await load(o.src);st.loaded=true;el.classList.add('ready');el.dispatchEvent(new CustomEvent('alive-ready',{bubbles:true}))}
  el.addEventListener('click',()=>{st.hopV=reduce?0:5.5});
  let last=performance.now();
  (function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(!st.visible||document.hidden||!st.loaded)return;st.t+=dt;
    let tx=Math.sin(st.t*.35)*.25,ty=0;
    if(px!=null){const r=el.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(px-(r.left+r.width/2))/(innerWidth*.45)));ty=Math.max(-1,Math.min(1,(py-(r.top+r.height*.25))/(innerHeight*.6)))}
    const k=1-Math.exp(-dt*5);st.lx+=(tx-st.lx)*k;st.ly+=(ty-st.ly)*k;
    // spring for the hop
    st.hopV+=(-st.hop*90-st.hopV*9)*dt;st.hop+=st.hopV*dt;
    st.fade=Math.min(1,st.fade+dt*2.2);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u.t,reduce?0:st.t);gl.uniform1f(u.neck,st.neck);gl.uniform1f(u.hip,st.hip);gl.uniform1f(u.lookX,reduce?0:st.lx);gl.uniform1f(u.lookY,reduce?0:st.ly);
    gl.uniform1f(u.breath,reduce?0:(Math.sin(st.t*1.7)*.5+.5));gl.uniform1f(u.hop,st.hop);gl.uniform1f(u.aspect,cv.width/cv.height);gl.uniform1f(u.fade,st.fade);
    gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_SHORT,0)})(last);
  if(opt.src)set(opt);
  return{set,el};
}
window.Alive2D={mount};
})();
