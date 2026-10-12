'use strict';
/* =====================================================================
   ひと夏の番長 — v23: かた の きわみ (3-part upgrades), もぐる that sneaks
   behind enemies, and small story events on the way to the last boss
   ===================================================================== */

/* ---------------- tiny timer queue ---------------- */
const V23Q=[];function after(t,f){V23Q.push({t,f});}
function v23Tick(){for(const q of V23Q){q.t-=DT;if(q.t<=0&&!q.done){q.done=true;try{q.f();}catch(err){}}}for(let i=V23Q.length-1;i>=0;i--)if(V23Q[i].done)V23Q.splice(i,1);
  burrowTick();storyEvTick();}

/* ---------------- かた の きわみ: a third matching part powers a stance up ---------------- */
const STANCE_UP={
  hasami:{need:['tail',['hasami']],lbl:'大ばさみ',n:'大はさみ投げ',how:'前と うしろの ハサミで がっちり つかむ。もっと 遠く 重く 投げ、大物も よろめかせる。',hint:'＋ うしろの ハサミ'},
  tsuki:{need:['back',['hane','ageha','gekka','murasaki']],lbl:'三段突き',n:'疾風 三段突き',how:'羽で 体を おしだし、三回 つづけて 突く。',hint:'＋ うすい 羽'},
  sasu:{need:['head',['kiba','gokegumo','hiari']],lbl:'千本ざし',n:'千本ざし',how:'毒の キバと ハリで 刺しまくる。3回目ごとに 敵を しびれさせる。',hint:'＋ 毒の キバ'},
  moguru:{need:['back',['mino','kara','kougyoku','koura']],lbl:'地ゆれ',n:'地ゆらし もぐり',how:'土の 中を すばやく 動ける。飛びだすと 広く ゆらして、敵を しばらく 動けなくする。',hint:'＋ かたい 背中'},
  komoru:{need:['legs',['mukade','geji']],lbl:'岩こもり',n:'岩ごもり',how:'ガードの スタミナが さらに へり、はね返す 弾も 強い。ジャストガードで 衝撃波。',hint:'＋ たくさんの 脚'}
};
function stanceUpOf(eq,so){const o={bite:false,roll:false};for(const b of ['bite','roll']){const k=so[b];if(!k)continue;const U=STANCE_UP[k];o[b]=U.need[1].includes(eq[U.need[0]].id);}return o;}
function stanceLbl(b,so,up){so=so||ST.stance||{};up=up||ST.stanceUp||{};const k=so[b];if(!k)return null;return up[b]?STANCE_UP[k].lbl:STANCES[k].lbl;}
const _refreshStats23=refreshStats;refreshStats=function(){_refreshStats23();ST.stanceUp=stanceUpOf(P.eq,ST.stance);};
stanceCheck=function(){const s=ST.stance||{},u=ST.stanceUp||{},key=(s.bite||'')+(u.bite?'+':'')+'|'+(s.roll||'')+(u.roll?'+':'');if(key===S.stanceKey)return;const was=S.stanceKey;S.stanceKey=key;const ui=UIH();if(ui&&ui.stanceLabels)ui.stanceLabels();
  if(was===undefined)return;const W=was.split('|');
  for(const [i,b] of [[0,'bite'],[1,'roll']]){const k=s[b];if(!k)continue;const cur=k+(u[b]?'+':'');if(W[i]===cur)continue;
    if(u[b]){const U=STANCE_UP[k];banner('きわみ！「'+U.lbl+'」',U.how);sfx('fanfare');DEX.stanceUp=DEX.stanceUp||{};DEX.stanceUp[k]=true;}
    else if(W[i]!==k+'+'){const T=STANCES[k];banner('かたが かわった！「'+T.lbl+'」',T.how);sfx('combo');}
    DEX.stances=DEX.stances||{};DEX.stances[k]=true;saveDex();}};

/* bite variants with the upgraded forms */
function tsukiOnce(mul){const dx=Math.cos(P.ang),dy=Math.sin(P.ang),L=ST.range+90;fx.push({grab:true,x:P.x+dx*ST.r,y:P.y+dy*ST.r,a:P.ang,len:L,t:0,life:0.18});sfx('slash');
  for(const e of E){if(e.dead||e.z>18||e.state==='under'||e.friendly)continue;if(segDist(e.x,e.y,P.x,P.y,P.x+dx*(L+ST.r),P.y+dy*(L+ST.r))<e.r+16)damageEnemy(e,ST.dmg*mul*lvGap(P.lv,e.lv),P.x,P.y,300,ST.poison,{player:true});}}
stanceBite=function(){
  const k=ST.stance&&ST.stance.bite;if(!k)return false;const up=!!(ST.stanceUp&&ST.stanceUp.bite);const at=aimTarget();if(at)P.ang=Math.atan2(at.y-P.y,at.x-P.x);const dx=Math.cos(P.ang),dy=Math.sin(P.ang);
  if(k==='hasami'){P.biteCd=ST.cd*1.25;P.biteT=0.25;sfx('grab');let tg=null,bd=1e9;const reach=ST.range+(up?24:10);
    for(const e of E){if(e.dead||e.z>18||e.state==='under'||e.state==='den'||e.state==='seat'||e.T.ai==='sumo'||e.friendly)continue;const ex=e.x-P.x,ey=e.y-P.y,d=Math.hypot(ex,ey);if(d<ST.r+e.r+reach&&Math.abs(angDiff(P.ang,Math.atan2(ey,ex)))<ST.arc&&d<bd){bd=d;tg=e;}}
    if(!tg){P.vx+=dx*90;P.vy+=dy*90;return true;}
    if(isBig(tg)){damageEnemy(tg,ST.dmg*(up?1.7:1.35),P.x,P.y,up?700:500,0,{player:true});if(up&&!tg.dead){tg.brokenT=Math.max(tg.brokenT||0,1.2);tg.state='recover';tg.t=Math.max(tg.t||0,0.9);pop(tg.x,tg.y-tg.r-20,'よろめいた！','#c8452d',true);S.shake=8;}else pop(tg.x,tg.y-tg.r-20,'ぐいっ',INK);return true;}
    damageEnemy(tg,ST.dmg*0.9,P.x,P.y,0,0,{player:true});if(!tg.dead){const v=up?1150:900;tg.thrown=up?0.55:0.45;tg.thrownMul=up?1.8:1.4;tg.thrownHit=new Set([tg]);tg.vx=dx*v;tg.vy=dy*v;tg.state='recover';tg.t=1;pop(tg.x,tg.y-tg.r-20,up?'大ぶん投げ！':'ぶん投げ！','#c8452d',true);S.shake=up?9:6;}
    return true;}
  if(k==='tsuki'){P.biteCd=ST.cd*(up?1.45:1.2);P.biteT=0.22;P.vx+=dx*420;P.vy+=dy*420;tsukiOnce(1.15);
    if(up){after(0.11,()=>{P.vx+=Math.cos(P.ang)*260;P.vy+=Math.sin(P.ang)*260;tsukiOnce(0.8);});after(0.22,()=>{P.vx+=Math.cos(P.ang)*260;P.vy+=Math.sin(P.ang)*260;tsukiOnce(1.0);pop(P.x,P.y-36,'三段！','#c8452d');});}
    return true;}
  if(k==='sasu'){P.biteCd=ST.cd*(up?0.45:0.65);P.biteT=0.14;sfx('bite');const R=ST.range+12;
    for(const e of E){if(e.dead||e.z>18||e.state==='under'||e.friendly)continue;const ex=e.x-P.x,ey=e.y-P.y,d=Math.hypot(ex,ey);if(d<ST.r+e.r+R&&Math.abs(angDiff(P.ang,Math.atan2(ey,ex)))<0.7){
      damageEnemy(e,ST.dmg*(up?0.62:0.75)*lvGap(P.lv,e.lv),P.x,P.y,120,ST.poison+(up?11:8),{player:true});fx.push({x:e.x,y:e.y,vx:0,vy:-40,t:0,life:0.4,c:'#9a5fc2'});
      if(up){P.sasuN=(P.sasuN||0)+1;if(P.sasuN%3===0&&!e.dead){e.slowT=Math.max(e.slowT||0,1.6);if(!isBig(e)){e.state='recover';e.t=Math.max(e.t||0,0.7);e.vx=e.vy=0;}pop(e.x,e.y-e.r-18,'しびれ！','#9a5fc2',true);}}
      break;}}
    return true;}
  return false;
};
thrownTick=function(){for(const e of E){if(!e.thrown||e.dead)continue;e.thrown-=DT;const m=e.thrownMul||1.4;
  for(const o of E){if(o.dead||e.thrownHit.has(o)||o.z>18||o.state==='den'||o.T.ai==='sumo'||o.friendly)continue;if(Math.hypot(o.x-e.x,o.y-e.y)<o.r+e.r){e.thrownHit.add(o);damageEnemy(o,ST.dmg*m,e.x,e.y,420,0,{player:true});damageEnemy(e,ST.dmg*0.5,o.x,o.y,0,0,{player:true});S.shake=Math.max(S.shake,7);sfx('thud');}}
  if(e.thrown<=0){e.thrown=0;if(!e.dead)damageEnemy(e,ST.dmg*0.4,e.x,e.y,0,0,{player:true});}}};

/* 岩ごもり: cheaper guard and a shockwave on a just guard */
const _stamBlock23=stamBlock;stamBlock=function(from){const was=P.st??stamMax();const br=_stamBlock23(from);if(!br&&ST.stance&&ST.stance.roll==='komoru'&&ST.stanceUp&&ST.stanceUp.roll)P.st=Math.min(stamMax(),P.st+(was-P.st)*0.5);return br;};
const _justGuard23=justGuard;justGuard=function(from,dmg){const ok=_justGuard23(from,dmg);if(ok&&ST.stance&&ST.stance.roll==='komoru'&&ST.stanceUp&&ST.stanceUp.roll){fx.push({ring:true,x:P.x,y:P.y,r:110,t:0,life:0.35});S.shake=Math.max(S.shake,7);
  for(const e of E){if(e.dead||e.z>18||e.state==='den'||e.T.ai==='sumo'||e.friendly)continue;if(Math.hypot(e.x-P.x,e.y-P.y)<e.r+110)damageEnemy(e,ST.dmg*1.2,P.x,P.y,520,0,{player:true});}pop(P.x,P.y-60,'岩ごもり！','#2f6fb0',true);}return ok;};

/* ---------------- もぐる: enemies lose sight, and popping out behind them hurts ---------------- */
const DECOY={x:0,y:0,r:14,inv:999,dead:false,decoy:true};
function burrowTick(){
  if(moguruOn()){if(!P.burrowed){P.burrowed=true;P.burT=0;P.burX=P.x;P.burY=P.y;}P.burT+=DT;DECOY.x=P.burX;DECOY.y=P.burY;DECOY.r=ST.r;
    if(P.burT>0.45&&!P.lostShown){P.lostShown=true;for(const e of E){if(!e.dead&&e.state!=='den'&&e.state!=='wander'&&Math.hypot(e.x-P.x,e.y-P.y)<520)pop(e.x,e.y-e.r-22,'？',INK);}}}
  else{P.burrowed=false;P.lostShown=false;}}
const _pickTarget23=pickTarget;pickTarget=function(e){if(moguruOn()&&P.burT>0.45)return DECOY;return _pickTarget23(e);};
function behindOf(e){return Math.abs(angDiff(e.ang||0,Math.atan2(P.y-e.y,P.x-e.x)))>1.95;}
moguruPop=function(){const up=!!(ST.stanceUp&&ST.stanceUp.roll),R=up?125:80;
  fx.push({ring:true,x:P.x,y:P.y,r:R,t:0,life:0.35});S.shake=Math.max(S.shake,up?11:8);sfx('thud');for(let i=0;i<(up?22:14);i++)fx.push({x:P.x,y:P.y,vx:rnd(-260,260),vy:rnd(-260,260),t:0,life:0.5,c:'#7a5a34'});
  let back=false;
  for(const e of E){if(e.dead||e.z>18||e.state==='den'||e.state==='seat'||e.T.ai==='sumo'||e.friendly)continue;if(Math.hypot(e.x-P.x,e.y-P.y)>=e.r+R)continue;
    const bh=(P.burT||0)>0.45&&behindOf(e);damageEnemy(e,ST.dashDmg*1.3*(bh?2.2:1),P.x,P.y,bh?560:460,0,{player:true});
    if(bh){back=true;if(!e.dead){if(isBig(e))e.brokenT=Math.max(e.brokenT||0,1.4);else{e.state='recover';e.t=Math.max(e.t||0,1.2);}}}
    if(up&&!e.dead){e.slowT=Math.max(e.slowT||0,1.5);if(!isBig(e)){e.state='recover';e.t=Math.max(e.t||0,1.0);}}}
  if(back){pop(P.x,P.y-50,'うしろから！','#c8452d',true);S.flash=0.15;S.hitstop=Math.max(S.hitstop,0.08);tot('backPop',1);}
  for(const e of E)if(e.tg===DECOY)e.tg=null;P.inv=Math.max(P.inv,0.25);};
/* faster under the ground */
function moguruSpeed(){return ST.stanceUp&&ST.stanceUp.roll?0.95:0.8;}

/* ---------------- story events on the way to the last boss ---------------- */
const STORY_EV={
  hiari:[
    {at:2,kind:'ambush',name:'女帝の 伝令',lines:[['ヒアリの 伝令','女帝さまからの 伝言だ。「この林の 樹液は、もう 半分 わたしたちの もの」……だとよ。'],['ヒアリの 伝令','ついでに おまえも ここで 片づけて やる！']],spawn:[['hiari',4]],elite:'hiari',reward:{dango:1,xp:60}},
    {at:4,kind:'gift',name:'地元の 虫たちの 願い',lines:[['ハナムグリの おばあ','よそ者の アリに 花畑を 追われちまってねえ……。'],['ハナムグリの おばあ','女帝は 地面を ゆらす わざと、つづけて 突っこむ わざを 使うそうだよ。紫の わざは 見切るんだ。これを もっていきな。']],reward:{dango:2,heal:true}}],
  hachi:[
    {at:2,kind:'ambush',name:'斥候の 偵察',lines:[['スズメバチの 斥候','ブゥン……地べたの 丸虫が、女王さまの 狩り場を うろつくな！']],spawn:[['hachi',3],['kumabachi',1]],elite:'hachi',reward:{dango:1,xp:60}},
    {at:4,kind:'gift',name:'ミツバチの 使い',lines:[['ミツバチの 使い','巣を おそわれて、仲間が たくさん……。どうか 女王を 止めて。'],['ミツバチの 使い','女王の 針は まるまっても ふせげない わざが 多いの。ぎりぎりで かわせば すきが できるわ。']],reward:{dango:2,heal:true}}],
  kuwa:[
    {at:2,kind:'ambush',name:'ミヤマの 果たし状',lines:[['ミヤマの 若い衆','おめえが うわさの 丸虫か。親分の 前に、おれが 相手だ！']],spawn:[['kokuwa',2]],elite:'hirata',reward:{dango:1,xp:70}},
    {at:4,kind:'gift',name:'コクワの 長老',lines:[['コクワの 長老','わしらは もとは ミヤマ一家の 下で はたらいておった。'],['コクワの 長老','大親分の 角は 重い。まるまって うけるより、地ならしを かわして ふところへ 入るんじゃ。']],reward:{dango:2,heal:true}}],
  kama:[
    {at:2,kind:'ambush',name:'門下生の 腕だめし',lines:[['道場の 門下生','師範代の 前に、われら 門下生が お相手 いたす！'],['道場の 門下生','三人 そろって、いざ！']],spawn:[['kamakiriko',2]],elite:'kamakiriko',reward:{dango:1,xp:60}},
    {at:4,kind:'gift',name:'ハナカマキリの 旅人',lines:[['ハナカマキリの 旅人','あの 道場には 昔 いたの。大師範の 斬りこみは 速いけど、まっすぐよ。'],['ハナカマキリの 旅人','横へ かわして、うしろを とりなさい。これは 旅の おみやげ。']],reward:{dango:2,heal:true}}],
  kabuto:[
    {at:2,kind:'ambush',name:'親衛隊の 見回り',lines:[['親衛隊の 見回り','若頭の めいれいだ。番長を 見つけたら、ここで 止めろ と！']],spawn:[['kanabun',3]],elite:'kanabun',reward:{dango:1,xp:60}},
    {at:4,kind:'gift',name:'番長たちの 声援',lines:[['地べたの 番長 オサ','若頭の やつ、ひと冬 ずっと 木に 体当たり してたらしいぜ。'],['水辺の 番長','去年の おまえとは ちがうと 言っていた。だが、おまえも 去年の おまえじゃ ない。行け！']],reward:{dango:2,heal:true}}]
};
const _rollStory23=rollStory;rollStory=function(){_rollStory23();S.storyEv={};S.evWave=null;};
const _snap23=snapSave;snapSave=function(){const o=_snap23();o.storyEv=S.storyEv||{};return o;};
const _apply23=applySave;applySave=function(s){_apply23(s);S.storyEv=s.storyEv||{};S.evWave=null;};
function storyEvList(){const st=story();if(!st)return [];return STORY_EV[S.story||'hiari']||[];}
function evSpot(){for(let k=0;k<12;k++){const a=rnd(0,TAU),d=rnd(260,340),x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d;if(!blocked(x,y,20))return {x,y};}return {x:P.x+rnd(-200,200),y:P.y-260};}
function storyEvTick(){
  if(S.evArea!==S.areaI||S.evMap!==MAP){S.evArea=S.areaI;S.evMap=MAP;S.evT=0;if(S.evWave){S.evWave=null;}}
  if(S.state!=='play'||!MAP||MAP.dojo)return;S.evT=(S.evT||0)+DT;
  const W=S.evWave;
  if(W){const left=W.ids.filter(id=>E.some(e=>e.id===id&&!e.dead)).length;if(!left){S.evWave=null;evReward(W.ev);}return;}
  if(S.talk||S.bossBar||S.evT<7||S.cycle<1)return;
  const ev=storyEvList().find(v=>v.at===S.areaI&&!(S.storyEv||{})[v.at]);if(!ev)return;
  if(engagedBigs().length||E.some(e=>!e.dead&&e.state==='chase'&&Math.hypot(e.x-P.x,e.y-P.y)<260))return;
  (S.storyEv=S.storyEv||{})[ev.at]=true;startStoryEv(ev);
}
function startStoryEv(ev){
  toast('物語の できごと','「'+ev.name+'」');
  const lines=ev.lines.map(([who,text])=>({who,text}));
  if(ev.kind==='ambush'){say(lines,()=>{const ids=[];const p=evSpot();
      if(ev.elite){const h=spawnEnemy(ev.elite,p.x,p.y,{elite:true,lv:areaLv()+1});h.state='chase';h.met=true;h.storyEv=true;ids.push(h.id);}
      for(const [t,n] of ev.spawn)for(let i=0;i<n;i++){const e=spawnEnemy(t,p.x+rnd(-70,70),p.y+rnd(-70,70));e.state='chase';e.storyEv=true;ids.push(e.id);}
      S.evWave={ev,ids};sfx('roar');S.shake=Math.max(S.shake,5);pop(P.x,P.y-60,ev.name+'！','#c8452d',true);});}
  else say(lines,()=>evReward(ev));
  diary('物語：「'+ev.name+'」。');
}
function evReward(ev){const R=ev.reward||{};if(R.dango)gainDango(R.dango,P.x,P.y);if(R.xp)addXP(R.xp,P.x,P.y-40);if(R.heal){healPlayer(ST.maxhp);P.st=stamMax();}
  if(ev.kind==='ambush'){pop(P.x,P.y-70,'「'+ev.name+'」 しのいだ！','#b8860b',true);sfx('fanfare');}tot('storyEv',1);checkAch();}
ACHS.push({id:'kiwami',name:'かた を きわめし者',desc:'かた の きわみ を 1つ ひらく'},{id:'backpop',name:'土の 中の 刺客',desc:'もぐって 敵の うしろから 10回 飛びだす'},{id:'storyev6',name:'林の 語りべ',desc:'物語の できごとに 6回 であう'});
