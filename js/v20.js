'use strict';
/* =====================================================================
   ひと夏の番長 — v20: a random story each summer from 2年目 on (its own
   outsiders, keeper leaders and final boss), small toasts for minor news,
   stamina for まるまる, fuller stat sheet
   ===================================================================== */

/* ---------------- stories ---------------- */
const STORIES={
  hiari:{name:'よそ者の 夏',march:'hiari',leader:'inv_sakaba',leaderName:'ヒアリの 女帝',
    lines:['そのとき——林の 外から、見なれない 赤い 行列が やってきた。','甘い におい。この林の 樹液は、わたしたちが いただくわ。'],
    mobs:null,keeper:null,final:null,intro:'よそ者の においが する……'},
  hachi:{name:'スズメバチ 襲来',march:'hachi',leaderName:'オオスズメバチの 女王',
    lines:['そのとき——空が うなるような 羽音で いっぱいに なった。','この林は、わが 軍団の 狩り場と なった。番長の座も いただく。'],
    mobs:[['hachi'],['hachi'],['hachi','kumabachi'],['hachi','kumabachi'],['hachi','kumabachi'],['hachi','kumabachi'],['hachi','kumabachi']],
    keeper:{name:'スズメバチの 斥候隊長',body:'wasp',tail:'hari',ai:'flyer',shot:'sting',col:'#e8a020',dark:'#2a1a08',r:20,drop:['tail','ohari',1],
      meet:'ブゥン……この先は 女王さまの 領地だ。',down:'ぐっ……女王さまに 知らせねば……。',rage:'針の 雨を ふらせてやる！',moves:'nushi_miki'},
    final:{base:'suzume',name:'オオスズメバチの 女王',col:'#e88a10',dark:'#3a1a04',drop:['tail','ohari',1],moves:'suzume',add:['summon'],summon:'hachi',
      meet:['……地べたの 丸虫が、わが 玉座へ 何の用？','針の 味を 教えてあげる。'],fall:'……この林の 虫は、刺しても 刺しても 立ちあがるのね。'},
    intro:'空から 羽音が 聞こえる……'},
  kuwa:{name:'ミヤマ一家の 乱',march:'kokuwa',leaderName:'ミヤマの 大親分',
    lines:['そのとき——深山から、角の 立派な 一家が 山を おりてきた。','若頭よ、番長の座は 今日から ミヤマ一家の もんだ。'],
    mobs:[['kokuwa'],['kokuwa'],['kokuwa'],['kokuwa','hirata'],['kokuwa','hirata'],['kokuwa','hirata'],['kokuwa','hirata']],
    keeper:{name:'ミヤマの 用心棒',body:'beetle',head:'kuwa',ai:'melee',charge:true,toss:true,col:'#8a5a2a',dark:'#3a2010',r:22,drop:['head','kuwa',1],
      meet:'親分の 命令だ。ここは 通さねえ。',down:'……親分に 合わせる 顔が ねえ。',rage:'ミヤマの 角、なめるなよ！',moves:'kuwagata'},
    final:{base:'kuwagata',name:'ミヤマの 大親分',col:'#9a6a30',dark:'#3a2010',drop:['head','kuwa',1],moves:'kuwagata',add:['quake','rush'],
      meet:['……ほう、若頭を 倒したのは おめえか。','ミヤマ一家の 頭として、相手に なろう。'],fall:'……まいった。ミヤマ一家は 山へ 帰るとしよう。'},
    intro:'山の ほうから 角の 一家が おりてきたらしい……'},
  kama:{name:'カマキリ道場 やぶり',march:'kamakiriko',leaderName:'オオカマキリの 大師範',
    lines:['そのとき——カマを かかげた 一団が、草を わけて あらわれた。','林じゅうの 番長を 斬って まわる。それが われら 道場の 修行よ。'],
    mobs:[['kamakiriko'],['kamakiriko'],['kamakiriko','mizukamakiri'],['kamakiriko'],['kamakiriko'],['kamakiriko'],['kamakiriko']],
    keeper:{name:'道場の 師範代',body:'mantis',ai:'slasher',col:'#5a8a3a',dark:'#2a4a1a',r:20,drop:['head','okama',1],
      meet:'一手、お手合わせ ねがおう。',down:'……見事。師範に 伝えておく。',rage:'奥義、見せてくれよう！',moves:'kamazo'},
    final:{base:'kamazo',name:'オオカマキリの 大師範',col:'#4a7a2a',dark:'#1a3a0a',drop:['head','okama',1],moves:'kamazo',add:['rush','ring'],
      meet:['……若頭を 斬ったのは そなたか。','ならば 最後の 一太刀、受けてみよ。'],fall:'……見事。道場の 看板は、そなたに ゆずろう。'},
    intro:'どこかで カマを とぐ 音が する……'},
  kabuto:{name:'若頭の 逆襲',march:null,leaderName:'林の若頭 カブト',
    lines:['若頭は、ひと冬かけて 体を きたえなおしていた。','去年の おれと 思うなよ。今年の 座は、ぜったいに わたさねえ！'],
    mobs:null,keeper:{name:'若頭の 親衛隊',body:'dome',ai:'melee',charge:true,tank:true,col:'#3f8a5a',dark:'#1a3a2a',r:20,drop:['back','kanabun',1],
      meet:'若頭の 命令だ。ここで 止める！',down:'くっ……若頭、すまねえ……。',rage:'親衛隊の 意地だ！',moves:'kuwagata'},
    final:{base:'kabuto',name:'覚醒した 若頭 カブト',col:'#6a3a1a',dark:'#2a1008',drop:['head','tsuno',1],moves:'kabuto',add:['quake','rush','ring'],hpMul:1.25,
      meet:['……待ってたぜ、番長。','この一年、おめえを 倒すことだけ 考えてきた！'],fall:'……くっ、また 負けか。おめえ、ほんとうに 強えな。'},
    intro:'若頭の 親衛隊が 見はっている……',elite:0.08}
};
function story(){return S.cycle>=1?STORIES[S.story||'hiari']:null;}
function rollStory(){const k=Object.keys(STORIES).filter(x=>x!==S.story);S.story=pick(k);storyFinal(AREAS[AREAS.length-1]);DEX.stories=DEX.stories||{};DEX.stories[S.story]=true;saveDex();}
function storyMobs(i){const st=story();if(!st)return null;if(S.story==='hiari')return INV_MOBS[i]||INV_MOBS[0];return st.mobs?st.mobs[i]||st.mobs[0]:null;}
function storyKeeper(A,i){
  const st=story();if(!st)return null;if(S.story==='hiari')return TYPES['inv_'+A.id]?'inv_'+A.id:null;if(!st.keeper)return null;
  const id='sk_'+S.story+'_'+A.id;if(TYPES[id])return id;const K=TYPES[A.keepers[1]],tp=st.keeper;
  TYPES[id]=Object.assign({},tp,{hp:Math.round(K.hp*1.1),dmg:K.dmg,speed:Math.max(K.speed,90),xp:Math.round(K.xp*1.35),aggro:300,lvOff:K.lvOff||1,keeper:true,storyK:true,moves:undefined,dex:st.name+'の 一味。'});
  MOVESETS[id]=Object.assign({},MOVESETS[tp.moves]||{moves:['bite','charge']});RAGE[id]=tp.rage;if(!DEX_ORDER.includes(id))DEX_ORDER.push(id);return id;
}
function storyFinal(A){
  const st=story();if(!st||!A.final||!st.final)return A.boss;const f=st.final,id='sf_'+S.story;if(TYPES[id])return id;const B=TYPES[f.base],K=TYPES.kabuto;
  TYPES[id]=Object.assign({},B,{name:f.name,col:f.col||B.col,dark:f.dark||B.dark,hp:Math.round(K.hp*(f.hpMul||1.05)),dmg:K.dmg*1.02,r:Math.max(B.r,30),xp:0,lvOff:3,boss:true,final:true,keeper:false,drop:f.drop,summon:f.summon||B.summon,dex:st.name+'の 夏の ラスボス。'});
  const M=Object.assign({},MOVESETS[f.moves]||MOVESETS.kabuto);M.moves2=[...new Set([...(M.moves2||[]),...(f.add||[])])];if(f.summon)M.summon=f.summon;MOVESETS[id]=M;RAGE[id]='本気で いくぞ！';if(!DEX_ORDER.includes(id))DEX_ORDER.push(id);return id;
}
function finalName(){const st=story();return st&&st.final?st.final.name:'カブトの若頭';}
function finalTypeId(){const st=story();return st&&st.final?'sf_'+S.story:'kabuto';}

/* ---------------- small notices that don't cover the screen ---------------- */
function toast(t,s){const u=UIH();if(u&&HAS_DOM&&u.toast)u.toast(t,s);}

/* ---------------- stamina for まるまる ---------------- */
function stamTick(){
  if(!P)return;const max=stamMax();if(P.st==null)P.st=max;
  if(P.rolled){P.st-=DT*0.2;P.stIdle=0;if(P.st<=0){P.st=0;P.tired=true;P.rolled=false;P.stunT=Math.max(P.stunT,0.5);pop(P.x,P.y-34,'へとへと……','#c8452d',true);sfx('down');}}
  if(P.dashT>0&&!P.dashPaid){P.dashPaid=true;P.st=Math.max(0,P.st-0.1);P.stIdle=0;}
  if(P.dashT<=0)P.dashPaid=false;
  if(!P.rolled&&P.dashT<=0){P.stIdle=(P.stIdle||0)+DT;if(P.stIdle>0.5)P.st=Math.min(max,P.st+DT*(P.tired?0.28:0.38)*stamRegenMul());}
  if(P.tired&&P.st>=0.35)P.tired=false;
}
/* returns true if the guard broke */
function stamBlock(from){const big=from&&from.T&&(from.T.boss||from.T.keeper||from.T.nushi);P.st=(P.st??stamMax())-(big&&from.heavy?0.3:big?0.22:0.1);P.stIdle=0;
  if(P.st<=0){P.st=0;P.tired=true;P.rolled=false;P.stunT=0.8;pop(P.x,P.y-40,'ガードブレイク！','#c8452d',true);sfx('crit');S.shake=8;return true;}return false;}
function drawStamina(){const mx=stamMax();if(!P||P.st==null||P.st>=mx-0.001||S.state!=='play')return;const r=ST.r+12,a=-Math.PI/2;
  ctx.save();ctx.translate(P.x,P.y);ctx.lineCap='round';ctx.strokeStyle='rgba(42,33,24,.35)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,r,a,a+TAU);ctx.stroke();
  ctx.strokeStyle=P.tired?'#c8452d':P.st<0.35?'#e8a020':'#7ab84a';ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,0,r,a,a+TAU*P.st/mx);ctx.stroke();ctx.restore();}

/* ---------------- full stat sheet ---------------- */
function statRows(s){
  const pct=v=>Math.round(v*100)+'%';
  return [['体力',Math.round(s.maxhp)],['一撃',Math.round(s.dmg)],['かむ 間かく',s.cd.toFixed(2)+'秒'],['とどく はんい',Math.round(s.range)],['会心',pct(s.crit)],['毒',s.poison>0?Math.round(s.poison)+'/秒':'なし'],
    ['刺し返し',s.counter>0?Math.round(s.counter):'なし'],['足',Math.round(s.speed)],['突進 きょり',Math.round(s.dash)],['突進 ダメージ',Math.round(s.dashDmg)],['うける ダメージ',pct(s.def)],
    ['回復',(s.regen>0?'じわじわ ':'')+(s.heal>0?'かむと 回復':'')||'なし'],['血',s.blood?BLOODS[s.blood.k].n+(s.blood.tier>1?'（濃い）':''):'なし']];
}
ACHS.push({id:'story3',name:'林の 歴史',desc:'3つの ちがう 夏の 物語を 見る'},{id:'nobreak',name:'鉄の 守り',desc:'ガードブレイク されずに 番長を たおす'});
