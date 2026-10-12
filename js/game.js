'use strict';
/* =====================================================================
   ひと夏の番長 — game logic
   ===================================================================== */
const SAVE_KEY='banchou-save-v1',DEX_KEY='banchou-dex-v1',OPT_KEY='banchou-opt';
const S={state:'title',t:0,time:0,playT:0,cycle:0,areaI:0,cam:{x:0,y:0},shake:0,hitstop:0,talk:false,
  store:[],roster:[],allyI:-1,allyJ:-1,cleared:[],unlocked:0,diary:{},uid:1,keepersDown:0,bossDown:false,exit:null,sumo:null,sumoCool:0,
  stats:{kills:0,bosses:0,sumo:0,crits:0,maxHit:0,parts:0,elites:0,deaths:0,combos:0},bird:null,bossBar:null,sumikaLock:false,itemHold:null,lastDay:1,autosave:0,seenSumo:false,firstClear:{}};
let P=null,E=[],ALLY=null,ALLY2=null,items=[],foods=[],pops=[],fx=[],shots=[],clouds=[],trails=[],waves=[],corpses=[];
let ST=null;
let DEX={bugs:{},parts:{},combos:{},clears:0,best:null};
const inp={x:0,y:0,bite:false,roll:false};
const UIH=()=>typeof UI!=='undefined'?UI:null;
const later=(f,ms)=>{if(HAS_DOM)setTimeout(f,ms);else f();};
const dayNum=()=>1+Math.floor(S.time/DAY);
function dateStr(d){d=d||dayNum();return d<=31?'8月'+d+'日':'9月'+(d-31)+'日';}
/* summers past the third keep getting a little harder instead of running off the level cap */
const cyEff=()=>Math.min(S.cycle,2)+0.6*Math.max(0,S.cycle-2);
const areaLv=()=>Math.min(MAX_LV-1,AREAS[S.areaI].lv+Math.round(18*Math.min(S.cycle,2)+5*Math.max(0,S.cycle-2)));
const AREA=()=>AREAS[S.areaI];

/* ---------------- parts ---------------- */
function defPart(slot){return {u:0,s:slot,id:DEFAULT_ID[slot],q:1,rar:0,tr:[],st:1};}
function mkPart(slot,id,bonus){
  bonus=bonus||0;const r=Math.random();let rar=0;
  if(r<0.02+bonus*0.06)rar=2;else if(r<0.14+bonus*0.16)rar=1;
  const q=rar===2?rnd(1.08,1.2):rar===1?rnd(0.98,1.13):rnd(0.88,1.08);
  const nt=rar===2?2:rar===1?1:(Math.random()<0.12?1:0),tr=[];
  while(tr.length<nt){const k=pick(TRAIT_KEYS);if(!tr.includes(k))tr.push(k);}
  return {u:S.uid++,s:slot,id,q:Math.round(q*100)/100,rar,tr,st:1};
}
function partName(p,noStar){return (p.rar?RARITY[p.rar].name+' ':'')+PARTS[p.s][p.id].name+(!noStar&&p.st>1?' ★'+p.st:'');}
function partScore(p){return (p.q-1)*100+p.rar*30+p.tr.length*15+(p.st-1)*25;}
function partXP(p){return Math.round((10+areaLv()*5)*(1+p.rar*0.8)*(1+0.3*(p.st-1)));}
function eqIds(eq){return {head:eq.head.id,legs:eq.legs.id,tail:eq.tail.id,back:eq.back.id,_eq:eq};}

/* ---------------- player stats ---------------- */
function calcStats(eq,lv){
  const h=PARTS.head[eq.head.id],l=PARTS.legs[eq.legs.id],t=PARTS.tail[eq.tail.id],b=PARTS.back[eq.back.id];
  const combos=activeCombos(eqIds(eq)).map(c=>c.id),has=c=>combos.includes(c);
  const tr={};for(const s of SLOTS)for(const k of eq[s].tr)tr[k]=(tr[k]||0)+1;
  const sm=p=>1+0.18*(p.st-1),lvM=1+0.085*(lv-1);
  const dmg=h.dmg*eq.head.q*sm(eq.head)*lvM*Math.pow(1.15,tr.sharp||0)*(has('fukaku')?1.2:1);
  const cd=h.cd*Math.pow(0.85,tr.rapid||0)*(has('renkami')?0.5:1);
  let def=b.def||1;if(def<1)def=Math.max(0.42,1-(1-def)*eq.back.q*(1+0.08*(eq.back.st-1)));def=Math.max(0.36,def*Math.pow(0.9,tr.hard||0));
  const speed=l.speed*Math.sqrt(eq.legs.q)*(1+0.04*(eq.legs.st-1))*(b.spd||1)*Math.pow(1.1,tr.quick||0);
  const dash=l.dash*(b.dashMul||1)*(1+0.05*(eq.legs.st-1));
  const poison=((h.poison||0)*sm(eq.head)+(t.poison||0)*sm(eq.tail)+(tr.venom?4*tr.venom:0))*lvM;
  const dashDmg=(8+lv*2.6)*(1+(dash-470)/900)*(b.slam||1)*Math.pow(1.5,tr.ram||0)*(has('gouriki')?2:1)*(eq.legs.q);
  return {dmg,cd,range:h.range,arc:h.arc,kb:h.kb||1,grab:!!h.grab,guard:h.guard||0,poison,
    speed,dash,def,dashDmg,counter:(t.counter||0)*eq.tail.q*sm(eq.tail)*lvM,heal:t.heal||0,gas:!!t.gas,
    stink:!!b.stink,glide:!!b.glide,dashInv:!!b.dashInv,regen:(b.regen?0.006:0)+(has('hananomitsu')?0.02:0),water:!!l.water,dashPoison:(l.dashPoison||0)*lvM,
    combos,tr,r:13+Math.min(5,lv*0.1),maxhp:40+11*(lv-1),crit:0.05+0.15*(tr.crit||0),vamp:0.12*(tr.vamp||0),thorns:0.25*(tr.thorns||0),
    guts:!!tr.guts,glutton:!!tr.glutton,scare:!!tr.boss||has('fukaku'),reflect:b.reflect||0};
}
function refreshStats(){ST=calcStats(P.eq,P.lv);ST.speed*=themeSpeedMul();applyBlood(ST,P.eq);applyTrophies(ST);if(P.hp>ST.maxhp)P.hp=ST.maxhp;}
function newPlayer(){
  const p={x:0,y:0,ang:-Math.PI/2,vx:0,vy:0,lv:1,xp:0,hp:40,eq:{head:defPart('head'),legs:defPart('legs'),tail:defPart('tail'),back:defPart('back')},
    walk:0,ball:0,biteCd:0,biteT:0,inv:0,hurtT:0,dashT:0,rolled:false,stunT:0,slowT:0,healT:0,stinkCd:0,gutsUsed:false,trailT:0,glideT:0,pulled:null};
  return p;
}

/* ---------------- dex, diary, xp ---------------- */
function saveDex(){try{localStorage.setItem(DEX_KEY,JSON.stringify(DEX));}catch(e){}}
function loadDex(){try{const d=JSON.parse(localStorage.getItem(DEX_KEY)||'null');if(d)DEX=Object.assign(DEX,d);}catch(e){}}
function diary(text){const d=dayNum();(S.diary[d]=S.diary[d]||[]);if(!S.diary[d].includes(text))S.diary[d].push(text);}
function pop(x,y,text,col,big){pops.push({x,y,text,t:0,col:col||INK,big:!!big});}
function addXP(n,x,y){
  n=Math.max(1,Math.round(n));P.xp+=n;if(x!==undefined)pop(x,y,'+'+n,'#a77a00');
  let up=false;while(P.lv<MAX_LV&&P.xp>=xpNeed(P.lv)){P.xp-=xpNeed(P.lv);P.lv++;up=true;}
  if(up){refreshStats();P.hp=ST.maxhp;pop(P.x,P.y-40,'Lv'+P.lv+'！ からだが 大きくなった',INK==='#2a2118'?'#c8452d':'#c8452d',true);sfx('lvup');
    for(let i=0;i<16;i++){const a=i/16*TAU;fx.push({x:P.x,y:P.y,vx:Math.cos(a)*180,vy:Math.sin(a)*180,t:0,life:0.6,c:'#f2b632'});}
    if(P.lv%5===0)diary('Lv'+P.lv+'に なった。');}
}
function tot(k,n){DEX.tot=DEX.tot||{};DEX.tot[k]=(DEX.tot[k]||0)+n;}
function totMax(k,v){DEX.tot=DEX.tot||{};if(v>(DEX.tot[k]||0))DEX.tot[k]=Math.round(v);}
function vib(ms){if(OPT.vib&&HAS_DOM&&navigator.vibrate)try{navigator.vibrate(ms);}catch(e){}}
function banner(t,s){const u=UIH();if(u)u.banner(t,s);}
function say(lines,cb){const u=UIH();if(u&&HAS_DOM){S.talk=true;u.say(lines,()=>{S.talk=false;if(cb)cb();});}else{if(cb)cb();}}
function checkNewCombos(before){
  const now=activeCombos(eqIds(P.eq)).filter(c=>!before.includes(c.id));
  const u=UIH();
  for(const c of now){const first=!DEX.combos[c.id];DEX.combos[c.id]=true;saveDex();
    if(first){diary('わざ「'+c.name+'」を おぼえた。');S.stats.combos++;}
    if(first&&u&&HAS_DOM)u.waza(c);
    else{const H=COMBO_HOW[c.id];banner('わざ「'+c.name+'」',(H.btn==='auto'?'じどう：':BTN_NAME[H.btn]+'で：')+H.how);sfx('combo');}}
}
/* visible feedback when a わざ fires: name pop + its button label flashes */
function comboFx(id,x,y){
  if(!S.comboFxT)S.comboFxT={};const t=S.comboFxT[id]||0;
  const u=UIH();if(u&&HAS_DOM)u.tagHit(COMBO_HOW[id].btn);
  if(S.t-t<2.2)return;S.comboFxT[id]=S.t;
  pop(x,y-40,COMBOS.find(c=>c.id===id).name+'！','#d9a21b',true);
}
function equipPart(p){
  const before=activeCombos(eqIds(P.eq)).map(c=>c.id),old=P.eq[p.s];
  P.eq[p.s]=p;S.store=S.store.filter(x=>x!==p);
  if(!isDefault(old.s,old.id))storePart(old,true);
  refreshStats();checkNewCombos(before);
  if(!DEX.parts[p.id]){DEX.parts[p.id]=true;saveDex();}
}
function unequip(slot){const old=P.eq[slot];if(isDefault(slot,old.id))return;if(storePart(old,true)){P.eq[slot]=defPart(slot);refreshStats();}}
const STORE_MAX=40;
function storePart(p,quiet){if(S.store.length>=STORE_MAX){if(!quiet)pop(P.x,P.y-30,'すみかが いっぱい！',INK,true);dropItem(P.x,P.y+30,p);return false;}S.store.push(p);if(!quiet){sfx('store');pop(P.x,P.y-30,'すみかへ おくった',INK,true);}return true;}
/* ★ synthesis: the BASE keeps its own rarity and quality; the material gives +1★ and passes on one trait it has that the base lacks */
function mergePreview(base,mat){
  const tr=base.tr.slice(),give=mat.tr.find(k=>!tr.includes(k));let gained=null;
  if(give&&tr.length<3){tr.push(give);gained=give;}
  return {u:base.u,s:base.s,id:base.id,q:Math.round(Math.min(1.25,base.q+Math.max(0,mat.q-base.q)*0.25)*100)/100,rar:base.rar,tr,st:Math.min(5,Math.max(base.st,mat.st)+1),gained};
}
function mergeParts(base,mat){
  const r=mergePreview(base,mat);base.st=r.st;base.q=r.q;base.tr=r.tr;
  S.store=S.store.filter(x=>x!==mat);refreshStats();sfx('merge');
  pop(P.x,P.y-36,partName(base)+'！','#b8860b',true);diary(PARTS[base.s][base.id].name+'が ★'+base.st+'に そだった。');
  return base;
}
/* equip `p` as the new base and feed the currently equipped part of the same kind into it */
function swapMerge(p){
  const cur=P.eq[p.s];if(cur.id!==p.id)return;
  S.store=S.store.filter(x=>x!==p);P.eq[p.s]=p;mergeParts(p,cur);
}
function eatCommons(){const list=S.store.filter(p=>p.rar===0&&p.st===1&&!p.tr.length);let n=0;for(const p of list){n+=partXP(p);}S.store=S.store.filter(p=>!list.includes(p));if(n){addXP(n,P.x,P.y-20);sfx('eat');}return list.length;}
function eatPart(p){S.store=S.store.filter(x=>x!==p);const n=partXP(p);addXP(n,P.x,P.y-20);sfx('eat');}

/* ---------------- area ---------------- */
function spawnEnemy(type,x,y,o){
  const T=TYPES[type];o=o||{};
  const lv=o.lv!=null?o.lv:areaLv()+(T.lvOff||0)+((T.boss||T.keeper||T.ai==='sumo')?0:Math.floor(Math.random()*3));
  const cy=cyEff(),elite=!!o.elite;
  const e={id:S.uid++,type,T,x,y,ang:rnd(0,TAU),vx:0,vy:0,lv,r:T.r*(elite?1.18:1),
    maxhp:T.hp*(1+0.12*(lv-1))*(1+0.35*cy)*cycBoost(0.15)*(elite?2.2:1),dmg:T.dmg*(1+0.135*(lv-1))*(1+0.25*cy)*cycBoost(0.08)*(elite?1.35:1)*(T.boss?1.15:T.keeper?1.08:1),
    speed:T.speed*(elite?1.1:1)*(1+0.04*cy),elite,state:'wander',t:rnd(0,2),cd:rnd(0.6,1.5),home:{x,y},tx:x,ty:y,walk:rnd(0,TAU),flap:rnd(0,TAU),
    hurtT:0,poisonT:0,poisonD:0,z:0,shotT:rnd(1,2),sumT:5,slashT:0,fleeT:0,pinchCd:0,stinkCd:0,phase:1,burrow:1,ext:0,hop:0,tg:null,tgT:0,inLair:inLair(x,y)};
  e.hp=e.maxhp;
  if(elite&&T.ai!=='passive')giveAffix(e);
  if(T.ai==='burrow'){e.burrow=0;e.state='under';e.t=rnd(2,6);}
  if(T.boss||T.keeper)e.state='den';
  if(T.ai==='sumo')e.state='sumo_idle';
  E.push(e);return e;
}
/* next summers: early areas are brought up to late-game toughness */
function cycBoost(k){return 1+cyEff()*(k||0.2)*(AREAS.length-1-S.areaI);}
function mobType(){if(S.swarm&&!S.dojo&&Math.random()<0.55)return S.swarm;if(S.cycle>=1&&!S.dojo&&Math.random()<Math.min(0.5,0.28+0.08*(S.cycle-1))){const L=INV_MOBS[S.areaI]||INV_MOBS[0];return pick(L);}const A=AREA(),tot=A.mobs.reduce((s,m)=>s+m[1],0);let p=Math.random()*tot;for(const m of A.mobs){p-=m[1];if(p<=0)return m[0];}return A.mobs[0][0];}
function spawnMob(far){
  const M=MAP;
  for(let k=0;k<40;k++){
    let t=mobType();const A0=AREA(),nm=NIGHT_MOBS[A0.id];if(isNight()&&nm&&Math.random()<0.35)t=nm;if(isRain()&&Math.random()<0.25&&['jibeta','kusamura','kuchiki'].includes(A0.id))t='mimizu';
    const T=TYPES[t];if(isRain()&&T.ai==='flyer'&&!far)continue;let x,y;
    if(T.ai==='water'&&M.river){x=rnd(100,M.w-100);y=M.river.yAt(x)+rnd(-40,40);}
    else{x=rnd(80,M.w-80);y=rnd(80,M.h-80);if(blocked(x,y,T.r+10))continue;}
    if(inLair(x,y)||M.arenas.some(a=>Math.hypot(a.x-x,a.y-y)<a.R+40))continue;
    const dp=Math.hypot(x-P.x,y-P.y);if(dp<(far?900:520))continue;
    if(Math.hypot(x-M.sumika.x,y-M.sumika.y)<260)continue;
    if(M.sumo&&Math.hypot(x-M.sumo.x,y-M.sumo.y)<M.sumo.R+80)continue;
    const elite=T.ai!=='passive'&&T.ai!=='burrow'&&Math.random()<(0.05+0.05*S.cycle)*(isNight()?2:1);
    if(trySquad(x,y))return null;
    const e=spawnEnemy(t,x,y,{elite});
    /* small packs for ants and bees */
    if((t==='ari'||t==='kuroari'||t==='mitsubachi'||t==='hiari')&&Math.random()<0.6){for(let i=0;i<2;i++){const x2=x+rnd(-50,50),y2=y+rnd(-50,50);if(!blocked(x2,y2,12))spawnEnemy(t,x2,y2);}}
    return e;
  }
  return null;
}
function loadArea(i,opts){
  opts=opts||{};
  S.areaI=i;const A=AREAS[i];
  MAP=genMap(i,S.cycle);
  E=[];items=[];foods=[];pops=[];fx=[];shots=[];clouds=[];trails=[];waves=[];corpses=[];
  S.cameo=null;S.cutin=null;S.rk=null;S.tbHere=null;S.tbDone=false;S.tbT=0;S.swarmKills=0;S.gusts=0;S.tbFlies=0;S.chain=0;S.chainT=0;S.duoCd=8;S.bg=null;S.wind=null;S.windTold=false;S.slowmo=0;S.flash=0;S.keepersDown=0;S.bossDown=false;S.exit=null;S.sumo=null;S.bossBar=null;S.sumikaLock=true;S.itemHold=null;S.seenSumo=false;
  const cleared=S.cleared.includes(i);S.challenge=!!opts.challenge;S.chalT=0;S.dojo=false;S.saved=null;
  MAP.lair.open=cleared||S.challenge;MAP.lair.openT=MAP.lair.open?1:0;
  if(S.cycle>=1&&MAP.arenas[1]&&TYPES['inv_'+A.id])MAP.arenas[1].keeper='inv_'+A.id;
  for(const a of MAP.arenas){const e=spawnEnemy(a.keeper,a.x,a.y);e.arena=a;a.beaten=false;if(S.challenge)awaken(e);}
  const L=MAP.lair,bossT=TYPES[A.boss];
  const b=spawnEnemy(A.boss,L.x,A.final?L.y-30:L.y);b.lair=true;b.inLair=true;if(S.challenge)awaken(b);
  if(A.final){b.state='seat';b.ang=Math.PI/2;}
  if(!S.challenge&&placeSumo(MAP,opts.forceSumo?1:0.3)){const s=spawnEnemy('sumou',MAP.sumo.x,MAP.sumo.y,{lv:areaLv()+2});s.ang=Math.PI/2;}
  themeAreaSetup();ballSetup();digSetup();S.ballHint=false;S.digHint=false;S.net=null;S.netT=rnd(60,100);S.feud=null;S.pred=null;S.feudT=rnd(50,90);S.predT=rnd(50,80);S.mg=null;S.tavAsked=false;tavernSetup();
  const n=Math.round(A.mobN*(1+0.15*S.cycle)*themeMobMul());for(let k=0;k<n;k++)spawnMob(false);
  S.nushiHere=null;
  if(!opts.title){S.nushiMiss=S.nushiMiss||{};const miss=S.nushiMiss[A.id]||0,ch=opts.forceNushi?1:S.challenge?0:Math.min(0.3,0.1+0.04*miss)*(isNight()?1.6:1);
    if(Math.random()<ch){S.nushiMiss[A.id]=0;const t='nushi_'+A.id;
      for(let k=0;k<300;k++){const x=rnd(150,MAP.w-150),y=rnd(150,MAP.h-150);if(blocked(x,y,40)||inLair(x,y)||Math.hypot(x-MAP.start.x,y-MAP.start.y)<1300||MAP.arenas.some(a=>Math.hypot(a.x-x,a.y-y)<a.R+150))continue;
        const e=spawnEnemy(t,x,y);S.nushiHere=e;break;}}
    else S.nushiMiss[A.id]=miss+1;}
  for(let k=0;k<Math.round(MAP.w*MAP.h/180000*themeFoodMul());k++)spawnFood();
  P.x=MAP.start.x;P.y=MAP.start.y;P.vx=P.vy=0;P.ang=-Math.PI/2;P.inv=1;P.rolled=false;P.dashT=0;P.slowT=0;P.stunT=0;P.gutsUsed=false;P.inLair=false;
  refreshStats();P.hp=ST.maxhp;
  spawnAlly();
  S.cam.x=P.x;S.cam.y=P.y-80;
  S.bird={st:'idle',t:14,y:0,x:0,dir:1};
}
function spawnFood(){const M=MAP;for(let k=0;k<20;k++){const x=rnd(80,M.w-80),y=rnd(100,M.h-80);if(blocked(x,y,24)||inLair(x,y))continue;foods.push({x,y,a:rnd(0,TAU),kind:AREA().food[Math.random()<0.7?0:1],bob:rnd(0,TAU)});return;}}
/* ---------------- followers ---------------- */
const allyNeed=lv=>Math.round(xpNeed(lv)*0.75);
function skillTier(r){if(!r)return 0;const g=r.lv-(r.lv0??r.lv);return g>=8?2:(g>=3||r.keeper)?1:0;}
function allyGainXP(r,n){
  if(!r||r.lv>=MAX_LV)return;r.xp=(r.xp||0)+n;const before=skillTier(r);let up=false;
  while(r.lv<MAX_LV&&r.xp>=allyNeed(r.lv)){r.xp-=allyNeed(r.lv);r.lv++;up=true;}
  if(!up)return;
  const st=allyStats(r);for(const A of [ALLY,ALLY2])if(A&&A.rec===r){const f=A.hp/A.maxhp;A.lv=st.lv;A.maxhp=st.maxhp;A.hp=st.maxhp*Math.max(f,0.5);A.dmg=st.dmg;A.baseDmg=st.dmg;pop(A.x,A.y-A.r-18,'子分 Lv'+r.lv+'！','#5f7d3a',true);}
  const after=skillTier(r);
  if(after>before){const sk=ALLY_SKILLS[skillOf(r.type)];sfx('combo');
    if(after===1){banner(r.name+'が わざを おぼえた','「'+sk.name+'」 '+sk.desc);diary(r.name+'が「'+sk.name+'」を おぼえた。');DEX.allySkill=true;}
    else{banner(r.name+'の わざが 真に なった','「真・'+sk.name+'」 もっと 強く、もっと 何度も');diary(r.name+'の わざが「真・'+sk.name+'」に なった。');DEX.allyMaster=true;}
    saveDex();}
}
function allyStats(r){const T=TYPES[r.type],lv=Math.max(r.lv,P.lv-6),iv=r.iv||{hp:1,dmg:1},kz=(r.kz||0)>=2?1.1:1;return {lv,maxhp:T.hp*(1+0.12*(lv-1))*(1+0.35*cyEff())*0.9*iv.hp*kz*(r.trait==='tafu'?1.3:1),dmg:Math.max(4,T.dmg)*(1+0.13*(lv-1))*(1+0.25*cyEff())*0.75*iv.dmg*kz};}
function spawnAlly(){
  ALLY=null;ALLY2=null;const r=S.roster[S.allyI],r2=S.roster[S.allyJ],ok=x=>x&&!x.faint;
  if(ok(r)){ALLY=mkAllyObj(r,1);spawnAlly2();}
  else if(ok(r2)&&duoUnlocked()&&S.allyJ!==S.allyI){ALLY=mkAllyObj(r2,1);}
}

function mkAllyObj(r,side){const T=TYPES[r.type],st=allyStats(r);r.lv0=r.lv0??r.lv;r.xp=r.xp||0;if(r.lv<P.lv-6)r.lv=P.lv-6;const o={ally:true,skillCd:3,pow:1,type:r.type,T,x:P.x-34*side,y:P.y+30,ang:-Math.PI/2,vx:0,vy:0,lv:st.lv,maxhp:st.maxhp,hp:r.hpFrac!=null?st.maxhp*r.hpFrac:st.maxhp,dmg:st.dmg,baseDmg:st.dmg,r:T.r,walk:0,flap:0,hurtT:0,cd:0,inv:0,z:0,state:'follow',t:0,slashT:0,poisonT:0,ext:0,hop:0,rec:r};o.side=side;return o;}
/* the second follower (unlocked after the first boss) */
function duoUnlocked(){return S.cycle>0||S.cleared.includes(0)||!!DEX.duo;}
function spawnAlly2(){ALLY2=null;if(!duoUnlocked())return;const r=S.roster[S.allyJ];if(!r||r.faint||S.allyJ===S.allyI)return;ALLY2=mkAllyObj(r,-1);ALLY2.y=P.y+30;}
function allies(){const L=[];if(ALLY&&!ALLY.dead)L.push(ALLY);if(ALLY2&&!ALLY2.dead)L.push(ALLY2);return L;}
function duo(){return !!(ALLY&&!ALLY.dead&&ALLY2&&!ALLY2.dead);}
const ROSTER_MAX=24;
function recruit(e,keeper,pre){
  if(S.roster.length>=ROSTER_MAX){banner('すみかが いっぱい','すみかの「なかま」で だれかと わかれると あきが できる');return false;}
  const r=pre||rollAlly({type:e.type,lv:e.lv,lv0:e.lv,xp:0,name:e.T.name,faint:false,keeper:!!keeper},{keeper,elite:e.elite});S.roster.push(r);DEX.allyEver=true;saveDex();
  sfx('ally');diary(e.T.name+'が 子分に なった。');
  if(S.allyI<0||!ALLY){S.allyI=S.roster.length-1;spawnAlly();if(ALLY){ALLY.x=e.x;ALLY.y=e.y;}pop(e.x,e.y-e.r-24,'兄貴、ついていきます！','#5f7d3a',true);}
  else pop(e.x,e.y-e.r-24,'すみかで 待ってます！','#5f7d3a',true);
  banner('子分が ふえた！',e.T.name+(ALLY&&ALLY.rec===r?' が ついてくる':' は すみかで 待っている（'+S.roster.length+'/'+ROSTER_MAX+'）'));
  return true;
}
function setActiveAlly(idx){if(idx===S.allyJ)S.allyJ=S.allyI;S.allyI=idx;if(S.state!=='title')spawnAlly();}
function releaseAlly(idx){const r=S.roster[idx];if(!r)return;S.roster.splice(idx,1);if(S.allyI===idx){S.allyI=-1;ALLY=null;}else if(S.allyI>idx)S.allyI--;if(S.allyJ===idx){S.allyJ=-1;ALLY2=null;}else if(S.allyJ>idx)S.allyJ--;diary(r.name+'と わかれた。');}

/* ---------------- combat ---------------- */
function lvGap(a,b){return clamp(1+0.06*(a-b),0.65,1.45);}
function damageEnemy(e,dmg,fx_,fy_,kb,poison,opts){
  opts=opts||{};
  if(e.dead||e.state==='seat'||e.T.ai==='sumo'||e.state==='under')return 0;
  if(e.friendly&&opts.player)return 0;
  if(opts.player&&e.feud&&!e.feud.off)feudJoin(e);
  if(e.state==='den'&&!opts.force)return 0;
  if(e.state==='guardup'){const fa=Math.atan2(fy_-e.y,fx_-e.x);if(Math.abs(angDiff(e.ang,fa))<1.4){dmg*=0.12;pop(e.x,e.y-e.r-18,'はじいた！',INK,true);sfx('clink');e.state='sweep_wind';e.t=0.28;}}
  if(e.T.ai==='roller'&&e.rolled)dmg*=0.35;
  if(e.T.guard&&(e.state==='chase'||e.state==='windup')){const fa=Math.atan2(fy_-e.y,fx_-e.x);if(Math.abs(angDiff(e.ang,fa))<0.9){dmg*=0.4;pop(e.x,e.y-e.r-18,'ガード',INK);sfx('clink');}}
  if(e.brokenT>0)dmg*=1.5;
  dmg=squadGuard(e,dmg,fx_,fy_,opts);
  if(opts.player){dmg*=chainMul();if(e.affix==='kata')dmg*=0.8;}
  let crit=false;if(opts.player&&Math.random()<ST.crit){dmg*=2;crit=true;S.stats.crits++;tot('crits',1);vib(12);}
  dmg=Math.max(1,dmg);e.hp-=dmg;e.hurtT=0.22;
  if(opts.player){chainHit();if(e.affix==='toge'&&!P.rolled&&P.inv<=0&&P.dashT<=0){P.hp=Math.max(1,P.hp-dmg*0.1);P.hurtT=0.2;if(Math.random()<0.3)pop(P.x,P.y-26,'とげ！','#c8452d');}}
  if(opts.player&&dmg>S.stats.maxHit)S.stats.maxHit=Math.round(dmg);if(opts.player)totMax('maxHit',dmg);
  const a=Math.atan2(e.y-fy_,e.x-fx_),k=(kb||220)*(e.T.boss?0.25:e.T.keeper?0.4:e.T.tank?0.55:1);e.vx+=Math.cos(a)*k;e.vy+=Math.sin(a)*k;
  if(poison){e.poisonT=3.5;e.poisonD=Math.max(e.poisonD,poison);}
  pop(e.x+rnd(-6,6),e.y-e.r-8,(crit?'会心 ':'')+Math.round(dmg),crit?'#c8452d':INK,crit);
  sfx(crit?'crit':'hit');S.shake=Math.max(S.shake,crit?7:e.T.boss?4:2.5);S.hitstop=Math.max(S.hitstop,crit?0.09:0.035);
  for(let i=0;i<(crit?10:5);i++)fx.push({x:e.x,y:e.y,vx:rnd(-140,140),vy:rnd(-140,140),t:0,life:0.35,c:poison?'#c49be0':crit?'#f2b632':'#fff3c4'});
  if(e.T.stinky&&e.stinkCd<=0){e.stinkCd=3;clouds.push({x:e.x,y:e.y,r:100,t:0,life:2.2,kind:'hostgas'});sfx('stink');}
  if(e.state==='wander'||e.state==='flee'&&e.T.ai!=='passive')e.state=e.T.ai==='passive'?'flee':'chase';
  if(e.T.ai==='burrow'&&e.state==='up'){e.state='dive';e.t=0.5;}
  if((e.T.boss||e.T.keeper||e.T.nushi)&&!e.T.dummy&&e.phase===1&&e.hp<e.maxhp*0.5&&e.hp>0){e.phase=2;e.speed*=1.22;sfx('phase');sfx('cutin');S.cutin={e,t:0,text:RAGE[e.type]||'まだまだぁ！'};vib(70);e.cd=0.3;S.shake=10;
    for(let i=0;i<20;i++){const an=i/20*TAU;fx.push({x:e.x,y:e.y,vx:Math.cos(an)*260,vy:Math.sin(an)*260,t:0,life:0.5,c:'#c8452d'});}}
  if(opts.player&&ALLY&&!ALLY.dead)addBond(1.5);
  if(opts.player&&ST.vamp)healPlayer(dmg*ST.vamp);
  if(opts.player&&ST.heal)healPlayer(dmg*ST.heal);
  if(e.T.dummy){e.hp=e.maxhp;S.dpsLog=S.dpsLog||[];S.dpsLog.push([S.t,dmg]);return dmg;}
  if(e.hp<=0)killEnemy(e);
  return dmg;
}
function healPlayer(n){if(n<=0)return;P.hp=Math.min(ST.maxhp,P.hp+n);P.healT=0.25;}
function killEnemy(e){
  if(e.dead)return;e.dead=true;sfx('down');
  corpses.push({e,t:0});
  DEX.bugs[e.type]=(DEX.bugs[e.type]||0)+1;saveDex();S.stats.kills++;if(e.elite){S.stats.elites++;tot('elites',1);}
  for(let i=0;i<12;i++)fx.push({x:e.x,y:e.y,vx:rnd(-170,170),vy:rnd(-170,170),t:0,life:0.5,c:e.T.col});
  if(ST.combos.includes('yosomono')&&e.poisonT>0){comboFx('yosomono',e.x,e.y);fx.push({ring:true,x:e.x,y:e.y,r:90,t:0,life:0.3});sfx('thud');for(let i=0;i<10;i++)fx.push({x:e.x,y:e.y,vx:rnd(-200,200),vy:rnd(-200,200),t:0,life:0.4,c:pick(['#e8603a','#f2b632'])});for(const o of E){if(o!==e&&!o.dead&&Math.hypot(o.x-e.x,o.y-e.y)<90+o.r){damageEnemy(o,e.maxhp*0.25+ST.dmg,e.x,e.y,260,ST.poison,{player:true,force:true});}}}
  if(ST.combos.includes('moudoku')&&e.poisonT>0){for(const o of E){if(o!==e&&!o.dead&&Math.hypot(o.x-e.x,o.y-e.y)<100){o.poisonT=3.5;o.poisonD=Math.max(o.poisonD,ST.poison+4);}}comboFx('moudoku',e.x,e.y);clouds.push({x:e.x,y:e.y,r:100,t:0,life:0.8,kind:'poisonfx'});}
  let xp=e.T.xp*(1+0.5*(e.lv-1))*(1+0.2*S.cycle)*(e.elite?2.5:1);if(e.lv<P.lv-4)xp*=0.5;
  if(isRain())xp*=1.2;xp*=themeXpMul()*trophyXpMul();if(e.feudKill)xp*=0.3;if(isNight())tot('nightKills',1);
  if(xp>0)addXP(xp,e.x,e.y-e.r);
  if(ALLY2&&!ALLY2.dead){const kui=ALLY2.rec.trait==='kuishinbo';ALLY2.hp=Math.min(ALLY2.maxhp,ALLY2.hp+ALLY2.maxhp*(kui?0.12:0.05));if(kui)healPlayer(ST.maxhp*0.02);if(xp>0)allyGainXP(ALLY2.rec,xp*0.6);}
  if(ALLY&&!ALLY.dead){const kui=ALLY.rec.trait==='kuishinbo';ALLY.hp=Math.min(ALLY.maxhp,ALLY.hp+ALLY.maxhp*(kui?0.12:0.05));if(kui)healPlayer(ST.maxhp*0.025);if(xp>0)allyGainXP(ALLY.rec,xp*0.7);addBond(e.T.boss||e.T.keeper||e.T.nushi?30:5);}
  if((['mitsubachi','kumabachi','hanamuguri'].includes(e.type)&&Math.random()<0.04)||e.type==='joou'||e.T.nushi)later(()=>gainDango(1,e.x,e.y),300);
  /* drops */
  const d=e.T.drop,bonus=(isNight()?0.25:0)+(S.challenge&&(e.T.boss||e.T.keeper)?1.2:0)+(e.T.boss?1:e.T.nushi?1.3:e.T.keeper?0.6:0)+(e.elite?0.8:0)+S.cycle*0.15+(ALLY&&!ALLY.dead&&ALLY.rec.trait==='kyouun'?0.25:0)+themeDropBonus();
  if(d){const ch=e.T.boss||e.T.nushi?1:e.T.keeper?0.7:Math.min(1,d[2]*0.8*(e.elite?3:1)*(ALLY&&!ALLY.dead&&ALLY.rec.trait==='kyouun'?1.3:1));if(Math.random()<ch){const p=mkPart(d[0],d[1],bonus);dropItem(e.x+rnd(-16,16),e.y+rnd(-16,16),p);announceDrop(p,false);}}
  const rd=RARE_DROPS[e.type];
  if(rd&&Math.random()<rd[2]*(e.elite?3:1)*(isRain()?1.6:1)){const p=mkPart(rd[0],rd[1],bonus+0.5);dropItem(e.x+rnd(-20,20),e.y+rnd(-20,20),p);announceDrop(p,true);}
  if(!e.T.boss&&!e.T.keeper&&Math.random()<0.16)foods.push({x:e.x,y:e.y,a:e.ang,kind:'meat',bob:0});
  if(e.T.boss||e.T.keeper||e.T.nushi){S.hitstop=0.12;S.shake=14;if(S.bossBar===e)S.bossBar=null;S.slowmo=e.T.boss?1.5:0.8;S.slowMax=S.slowmo;S.slowFocus={x:e.x,y:e.y};S.flash=0.35;sfx('finish');vib(120);}
  if(e.type===S.swarm)S.swarmKills=(S.swarmKills||0)+1;
  qProgress('kill',1,e.type);if(e.elite)qProgress('elite',1);
  if(e.squad)squadKilled(e);
  if(!e.split)affixOnDeath(e);
  if(e.T.tboss){tbKilled(e);return;}
  if(e.T.nushi){DEX.nushi=DEX.nushi||{};DEX.nushi[e.type]=(DEX.nushi[e.type]||0)+1;saveDex();music.play(AREA().bgm);sfx('fanfare');banner('ぬしを たおした！',e.T.name);diary(e.T.name+'を たおした。めったに 会えない ぬしだった。');return;}
  if(e.T.keeper){
    S.keepersDown++;if(e.arena)e.arena.beaten=true;music.play(AREA().bgm);S.stats.bosses++;
    if(e.lv>=P.lv-2&&Math.random()<0.5)foods.push({x:e.x+20,y:e.y,a:0,kind:'meat',bob:0});
    diary(e.T.name+'を たおした。');
    const opened=S.keepersDown>=2&&!MAP.lair.open;
    later(()=>{if(S.state!=='play')return;
      say([{who:e.T.name,text:e.T.down}],()=>{
        if(opened){openGate();}
        offerRecruit(e,true);
      });},500);
    return;
  }
  if(e.T.boss){
    S.bossDown=true;S.stats.bosses++;
    if(S.challenge){challengeWin(e);return;}
    if(e.T.final){claimFinalPrize();S.state='finale';music.play(null);diary('カブトの若頭に 勝った。');later(()=>startEnding(),1600);return;}
    music.play('victory');
    diary(e.T.name.replace(/^.*?番長 ?/,'')+'に かった。'+AREA().name+'の 番長だ。');
    later(()=>{if(S.state==='play')say(AREA().bossDown,()=>openExit());},700);
    return;
  }
  /* recruit chance */
  if(e.T.dmg>0&&e.T.ai!=='passive'&&e.lv<=P.lv+1&&Math.random()<Math.min(0.6,(e.elite?0.2:0.03)*dangoRecruitMul()*themeRecruitMul()))later(()=>{if(S.state==='play')offerRecruit(e,false);},350);
}
/* lucky drops: a mob sometimes drops a part from further up the forest */
const RARE_DROPS={ari:['head','oago',0.012],hasami:['legs','mukade',0.01],kamadouma:['legs','batta',0.03],waraji:['back','kara',0.035],
  batta:['back','hane',0.02],tento:['back','kanabun',0.015],kumo:['tail','hari',0.02],kamakiriko:['legs','kama',0.04],
  amenbo:['back','ageha',0.012],mizukamakiri:['head','okama',0.02],ebigani:['head','zari',0.025],
  mitsubachi:['tail','mitsu',0.01],hanamuguri:['back','kanabun',0.02],abu:['back','hane',0.03],
  kokuwa:['head','kuwa',0.008],gomimushi:['back','kusai',0.03],mukade:['head','kiba',0.03],
  kuroari:['head','oago',0.03],semi:['back','ageha',0.012],hachi:['tail','ohari',0.015],kamikiri:['head','hirata',0.012],
  kanabun:['head','tsuno',0.006],ga:['back','murasaki',0.02]};
function announceDrop(p,lucky){
  if(p.rar&&isRain()){DEX.yudachi=true;}
  if(p.rar===2){DEX.legend=true;saveDex();}
  if(lucky||p.rar){sfx('rare');banner(lucky?'レアドロップ！':p.rar===2?'伝説の部位！':'めずらしい部位！',partName(p));if(p.rar===2)S.shake=6;}
  if(lucky&&!(DEX.rare||{})[p.id]){DEX.rare=DEX.rare||{};DEX.rare[p.id]=true;saveDex();}
}
function offerRecruit(e,keeper){
  if(keeper&&S.roster.some(r=>r.type===e.type))return;
  if(keeper){S.keeperWins=S.keeperWins||{};const w=S.keeperWins[e.type]=(S.keeperWins[e.type]||0)+1;
    const ch=Math.min(0.95,0.3+0.2*(w-1)+(dangoActive()?0.35:0));if(Math.random()>=ch){if(w===1)pop(e.x,e.y-e.r-20,'（子分には ならなかった… また 挑めば 気が かわるかも）',INK,true);return;}}
  const u=UIH();
  const pre=rollAlly({type:e.type,lv:e.lv,lv0:e.lv,xp:0,name:e.T.name,faint:false,keeper:!!keeper},{keeper,elite:e.elite,dango:dangoActive()});
  if(!u||!HAS_DOM){if(keeper||S.roster.length<2)recruit(e,keeper,pre);return;}
  S.talk=true;
  u.ask(e.T.name,(keeper?'……兄貴と 呼ばせてくだせえ。おれを 子分に してくれねえか？':'（'+e.T.name+'が なかまに なりたそうに こちらを 見ている）')+'　【'+allyTraitText(pre)+'】',
    S.roster.length>=ROSTER_MAX?['いっぱい…（ことわる）']:['子分にする','ことわる'],k=>{S.talk=false;if(k===0&&S.roster.length<ROSTER_MAX)recruit(e,keeper,pre);else if(k===0)banner('すみかが いっぱい','すみかの「なかま」で だれかと わかれると あきが できる');else pop(e.x,e.y-e.r-20,keeper?'そうか……達者でな':'しょんぼり',INK);});
}
function openGate(){
  MAP.lair.open=true;MAP.lair.openT=0;sfx('gate');S.shake=8;
  banner('しめ縄が ほどけた！','番長の シマへ 入れる');diary('門番を 2匹 たおして、番長の シマが ひらいた。');
}
function dropItem(x,y,p){
  const it={x,y,p,bob:rnd(0,TAU),cool:0.8};
  for(let k=0;k<10;k++)collide(it,22,{});
  items.push(it);
}
function openExit(){
  const L=MAP.lair;S.exit={x:L.x,y:L.y-L.R*0.5,t:0};sfx('gate');
  if(!S.cleared.includes(S.areaI)){S.cleared.push(S.areaI);if(S.areaI+1<AREAS.length)S.unlocked=Math.max(S.unlocked,S.areaI+1);}
  writeSave();
  say([{who:'ダンゴムシ',text:items.length?'（番長が 落とした部位を ひろってから、光る 葉っぱの 道で 先へ 行こう）':'（光る 葉っぱの 道で、先へ 行こう）'}]);
}
function playerDef(from){
  let def=ST.def;
  if(from&&ST.guard&&!P.rolled){const a=Math.atan2(from.y-P.y,from.x-P.x);if(Math.abs(angDiff(P.ang,a))<1.0){def*=1-ST.guard;pop(P.x,P.y-24,'ハサミで うけた',INK);sfx('clink');}}
  return def;
}
function hurtPlayer(dmg,from,opts){
  opts=opts||{};
  if(P.inv>0||S.state!=='play'||S.sumo)return false;
  if(P.rolled&&!opts.unblockable){
    if(justGuard(from,dmg))return false;
    if(from&&from.T&&(from.T.boss||from.T.keeper||from.T.nushi)&&from.lastMove&&from.lastMove!=='bite'&&from.phase===2)tot('blocks',1);
    sfx('clink');pop(P.x,P.y-18,'カキン',INK);
    if(ST.combos.includes('koukaku')&&from&&from.T){damageEnemy(from,dmg*0.8+ST.dmg*0.5,P.x,P.y,300,0,{force:true});pop(P.x,P.y-36,'はじき返し！','#c8452d',true);comboFx('koukaku',P.x,P.y-20);}
    if(from&&from.T&&!from.T.boss&&!from.T.keeper){from.vx-=Math.cos(from.ang)*180;from.vy-=Math.sin(from.ang)*180;from.state='recover';from.t=0.6;}
    return false;
  }
  if(P.dashT>0&&(ST.dashInv||ST.combos.includes('kokuyou')))return false;
  if(from&&from.affix==='doku'){P.poisonT=3;P.poisonD=Math.max(P.poisonD||0,3+areaLv()*0.4);}
  if(from&&from.T&&ST.counter){const back=Math.abs(angDiff(P.ang,Math.atan2(from.y-P.y,from.x-P.x)))>2.0;if(back){damageEnemy(from,ST.counter,P.x,P.y,280,PARTS.tail[P.eq.tail.id].poison?ST.poison:0,{force:true});pop(P.x,P.y-30,P.eq.tail.id==='hasami'?'はさみ返し！':'刺し返し！','#c8452d',true);dmg*=0.5;}}
  if(ST.stink&&P.stinkCd<=0){P.stinkCd=4;emitStink(120,2.2);}
  dmg*=playerDef(from);
  if(from&&from.T&&ST.thorns)damageEnemy(from,dmg*ST.thorns+2,P.x,P.y,120,0,{force:true});
  if(from&&from.T&&ST.reflect)damageEnemy(from,dmg*ST.reflect/Math.max(0.3,ST.def)+3,P.x,P.y,160,0,{force:true});
  vib(dmg>ST.maxhp*0.2?60:25);
  if(S.dojo)dmg=Math.min(dmg,Math.max(0,P.hp-1));
  P.hp-=dmg;P.inv=0.55;P.hurtT=0.3;S.shake=Math.max(S.shake,5);S.hitstop=Math.max(S.hitstop,0.05);sfx('ouch');
  pop(P.x,P.y-16,String(Math.round(dmg)),'#c8452d',dmg>ST.maxhp*0.2);
  if(from&&from.x!=null){const a=Math.atan2(P.y-from.y,P.x-from.x),k=from.T&&from.T.toss?640:opts.kb||240;P.vx+=Math.cos(a)*k;P.vy+=Math.sin(a)*k;if(from.T&&from.T.toss){P.stunT=0.32;pop(P.x,P.y-34,'なげとばされた！','#c8452d',true);}}
  if(opts.slow)P.slowT=Math.max(P.slowT,opts.slow);
  if(opts.poison){P.poisonT=3;P.poisonD=opts.poison;}
  if(P.hp<=0){
    if(ST.guts&&!P.gutsUsed){P.gutsUsed=true;P.hp=1;P.inv=1.5;pop(P.x,P.y-44,'根性！','#c8452d',true);sfx('phase');}
    else playerDown(from);
  }
  return true;
}
function emitStink(r,t){clouds.push({x:P.x,y:P.y,r,t:0,life:t,kind:'stink'});sfx('stink');for(const e of E){if(!e.dead&&!e.T.boss&&!e.T.keeper&&e.T.ai!=='sumo'&&Math.hypot(e.x-P.x,e.y-P.y)<r+e.r){e.state='flee';e.fleeT=2.4;}}}
function hurtAlly(a,dmg,from){
  if(!a||a.dead||a.inv>0||a.leapT>0)return false;
  if(a.rec&&a.rec.trait==='ganko')dmg*=0.75;
  if(order()==='def')dmg*=0.8;
  if(a.guardT>0)dmg*=0.5;
  a.hp-=dmg;a.inv=0.4;a.hurtT=0.3;pop(a.x,a.y-a.r,String(Math.round(dmg)),'#5f7d3a');
  if(from&&from.x!=null){const an=Math.atan2(a.y-from.y,a.x-from.x);a.vx+=Math.cos(an)*240;a.vy+=Math.sin(an)*240;}
  if(a.hp<=0){a.dead=true;allyFaint(a.rec);corpses.push({e:a,t:0,ally:true});pop(a.x,a.y-a.r-12,'兄貴…すまねえ…',INK,true);sfx('down');diary(a.T.name+'が たおれて、すみかへ もどった。');banner(a.rec.name+'が たおれた','すみかで 休養する。元気に なったら もどってくる');a.rec.autoBack=true;partyDrop(a.rec);}
  return true;
}
function enemyDmg(e,mul){const bd=(e.T.boss||e.T.keeper||e.T.nushi)&&S.bossDeaths?Math.min(5,S.bossDeaths[e.type]||0):0;return e.dmg*(mul||1)*clamp(1+0.08*(e.lv-P.lv),0.6,2.0)*(1-0.07*bd);}
function pickTarget(e){
  if(e.tgT>0&&e.tg&&(e.tg===P||(e.tg.ally&&!e.tg.dead&&(e.tg===ALLY||e.tg===ALLY2))))return e.tg;
  let best=P,bd=Math.hypot(P.x-e.x,P.y-e.y);
  const af=(duo()?0.65:0.85)*(order()==='def'?1.25:order()==='reg'?0.6:1);for(const A of allies()){const d=Math.hypot(A.x-e.x,A.y-e.y);if(d<bd*af||(A.taunt>0&&d<bd*1.4)){best=A;bd=d;}}
  e.tg=best;e.tgT=1.4;return best;
}
function rOf(tg){return tg===P?ST.r:tg.r;}
function hitTarget(tg,e,mul,opts){if(tg===P)return hurtPlayer(enemyDmg(e,mul),e,opts);return hurtAlly(tg,enemyDmg(e,mul)*0.75,e);}
/* area attacks hit everyone in reach: player AND follower */
function aoe(x,y,rad,e,mul,opts){
  let hit=false;
  if(Math.hypot(P.x-x,P.y-y)<rad+ST.r)hit=hurtPlayer(enemyDmg(e,mul),e,opts)||hit;
  for(const A of allies())if(Math.hypot(A.x-x,A.y-y)<rad+A.r)hit=hurtAlly(A,enemyDmg(e,mul)*0.8,e)||hit;
  return hit;
}
function arcAoe(e,range,arc,mul){
  const tgs=[[P,ST.r]];for(const A of allies())tgs.push([A,A.r]);
  for(const [tg,r] of tgs){const dx=tg.x-e.x,dy=tg.y-e.y,d=Math.hypot(dx,dy);if(d<e.r+r+range&&Math.abs(angDiff(e.ang,Math.atan2(dy,dx)))<arc)hitTarget(tg,e,mul);}
}
function playerDown(from){
  S.state='down';sfx('down');S.stats.deaths++;
  if(from&&from.T&&(from.T.boss||from.T.keeper||from.T.nushi)){S.bossDeaths=S.bossDeaths||{};S.bossDeaths[from.type]=(S.bossDeaths[from.type]||0)+1;}
  const lost=Math.round(P.xp*0.3);P.xp-=lost;
  if(ALLY&&!ALLY.dead){allyFaint(ALLY.rec,60);ALLY=null;}
  if(ALLY2&&!ALLY2.dead){allyFaint(ALLY2.rec,60);ALLY2=null;}
  const msg=(from&&from.T?from.T.name:'あぶない めに あって')+(from&&from.T?'に まけた。':'たおれた。')+(lost?'けいけんちを '+lost+' なくした。':'')+'すみかで 目を さました。';
  music.play(null);
  const u=UIH();if(u&&HAS_DOM)u.down(msg);else respawn();
}
function respawn(){
  P.x=MAP.sumika.x-60;P.y=MAP.sumika.y+40;P.vx=P.vy=0;refreshStats();P.hp=ST.maxhp;P.inv=1.5;P.rolled=false;P.dashT=0;P.slowT=0;P.stunT=0;P.poisonT=0;S.state='play';S.sumo=null;S.sumikaLock=true;
  for(const e of E){if((e.T.boss||e.T.keeper)&&e.state!=='seat'){const bd=(S.bossDeaths||{})[e.type]||0;e.hp=Math.min(e.maxhp,e.hp+e.maxhp*(bd>=3?0.1:0.35));e.state='den';e.x=e.home.x;e.y=e.home.y;e.vx=e.vy=0;e.z=0;e.met=false;}}
  S.bossBar=null;music.play(AREA().bgm);
  const many=Object.values(S.bossDeaths||{}).some(n=>n===2);if(many)later(()=>{if(S.state==='play')say([{who:'ダンゴムシ',text:'（あいつの わざを よく 見よう。赤い 予告が 出たら まるまって ふせげる。部位や レベルを 上げてから 挑むのも 手だ）'}]);},600);
}

/* ---------------- player ---------------- */
function slashArc(range,arc,dmg){
  fx.push({arc:true,x:P.x,y:P.y,a:P.ang,r:ST.r+range,w:arc,t:0,life:0.25});sfx('slash');
  for(const e of E){if(e.dead||e.z>18)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<ST.r+e.r+range&&Math.abs(angDiff(P.ang,Math.atan2(dy,dx)))<arc)damageEnemy(e,dmg*lvGap(P.lv,e.lv),P.x,P.y,300,ST.poison,{player:true});}
}
function aimTarget(){
  let best=null,bs=1e9;for(const e of E){if(e.dead||e.z>18||e.state==='under'||e.state==='seat'||e.T.ai==='sumo'||e.T.ai==='passive'&&e.state!=='flee')continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy),reach=ST.r+e.r+ST.range+40;if(d>reach)continue;const da=Math.abs(angDiff(P.ang,Math.atan2(dy,dx)));if(da>1.25)continue;const sc=d+da*60;if(sc<bs){bs=sc;best=e;}}
  return best;
}
function bite(){
  const at=aimTarget();if(at)P.ang=Math.atan2(at.y-P.y,at.x-P.x);
  P.biteCd=ST.cd;P.biteT=0.18;sfx('bite');let hit=false;
  if(HAS_DOM&&ST.combos.some(id=>COMBO_HOW[id].btn==='bite')){const u=UIH();if(u)u.tagHit('bite');}
  const range=ST.range,arc=ST.arc;
  if(['okama','mizukama','zari','tsuno','kuwa'].includes(P.eq.head.id))fx.push({arc:true,x:P.x,y:P.y,a:P.ang,r:ST.r+range,w:arc*0.8,t:0,life:0.2});
  for(const e of E){if(e.dead||e.z>18||e.state==='under')continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);
    if(d<ST.r+e.r+range+6&&Math.abs(angDiff(P.ang,Math.atan2(dy,dx)))<arc){
      const dealt=damageEnemy(e,ST.dmg*rnd(0.92,1.08)*lvGap(P.lv,e.lv),P.x,P.y,240*ST.kb,ST.poison,{player:true});
      if(dealt&&ST.grab&&!e.T.boss&&!e.T.keeper&&!e.dead){e.vx=-dx/d*420;e.vy=-dy/d*420;sfx('pull');}
      hit=true;}}
  /* cut webs */
  for(const w of MAP.webs){if(!w.cut&&!w.regrow&&Math.hypot(w.x-P.x,w.y-P.y)<w.r+ST.r+range){w.cut=0.01;pop(w.x,w.y,'ぷちっ',INK);sfx('web');}}
  if(!hit){P.vx+=Math.cos(P.ang)*90;P.vy+=Math.sin(P.ang)*90;}
}
function updatePlayer(){
  const st=ST;
  P.biteCd-=DT;P.biteT-=DT;P.inv-=DT;P.hurtT-=DT;P.slowT-=DT;P.stunT-=DT;P.healT-=DT;P.stinkCd-=DT;P.glideT-=DT;
  if(P.poisonT>0){P.poisonT-=DT;P.hp-=P.poisonD*DT;if(P.hp<=0){if(st.guts&&!P.gutsUsed){P.gutsUsed=true;P.hp=1;}else{playerDown(null);return;}}}
  if(st.regen)healPlayer(st.maxhp*st.regen*DT);
  const wasDash=P.dashT>0;P.dashT-=DT;
  if(wasDash&&P.dashT<=0){
    if(st.combos.includes('iai')){slashArc(64,Math.PI,st.dmg*1.4);comboFx('iai',P.x,P.y);}
    if(st.combos.includes('ootobi')){S.shake=7;sfx('thud');comboFx('ootobi',P.x,P.y);for(let i=0;i<14;i++){const a=i/14*TAU;fx.push({x:P.x,y:P.y,vx:Math.cos(a)*220,vy:Math.sin(a)*220,t:0,life:0.35,c:'#e9dcb0'});}
      for(const e of E){if(!e.dead&&e.z<18&&Math.hypot(e.x-P.x,e.y-P.y)<st.r+e.r+64)damageEnemy(e,st.dashDmg*0.8,P.x,P.y,400,0,{player:true});}}
    if(st.gas){clouds.push({x:P.x,y:P.y,r:90,t:0,life:3,kind:'gas'});sfx('gas');}
    P.z=0;
  }
  const mx=P.stunT>0?0:inp.x,my=P.stunT>0?0:inp.y,ml=Math.hypot(mx,my);
  if(inp.roll&&!P.rolled&&P.dashT<=0&&P.stunT<=0){P.rolled=true;P.rollAt=S.t;sfx('roll');if(st.combos.includes('akushu')){emitStink(140,2.6);comboFx('akushu',P.x,P.y);}}
  if(P.rolled&&!inp.roll){P.rolled=false;P.dashT=0.34;P.dashHit=new Set();const a=ml>0.2?Math.atan2(my,mx):P.ang;P.ang=a;P.vx=Math.cos(a)*st.dash*themeDashMul();P.vy=Math.sin(a)*st.dash*themeDashMul();sfx('dash');if(st.combos.includes('suimen'))comboFx('suimen',P.x,P.y);if(st.glide)P.glideT=0.5;}
  let sp=st.speed*(P.rolled?0.35:1)*(P.slowT>0?0.5:1);
  const web=MAP.webs.find(w=>!w.cut&&!w.regrow&&Math.hypot(w.x-P.x,w.y-P.y)<w.r);if(web&&P.dashT<=0){sp*=0.35;if(Math.random()<DT*2)pop(P.x,P.y-24,'ねばねば',INK);}
  if(P.dashT>0){P.ball+=0.5;if(st.combos.includes('ootobi'))P.z=Math.sin((1-P.dashT/0.34)*Math.PI)*26;
    if(st.combos.includes('suimen')&&Math.random()<0.6)waves.push({x:P.x,y:P.y,t:0,life:0.6});}
  else if(ml>0.12){const m=Math.min(1,ml),tvx=mx/ml*sp*m,tvy=my/ml*sp*m;P.vx+=(tvx-P.vx)*Math.min(1,DT*10);P.vy+=(tvy-P.vy)*Math.min(1,DT*10);
    P.ang+=angDiff(P.ang,Math.atan2(my,mx))*Math.min(1,DT*(P.rolled?4:12));P.walk+=DT*Math.hypot(P.vx,P.vy)*0.12;P.ball+=Math.hypot(P.vx,P.vy)*DT*0.06;}
  else{const f=Math.pow(P.stunT>0?0.05:0.0005,DT);P.vx*=f;P.vy*=f;}
  P.inLair=inLair(P.x,P.y);
  P.x+=P.vx*DT;P.y+=P.vy*DT;
  const onWaterOK=st.water||(P.glideT>0&&P.dashT>0);
  collide(P,st.r,{water:onWaterOK,glide:P.glideT>0&&P.dashT>0});
  P.inLair=undefined;
  /* walking off the water after a glide: if we stopped on water without water legs, wash to shore */
  if(!st.water&&P.dashT<=0&&MAP.river&&inWater(MAP,P.x,P.y)){collide(P,st.r,{});}
  if((inp.bite||inp.biteHold)&&P.biteCd<=0&&!P.rolled&&P.stunT<=0&&!S.sumo)bite();
  inp.bite=false;
  if(P.dashT>0&&!S.sumo){for(const e of E){if(e.dead||P.dashHit.has(e)||e.z>18||e.T.ai==='sumo'||e.state==='under')continue;if(Math.hypot(e.x-P.x,e.y-P.y)<st.r+e.r+4){P.dashHit.add(e);if(st.combos.includes('gouriki'))comboFx('gouriki',e.x,e.y);if(st.combos.includes('kokuyou')){e.brokenT=4;comboFx('kokuyou',e.x,e.y);}damageEnemy(e,st.dashDmg*lvGap(P.lv,e.lv),P.x,P.y,st.combos.includes('gouriki')?620:340,st.dashPoison,{player:true});}}}
  if(P.rolled&&st.combos.includes('teppeki')){for(const e of E){if(e.dead||e.T.ai==='sumo')continue;e.pinchCd-=DT;if(e.pinchCd<=0&&Math.hypot(e.x-P.x,e.y-P.y)<st.r+e.r+10){e.pinchCd=0.5;damageEnemy(e,st.counter*0.6+6+P.lv*1.5,P.x,P.y,160,0,{player:true,force:true});pop(P.x,P.y-24,'チョキン','#8a4a26');comboFx('teppeki',P.x,P.y);}}}
  if(st.combos.includes('mukadejigoku')&&!P.rolled&&Math.hypot(P.vx,P.vy)>40){P.trailT-=DT;if(P.trailT<=0){P.trailT=0.12;trails.push({x:P.x,y:P.y,t:0,life:2.5});}}
  /* food */
  for(const f of foods){if(f.gone)continue;if(Math.hypot(f.x-P.x,f.y-P.y)<st.r+12){f.gone=true;sfx('eat');qProgress('food',1);
    const g=st.glutton?1.5:1,base=f.kind==='meat'?0.12:f.kind==='sap'||f.kind==='nectar'?0.1:0.06;healPlayer(st.maxhp*base*g);addXP((2+areaLv()*0.8)*(f.kind==='meat'?2:1)*g,f.x,f.y);}}
  foods=foods.filter(f=>!f.gone);
  for(const s of MAP.saps){if(((P.x-s.x)/s.rx)**2+((P.y-s.y)/s.ry)**2<1){healPlayer(st.maxhp*0.08*DT);P.healT=0.2;}}
  /* items */
  if(S.itemHold&&Math.hypot(S.itemHold.x-P.x,S.itemHold.y-P.y)>st.r+40)S.itemHold=null;
  for(const it of items){it.cool-=DT;if(it.cool<=0&&!it.gone&&it!==S.itemHold&&Math.hypot(it.x-P.x,it.y-P.y)<st.r+16){openItem(it);break;}}
  /* home */
  const sm=MAP.sumika,ds=Math.hypot(sm.x-P.x,sm.y-P.y);
  if(ds>sm.r+70)S.sumikaLock=false;
  if(ds<sm.r+10&&!S.sumikaLock&&P.dashT<=0&&!S.bossBar){S.sumikaLock=true;if(S.dojo)exitDojo();else enterSumika();}
}
function openItem(it){
  S.itemHold=it;const u=UIH();
  if(!DEX.parts[it.p.id]){DEX.parts[it.p.id]=true;saveDex();diary(PARTS[it.p.s][it.p.id].name+'を 手に入れた。');}
  S.stats.parts++;
  if(it.p.rar)sfx('rare');else sfx('part');
  if(u&&HAS_DOM){S.state='card';u.partCard(it);}
  else{/* headless: equip if better, else store */
    const cur=P.eq[it.p.s];
    if(cur.id===it.p.id){it.gone=true;items=items.filter(x=>!x.gone);if(partScore(it.p)>partScore(cur)){P.eq[cur.s]=it.p;mergeParts(it.p,cur);}else mergeParts(cur,it.p);}
    else if(isDefault(cur.s,cur.id)||PARTS[it.p.s][it.p.id].dmg>(PARTS[cur.s][cur.id].dmg||0)||partValue(it.p)>partValue(cur)){it.gone=true;items=items.filter(x=>!x.gone);equipPart(it.p);}
    else{it.gone=true;items=items.filter(x=>!x.gone);if(S.store.length<STORE_MAX)storePart(it.p,true);else addXP(partXP(it.p));}
  }
}
function partValue(p){const D=PARTS[p.s][p.id];return (D.dmg||0)*2+(D.speed||0)*0.1+(D.dash||0)*0.02+(D.def?(1-D.def)*80:0)+(D.counter||0)+(D.poison||0)*3+(D.heal||0)*200+(D.regen||0)*30+partScore(p)*0.3;}
/* card choices: 'equip' | 'store' | 'eat' | 'merge' (keep current as base) | 'swapmerge' (picked becomes base) | 'leave' */
function resolveItem(it,choice){
  S.state='play';
  if(choice==='leave'){S.itemHold=it;return;}
  it.gone=true;items=items.filter(x=>!x.gone);S.itemHold=null;
  if(choice==='equip'){equipPart(it.p);pop(P.x,P.y-30,partName(it.p)+'！','#c8452d',true);sfx('lvup');}
  else if(choice==='store'){if(!storePart(it.p))S.itemHold=items[items.length-1]||null;}
  else if(choice==='merge'){mergeParts(P.eq[it.p.s],it.p);}
  else if(choice==='swapmerge'){swapMerge(it.p);}
  else{const n=partXP(it.p);sfx('eat');addXP(n,P.x,P.y-20);}
}
function enterSumika(){
  refreshStats();P.hp=ST.maxhp;P.poisonT=0;sfx('heal');
  for(const A of allies()){A.hp=Math.min(A.maxhp,A.hp+A.maxhp*0.5);A.rec.hpFrac=A.hp/A.maxhp;}
  writeSave();
  const u=UIH();if(u&&HAS_DOM){S.state='sumika';music.play('sumika');u.sumika();}
}
function leaveSumika(){S.state='play';music.play(S.bossBar?S.bossBar.T.final?'final':S.bossBar.T.keeper?'keeper':'boss':AREA().bgm);spawnAllyIfChanged();}
function spawnAllyIfChanged(){const r=S.roster[S.allyI],r2=S.roster[S.allyJ];if(!r){ALLY=null;ALLY2=null;return;}if(!ALLY||ALLY.rec!==r||(ALLY2?ALLY2.rec:null)!==(r2&&!r2.faint&&duoUnlocked()?r2:null)){spawnAlly();if(ALLY){ALLY.x=P.x-30;ALLY.y=P.y+30;}if(ALLY2){ALLY2.x=P.x+30;ALLY2.y=P.y+30;}}}

/* ---------------- enemies ---------------- */
function meetBoss(e){
  if(e.met)return;e.met=true;
  let lines;
  if(e.T.final)lines=S.cycle>0&&AREA().bossMeetNG?AREA().bossMeetNG:AREA().bossMeet;
  else if(e.T.keeper)lines=[{who:e.T.name,text:e.T.meet}];
  else lines=AREA().bossMeet;
  S.bossBar=e;music.play(e.T.final?'final':e.T.keeper?'keeper':'boss');
  const u=UIH();if(u&&HAS_DOM&&!e.T.keeper)u.bossIntro(e);
  say(lines,()=>{e.state='chase';e.cd=0.8;sfx('roar');});
}
function steer(e,tvx,tvy){
  /* gentle obstacle avoidance: look ahead and slide around rocks */
  const sp=Math.hypot(tvx,tvy);if(sp<1)return [tvx,tvy];
  const ux=tvx/sp,uy=tvy/sp,ax=e.x+ux*(e.r+36),ay=e.y+uy*(e.r+36);
  for(const o of MAP.obst){if(o.k==='log')continue;const d=Math.hypot(ax-o.x,ay-o.y);if(d<o.r+e.r){const side=(ux*(o.y-e.y)-uy*(o.x-e.x))>0?-1:1;return [(-uy*side*0.9+ux*0.4)*sp,(ux*side*0.9+uy*0.4)*sp];}}
  return [tvx,tvy];
}
function updateEnemy(e){
  const T=e.T;e.t-=DT;e.cd-=DT;e.hurtT-=DT;e.flap+=DT*30;e.slashT-=DT;e.fleeT-=DT;e.stinkCd-=DT;e.tgT-=DT;
  if(e.poisonT>0){e.poisonT-=DT;e.hp-=e.poisonD*DT*(ST.combos.includes('yosomono')?3:ST.combos.includes('moudoku')?2:1);if(Math.random()<DT*3)fx.push({x:e.x,y:e.y,vx:rnd(-30,30),vy:-40,t:0,life:0.6,c:'#9a5fc2'});if(e.hp<=0){killEnemy(e);return;}}
  if(T.ai==='sumo'){updateSumoFoe(e);return;}
  if(T.ai==='dummy'||T.ai==='dummyMove'){if(T.ai==='dummyMove'){e.t2=(e.t2||0)+DT*0.7;const tx=e.home.x+Math.cos(e.t2)*150,ty=e.home.y+Math.sin(e.t2*1.3)*90;e.vx+=(tx-e.x)*DT*4-e.vx*DT*2;e.vy+=(ty-e.y)*DT*4-e.vy*DT*2;e.ang=Math.atan2(e.vy,e.vx);e.walk+=DT*6;}else{e.vx*=0.85;e.vy*=0.85;const hx=e.home.x-e.x,hy=e.home.y-e.y;e.vx+=hx*DT*8;e.vy+=hy*DT*8;}e.x+=e.vx*DT;e.y+=e.vy*DT;return;}
  const tgt=(e.state!=='wander'&&e.state!=='flee'&&e.state!=='den')?pickTarget(e):P;
  const dx=tgt.x-e.x,dy=tgt.y-e.y,d=Math.hypot(dx,dy)||1,tr=rOf(tgt);
  const pd=Math.hypot(P.x-e.x,P.y-e.y)||1;
  const scared=!T.boss&&!T.keeper&&!T.nushi&&T.ai!=='passive'&&T.ai!=='burrow'&&(e.lv<P.lv-4||(ST.scare&&e.lv<=P.lv));
  const fly=T.ai==='flyer'||T.fly;
  e.slowT=(e.slowT||0)-DT;e.brokenT=(e.brokenT||0)-DT;const spd=e.speed*(e.slowT>0?0.5:1);
  let tvx=0,tvy=0,face=null;
  if(e.arena&&e.state!=='den'){const ad=Math.hypot(e.x-e.arena.x,e.y-e.arena.y);if(Math.hypot(P.x-e.arena.x,P.y-e.arena.y)>e.arena.R+320){e.state='den';e.met=false;e.hp=Math.min(e.maxhp,e.hp+e.maxhp*0.5);if(S.bossBar===e){S.bossBar=null;music.play(AREA().bgm);}}
    if(ad>e.arena.R+30){e.vx-=(e.x-e.arena.x)/ad*600*DT;e.vy-=(e.y-e.arena.y)/ad*600*DT;}}
  switch(e.state){
    case 'den':{
      face=Math.atan2(P.y-e.y,P.x-e.x);
      const hx=e.home.x-e.x,hy=e.home.y-e.y,hd=Math.hypot(hx,hy);if(hd>8){tvx=hx/hd*spd*0.5;tvy=hy/hd*spd*0.5;}
      const trig=e.arena?Math.hypot(P.x-e.arena.x,P.y-e.arena.y)<e.arena.R:e.lair?(inLair(P.x,P.y)&&pd<MAP.lair.R*1.2):pd<340;
      if(trig&&T.dummy){e.state='chase';e.cd=1;}
      else if(trig&&!S.talk&&S.state==='play'&&P.hp>0)meetBoss(e);
    }break;
    case 'seat':face=Math.PI/2;if(inLair(P.x,P.y)&&!S.talk&&S.state==='play'){e.state='den';meetBoss(e);}break;
    case 'under':/* burrowing worm */
      e.burrow=Math.max(0,e.burrow-DT*3);if(e.t<=0){e.state='up';e.t=rnd(3,5);sfx('burrow');const a=rnd(0,TAU);e.x=clamp(e.home.x+Math.cos(a)*rnd(0,160),60,MAP.w-60);e.y=clamp(e.home.y+Math.sin(a)*rnd(0,160),60,MAP.h-60);}
      break;
    case 'up':e.burrow=Math.min(1,e.burrow+DT*2.5);if(e.t<=0){e.state='dive';e.t=0.5;}tvx=Math.cos(e.ang)*20;tvy=Math.sin(e.ang)*20;if(Math.random()<DT*0.5)e.ang+=rnd(-1,1);break;
    case 'dive':e.burrow=Math.max(0,e.burrow-DT*2.5);if(e.t<=0){e.state='under';e.t=rnd(2.5,5);}break;
    case 'wander':
      if(e.t<=0){e.t=rnd(1.2,3.2);
        if(T.ai==='water'&&MAP.river){const x=clamp(e.home.x+rnd(-260,260),60,MAP.w-60);e.tx=x;e.ty=MAP.river.yAt(x)+rnd(-40,40);}
        else{const a=rnd(0,TAU),r=rnd(30,160);e.tx=clamp(e.home.x+Math.cos(a)*r,40,MAP.w-40);e.ty=clamp(e.home.y+Math.sin(a)*r,40,MAP.h-40);}}
      {const ddx=e.tx-e.x,ddy=e.ty-e.y,dd=Math.hypot(ddx,ddy);if(dd>8){tvx=ddx/dd*spd*0.42;tvy=ddy/dd*spd*0.42;}}
      if(pd<T.aggro*(isRain()?(T.ai==='flyer'?0.35:0.7):1)&&P.inv<1&&!S.sumo&&!S.dojo&&!e.peace&&!e.friendly){
        if(T.ai==='passive'){if(pd<130){e.state='flee';e.fleeT=2;}}
        else if(scared){e.state='flee';e.fleeT=2;if(Math.random()<0.4)pop(e.x,e.y-e.r-8,pick(['ひえっ','あ、兄貴…','どうぞ どうぞ','かんべんして','おつかれさまです！']),INK);}
        else{e.state='chase';if(T.nushi&&!e.met){e.met=true;S.bossBar=e;music.play('nushi');sfx('roar');banner(T.tboss?TB_DEF[theme()].title:'ぬし だ！',T.name);vib(80);}
          if(e.elite&&!e.roared){e.roared=true;sfx('elite');pop(e.x,e.y-e.r-26,'あばれ '+T.name.split(' ')[0]+'だ！','#b8860b',true);}}
      }
      else if(T.ai!=='passive'&&!scared&&!e.peace&&!e.friendly&&allies().some(A=>Math.hypot(A.x-e.x,A.y-e.y)<T.aggro*0.7))e.state='chase';
      break;
    case 'flee':
      if(pd>T.aggro*1.5&&e.fleeT<=0){e.state='wander';e.home={x:e.x,y:e.y};}
      tvx=-(P.x-e.x)/pd*spd*1.05;tvy=-(P.y-e.y)/pd*spd*1.05;break;
    case 'chase':{
      if(T.nushi&&pd>T.aggro*2.6){e.state='wander';e.home={x:e.x,y:e.y};if(S.bossBar===e){S.bossBar=null;music.play(AREA().bgm);}e.met=false;break;}
      if(!T.boss&&!T.keeper&&!T.nushi&&pd>T.aggro*1.9&&(!ALLY||Math.hypot(ALLY.x-e.x,ALLY.y-e.y)>T.aggro*1.9)){e.state='wander';e.home={x:e.x,y:e.y};break;}
      if(scared){e.state='flee';e.fleeT=2;break;}
      face=Math.atan2(dy,dx);
      const reach=e.r+tr+(T.boss?24:12)+(T.ai==='slasher'?26:0);
      {const sv=squadSteer(e,d,reach);if(sv){tvx=sv[0];tvy=sv[1];break;}}
      const cdm=e.phase===2?0.7:1;
      const MS=MOVESETS[e.type];
      if(MS){
        const want=MS.dist||0;
        if(fly){const w2=want||140,s2=d>w2?1:-0.6;tvx=dx/d*spd*0.7*s2-dy/d*spd*0.4;tvy=dy/d*spd*0.7*s2+dx/d*spd*0.4;}
        else if(want&&d<want-40){tvx=-dx/d*spd;tvy=-dy/d*spd;}
        else if(d>(want||reach*0.85)){tvx=dx/d*spd;tvy=dy/d*spd;}
        else{tvx=-dy/d*spd*0.35;tvy=dx/d*spd*0.35;}
        if(e.cd<=0){const m=pickMove(e,MS,d,reach);if(m)startMove(e,m,tgt,dx,dy,d,cdm);else e.cd=0.2;}
        break;
      }
      if(T.summon){e.sumT-=DT;if(e.sumT<=0){e.sumT=e.phase===2?6:9;const st=T.summon,cnt=E.filter(o=>o.type===st&&!o.dead).length;if(cnt<(e.phase===2?6:4)){for(let i=0;i<2;i++){const h=spawnEnemy(st,e.x+rnd(-60,60),e.y+rnd(-60,60),{lv:e.lv-2});h.state='chase';h.inLair=e.inLair;}pop(e.x,e.y-e.r-30,T.final?'おい、手を かせ！':'おいで、かわいい子たち','#c8452d',true);sfx('buzz');}}}
      if(T.ai==='ranged'){
        const want=T.boss?190:200;if(d<want-40){tvx=-dx/d*spd;tvy=-dy/d*spd;}else if(d>want+60){tvx=dx/d*spd*0.8;tvy=dy/d*spd*0.8;}else{tvx=-dy/d*spd*0.5;tvy=dx/d*spd*0.5;}
        e.shotT-=DT;if(e.shotT<=0&&d<360){e.shotT=(T.boss?rnd(1.5,2.1):rnd(1.9,2.7))*cdm;const n=(T.multi||1)+(e.phase===2?1:0);for(let i=0;i<n;i++){const a=Math.atan2(dy,dx)+(i-(n-1)/2)*0.22;const sp2=T.shot==='sting'?330:230;shots.push({x:e.x,y:e.y,vx:Math.cos(a)*sp2,vy:Math.sin(a)*sp2,t:0,from:e,kind:T.shot||'web'});}sfx('web');}
      }else if(T.ai==='grabber'){
        if(d<170&&e.cd<=0){e.state='grab_wind';e.t=0.55;e.gx=tgt.x;e.gy=tgt.y;e.gtg=tgt;}
        else if(d>120){tvx=dx/d*spd;tvy=dy/d*spd;}
      }else if(T.ai==='gas'){
        if(d<80&&e.cd<=0){e.cd=4;clouds.push({x:e.x,y:e.y,r:95,t:0,life:2.6,kind:'hostgas',from:e});sfx('gas');pop(e.x,e.y-e.r-12,'ぷしゅー',INK);e.state='flee';e.fleeT=1.5;}
        else{tvx=dx/d*spd;tvy=dy/d*spd;}
      }else if(T.ai==='roller'){
        if(!e.rolled&&d<260&&e.cd<=0){e.state='roll_wind';e.t=0.6;e.rolled=true;}
        else{tvx=dx/d*spd;tvy=dy/d*spd;}
      }else if(fly){
        if(T.dust&&e.cd<=0&&d<200&&Math.random()<0.02){e.cd=2.5*cdm;clouds.push({x:tgt.x,y:tgt.y,r:80,t:0,life:2.4,kind:'dust',from:e});sfx('spore');pop(e.x,e.y-e.r-12,'りんぷん！',INK);}
        else if(e.cd<=0&&d<270){e.state='dive_wind';e.t=(T.boss?0.5:0.6)*cdm;}
        else{const want=T.boss?150:110,s=d>want?1:-0.6;tvx=dx/d*spd*0.7*s-dy/d*spd*0.4;tvy=dy/d*spd*0.7*s+dx/d*spd*0.4;}
      }else if(T.ai==='water'&&MAP.river&&!inWater(MAP,tgt.x,tgt.y)&&!onCrossing(MAP,tgt.x,tgt.y,30)&&riverDist(MAP.river,tgt.x,tgt.y)>MAP.river.w/2+140){
        /* striders keep to the water: patrol the bank nearest the target */
        const x=clamp(tgt.x,60,MAP.w-60);e.tx=x;e.ty=MAP.river.yAt(x);const ddx=e.tx-e.x,ddy=e.ty-e.y,dd=Math.hypot(ddx,ddy);if(dd>10){tvx=ddx/dd*spd*0.8;tvy=ddy/dd*spd*0.8;}
      }else if(d<reach&&e.cd<=0){
        if(T.sweep&&Math.random()<(e.phase===2?0.5:0.35)){e.state='sweep_wind';e.t=0.7*cdm;}
        else if(T.spin&&Math.random()<0.3){e.state='spin_wind';e.t=0.6*cdm;}
        else{e.state='windup';e.t=(T.ai==='slasher'?(T.boss?0.55:0.62):(T.boss?0.5:0.42))*cdm;}
      }
      else if(T.charge&&d>140&&d<340&&e.cd<=0&&Math.random()<0.03){e.state='charge_wind';e.t=0.7*cdm;}
      else if(T.leap&&d>160&&d<380&&e.cd<=0&&Math.random()<0.025){e.state='leap_wind';e.t=0.5*cdm;e.tx=tgt.x;e.ty=tgt.y;}
      else if(T.ai==='hopper'){e.hopT=(e.hopT||0)-DT;e.hop=Math.max(0,e.hop-DT*3);if(e.hopT<=0){e.hopT=rnd(0.7,1.2);const k=T.legs==='batta'?400:320;e.vx+=dx/d*k;e.vy+=dy/d*k;e.hop=1;sfx('hop');}}
      else{tvx=dx/d*spd;tvy=dy/d*spd;}
    }break;
    case 'windup':
      face=Math.atan2(dy,dx);if(T.ai==='slasher')e.ext=Math.min(0.3,e.ext+DT);
      if(e.t<=0){e.state='recover';e.t=0.45;e.cd=(T.boss||T.keeper?0.55:rnd(0.6,1.1))*(e.phase===2?0.7:1);
        if(T.ai==='slasher'){e.slashT=0.2;e.ext=1.2;arcAoe(e,64,1.25,1);sfx('slash');if((T.boss||T.keeper)&&Math.random()<(e.phase===2?0.7:0.45)){e.state='windup';e.t=0.32;}}
        else{e.vx+=dx/d*170;e.vy+=dy/d*170;if(d<e.r+tr+(T.boss?34:18))hitTarget(tgt,e,1,{poison:T.venom});}
      }break;
    case 'charge_wind':face=Math.atan2(dy,dx);if(e.t<=0){e.state='charging';e.t=0.5;e.vx=dx/d*500;e.vy=dy/d*500;sfx('roar');}break;
    case 'charging':
      if(aoe(e.x,e.y,e.r+6,e,1.3)){if(e.rushN>1){e.rushN--;e.state='charge_wind';e.t=0.28;}else{e.state='recover';e.t=0.7;e.cd=1;}}
      else if(e.t<=0){if(e.rushN>1){e.rushN--;e.state='charge_wind';e.t=0.28;}else{e.state='recover';e.t=0.8;e.cd=0.8;}}break;
    case 'slash_wind':face=Math.atan2(dy,dx);e.ext=Math.min(0.4,e.ext+DT);
      if(e.t<=0){e.slashT=0.2;e.ext=1.2;const R=60+e.r*0.6;arcAoe(e,R,1.3,1.05);fx.push({arc:true,x:e.x,y:e.y,a:e.ang,r:e.r+R,w:1.3,t:0,life:0.22});sfx('slash');
        if(e.combo>0){e.combo--;e.state='slash_wind';e.t=0.3;}else{e.state='recover';e.t=0.5;e.cd=bossCd(e);}}break;
    case 'quake_wind':face=Math.atan2(dy,dx);if(!fly)e.z=Math.sin(clamp(1-e.t/e.qT,0,1)*Math.PI*0.5)*46;
      if(e.t<=0){e.z=0;S.shake=12;sfx('thud');vib(40);fx.push({ring:true,x:e.x,y:e.y,r:e.qR,t:0,life:0.35});for(let i=0;i<20;i++){const a=i/20*TAU;fx.push({x:e.x+Math.cos(a)*e.r,y:e.y+Math.sin(a)*e.r,vx:Math.cos(a)*300,vy:Math.sin(a)*300,t:0,life:0.45,c:'#e9dcb0'});}
        aoe(e.x,e.y,e.qR,e,1.2,{kb:420});e.state='recover';e.t=0.8;e.cd=bossCd(e);}break;
    case 'ring_wind':e.ang+=DT*3;
      if(e.t<=0){const MS2=MOVESETS[e.type]||{},n=e.phase===2?14:10,off=rnd(0,TAU);for(let i=0;i<n;i++){const a=off+i/n*TAU;shots.push({x:e.x,y:e.y,vx:Math.cos(a)*210,vy:Math.sin(a)*210,t:0,from:e,kind:MS2.shot||'pellet',mul:0.5});}sfx('web');
        if(e.combo>0){e.combo--;e.state='ring_wind';e.t=0.4;}else{e.state='recover';e.t=0.6;e.cd=bossCd(e);}}break;
    case 'shoot_wind':face=Math.atan2(dy,dx);
      if(e.t<=0){const MS2=MOVESETS[e.type]||{},k=MS2.shot||'pellet',n=e.phase===2?5:3,base=Math.atan2(dy,dx),sp2=k==='sting'?340:240;for(let i=0;i<n;i++){const a=base+(i-(n-1)/2)*0.2;shots.push({x:e.x,y:e.y,vx:Math.cos(a)*sp2,vy:Math.sin(a)*sp2,t:0,from:e,kind:k,mul:0.6});}sfx('web');
        if(e.combo>0){e.combo--;e.state='shoot_wind';e.t=0.35;}else{e.state='recover';e.t=0.5;e.cd=bossCd(e);}}break;
    case 'field_wind':
      if(e.t<=0){const MS2=MOVESETS[e.type]||{},k=MS2.field||'hostgas';for(const p of e.fieldPts||[])clouds.push({x:p.x,y:p.y,r:k==='web'?70:75,t:0,life:k==='web'?6:4,kind:k==='web'?'webfield':k,from:e});sfx(k==='web'?'web':'gas');e.fieldPts=null;e.state='recover';e.t=0.5;e.cd=bossCd(e);}break;
    case 'dust_wind':face=Math.atan2(dy,dx);
      if(e.t<=0){clouds.push({x:e.dx2,y:e.dy2,r:85,t:0,life:2.6,kind:'dust',from:e});sfx('spore');e.state='recover';e.t=0.5;e.cd=bossCd(e);}break;
    case 'guardup':face=Math.atan2(dy,dx);if(e.t<=0){e.state='recover';e.t=0.3;e.cd=0.4;}break;
    case 'roll_wind':face=Math.atan2(dy,dx);if(e.t<=0){e.state='rolling';e.t=0.9;e.vx=dx/d*420;e.vy=dy/d*420;sfx('roll');}break;
    case 'rolling':e.walk+=DT*20;if(aoe(e.x,e.y,e.r+4,e,1.1)){e.state='recover';e.t=0.8;e.cd=1.6;e.rolled=false;}else if(e.t<=0){e.state='recover';e.t=0.6;e.cd=1.4;e.rolled=false;}break;
    case 'leap_wind':face=Math.atan2(e.ty-e.y,e.tx-e.x);if(e.t<=0){e.state='leaping';e.t=0.6;e.lx=e.x;e.ly=e.y;sfx('hop');}break;
    case 'leaping':{
      const k=clamp(1-e.t/0.6,0,1);e.x=e.lx+(e.tx-e.lx)*k;e.y=e.ly+(e.ty-e.ly)*k;e.z=Math.sin(k*Math.PI)*70;e.vx=e.vy=0;
      if(e.t<=0){e.z=0;e.state='recover';e.t=0.7;e.cd=0.8;S.shake=8;sfx('thud');for(let i=0;i<16;i++){const a=i/16*TAU;fx.push({x:e.x,y:e.y,vx:Math.cos(a)*220,vy:Math.sin(a)*220,t:0,life:0.4,c:'#e9dcb0'});}
        fx.push({ring:true,x:e.x,y:e.y,r:e.r+60,t:0,life:0.3});aoe(e.x,e.y,e.r+60,e,0.9);}
    }break;
    case 'spin_wind':e.ang+=DT*8;if(e.t<=0){e.state='spinning';e.t=0.7;sfx('slash');}break;
    case 'spinning':e.ang+=DT*25;if(Math.floor(e.t*10)!==Math.floor((e.t+DT)*10)){aoe(e.x,e.y,e.r+46,e,0.45);fx.push({ring:true,x:e.x,y:e.y,r:e.r+46,t:0,life:0.15});}if(e.t<=0){e.state='recover';e.t=0.7;e.cd=1.2;}break;
    case 'sweep_wind':face=Math.atan2(dy,dx);e.ext=Math.min(1,e.ext+DT*2);if(e.t<=0){e.state='recover';e.t=0.6;e.cd=1;e.slashT=0.25;arcAoe(e,90,1.5,1.4);sfx('slash');S.shake=9;fx.push({arc:true,x:e.x,y:e.y,a:e.ang,r:e.r+90,w:1.5,t:0,life:0.3,col:'rgba(255,220,150,'});}break;
    case 'grab_wind':face=Math.atan2(e.gy-e.y,e.gx-e.x);e.ext=Math.min(1.3,e.ext+DT*3);if(e.t<=0){e.state='recover';e.t=0.7;e.cd=2.2*(e.phase===2?0.7:1);sfx('grab');
      const g=e.gtg&&(e.gtg===P||!e.gtg.dead)?e.gtg:P,gd=Math.hypot(g.x-e.x,g.y-e.y),ga=Math.abs(angDiff(e.ang,Math.atan2(g.y-e.y,g.x-e.x)));
      fx.push({grab:true,x:e.x+Math.cos(e.ang)*e.r*0.9,y:e.y+Math.sin(e.ang)*e.r*0.9,a:e.ang,len:180-e.r*0.9,t:0,life:0.25,arm:true});
      if(gd<200&&ga<0.5){if(g===P){if(hurtPlayer(enemyDmg(e,0.8),null,{})){P.vx=(e.x-P.x)/gd*520;P.vy=(e.y-P.y)/gd*520;P.stunT=0.35;pop(P.x,P.y-30,'つかまった！','#c8452d',true);}}else{hurtAlly(g,enemyDmg(e,0.8),e);g.vx=(e.x-g.x)/gd*500;g.vy=(e.y-g.y)/gd*500;}}}break;
    case 'dive_wind':face=Math.atan2(dy,dx);e.vx*=0.9;e.vy*=0.9;if(e.t<=0){e.state='diving';e.t=0.38;const v=T.boss?580:490;e.vx=dx/d*v;e.vy=dy/d*v;e.dtg=tgt;sfx('buzz');}break;
    case 'diving':{
      const g=e.dtg&&(e.dtg===P||!e.dtg.dead)?e.dtg:P,gd=Math.hypot(g.x-e.x,g.y-e.y),gr=rOf(g);
      if(gd<e.r+gr+6){hitTarget(g,e,1,{poison:T.tail==='hari'||T.tail==='ohari'?3:0});e.state='recover';e.t=0.6;e.cd=(T.boss?0.8:1.4)*(e.phase===2?0.7:1);}
      else if(e.t<=0){e.state='recover';e.t=0.5;e.cd=T.boss?0.7:1.3;}
    }break;
    case 'recover':e.ext=Math.max(0,e.ext-DT*3);if(e.t<=0)e.state='chase';break;
  }
  const ballistic=['charging','leaping','diving','rolling'].includes(e.state);
  if(!ballistic){const st=e.state==='chase'||e.state==='wander'||e.state==='flee'?steer(e,tvx,tvy):[tvx,tvy];e.vx+=(st[0]-e.vx)*Math.min(1,DT*6);e.vy+=(st[1]-e.vy)*Math.min(1,DT*6);}
  if(face!=null)e.ang+=angDiff(e.ang,face)*Math.min(1,DT*8);
  else if(Math.hypot(e.vx,e.vy)>8&&e.state!=='spinning')e.ang+=angDiff(e.ang,Math.atan2(e.vy,e.vx))*Math.min(1,DT*8);
  e.inLair=inLair(e.x,e.y);
  if(e.state!=='leaping'){e.x+=e.vx*DT;e.y+=e.vy*DT;}
  if(e.state==='charging'||e.state==='diving'||e.state==='rolling'){e.vx*=0.99;e.vy*=0.99;}
  e.walk+=DT*Math.hypot(e.vx,e.vy)*0.12;
  if(fly)e.z=14+Math.sin(S.t*4+e.id)*4;
  if(e.state!=='seat'&&e.state!=='under')collide(e,e.r,{fly,water:T.ai==='water'});
  if(S.sumo&&e!==S.sumo.e){const R=MAP.sumo,ox=e.x-R.x,oy=e.y-R.y,od=Math.hypot(ox,oy);if(od<R.R+e.r+20){e.x=R.x+ox/(od||1)*(R.R+e.r+20);e.y=R.y+oy/(od||1)*(R.R+e.r+20);}}
}
/* ---------------- follower ---------------- */
function updateAlly(a){
  if(MAP&&MAP.lair&&!MAP.dojo&&inLair(a.x,a.y)!==inLair(P.x,P.y)){a.stuckT=(a.stuckT||0)+DT;if(a.stuckT>(MAP.lair.open?2.5:0.8)){a.stuckT=0;const b=P.ang+Math.PI;a.x=P.x+Math.cos(b)*36*(a.side||1);a.y=P.y+Math.sin(b)*36;a.inLair=inLair(P.x,P.y);a.leapT=0;a.dashT=0;a.z=0;collide(a,a.r,{});for(let i=0;i<10;i++)fx.push({x:a.x,y:a.y,vx:rnd(-120,120),vy:rnd(-120,120),t:0,life:0.4,c:'#fff3c4'});pop(a.x,a.y-a.r-18,'兄貴〜！',  '#5f7d3a',true);}}
  else a.stuckT=0;
  a.dmg=(a.baseDmg||a.dmg)*(a.rec.trait==='kenage'&&P.hp<ST.maxhp*0.5?1.5:1)*(duo()?0.55:1)*(order()==='atk'?1.1:order()==='def'?0.9:1);
  a.cd-=DT;a.hurtT-=DT;a.inv-=DT;a.flap+=DT*30;a.slashT-=DT;a.taunt=(a.taunt||0)-DT;a.skillCd-=DT;a.guardT=(a.guardT||0)-DT;
  if(a.leapT>0||a.dashT>0){allyMove(a);a.rec.hpFrac=a.hp/a.maxhp;return;}a.ext=Math.max(0,a.ext-DT*3);a.hop=Math.max(0,a.hop-DT*3);
  const ord=order();a.hp=Math.min(a.maxhp,a.hp+DT*a.maxhp*0.01*(ord==='reg'?3:1));
  const weak=ord==='reg'||a.hp<a.maxhp*(ord==='def'?0.3:0.2);let tg=null,bd=ord==='atk'?300:ord==='def'?190:0;
  const other=a===ALLY2?ALLY:ALLY2,otg=other&&!other.dead?other.curTg:null;
  if(!S.sumo)for(const e of E){if(e.dead||e.T.ai==='sumo'||e.state==='seat'||e.state==='den'||e.state==='under'||e.T.ai==='passive'||e.z>18||e.friendly||e.peace)continue;let d=ord==='def'?Math.hypot(e.x-P.x,e.y-P.y):Math.min(Math.hypot(e.x-a.x,e.y-a.y),Math.hypot(e.x-P.x,e.y-P.y)+40);if(e===otg&&!e.T.boss&&!e.T.keeper&&!e.T.nushi)d+=90;if(d<bd){bd=d;tg=e;}}
  a.curTg=tg;
  const sp=Math.max(a.T.speed*1.2,175)*(a.rec.trait==='hayaashi'?1.2:1);let tvx=0,tvy=0;
  let gx,gy;
  if(a.skillCd<=0&&!S.sumo&&skillTier(a.rec)>0&&(ord!=='reg'||['mitsu','mawari','nioi'].includes(skillOf(a.type)))&&useAllySkill(a,tg))return;
  if(tg&&!weak){
    const dx=tg.x-a.x,dy=tg.y-a.y,d=Math.hypot(dx,dy)||1;a.ang+=angDiff(a.ang,Math.atan2(dy,dx))*Math.min(1,DT*8);
    const ranged=a.T.ai==='ranged';
    if(ranged){if(d<220&&a.cd<=0){a.cd=1.3;shots.push({x:a.x,y:a.y,vx:dx/d*320,vy:dy/d*320,t:0,friendly:true,dmg:a.dmg,kind:a.T.shot||'web'});sfx('web');}if(d>200){tvx=dx/d*sp;tvy=dy/d*sp;}}
    else if(d<a.r+tg.r+16){if(a.cd<=0){a.cd=0.85;a.slashT=0.15;a.ext=1;damageEnemy(tg,a.dmg*rnd(0.9,1.1),a.x,a.y,200);addBond(2.5);}}
    else{tvx=dx/d*sp;tvy=dy/d*sp;if(a.T.ai==='hopper'&&Math.random()<DT*2){a.vx+=dx/d*300;a.vy+=dy/d*300;a.hop=1;}}
  }else{
    const back=ord==='def'?P.ang+0.9*(a.side||1):P.ang+Math.PI*0.8*(a.side||1),bdist=ord==='def'?42:ord==='reg'?64:46;gx=P.x+Math.cos(back)*bdist;gy=P.y+Math.sin(back)*bdist;
    if(S.sumo){const R=MAP.sumo,ox=gx-R.x,oy=gy-R.y,od=Math.hypot(ox,oy)||1;if(od<R.R+60){const a2=Math.atan2(a.y-R.y,a.x-R.x);gx=R.x+Math.cos(a2)*(R.R+80);gy=R.y+Math.sin(a2)*(R.R+80);}}
    const dx=gx-a.x,dy=gy-a.y,d=Math.hypot(dx,dy);
    if(d>14){const s=Math.min(sp*1.25,d*4);tvx=dx/d*s;tvy=dy/d*s;}
    if(Math.hypot(P.x-a.x,P.y-a.y)>650&&!S.sumo){a.x=P.x-24;a.y=P.y+24;}
  }
  a.vx+=(tvx-a.vx)*Math.min(1,DT*7);a.vy+=(tvy-a.vy)*Math.min(1,DT*7);
  if(Math.hypot(a.vx,a.vy)>10&&!tg)a.ang+=angDiff(a.ang,Math.atan2(a.vy,a.vx))*Math.min(1,DT*8);
  a.inLair=inLair(a.x,a.y);
  a.x+=a.vx*DT;a.y+=a.vy*DT;a.walk+=DT*Math.hypot(a.vx,a.vy)*0.12;
  const fly=a.T.ai==='flyer'||a.T.fly;a.z=fly?14:0;collide(a,a.r,{fly,water:a.T.ai==='water'});
  if(S.sumo){const R=MAP.sumo,ox=a.x-R.x,oy=a.y-R.y,od=Math.hypot(ox,oy);if(od<R.R+a.r+24){a.x=R.x+ox/(od||1)*(R.R+a.r+24);a.y=R.y+oy/(od||1)*(R.R+a.r+24);}}
  a.rec.hpFrac=a.hp/a.maxhp;
}
function allyMove(a){
  allyFenceClamp(a);
  if(a.leapT>0){a.leapT-=DT;const k=clamp(1-a.leapT/0.55,0,1);a.x=a.lx+(a.tx-a.lx)*k;a.y=a.ly+(a.ty-a.ly)*k;a.z=Math.sin(k*Math.PI)*60;a.hop=1;
    if(a.leapT<=0){a.z=0;S.shake=6;sfx('thud');fx.push({ring:true,x:a.x,y:a.y,r:90,t:0,life:0.3});for(const e of E){if(!e.dead&&e.z<18&&e.state!=='den'&&Math.hypot(e.x-a.x,e.y-a.y)<e.r+80)damageEnemy(e,a.dmg*1.5*a.pow,a.x,a.y,420);}collide(a,a.r,{});}
    return;}
  a.dashT-=DT;a.x+=a.vx*DT;a.y+=a.vy*DT;a.walk+=DT*40;
  for(const e of E){if(e.dead||e.z>18||e.state==='den'||a.dashHit.has(e))continue;if(Math.hypot(e.x-a.x,e.y-a.y)<e.r+a.r+6){a.dashHit.add(e);damageEnemy(e,a.dmg*1.3*a.pow,a.x,a.y,300);}}
  collide(a,a.r,{});
}
/* follower signature moves; returns true when the move takes over movement this frame */
function useAllySkill(a,tg){
  const tier=skillTier(a.rec),id=a.rec.rare&&tier&&Math.random()<0.45?a.rec.rare:skillOf(a.type),sk=ALLY_SKILLS[id],pow=tier===2?1.45:1,cdm=tier===2?0.7:1;a.pow=pow;
  const dT=tg?Math.hypot(tg.x-a.x,tg.y-a.y):1e9;let used=false;
  switch(id){
    case 'nage':if(tg&&dT<a.r+tg.r+26){damageEnemy(tg,a.dmg*2.4*pow,a.x,a.y,tg.T.boss||tg.T.keeper?260:700);a.ext=1.2;used=true;}break;
    case 'ito':if(tg&&dT<280){for(const e of E){if(e.dead||e.state==='den'||e.state==='seat'||e.T.ai==='sumo')continue;if(Math.hypot(e.x-tg.x,e.y-tg.y)<95*pow){e.state='recover';e.t=(e.T.boss||e.T.keeper||e.T.nushi?0.9:2.2)*pow;e.vx=e.vy=0;}}clouds.push({x:tg.x,y:tg.y,r:95*pow,t:0,life:0.9,kind:'webfx'});sfx('web');used=true;}break;
    case 'mitsu':if(P.hp<ST.maxhp*0.65){healPlayer(ST.maxhp*0.18*pow);sfx('heal');for(let i=0;i<10;i++)fx.push({x:P.x,y:P.y,vx:rnd(-80,80),vy:rnd(-120,-20),t:0,life:0.7,c:'#f2c43a'});used=true;}break;
    case 'nioi':{let n=0;for(const e of E)if(!e.dead&&e.state==='chase'&&Math.hypot(e.x-P.x,e.y-P.y)<160)n++;if(n>=2){emitStink(150*pow,2.6*pow);used=true;}}break;
    case 'kama':if(tg&&dT<a.r+tg.r+80){a.ang=Math.atan2(tg.y-a.y,tg.x-a.x);fx.push({arc:true,x:a.x,y:a.y,a:a.ang,r:a.r+90,w:1.2,t:0,life:0.25});sfx('slash');for(const e of E){if(e.dead||e.z>18||e.state==='den')continue;const ex=e.x-a.x,ey=e.y-a.y;if(Math.hypot(ex,ey)<a.r+e.r+90&&Math.abs(angDiff(a.ang,Math.atan2(ey,ex)))<1.2)damageEnemy(e,a.dmg*1.6*pow,a.x,a.y,280);}a.ext=1.2;used=true;}break;
    case 'shippu':if(tg&&dT<300&&dT>50){const dx=tg.x-a.x,dy=tg.y-a.y;a.ang=Math.atan2(dy,dx);a.vx=dx/dT*720;a.vy=dy/dT*720;a.dashT=0.38;a.dashHit=new Set();sfx('dash');used=true;}break;
    case 'mawari':{let n=0;for(const e of E)if(!e.dead&&e.state==='chase'&&Math.hypot(e.x-P.x,e.y-P.y)<260)n++;if(n>=1&&P.hp<ST.maxhp*0.85){a.taunt=5*pow;a.guardT=5*pow;for(const e of E){if(!e.dead&&!e.T.boss&&Math.hypot(e.x-a.x,e.y-a.y)<340){e.tg=a;e.tgT=5*pow;}}sfx('clink');used=true;}}break;
    case 'tobi':if(tg&&dT<300&&dT>40){a.leapT=0.55;a.lx=a.x;a.ly=a.y;a.tx=tg.x;a.ty=tg.y;sfx('hop');used=true;}break;
    case 'rinpun':if(tg&&dT<300){clouds.push({x:tg.x,y:tg.y,r:90*pow,t:0,life:3,kind:'allydust',dmg:a.dmg*0.5*pow});sfx('spore');used=true;}break;
  }
  if(used){a.skillCd=sk.cd*cdm*rnd(0.9,1.1)*(a.rec.trait==='hayaashi'?0.8:1)*(duo()?1.35:1);pop(a.x,a.y-a.r-22,(id===a.rec.rare?'秘伝・':tier===2?'真・':'')+sk.name+'！',id===a.rec.rare?'#b8860b':'#5f7d3a',true);}
  else a.skillCd=0.5;
  return used&&(a.leapT>0||a.dashT>0);
}
/* ---------------- sky: day / evening / night and summer showers ---------------- */
function skyPhase(){const A=AREA();if(A.dark)return 'night';const f=(S.time%DAY)/DAY;const p=themePhase(f);if(A.time==='evening'&&p==='day')return 'dusk';return p;}
function isNight(){return !!MAP&&!S.dojo&&skyPhase()==='night';}
function isRain(){return (S.rainT||0)>0&&!S.dojo;}
function updateSky(){
  if(typeof amb!=='undefined')amb.set(S.dojo?null:isNight()?'night':isRain()?'rain':null);
  if(isRain()){S.thunderT=(S.thunderT??rnd(4,9))-DT;if(S.thunderT<=0){S.thunderT=rnd(9,20);S.flash=0.45;later(()=>sfx('thunder'),rnd(150,700));}}
  if(S.dojo)return;const ph=skyPhase();
  if(ph!==S.lastPhase){const prev=S.lastPhase;S.lastPhase=ph;if(prev){if(ph==='night'&&!AREA().dark){banner('夜に なった','めずらしい虫が 出はじめる。部位も 少し よくなる');sfx('whistle');diary('夜になった。');}else if(ph==='dawn'&&!AREA().dark)banner('夜が あけてきた','');}}
  if(S.rainT>0){S.rainT-=DT;if(S.rainT<=0){banner('夕立が やんだ','葉っぱの しずくが きらきら 光る');if(typeof rain!=='undefined')rain.stop();}}
  else if(!AREA().dark&&ph==='day'){S.rainCheck=(S.rainCheck||0)-DT;if(S.rainCheck<=0){S.rainCheck=40;if(Math.random()<themeRainCh()){S.rainT=theme()==='ooame'?rnd(70,110):rnd(40,60);banner('夕立だ！','飛ぶ虫は かくれ、めずらしい部位が 出やすい');diary('夕立が ふった。');if(typeof rain!=='undefined')rain.start();}}}
}
function fmtTime(t){const m=Math.floor(t/60),s=Math.floor(t%60);return m+'分'+(s<10?'0':'')+s+'秒';}
/* ---------------- challenge letters ---------------- */
function awaken(e){e.awake=true;e.lv+=5;e.maxhp*=1.6;e.hp=e.maxhp;e.dmg*=1.25;e.speed*=1.08;}
function challengeWin(e){
  const A=AREA(),t=S.chalT;DEX.chal=DEX.chal||{};const prev=DEX.chal[A.id],best=!prev||t<prev.best;DEX.chal[A.id]={best:best?Math.round(t):prev.best,count:(prev?prev.count:0)+1};saveDex();
  const d=e.T.drop;if(d){const p=mkPart(d[0],d[1],2.4);if(p.rar<1)p.rar=1;dropItem(e.x+30,e.y,p);announceDrop(p,false);}
  const ks=A.keepers.map(k=>TYPES[k].drop).filter(Boolean),k2=pick(ks);if(k2){const p=mkPart(k2[0],k2[1],1.8);dropItem(e.x-30,e.y,p);}
  addXP(e.T.xp*(1+0.5*(e.lv-1))*1.5,e.x,e.y-40);music.play('victory');sfx('fanfare');
  banner('挑戦状 達成！',fmtTime(t)+(best?'（自己ベスト！）':'（ベスト '+fmtTime(prev.best)+'）'));diary(A.name+'の 挑戦状を 達成した（'+fmtTime(t)+'）。');
  later(()=>{if(S.state==='play')say([{who:e.T.name,text:e.T.final?'……まいった。来年も こうは いかねえぞ。':'……覚醒した おれを 倒すとはな。もってけ。'}],()=>openExit());},700);
}
/* ---------------- training ground ---------------- */
function genDojo(){
  const w=1300,h=1200,R=seeded(777),M={dojo:true,ai:S.areaI,w,h,obst:[],webs:[],shrooms:[],saps:[],frogs:[],decor:[],river:null,sumo:null,border:[],cell:400,grid:{}};
  M.start={x:w/2,y:h-260};M.sumika={x:w/2,y:h-120,r:46};M.lair={x:-9999,y:-9999,R:10,gate:0,gw:0.2,open:true,openT:1};
  M.arenas=[{x:w*0.72,y:h*0.3,R:200,keeper:'shihan',seed:9,beaten:false}];
  M.free=()=>false;
  for(const [x,y,r] of [[120,140,60],[w-120,h-200,55],[150,h-160,50],[w-160,140,58]])M.obst.push({k:'rock',x,y,r,seed:Math.floor(R()*1e6),a:R()*TAU,moss:true});
  const set=DECOR_SET.soil,wsum=set.reduce((s,d)=>s+d[1],0);
  for(let i=0;i<380;i++){let p=R()*wsum,d=set[0];for(const s of set){p-=s[1];if(p<=0){d=s;break;}}const x=R()*w,y=R()*h,sz=d[0]==='patch'?60+R()*100:6+R()*10;const o={k:d[0],x,y,a:R()*TAU,s:sz,c:d[2].length?d[2][Math.floor(R()*d[2].length)]:null};M.decor.push(o);const key=Math.floor(x/400)+','+Math.floor(y/400);(M.grid[key]=M.grid[key]||[]).push(o);}
  for(let x=-60;x<w+120;x+=90){M.border.push({k:'grass',x,y:-60,r:60,seed:x*7});M.border.push({k:'grass',x,y:h+60,r:60,seed:x*11});}
  for(let y=0;y<h;y+=90){M.border.push({k:'grass',x:-60,y,r:60,seed:y*13});M.border.push({k:'grass',x:w+60,y,r:60,seed:y*17});}
  return M;
}
function enterDojo(){
  S.saved={MAP,E,items,foods,keepersDown:S.keepersDown,bossDown:S.bossDown,exit:S.exit,nushiHere:S.nushiHere,px:P.x,py:P.y,bird:S.bird,rainT:S.rainT};
  MAP=genDojo();E=[];items=[];foods=[];clouds=[];shots=[];trails=[];waves=[];corpses=[];S.exit=null;S.bossBar=null;S.dojo=true;S.dpsLog=[];
  const M=MAP;for(let i=0;i<3;i++){const e=spawnEnemy('wara',M.w*0.22+i*130,M.h*0.42,{lv:P.lv});e.state='idle';}
  const k=spawnEnemy('kakashi',M.w*0.3,M.h*0.72,{lv:P.lv});k.state='idle';
  const s=spawnEnemy('shihan',M.arenas[0].x,M.arenas[0].y,{lv:P.lv});s.arena=M.arenas[0];s.state='den';
  P.x=M.start.x;P.y=M.start.y;P.vx=P.vy=0;S.sumikaLock=true;refreshStats();P.hp=ST.maxhp;
  if(ALLY){ALLY.x=P.x-40;ALLY.y=P.y+20;}if(ALLY2){ALLY2.x=P.x+40;ALLY2.y=P.y+20;}
  S.cam.x=P.x;S.cam.y=P.y;S.state='play';music.play('matsuri');
  banner('けいこ場','わら人形で わざを ためそう。師範の 輪に 入ると けいこ相手に');
}
function exitDojo(){
  const v=S.saved;if(!v)return;
  MAP=v.MAP;E=v.E;items=v.items;foods=v.foods;S.keepersDown=v.keepersDown;S.bossDown=v.bossDown;S.exit=v.exit;S.nushiHere=v.nushiHere;S.bird=v.bird;S.rainT=v.rainT;
  clouds=[];shots=[];trails=[];waves=[];corpses=[];S.dojo=false;S.saved=null;S.bossBar=null;
  P.x=MAP.sumika.x-70;P.y=MAP.sumika.y+40;P.vx=P.vy=0;S.sumikaLock=true;refreshStats();P.hp=ST.maxhp;
  if(ALLY){ALLY.x=P.x-40;ALLY.y=P.y+20;ALLY.hp=ALLY.maxhp;}if(ALLY2){ALLY2.x=P.x+40;ALLY2.y=P.y+20;ALLY2.hp=ALLY2.maxhp;}S.cam.x=P.x;S.cam.y=P.y;
  music.play(AREA().bgm);banner('けいこ おわり',AREA().name+'に もどった');writeSave();
}
function dojoDps(){const log=S.dpsLog||[],now=S.t;while(log.length&&now-log[0][0]>5)log.shift();let s=0;for(const l of log)s+=l[1];return log.length?s/Math.max(1,Math.min(5,now-log[0][0]+0.5)):0;}
/* ---------------- boss move helpers ---------------- */
function bossCd(e){return (e.T.boss?0.55:e.T.nushi?0.6:0.7)*(e.phase===2?0.7:1)*rnd(0.85,1.2);}
function pickMove(e,MS,d,reach){
  const list=MS.moves.concat((e.phase===2||e.awake)&&MS.moves2?MS.moves2:[]);let tot=0;const c=[];
  for(const m of list){const M=MOVE_DEF[m];if(!M)continue;const mx=M.max==='reach'?reach:M.max+e.r;if(d<M.min||d>mx)continue;
    if(m==='summon'&&E.filter(o=>o.type===MS.summon&&!o.dead).length>=(e.phase===2?5:3))continue;
    if(m==='bite'&&(e.T.ai==='flyer'||e.T.fly))continue;
    const w=M.w*(m===e.lastMove?0.25:1);c.push([m,w]);tot+=w;}
  if(!c.length)return null;let r=Math.random()*tot;for(const [m,w] of c){r-=w;if(r<=0)return m;}return c[0][0];
}
function startMove(e,m,tgt,dx,dy,d,cdm){
  const T=e.T,MS=MOVESETS[e.type]||{};e.lastMove=m;
  const nm=(MS.names&&MS.names[m])||(MOVE_DEF[m]&&MOVE_DEF[m].name);
  if(nm&&m!=='bite'&&(e.phase===2||Math.random()<0.6))pop(e.x,e.y-e.r-34,nm+'！','#c8452d',true);
  switch(m){
    case 'bite':e.state='windup';e.t=(T.boss?0.5:0.45)*cdm;break;
    case 'charge':e.state='charge_wind';e.t=0.7*cdm;e.rushN=1;break;
    case 'rush':e.state='charge_wind';e.t=0.6*cdm;e.rushN=3;break;
    case 'leap':e.state='leap_wind';e.t=0.55*cdm;e.tx=tgt.x;e.ty=tgt.y;break;
    case 'spin':e.state='spin_wind';e.t=0.6*cdm;break;
    case 'sweep':e.state='sweep_wind';e.t=0.75*cdm;break;
    case 'slash':e.state='slash_wind';e.t=0.55*cdm;e.combo=e.phase===2?2:1;break;
    case 'quake':e.state='quake_wind';e.t=e.qT=0.95*cdm;e.qR=170+e.r*0.8;break;
    case 'ring':e.state='ring_wind';e.t=0.75*cdm;e.combo=e.phase===2?1:0;break;
    case 'shoot':e.state='shoot_wind';e.t=0.5*cdm;e.combo=e.phase===2?1:0;break;
    case 'field':{e.state='field_wind';e.t=0.85*cdm;const n=e.phase===2?4:3;e.fieldPts=[];for(let i=0;i<n;i++){const a=rnd(0,TAU),r=i?rnd(70,150):0;e.fieldPts.push({x:tgt.x+Math.cos(a)*r,y:tgt.y+Math.sin(a)*r});}break;}
    case 'summon':{const st=MS.summon;for(let i=0;i<(e.phase===2?3:2);i++){const h=spawnEnemy(st,e.x+rnd(-60,60),e.y+rnd(-60,60),{lv:e.lv-2});h.state='chase';h.inLair=e.inLair;}pop(e.x,e.y-e.r-30,MS.summonText||'かかれっ！','#c8452d',true);sfx('buzz');e.state='recover';e.t=0.6;e.cd=0.8;break;}
    case 'grab':e.state='grab_wind';e.t=0.55;e.gx=tgt.x;e.gy=tgt.y;e.gtg=tgt;break;
    case 'dive':e.state='dive_wind';e.t=0.55*cdm;break;
    case 'guard':e.state='guardup';e.t=1.7;sfx('clink');break;
    case 'dust':e.state='dust_wind';e.t=0.6*cdm;e.dx2=tgt.x;e.dy2=tgt.y;break;
  }
}
/* ---------------- team-up finisher (兄貴 × 子分) ---------------- */
function addBond(n){if(!ALLY||ALLY.dead)return;if(S.dojo)n*=4;n*=(ALLY.rec.trait==='nekketsu'?1.4:1)*(1+0.15*(ALLY.rec.kz||0));{const c=duoCompat();n*=c===2?1.3:c===0?0.85:1;}const was=S.bond||0;S.bond=Math.min(100,was+n);if(was<100&&S.bond>=100){sfx('star');pop(P.x,P.y-50,'連携わざ OK！','#b8860b',true);}}
function bondReady(){return (S.bond||0)>=100&&ALLY&&!ALLY.dead&&S.state==='play'&&!S.talk&&!S.sumo&&!S.rk;}
/* team-up finisher, v13: press 連携 → the world freezes, aim with the stick, tap かむ when the
   shrinking ring meets the gold ring (ピタリ／よし), then the pair performs a move built for that follower */
const RK_INFO={
  nage:{zone:'line',len:420,tip:'子分が 車輪のように 回って つっこむ'},
  ito:{zone:'point',len:240,rad:140,tip:'網で まとめて、子分が 飛びかかる'},
  mitsu:{zone:'point',len:190,rad:150,tip:'蜜の雨を ふらせる 場所を えらぶ'},
  nioi:{zone:'cone',len:340,tip:'においで ふきとばし、子分が 突進'},
  kama:{zone:'point',len:200,rad:120,tip:'子分が 交差して 十字に 切る'},
  shippu:{zone:'point',len:170,rad:110,tip:'子分が 敵を かき集め、兄貴が とどめ'},
  mawari:{zone:'line',len:260,tip:'子分が 何度も 体当たりで 往復する'},
  tobi:{zone:'line',len:340,tip:'兄貴を 踏み台に、子分が 流星に なる'},
  rinpun:{zone:'line',len:400,tip:'りんぷんの 竜巻が 敵を まきこむ'}
};
const RK_T0=1.55,RK_R0=46,RK_SPAN=130;
function rkRing(t){return RK_R0+RK_SPAN*(1-t/RK_T0);}
function rkFoes(){return E.filter(e=>!e.dead&&e.state!=='den'&&e.state!=='seat'&&e.T.ai!=='sumo'&&e.state!=='under');}
function rkAutoAim(){let best=null,bs=-1;for(const e of rkFoes()){const d=Math.hypot(e.x-P.x,e.y-P.y);if(d>460)continue;let n=0;for(const o of rkFoes())if(Math.hypot(o.x-e.x,o.y-e.y)<130)n+=o.T.boss||o.T.keeper||o.T.nushi?3:1;n-=d/400;if(n>bs){bs=n;best=e;}}return best?Math.atan2(best.y-P.y,best.x-P.x):P.ang;}
function unleashCombo(){
  if(!bondReady()||S.rk)return false;
  const a=ALLY,id=skillOf(a.type);
  S.rk={ph:'aim',t:0,id,name:COMBO_MOVES[id],ang:rkAutoAim(),info:RK_INFO[id],hits:new Set()};
  const pa=S.rk.ang+Math.PI*0.6;a.x=P.x+Math.cos(pa)*34;a.y=P.y+Math.sin(pa)*34;a.vx=a.vy=0;a.leapT=0;a.dashT=0;
  sfx('cutin');vib(40);inp.bite=false;inp.combo=false;
  if(!HAS_DOM)rkFire(1.2,'よし！');
  return true;
}
function updateRkAim(){
  const rk=S.rk;rk.t+=DT;
  const ml=Math.hypot(inp.x,inp.y);if(ml>0.3){rk.ang+=angDiff(rk.ang,Math.atan2(inp.y,inp.x))*Math.min(1,DT*14);rk.aimed=true;}
  P.ang=rk.ang;
  const press=inp.bite||inp.combo;inp.bite=false;inp.combo=false;
  if(press&&rk.t>0.12){const d=Math.abs(rkRing(rk.t)-RK_R0);rkFire(d<=9?1.6:d<=26?1.25:1.0,d<=9?'ピタリ！':d<=26?'よし！':'それっ！');return;}
  if(rk.t>=RK_T0+0.45)rkFire(1.0,'それっ！');
}
function rkFire(mul,grade){
  const rk=S.rk,a=ALLY;if(!rk||!a){S.rk=null;return;}
  const kz=a.rec.kz||0;mul*=1+0.12*kz;rk.compat=duoCompat();rk.duo=duo();if(rk.duo){mul*=rk.compat===2?1.3:rk.compat===1?1.15:1;const pa=rk.ang-Math.PI*0.6;ALLY2.x=P.x+Math.cos(pa)*34;ALLY2.y=P.y+Math.sin(pa)*34;}if(kz>=3&&!rk.name.startsWith('絆・'))rk.name='絆・'+rk.name;
  S.bond=0;rk.ph='act';rk.t=0;rk.mul=mul;rk.grade=grade;rk.B=(ST.dmg*1.6+a.dmg*2.2)*mul;rk.ox=P.x;rk.oy=P.y;rk.dx=Math.cos(rk.ang);rk.dy=Math.sin(rk.ang);
  rk.qx=P.x+rk.dx*(rk.info.len||200);rk.qy=P.y+rk.dy*(rk.info.len||200);
  P.inv=Math.max(P.inv,3);P.rolled=false;P.dashT=0;
  if(mul>1.5){S.flash=0.35;sfx('crit');vib(70);}else sfx('combo');
  pop(P.x,P.y-56,grade,mul>1.5?'#c8452d':'#b8860b',true);
  const bud=buddyOf(a.rec),helper=bud||((kz>=3||Math.random()<0.6)?S.roster.filter(r=>r!==a.rec&&!r.faint).sort((x,y)=>y.lv-x.lv)[0]:null);rk.helper=helper;rk.buddy=!!bud;
  if(S.dojo)DEX.dojoCombo=true;DEX.renkei=true;if(mul>1.5)tot('pitari',1);saveDex();
  banner('連携わざ「'+rk.name+'」',a.T.name+(helper?'・'+helper.name:'')+' と ダンゴムシ');
}
function rkHit(e,mul,kb,fx_,fy_){damageEnemy(e,S.rk.B*mul,fx_??P.x,fy_??P.y,kb||300,0,{player:true,force:true});}
function rkSweep(x,y,r,mul,kb,set){for(const e of rkFoes()){if(set&&set.has(e))continue;if(Math.hypot(e.x-x,e.y-y)<r+e.r){if(set)set.add(e);rkHit(e,mul,kb,x,y);}}}
function rkBoom(x,y,r,mul,kb){fx.push({ring:true,x,y,r,t:0,life:0.4});S.shake=12;S.hitstop=0.06;sfx('thud');for(let i=0;i<16;i++){const an=i/16*TAU;fx.push({x,y,vx:Math.cos(an)*360,vy:Math.sin(an)*360,t:0,life:0.5,c:i%2?'#f2b632':'#fff3c4'});}rkSweep(x,y,r,mul,kb,null);}
function rkMoveP(x,y){P.x=x;P.y=y;collide(P,ST.r,{water:true,glide:true});P.ball+=0.6;}
/* keep a follower on the same side of the しめ縄 as the boss (moves, leaps and team-ups never carry it over) */
function allyFenceClamp(a){
  if(!MAP||!MAP.lair||MAP.dojo)return;const L=MAP.lair,dx=a.x-L.x,dy=a.y-L.y,d=Math.hypot(dx,dy)||1;
  if(L.open&&Math.abs(angDiff(L.gate,Math.atan2(dy,dx)))<L.gw)return;
  const pIn=inLair(P.x,P.y),lim=pIn?L.R-a.r-12:L.R+a.r+12;
  if(pIn?d>lim:d<lim){a.x=L.x+dx/d*lim;a.y=L.y+dy/d*lim;if(a.tx!=null&&a.leapT>0){const tx=a.tx-L.x,ty=a.ty-L.y,td=Math.hypot(tx,ty)||1;if(pIn?td>lim:td<lim){a.tx=L.x+tx/td*lim;a.ty=L.y+ty/td*lim;}}}
  a.inLair=pIn;
}
function rkMoveA(a,x,y){a.x=x;a.y=y;allyFenceClamp(a);collide(a,a.r,{fly:true});}
/* the follower is the one who moves / gets thrown; the boss holds the line and finishes */
function rkTick(){
  const rk=S.rk,a=ALLY,t0=rk.t;rk.t+=DT;const t=rk.t,at=(k)=>t0<k&&t>=k;
  const {dx,dy,ox,oy,qx,qy}=rk,px=-dy,py=dx;
  if(!a||a.dead){rkEnd();return;}
  P.vx=P.vy=0;P.ang=rk.ang;
  switch(rk.id){
    case 'nage':{ /* the follower spins up, then hurls itself down the line like a wheel */
      if(t<0.5){a.ang+=DT*30;rkMoveA(a,ox+dx*30,oy+dy*30);a.ext=1;rkSweep(a.x,a.y,a.r+40,0.25,220,rk.hits);if(Math.random()<0.6)fx.push({x:a.x+rnd(-20,20),y:a.y+rnd(-20,20),vx:0,vy:0,t:0,life:0.3,c:'#fff3c4'});}
      else if(t<1.2){if(at(0.5)){rk.hits=new Set();sfx('dash');}const k=(t-0.5)/0.7;a.ang+=DT*40;rkMoveA(a,ox+dx*(30+k*470),oy+dy*(30+k*470));a.z=Math.sin(k*Math.PI)*16;rkSweep(a.x,a.y,a.r+28,1.6,700,rk.hits);fx.push({x:a.x,y:a.y,vx:-dx*80,vy:-dy*80,t:0,life:0.35,c:'#e9dcb0'});}
      else{if(at(1.2)){a.z=0;rkBoom(a.x,a.y,130,1.3,500);}if(t>1.55)rkEnd();}
      break;}
    case 'ito':{ /* net shot, foes are wrapped and dragged together, then the follower drops on them */
      const nx=qx,ny=qy;
      if(t<0.35){const k=t/0.35;rk.netX=a.x+(nx-a.x)*k;rk.netY=a.y+(ny-a.y)*k;a.ang=rk.ang;}
      else if(t<0.85){if(at(0.35)){sfx('web');clouds.push({x:nx,y:ny,r:rk.info.rad,t:0,life:1.4,kind:'webfx'});rk.caught=rkFoes().filter(e=>Math.hypot(e.x-nx,e.y-ny)<rk.info.rad+e.r);for(const e of rk.caught){e.state='recover';e.t=e.T.boss||e.T.keeper||e.T.nushi?1.8:3.4;e.vx=e.vy=0;}rk.lx=a.x;rk.ly=a.y;}
        for(const e of rk.caught||[]){if(e.dead||e.T.boss||e.T.keeper||e.T.nushi)continue;e.x+=(nx-e.x)*Math.min(1,DT*7);e.y+=(ny-e.y)*Math.min(1,DT*7);}}
      else if(t<1.2){const k=(t-0.85)/0.35;rkMoveA(a,rk.lx+(nx-rk.lx)*k,rk.ly+(ny-rk.ly)*k);a.z=Math.sin(k*Math.PI)*70;}
      else{if(at(1.2)){a.z=0;rkBoom(nx,ny,rk.info.rad*0.9,2.2,520);}if(t>1.55)rkEnd();}
      break;}
    case 'mitsu':{ /* honey rain on the chosen spot; heals the boss, glues foes */
      const R=rk.info.rad;if(at(0.01)){healPlayer(ST.maxhp*0.35);a.hp=a.maxhp;sfx('heal');clouds.push({x:qx,y:qy,r:R,t:0,life:4,kind:'allyhoney'});}
      a.z=14;a.x+=(qx-a.x)*Math.min(1,DT*4);a.y+=(qy-30-a.y)*Math.min(1,DT*4);
      if(t<1.6){if(Math.random()<0.8)fx.push({x:qx+rnd(-R,R),y:qy+rnd(-R,R)-120,vx:0,vy:340,t:0,life:0.35,c:'#f2c43a'});rk.tickT=(rk.tickT||0)-DT;if(rk.tickT<=0){rk.tickT=0.25;for(const e of rkFoes())if(Math.hypot(e.x-qx,e.y-qy)<R+e.r){rkHit(e,0.22,30,qx,qy);e.slowT=3;e.vx*=0.2;e.vy*=0.2;}}}
      else{if(at(1.6)){a.z=0;rkBoom(qx,qy,R,1.4,420);for(let i=0;i<24;i++)fx.push({x:qx+rnd(-R,R),y:qy+rnd(-R,R),vx:rnd(-60,60),vy:rnd(-160,-40),t:0,life:0.8,c:'#f2c43a'});}if(t>1.95)rkEnd();}
      break;}
    case 'nioi':{ /* stink cone blows the crowd back, then the follower charges through */
      if(at(0.01)){sfx('stink');for(let i=0;i<5;i++)clouds.push({x:ox+dx*(70+i*60),y:oy+dy*(70+i*60),r:60+i*14,t:0,life:2.2,kind:'stink'});
        for(const e of rkFoes()){const ex=e.x-ox,ey=e.y-oy,d=Math.hypot(ex,ey);if(d<rk.info.len&&Math.abs(angDiff(rk.ang,Math.atan2(ey,ex)))<0.7){rkHit(e,1.2,800,ox,oy);if(!e.T.boss&&!e.T.keeper&&!e.T.nushi){e.state='flee';e.fleeT=5;}}}}
      if(t>0.45&&t<0.9){if(at(0.45)){sfx('dash');rk.hits=new Set();}const k=(t-0.45)/0.45,L=rk.info.len;rkMoveA(a,ox+dx*L*k,oy+dy*L*k);a.ang=rk.ang;rkSweep(a.x,a.y,a.r+24,1.6,500,rk.hits);}
      if(t>1.1)rkEnd();break;}
    case 'kama':{ /* the follower cuts two crossing lines through Q, then the X lands */
      const L=rk.info.len,c1=[qx-px*L*0.7-dx*L*0.4,qy-py*L*0.7-dy*L*0.4,qx+px*L*0.7+dx*L*0.4,qy+py*L*0.7+dy*L*0.4],c2=[qx+px*L*0.7-dx*L*0.4,qy+py*L*0.7-dy*L*0.4,qx-px*L*0.7+dx*L*0.4,qy-py*L*0.7+dy*L*0.4];
      if(at(0.01)){rkMoveA(a,c1[0],c1[1]);sfx('dash');rk.hits=new Set();}
      if(t<0.3){const k=t/0.3;rkMoveA(a,c1[0]+(c1[2]-c1[0])*k,c1[1]+(c1[3]-c1[1])*k);a.ang=Math.atan2(c1[3]-c1[1],c1[2]-c1[0]);a.ext=1;rkSweep(a.x,a.y,a.r+16,0.5,80,rk.hits);}
      else if(t<0.6){if(at(0.3)){rk.hits=new Set();sfx('dash');rkMoveA(a,c2[0],c2[1]);}const k=(t-0.3)/0.3;rkMoveA(a,c2[0]+(c2[2]-c2[0])*k,c2[1]+(c2[3]-c2[1])*k);a.ang=Math.atan2(c2[3]-c2[1],c2[2]-c2[0]);a.ext=1;rkSweep(a.x,a.y,a.r+16,0.5,80,rk.hits);}
      else{if(at(0.72)){sfx('slash');S.shake=14;S.flash=0.2;for(const ang of [rk.ang+Math.PI/4,rk.ang-Math.PI/4,rk.ang+Math.PI*0.75,rk.ang-Math.PI*0.75])fx.push({arc:true,x:qx,y:qy,a:ang,r:rk.info.rad+60,w:0.45,t:0,life:0.5});rkSweep(qx,qy,rk.info.rad,3.0,360,null);pop(qx,qy-30,'ズバッ！','#c8452d',true);}if(t>1.05)rkEnd();}
      break;}
    case 'shippu':{ /* the follower zig-zags, knocking foes into the boss's jaws — the boss bites where it stands */
      const fx0=ox+dx*46,fy0=oy+dy*46;
      if(at(0.01)){rk.list=rkFoes().filter(e=>Math.hypot(e.x-qx,e.y-qy)<360).sort((x,y)=>Math.hypot(x.x-qx,x.y-qy)-Math.hypot(y.x-qx,y.y-qy)).slice(0,7);rk.k=0;rk.lt=0;}
      if(rk.k<rk.list.length){rk.lt-=DT;if(rk.lt<=0){const e=rk.list[rk.k++];rk.lt=0.09;if(!e.dead){fx.push({grab:true,x:a.x,y:a.y,a:Math.atan2(e.y-a.y,e.x-a.x),len:Math.hypot(e.x-a.x,e.y-a.y),t:0,life:0.3});rkMoveA(a,e.x,e.y);sfx('slash');rkHit(e,0.8,40,e.x,e.y);if(!e.T.boss&&!e.T.keeper&&!e.T.nushi){e.flyTo={x:fx0+rnd(-24,24),y:fy0+rnd(-24,24)};}}}}
      for(const e of rk.list||[])if(e.flyTo&&!e.dead){e.x+=(e.flyTo.x-e.x)*Math.min(1,DT*8);e.y+=(e.flyTo.y-e.y)*Math.min(1,DT*8);}
      const done=0.09*(rk.list||[]).length+0.3;
      if(t>done&&!rk.bit){rk.bit=true;P.biteT=0.3;sfx('crit');S.shake=14;S.hitstop=0.12;pop(fx0,fy0-40,'ガブッ！','#c8452d',true);rkSweep(fx0,fy0,rk.info.rad,3.0,520,null);for(const e of rk.list||[])e.flyTo=null;}
      if(t>done+0.5)rkEnd();break;}
    case 'mawari':{ /* the tough follower rams back and forth down the line; the boss is the anchor */
      if(at(0.01)){a.guardT=6;a.taunt=6;sfx('clink');}
      const seg=0.24,n=Math.floor(t/seg),k=(t%seg)/seg,out=n%2===0;
      if(n<6){if(k<DT/seg+0.001){rk.hits=new Set();sfx('dash');if(n>0){sfx('clink');S.shake=8;}}const ax=ox+dx*30,ay=oy+dy*30,f0x=out?ax:qx,f0y=out?ay:qy,tx=out?qx:ax,ty=out?qy:ay;rkMoveA(a,f0x+(tx-f0x)*k,f0y+(ty-f0y)*k);a.ang=Math.atan2(ty-f0y,tx-f0x);
        for(const e of rkFoes()){if(rk.hits.has(e))continue;if(Math.hypot(e.x-a.x,e.y-a.y)<e.r+a.r+20){rk.hits.add(e);rkHit(e,0.9,300,a.x,a.y);}}}
      else{P.inv=Math.max(P.inv,3);if(t>6*seg+0.25)rkEnd();}
      break;}
    case 'tobi':{ /* the follower vaults off the curled boss and comes down like a meteor, then bounces on */
      if(t<0.3){rkMoveA(a,ox-dx*20,oy-dy*20);a.ang=rk.ang;P.ball+=0.6;}
      else{if(at(0.3)){sfx('hop');S.shake=6;rk.bx=ox;rk.by=oy;rk.b=0;rk.bt=0;rk.L=[rk.info.len,130,90];}
        rk.bt+=DT;const L=rk.L[rk.b],dur=rk.b===0?0.55:0.3,k=Math.min(1,rk.bt/dur);rkMoveA(a,rk.bx+dx*L*k,rk.by+dy*L*k);a.z=Math.sin(k*Math.PI)*(rk.b===0?110:40);fx.push({x:a.x,y:a.y-a.z,vx:0,vy:0,t:0,life:0.3,c:'#f2b632'});
        if(k>=1){a.z=0;rkBoom(a.x,a.y,rk.b===0?140:90,rk.b===0?2.6:1.2,rk.b===0?600:360);rk.b++;rk.bt=0;rk.bx=a.x;rk.by=a.y;if(rk.b>=3)rkEnd();}}
      break;}
    case 'rinpun':{ /* a scale tornado travels down the aim line and drags foes in */
      const L=rk.info.len,k=Math.min(1,t/1.4),tx=ox+dx*L*k,ty=oy+dy*L*k;rk.tw={x:tx,y:ty};a.z=16;a.x=tx+Math.cos(t*12)*40;a.y=ty+Math.sin(t*12)*40;
      for(let i=0;i<3;i++){const an=t*14+i*2.1;fx.push({x:tx+Math.cos(an)*rnd(20,60),y:ty+Math.sin(an)*rnd(20,60),vx:-Math.sin(an)*120,vy:Math.cos(an)*120,t:0,life:0.5,c:pick(['#f4a6c4','#fff3c4','#cfe8c0'])});}
      rk.tickT=(rk.tickT||0)-DT;if(rk.tickT<=0&&t<1.4){rk.tickT=0.2;for(const e of rkFoes()){const d=Math.hypot(e.x-tx,e.y-ty);if(d<140+e.r){rkHit(e,0.3,10,tx,ty);if(!e.T.boss&&!e.T.keeper&&!e.T.nushi){e.x+=(tx-e.x)*0.35;e.y+=(ty-e.y)*0.35;}}}}
      if(at(1.45)){a.z=0;rkBoom(tx,ty,150,1.6,560);clouds.push({x:tx,y:ty,r:150,t:0,life:3,kind:'allydust',dmg:rk.B*0.25});}
      if(t>1.8)rkEnd();break;}
  }
  if(ALLY&&!ALLY.dead)allyFenceClamp(ALLY);
}
function rkEnd(){
  const rk=S.rk;if(!rk)return;S.rk=null;P.z=0;P.inv=Math.max(P.inv,0.8);if(ALLY){ALLY.z=0;collide(ALLY,ALLY.r,{});}
  const h=rkDuoFollow(rk)?null:rk.helper;if(h){const T2=TYPES[h.type],st2=allyStats(h),tg=rkFoes().sort((x,y)=>Math.hypot(x.x-P.x,x.y-P.y)-Math.hypot(y.x-P.x,y.y-P.y))[0];S.cameo={type:h.type,T:T2,x:P.x-W0(),y:P.y-200,tx:tg?tg.x:P.x+40,ty:tg?tg.y:P.y,t:0,dmg:st2.dmg*3*(rk.mul||1)*(rk.buddy?1.5:1),name:h.name};DEX.renkei2=true;saveDex();}
}
function W0(){return 420;}
function updateCameo(){
  const c=S.cameo;if(!c)return;c.t+=DT;
  const k=clamp(c.t/0.45,0,1);c.x+=(c.tx-c.x)*Math.min(1,DT*9);c.y+=(c.ty-c.y)*Math.min(1,DT*9);c.ang=Math.atan2(c.ty-c.y,c.tx-c.x);c.walk=(c.walk||0)+DT*30;
  if(!c.hit&&c.t>0.45){c.hit=true;S.shake=10;sfx('crit');fx.push({ring:true,x:c.tx,y:c.ty,r:120,t:0,life:0.35});pop(c.tx,c.ty-40,c.name.split(' ').pop()+'、参上！','#5f7d3a',true);
    for(const e of E)if(!e.dead&&e.state!=='den'&&e.state!=='seat'&&e.T.ai!=='sumo'&&Math.hypot(e.x-c.tx,e.y-c.ty)<e.r+120)damageEnemy(e,c.dmg,c.tx,c.ty,500,0,{force:true});}
  if(c.t>1.6)S.cameo=null;
}
/* ---------------- sumo (rare) ---------------- */
function updateSumoFoe(e){
  const R=MAP.sumo;if(!R)return;
  if(Math.hypot(P.x-R.x,P.y-R.y)<R.R+500&&!S.seenSumo){S.seenSumo=true;banner('土俵だ！','めったに 会えない 相撲好きが いる');}
  if(!S.sumo){
    e.x+=(R.x-e.x)*0.05;e.y+=(R.y-e.y)*0.05;e.vx=e.vy=0;e.ang+=angDiff(e.ang,Math.atan2(P.y-e.y,P.x-e.x))*0.05;
    const pin=Math.hypot(P.x-R.x,P.y-R.y)<R.R-10;
    if(pin&&!S.talk&&S.sumoCool<=0&&!S.bossBar){S.sumoCool=3;say([{who:e.T.name,text:'おう、一番 とってくかい？ 土俵から 押し出したら 勝ちだ。'},{who:e.T.name,text:'かむのは なしだぜ。体当たりと 突進だけで 来な！ 子分は 外で 見てな。'}],()=>{P.x=R.x;P.y=R.y+R.R*0.5;P.vx=P.vy=0;e.x=R.x;e.y=R.y-R.R*0.5;S.sumo={e,t:0};music.play('matsuri');banner('はっけよい！','押し出せ！');});}
    return;
  }
  const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;
  e.ang+=angDiff(e.ang,Math.atan2(dy,dx))*Math.min(1,DT*6);
  e.hopT=(e.hopT||1)-DT;
  const pw=1+0.04*(e.lv-P.lv);
  if(e.hopT<=0){e.hopT=rnd(1.0,1.7);const k=(280+e.lv*6)*clamp(pw,0.7,1.6);e.vx+=dx/d*k;e.vy+=dy/d*k;sfx('hop');}
  else{e.vx+=(dx/d*(90+e.lv*3)-e.vx)*DT*3;e.vy+=(dy/d*(90+e.lv*3)-e.vy)*DT*3;}
  const ox=e.x-R.x,oy=e.y-R.y,od=Math.hypot(ox,oy);if(od>R.R*0.55){e.vx-=ox/od*130*DT*4;e.vy-=oy/od*130*DT*4;}
  e.x+=e.vx*DT;e.y+=e.vy*DT;e.vx*=0.985;e.vy*=0.985;e.walk+=DT*Math.hypot(e.vx,e.vy)*0.12;
}
function sumoContact(){
  const s=S.sumo,e=s.e,R=MAP.sumo;s.t+=DT;
  const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||0.01,m=ST.r+e.r;
  if(d<m){
    const nx=dx/d,ny=dy/d,ov=m-d;
    const heavy=(1-Math.min(1,ST.def))*2.4;
    const mp=1+(P.rolled?1.2:0)+(P.dashT>0?0.8:0)+heavy+P.lv*0.03,me=1.6+e.lv*0.035;
    P.x-=nx*ov*me/(mp+me);P.y-=ny*ov*me/(mp+me);e.x+=nx*ov*mp/(mp+me);e.y+=ny*ov*mp/(mp+me);
    const rv=(e.vx-P.vx)*nx+(e.vy-P.vy)*ny;
    if(rv<0){const j=-1.5*rv/(1/mp+1/me);P.vx-=j*nx/mp;P.vy-=j*ny/mp;e.vx+=j*nx/me;e.vy+=j*ny/me;if(Math.abs(rv)>120){sfx('thud');S.shake=5;}}
  }
  const pOut=Math.hypot(P.x-R.x,P.y-R.y)>R.R+4,eOut=Math.hypot(e.x-R.x,e.y-R.y)>R.R+4;
  if(eOut||pOut||s.t>45){
    S.sumo=null;music.play(AREA().bgm);
    if(eOut&&!pOut){
      e.dead=true;sfx('fanfare');S.stats.sumo++;tot('sumo',1);DEX.bugs.sumou=(DEX.bugs.sumou||0)+1;saveDex();
      /* prize: a rare part from this area */
      const pool=AREA().mobs.map(m=>TYPES[m[0]].drop).filter(Boolean).concat(AREA().keepers.map(k=>TYPES[k].drop));
      const dd=pick(pool),p=mkPart(dd[0],dd[1],1.6);dropItem(R.x,R.y,p);
      banner('押し出し！','ほうびに 「'+partName(p)+'」');diary('土俵で 相撲好きの コガネに 勝った。');
      say([{who:e.T.name,text:'まいった！ いい当たりだ。ほうびを もっていきな。'},{who:e.T.name,text:'また どこかの 土俵で 会おうぜ。'}]);
      addXP(60+areaLv()*12,R.x,R.y-40);
    }else{banner(pOut?'押し出された…':'ひきわけ','もう一度 土俵に 入ると 再挑戦できる');P.x=R.x;P.y=R.y+R.R+40;S.sumoCool=3;}
  }
}
/* ---------------- projectiles, clouds, hazards ---------------- */
function updateShots(){
  for(const s of shots){s.t+=DT;s.x+=s.vx*DT;s.y+=s.vy*DT;
    if(s.friendly){for(const e of E){if(e.dead||e.z>18||e.state==='den'||e.T.ai==='sumo')continue;if(Math.hypot(s.x-e.x,s.y-e.y)<e.r+6){damageEnemy(e,s.dmg,s.x,s.y,120);s.dead=true;break;}}}
    else{
      if(Math.hypot(s.x-P.x,s.y-P.y)<ST.r+6){s.dead=true;
        if(P.rolled){sfx('clink');pop(P.x,P.y-18,'ぷちっ',INK);}
        else{const k=s.kind;hurtPlayer(enemyDmg(s.from,s.mul||(k==='sting'?0.9:k==='honey'?0.45:0.6)),null,{slow:k==='web'?2:k==='honey'?1.5:0,poison:k==='sting'?4:0,src:k});if(k==='web')pop(P.x,P.y-34,'ねばねば…',INK);if(k==='honey'){clouds.push({x:P.x,y:P.y,r:50,t:0,life:4,kind:'honey'});}}}
      else{for(const A of allies())if(Math.hypot(s.x-A.x,s.y-A.y)<A.r+6){s.dead=true;hurtAlly(A,enemyDmg(s.from,0.5),null);break;}}
    }
    if(s.t>1.6||blocked(s.x,s.y,0))s.dead=true;}
  shots=shots.filter(s=>!s.dead);
}
function updateClouds(){
  for(const c of clouds){c.t+=DT;const inP=Math.hypot(P.x-c.x,P.y-c.y)<c.r;
    if(c.kind==='hostgas'||c.kind==='spore'||c.kind==='dust'){
      if(inP&&!P.rolled){P.slowT=Math.max(P.slowT,0.4);c.tick=(c.tick||0)-DT;if(c.tick<=0){c.tick=0.5;hurtPlayer(ST.maxhp*0.035+areaLv()*0.6,null,{poison:c.kind==='spore'?3+areaLv()*0.3:0,src:c.kind});}}
      {const inA=allies().filter(A=>Math.hypot(A.x-c.x,A.y-c.y)<c.r);if(inA.length){c.atick=(c.atick||0)-DT;if(c.atick<=0){c.atick=0.5;for(const A of inA)hurtAlly(A,A.maxhp*0.05,null);}}}
    }else if(c.kind==='honey'){if(inP)P.slowT=Math.max(P.slowT,0.2);}
    else if(c.kind==='allyhoney'){for(const e of E){if(!e.dead&&Math.hypot(e.x-c.x,e.y-c.y)<c.r+e.r)e.slowT=0.4;}if(inP&&Math.random()<DT*2)healPlayer(ST.maxhp*0.01);}
    else if(c.kind==='webfield'){if(inP&&P.dashT<=0){P.slowT=Math.max(P.slowT,0.25);}}
    else if(c.kind==='allydust'){c.tick=(c.tick||0)-DT;for(const e of E){if(!e.dead&&Math.hypot(e.x-c.x,e.y-c.y)<c.r+e.r)e.slowT=0.4;}if(c.tick<=0){c.tick=0.5;for(const e of E){if(!e.dead&&e.state!=='den'&&Math.hypot(e.x-c.x,e.y-c.y)<c.r+e.r)damageEnemy(e,c.dmg,c.x,c.y,30);}}}
    else if(c.kind==='stink'){for(const e of E){if(!e.dead&&!e.T.boss&&!e.T.keeper&&e.T.ai!=='sumo'&&Math.hypot(e.x-c.x,e.y-c.y)<c.r){e.state='flee';e.fleeT=Math.max(e.fleeT,1);}}}
    else if(c.kind==='gas'){c.tick=(c.tick||0)-DT;if(c.tick<=0){c.tick=0.4;for(const e of E){if(!e.dead&&e.z<18&&Math.hypot(e.x-c.x,e.y-c.y)<c.r+e.r)damageEnemy(e,4+P.lv*1.2,c.x,c.y,40,0,{force:false});}}}
  }
  clouds=clouds.filter(c=>c.t<c.life);
  for(const t of trails){t.t+=DT;t.tick=(t.tick||0)-DT;if(t.tick<=0){t.tick=0.3;for(const e of E){if(!e.dead&&e.z<18&&Math.hypot(e.x-t.x,e.y-t.y)<e.r+12){e.poisonT=2.5;e.poisonD=Math.max(e.poisonD,ST.poison*0.6+3);}}}}
  trails=trails.filter(t=>t.t<t.life);
  for(const w of waves){w.t+=DT;if(!w.done&&w.t>0.05){w.done=true;for(const e of E){if(!e.dead&&e.z<18&&!e.T.boss&&Math.hypot(e.x-w.x,e.y-w.y)<e.r+44){damageEnemy(e,ST.dashDmg*0.4,w.x,w.y,360,0,{player:true});}}}}
  waves=waves.filter(w=>w.t<w.life);
}
function updateHazards(){
  const M=MAP;
  for(const w of M.webs){if(w.cut){w.cut+=DT*2;if(w.cut>1){w.cut=0;w.regrow=12;}}if(w.regrow){w.regrow-=DT;if(w.regrow<=0)w.regrow=0;}}
  for(const m of M.shrooms){m.cd-=DT;m.puff=Math.max(0,m.puff-DT);const d=Math.hypot(P.x-m.x,P.y-m.y);if(m.cd<=0&&d<150){m.cd=rnd(3.5,5);m.puff=0.5;clouds.push({x:m.x+rnd(-20,20),y:m.y+rnd(-20,20),r:85,t:0,life:2.6,kind:'spore'});sfx('spore');}}
  for(const f of M.frogs){f.t-=DT;f.cd-=DT;
    if(f.st==='hide'){const d=Math.hypot(P.x-f.x,P.y-f.y);if(d<190&&f.cd<=0&&!S.talk&&S.state==='play'){f.st='warn';f.t=0.9;f.ang=Math.atan2(P.y-f.y,P.x-f.x);sfx('frog');pop(f.x,f.y-24,'ゲコッ',INK);}}
    else if(f.st==='warn'){f.ang+=angDiff(f.ang,Math.atan2(P.y-f.y,P.x-f.x))*DT*2;if(f.t<=0){f.st='tongue';f.t=0.25;f.hit=false;sfx('tongue');}}
    else if(f.st==='tongue'){
      if(!f.hit){const mx=f.x+Math.cos(f.ang)*20,my=f.y+Math.sin(f.ang)*20,ex=f.x+Math.cos(f.ang)*f.len,ey=f.y+Math.sin(f.ang)*f.len;
        if(segDist(P.x,P.y,mx,my,ex,ey)<ST.r+8){f.hit=true;if(hurtPlayer(ST.maxhp*0.18+areaLv(),null,{})){P.vx=(f.x-P.x)*2;P.vy=(f.y-P.y)*2;pop(P.x,P.y-30,'ペロッ！','#c8452d',true);}}
        for(const e of E){if(!e.dead&&!e.T.boss&&!e.T.keeper&&e.T.ai!=='sumo'&&segDist(e.x,e.y,mx,my,ex,ey)<e.r+6){e.dead=true;corpses.push({e,t:0});pop(e.x,e.y-14,'パクッ',INK);}}}
      if(f.t<=0){f.st='hide';f.cd=rnd(4,7);}}
  }
  updateBird();
}
function updateBird(){
  if(!AREA().bird||S.dojo)return;const b=S.bird;b.t-=DT;
  if(b.st==='idle'&&b.t<=0&&!S.bossBar&&!S.sumo){b.st='warn';b.t=1.6;b.y=P.y+rnd(-40,40);b.dir=Math.random()<0.5?1:-1;b.x=b.dir>0?P.x-760:P.x+760;sfx('bird');pop(P.x,P.y-50,'鳥だ！ まるまれ！','#c8452d',true);}
  else if(b.st==='warn'&&b.t<=0){b.st='pass';b.t=1.5;}
  else if(b.st==='pass'){
    b.x+=b.dir*1050*DT;
    if(Math.abs(b.x-P.x)<90&&Math.abs(b.y-P.y)<80&&!P.rolled&&P.inv<=0){hurtPlayer(ST.maxhp*0.3,null,{unblockable:true});S.shake=10;}
    for(const A of allies())if(Math.abs(b.x-A.x)<90&&Math.abs(b.y-A.y)<80)hurtAlly(A,A.maxhp*0.3,null);
    for(const e of E){if(e.dead||e.T.boss||e.T.keeper||e.z>18||e.T.ai==='sumo')continue;if(Math.abs(b.x-e.x)<80&&Math.abs(b.y-e.y)<70){e.dead=true;corpses.push({e,t:0});pop(e.x,e.y-14,'パクッ',INK);}}
    if(b.t<=0){b.st='idle';b.t=rnd(16,26);}
  }
}
function separate(){
  const all=[P];for(const A of allies())if(A.z<18)all.push(A);
  for(const e of E)if(!e.dead&&e.z<18&&e.state!=='leaping'&&e.state!=='under'&&!(S.sumo&&e===S.sumo.e))all.push(e);
  const pass=P.dashT>0&&ST.combos.includes('ootobi');
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
    const a=all[i],b=all[j];if(pass&&(a===P||b===P))continue;
    const ra=a===P?ST.r:a.r,rb=b.r,dx=b.x-a.x,dy=b.y-a.y;if(Math.abs(dx)>ra+rb||Math.abs(dy)>ra+rb)continue;const d=Math.hypot(dx,dy)||0.01,m=ra+rb;
    if(d<m){const am=(a.state==='seat'||a.state==='den'&&a.T&&a.T.boss)?0:1,bm=(b.state==='seat'||b.state==='den'&&b.T&&b.T.boss)?0:1;if(!am&&!bm)continue;
      const k=m-d,ux=dx/d,uy=dy/d,sum=am+bm;a.x-=ux*k*am/sum;a.y-=uy*k*am/sum;b.x+=ux*k*bm/sum;b.y+=uy*k*bm/sum;}
  }
}
function updateDay(){const d=dayNum();if(d===S.lastDay)return;S.lastDay=d;if(d===32)diary('8月が 終わった。夏休みも あと すこし。');}
function objective(){
  if(!MAP)return '';
  if(S.dojo)return 'けいこ場 ― 下の すみかへ もどると 終わる';
  if(S.challenge&&!S.bossDown)return '挑戦状：覚醒した 番長を たおせ（'+fmtTime(S.chalT)+'）';
  if(S.exit)return '光る 葉っぱの 道から 先へ すすもう';
  if(S.bossDown)return 'すみかから 別の場所へ 行ける';
  if(!MAP.lair.open)return '門番を たおそう（'+S.keepersDown+' / 2）';
  return '番長の シマ（しめ縄の 中）へ 乗りこもう';
}
function allPartsCount(){let n=0;for(const sl of SLOTS)for(const id in PARTS[sl])if(!isDefault(sl,id)&&DEX.parts[id])n++;return n;}
function checkAch(){
  DEX.ach=DEX.ach||{};const t=DEX.tot||{},kills=Object.keys(DEX.bugs).reduce((s,k)=>s+(k==='sumou'?0:DEX.bugs[k]),0),nushi=Object.keys(DEX.nushi||{}).length,combos=Object.keys(DEX.combos).length;
  const parts=[P.eq.head,P.eq.legs,P.eq.tail,P.eq.back,...S.store];
  const invN=Object.keys(DEX.bugs).filter(k=>k.startsWith('inv_')).length;
  const cond={feud3:(t.feuds||0)>=3,blood:Object.keys(DEX.bloods||{}).length>=1,trophy3:(S.trophies||[]).length>=3,push5:(t.pushWins||0)>=5,quest10:(t.quests||0)>=10,net3:(t.netDodge||0)>=3,dig5:(t.digs||0)>=5,squad5:(t.squads||0)>=5,ball30:(t.ballHits||0)>=30,duo1:!!DEX.duoWalked,gattai:!!DEX.gattai,just10:(t.just||0)>=10,chain50:(t.chain||0)>=50,tboss1:Object.keys(DEX.tboss||{}).length>=1,dango:(t.dango||0)>=1,pair3:Object.keys(DEX.pairs||{}).length>=3,themes:Object.keys(DEX.themes||{}).length>=3,kizuna3:(DEX.kizuna||0)>=3,gimmick:(t.gimmick||0)>=10,invader:invN>=3,invader7:invN>=7,pitari:(t.pitari||0)>=10,first:kills>=1,k100:kills>=100,k500:kills>=500,k1500:kills>=1500,keeper:Object.keys(DEX.bugs).some(k=>TYPES[k]&&TYPES[k].keeper),boss1:!!DEX.bugs.osa,boss4:S.cleared.length>=4,
    ending:DEX.clears>=1,ng:S.cycle>=1,ng2:!!DEX.ngClear,fast:!!DEX.best&&DEX.best<=12,nodeath:!!DEX.nodeath,crit:(t.crits||0)>=100,heavy:(t.maxHit||0)>=300,
    combo1:combos>=1,combo6:combos>=6,comboAll:combos>=COMBOS.length,legend:!!DEX.legend,lucky:Object.keys(DEX.rare||{}).length>0,star5:parts.some(p=>p.st>=5),parts:allPartsCount()>=20,
    ally:!!DEX.allyEver,skill:!!DEX.allySkill,master:!!DEX.allyMaster,allyLv:S.roster.some(r=>r.lv>=30),sumo1:(t.sumo||0)>=1,sumo3:(t.sumo||0)>=3,
    nushi1:nushi>=1,chal1:Object.keys(DEX.chal||{}).length>=1,chalAll:Object.keys(DEX.chal||{}).length>=7,yofukashi:(t.nightKills||0)>=30,yudachi:!!DEX.yudachi,dojo:!!DEX.dojoCombo,renkei:!!DEX.renkei,renkei2:!!DEX.renkei2,patterns:(t.blocks||0)>=10,nushi4:nushi>=4,nushiAll:nushi>=7,elite:(t.elites||0)>=30,dex:DEX_ORDER.filter(k=>DEX.bugs[k]).length>=45,lv30:P.lv>=30,lv50:P.lv>=50};
  for(const a of ACHS){if(!DEX.ach[a.id]&&cond[a.id]){DEX.ach[a.id]=dateStr()+(S.cycle?'（'+(S.cycle+1)+'年目）':'');saveDex();
    const u=UIH();if(u&&HAS_DOM&&u.achieve)u.achieve(a);sfx('fanfare');diary('称号「'+a.name+'」を 手に入れた。');}}
}
function objectiveTarget(){
  if(!MAP||S.dojo)return null;
  if(S.exit)return {x:S.exit.x,y:S.exit.y};
  if(S.bossDown)return null;
  if(!MAP.lair.open){let best=null,bd=1e9;for(const a of MAP.arenas){if(a.beaten)continue;const d=Math.hypot(a.x-P.x,a.y-P.y);if(d<bd){bd=d;best=a;}}return best?{x:best.x,y:best.y}:null;}
  const L=MAP.lair;return inLair(P.x,P.y)?null:{x:L.x,y:L.y+L.R};
}
/* ---------------- main step ---------------- */
function step(){
  S.t+=DT;ART_T=S.t;
  if(S.state==='ending'){updateEnding();tickFx();return;}
  if(S.cutin){S.cutin.t+=DT;if(S.cutin.t>1.6)S.cutin=null;tickFx(true);return;}
  if(S.hitstop>0){S.hitstop-=DT;tickFx(true);return;}
  if(S.rk&&S.rk.ph==='aim'&&S.state==='play'&&!S.talk){updateRkAim();tickFx(true);return;}
  if(S.mg&&S.state==='play'){mgTick();tickFx(true);return;}
  const active=S.state==='play'&&!S.talk;
  if(active){
    S.time+=DT;S.playT+=DT;S.sumoCool-=DT;S.autosave+=DT;if(S.autosave>45){S.autosave=0;writeSave();}
    refreshStats();
    if(S.rk){P.inv=Math.max(P.inv,0.3);rkTick();}else{updatePlayer();if(S.state!=='play'){tickFx();return;}}
    windTick();bgTick();tickBond();themeTick();dangoTick();duoTick();chainTick();rosterTick();ballTick();netTick();digTick();qEnsure();feudTick();predTick();tavernTick();bloodCheck();
    for(const e of E)if(!e.dead)updateEnemy(e);
    if(ALLY&&!ALLY.dead&&!S.rk)updateAlly(ALLY);
    if(ALLY2&&!ALLY2.dead&&!S.rk)updateAlly(ALLY2);
    if(S.sumo)sumoContact();
    updateCameo();
    if(inp.combo){inp.combo=false;unleashCombo();}
    separate();updateShots();updateClouds();updateHazards();updateDay();
    E=E.filter(e=>!e.dead);
    if(MAP.lair.open&&MAP.lair.openT<1)MAP.lair.openT+=DT*0.8;
    const mobs=E.filter(e=>!e.T.boss&&!e.T.keeper&&e.T.ai!=='sumo').length;
    S.respawnT=(S.respawnT||0)-DT;if(!S.dojo&&S.respawnT<=0&&mobs<AREA().mobN*0.75*(isRain()?0.7:1)*themeMobMul()){S.respawnT=1.4;spawnMob(true);}
    if(!S.dojo&&Math.random()<DT*0.4&&foods.length<Math.round(MAP.w*MAP.h/150000*themeFoodMul()))spawnFood();
    S.achT=(S.achT||0)+DT;if(S.achT>1){S.achT=0;checkAch();}
    updateSky();if(S.challenge&&!S.bossDown)S.chalT+=DT;
    if(S.dojo){S.bond=Math.min(100,(S.bond||0)+(ALLY&&!ALLY.dead?DT*8:0));}
    if(S.exit){S.exit.t+=DT;if(S.exit.t>1.2&&Math.hypot(P.x-S.exit.x,P.y-S.exit.y)<40){S.exit=null;showClear();}}
  }else inp.bite=false;
  tickFx();
}
function tickFx(frozen){
  for(const p of pops)p.t+=DT;pops=pops.filter(p=>p.t<0.95);
  for(const f of fx){f.t+=DT;if(!f.arc&&!f.ring&&!f.grab&&!frozen){f.x+=f.vx*DT;f.y+=f.vy*DT;f.vx*=0.92;f.vy*=0.92;}}fx=fx.filter(f=>f.t<f.life);
  for(const c of corpses)c.t+=DT;corpses=corpses.filter(c=>c.t<0.9);
  if(S.flash>0)S.flash=Math.max(0,S.flash-DT*1.2);
  S.shake*=0.85;
  if(P&&S.state!=='ending'){
    /* calm camera: a gentle look-ahead from the stick only while walking, a small dead zone, and a softer follow while rolling or dashing */
    const walking=P.dashT<=0&&!P.rolled&&S.state==='play';
    const lt=walking?[inp.x*55,inp.y*55]:[S.lookX||0,S.lookY||0];
    S.lookX=(S.lookX||0)+(lt[0]-(S.lookX||0))*Math.min(1,DT*1.6);S.lookY=(S.lookY||0)+(lt[1]-(S.lookY||0))*Math.min(1,DT*1.6);
    const gx=P.x+S.lookX,gy=P.y+S.lookY,dx=gx-S.cam.x,dy=gy-S.cam.y,dist=Math.hypot(dx,dy),dz=14;
    if(dist>dz){const rate=P.dashT>0||P.rolled?2.6:4.2,k=1-Math.exp(-DT*(dist>170?rate*1.8:rate)),m=(dist-dz)/dist;S.cam.x+=dx*m*k;S.cam.y+=dy*m*k;}
  }
}

/* ---------------- flow ---------------- */
function snapSave(){return {v:1,areaI:S.areaI,cycle:S.cycle,time:S.time,playT:S.playT,lv:P.lv,xp:P.xp,eq:P.eq,store:S.store,roster:S.roster,allyI:S.allyI,allyJ:S.allyJ??-1,cleared:S.cleared,unlocked:S.unlocked,diary:S.diary,stats:S.stats,uid:S.uid,firstClear:S.firstClear,keeperWins:S.keeperWins||{},nushiMiss:S.nushiMiss||{},theme:S.theme||null,dango:S.dango||0,dangoT:S.dangoT||0,pairDone:S.pairDone||{},order:S.order||'atk',quests:S.quests||null,trophies:S.trophies||[],tavDone:S.tavDone||{},qDay:S.qDay||0,qArea:S.qArea??-1};}
function writeSave(){if(!P||S.state==='title')return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(snapSave()));}catch(e){}}
function readSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(s&&s.v===1&&s.eq)return s;}catch(e){}return null;}
function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
function applySave(s){
  P=newPlayer();P.lv=s.lv;P.xp=s.xp;P.eq=s.eq;for(const sl of SLOTS){if(!P.eq[sl])P.eq[sl]=defPart(sl);P.eq[sl].tr=P.eq[sl].tr||[];}
  Object.assign(S,{areaI:s.areaI,cycle:s.cycle||0,time:s.time||0,playT:s.playT||0,store:s.store||[],roster:s.roster||[],allyI:s.allyI??-1,allyJ:s.allyJ??-1,cleared:s.cleared||[],unlocked:s.unlocked||0,diary:s.diary||{},stats:Object.assign(S.stats,s.stats||{}),uid:s.uid||1000,firstClear:s.firstClear||{},keeperWins:s.keeperWins||{},nushiMiss:s.nushiMiss||{},theme:s.theme||((s.cycle||0)>=2?'taifu':null),dango:s.dango||0,dangoT:s.dangoT||0,pairDone:s.pairDone||{},order:s.order||'atk',quests:s.quests||null,trophies:s.trophies||[],tavDone:s.tavDone||{},qDay:s.qDay||0,qArea:s.qArea??-1});
  ensureAllyRolls();refreshStats();
}
function resetRun(){
  P=newPlayer();Object.assign(S,{theme:null,dango:0,dangoT:0,pairDone:{},time:0,playT:0,cycle:0,store:[],roster:[],allyI:-1,allyJ:-1,cleared:[],unlocked:0,diary:{},uid:1,firstClear:{},keeperWins:{},
    stats:{kills:0,bosses:0,sumo:0,crits:0,maxHit:0,parts:0,elites:0,deaths:0,combos:0}});refreshStats();
}
function enterArea(i,o){
  o=o||{};loadArea(i,o);S.state='play';S.lastDay=dayNum();
  if(!o.fromSave)diary(AREAS[i].name+'に 来た。');
  writeSave();music.play(AREA().bgm);
  const u=UIH();if(u)u.enterArea(o);S.stickGhostUntil=S.t+(i===0&&!o.fromSave&&S.cycle===0?20:0);
  const intro=!o.fromSave&&!S.cleared.includes(i)&&!S.firstClear['v'+i+'_'+S.cycle];
  S.firstClear['v'+i+'_'+S.cycle]=true;
  later(()=>{if(S.state!=='play')return;
    const lines=intro?(S.cycle>=1?ngIntro(i):o.afterOpening?AREA().intro.slice(-1):AREA().intro.slice()):[{who:'ダンゴムシ',text:'（'+AREA().name+'に 来た。'+(S.cleared.includes(i)?'番長たちが また 待ちかまえている。':dateStr()+'、夏は まだ ある）')}];
    if(MAP.sumo)lines.push({who:'？？？',text:'……どこかで「はっけよい」の かけ声が 聞こえる。'});
    if(S.nushiHere)lines.push({who:'',text:'……背すじが ぞくっとした。この場所の どこかに、ただならぬ 気配が ある。'});
    say(lines);},900);
}
function ngIntro(i){const A=AREAS[i],K=TYPES['inv_'+A.id];return [{who:'ダンゴムシ',text:'（'+A.name+'にも、よそ者の においが する……）'},{who:'',text:'門番の ひとりが、よそ者の 頭「'+(K?K.name:'？？？')+'」に 入れかわっている。'},{who:'ダンゴムシ',text:'（番長だけじゃ ない。この林を、よそ者から 取り返すんだ）'},...themeAreaLines()];}
function newGame(){resetRun();rollSummerTheme();S.tutRun=true;S.order='atk';if(typeof UI!=='undefined')UI.co=null;startOpening(0);}
function continueGame(){const s=readSave();if(!s){newGame();return;}applySave(s);enterArea(Math.min(s.areaI,AREAS.length-1),{fromSave:true});}
function nextSummer(){
  const s=readSave();if(s)applySave(s);
  S.cycle++;S.cleared=[];S.unlocked=0;S.time=0;S.diary={};S.firstClear={};
  rollSummerTheme();
  for(const r of S.roster){r.faint=false;r.restT=0;r.hpFrac=1;}
  diary('また 夏が きた。'+(S.cycle+1)+'年目の 夏だ。林に よそ者が 入ってきた。');
  startOpening(S.cycle);
}
function travelTo(i,o){if(i>S.unlocked&&!S.cleared.includes(i))return;writeSave();enterArea(i,o);}
function showClear(){
  S.state='clear';sfx('clear');music.play('victory');writeSave();
  const u=UIH();if(u&&HAS_DOM)u.clear();
}
function rankOf(d){return d<=12?'伝説の番長':d<=20?'林の番長':d<=31?'夏の終わりの番長':'のんびり番長';}

/* ---------------- ending ----------------
   scenes cross-fade through black; some open on a title card; lines type out */
const END={scene:0,t:0,line:0,fade:null,fadeT:0,cardT:0,shown:false,fireworks:[],leaves:[],parade:[],act:null,actT:0};
const BOSS_FAREWELL=[
  ['osa','地べたの番長 オサ','おめえが 地べたから 来たって こと、林じゅうに 言いふらしてやる。'],
  ['kamazo','草むらの番長 カマ蔵','……いい 切れ味だった。おめえの 夏にな。'],
  ['zari','赤鬼のザリ','からを もつ者どうし、誇りに 思うぞ。'],
  ['joou','ミツバチの女王','わらわの 子たちも、あなたの 話で もちきりよ。'],
  ['kuwagata','クワガタの兄貴','若頭を 越えたか。……まいった。'],
  ['suzume','スズメバチの姐さん','ふふ、いい顔に なったじゃない。']];
function endAlly(){const r=S.roster[S.allyI];return r||null;}
const END_SCENES=[
  {id:'fall',music:null,lines:c=>[
    {who:'',text:'……。'},
    {who:'カブトの若頭',text:c?'……また 負けか。':'……ちっ。'},
    {who:'カブトの若頭',text:c?'おめえ、去年より 強くなってやがる。番長の座は、今年も おめえの もんだ。':'負けたよ。番長の座は、おめえの もんだ。'}]},
  {id:'throne',music:'victory',lines:c=>[
    {who:'',text:'ダンゴムシは、ゆっくりと 大だまりへ 歩いていった。',act:'walk'},
    {who:'',text:'気づけば、林じゅうの 番長たちが あつまっていた。',act:'gather'},
    ...BOSS_FAREWELL.map(([id,who,text])=>({who,text,focus:id})),
    ...(c?[{who:'ヒアリの 女帝',text:'……この林の 虫は、こんなに つよいのね。わたしたちは、海の 向こうへ 帰るわ。'}]:[]),
    {who:'番長たち',text:'番長！ 番長！ 番長！',act:'chant'},
    {who:'ダンゴムシ',text:'（いちばん 奥の 樹液は、思っていたより ずっと 甘かった）'}]},
  {id:'matsuri',music:'matsuri',card:'その夜',lines:()=>{const a=endAlly();return [
    {who:'',text:'林で いちばん 大きな 夏祭りが ひらかれた。'},
    a?{who:a.name,text:'兄貴……おれ、兄貴に ついてきて ほんとに よかったです。'}:{who:'',text:'ひとりで 来た 夏だった。でも、もう ひとりじゃない。'},
    {who:'',text:'ドーン……ドーン……遠くで 人間の 花火が 上がっていた。'},
    {who:'ダンゴムシ',text:'（地べたで 丸まっていた ころが、ずっと 昔の ことみたいだ）'}];}},
  {id:'autumn',music:'ending',card:'九月',lines:()=>[
    {who:'',text:'カナカナカナ……ヒグラシが 鳴いている。風が 少しだけ 冷たい。'},
    {who:'カブトの若頭',text:'来年の夏、また 取り返しに 来るぜ。',act:'leave'},
    {who:'カブトの若頭',text:'……それまで、座を あたためときな。番長。'},
    {who:'',text:'夏が 終わると、虫たちは それぞれの 冬じたくを はじめる。'}]},
  {id:'diary',music:'ending',lines:()=>{const kills=S.stats.kills,hp=P.eq.head,hn=isDefault('head',hp.id)?'ちいさな口':PARTS.head[hp.id].name;return [
    {who:'',text:dateStr()+'。ぼくは 林の 番長に なった。'},
    {who:'',text:'たおした 虫は '+kills+'ひき。いちばん たよりに なったのは「'+hn+'」。'},
    ...(S.finalPrize?[{who:'',text:'若頭の「'+S.finalPrize[0]+'」は、すみかに かざってある。'}]:[]),
    ...(theme()?[{who:'',text:'ぼくの 夏は「'+themeName()+'」だった。'}]:[]),
    {who:'',text:'ひと夏の 番長。それで、十分だ。'}];}},
  {id:'parade',music:'title',lines:()=>[]}
];
/* ---------------- opening (same scene engine as the ending) ---------------- */
function openScenes(cy){
  if(!cy)return [
    {id:'op_sky',music:'title',card:'八月一日',sub:theme()?THEMES[theme()].card:null,lines:()=>[
      {who:'',text:'ミーン ミン ミン ミン……'},
      {who:'',text:'夏休みが はじまった。'},
      {who:'',text:'林の まんなかに、大きな クヌギの 木が 立っている。',act:'tilt'}]},
    {id:'op_bar',music:'jueki',lines:()=>[
      {who:'',text:'幹から しみ出す 樹液の 酒場。林じゅうの 虫が あつまってくる。'},
      {who:'',text:'いちばん 奥の、いちばん 甘い だまり——「番長の座」。',act:'focus'},
      {who:'カブトの若頭',text:'がっはっは！ 今年の夏も、この座は おれの もんだ！',act:'laugh'}]},
    {id:'op_kick',music:'jueki',lines:()=>[
      {who:'',text:'そこへ、ちいさな ダンゴムシが やってきた。',act:'walk'},
      {who:'ダンゴムシ',text:'あ、あの……ひとくちだけ……。'},
      {who:'カブトの若頭',text:'ああん？ ダンゴムシが 樹液だと？'},
      {who:'カブトの若頭',text:'地べたで 丸まってな！',act:'flick'},
      {who:'虫たち',text:'わはははは！',act:'laughall'}]},
    {id:'op_ground',music:null,lines:()=>[
      {who:'',text:'ころころ ころ……',act:'land'},
      {who:'ダンゴムシ',text:'（……いたた）',act:'uncurl'},
      {who:'ダンゴムシ',text:'（見てろよ。夏が 終わるまでに、ぜったい あの座に すわってやる）',act:'resolve'}]}];
  const n=(cy+1)+'年目の 夏',th=cy>=2?theme():null,storm=th==='taifu';
  const TL={taifu:['ゴウゴウ……ザアアア……','その夏は、台風が 何度も 林を おそった。','番長の座にも、つよい 風が ふきつけていた。'],
    hideri:['ジリジリジリ……','その夏は、雨の ふらない 日が つづいた。','樹液だけが、いつもより 濃く 甘く にじんでいた。'],
    hotaru:['ホーゥ……ホーゥ……','その夏は、夜が とても 長かった。','林の 闇に、ホタルの 光が ゆれていた。'],
    ooame:['ザアアアア……','その夏は、雨が ずっと ふりつづいた。','ぬれた 地面は、よく すべる。'],
    taihatsu:['ザワザワザワ……','その夏は、林じゅうで 虫が 大発生した。','樹液酒場も、いつになく にぎわっていた。']};
  return [
    {id:'op_sky',music:'title',card:n,sub:theme()?THEMES[theme()].card:null,lines:()=>th?[
      {who:'',text:TL[th][0]},
      {who:'',text:TL[th][1]},
      {who:'',text:TL[th][2],act:'tilt'}]:[
      {who:'',text:'ミーン ミン ミン ミン……'},
      {who:'',text:'また、夏が きた。'},
      {who:'',text:'番長の座には、カブトの若頭が もどっていた。',act:'tilt'}]},
    {id:'op_bar',music:'jueki',lines:()=>[
      {who:'カブトの若頭',text:storm?'よう、番長。この風じゃ、座に しがみつくのも ひと苦労だぜ。':th?'よう、番長。今年の 夏は、ひと味 ちがうぜ。':'よう、去年の 番長。今年は そうは いかねえぞ。',act:'laugh'},
      {who:'',text:'そのとき——林の 外から、見なれない 赤い 行列が やってきた。',act:'invade'},
      {who:'ヒアリの 女帝',text:'甘い におい。この林の 樹液は、わたしたちが いただくわ。'},
      {who:'カブトの若頭',text:'な、なんだと……！？'}]},
    {id:'op_ground',music:null,lines:()=>{const a=endAlly();return [
      {who:'',text:'よそ者たちは、林の あちこちに ちらばっていった。',act:'uncurl'},
      a?{who:a.name,text:'兄貴、どうします！？'}:{who:'',text:'林の 虫たちが、ざわざわと さわいでいる。'},
      {who:'ダンゴムシ',text:'（よそ者に 林を あらされて たまるか。もう一度、地べたから てっぺんまで！）',act:'resolve'}];}}];
}
function endActSfx(a){if(!HAS_DOM)return;const f={flick:()=>later(()=>sfx('thud'),220),laughall:()=>sfx('drum'),land:()=>{sfx('roll');later(()=>sfx('thud'),350);},resolve:()=>later(()=>sfx('fanfare'),250),invade:()=>sfx('drum'),laugh:()=>sfx('roar')}[a];if(f)f();}
function startOpening(cy){
  S.state='ending';S.areaI=0;
  Object.assign(END,{list:openScenes(cy),mode:'open',scene:0,t:0,line:0,fade:'in',fadeT:0,cardT:0,shown:false,fireworks:[],leaves:[],parade:[],act:null,actT:0});
  const sc=END.list[0];END.cardT=sc.card?2.2:0;music.play(sc.music);
  const u=UIH();if(u&&HAS_DOM){u.ending(-1);if(u.openingStart)u.openingStart();}
  showEndLine(sc.card?2.4:1.0);
  if(!HAS_DOM){finishEnding();}
}
function skipOpening(){if(END.mode==='open'&&S.state==='ending'){const u=UIH();if(u){clearInterval(u.typeTm);u.typing=null;}finishEnding();}}
function startEnding(){
  S.state='ending';Object.assign(END,{list:END_SCENES,mode:'end',scene:0,t:0,line:0,fade:'in',fadeT:0,cardT:0,shown:false,fireworks:[],leaves:[],act:null,actT:0});
  const d=dayNum(),rank=rankOf(d);S.endRank=rank;
  DEX.clears=(DEX.clears||0)+1;if(!DEX.best||d<DEX.best)DEX.best=d;if(S.cycle>=1)DEX.ngClear=true;if(S.stats.deaths===0)DEX.nodeath=true;saveDex();checkAch();
  diary('番長の座に すわった。（'+rank+'）');
  if(!S.cleared.includes(S.areaI))S.cleared.push(S.areaI);
  writeSave();if(typeof amb!=='undefined')amb.set(null);if(typeof rain!=='undefined')rain.stop();
  END.parade=DEX_ORDER.filter(t=>DEX.bugs[t]||t==='kabuto');
  music.play(null);
  const u=UIH();if(u&&HAS_DOM)u.ending(-1);
  showEndLine(1.2);
}
function SCN(){return END.list||END_SCENES;}
function endingLines(){return SCN()[END.scene].lines(S.cycle>0);}
function showEndLine(delay){END.shown=false;END.wait=delay||0;}
function advanceEnding(){
  if(END.fade==='out'||END.cardT>0||!END.shown)return;
  const u=UIH();if(u&&u.typing&&u.typing.i<u.typing.text.length){u.finishTyping();return;}
  const lines=endingLines();
  END.line++;
  if(END.line>=lines.length){END.fade='out';END.fadeT=0;if(u)u.ending(-1);return;}
  const l=lines[END.line];if(l.act){END.act=l.act;END.actT=0;endActSfx(l.act);}
  if(u)u.ending(END.scene);
}
function updateEnding(){
  END.t+=DT;END.actT+=DT;
  if(END.fade){END.fadeT+=DT;
    if(END.fade==='out'&&END.fadeT>1.0){END.scene++;END.line=0;END.t=0;END.act=null;END.actT=0;
      if(END.scene>=SCN().length){finishEnding();return;}
      const sc=SCN()[END.scene];music.play(sc.music);END.fade='in';END.fadeT=0;END.cardT=sc.card?2.2:0;showEndLine(sc.card?2.4:0.9);
      const l0=sc.lines(S.cycle>0)[0];if(l0&&l0.act){END.act=l0.act;END.actT=0;endActSfx(l0.act);}}
    else if(END.fade==='in'&&END.fadeT>1.0)END.fade=null;}
  if(END.cardT>0)END.cardT-=DT;
  if(!END.shown){END.wait-=DT;if(END.wait<=0){END.shown=true;if(END.mode!=='open'&&END.scene===0&&END.t>0.5&&!music.name)music.play('ending');const lines=endingLines();const u=UIH();if(u&&lines.length)u.ending(END.scene);}}
  const sc=SCN()[END.scene];if(!sc)return;
  if(sc.id==='matsuri'&&Math.random()<DT*1.6){END.fireworks.push({x:rnd(0.15,0.85),y:rnd(0.1,0.36),t:0,c:pick(['#f2b632','#c8452d','#7ac0f0','#f4a6c4','#fffbe8','#9be07a']),n:Math.floor(rnd(18,30))});if(HAS_DOM)later(()=>sfx('firework'),300);}
  END.fireworks=END.fireworks.filter(f=>(f.t+=DT)<2.4);
  if((sc.id==='autumn'||sc.id==='diary')&&Math.random()<DT*(sc.id==='diary'?2:8))END.leaves.push({x:rnd(-0.1,1.1),y:-0.05,vx:rnd(-0.03,0.05),vy:rnd(0.05,0.1),a:rnd(0,TAU),va:rnd(-2,2),c:pick(['#d8823a','#c8452d','#e8b83a','#a86a2a'])});
  for(const l of END.leaves){l.x+=l.vx*DT+Math.sin(END.t*2+l.a)*0.0008;l.y+=l.vy*DT;l.a+=l.va*DT;}END.leaves=END.leaves.filter(l=>l.y<1.1);
  if(sc.id==='parade'&&END.t>END.parade.length*1.1+10&&!END.fade){END.fade='out';END.fadeT=0;}
}
function finishEnding(){if(S.state!=='ending')return;
  if(END.mode==='open'){const cy=S.cycle;END.list=null;END.mode=null;const u=UIH();if(u&&u.openingDone)u.openingDone();enterArea(0,{afterOpening:true});if(cy===0)diary('林の 番長の座に、すわってやると きめた。');return;}S.state='endcard';music.play('ending');const u=UIH();if(u)u.endCard();}
