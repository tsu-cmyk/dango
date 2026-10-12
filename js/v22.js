'use strict';
/* =====================================================================
   ひと夏の番長 — v22: 見切り, keepers that mix guard/dodge attacks,
   simple すみか upgrades, the 女帝 as a true final boss,
   かた (stances): part combos that turn かむ / まるまる into other moves,
   and three new bugs with new parts
   ===================================================================== */

/* ---------------- 見切り: slip past a purple attack by a hair ---------------- */
function mikiriTick(){
  for(const e of E){if(e.dead||!isBig(e))continue;
    if(e.dodgeUntil>S.t){const st=e.state;let reach=-1;
      if(st==='quake_wind'&&e.t<0.22)reach=e.qR||150;else if(st==='spinning')reach=e.r+46;else if(st==='leaping'&&e.t<0.18)reach=e.r+60;else if(st==='charging'||st==='diving'||st==='rolling')reach=e.r+10;
      if(reach>0){const c=Math.hypot(P.x-e.x,P.y-e.y)-reach-ST.r;e.mvClose=Math.min(e.mvClose??1e9,c);}}
    if(e.dodgeUntil>0&&!e.mkDone&&S.t-(e.mvT0||0)>0.45&&(e.state==='recover'||e.state==='chase')){e.mkDone=true;if(!e.mvHit&&e.mvClose<55&&S.state==='play'&&!moguruOn())mikiri(e);}
    if(e.chainCd&&e.state==='chase'){e.chainCd=false;e.cd=Math.min(e.cd,0.18);}}
}
function mikiri(e){
  S.slowmo=0.7;S.slowMax=0.7;S.slowFocus={x:(P.x+e.x)/2,y:(P.y+e.y)/2};S.flash=0.2;sfx('crit');vib(40);
  pop(P.x,P.y-46,'見切り！','#8a3ab0',true);e.brokenT=Math.max(e.brokenT||0,2.6);e.state='recover';e.t=Math.max(e.t||0,1.1);e.vx=e.vy=0;
  P.st=Math.min(stamMax(),(P.st??1)+0.3);addBond(10);tot('mikiri',1);
}
const _markMove=markMove;markMove=function(e,m){_markMove(e,m);if(!isBig(e))return;e.mvT0=S.t;e.mvHit=false;e.mvClose=1e9;e.mkDone=!e.dodgeUntil;const MS=MOVESETS[e.type];if(MS&&MS.chain&&Math.random()<MS.chain)e.chainCd=true;};

/* ---------------- keepers learn both kinds of attack, more as the forest goes on ---------------- */
(function keeperMoves(){
  AREAS.forEach((A,i)=>{for(const k of A.keepers){const MS=MOVESETS[k]=MOVESETS[k]||{moves:['bite','charge']};MS.moves=MS.moves.slice();MS.moves2=(MS.moves2||[]).slice();
    const add=(arr,m)=>{if(!arr.includes(m))arr.push(m);};
    if(i>=1)add(MS.moves2,'spin');if(i>=2)add(MS.moves,'quake');if(i>=3)add(MS.moves2,'leap');if(i>=4){add(MS.moves,'rush');MS.chain=0.25;}if(i>=5)MS.chain=0.4;}});
})();

/* ---------------- すみかの増築: every level raises everything a little ---------------- */
function houseRestMul(){return 1-0.12*houseLv();}
function houseStoreMax(){return 40+5*houseLv();}
function applyHouse(){STORE_MAX=houseStoreMax();}
const _houseBuild=houseBuild;houseBuild=function(){const ok=_houseBuild();if(ok)applyHouse();return ok;};
const _allyFaint=allyFaint;allyFaint=function(r,t){_allyFaint(r,t);r.restT=(r.restT||REST_T)*houseRestMul();};
function houseEffectsText(){return 'スタミナ 最大 '+Math.round(stamMax()*100)+'% ・ スタミナ回復 '+Math.round(stamRegenMul()*100)+'% ・ もちもの '+houseStoreMax()+'こ ・ 子分の 休養 '+Math.round(houseRestMul()*100)+'%';}

/* ---------------- よそ者の夏: the 女帝 is the last boss ---------------- */
Object.assign(STORIES.hiari,{final:{base:'inv_sakaba',name:'ヒアリの 女帝',col:'#e0502a',dark:'#5a1006',drop:['tail','hiaribari',1],moves:'inv_sakaba',add:['quake','rush','summon'],summon:'hiari',hpMul:1.08,
  meet:['……ここまで 来たのね、丸い 虫。','若頭は もう いない。この 甘い 座は、女帝の ものよ。'],fall:'……この 林の 虫は、こんなに つよいのね。わたしたちは、海の 向こうへ 帰るわ。'},
  lines:['そのとき——林の 外から、見なれない 赤い 行列が やってきた。','若頭は 追いだしたわ。この林の 樹液は、ぜんぶ わたしたちが いただく。']});
STORY_REWARD.hiari.part=['tail','hiaribari'];
const _storyKeeper=storyKeeper;storyKeeper=function(A,i){
  if(S.story==='hiari'&&S.cycle>=1&&A.final){const id='inv_guard';if(!TYPES[id]){const K=TYPES[A.keepers[1]],tp=INV_TEMPLATES.ant;TYPES[id]=Object.assign({},tp,{name:'ヒアリの 近衛隊長',hp:Math.round(K.hp*1.1),dmg:K.dmg,speed:Math.max(K.speed,100),xp:Math.round(K.xp*1.35),aggro:300,lvOff:K.lvOff||1,keeper:true,invader:true,moves:undefined,meet:'女帝さまの 前に、おれを たおして みろ。',down:'……女帝さま、もうしわけ ありません……。'});MOVESETS[id]=Object.assign({},tp.moves);RAGE[id]='女帝さまの ために！';if(!DEX_ORDER.includes(id))DEX_ORDER.push(id);}return id;}
  return _storyKeeper(A,i);};

/* ---------------- new bugs and parts ---------------- */
PARTS.legs.okera={name:'オケラの 掘り脚',speed:165,dash:430,desc:'土を かきわける 平たい 前脚。もぐるのが とくい。'};
PARTS.head.hanmyou={name:'ハンミョウの 牙',dmg:21,cd:0.3,range:30,arc:1.15,desc:'道おしえの するどい 牙。はやく、とおくまで とどく。'};
PARTS.back.tamamushi={name:'タマムシの 玉羽',def:0.7,spd:1.04,desc:'虹色に 光る かたい 羽。軽くて かたい。'};
TYPES.okera={name:'オケラの 穴掘り',hp:58,dmg:8,r:13,speed:96,xp:11,aggro:190,body:'cricket',legs:'kama',ai:'melee',col:'#8a6a44',dark:'#4a3420',drop:['legs','okera',0.14],dex:'土の 中を ほりすすむ 虫。前脚が シャベルのよう。'};
TYPES.hanmyou={name:'ハンミョウの 道おしえ',hp:70,dmg:11,r:13,speed:175,xp:15,aggro:240,body:'longhorn',head:'kamikiri',ai:'melee',charge:true,col:'#2a7a6a',dark:'#a8302a',drop:['head','hanmyou',0.12],dex:'人の 前を 飛んで 道を おしえる 虫。とても 足が はやい。'};
TYPES.tamamushi={name:'タマムシの 玉虫',hp:120,dmg:9,r:14,speed:90,xp:22,aggro:160,body:'beetle',head:'ago',ai:'melee',col:'#2aa070',dark:'#7a2a8a',drop:['back','tamamushi',0.12],dex:'虹色に かがやく めずらしい 虫。見つけたら 運が いい。'};
[['jibeta','okera',1],['kuchiki','okera',2],['kusamura','hanmyou',1],['hanabatake','hanmyou',1],['hanabatake','tamamushi',1],['miki','tamamushi',1]].forEach(([a,t,w])=>{const A=AREAS.find(x=>x.id===a);if(A&&!A.mobs.some(m=>m[0]===t))A.mobs.push([t,w]);});
DEX_ORDER.splice(DEX_ORDER.indexOf('hiari'),0,'okera','hanmyou','tamamushi');
RAGE.okera=RAGE.hanmyou=RAGE.tamamushi='';
BLOODS.kouchu.ids.push('tamamushi','miyama','wakagashira');BLOODS.hane.ids.push('okera');BLOODS.mukade.ids.push('hanmyou');

/* ---------------- かた: part combos that turn a button into another move ---------------- */
const STANCES={
  hasami:{btn:'bite',lbl:'はさむ',n:'はさみ投げ',need:[['head',['kuwa','miyama','hirata','onizuno','tsuno']],['back',['koura','kanabun','tsuyahada','wakagashira','tamamushi']]],how:'かむ かわりに 敵を はさんで、向いている 方へ 投げとばす。投げた 敵は ほかの 敵に ぶつかる（大物は 重い一撃）。',hint:'大きな ハサミ ＋ かたい 背中'},
  tsuki:{btn:'bite',lbl:'つく',n:'カマ突き',need:[['head',['okama','shihan','mizukama','hanmyou']],['legs',['kama','batta','kazekiri','geji']]],how:'前へ ふみこんで 一直線に 突く。とおくの 敵まで まとめて つらぬく。',hint:'長い カマや 牙 ＋ 跳ねる脚'},
  sasu:{btn:'bite',lbl:'さす',n:'毒針さし',need:[['tail',['hari','ohari','ougon','hiaribari']],['back',['kumahane','raiden','joouhane','hane']]],how:'すばやく 毒針で さす。かむより はやく、強い 毒が 回る。',hint:'毒の ハリ ＋ ハチの 羽'},
  moguru:{btn:'roll',lbl:'もぐる',n:'もぐり',need:[['legs',['okera','mukade']],['head',['ago','oago','kongou','hiari','hanmyou']]],how:'おしている間は 土に もぐって どんな こうげきも うけない（スタミナを 多く つかう）。はなすと 飛びだして まわりを ふきとばす。',hint:'掘る脚 ＋ アゴ'},
  komoru:{btn:'roll',lbl:'こもる',n:'殻ごもり',need:[['back',['kara','kougyoku','wakagashira','tamamushi']],['head',['zari','miyama','kuwa','hirata','onizuno','tsuno']]],how:'まるまる ガードの スタミナが 半分に なり、飛んでくる 弾を はね返す。突進は みじかめ。',hint:'かたい 殻 ＋ 大きな ハサミ'}
};
function stanceOf(eq){const ids={head:eq.head.id,legs:eq.legs.id,tail:eq.tail.id,back:eq.back.id};const o={bite:null,roll:null};for(const k in STANCES){const s=STANCES[k];if(o[s.btn])continue;if(s.need.every(([sl,l])=>l.includes(ids[sl])))o[s.btn]=k;}return o;}
function stanceCheck(){const s=ST.stance||{},key=(s.bite||'')+'|'+(s.roll||'');if(key!==S.stanceKey){const was=S.stanceKey;S.stanceKey=key;const u=UIH();if(u&&u.stanceLabels)u.stanceLabels();
  if(was!==undefined){for(const b of ['bite','roll']){const k=s[b];if(k&&(!was||!was.split('|').includes(k))){const T=STANCES[k];banner('かたが かわった！「'+T.lbl+'」',T.how);sfx('combo');DEX.stances=DEX.stances||{};DEX.stances[k]=true;saveDex();}}}}}
/* bite variants; return true when handled */
function stanceBite(){
  const k=ST.stance&&ST.stance.bite;if(!k)return false;const at=aimTarget();if(at)P.ang=Math.atan2(at.y-P.y,at.x-P.x);const dx=Math.cos(P.ang),dy=Math.sin(P.ang);
  if(k==='hasami'){P.biteCd=ST.cd*1.25;P.biteT=0.25;sfx('grab');let tg=null,bd=1e9;
    for(const e of E){if(e.dead||e.z>18||e.state==='under'||e.state==='den'||e.state==='seat'||e.T.ai==='sumo'||e.friendly)continue;const ex=e.x-P.x,ey=e.y-P.y,d=Math.hypot(ex,ey);if(d<ST.r+e.r+ST.range+10&&Math.abs(angDiff(P.ang,Math.atan2(ey,ex)))<ST.arc&&d<bd){bd=d;tg=e;}}
    if(!tg){P.vx+=dx*90;P.vy+=dy*90;return true;}
    if(isBig(tg)){damageEnemy(tg,ST.dmg*1.35,P.x,P.y,500,0,{player:true});pop(tg.x,tg.y-tg.r-20,'ぐいっ',INK);return true;}
    damageEnemy(tg,ST.dmg*0.9,P.x,P.y,0,0,{player:true});if(!tg.dead){tg.thrown=0.45;tg.thrownHit=new Set([tg]);tg.vx=dx*900;tg.vy=dy*900;tg.state='recover';tg.t=1;pop(tg.x,tg.y-tg.r-20,'ぶん投げ！','#c8452d',true);S.shake=6;}
    return true;}
  if(k==='tsuki'){P.biteCd=ST.cd*1.2;P.biteT=0.22;sfx('slash');P.vx+=dx*420;P.vy+=dy*420;const L=ST.range+90;fx.push({grab:true,x:P.x+dx*ST.r,y:P.y+dy*ST.r,a:P.ang,len:L,t:0,life:0.2});
    for(const e of E){if(e.dead||e.z>18||e.state==='under'||e.friendly)continue;if(segDist(e.x,e.y,P.x,P.y,P.x+dx*(L+ST.r),P.y+dy*(L+ST.r))<e.r+16)damageEnemy(e,ST.dmg*1.15*lvGap(P.lv,e.lv),P.x,P.y,300,ST.poison,{player:true});}
    return true;}
  if(k==='sasu'){P.biteCd=ST.cd*0.65;P.biteT=0.14;sfx('bite');const R=ST.range+12;
    for(const e of E){if(e.dead||e.z>18||e.state==='under'||e.friendly)continue;const ex=e.x-P.x,ey=e.y-P.y,d=Math.hypot(ex,ey);if(d<ST.r+e.r+R&&Math.abs(angDiff(P.ang,Math.atan2(ey,ex)))<0.7){damageEnemy(e,ST.dmg*0.75*lvGap(P.lv,e.lv),P.x,P.y,120,ST.poison+8,{player:true});fx.push({x:e.x,y:e.y,vx:0,vy:-40,t:0,life:0.4,c:'#9a5fc2'});break;}}
    return true;}
  return false;
}
function thrownTick(){for(const e of E){if(!e.thrown||e.dead)continue;e.thrown-=DT;
  for(const o of E){if(o.dead||e.thrownHit.has(o)||o.z>18||o.state==='den'||o.T.ai==='sumo'||o.friendly)continue;if(Math.hypot(o.x-e.x,o.y-e.y)<o.r+e.r){e.thrownHit.add(o);damageEnemy(o,ST.dmg*1.4,e.x,e.y,420,0,{player:true});damageEnemy(e,ST.dmg*0.5,o.x,o.y,0,0,{player:true});S.shake=Math.max(S.shake,7);sfx('thud');}}
  if(e.thrown<=0){e.thrown=0;if(!e.dead)damageEnemy(e,ST.dmg*0.4,e.x,e.y,0,0,{player:true});}}}
/* もぐる */
function moguruOn(){return !!(ST.stance&&ST.stance.roll==='moguru'&&P.rolled);}
function moguruPop(){fx.push({ring:true,x:P.x,y:P.y,r:80,t:0,life:0.35});S.shake=Math.max(S.shake,8);sfx('thud');for(let i=0;i<14;i++)fx.push({x:P.x,y:P.y,vx:rnd(-240,240),vy:rnd(-240,240),t:0,life:0.5,c:'#7a5a34'});
  for(const e of E){if(e.dead||e.z>18||e.state==='den'||e.state==='seat'||e.T.ai==='sumo'||e.friendly)continue;if(Math.hypot(e.x-P.x,e.y-P.y)<e.r+80)damageEnemy(e,ST.dashDmg*1.3,P.x,P.y,460,0,{player:true});}P.inv=Math.max(P.inv,0.25);}
function drawMoguru(){if(!moguruOn())return;const r=ST.r;ctx.save();ctx.translate(P.x,P.y);
  ctx.fillStyle='rgba(42,33,24,.22)';ctx.beginPath();ctx.ellipse(2,6,r*1.6,r*1.0,0,0,TAU);ctx.fill();
  inked(()=>{ctx.beginPath();for(let k=0;k<=16;k++){const a=k/16*TAU,w=1+0.12*Math.sin(a*3+S.t*6);const x=Math.cos(a)*r*1.35*w,y=Math.sin(a)*r*0.95*w;k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();},'#9a7650',2);
  ctx.strokeStyle='rgba(42,33,24,.55)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-r*0.6,-r*0.1);ctx.lineTo(-r*0.1,r*0.15);ctx.lineTo(r*0.3,-r*0.2);ctx.lineTo(r*0.7,r*0.05);ctx.stroke();
  ctx.fillStyle='rgba(255,240,200,.25)';ctx.beginPath();ctx.ellipse(-r*0.3,-r*0.4,r*0.5,r*0.18,0,0,TAU);ctx.fill();
  for(let i=0;i<7;i++){const a=i*0.9+S.t*2.4,d=r*(1.45+0.15*Math.sin(S.t*9+i));dot(Math.cos(a)*d,Math.sin(a)*d*0.7+3,2.2+i%3,'#6a4a2a');}
  ctx.restore();}
/* hooks into the core loop */
const _refreshStats22=refreshStats;refreshStats=function(){_refreshStats22();ST.stance=stanceOf(P.eq);if(ST.stance.roll==='komoru')ST.dash*=0.8;};
const _bite22=bite;bite=function(){if(stanceBite())return;_bite22();};
const _hurt22=hurtPlayer;hurtPlayer=function(dmg,from,opts){if(moguruOn()&&S.state==='play')return false;const r=_hurt22(dmg,from,opts);if(r&&isBig(from))from.mvHit=true;return r;};
const _stamBlock22=stamBlock;stamBlock=function(from){const was=P.st??stamMax();const br=_stamBlock22(from);if(!br&&ST.stance&&ST.stance.roll==='komoru')P.st=Math.min(stamMax(),P.st+(was-P.st)*0.5);return br;};
const _stamTick22=stamTick;stamTick=function(){applyHouse();if(moguruOn()&&P.st!=null){P.st-=DT*0.14;}_stamTick22();};
ACHS.push({id:'mikiri10',name:'見切りの 達人',desc:'紫の わざを 10回 見切る'},{id:'stance3',name:'かた の 名人',desc:'3つの ちがう かた を つかう'});
