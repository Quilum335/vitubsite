import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
import {models} from './models.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const byId=Object.fromEntries(models.map(m=>[m.id,m]));
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
const cache=new Map();
async function load(url){
  if(!cache.has(url))cache.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('Model HTTP '+r.status);return r.arrayBuffer()}).catch(e=>{cache.delete(url);throw e}));
  const bytes=await cache.get(url);
  if(cache.size>3){const k=cache.keys().next().value;if(k!==url)cache.delete(k)}
  const loader=new GLTFLoader();loader.register(p=>new VRMLoaderPlugin(p));
  return loader.parseAsync(bytes.slice(0),'');
}

/* Input that drives the "alive" character: pointer by default, webcam/mic when enabled. */
const drive={yaw:0,pitch:0,roll:0,mouth:0,smile:0,blinkL:0,blinkR:0,face:false,voice:0};
addEventListener('pointermove',e=>{if(drive.face)return;drive.px=e.clientX;drive.py=e.clientY},{passive:true});

class Viewer{
  constructor(el,{hero=false}={}){
    this.el=el;this.hero=hero;this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(hero?24:30,1,.01,100);
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:!hero});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.setClearColor(0,0);
    el.appendChild(this.renderer.domElement);
    const c=this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    c.enablePan=false;c.enableDamping=true;c.minDistance=1;c.maxDistance=9;c.minPolarAngle=.4;c.maxPolarAngle=2.3;c.enableZoom=!hero;c.enabled=!hero;c.autoRotateSpeed=.9;
    this.scene.add(new THREE.HemisphereLight(0xf2ecff,0x2a2140,1.35));
    const key=new THREE.DirectionalLight(0xfff4ec,1.7);key.position.set(2.5,4,4);this.scene.add(key);
    const rim=new THREE.DirectionalLight(0xb59cff,2);rim.position.set(-3,2.5,-3);this.scene.add(rim);
    const rim2=new THREE.DirectionalLight(0xd8ff5e,.5);rim2.position.set(3,1.5,-2.5);this.scene.add(rim2);
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(.5,64),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.004;this.scene.add(shadow);
    this.clock=new THREE.Clock();this.elapsed=0;this.active=true;this.version=0;this.nextBlink=1.5;this.blinkT=-1;this.look={yaw:0,pitch:0,roll:0};this.mouthV=0;this.smileV=0;this.hover=0;this.appear=1;
    new ResizeObserver(()=>this.resize()).observe(el);this.resize();
    new IntersectionObserver(e=>this.visible=e[0].isIntersecting).observe(el);this.visible=true;
    this.renderer.setAnimationLoop(()=>this.frame());
  }
  resize(){const r=this.el.getBoundingClientRect();if(!r.width||!r.height)return;this.renderer.setSize(r.width,r.height,false);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix()}
  status(t){const s=this.el.querySelector('.loading');if(s)s.textContent=t}
  async set(url,isLocal=false){
    const seq=++this.version;this.el.classList.remove('ready');this.status('Загружаем 3D-модель…');
    try{
      const gltf=await load(url);if(seq!==this.version){VRMUtils.deepDispose(gltf.scene);return}
      if(this.model){this.scene.remove(this.model);VRMUtils.deepDispose(this.model)}
      this.vrm=gltf.userData.vrm;this.asset=this.vrm?this.vrm.scene:gltf.scene;this.model=new THREE.Group();this.model.add(this.asset);
      if(this.vrm){VRMUtils.rotateVRM0(this.vrm);this.vrm.humanoid.resetNormalizedPose();this.vrm.update(0)}
      this.model.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(this.model),size=box.getSize(new THREE.Vector3()),f=1.8/Math.max(size.y,.01);
      this.asset.scale.multiplyScalar(f);this.asset.position.sub(box.getCenter(new THREE.Vector3()).multiplyScalar(f));this.asset.position.y+=.9;this.height=1.8;
      this.scene.add(this.model);this.rig();
      this.view('full');this.expression('neutral');
      if(!this.hero){
        $$('[data-expression]').forEach(b=>b.disabled=!this.vrm?.expressionManager&&(!this.morphs.smile.length||b.dataset.expression==='angry'));
        const note=$('.model-note');if(note)note.textContent=isLocal?'Модель открыта только в твоём браузере и никуда не загружается.':'Персонаж живой: моргает, дышит и следит за курсором. Совместимость со стриминговыми программами проверяем под проект.';
      }
      this.appear=0;this.el.classList.add('ready');this.resize();this.el.dispatchEvent(new CustomEvent('model-ready',{bubbles:true}));
    }catch(e){this.status('Не удалось открыть модель — обнови страницу.');console.error('Model load failed',e)}
  }
  /* find bones and morph targets so any of our GLB/VRM characters can blink, talk and look around */
  rig(){
    const find=re=>{let hit=null;this.asset.traverse(n=>{if(!hit&&n.isBone&&re.test(n.name))hit=n});return hit};
    this.bones={head:find(/^(head|j_bip_c_head)$/i)||find(/head/i),neck:find(/^(neck|j_bip_c_neck)$/i),spine:find(/^(spine|spine1|j_bip_c_spine)$/i),chest:find(/^(chest|spine2|upperchest|j_bip_c_chest)$/i)};
    this.rest={};for(const[k,b]of Object.entries(this.bones))if(b)this.rest[k]=b.quaternion.clone();
    this.morphs={blinkL:[],blinkR:[],blink:[],mouth:[],smile:[]};
    this.asset.traverse(n=>{const d=n.morphTargetDictionary;if(!d)return;for(const[k,i]of Object.entries(d)){
      const add=t=>this.morphs[t].push([n,i]);
      if(/blink[._ ]?l(eft)?$/i.test(k))add('blinkL');else if(/blink[._ ]?r(ight)?$/i.test(k))add('blinkR');else if(/^blink$/i.test(k))add('blink');
      else if(/lip(part|motion)|mouth.*open|jaw.*open|^aa?$/i.test(k))add('mouth');else if(/smile/i.test(k))add('smile')}});
  }
  setM(list,v){for(const[n,i]of list)n.morphTargetInfluences[i]=v}
  setBone(name,euler){const b=this.bones?.[name],r=this.rest?.[name];if(!b||!r)return;b.quaternion.copy(r).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(euler.x||0,euler.y||0,euler.z||0,'YXZ')))}
  view(which){const h=this.height||1.7,face=which==='face';this.controls.target.set(0,face?h*.91:this.hero?h*.53:h*.5,0);this.camera.position.set(face?.05:0,face?h*.91:h*.6,face?h*.73:h*(this.hero?2.7:2.15));this.controls.update()}
  expression(name){this.current=name;const m=this.vrm?.expressionManager;if(m){for(const n of['happy','angry','surprised','sad','relaxed'])m.setValue(n,n===name?1:0);return}}
  frame(){
    const dt=Math.min(this.clock.getDelta(),.05);if(!this.active||!this.visible||document.hidden)return;this.elapsed+=dt;const t=this.elapsed;
    if(this.model&&!reduce){
      // where to look: webcam face, otherwise the pointer relative to this viewer
      let ty=0,tp=0,tr=0;
      if(drive.face&&this.hero){ty=drive.yaw;tp=drive.pitch;tr=drive.roll}
      else if(drive.px!=null){const r=this.el.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height*.28;ty=clamp((drive.px-cx)/innerWidth*1.6,-.7,.7);tp=clamp((drive.py-cy)/innerHeight*1.1,-.35,.45);this.hover=damp(this.hover,(Math.abs(drive.px-cx)<r.width*.35&&Math.abs(drive.py-cy)<r.height*.45)?1:0,4,dt)}
      else{ty=Math.sin(t*.4)*.25;tp=Math.sin(t*.27)*.06}
      const L=this.look;L.yaw=damp(L.yaw,ty,6,dt);L.pitch=damp(L.pitch,tp,6,dt);L.roll=damp(L.roll,tr,6,dt);
      const breath=Math.sin(t*1.6);
      this.setBone('head',{y:L.yaw*.55,x:L.pitch*.55,z:-L.roll*.5});
      this.setBone('neck',{y:L.yaw*.3,x:L.pitch*.3,z:-L.roll*.3});
      this.setBone('chest',{x:breath*.012,y:L.yaw*.08});
      this.setBone('spine',{x:breath*.008,y:L.yaw*.06,z:Math.sin(t*.7)*.01});
      if(this.vrm){const h=this.vrm.humanoid;for(const[n,b]of[['head',{y:L.yaw*.6,x:L.pitch*.6}],['neck',{y:L.yaw*.3,x:L.pitch*.3}]]){const node=h.getNormalizedBoneNode(n);if(node){node.rotation.y=b.y;node.rotation.x=b.x}}}
      this.model.rotation.y=L.yaw*.18;this.model.position.y=Math.sin(t*1.6)*.004;
      // blink: auto, or mirrored from the webcam
      let bl=0,br=0;
      if(drive.face&&this.hero){bl=drive.blinkL;br=drive.blinkR}
      else{if(t>this.nextBlink){this.blinkT=0;this.nextBlink=t+2.2+Math.random()*3.2}if(this.blinkT>=0){this.blinkT+=dt;const p=this.blinkT/.16;bl=br=p<1?Math.sin(p*Math.PI):0;if(p>=1)this.blinkT=-1}}
      this.setM(this.morphs.blinkL,bl);this.setM(this.morphs.blinkR,br);this.setM(this.morphs.blink,(bl+br)/2);
      this.vrm?.expressionManager?.setValue('blink',(bl+br)/2);
      // mouth: webcam jaw or microphone level
      const talk=this.hero?Math.max(drive.face?drive.mouth:0,drive.voice):0;this.mouthV=damp(this.mouthV,talk,18,dt);
      // smile: manual expression, webcam smile, or the pointer coming close
      const sm=this.current==='happy'?1:this.hero?Math.max(drive.face?drive.smile:0,this.hover*.85):0;this.smileV=damp(this.smileV,sm,5,dt);
      this.setM(this.morphs.mouth,this.current==='surprised'?.7:this.mouthV);this.setM(this.morphs.smile,this.smileV);
      if(this.vrm){const m=this.vrm.expressionManager;m?.setValue('aa',this.mouthV);if(this.current==='neutral')m?.setValue('happy',this.smileV)}
    }
    if(this.appear<1){this.appear=Math.min(1,this.appear+dt*1.4);const e=1-Math.pow(1-this.appear,3);this.model?.scale.setScalar(.92+.08*e)}
    this.vrm?.update(reduce?0:dt);this.controls.update();this.renderer.render(this.scene,this.camera);
  }
}

/* hero */
const heroEl=$('[data-hero-viewer]');let hero;
function heroSwitch(id){
  const m=byId[id];if(!m)return;
  $$('[data-hero-model]').forEach(b=>{const on=b.dataset.heroModel===id;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});
  const name=$('[data-hero-name]'),cap=$('[data-hero-caption]'),poster=heroEl?.querySelector('.poster');
  if(name)name.textContent=m.name;if(cap)cap.textContent=(m.untextured?'Скульпт без текстур':'Живой 3D-персонаж')+' · '+m.index;
  if(poster){poster.src=m.poster;poster.alt=m.name+' — 3D VTuber-персонаж'}
  const open=$('[data-hero-open]');if(open)open.dataset.model=id;
  hero?.set(m.url);
}
if(heroEl){
  const start=()=>{try{hero=new Viewer(heroEl,{hero:true});hero.set(byId[heroEl.dataset.start||'Catgirl'].url)}catch(e){heroEl.querySelector('.loading').textContent='3D недоступен в этом браузере'}};
  const idle=window.requestIdleCallback||(f=>setTimeout(f,300));
  if(document.readyState==='complete')idle(start,{timeout:800});else addEventListener('load',()=>idle(start,{timeout:800}));
  $$('[data-hero-model]').forEach(b=>b.addEventListener('click',()=>heroSwitch(b.dataset.heroModel)));
}

/* VTuber mode: webcam face tracking (MediaPipe, runs locally) and microphone lip sync */
const camBtn=$('[data-vtuber-cam]'),micBtn=$('[data-vtuber-mic]'),pip=$('.vt-pip'),vtStatus=$('.vt-status');
const say=t=>{if(vtStatus){vtStatus.textContent=t;vtStatus.hidden=!t}};
let camStream,landmarker,video,rafId;
async function startCam(){
  try{
    camBtn.disabled=true;say('Загружаем трекинг лица…');
    const MP='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
    const vision=await import(/* @vite-ignore */ MP+'/vision_bundle.mjs');
    const files=await vision.FilesetResolver.forVisionTasks(MP+'/wasm');
    landmarker??=await vision.FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:true,outputFacialTransformationMatrixes:true});
    camStream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'},audio:false});
    video=pip.querySelector('video');video.srcObject=camStream;await video.play();pip.hidden=false;
    drive.face=true;camBtn.classList.add('on');camBtn.disabled=false;camBtn.setAttribute('aria-pressed','true');say('Ты в эфире. Видео не покидает браузер.');
    let last=-1;const loop=()=>{rafId=requestAnimationFrame(loop);if(video.currentTime===last)return;last=video.currentTime;
      const r=landmarker.detectForVideo(video,performance.now());const bs=r.faceBlendshapes?.[0]?.categories;const mx=r.facialTransformationMatrixes?.[0]?.data;
      if(!bs||!mx)return;const g=n=>bs.find(c=>c.categoryName===n)?.score||0;
      drive.blinkL=clamp(g('eyeBlinkRight')*1.25,0,1);drive.blinkR=clamp(g('eyeBlinkLeft')*1.25,0,1);drive.mouth=clamp(g('jawOpen')*1.6,0,1);drive.smile=clamp((g('mouthSmileLeft')+g('mouthSmileRight'))*.7,0,1);
      drive.pitch=clamp(Math.asin(clamp(-mx[9],-1,1))*1.1,-.5,.5);drive.yaw=clamp(-Math.atan2(mx[8],mx[10])*1.2,-.8,.8);drive.roll=clamp(Math.atan2(mx[1],mx[5]),-.5,.5)};
    loop();
  }catch(e){console.error(e);stopCam();camBtn.disabled=false;say(e?.name==='NotAllowedError'?'Нет доступа к камере — разреши его в браузере.':'Камера не запустилась в этом браузере.')}
}
function stopCam(){cancelAnimationFrame(rafId);camStream?.getTracks().forEach(t=>t.stop());camStream=null;drive.face=false;drive.mouth=drive.smile=drive.blinkL=drive.blinkR=0;if(pip)pip.hidden=true;camBtn?.classList.remove('on');camBtn?.setAttribute('aria-pressed','false')}
camBtn?.addEventListener('click',()=>camStream?(stopCam(),say('')):startCam());
let micStream,micCtx,micRaf;
async function startMic(){
  try{micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});micCtx=new AudioContext();const src=micCtx.createMediaStreamSource(micStream),an=micCtx.createAnalyser();an.fftSize=1024;src.connect(an);const buf=new Float32Array(an.fftSize);
    const loop=()=>{micRaf=requestAnimationFrame(loop);an.getFloatTimeDomainData(buf);let s=0;for(const v of buf)s+=v*v;const rms=Math.sqrt(s/buf.length);drive.voice=clamp((rms-.012)*14,0,1)};loop();
    micBtn.classList.add('on');micBtn.setAttribute('aria-pressed','true');say('Говори — персонаж повторяет за тобой.')}
  catch(e){console.error(e);say(e?.name==='NotAllowedError'?'Нет доступа к микрофону — разреши его в браузере.':'Микрофон недоступен.')}
}
function stopMic(){cancelAnimationFrame(micRaf);micStream?.getTracks().forEach(t=>t.stop());micCtx?.close();micStream=null;drive.voice=0;micBtn?.classList.remove('on');micBtn?.setAttribute('aria-pressed','false')}
micBtn?.addEventListener('click',()=>micStream?(stopMic(),say('')):startMic());

/* explorer dialog */
const dialog=$('#model-dialog');let explorer;
function openModel(id){
  const m=byId[id];if(!dialog||!m)return;
  document.querySelectorAll('dialog[open]').forEach(d=>d!==dialog&&d.close());
  dialog.showModal();$('#model-title').textContent=m.name;
  const cap=$('#model-caption');if(cap)cap.textContent=m.caption;
  const like=$('#model-like');if(like){like.dataset.like=id;let s=[];try{s=JSON.parse(localStorage.getItem('normas-mood')||'[]')}catch{}like.setAttribute('aria-pressed',s.includes(id))}
  try{explorer??=new Viewer($('#explorer'));explorer.active=true;explorer.set(m.url);explorer.resize();$$('[data-expression]').forEach(x=>x.classList.toggle('active',x.dataset.expression==='neutral'))}
  catch(e){$('#explorer .loading').textContent='Для 3D-просмотра нужен браузер с WebGL.'}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-model]');if(b){e.preventDefault();openModel(b.dataset.model)}});
$$('[data-expression]').forEach(b=>b.addEventListener('click',()=>{explorer?.expression(b.dataset.expression);$$('[data-expression]').forEach(x=>x.classList.toggle('active',x===b))}));
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>explorer?.view(b.dataset.view)));
$('#rotate-toggle')?.addEventListener('click',e=>{if(!explorer)return;const a=!explorer.controls.autoRotate;explorer.controls.autoRotate=a;e.currentTarget.setAttribute('aria-pressed',a)});
$('#save-frame')?.addEventListener('click',()=>{if(!explorer?.model)return;explorer.renderer.render(explorer.scene,explorer.camera);explorer.renderer.domElement.toBlob(b=>{if(!b)return;const a=document.createElement('a'),u=URL.createObjectURL(b);a.href=u;a.download=($('#model-title').textContent||'character')+'-NORMAS.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500)})});
$('#model-file')?.addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;if(f.size>100*1024*1024){alert('Выбери модель меньше 100 МБ.');return}const u=URL.createObjectURL(f);$('#model-title').textContent=f.name;await explorer.set(u,true);cache.delete(u);URL.revokeObjectURL(u)});
dialog?.addEventListener('close',()=>{if(explorer){explorer.active=false;explorer.controls.autoRotate=false;$('#rotate-toggle')?.setAttribute('aria-pressed','false')}});
const hm=location.hash.match(/^#m-(\w+)/);if(hm&&byId[hm[1]])setTimeout(()=>openModel(hm[1]),300);
