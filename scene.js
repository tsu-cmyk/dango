'use strict';
/* =====================================================================
   ひと夏の番長 — terrain & object art (top-down, printed-summer look)
   ===================================================================== */
const PAT={};
const GROUND={soil:'#d9b882',grass:'#b5c97a',sand:'#e2cf9e',flower:'#c3d48a',rot:'#8f7a52',bark:'#8d6a48',sapbark:'#5e4430'};
const BGFILL={soil:'#c9a66e',grass:'#97ad62',sand:'#cdb886',flower:'#a9bd6e',rot:'#6f5c3a',bark:'#6e5038',sapbark:'#3e2c1e'};
function makePatterns(){
  if(!HAS_DOM)return;
  const R=seeded(99);const rr=(a,b)=>a+R()*(b-a);
  const mk=(base,fn)=>{const c=document.createElement('canvas');c.width=c.height=200;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,200,200);fn(g);return ctx.createPattern(c,'repeat');};
  const speck=(g,n,cols,s)=>{for(let i=0;i<n;i++){g.fillStyle=cols[i%cols.length];g.beginPath();g.arc(R()*200,R()*200,rr(0.3,s),0,TAU);g.fill();}};
  PAT.soil=mk(GROUND.soil,g=>{speck(g,700,['rgba(120,80,40,.18)','rgba(255,240,200,.25)','rgba(90,60,30,.12)'],1.7);});
  PAT.grass=mk(GROUND.grass,g=>{for(let i=0;i<260;i++){const x=R()*200,y=R()*200;g.strokeStyle=R()<0.5?'rgba(70,100,30,.28)':'rgba(240,250,190,.35)';g.lineWidth=1.4;g.beginPath();g.moveTo(x,y);g.lineTo(x+rr(-4,4),y-rr(6,14));g.stroke();}});
  PAT.sand=mk(GROUND.sand,g=>{speck(g,900,['rgba(140,110,70,.2)','rgba(255,250,230,.4)','rgba(110,100,90,.15)'],1.4);});
  PAT.flower=mk(GROUND.flower,g=>{for(let i=0;i<200;i++){const x=R()*200,y=R()*200;g.strokeStyle=R()<0.5?'rgba(70,100,30,.25)':'rgba(250,250,200,.35)';g.lineWidth=1.3;g.beginPath();g.moveTo(x,y);g.lineTo(x+rr(-4,4),y-rr(5,11));g.stroke();}
    speck(g,60,['rgba(255,255,255,.55)','rgba(250,200,220,.5)','rgba(255,230,120,.5)'],1.8);});
  PAT.rot=mk(GROUND.rot,g=>{speck(g,600,['rgba(40,30,15,.22)','rgba(200,180,130,.18)'],1.8);for(let i=0;i<30;i++){g.strokeStyle='rgba(60,45,25,.3)';g.lineWidth=rr(1,2.5);const x=R()*200,y=R()*200;g.beginPath();g.moveTo(x,y);g.lineTo(x+rr(-12,12),y+rr(-5,5));g.stroke();}});
  const barkFn=(dark,acc)=>g=>{for(let x=0;x<200;x+=10){g.strokeStyle=dark;g.lineWidth=rr(1.5,3.5);g.beginPath();g.moveTo(x,0);for(let y=20;y<=200;y+=20)g.lineTo(x+rr(-3,3),y);g.lineTo(x,200);g.stroke();}
    for(let i=0;i<150;i++){g.fillStyle=acc;g.fillRect(R()*200,R()*200,2,rr(3,9));}};
  PAT.bark=mk(GROUND.bark,barkFn('rgba(42,25,12,.35)','rgba(230,200,150,.16)'));
  PAT.sapbark=mk(GROUND.sapbark,barkFn('rgba(20,10,4,.42)','rgba(240,170,60,.12)'));
}

/* ---------- seeded shape helpers ---------- */
function blobPts(seed,n,irreg){const R=seeded(seed),p=[];for(let i=0;i<n;i++){const a=i/n*TAU+(R()-0.5)*0.4,d=1-irreg*0.5+R()*irreg;p.push([Math.cos(a)*d,Math.sin(a)*d]);}return p;}
function smoothPath(pts,sx,sy,ox,oy){
  const n=pts.length,P=i=>pts[(i+n)%n];
  ctx.beginPath();const m0=[(P(0)[0]+P(1)[0])/2,(P(0)[1]+P(1)[1])/2];ctx.moveTo(ox+m0[0]*sx,oy+m0[1]*sy);
  for(let i=1;i<=n;i++){const a=P(i),b=P(i+1);ctx.quadraticCurveTo(ox+a[0]*sx,oy+a[1]*sy,ox+(a[0]+b[0])/2*sx,oy+(a[1]+b[1])/2*sy);}
  ctx.closePath();
}

/* ---------- obstacles ---------- */
const ROCKCOL={soil:['#a39a8a','#8f8676'],grass:['#a8a596','#918e7f'],sand:['#b5aea0','#9d9586'],flower:['#aca898','#959181'],rot:['#7f7a6a','#6b6658'],bark:['#7a6048','#664e38'],sapbark:['#5a4230','#4a3424']};
function drawRock(o,bg){
  const c=ROCKCOL[bg]||ROCKCOL.soil,r=o.r;
  if(!o.pts)o.pts=blobPts(o.seed,9,0.35);
  ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.a||0);
  ctx.fillStyle='rgba(42,33,24,.25)';smoothPath(o.pts,r*1.02,r*0.96,r*0.12,r*0.16);ctx.fill();
  ctx.fillStyle=c[1];smoothPath(o.pts,r,r,1.4,1.6);ctx.fill();
  smoothPath(o.pts,r,r,0,0);ctx.lineWidth=2.4;ctx.strokeStyle=INK;ctx.stroke();
  ctx.save();smoothPath(o.pts,r,r,0,0);ctx.clip();
  ctx.fillStyle=c[0];smoothPath(o.pts,r*0.78,r*0.72,-r*0.14,-r*0.18);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.25)';smoothPath(o.pts,r*0.38,r*0.26,-r*0.3,-r*0.42);ctx.fill();
  const R=seeded(o.seed+7);
  ctx.strokeStyle='rgba(42,33,24,.45)';ctx.lineWidth=1.3;ctx.lineCap='round';
  for(let k=0;k<2;k++){let x=(R()-0.5)*r*0.8,y=(R()-0.5)*r*0.8;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<3;j++){x+=(R()-0.5)*r*0.5;y+=(R()-0.3)*r*0.4;ctx.lineTo(x,y);}ctx.stroke();}
  if(o.moss){ctx.fillStyle='rgba(95,125,58,.75)';for(let k=0;k<5;k++)dot(r*(0.1+R()*0.6)*(R()<0.5?-1:1),r*(0.2+R()*0.5),r*(0.12+R()*0.12),'rgba(95,125,58,.7)');}
  ctx.restore();ctx.restore();
}
function drawGrassClump(o){
  const r=o.r,R=seeded(o.seed);
  ctx.save();ctx.translate(o.x,o.y);
  ctx.fillStyle='rgba(42,50,20,.28)';ctx.beginPath();ctx.ellipse(r*0.12,r*0.16,r*0.95,r*0.9,0,0,TAU);ctx.fill();
  ctx.fillStyle='#4f6e2a';ctx.beginPath();ctx.arc(0,0,r*0.62,0,TAU);ctx.fill();
  const sway=Math.sin(ART_T*1.3+o.seed)*0.05;
  const cols=['#5c7a2e','#6f8f3a','#86a845','#9cb758','#4f6e2a'];
  for(let i=0;i<26;i++){const a=R()*TAU,L=r*(0.7+R()*0.55),w=r*(0.1+R()*0.07);
    ctx.save();ctx.rotate(a+sway);
    ctx.beginPath();ctx.moveTo(0,-w);ctx.quadraticCurveTo(L*0.6,-w*1.2,L,0);ctx.quadraticCurveTo(L*0.6,w*1.2,0,w);ctx.closePath();
    ctx.fillStyle=cols[i%cols.length];ctx.fill();ctx.strokeStyle='rgba(42,33,24,.7)';ctx.lineWidth=1.2;ctx.stroke();
    ctx.strokeStyle='rgba(255,255,220,.3)';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(L*0.15,0);ctx.lineTo(L*0.85,0);ctx.stroke();
    ctx.restore();}
  if(o.seed%3===0){for(let k=0;k<3;k++){const a=R()*TAU,d=r*0.5;dot(Math.cos(a)*d,Math.sin(a)*d,r*0.07,'#f4ead2');}}
  ctx.restore();
}
const FLOWER_KIND=[{p:'#f2c43a',c:'#7a4a1e',n:14,pr:0.55,cr:0.42},{p:'#f4a6c4',c:'#f2c43a',n:8,pr:0.6,cr:0.22},{p:'#f6f2e6',c:'#f2c43a',n:12,pr:0.6,cr:0.25},{p:'#7a9ae0',c:'#f6f2e6',n:5,pr:0.75,cr:0.18,trumpet:1},{p:'#e8603a',c:'#4a2a1e',n:6,pr:0.65,cr:0.2}];
function drawFlower(o){
  const r=o.r,F=FLOWER_KIND[o.v%FLOWER_KIND.length],R=seeded(o.seed);
  ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.a||0);
  ctx.fillStyle='rgba(42,50,20,.25)';ctx.beginPath();ctx.ellipse(r*0.15,r*0.2,r*1.05,r*1.0,0,0,TAU);ctx.fill();
  for(let i=0;i<4;i++){const a=i/4*TAU+0.4;ctx.save();ctx.rotate(a);inked(()=>{ctx.beginPath();ctx.moveTo(r*0.2,0);ctx.quadraticCurveTo(r*0.7,-r*0.35,r*1.15,0);ctx.quadraticCurveTo(r*0.7,r*0.35,r*0.2,0);ctx.closePath();},'#6f8f3a',1.4);
    ctx.strokeStyle='rgba(42,33,24,.4)';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(r*0.25,0);ctx.lineTo(r*1.05,0);ctx.stroke();ctx.restore();}
  if(F.trumpet){inked(ellP(0,0,r*0.8,r*0.8),F.p,2);ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5;for(let i=0;i<5;i++){const a=i/5*TAU;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*0.2,Math.sin(a)*r*0.2);ctx.lineTo(Math.cos(a)*r*0.75,Math.sin(a)*r*0.75);ctx.stroke();}
    const g=ctx.createRadialGradient(0,0,0,0,0,r*0.35);g.addColorStop(0,'#fffbe8');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*0.35,0,TAU);ctx.fill();}
  else{for(let i=0;i<F.n;i++){const a=i/F.n*TAU;ctx.save();ctx.rotate(a);inked(()=>{ctx.beginPath();ctx.ellipse(r*(F.cr+F.pr*0.5),0,r*F.pr*0.55,r*Math.min(0.24,2.6/F.n),0,0,TAU);},F.p,1.3);ctx.restore();}
    inked(ellP(0,0,r*F.cr,r*F.cr),F.c,1.6);ctx.fillStyle='rgba(0,0,0,.25)';for(let i=0;i<10;i++){const a=R()*TAU,d=R()*r*F.cr*0.8;dot(Math.cos(a)*d,Math.sin(a)*d,r*0.03,'rgba(0,0,0,.25)');}}
  ctx.restore();
}
function drawStump(o){
  const r=o.r;ctx.save();ctx.translate(o.x,o.y);
  ctx.fillStyle='rgba(30,20,10,.3)';ctx.beginPath();ctx.ellipse(r*0.12,r*0.16,r*1.05,r*1.0,0,0,TAU);ctx.fill();
  if(!o.pts)o.pts=blobPts(o.seed,14,0.12);
  ctx.fillStyle='#5a4028';smoothPath(o.pts,r,r,1.4,1.6);ctx.fill();smoothPath(o.pts,r,r,0,0);ctx.strokeStyle=INK;ctx.lineWidth=2.4;ctx.stroke();
  ctx.fillStyle='#c9a56c';smoothPath(o.pts,r*0.82,r*0.82,0,0);ctx.fill();ctx.strokeStyle='rgba(42,33,24,.6)';ctx.lineWidth=1.4;ctx.stroke();
  ctx.strokeStyle='rgba(120,80,40,.55)';ctx.lineWidth=1.2;for(let k=1;k<5;k++){smoothPath(o.pts,r*0.82*(1-k*0.18),r*0.82*(1-k*0.18),r*0.03*k,r*0.02*k);ctx.stroke();}
  const R=seeded(o.seed+3);ctx.strokeStyle='rgba(42,33,24,.5)';ctx.lineWidth=1.3;for(let k=0;k<2;k++){const a=R()*TAU;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*0.15,Math.sin(a)*r*0.15);ctx.lineTo(Math.cos(a)*r*0.8,Math.sin(a)*r*0.8);ctx.stroke();}
  ctx.fillStyle='rgba(95,125,58,.8)';for(let k=0;k<6;k++){const a=R()*TAU;dot(Math.cos(a)*r*0.92,Math.sin(a)*r*0.92,r*(0.1+R()*0.08),'rgba(95,125,58,.8)');}
  if(o.seed%2){for(let k=0;k<3;k++){const a=1+k*0.35;const x=Math.cos(a)*r*1.0,y=Math.sin(a)*r*1.0;inked(ellP(x,y,r*0.16,r*0.12,a),'#e8c48a',1.2);}}
  ctx.restore();
}
function drawKnot(o,bg){
  const r=o.r,dark=bg==='sapbark';ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.a||0);
  ctx.fillStyle='rgba(20,10,4,.35)';ctx.beginPath();ctx.ellipse(r*0.14,r*0.18,r*1.05,r*0.82,0,0,TAU);ctx.fill();
  inked(ellP(0,0,r,r*0.78),dark?'#4a3424':'#6e5038',2.4);
  ctx.strokeStyle=dark?'rgba(10,5,2,.6)':'rgba(42,25,12,.55)';ctx.lineWidth=1.6;for(let k=1;k<4;k++){ctx.beginPath();ctx.ellipse(0,0,r*(1-k*0.22),r*0.78*(1-k*0.22),0,0,TAU);ctx.stroke();}
  inked(ellP(0,0,r*0.22,r*0.16),dark?'#1e140c':'#2e1e10',1.4);
  ctx.fillStyle='rgba(255,230,180,.18)';ctx.beginPath();ctx.ellipse(-r*0.3,-r*0.35,r*0.4,r*0.12,-0.3,0,TAU);ctx.fill();
  if(!dark&&o.seed%2===0){ctx.fillStyle='rgba(160,180,120,.7)';for(let k=0;k<4;k++)dot(r*0.6*Math.cos(k*1.7),r*0.5*Math.sin(k*1.7),r*0.12,'rgba(170,190,140,.7)');}
  ctx.restore();
}
/* fallen log / branch: capsule from (x1,y1) to (x2,y2) */
function drawLog(o,bg){
  const dx=o.x2-o.x1,dy=o.y2-o.y1,L=Math.hypot(dx,dy),a=Math.atan2(dy,dx),r=o.r,branch=bg==='bark'||bg==='sapbark';
  ctx.save();ctx.translate(o.x1,o.y1);ctx.rotate(a);
  ctx.fillStyle='rgba(30,20,10,.3)';ctx.beginPath();ctx.roundRect(-r*0.9+r*0.15,-r+r*0.2,L+r*1.8,r*2,r);ctx.fill();
  const body=()=>{ctx.beginPath();ctx.roundRect(-r*0.9,-r,L+r*1.8,r*2,r*0.9);};
  inked(body,branch?'#7a5a3e':'#7a6040',2.6);
  ctx.save();body();ctx.clip();
  ctx.strokeStyle='rgba(42,25,12,.4)';ctx.lineWidth=2;const R=seeded(o.seed);
  for(let k=0;k<7;k++){const y=-r+r*2*(k+0.5)/7;ctx.beginPath();ctx.moveTo(-r,y);for(let x=0;x<L+r*2;x+=30)ctx.lineTo(x,y+(R()-0.5)*5);ctx.stroke();}
  ctx.fillStyle='rgba(255,230,180,.16)';ctx.fillRect(-r,-r*0.75,L+r*2,r*0.3);
  if(!branch){ctx.fillStyle='rgba(95,125,58,.75)';for(let k=0;k<10;k++)dot(R()*L,-r*0.3+R()*r*1.2,r*(0.12+R()*0.15),'rgba(95,125,58,.7)');}
  ctx.restore();
  inked(ellP(L+r*0.55,0,r*0.36,r*0.9),'#c9a56c',2);ctx.strokeStyle='rgba(120,80,40,.6)';ctx.lineWidth=1;for(let k=1;k<4;k++){ctx.beginPath();ctx.ellipse(L+r*0.55,0,r*0.36*(1-k*0.25),r*0.9*(1-k*0.25),0,0,TAU);ctx.stroke();}
  if(branch){/* a few leaves on the branch */for(let k=0;k<3;k++){const x=L*(0.25+k*0.25);ctx.save();ctx.translate(x,(k%2?1:-1)*r*0.9);ctx.rotate((k%2?1:-1)*0.8);inked(()=>{ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(r*0.6,-r*0.5,r*1.4,0);ctx.quadraticCurveTo(r*0.6,r*0.5,0,0);ctx.closePath();},'#6f8f3a',1.3);ctx.restore();}}
  ctx.restore();
}
function drawObst(o,bg){
  switch(o.k){case 'rock':drawRock(o,bg);break;case 'grass':drawGrassClump(o);break;case 'flower':drawFlower(o);break;case 'stump':drawStump(o);break;case 'knot':drawKnot(o,bg);break;case 'log':drawLog(o,bg);break;}
}

/* ---------- hazards & features ---------- */
function drawWeb(w){
  ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.a||0);
  ctx.globalAlpha=w.cut?Math.max(0,1-w.cut):1;
  ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=1.2;const n=10;
  for(let i=0;i<n;i++){const a=i/n*TAU;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*w.r*1.1,Math.sin(a)*w.r*1.1);ctx.stroke();}
  ctx.lineWidth=0.9;for(let k=1;k<7;k++){ctx.beginPath();for(let i=0;i<=n;i++){const a=i/n*TAU,rr=w.r*k/7*(1+0.06*Math.sin(i*2.3));const x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i)ctx.quadraticCurveTo(Math.cos(a-TAU/n/2)*rr*0.9,Math.sin(a-TAU/n/2)*rr*0.9,x,y);else ctx.moveTo(x,y);}ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,.9)';for(let i=0;i<6;i++){const a=i*1.9+ART_T*0.2,rr=w.r*(0.3+(i%3)*0.2);dot(Math.cos(a)*rr,Math.sin(a)*rr,1.4,'rgba(255,255,255,.9)');}
  ctx.restore();ctx.globalAlpha=1;
}
function drawShroom(m){
  const r=m.r,puff=m.puff>0?Math.sin(m.puff*20)*0.06:0;ctx.save();ctx.translate(m.x,m.y);ctx.scale(1+puff,1+puff);
  ctx.fillStyle='rgba(30,20,10,.3)';ctx.beginPath();ctx.ellipse(r*0.15,r*0.2,r*1.05,r*0.95,0,0,TAU);ctx.fill();
  for(let k=0;k<3;k++){const a=k*2.1+m.seed,x=Math.cos(a)*r*0.9,y=Math.sin(a)*r*0.9;inked(ellP(x,y,r*0.32,r*0.3),'#c8452d',1.4);dot(x-r*0.08,y-r*0.08,r*0.07,'#f6f2e6');}
  inked(ellP(0,0,r,r*0.94),'#c8452d',2.4);
  const g=ctx.createRadialGradient(-r*0.3,-r*0.3,0,0,0,r);g.addColorStop(0,'rgba(255,200,170,.45)');g.addColorStop(1,'rgba(0,0,0,.1)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,r,r*0.94,0,0,TAU);ctx.fill();
  for(const [x,y,s] of [[-0.3,-0.35,0.17],[0.35,-0.1,0.14],[0,0.38,0.15],[-0.45,0.2,0.1],[0.2,-0.55,0.09],[0.5,0.42,0.09]])inked(ellP(x*r,y*r,s*r,s*r*0.85),'#f6f2e6',1);
  ctx.restore();
}
function drawSap(s){
  ctx.save();ctx.translate(s.x,s.y);
  const pulse=0.85+0.15*Math.sin(ART_T*2+s.x);
  const g=ctx.createRadialGradient(0,0,4,0,0,s.rx*1.8);g.addColorStop(0,'rgba(255,200,90,'+(0.4*pulse)+')');g.addColorStop(1,'rgba(255,170,60,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,s.rx*1.8,s.ry*1.8,0,0,TAU);ctx.fill();
  inked(ellP(0,0,s.rx,s.ry),'#d8902e',2.2);
  ctx.fillStyle='#f2b84a';ctx.beginPath();ctx.ellipse(-s.rx*0.1,-s.ry*0.1,s.rx*0.75,s.ry*0.7,0,0,TAU);ctx.fill();
  ctx.fillStyle='rgba(255,250,210,.75)';ctx.beginPath();ctx.ellipse(-s.rx*0.35,-s.ry*0.35,s.rx*0.28,s.ry*0.12,-0.4,0,TAU);ctx.fill();
  for(let i=0;i<3;i++){const t=(ART_T*0.6+i/3)%1;dot(Math.cos(i*2.1)*s.rx*0.4,Math.sin(i*2.1)*s.ry*0.4,2+t*2,'rgba(255,240,180,'+(1-t)+')');}
  ctx.strokeStyle='rgba(200,120,30,.8)';ctx.lineWidth=3;ctx.lineCap='round';for(let i=0;i<2;i++){const x=(i-0.5)*s.rx*0.8;ctx.beginPath();ctx.moveTo(x,s.ry*0.8);ctx.lineTo(x+2,s.ry*0.8+12+6*Math.sin(ART_T+i));ctx.stroke();}
  ctx.restore();
}
/* river: a polyline band; crossings are stones / lily pads / a log */
function drawRiver(rv,cam){
  const w=rv.w;
  ctx.lineCap='round';ctx.lineJoin='round';
  const path=()=>{ctx.beginPath();ctx.moveTo(rv.pts[0][0],rv.pts[0][1]);for(let i=1;i<rv.pts.length;i++)ctx.lineTo(rv.pts[i][0],rv.pts[i][1]);};
  path();ctx.strokeStyle='#a89468';ctx.lineWidth=w+44;ctx.stroke();
  path();ctx.strokeStyle='#8a7a52';ctx.lineWidth=w+18;ctx.stroke();
  path();ctx.strokeStyle=INK;ctx.lineWidth=w+4;ctx.stroke();
  path();ctx.strokeStyle='#5f8fb0';ctx.lineWidth=w;ctx.stroke();
  path();ctx.strokeStyle='#76a6c4';ctx.lineWidth=w*0.6;ctx.stroke();
  /* flow streaks */
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;
  for(let i=0;i<rv.pts.length-1;i++){const [x1,y1]=rv.pts[i],[x2,y2]=rv.pts[i+1];if(Math.max(x1,x2)<cam.x0-200||Math.min(x1,x2)>cam.x1+200)continue;const L=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/L,uy=(y2-y1)/L;
    for(let k=0;k<3;k++){const t=((ART_T*60+k*L/3+i*37)%L),off=((k*37+i*13)%5-2)*w*0.16,x=x1+ux*t-uy*off,y=y1+uy*t+ux*off;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+ux*22,y+uy*22);ctx.stroke();}}
  /* reeds along the banks */
  for(const rd of rv.reeds){if(rd.x<cam.x0-60||rd.x>cam.x1+60||rd.y<cam.y0-60||rd.y>cam.y1+60)continue;ctx.save();ctx.translate(rd.x,rd.y);const sw=Math.sin(ART_T*1.5+rd.x)*0.08;for(let k=0;k<5;k++){const a=-Math.PI/2+(k-2)*0.3+sw;ctx.strokeStyle=k%2?'#6f8f3a':'#86a845';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*24,Math.sin(a)*24);ctx.stroke();}
    inked(ellP(Math.cos(-Math.PI/2+sw)*26,Math.sin(-Math.PI/2+sw)*26,3.5,8),'#7a4a2a',1.2);ctx.restore();}
  for(const c of rv.cross)drawCrossing(c);
}
function drawCrossing(c){
  if(c.kind==='stones'){for(const s of c.stones){ctx.fillStyle='rgba(30,50,70,.35)';ctx.beginPath();ctx.ellipse(s.x+3,s.y+5,s.r,s.r*0.85,0,0,TAU);ctx.fill();drawRock({x:s.x,y:s.y,r:s.r,seed:s.seed,a:s.a},'sand');}
    ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.5;for(const s of c.stones){ctx.beginPath();ctx.ellipse(s.x,s.y,s.r*1.25+Math.sin(ART_T*3+s.x)*2,s.r*1.1,0,0,TAU);ctx.stroke();}}
  else if(c.kind==='lily'){for(const s of c.stones){ctx.save();ctx.translate(s.x,s.y+Math.sin(ART_T*1.5+s.x)*1.5);ctx.rotate(s.a);inked(()=>{ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,s.r,0.25,TAU-0.25);ctx.closePath();},'#6f9a3a',2);
      ctx.strokeStyle='rgba(42,33,24,.35)';ctx.lineWidth=1;for(let k=0;k<6;k++){const a=0.5+k*0.95;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*s.r*0.85,Math.sin(a)*s.r*0.85);ctx.stroke();}
      if(s.seed%3===0){for(let k=0;k<8;k++){ctx.save();ctx.rotate(k/8*TAU);inked(ellP(s.r*0.22,0,s.r*0.2,s.r*0.08),'#f6dce8',1);ctx.restore();}dot(0,0,s.r*0.1,'#f2c43a');}
      ctx.restore();}}
  else if(c.kind==='log'){drawLog({x1:c.x1,y1:c.y1,x2:c.x2,y2:c.y2,r:c.r,seed:c.seed},'soil');}
}
function drawFrog(f){
  if(f.st==='hide'){ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(f.x,f.y,10+Math.sin(ART_T*2+f.x)*2,6,0,0,TAU);ctx.stroke();return;}
  ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.ang);
  const k=f.st==='warn'?clamp(1-f.t/0.9,0,1):1;
  ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.5;for(let i=0;i<2;i++){const rr=(ART_T*40+i*20)%40;ctx.beginPath();ctx.ellipse(0,0,14+rr,10+rr*0.7,0,0,TAU);ctx.stroke();}
  inked(ellP(-6,0,22*k+4,18*k+4),'#6f8f3a',2);
  ctx.fillStyle='rgba(42,60,20,.45)';dot(-12,-6*k,4*k,'rgba(42,60,20,.45)');dot(-14,7*k,3*k,'rgba(42,60,20,.45)');
  /* the mouth is the front rim of the head; the tongue leaves from here, not from the eyes */
  const open=f.st==='tongue';const M=20*k;
  if(open){inked(ellP(M-1,0,5,9),'#7a2a3a',1.6);}else{ctx.strokeStyle=INK;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(M-10,0,10,-0.9,0.9);ctx.stroke();}
  if(open){const t=clamp(f.t/0.25,0,1),L=Math.max(0,f.len-M)*(1-Math.abs(1-2*t));
    ctx.lineCap='round';ctx.strokeStyle=INK;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(M,0);ctx.lineTo(M+L,0);ctx.stroke();ctx.strokeStyle='#e8708a';ctx.lineWidth=5;ctx.stroke();inked(ellP(M+L,0,7,6),'#e8708a',1.6);}
  for(const s of [-1,1]){inked(ellP(4,s*11*k,7,6),'#86a845',1.6);dot(6,s*11*k,4,'#f2c43a');dot(7,s*11*k,2.2,INK);}
  ctx.restore();
}

/* ---------- structures ---------- */
/* the boss lair: stakes on a ring joined by a sacred rope (しめ縄) with paper streamers; one gate */
function drawLairFloor(L){
  const g=ctx.createRadialGradient(L.x,L.y,L.R*0.2,L.x,L.y,L.R);g.addColorStop(0,'rgba(255,240,200,.18)');g.addColorStop(1,'rgba(42,33,24,.12)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(L.x,L.y,L.R,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(42,33,24,.18)';ctx.lineWidth=3;ctx.setLineDash([10,14]);ctx.beginPath();ctx.arc(L.x,L.y,L.R*0.55,0,TAU);ctx.stroke();ctx.setLineDash([]);
}
function lairPosts(L){
  if(L.posts)return L.posts;
  const n=Math.round(L.R*TAU/120),posts=[];
  for(let i=0;i<n;i++){const a=i/n*TAU+L.gate;let d=angDiff(a,L.gate);if(Math.abs(d)<L.gw*0.6)continue;posts.push({a,x:L.x+Math.cos(a)*L.R,y:L.y+Math.sin(a)*L.R});}
  L.gateP=[-1,1].map(s=>({a:L.gate+s*L.gw,x:L.x+Math.cos(L.gate+s*L.gw)*L.R,y:L.y+Math.sin(L.gate+s*L.gw)*L.R}));
  const key=p=>((p.a-L.gate)%TAU+TAU)%TAU;posts.sort((p,q)=>key(p)-key(q));
  L.posts=posts;return posts;
}
function rope(x1,y1,x2,y2,sag,thick){
  const mx=(x1+x2)/2,my=(y1+y2)/2+sag;
  ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo(mx,my,x2,y2);
  ctx.strokeStyle=INK;ctx.lineWidth=thick+3;ctx.stroke();ctx.strokeStyle='#d8c08a';ctx.lineWidth=thick;ctx.stroke();
  ctx.strokeStyle='rgba(120,90,40,.7)';ctx.lineWidth=1.4;ctx.setLineDash([3,5]);ctx.lineDashOffset=0;ctx.stroke();ctx.setLineDash([]);
  return [mx,(y1+y2)/2+sag*0.5];
}
function shide(x,y,s){/* zig-zag paper streamer */
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(ART_T*2+x)*0.12);
  ctx.beginPath();ctx.moveTo(-3*s,0);ctx.lineTo(3*s,0);ctx.lineTo(3*s,6*s);ctx.lineTo(-1*s,6*s);ctx.lineTo(-1*s,11*s);ctx.lineTo(3*s,11*s);ctx.lineTo(3*s,17*s);ctx.lineTo(-3*s,17*s);ctx.lineTo(-3*s,11*s);ctx.lineTo(1*s,11*s);ctx.lineTo(1*s,6*s);ctx.lineTo(-3*s,6*s);ctx.closePath();
  ctx.fillStyle='#fffdf4';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.stroke();ctx.restore();
}
function post(x,y,r,top){
  ctx.fillStyle='rgba(30,20,10,.3)';ctx.beginPath();ctx.ellipse(x+4,y+6,r,r*0.8,0,0,TAU);ctx.fill();
  inked(ellP(x,y,r,r),'#8a6a44',2);ctx.strokeStyle='rgba(42,25,12,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r*0.6,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(x,y,r*0.25,0,TAU);ctx.stroke();
  if(top){ctx.fillStyle='rgba(255,230,180,.3)';ctx.beginPath();ctx.ellipse(x-r*0.3,y-r*0.35,r*0.35,r*0.15,-0.4,0,TAU);ctx.fill();}
}
function drawLairFence(L,open,openT){
  const ps=lairPosts(L);
  for(let i=0;i<ps.length-1;i++){const p=ps[i],q=ps[i+1];const m=rope(p.x,p.y,q.x,q.y,10,5);if(i%2===0)shide(m[0],m[1],1);}
  // connect posts to gate posts
  const gL=L.gateP[0],gR=L.gateP[1];
  const first=ps[0],last=ps[ps.length-1];
  rope(gR.x,gR.y,first.x,first.y,8,5);rope(last.x,last.y,gL.x,gL.y,8,5);
  for(const p of ps)post(p.x,p.y,9,true);
  // gate
  if(!open||openT<1){
    const k=open?clamp(openT,0,1):0;
    ctx.globalAlpha=1-k;
    const m=rope(gL.x,gL.y+k*30,gR.x,gR.y+k*30,22+k*40,9);
    for(let i=1;i<4;i++){const t=i/4,x=gL.x+(gR.x-gL.x)*t,y=gL.y+(gR.y-gL.y)*t+Math.sin(t*Math.PI)*16+k*30;shide(x,y+4,1.3);}
    ctx.save();ctx.translate(m[0],m[1]+12);inked(()=>{ctx.beginPath();ctx.ellipse(0,0,14,10,0,0,TAU);},'#d8c08a',2);ctx.restore();
    ctx.globalAlpha=1;
  }
  for(const g of L.gateP){post(g.x,g.y,15,true);}
  if(!open){/* little 番 placard on the gate */
    const x=(gL.x+gR.x)/2,y=(gL.y+gR.y)/2+60;ctx.save();ctx.translate(x,y);inked(()=>{ctx.beginPath();ctx.roundRect(-16,-20,32,40,4);},'#f4ead2',2);ctx.fillStyle=INK;ctx.font='22px '+DFONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('番',0,1);ctx.restore();}
}
/* keeper arena: ring of pebbles + a のぼり banner */
function drawArena(A,name,beaten){
  if(!A.pebbles){const R=seeded(A.seed),n=Math.round(A.R*TAU/34);A.pebbles=[];for(let i=0;i<n;i++){const a=i/n*TAU+R()*0.05;A.pebbles.push({x:A.x+Math.cos(a)*A.R,y:A.y+Math.sin(a)*A.R,r:7+R()*5,seed:i*13+A.seed,a:R()*TAU});}}
  ctx.fillStyle=beaten?'rgba(255,240,200,.08)':'rgba(200,69,45,.06)';ctx.beginPath();ctx.arc(A.x,A.y,A.R,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(42,33,24,.12)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(A.x,A.y,A.R*0.7,0,TAU);ctx.stroke();
  for(const p of A.pebbles){ctx.fillStyle='rgba(42,33,24,.25)';ctx.beginPath();ctx.ellipse(p.x+2,p.y+3,p.r,p.r*0.8,0,0,TAU);ctx.fill();ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);inked(ellP(0,0,p.r,p.r*0.78),'#c9c0ae',1.5);ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(-p.r*0.3,-p.r*0.3,p.r*0.35,p.r*0.15,0,0,TAU);ctx.fill();ctx.restore();}
  drawNobori(A.x+A.R*0.72,A.y-A.R*0.72,name,beaten);
}
function drawNobori(x,y,text,beaten){
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(42,33,24,.3)';ctx.beginPath();ctx.ellipse(6,4,10,5,0,0,TAU);ctx.fill();
  ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-118);ctx.stroke();ctx.strokeStyle='#b8946a';ctx.lineWidth=2;ctx.stroke();
  const wave=Math.sin(ART_T*2+x)*3;
  ctx.beginPath();ctx.moveTo(2,-112);ctx.lineTo(30,-112+wave*0.3);ctx.lineTo(30+wave,-22);ctx.lineTo(2,-24);ctx.closePath();
  ctx.fillStyle=beaten?'#e8dcc0':'#c8452d';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=beaten?'rgba(42,33,24,.55)':'#fff6e0';ctx.font='900 13px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';
  const chars=[...text].slice(0,6);chars.forEach((c,i)=>ctx.fillText(c,16+wave*(i/6),-100+i*14));
  ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-112);ctx.lineTo(32,-112);ctx.stroke();
  ctx.restore();
}
/* the player's home: a curled oak leaf over a hollow under a pebble, with a firefly lantern */
function drawSumika(s,near,label){
  ctx.save();ctx.translate(s.x,s.y);
  if(near){ctx.strokeStyle='rgba(255,220,120,'+(0.5+0.3*Math.sin(ART_T*4))+')';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,8,s.r+14,0,TAU);ctx.stroke();}
  ctx.fillStyle='rgba(42,33,24,.3)';ctx.beginPath();ctx.ellipse(8,14,64,40,0,0,TAU);ctx.fill();
  /* mat of soft moss */
  inked(ellP(0,16,52,30),'#7d9a46',2);ctx.fillStyle='rgba(255,255,220,.2)';for(let i=0;i<14;i++)dot(Math.cos(i*1.3)*38,16+Math.sin(i*2.1)*20,3,'rgba(255,255,220,.25)');
  /* hollow */
  inked(ellP(-4,10,28,16),'#3a2a1a',1.8);
  /* leaf roof (クヌギの葉) */
  ctx.save();ctx.translate(-6,-6);ctx.rotate(-0.25);
  inked(()=>{ctx.beginPath();ctx.moveTo(-58,4);for(let i=0;i<=8;i++){const t=i/8,x=-58+t*116,y=-30*Math.sin(t*Math.PI)-(i%2?4:0);ctx.lineTo(x,y);}ctx.quadraticCurveTo(40,24,0,22);ctx.quadraticCurveTo(-40,24,-58,4);ctx.closePath();},'#b8863a',2.2);
  ctx.strokeStyle='rgba(90,50,20,.6)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-54,4);ctx.quadraticCurveTo(0,-6,58,2);ctx.stroke();
  ctx.lineWidth=1;for(let i=-3;i<=3;i++){if(!i)continue;ctx.beginPath();ctx.moveTo(i*14,-1-Math.abs(i));ctx.lineTo(i*14+(i>0?8:-8),-18+Math.abs(i)*2);ctx.stroke();}
  ctx.strokeStyle='#7a5020';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(58,2);ctx.lineTo(70,-4);ctx.stroke();
  ctx.restore();
  /* firefly lantern on a stalk */
  ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(44,20);ctx.quadraticCurveTo(52,-10,46,-34);ctx.stroke();
  const gl=0.6+0.4*Math.sin(ART_T*3);
  const g=ctx.createRadialGradient(46,-40,1,46,-40,26);g.addColorStop(0,'rgba(220,255,140,'+(0.75*gl)+')');g.addColorStop(1,'rgba(220,255,140,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(46,-40,26,0,TAU);ctx.fill();
  inked(ellP(46,-40,7,9),'rgba(240,255,200,.85)',1.6);dot(46,-38,3,'rgba(200,255,90,'+gl+')');
  /* sign */
  ctx.save();ctx.translate(-50,26);ctx.rotate(-0.12);inked(()=>{ctx.beginPath();ctx.roundRect(-20,-11,40,22,4);},'#f4ead2',1.8);ctx.fillStyle=INK;ctx.font='900 12px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label||'すみか',0,1);ctx.restore();
  ctx.restore();
}
function drawSumoRing(R){
  ctx.save();ctx.translate(R.x,R.y);
  ctx.fillStyle='rgba(42,33,24,.25)';ctx.beginPath();ctx.arc(6,8,R.R+22,0,TAU);ctx.fill();
  inked(ellP(0,0,R.R+20,R.R+20),'#cdb07a',2.2);
  ctx.fillStyle='#e8d6a6';ctx.beginPath();ctx.arc(0,0,R.R,0,TAU);ctx.fill();
  const n=22;for(let i=0;i<n;i++){const a=i/n*TAU;ctx.save();ctx.rotate(a);inked(()=>{ctx.beginPath();ctx.roundRect(R.R-5,-R.R*TAU/n/2+2,14,R.R*TAU/n-4,6);},'#c9a65a',1.4);ctx.strokeStyle='rgba(42,33,24,.4)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(R.R+2,-6);ctx.lineTo(R.R+2,6);ctx.stroke();ctx.restore();}
  ctx.strokeStyle='#fffdf4';ctx.lineWidth=4;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*14,-18);ctx.lineTo(s*14,18);ctx.stroke();}
  ctx.restore();
}
/* ---------- small things ---------- */
function drawFood(f){
  ctx.save();ctx.translate(f.x,f.y+Math.sin(ART_T*3+f.bob)*1.2);ctx.rotate(f.a);
  ctx.fillStyle='rgba(42,33,24,.2)';ctx.beginPath();ctx.ellipse(2,3,9,6,0,0,TAU);ctx.fill();
  switch(f.kind){
    case 'leaf':inked(()=>{ctx.beginPath();ctx.moveTo(-10,0);ctx.quadraticCurveTo(0,-8,11,0);ctx.quadraticCurveTo(0,8,-10,0);ctx.closePath();},'#9cc04f',1.5);ctx.strokeStyle='rgba(42,33,24,.4)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(10,0);ctx.stroke();break;
    case 'acorn':inked(ellP(0,2,6,8),'#b8763a',1.5);inked(ellP(0,-4,7,4),'#7a5634',1.5);ctx.fillStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.ellipse(-2,3,1.5,3,0,0,TAU);ctx.fill();break;
    case 'berry':for(const [x,y] of [[-4,2],[4,2],[0,-4]]){inked(ellP(x,y,5,5),'#8c3d8f',1.3);dot(x-1.5,y-1.5,1.3,'rgba(255,255,255,.6)');}break;
    case 'sap':inked(ellP(0,0,7,9),'#eaa63c',1.5);dot(-2,-3,2,'rgba(255,250,210,.8)');break;
    case 'nectar':inked(ellP(0,0,8,8),'#f4a6c4',1.5);inked(ellP(0,0,4,4),'#f2c43a',1.2);break;
    default:inked(ellP(0,0,8,6),'#e8846a',1.5);dot(-2,-2,2,'#fff3c4');
  }
  ctx.restore();
}
/* decor scatter (non-colliding) */
function drawDecor(d){
  ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.a);const s=d.s;
  switch(d.k){
    case 'leaf':ctx.fillStyle=d.c;ctx.beginPath();ctx.moveTo(-s,0);ctx.quadraticCurveTo(0,-s*0.55,s,0);ctx.quadraticCurveTo(0,s*0.55,-s,0);ctx.fill();ctx.strokeStyle='rgba(42,33,24,.35)';ctx.lineWidth=1;ctx.stroke();ctx.beginPath();ctx.moveTo(-s*0.9,0);ctx.lineTo(s*0.9,0);ctx.stroke();break;
    case 'oak':ctx.fillStyle=d.c;ctx.beginPath();ctx.moveTo(-s,0);for(let i=0;i<=6;i++){const t=i/6;ctx.lineTo(-s+t*2*s,-s*0.45*Math.sin(t*Math.PI)-(i%2?s*0.12:0));}for(let i=6;i>=0;i--){const t=i/6;ctx.lineTo(-s+t*2*s,s*0.45*Math.sin(t*Math.PI)+(i%2?s*0.12:0));}ctx.fill();ctx.strokeStyle='rgba(42,33,24,.35)';ctx.lineWidth=1;ctx.stroke();ctx.beginPath();ctx.moveTo(-s,0);ctx.lineTo(s,0);ctx.stroke();break;
    case 'twig':ctx.strokeStyle='#7a5a3a';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-s,0);ctx.lineTo(s,s*0.1);ctx.moveTo(0,0);ctx.lineTo(s*0.4,-s*0.4);ctx.stroke();ctx.strokeStyle='rgba(42,33,24,.5)';ctx.lineWidth=1;ctx.stroke();break;
    case 'pebble':ctx.fillStyle='rgba(42,33,24,.2)';ctx.beginPath();ctx.ellipse(1.5,2,s*0.5,s*0.4,0,0,TAU);ctx.fill();ctx.fillStyle=d.c;ctx.beginPath();ctx.ellipse(0,0,s*0.5,s*0.4,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(42,33,24,.5)';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(-s*0.15,-s*0.15,s*0.2,s*0.1,0,0,TAU);ctx.fill();break;
    case 'clover':for(let i=0;i<3;i++){ctx.save();ctx.rotate(i/3*TAU);ctx.fillStyle=d.c;ctx.beginPath();ctx.arc(s*0.32,0,s*0.3,0,TAU);ctx.fill();ctx.strokeStyle='rgba(42,33,24,.3)';ctx.lineWidth=0.8;ctx.stroke();ctx.restore();}break;
    case 'tuft':ctx.strokeStyle=d.c;ctx.lineWidth=2;ctx.lineCap='round';for(let i=0;i<5;i++){const a=-Math.PI/2+(i-2)*0.35;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(a)*s*0.5,Math.sin(a)*s*0.5-2,Math.cos(a)*s,Math.sin(a)*s);ctx.stroke();}break;
    case 'bloom':for(let i=0;i<5;i++){ctx.save();ctx.rotate(i/5*TAU);ctx.fillStyle=d.c;ctx.beginPath();ctx.ellipse(s*0.32,0,s*0.3,s*0.18,0,0,TAU);ctx.fill();ctx.restore();}dot(0,0,s*0.18,'#f2c43a');break;
    case 'petal':ctx.fillStyle=d.c;ctx.beginPath();ctx.ellipse(0,0,s*0.4,s*0.22,0,0,TAU);ctx.fill();break;
    case 'moss':ctx.fillStyle=d.c;for(let i=0;i<5;i++)dot(Math.cos(i*1.7)*s*0.5,Math.sin(i*2.3)*s*0.35,s*(0.25+0.1*(i%2)),d.c);break;
    case 'crack':ctx.strokeStyle=d.c;ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s*0.15,-s*0.3);ctx.lineTo(-s*0.1,s*0.3);ctx.lineTo(s*0.05,s);ctx.stroke();break;
    case 'lichen':ctx.fillStyle=d.c;for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(Math.cos(i)*s*0.4,Math.sin(i*1.9)*s*0.3,s*0.22,0,TAU);ctx.fill();}ctx.strokeStyle='rgba(42,33,24,.25)';ctx.lineWidth=0.8;ctx.stroke();break;
    case 'drip':ctx.fillStyle='rgba(240,160,50,.55)';ctx.beginPath();ctx.ellipse(0,0,s*0.25,s*0.6,0,0,TAU);ctx.fill();dot(-s*0.06,-s*0.2,s*0.08,'rgba(255,240,190,.7)');break;
    case 'minishroom':ctx.fillStyle='#e8c48a';ctx.beginPath();ctx.arc(0,0,s*0.4,0,TAU);ctx.fill();ctx.strokeStyle='rgba(42,33,24,.5)';ctx.lineWidth=1;ctx.stroke();dot(-s*0.1,-s*0.1,s*0.1,'rgba(255,255,255,.5)');break;
    case 'chip':ctx.fillStyle=d.c;ctx.fillRect(-s*0.4,-s*0.15,s*0.8,s*0.3);break;
    case 'patch':ctx.fillStyle=d.c;ctx.beginPath();ctx.ellipse(0,0,s,s*0.6,0,0,TAU);ctx.fill();break;
  }
  ctx.restore();
}
