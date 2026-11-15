import * as THREE from 'three';
import {RoomEnvironment} from './jsm/environments/RoomEnvironment.js';
import {W,H,C,ease,seg,lerp,clamp,fade,background,finish,beginFrame,endFrame,text,callout,footnote,eraTag,SAFE} from './lib.js';
const out=document.getElementById('c');const g=out.getContext('2d');
const R=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
R.setSize(W,H,false);R.setPixelRatio(1);R.outputColorSpace=THREE.SRGBColorSpace;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const S=new THREE.Scene();const pm=new THREE.PMREMGenerator(R);S.environment=pm.fromScene(new RoomEnvironment(),0.04).texture;
const cam=new THREE.PerspectiveCamera(28,W/H,1,1000);
// lights
const key=new THREE.DirectionalLight(0xfff1dc,2.2);key.position.set(-40,90,50);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:10,far:250});key.shadow.radius=6;key.shadow.bias=-0.0004;S.add(key);
const rim=new THREE.DirectionalLight(0xe9c873,1.1);rim.position.set(60,30,-70);S.add(rim);
S.add(new THREE.HemisphereLight(0x8fa6c8,0x0b111d,0.35));
const ground=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.ShadowMaterial({opacity:0.42}));ground.rotation.x=-Math.PI/2;ground.position.y=-5.5;ground.receiveShadow=true;S.add(ground);
// --- board top texture: traces, pads and silkscreen outlines (no text, no logos)
function boardTex(){const n=2048,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');const k=n/36,P=v=>(v+18)*k;
  x.fillStyle='#121823';x.fillRect(0,0,n,n);
  let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  x.strokeStyle='rgba(52,68,92,0.42)';x.lineCap='round';
  for(let i=0;i<70;i++){x.lineWidth=(0.15+r()*0.25)*k;x.beginPath();let px=-15+r()*30,py=-15+r()*30;x.moveTo(P(px),P(py));
    for(let j=0;j<3;j++){if(r()<0.5)px=clamp(px+(r()-0.5)*20,-16,16);else py=clamp(py+(r()-0.5)*20,-16,16);x.lineTo(P(px),P(py));}x.stroke();}
  for(let i=0;i<120;i++){x.fillStyle='rgba(70,90,120,0.6)';x.beginPath();x.arc(P(-16+r()*32),P(-16+r()*32),0.25*k,0,7);x.fill();}
  // silkscreen outlines
  x.strokeStyle='rgba(225,228,232,0.55)';x.lineWidth=0.12*k;
  const box=(cx,cy,w,h)=>x.strokeRect(P(cx-w/2),P(cy-h/2),w*k,h*k);
  box(0,0,12.5,12.5);box(8.5,-8.5,5.6,5.6);box(-10.5,8,11,6.2);box(9.5,9,7.4,6.4);box(-12.5,-10,4.5,7.5);box(0,15.2,11.5,4);box(0,-15.5,9,6);
  // edge pads (gold)
  x.fillStyle='#c9a24a';
  for(let i=0;i<6;i++){x.fillRect(P(-17.2),P(-7.5+i*3),1.6*k,1.9*k);x.fillRect(P(15.6),P(-7.5+i*3),1.6*k,1.9*k);}
  for(const [a,b] of [[-15.25,-15.25],[15.25,-15.25],[-15.25,15.25],[15.25,15.25]]){x.beginPath();x.arc(P(a),P(b),2.6*k,0,7);x.fill();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.repeat.set(1/36,1/36);t.offset.set(0.5,0.5);return t;}
// --- board
const B=new THREE.Group();S.add(B);
{const sh=new THREE.Shape();const h=18,r=3;sh.moveTo(-h+r,-h);sh.lineTo(h-r,-h);sh.quadraticCurveTo(h,-h,h,-h+r);sh.lineTo(h,h-r);sh.quadraticCurveTo(h,h,h-r,h);sh.lineTo(-h+r,h);sh.quadraticCurveTo(-h,h,-h,h-r);sh.lineTo(-h,-h+r);sh.quadraticCurveTo(-h,-h,-h+r,-h);
 for(const [a,b] of [[-15.25,-15.25],[15.25,-15.25],[-15.25,15.25],[15.25,15.25]]){const p=new THREE.Path();p.absarc(a,b,1.6,0,Math.PI*2,true);sh.holes.push(p);}
 const geo=new THREE.ExtrudeGeometry(sh,{depth:1.6,bevelEnabled:true,bevelThickness:0.15,bevelSize:0.15,bevelSegments:3,curveSegments:24});
 const top=new THREE.MeshPhysicalMaterial({map:boardTex(),roughness:0.42,clearcoat:0.7,clearcoatRoughness:0.35,metalness:0.0});
 const side=new THREE.MeshStandardMaterial({color:0x1a1f27,roughness:0.6});
 const m=new THREE.Mesh(geo,[top,side]);m.rotation.x=-Math.PI/2;m.castShadow=true;m.receiveShadow=true;B.add(m);}
const TOPY=1.75;
const goldM=new THREE.MeshStandardMaterial({color:0xd8b25a,metalness:1,roughness:0.28});
const pinM=new THREE.MeshStandardMaterial({color:0xc8ccd2,metalness:1,roughness:0.3});
const icM=()=>new THREE.MeshPhysicalMaterial({color:0x15171b,roughness:0.55,clearcoat:0.3,emissive:0xe9c873,emissiveIntensity:0});
function chip(x,z,w,d,h,pinsX,pinsZ,rot=0){const grp=new THREE.Group();const mat=icM();
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);body.position.y=h/2+0.1;body.castShadow=true;grp.add(body);
  const pg=new THREE.BoxGeometry(0.22,0.18,0.9);
  const addRow=(n,len,axis,sign)=>{for(let i=0;i<n;i++){const u=(i-(n-1)/2)*(len/(n));const p=new THREE.Mesh(axis==='x'?new THREE.BoxGeometry(0.22,0.18,0.9):new THREE.BoxGeometry(0.9,0.18,0.22),pinM);
      if(axis==='x'){p.position.set(u,0.15,sign*(d/2+0.4));}else{p.position.set(sign*(w/2+0.4),0.15,u);}grp.add(p);}};
  if(pinsX){addRow(pinsX,w-0.6,'x',1);addRow(pinsX,w-0.6,'x',-1);} if(pinsZ){addRow(pinsZ,d-0.6,'z',1);addRow(pinsZ,d-0.6,'z',-1);}
  const dot=new THREE.Mesh(new THREE.CircleGeometry(0.35,24),new THREE.MeshStandardMaterial({color:0x2a2d33,roughness:0.9}));dot.rotation.x=-Math.PI/2;dot.position.set(-w/2+1.1,h+0.11,-d/2+1.1);grp.add(dot);
  grp.position.set(x,TOPY,z);grp.rotation.y=rot;B.add(grp);return {grp,mat,top:new THREE.Vector3(x,TOPY+h+0.2,z)};}
const P={};
P.mcu=chip(0,0,10,10,1.4,16,16,Math.PI/4);
P.gyro=chip(8.5,8.5,4,4,0.9,0,0);
P.osd=chip(-10.5,-8,9.7,4.4,1.1,14,0);
P.flash=chip(9.5,-9,6,5,0.8,4,0);
const regA=chip(-12.5,8.6,2.9,1.6,1.0,3,0),regB=chip(-12.5,11.6,2.9,1.6,1.0,3,0),ldo=chip(-12.5,13.0+0.0,0.01,0.01,0.01,0,0);
P.reg={mats:[regA.mat,regB.mat],top:new THREE.Vector3(-12.5,TOPY+1.2,10.1)};
// USB connector + boot button + ESC connector
{const usb=new THREE.Mesh(new THREE.BoxGeometry(7.6,2.6,5.4),new THREE.MeshStandardMaterial({color:0xb9bec6,metalness:1,roughness:0.25}));usb.position.set(0,TOPY+1.3,15.6);usb.castShadow=true;B.add(usb);
 const btn=new THREE.Mesh(new THREE.BoxGeometry(3,1.2,2),new THREE.MeshStandardMaterial({color:0xd9d9d6,roughness:0.5}));btn.position.set(12.5,TOPY+0.6,14);btn.castShadow=true;B.add(btn);
 const jst=new THREE.Mesh(new THREE.BoxGeometry(10.5,2.2,3.2),new THREE.MeshStandardMaterial({color:0xece6d8,roughness:0.65}));jst.position.set(0,TOPY+1.1,-15.2);jst.castShadow=true;B.add(jst);}
// mounting rings
for(const [a,b] of [[-15.25,-15.25],[15.25,-15.25],[-15.25,15.25],[15.25,15.25]]){const ring=new THREE.Mesh(new THREE.RingGeometry(1.6,2.6,40),goldM);ring.rotation.x=-Math.PI/2;ring.position.set(a,TOPY+0.01,b);B.add(ring);}
// UART pads (raised gold), lit as a group
const padMat=new THREE.MeshStandardMaterial({color:0xd8b25a,metalness:1,roughness:0.3,emissive:0xe9c873,emissiveIntensity:0});
for(let i=0;i<6;i++){for(const sx of [-16.4,16.4]){const p=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.08,1.9),padMat);p.position.set(sx,TOPY+0.04,-7.5+i*3+0.95);B.add(p);}}
P.uart={mats:[padMat],top:new THREE.Vector3(16.4,TOPY+0.2,0)};
// passives
{let s=3;const r=()=>(s=(s*16807)%2147483647)/2147483647;const capM=new THREE.MeshStandardMaterial({color:0x8a7458,roughness:0.6}),resM=new THREE.MeshStandardMaterial({color:0x1d1f22,roughness:0.6});
 const keep=[[0,0,9.5],[8.5,8.5,3.6],[-10.5,-8,6.5],[9.5,-9,4.5],[-12.5,10,3],[0,15.6,5],[0,-15.2,6],[12.5,14,2.5]];
 for(let i=0;i<70;i++){const x=-15+r()*30,z=-15+r()*30;if(keep.some(([a,b,rr])=>Math.abs(x-a)<rr+0.8&&Math.abs(z-b)<rr+0.8))continue;if(Math.abs(x)>14.5&&Math.abs(z)<9)continue;if(Math.abs(Math.abs(x)-15.25)<3.4&&Math.abs(Math.abs(z)-15.25)<3.4)continue;
   const big=r()<0.35;const m=new THREE.Mesh(new THREE.BoxGeometry(big?1.6:1.0,big?0.8:0.45,big?0.8:0.5),big?capM:resM);m.position.set(x,TOPY+(big?0.4:0.23),z);m.rotation.y=r()<0.5?0:Math.PI/2;m.castShadow=true;B.add(m);}}
// highlight schedule and callout slots (fixed slots → labels can never collide)
const ITEMS=[
 {k:'mcu',  l:'Processor',            s:'F4 · 168 million cycles a second', side:'L',slot:0},
 {k:'gyro', l:'Gyro + accelerometer', s:'one chip, 4 mm square',             side:'R',slot:0},
 {k:'reg',  l:'Voltage regulators',   s:'battery down to 5 V and 3.3 V',     side:'L',slot:1},
 {k:'uart', l:'Serial ports (UARTs)', s:'receiver · video transmitter · GPS',side:'R',slot:1},
 {k:'osd',  l:'On-screen display chip',s:'text over the analog picture',     side:'L',slot:2},
 {k:'flash',l:'Blackbox flash',       s:'the flight diary',                  side:'R',slot:2},
];
const T0=1.6,DT=1.05;const SLOTY=[350,560,770];const LX=SAFE.x+420,RX=W-SAFE.x-420;
function proj(v){const p=v.clone();B.localToWorld(p);p.project(cam);return [(p.x+1)/2*W,(1-p.y)/2*H];}
function setCam(t){const u=ease.io(seg(t,0,10));const az=lerp(-0.55,-0.15,u),el=lerp(0.95,0.82,u),dist=lerp(150,128,u);
  cam.position.set(Math.sin(az)*Math.cos(el)*dist,Math.sin(el)*dist,Math.cos(az)*Math.cos(el)*dist);cam.lookAt(0,0,0);cam.updateMatrixWorld();}
let assigned=false;
function assign(){setCam(6);B.updateMatrixWorld(true);const pr=ITEMS.map(it=>({it,p:proj(P[it.k].top)}));pr.sort((a,b)=>a.p[0]-b.p[0]);
  const L=pr.slice(0,3).sort((a,b)=>a.p[1]-b.p[1]),Rr=pr.slice(3).sort((a,b)=>a.p[1]-b.p[1]);
  L.forEach((o,i)=>{o.it.side='L';o.it.slot=i;});Rr.forEach((o,i)=>{o.it.side='R';o.it.slot=i;});assigned=true;}
window.renderFrame=(t)=>{if(!assigned)assign();
  beginFrame();
  // camera: slow orbit + push-in
  setCam(t);
  B.position.y=lerp(-6,0,ease.out(seg(t,0,1.4)));B.rotation.y=lerp(0.25,0,ease.out(seg(t,0,2.2)));B.updateMatrixWorld(true);
  ITEMS.forEach((it,i)=>{const a=ease.out(seg(t,T0+i*DT,T0+i*DT+0.35))*(1-0.85*seg(t,T0+i*DT+0.9,T0+i*DT+1.5));const end=0;
    const mats=P[it.k].mats||[P[it.k].mat];for(const m of mats)m.emissiveIntensity=Math.max(a,end)*0.3;});
  R.render(S,cam);
  background(g,t);g.drawImage(R.domElement,0,0);
  const A=fade(t,0,99,0.6);
  eraTag(g,'2016–2018 · F4 boards',A);
  ITEMS.forEach((it,i)=>{const st=T0+i*DT;const gr=ease.io(seg(t,st,st+0.7));if(gr<=0)return;
    const [ax,ay]=proj(P[it.k].top);const ly=SLOTY[it.slot];const dim=1-0.3*seg(t,st+1.2,st+1.8)+0.3*seg(t,T0+6*DT+0.4,T0+6*DT+1.2);
    callout(g,ax,ay,it.side==='L'?LX:RX,ly,it.l,it.s,dim,it.side==='L'?'left':'right',gr);});
  footnote(g,'Generic F4 flight controller · illustrative',A);
  finish(g,t);const fo=1-fade(t,0,10,0.5);if(fo>0){g.fillStyle=`rgba(0,0,0,${fo})`;g.fillRect(0,0,W,H);}
  endFrame(t);
};
document.fonts.load('600 30px Inter').then(()=>document.fonts.load('400 30px Inter')).then(()=>{window.ready=true;});
