'use strict';
/* =====================================================================
   ひと夏の番長 — v17: follower rest after fainting, orders (攻めろ/守れ/集まれ),
   pebbles & acorns to launch, enemy squads with a shield in front
   ===================================================================== */

/* ---------------- fainting & recovery ---------------- */
const REST_T=90;
function allyFaint(r,t){r.faint=true;r.restT=t||REST_T;r.hpFrac=0.5;}
/* a fainted follower leaves the party and rests at home, so its slot is free for someone else;
   when it has recovered it comes back on its own if there is still room */
function partyDrop(r){
  const i=S.roster.indexOf(r);if(i<0)return;
  if(S.allyI===i){S.allyI=S.allyJ;S.allyJ=-1;if(ALLY&&ALLY.rec===r){ALLY=(ALLY2&&!ALLY2.dead)?ALLY2:null;if(ALLY)ALLY.side=1;ALLY2=null;}}
  else if(S.allyJ===i){S.allyJ=-1;if(ALLY2&&ALLY2.rec===r)ALLY2=null;}
}
function partyRejoin(r){
  const i=S.roster.indexOf(r);if(i<0||i===S.allyI||i===S.allyJ)return false;
  if(S.allyI<0||!S.roster[S.allyI])S.allyI=i;else if(S.allyJ<0&&duoUnlocked())S.allyJ=i;else return false;
  if(S.state==='play'){if(!ALLY||ALLY.dead)spawnAlly();else if(!ALLY2)spawnAlly2();for(const A of allies())if(A.rec===r){A.x=P.x-30*(A.side||1);A.y=P.y+30;}}
  return true;
}
function rosterTick(){
  for(const k of [S.allyJ,S.allyI]){const r=S.roster[k];if(r&&r.faint){r.autoBack=true;partyDrop(r);}}
  const act=[S.roster[S.allyI],S.roster[S.allyJ]];
  for(const r of S.roster){
    if(r.faint){if(r.restT==null)r.restT=REST_T;r.restT-=DT;
      if(r.restT<=0){r.faint=false;r.restT=0;r.hpFrac=0.5;const back=r.autoBack&&partyRejoin(r);r.autoBack=false;
        toast(r.name+'が 元気に なった',back?'もどってきた！（体力は 半分）':'すみかで つれていける（体力は 半分）');}}
    else if(!act.includes(r))r.hpFrac=Math.min(1,(r.hpFrac??1)+0.012*DT);
  }
}
function reviveWithDango(idx){const r=S.roster[idx];if(!r||!r.faint||!(S.dango>0))return false;S.dango--;r.faint=false;r.restT=0;r.hpFrac=1;sfx('heal');if(r.autoBack){r.autoBack=false;partyRejoin(r);}diary(r.name+'に 蜜だんごを あげた。すっかり 元気だ。');return true;}

/* ---------------- orders for followers ---------------- */
const ORDERS={atk:{n:'攻めろ',d:'広く 敵を さがして 攻める（攻撃 +10%）'},def:{n:'守れ',d:'兄貴の そばの 敵だけ ねらう。うける ダメージ -20%、敵を ひきつける'},reg:{n:'集まれ',d:'戦わずに うしろへ。体力が 3倍 はやく もどる'}};
function order(){return S.order||'atk';}
function setOrder(k){S.order=k;sfx('whistle');for(const A of allies())pop(A.x,A.y-A.r-24,ORDERS[k].n+'！',k==='atk'?'#c8452d':k==='def'?'#2f6fb0':'#5f7d3a',true);}

/* ---------------- pebbles & acorns: dash into them to launch ---------------- */
function ballSetup(){
  MAP.balls=[];if(MAP.dojo)return;const acorn=['jibeta','kuchiki','miki','sakaba'].includes(AREA().id);
  const n=Math.round(MAP.w*MAP.h/260000);for(let k=0;k<n*4&&MAP.balls.length<n;k++)ballAdd(acorn,false);
}
function ballAdd(acorn,far){for(let k=0;k<30;k++){const x=rnd(100,MAP.w-100),y=rnd(100,MAP.h-100);if(blocked(x,y,18)||inLair(x,y))continue;if(far&&Math.hypot(x-P.x,y-P.y)<700)continue;MAP.balls.push({x,y,r:acorn&&Math.random()<0.6?10:8,k:acorn&&Math.random()<0.6?'acorn':'pebble',vx:0,vy:0,fly:0,spin:rnd(0,TAU),hits:null});return;}}
function launchBall(b,ang,sp,kick){b.vx=Math.cos(ang)*sp;b.vy=Math.sin(ang)*sp;b.fly=1;b.hits=new Set();sfx('clink');pop(b.x,b.y-18,kick?'ポン！':'カーン！',INK);S.shake=Math.max(S.shake,3);if(!DEX.ballTip){DEX.ballTip=true;saveDex();toast('小石を はじいた！','突進や かみつきで はじくと、敵に ぶつけられる');}}
function ballTick(){
  if(!MAP||!MAP.balls)return;const acorn=['jibeta','kuchiki','miki','sakaba'].includes(AREA().id);
  for(const b of MAP.balls){
    if(!b.fly){
      const d=Math.hypot(b.x-P.x,b.y-P.y);
      if(P.dashT>0&&d<ST.r+b.r+6){launchBall(b,Math.atan2(P.vy,P.vx)+rnd(-0.08,0.08),820,false);continue;}
      if(P.biteT>0.15&&d<ST.r+b.r+ST.range&&Math.abs(angDiff(P.ang,Math.atan2(b.y-P.y,b.x-P.x)))<0.9){launchBall(b,P.ang,560,true);continue;}
      if(!S.ballHint&&d<90&&!DEX.ballTip){S.ballHint=true;pop(b.x,b.y-20,'（突進で はじけそう）',INK);}
      continue;}
    b.x+=b.vx*DT;b.y+=b.vy*DT;b.spin+=DT*20;b.vx*=0.985;b.vy*=0.985;
    if(blocked(b.x,b.y,b.r)||b.x<20||b.y<20||b.x>MAP.w-20||b.y>MAP.h-20){b.x-=b.vx*DT;b.y-=b.vy*DT;b.vx*=-0.55;b.vy*=-0.55;sfx('clink');}
    for(const e of E){if(e.dead||b.hits.has(e)||e.z>18||e.state==='den'||e.state==='seat'||e.T.ai==='sumo'||e.state==='under')continue;
      if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r){b.hits.add(e);const sp=Math.hypot(b.vx,b.vy);damageEnemy(e,(ST.dashDmg*0.8+ST.dmg*0.7)*(b.k==='acorn'?1.2:1)*clamp(sp/700,0.5,1.2),b.x,b.y,360,0,{player:true});b.vx*=0.7;b.vy*=0.7;tot('ballHits',1);qProgress('ball',1);
        if(e.squad&&e.squad.role==='tank')squadBreak(e);}}
    if(Math.hypot(b.vx,b.vy)<70){b.fly=0;b.vx=b.vy=0;b.used=(b.used||0)+1;}
  }
  MAP.balls=MAP.balls.filter(b=>(b.used||0)<4);
  S.ballT=(S.ballT||0)-DT;if(S.ballT<=0){S.ballT=6;if(MAP.balls.length<Math.round(MAP.w*MAP.h/260000))ballAdd(acorn,true);}
}
function drawBalls(){if(!MAP||!MAP.balls)return;for(const b of MAP.balls){ctx.save();ctx.translate(b.x,b.y);
  if(b.fly){ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=b.r;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-b.vx*0.05,-b.vy*0.05);ctx.stroke();}
  ctx.fillStyle='rgba(42,33,24,.22)';ctx.beginPath();ctx.ellipse(2,4,b.r*1.1,b.r*0.7,0,0,TAU);ctx.fill();ctx.rotate(b.spin);
  if(b.k==='acorn'){inked(ellP(0,2,b.r*0.8,b.r),'#a8743a',1.6);inked(ellP(0,-b.r*0.55,b.r*0.9,b.r*0.45),'#6a4a2a',1.6);}
  else{inked(ellP(0,0,b.r,b.r*0.8),'#9a958a',1.6);gloss(-b.r*0.3,-b.r*0.3,b.r*0.35,b.r*0.15,0.45);}
  ctx.restore();}}

/* ---------------- squads: a shield in front, shooters behind ---------------- */
const SQ_TANKS=['waraji','tento','ebigani','kanabun','kokuwa','kamemushi','zarigani'],SQ_SHOOT=['kumo','gokegumo'];
function squadTypes(){const A=AREA(),ms=A.mobs.map(m=>m[0]).filter(t=>TYPES[t]&&TYPES[t].ai!=='passive'&&TYPES[t].ai!=='burrow');
  let tank=ms.find(t=>TYPES[t].tank||TYPES[t].guard||['dome','shield'].includes(TYPES[t].body))||SQ_TANKS.find(t=>TYPES[t]);
  let sh=ms.find(t=>TYPES[t].ai==='ranged')||SQ_SHOOT.find(t=>TYPES[t]);return tank&&sh?[tank,sh]:null;}
function trySquad(x,y){
  if(S.dojo||Math.random()>0.13)return false;const ty=squadTypes();if(!ty)return false;
  const g={id:S.uid++,members:[],broken:false},a=Math.atan2(y-P.y,x-P.x);
  const t=spawnEnemy(ty[0],x,y);t.squad={g,role:'tank'};g.members.push(t);
  for(let i=0;i<2;i++){const ox=x+Math.cos(a)*80+Math.cos(a+Math.PI/2)*(i?50:-50),oy=y+Math.sin(a)*80+Math.sin(a+Math.PI/2)*(i?50:-50);if(blocked(ox,oy,14))continue;const s=spawnEnemy(ty[1],ox,oy);s.squad={g,role:'shoot'};g.members.push(s);}
  return true;
}
function squadShooters(e){return e.squad.g.members.filter(m=>!m.dead&&m.squad.role==='shoot');}
/* returns steering for the shield while its shooters are alive */
function squadSteer(e,d,reach){
  if(!e.squad||e.squad.role!=='tank'||e.squad.g.broken||e.state!=='chase')return null;const sh=squadShooters(e);if(!sh.length)return null;
  if(d<reach+6)return null;
  const cx=sh.reduce((a,m)=>a+m.x,0)/sh.length,cy=sh.reduce((a,m)=>a+m.y,0)/sh.length,ux=P.x-cx,uy=P.y-cy,ud=Math.hypot(ux,uy)||1;
  const gx=cx+ux/ud*85,gy=cy+uy/ud*85,vx=gx-e.x,vy=gy-e.y,vd=Math.hypot(vx,vy);
  return vd>10?[vx/vd*e.speed*0.9,vy/vd*e.speed*0.9]:[0,0];
}
function squadGuard(e,dmg,fx_,fy_,opts){
  if(!e.squad||e.squad.role!=='tank'||e.squad.g.broken||!squadShooters(e).length)return dmg;
  if(opts.player&&P.dashT>0){squadBreak(e);return dmg;}
  const fa=Math.atan2(fy_-e.y,fx_-e.x);if(Math.abs(angDiff(Math.atan2(P.y-e.y,P.x-e.x),fa))<0.9&&Math.hypot(P.x-e.x,P.y-e.y)<e.r+120){if(Math.random()<0.35)pop(e.x,e.y-e.r-16,'たてで ガード',INK);return dmg*0.35;}
  return dmg;
}
function squadBreak(e){
  const g=e.squad&&e.squad.g;if(!g||g.broken)return;g.broken=true;sfx('crit');S.shake=Math.max(S.shake,8);pop(e.x,e.y-e.r-30,'陣形くずし！','#c8452d',true);tot('squads',1);
  e.state='recover';e.t=2;e.brokenT=3;for(const m of g.members)if(!m.dead&&m!==e){m.state='flee';m.fleeT=2;m.brokenT=3;}
}
function squadKilled(e){
  const g=e.squad&&e.squad.g;if(!g||g.done)return;if(g.members.some(m=>!m.dead&&m!==e))return;g.done=true;
  const xp=Math.round(20+areaLv()*4);later(()=>{addXP(xp,e.x,e.y-30);pop(e.x,e.y-50,'陣形 撃破！','#d9a21b',true);},200);
  if(Math.random()<0.5)foods.push({x:e.x,y:e.y,a:0,kind:'meat',bob:0});
}
ACHS.push({id:'squad5',name:'陣形やぶり',desc:'敵の 陣形を 5回 くずす'},{id:'ball30',name:'小石の 名手',desc:'はじいた 小石や 木の実を 30回 当てる'});
