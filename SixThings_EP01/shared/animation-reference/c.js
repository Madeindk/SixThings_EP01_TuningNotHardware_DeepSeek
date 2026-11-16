import {W,H,C,FONT,ease,seg,lerp,clamp,fade,background,finish,beginFrame,endFrame,text,rrect,footnote,title,eraTag} from './lib.js';
const g=document.getElementById('c').getContext('2d');
const CX=500,CY=620,R=225;
const PX=900,PY=390,PW=900,PH=400; // chart panel
const TA0=1.6,TA1=5.4,TB0=5.9,TB1=9.0;
const errA=s=>2*Math.sin(s*Math.PI*2*2.2);                 // first setup: steady swing, about ±2°
const errB=s=>2*Math.exp(-s*5.2)*Math.cos(s*Math.PI*2*1.6);  // with the extra term: settles
function curErr(t){if(t<TA0)return 0;if(t<TB0-0.2){const s=clamp((t-TA0)/(TA1-TA0));return t>TA1?errA(1)*(1-ease.io(seg(t,TA1,TB0-0.2))):errA(s);}
  const s=clamp((t-TB0)/(TB1-TB0));return errB(s);}
function compass(t,a){
  if(a<=0)return;g.save();g.globalAlpha=a;g.translate(CX,CY);
  // soft disc
  const d=g.createRadialGradient(0,-40,10,0,0,R+30);d.addColorStop(0,'rgba(40,56,88,0.55)');d.addColorStop(1,'rgba(14,21,36,0.9)');
  g.fillStyle=d;g.beginPath();g.arc(0,0,R+24,0,7);g.fill();
  g.strokeStyle='rgba(233,200,115,0.55)';g.lineWidth=1.5;g.beginPath();g.arc(0,0,R+24,0,7);g.stroke();
  g.strokeStyle='rgba(154,166,184,0.18)';g.beginPath();g.arc(0,0,R-46,0,7);g.stroke();
  for(let k=0;k<120;k++){const an=k/120*Math.PI*2,big=k%10===0,mid=k%5===0;const r1=R+8,r2=R+8-(big?26:mid?16:9);
    g.strokeStyle=big?'rgba(236,232,223,0.85)':'rgba(154,166,184,0.5)';g.lineWidth=big?2.5:1.2;
    g.beginPath();g.moveTo(Math.sin(an)*r1,-Math.cos(an)*r1);g.lineTo(Math.sin(an)*r2,-Math.cos(an)*r2);g.stroke();}
  // set-course marker
  g.fillStyle=C.gold;g.beginPath();g.moveTo(0,-R-30);g.lineTo(-11,-R-50);g.lineTo(11,-R-50);g.fill();
  // needle: error shown 8x so it is visible
  const e=curErr(t),an=e*8*Math.PI/180;g.rotate(an);
  g.shadowColor='rgba(233,200,115,0.5)';g.shadowBlur=24;
  const ng=g.createLinearGradient(0,-R+96,0,R-100);ng.addColorStop(0,'#f3dc95');ng.addColorStop(0.5,'#b8912f');ng.addColorStop(0.5,'#3a4a66');ng.addColorStop(1,'#26324a');
  g.fillStyle=ng;g.beginPath();g.moveTo(0,-R+96);g.lineTo(13,0);g.lineTo(0,R-100);g.lineTo(-13,0);g.closePath();g.fill();g.shadowBlur=0;
  g.fillStyle='#0f1727';g.beginPath();g.arc(0,0,11,0,7);g.fill();g.strokeStyle=C.gold;g.lineWidth=2;g.stroke();
  g.restore();
  for(const [s,an] of [['N',0],['E',90],['S',180],['W',270]]){const r=R-62,x=CX+Math.sin(an*Math.PI/180)*r,y=CY-Math.cos(an*Math.PI/180)*r;
    text(g,s,x,y,{size:24,weight:600,color:s==='N'?C.gold:C.ink2,align:'center',base:'middle',alpha:a});}
  text(g,'set course',CX,CY-R-68,{size:22,weight:500,color:C.gold,align:'center',alpha:a});
}
function chart(t,a){
  if(a<=0)return;g.save();g.globalAlpha=a;
  rrect(g,PX,PY,PW,PH,24);g.fillStyle='rgba(18,27,45,0.72)';g.fill();g.strokeStyle='rgba(154,166,184,0.2)';g.lineWidth=1.5;g.stroke();
  const x0=PX+110,x1=PX+PW-40,ym=PY+PH/2,sc=(PH/2-50)/2.5; // px per degree
  g.strokeStyle='rgba(154,166,184,0.16)';g.lineWidth=1;
  for(const v of [2,-2]){g.setLineDash([4,8]);g.beginPath();g.moveTo(x0,ym-v*sc);g.lineTo(x1,ym-v*sc);g.stroke();}
  g.setLineDash([]);g.strokeStyle='rgba(233,200,115,0.5)';g.lineWidth=1.5;g.beginPath();g.moveTo(x0,ym);g.lineTo(x1,ym);g.stroke();
  g.restore();
  for(const [s,v] of [['+2°',2],['0°',0],['−2°',-2]])text(g,s,x0-22,ym-v*sc,{size:21,weight:500,color:v?C.ink2:C.gold,align:'right',base:'middle',alpha:a});
  text(g,'time',x1,PY+PH-22,{size:20,weight:400,color:C.ink3,align:'right',alpha:a});
  const draw=(f,u,col,w,glow,alpha)=>{if(u<=0)return;g.save();g.globalAlpha=alpha;g.strokeStyle=col;g.lineWidth=w;g.lineJoin='round';g.lineCap='round';
    if(glow){g.shadowColor=col;g.shadowBlur=18;}g.beginPath();const n=400;for(let k=0;k<=n*u;k++){const s=k/n;const x=lerp(x0,x1,s),y=ym-f(s)*sc;k?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
    const s=u,xx=lerp(x0,x1,s),yy=ym-f(s)*sc;if(u<1){g.fillStyle=col;g.beginPath();g.arc(xx,yy,7,0,7);g.fill();}g.restore();};
  const ua=ease.io(seg(t,TA0,TA1)),ub=seg(t,TB0,TB1);
  draw(errA,ua,'rgba(99,199,217,1)',3,false,a*(t>TB0?lerp(1,0.35,seg(t,TB0-0.3,TB0+0.5)):1));
  draw(errB,ease.out(ub)>0?ub:0,C.gold,4,true,a);
  // labels in reserved slots: A above the panel (left), B below the panel (right)
  const la=ease.out(seg(t,TA0+0.6,TA0+1.2))*a,lb=ease.out(seg(t,TB0+0.8,TB0+1.4))*a;
  g.save();g.globalAlpha=la;g.fillStyle=C.cyan;g.beginPath();g.arc(PX+14,PY-34,6,0,7);g.fill();g.restore();
  text(g,'first setup: about ±2°',PX+30,PY-34,{size:26,weight:600,color:C.ink,base:'middle',alpha:la});
  g.save();g.globalAlpha=lb;g.fillStyle=C.gold;g.beginPath();g.arc(PX+14,PY+PH+40,6,0,7);g.fill();g.restore();
  text(g,'with the extra term: much calmer',PX+30,PY+PH+40,{size:26,weight:600,color:C.ink,base:'middle',alpha:lb});
}
window.renderFrame=(t)=>{
  beginFrame();background(g,t);const A=fade(t,0,99,0.6);
  eraTag(g,'1922–23',A);
  title(g,"The helmsman's idea",'Steering by the error',A,96,214);
  compass(t,ease.out(seg(t,0.3,1.2)));chart(t,ease.out(seg(t,0.7,1.6)));
  footnote(g,'1923 sea trials · simplified · swing exaggerated on the compass',A);
  finish(g,t);const fo=1-fade(t,0,10.0,0.5);if(fo>0){g.fillStyle=`rgba(0,0,0,${fo})`;g.fillRect(0,0,W,H);}
  endFrame(t);
};
document.fonts.load(`600 30px Inter`).then(()=>document.fonts.load(`400 30px Inter`)).then(()=>{window.ready=true;});
