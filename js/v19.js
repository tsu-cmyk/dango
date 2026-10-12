'use strict';
/* =====================================================================
   ひと夏の番長 — v19: 縄張り争い, natural predators (モグラ / トカゲ),
   種族の血 (part-set bonuses), すみかの飾り (trophies), 夜の酒場
   ===================================================================== */

/* ---------------- 縄張り争い ---------------- */
function feudTypes(){const A=AREA(),ms=[...new Set(A.mobs.map(m=>m[0]))].filter(t=>TYPES[t]&&TYPES[t].ai!=='passive'&&TYPES[t].ai!=='burrow'&&TYPES[t].dmg>0);if(ms.length<2)return null;const a=pick(ms);let b=pick(ms.filter(x=>x!==a));return [a,b];}
function feudStart(){
  const ty=feudTypes();if(!ty)return;const ang=rnd(0,TAU),cx=P.x+Math.cos(ang)*430,cy=P.y+Math.sin(ang)*430;if(blocked(cx,cy,60)||inLair(cx,cy)||cx<200||cy<200||cx>MAP.w-200||cy>MAP.h-200)return;
  const F={members:[],types:ty,joined:-1,t:0,x:cx,y:cy};
  for(let s=0;s<2;s++)for(let i=0;i<3;i++){const x=cx+(s?60:-60)+rnd(-25,25),y=cy+(i-1)*36;if(blocked(x,y,14))continue;const e=spawnEnemy(ty[s],x,y,{lv:areaLv()+(i===0?1:0)});e.feud={side:s};e.state='feud';e.fcd=rnd(0.3,1);F.members.push(e);}
  if(F.members.length<4){for(const e of F.members){e.dead=true;}return;}
  S.feud=F;banner('縄張り争いだ！','「'+TYPES[ty[0]].name+'」と「'+TYPES[ty[1]].name+'」が ケンカしている。かんだ 方の 相手に 加勢する');sfx('roar');
}
function feudTick(){
  const F=S.feud;
  if(!F){S.feudT=(S.feudT??rnd(60,100))-DT;if(S.feudT<=0){S.feudT=rnd(120,180);if(!S.bossBar&&!S.dojo&&!S.challenge&&!S.net&&Math.random()<0.75)feudStart();}return;}
  F.t+=DT;const alive=s=>F.members.filter(e=>!e.dead&&e.feud&&e.feud.side===s);
  for(const e of F.members){if(e.dead||!e.feud||e.feud.off)continue;
    const foes=F.members.filter(o=>!o.dead&&o.feud&&o.feud.side!==e.feud.side);if(!foes.length)continue;
    let tg=foes[0],bd=1e9;for(const o of foes){const d=Math.hypot(o.x-e.x,o.y-e.y);if(d<bd){bd=d;tg=o;}}
    e.ang=Math.atan2(tg.y-e.y,tg.x-e.x);e.walk+=DT*8;e.fcd-=DT;
    if(bd>e.r+tg.r+6){e.x+=Math.cos(e.ang)*e.speed*0.8*DT;e.y+=Math.sin(e.ang)*e.speed*0.8*DT;}
    else if(e.fcd<=0){e.fcd=rnd(0.8,1.2);e.slashT=0.15;e.ext=1;tg.hp-=e.dmg*(e.friendly?1.4:0.9);tg.hurtT=0.2;tg.vx+=Math.cos(e.ang)*140;tg.vy+=Math.sin(e.ang)*140;sfx('hit');if(Math.random()<0.25)pop(tg.x,tg.y-tg.r-10,pick(['ガッ','バシッ','このやろ！']),INK);
      if(tg.hp<=0){tg.feudKill=true;killEnemy(tg);}}}
  const a0=alive(0).length,a1=alive(1).length;
  if(!a0||!a1||F.t>70){
    const win=a0?0:a1?1:-1;
    if(F.joined>=0&&win===F.joined){feudReward(F,win);}
    else if(F.joined>=0&&win>=0&&win!==F.joined)toast('加勢した 側が まけた……','また どこかで 会うだろう');
    for(const e of F.members){if(e.dead)continue;if(e.friendly){e.peace=true;e.state='wander';e.feud=null;}else if(e.feud){e.feud=null;e.state='wander';}}
    S.feud=null;}
}
/* the boss bit somebody: that side turns on him, the other side is now his ally */
function feudJoin(e){
  const F=S.feud;if(!F||!e.feud||F.joined>=0)return;const hit=e.feud.side,ally=1-hit;F.joined=ally;
  for(const m of F.members){if(m.dead||!m.feud)continue;if(m.feud.side===hit){m.feud.off=true;m.state='chase';}else{m.friendly=true;}}
  banner('「'+TYPES[F.types[ally]].name+'」に 加勢した！','相手の「'+TYPES[F.types[hit]].name+'」を ぜんぶ たおそう');sfx('whistle');
  for(const m of F.members)if(m.friendly&&!m.dead)pop(m.x,m.y-m.r-20,pick(['助かる！','兄貴、たのむ！','いっしょに やるぞ！']),'#5f7d3a',true);
}
function feudReward(F,side){
  const surv=F.members.filter(e=>!e.dead&&e.friendly);tot('feuds',1);sfx('fanfare');banner('縄張りを まもった！','「'+TYPES[F.types[side]].name+'」たちから お礼');diary(TYPES[F.types[side]].name+'たちの 縄張り争いに 加勢した。');
  const d=TYPES[F.types[side]].drop;if(d){const p=mkPart(d[0],d[1],1.3);dropItem(P.x+20,P.y-10,p);announceDrop(p,true);}
  else addXP(30+areaLv()*8,P.x,P.y-30);
  const e=surv[0];if(e)later(()=>{if(S.state==='play'&&!e.dead){pop(e.x,e.y-e.r-24,'兄貴に ついていきたい！','#5f7d3a',true);offerRecruit(e,false);}},900);
}

/* ---------------- predators: モグラ (ground areas) and トカゲ (trunk & flowers) ---------------- */
const PRED_BY_AREA={jibeta:'mole',kusamura:'mole',kuchiki:'mole',hanabatake:'lizard',miki:'lizard',sakaba:'lizard'};
function predTick(){
  const k=PRED_BY_AREA[AREA().id];if(!k||S.dojo||!MAP)return;const p=S.pred;
  if(!p){S.predT=(S.predT??rnd(50,80))-DT;if(S.predT<=0){S.predT=rnd(70,110);if(S.state==='play'&&!S.rk&&!S.net){if(k==='mole')moleStart();else lizardStart();}}return;}
  p.t+=DT;if(p.k==='mole')moleTick(p);else lizardTick(p);
}
function moleStart(){const a=rnd(0,TAU);S.pred={k:'mole',x:P.x+Math.cos(a)*380,y:P.y+Math.sin(a)*380,ph:'move',t:0,trail:[]};banner('地ひびき……！','地面の 下を 何かが 近づいてくる！ 盛りあがる 土から はなれろ');sfx('thud');}
function moleTick(p){
  if(p.ph==='move'){const dx=P.x-p.x,dy=P.y-p.y,d=Math.hypot(dx,dy)||1;p.x+=dx/d*140*DT;p.y+=dy/d*140*DT;S.shake=Math.max(S.shake,1.5);if(Math.random()<DT*10)p.trail.push({x:p.x,y:p.y,t:0});if(Math.random()<DT*2)sfx('burrow');
    if(p.t>3.2||d<30){p.ph='warn';p.t=0;}}
  else if(p.ph==='warn'){if(p.t>0.55){p.ph='up';p.t=0;S.shake=14;sfx('thud');vib(80);
    for(let i=0;i<20;i++)fx.push({x:p.x,y:p.y,vx:rnd(-260,260),vy:rnd(-260,260),t:0,life:0.6,c:'#6a4a2a'});
    if(Math.hypot(P.x-p.x,P.y-p.y)<78+ST.r){hurtPlayer(ST.maxhp*0.22,null,{unblockable:true,src:'mole'});P.vx+=(P.x-p.x)*6;P.vy+=(P.y-p.y)*6;}
    for(const e of E){if(e.dead||e.state==='den'||e.state==='seat'||e.T.ai==='sumo')continue;if(Math.hypot(e.x-p.x,e.y-p.y)<78+e.r){if(e.T.boss||e.T.keeper||e.T.nushi){damageEnemy(e,e.maxhp*0.06,p.x,p.y,0,0,{force:true});stunBoss&&stunBoss(e,1.6,'モグラに ぶつかった！');}else damageEnemy(e,e.maxhp*0.6,p.x,p.y,300,0,{force:true});}}
    for(const A of allies())if(Math.hypot(A.x-p.x,A.y-p.y)<78+A.r)hurtAlly(A,A.maxhp*0.25,null);}}
  else if(p.ph==='up'&&p.t>1.2)S.pred=null;
  for(const t of p.trail)t.t+=DT;p.trail=p.trail.filter(t=>t.t<1.4);
}
function lizardStart(){const a=rnd(0,TAU),L=700;S.pred={k:'lizard',sx:P.x-Math.cos(a)*L,sy:P.y-Math.sin(a)*L,ang:a,len:L*2,ph:'warn',t:0,pos:0,hits:new Set()};banner('トカゲだ！','赤い 線から はなれろ！');sfx('whistle');}
function lizardTick(p){
  if(p.ph==='warn'){if(p.t>1.5){p.ph='run';p.t=0;sfx('dash');}}
  else if(p.ph==='run'){p.pos=Math.min(p.len,p.pos+1150*DT);const x=p.sx+Math.cos(p.ang)*p.pos,y=p.sy+Math.sin(p.ang)*p.pos;p.x=x;p.y=y;
    if(!p.hits.has(P)&&Math.hypot(P.x-x,P.y-y)<42+ST.r){p.hits.add(P);hurtPlayer(ST.maxhp*0.25,null,{unblockable:true,src:'lizard'});P.vx+=-Math.sin(p.ang)*400;P.vy+=Math.cos(p.ang)*400;pop(P.x,P.y-30,'ガブッ！','#c8452d',true);}
    for(const e of E){if(e.dead||p.hits.has(e)||e.state==='den'||e.state==='seat'||e.T.ai==='sumo')continue;if(Math.hypot(e.x-x,e.y-y)<42+e.r){p.hits.add(e);if(e.T.boss||e.T.keeper||e.T.nushi){damageEnemy(e,e.maxhp*0.06,x,y,0,0,{force:true});stunBoss(e,1.4,'トカゲに はねられた！');}else{e.dead=true;corpses.push({e,t:0});pop(e.x,e.y-14,'パクッ',INK);}}}
    for(const A of allies())if(!p.hits.has(A)&&Math.hypot(A.x-x,A.y-y)<42+A.r){p.hits.add(A);hurtAlly(A,A.maxhp*0.3,null);}
    if(p.pos>=p.len)S.pred=null;}
}
function drawPredWorld(){
  const p=S.pred;if(!p)return;
  if(p.k==='mole'){for(const t of p.trail){ctx.fillStyle='rgba(90,60,30,'+(0.5*(1-t.t/1.4))+')';ctx.beginPath();ctx.ellipse(t.x,t.y,14,9,0,0,TAU);ctx.fill();}
    if(p.ph!=='up'){const b=p.ph==='warn'?1+0.15*Math.sin(S.t*40):1;inked(ellP(p.x,p.y,26*b,18*b),'#7a5a34',2);for(let i=0;i<5;i++)dot(p.x+rnd(-14,14),p.y+rnd(-10,8),2.5,'#5a3a1a');
      if(p.ph==='warn'){ctx.strokeStyle='rgba(200,69,45,'+(0.5+0.4*Math.sin(S.t*20))+')';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y,78,0,TAU);ctx.stroke();}}
    else{const k=Math.min(1,p.t/0.15),a=1-Math.max(0,(p.t-0.8)/0.4);ctx.globalAlpha=Math.max(0,a);inked(ellP(p.x,p.y+6,52,30),'#5a3a1a',2.4);
      ctx.save();ctx.translate(p.x,p.y-10*k);inked(ellP(0,0,34*k,30*k),'#4a3a3a',2.4);inked(ellP(0,-22*k,9*k,8*k),'#e8909a',1.8);dot(-10*k,-12*k,2.5*k,INK);dot(10*k,-12*k,2.5*k,INK);
      for(const s of [-1,1]){ctx.save();ctx.translate(s*30*k,4*k);inked(ellP(0,0,13*k,9*k,s*0.4),'#e8c0b0',1.8);ctx.restore();}ctx.restore();ctx.globalAlpha=1;}}
  else{const ex=p.sx+Math.cos(p.ang)*p.len,ey=p.sy+Math.sin(p.ang)*p.len;
    if(p.ph==='warn'){ctx.strokeStyle='rgba(200,69,45,'+(0.35+0.35*Math.sin(S.t*18))+')';ctx.lineWidth=70;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=3;ctx.setLineDash([16,12]);ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.setLineDash([]);}
    else if(p.x!=null){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.ang);const w=Math.sin(S.t*40)*0.3;
      ctx.strokeStyle=INK;ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-40,0);ctx.quadraticCurveTo(-90,w*40,-140,-w*30);ctx.stroke();ctx.strokeStyle='#6a8a3a';ctx.lineWidth=8;ctx.stroke();
      for(const [x,s] of [[18,1],[18,-1],[-26,1],[-26,-1]]){ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+s*w*20+8,s*26);ctx.stroke();}
      inked(ellP(0,0,46,17),'#7a9a4a',2.4);inked(ellP(44,0,20,13),'#7a9a4a',2.4);dot(50,-7,3,INK);dot(50,7,3,INK);ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.ellipse(-4,-5,30,5,0,0,TAU);ctx.fill();ctx.restore();}}
}

/* ---------------- 種族の血 ---------------- */
const BLOODS={
  kouchu:{n:'甲虫の血',ids:['kuwa','hirata','tsuno','onizuno','kamikiri','koura','kanabun','tsuyahada'],col:'#6a4a2a',d:['一撃 +10%','一撃 +18%・ふきとばし 強化']},
  hachi:{n:'ハチの血',ids:['hari','ohari','mitsu','ougon','kumahane','raiden'],col:'#d8a830',d:['会心 +8%','会心 +15%']},
  koukaku:{n:'甲殻の血',ids:['zari','kara','kougyoku'],col:'#c0503a',d:['うける ダメージ -10%','うける ダメージ -18%']},
  mukade:{n:'百足の血',ids:['geji','mukade','gomimushi','kiba','gokegumo'],col:'#9a5a2a',d:['足 +8%','足 +14%・毒 +3']},
  hane:{n:'羽虫の血',ids:['ageha','murasaki','gekka','hane','batta','kazekiri','kama','amenbo'],col:'#7aa04a',d:['突進 +12%','突進 +20%・突進ダメージ +15%']},
  ari:{n:'アリの血',ids:['ago','oago','kongou','hiari','hiaribari'],col:'#a2412b',d:['かむ はやさ +10%','かむ はやさ +18%']}
};
function bloodOf(eq){const ids=SLOTS.map(s=>eq[s].id);let best=null,bn=1;for(const k in BLOODS){const n=ids.filter(i=>BLOODS[k].ids.includes(i)).length;if(n>bn){bn=n;best=k;}}return best?{k:best,n:bn,tier:bn>=3?2:1}:null;}
function applyBlood(st,eq){const b=bloodOf(eq);st.blood=b;if(!b)return;const t=b.tier;
  switch(b.k){case 'kouchu':st.dmg*=t>1?1.18:1.1;if(t>1)st.kb*=1.3;break;case 'hachi':st.crit+=t>1?0.15:0.08;break;case 'koukaku':st.def*=t>1?0.82:0.9;break;
    case 'mukade':st.speed*=t>1?1.14:1.08;if(t>1)st.poison+=3;break;case 'hane':st.dash*=t>1?1.2:1.12;if(t>1)st.dashDmg*=1.15;break;case 'ari':st.cd*=t>1?0.82:0.9;break;}}
function bloodCheck(){const b=ST.blood,k=b?b.k+b.tier:'';if(k!==S.bloodKey){const was=S.bloodKey;S.bloodKey=k;if(b&&was!==undefined){toast(BLOODS[b.k].n+'が めざめた！'+(b.tier>1?'（濃い）':''),BLOODS[b.k].d[b.tier-1]);sfx('star');DEX.bloods=DEX.bloods||{};DEX.bloods[b.k]=true;saveDex();}}}
function bloodBody(ids){const eq=ids._eq;if(!eq)return null;const b=bloodOf(eq);return b?{col:mixHex(DANGO_BODY,BLOODS[b.k].col,b.tier>1?0.55:0.33),k:b.k,tier:b.tier}:null;}

/* ---------------- すみかの飾り ---------------- */
const TROPHY_MAX=3;
function bossPartIds(){if(bossPartIds.c)return bossPartIds.c;const s=new Set();for(const k in TYPES){const T=TYPES[k];if((T.boss||T.nushi||T.keeper)&&T.drop)s.add(T.drop[1]);}return bossPartIds.c=s;}
function trophyPower(p){return (bossPartIds().has(p.id)?1.6:1)*(1+p.rar*0.2+(p.st-1)*0.15);}
const TROPHY_EFF={head:{n:'一撃',v:0.05},legs:{n:'足',v:0.04},tail:{n:'経験値',v:0.05},back:{n:'うける ダメージ',v:-0.04}};
function trophyText(p){const e=TROPHY_EFF[p.s],v=e.v*trophyPower(p);return e.n+' '+(v>0?'+':'')+Math.round(v*100)+'%';}
function trophyMul(slot){let m=0;for(const p of S.trophies||[])if(p.s===slot)m+=TROPHY_EFF[slot].v*trophyPower(p);return m;}
function applyTrophies(st){st.dmg*=1+trophyMul('head');st.speed*=1+trophyMul('legs');st.def*=1+trophyMul('back');}
function trophyXpMul(){return 1+trophyMul('tail');}
function hangTrophy(p){S.trophies=S.trophies||[];if(S.trophies.length>=TROPHY_MAX)return false;S.store=S.store.filter(x=>x!==p);S.trophies.push(p);sfx('store');diary('すみかに「'+partName(p)+'」を かざった。');return true;}
function takeTrophy(i){const p=(S.trophies||[])[i];if(!p)return false;if(S.store.length>=STORE_MAX)return false;S.trophies.splice(i,1);S.store.push(p);return true;}
function drawTrophies(){if(!MAP||!S.trophies||!S.trophies.length||MAP.dojo)return;const s=MAP.sumika;S.trophies.forEach((p,i)=>{const x=s.x-40+i*40,y=s.y-62+Math.sin(S.t*2+i)*2;ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y-18);ctx.lineTo(x,y-8);ctx.stroke();ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(244,234,210,.9)';ctx.beginPath();ctx.arc(0,0,13,0,TAU);ctx.fill();ctx.strokeStyle=bossPartIds().has(p.id)?'#d9a21b':INK;ctx.lineWidth=2;ctx.stroke();drawPartIcon(p.s,p.id,10);ctx.restore();});}

/* ---------------- 夜の酒場: 力比べ and 相撲 at a sap pool near the leaf house ---------------- */
function tavernSetup(){MAP.tavern=null;if(MAP.dojo)return;const s=MAP.sumika;for(let k=0;k<80;k++){const a=rnd(0,TAU),d=rnd(260,420),x=s.x+Math.cos(a)*d,y=s.y+Math.sin(a)*d;if(x<200||y<200||x>MAP.w-200||y>MAP.h-200||blocked(x,y,70)||inLair(x,y))continue;MAP.tavern={x,y,crowd:[0,1,2].map(()=>pick(AREA().mobs.map(m=>m[0]).filter(t=>TYPES[t].ai!=='burrow')))};return;}}
/* the night tavern was retired (v21) */
function tavernOpen(){return false;}
function tavernTick(){
  if(!tavernOpen()||S.mg||S.talk||S.state!=='play'||S.bossBar)return;const T=MAP.tavern,d=Math.hypot(P.x-T.x,P.y-T.y);
  S.tavCd=(S.tavCd||0)-DT;if(d>110){if(d>200)S.tavAsked=false;return;}if(S.tavAsked||S.tavCd>0)return;S.tavAsked=true;
  const key=S.areaI+':'+dayNum(),done=(S.tavDone||{})[key]||{};const u=UIH();if(!u||!HAS_DOM)return;
  const ch=[],acts=[];if(!done.push){ch.push('力比べ（かむ 連打）');acts.push('push');}if(!done.sumo&&!MAP.sumo){ch.push('相撲を とる');acts.push('sumo');}ch.push('今夜は やめておく');acts.push('no');
  S.talk=true;u.ask('夜の 酒場の 常連',acts.length>1?'よう、番長。一杯 やってくかい？ 腕に おぼえが あるなら、勝負していきな。':'今夜は もう 勝負は おわりだ。また 明日の 夜に 来な。',ch,k=>{S.talk=false;S.tavCd=4;const a=acts[k];
    if(a==='push')mgStart(key);else if(a==='sumo')tavernSumo(key);});
}
function tavernSumo(key){const T=MAP.tavern;MAP.sumo={x:T.x+(T.x<MAP.w/2?170:-170),y:T.y,R:120};const s=spawnEnemy('sumou',MAP.sumo.x,MAP.sumo.y,{lv:areaLv()+2});s.ang=Math.PI/2;S.tavDone=S.tavDone||{};(S.tavDone[key]=S.tavDone[key]||{}).sumo=true;banner('土俵が できた！','となりの 土俵へ 入ると 相撲が はじまる');}
function mgStart(key){const opp=pick(MAP.tavern.crowd);S.mg={k:'push',t:-1.2,pos:0,opp,key,str:1+0.04*areaLv(),taps:0};sfx('drum');}
function mgTick(){
  const m=S.mg;m.t+=DT;const press=inp.bite||inp.combo;inp.bite=false;inp.combo=false;
  if(m.t<0)return;if(m.res){if(m.t>m.endT+1.8)mgEnd();return;}
  if(press){m.taps++;m.pos+=0.06*(0.8+0.6*ST.dmg/(ST.dmg+30+areaLv()*3));sfx('hit');S.shake=2;}
  m.pos-=DT*0.34*m.str*(0.8+0.4*Math.sin(m.t*3));
  if(m.pos>=1||m.pos<=-1||m.t>9){m.res=m.pos>0?'win':'lose';m.endT=m.t;sfx(m.res==='win'?'fanfare':'down');}
}
function mgEnd(){const m=S.mg;S.mg=null;S.tavDone=S.tavDone||{};(S.tavDone[m.key]=S.tavDone[m.key]||{}).push=true;
  if(m.res==='win'){tot('pushWins',1);const r=Math.random();if(r<0.4)gainDango(1,P.x,P.y);else if(r<0.7){const d=TYPES[m.opp].drop;if(d){const p=mkPart(d[0],d[1],1.2);dropItem(P.x+20,P.y,p);announceDrop(p,true);}else addXP(30+areaLv()*8,P.x,P.y);}else addXP(30+areaLv()*8,P.x,P.y);banner('力比べに 勝った！','「'+TYPES[m.opp].name+'」「まいった、番長は ちがうな」');diary('夜の 酒場で 力比べに 勝った。');}
  else banner('力比べに 負けた……','「また 明日の 夜に 来な」');checkAch();}
function drawTavern(){if(!tavernOpen())return;const T=MAP.tavern;const g=ctx.createRadialGradient(T.x,T.y,10,T.x,T.y,140);g.addColorStop(0,'rgba(255,190,80,.35)');g.addColorStop(1,'rgba(255,190,80,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(T.x,T.y,140,0,TAU);ctx.fill();
  drawSap({x:T.x,y:T.y,rx:46,ry:28});
  T.crowd.forEach((t,i)=>{const a=-Math.PI/2+(i-1)*0.9+Math.PI,x=T.x+Math.cos(a)*64,y=T.y+Math.sin(a)*44,Ty=TYPES[t];ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(T.y-y,T.x-x));drawBugBody(Ty,Math.min(Ty.r,14),{type:t,walk:0,flap:S.t*20,open:0.3+0.2*Math.sin(S.t*3+i)});ctx.restore();});
  ctx.font='900 12px '+FONT;ctx.textAlign='center';ctx.fillStyle='#fff3c4';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.strokeText('夜の 酒場',T.x,T.y-52);ctx.fillText('夜の 酒場',T.x,T.y-52);}
function drawMgScreen(){const m=S.mg;if(!m)return;
  ctx.fillStyle='rgba(10,5,20,.55)';ctx.fillRect(0,0,W,Hh);const cy=Hh*0.42,bw=Math.min(W-60,360),bx=(W-bw)/2;
  ctx.textAlign='center';ctx.font=clamp(W*0.08,26,40)+'px '+DFONT;ctx.fillStyle='#fff6e0';ctx.strokeStyle=INK;ctx.lineWidth=6;const ttl=m.t<0?'力比べ！ 用意……':m.res?(m.res==='win'?'勝ち！':'負け……'):'「かむ」を 連打！';ctx.strokeText(ttl,W/2,cy-110);ctx.fillText(ttl,W/2,cy-110);
  /* the two bugs pushing heads together */
  const mid=W/2+m.pos*bw*0.4;ctx.save();ctx.translate(mid-44,cy-30);drawDango(eqIds(P.eq),26,{walk:S.t*(m.res?0:14)});ctx.restore();
  const T=TYPES[m.opp];ctx.save();ctx.translate(mid+46,cy-30);ctx.rotate(Math.PI);drawBugBody(T,clamp(T.r*1.6,20,30),{type:m.opp,walk:S.t*14,open:0.6});ctx.restore();
  ctx.fillStyle=INK;ctx.fillRect(bx-4,cy+30,bw+8,26);ctx.fillStyle='#c8452d';ctx.fillRect(bx,cy+34,bw/2*(1-Math.max(0,m.pos)),18);ctx.fillStyle='#f2b632';ctx.fillRect(bx+bw/2-bw/2*Math.max(0,-m.pos),cy+34,0,18);
  const k=(m.pos+1)/2;ctx.fillStyle='#d8cfb8';ctx.fillRect(bx,cy+34,bw,18);ctx.fillStyle='#f2b632';ctx.fillRect(bx,cy+34,bw*k,18);ctx.fillStyle='#c8452d';ctx.fillRect(bx+bw*k,cy+34,bw*(1-k),18);ctx.fillStyle=INK;ctx.fillRect(bx+bw/2-2,cy+30,4,26);
  ctx.font='900 13px '+FONT;ctx.fillStyle='#fff';ctx.fillText(m.t<0?'':m.res?'':'のこり '+Math.max(0,9-m.t).toFixed(1)+'秒 ・ '+m.taps+'回',W/2,cy+80);}
ACHS.push({id:'feud3',name:'仁義の 番長',desc:'縄張り争いで 3回 加勢して 勝つ'},{id:'blood',name:'血が さわぐ',desc:'種族の血を めざめさせる'},{id:'trophy3',name:'自慢の すみか',desc:'すみかに 3つ かざる'});
