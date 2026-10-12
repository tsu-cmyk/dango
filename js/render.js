'use strict';
/* =====================================================================
   ひと夏の番長 — renderer
   ===================================================================== */
const TINT={noon:null,after:'rgba(255,200,90,.07)',shade:'rgba(40,60,30,.12)',evening:'rgba(240,120,40,.15)',night:null};
let LIGHT=null,lctx=null;
function resize(){DPR=Math.min(1.75,window.devicePixelRatio||1);W=window.innerWidth;Hh=window.innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(Hh*DPR);
  if(LIGHT){LIGHT.width=Math.round(W*DPR/2);LIGHT.height=Math.round(Hh*DPR/2);}}
function viewScale(){const z=S.slowmo>0&&S.slowMax?Math.sin(clamp(S.slowmo/S.slowMax,0,1)*Math.PI)*0.28:0;return clamp(Math.min(W,Hh)/370,0.95,1.7)*(1+z);}
function camView(){
  const s=viewScale(),M=MAP,hw=W/2/s,hh=Hh/2/s,pad=90;
  let tx=S.cam.x,ty=S.cam.y;if(S.slowmo>0&&S.slowFocus&&S.slowMax){const k=Math.sin(clamp(S.slowmo/S.slowMax,0,1)*Math.PI);tx=lerp(tx,S.slowFocus.x,k*0.6);ty=lerp(ty,S.slowFocus.y,k*0.6);}
  const cx=M.w+pad*2>hw*2?clamp(tx,hw-pad,M.w-hw+pad):M.w/2,cy=M.h+pad*2>hh*2?clamp(ty,hh-pad,M.h-hh+pad):M.h/2;
  return {s,cx,cy,x0:cx-hw,x1:cx+hw,y0:cy-hh,y1:cy+hh};
}
const onScreen=(v,x,y,m)=>x>v.x0-m&&x<v.x1+m&&y>v.y0-m&&y<v.y1+m;
function drawTelegraph(e){
  const st=e.state;if(!st||!st.endsWith('_wind')&&st!=='guardup')return;
  ctx.save();
  if(st==='quake_wind'){const k=clamp(1-e.t/(e.qT||1),0,1);ctx.fillStyle='rgba(200,40,30,'+(0.08+0.18*k)+')';ctx.beginPath();ctx.arc(e.x,e.y,e.qR,0,TAU);ctx.fill();ctx.strokeStyle='rgba(200,40,30,.75)';ctx.lineWidth=3;ctx.setLineDash([12,8]);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(e.x,e.y,e.qR*k,0,TAU);ctx.stroke();}
  else if(st==='charge_wind'){ctx.translate(e.x,e.y);ctx.rotate(e.ang);const g=ctx.createLinearGradient(0,0,280,0);g.addColorStop(0,'rgba(200,40,30,.3)');g.addColorStop(1,'rgba(200,40,30,0)');ctx.fillStyle=g;ctx.fillRect(0,-e.r,280,e.r*2);}
  else if(st==='sweep_wind'||st==='slash_wind'){const R=st==='sweep_wind'?e.r+90:e.r+60+e.r*0.6,w=st==='sweep_wind'?1.5:1.3;ctx.fillStyle='rgba(200,40,30,.18)';ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,R,e.ang-w,e.ang+w);ctx.closePath();ctx.fill();}
  else if(st==='spin_wind'){ctx.strokeStyle='rgba(200,40,30,.6)';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(e.x,e.y,e.r+46,0,TAU);ctx.stroke();}
  else if(st==='ring_wind'||st==='shoot_wind'){ctx.strokeStyle='rgba(242,182,50,'+(0.5+0.4*Math.sin(S.t*20))+')';ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y-(e.z||0),e.r+12,0,TAU);ctx.stroke();}
  else if(st==='field_wind'&&e.fieldPts){for(const p of e.fieldPts){ctx.strokeStyle='rgba(200,40,30,.7)';ctx.lineWidth=2.5;ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(p.x,p.y,70,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(p.x-10,p.y-10);ctx.lineTo(p.x+10,p.y+10);ctx.moveTo(p.x+10,p.y-10);ctx.lineTo(p.x-10,p.y+10);ctx.stroke();}}
  else if(st==='dust_wind'){ctx.strokeStyle='rgba(200,40,30,.6)';ctx.lineWidth=2.5;ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(e.dx2,e.dy2,85,0,TAU);ctx.stroke();}
  else if(st==='guardup'){ctx.translate(e.x,e.y);ctx.rotate(e.ang);ctx.strokeStyle='rgba(120,180,255,'+(0.6+0.3*Math.sin(S.t*12))+')';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,e.r+16,-1.3,1.3);ctx.stroke();}
  ctx.restore();ctx.setLineDash([]);
}
function drawCameo(){const c=S.cameo;if(!c)return;ctx.save();ctx.translate(c.x,c.y);ctx.globalAlpha=c.t>1.2?Math.max(0,1-(c.t-1.2)/0.4):1;ctx.fillStyle='rgba(255,240,150,.35)';ctx.beginPath();ctx.arc(0,0,c.T.r*1.8,0,TAU);ctx.fill();ctx.rotate(c.ang||0);drawBugBody(c.T,c.T.r,{type:c.type,walk:c.walk,flap:c.walk*3,ally:true,open:1,ext:1});ctx.restore();ctx.globalAlpha=1;}
function drawEntity(e,ally){
  const T=e.T,r=e.r,dying=e.dying;
  ctx.save();ctx.translate(e.x,e.y);
  const z=e.z||0,zs=1-z/200;
  if(!(e.state==='under')){ctx.fillStyle='rgba(42,33,24,.22)';ctx.beginPath();ctx.ellipse(2+z*0.4,4+z*0.6,r*1.25*zs,r*0.85*zs,e.ang,0,TAU);ctx.fill();}
  if(e.elite&&!dying){ctx.save();ctx.rotate(S.t*1.5);ctx.strokeStyle='rgba(242,182,50,.9)';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(0,0,r*1.55,0,TAU);ctx.stroke();ctx.restore();ctx.setLineDash([]);
    const g=ctx.createRadialGradient(0,0,r*0.5,0,0,r*1.8);g.addColorStop(0,'rgba(255,200,60,.18)');g.addColorStop(1,'rgba(255,200,60,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*1.8,0,TAU);ctx.fill();}
  if(T.nushi&&!dying){ctx.save();for(let i=0;i<10;i++){const a=i/10*TAU+S.t*1.2,fl=Math.sin(S.t*8+i*1.7)*0.25;ctx.fillStyle=i%2?'rgba(150,90,220,.35)':'rgba(255,200,60,.35)';ctx.beginPath();ctx.ellipse(Math.cos(a)*r*1.35,Math.sin(a)*r*1.35,r*(0.3+fl*0.2),r*(0.18+fl*0.1),a,0,TAU);ctx.fill();}ctx.restore();
    ctx.strokeStyle='rgba(150,90,220,'+(0.5+0.3*Math.sin(S.t*5))+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r*1.6,0,TAU);ctx.stroke();}
  if(ally&&e.rec&&!dying)drawGradeAura(e,r);
  if(e.phase===2&&!dying){ctx.strokeStyle='rgba(200,69,45,'+(0.4+0.3*Math.sin(S.t*10))+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r*1.5,0,TAU);ctx.stroke();}
  ctx.translate(0,-z);ctx.rotate(e.ang);
  const wind=['windup','charge_wind','leap_wind','dive_wind','spin_wind','sweep_wind','grab_wind','roll_wind'].includes(e.state);
  if(wind&&!dying)ctx.translate(Math.sin(S.t*60)*1.5,0);
  const flash=e.hurtT>0&&Math.floor(e.hurtT*30)%2===0;
  const water=T.ai==='water'&&MAP.river&&inWater(MAP,e.x,e.y);
  drawBugBody(ally&&e.rec?gradeT(T,allyGrade(e.rec)):T,r,{type:e.type,walk:e.walk,flap:e.flap,open:wind?1:e.state==='recover'?0.15:0.4,hurt:flash,dead:dying,ally,elite:e.elite,hop:e.hop,ext:e.ext||(e.slashT>0?1.2:0),guard:T.guard&&e.state!=='recover',water,burrow:T.ai==='burrow'?e.burrow:0,rolled:e.rolled&&e.state!=='roll_wind',ball:e.walk,flying:T.ai==='flyer'});
  ctx.restore();
}
function drawTag(e){
  const T=e.T,r=e.r,y=e.y-(e.z||0);
  if(T.nushi){if(e.met||Math.hypot(e.x-P.x,e.y-P.y)>520)return;ctx.font='900 11px '+FONT;ctx.textAlign='center';const nm=T.tboss?'夏の主 '+T.name:'ぬし '+T.name.replace(/^.*ぬし /,'');const w=ctx.measureText(nm).width+12;ctx.fillStyle='#5a2a8a';ctx.fillRect(e.x-w/2,y-r-30,w,16);ctx.fillStyle='#f2c43a';ctx.fillText(nm,e.x,y-r-18);return;}
  if(T.boss||T.keeper||e.state==='under'||e.state==='den')return;
  const near=Math.hypot(e.x-P.x,e.y-P.y)<280,sumo=T.ai==='sumo';
  if(near||e.elite||sumo){
    let nm,tagc;
    if(sumo){nm=T.name;tagc='#8e6440';}
    else{const rel=e.lv-P.lv;tagc=e.elite?(e.affix?AFFIX[e.affix].c:'#b8860b'):rel>2?'#c8452d':rel>=-2?'#d29a12':'#5f7d3a';nm=e.elite?(e.affix?AFFIX[e.affix].n:'あばれ')+' Lv'+e.lv+' '+T.name:'Lv'+e.lv;}
    ctx.font='700 11px '+FONT;ctx.textAlign='center';const w=ctx.measureText(nm).width+10;ctx.fillStyle=tagc;ctx.fillRect(e.x-w/2,y-r-27,w,15);ctx.fillStyle='#fff';ctx.fillText(nm,e.x,y-r-15.5);
  }
  if(!sumo&&e.hp<e.maxhp){ctx.fillStyle=INK;ctx.fillRect(e.x-r,y-r-9,r*2,4);ctx.fillStyle='#c8452d';ctx.fillRect(e.x-r,y-r-9,r*2*Math.max(0,e.hp/e.maxhp),4);}
  if(['windup','charge_wind','leap_wind','dive_wind','spin_wind','sweep_wind','grab_wind','roll_wind'].includes(e.state)){ctx.fillStyle='#c8452d';ctx.font='900 18px '+FONT;ctx.textAlign='center';ctx.fillText('！',e.x,y-r-32);}
  if(e.poisonT>0){ctx.fillStyle='#9a5fc2';ctx.font='900 10px '+FONT;ctx.textAlign='center';ctx.fillText('どく',e.x+r+12,y-r);}
}
/* how a follower's quality shows on the field */
const GRADE_T={};
function gradeT(T,g){if(g<2)return T;const k=T.name+':'+g;if(GRADE_T[k])return GRADE_T[k];const o=Object.assign({},T);
  if(g===3){o.col=mixHex(T.col,'#f2c43a',0.4);o.dark=mixHex(T.dark,'#6a4a08',0.35);if(o.wing)o.wing=mixHex(o.wing,'#fff0a0',0.35);}
  else{o.col=mixHex(T.col,'#4a8ad8',0.25);o.dark=mixHex(T.dark,'#1a3a6a',0.25);}
  GRADE_T[k]=o;return o;}
function drawGradeAura(e,r){const g=allyGrade(e.rec);
  if(g===3){const gl=ctx.createRadialGradient(0,0,r*0.4,0,0,r*2);gl.addColorStop(0,'rgba(255,215,90,.28)');gl.addColorStop(1,'rgba(255,215,90,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,r*2,0,TAU);ctx.fill();
    for(let i=0;i<4;i++){const a=S.t*2+i*TAU/4,x=Math.cos(a)*r*1.5,y=Math.sin(a)*r*1.5,s2=2+1.5*Math.sin(S.t*6+i);ctx.fillStyle='#fff3b0';ctx.beginPath();ctx.moveTo(x,y-s2*2);ctx.lineTo(x+s2*0.6,y);ctx.lineTo(x,y+s2*2);ctx.lineTo(x-s2*0.6,y);ctx.closePath();ctx.fill();}}
  else if(g===2){ctx.strokeStyle='rgba(120,180,255,'+(0.35+0.2*Math.sin(S.t*4))+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*1.45,0,TAU);ctx.stroke();}
  if(e.rec.rare&&Math.random()<0.15)fx.push({x:e.x+rnd(-r,r),y:e.y+rnd(-r,r),vx:0,vy:-30,t:0,life:0.6,c:'#c49be0'});}
function drawAllyTag(a){const y=a.y-(a.z||0),r=a.r;ctx.fillStyle=INK;ctx.fillRect(a.x-r,y+r+6,r*2,4);ctx.fillStyle='#5f7d3a';ctx.fillRect(a.x-r,y+r+6,r*2*Math.max(0,a.hp/a.maxhp),4);
  const g=allyGrade(a.rec);if(g>=2){ctx.font='900 10px '+FONT;ctx.textAlign='center';ctx.fillStyle=GRADES[g].c;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.strokeText(GRADES[g].n,a.x+r+6,y+r+10);ctx.fillText(GRADES[g].n,a.x+r+6,y+r+10);}}
function drawPlayer(){
  const r=ST.r;ctx.save();ctx.translate(P.x,P.y);
  const z=P.z||0;
  ctx.fillStyle='rgba(42,33,24,.22)';ctx.beginPath();ctx.ellipse(2+z*0.3,4+z*0.5,r*1.25,r*0.9,P.ang,0,TAU);ctx.fill();
  if(P.healT>0){ctx.strokeStyle='rgba(255,200,90,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*1.6+Math.sin(S.t*8)*2,0,TAU);ctx.stroke();}
  if(P.inv>0&&Math.floor(P.inv*16)%2===0&&!P.rolled)ctx.globalAlpha=0.5;
  ctx.translate(0,-z);
  const rolled=P.rolled||P.dashT>0;
  if(P.dashT>0){ctx.save();ctx.rotate(P.ang);ctx.strokeStyle='rgba(42,33,24,.35)';ctx.lineWidth=2;for(const s of [-1,0,1]){ctx.beginPath();ctx.moveTo(-r*1.3,s*r*0.6);ctx.lineTo(-r*2.6,s*r*0.6);ctx.stroke();}
    if(ST.dashInv){ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r*1.35,0,TAU);ctx.stroke();}ctx.restore();}
  ctx.save();ctx.rotate(P.ang);
  const showWings=P.dashT>0&&['ageha','murasaki','hane','kumahane'].includes(P.eq.back.id);
  if(rolled&&!showWings)drawDango(eqIds(P.eq),r,{rolled:true,ball:P.ball,hurt:P.hurtT>0});
  else drawDango(eqIds(P.eq),r,{walk:P.walk,bite:P.biteT>0,hurt:P.hurtT>0,dash:P.dashT>0});
  ctx.restore();
  if(P.biteT>0&&!rolled){ctx.save();ctx.rotate(P.ang);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r+ST.range+6,-ST.arc*0.8,ST.arc*0.8);ctx.stroke();ctx.restore();}
  if(P.slowT>0&&!rolled){ctx.strokeStyle='rgba(240,240,240,.85)';ctx.lineWidth=1;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-r,(i-2)*r*0.3);ctx.lineTo(r,(2-i)*r*0.3);ctx.stroke();}}
  ctx.restore();ctx.globalAlpha=1;
  if(P.stunT>0){ctx.fillStyle=INK;ctx.font='900 14px '+FONT;ctx.textAlign='center';ctx.fillText('@ @',P.x,P.y-r-10);}
  if(P.poisonT>0){ctx.fillStyle='#9a5fc2';ctx.font='900 11px '+FONT;ctx.textAlign='center';ctx.fillText('どく',P.x+r+12,P.y-r);}
}
function drawItem(it){
  const y=it.y+Math.sin(S.t*3+it.bob)*3,p=it.p,same=P.eq[p.s].id===p.id,R=RARITY[p.rar];
  const g=ctx.createRadialGradient(it.x,y,2,it.x,y,30+p.rar*6);g.addColorStop(0,R.glow+'.85)');g.addColorStop(1,R.glow+'0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(it.x,y,30+p.rar*6,0,TAU);ctx.fill();
  if(p.rar){const bh=p.rar===2?150:100,bg=ctx.createLinearGradient(0,it.y-bh,0,it.y);bg.addColorStop(0,R.glow+'0)');bg.addColorStop(1,R.glow+(0.35+0.15*Math.sin(S.t*4))+')');ctx.fillStyle=bg;ctx.fillRect(it.x-12,it.y-bh,24,bh);
    if(p.rar===2){for(let i=0;i<4;i++){const k=(S.t*0.7+i/4)%1;dot(it.x+Math.sin(i*2+S.t)*10,it.y-k*bh,2,R.glow+(1-k)+')');}}}
  if(p.rar){ctx.save();ctx.translate(it.x,y);ctx.rotate(S.t*2);ctx.strokeStyle=R.col;ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(28,0);ctx.stroke();}ctx.restore();}
  ctx.save();ctx.translate(it.x,y);ctx.rotate(-Math.PI/2+Math.sin(S.t*2)*0.2);drawPartIcon(p.s,p.id,15);ctx.restore();
  const nm=partName(p)+(same?'（★合成できる）':'');ctx.font='900 11px '+FONT;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.strokeText(nm,it.x,y-26);ctx.fillStyle=p.rar?R.col:same?'#b8860b':INK;ctx.fillText(nm,it.x,y-26);
}
/* the shrike's shadow sweeping over the ground */
function birdPath(span){
  ctx.beginPath();
  /* tail fan */
  ctx.moveTo(-58,-12);for(let i=0;i<=5;i++){const t=i/5,y=-26+t*52;ctx.lineTo(-150+Math.abs(t-0.5)*24,y);ctx.lineTo(-138+Math.abs(t-0.5)*24,y+(i<5?5:0));}ctx.lineTo(-58,12);
  /* lower wing */
  ctx.lineTo(-20,16);ctx.bezierCurveTo(-30,60*span,-70,120*span,-110,160*span);
  for(let i=0;i<6;i++){const t=i/5,x=-110+t*70,y=(160-t*70)*span;ctx.lineTo(x+6,y+12*span);ctx.lineTo(x+14,y);}
  ctx.bezierCurveTo(-20,70*span,10,40*span,24,16);
  /* head & beak */
  ctx.lineTo(70,14);ctx.quadraticCurveTo(102,16,104,4);ctx.lineTo(128,0);ctx.lineTo(104,-4);ctx.quadraticCurveTo(102,-16,70,-14);
  /* upper wing */
  ctx.lineTo(24,-16);ctx.bezierCurveTo(10,-40*span,-20,-70*span,-40,-90*span);
  for(let i=5;i>=0;i--){const t=i/5,x=-110+t*70,y=-(160-t*70)*span;ctx.lineTo(x+14,y);ctx.lineTo(x+6,y-12*span);}
  ctx.bezierCurveTo(-70,-120*span,-30,-60*span,-20,-16);
  ctx.closePath();
}
function drawBird(){
  const b=S.bird;if(!AREA().bird||!b||b.st==='idle')return;
  if(b.st==='warn'){
    const k=1-b.t/1.6,a=0.1+0.08*Math.sin(S.t*18);
    ctx.fillStyle='rgba(200,40,30,'+a+')';ctx.fillRect(-400,b.y-90,MAP.w+800,180);
    ctx.strokeStyle='rgba(200,40,30,.7)';ctx.lineWidth=4;ctx.setLineDash([26,18]);ctx.lineDashOffset=-S.t*120*b.dir;
    ctx.beginPath();ctx.moveTo(-400,b.y-90);ctx.lineTo(MAP.w+400,b.y-90);ctx.moveTo(-400,b.y+90);ctx.lineTo(MAP.w+400,b.y+90);ctx.stroke();ctx.setLineDash([]);
    /* chevrons showing where it comes from */
    ctx.fillStyle='rgba(200,40,30,.75)';for(let i=0;i<6;i++){const x=P.x-500*b.dir+((S.t*400+i*170)%1000)*b.dir;ctx.save();ctx.translate(x,b.y);ctx.scale(b.dir,1);ctx.beginPath();ctx.moveTo(-14,-26);ctx.lineTo(14,0);ctx.lineTo(-14,26);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();ctx.restore();}
    /* the shadow grows in from far away */
    const sc=0.35+0.4*k;ctx.save();ctx.translate(b.x+b.dir*k*260,b.y);ctx.scale(b.dir*sc,sc);ctx.fillStyle='rgba(20,12,8,'+(0.12+0.15*k)+')';birdPath(0.9);ctx.fill();ctx.restore();
    return;
  }
  const span=0.62+0.38*Math.abs(Math.cos(S.t*7));
  ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.dir*1.15,1.15);
  for(const [sc,al] of [[1.08,0.10],[1.03,0.14],[1,0.30]]){ctx.save();ctx.scale(sc,sc);ctx.fillStyle='rgba(20,12,8,'+al+')';birdPath(span);ctx.fill();ctx.restore();}
  /* faint feather lines inside the shadow */
  ctx.strokeStyle='rgba(20,12,8,.12)';ctx.lineWidth=2;for(const s of [-1,1])for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-10-i*12,s*20);ctx.quadraticCurveTo(-40-i*14,s*80*span,-70-i*10,s*(130-i*12)*span);ctx.stroke();}
  ctx.restore();
  /* wind streaks and blown leaves */
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;for(let i=0;i<8;i++){const y=b.y+(hash(i)-0.5)*170,x=b.x-b.dir*(80+hash(i+3)*220);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-b.dir*(60+hash(i+7)*80),y);ctx.stroke();}
  for(let i=0;i<5;i++){const y=b.y+(hash(i+20)-0.5)*150,x=b.x-b.dir*(140+((S.t*300+i*60)%260));ctx.save();ctx.translate(x,y);ctx.rotate(S.t*8+i);drawDecor({k:'leaf',x:0,y:0,a:0,s:7,c:'#9cb758'});ctx.restore();}
}
function drawClouds(){
  for(const c of clouds){const a=Math.max(0,1-c.t/c.life);
    const col=c.kind==='webfx'||c.kind==='webfield'?'250,250,250':c.kind==='allydust'?'200,230,140':c.kind==='poisonfx'?'154,95,194':c.kind==='hostgas'?'140,160,60':c.kind==='spore'?'200,90,70':c.kind==='dust'?'230,210,150':c.kind==='honey'||c.kind==='allyhoney'?'240,180,60':c.kind==='gas'?'210,140,60':'170,190,80';
    ctx.fillStyle='rgba('+col+','+(0.32*a)+')';for(let i=0;i<6;i++){const an=i/6*TAU+c.t*0.8;ctx.beginPath();ctx.arc(c.x+Math.cos(an)*c.r*0.42,c.y+Math.sin(an)*c.r*0.42,c.r*0.55,0,TAU);ctx.fill();}
    if(c.kind==='dust'||c.kind==='spore'){ctx.fillStyle='rgba(255,255,255,'+(0.6*a)+')';for(let i=0;i<8;i++){const an=i*0.8+c.t*2;dot(c.x+Math.cos(an)*c.r*0.7*((i%3+1)/3),c.y+Math.sin(an)*c.r*0.7*((i%3+1)/3),1.6,'rgba(255,255,255,'+(0.6*a)+')');}}}
  for(const t of trails){const a=1-t.t/t.life;ctx.fillStyle='rgba(154,95,194,'+(0.35*a)+')';ctx.beginPath();ctx.arc(t.x,t.y,10,0,TAU);ctx.fill();}
  for(const w of waves){const k=w.t/w.life;ctx.strokeStyle='rgba(200,230,255,'+(1-k)+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(w.x,w.y,20+k*40,0,TAU);ctx.stroke();}
}
function drawShots(){
  for(const sh of shots){
    if(sh.kind==='honey'){inked(ellP(sh.x,sh.y,8,8),'#f2b632',1.5);dot(sh.x-2,sh.y-2,2,'#fff8d0');}
    else if(sh.kind==='sting'){ctx.save();ctx.translate(sh.x,sh.y);ctx.rotate(Math.atan2(sh.vy,sh.vx));inked(()=>{ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-6,-3);ctx.lineTo(-6,3);ctx.closePath();},'#3a2410',1.2);ctx.restore();}
    else if(sh.kind==='pellet'){inked(ellP(sh.x,sh.y,6,6),'#6b5a3a',1.4);}
    else if(sh.kind==='water'){inked(ellP(sh.x,sh.y,6,8,Math.atan2(sh.vy,sh.vx)+Math.PI/2),'#8fc0e0',1.3);dot(sh.x-2,sh.y-2,1.6,'#fff');}
    else if(sh.kind==='twig'){ctx.save();ctx.translate(sh.x,sh.y);ctx.rotate(sh.t*12);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.stroke();ctx.strokeStyle='#8a6a44';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
    else if(sh.kind==='scale'){ctx.save();ctx.translate(sh.x,sh.y);ctx.rotate(sh.t*8);ctx.fillStyle='rgba(255,250,220,.9)';ctx.beginPath();ctx.ellipse(0,0,7,4,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(200,150,60,.8)';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();}
    else{ctx.strokeStyle='rgba(250,250,250,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sh.x,sh.y,7,0,TAU);ctx.moveTo(sh.x-8,sh.y);ctx.lineTo(sh.x+8,sh.y);ctx.moveTo(sh.x,sh.y-8);ctx.lineTo(sh.x,sh.y+8);ctx.stroke();}
  }
}
function drawFx(){
  for(const f of fx){
    if(f.arc){ctx.strokeStyle=(f.col||'rgba(255,255,255,')+(1-f.t/f.life)+')';ctx.lineWidth=5;ctx.beginPath();ctx.arc(f.x,f.y,f.r,f.a-f.w,f.a+f.w);ctx.stroke();continue;}
    if(f.ring){ctx.strokeStyle='rgba(255,240,200,'+(1-f.t/f.life)+')';ctx.lineWidth=4;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(0.6+0.4*f.t/f.life),0,TAU);ctx.stroke();continue;}
    if(f.grab){const k=1-Math.abs(1-2*f.t/f.life),ex=f.x+Math.cos(f.a)*f.len*k,ey=f.y+Math.sin(f.a)*f.len*k;ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(ex,ey);ctx.stroke();ctx.strokeStyle='#8a7650';ctx.lineWidth=3;ctx.stroke();continue;}
    ctx.globalAlpha=1-f.t/f.life;dot(f.x,f.y,3,f.c);}
  ctx.globalAlpha=1;
}
function drawPops(){
  ctx.textAlign='center';
  for(const p of pops){ctx.globalAlpha=Math.min(1,(0.95-p.t)*3);const sz=p.big?16:13;ctx.font='900 '+sz+'px '+FONT;ctx.lineWidth=3.5;ctx.strokeStyle='#fff';const y=p.y-p.t*32;ctx.strokeText(p.text,p.x,y);ctx.fillStyle=p.col;ctx.fillText(p.text,p.x,y);}
  ctx.globalAlpha=1;
}
function drawExit(){
  if(!S.exit)return;const x=S.exit.x,y=S.exit.y,p=1+Math.sin(S.t*4)*0.08;
  const g=ctx.createRadialGradient(x,y,4,x,y,80);g.addColorStop(0,'rgba(255,230,140,.85)');g.addColorStop(1,'rgba(255,200,80,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,80,0,TAU);ctx.fill();
  ctx.save();ctx.translate(x,y);ctx.scale(p,p);ctx.rotate(-0.4);
  inked(()=>{ctx.beginPath();ctx.moveTo(-34,0);ctx.quadraticCurveTo(0,-26,36,0);ctx.quadraticCurveTo(0,26,-34,0);ctx.closePath();},'#f2b632',2.4);
  ctx.strokeStyle='rgba(120,70,10,.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-30,0);ctx.lineTo(32,0);ctx.stroke();ctx.restore();
  ctx.font='900 14px '+FONT;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#fff';const lb=S.areaI+1<AREAS.length?AREAS[S.areaI+1].name+'へ':'すすむ';ctx.strokeText(lb,x,y+48);ctx.fillStyle=INK;ctx.fillText(lb,x,y+48);
}
function drawWorld(v){
  const A=AREA(),M=MAP;
  ctx.fillStyle=PAT[A.bg]||GROUND[A.bg];ctx.fillRect(-400,-400,M.w+800,M.h+800);
  for(const d of visibleDecor(v.x0-60,v.y0-60,v.x1+60,v.y1+60))drawDecor(d);
  /* outside the map: darker foliage band */
  ctx.fillStyle='rgba(30,20,10,.35)';ctx.fillRect(-400,-400,M.w+800,400);ctx.fillRect(-400,M.h,M.w+800,400);ctx.fillRect(-400,0,400,M.h);ctx.fillRect(M.w,0,400,M.h);
  if(M.river)drawRiver(M.river,v);
  if(!M.dojo)drawLairFloor(M.lair);
  if(M.throne){drawSap({x:M.throne.x,y:M.throne.y,rx:M.throne.rx,ry:M.throne.ry});}
  for(const a of M.arenas)if(onScreen(v,a.x,a.y,a.R+40)){ctx.save();drawArenaGround(a);ctx.restore();}
  if(M.sumo&&onScreen(v,M.sumo.x,M.sumo.y,200))drawSumoRing(M.sumo);
  for(const s of M.saps)if(onScreen(v,s.x,s.y,100))drawSap(s);
  for(const w of M.webs)if(!w.regrow&&onScreen(v,w.x,w.y,80))drawWeb(w);
  drawSumika(M.sumika,Math.hypot(P.x-M.sumika.x,P.y-M.sumika.y)<160,M.dojo?'もどる':'すみか');
  for(const f of M.frogs)if(onScreen(v,f.x,f.y,260)&&f.st==='hide')drawFrog(f);
  for(const t of trails){}
  for(const f of foods)if(onScreen(v,f.x,f.y,20))drawFood(f);
  drawExit();
  for(const it of items)if(onScreen(v,it.x,it.y,40))drawItem(it);
  for(const o of M.obst){if(o.k==='shroom'){if(onScreen(v,o.x,o.y,60))drawShroom(o);continue;}
    if(o.k==='log'){if(onScreen(v,(o.x1+o.x2)/2,(o.y1+o.y2)/2,Math.hypot(o.x2-o.x1,o.y2-o.y1)/2+60))drawObst(o,A.bg);continue;}
    if(onScreen(v,o.x,o.y,o.r+20))drawObst(o,A.bg);}
  for(const o of M.border)if(onScreen(v,o.x,o.y,o.r+20))drawObst(o,A.bg);
  if(!M.dojo)drawLairFence(M.lair,M.lair.open,M.lair.openT);
}
function drawArenaGround(a){
  drawArena(a,a.keeper==='shihan'?'けいこ':TYPES[a.keeper].name.replace(/^.*の /,'').slice(0,6),a.beaten);
}
function render(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(!PAT.soil)makePatterns();
  if(S.state==='ending'||S.state==='endcard'){renderEnding();return;}
  if(!MAP||!P){ctx.fillStyle='#c9a66e';ctx.fillRect(0,0,W,Hh);return;}
  const v=camView(),A=AREA();
  ctx.fillStyle=BGFILL[A.bg];ctx.fillRect(0,0,W,Hh);
  const sh=OPT.shake?Math.min(7,S.shake*0.6):0;
  ctx.save();ctx.translate(W/2+(Math.random()-.5)*sh,Hh/2+(Math.random()-.5)*sh);ctx.scale(v.s,v.s);ctx.translate(-v.cx,-v.cy);
  drawWorld(v);
  drawBgWorld();drawThemeWorld();drawTavern();drawTrophies();drawDigs();drawBalls();drawNetWorld();drawPredWorld();
  /* ground-level actors sorted by y */
  const acts=[];
  for(const c of corpses){if(onScreen(v,c.e.x,c.e.y,60)){acts.push({y:c.e.y-30,f:()=>{c.e.dying=c.t/0.9;drawEntity(c.e,!!c.ally);c.e.dying=0;}});}}
  for(const e of E)if(e.z<18&&onScreen(v,e.x,e.y,120))acts.push({y:e.y,f:()=>drawEntity(e,false)});
  for(const A of allies())if(A.z<18)acts.push({y:A.y,f:()=>drawEntity(A,true)});
  if(S.state==='play'){const at=aimTarget();if(at){ctx.save();ctx.translate(at.x,at.y);ctx.rotate(S.t*2);ctx.strokeStyle='rgba(200,69,45,.75)';ctx.lineWidth=2.5;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(0,0,at.r+9,i*Math.PI/2+0.2,i*Math.PI/2+1.2);ctx.stroke();}ctx.restore();}}
  if(S.state!=='title')acts.push({y:P.y,f:drawPlayer});
  for(const e of E)if((e.T.boss||e.T.keeper||e.T.nushi)&&onScreen(v,e.x,e.y,300))drawTelegraph(e);
  acts.sort((a,b)=>a.y-b.y);for(const a of acts)a.f();
  drawCameo();
  for(const f of MAP.frogs)if(f.st!=='hide'&&onScreen(v,f.x,f.y,260))drawFrog(f);
  drawClouds();
  for(const e of E)if(e.z>=18&&onScreen(v,e.x,e.y,120))drawEntity(e,false);
  for(const A of allies())if(A.z>=18)drawEntity(A,true);
  drawShots();
  for(const e of E)if(onScreen(v,e.x,e.y,80))drawTag(e);
  for(const A of allies())drawAllyTag(A);
  drawBird();drawFx();drawRkWorld();drawPops();
  ctx.restore();RV=v;
  const ph=MAP.dojo?'day':skyPhase();
  const tint=ph==='dusk'?'rgba(240,120,40,.15)':ph==='dawn'?'rgba(240,160,190,.12)':TINT[A.time];if(tint){ctx.fillStyle=tint;ctx.fillRect(0,0,W,Hh);}
  if(A.dark)drawNight(v,0.8);else if(ph==='night')drawNight(v,0.68);
  if(isRain())drawRain(v);
  const vg=ctx.createRadialGradient(W/2,Hh/2,Math.min(W,Hh)*0.42,W/2,Hh/2,Math.hypot(W,Hh)*0.62);vg.addColorStop(0,'rgba(255,220,120,0)');vg.addColorStop(1,A.dark?'rgba(5,4,15,.5)':A.time==='evening'?'rgba(80,20,30,.32)':'rgba(120,70,20,.26)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,Hh);
  drawScreenUI();
}
function drawRain(v){
  ctx.fillStyle='rgba(50,70,100,.2)';ctx.fillRect(0,0,W,Hh);
  ctx.strokeStyle='rgba(220,235,255,.55)';ctx.lineWidth=1.3;ctx.beginPath();
  for(let i=0;i<90;i++){const x=((hash(i)*W*1.2+S.t*70)%(W*1.2))-W*0.1,y=(hash(i+50)*Hh+S.t*900*(0.7+hash(i+9)*0.6))%Hh;ctx.moveTo(x,y);ctx.lineTo(x-5,y+18);}ctx.stroke();
  ctx.strokeStyle='rgba(230,240,255,.5)';ctx.lineWidth=1;for(let i=0;i<14;i++){const k=(S.t*1.3+hash(i+90))%1,x=hash(i+100)*W,y=hash(i+130)*Hh;ctx.globalAlpha=1-k;ctx.beginPath();ctx.ellipse(x,y,4+k*14,2+k*6,0,0,TAU);ctx.stroke();}ctx.globalAlpha=1;
}
function drawNight(v,alpha){
  if(!HAS_DOM)return;
  if(!LIGHT){LIGHT=document.createElement('canvas');lctx=LIGHT.getContext('2d');LIGHT.width=Math.round(W*DPR/2);LIGHT.height=Math.round(Hh*DPR/2);}
  const k=LIGHT.width/W,toS=(x,y)=>[((x-v.cx)*v.s+W/2)*k,((y-v.cy)*v.s+Hh/2)*k];
  lctx.globalCompositeOperation='source-over';lctx.clearRect(0,0,LIGHT.width,LIGHT.height);lctx.fillStyle='rgba(12,10,32,'+(alpha||0.8)+')';lctx.fillRect(0,0,LIGHT.width,LIGHT.height);
  lctx.globalCompositeOperation='destination-out';
  const hole=(x,y,r,a)=>{const [sx,sy]=toS(x,y),rr=r*v.s*k;if(sx<-rr||sy<-rr||sx>LIGHT.width+rr||sy>LIGHT.height+rr)return;const g=lctx.createRadialGradient(sx,sy,rr*0.15,sx,sy,rr);g.addColorStop(0,'rgba(0,0,0,'+a+')');g.addColorStop(1,'rgba(0,0,0,0)');lctx.fillStyle=g;lctx.beginPath();lctx.arc(sx,sy,rr,0,TAU);lctx.fill();};
  hole(P.x,P.y,(alpha<0.75?250:300)+((P.glowT||0)>0?140:0),0.95);if(S.flies)for(const f of S.flies)hole(f.x,f.y,60,0.6);
  for(const s of MAP.saps)hole(s.x,s.y,190,0.85);
  if(MAP.throne)hole(MAP.throne.x,MAP.throne.y,330,0.9);
  hole(MAP.sumika.x,MAP.sumika.y-30,170,0.8);
  if(S.exit)hole(S.exit.x,S.exit.y,160,0.9);
  for(const it of items)hole(it.x,it.y,70,0.6);
  for(let i=0;i<14;i++){const x=(hash(i)*MAP.w+Math.sin(S.t*0.3+i)*80),y=(hash(i+40)*MAP.h+Math.cos(S.t*0.25+i)*60);hole(x,y,40,0.5*(0.5+0.5*Math.sin(S.t*2+i*1.7)));}
  ctx.drawImage(LIGHT,0,0,W,Hh);drawFliesScreen(v);
  /* fireflies on top */
  for(let i=0;i<14;i++){const x=(hash(i)*MAP.w+Math.sin(S.t*0.3+i)*80),y=(hash(i+40)*MAP.h+Math.cos(S.t*0.25+i)*60),sx=(x-v.cx)*v.s+W/2,sy=(y-v.cy)*v.s+Hh/2;const a=0.5+0.5*Math.sin(S.t*2+i*1.7);dot(sx,sy,2.4,'rgba(220,255,140,'+a+')');}
}
function drawGuide(v){
  const t=objectiveTarget();if(!t||S.state!=='play'||S.talk)return;
  const sx=(t.x-v.cx)*v.s+W/2,sy=(t.y-v.cy)*v.s+Hh/2,m=46;
  if(sx>m&&sx<W-m&&sy>150&&sy<Hh-150)return;
  const a=Math.atan2(sy-Hh/2,sx-W/2),cx=W/2,cy=Hh/2;
  const k=Math.min((W/2-m)/Math.abs(Math.cos(a)||1e-6),(Hh/2-170)/Math.abs(Math.sin(a)||1e-6));
  const x=cx+Math.cos(a)*k,y=cy+Math.sin(a)*k,pulse=1+Math.sin(S.t*5)*0.1;
  ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.scale(pulse,pulse);ctx.globalAlpha=0.9;
  ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-10,-12);ctx.lineTo(-4,0);ctx.lineTo(-10,12);ctx.closePath();ctx.fillStyle=S.exit?'#f2b632':'#c8452d';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.stroke();ctx.restore();ctx.globalAlpha=1;
}
function drawCutin(){
  const c=S.cutin;if(!c)return;const t=c.t,e=c.e,inK=Math.min(1,t/0.22),outK=t>1.3?Math.min(1,(t-1.3)/0.3):0,k=inK*(1-outK);
  ctx.fillStyle='rgba(10,5,15,'+(0.55*k)+')';ctx.fillRect(0,0,W,Hh);
  const bh=Math.min(Hh*0.3,190),y=Hh*0.42,off=(1-inK)*W-outK*W;
  ctx.save();ctx.translate(off,0);ctx.translate(W/2,y);ctx.rotate(-0.08);
  ctx.fillStyle='#c8452d';ctx.fillRect(-W,-bh/2,W*2,bh);ctx.fillStyle=INK;ctx.fillRect(-W,-bh/2-6,W*2,6);ctx.fillRect(-W,bh/2,W*2,6);
  ctx.strokeStyle='rgba(255,230,200,.35)';ctx.lineWidth=2;for(let i=0;i<14;i++){const yy=-bh/2+hash(i)*bh,xx=((t*1800+hash(i+3)*W*2)%(W*2))-W;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx-120,yy);ctx.stroke();}
  ctx.save();ctx.translate(-W*0.26,6);ctx.rotate(-Math.PI/2+0.3);const R=Math.min(70,bh*0.36);drawBugBody(e.T,R,{type:e.type,walk:0,flap:S.t*30,open:1,ext:1});ctx.restore();
  ctx.fillStyle='#fff6e0';ctx.textAlign='left';ctx.font=clamp(W*0.07,22,40)+'px '+DFONT;ctx.strokeStyle=INK;ctx.lineWidth=5;
  const nm=e.T.name.replace(/^.*(番長|若頭|ぬし) ?/,'');ctx.strokeText(nm,-W*0.08,-bh*0.12);ctx.fillText(nm,-W*0.08,-bh*0.12);
  ctx.font='900 '+clamp(W*0.036,13,18)+'px '+FONT;ctx.fillStyle='#fff';const q='「'+c.text+'」';wrapText(q,-W*0.08,bh*0.12,W*0.62,22);
  ctx.restore();
}
function drawScreenUI(){
  drawMgScreen();drawThemeScreen();drawChainScreen();drawWindScreen();drawCutin();drawRkScreen();
  if(S.flash>0){ctx.fillStyle='rgba(255,252,240,'+Math.min(0.8,S.flash)+')';ctx.fillRect(0,0,W,Hh);}
  drawGuide(camView());
  const TOPY=typeof UI!=='undefined'&&UI.topY?UI.topY:200;let topY=TOPY;
  if(MAP&&MAP.dojo&&S.state==='play'){const w=230,x=(W-w)/2,y=topY;topY+=52;ctx.fillStyle='rgba(42,33,24,.85)';ctx.fillRect(x,y,w,44);ctx.fillStyle='#f2b632';ctx.font='700 12px '+FONT;ctx.textAlign='center';ctx.fillText('けいこ場',W/2,y+16);ctx.fillStyle='#fff';ctx.font='700 15px '+FONT;ctx.fillText('ダメージ/秒 '+Math.round(dojoDps())+'   ・   最大 '+Math.round(S.stats.maxHit||0),W/2,y+35);}
  const b0=S.bossBar;if(b0&&!b0.dead&&S.state==='play'&&!S.talk)topY+=44;
  if(S.challenge&&S.state==='play'&&!S.bossDown){ctx.fillStyle='rgba(200,69,45,.92)';const w=150,x=(W-w)/2,y=topY;ctx.fillRect(x,y,w,26);ctx.fillStyle='#fff';ctx.font='700 13px '+FONT;ctx.textAlign='center';ctx.fillText('挑戦状 '+fmtTime(S.chalT),W/2,y+18);}
  const b=S.bossBar;
  if(b&&!b.dead&&S.state==='play'&&!S.talk){const w=Math.min(W-32,440),x=(W-w)/2,y=TOPY+(MAP.dojo?52:0);
    ctx.fillStyle='rgba(244,234,210,.96)';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.fillRect(x,y,w,36);ctx.strokeRect(x,y,w,36);
    ctx.fillStyle=INK;ctx.font='900 12px '+FONT;ctx.textAlign='left';ctx.fillText((b.T.keeper?'門番 ':b.T.nushi?'ぬし ':'')+b.T.name+'  Lv'+b.lv+(b.phase===2?'  ― 本気 ―':''),x+8,y+14);
    ctx.fillStyle='#fff';ctx.fillRect(x+8,y+20,w-16,9);ctx.fillStyle=b.phase===2?'#a0281a':'#c8452d';ctx.fillRect(x+8,y+20,(w-16)*Math.max(0,b.hp/b.maxhp),9);ctx.lineWidth=1.5;ctx.strokeRect(x+8,y+20,w-16,9);
    ctx.strokeStyle=INK;ctx.beginPath();ctx.moveTo(x+8+(w-16)*0.5,y+18);ctx.lineTo(x+8+(w-16)*0.5,y+31);ctx.stroke();}
  if(S.sumo){ctx.fillStyle='rgba(244,234,210,.96)';ctx.strokeStyle=INK;ctx.lineWidth=2.5;const w=240,x=(W-w)/2,y=TOPY;ctx.fillRect(x,y,w,32);ctx.strokeRect(x,y,w,32);ctx.fillStyle=INK;ctx.font='700 13px '+FONT;ctx.textAlign='center';ctx.fillText('相撲：土俵から 押し出したら 勝ち',W/2,y+21);}
  if(stick.id===null&&S.state==='play'&&!S.talk&&S.t<(S.stickGhostUntil||0)){ctx.strokeStyle='rgba(42,33,24,.25)';ctx.lineWidth=3;const gx=70,gy=Hh-150;ctx.beginPath();ctx.arc(gx,gy,48,0,TAU);ctx.stroke();ctx.fillStyle='rgba(244,234,210,.45)';ctx.beginPath();ctx.arc(gx+Math.cos(S.t*2)*20,gy+Math.sin(S.t*2)*20,20,0,TAU);ctx.fill();}
  if(stick.id!==null&&S.state==='play'){ctx.strokeStyle='rgba(42,33,24,.5)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(stick.ox,stick.oy,44,0,TAU);ctx.stroke();ctx.fillStyle='rgba(244,234,210,.85)';ctx.beginPath();ctx.arc(stick.ox+inp.x*40,stick.oy+inp.y*40,20,0,TAU);ctx.fill();ctx.stroke();}
}
/* minimap into a small canvas */
function drawMinimap(mc){
  if(!MAP||!P)return;const g=mc.getContext('2d'),w=mc.width,h=mc.height,M=MAP,s=Math.min(w/M.w,h/M.h),ox=(w-M.w*s)/2,oy=(h-M.h*s)/2;
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);
  g.fillStyle=GROUND[AREA().bg];g.fillRect(ox,oy,M.w*s,M.h*s);
  g.save();g.translate(ox,oy);g.scale(s,s);
  if(M.river){g.strokeStyle='#5f8fb0';g.lineWidth=M.river.w;g.lineCap='round';g.beginPath();g.moveTo(M.river.pts[0][0],M.river.pts[0][1]);for(const p of M.river.pts)g.lineTo(p[0],p[1]);g.stroke();
    g.strokeStyle='#b8946a';g.lineWidth=60;for(const c of M.river.cross){g.beginPath();g.moveTo(c.ax,c.ay);g.lineTo(c.bx,c.by);g.stroke();}}
  g.fillStyle='rgba(42,33,24,.35)';for(const o of M.obst){if(o.k==='log'){g.strokeStyle='rgba(42,33,24,.35)';g.lineWidth=o.r*2;g.beginPath();g.moveTo(o.x1,o.y1);g.lineTo(o.x2,o.y2);g.stroke();}else{g.beginPath();g.arc(o.x,o.y,o.r,0,TAU);g.fill();}}
  const L=M.lair;g.strokeStyle=L.open?'#b8860b':'#c8452d';g.lineWidth=40;g.setLineDash(L.open?[]:[90,50]);g.beginPath();g.arc(L.x,L.y,L.R,0,TAU);g.stroke();g.setLineDash([]);
  const boss=E.find(e=>e.T.boss&&!e.dead);if(boss){g.fillStyle=INK;g.font='bold 220px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('番',L.x,L.y);}
  for(const a of M.arenas){g.strokeStyle=a.beaten?'rgba(42,33,24,.4)':'#c8452d';g.lineWidth=36;g.beginPath();g.arc(a.x,a.y,a.R,0,TAU);g.stroke();if(!a.beaten){g.fillStyle='#c8452d';g.beginPath();g.arc(a.x,a.y,70,0,TAU);g.fill();}}
  if(M.sumo&&S.seenSumo){g.strokeStyle='#b8860b';g.lineWidth=40;g.beginPath();g.arc(M.sumo.x,M.sumo.y,M.sumo.R,0,TAU);g.stroke();}
  g.fillStyle='#5f7d3a';g.beginPath();g.moveTo(M.sumika.x,M.sumika.y-90);g.lineTo(M.sumika.x+80,M.sumika.y);g.lineTo(M.sumika.x-80,M.sumika.y);g.closePath();g.fill();g.fillRect(M.sumika.x-55,M.sumika.y,110,70);
  g.fillStyle='#f2b632';for(const it of items){g.beginPath();g.arc(it.x,it.y,50,0,TAU);g.fill();}
  if(S.exit){g.fillStyle='#f2b632';g.beginPath();g.arc(S.exit.x,S.exit.y,90,0,TAU);g.fill();}
  for(const e of E)if(e.T.nushi&&e.met){g.fillStyle='#7a3ac0';g.beginPath();g.arc(e.x,e.y,90,0,TAU);g.fill();}
  for(const A of allies()){g.fillStyle='#5f7d3a';g.beginPath();g.arc(A.x,A.y,55,0,TAU);g.fill();}
  g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=24;g.beginPath();g.arc(P.x,P.y,80,0,TAU);g.fill();g.stroke();
  g.fillStyle=INK;g.beginPath();g.moveTo(P.x+Math.cos(P.ang)*150,P.y+Math.sin(P.ang)*150);g.lineTo(P.x+Math.cos(P.ang+2.4)*90,P.y+Math.sin(P.ang+2.4)*90);g.lineTo(P.x+Math.cos(P.ang-2.4)*90,P.y+Math.sin(P.ang-2.4)*90);g.closePath();g.fill();
  g.restore();
  g.strokeStyle=INK;g.lineWidth=2;g.strokeRect(ox+1,oy+1,M.w*s-2,M.h*s-2);
}

/* ---------------- ending scenes ---------------- */
const ease=k=>k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
function endBg(top,bot){const g=ctx.createLinearGradient(0,0,0,Hh);g.addColorStop(0,top);g.addColorStop(1,bot);ctx.fillStyle=g;ctx.fillRect(0,0,W,Hh);}
function spot(x,y,r,a){const g=ctx.createRadialGradient(x,y,r*0.2,x,y,r);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(8,4,14,'+a+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,Hh);}
function renderEnding(){
  const sc=SCN()[Math.min(END.scene,SCN().length-1)],t=END.t,s=clamp(Math.min(W,Hh)/430,0.8,1.5);
  ART_T=S.t;const lines=sc.lines(S.cycle>0),L=lines[Math.min(END.line,lines.length-1)]||{};
  if(sc.id==='op_sky'){
    const k=END.line>=2?ease(clamp(END.actT/3.4,0,1)):0,off=-k*Hh*0.72;
    const th=S.cycle>=2?theme():null,storm=th==='taifu'||th==='ooame',night=th==='hotaru',hot=th==='hideri';endBg(night?'#0c1230':storm?'#4a5868':hot?'#e8984a':'#4fa6e2',night?'#2a3458':storm?'#9aa8b4':hot?'#ffe2a8':'#d8f0ff');
    if(night){for(let i=0;i<90;i++)dot(hash(i)*W,hash(i+7)*Hh*0.8+off*0.4,hash(i+3)*1.5+0.4,'rgba(255,255,230,'+(0.4+0.4*Math.sin(S.t*2+i))+')');}
    ctx.save();ctx.translate(0,off*0.6);if(storm||night)ctx.globalAlpha=0;
    const sx=W*0.78,sy=Hh*0.15,sg=ctx.createRadialGradient(sx,sy,10,sx,sy,170);sg.addColorStop(0,'rgba(255,255,230,1)');sg.addColorStop(0.25,'rgba(255,250,200,.75)');sg.addColorStop(1,'rgba(255,250,200,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sx,sy,170,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(255,250,210,.6)';ctx.lineWidth=3;for(let i=0;i<14;i++){const a=i/14*TAU+S.t*0.15;ctx.beginPath();ctx.moveTo(sx+Math.cos(a)*56,sy+Math.sin(a)*56);ctx.lineTo(sx+Math.cos(a)*(80+8*Math.sin(S.t*3+i)),sy+Math.sin(a)*(80+8*Math.sin(S.t*3+i)));ctx.stroke();}
    dot(sx,sy,40,'#fffbe0');
    ctx.restore();ctx.globalAlpha=1;
    const cum=(x,y,c)=>{const P0=[[0,0,1],[-0.9,0.25,0.7],[0.95,0.2,0.75],[-0.4,-0.55,0.75],[0.45,-0.6,0.8],[0.05,-1.1,0.65],[-1.6,0.5,0.45],[1.7,0.45,0.5]];
      ctx.fillStyle=INK;for(const [a,b,r] of P0){ctx.beginPath();ctx.arc(x+a*c,y+b*c,r*c+3,0,TAU);ctx.fill();}
      for(const [a,b,r] of P0){const g=ctx.createRadialGradient(x+a*c-r*c*0.3,y+b*c-r*c*0.4,r*c*0.1,x+a*c,y+b*c,r*c);g.addColorStop(0,night?'#3a4468':storm?'#c8ced6':'#ffffff');g.addColorStop(1,night?'#1a2240':storm?'#7a8696':hot?'#f6dcb0':'#dfe9f2');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x+a*c,y+b*c,r*c,0,TAU);ctx.fill();}
      ctx.fillStyle=night?'rgba(10,15,40,.35)':'rgba(120,150,190,.22)';ctx.beginPath();ctx.ellipse(x,y+0.75*c,2.0*c,0.28*c,0,0,TAU);ctx.fill();};
    ctx.save();ctx.beginPath();ctx.rect(0,0,W,Hh);ctx.clip();
    cum(W*0.3+Math.sin(S.t*0.1)*10,Hh*0.42+off*0.8,Math.min(W,Hh)*0.13);cum(W*0.88,Hh*0.55+off*0.85,Math.min(W,Hh)*0.08);cum(W*0.05,Hh*0.7+off*0.9,Math.min(W,Hh)*0.06);
    ctx.restore();
    /* the kunugi rises into view (painted once, cached) */
    {const top=Hh*1.04+off,img=sceneCanvas('tree',Math.round(W),Math.round(Hh*1.15),paintTree);ctx.drawImage(img,0,top-Hh*0.1,W,Hh*1.15);
      if(storm||night){ctx.fillStyle=night?'rgba(10,15,40,.6)':'rgba(40,50,70,.25)';ctx.fillRect(0,top-Hh*0.1,W,Hh*1.15);}}
    if(storm){ctx.strokeStyle='rgba(220,235,255,.5)';ctx.lineWidth=1.4;ctx.beginPath();for(let i=0;i<120;i++){const x=((hash(i)*W*1.4+S.t*260)%(W*1.4))-W*0.2,y=(hash(i+50)*Hh+S.t*900*(0.7+hash(i+9)*0.6))%Hh;ctx.moveTo(x,y);ctx.lineTo(x-12,y+20);}ctx.stroke();if(th==='taifu'&&Math.sin(S.t*1.7)>0.985){ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(0,0,W,Hh);}}
    else if(night){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<26;i++){const x=hash(i+60)*W+Math.sin(S.t*0.7+i)*20,y=Hh*(0.45+hash(i+61)*0.5)+Math.cos(S.t*0.6+i)*14,b=0.4+0.6*Math.max(0,Math.sin(S.t*3+i*2));const g2=ctx.createRadialGradient(x,y,1,x,y,16);g2.addColorStop(0,'rgba(220,255,120,'+b+')');g2.addColorStop(1,'rgba(220,255,120,0)');ctx.fillStyle=g2;ctx.beginPath();ctx.arc(x,y,16,0,TAU);ctx.fill();}ctx.restore();}
    else{ /* heat shimmer */
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=2;for(let i=0;i<6;i++){const y=Hh*(0.2+i*0.12)+off*0.5;ctx.beginPath();for(let x=0;x<=W;x+=12)ctx.lineTo(x,y+Math.sin(x*0.03+S.t*3+i)*3);ctx.stroke();}}
  }else if(sc.id==='op_bar'||sc.id==='op_kick'){
    ctx.fillStyle=PAT.sapbark||'#4a3424';ctx.fillRect(0,0,W,Hh);
    const S2=s*1.45,cx=W/2,cy=Hh*0.36,act=END.act,at=END.actT,kick=sc.id==='op_kick';
    ctx.save();ctx.translate(cx,cy);ctx.scale(S2,S2);
    drawSap({x:0,y:0,rx:112,ry:68});
    const inv=act==='invade'||(S.cycle>0&&END.line>=2);
    const crowd=[['kanabun',-150,30],['kokuwa',-120,110],['hachi',-40,140],['ga',150,40],['kamikiri',125,115],['tento',45,150],['ari',-175,-40],['kanabun',170,-30]];
    crowd.forEach(([b,x,y],i)=>{const T=TYPES[b];if(!T)return;const look=inv?0:Math.atan2(-y,-x);const bob=act==='laughall'?Math.abs(Math.sin(S.t*9+i))*6:Math.sin(S.t*2+i)*1.5;
      ctx.save();ctx.translate(x,y-bob);ctx.rotate(look);drawBugBody(T,Math.min(T.r,17),{type:b,walk:inv?S.t*4:0,flap:S.t*20,open:act==='laughall'?0.8:0.2});ctx.restore();
      if(act==='laughall'&&i%2===0){ctx.font='18px '+DFONT;ctx.fillStyle='#fff3c4';ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.textAlign='center';const yy=y-26-((S.t*0.8+i*0.3)%1)*30;ctx.strokeText('わは',x,yy);ctx.fillText('わは',x,yy);}});
    /* kabuto on the throne */
    let kx=0,ky=-14,kr=Math.PI/2;
    if(kick&&act==='flick'){const k=clamp(at/0.25,0,1),b=at<0.25?k:Math.max(0,1-(at-0.25)/0.5);ky+=b*34;kr+=Math.sin(Math.min(1,at/0.3)*Math.PI)*-0.5;}
    if(act==='laugh'||act==='laughall'){ky+=Math.abs(Math.sin(S.t*8))*-4;}
    if(inv&&act==='invade')kr=Math.PI/2+Math.sin(Math.min(1,at)*Math.PI*0.5)*-0.9;
    if(act==='focus'||END.line>=1&&!kick){const g=ctx.createRadialGradient(kx,ky,10,kx,ky,90);g.addColorStop(0,'rgba(255,230,140,.35)');g.addColorStop(1,'rgba(255,230,140,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(kx,ky,90,0,TAU);ctx.fill();}
    ctx.save();ctx.translate(kx,ky+8);ctx.rotate(kr);drawBugBody(TYPES.kabuto,27,{type:'kabuto',walk:0,open:act==='laugh'?0.4+0.3*Math.sin(S.t*12):0.2});ctx.restore();
    if(act==='laugh'){ctx.font='26px '+DFONT;ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle=INK;ctx.fillStyle='#f2b632';for(let i=0;i<2;i++){const k=((at*0.7+i*0.5)%1);ctx.globalAlpha=1-k;const x=(i?1:-1)*70,y=-40-k*60;ctx.strokeText('がっはっは',x,y);ctx.fillText('がっはっは',x,y);}ctx.globalAlpha=1;}
    /* the dango (opening only) */
    if(kick){const ids=eqIds({head:defPart('head'),legs:defPart('legs'),tail:defPart('tail'),back:defPart('back')});
      if(act!=='flick'&&act!=='laughall'){const k=act==='walk'?ease(clamp(at/2.6,0,1)):1,y=lerp(330,110,k);ctx.save();ctx.translate(0,y);ctx.rotate(-Math.PI/2);drawDango(ids,17,{walk:k<1?S.t*7:0});ctx.restore();
        if(k>=1&&END.line===1){ctx.font='900 13px '+FONT;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText('もじもじ',34,92+Math.sin(S.t*6)*2);}}
      else if(act==='flick'&&at<1.1){const k=clamp((at-0.22)/0.8,0,1);if(at<0.22){ctx.save();ctx.translate(0,110);drawDango(ids,17,{rolled:true,ball:S.t*10});ctx.restore();}
        else{const x=k*260,y=110+k*420-Math.sin(k*Math.PI)*160,sc2=1+k*1.6;ctx.save();ctx.translate(x,y);ctx.scale(sc2,sc2);drawDango(ids,17,{rolled:true,ball:S.t*40});ctx.restore();
          for(let i=1;i<6;i++){const kk=Math.max(0,k-i*0.04);dot(kk*260,110+kk*420-Math.sin(kk*Math.PI)*160,4*(1-i/6),'rgba(255,243,196,'+(0.6-i*0.1)+')');}
          if(at<0.45){ctx.font='34px '+DFONT;ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle=INK;ctx.fillStyle='#fff';ctx.strokeText('ピーン！',40,80);ctx.fillText('ピーン！',40,80);}}}}
    /* the outsiders march in (2nd summer onward) */
    if(inv){const k=act==='invade'?at:9;for(let i=0;i<16;i++){const x=W/S2/2+40+i*26-k*120,y=150+(i%3)*22+Math.sin(i)*6;if(x>W/S2/2+60)continue;ctx.save();ctx.translate(Math.max(x,-60+i*10),y);ctx.rotate(Math.PI);drawBugBody(TYPES.hiari,9,{type:'hiari',walk:S.t*9+i});ctx.restore();}
      const qx=Math.max(70,W/S2/2+20-k*90);ctx.save();ctx.translate(qx,95);ctx.rotate(Math.PI);drawBugBody(TYPES.inv_sakaba||TYPES.hiari,24,{type:'inv_sakaba',walk:qx>70?S.t*6:0,open:0.5});ctx.restore();}
    ctx.restore();
    spot(cx,cy,Math.hypot(W,Hh)*0.6,act==='focus'?0.9:0.7);
  }else if(sc.id==='op_ground'){
    endBg('#c9a66e','#8a6a3a');
    ctx.drawImage(sceneCanvas('roots',Math.round(W),Math.round(Hh),paintRoots),0,0,W,Hh);
    {const gl=ctx.createRadialGradient(W*0.52,Hh*0.05,4,W*0.52,Hh*0.05,70);gl.addColorStop(0,'rgba(255,200,80,.75)');gl.addColorStop(1,'rgba(255,200,80,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(W*0.52,Hh*0.05,70,0,TAU);ctx.fill();inked(ellP(W*0.52,Hh*0.05,14,8),'#d8902e',1.5);}
    const act=END.act,at=END.actT,gx=W/2,groundY=Hh*0.66,ids=S.cycle>0?eqIds(P.eq):eqIds({head:defPart('head'),legs:defPart('legs'),tail:defPart('tail'),back:defPart('back')}),R=24*s;
    let st='stand',dx=gx,dy=groundY;
    if(S.cycle===0){if(END.line===0){st='ball';const k=clamp(at/1.6,0,1),bounce=Math.abs(Math.cos(k*Math.PI*2.5))*(1-k)*Hh*0.5;dy=groundY-bounce-(k<0.2?(0.2-k)*Hh*2:0);dx=gx-60+k*60;}else if(END.line===1&&act==='uncurl'&&at<0.5)st='ball';}
    if(st==='ball'){ctx.save();ctx.translate(dx,dy);drawDango(ids,R,{rolled:true,ball:S.t*20});ctx.restore();}
    else{const look=END.line>=1||S.cycle>0?-Math.PI/2:0;if(END.line===1&&S.cycle===0){ctx.font='900 14px '+FONT;ctx.fillStyle=INK;ctx.textAlign='center';ctx.fillText('くらくら',dx,dy-R*2.2);for(let i=0;i<3;i++){const a=S.t*4+i*2.1;dot(dx+Math.cos(a)*R*1.1,dy-R*1.5+Math.sin(a)*R*0.3,3,'#f2b632');}}
      ctx.save();ctx.translate(dx,dy);ctx.rotate(look);drawDango(ids,R,{walk:0});ctx.restore();
      const a=S.cycle>0&&endAlly();if(a){ctx.save();ctx.translate(dx-R*3,dy+R*0.4);ctx.rotate(-Math.PI/2);drawBugBody(TYPES[a.type],Math.min(TYPES[a.type].r,22)*s,{type:a.type,walk:0,ally:true,flap:S.t*20});ctx.restore();}}
    if(act==='resolve'){const k=clamp(at/0.35,0,1),sc2=lerp(2.4,1,ease(k));
      const g=ctx.createRadialGradient(dx,dy,10,dx,dy,R*5);g.addColorStop(0,'rgba(255,230,140,.4)');g.addColorStop(1,'rgba(255,230,140,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(dx,dy,R*5,0,TAU);ctx.fill();
      ctx.save();ctx.translate(W/2,Hh*0.5);ctx.rotate(-0.06);ctx.scale(sc2,sc2);ctx.globalAlpha=k;
      const tt=S.cycle>0?(S.cycle+1)+'年目の夏':'ひと夏の番長';ctx.font=clamp(W*0.12,40,72)+'px '+DFONT;ctx.textAlign='center';ctx.lineWidth=10;ctx.strokeStyle=INK;ctx.strokeText(tt,0,0);ctx.fillStyle='#f4ead2';ctx.fillText(tt,0,0);ctx.fillStyle='#c8452d';ctx.fillRect(-W*0.32,14,W*0.64,6);
      ctx.restore();ctx.globalAlpha=1;}
  }else if(sc.id==='fall'){
    ctx.fillStyle=PAT.sapbark||'#4a3424';ctx.fillRect(0,0,W,Hh);
    const z=1+Math.min(1,t/12)*0.12,cx=W/2,cy=Hh*0.4;
    ctx.save();ctx.translate(cx,cy);ctx.scale(s*1.3*z,s*1.3*z);
    drawSap({x:0,y:-40,rx:120,ry:72});
    [['kanabun',-150,0],['hachi',-120,90],['kamikiri',130,80],['tento',150,-10],['kokuwa',-60,150],['ga',70,150]].forEach(([b,x,y],i)=>{const T=TYPES[b];if(!T)return;ctx.save();ctx.translate(x,y-Math.abs(Math.sin(t*3+i))*(END.line>=2?4:0));ctx.rotate(Math.atan2(-40-y,-x));ctx.globalAlpha=0.85;drawBugBody(T,Math.min(T.r,15),{type:b,walk:0,flap:S.t*20,open:0.6});ctx.restore();ctx.globalAlpha=1;});
    const tilt=ease(Math.min(1,t/1.6)),slide=ease(clamp((t-2.4)/1.4,0,1));
    ctx.save();ctx.translate(-20-tilt*30-slide*40,-30+tilt*36+slide*30);ctx.rotate(1.3*tilt-Math.PI/2);drawBugBody(TYPES.kabuto,28,{type:'kabuto',walk:END.line===0?S.t*12:0,open:0.1,hurt:t<0.4});ctx.restore();
    for(let i=0;i<3;i++){const k=((t*0.7+i/3)%1);dot(10+i*10-tilt*30,-40-k*30+tilt*36,3*(1-k),'rgba(200,230,255,'+(1-k)+')');}
    ctx.save();ctx.translate(0,150-Math.min(1,t/3)*30);ctx.rotate(-Math.PI/2);drawDango(eqIds(P.eq),22,{walk:t<3?t*6:0});ctx.restore();
    const al=endAlly();if(al){ctx.save();ctx.translate(-46,170-Math.min(1,t/3)*30);ctx.rotate(-Math.PI/2);drawBugBody(TYPES[al.type],Math.min(TYPES[al.type].r,18),{type:al.type,walk:t<3?t*6:0,ally:true,flap:S.t*20});ctx.restore();}
    ctx.restore();spot(cx,cy,Math.hypot(W,Hh)*0.55,0.85);
  }else if(sc.id==='throne'){
    ctx.fillStyle=PAT.sapbark||'#4a3424';ctx.fillRect(0,0,W,Hh);
    const cx=W/2,cy=Hh*0.34;ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
    drawSap({x:0,y:0,rx:120,ry:76});
    const walked=END.line>0||END.act!=='walk'?1:ease(Math.min(1,END.actT/3.2));
    const py=lerp(240,0,walked);
    if(walked>=1){ctx.strokeStyle='rgba(255,230,140,'+(0.5+0.3*Math.sin(S.t*3))+')';ctx.lineWidth=3;for(let i=0;i<12;i++){const a=i/12*TAU+S.t*0.3;ctx.beginPath();ctx.moveTo(Math.cos(a)*44,Math.sin(a)*44);ctx.lineTo(Math.cos(a)*64,Math.sin(a)*64);ctx.stroke();}}
    ctx.save();ctx.translate(0,py);ctx.rotate(walked>=1?Math.PI/2:-Math.PI/2);drawDango(eqIds(P.eq),23,{walk:walked<1?S.t*7:0});ctx.restore();
    const al=endAlly();if(al){ctx.save();ctx.translate(walked>=1?-70:-34,walked>=1?70:py+40);ctx.rotate(-Math.PI/2+(walked>=1?0.6:0));drawBugBody(TYPES[al.type],Math.min(TYPES[al.type].r,18),{type:al.type,walk:walked<1?S.t*7:0,ally:true,flap:S.t*20});ctx.restore();}
    const gathered=END.line>=1;const gatherT=END.line===1?END.actT:9;
    const bosses=['osa','kamazo','zari','joou','kuwagata','suzume','kabuto'],RX=Math.min(210,W/2/s-48);
    bosses.forEach((b,i)=>{if(!gathered)return;const a=Math.PI*0.08+i/(bosses.length-1)*Math.PI*0.84,x=Math.cos(a)*RX,y=Math.sin(a)*190+40,T=TYPES[b];
      const appear=clamp((gatherT-i*0.3)/0.7,0,1);if(appear<=0)return;const focus=L.focus,isF=focus===b,dim=focus&&!isF;
      const bow=END.act==='chant'?Math.max(0,Math.sin(S.t*2.4-i*0.4))*0.14:0;
      ctx.save();ctx.globalAlpha=appear*(dim?0.45:1);ctx.translate(x*(0.6+0.4*appear),y+(1-appear)*60);ctx.rotate(-Math.PI/2);const k=(isF?1.3:1)*(1-bow);ctx.scale(k,k);
      if(isF){ctx.fillStyle='rgba(255,230,140,.25)';ctx.beginPath();ctx.arc(0,0,40,0,TAU);ctx.fill();}
      drawBugBody(T,Math.min(T.r,30)*1.0,{type:b,walk:appear<1?S.t*6:0,flap:S.t*20,open:isF?0.6+0.3*Math.sin(S.t*8):0.2});ctx.restore();ctx.globalAlpha=1;});
    if(END.act==='chant'){/* the whole forest comes out */
      const crowd=['ari','batta','tento','kumo','amenbo','ebigani','mitsubachi','kokuwa','kuroari','kanabun','hasami','kamadouma'];
      crowd.forEach((b,i)=>{const T=TYPES[b],x=(i-(crowd.length-1)/2)*34,y=300+(i%2)*26-Math.abs(Math.sin(S.t*5+i))*8;ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2);drawBugBody(T,Math.min(T.r,16)*0.9,{type:b,walk:S.t*5,flap:S.t*25});ctx.restore();});
      ctx.font='34px '+DFONT;ctx.textAlign='center';for(let i=0;i<4;i++){const k=((S.t*0.7+i/4)%1);ctx.globalAlpha=1-k;ctx.fillStyle='#f2b632';ctx.strokeStyle=INK;ctx.lineWidth=5;const x=(i%2?1:-1)*(70+i*20),y=180-k*150;ctx.strokeText('番長！',x,y);ctx.fillText('番長！',x,y);}ctx.globalAlpha=1;}
    ctx.restore();
    const vg=ctx.createRadialGradient(cx,cy,60,cx,cy,Math.hypot(W,Hh)*0.6);vg.addColorStop(0,'rgba(255,200,80,.15)');vg.addColorStop(1,'rgba(10,5,20,.7)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,Hh);
  }else if(sc.id==='matsuri'){
    endBg('#0e0c2a','#3a2030');
    for(let i=0;i<70;i++)dot(hash(i)*W,hash(i+9)*Hh*0.6,hash(i+3)*1.4+0.3,'rgba(255,255,230,'+(0.4+0.4*Math.sin(S.t*2+i))+')');
    ctx.globalCompositeOperation='lighter';
    for(const f of END.fireworks){const k=f.t/2.4,R=Math.min(W,Hh)*0.2*Math.sqrt(Math.min(1,f.t/0.8)),x=f.x*W,y=f.y*Hh;
      if(f.t<0.35){dot(x,Hh-(Hh-y)*(f.t/0.35),2.5,'#fffbe8');continue;}
      ctx.globalAlpha=Math.max(0,1-k);for(let i=0;i<f.n;i++){const a=i/f.n*TAU,px=x+Math.cos(a)*R,py=y+Math.sin(a)*R+k*k*40;dot(px,py,2.6,f.c);ctx.strokeStyle=f.c;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*R*0.6,y+Math.sin(a)*R*0.6+k*k*30);ctx.lineTo(px,py);ctx.stroke();}
      const fl=Math.max(0,0.25-f.t*0.3);if(fl>0){ctx.globalAlpha=fl;ctx.fillStyle=f.c;ctx.fillRect(0,0,W,Hh);}ctx.globalAlpha=1;}
    ctx.globalCompositeOperation='source-over';
    ctx.strokeStyle='#1a1020';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,Hh*0.46);ctx.quadraticCurveTo(W/2,Hh*0.56,W,Hh*0.46);ctx.stroke();
    for(let i=1;i<8;i++){const x=W*i/8,y=Hh*0.46+Math.sin(i/8*Math.PI)*Hh*0.1*0.95+14;const gl=ctx.createRadialGradient(x,y,2,x,y,30);gl.addColorStop(0,'rgba(255,170,80,.6)');gl.addColorStop(1,'rgba(255,170,80,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(x,y,30,0,TAU);ctx.fill();inked(ellP(x,y,10,14),'#e8603a',1.5);}
    ctx.fillStyle='#120a14';ctx.beginPath();ctx.moveTo(0,Hh);for(let x=0;x<=W;x+=20){ctx.lineTo(x,Hh*0.6-Math.abs(Math.sin(x*0.013))*Hh*0.08-Math.sin(x*0.05)*8);}ctx.lineTo(W,Hh);ctx.fill();
    /* the two of them sitting on a leaf, watching */
    ctx.save();ctx.translate(W/2,Hh*0.6);ctx.scale(s,s);
    ctx.fillStyle='#1e1420';ctx.beginPath();ctx.moveTo(-90,10);ctx.quadraticCurveTo(0,-30,100,8);ctx.quadraticCurveTo(0,30,-90,10);ctx.fill();
    ctx.save();ctx.translate(10,-6);ctx.rotate(-Math.PI/2);drawDango(eqIds(P.eq),17,{walk:0});ctx.restore();
    const a=endAlly();if(a){ctx.save();ctx.translate(-42,-2);ctx.rotate(-Math.PI/2+0.1);drawBugBody(TYPES[a.type],Math.min(TYPES[a.type].r,20)*0.85,{type:a.type,walk:0,ally:true,flap:S.t*20});ctx.restore();}
    ctx.restore();
    const crew=['osa','kamazo','zari','joou','kuwagata','suzume','kabuto','ari','batta','tento','kanabun'];
    crew.forEach((b,i)=>{const x=W*(i%6+0.5+(i>=6?0.5:0))/6,y=Hh*(i>=6?0.76:0.69)-Math.abs(Math.sin(S.t*4+i))*12*s;ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2+Math.sin(S.t*4+i)*0.25);drawBugBody(TYPES[b],Math.min(TYPES[b].r,26)*0.75*s,{type:b,walk:S.t*6,flap:S.t*25});ctx.restore();});
  }else if(sc.id==='autumn'){
    endBg('#f2c48a','#8a6a3a');
    const sunY=Hh*0.45;const sg=ctx.createRadialGradient(W*0.7,sunY,10,W*0.7,sunY,140);sg.addColorStop(0,'rgba(255,240,200,.9)');sg.addColorStop(1,'rgba(255,200,120,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.arc(W*0.7,sunY,140,0,TAU);ctx.fill();
    ctx.fillStyle='#5a3a22';ctx.beginPath();ctx.moveTo(-10,Hh);ctx.lineTo(-10,0);ctx.lineTo(W*0.2,0);ctx.quadraticCurveTo(W*0.17,Hh*0.5,W*0.26,Hh*0.75);ctx.lineTo(-10,Hh);ctx.fill();
    ctx.strokeStyle='rgba(30,18,10,.45)';ctx.lineWidth=2;for(let i=0;i<5;i++){const x=W*(0.02+i*0.035);ctx.beginPath();ctx.moveTo(x,0);ctx.quadraticCurveTo(x+6,Hh*0.4,x+i*6,Hh*0.75);ctx.stroke();}
    {const sy2=Hh*0.34,g2=ctx.createRadialGradient(W*0.13,sy2,3,W*0.13,sy2,50);g2.addColorStop(0,'rgba(255,190,80,.8)');g2.addColorStop(1,'rgba(255,190,80,0)');ctx.fillStyle=g2;ctx.beginPath();ctx.arc(W*0.13,sy2,50,0,TAU);ctx.fill();inked(ellP(W*0.13,sy2,12,8),'#d8902e',1.5);}
    ctx.fillStyle='#6a4a2a';ctx.beginPath();ctx.moveTo(0,Hh);for(let x=0;x<=W;x+=16)ctx.lineTo(x,Hh*0.72+Math.sin(x*0.02)*6);ctx.lineTo(W,Hh);ctx.fill();
    ctx.strokeStyle='#a87a3a';ctx.lineWidth=2;for(let x=6;x<W;x+=11){const h=10+hash(x)*16,sw=Math.sin(S.t*1.5+x*0.05)*4;ctx.beginPath();ctx.moveTo(x,Hh*0.72);ctx.quadraticCurveTo(x+sw*0.5,Hh*0.72-h*0.6,x+sw,Hh*0.72-h);ctx.stroke();}
    for(const l of END.leaves){ctx.save();ctx.translate(l.x*W,l.y*Hh);ctx.rotate(l.a);ctx.scale(1,Math.cos(l.a*2));drawDecor({k:'oak',x:0,y:0,a:0,s:9,c:l.c});ctx.restore();}
    ctx.save();ctx.translate(W*0.44,Hh*0.79);ctx.rotate(-Math.PI/2);drawDango(eqIds(P.eq),26*s,{walk:0});ctx.restore();
    const r=endAlly();if(r){ctx.save();ctx.translate(W*0.42-56*s,Hh*0.8);ctx.rotate(-Math.PI/2);drawBugBody(TYPES[r.type],Math.min(TYPES[r.type].r,22)*0.8*s,{type:r.type,walk:0,ally:true});ctx.restore();}
    const leaving=END.act==='leave'||END.line>=2,lk=leaving?(END.line>=2?1:Math.min(1,END.actT/5)):0;
    const kx=W*(0.64+lk*0.5);ctx.save();ctx.translate(kx,Hh*0.8);ctx.rotate(leaving?0:Math.PI);drawBugBody(TYPES.kabuto,33*s,{type:'kabuto',walk:leaving?END.t*5:0});ctx.restore();
  }else if(sc.id==='diary'){
    ctx.fillStyle='#fbf6e8';ctx.fillRect(0,0,W,Hh);
    ctx.strokeStyle='rgba(120,160,200,.35)';ctx.lineWidth=1;for(let y=Hh*0.12;y<Hh;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle='rgba(200,69,45,.45)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(42,0);ctx.lineTo(42,Hh);ctx.stroke();
    ctx.fillStyle=INK;ctx.font=clamp(W*0.06,22,34)+'px '+DFONT;ctx.textAlign='left';ctx.fillText('なつやすみの えにっき',58,Hh*0.09);
    /* crayon drawing */
    const bx=58,by=Hh*0.14,bw=W-100,bh=Math.min(Hh*0.36,bw*0.75);
    ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.strokeRect(bx,by,bw,bh);ctx.beginPath();ctx.rect(bx,by,bw,bh);ctx.clip();
    ctx.fillStyle='rgba(242,200,120,.35)';ctx.fillRect(bx,by,bw,bh);
    ctx.globalAlpha=0.9;ctx.translate(bx+bw/2,by+bh*0.55);const k=Math.min(bw,bh)/300;ctx.scale(k,k);
    ctx.fillStyle='rgba(216,144,46,.8)';ctx.beginPath();ctx.ellipse(0,10,120,60,0,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(42,33,24,.7)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,10,120,60,0,0,TAU);ctx.stroke();
    ctx.save();ctx.rotate(-Math.PI/2);drawDango(eqIds(P.eq),24,{walk:0});ctx.restore();
    ['osa','joou','kabuto'].forEach((b,i)=>{ctx.save();ctx.translate(-120+i*120,110);ctx.rotate(-Math.PI/2);drawBugBody(TYPES[b],18,{type:b,walk:0});ctx.restore();});
    for(let i=0;i<8;i++){const a=i/8*TAU;ctx.strokeStyle='rgba(242,182,50,.9)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(Math.cos(a)*50,Math.sin(a)*50-110);ctx.lineTo(Math.cos(a)*70,Math.sin(a)*70-110);ctx.stroke();}
    dot(0,-110,34,'rgba(242,182,50,.9)');
    ctx.restore();
    /* lay the written lines out by their real wrapped height; shrink the hand if the page runs out */
    {const ty0=by+bh+44,avail=Hh-56-ty0,maxW=W-100;let fs=clamp(W*0.042,15,20),lh,blocks;
      for(let pass=0;pass<6;pass++){ctx.font='900 '+fs+'px '+FONT;lh=Math.round(fs*1.6);blocks=lines.map(l=>wrapLines(l.text,maxW));const tot=blocks.reduce((a,b)=>a+b.length*lh+lh*0.5,0);if(tot<=avail||fs<=12)break;fs-=1.5;}
      ctx.fillStyle=INK;let y=ty0;
      for(let i=0;i<=Math.min(END.line,lines.length-1);i++){let n=Infinity;if(i===END.line){if(!END.shown)break;const ty=typeof UI!=='undefined'&&UI.typing;if(ty&&ty.text===lines[i].text)n=ty.i;}
        let used=0;ctx.textAlign='left';for(const ln of blocks[i]){if(used>=n)break;const part=ln.slice(0,Math.max(0,n-used));ctx.fillText(part,58,y);used+=ln.length;y+=lh;}
        y=ty0+blocks.slice(0,i+1).reduce((a,b)=>a+b.length*lh+lh*0.5,0);}}
    if(END.shown&&!END.fade){ctx.font='700 12px '+FONT;ctx.fillStyle='rgba(42,33,24,.55)';ctx.textAlign='right';ctx.fillText('タップで つぎへ ▶',W-20,Hh-24);}
    for(const l of END.leaves){ctx.save();ctx.translate(l.x*W,l.y*Hh);ctx.rotate(l.a);ctx.globalAlpha=0.6;drawDecor({k:'oak',x:0,y:0,a:0,s:8,c:l.c});ctx.restore();ctx.globalAlpha=1;}
  }else{
    ctx.fillStyle='#f4ead2';ctx.fillRect(0,0,W,Hh);
    for(let i=0;i<300;i++)dot(hash(i)*W,hash(i+5)*Hh,hash(i+2)*2+0.5,'rgba(42,33,24,.06)');
    ctx.textAlign='center';ctx.fillStyle=INK;ctx.font=clamp(W*0.09,30,58)+'px '+DFONT;ctx.fillText('ひと夏の番長',W/2,Hh*0.2);
    ctx.font='900 14px '+FONT;ctx.fillText('この夏 出会った 虫たち',W/2,Hh*0.2+34);
    const gap=110*s,speed=90*s;
    END.parade.forEach((b,i)=>{const x=-80+t*speed-i*gap;if(x<-100||x>W+100)return;const T=TYPES[b],y=Hh*0.55+Math.sin(t*4+i)*4;
      ctx.save();ctx.translate(x,y);drawBugBody(T,Math.min(T.r,28)*0.8*s,{type:b,walk:t*6+i,flap:t*25+i});ctx.restore();
      const low=i%2===1,ny=y+(low?78:46)*s;let fs=12;ctx.font='900 '+fs+'px '+FONT;while(ctx.measureText(T.name).width>gap*1.8&&fs>9){fs-=0.5;ctx.font='900 '+fs+'px '+FONT;}ctx.fillStyle=INK;ctx.fillText(T.name,x,ny);ctx.font='700 10px '+FONT;ctx.fillStyle='rgba(42,33,24,.6)';ctx.fillText((DEX.bugs[b]||0)+'ひき',x,ny+14);if(low){ctx.strokeStyle='rgba(42,33,24,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y+28*s);ctx.lineTo(x,ny-12);ctx.stroke();}});
    const lead=-80+t*speed+gap;ctx.save();ctx.translate(lead,Hh*0.55);drawDango(eqIds(P.eq),17*s,{walk:t*6});ctx.restore();
    ctx.font='900 13px '+FONT;ctx.fillStyle=INK;ctx.globalAlpha=clamp((t-3)/2,0,1);ctx.fillText('あそんでくれて、ありがとう。',W/2,Hh*0.84);ctx.globalAlpha=1;
  }
  /* cinematic bars, title cards and fades */
  if(sc.id!=='diary'&&sc.id!=='parade'){const bh=Hh*0.07;ctx.fillStyle='#000';ctx.fillRect(0,0,W,bh);ctx.fillRect(0,Hh-bh,W,bh);}
  if(END.cardT>0&&sc.card){const k=END.cardT,a=Math.min(1,Math.min(k,2.2-k)/0.5);ctx.fillStyle='rgba(0,0,0,'+(0.85*a)+')';ctx.fillRect(0,0,W,Hh);ctx.globalAlpha=a;ctx.fillStyle='#f4ead2';ctx.font=clamp(W*0.1,32,60)+'px '+DFONT;ctx.textAlign='center';ctx.fillText(sc.card,W/2,Hh*0.47);if(sc.sub){ctx.font='900 '+clamp(W*0.045,15,22)+'px '+FONT;ctx.fillStyle='#f2c43a';ctx.fillText(sc.sub,W/2,Hh*0.47+46);}ctx.globalAlpha=1;}
  if(END.fade){const a=END.fade==='out'?clamp(END.fadeT,0,1):1-clamp(END.fadeT,0,1);ctx.fillStyle='rgba(0,0,0,'+a+')';ctx.fillRect(0,0,W,Hh);}
}

/* ---------- team-up (連携) visuals ---------- */
let RV=null;
function drawRkWorld(){
  const rk=S.rk;if(!rk)return;const I=rk.info,a=rk.ang,dx=Math.cos(a),dy=Math.sin(a);
  if(rk.ph==='aim'){
    const ox=P.x,oy=P.y,L=I.len,pulse=0.6+0.4*Math.sin(S.t*10);
    ctx.save();ctx.lineCap='round';
    if(I.zone==='line'){ctx.strokeStyle='rgba(242,182,50,.28)';ctx.lineWidth=60;ctx.beginPath();ctx.moveTo(ox+dx*30,oy+dy*30);ctx.lineTo(ox+dx*L,oy+dy*L);ctx.stroke();
      ctx.strokeStyle='rgba(255,243,196,'+(0.7*pulse)+')';ctx.lineWidth=4;ctx.setLineDash([14,10]);ctx.lineDashOffset=-S.t*60;ctx.beginPath();ctx.moveTo(ox+dx*30,oy+dy*30);ctx.lineTo(ox+dx*L,oy+dy*L);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='#f2b632';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ox+dx*(L+26),oy+dy*(L+26));ctx.lineTo(ox+dx*L-dy*20,oy+dy*L+dx*20);ctx.lineTo(ox+dx*L+dy*20,oy+dy*L-dx*20);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(I.zone==='point'){const qx=ox+dx*L,qy=oy+dy*L;ctx.strokeStyle='rgba(255,243,196,.6)';ctx.lineWidth=3;ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(qx,qy);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='rgba(242,182,50,.22)';ctx.beginPath();ctx.arc(qx,qy,I.rad,0,TAU);ctx.fill();ctx.strokeStyle='rgba(242,182,50,'+pulse+')';ctx.lineWidth=4;ctx.setLineDash([16,10]);ctx.lineDashOffset=S.t*40;ctx.beginPath();ctx.arc(qx,qy,I.rad,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(qx-12,qy);ctx.lineTo(qx+12,qy);ctx.moveTo(qx,qy-12);ctx.lineTo(qx,qy+12);ctx.stroke();}
    else{ctx.fillStyle='rgba(170,190,80,.28)';ctx.beginPath();ctx.moveTo(ox,oy);ctx.arc(ox,oy,L,a-0.7,a+0.7);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(220,240,140,'+pulse+')';ctx.lineWidth=3;ctx.stroke();}
    /* foes inside the zone get a mark */
    for(const e of rkFoes()){const ex=e.x-ox,ey=e.y-oy,d=Math.hypot(ex,ey);let inZ=false;
      if(I.zone==='point')inZ=Math.hypot(e.x-(ox+dx*L),e.y-(oy+dy*L))<I.rad+e.r;else if(I.zone==='cone')inZ=d<L&&Math.abs(angDiff(a,Math.atan2(ey,ex)))<0.7;else{const al=ex*dx+ey*dy,sd=Math.abs(-ex*dy+ey*dx);inZ=al>0&&al<L+40&&sd<e.r+40;}
      if(inZ){ctx.strokeStyle='#c8452d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,e.r+8+Math.sin(S.t*12)*2,0,TAU);ctx.stroke();}}
    /* timing rings */
    const R=rkRing(rk.t),d=Math.abs(R-RK_R0),hot=d<=9;
    ctx.strokeStyle=INK;ctx.lineWidth=9;ctx.beginPath();ctx.arc(ox,oy,RK_R0,0,TAU);ctx.stroke();
    ctx.strokeStyle=hot?'#fff3c4':'#f2b632';ctx.lineWidth=6;ctx.beginPath();ctx.arc(ox,oy,RK_R0,0,TAU);ctx.stroke();
    if(R>4){ctx.strokeStyle=hot?'#c8452d':d<=26?'#fff':'rgba(255,255,255,.75)';ctx.lineWidth=hot?6:4;ctx.beginPath();ctx.arc(ox,oy,R,0,TAU);ctx.stroke();}
    ctx.restore();
  }else{
    if(rk.id==='ito'&&rk.t<0.4&&rk.netX!=null){ctx.save();ctx.translate(rk.netX,rk.netY);ctx.rotate(S.t*6);ctx.strokeStyle='rgba(250,250,250,.95)';ctx.lineWidth=1.5;const r=22+rk.t*60;for(let i=0;i<6;i++){const an=i/6*TAU;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(an)*r,Math.sin(an)*r);ctx.stroke();}for(const k of [0.4,0.7,1]){ctx.beginPath();ctx.arc(0,0,r*k,0,TAU);ctx.stroke();}ctx.restore();}
    if(rk.id==='rinpun'&&rk.tw){const {x,y}=rk.tw;ctx.save();ctx.translate(x,y);for(let i=0;i<5;i++){ctx.strokeStyle=['rgba(244,166,196,.6)','rgba(255,243,196,.6)','rgba(207,232,192,.6)'][i%3];ctx.lineWidth=5-i*0.6;ctx.beginPath();for(let k=0;k<=40;k++){const an=S.t*10+i*1.2+k*0.3,rr=20+k*3;ctx.lineTo(Math.cos(an)*rr,Math.sin(an)*rr*0.6-k*1.2);}ctx.stroke();}ctx.restore();}
    if(rk.id==='mawari'&&ALLY){ctx.strokeStyle='rgba(242,182,50,'+(0.6+0.3*Math.sin(S.t*14))+')';ctx.lineWidth=5;ctx.beginPath();ctx.arc(ALLY.x,ALLY.y,ALLY.r+16,0,TAU);ctx.stroke();}
    if(ALLY&&rk.t<2){ctx.fillStyle='rgba(255,240,150,.22)';ctx.beginPath();ctx.arc(ALLY.x,ALLY.y-(ALLY.z||0),ALLY.r*1.9,0,TAU);ctx.fill();}
  }
}
function drawRkScreen(){
  const rk=S.rk;if(!rk||rk.ph!=='aim'||!RV||!ALLY)return;const v=RV,sx=(P.x-v.cx)*v.s+W/2,sy=(P.y-v.cy)*v.s+Hh/2,inK=Math.min(1,rk.t/0.2);
  const g=ctx.createRadialGradient(sx,sy,60,sx,sy,Math.max(W,Hh)*0.7);g.addColorStop(0,'rgba(10,5,20,0)');g.addColorStop(0.35,'rgba(10,5,20,'+(0.35*inK)+')');g.addColorStop(1,'rgba(10,5,20,'+(0.7*inK)+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,Hh);
  /* cut-in band: follower + boss side by side */
  const bh=Math.min(116,Hh*0.15),y=(UI&&UI.topY?UI.topY:120)+bh/2+4,off=(1-inK)*-W;
  ctx.save();ctx.translate(off+W/2,y);ctx.rotate(-0.05);
  ctx.fillStyle='#f2b632';ctx.fillRect(-W,-bh/2,W*2,bh);ctx.fillStyle=INK;ctx.fillRect(-W,-bh/2-5,W*2,5);ctx.fillRect(-W,bh/2,W*2,5);
  ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=2;for(let i=0;i<10;i++){const yy=-bh/2+hash(i)*bh,xx=((S.t*1400+hash(i+3)*W*2)%(W*2))-W;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+90,yy);ctx.stroke();}
  const R=Math.min(34,bh*0.3);ctx.save();ctx.translate(-W*0.36,4);ctx.rotate(-Math.PI/2+0.25);drawBugBody(ALLY.T,R,{type:ALLY.type,walk:S.t*8,flap:S.t*30,ally:true,open:1,ext:1});ctx.restore();
  ctx.save();ctx.translate(-W*0.2,10);ctx.rotate(-Math.PI/2-0.2);drawDango(eqIds(P.eq),R*0.75,{walk:S.t*8});ctx.restore();
  ctx.textAlign='left';ctx.font=clamp(W*0.06,20,32)+'px '+DFONT;ctx.lineWidth=5;ctx.strokeStyle=INK;ctx.fillStyle='#fff6e0';ctx.strokeText(rk.name,-W*0.08,-bh*0.06);ctx.fillText(rk.name,-W*0.08,-bh*0.06);
  ctx.font='700 '+clamp(W*0.032,12,15)+'px '+FONT;ctx.fillStyle=INK;ctx.fillText(rk.info.tip,-W*0.08,bh*0.26);
  ctx.restore();
  /* instructions */
  const R0=rkRing(rk.t),hot=Math.abs(R0-RK_R0)<=9;
  ctx.textAlign='center';ctx.font='900 '+clamp(W*0.042,15,19)+'px '+FONT;ctx.lineWidth=5;ctx.strokeStyle=INK;ctx.fillStyle=hot?'#fff3c4':'#fff';
  const ty=Math.min(Hh*0.72,sy+RK_R0*v.s+64),l1=rk.aimed?'いまだ…！':'スティックで ねらう',l2='輪が 重なったら「かむ」！';
  ctx.strokeText(l1,W/2,ty);ctx.fillText(l1,W/2,ty);ctx.strokeText(l2,W/2,ty+26);ctx.fillText(l2,W/2,ty+26);
}
function wrapLines(txt,maxW){const out=[];let line='';for(const ch of txt){const tst=line+ch;if(ctx.measureText(tst).width>maxW&&line){out.push(line);line=ch;}else line=tst;}if(line)out.push(line);return out;}
function wrapText(txt,x,y,maxW,lh){ctx.textAlign='left';let line='',yy=y;for(const ch of txt){const tst=line+ch;if(ctx.measureText(tst).width>maxW&&line){ctx.fillText(line,x,yy);line=ch;yy+=lh;}else line=tst;}if(line)ctx.fillText(line,x,yy);}
