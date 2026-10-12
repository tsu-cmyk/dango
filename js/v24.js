'use strict';
/* =====================================================================
   ひと夏の番長 — v24: each かた moves the body its own way, two new かた
   (いと / とぶ), five new bugs with new parts, and a calmer 連携わざ
   ===================================================================== */

/* ---------------- new bugs and parts ---------------- */
PARTS.legs.shouryou={name:'ショウリョウの 長脚',speed:185,dash:900,desc:'細く 長い 脚。跳ぶのも 突進も とおい。'};
PARTS.tail.itoibo={name:'ハエトリの 糸いぼ',counter:6,desc:'おしりから 丈夫な 糸を 出す。'};
PARTS.head.tagame={name:'タガメの つかみ腕',dmg:26,cd:0.5,range:30,arc:1.2,grab:true,desc:'太い 前脚で がっちり つかみ、引きよせる。'};
PARTS.back.gengo={name:'ゲンゴロウの 背',def:0.78,spd:1.03,desc:'なめらかで かたい 背中。軽く、水の 抵抗も ない。'};
PARTS.head.nokogiri={name:'ノコギリの 大アゴ',dmg:38,cd:0.55,range:30,arc:1.4,kb:2.0,desc:'ギザギザの 大アゴ。はさむ 力が 強い。'};
TYPES.shouryou={name:'ショウリョウの 跳ね手',hp:64,dmg:9,r:15,speed:90,xp:13,aggro:230,body:'cricket',legs:'batta',ai:'hopper',col:'#a8c858',dark:'#5a7a2a',drop:['legs','shouryou',0.13],dex:'細長い 頭の バッタ。おどろくと とても 遠くまで 跳ぶ。'};
TYPES.haetori={name:'ハエトリの 跳び子',hp:58,dmg:10,r:12,speed:120,xp:13,aggro:240,body:'spider',ai:'melee',charge:true,col:'#4a4038',dark:'#2a221c',drop:['tail','itoibo',0.14],dex:'大きな 目で ねらいを つけ、ぴょんと 飛びつく クモ。'};
TYPES.tagame={name:'タガメの 待ちぶせ',hp:150,dmg:13,r:17,speed:72,xp:24,aggro:220,body:'watermantis',ai:'grabber',col:'#7a6a48',dark:'#3a2e1c',drop:['head','tagame',0.12],dex:'水べの 大物。太い 腕で つかまえて はなさない。'};
TYPES.gengo={name:'ゲンゴロウの 泳ぎ手',hp:110,dmg:10,r:15,speed:105,xp:18,aggro:200,body:'beetle',head:'ago',ai:'melee',charge:true,col:'#2a3a28',dark:'#141c12',drop:['back','gengo',0.13],dex:'水の 中を すいすい 泳ぐ 甲虫。ふちの 黄色が 目じるし。'};
TYPES.nokogiri={name:'ノコギリの 荒くれ',hp:150,dmg:14,r:17,speed:84,xp:25,aggro:230,body:'beetle',head:'nokogiri',ai:'melee',charge:true,toss:true,col:'#8a4a20',dark:'#3a1a08',drop:['head','nokogiri',0.12],dex:'ギザギザの アゴで 投げとばす 暴れもの。'};
[['kusamura','shouryou',1],['kusamura','haetori',1],['ogawa','tagame',1],['ogawa','gengo',2],['kuchiki','haetori',1],['kuchiki','nokogiri',1],['miki','nokogiri',1],['sakaba','nokogiri',1]].forEach(([a,t,w])=>{const A=AREAS.find(x=>x.id===a);if(A&&!A.mobs.some(m=>m[0]===t))A.mobs.push([t,w]);});
DEX_ORDER.splice(DEX_ORDER.indexOf('hiari'),0,'shouryou','haetori','tagame','gengo','nokogiri');
RAGE.shouryou=RAGE.haetori=RAGE.tagame=RAGE.gengo=RAGE.nokogiri='';
BLOODS.kouchu.ids.push('nokogiri','gengo');BLOODS.hane.ids.push('shouryou');BLOODS.mukade.ids.push('itoibo');BLOODS.koukaku.ids.push('tagame');

/* existing かた accept the new parts */
STANCES.hasami.need[0][1].push('nokogiri','tagame');STANCES.hasami.need[1][1].push('gengo');
STANCES.tsuki.need[1][1].push('shouryou');
STANCES.komoru.need[1][1].push('nokogiri');
STANCE_UP.tsuki.need[1].push('gengo');

/* ---------------- two new かた ---------------- */
STANCES.ito={btn:'bite',lbl:'いと',n:'糸なげ',need:[['tail',['itoibo']],['head',['kiba','gokegumo','ago','oago','hanmyou']]],how:'かむ かわりに 糸を 飛ばす。当たった 敵を 引きよせて しばる（大物は 足が おそくなる）。',hint:'糸いぼ ＋ キバや アゴ'};
STANCES.tobu={btn:'roll',lbl:'とぶ',n:'大跳び',need:[['legs',['batta','shouryou','kazekiri']],['back',['hane','ageha','gekka','murasaki','raiden','kumahane','joouhane','gengo']]],how:'おすと かがんで 力を ためる。はなすと 大きく 跳び、空中は 無敵。着地で まわりを ふみつける（長く ためるほど 遠く 強い）。',hint:'跳ねる脚 ＋ 羽'};
STANCE_UP.ito={need:['legs',['geji','mukade','shouryou','amenbo']],lbl:'網なげ',n:'網なげ',how:'糸を 3本 扇のように なげて、まとめて しばる。',hint:'＋ 長い脚'};
STANCE_UP.tobu={need:['head',['tsuno','onizuno','kongou','kuwa','miyama','nokogiri','hirata']],lbl:'つの落とし',n:'つの落とし',how:'角から 落ちて 地面を つらぬく。着地が 広く 重く、敵を 動けなくする。',hint:'＋ 大きな 角や アゴ'};
ACHS.push({id:'stance7',name:'七つの かた',desc:'7つの ちがう かた を つかう'});

/* ---------------- motion: every かた moves the body its own way ---------------- */
function setMot(k,d){P.mot={k,d,t0:S.t};}
function easeO(x){return 1-Math.pow(1-x,3);}
function playerMotion(){
  const M={ox:0,rot:0,sx:1,sy:1,ghost:0,bite:false,wings:false,noBall:false};
  const m=P.mot;
  if(m){const p=Math.min(1,(S.t-m.t0)/m.d);if(p>=1)P.mot=null;else{const s=Math.sin(p*Math.PI);
    switch(m.k){
      case 'hasami':M.bite=true;if(p<0.3){M.ox=10*p/0.3;M.sx=1.08;}else{const q=(p-0.3)/0.7;M.ox=10*(1-q);M.rot=-1.0*Math.sin(q*Math.PI);M.sx=1.05;}break;
      case 'hasami+':M.bite=true;if(p<0.25){M.ox=12*p/0.25;M.sx=1.1;M.sy=0.95;}else{const q=(p-0.25)/0.75;M.ox=12*(1-q);M.rot=-TAU*easeO(q);M.ghost=q<0.7?1:0;}break;
      case 'tsuki':M.bite=true;M.sx=1+0.45*s;M.sy=1-0.18*s;M.ox=18*s;M.ghost=s>0.3?2:0;break;
      case 'tsuki+':{const z=Math.abs(Math.sin(p*3*Math.PI));M.bite=true;M.sx=1+0.4*z;M.sy=1-0.16*z;M.ox=16*z;M.ghost=z>0.3?2:0;break;}
      case 'sasu':case 'sasu+':M.rot=Math.PI*(p<0.3?easeO(p/0.3):p>0.75?1-(p-0.75)/0.25:1);M.ox=9*s;M.sy=1-0.08*s;break;
      case 'ito':case 'ito+':M.ox=-7*s;M.sx=1-0.08*s;M.sy=1+0.12*s;M.bite=true;break;
      case 'pop':M.rot=TAU*1.5*easeO(p);M.sx=M.sy=1+0.2*s;break;
      case 'land':M.sx=1+0.28*(1-p);M.sy=1-0.28*(1-p);break;
      case 'land+':M.sx=1+0.4*(1-p);M.sy=1-0.4*(1-p);break;
    }}}
  if(P.rolled&&ST.stance&&ST.stance.roll==='tobu'){const c=Math.min(1,(S.t-(P.rollAt||S.t))/0.8);M.noBall=true;M.sx*=1+0.2*c;M.sy*=1-0.22*c;M.ox+=-4*c+Math.sin(S.t*70)*c*1.2;}
  if(P.leap){M.wings=true;M.noBall=true;}
  return M;
}
/* stone plates on the ball while こもる */
function drawRollOverlay(r){
  if(!(ST.stance&&ST.stance.roll==='komoru'&&P.rolled))return;const up=ST.stanceUp&&ST.stanceUp.roll;
  ctx.save();ctx.translate(Math.sin(S.t*50)*0.8,0);ctx.strokeStyle='rgba(60,56,50,.75)';ctx.lineWidth=2.2;
  for(let i=0;i<5;i++){const a=i*1.26+(P.ball||0)*0.2;ctx.beginPath();ctx.arc(0,0,r*1.02,a,a+0.8);ctx.stroke();}
  ctx.fillStyle='rgba(150,145,135,.35)';ctx.beginPath();ctx.arc(0,0,r*1.06,0,TAU);ctx.fill();
  if(up)for(let i=0;i<3;i++){const a=S.t*3+i*TAU/3;inked(ellP(Math.cos(a)*r*1.7,Math.sin(a)*r*1.7,r*0.24,r*0.2),'#8a8478',1.4);}
  ctx.restore();}

/* threads for いと */
const THREADS=[];
function drawThreads(){for(const t of THREADS){const a=1-t.t/t.life;ctx.save();ctx.globalAlpha=a;const mx=(t.x+t.x2)/2,my=(t.y+t.y2)/2+8*(1-a);
  ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.quadraticCurveTo(mx,my,t.x2,t.y2);ctx.stroke();ctx.strokeStyle='#fffaf0';ctx.lineWidth=1.6;ctx.stroke();
  if(t.hit){ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(t.x2,t.y2,10+i*4,6+i*3,i,0,TAU);ctx.stroke();}}
  ctx.restore();}}
function threadTick(){for(const t of THREADS)t.t+=DT;for(let i=THREADS.length-1;i>=0;i--)if(THREADS[i].t>=THREADS[i].life)THREADS.splice(i,1);
  for(const e of E){if(!e.pull||e.dead){e.pull=0;continue;}e.pull-=DT;const a=Math.atan2(e.y-P.y,e.x-P.x),gx=P.x+Math.cos(a)*(ST.r+e.r+12),gy=P.y+Math.sin(a)*(ST.r+e.r+12);const k=Math.min(1,DT*14);e.x+=(gx-e.x)*k;e.y+=(gy-e.y)*k;e.vx=e.vy=0;if(e.pull<=0)e.pull=0;}}
function castThread(a,L){const dx=Math.cos(a),dy=Math.sin(a);let best=null,bt=L;
  for(const e of E){if(e.dead||e.z>18||e.state==='under'||e.state==='den'||e.state==='seat'||e.T.ai==='sumo'||e.friendly)continue;const ex=e.x-P.x,ey=e.y-P.y,t=ex*dx+ey*dy;if(t<0||t>bt+e.r)continue;if(Math.abs(ex*dy-ey*dx)<e.r+10){bt=t;best=e;}}
  const x2=best?best.x:P.x+dx*L,y2=best?best.y:P.y+dy*L;THREADS.push({x:P.x+dx*ST.r,y:P.y+dy*ST.r,x2,y2,t:0,life:best?0.45:0.3,hit:!!best});
  if(!best)return;damageEnemy(best,ST.dmg*0.55*lvGap(P.lv,best.lv),P.x,P.y,0,ST.poison,{player:true});if(best.dead)return;
  best.slowT=Math.max(best.slowT||0,isBig(best)?1.8:2.4);
  if(isBig(best))pop(best.x,best.y-best.r-20,'しばった！','#5a4a3e',true);else{best.pull=0.28;best.state='recover';best.t=Math.max(best.t||0,0.8);pop(best.x,best.y-best.r-20,'ひっぱり！','#5a4a3e',true);}}

const _stanceBite24=stanceBite;stanceBite=function(){
  const k=ST.stance&&ST.stance.bite;if(!k)return false;const up=!!(ST.stanceUp&&ST.stanceUp.bite);
  if(k==='ito'){const at=aimTarget();if(at)P.ang=Math.atan2(at.y-P.y,at.x-P.x);P.biteCd=ST.cd*(up?1.5:1.3);P.biteT=0.2;sfx('web');for(const da of up?[-0.3,0,0.3]:[0])castThread(P.ang+da,up?240:280);setMot(up?'ito+':'ito',0.3);return true;}
  const ok=_stanceBite24();if(ok)setMot(k+(up?'+':''),k==='hasami'?(up?0.5:0.38):k==='tsuki'?(up?0.34:0.22):0.16);return ok;};
const _moguruPop24=moguruPop;moguruPop=function(){_moguruPop24();setMot('pop',0.4);P.popT=0.4;};

/* もぐる: sink into the ground first, then the mound */
drawMoguru=function(){if(!moguruOn())return;const r=ST.r,k=Math.min(1,(P.burT||0)/0.28);
  if(k<1){ctx.save();ctx.translate(P.x,P.y);ctx.globalAlpha=1-k*0.6;ctx.rotate(P.ang);ctx.scale(1-0.6*k,1-0.6*k);drawDango(eqIds(P.eq),r,{walk:S.t*30,bite:true});ctx.restore();ctx.globalAlpha=1;}
  ctx.save();ctx.translate(P.x,P.y);ctx.scale(0.3+0.7*k,0.3+0.7*k);
  ctx.fillStyle='rgba(42,33,24,.22)';ctx.beginPath();ctx.ellipse(2,6,r*1.6,r*1.0,0,0,TAU);ctx.fill();
  inked(()=>{ctx.beginPath();for(let i=0;i<=16;i++){const a=i/16*TAU,w=1+0.12*Math.sin(a*3+S.t*6);const x=Math.cos(a)*r*1.35*w,y=Math.sin(a)*r*0.95*w;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();},'#9a7650',2);
  ctx.strokeStyle='rgba(42,33,24,.55)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-r*0.6,-r*0.1);ctx.lineTo(-r*0.1,r*0.15);ctx.lineTo(r*0.3,-r*0.2);ctx.lineTo(r*0.7,r*0.05);ctx.stroke();
  ctx.fillStyle='rgba(255,240,200,.25)';ctx.beginPath();ctx.ellipse(-r*0.3,-r*0.4,r*0.5,r*0.18,0,0,TAU);ctx.fill();
  for(let i=0;i<7;i++){const a=i*0.9+S.t*2.4,d=r*(1.45+0.15*Math.sin(S.t*9+i));dot(Math.cos(a)*d,Math.sin(a)*d*0.7+3,2.2+i%3,'#6a4a2a');}
  ctx.restore();};

/* ---------------- とぶ ---------------- */
function rollSpeedMul(){if(moguruOn())return moguruSpeed();if(ST.stance&&ST.stance.roll==='tobu')return 0.15;return 0.35;}
function tobuJump(a){const c=Math.min(1,(S.t-(P.rollAt||S.t))/0.8);const D=140+210*c;
  P.leap={t:0,d:0.4+0.2*c,x0:P.x,y0:P.y,dx:Math.cos(a)*D,dy:Math.sin(a)*D,h:46+44*c,c};P.inv=Math.max(P.inv,P.leap.d+0.12);P.ang=a;P.st=Math.max(0,(P.st??1)-0.12);P.stIdle=0;sfx('hop');P.vx=P.vy=0;
  for(let i=0;i<8;i++)fx.push({x:P.x,y:P.y,vx:rnd(-160,160),vy:rnd(-160,160),t:0,life:0.35,c:'#e9dcb0'});}
function tobuTick(){const L=P.leap;if(!L){if(P.popT>0){P.popT-=DT;P.z=Math.max(0,Math.sin((1-P.popT/0.4)*Math.PI)*34);if(P.popT<=0)P.z=0;}return;}
  L.t+=DT;const k=Math.min(1,L.t/L.d);P.rolled=false;P.vx=P.vy=0;
  const nx=L.x0+L.dx*easeO(k),ny=L.y0+L.dy*easeO(k);P.x=nx;P.y=ny;collide(P,ST.r,{water:true,glide:true});P.z=Math.sin(k*Math.PI)*L.h;
  if(k>=1){P.z=0;P.leap=null;tobuLand(L.c);}}
function tobuLand(c){const up=!!(ST.stanceUp&&ST.stanceUp.roll),R=(up?100:70)+20*c;
  fx.push({ring:true,x:P.x,y:P.y,r:R,t:0,life:0.35});S.shake=Math.max(S.shake,up?11:7);sfx('thud');vib(30);for(let i=0;i<14;i++){const a=i/14*TAU;fx.push({x:P.x,y:P.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,t:0,life:0.4,c:'#e9dcb0'});}
  for(const e of E){if(e.dead||e.z>18||e.state==='den'||e.state==='seat'||e.state==='under'||e.T.ai==='sumo'||e.friendly)continue;if(Math.hypot(e.x-P.x,e.y-P.y)>=e.r+R)continue;
    damageEnemy(e,ST.dashDmg*(1.1+0.6*c)*(up?1.7:1),P.x,P.y,up?520:380,0,{player:true});
    if(up&&!e.dead){if(isBig(e))e.brokenT=Math.max(e.brokenT||0,0.9);else{e.state='recover';e.t=Math.max(e.t||0,1.1);}}}
  if(up)pop(P.x,P.y-50,'つの落とし！','#c8452d',true);setMot(up?'land+':'land',0.22);P.inv=Math.max(P.inv,0.15);}

/* ---------------- 連携わざ: a little less overwhelming ---------------- */
/* (was: base (一撃×1.6＋子分×2.2)×倍率, no cap; one team-up could take 30–90% of a keeper) */
const _rkFire24=rkFire;rkFire=function(mul,grade){_rkFire24(mul,grade);const rk=S.rk,a=ALLY;if(!rk||!a)return;rk.B=(ST.dmg*1.3+a.dmg*1.6)*rk.mul;rk.dealt=new Map();
  if(rk.id==='tobi'){let near=null,nd=1e9;for(const e of rkFoes()){const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<nd&&d<(rk.info.len||340)+60&&Math.abs(angDiff(rk.ang,Math.atan2(e.y-P.y,e.x-P.x)))<0.6){nd=d;near=e;}}rk.tobiLen=near?Math.max(120,nd):null;}};
/* a single team-up takes at most a slice of a big enemy's life (more with a better timing / stronger bond) */
rkHit=function(e,mul,kb,fx_,fy_){const rk=S.rk;rk.dealt=rk.dealt||new Map();let d=rk.B*mul;
  if(isBig(e)){const cap=e.maxhp*(0.1+0.075*(rk.mul-1)),got=rk.dealt.get(e)||0;d=Math.min(d,Math.max(0,cap-got));rk.dealt.set(e,got+d);if(d<=0){e.vx*=0.5;e.vy*=0.5;return;}}
  damageEnemy(e,d,fx_??P.x,fy_??P.y,kb||300,0,{player:true,force:true});};

/* タガメ: a broad, flat water bug with thick grabbing arms */
if(typeof BODY!=='undefined'&&BODY.watermantis){const _wm=BODY.watermantis;BODY.watermantis=(T,r,o)=>{if(o.type!=='tagame')return _wm(T,r,o);
  for(const s of [-1,1])for(const i of [0,1]){const ph=Math.sin((o.walk||0)*1.2+i*1.7+(s>0?1:0))*0.15,ax=-0.15*r-i*0.35*r,ay=s*0.5*r,kx=ax-0.5*r,ky=s*(1.0+ph)*r,fx=kx-0.55*r,fy=s*(1.15+ph)*r;
    limb([[ax,ay],[kx,ky],[fx,fy]],Math.max(1.6,r*0.09),o.dark);ctx.strokeStyle='rgba(42,33,24,.5)';ctx.lineWidth=0.8;for(let k=1;k<4;k++){const t=k/4,x=kx+(fx-kx)*t,y=ky+(fy-ky)*t;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-0.06*r,y+s*0.1*r);ctx.stroke();}}
  inked(ellP(-0.25*r,0,1.0*r,0.62*r),o.col,2.2);
  ctx.save();ctx.beginPath();ctx.ellipse(-0.25*r,0,1.0*r,0.62*r,0,0,TAU);ctx.clip();ctx.fillStyle=shade(o.col,-0.12);ctx.beginPath();ctx.moveTo(0.25*r,-0.6*r);ctx.lineTo(-1.3*r,-0.05*r);ctx.lineTo(-1.3*r,0.05*r);ctx.lineTo(0.25*r,0.6*r);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(42,33,24,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0.3*r,0);ctx.lineTo(-1.25*r,0);ctx.stroke();ctx.restore();
  inked(()=>{ctx.beginPath();ctx.moveTo(0.35*r,-0.42*r);ctx.lineTo(0.72*r,-0.2*r);ctx.lineTo(0.72*r,0.2*r);ctx.lineTo(0.35*r,0.42*r);ctx.closePath();},shade(o.col,0.08),1.8);
  inked(()=>{ctx.beginPath();ctx.moveTo(0.7*r,-0.16*r);ctx.lineTo(1.0*r,0);ctx.lineTo(0.7*r,0.16*r);ctx.closePath();},o.col,1.6);eyes(r,0.82,0.13,0.07);
  ctx.save();ctx.translate(0.62*r,0);ctx.scale(1,1.5);raptor(r*0.95,o.open!=null?o.open:0.3,shade(o.col,0.05),o.dark);ctx.restore();
  gloss(-0.3*r,-0.3*r,r*0.4,r*0.08,0.3);};}
