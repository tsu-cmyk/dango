'use strict';
/* =====================================================================
   ひと夏の番長 — v21: heavy vs. dodge attacks, story rewards,
   すみかの増築 (stamina), one fight at a time with nushi
   ===================================================================== */

/* ---------------- attack categories ---------------- */
const DODGE_MOVES=['quake','rush','leap','dive','spin'];
function isBig(e){return e&&e.T&&(e.T.boss||e.T.keeper||e.T.nushi);}
function markMove(e,m){if(!isBig(e))return;e.dodgeUntil=DODGE_MOVES.includes(m)?S.t+3:0;e.heavy=!e.dodgeUntil&&['charge','sweep','slash','bite','grab'].includes(m);}
function moveIsDodge(e){return !!(e&&e.dodgeUntil&&e.dodgeUntil>S.t);}
function telegraphCol(e){return moveIsDodge(e)?'150,60,200':isBig(e)?'230,120,20':'200,40,30';}

/* ---------------- story rewards ---------------- */
PARTS.head.miyama={name:'ミヤマの 大角',dmg:60,cd:0.6,range:34,arc:1.45,kb:2.6,story:true,desc:'ミヤマの 大親分の 角。はさんで 投げとばす 重い 一撃。'};
PARTS.head.shihan={name:'師範の 双鎌',dmg:30,cd:0.36,range:54,arc:2.4,story:true,desc:'大師範の カマ。とおくまで ひろく、はやく 切る。'};
PARTS.back.joouhane={name:'女王の 金羽',def:0.8,dashMul:1.35,slam:1.4,story:true,desc:'オオスズメバチの 女王の 羽。突進が 遠く 重くなる。'};
PARTS.back.wakagashira={name:'若頭の 黒鎧',def:0.6,slam:1.6,spd:0.95,story:true,desc:'覚醒した 若頭の 背中。とても かたく、体当たりも 重い。'};
const STORY_REWARD={hiari:{title:'st_hiari',part:null},hachi:{title:'st_hachi',part:['back','joouhane']},kuwa:{title:'st_kuwa',part:['head','miyama']},kama:{title:'st_kama',part:['head','shihan']},kabuto:{title:'st_kabuto',part:['back','wakagashira']}};
ACHS.push({id:'st_hiari',name:'よそ者 ばらい',desc:'「よそ者の 夏」を しめくくる'},{id:'st_hachi',name:'女王 討ち',desc:'「スズメバチ 襲来」を しめくくる'},{id:'st_kuwa',name:'山の 主',desc:'「ミヤマ一家の 乱」を しめくくる'},{id:'st_kama',name:'師範の 帯',desc:'「カマキリ道場 やぶり」を しめくくる'},{id:'st_kabuto',name:'真の 番長',desc:'「若頭の 逆襲」を しめくくる'});
function storyReward(){
  const k=S.cycle>=1?(S.story||'hiari'):null;if(!k)return null;const R=STORY_REWARD[k];DEX.storyClear=DEX.storyClear||{};DEX.storyClear[k]=true;saveDex();
  let got=null;if(R.part){const p=mkPart(R.part[0],R.part[1],1.6);if(p.rar<1)p.rar=1;S.store.push(p);got=partName(p);DEX.parts[R.part[1]]=true;saveDex();diary('物語の ごほうび「'+got+'」を もらった。');}
  S.storyPrize=got;checkAch();return got;
}

/* ---------------- すみかの増築 ---------------- */
const HOUSE=[{n:'葉っぱの すみか',cost:0,dango:0},{n:'二枚葉の すみか',cost:4,dango:0},{n:'木の実の 物置つき',cost:6,dango:1},{n:'苔の 寝床つき',cost:8,dango:2},{n:'番長の 屋敷',cost:10,dango:3}];
function houseLv(){return S.house||0;}
function stamMax(){return 1+0.12*houseLv();}
function stamRegenMul(){return 1+0.18*houseLv();}
function houseNext(){const L=houseLv();return L+1<HOUSE.length?HOUSE[L+1]:null;}
function houseCanBuild(){const n=houseNext();if(!n)return false;const cm=S.store.filter(p=>p.rar===0&&p.st===1&&!p.tr.length).length;return cm>=n.cost&&(S.dango||0)>=n.dango&&S.cleared.length+S.cycle*7>=houseLv()+1;}
function houseBuild(){if(!houseCanBuild())return false;const n=houseNext();const list=S.store.filter(p=>p.rar===0&&p.st===1&&!p.tr.length).sort((a,b)=>partScore(a)-partScore(b)).slice(0,n.cost);S.store=S.store.filter(p=>!list.includes(p));S.dango-=n.dango;S.house=houseLv()+1;sfx('fanfare');diary('すみかを「'+n.n+'」に 増築した。');return true;}
function drawHouseExtras(){if(!MAP||MAP.dojo||!houseLv())return;const s=MAP.sumika,L=houseLv();
  if(L>=1){ctx.save();ctx.translate(s.x+44,s.y-6);ctx.rotate(0.5);inked(ellP(0,0,26,13),'#8aa04a',1.8);ctx.restore();}
  if(L>=2)for(let i=0;i<3;i++){inked(ellP(s.x-52+i*9,s.y+18,6,8),'#a8743a',1.4);inked(ellP(s.x-52+i*9,s.y+11,7,4),'#6a4a2a',1.4);}
  if(L>=3){ctx.fillStyle='rgba(110,150,60,.7)';ctx.beginPath();ctx.ellipse(s.x+10,s.y+28,40,10,0,0,TAU);ctx.fill();}
  if(L>=4){ctx.fillStyle='#c8452d';ctx.fillRect(s.x+52,s.y-52,3,40);ctx.fillStyle='#f2c43a';ctx.beginPath();ctx.moveTo(s.x+55,s.y-52);ctx.lineTo(s.x+76,s.y-46);ctx.lineTo(s.x+55,s.y-40);ctx.fill();}}

/* ---------------- one big fight at a time ---------------- */
function bigFightOther(e){const b=S.bossBar;return !!(b&&b!==e&&!b.dead&&(b.T.boss||b.T.keeper));}
/* every engaged big enemy gets its own bar (at most two are shown, stacked) */
function engagedBigs(){const L=[];if(S.bossBar&&!S.bossBar.dead)L.push(S.bossBar);for(const e of E){if(L.length>=2)break;if(e.dead||L.includes(e)||!isBig(e)||e.state==='den'||e.state==='seat'||e.state==='wander'||!e.met)continue;if(Math.hypot(e.x-P.x,e.y-P.y)<800)L.push(e);}return L;}
