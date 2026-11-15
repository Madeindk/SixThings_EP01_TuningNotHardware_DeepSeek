import * as THREE from 'three';
import {RoomEnvironment} from './jsm/environments/RoomEnvironment.js';
import {W,H,C,ease,seg,lerp,clamp,fade,background,finish,beginFrame,endFrame,text,rrect,footnote,title,SAFE} from './lib.js';
const g=document.getElementById('c').getContext('2d');
const R=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
R.setSize(W,H,false);R.outputColorSpace=THREE.SRGBColorSpace;R.toneMapping=THREE.ACESFilmicToneMapping;R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const S=new THREE.Scene();S.environment=new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(),0.04).texture;
const cam=new THREE.PerspectiveCamera(30,W/H,1,3000);
const key=new THREE.DirectionalLight(0xfff1dc,2.0);key.position.set(-150,400,200);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-260,right:260,top:260,bottom:-260,near:50,far:1000});key.shadow.radius=8;S.add(key);
const rim=new THREE.DirectionalLight(0xe9c873,1.0);rim.position.set(300,120,-300);S.add(rim);S.add(new THREE.HemisphereLight(0x8fa6c8,0x0b111d,0.4));
const ground=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.ShadowMaterial({opacity:0.35}));ground.rotation.x=-Math.PI/2;ground.position.y=-90;ground.receiveShadow=true;S.add(ground);
const Q=new THREE.Group();S.add(Q);
const carbon=new THREE.MeshPhysicalMaterial({color:0x17191d,roughness:0.38,clearcoat:0.8,clearcoatRoughness:0.25});
const metal=new THREE.MeshStandardMaterial({color:0x2a2e35,metalness:0.9,roughness:0.35});
const goldM=new THREE.MeshStandardMaterial({color:0xd8b25a,metalness:1,roughness:0.3});
// frame: X arms + centre plates + stack
const ARM=112; // centre→motor, 5-inch class (about 225 mm diagonal)
const MP=[[1,-1],[1,1],[-1,-1],[-1,1]].map(([x,z])=>[x*ARM/Math.SQRT2,z*ARM/Math.SQRT2]); // 0 FR,1 RR,2 FL,3 RL (z+ = rear)
for(const [x,z] of MP){const len=ARM+8;const arm=new THREE.Mesh(new THREE.BoxGeometry(14,5,len),carbon);arm.position.set(x/2,0,z/2);arm.rotation.y=Math.atan2(x,z);arm.castShadow=true;Q.add(arm);}
{const bot=new THREE.Mesh(new THREE.BoxGeometry(46,4,96),carbon);bot.castShadow=true;Q.add(bot);
 const top=new THREE.Mesh(new THREE.BoxGeometry(40,3,90),carbon);top.position.y=30;top.castShadow=true;Q.add(top);
 for(const [x,z] of [[-17,-40],[17,-40],[-17,40],[17,40]]){const so=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.5,28,16),metal);so.position.set(x,15,z);Q.add(so);}
 const fc=new THREE.Mesh(new THREE.BoxGeometry(36,1.6,36),new THREE.MeshPhysicalMaterial({color:0x121823,roughness:0.45,clearcoat:0.6}));fc.position.y=14;Q.add(fc);
 const mcu=new THREE.Mesh(new THREE.BoxGeometry(10,1.4,10),new THREE.MeshStandardMaterial({color:0x111,roughness:0.5}));mcu.position.y=15.4;mcu.rotation.y=Math.PI/4;Q.add(mcu);
 const cam0=new THREE.Mesh(new THREE.BoxGeometry(20,20,18),metal);cam0.position.set(0,16,-52);Q.add(cam0);
 const lens=new THREE.Mesh(new THREE.CylinderGeometry(6,6,6,24),new THREE.MeshPhysicalMaterial({color:0x0a0d14,roughness:0.05,metalness:0.2,clearcoat:1}));lens.rotation.x=Math.PI/2;lens.position.set(0,16,-62);Q.add(lens);}
{const sh=new THREE.Shape();sh.moveTo(0,-14);sh.lineTo(9,4);sh.lineTo(0,-1);sh.lineTo(-9,4);sh.closePath();
 const ar=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshStandardMaterial({color:0xe9c873,emissive:0xe9c873,emissiveIntensity:0.6,side:THREE.DoubleSide}));
 ar.rotation.x=-Math.PI/2;ar.position.set(0,31.8,-28);Q.add(ar);}
// motors + props
function propTex(){const n=512,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');const cx=n/2;
  const rg=x.createRadialGradient(cx,cx,n*0.06,cx,cx,cx);rg.addColorStop(0,'rgba(200,210,225,0.20)');rg.addColorStop(0.85,'rgba(200,210,225,0.10)');rg.addColorStop(1,'rgba(200,210,225,0)');
  x.fillStyle=rg;x.beginPath();x.arc(cx,cx,cx,0,7);x.fill();
  for(let b=0;b<3;b++){x.save();x.translate(cx,cx);x.rotate(b*Math.PI*2/3);const lg=x.createLinearGradient(0,0,cx,0);
    for(let k=0;k<14;k++){x.rotate(0.035);x.fillStyle=`rgba(220,228,240,${0.05*(1-k/14)})`;x.beginPath();x.moveTo(0,-4);x.quadraticCurveTo(cx*0.6,-16,cx*0.96,-6);x.lineTo(cx*0.96,4);x.quadraticCurveTo(cx*0.6,8,0,4);x.fill();}
    x.restore();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const PT=propTex();
function glowTex(){const n=256,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');const rg=x.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);
  rg.addColorStop(0,'rgba(255,236,180,1)');rg.addColorStop(0.35,'rgba(233,200,115,0.45)');rg.addColorStop(1,'rgba(233,200,115,0)');x.fillStyle=rg;x.fillRect(0,0,n,n);return new THREE.CanvasTexture(c);}
const GT=glowTex();
function beamTex(){const c=document.createElement('canvas');c.width=8;c.height=256;const x=c.getContext('2d');const lg=x.createLinearGradient(0,0,0,256);
  lg.addColorStop(0,'rgba(233,200,115,0)');lg.addColorStop(1,'rgba(233,200,115,0.9)');x.fillStyle=lg;x.fillRect(0,0,8,256);return new THREE.CanvasTexture(c);}
const BT=beamTex();
const M=MP.map(([x,z],i)=>{const grp=new THREE.Group();grp.position.set(x,2.5,z);Q.add(grp);
  const stator=new THREE.Mesh(new THREE.CylinderGeometry(13,14,8,40),metal);stator.position.y=4;stator.castShadow=true;grp.add(stator);
  const bell=new THREE.Mesh(new THREE.CylinderGeometry(13.5,13.5,12,48),new THREE.MeshStandardMaterial({color:0x202329,metalness:0.85,roughness:0.3}));bell.position.y=14;bell.castShadow=true;grp.add(bell);
  const ringMat=new THREE.MeshStandardMaterial({color:0xd8b25a,metalness:1,roughness:0.3,emissive:0xe9c873,emissiveIntensity:0.2});const ring=new THREE.Mesh(new THREE.TorusGeometry(13.6,0.9,12,64),ringMat);ring.rotation.x=Math.PI/2;ring.position.y=20;grp.add(ring);
  const prop=new THREE.Mesh(new THREE.CircleGeometry(64,64),new THREE.MeshBasicMaterial({map:PT,transparent:true,depthWrite:false,side:THREE.DoubleSide}));prop.rotation.x=-Math.PI/2;prop.position.y=24;grp.add(prop);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshBasicMaterial({map:GT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));glow.rotation.x=-Math.PI/2;glow.position.y=24.5;grp.add(glow);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(9,13,1,32,1,true),new THREE.MeshBasicMaterial({map:BT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,opacity:0.9}));grp.add(beam);
  return {grp,prop,glow,beam,ring,ringMat,dir:(i===0||i===3)?1:-1};});
// command timeline → motor outputs (hover 0.5; changes are illustrative)
const PH=[[0,1.6,'Hover','all four motors push the same'],[1.6,4.2,'Roll right','left motors push harder, right motors ease off'],[4.2,6.8,'Pitch forward','rear motors push harder, front motors ease off'],[6.8,10,'Yaw','one diagonal pair speeds up, the other slows']];
function cmd(t){const r=ease.io(seg(t,1.9,2.5))*(1-ease.io(seg(t,3.6,4.2))),p=ease.io(seg(t,4.5,5.1))*(1-ease.io(seg(t,6.2,6.8))),y=ease.io(seg(t,7.1,7.7))*(1-ease.io(seg(t,9.3,9.9)));return {r,p,y};}
function outs({r,p,y}){ // FR,RR,FL,RL
  const k=0.32;return [0.5-k*r-k*p+k*y, 0.5-k*r+k*p-k*y, 0.5+k*r-k*p-k*y, 0.5+k*r+k*p+k*y].map(v=>clamp(v,0.05,1));}
function sticks(t,{r,p,y},a){ // two gimbals, left panel
  const cx=[SAFE.x+90,SAFE.x+290],cy=470,s=150;
  [['yaw','throttle'],['roll','pitch']].forEach((lab,i)=>{const x=cx[i];g.save();g.globalAlpha=a;rrect(g,x-s/2,cy-s/2,s,s,22);g.fillStyle='rgba(18,27,45,0.78)';g.fill();g.strokeStyle='rgba(154,166,184,0.25)';g.lineWidth=1.5;g.stroke();
    g.strokeStyle='rgba(154,166,184,0.18)';g.beginPath();g.moveTo(x-s/2+16,cy);g.lineTo(x+s/2-16,cy);g.moveTo(x,cy-s/2+16);g.lineTo(x,cy+s/2-16);g.stroke();
    const dx=i===0?y*48:r*48,dy=i===0?0:-p*48*-1;const act=i===0?y:Math.max(r,p);
    g.shadowColor='rgba(233,200,115,0.7)';g.shadowBlur=20*act;g.fillStyle=act>0.02?C.gold:C.ink2;g.beginPath();g.arc(x+dx,cy-(i===0?0:p*48),13,0,7);g.fill();g.restore();
    text(g,i===0?'left stick':'right stick',x,cy+s/2+40,{size:21,weight:500,color:C.ink2,align:'center',alpha:a});});
}
function bars(t,o,a){ // motor output panel, right
  const x0=W-SAFE.x-360,y0=330,h=260,bw=54,gap=36;const names=['front right','rear right','front left','rear left'];const order=[2,0,3,1];const short=['FL','FR','RL','RR'];
  g.save();g.globalAlpha=a;rrect(g,x0-30,y0-70,360,h+150,24);g.fillStyle='rgba(18,27,45,0.72)';g.fill();g.strokeStyle='rgba(154,166,184,0.2)';g.lineWidth=1.5;g.stroke();g.restore();
  text(g,'MOTOR OUTPUT',x0,y0-30,{size:18,weight:600,color:C.gold,alpha:a,track:2.5});
  order.forEach((mi,j)=>{const x=x0+j*(bw+gap)+10,v=o[mi];g.save();g.globalAlpha=a;rrect(g,x,y0,bw,h,12);g.fillStyle='rgba(154,166,184,0.10)';g.fill();
    const bh=h*v;const lg=g.createLinearGradient(0,y0+h-bh,0,y0+h);lg.addColorStop(0,'#f0d48a');lg.addColorStop(1,'#a7832b');g.fillStyle=lg;rrect(g,x,y0+h-bh,bw,bh,12);g.fill();
    g.strokeStyle='rgba(236,232,223,0.35)';g.setLineDash([3,5]);g.beginPath();g.moveTo(x-4,y0+h*0.5);g.lineTo(x+bw+4,y0+h*0.5);g.stroke();g.restore();
    text(g,short[j],x+bw/2,y0+h+38,{size:22,weight:600,color:C.ink,align:'center',alpha:a});});
}
function setCam(t){const u=ease.io(seg(t,0,10));const az=lerp(0.62,0.38,u),el=lerp(0.62,0.70,u),d=lerp(900,830,u);
  cam.position.set(Math.sin(az)*Math.cos(el)*d,Math.sin(el)*d,Math.cos(az)*Math.cos(el)*d);cam.lookAt(0,-38,0);}
window.renderFrame=(t)=>{
  beginFrame();setCam(t);const c=cmd(t),o=outs(c);
  Q.rotation.set(0,0,0);Q.rotation.z=-0.20*c.r;Q.rotation.x=-0.20*c.p;Q.rotation.y=-0.9*ease.io(seg(t,7.2,9.9))*1;Q.position.y=lerp(-25,0,ease.out(seg(t,0,1.4)));
  M.forEach((m,i)=>{const v=o[i];m.prop.rotation.z=m.dir*t*(28+30*v);m.glow.material.opacity=0.15+0.85*Math.pow(v,1.6);
    m.beam.visible=false;m.ring.material=m.ringMat;m.ringMat.emissiveIntensity=0.1+1.6*Math.pow(v,1.5);});
  R.render(S,cam);background(g,t);g.drawImage(R.domElement,0,0);
  const A=fade(t,0,99,0.6);
  title(g,'The mixer','Four motors, three commands',A,SAFE.x,SAFE.y+40);
  sticks(t,c,ease.out(seg(t,0.4,1.2)));bars(t,o,ease.out(seg(t,0.6,1.4)));
  // caption: one phase at a time, single slot
  PH.forEach(([a,b,h,s])=>{const al=fade(t,a+0.15,b+0.05,0.4);if(al<=0)return;
    text(g,h,960,H-SAFE.y-110,{size:40,weight:600,color:C.gold,align:'center',alpha:al});text(g,s,960,H-SAFE.y-62,{size:26,weight:400,color:C.ink,align:'center',alpha:al});});
  footnote(g,'Illustrative',A);
  finish(g,t);const fo=1-fade(t,0,10,0.5);if(fo>0){g.fillStyle=`rgba(0,0,0,${fo})`;g.fillRect(0,0,W,H);}
  endFrame(t);
};
document.fonts.load('600 30px Inter').then(()=>document.fonts.load('400 30px Inter')).then(()=>{window.ready=true;});
