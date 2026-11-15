// Inside the Log · v3 motion-graphics system (shared by every shot)
export const W=1920,H=1080, SAFE={x:96,y:60};
export const C={
  bg0:'#0b111d', bg1:'#131d31', ink:'#ECE8DF', ink2:'#9AA6B8', ink3:'#5d6b80',
  gold:'#e9c873', gold2:'#b8912f', cyan:'#63c7d9', red:'#e5735f', line:'rgba(154,166,184,0.28)', panel:'rgba(18,27,45,0.78)'
};
export const FONT='Inter';
export const ease={
  io:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,         // cubic in-out
  out:t=>1-Math.pow(1-t,3), in:t=>t*t*t,
  expo:t=>t===1?1:1-Math.pow(2,-10*t),
  back:t=>{const c1=1.3,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)}
};
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const seg=(t,a,b)=>clamp((t-a)/(b-a));
export const lerp=(a,b,u)=>a+(b-a)*u;
export function fade(t,a,b,dur=0.5){return ease.io(seg(t,a,a+dur))*(1-ease.io(seg(t,b-dur,b)));}
// ---- background: deep navy radial gradient + vignette + fine animated grain
let grainTex=null;
function makeGrain(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');const d=g.createImageData(256,256);
  let s=12345;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let i=0;i<d.data.length;i+=4){const v=r()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}g.putImageData(d,0,0);return c;}
export function background(g,t){
  const r=g.createRadialGradient(W*0.5,H*0.42,80,W*0.5,H*0.5,W*0.75);
  r.addColorStop(0,C.bg1);r.addColorStop(1,C.bg0);g.fillStyle=r;g.fillRect(0,0,W,H);
}
export function finish(g,t){
  const v=g.createRadialGradient(W/2,H/2,H*0.45,W/2,H/2,W*0.72);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,0.45)');
  g.fillStyle=v;g.fillRect(0,0,W,H);
  if(!grainTex)grainTex=makeGrain();
  g.save();g.globalAlpha=0.035;g.globalCompositeOperation='overlay';const ox=Math.floor(t*997)%256,oy=Math.floor(t*613)%256;
  for(let x=-ox;x<W;x+=256)for(let y=-oy;y<H;y+=256)g.drawImage(grainTex,x,y);g.restore();
}
// ---- text layout registry: every text box is recorded; overlaps and safe-margin breaches are reported
let boxes=[];window.__issues=window.__issues||[];
export function beginFrame(){boxes=[];}
export const PARAMS=(()=>{try{return JSON.parse(new URLSearchParams(location.search).get('p')||'{}')}catch(e){return {}}})();
export function endFrame(t){
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];
    if(a.a<0.05||b.a<0.05)continue;
    if(a.x<b.x+b.w+6&&b.x<a.x+a.w+6&&a.y<b.y+b.h+6&&b.y<a.y+a.h+6)window.__issues.push(`t=${t.toFixed(2)} overlap "${a.s}" / "${b.s}"`);}
  const gA=(window.__gA===undefined?1:window.__gA);window.__lastBoxes=boxes.filter(a=>a.a*gA>=0.05).map(a=>[Math.round(a.x),Math.round(a.y),Math.round(a.w),Math.round(a.h),+(a.a*gA).toFixed(2),a.s]);
  for(const a of boxes){if(a.a<0.05||a.free)continue;if(a.x<SAFE.x-1||a.y<SAFE.y-1||a.x+a.w>W-SAFE.x+1||a.y+a.h>H-SAFE.y+1)window.__issues.push(`t=${t.toFixed(2)} outside safe area "${a.s}"`);}
}
export function reg(x,y,w,h,s,a,free=false){boxes.push({x,y,w,h,s,a,free});}
export function text(g,s,x,y,{size=30,weight=500,color=C.ink,align='left',base='alphabetic',alpha=1,track=0,reg:doReg=true,free=false}={}){
  if(alpha<=0.001)return null;
  g.save();g.globalAlpha=alpha;g.font=`${weight} ${size}px ${FONT}`;g.fillStyle=color;g.textAlign=align;g.textBaseline=base;
  if(track)g.letterSpacing=track+'px';
  const m=g.measureText(s);const w=m.width;g.fillText(s,x,y);g.restore();
  const x0=align==='center'?x-w/2:align==='right'?x-w:x;const asc=size*0.76,desc=size*0.24;
  const y0=base==='middle'?y-size*0.5:base==='top'?y:y-asc;
  if(doReg)reg(x0,y0,w,asc+desc,s,alpha,free);
  return {x:x0,y:y0,w,h:asc+desc};
}
export function rrect(g,x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r);}
// era tag: top-left, small caps label in a hairline gold capsule
export function eraTag(g,s,alpha){
  if(alpha<=0)return;g.save();g.globalAlpha=alpha;g.font=`600 22px ${FONT}`;g.letterSpacing='2.5px';
  const w=g.measureText(s.toUpperCase()).width+44;const x=SAFE.x,y=SAFE.y;
  rrect(g,x,y,w,44,22);g.fillStyle='rgba(11,17,29,0.72)';g.fill();g.lineWidth=1.5;g.strokeStyle='rgba(233,200,115,0.75)';g.stroke();
  g.beginPath();g.arc(x+20,y+22,4,0,7);g.fillStyle=C.gold;g.fill();
  g.restore();text(g,s.toUpperCase(),x+32,y+22,{size:22,weight:600,color:C.gold,base:'middle',alpha,track:2.5});
}
// footnote, bottom-left ("illustrative, not to scale" etc.)
export function footnote(g,s,alpha){text(g,s,SAFE.x,H-SAFE.y-6,{size:22,weight:400,color:C.ink2,alpha,base:'alphabetic'});}
// title block: small overline + headline, top centre-left under the era tag
export function title(g,over,head,alpha,x=SAFE.x,y=SAFE.y+110){
  text(g,over.toUpperCase(),x,y,{size:20,weight:600,color:C.gold,alpha,track:3});
  text(g,head,x,y+52,{size:46,weight:600,color:C.ink,alpha});
}
// callout: anchor dot + elbow leader + label card (label position chosen from fixed slots, so cards never collide)
export function callout(g,ax,ay,lx,ly,label,sub,alpha,side='right',grow=1){
  if(alpha<=0)return;g.save();g.globalAlpha=alpha;
  const ex=side==='right'?lx-18:lx+18;
  const pts=[[ax,ay],[lerp(ax,ex,0.5),ly],[ex,ly]];
  // leader drawn progressively
  g.strokeStyle='rgba(233,200,115,0.85)';g.lineWidth=2;g.beginPath();g.moveTo(ax,ay);
  const L1=Math.hypot(pts[1][0]-ax,pts[1][1]-ay),L2=Math.abs(ex-pts[1][0]),Ltot=L1+L2,cut=Ltot*grow;
  if(cut<=L1){const u=cut/L1;g.lineTo(lerp(ax,pts[1][0],u),lerp(ay,pts[1][1],u));}
  else{g.lineTo(pts[1][0],pts[1][1]);g.lineTo(lerp(pts[1][0],ex,(cut-L1)/L2),ly);}g.stroke();
  g.beginPath();g.arc(ax,ay,7,0,7);g.fillStyle=C.gold;g.fill();
  g.beginPath();g.arc(ax,ay,14+4*Math.sin(performance.now?0:0),0,7);g.strokeStyle='rgba(233,200,115,0.35)';g.lineWidth=2;g.stroke();
  g.restore();
  const a2=alpha*ease.out(seg(grow,0.75,1));
  const align=side==='right'?'left':'right';
  text(g,label,lx,ly-6,{size:30,weight:600,color:C.ink,alpha:a2,align});
  if(sub)text(g,sub,lx,ly+30,{size:22,weight:400,color:C.ink2,alpha:a2,align});
}
