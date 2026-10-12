'use strict';
/* =====================================================================
   ひと夏の番長 — v16: two followers (相性・コンビわざ・合体わざ),
   ジャストまるまる, れんげき, elite affixes, theme bosses, mild themes
   ===================================================================== */

/* ---------------- mild themes (every summer gets one) ---------------- */
const MILD_THEMES={
  semi:{name:'セミしぐれ',card:'〜セミしぐれ〜',desc:'セミの 声が にぎやか。経験値 +10%。'},
  asatsuyu:{name:'朝つゆ',card:'〜朝つゆ〜',desc:'昼の あいだ、体力が すこしずつ もどる。'},
  niwaka:{name:'にわか雨',card:'〜にわか雨〜',desc:'夕立が よく ふる。雨の間は めずらしい部位が 出やすい。'},
  hoshi:{name:'星空',card:'〜星空〜',desc:'夜が すこし 長く、夜は 部位が 落ちやすい。'},
  housaku:{name:'どんぐり豊作',card:'〜どんぐり豊作〜',desc:'たべものが 多い。'},
  kaze:{name:'風かおる',card:'〜風かおる〜',desc:'足どりが かるい（足 +8%）。'}
};
const MAJOR_KEYS=Object.keys(THEMES),MILD_KEYS=Object.keys(MILD_THEMES);
Object.assign(THEMES,MILD_THEMES);
theme=function(){return S.theme||null;};
pickTheme=function(){const pool=S.cycle>=2?MAJOR_KEYS:MILD_KEYS;return pick(pool.filter(k=>k!==S.theme));};
function rollSummerTheme(){S.theme=pickTheme();DEX.themes=DEX.themes||{};DEX.themes[S.theme]=true;saveDex();}
function themeName(){const t=theme();return t?THEMES[t].name+'の 夏':'';}
const _xpMul=themeXpMul;themeXpMul=function(){return _xpMul()*(theme()==='semi'?1.1:1);};
const _dropB=themeDropBonus;themeDropBonus=function(){return _dropB()+(theme()==='hoshi'&&isNight()?0.15:0);};
const _phase=themePhase;themePhase=function(f){if(theme()==='hoshi')return f<0.52?'day':f<0.6?'dusk':f<0.95?'night':'dawn';return _phase(f);};
function themeFoodMul(){return theme()==='housaku'?1.7:1;}
function themeSpeedMul(){return theme()==='kaze'?1.08:1;}
function themeRainCh(){const t=theme();return t==='ooame'?0.95:t==='taifu'?0.4:t==='hideri'?0.03:t==='niwaka'?0.38:0.18;}
const _tTick=themeTick;themeTick=function(){_tTick();if(theme()==='asatsuyu'&&!S.dojo&&skyPhase()==='day')healPlayer(ST.maxhp*0.0025*DT);tbTick();};

/* ---------------- theme bosses: one per big summer theme ---------------- */
const TB_DEF={
  taihatsu:{title:'群れの王 だ！',cond:'25ひき たおすと あらわれる'},
  taifu:{title:'嵐を よぶ ものだ！',base:'batta',name:'嵐呼びの 大トノサマ',body:'cricket',legs:'batta',ai:'hopper',leap:true,col:'#6a8a4a',dark:'#2a3a1a',moves:{moves:['dive','bite','ring'],moves2:['rush','quake'],shot:'pellet',names:{ring:'つむじ風',dive:'嵐の 跳躍'}}},
  hideri:{title:'日照りの 主だ！',base:'oomukade',name:'日照りの 大ムカデ',body:'centipede',ai:'melee',charge:true,venom:5,col:'#c8582a',dark:'#5a1a08',moves:{moves:['bite','charge','rush'],moves2:['field','sweep'],field:'dust',names:{field:'熱砂',rush:'灼熱の 突進'}}},
  hotaru:{title:'月夜の 主だ！',base:'ga',name:'月夜の 大ミズアオ',body:'moth',wing:'#bfe8d0',ai:'flyer',dust:true,col:'#bfe8d0',dark:'#4a7a5a',moves:{moves:['dive','dust','ring'],moves2:['field','summon'],shot:'scale',field:'dust',summon:'ga',names:{ring:'月の 輪',field:'光の 粉'}}},
  ooame:{title:'長雨の 主だ！',base:'ebigani',name:'雨ザリの 大将',body:'crayfish',ai:'melee',guard:true,spin:true,tank:true,col:'#8a4a3a',dark:'#3a1a10',moves:{moves:['bite','spin','guard'],moves2:['quake','ring'],shot:'water',names:{quake:'鉄砲水',ring:'雨つぶて'}}}
};
function tbType(){
  const t=theme();if(!TB_DEF[t]||S.cycle<2)return null;const A=AREA(),id='tb_'+t+'_'+A.id;if(TYPES[id])return id;
  const N=TYPES['nushi_'+A.id]||TYPES.nushi_jibeta;let o;
  if(t==='taihatsu'){if(!S.swarm)return null;const B=TYPES[S.swarm];o=Object.assign({},B,{name:'群れの王 '+B.name.replace(/^.*の ?/,''),r:Math.min(30,B.r*2),summon:S.swarm,charge:true});
    MOVESETS[id]={moves:['bite','charge','summon'],moves2:['ring','rush'],summon:S.swarm,shot:'pellet',names:{summon:'大号令',ring:'群れの 嵐'},summonText:'おまえたち、かかれ！'};}
  else{const D=TB_DEF[t];o=Object.assign({},TYPES[D.base]||{},D);delete o.moves;MOVESETS[id]=D.moves;o.r=Math.max(20,(TYPES[D.base]||{r:16}).r*1.6);}
  Object.assign(o,{hp:Math.round(N.hp*1.15),dmg:N.dmg*1.05,xp:Math.round(N.xp*1.2),aggro:340,lvOff:3,nushi:true,tboss:true,keeper:false,boss:false,drop:null,dex:'「'+THEMES[t].name+'の 夏」だけに あらわれる 主。'});
  TYPES[id]=o;RAGE[id]=RAGE[id]||'……！';if(!DEX_ORDER.includes(id))DEX_ORDER.push(id);return id;
}
function tbSpawn(){
  const id=tbType();if(!id||S.tbHere||S.dojo||S.challenge)return;
  for(let k=0;k<200;k++){const a=rnd(0,TAU),d=rnd(520,760),x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d;if(x<120||y<120||x>MAP.w-120||y>MAP.h-120||blocked(x,y,40)||inLair(x,y))continue;
    const e=spawnEnemy(id,x,y);S.tbHere=e;S.tbDone=true;banner('あやしい 気配……','「'+THEMES[theme()].name+'の 夏」の 主が あらわれた！');sfx('roar');vib(60);return;}
}
function tbTick(){
  if(S.cycle<2||S.dojo||!MAP||S.tbDone||S.challenge)return;const t=theme();S.tbT=(S.tbT||0)+DT;
  const ready=t==='taihatsu'?(S.swarmKills||0)>=25:t==='taifu'?(S.gusts||0)>=3:t==='hideri'?S.tbT>70&&skyPhase()==='day':t==='hotaru'?(S.tbFlies||0)>=8&&isNight():t==='ooame'?S.tbT>70&&isRain():false;
  if(ready)tbSpawn();
}
function tbKilled(e){
  S.tbHere=null;DEX.tboss=DEX.tboss||{};DEX.tboss[e.type]=(DEX.tboss[e.type]||0)+1;saveDex();
  music.play(AREA().bgm);sfx('fanfare');banner('夏の 主を たおした！',e.T.name);diary(e.T.name+'を たおした。'+themeName()+'だけの 主だった。');
  const A=AREA(),pool=A.mobs.map(m=>TYPES[m[0]].drop).filter(Boolean);const d=pick(pool)||['head','ago'];const p=mkPart(d[0],d[1],2.2);if(p.rar<1)p.rar=1;dropItem(e.x,e.y,p);announceDrop(p,true);
  later(()=>gainDango(2,e.x,e.y),400);checkAch();
}

/* ---------------- two followers: compatibility & duo moves ---------------- */
const PAIR_MOVES={jorou_kumo:'親子網',kama_ito:'糸断ち十字',mitsu_nioi:'甘くさ爆弾',nage_mawari:'鉄壁投げ',shippu_tobi:'疾風跳躍',rinpun_mitsu:'花園乱舞',kama_tobi:'跳ね斬り',ito_rinpun:'鱗粉の網',nioi_mawari:'不動の香',nage_shippu:'剛速投げ'};
function pairOf(r1,r2){if(!r1||!r2)return null;
  for(const pr of PAIRS){if(pr.types){if((r1.type===pr.types[0]&&r2.type===pr.types[1])||(r2.type===pr.types[0]&&r1.type===pr.types[1]))return pr;continue;}
    const f1=skillOf(r1.type),f2=skillOf(r2.type);if((f1===pr.fams[0]&&f2===pr.fams[1])||(f2===pr.fams[0]&&f1===pr.fams[1]))return pr;}return null;}
function compatOf(r1,r2){if(!r1||!r2)return -1;if(pairOf(r1,r2)||(r1.buddy&&r1.buddy===r2.name))return 2;return skillOf(r1.type)===skillOf(r2.type)?0:1;}
const COMPAT=[{n:'かぶり',m:'△',d:'同じ わざの 系統。絆が ややたまりにくい'},{n:'ふつう',m:'○',d:'連携わざ +15%。ときどき「ふたりがかり」'},{n:'抜群',m:'◎',d:'連携わざ +30%。コンビわざ・合体わざを 使う'}];
function duoCompat(){return duo()?compatOf(ALLY.rec,ALLY2.rec):-1;}
function duoMoveName(){const pr=pairOf(ALLY.rec,ALLY2.rec);return pr?PAIR_MOVES[pr.id]:'ふたりがかり';}
function duoTick(){
  if(!duo()||S.rk||S.sumo||S.state!=='play')return;if(!DEX.duoWalked){DEX.duoWalked=true;saveDex();}const c=duoCompat();if(c<1)return;
  S.duoCd=(S.duoCd??8)-DT;if(S.duoCd>0)return;
  let tg=null,bd=280;for(const e of E){if(e.dead||e.state==='den'||e.state==='seat'||e.T.ai==='sumo'||e.state==='under'||e.T.ai==='passive'||e.z>18)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;tg=e;}}
  if(!tg){S.duoCd=1;return;}
  S.duoCd=c===2?15:26;const nm=c===2?duoMoveName():'ふたりがかり',mul=c===2?2.4:1.3,dmgB=ALLY.baseDmg+ALLY2.baseDmg;
  for(const A of [ALLY,ALLY2]){A.leapT=0.55;A.lx=A.x;A.ly=A.y;A.tx=tg.x+rnd(-20,20);A.ty=tg.y+rnd(-20,20);A.pow=1;}
  pop((ALLY.x+ALLY2.x)/2,(ALLY.y+ALLY2.y)/2-40,'コンビわざ「'+nm+'」！',c===2?'#c8452d':'#5f7d3a',true);sfx('combo');tot('duo',1);
  later(()=>{if(S.state!=='play')return;const x=tg.x,y=tg.y;fx.push({ring:true,x,y,r:110,t:0,life:0.4});S.shake=Math.max(S.shake,9);sfx('crit');
    for(let i=0;i<14;i++)fx.push({x,y,vx:rnd(-240,240),vy:rnd(-240,240),t:0,life:0.5,c:pick(['#f2b632','#9be07a','#fff3c4'])});
    for(const e of E)if(!e.dead&&e.state!=='den'&&e.T.ai!=='sumo'&&Math.hypot(e.x-x,e.y-y)<100+e.r)damageEnemy(e,dmgB*mul,x,y,380,0,{force:true});},620);
}
/* team-up with two: the second follower lands a follow-up; a good pair turns it into a 合体わざ */
function rkDuoFollow(rk){
  const B2=ALLY2;if(!rk.duo||!B2||B2.dead)return false;const c=rk.compat,x=rk.qx??P.x,y=rk.qy??P.y;
  B2.leapT=0.55;B2.lx=B2.x;B2.ly=B2.y;B2.tx=x;B2.ty=y;B2.pow=1;
  const nm=ALLY?duoMoveName():'ふたりがかり',n1=ALLY?ALLY.T.name:'',n2=B2.T.name;
  later(()=>{if(S.state!=='play')return;fx.push({ring:true,x,y,r:150,t:0,life:0.45});S.shake=Math.max(S.shake,12);S.flash=c===2?0.3:0.1;sfx('thud');
    for(let i=0;i<20;i++){const a=i/20*TAU;fx.push({x,y,vx:Math.cos(a)*380,vy:Math.sin(a)*380,t:0,life:0.55,c:c===2?'#f4a6c4':'#fff3c4'});}
    for(const e of E)if(!e.dead&&e.state!=='den'&&e.state!=='seat'&&e.T.ai!=='sumo'&&Math.hypot(e.x-x,e.y-y)<150+e.r)damageEnemy(e,rk.B*(c===2?1.1:0.6),x,y,420,0,{player:true,force:true});
    if(c===2){banner('合体わざ「'+nm+'」',n1+'・'+n2+' と ダンゴムシ');pop(x,y-50,nm+'！','#c8452d',true);S.bond=Math.min(100,(S.bond||0)+25);DEX.gattai=true;saveDex();}
    else pop(x,y-40,n2.split(' ').pop()+'、追い打ち！','#5f7d3a',true);},560);
  return true;
}

/* ---------------- ジャストまるまる (perfect guard) ---------------- */
function justGuard(from,dmg){
  if(!(S.t-(P.rollAt||-9)<0.24))return false;
  S.slowmo=0.35;S.slowMax=0.35;S.slowFocus={x:P.x,y:P.y};S.flash=0.25;sfx('crit');vib(40);
  pop(P.x,P.y-44,'ジャスト！','#2f6fb0',true);qProgress('just',1);fx.push({ring:true,x:P.x,y:P.y,r:70,t:0,life:0.3});tot('just',1);
  if(from&&from.T&&!from.dead){damageEnemy(from,ST.dmg*1.6+dmg*0.3,P.x,P.y,320,0,{player:true,force:true});from.brokenT=Math.max(from.brokenT||0,2);
    if(!from.T.boss&&!from.T.keeper&&!from.T.nushi){from.state='recover';from.t=1.3;}else{from.state='recover';from.t=0.7;}}
  P.st=Math.min(1,(P.st??1)+0.15);addBond(8);return true;
}

/* ---------------- れんげき (hit chain) ---------------- */
function chainHit(){S.chain=(S.chain||0)+1;S.chainT=2.2;const c=S.chain;if(c%5===0)qProgress('chain',c);if(c===20)pop(P.x,P.y-50,'ノッてきた！','#d9a21b',true);else if(c===50){pop(P.x,P.y-50,'ゾーン！','#c8452d',true);sfx('star');}if(c>(DEX.tot&&DEX.tot.chain||0))totMax('chain',c);}
function chainMul(){return 1+Math.min(0.3,Math.floor((S.chain||0)/10)*0.05);}
function chainTick(){if(S.chainT>0){S.chainT-=DT;if(S.chainT<=0){const c=S.chain||0;if(c>=15){const xp=Math.round(c*(1+areaLv()*0.4));addXP(xp,P.x,P.y-30);pop(P.x,P.y-56,c+'れんげき ボーナス','#d9a21b',true);}S.chain=0;}}}
function drawChainScreen(){const c=S.chain||0;if(c<3||S.state!=='play')return;const k=Math.min(1,S.chainT/0.3),x=W-22,y=Hh*0.42;
  ctx.save();ctx.globalAlpha=Math.min(1,S.chainT/0.6);ctx.textAlign='right';ctx.lineWidth=6;ctx.strokeStyle=INK;
  ctx.font=clamp(W*0.09,30,46)+'px '+DFONT;ctx.fillStyle=c>=50?'#c8452d':c>=20?'#f2b632':'#fff6e0';const sc=1+(1-k)*0.3;ctx.translate(x,y);ctx.scale(sc,sc);ctx.strokeText(c,0,0);ctx.fillText(c,0,0);
  ctx.font='900 13px '+FONT;ctx.lineWidth=4;ctx.strokeText('れんげき',0,20);ctx.fillStyle='#fff';ctx.fillText('れんげき',0,20);
  if(c>=10){ctx.font='900 11px '+FONT;const t='こうげき +'+Math.round((chainMul()-1)*100)+'%';ctx.strokeText(t,0,36);ctx.fillStyle='#f2b632';ctx.fillText(t,0,36);}
  ctx.restore();}

/* ---------------- elite affixes ---------------- */
const AFFIX={kata:{n:'かたい',c:'#6a7a8a'},haya:{n:'はやい',c:'#2f6fb0'},doku:{n:'どく',c:'#8a4ab0'},bun:{n:'ぶんれつ',c:'#5f7d3a'},toge:{n:'とげ',c:'#c8452d'}};
function giveAffix(e){const k=pick(Object.keys(AFFIX));e.affix=k;if(k==='kata'){e.maxhp*=1.6;e.hp=e.maxhp;}if(k==='haya')e.speed*=1.35;}
function affixOnDeath(e){if(e.affix==='bun'&&!e.split){for(let i=0;i<2;i++){const c=spawnEnemy(e.type,e.x+rnd(-20,20),e.y+rnd(-20,20),{lv:e.lv});c.split=true;c.maxhp*=0.4;c.hp=c.maxhp;c.r*=0.8;c.state='chase';}pop(e.x,e.y-e.r-20,'ぶんれつ！','#5f7d3a',true);}}

ACHS.push({id:'duo1',name:'三人衆',desc:'子分を 2匹 つれて 歩く'},{id:'gattai',name:'合体わざ',desc:'相性 抜群の ふたりと 合体わざを 出す'},{id:'just10',name:'ジャストの 名人',desc:'ジャストまるまるを 10回 きめる'},{id:'chain50',name:'ゾーン',desc:'50れんげきを 出す'},{id:'tboss1',name:'夏の 主',desc:'夏の テーマの 主を たおす'});
