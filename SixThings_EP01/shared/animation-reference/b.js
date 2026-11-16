import {W,H,C,FONT,ease,seg,lerp,clamp,fade,background,finish,beginFrame,endFrame,text,rrect,footnote,title,eraTag,reg} from './lib.js';
const g=document.getElementById('c').getContext('2d');
const N=[{k:'Gyro',s:'feels rotation'},{k:'Filter',s:'cleans the signal'},{k:'PID',s:'decides'},{k:'Mixer',s:'splits it four ways'},{k:'Motors',s:'push'}];
const X0=300,DX=330,CY=560,CW=250,CH=230;
const T_IN=0.6, T_RUN=2.6, STEP=1.05;  // pulse reaches node i at T_RUN+i*STEP
function icon(i,x,y,act,t){
  g.save();g.translate(x,y);g.lineCap='round';g.lineJoin='round';
  const col=act>0.01?`rgba(233,200,115,${0.45+0.55*act})`:'rgba(154,166,184,0.55)';g.strokeStyle=col;g.lineWidth=3;
  if(i===0){for(let k=0;k<3;k++){g.save();g.rotate(k*Math.PI/3+t*0.6*(0.3+act));g.beginPath();g.ellipse(0,0,46,16,0,0,7);g.stroke();g.restore();}
    g.beginPath();g.arc(0,0,6,0,7);g.fillStyle=col;g.fill();}
  if(i===1){g.beginPath();for(let k=0;k<=60;k++){const u=k/60,xx=-56+112*u;const sm=act;const yy=(1-sm)*(Math.sin(u*40+t*9)*7+Math.sin(u*93)*5)+Math.sin(u*6.28)*14;k?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.stroke();}
  if(i===2){const hs=[0.9,0.55,0.75];for(let k=0;k<3;k++){const h=46*(0.35+0.65*hs[k]*(0.6+0.4*Math.sin(t*3+k*2)*act));
      g.beginPath();g.roundRect(-40+k*30,26-h,18,h,5);g.fillStyle=col;g.fill();}}
  if(i===3){g.beginPath();g.moveTo(-34,-34);g.lineTo(34,34);g.moveTo(34,-34);g.lineTo(-34,34);g.stroke();
    for(const [a,b] of [[-34,-34],[34,-34],[-34,34],[34,34]]){g.beginPath();g.arc(a,b,10,0,7);g.fillStyle='#0f1727';g.fill();g.stroke();}}
  if(i===4){g.beginPath();g.arc(0,0,40,0,7);g.globalAlpha=0.6;g.stroke();g.globalAlpha=1;const r=t*(4+18*act);
    for(let k=0;k<2;k++){g.save();g.rotate(r+k*Math.PI);g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(14,-20,0,-38);g.stroke();g.restore();}
    g.beginPath();g.arc(0,0,7,0,7);g.fillStyle=col;g.fill();}
  g.restore();
}
function card(i,t){
  const x=X0+i*DX,a=ease.out(seg(t,T_IN+i*0.12,T_IN+i*0.12+0.7));if(a<=0)return;
  const y=CY+(1-a)*30;
  const hit=T_RUN+i*STEP; let act=ease.out(seg(t,hit-0.15,hit+0.25))*(1-0.55*seg(t,hit+0.6,hit+1.4));
  if(i===0){const h2=T_RUN+4*STEP+1.55;act=Math.max(act,ease.out(seg(t,h2-0.1,h2+0.3)));}
  g.save();g.globalAlpha=a;
  g.shadowColor=`rgba(233,200,115,${0.35*act})`;g.shadowBlur=40*act;
  rrect(g,x-CW/2,y-CH/2,CW,CH,24);const gr=g.createLinearGradient(0,y-CH/2,0,y+CH/2);gr.addColorStop(0,'rgba(30,43,68,0.95)');gr.addColorStop(1,'rgba(16,24,40,0.95)');
  g.fillStyle=gr;g.fill();g.shadowBlur=0;
  g.lineWidth=1.5+1*act;g.strokeStyle=act>0.02?`rgba(233,200,115,${0.35+0.6*act})`:'rgba(154,166,184,0.25)';g.stroke();
  g.restore();
  icon(i,x,y-38,act,t);
  text(g,N[i].k,x,y+52,{size:32,weight:600,color:act>0.3?C.gold:C.ink,align:'center',alpha:a});
  text(g,N[i].s,x,y+86,{size:21,weight:400,color:C.ink2,align:'center',alpha:a});
}
function connectors(t){
  for(let i=0;i<4;i++){const x1=X0+i*DX+CW/2+10,x2=X0+(i+1)*DX-CW/2-10;const u=ease.io(seg(t,1.3+i*0.12,1.9+i*0.12));if(u<=0)continue;
    g.strokeStyle='rgba(154,166,184,0.35)';g.lineWidth=2;g.beginPath();g.moveTo(x1,CY);g.lineTo(lerp(x1,x2,u),CY);g.stroke();
    if(u>0.98){g.beginPath();g.moveTo(x2-9,CY-6);g.lineTo(x2,CY);g.lineTo(x2-9,CY+6);g.stroke();}}
}
function pulse(t){ // a bright packet travelling node to node
  const u=(t-T_RUN)/STEP; if(u<-0.2||u>4.3)return;
  const i=Math.floor(clamp(u,0,3.999)),f=clamp(u-i);if(u>=4)return;
  const x1=X0+i*DX+CW/2+10,x2=X0+(i+1)*DX-CW/2-10;const x=lerp(x1,x2,ease.io(f));
  const r=g.createRadialGradient(x,CY,0,x,CY,26);r.addColorStop(0,'rgba(255,236,180,1)');r.addColorStop(0.3,'rgba(233,200,115,0.7)');r.addColorStop(1,'rgba(233,200,115,0)');
  g.fillStyle=r;g.beginPath();g.arc(x,CY,26,0,7);g.fill();
  // trail
  const tr=g.createLinearGradient(x-90,0,x,0);tr.addColorStop(0,'rgba(233,200,115,0)');tr.addColorStop(1,'rgba(233,200,115,0.8)');
  g.strokeStyle=tr;g.lineWidth=3;g.beginPath();g.moveTo(Math.max(x1,x-90),CY);g.lineTo(x,CY);g.stroke();
}
function feedback(t){ // return arc: the quad moves, the gyro feels it
  const u=ease.io(seg(t,T_RUN+4*STEP+0.3,T_RUN+4*STEP+1.6));if(u<=0)return;
  const xa=X0+4*DX,xb=X0,top=CY-CH/2-24,peak=CY-CH/2-120;
  g.save();g.strokeStyle='rgba(99,199,217,0.75)';g.lineWidth=2.5;g.setLineDash([2,10]);g.lineDashOffset=-t*30;g.beginPath();
  const n=80;for(let k=0;k<=n*u;k++){const s=k/n;const xx=lerp(xa,xb,s);const yy=top-(peak-top)*-1*Math.sin(Math.PI*s)*1;k?g.lineTo(xx,top-(top-peak)*Math.sin(Math.PI*s)):g.moveTo(xx,top);}
  g.stroke();g.restore();
  if(u>0.97){g.save();g.fillStyle=C.cyan;g.beginPath();g.moveTo(xb,top+4);g.lineTo(xb-9,top-12);g.lineTo(xb+9,top-12);g.fill();g.restore();}
  text(g,'the quad moves, and the gyro feels it',960,CY-CH/2-132,{size:24,weight:500,color:C.cyan,align:'center',alpha:ease.out(seg(t,T_RUN+4*STEP+1.0,T_RUN+4*STEP+1.6))});
}
// 0–125 µs strip, not to scale
const SEGS=['Feel','Filter','Decide','Mix','Message','Other jobs'];
function strip(t){
  const a=ease.out(seg(t,1.6,2.3));if(a<=0)return;const x0=X0-CW/2,x1=X0+4*DX+CW/2,y=820,h=14,w=(x1-x0);
  g.save();g.globalAlpha=a;rrect(g,x0,y,w,h,7);g.fillStyle='rgba(154,166,184,0.14)';g.fill();
  const sw=w/SEGS.length;
  for(let k=0;k<SEGS.length;k++){
    const done=k<5?seg(t,T_RUN+k*STEP-0.3,T_RUN+k*STEP+0.5):seg(t,T_RUN+4*STEP+0.6,T_RUN+4*STEP+1.4);
    if(done<=0)continue;g.fillStyle=k<5?`rgba(233,200,115,${0.55+0.08*k})`:'rgba(154,166,184,0.5)';
    rrect(g,x0+k*sw+2,y,(sw-4)*ease.io(done),h,7);g.fill();
  }
  g.restore();
  for(let k=0;k<SEGS.length;k++){const done=k<5?seg(t,T_RUN+k*STEP-0.3,T_RUN+k*STEP+0.5):seg(t,T_RUN+4*STEP+0.6,T_RUN+4*STEP+1.4);
    text(g,SEGS[k],x0+k*sw+sw/2,y+52,{size:22,weight:500,color:k<5?C.ink:C.ink2,align:'center',alpha:a*(0.35+0.65*ease.out(done))});}
  text(g,'0 µs',x0,y-18,{size:20,weight:500,color:C.ink3,alpha:a});
  text(g,'125 µs',x1,y-18,{size:20,weight:500,color:C.ink3,align:'right',alpha:a});
  // playhead
  let prog=0;for(let k=0;k<SEGS.length;k++){prog+=k<5?seg(t,T_RUN+k*STEP-0.3,T_RUN+k*STEP+0.5):seg(t,T_RUN+4*STEP+0.6,T_RUN+4*STEP+1.4);}
  const ph=prog/SEGS.length;if(t>T_RUN-0.3){const px=lerp(x0,x1,ph);g.fillStyle=C.gold;g.beginPath();g.arc(px,y+h/2,9,0,7);g.fill();
    g.strokeStyle='rgba(233,200,115,0.35)';g.lineWidth=2;g.beginPath();g.arc(px,y+h/2,16,0,7);g.stroke();}
}
window.renderFrame=(t)=>{
  beginFrame();background(g,t);
  const A=fade(t,0.0,99,0.6);
  title(g,'One loop','From feeling to pushing',A);
  connectors(t);for(let i=0;i<5;i++)card(i,t);pulse(t);feedback(t);strip(t);
  text(g,'then again, up to 8,000 times every second',960,935,{size:26,weight:500,color:C.ink,align:'center',alpha:ease.out(seg(t,T_RUN+4*STEP+1.8,T_RUN+4*STEP+2.4))});
  footnote(g,'Illustrative, not to scale',A);
  // global fade in/out
  finish(g,t);const fo=1-fade(t,0,10.0,0.5);if(fo>0){g.fillStyle=`rgba(0,0,0,${fo})`;g.fillRect(0,0,W,H);}
  endFrame(t);
};
document.fonts.load(`600 30px Inter`).then(()=>document.fonts.load(`400 30px Inter`)).then(()=>{window.ready=true;});
