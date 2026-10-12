'use strict';
/* =====================================================================
   ひと夏の番長 — creature art
   Every bug faces +x. Anatomy order (back → front): abdomen, thorax, head.
   Legs attach at the THORAX and are drawn under the body; wings attach at
   the thorax and are drawn ON TOP, sweeping back over the abdomen.
   ===================================================================== */
let cv=null,ctx=null,W=0,Hh=0,DPR=1,ART_T=0;
const INK='#2a2118';
const FONT='"Zen Maru Gothic","Hiragino Maru Gothic ProN",sans-serif';
const DFONT='"Dela Gothic One","Hiragino Sans",sans-serif';

function inked(path,fill,lw){ctx.save();ctx.translate(1.4,1.6);path();ctx.fillStyle=fill;ctx.fill();ctx.restore();path();ctx.lineWidth=lw||2;ctx.strokeStyle=INK;ctx.stroke();}
function ellP(x,y,rx,ry,rot){return ()=>{ctx.beginPath();ctx.ellipse(x,y,Math.max(0.1,rx),Math.max(0.1,ry),rot||0,0,TAU);};}
function ell(x,y,rx,ry,fill,lw,rot){inked(ellP(x,y,rx,ry,rot),fill,lw);}
function dot(x,y,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,Math.max(0.3,r),0,TAU);ctx.fill();}
/* a limb: ink outline under a coloured core */
function limb(pts,w,col){
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
  if(!col||w<1.8){ctx.strokeStyle=INK;ctx.lineWidth=Math.max(1.1,w);ctx.stroke();return;}
  ctx.strokeStyle=INK;ctx.lineWidth=w+2.2;ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke();
}
function shade(hex,k){/* k<0 darker, k>0 lighter */
  const n=parseInt(hex.slice(1),16);let r=n>>16&255,g=n>>8&255,b=n&255;
  if(k<0){r*=1+k;g*=1+k;b*=1+k;}else{r+=(255-r)*k;g+=(255-g)*k;b+=(255-b)*k;}
  return 'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';
}
function gloss(x,y,rx,ry,a){ctx.fillStyle='rgba(255,255,255,'+(a||0.45)+')';ctx.beginPath();ctx.ellipse(x,y,rx,ry,-0.2,0,TAU);ctx.fill();}

/* ---------- legs ---------- */
/* six legs on the thorax at x=tx*r. Tripod gait: front+hind of one side move with the middle leg of the other side. */
function legs6(r,tx,walk,o){
  o=o||{};const len=o.len||1,ty=o.ty||0.2,sp=o.sp||1,w=o.w||Math.max(1.4,r*0.09),col=o.col||null,curl=o.curl||0;
  const base=[0.95,1.58,2.2],bend=[-0.55,0.22,0.5],L1=[0.48,0.5,0.56],L2=[0.55,0.6,0.72];
  for(let i=0;i<3;i++){if(o.skip&&o.skip.includes(i))continue;for(const s of [-1,1]){
    const ph=walk+(i===1?Math.PI:0)+(s>0?Math.PI:0),sw=Math.sin(ph)*0.26;
    const ax=(tx+[0.15,0,-0.15][i]*sp)*r,ay=s*ty*r;
    const fa=s*(base[i]-sw+curl*0.4),ta=fa+s*(bend[i]+curl*1.4);
    const l1=r*L1[i]*len*(1-curl*0.4),l2=r*L2[i]*len*(1-curl*0.5);
    const kx=ax+Math.cos(fa)*l1,ky=ay+Math.sin(fa)*l1;
    limb([[ax,ay],[kx,ky],[kx+Math.cos(ta)*l2,ky+Math.sin(ta)*l2]],w,col);
  }}
}
/* dangling legs for flying insects (tucked back under the body) */
function legsHang(r,tx,len,w){
  ctx.strokeStyle=INK;ctx.lineWidth=w||Math.max(1.1,r*0.07);ctx.lineCap='round';
  for(let i=0;i<3;i++)for(const s of [-1,1]){const ax=(tx+0.12-i*0.12)*r,ay=s*r*0.12;
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(ax-r*0.2,ay+s*r*0.35*len,ax-r*(0.45+i*0.12)*len,ay+s*r*(0.3+i*0.04)*len);ctx.stroke();}
}
function antennae(r,x,len,spread,o){
  o=o||{};ctx.strokeStyle=INK;ctx.lineWidth=o.w||Math.max(1.1,r*0.06);ctx.lineCap='round';
  const wob=Math.sin(ART_T*3+(o.ph||0))*0.06;
  for(const s of [-1,1]){
    const bx=x*r,by=s*r*0.1;
    if(o.elbow){const ex=bx+r*0.35*len,ey=by+s*r*0.32*len*spread;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(ex,ey);ctx.lineTo(ex+r*0.45*len,ey+s*r*(0.05+wob)*len);ctx.stroke();continue;}
    if(o.back){ctx.beginPath();ctx.moveTo(bx,by);ctx.bezierCurveTo(bx+r*0.5,by+s*r*0.5*spread,bx+r*0.2*len,by+s*r*(1.2+wob)*len*spread,bx-r*1.2*len,by+s*r*(1.0+wob)*len*spread);ctx.stroke();
      if(o.band){ctx.save();ctx.setLineDash([r*0.12,r*0.12]);ctx.strokeStyle=o.band;ctx.lineWidth=Math.max(1,r*0.05);ctx.stroke();ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=o.w||Math.max(1.1,r*0.06);}continue;}
    ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+r*0.5*len,by+s*r*(0.2+0.2*spread),bx+r*0.85*len,by+s*r*(0.55*spread+wob));ctx.stroke();
    if(o.club){dot(bx+r*0.85*len,by+s*r*(0.55*spread+wob),r*0.07,INK);}
    if(o.feather){ctx.lineWidth=0.8;for(let k=1;k<6;k++){const t=k/6,px=bx+r*0.85*len*t,py=by+s*r*(0.55*spread)*t;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-r*0.08,py+s*r*0.12);ctx.stroke();}ctx.lineWidth=o.w||Math.max(1.1,r*0.06);}
  }
}
function eyes(r,x,y,sz,col){for(const s of [-1,1]){dot(x*r,s*y*r,sz*r,col||INK);dot(x*r+sz*r*0.3,s*y*r-sz*r*0.3,sz*r*0.35,'rgba(255,255,255,.8)');}}

/* ---------- mouthparts ---------- */
const MAND={ago:{L:0.42,c:0.35,t:0.1},oago:{L:0.85,c:0.42,t:0.12,tooth:1},kiba:{L:0.3,c:0.6,t:0.1},kamikiri:{L:0.48,c:0.22,t:0.16},
  hirata:{L:0.82,c:0.08,t:0.16,teeth:4},kongou:{L:0.55,c:0.32,t:0.15,tooth:1},onizuno:{L:1.05,c:0.4,t:0.17,teeth:3},kuwa:{L:1.22,c:0.24,t:0.12,teeth:5},kokuwa:{L:0.6,c:0.3,t:0.12,tooth:1},hiari:{L:0.5,c:0.42,t:0.12,tooth:1},gokegumo:{L:0.3,c:0.6,t:0.1}};
/* drawn at the head's front edge (origin) */
function mandibles(r,type,open,col){
  const m=MAND[type]||MAND.ago,L=m.L*r,o=clamp(open,0,1.3);
  if(type==='kiba'||type==='gokegumo'){for(const s of [-1,1]){inked(()=>{ctx.beginPath();ctx.moveTo(0,s*r*0.08);ctx.lineTo(0,s*r*0.22);ctx.quadraticCurveTo(r*0.32,s*r*0.28,r*0.3,s*r*(0.02-o*0.04));ctx.closePath();},col||'#3a2430',1.4);dot(r*0.28,s*r*0.02,r*0.035,'#e8e2d0');}return;}
  for(const s of [-1,1]){
    ctx.save();ctx.scale(1,s);
    const spread=0.22+0.3*o;
    inked(()=>{ctx.beginPath();ctx.moveTo(-r*0.02,r*0.24);
      ctx.quadraticCurveTo(L*0.45,r*0.24+L*(m.c*0.6+spread*0.5),L,r*0.02+L*spread*0.35);
      ctx.lineTo(L*0.9,-r*0.04+L*spread*0.25);
      ctx.quadraticCurveTo(L*0.45,r*0.06+L*(m.c*0.5+spread*0.35)-m.t*r,0,r*0.06);ctx.closePath();},col||'#5a3a24',Math.max(1.3,r*0.07));
    if(m.teeth){ctx.fillStyle=INK;for(let i=1;i<=m.teeth;i++){const t=0.25+i/(m.teeth+1)*0.6,x=L*t,y=r*0.06+L*(m.c*0.5+spread*0.35)*(1-Math.pow(2*t-1,2))*0.9-m.t*r*0.6+L*spread*0.25*t;ctx.beginPath();ctx.moveTo(x-r*0.04,y);ctx.lineTo(x,y-r*0.07);ctx.lineTo(x+r*0.04,y);ctx.fill();}}
    if(m.tooth){const x=L*0.55,y=r*0.08+L*(m.c*0.4+spread*0.3)-m.t*r*0.5;ctx.fillStyle=INK;ctx.beginPath();ctx.moveTo(x-r*0.05,y+r*0.02);ctx.lineTo(x,y-r*0.09);ctx.lineTo(x+r*0.05,y+r*0.02);ctx.fill();}
    ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(L*0.4,r*0.18+L*m.c*0.3,L*0.18,r*0.03,0.3,0,TAU);ctx.fill();
    ctx.restore();
  }
}
/* mantis-style raptorial forelegs, attached at the front of the prothorax (origin) and reaching forward */
function raptor(r,ext,col,dark,long){
  const k=long?1.45:1,e=clamp(ext,0,1.3);
  for(const s of [-1,1]){
    const bx=0,by=s*r*0.1;
    const cx=bx+r*0.3*k,cy=by+s*r*0.2;                                   // coxa
    const fx=cx+r*(0.42+e*0.45)*k,fy=cy+s*r*(0.08+e*0.08);              // knee (femur reaches forward)
    const tx=fx+(e>0.5?r*(0.3+e*0.15)*k:-r*0.34*k),ty=fy-s*r*(e>0.5?0.22:0.1); // tibia: folded back at rest, hooked forward when striking
    limb([[bx,by],[cx,cy]],Math.max(2.4,r*0.13),col);
    inked(()=>{ctx.beginPath();ctx.moveTo(cx,cy-s*r*0.07);ctx.quadraticCurveTo((cx+fx)/2,(cy+fy)/2-s*r*0.1,fx,fy-s*r*0.03);ctx.lineTo(fx,fy+s*r*0.05);ctx.quadraticCurveTo((cx+fx)/2,(cy+fy)/2+s*r*0.12,cx,cy+s*r*0.07);ctx.closePath();},col,1.4);
    ctx.fillStyle=dark;for(let i=1;i<5;i++){const t=i/5,x=cx+(fx-cx)*t,y=cy+(fy-cy)*t-s*r*0.06;ctx.beginPath();ctx.moveTo(x-r*0.03,y);ctx.lineTo(x+r*0.01,y-s*r*0.08);ctx.lineTo(x+r*0.04,y);ctx.fill();}
    inked(()=>{ctx.beginPath();ctx.moveTo(fx,fy-s*r*0.04);ctx.quadraticCurveTo((fx+tx)/2,(fy+ty)/2-s*r*0.1,tx,ty);ctx.quadraticCurveTo((fx+tx)/2,(fy+ty)/2+s*r*0.02,fx,fy+s*r*0.04);ctx.closePath();},shade(col,-0.08),1.3);
    dot(tx,ty,r*0.03,INK);
  }
}
/* crayfish claw at the end of an arm; drawn for side s */
function claw(r,ax,ay,ex,ey,size,open,col,s){
  limb([[ax,ay],[(ax+ex)/2,(ay+ey)/2+s*r*0.12],[ex,ey]],Math.max(2.4,r*0.16),col);
  const a=Math.atan2(ey-ay,ex-ax);
  ctx.save();ctx.translate(ex,ey);ctx.rotate(a);
  const L=r*size;
  inked(()=>{ctx.beginPath();ctx.moveTo(-L*0.1,-L*0.28*s);ctx.quadraticCurveTo(L*0.5,-L*0.42*s,L*1.05,-L*(0.08+open*0.18)*s);ctx.quadraticCurveTo(L*0.55,-L*0.02*s,L*0.28,L*0.02*s);ctx.lineTo(-L*0.1,L*0.22*s);ctx.closePath();},col,1.6);
  inked(()=>{ctx.beginPath();ctx.moveTo(L*0.28,L*0.06*s);ctx.quadraticCurveTo(L*0.6,L*(0.22+open*0.1)*s,L*0.95,L*(0.08+open*0.2)*s);ctx.quadraticCurveTo(L*0.55,L*0.08*s,L*0.28,L*0.16*s);ctx.closePath();},shade(col,-0.15),1.4);
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(L*0.35,-L*0.2*s,L*0.22,L*0.05,0,0,TAU);ctx.fill();
  ctx.fillStyle=INK;for(let i=1;i<4;i++){dot(L*(0.3+i*0.17),-L*0.04*s,L*0.025,INK);}
  ctx.restore();
}
function forceps(r,col,open){
  for(const s of [-1,1]){ctx.save();ctx.scale(1,s);
    inked(()=>{ctx.beginPath();ctx.moveTo(0,r*0.05);ctx.lineTo(0,r*0.2);ctx.quadraticCurveTo(-r*0.45,r*(0.32+open*0.15),-r*0.78,r*(0.06+open*0.1));ctx.lineTo(-r*0.7,r*0.0);ctx.quadraticCurveTo(-r*0.42,r*(0.16+open*0.1),-r*0.05,r*0.05);ctx.closePath();},col,Math.max(1.3,r*0.07));
    ctx.restore();}
}
function stinger(r,big,col){const L=r*(big?0.55:0.36);inked(()=>{ctx.beginPath();ctx.moveTo(0,-r*0.1);ctx.quadraticCurveTo(-L*0.6,-r*0.03,-L,0);ctx.quadraticCurveTo(-L*0.6,r*0.03,0,r*0.1);ctx.closePath();},col||'#3a2410',1.4);}

/* ---------- wings ---------- */
/* membranous wing hinged at (0,0) pointing toward angle a; length L, width w */
function wingShape(L,w){ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(L*0.25,-w*0.9,L*0.85,-w*0.85,L,-w*0.1);ctx.bezierCurveTo(L*0.95,w*0.55,L*0.4,w*0.6,0,0);ctx.closePath();}
function memWing(L,w,a,fill,vein){
  ctx.save();ctx.rotate(a);wingShape(L,w);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='rgba(42,33,24,.75)';ctx.lineWidth=1.2;ctx.stroke();
  ctx.strokeStyle=vein||'rgba(42,33,24,.32)';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(L*0.05,-w*0.05);ctx.quadraticCurveTo(L*0.5,-w*0.55,L*0.95,-w*0.15);ctx.moveTo(L*0.1,0);ctx.lineTo(L*0.8,w*0.15);ctx.moveTo(L*0.45,-w*0.5);ctx.lineTo(L*0.5,w*0.35);ctx.stroke();
  ctx.restore();
}
/* wings of bees/wasps/flies: hinge at thorax (hx), sweep backwards; flap = phase (radians) */
function sweptWings(r,hx,flap,o){
  o=o||{};const L=r*(o.len||1.05),w=r*(o.w||0.32),amp=o.amp??0.38,fill=o.fill||'rgba(232,242,250,.55)';
  const fl=Math.sin(flap);
  for(const s of [-1,1]){
    ctx.save();ctx.translate(hx*r,s*r*0.14);
    if(o.blur){ctx.globalAlpha=0.25;memWing(L,w,s*(Math.PI-0.55-amp),fill);memWing(L,w,s*(Math.PI-0.55+amp*0.6),fill);ctx.globalAlpha=1;}
    memWing(L,w,s*(Math.PI-0.55+fl*amp),fill,o.vein);           // forewing
    if(!o.single)memWing(L*0.72,w*0.85,s*(Math.PI-0.85+fl*amp*0.8),fill,o.vein); // hindwing
    ctx.restore();
  }
}
/* butterfly / moth wings: spread from body, flap foreshortens them */
function lepWings(r,T,flap,moth,fold){
  const k=fold?0.9:0.25+0.75*Math.abs(Math.cos(flap)),c1=T.wing||T.col,c2=T.wing2||INK;
  for(const s of [-1,1]){
    ctx.save();if(fold)ctx.rotate(s*fold);ctx.scale(1,s*k);
    if(moth){
      inked(()=>{ctx.beginPath();ctx.moveTo(r*0.2,r*0.05);ctx.quadraticCurveTo(r*0.4,r*1.0,r*0.15,r*1.45);ctx.quadraticCurveTo(-r*0.55,r*1.3,-r*0.95,r*0.55);ctx.quadraticCurveTo(-r*0.6,r*0.2,-r*0.2,r*0.05);ctx.closePath();},c1,1.6);
      ctx.strokeStyle=shade(c1.startsWith('#')?c1:'#8a7a66',-0.3);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(r*0.1,r*0.6);ctx.quadraticCurveTo(-r*0.3,r*0.8,-r*0.65,r*0.55);ctx.stroke();
      ctx.beginPath();ctx.ellipse(-r*0.15,r*0.75,r*0.14,r*0.1,0,0,TAU);ctx.stroke();dot(-r*0.15,r*0.75,r*0.05,INK);
      ctx.restore();continue;
    }
    // hindwing
    inked(()=>{ctx.beginPath();ctx.moveTo(-r*0.05,r*0.08);ctx.quadraticCurveTo(-r*0.1,r*1.0,-r*0.55,r*1.05);
      if(T.swallow){ctx.lineTo(-r*0.85,r*1.35);ctx.lineTo(-r*0.78,r*0.98);}
      ctx.quadraticCurveTo(-r*0.95,r*0.55,-r*0.4,r*0.08);ctx.closePath();},c1,1.5);
    // forewing
    inked(()=>{ctx.beginPath();ctx.moveTo(r*0.18,r*0.06);ctx.quadraticCurveTo(r*0.55,r*0.7,r*0.5,r*1.38);ctx.quadraticCurveTo(r*0.0,r*1.3,-r*0.25,r*0.75);ctx.quadraticCurveTo(-r*0.2,r*0.35,-r*0.02,r*0.06);ctx.closePath();},c1,1.5);
    // pattern: dark border + spots + veins
    ctx.save();ctx.beginPath();ctx.moveTo(r*0.18,r*0.06);ctx.quadraticCurveTo(r*0.55,r*0.7,r*0.5,r*1.38);ctx.quadraticCurveTo(r*0.0,r*1.3,-r*0.25,r*0.75);ctx.quadraticCurveTo(-r*0.2,r*0.35,-r*0.02,r*0.06);ctx.closePath();ctx.clip();
    ctx.strokeStyle=c2;ctx.lineWidth=r*0.16;ctx.beginPath();ctx.moveTo(r*0.55,r*0.6);ctx.quadraticCurveTo(r*0.55,r*1.4,-r*0.2,r*1.3);ctx.stroke();
    ctx.lineWidth=1;ctx.strokeStyle='rgba(42,33,24,.45)';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(r*0.05,r*0.1);ctx.lineTo(r*(0.5-i*0.22),r*(1.3-i*0.1));ctx.stroke();}
    if(T.swallow){ctx.fillStyle=c2;ctx.fillRect(r*0.05,r*0.25,r*0.5,r*0.1);ctx.fillRect(r*0.0,r*0.55,r*0.5,r*0.1);}
    if(T.id==='oomurasaki'){dot(r*0.25,r*0.85,r*0.08,'#f6f2e6');dot(r*0.05,r*1.0,r*0.07,'#f6f2e6');}
    else if(!T.swallow){dot(r*0.18,r*0.85,r*0.09,c2);}
    ctx.restore();
    if(T.swallow){dot(-r*0.62,r*0.88,r*0.07,'#c8452d');dot(-r*0.45,r*0.95,r*0.06,'#5f8fc9');}
    ctx.restore();
  }
}

/* ---------- bodies ---------- */
const BODY={};
BODY.ant=(T,r,o)=>{
  legs6(r,0.2,o.walk,{len:1.15,ty:0.1,w:Math.max(1.3,r*0.08)});
  ell(-0.62*r,0,0.5*r,0.4*r,o.col,1.8);
  ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1.2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(-0.62*r+(i-1)*r*0.2,0,r*0.06,r*0.36,0,-1.3,1.3);ctx.stroke();}
  gloss(-0.72*r,-0.17*r,r*0.2,r*0.07);
  ell(-0.1*r,0,0.1*r,0.1*r,o.col,1.4);
  ell(0.2*r,0,0.27*r,0.15*r,o.col,1.6);
  ctx.save();ctx.translate(0.92*r,0);mandibles(r,T.head||'ago',o.open,o.dark);ctx.restore();
  ell(0.68*r,0,0.28*r,0.27*r,o.col,1.8);
  antennae(r,0.82,1.0,1,{elbow:1,w:Math.max(1,r*0.06)});
  eyes(r,0.72,0.2,0.07);
};
BODY.earwig=(T,r,o)=>{
  legs6(r,0.32,o.walk,{len:0.8,ty:0.16,col:shade(o.col,0.25),w:Math.max(1.6,r*0.08)});
  ctx.save();ctx.translate(-0.98*r,0);forceps(r,o.dark,o.open);ctx.restore();
  inked(()=>{ctx.beginPath();ctx.moveTo(0.12*r,-0.3*r);ctx.quadraticCurveTo(-0.6*r,-0.36*r,-1.0*r,-0.18*r);ctx.lineTo(-1.0*r,0.18*r);ctx.quadraticCurveTo(-0.6*r,0.36*r,0.12*r,0.3*r);ctx.closePath();},o.col,1.8);
  ctx.strokeStyle='rgba(42,33,24,.4)';ctx.lineWidth=1.2;for(let i=0;i<5;i++){const x=-0.12*r-i*0.17*r;ctx.beginPath();ctx.moveTo(x,-0.32*r+i*0.02*r);ctx.quadraticCurveTo(x-0.05*r,0,x,0.32*r-i*0.02*r);ctx.stroke();}
  inked(()=>{ctx.beginPath();ctx.rect(0.06*r,-0.3*r,0.28*r,0.6*r);},shade(o.col,-0.2),1.5);
  ctx.strokeStyle='rgba(42,33,24,.5)';ctx.beginPath();ctx.moveTo(0.06*r,0);ctx.lineTo(0.34*r,0);ctx.stroke();
  ell(0.45*r,0,0.15*r,0.24*r,o.col,1.5);
  ell(0.72*r,0,0.19*r,0.2*r,o.dark,1.5);
  antennae(r,0.85,1.1,1,{w:1.1});
  eyes(r,0.78,0.13,0.05);
  gloss(-0.4*r,-0.15*r,r*0.25,r*0.05,0.3);
};
function hopLegs(r,col,hop,big){
  const L=big?1:0.9;
  for(const s of [-1,1]){
    const ax=-0.02*r,ay=s*r*0.28;
    const kx=ax-r*(0.85+hop*0.2)*L,ky=ay+s*r*(0.3+hop*0.3)*L;           // knee near abdomen tip
    const fx=kx+r*(0.5-hop*1.25)*L,fy=ky+s*r*(0.18+hop*0.1)*L;          // tibia folds forward (extends back on hop)
    inked(()=>{ctx.beginPath();ctx.moveTo(ax,ay-s*r*0.08);ctx.quadraticCurveTo((ax+kx)/2,(ay+ky)/2+s*r*0.36,kx,ky);ctx.quadraticCurveTo((ax+kx)/2,(ay+ky)/2-s*r*0.04,ax,ay+s*r*0.08);ctx.closePath();},col,1.6);
    ctx.strokeStyle='rgba(42,33,24,.35)';ctx.lineWidth=0.8;for(let i=1;i<5;i++){const t=i/5;ctx.beginPath();ctx.moveTo(ax+(kx-ax)*t,ay+(ky-ay)*t+s*r*0.1);ctx.lineTo(ax+(kx-ax)*(t+0.08),ay+(ky-ay)*(t+0.08)+s*r*0.02);ctx.stroke();}
    limb([[kx,ky],[fx,fy]],Math.max(1.4,r*0.07),null);
    ctx.fillStyle=INK;for(let i=1;i<4;i++){const t=i/4;dot(kx+(fx-kx)*t,ky+(fy-ky)*t-s*r*0.03,r*0.025,INK);}
  }
}
BODY.cricket=(T,r,o)=>{
  const batta=T.legs==='batta',hop=o.hop||0;
  legs6(r,0.3,o.walk,{len:0.85,ty:0.18,skip:[2],w:Math.max(1.3,r*0.07)});
  hopLegs(r,batta?shade(o.col,-0.05):shade(o.col,0.1),hop,batta);
  ell(-0.42*r,0,0.58*r,0.32*r,o.col,1.8);
  if(!batta){ctx.strokeStyle=o.dark;ctx.lineWidth=r*0.06;for(let i=0;i<4;i++){const x=-0.1*r-i*0.2*r;ctx.beginPath();ctx.ellipse(x,0,r*0.05,r*0.3,0,-1.3,1.3);ctx.stroke();}}
  inked(()=>{ctx.beginPath();ctx.moveTo(0.1*r,-0.3*r);ctx.quadraticCurveTo(0.3*r,-0.36*r,0.48*r,-0.24*r);ctx.lineTo(0.48*r,0.24*r);ctx.quadraticCurveTo(0.3*r,0.36*r,0.1*r,0.3*r);ctx.closePath();},batta?o.col:shade(o.col,-0.1),1.6);
  if(batta){/* folded forewings (tegmina) on top of the abdomen */
    for(const s of [-1,1])inked(()=>{ctx.beginPath();ctx.moveTo(0.15*r,s*r*0.03);ctx.quadraticCurveTo(-0.3*r,s*r*0.3,-1.15*r,s*r*0.06);ctx.quadraticCurveTo(-0.5*r,s*r*0.02,0.15*r,s*r*0.03);ctx.closePath();},shade(o.col,-0.12),1.3);
    ctx.strokeStyle='rgba(42,33,24,.3)';ctx.lineWidth=0.8;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(0.05*r,s*r*0.06);ctx.lineTo(-1.0*r,s*r*0.08);ctx.stroke();}
  }
  ell(0.62*r,0,0.2*r,0.21*r,o.col,1.6);
  antennae(r,0.75,batta?0.7:1.3,batta?0.6:0.5,batta?{w:1.1}:{back:1,w:1});
  eyes(r,0.68,0.15,0.06);
  if(!batta)gloss(-0.4*r,-0.12*r,r*0.25,r*0.06,0.35);
};
BODY.louse=(T,r,o)=>{
  ctx.strokeStyle=INK;ctx.lineWidth=1.1;ctx.lineCap='round';
  for(let i=0;i<7;i++)for(const s of [-1,1]){const x=r*(0.55-i*0.18),ph=Math.sin(o.walk*1.6+i*0.9+(s>0?1.5:0))*r*0.08;ctx.beginPath();ctx.moveTo(x,s*r*0.6);ctx.lineTo(x+ph,s*r*0.82);ctx.stroke();}
  for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(-0.9*r,s*r*0.12);ctx.lineTo(-1.12*r,s*r*0.22);ctx.stroke();}
  ell(0,0,1.0*r,0.72*r,o.col,2);
  ctx.save();ctx.beginPath();ctx.ellipse(0,0,1.0*r,0.72*r,0,0,TAU);ctx.clip();ctx.strokeStyle=o.dark;ctx.lineWidth=1.4;
  for(let i=0;i<7;i++){const x=r*(0.6-i*0.22);ctx.beginPath();ctx.ellipse(x,0,r*0.12,r*0.8,0,-1.4,1.4);ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(r*(0.5-i*0.22),-r*0.35,r*0.05,r*0.12,0,0,TAU);ctx.fill();}
  ctx.restore();
  gloss(-0.1*r,-0.36*r,r*0.42,r*0.09,0.35);
  ell(0.92*r,0,0.18*r,0.3*r,shade(o.col,-0.2),1.5);
  antennae(r,1.0,0.55,0.9,{w:1.1});
  eyes(r,0.98,0.17,0.05);
};
BODY.worm=(T,r,o)=>{
  const n=11,pts=[];
  for(let i=0;i<n;i++){const x=0.85*r-i*0.21*r,y=Math.sin(o.walk*0.8-i*0.75)*0.16*r;pts.push([x,y]);}
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(const p of pts)ctx.lineTo(p[0],p[1]);
  ctx.strokeStyle=INK;ctx.lineWidth=r*0.56+2.4;ctx.stroke();ctx.strokeStyle=o.col;ctx.lineWidth=r*0.56;ctx.stroke();
  ctx.strokeStyle='rgba(120,50,50,.35)';ctx.lineWidth=1;
  for(let i=1;i<n-1;i++){const [x,y]=pts[i],[x2,y2]=pts[i+1],a=Math.atan2(y2-y,x2-x)+Math.PI/2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*0.26,y+Math.sin(a)*r*0.26);ctx.lineTo(x-Math.cos(a)*r*0.26,y-Math.sin(a)*r*0.26);ctx.stroke();}
  ctx.strokeStyle=shade(o.col,-0.15);ctx.lineWidth=r*0.6;ctx.beginPath();ctx.moveTo(pts[2][0],pts[2][1]);ctx.lineTo(pts[3][0],pts[3][1]);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=r*0.1;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]-r*0.12);for(let i=1;i<n-1;i++)ctx.lineTo(pts[i][0],pts[i][1]-r*0.12);ctx.stroke();
};
BODY.centipede=(T,r,o)=>{
  const geji=o.type==='geji',n=geji?8:12,gap=geji?0.2:0.24,pts=[];
  for(let i=0;i<n;i++){const x=(geji?0.6:0.95)*r-i*gap*r,y=geji?0:Math.sin(o.walk*0.6-i*0.65)*0.13*r;pts.push([x,y]);}
  ctx.lineCap='round';
  for(let i=0;i<n;i++){const [x,y]=pts[i];
    for(const s of [-1,1]){const ph=Math.sin(o.walk*2+i*0.9+(s>0?Math.PI:0))*0.3;
      if(geji){const L=r*(1.25+i*0.08),a=s*(1.75+i*0.06)+ph*s*0.4;ctx.strokeStyle=INK;ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x,y+s*r*0.12);ctx.quadraticCurveTo(x+Math.cos(a)*L*0.55,y+Math.sin(a)*L*0.55-s*r*0.25,x+Math.cos(a+s*0.35)*L,y+Math.sin(a+s*0.35)*L);ctx.stroke();
        ctx.strokeStyle=o.col;ctx.lineWidth=0.7;ctx.setLineDash([2,3]);ctx.stroke();ctx.setLineDash([]);}
      else{const a=s*(1.6+i*0.04)+ph*s;limb([[x,y+s*r*0.18],[x+Math.cos(a)*r*0.32,y+s*r*0.18+Math.sin(a)*r*0.32],[x+Math.cos(a+s*0.5)*r*0.5,y+s*r*0.18+Math.sin(a+s*0.5)*r*0.5]],Math.max(1.2,r*0.06),o.dark);}
    }
  }
  if(!geji){for(const s of [-1,1]){const [x,y]=pts[n-1];limb([[x,y+s*r*0.1],[x-r*0.35,y+s*r*0.22],[x-r*0.6,y+s*r*0.18]],Math.max(1.3,r*0.07),o.dark);}}
  else{for(const s of [-1,1]){const [x,y]=pts[n-1];ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-r*0.8,y+s*r*0.3,x-r*1.9,y+s*r*0.45);ctx.stroke();}}
  for(let i=n-1;i>=0;i--){const [x,y]=pts[i],w=geji?0.22:0.24-(i>n-3?0.05:0);inked(ellP(x,y,r*gap*0.62,r*w),i%2?o.dark:o.col,1.3);}
  if(!geji){ctx.fillStyle='rgba(255,220,140,.35)';for(let i=1;i<n;i+=2){const [x,y]=pts[i];ctx.fillRect(x-r*0.03,y-r*0.2,r*0.06,r*0.4);}}
  const [hx,hy]=pts[0];
  ctx.save();ctx.translate(hx+r*0.15,hy);
  for(const s of [-1,1])inked(()=>{ctx.beginPath();ctx.moveTo(0,s*r*0.08);ctx.quadraticCurveTo(r*0.25,s*r*0.22,r*0.28,s*r*0.02);ctx.lineTo(r*0.2,s*r*0.06);ctx.quadraticCurveTo(r*0.12,s*r*0.14,0,s*r*0.02);ctx.closePath();},'#c8452d',1.1);
  ctx.restore();
  ell(hx+r*0.08,hy,r*0.16,r*0.2,o.col,1.4);
  ctx.save();ctx.translate(hx,hy);antennae(r,0.15,geji?2:1.4,geji?0.7:0.6,{w:1});ctx.restore();
};
BODY.beetle=(T,r,o)=>{
  legs6(r,0.12,o.walk,{len:0.95,ty:0.26,w:Math.max(1.6,r*0.09),col:o.dark===INK?null:shade(o.dark,0.1)});
  // elytra
  const el=()=>{ctx.beginPath();ctx.moveTo(0.18*r,-0.04*r);ctx.bezierCurveTo(0.2*r,-0.5*r,-0.2*r,-0.56*r,-0.6*r,-0.46*r);ctx.quadraticCurveTo(-1.02*r,-0.32*r,-1.08*r,0);ctx.quadraticCurveTo(-1.02*r,0.32*r,-0.6*r,0.46*r);ctx.bezierCurveTo(-0.2*r,0.56*r,0.2*r,0.5*r,0.18*r,0.04*r);ctx.closePath();};
  inked(el,o.col,2);
  ctx.save();el();ctx.clip();
  ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=1;for(const s of [-1,1])for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(0.1*r,s*r*i*0.12);ctx.quadraticCurveTo(-0.5*r,s*r*(i*0.13+0.03),-1.0*r,s*r*i*0.04);ctx.stroke();}
  if(o.type==='gomimushi'){for(const [x,y] of [[-0.15,0.25],[-0.15,-0.25],[-0.7,0.22],[-0.7,-0.22]]){ctx.fillStyle=o.dark;ctx.beginPath();ctx.ellipse(x*r,y*r,r*0.16,r*0.1,0,0,TAU);ctx.fill();}}
  ctx.restore();
  ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0.18*r,0);ctx.lineTo(-1.06*r,0);ctx.stroke();
  gloss(-0.4*r,-0.28*r,r*0.32,r*0.07,0.4);
  // pronotum
  const big=T.head==='kuwa'||T.head==='hirata';
  inked(()=>{ctx.beginPath();ctx.moveTo(0.14*r,-0.42*r);ctx.quadraticCurveTo(0.5*r,-0.46*r,0.52*r,-0.22*r);ctx.lineTo(0.52*r,0.22*r);ctx.quadraticCurveTo(0.5*r,0.46*r,0.14*r,0.42*r);ctx.quadraticCurveTo(0.2*r,0,0.14*r,-0.42*r);ctx.closePath();},o.dark===INK?shade(o.col,-0.15):o.col,1.8);
  gloss(0.32*r,-0.2*r,r*0.12,r*0.05,0.35);
  // head
  ctx.save();ctx.translate((big?0.86:0.78)*r,0);mandibles(r,T.head||'ago',o.open,o.dark===INK?'#3a2418':shade(o.dark,0.05));ctx.restore();
  ell(0.66*r,0,(big?0.22:0.17)*r,(big?0.32:0.24)*r,o.dark===INK?shade(o.col,-0.25):o.dark,1.6);
  antennae(r,0.78,0.7,0.8,{elbow:big||T.head==='kokuwa',w:1.1});
  eyes(r,0.7,big?0.27:0.2,0.05,'#1a120a');
};
BODY.dome=(T,r,o)=>{
  legs6(r,0.02,o.walk,{len:0.7,ty:0.3,w:Math.max(1.4,r*0.08)});
  ell(-0.1*r,0,0.84*r,0.8*r,o.col,2.2);
  ctx.save();ctx.beginPath();ctx.ellipse(-0.1*r,0,0.84*r,0.8*r,0,0,TAU);ctx.clip();
  if(T.spots){for(const [x,y,s] of [[0.15,-0.42,0.15],[0.15,0.42,0.15],[-0.42,-0.5,0.17],[-0.42,0.5,0.17],[-0.1,0,0.16],[-0.72,-0.24,0.12],[-0.72,0.24,0.12]])dot(r*x,r*y,r*s,INK);}
  if(T.metal){const g=ctx.createLinearGradient(0,-r*0.8,0,r*0.8);g.addColorStop(0,'rgba(255,255,230,.45)');g.addColorStop(0.45,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.25)');ctx.fillStyle=g;ctx.fillRect(-r,-r,2*r,2*r);}
  if(o.type==='hanamuguri'){ctx.fillStyle='#f4ead2';for(let i=0;i<9;i++)dot(r*(-0.8+hash(i)*1.2),r*(-0.6+hash(i+7)*1.2),r*0.05,'#f4ead2');}
  if(o.type==='sumou'){ctx.fillStyle='#f4ead2';ctx.fillRect(-0.15*r,-r,0.22*r,2*r);ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.strokeRect(-0.15*r,-r,0.22*r,2*r);ctx.strokeStyle='#c8452d';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-0.04*r,-r);ctx.lineTo(-0.04*r,r);ctx.stroke();}
  ctx.restore();
  ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0.48*r,0);ctx.lineTo(-0.92*r,0);ctx.stroke();
  gloss(-0.25*r,-0.38*r,r*0.36,r*0.1,T.metal?0.6:0.45);
  inked(()=>{ctx.beginPath();ctx.ellipse(0.55*r,0,0.18*r,0.42*r,0,-Math.PI/2,Math.PI/2);ctx.closePath();},T.spots?INK:shade(o.col,-0.2),1.6);
  if(T.spots){dot(0.6*r,-0.24*r,r*0.08,'#f4ead2');dot(0.6*r,0.24*r,r*0.08,'#f4ead2');}
  ell(0.76*r,0,0.1*r,0.2*r,T.spots?INK:shade(o.col,-0.35),1.4);
  antennae(r,0.82,0.45,0.9,{club:1,w:1});
};
BODY.shield=(T,r,o)=>{
  legs6(r,0.15,o.walk,{len:0.8,ty:0.3,w:Math.max(1.4,r*0.08),col:shade(o.col,0.2)});
  const sh=()=>{ctx.beginPath();ctx.moveTo(0.52*r,-0.38*r);ctx.lineTo(0.3*r,-0.72*r);ctx.lineTo(-0.85*r,-0.5*r);ctx.quadraticCurveTo(-1.18*r,0,-0.85*r,0.5*r);ctx.lineTo(0.3*r,0.72*r);ctx.lineTo(0.52*r,0.38*r);ctx.closePath();};
  inked(sh,o.col,2.2);
  ctx.save();sh();ctx.clip();
  ctx.fillStyle='rgba(42,33,24,.28)';ctx.beginPath();ctx.moveTo(-0.6*r,-0.5*r);ctx.quadraticCurveTo(-1.2*r,0,-0.6*r,0.5*r);ctx.lineTo(-1.3*r,0.6*r);ctx.lineTo(-1.3*r,-0.6*r);ctx.fill();
  ctx.fillStyle='rgba(42,33,24,.18)';for(let i=0;i<30;i++)dot(r*(-0.8+hash(i*3)*1.2),r*(-0.6+hash(i*5)*1.2),r*0.025,'rgba(42,33,24,.25)');
  ctx.restore();
  inked(()=>{ctx.beginPath();ctx.moveTo(0.3*r,-0.32*r);ctx.lineTo(-0.55*r,0);ctx.lineTo(0.3*r,0.32*r);ctx.closePath();},o.dark,1.5);
  gloss(0.05*r,-0.42*r,r*0.25,r*0.06,0.3);
  ell(0.66*r,0,0.17*r,0.2*r,o.col,1.5);
  antennae(r,0.78,0.8,0.8,{w:1.1});
  eyes(r,0.7,0.17,0.05);
};
BODY.spider=(T,r,o)=>{
  const jor=o.type==='jorou'||o.type==='kumo';
  const ang=[0.55,1.15,1.85,2.45];
  for(let i=0;i<4;i++)for(const s of [-1,1]){
    const ph=Math.sin(o.walk+(i%2?Math.PI:0)+(s>0?Math.PI:0))*0.16,a=s*(ang[i]-ph),L=r*(i===0||i===3?1.55:1.3)*(o.dead?0.6:1);
    const ax=0.3*r+Math.cos(a)*r*0.2,ay=Math.sin(a)*r*0.2;
    const kx=ax+Math.cos(a)*L*0.48,ky=ay+Math.sin(a)*L*0.48,b=a+s*(i<2?-0.35:0.35),fx=kx+Math.cos(b)*L*0.6,fy=ky+Math.sin(b)*L*0.6;
    limb([[ax,ay],[kx,ky],[fx,fy]],Math.max(1.5,r*0.08),jor?'#2f2a24':null);
    if(jor){ctx.strokeStyle='#e9c040';ctx.lineWidth=Math.max(1.2,r*0.06);ctx.beginPath();ctx.moveTo(ax+(kx-ax)*0.45,ay+(ky-ay)*0.45);ctx.lineTo(ax+(kx-ax)*0.75,ay+(ky-ay)*0.75);ctx.moveTo(kx+(fx-kx)*0.3,ky+(fy-ky)*0.3);ctx.lineTo(kx+(fx-kx)*0.55,ky+(fy-ky)*0.55);ctx.stroke();}
  }
  inked(ellP(-0.58*r,0,0.72*r,0.46*r),o.col,2);
  ctx.save();ctx.beginPath();ctx.ellipse(-0.58*r,0,0.72*r,0.46*r,0,0,TAU);ctx.clip();
  if(jor){ctx.fillStyle='#5f8fc9';for(const s of [-1,1]){ctx.fillRect(-1.3*r,s*r*0.18-r*0.04,r*1.1,r*0.08);}ctx.fillStyle='#2f2a24';ctx.fillRect(-1.3*r,-r*0.03,r*1.1,r*0.06);ctx.fillStyle='#c8452d';ctx.beginPath();ctx.ellipse(-1.15*r,0,r*0.12,r*0.18,0,0,TAU);ctx.fill();}
  ctx.restore();
  gloss(-0.6*r,-0.24*r,r*0.3,r*0.07,0.35);
  ell(0.28*r,0,0.34*r,0.3*r,o.dark,1.8);
  ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0.05*r,0);ctx.lineTo(0.45*r,0);ctx.stroke();
  for(const s of [-1,1])limb([[0.55*r,s*r*0.1],[0.75*r,s*r*0.2],[0.82*r,s*r*0.12]],Math.max(1.2,r*0.06),o.dark);
  for(const [x,y,z] of [[0.56,-0.07,0.055],[0.56,0.07,0.055],[0.5,-0.16,0.04],[0.5,0.16,0.04],[0.46,-0.05,0.03],[0.46,0.05,0.03]])dot(x*r,y*r,z*r,'#f4ead2');
};
BODY.mantis=(T,r,o)=>{
  legs6(r,-0.05,o.walk,{len:1.35,ty:0.1,skip:[0],sp:1.3,w:Math.max(1.3,r*0.07),col:shade(o.col,-0.05)});
  ell(-0.78*r,0,0.62*r,0.26*r,o.col,1.8);
  ctx.strokeStyle='rgba(42,33,24,.3)';ctx.lineWidth=1;for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(-0.45*r-i*0.16*r,0,r*0.04,r*0.24,0,-1.3,1.3);ctx.stroke();}
  // folded wings on top
  inked(()=>{ctx.beginPath();ctx.moveTo(0.05*r,0);ctx.quadraticCurveTo(-0.5*r,-0.34*r,-1.32*r,-0.04*r);ctx.quadraticCurveTo(-0.6*r,0.3*r,0.05*r,0);ctx.closePath();},'rgba(160,200,100,.55)',1.3);
  ctx.strokeStyle='rgba(42,33,24,.3)';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-1.25*r,-0.02*r);ctx.stroke();
  inked(()=>{ctx.beginPath();ctx.rect(0.02*r,-0.08*r,0.85*r,0.16*r);},o.col,1.5);
  ctx.save();ctx.translate(0.72*r,0);raptor(r,o.ext||0,o.col,o.dark);ctx.restore();
  inked(()=>{ctx.beginPath();ctx.moveTo(0.86*r,-0.22*r);ctx.quadraticCurveTo(1.0*r,-0.36*r,1.06*r,-0.3*r);ctx.lineTo(1.2*r,0);ctx.lineTo(1.06*r,0.3*r);ctx.quadraticCurveTo(1.0*r,0.36*r,0.86*r,0.22*r);ctx.closePath();},o.col,1.6);
  for(const s of [-1,1]){dot(1.03*r,s*0.27*r,r*0.09,shade(o.col,-0.3));dot(1.05*r,s*0.25*r,r*0.03,'#f4ead2');}
  antennae(r,1.15,1.1,0.5,{w:1});
};
BODY.watermantis=(T,r,o)=>{
  legs6(r,-0.05,o.walk,{len:1.7,ty:0.06,skip:[0],sp:1.6,w:1.2});
  ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-1.05*r,0);ctx.lineTo(-1.95*r,Math.sin(ART_T*2)*0.06*r);ctx.stroke();
  inked(()=>{ctx.beginPath();ctx.moveTo(1.0*r,-0.06*r);ctx.lineTo(-1.08*r,-0.09*r);ctx.lineTo(-1.08*r,0.09*r);ctx.lineTo(1.0*r,0.06*r);ctx.closePath();},o.col,1.5);
  ctx.strokeStyle='rgba(42,33,24,.3)';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(-0.1*r,0);ctx.lineTo(-1.05*r,0);ctx.stroke();
  ctx.save();ctx.translate(0.82*r,0);raptor(r,o.ext||0,o.col,o.dark,true);ctx.restore();
  ell(1.06*r,0,0.1*r,0.13*r,o.col,1.3);
  eyes(r,1.08,0.11,0.05);
};
BODY.strider=(T,r,o)=>{
  const sw=Math.sin(o.walk*0.7)*0.15;
  ctx.strokeStyle=INK;ctx.lineCap='round';ctx.lineWidth=1.3;
  const feet=[];
  for(const s of [-1,1]){
    ctx.beginPath();ctx.moveTo(0.4*r,s*r*0.08);ctx.lineTo(0.75*r,s*r*0.28);ctx.lineTo(0.95*r,s*r*0.22);ctx.stroke();
    let kx=0.05*r,ky=s*r*0.5;ctx.beginPath();ctx.moveTo(0.05*r,s*r*0.08);ctx.lineTo(kx,ky);const fx=kx-r*(0.4+sw*s),fy=ky+s*r*1.6;ctx.lineTo(fx,fy);ctx.stroke();feet.push([fx,fy]);
    kx=-0.2*r;ky=s*r*0.38;ctx.beginPath();ctx.moveTo(-0.1*r,s*r*0.08);ctx.lineTo(kx,ky);const gx=kx-r*1.7,gy=ky+s*r*(0.55-sw*s*0.5);ctx.lineTo(gx,gy);ctx.stroke();feet.push([gx,gy]);
  }
  if(o.water){ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1;for(const [x,y] of feet){ctx.beginPath();ctx.ellipse(x,y,r*0.2,r*0.12,0,0,TAU);ctx.stroke();}}
  inked(ellP(-0.1*r,0,0.75*r,0.16*r),o.col,1.6);
  ell(0.72*r,0,0.15*r,0.12*r,o.dark,1.3);
  antennae(r,0.82,0.5,0.6,{w:1});
  gloss(-0.2*r,-0.06*r,r*0.4,r*0.03,0.3);
};
BODY.crayfish=(T,r,o)=>{
  const open=o.open||0.3;
  legs6(r,0.1,o.walk,{len:0.85,ty:0.28,w:Math.max(1.4,r*0.07),col:shade(o.col,0.1)});
  // tail with fan
  for(let i=4;i>=0;i--){const x=-0.38*r-i*0.17*r,w=0.32-i*0.03;inked(ellP(x,0,r*0.12,r*w),i%2?o.col:shade(o.col,-0.08),1.3);}
  for(let k=-2;k<=2;k++){inked(()=>{ctx.beginPath();ctx.moveTo(-1.08*r,k*r*0.04);ctx.lineTo(-1.38*r,k*r*0.14-r*0.06);ctx.quadraticCurveTo(-1.45*r,k*r*0.14,-1.38*r,k*r*0.14+r*0.06);ctx.closePath();},shade(o.col,-0.1),1.1);}
  // claws
  for(const s of [-1,1]){const g=o.guard?0.75:1;claw(r,0.4*r,s*r*0.3,(0.75+open*0.1)*r,s*r*(0.62*g),0.62,open,o.col,s);}
  // carapace + rostrum
  inked(()=>{ctx.beginPath();ctx.moveTo(-0.35*r,-0.38*r);ctx.quadraticCurveTo(0.35*r,-0.5*r,0.7*r,-0.15*r);ctx.lineTo(0.95*r,0);ctx.lineTo(0.7*r,0.15*r);ctx.quadraticCurveTo(0.35*r,0.5*r,-0.35*r,0.38*r);ctx.quadraticCurveTo(-0.45*r,0,-0.35*r,-0.38*r);ctx.closePath();},o.col,2);
  ctx.strokeStyle='rgba(42,33,24,.4)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0.2*r,-0.32*r);ctx.quadraticCurveTo(0.05*r,0,0.2*r,0.32*r);ctx.stroke();
  ctx.fillStyle='rgba(42,33,24,.25)';for(let i=0;i<12;i++)dot(r*(-0.25+hash(i*7)*0.8),r*(-0.3+hash(i*11)*0.6),r*0.03,'rgba(42,33,24,.25)');
  gloss(0.15*r,-0.22*r,r*0.3,r*0.07,0.45);
  for(const s of [-1,1]){ctx.strokeStyle=INK;ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(0.7*r,s*r*0.08);ctx.bezierCurveTo(1.3*r,s*r*0.3,0.8*r,s*r*1.1,-0.6*r,s*r*(1.0+Math.sin(ART_T*2+s)*0.08));ctx.stroke();
    ctx.beginPath();ctx.moveTo(0.78*r,s*r*0.05);ctx.lineTo(1.15*r,s*r*0.16);ctx.stroke();
    dot(0.78*r,s*r*0.16,r*0.06,INK);}
};
BODY.bee=(T,r,o)=>{
  legsHang(r,0.15,0.8,Math.max(1.1,r*0.07));
  if(o.type==='mitsubachi'||T.crown){ctx.save();ctx.translate(-1.0*r,0);stinger(r,false,'#3a2410');ctx.restore();}
  ell(-0.48*r,0,0.56*r,0.42*r,o.col,1.8);
  ctx.save();ctx.beginPath();ctx.ellipse(-0.48*r,0,0.56*r,0.42*r,0,0,TAU);ctx.clip();ctx.fillStyle=T.big&&!T.crown?'#2a2420':o.dark;
  for(let i=0;i<3;i++)ctx.fillRect(-r*(0.22+i*0.25),-r,r*0.11,2*r);ctx.restore();
  gloss(-0.5*r,-0.22*r,r*0.25,r*0.06,0.3);
  // fuzzy thorax
  const thc=T.big&&!T.crown?o.dark:shade(o.col,-0.25);
  ctx.save();ctx.translate(1.4,1.6);ctx.fillStyle=thc;ctx.beginPath();for(let k=0;k<20;k++){const a=k/20*TAU,rr=r*(0.34+(k%2)*0.04);ctx.lineTo(0.12*r+Math.cos(a)*rr,Math.sin(a)*rr*0.95);}ctx.closePath();ctx.fill();ctx.restore();
  ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();for(let k=0;k<20;k++){const a=k/20*TAU,rr=r*(0.34+(k%2)*0.04);ctx.lineTo(0.12*r+Math.cos(a)*rr,Math.sin(a)*rr*0.95);}ctx.closePath();ctx.stroke();
  sweptWings(r,0.16,o.flap,{blur:true,len:T.big?1.0:1.05,w:0.3,fill:T.big&&!T.crown?'rgba(80,70,90,.45)':'rgba(232,242,250,.55)'});
  ell(0.55*r,0,0.2*r,0.25*r,INK===o.dark?'#2a2118':shade(o.dark,0.0),1.6);
  for(const s of [-1,1]){ctx.fillStyle='#1a120a';ctx.beginPath();ctx.ellipse(0.55*r,s*0.18*r,r*0.12,r*0.07,s*0.3,0,TAU);ctx.fill();}
  antennae(r,0.68,0.55,0.8,{elbow:1,w:1.1});
  if(T.crown){ctx.save();ctx.translate(0.52*r,0);inked(()=>{ctx.beginPath();ctx.moveTo(-0.12*r,-0.22*r);ctx.lineTo(-0.12*r,0.22*r);ctx.lineTo(0.12*r,0.22*r);ctx.lineTo(0.02*r,0.12*r);ctx.lineTo(0.12*r,0);ctx.lineTo(0.02*r,-0.12*r);ctx.lineTo(0.12*r,-0.22*r);ctx.closePath();},'#f2b632',1.3);dot(0.02*r,0,r*0.04,'#c8452d');ctx.restore();}
};
BODY.wasp=(T,r,o)=>{
  legsHang(r,0.25,1.15,Math.max(1.1,r*0.07));
  ctx.save();ctx.translate(-1.08*r,0);stinger(r,T.big,o.dark===INK?'#3a2410':o.dark);ctx.restore();
  const ab=()=>{ctx.beginPath();ctx.moveTo(-0.02*r,0);ctx.bezierCurveTo(-0.15*r,-0.42*r,-0.85*r,-0.42*r,-1.1*r,0);ctx.bezierCurveTo(-0.85*r,0.42*r,-0.15*r,0.42*r,-0.02*r,0);ctx.closePath();};
  inked(ab,o.col,1.8);
  ctx.save();ab();ctx.clip();ctx.fillStyle=o.dark;for(let i=0;i<4;i++)ctx.fillRect(-r*(0.25+i*0.22),-r,r*0.09,2*r);ctx.restore();
  gloss(-0.5*r,-0.18*r,r*0.25,r*0.05,0.35);
  ell(0.3*r,0,0.28*r,0.24*r,o.dark,1.6);
  ctx.fillStyle=o.col;ctx.fillRect(0.18*r,-0.14*r,0.06*r,0.28*r);
  sweptWings(r,0.32,o.flap,{blur:true,len:1.0,w:0.24,fill:'rgba(220,200,150,.45)',amp:0.32});
  ell(0.7*r,0,0.22*r,0.26*r,o.col,1.6);
  for(const s of [-1,1]){ctx.fillStyle=o.dark;ctx.beginPath();ctx.ellipse(0.68*r,s*0.18*r,r*0.12,r*0.08,s*0.4,0,TAU);ctx.fill();}
  antennae(r,0.85,0.55,0.75,{elbow:1,w:1.1});
};
BODY.fly=(T,r,o)=>{
  legsHang(r,0.2,0.9,1.1);
  ell(-0.45*r,0,0.5*r,0.38*r,o.col,1.7);
  ctx.save();ctx.beginPath();ctx.ellipse(-0.45*r,0,0.5*r,0.38*r,0,0,TAU);ctx.clip();ctx.fillStyle=o.dark;for(let i=0;i<3;i++)ctx.fillRect(-r*(0.2+i*0.22),-r,r*0.08,2*r);ctx.restore();
  ell(0.18*r,0,0.3*r,0.3*r,shade(o.col,-0.2),1.6);
  ctx.strokeStyle='rgba(42,33,24,.4)';ctx.lineWidth=1;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(0.0,s*r*0.08);ctx.lineTo(0.38*r,s*r*0.08);ctx.stroke();}
  sweptWings(r,0.15,o.flap,{blur:true,single:true,len:1.05,w:0.32,amp:0.35});
  ell(0.6*r,0,0.18*r,0.32*r,shade(o.col,-0.1),1.5);
  for(const s of [-1,1]){inked(ellP(0.6*r,s*0.18*r,0.17*r,0.15*r),'#a2412b',1.3);dot(0.64*r,s*0.13*r,r*0.04,'rgba(255,255,255,.7)');}
};
BODY.butterfly=(T,r,o)=>{
  lepWings(r,Object.assign({id:o.type},T),o.flap,false);
  ell(-0.15*r,0,0.72*r,0.11*r,INK,1.2);
  ell(0.25*r,0,0.22*r,0.14*r,'#3a3026',1.3);
  ell(0.5*r,0,0.1*r,0.1*r,INK,1.2);
  antennae(r,0.55,0.9,0.6,{club:1,w:1});
};
BODY.moth=(T,r,o)=>{
  lepWings(r,T,o.flap*0.6,true);
  ell(-0.2*r,0,0.65*r,0.2*r,shade(o.col,-0.15),1.4);
  ctx.strokeStyle='rgba(42,33,24,.35)';ctx.lineWidth=1;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(-0.1*r-i*0.15*r,0,r*0.03,r*0.18,0,-1.3,1.3);ctx.stroke();}
  ell(0.32*r,0,0.22*r,0.2*r,shade(o.col,0.1),1.4);
  ell(0.55*r,0,0.1*r,0.12*r,shade(o.col,-0.3),1.2);
  antennae(r,0.6,0.8,0.9,{feather:1,w:1.1});
};
BODY.cicada=(T,r,o)=>{
  legs6(r,0.25,o.walk,{len:0.6,ty:0.2,w:Math.max(1.3,r*0.07)});
  ell(-0.38*r,0,0.62*r,0.4*r,shade(o.col,-0.15),1.7);
  const wf=o.flying?Math.sin(o.flap)*0.4:0;
  /* folded tent wings from the thorax back past the tail */
  for(const s of [-1,1]){
    ctx.save();ctx.translate(0.22*r,s*r*0.16);ctx.rotate(s*(wf*0.8));
    const wfill=o.type==='semi'?'rgba(122,92,58,.9)':'rgba(220,235,240,.55)';
    inked(()=>{ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-0.3*r,s*r*0.32,-1.1*r,s*r*0.36,-1.52*r,s*r*0.06);ctx.quadraticCurveTo(-1.4*r,-s*r*0.1,-1.0*r,-s*r*0.1);ctx.quadraticCurveTo(-0.4*r,-s*r*0.06,0,0);ctx.closePath();},wfill,1.4);
    ctx.strokeStyle='rgba(42,33,24,.4)';ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(-0.05*r,s*r*0.05);ctx.quadraticCurveTo(-0.7*r,s*r*0.3,-1.4*r,s*r*0.08);ctx.moveTo(-0.6*r,s*r*0.22);ctx.lineTo(-0.75*r,-s*r*0.04);ctx.moveTo(-1.0*r,s*r*0.22);ctx.lineTo(-1.15*r,-s*r*0.02);ctx.stroke();
    ctx.restore();
  }
  inked(()=>{ctx.beginPath();ctx.moveTo(0.05*r,-0.36*r);ctx.quadraticCurveTo(0.55*r,-0.48*r,0.62*r,-0.2*r);ctx.lineTo(0.62*r,0.2*r);ctx.quadraticCurveTo(0.55*r,0.48*r,0.05*r,0.36*r);ctx.quadraticCurveTo(-0.08*r,0,0.05*r,-0.36*r);ctx.closePath();},o.col,1.8);
  ctx.strokeStyle=o.dark;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0.1*r,-0.2*r);ctx.lineTo(0.35*r,-0.08*r);ctx.lineTo(0.2*r,0);ctx.lineTo(0.35*r,0.08*r);ctx.lineTo(0.1*r,0.2*r);ctx.stroke();
  ell(0.72*r,0,0.14*r,0.4*r,o.dark,1.6);
  for(const s of [-1,1]){dot(0.72*r,s*0.38*r,r*0.1,'#5a2a1e');dot(0.74*r,s*0.36*r,r*0.03,'rgba(255,255,255,.7)');}
  dot(0.76*r,0,r*0.04,'#c8452d');
};
BODY.longhorn=(T,r,o)=>{
  legs6(r,0.18,o.walk,{len:1.05,ty:0.24,w:Math.max(1.4,r*0.08)});
  const el=()=>{ctx.beginPath();ctx.moveTo(0.25*r,-0.38*r);ctx.lineTo(-0.95*r,-0.3*r);ctx.quadraticCurveTo(-1.15*r,0,-0.95*r,0.3*r);ctx.lineTo(0.25*r,0.38*r);ctx.closePath();};
  inked(el,o.col,2);
  ctx.save();el();ctx.clip();for(const [x,y,z] of [[-0.05,-0.2,0.08],[-0.35,0.22,0.09],[-0.6,-0.12,0.07],[-0.8,0.18,0.06],[0.1,0.18,0.06],[-0.45,-0.28,0.05],[-0.2,0.05,0.05]])dot(x*r,y*r,z*r,'#e8eef8');ctx.restore();
  ctx.strokeStyle=INK;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(0.25*r,0);ctx.lineTo(-1.08*r,0);ctx.stroke();
  gloss(-0.3*r,-0.18*r,r*0.35,r*0.05,0.4);
  inked(()=>{ctx.beginPath();ctx.moveTo(0.22*r,-0.26*r);ctx.lineTo(0.5*r,-0.22*r);ctx.lineTo(0.56*r,-0.34*r);ctx.lineTo(0.6*r,-0.2*r);ctx.lineTo(0.6*r,0.2*r);ctx.lineTo(0.56*r,0.34*r);ctx.lineTo(0.5*r,0.22*r);ctx.lineTo(0.22*r,0.26*r);ctx.closePath();},o.col,1.6);
  dot(0.42*r,-0.1*r,r*0.05,'#e8eef8');dot(0.42*r,0.1*r,r*0.05,'#e8eef8');
  ctx.save();ctx.translate(0.88*r,0);mandibles(r,'kamikiri',o.open,'#1a1a22');ctx.restore();
  ell(0.74*r,0,0.16*r,0.2*r,o.col,1.5);
  antennae(r,0.8,1.15,1,{back:1,w:Math.max(1.4,r*0.08),band:'#c8d8f0'});
};
BODY.bagworm=(T,r,o)=>{
  const sway=Math.sin(ART_T*1.5)*0.03;
  ctx.save();ctx.rotate(sway);
  for(const s of [-1,1])for(let i=0;i<3;i++){ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.lineCap='round';const x=0.72*r-i*0.1*r,ph=Math.sin(o.walk+i+(s>0?2:0))*0.06*r;ctx.beginPath();ctx.moveTo(x,s*r*0.12);ctx.lineTo(x+r*0.12+ph,s*r*0.3);ctx.stroke();}
  const bag=()=>{ctx.beginPath();ctx.moveTo(0.7*r,0);ctx.bezierCurveTo(0.6*r,-0.7*r,-0.9*r,-0.75*r,-1.25*r,0);ctx.bezierCurveTo(-0.9*r,0.75*r,0.6*r,0.7*r,0.7*r,0);ctx.closePath();};
  inked(bag,o.col,2.2);
  ctx.save();bag();ctx.clip();
  for(let i=0;i<22;i++){const x=r*(0.55-hash(i*3.1)*1.7),y=r*(hash(i*5.3)-0.5)*1.1,a=(hash(i*7.7)-0.5)*0.9,L=r*(0.25+hash(i)*0.25);
    if(i%3===0){ctx.fillStyle=i%2?'#9a8a5a':'#7a6a42';ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,0,L*0.6,L*0.25,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(42,33,24,.4)';ctx.lineWidth=0.8;ctx.stroke();ctx.restore();}
    else{ctx.strokeStyle=i%2?o.dark:'#6a5a3a';ctx.lineWidth=r*0.07;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-Math.cos(a)*L,y-Math.sin(a)*L);ctx.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L);ctx.stroke();}}
  ctx.restore();
  ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-1.25*r,0);ctx.lineTo(-1.5*r,0);ctx.stroke();
  inked(ellP(0.74*r,0,0.17*r,0.16*r),'#2a2118',1.4);
  ctx.strokeStyle='#e8d8b0';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0.68*r,-0.06*r);ctx.lineTo(0.82*r,0);ctx.lineTo(0.68*r,0.06*r);ctx.stroke();
  ctx.restore();
};
BODY.larva=(T,r,o)=>{
  const br=1+Math.sin(ART_T*2)*0.03,n=9;
  for(let i=n-1;i>=0;i--){const a=-2.3+i/(n-1)*4.0,x=Math.cos(a)*0.55*r*br-0.1*r,y=Math.sin(a)*0.55*r,rr=r*(0.3+0.06*Math.sin(i/(n-1)*Math.PI));
    inked(ellP(x,y,rr,rr*0.92),o.col,1.4);dot(x+rr*0.3,y-rr*0.3,rr*0.18,'rgba(255,255,255,.4)');}
  const ha=-2.3,hx=Math.cos(ha)*0.55*r-0.1*r,hy=Math.sin(ha)*0.55*r;
  for(let k=0;k<3;k++){ctx.strokeStyle=INK;ctx.lineWidth=1.3;const a=ha+0.5+k*0.3;ctx.beginPath();ctx.moveTo(hx+Math.cos(a)*r*0.3,hy+Math.sin(a)*r*0.3);ctx.lineTo(hx+Math.cos(a)*r*0.5,hy+Math.sin(a)*r*0.5);ctx.stroke();}
  inked(ellP(hx-0.05*r,hy-0.12*r,0.24*r,0.22*r),o.dark,1.5);
  dot(hx-0.1*r,hy-0.22*r,r*0.05,'#1a120a');
};
BODY.kabuto=(T,r,o)=>{
  legs6(r,0.12,o.walk,{len:1.0,ty:0.3,w:Math.max(2,r*0.1),col:shade(o.dark,0.15)});
  const el=()=>{ctx.beginPath();ctx.moveTo(0.12*r,-0.04*r);ctx.bezierCurveTo(0.14*r,-0.66*r,-0.5*r,-0.7*r,-0.85*r,-0.5*r);ctx.quadraticCurveTo(-1.18*r,-0.25*r,-1.18*r,0);ctx.quadraticCurveTo(-1.18*r,0.25*r,-0.85*r,0.5*r);ctx.bezierCurveTo(-0.5*r,0.7*r,0.14*r,0.66*r,0.12*r,0.04*r);ctx.closePath();};
  inked(el,o.col,2.4);
  ctx.save();el();ctx.clip();const g=ctx.createLinearGradient(0,-0.7*r,0,0.7*r);g.addColorStop(0,'rgba(255,220,170,.35)');g.addColorStop(0.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.25)');ctx.fillStyle=g;ctx.fillRect(-1.3*r,-r,1.5*r,2*r);ctx.restore();
  ctx.strokeStyle=INK;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0.12*r,0);ctx.lineTo(-1.16*r,0);ctx.stroke();
  gloss(-0.45*r,-0.35*r,r*0.42,r*0.09,0.45);
  inked(()=>{ctx.beginPath();ctx.moveTo(0.08*r,-0.5*r);ctx.quadraticCurveTo(0.62*r,-0.6*r,0.7*r,-0.2*r);ctx.lineTo(0.7*r,0.2*r);ctx.quadraticCurveTo(0.62*r,0.6*r,0.08*r,0.5*r);ctx.quadraticCurveTo(0.16*r,0,0.08*r,-0.5*r);ctx.closePath();},o.dark,2.2);
  gloss(0.4*r,-0.28*r,r*0.16,r*0.06,0.4);
  inked(()=>{ctx.beginPath();ctx.moveTo(0.45*r,-0.1*r);ctx.lineTo(1.0*r,-0.04*r);ctx.lineTo(1.08*r,-0.12*r);ctx.lineTo(1.06*r,0);ctx.lineTo(1.08*r,0.12*r);ctx.lineTo(1.0*r,0.04*r);ctx.lineTo(0.45*r,0.1*r);ctx.closePath();},o.dark,1.6);
  /* the great horn, forked at the tip */
  const lift=(o.open||0)*0.12;
  inked(()=>{ctx.beginPath();ctx.moveTo(0.66*r,-0.14*r);ctx.quadraticCurveTo(1.4*r,-0.16*r-lift*r,1.85*r,-0.07*r);ctx.lineTo(2.2*r,-0.3*r);ctx.lineTo(2.08*r,-0.04*r);ctx.lineTo(2.32*r,-0.1*r);ctx.lineTo(2.12*r,0);ctx.lineTo(2.32*r,0.1*r);ctx.lineTo(2.08*r,0.04*r);ctx.lineTo(2.2*r,0.3*r);ctx.lineTo(1.85*r,0.07*r);ctx.quadraticCurveTo(1.4*r,0.16*r+lift*r,0.66*r,0.14*r);ctx.closePath();},o.dark,2.2);
  ctx.strokeStyle='rgba(255,220,170,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0.8*r,-0.05*r);ctx.lineTo(1.75*r,-0.03*r);ctx.stroke();
  eyes(r,0.72,0.22,0.05,'#1a120a');
};

BODY.dummy=(T,r,o)=>{
  /* a straw training doll seen from above: stake shadow, bound straw, rope bands and a painted target */
  ctx.fillStyle='rgba(42,33,24,.25)';ctx.beginPath();ctx.ellipse(r*0.2,r*0.25,r*1.05,r*0.95,0,0,TAU);ctx.fill();
  inked(ellP(0,0,r,r*0.92),o.col,2.2);
  ctx.save();ctx.beginPath();ctx.ellipse(0,0,r,r*0.92,0,0,TAU);ctx.clip();ctx.strokeStyle='rgba(120,80,30,.45)';ctx.lineWidth=1.2;
  for(let i=0;i<26;i++){const a=hash(i)*TAU,l=r*(0.4+hash(i+5)*0.7);ctx.beginPath();ctx.moveTo(Math.cos(a)*r*0.15,Math.sin(a)*r*0.15);ctx.lineTo(Math.cos(a)*l,Math.sin(a)*l);ctx.stroke();}
  ctx.restore();
  ctx.strokeStyle='#8a5a2a';ctx.lineWidth=r*0.14;for(const k of [0.45,0.8]){ctx.beginPath();ctx.ellipse(0,0,r*k,r*k*0.92,0,0,TAU);ctx.stroke();}
  ctx.strokeStyle=o.dark;ctx.lineWidth=r*0.1;ctx.beginPath();ctx.arc(0,0,r*0.22,0,TAU);ctx.stroke();dot(0,0,r*0.08,o.dark);
  inked(ellP(0,0,r*0.16,r*0.16),'#7a5a3a',1.4);
};
/* ---------- public: draw any bug ---------- */
/* o: {walk, flap, open, t, hurt, dead(0..1), type, ally, elite, hop, ext, guard, water, burrow, rolled, flying} */
function drawBugBody(T,r,o){
  const body=T.body,col=o.hurt?'#ffffff':T.col,dark=T.dark;
  const oo=Object.assign({col,dark,walk:0,flap:0,open:0.3},o);
  if(o.rolled&&body==='louse'){drawBall(r*0.95,col,dark,o.ball||0,'bands');return;}
  if(o.burrow&&o.burrow<0.3){drawMound(r,o.burrow);return;}
  ctx.save();
  if(o.dead){ctx.globalAlpha=Math.max(0,1-o.dead*0.9);ctx.rotate(o.dead*0.6);ctx.scale(1-o.dead*0.15,1-o.dead*0.15);}
  if(o.burrow&&o.burrow<1){drawMound(r,o.burrow);ctx.globalAlpha*=clamp((o.burrow-0.3)/0.7,0,1);}
  (BODY[body]||BODY.beetle)(T,r,oo);
  if(o.dead){/* belly-up: pale wash + curled legs */
    ctx.fillStyle='rgba(255,250,235,.35)';ctx.beginPath();ctx.ellipse(-0.2*r,0,r*0.8,r*0.55,0,0,TAU);ctx.fill();
    legs6(r,0,o.walk||0,{len:0.8,ty:0.2,curl:1,w:1.4});
    for(const s of [-1,1]){ctx.strokeStyle=INK;ctx.lineWidth=1.5;const x=0.55*r,y=s*0.15*r,k=r*0.06;ctx.beginPath();ctx.moveTo(x-k,y-k);ctx.lineTo(x+k,y+k);ctx.moveTo(x+k,y-k);ctx.lineTo(x-k,y+k);ctx.stroke();}
  }
  if(o.ally){/* white headband = 子分のしるし */
    const hx=body==='mantis'?1.0:body==='kabuto'?0.5:body==='crayfish'?0.6:body==='centipede'?0.95:body==='spider'?0.3:0.68;
    ctx.save();ctx.translate(hx*r,0);ctx.fillStyle='#fff';ctx.strokeStyle='#c8452d';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(0,0,r*0.08,r*0.3,0,0,TAU);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-r*0.05,r*0.26);ctx.lineTo(-r*0.35,r*0.42+Math.sin(ART_T*8)*r*0.05);ctx.moveTo(-r*0.05,r*0.22);ctx.lineTo(-r*0.38,r*0.28+Math.sin(ART_T*8+1)*r*0.05);ctx.stroke();ctx.restore();
  }
  ctx.restore();
}
function drawMound(r,k){
  const s=0.7+0.3*k;ctx.fillStyle='rgba(42,33,24,.25)';ctx.beginPath();ctx.ellipse(2,3,r*1.1*s,r*0.8*s,0,0,TAU);ctx.fill();
  inked(ellP(0,0,r*1.0*s,r*0.72*s),'#a07a4a',1.6);
  ctx.fillStyle='rgba(60,40,20,.5)';for(let i=0;i<6;i++)dot(Math.cos(i)*r*0.5*s,Math.sin(i*2.3)*r*0.35*s,r*0.08,'rgba(60,40,20,.5)');
  ctx.fillStyle='rgba(255,240,200,.35)';ctx.beginPath();ctx.ellipse(-r*0.2,-r*0.25,r*0.4*s,r*0.12*s,0,0,TAU);ctx.fill();
}
function drawBall(r,col,band,spin,style){
  inked(ellP(0,0,r,r),col,2.4);
  ctx.save();ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.clip();ctx.strokeStyle=band;ctx.lineWidth=2;
  for(let i=-3;i<=3;i++){const span=r*2.2,off=(((i*r*0.32+spin*r*0.2)%span)+span)%span-r*1.1;ctx.beginPath();ctx.ellipse(off,0,r*0.25,r*1.1,0,0,TAU);ctx.stroke();}
  if(style==='spots'){for(const [x,y] of [[0.3,0.4],[-0.4,-0.3],[0.1,-0.5],[-0.3,0.45]]){const xx=((x*r+spin*r*0.2)%(2.2*r)+3.3*r)%(2.2*r)-1.1*r;dot(xx,y*r,r*0.16,INK);}}
  ctx.restore();gloss(-r*0.3,-r*0.42,r*0.32,r*0.14,0.55);
}

/* =====================================================================
   the player's dangomushi (pill bug) — its parts are visibly attached
   ===================================================================== */
const DANGO_BODY='#8796ab',DANGO_BAND='#5d6b80',DANGO_HEAD='#6c7a8f';
const BACK_COL={tsuyahada:'#15151c',koura:'#d63a2a',kanabun:'#3f8a5a',mino:'#8a7a5a',kara:'#c0503a',kougyoku:'#e0302a',raiden:DANGO_BODY,gekka:DANGO_BODY,kusai:'#6b7f3a',hane:DANGO_BODY,ageha:DANGO_BODY,kumahane:DANGO_BODY,murasaki:DANGO_BODY,none:DANGO_BODY};
let DMETA=null;
function mixHex(a,b,k){const p=h=>{const n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255];};if(!/^#[0-9a-f]{6}$/i.test(a))return a;const x=p(a),y=p(b);return 'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*k)).join(',')+')';}
/* rare parts take on a tint: blue for めずらしい, gold for 伝説; ★ deepens it */
function tintFor(slot,c){const m=DMETA&&DMETA[slot];if(!m||!c||c[0]!=='#')return c;if(m.rar===2)return mixHex(c,'#e0b030',0.42+0.03*(m.st-1));if(m.rar===1)return mixHex(c,'#4a86d8',0.26+0.03*(m.st-1));if(m.st>=4)return mixHex(c,'#c9a23a',0.12*(m.st-3));return c;}
function sparkle(x,y,s,col){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x,y-s);ctx.quadraticCurveTo(x,y,x+s,y);ctx.quadraticCurveTo(x,y,x,y+s);ctx.quadraticCurveTo(x,y,x-s,y);ctx.quadraticCurveTo(x,y,x,y-s);ctx.fill();}
function partAuras(r){
  if(!DMETA)return;const pos={head:[1.3,0],legs:[0,0.9],tail:[-1.3,0],back:[-0.2,0]};
  for(const sl of SLOTS){const m=DMETA[sl];if(!m||isDefault(sl,m.id))continue;const [px,py]=pos[sl],x=px*r,y=py*r;
    if(m.rar===2){const g=ctx.createRadialGradient(x,y,0,x,y,r*(sl==='back'?1.1:0.6));g.addColorStop(0,'rgba(255,215,90,'+(0.28+0.12*Math.sin(ART_T*4))+')');g.addColorStop(1,'rgba(255,215,90,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*(sl==='back'?1.1:0.6),0,TAU);ctx.fill();
      for(let i=0;i<2;i++){const a=ART_T*2.4+i*Math.PI+SLOTS.indexOf(sl);sparkle(x+Math.cos(a)*r*0.55,y+Math.sin(a)*r*0.55,r*0.12*(0.7+0.3*Math.sin(ART_T*6+i)),'rgba(255,240,170,.95)');}}
    else if(m.rar===1){const tw=Math.max(0,Math.sin(ART_T*3+SLOTS.indexOf(sl)*1.7));if(tw>0.3)sparkle(x+r*0.25,y-r*0.2,r*0.13*tw,'rgba(170,210,255,.95)');}
    if(m.st>=3){for(let i=0;i<m.st-2;i++)sparkle(x-r*0.25+i*r*0.22,y+r*0.35,r*0.07,'rgba(255,220,90,.95)');}
    if(sl==='legs'&&(m.rar||m.st>=3)){const sy=-y;if(m.rar===2){const g=ctx.createRadialGradient(x,sy,0,x,sy,r*0.6);g.addColorStop(0,'rgba(255,215,90,.25)');g.addColorStop(1,'rgba(255,215,90,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,sy,r*0.6,0,TAU);ctx.fill();}}
  }
  const st5=SLOTS.some(sl=>DMETA[sl].st>=5);if(st5){ctx.save();ctx.rotate(ART_T*0.8);ctx.strokeStyle='rgba(242,182,50,.55)';ctx.lineWidth=2;ctx.setLineDash([4,7]);ctx.beginPath();ctx.ellipse(0,0,r*1.55,r*1.2,0,0,TAU);ctx.stroke();ctx.restore();ctx.setLineDash([]);}
}
function partCol(slot,id){
  return tintFor(slot,({ago:'#a2412b',oago:'#3d5c4f',kiba:'#5a3b6a',kamikiri:'#2f2f3a',hirata:'#2a1e16',kuwa:'#3a2418',okama:'#7ea845',mizukama:'#8a7650',zari:'#c8402a',tsuno:'#5a3420',
    kama:'#c79e62',batta:'#86b043',geji:'#a08c64',amenbo:'#5a4c3e',mukade:'#c84a2a',hasami:'#8a4a26',hari:'#5a3a10',mitsu:'#e8a82a',gomimushi:'#d07a2a',ohari:'#3a2410',kongou:'#d8a030',onizuno:'#6a1e10',kazekiri:'#4ea86a',ougon:'#f2c43a',hiari:'#d8452a',gokegumo:'#c8202a',hiaribari:'#e0502a'})[id]||'#6c7a8f');
}
function dangoLegs(ids,r,walk){
  const lg=ids.legs;
  ctx.lineCap='round';
  if(lg==='geji'){for(let i=0;i<7;i++)for(const s of [-1,1]){const x=r*(0.55-i*0.18),ph=Math.sin(walk*1.4+i*0.9+(s>0?1.5:0))*0.2,a=s*(1.7+i*0.08)+ph*s;ctx.strokeStyle=INK;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,s*r*0.6);ctx.quadraticCurveTo(x+Math.cos(a)*r*0.7,s*r*0.6+Math.sin(a)*r*0.7-s*r*0.3,x+Math.cos(a+s*0.4)*r*(1.3+i*0.06),s*r*0.6+Math.sin(a+s*0.4)*r*(1.3+i*0.06));ctx.stroke();ctx.strokeStyle=partCol('legs','geji');ctx.lineWidth=0.7;ctx.setLineDash([2,3]);ctx.stroke();ctx.setLineDash([]);}return;}
  if(lg==='mukade'){for(let i=0;i<11;i++)for(const s of [-1,1]){const x=r*(0.6-i*0.12),ph=Math.sin(walk*2+i*0.8+(s>0?Math.PI:0))*r*0.1;limb([[x,s*r*0.58],[x+ph,s*r*0.92],[x+ph-r*0.08,s*r*1.02]],Math.max(1.2,r*0.07),partCol('legs','mukade'));}return;}
  const stub=lg==='std'?7:lg==='amenbo'?3:5;
  for(let i=0;i<stub;i++)for(const s of [-1,1]){const x=r*(0.6-i*0.2),ph=Math.sin(walk*1.4+i*0.9+(s>0?1.5:0))*r*0.12;ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,s*r*0.6);ctx.lineTo(x+ph,s*r*0.9);ctx.stroke();}
  if(lg==='kama'||lg==='batta'||lg==='kazekiri'){const col=partCol('legs',lg),L=lg==='kama'?1:lg==='kazekiri'?1.25:1.1;
    for(const s of [-1,1]){const ph=Math.sin(walk*1.4+(s>0?Math.PI:0))*0.08,ax=-0.15*r,ay=s*0.6*r,kx=-1.15*r*L,ky=s*(1.0+ph)*r,fx=-0.4*r,fy=s*(1.22+ph)*r;
      inked(()=>{ctx.beginPath();ctx.moveTo(ax,ay-s*r*0.1);ctx.quadraticCurveTo((ax+kx)/2,(ay+ky)/2+s*r*0.38,kx,ky);ctx.quadraticCurveTo((ax+kx)/2,(ay+ky)/2-s*r*0.05,ax,ay+s*r*0.1);ctx.closePath();},col,1.6);
      ctx.strokeStyle='rgba(42,33,24,.35)';ctx.lineWidth=0.9;for(let i=1;i<5;i++){const t=i/5;ctx.beginPath();ctx.moveTo(ax+(kx-ax)*t,ay+(ky-ay)*t+s*r*0.14);ctx.lineTo(ax+(kx-ax)*(t+0.08),ay+(ky-ay)*(t+0.08)+s*r*0.03);ctx.stroke();}
      limb([[kx,ky],[fx,fy]],Math.max(1.5,r*0.08),null);ctx.fillStyle=INK;for(let i=1;i<4;i++){const t=i/4;dot(kx+(fx-kx)*t,ky+(fy-ky)*t-s*r*0.04,r*0.03,INK);}}}
  if(lg==='amenbo'){ctx.strokeStyle=INK;ctx.lineWidth=1.5;const sw=Math.sin(walk*0.7)*0.15;
    for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(-0.0*r,s*r*0.55);ctx.lineTo(-0.05*r,s*r*0.85);ctx.lineTo(-r*(0.5+sw*s),s*r*2.0);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-0.4*r,s*r*0.5);ctx.lineTo(-0.5*r,s*r*0.75);ctx.lineTo(-r*2.1,s*r*(1.1-sw*s*0.5));ctx.stroke();}}
}
function dangoTail(ids,r,o){
  const t=ids.tail;if(t==='none')return;
  ctx.save();ctx.translate(-1.08*r,0);
  if(t==='hasami')forceps(r*0.95,partCol('tail',t),o.bite?0.8:0.3);
  else if(t==='gomimushi'){inked(ellP(-0.18*r,0,0.26*r,0.22*r),partCol('tail',t),1.5);ctx.fillStyle='rgba(170,190,80,.45)';for(let i=0;i<3;i++)dot(-0.5*r-i*0.22*r,Math.sin(ART_T*3+i)*r*0.1,r*(0.1+i*0.04),'rgba(170,190,80,.4)');}
  else{stinger(r*0.95,t==='ohari'||t==='ougon',partCol('tail',t));if(t==='mitsu'||t==='ougon'){dot(-0.42*r,0,r*0.09,'#f2b632');dot(-0.44*r,-0.03*r,r*0.03,'#fff8d0');}}
  ctx.restore();
}
function dangoBack(ids,r,o){
  const b=ids.back;if(b==='none')return;
  const dash=o.dash?1:0;
  if(b==='koura'||b==='kanabun'||b==='tsuyahada'){
    const c=tintFor('back',BACK_COL[b]);inked(ellP(-0.22*r,0,0.86*r,0.74*r),c,2.2);
    ctx.save();ctx.beginPath();ctx.ellipse(-0.22*r,0,0.86*r,0.74*r,0,0,TAU);ctx.clip();
    if(b==='tsuyahada'){for(const [x,y,s] of [[0.1,-0.4,0.09],[0.12,0.36,0.08],[-0.4,-0.5,0.1],[-0.42,0.48,0.09],[-0.2,0.05,0.07],[-0.75,-0.25,0.08],[-0.78,0.2,0.07]])dot(r*x,r*y,r*s,'#f4f4f0');}
    else if(b==='koura'){for(const [x,y,s] of [[0.15,-0.38,0.13],[0.15,0.38,0.13],[-0.45,-0.45,0.15],[-0.45,0.45,0.15],[-0.15,0,0.12],[-0.8,-0.22,0.1],[-0.8,0.22,0.1]])dot(r*x,r*y,r*s,INK);}
    else{const g=ctx.createLinearGradient(0,-r,0,r);g.addColorStop(0,'rgba(255,255,220,.5)');g.addColorStop(0.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.25)');ctx.fillStyle=g;ctx.fillRect(-1.2*r,-r,2*r,2*r);}
    ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0.6*r,0);ctx.lineTo(-1.06*r,0);ctx.stroke();gloss(-0.35*r,-0.35*r,r*0.35,r*0.09,0.5);
  }else if(b==='kara'||b==='kougyoku'){const c=tintFor('back',BACK_COL[b]);
    for(let i=0;i<4;i++){const x=0.35*r-i*0.36*r,w=0.72-i*0.08;inked(()=>{ctx.beginPath();ctx.moveTo(x+0.12*r,-w*r);ctx.quadraticCurveTo(x+0.22*r,0,x+0.12*r,w*r);ctx.lineTo(x-0.24*r,(w-0.04)*r);ctx.quadraticCurveTo(x-0.14*r,0,x-0.24*r,-(w-0.04)*r);ctx.closePath();},i%2?c:shade(c,-0.1),1.6);}
    gloss(0.1*r,-0.4*r,r*0.3,r*0.06,0.45);
    if(b==='kougyoku'){for(let i=0;i<3;i++){const sp=0.5+0.5*Math.sin(ART_T*3+i*2);dot(0.2*r-i*0.36*r,-0.3*r+i*0.25*r,r*0.06*sp,'rgba(255,240,200,'+sp+')');}}
  }else if(b==='mino'){
    ctx.save();ctx.translate(-0.35*r,0);ctx.scale(0.9,0.95);BODY.bagworm({col:'#8a7a5a',dark:'#4a3e28'},r,{walk:0,col:'#8a7a5a',dark:'#4a3e28'});ctx.restore();
  }else if(b==='kusai'){
    const sh=()=>{ctx.beginPath();ctx.moveTo(0.55*r,-0.5*r);ctx.lineTo(0.62*r,0);ctx.lineTo(0.55*r,0.5*r);ctx.lineTo(-0.85*r,0.55*r);ctx.lineTo(-1.2*r,0);ctx.lineTo(-0.85*r,-0.55*r);ctx.closePath();};
    inked(sh,BACK_COL.kusai,2.2);ctx.fillStyle='#3a4a1a';ctx.beginPath();ctx.moveTo(0.35*r,-0.28*r);ctx.lineTo(-0.5*r,0);ctx.lineTo(0.35*r,0.28*r);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(170,190,80,.35)';for(let i=0;i<3;i++)dot(-1.3*r-i*r*0.25,Math.sin(ART_T*3+i)*r*0.18,r*(0.14+i*0.05),'rgba(170,190,80,.32)');
  }else if(b==='hane'||b==='raiden'){const wf=b==='raiden'?'rgba(250,236,150,.7)':'rgba(215,232,238,.62)';
    /* cicada wings folded tent-wise: hinged at the shoulders, tips past the tail */
    for(const s of [-1,1]){ctx.save();ctx.translate(0.4*r,s*r*0.14);ctx.rotate(s*(0.04+dash*0.35+(dash?Math.sin(ART_T*40)*0.15:0)));
      inked(()=>{ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-0.4*r,s*r*0.42,-1.4*r,s*r*0.44,-1.9*r,s*r*0.08);ctx.quadraticCurveTo(-1.7*r,-s*r*0.1,-1.2*r,-s*r*0.1);ctx.quadraticCurveTo(-0.5*r,-s*r*0.06,0,0);ctx.closePath();},wf,1.5);
      ctx.strokeStyle='rgba(42,33,24,.45)';ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(-0.05*r,s*r*0.05);ctx.quadraticCurveTo(-0.9*r,s*r*0.36,-1.75*r,s*r*0.1);ctx.moveTo(-0.7*r,s*r*0.28);ctx.lineTo(-0.85*r,-s*r*0.05);ctx.moveTo(-1.2*r,s*r*0.28);ctx.lineTo(-1.35*r,-s*r*0.03);ctx.stroke();ctx.restore();}
  }else if(b==='ageha'||b==='murasaki'||b==='gekka'){
    const T=b==='ageha'?{wing:'#f2d35a',wing2:'#2a2118',swallow:true,id:'ageha'}:b==='gekka'?{wing:'#d6eccb',wing2:'#7a9a6a',swallow:true,id:'gekka'}:{wing:'#6a4aa8',wing2:'#2a2118',id:'oomurasaki'};
    if(dash){ctx.save();ctx.translate(-0.15*r,0);lepWings(r*1.2,T,ART_T*14,false);ctx.restore();}
    else{/* folded back over the body */
      ctx.save();ctx.translate(0.3*r,0);lepWings(r*0.9,T,0,false,1.4+Math.sin(ART_T*2)*0.03);ctx.restore();
    }
  }else if(b==='kumahane'){
    sweptWings(r*1.15,0.3,dash?ART_T*40:ART_T*2,{blur:!!dash,len:1.05,w:0.3,fill:'rgba(80,70,95,.5)',amp:dash?0.4:0.05});
    ctx.save();ctx.translate(0.42*r,0);ctx.fillStyle='#e8c84a';ctx.beginPath();for(let k=0;k<16;k++){const a=k/16*TAU,rr=r*(0.24+(k%2)*0.04);ctx.lineTo(Math.cos(a)*rr*0.7,Math.sin(a)*rr*1.6);}ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.3;ctx.stroke();ctx.restore();
  }
}
function dangoHead(ids,r,o){
  const h=ids.head,bite=o.bite?1:0,hx=1.0*r+bite*r*0.12;
  if(h==='okama'){ctx.save();ctx.translate(0.82*r,0);raptor(r*1.05,bite?1.1:0.15,partCol('head',h),'#45661e');ctx.restore();}
  else if(h==='mizukama'){ctx.save();ctx.translate(0.85*r,0);raptor(r*1.0,bite?1.25:0.1,partCol('head',h),'#4a3a20',true);ctx.restore();}
  else if(h==='zari'){for(const s of [-1,1])claw(r,0.75*r,s*r*0.4,(1.15+bite*0.25)*r,s*r*0.62,0.62,bite?1:0.25,partCol('head',h),s);}
  else if(h==='tsuno'){const lift=bite*0.15;inked(()=>{ctx.beginPath();ctx.moveTo(0.95*r,-0.12*r);ctx.quadraticCurveTo(1.6*r,-0.15*r-lift*r,2.0*r,-0.06*r);ctx.lineTo(2.3*r,-0.26*r);ctx.lineTo(2.18*r,-0.03*r);ctx.lineTo(2.38*r,0);ctx.lineTo(2.18*r,0.03*r);ctx.lineTo(2.3*r,0.26*r);ctx.lineTo(2.0*r,0.06*r);ctx.quadraticCurveTo(1.6*r,0.15*r+lift*r,0.95*r,0.12*r);ctx.closePath();},partCol('head',h),2);}
  else if(h!=='mouth'){ctx.save();ctx.translate(hx+r*0.2,0);const k=h==='kiba'||h==='gokegumo'?1.5:h==='ago'||h==='hiari'?1.25:1;ctx.scale(k,k);mandibles(r,h,bite?1:0.25,partCol('head',h));ctx.restore();}
  inked(ellP(hx,0,0.28*r,0.42*r),o.hurt?'#fff':DANGO_HEAD,1.8);
  antennae(r,1.1,0.8,0.7,{w:1.3,ph:1});
  eyes(r,1.1,0.24,0.07);
  if(h==='mouth'){ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(hx+r*0.18,0,r*0.08,-1,1);ctx.stroke();}
}
/* ids: {head,legs,tail,back}; draws at origin facing +x */
function drawDango(ids,r,o){
  o=o||{};DMETA=ids._eq||null;
  if(o.rolled){
    const b=ids.back,bb0=bloodBody(ids),c=o.hurt?'#fff':((!BACK_COL[b]||BACK_COL[b]===DANGO_BODY)&&bb0?bb0.col:tintFor('back',BACK_COL[b]||DANGO_BODY)),band=['koura','kanabun','mino','kara','kusai'].includes(b)?'rgba(42,33,24,.55)':DANGO_BAND;
    if(ids.tail!=='none'){ctx.save();ctx.rotate(ART_T*0);ctx.translate(-0.15*r,0);dangoTail(ids,r*0.9,o);ctx.restore();}
    drawBall(r*1.02,c,band,o.ball||0,b==='koura'?'spots':'bands');
    if(b==='mino'){ctx.strokeStyle='#5a4a32';ctx.lineWidth=2;for(let i=0;i<8;i++){const a=hash(i)*TAU+(o.ball||0)*0.1,x=Math.cos(a)*r*0.6,y=Math.sin(a)*r*0.6;ctx.beginPath();ctx.moveTo(x-r*0.15,y);ctx.lineTo(x+r*0.15,y+r*0.05);ctx.stroke();}}
    if(DMETA&&SLOTS.some(sl=>DMETA[sl].rar===2)){ctx.strokeStyle='rgba(255,215,90,'+(0.4+0.3*Math.sin(ART_T*5))+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r*1.25,0,TAU);ctx.stroke();}
    DMETA=null;return;
  }
  dangoLegs(ids,r,o.walk||0);
  dangoTail(ids,r,o);
  const body=()=>{ctx.beginPath();ctx.ellipse(-0.05*r,0,1.12*r,0.8*r,0,0,TAU);};
  const bb=bloodBody(ids);inked(body,o.hurt?'#fff':bb?bb.col:DANGO_BODY,2.4);
  if(bb&&!o.hurt){ctx.save();body();ctx.clip();
    if(bb.k==='hachi'){ctx.fillStyle='rgba(30,20,10,.45)';for(const x of [-0.5,0.1])ctx.fillRect(x*r,-r,0.22*r,2*r);}
    else if(bb.k==='kouchu'){gloss(-0.2*r,-0.35*r,0.6*r,0.12*r,0.55);}
    else if(bb.k==='koukaku'){ctx.strokeStyle='rgba(120,20,10,.5)';ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(0.6*r-i*0.32*r,0,0.9*r,-0.9,0.9);ctx.stroke();}}
    else if(bb.k==='hane'){for(let i=0;i<3;i++)dot(-0.4*r+i*0.35*r,Math.sin(ART_T*3+i)*0.3*r,0.06*r,'rgba(255,255,220,.8)');}
    else if(bb.k==='mukade'){ctx.fillStyle='rgba(200,80,20,.35)';ctx.fillRect(-1.2*r,-0.12*r,2.4*r,0.24*r);}
    else if(bb.k==='ari'){ctx.fillStyle='rgba(120,30,20,.3)';ctx.beginPath();ctx.ellipse(0.5*r,0,0.4*r,0.6*r,0,0,TAU);ctx.fill();}
    ctx.restore();}
  ctx.save();body();ctx.clip();ctx.strokeStyle=DANGO_BAND;ctx.lineWidth=1.8;
  for(let i=0;i<7;i++){const x=r*(0.72-i*0.29);ctx.beginPath();ctx.ellipse(x,0,r*0.16,r*0.86,0,-1.45,1.45);ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(r*(0.62-i*0.29),-r*0.4,r*0.06,r*0.14,0,0,TAU);ctx.fill();}
  ctx.restore();
  gloss(-0.2*r,-0.46*r,r*0.5,r*0.11,0.45);
  dangoBack(ids,r,o);
  dangoHead(ids,r,o);
  partAuras(r);DMETA=null;
}

/* part icon (used on the ground & in menus): draws the part alone, centred */
function drawPartIcon(slot,id,r){
  ctx.save();
  if(slot==='head'){
    if(id==='okama'||id==='mizukama'){ctx.translate(-r*0.4,0);raptor(r,0.9,partCol(slot,id),'#45661e',id==='mizukama');}
    else if(id==='zari'){claw(r,-r*0.5,r*0.2,r*0.1,0,0.8,0.5,partCol(slot,id),1);}
    else if(id==='tsuno'){ctx.translate(-r*1.1,0);inked(()=>{ctx.beginPath();ctx.moveTo(0,-0.14*r);ctx.quadraticCurveTo(0.8*r,-0.18*r,1.4*r,-0.06*r);ctx.lineTo(1.8*r,-0.36*r);ctx.lineTo(1.62*r,0);ctx.lineTo(1.8*r,0.36*r);ctx.lineTo(1.4*r,0.06*r);ctx.quadraticCurveTo(0.8*r,0.18*r,0,0.14*r);ctx.closePath();},partCol(slot,id),2);}
    else if(id==='mouth'){inked(ellP(0,0,0.4*r,0.55*r),DANGO_HEAD,1.8);}
    else{const L=(MAND[id]||MAND.ago).L;ctx.translate(-L*r*0.5,0);mandibles(r,id,0.6,partCol(slot,id));}
  }else if(slot==='legs'){
    if(id==='std'){for(let i=0;i<4;i++){ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*0.6+i*r*0.4,-r*0.3);ctx.lineTo(-r*0.6+i*r*0.4,r*0.3);ctx.stroke();}}
    else if(id==='kama'||id==='batta'||id==='kazekiri'){ctx.translate(r*0.6,-r*0.25);ctx.scale(1,1);hopLegsSingle(r,partCol(slot,id),id!=='kama');}
    else if(id==='geji'||id==='amenbo'){ctx.strokeStyle=INK;ctx.lineWidth=1.6;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-r*0.2+i*r*0.2,-r*0.5);ctx.quadraticCurveTo(r*0.2,r*0.1,-r*0.8+i*r*0.3,r*(0.8+i*0.1));ctx.stroke();}ctx.strokeStyle=partCol(slot,id);ctx.lineWidth=0.8;ctx.setLineDash([2,3]);for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-r*0.2+i*r*0.2,-r*0.5);ctx.quadraticCurveTo(r*0.2,r*0.1,-r*0.8+i*r*0.3,r*(0.8+i*0.1));ctx.stroke();}ctx.setLineDash([]);}
    else if(id==='mukade'){for(let i=0;i<5;i++)limb([[-r*0.8+i*r*0.4,-r*0.1],[-r*0.75+i*r*0.4,r*0.35],[-r*0.85+i*r*0.4,r*0.5]],2,partCol(slot,id));inked(()=>{ctx.beginPath();ctx.rect(-r,-r*0.3,r*2,r*0.25);},'#3a2a2a',1.5);}
  }else if(slot==='tail'){
    ctx.translate(r*0.5,0);
    if(id==='hasami')forceps(r*1.1,partCol(slot,id),0.4);
    else if(id==='gomimushi'){inked(ellP(-0.3*r,0,0.4*r,0.32*r),partCol(slot,id),1.6);}
    else if(id!=='none'){ctx.scale(1.4,1.4);stinger(r,id==='ohari'||id==='ougon',partCol(slot,id));if(id==='mitsu'||id==='ougon')dot(-0.4*r,0,r*0.1,'#f2b632');}
  }else if(slot==='back'){
    ctx.translate(r*0.3,0);ctx.scale(0.8,0.8);dangoBack({back:id},r,{});
  }
  ctx.restore();
}
function hopLegsSingle(r,col,big){
  const ax=0,ay=0,kx=-r*1.1,ky=r*0.3,fx=kx+r*0.7,fy=ky+r*0.25;
  inked(()=>{ctx.beginPath();ctx.moveTo(ax,ay-r*0.08);ctx.quadraticCurveTo(kx/2,ky/2+r*0.28,kx,ky);ctx.quadraticCurveTo(kx/2,ky/2,ax,ay+r*0.08);ctx.closePath();},col,1.5);
  limb([[kx,ky],[fx,fy]],2,null);
}
