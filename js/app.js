import * as T from './lib/three.module.js';
import {Water} from './lib/Water.js';
import {Sky} from './lib/Sky.js';
import {SurfAudio} from './surf-audio.js';
const main=document.querySelector('main'),input=document.querySelector('input'),button=document.querySelector('button[aria-label="고민 내려놓기"]'),form=document.querySelector('form'),status=document.querySelector('[role=status]');
const scene=new T.Scene();scene.fog=new T.FogExp2(0x91becd,.0017);
const camera=new T.PerspectiveCamera(49,1,.1,20000);camera.position.set(0,6.2,16);camera.lookAt(0,2.9,-22);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=T.SRGBColorSpace;
renderer.setClearColor(0x67baf0,1);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;main.prepend(renderer.domElement);
const sky=new Sky();sky.scale.setScalar(10000);scene.add(sky);
const sunDirection=new T.Vector3().setFromSphericalCoords(1,T.MathUtils.degToRad(66),T.MathUtils.degToRad(155));
const skyUniforms=sky.material.uniforms;
skyUniforms.turbidity.value=2.6;skyUniforms.rayleigh.value=2.1;skyUniforms.mieCoefficient.value=.004;skyUniforms.mieDirectionalG.value=.82;skyUniforms.sunPosition.value.copy(sunDirection);
scene.add(new T.HemisphereLight(0xd9f0ff,0x26323b,1.8));const sun=new T.DirectionalLight(0xfff0d5,2.8);sun.position.copy(sunDirection).multiplyScalar(70);scene.add(sun);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;sun.shadow.camera.far=160;sun.shadow.normalBias=.045;
const pmrem=new T.PMREMGenerator(renderer),environmentScene=new T.Scene();environmentScene.add(sky);const environment=pmrem.fromScene(environmentScene,.025);scene.add(sky);scene.environment=environment.texture;pmrem.dispose();
// Soft procedural clouds on a sky dome, with transparency from fractal noise.
const cloudMaterial=new T.ShaderMaterial({side:T.BackSide,transparent:true,depthWrite:false,uniforms:{clock:{value:0}},vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 direction;uniform float clock;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<5;i++){n+=a*noise(p);p=p*2.03+7.1;a*=.5;}return n;}
void main(){vec3 d=normalize(direction);vec2 p=d.xz/max(d.y+.25,.04)*2.8+vec2(clock*.008,0);float n=fbm(p);float alpha=smoothstep(.49,.72,n)*smoothstep(.01,.15,d.y)*(1.-smoothstep(.8,1.,d.y))*.82;vec3 col=mix(vec3(.60,.71,.80),vec3(1.),smoothstep(.48,.73,n));gl_FragColor=vec4(col,alpha);}`});
const cloudDome=new T.Mesh(new T.SphereGeometry(9000,24,16),cloudMaterial);scene.add(cloudDome);
const surf=new SurfAudio();const soundButton=document.querySelector('.sound-toggle');
function soundState(){soundButton.setAttribute('aria-pressed',String(!surf.muted&&surf.ready));soundButton.setAttribute('aria-label',surf.muted?'파도 소리 켜기':'파도 소리 끄기');soundButton.classList.toggle('muted',surf.muted||!surf.ready);}
main.addEventListener('pointerdown',e=>{if(e.target.closest('.sound-toggle'))return;surf.start().then(soundState).catch(()=>{});});
form.addEventListener('keydown',()=>surf.start().then(soundState).catch(()=>{}));
soundButton.addEventListener('click',async()=>{try{if(!surf.ready){surf.muted=false;await surf.start();}else await surf.toggle();soundState();}catch{status.textContent='소리를 시작하지 못했어요. 다시 눌러 주세요';}});
document.addEventListener('visibilitychange',()=>surf.visibility(document.hidden).catch(()=>{}));
const noiseCanvas=document.createElement('canvas');noiseCanvas.width=noiseCanvas.height=256;const ctx=noiseCanvas.getContext('2d'),im=ctx.createImageData(256,256);for(let i=0;i<im.data.length;i+=4){let n=115+Math.random()*95;im.data[i]=im.data[i+1]=im.data[i+2]=n;im.data[i+3]=255;}ctx.putImageData(im,0,0);const grain=new T.CanvasTexture(noiseCanvas);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(3,3);
const concrete=new T.MeshPhysicalMaterial({color:0x929b9b,roughness:.76,map:grain,bumpMap:grain,bumpScale:.065,clearcoat:.28,clearcoatRoughness:.4});
const darkConcrete=new T.MeshStandardMaterial({color:0x35434a,roughness:.84,map:grain,bumpMap:grain,bumpScale:.09});
const armGeo=new T.CylinderGeometry(.32,.53,1.45,12,2);armGeo.translate(0,.53,0);const coreGeo=new T.SphereGeometry(.52,12,8);
const directions=[[0,1,0],[.943,-.333,0],[-.471,-.333,.816],[-.471,-.333,-.816]].map(a=>new T.Vector3(...a));
function pod(material){const g=new T.Group();g.add(new T.Mesh(coreGeo,material));for(const d of directions){const m=new T.Mesh(armGeo,material);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d);g.add(m);}g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g;}
// ponytail: fixed ±15 width covers up to ~21:9; widen if ultrawide matters
for(let i=0;i<39;i++){const p=pod(darkConcrete);p.position.set((i%13-6)*2.35+(Math.random()-.5),-.6+Math.floor(i/13)*.13,3.6+Math.floor(i/13)*1.6);p.rotation.set(Math.random()*3,Math.random()*6,Math.random()*3);p.scale.setScalar(1.25);scene.add(p);}
const waterNormals=await new T.TextureLoader().loadAsync('./src/waternormals.jpg');waterNormals.wrapS=waterNormals.wrapT=T.RepeatWrapping;
const waterGeo=new T.PlaneGeometry(2,2,180,220),positions=waterGeo.attributes.position;
for(let i=0;i<positions.count;i++){const x=positions.getX(i),v=(positions.getY(i)+1)*.5;positions.setXYZ(i,Math.sign(x)*x*x*1300,-32+v*v*2600,0);}waterGeo.computeBoundingSphere();
const water=new Water(waterGeo,{textureWidth:512,textureHeight:512,waterNormals,sunDirection,sunColor:0xffefd4,waterColor:0x006ddd,distortionScale:3.2,fog:true});
water.rotation.x=-Math.PI/2;water.position.y=-.65;water.material.uniforms.size.value=5.;scene.add(water);
// Extend the official Water shader with actual swell displacement and crest foam.
const wm=water.material;wm.uniforms.waveFront={value:-1000};
const rippleUniforms=Array.from({length:4},()=>new T.Vector4(0,0,0,0));wm.uniforms.foamRings={value:rippleUniforms};
const heightGLSL=`uniform float waveFront;varying float crestHeight;
float seaHeight(vec2 p){return sin(p.x*1.4+p.y*.8-time*1.7)*.13+sin(p.y*2.8+p.x*.5-time*2.9)*.075+sin(p.x*4.-p.y*3.+time*1.9)*.035+sin(p.y*.42-time*1.65+sin(p.x*.19)*.4)*.28+exp(-pow(p.y-waveFront,2.)/9.)*2.6;}`;
wm.vertexShader=wm.vertexShader.replace('void main() {',heightGLSL+`
void main() {vec3 displaced=position;displaced.z=seaHeight(vec2(position.x,-position.y));crestHeight=displaced.z;`).replaceAll('vec4( position, 1.0 )','vec4( displaced, 1.0 )');
wm.fragmentShader=wm.fragmentShader.replace('varying vec4 mirrorCoord;','varying vec4 mirrorCoord;uniform float waveFront;varying float crestHeight;uniform vec4 foamRings[4];');
wm.fragmentShader=wm.fragmentShader.replace('float rf0 = 0.3;','float rf0 = 0.12;');
wm.fragmentShader=wm.fragmentShader.replace('vec3 outgoingLight = albedo;',`
float crestFoam=smoothstep(.85,2.25,crestHeight)*(.65+.35*noise.x);
float smallFoam=smoothstep(.31,.52,crestHeight)*smoothstep(.10,.6,noise.z)*.24;
float ringFoam=0.;
for(int i=0;i<4;i++){
 vec4 ring=foamRings[i];vec2 delta=worldPosition.xz-ring.xy;
 float r=length(delta);float irregular=sin(atan(delta.y,delta.x)*19.+time*1.4)*.055;
 float edge=abs(r-ring.z+irregular);
 float band=(1.-smoothstep(.045,.24,edge))*ring.w;
 ringFoam+=band*smoothstep(-.5,.35,noise.x+noise.z*.35);
}
vec3 blueWater=mix(albedo,vec3(.006,.095,.34),.27);
vec3 foamLight=vec3(.83,.95,1.)+min(specularLight,vec3(2.5))*.65;
vec3 outgoingLight=mix(blueWater,foamLight,clamp(crestFoam+smallFoam+ringFoam,0.,.96));`);
let lastActive=0,time=0,nextWave=Infinity,waveStart=-100,broken=false;const worries=[],pieces=[],labels=[];const dummy=new T.Object3D();
const foamCount=1250,foam=new T.InstancedMesh(new T.SphereGeometry(1,6,4),new T.MeshPhysicalMaterial({color:0xe8faff,roughness:.18,metalness:0,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.6,transparent:true,opacity:.84}),foamCount);foam.instanceMatrix.setUsage(T.DynamicDrawUsage);foam.frustumCulled=false;scene.add(foam);const seeds=Array.from({length:foamCount},()=>[Math.random(),Math.random(),Math.random(),Math.random()]);
// Four bounded expanding foam rings with round reflective bubbles.
const ringEvents=Array.from({length:4},()=>({x:0,z:0,born:-100,strength:1}));let ringCursor=0,nextRing=1.5;
const ringBubbles=new T.InstancedMesh(new T.SphereGeometry(1,8,6),foam.material,400);ringBubbles.instanceMatrix.setUsage(T.DynamicDrawUsage);ringBubbles.frustumCulled=false;scene.add(ringBubbles);
const bubbleSeeds=Array.from({length:400},()=>[Math.random(),Math.random(),Math.random()]);
function addFoamRing(x,z,strength=1){ringEvents[ringCursor]={x,z,born:time,strength};ringCursor=(ringCursor+1)%4;}
function updateFoamRings(){
 if(time>=nextRing){addFoamRing((Math.random()-.5)*8,3+Math.random()*4,.65);nextRing=time+4.8;}
 for(let r=0;r<4;r++){
  const event=ringEvents[r],age=time-event.born,active=age>=0&&age<5.5;
  const radius=.2+Math.max(0,age)*1.12,fade=active?Math.sin(Math.min(1,age/.3)*Math.PI/2)*Math.pow(1-age/5.5,1.4)*event.strength:0;
  rippleUniforms[r].set(event.x,event.z,radius,fade);
  for(let j=0;j<100;j++){
   const i=r*100+j,[a,b,c]=bubbleSeeds[i],angle=j/100*Math.PI*2+(a-.5)*.07;
   const spread=radius+(b-.5)*(.15+Math.max(0,age)*.1);
   const x=event.x+Math.cos(angle)*spread,z=event.z+Math.sin(angle)*spread;
   const size=(.025+c*.06)*fade;
   dummy.position.set(x,height(x,z)+size*.5+.035,z);dummy.scale.set(size,size*.6,size);dummy.updateMatrix();ringBubbles.setMatrixAt(i,dummy.matrix);
  }
 }
 ringBubbles.instanceMatrix.needsUpdate=true;
}
function waveZ(){return -48+(time-waveStart)*11;}
function height(x,z){const small=Math.sin(x*1.4+z*.8-time*1.7)*.13+Math.sin(z*2.8+x*.5-time*2.9)*.075+Math.sin(x*4-z*3+time*1.9)*.035;const swell=Math.sin(z*.42-time*1.65+Math.sin(x*.19)*.4)*.28;const dz=z-waveZ();return -.65+small+swell+Math.exp(-dz*dz/9)*2.6;}
function textLabel(text,p,dy=0){const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');x.font='500 43px Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';x.shadowColor='#102e42';x.shadowBlur=10;x.fillStyle='#ffffff';const chars=Array.from(text),lines=[];let line='';for(const ch of chars){if(x.measureText(line+ch).width>930){lines.push(line);line=ch;}else line+=ch;}lines.push(line);const shown=lines.slice(0,3);if(lines.length>3)shown[2]=shown[2].slice(0,-1)+'…';shown.forEach((s,i)=>x.fillText(s,512,128+(i-(shown.length-1)/2)*58));const tex=new T.CanvasTexture(c);const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.scale.set(4.9,1.23,1);scene.add(s);labels.push({s,p,born:time,tex,dy});}
function addWorry(text){const n=worries.length,p=pod(concrete);const target=new T.Vector3((n%3-1)*1.3+(Math.random()-.5)*.3,.35+Math.floor(n/3)*.85,2.3+(n%2)*.25);p.position.copy(target);p.position.y+=9;p.rotation.set(Math.random()*2,Math.random()*6,Math.random()*2);scene.add(p);const item={p,target,vy:0,born:time};worries.push(item);textLabel(text,p,n%3===1?.55:0);status.textContent='고민이 테트라포드로 쌓였습니다. 가만히 기다리면 파도가 데려갑니다.';}
function shatter(){addFoamRing(-1.5,2.8,1);addFoamRing(1.7,4,1);for(const w of worries){for(let j=0;j<7;j++){const m=new T.Mesh(j<4?armGeo:coreGeo,concrete);m.position.copy(w.p.position).add(new T.Vector3((Math.random()-.5)*.8,Math.random()*.5,(Math.random()-.5)*.8));m.scale.setScalar(.45+Math.random()*.3);scene.add(m);pieces.push({m,v:new T.Vector3((Math.random()-.5)*7,2+Math.random()*5,4+Math.random()*4),spin:new T.Vector3(Math.random()*4,Math.random()*4,Math.random()*4),born:time});}scene.remove(w.p);}worries.length=0;status.textContent='고민이 파도에 부서져 흩어졌습니다.';}
form.addEventListener('submit',e=>{e.preventDefault();const text=input.value.trim();if(!text)return;if(worries.length>=15){nextWave=Math.min(nextWave,time+.2);input.placeholder='곧 파도가 와요. 잠시만 기다려요';return;}addWorry(text);input.value='';input.blur();input.placeholder='또 다른 고민도 내려놓아요';});
input.disabled=false;button.disabled=false;
const IDLE=3.5,countdown=document.querySelector('.countdown');for(const e of ['pointerdown','keydown','input'])addEventListener(e,()=>{lastActive=time;},true);
function updateCountdown(wz){const idle=time-lastActive,waiting=worries.length&&nextWave===Infinity&&wz>20&&idle>=IDLE;countdown.classList.toggle('show',!!waiting);if(!waiting)return;const left=Math.ceil(IDLE+5-idle);if(countdown.textContent!==String(left))countdown.textContent=left;if(idle>=IDLE+5){nextWave=time;countdown.classList.remove('show');}}
function resize(){const w=main.clientWidth,h=main.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(main);resize();
let previous=performance.now();let pointerX=0;main.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')pointerX=(e.clientX/main.clientWidth-.5)*.3;});
renderer.setAnimationLoop(()=>{const now=performance.now(),dt=Math.min((now-previous)/1000,.04);previous=now;if(document.hidden)return;time+=dt;
if(time>=nextWave){waveStart=time;nextWave=Infinity;broken=false;}const wz=waveZ();updateCountdown(wz);if(!broken&&wz>1&&wz<20){shatter();broken=true;}
cloudMaterial.uniforms.clock.value=time;water.material.uniforms.time.value=time;water.material.uniforms.waveFront.value=wz;surf.update(time,wz);updateFoamRings();
for(let i=0;i<foamCount;i++){const [a,b,c,d]=seeds[i];let x=(a-.5)*40,z,y,s;const active=wz>-15&&wz<25;if(i<850){z=active?wz+(b-.5)*6:-35+b*55;y=height(x,z)+.06;s=.025+c*.055;if(active){y+=Math.sin(b*Math.PI)*c*1.9;x+=Math.sin(time*2+d*9)*.25;}}else{z=2+b*10;x=(a-.5)*15;y=height(x,z)+.1;s=.02+c*.04;if(active){y+=Math.abs(Math.sin(time*3+c*30))*c*3;s*=1.4;}}dummy.position.set(x,y,z);dummy.scale.set(s,s*(active?1: .3),s);dummy.updateMatrix();foam.setMatrixAt(i,dummy.matrix);}foam.instanceMatrix.needsUpdate=true;
for(const w of worries){if(w.p.position.y>w.target.y){w.vy-=dt*17;w.p.position.y+=w.vy*dt;w.p.rotation.y+=dt*.35;if(w.p.position.y<w.target.y){w.p.position.y=w.target.y;w.vy=-w.vy*.23;}}}
for(let i=pieces.length-1;i>=0;i--){const p=pieces[i];p.v.y-=dt*8;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=p.spin.x*dt;p.m.rotation.z+=p.spin.z*dt;const age=time-p.born;if(age>1.7)p.m.scale.multiplyScalar(Math.exp(-dt*1.3));if(age>5){scene.remove(p.m);pieces.splice(i,1);}}
for(let i=labels.length-1;i>=0;i--){const l=labels[i],age=time-l.born;l.s.position.copy(l.p.position).add(new T.Vector3(0,1.85+l.dy,0));l.s.material.opacity=Math.min(1,age*3);if(!l.p.parent){scene.remove(l.s);l.tex.dispose();l.s.material.dispose();labels.splice(i,1);}}
camera.position.x+=(pointerX-camera.position.x)*dt*.6;renderer.render(scene,camera);
});
window.addEventListener('pageshow',()=>{previous=performance.now();});
