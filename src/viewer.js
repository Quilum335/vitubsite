import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
import {models} from './models.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const byId=Object.fromEntries(models.map(m=>[m.id,m]));
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cache=new Map();
async function load(url){
  if(!cache.has(url))cache.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('Model HTTP '+r.status);return r.arrayBuffer()}).catch(e=>{cache.delete(url);throw e}));
  const bytes=await cache.get(url);
  if(cache.size>3){const k=cache.keys().next().value;if(k!==url)cache.delete(k)}
  const loader=new GLTFLoader();loader.register(p=>new VRMLoaderPlugin(p));
  return loader.parseAsync(bytes.slice(0),'');
}

class Viewer{
  constructor(el,{hero=false}={}){
    this.el=el;this.hero=hero;this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(hero?26:30,1,.01,100);
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:!hero});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.setClearColor(0,0);
    el.appendChild(this.renderer.domElement);
    const c=this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    c.enablePan=false;c.enableDamping=true;c.minDistance=1;c.maxDistance=9;c.minPolarAngle=hero?1.15:.4;c.maxPolarAngle=hero?1.75:2.3;c.enableZoom=!hero;c.autoRotate=hero&&!reduce;c.autoRotateSpeed=.9;
    this.scene.add(new THREE.HemisphereLight(0xf2ecff,0x2a2140,1.25));
    const key=new THREE.DirectionalLight(0xfff4ec,1.6);key.position.set(3,4,4);this.scene.add(key);
    const rim=new THREE.DirectionalLight(0xb59cff,1.4);rim.position.set(-3,2.5,-3);this.scene.add(rim);
    const fill=new THREE.DirectionalLight(0xd8ff5e,.25);fill.position.set(2,.5,-2);this.scene.add(fill);
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(.5,64),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.004;this.scene.add(shadow);
    this.clock=new THREE.Clock();this.elapsed=0;this.active=true;this.version=0;
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
      if(this.vrm){VRMUtils.rotateVRM0(this.vrm);this.vrm.humanoid.resetNormalizedPose();this.setBone('leftUpperArm',{z:1.1});this.setBone('rightUpperArm',{z:-1.1});this.vrm.update(0)}
      this.model.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(this.model),size=box.getSize(new THREE.Vector3()),f=1.8/Math.max(size.y,.01);
      this.asset.scale.multiplyScalar(f);this.asset.position.sub(box.getCenter(new THREE.Vector3()).multiplyScalar(f));this.asset.position.y+=.9;this.height=1.8;
      this.scene.add(this.model);this.hasMorphs=false;this.asset.traverse(n=>{if(n.morphTargetDictionary&&Object.keys(n.morphTargetDictionary).length)this.hasMorphs=true});
      this.view('full');this.expression('neutral');
      if(!this.hero){
        $$('[data-expression]').forEach(b=>b.disabled=!this.vrm?.expressionManager&&(!this.hasMorphs||b.dataset.expression==='angry'));
        const note=$('.model-note');if(note)note.textContent=isLocal?'Модель открыта только в твоём браузере и никуда не загружается.':'Статичный 3D-просмотр без анимации. Совместимость со стриминговыми программами проверяем под проект.';
      }
      this.el.classList.add('ready');this.resize();
    }catch(e){this.status('Не удалось открыть модель — обнови страницу.');console.error('Model load failed',e)}
  }
  setBone(name,r){const b=this.vrm?.humanoid.getNormalizedBoneNode(name);if(b)for(const k in r)b.rotation[k]=r[k]}
  view(which){const h=this.height||1.7,face=which==='face';this.controls.target.set(0,face?h*.91:h*.5,0);this.camera.position.set(face?.05:this.hero?.3:.35,face?h*.91:h*.56,face?h*.73:h*(this.hero?2.45:2.15));this.controls.update()}
  expression(name){this.current=name;const m=this.vrm?.expressionManager;if(m){for(const n of['happy','angry','surprised','sad','relaxed'])m.setValue(n,n===name?1:0);return}
    this.asset?.traverse(node=>{const d=node.morphTargetDictionary;if(!d)return;for(const[k,i]of Object.entries(d)){if(/smile/i.test(k))node.morphTargetInfluences[i]=name==='happy'?1:0;if(/lip(part|motion)|mouth.*open/i.test(k))node.morphTargetInfluences[i]=name==='surprised'?.6:0}})}
  frame(){
    const dt=Math.min(this.clock.getDelta(),.05);if(!this.active||!this.visible||document.hidden)return;this.elapsed+=dt;
    if(this.vrm&&!reduce){const t=this.elapsed;this.setBone('head',{y:Math.sin(t*.5)*.065,z:Math.sin(t*.35)*.035});this.vrm.expressionManager?.setValue('blink',Math.pow(Math.max(0,Math.cos(t*1.4)),36))}
    this.vrm?.update(reduce?0:dt);this.controls.update();this.renderer.render(this.scene,this.camera);
  }
}

/* hero */
const heroEl=$('[data-hero-viewer]');let hero;
function heroSwitch(id){
  const m=byId[id];if(!m)return;
  $$('[data-hero-model]').forEach(b=>{const on=b.dataset.heroModel===id;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});
  const name=$('[data-hero-name]'),cap=$('[data-hero-caption]'),poster=heroEl?.querySelector('.poster');
  if(name)name.textContent=m.name;if(cap)cap.textContent=(m.untextured?'Скульпт без текстур':'3D GLB')+' · '+m.index;
  if(poster){poster.src=m.poster;poster.alt=m.name+' — 3D VTuber-персонаж'}
  const open=$('[data-hero-open]');if(open)open.dataset.model=id;
  hero?.set(m.url);
}
if(heroEl){
  const start=()=>{try{hero=new Viewer(heroEl,{hero:true});hero.set(byId[heroEl.dataset.start||'Catgirl'].url)}catch(e){heroEl.querySelector('.loading').textContent='3D недоступен в этом браузере'}};
  const idle=window.requestIdleCallback||(f=>setTimeout(f,400));
  if(document.readyState==='complete')idle(start);else addEventListener('load',()=>idle(start));
  $$('[data-hero-model]').forEach(b=>b.addEventListener('click',()=>heroSwitch(b.dataset.heroModel)));
}

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
const m=location.hash.match(/^#m-(\w+)/);if(m&&byId[m[1]])setTimeout(()=>openModel(m[1]),300);
