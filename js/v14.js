'use strict';
/* =====================================================================
   ひと夏の番長 — v14: follower personality & bond talks, typhoon summers,
   terrain gimmicks in every boss lair
   ===================================================================== */

/* ---------------- follower personality ---------------- */
const ALLY_TRAITS={
  kenage:{name:'けなげ',desc:'兄貴の 体力が 半分を 切ると、攻撃が 1.5倍'},
  ganko:{name:'がんこ',desc:'うける ダメージ -25%'},
  hayaashi:{name:'はやあし',desc:'足が はやく、わざの 待ち時間 -20%'},
  kuishinbo:{name:'くいしんぼう',desc:'敵を たおすと 自分も 兄貴も 回復'},
  nekketsu:{name:'熱血',desc:'絆ゲージが 1.4倍 たまる'},
  kyouun:{name:'強運',desc:'一緒に いると 部位が 落ちやすい'},
  tafu:{name:'タフ',desc:'体力が 1.3倍'}
};
const GRADES=[{n:'並',c:'#8a7a60'},{n:'良',c:'#5f7d3a'},{n:'優',c:'#2f6fb0'},{n:'極',c:'#c8452d'}];
function allyGrade(r){const v=r.iv?(r.iv.hp+r.iv.dmg)/2:1;return v>=1.17?3:v>=1.08?2:v>=0.99?1:0;}
function rollAlly(r,o){
  o=o||{};const lo=(o.keeper?0.95:o.elite?0.92:0.84)+(o.dango?0.1:0),hi=(o.keeper||o.elite?1.26:1.22)+(o.dango?0.04:0);
  r.iv={hp:+rnd(lo,hi).toFixed(2),dmg:+rnd(lo,hi).toFixed(2)};
  const keys=Object.keys(ALLY_TRAITS);r.trait=Math.random()<(o.keeper?0.85:o.elite?0.75:0.55)+(o.dango?0.3:0)?pick(keys):null;
  const rareCh=(o.keeper?0.15:o.elite?0.14:0.06)*(o.dango?2.5:1);
  if(Math.random()<rareCh){const own=skillOf(r.type);r.rare=pick(Object.keys(ALLY_SKILLS).filter(k=>k!==own));}else r.rare=null;
  r.bt=r.bt||0;r.kz=r.kz||0;return r;
}
function ensureAllyRolls(){for(const r of S.roster||[])if(!r.iv)rollAlly(r,{keeper:r.keeper});}
function allyHas(r,t){return !!r&&r.trait===t;}
function allyTraitLine(r){const g=GRADES[allyGrade(r)];return '<b style="color:'+g.c+'">こせい '+g.n+'</b>'+(r.trait?' ・ <b>'+ALLY_TRAITS[r.trait].name+'</b>':'')+(r.rare?' ・ <b style="color:#b8860b">秘伝「'+ALLY_SKILLS[r.rare].name+'」</b>':'');}
function allyTraitText(r){const g=GRADES[allyGrade(r)];return 'こせい '+g.n+(r.trait?' ・ '+ALLY_TRAITS[r.trait].name:'')+(r.rare?' ・ 秘伝わざ「'+ALLY_SKILLS[r.rare].name+'」':'');}

/* ---------------- bonds (絆) and talks at the leaf house ---------------- */
const KZ_NEED=[90,300,720];
const KZ_REWARD=['連携わざの 威力 +12%','絆ゲージが たまりやすく、子分が 少し 強くなった','連携わざが「絆・」に なった（さらに 強く、すみかの 仲間も かけつける）'];
function kzReady(r){return !!r&&r.kz<3&&(r.bt||0)>=KZ_NEED[r.kz];}
/* talks per signature family; A = follower, B = the boss (ダンゴムシ) */
const KZ_TALKS={
  nage:[
    [['A','兄貴、ちょっと いいすか。おれ、ガキの ころから 力だけが 自慢で。'],['A','でも 力だけじゃ 番長には なれねえって、兄貴を 見てて わかったんす。'],['B','（……おれは 力が ないから、まるまってた だけだけどな）'],['A','そこが すげえんすよ！']],
    [['A','昔、でっかい ドングリを 投げとばして、林の 外まで 飛ばしたことが あるんす。'],['A','……うそです。ちょっと 盛りました。'],['B','（どのくらい？）'],['A','となりの 切り株まで っす。']],
    [['A','兄貴。来年も、その次の 夏も、おれを つれてってください。'],['A','兄貴を 投げとばす 役は、おれ以外に まかせられねえ。'],['B','（……たのんだぞ、相棒）']]],
  ito:[
    [['A','あんた、糸の あつかいって 知ってる？ 一本じゃ すぐ 切れるのよ。'],['A','でも 何本も より合わせると、雨にも 風にも まけない。'],['B','（子分たちと 同じだな）'],['A','……ふふ。わかってるじゃない。']],
    [['A','あたしの 母さんはね、朝つゆを 巣に いっぱい ためて 光らせる 名人だったの。'],['A','林じゅうの 虫が 見に きたわ。きれいすぎて、だれも エサに ならなかったけど。'],['B','（それは 困るな……）']],
    [['A','あんたの 背中、ずいぶん 大きく なったわね。'],['A','最初に 会ったときは、ただの 丸い 石ころかと 思ったのに。'],['A','……この先も、あたしが 背中を 守ってあげる。']]],
  mitsu:[
    [['A','兄貴！ きょうも 花を 37個 まわりました！'],['A','巣の みんなに おみやげの 蜜を とどけるのが、ぼくの しごとなんです。'],['B','（えらいな……）'],['A','兄貴にも、とっておきを わけますね！']],
    [['A','女王さまに 言われたんです。「ほんとうの 甘さは、わけあうと ふえる」って。'],['A','ぼく、その意味が やっと わかった 気が します。'],['B','（……樹液も、ひとりで 飲むより うまいかもな）']],
    [['A','兄貴、ぼくの 羽、ぼろぼろに なっちゃいました。'],['A','でも ふしぎと、ぜんぜん 悲しく ないんです。兄貴と 飛びまわった しるしだから。'],['B','（ありがとう。ずっと たすかってる）']]],
  nioi:[
    [['A','……兄貴、ぼく、くさいでしょ。'],['A','みんな ぼくが 来ると にげるんです。だから ずっと ひとりで。'],['B','（おれは 気に ならないぞ）'],['A','……ほんとに？ 鼻、ついてます？']],
    [['A','このにおい、じつは 母ちゃん ゆずりなんです。'],['A','母ちゃんは においで 鳥を 追いはらって、ぼくら 兄弟を 守ったって。'],['B','（りっぱな においだ）'],['A','そ、そんなふうに 言われたの、はじめてです……！']],
    [['A','兄貴、ぼく もう においを はずかしいって 思わないことに しました。'],['A','兄貴を 守るための、ぼくの 武器ですから！'],['A','……でも ちょっと 風上には 立たないでくださいね。']]],
  kama:[
    [['A','兄者。拙者、刃を ふるう 理由を ずっと さがして おった。'],['A','強さの ため、勝つため……どれも しっくり こなかった。'],['B','（いまは？）'],['A','……兄者の 道を ひらくため。それで 十分で ござる。']],
    [['A','拙者の 師匠は、葉っぱ 一枚を 百に 切りわける 達人で あった。'],['A','されど 師は 言った。「本当に 切るべきは、己の まよいだ」と。'],['B','（……むずかしいな）'],['A','拙者にも わからぬ。はっはっは。']],
    [['A','兄者、ひとつ たのみが ござる。'],['A','この夏が 終わっても、拙者を 子分と 呼んで くだされ。'],['B','（あたりまえだ）'],['A','……かたじけない。']]],
  shippu:[
    [['A','兄貴、おそいっす！ でも、それが いいんすよね。'],['A','おれ 速すぎて、いつも 景色を 見のがしてて。兄貴と いると 林が よく 見えるっす。'],['B','（……ほめられてるのか？）']],
    [['A','昔 チョウと 競走して 負けたこと あるんす。'],['A','あっちは 風に 乗ってた。ずるいっす。'],['A','でも 兄貴の 連携なら、風より 速く 走れる 気が するっす！']],
    [['A','兄貴、おれ 決めたっす。'],['A','いちばん 速い 虫じゃなくて、いちばん 早く 兄貴の となりに かけつける 虫に なるっす。'],['B','（たのもしいな）']]],
  mawari:[
    [['A','……兄貴。おれ、しゃべるの にがてで。'],['A','でも 盾に なるのは とくい。かたいから。'],['B','（いつも ありがとうな）'],['A','……………（てれている）']],
    [['A','おれの から、キズだらけ だろ。'],['A','ひとつ ひとつ、だれかを 守った 数なんだ。'],['A','この 夏の キズは、ぜんぶ 兄貴の ぶん。']],
    [['A','兄貴。おれ、ずっと うしろに いる。'],['A','前は 兄貴が 行けば いい。うしろは、おれが ふさぐ。'],['B','（最強の 背中だ）']]],
  tobi:[
    [['A','兄貴！ 見てました？ さっきの ジャンプ！'],['A','あと ちょっとで 雲に とどくとこ でした！'],['B','（さすがに それは……）'],['A','とどく 気持ちで 跳ぶのが 大事なんです！']],
    [['A','ぼく、小さいころ 跳ぶのが こわかったんです。'],['A','着地で ころぶのが いやで。でも 兄貴、ころんでも 丸まって 起きあがるでしょ？'],['A','あれ 見て、ぼくも こわくなくなったんです。']],
    [['A','兄貴を けりとばすの、最初は 気が ひけてたけど……'],['A','いまは 兄貴が どこへ 飛んでいっても、ぜったい 追いつける 自信が あります！'],['B','（……たよりに してるぞ）']]],
  rinpun:[
    [['A','兄貴の 背中から 見る 林は、とても きれい。'],['A','わたし、空からしか 林を 見たことが なかったの。'],['B','（地べたからの ながめも、わるくないだろ）'],['A','ええ。こんなに 近くで 花を 見たの、はじめて。']],
    [['A','わたしの 羽の 粉はね、生まれた 花畑の 色なの。'],['A','いつか 兄貴にも 見せたいな。夕方に なると、ぜんぶ 金色に そまるのよ。']],
    [['A','兄貴。夏が 終わったら、わたしは 遠くへ 飛んでいくかもしれない。'],['A','でも どこに いても、兄貴の 話を するわ。地べたから 番長に なった、まるい 虫の 話。'],['B','（……また 来年な）']]]
};
function kzTalk(idx){
  const r=S.roster[idx];if(!kzReady(r))return;const fam=skillOf(r.type),ep=KZ_TALKS[fam][r.kz];
  const lines=ep.map(([w,t])=>({who:w==='A'?r.name:'ダンゴムシ',text:t}));
  const u=UIH();if(!u)return;
  $('sumikaCard').hidden=true;
  say(lines,()=>{r.kz++;sfx('star');DEX.kizuna=Math.max(DEX.kizuna||0,r.kz);saveDex();diary(r.name+'と 話した。絆が ふかまった。');
    banner('絆が ふかまった（'+r.kz+'/3）',KZ_REWARD[r.kz-1]);if((ALLY&&ALLY.rec===r)||(ALLY2&&ALLY2.rec===r))spawnAlly();
    writeSave();$('sumikaCard').hidden=false;homeTab='ally';u.renderHome();checkAch();});
}
function tickBond(){
  if(S.dojo||S.state!=='play')return;for(const A of allies()){const r=A.rec;const was=kzReady(r);r.bt=(r.bt||0)+DT;
  if(!was&&kzReady(r)){pop(A.x,A.y-A.r-26,'（兄貴、あとで 話が……）','#5f7d3a',true);banner(r.name+'が 話したそうだ','すみかの「なかま」で 話せる');}}
}

/* ---------------- typhoon summers (3年目〜) ---------------- */
function isTyphoon(){return theme()==='taifu'&&!S.dojo&&!!MAP&&!MAP.dojo;}
function windTick(){
  if(!isTyphoon()){S.wind=null;return;}
  const w=S.wind=S.wind||{ang:rnd(0,TAU),ph:'calm',t:rnd(6,10),k:0};
  w.ang+=Math.sin(S.t*0.07)*DT*0.15;w.t-=DT;
  if(w.ph==='calm'&&w.t<=0){w.ph='warn';w.t=1.3;w.ang=rnd(0,TAU);sfx('whistle');}
  else if(w.ph==='warn'&&w.t<=0){w.ph='gust';S.gusts=(S.gusts||0)+1;w.t=2.2;S.shake=Math.max(S.shake,4);sfx('buzz');if(!S.windTold){S.windTold=true;banner('突風だ！','まるまっていれば 飛ばされない');}}
  else if(w.ph==='gust'&&w.t<=0){w.ph='calm';w.t=rnd(8,14)*(S.bossBar?0.8:1);}
  const target=w.ph==='gust'?1:w.ph==='warn'?0.25:0.12;w.k+=(target-w.k)*Math.min(1,DT*4);
  const wx=Math.cos(w.ang),wy=Math.sin(w.ang),F=145*w.k;
  if(!S.rk&&!S.sumo){const m=P.rolled?0.15:P.dashT>0?0.6:1;P.x+=wx*F*m*DT;P.y+=wy*F*m*DT;collide(P,ST.r,{water:ST.water,glide:P.glideT>0});}
  for(const e of E){if(e.dead||e.state==='den'||e.state==='seat'||e.T.ai==='sumo'||e.state==='under')continue;const fly=e.T.ai==='flyer'||e.T.fly;const m=(e.T.boss?0.25:e.T.keeper||e.T.nushi?0.4:1)*(fly?1.5:0.8);e.x+=wx*F*m*DT;e.y+=wy*F*m*DT;}
  for(const s of shots){if(!s.dead){s.x+=wx*F*0.8*DT;s.y+=wy*F*0.8*DT;}}
}
function drawWindScreen(){
  const w=S.wind;if(!w||w.k<0.05)return;const D=Math.hypot(W,Hh)/2+80;
  ctx.save();ctx.translate(W/2,Hh/2);ctx.rotate(w.ang);ctx.lineCap='round';ctx.strokeStyle='rgba(255,255,255,'+(0.15+0.35*w.k)+')';
  const n=Math.round(10+44*w.k);for(let i=0;i<n;i++){const sp=(500+hash(i)*600)*(0.3+w.k),L=18+70*w.k+hash(i+3)*30,x=((hash(i+7)*D*2+S.t*sp)%(D*2))-D,y=hash(i+11)*D*2-D;ctx.lineWidth=1+hash(i+5)*2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-L,y);ctx.stroke();}
  for(let i=0;i<Math.round(14*w.k);i++){const sp=420*(0.4+w.k),x=((hash(i+40)*D*2+S.t*sp)%(D*2))-D,y=hash(i+50)*D*2-D+Math.sin(S.t*3+i)*20;ctx.save();ctx.translate(x,y);ctx.rotate(S.t*8+i);drawDecor({k:'oak',x:0,y:0,a:0,s:9,c:['#7a8a3a','#a86a2a','#5f7d3a'][i%3]});ctx.restore();}
  if(w.ph==='warn'){ctx.globalAlpha=0.5+0.4*Math.sin(S.t*16);ctx.fillStyle='#fff';ctx.strokeStyle=INK;ctx.lineWidth=4;for(const o of [-80,0,80]){ctx.beginPath();ctx.moveTo(o+44,0);ctx.lineTo(o,-24);ctx.lineTo(o+12,0);ctx.lineTo(o,24);ctx.closePath();ctx.stroke();ctx.fill();}ctx.globalAlpha=1;}
  ctx.restore();
}
/* ---------------- boss-lair gimmicks ---------------- */
const BG_INFO={
  jibeta:{t:'どんぐりが 落ちてくる！',s:'影の 下に オサを さそいこめ'},
  kusamura:{t:'草の 糸が はられた！',s:'カマ蔵の 突進を 糸に ひっかけろ。突進すれば 糸は 切れる'},
  ogawa:{t:'水が わきだす！',s:'水たまりの中では 回復される。かわいた 所へ さそいだせ'},
  hanabatake:{t:'大きな 花が ひらいた！',s:'ひらいた 花を かむと 花粉が ふきだす'},
  kuchiki:{t:'足もとが くずれる！',s:'ひびの 上に クワガタを さそいこめ'},
  miki:{t:'風が ふきぬける！',s:'風上に 立てば、敵は 風に あおられて ひるむ。まるまれば 飛ばされない'},
  sakaba:{t:'樹液が したたる！',s:'若頭の 突進を 樹液だまりへ さそえ'}
};
function bgRand(m){const g=S.bg;for(let k=0;k<30;k++){const a=rnd(0,TAU),d=Math.sqrt(Math.random())*(280-m*0.3);const x=g.cx+Math.cos(a)*d,y=g.cy+Math.sin(a)*d;if(x>60&&y>60&&x<MAP.w-60&&y<MAP.h-60&&!blocked(x,y,20))return {x,y};}return {x:g.cx,y:g.cy};}
function bgNear(o,sp){return {x:clamp(o.x+rnd(-sp,sp),60,MAP.w-60),y:clamp(o.y+rnd(-sp,sp),60,MAP.h-60)};}
function stunBoss(e,t,text){if(e.dead)return;e.state='recover';e.t=t;e.vx=e.vy=0;e.brokenT=Math.max(e.brokenT||0,t+1);S.shake=Math.max(S.shake,10);sfx('thud');pop(e.x,e.y-e.r-30,text,'#c8452d',true);vib(40);tot('gimmick',1);}
function bossRushing(e){return Math.hypot(e.vx,e.vy)>190||/charge|rush|dash|dive|leap/.test(e.state||'');}
function bgTick(){
  const b=S.bossBar;
  if(!b||b.dead||!(b.lair||b.T.keeper)||!MAP||S.dojo){S.bg=null;return;}
  if(!S.bg||S.bg.e!==b){const id=AREA().id;S.bg={e:b,id,t:0,cd:2.5,items:[],lvl:0,cx:(b.x+P.x)/2,cy:(b.y+P.y)/2,cdm:b.T.keeper?1.4:1};if(BG_INFO[id])later(()=>{if(S.bg&&S.bg.e===b)banner(BG_INFO[id].t,BG_INFO[id].s);},1800);
    if(id==='hanabatake'){for(let i=0;i<3;i++){const p=bgRand(60);S.bg.items.push({k:'flower',x:p.x,y:p.y,cd:i*1.5+1,open:0});}}}
  const g=S.bg,L=MAP.lair,ph2=b.phase===2;g.t+=DT;g.cd-=DT/g.cdm;
  {const tx=(b.x*0.6+P.x*0.4),ty=(b.y*0.6+P.y*0.4);g.cx+=(tx-g.cx)*Math.min(1,DT*1.5);g.cy+=(ty-g.cy)*Math.min(1,DT*1.5);}
  const pin=Math.hypot(P.x-b.x,P.y-b.y)<700;
  switch(g.id){
    case 'jibeta':{
      if(g.cd<=0&&pin){g.cd=ph2?2.2:3.0;const near=Math.random()<0.55?b:P;const p=bgNear(near,70);g.items.push({k:'acorn',x:p.x,y:p.y,t:1.35,T:1.35});}
      for(const it of g.items){it.t-=DT;if(it.t<=0&&!it.done){it.done=true;fx.push({ring:true,x:it.x,y:it.y,r:60,t:0,life:0.35});S.shake=Math.max(S.shake,7);sfx('thud');
        for(let i=0;i<10;i++)fx.push({x:it.x,y:it.y,vx:rnd(-160,160),vy:rnd(-160,160),t:0,life:0.4,c:'#a8743a'});
        if(Math.hypot(P.x-it.x,P.y-it.y)<46+ST.r){if(P.rolled){pop(P.x,P.y-30,'カキン！',INK,true);sfx('clink');}else{hurtPlayer(ST.maxhp*0.12,null,{src:'acorn'});P.stunT=Math.max(P.stunT,0.5);}}
        if(Math.hypot(b.x-it.x,b.y-it.y)<46+b.r){stunBoss(b,1.8,'どんぐり 直撃！');damageEnemy(b,b.maxhp*0.04,it.x,it.y,0,0,{force:true});}
        for(const e of E)if(e!==b&&!e.dead&&Math.hypot(e.x-it.x,e.y-it.y)<46+e.r)damageEnemy(e,e.maxhp*0.5,it.x,it.y,200,0,{force:true});
        if(Math.random()<0.5)foods.push({x:it.x,y:it.y,a:rnd(0,TAU),kind:'acorn',bob:0});}}
      g.items=g.items.filter(it=>it.t>-0.4);break;}
    case 'kusamura':{
      for(const it of g.items)if(Math.hypot(it.x-g.cx,it.y-g.cy)>650)it.cut=true;
      if(g.cd<=0&&g.items.length<3){g.cd=ph2?4:5.5;const p=bgRand(90),a=rnd(0,Math.PI);g.items.push({k:'strand',x:p.x,y:p.y,a,len:280,born:0});sfx('web');}
      for(const it of g.items){it.born=Math.min(1,it.born+DT*1.5);if(it.born<1)continue;const dx=Math.cos(it.a),dy=Math.sin(it.a),seg=(o,r)=>{const ox=o.x-it.x,oy=o.y-it.y,al=ox*dx+oy*dy;return Math.abs(al)<it.len/2&&Math.abs(-ox*dy+oy*dx)<r;};
        if(seg(P,ST.r+4)){if(P.dashT>0){it.cut=true;pop(P.x,P.y-24,'ぷちっ',INK);sfx('web');}else P.slowT=Math.max(P.slowT,0.25);}
        if(!it.cut&&seg(b,b.r+4)&&bossRushing(b)){it.cut=true;stunBoss(b,1.7,'ひっかかった！');}}
      g.items=g.items.filter(it=>!it.cut);break;}
    case 'ogawa':{
      g.lvl=0.5-0.5*Math.cos(g.t*TAU/15);
      if(!g.pools){g.pools=[0,1].map(i=>({ox:(i?1:-1)*rnd(90,150),oy:rnd(-80,80)}));}
      for(const pl of g.pools){pl.x=g.cx+pl.ox;pl.y=g.cy+pl.oy;pl.r=40+g.lvl*110;}
      const wasHigh=g.high;g.high=g.lvl>0.6;if(g.high&&!wasHigh)banner('水が わいてきた！','水の中の ザリは 回復する');
      const inPool=o=>g.pools.some(pl=>Math.hypot(o.x-pl.x,o.y-pl.y)<pl.r);
      if(inPool(P)&&!ST.water&&!(P.glideT>0))P.slowT=Math.max(P.slowT,0.2);
      if(inPool(b)){b.hp=Math.min(b.maxhp,b.hp+b.maxhp*0.004*DT);if(Math.random()<DT*3)fx.push({x:b.x+rnd(-20,20),y:b.y,vx:0,vy:-60,t:0,life:0.5,c:'#9be07a'});}
      else if(g.lvl<0.25)b.brokenT=Math.max(b.brokenT||0,0.2);
      break;}
    case 'hanabatake':{
      for(const it of g.items){it.cd-=DT;if(!it.open&&Math.hypot(it.x-g.cx,it.y-g.cy)>520){const p=bgRand(60);it.x=p.x;it.y=p.y;}if(it.cd<=0&&!it.open){it.open=1;sfx('star');}
        if(it.open&&P.biteT>0.12&&Math.hypot(P.x-it.x,P.y-it.y)<62){it.open=0;it.cd=ph2?6:8;sfx('spore');clouds.push({x:it.x,y:it.y,r:130,t:0,life:1.8,kind:'allydust',dmg:ST.dmg*0.3});pop(it.x,it.y-40,'ぶわっ！','#d9a21b',true);
          for(let i=0;i<20;i++)fx.push({x:it.x,y:it.y,vx:rnd(-220,220),vy:rnd(-220,220),t:0,life:0.8,c:pick(['#f2d35a','#fff3c4','#f4a6c4'])});
          for(const e of E){if(e.dead||Math.hypot(e.x-it.x,e.y-it.y)>140+e.r)continue;if(e===b)stunBoss(b,2.0,'へっくしょん！');else if(!e.T.boss){e.state='flee';e.fleeT=3;}}}}
      break;}
    case 'kuchiki':{
      if(g.cd<=0&&pin){g.cd=ph2?2.8:3.8;const near=Math.random()<0.6?b:P;const p=bgNear(near,50);g.items.push({k:'crack',x:p.x,y:p.y,t:1.5,hole:0,r:52});sfx('clink');}
      for(const it of g.items){if(it.t>0){it.t-=DT;if(it.t<=0){it.hole=3.6;sfx('burrow');S.shake=Math.max(S.shake,6);for(let i=0;i<12;i++)fx.push({x:it.x,y:it.y,vx:rnd(-120,120),vy:rnd(-120,120),t:0,life:0.5,c:'#6a4a2a'});}continue;}
        it.hole-=DT;if(it.hole<=0)continue;
        if(Math.hypot(P.x-it.x,P.y-it.y)<it.r&&!(P.dashT>0)){hurtPlayer(ST.maxhp*0.1,null,{src:'hole'});const a=Math.atan2(P.y-it.y,P.x-it.x);P.x=it.x+Math.cos(a)*(it.r+ST.r+6);P.y=it.y+Math.sin(a)*(it.r+ST.r+6);P.stunT=Math.max(P.stunT,0.4);pop(P.x,P.y-30,'あぶない！',INK,true);}
        if(!it.got&&Math.hypot(b.x-it.x,b.y-it.y)<it.r){it.got=true;stunBoss(b,2.3,'おちた！');damageEnemy(b,b.maxhp*0.05,it.x,it.y,0,0,{force:true});}
        for(const e of E)if(e!==b&&!e.dead&&!e.T.keeper&&Math.hypot(e.x-it.x,e.y-it.y)<it.r){damageEnemy(e,e.maxhp,it.x,it.y,0,0,{force:true});}}
      g.items=g.items.filter(it=>it.t>0||it.hole>0);break;}
    case 'miki':{
      g.gt=(g.gt??6)-DT/g.cdm;if(g.gt<=0&&!g.gust){g.warn=(g.warn||0)+DT;if(!g.ang)g.ang=Math.atan2(b.y-P.y,b.x-P.x)+rnd(-0.6,0.6);if(g.warn>1.2){g.gust=2;g.warn=0;g.pushed=0;sfx('buzz');}}
      if(g.gust>0){g.gust-=DT;const wx=Math.cos(g.ang),wy=Math.sin(g.ang);if(!P.rolled){P.x+=wx*150*DT;P.y+=wy*150*DT;collide(P,ST.r,{});}
        const fly=b.T.ai==='flyer'||b.T.fly,sp=fly?280:120;b.x+=wx*sp*DT;b.y+=wy*sp*DT;g.pushed+=sp*DT;
        if(!g.hit&&(g.pushed>200||blocked(b.x,b.y,b.r*0.6)||b.x<b.r||b.y<b.r||b.x>MAP.w-b.r||b.y>MAP.h-b.r)){g.hit=true;b.x=clamp(b.x,b.r,MAP.w-b.r);b.y=clamp(b.y,b.r,MAP.h-b.r);stunBoss(b,1.8,'風に あおられた！');damageEnemy(b,b.maxhp*0.04,b.x,b.y,0,0,{force:true});}
        if(g.gust<=0){g.gt=ph2?5:7;g.hit=false;g.ang=0;}}
      break;}
    case 'sakaba':{
      if(g.cd<=0&&g.items.filter(i=>i.k==='sap').length<5){g.cd=ph2?2.8:3.6;const p=Math.random()<0.5?bgNear(P,90):bgRand(80);g.items.push({k:'drip',x:p.x,y:p.y,t:1.1});}
      for(const it of g.items){if(it.k==='drip'){it.t-=DT;if(it.t<=0){it.k='sap';it.life=11;it.r=54;sfx('splash');}continue;}
        it.life-=DT;if(Math.hypot(P.x-it.x,P.y-it.y)<it.r&&P.dashT<=0)P.slowT=Math.max(P.slowT,0.25);
        if(!it.used&&Math.hypot(b.x-it.x,b.y-it.y)<it.r+b.r*0.5&&bossRushing(b)){it.used=true;stunBoss(b,1.9,'ねばねば！');}}
      g.items=g.items.filter(it=>it.k==='drip'||(it.life>0&&!it.used));break;}
  }
}
function drawBgWorld(){
  const g=S.bg;if(!g)return;const L=MAP.lair;
  for(const it of g.items){
    if(it.k==='acorn'&&!it.done){const k=1-it.t/it.T;ctx.fillStyle='rgba(20,10,5,'+(0.15+0.35*k)+')';ctx.beginPath();ctx.ellipse(it.x,it.y,20+26*k,12+16*k,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(200,69,45,'+(0.5+0.4*Math.sin(S.t*20))+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(it.x,it.y,46,0,TAU);ctx.stroke();
      const y=it.y-Math.pow(it.t/it.T,1.6)*420;ctx.save();ctx.translate(it.x,y);inked(ellP(0,4,13,17),'#a8743a',2);inked(ellP(0,-11,14,7),'#6a4a2a',2);ctx.restore();}
    else if(it.k==='strand'){const dx=Math.cos(it.a)*it.len/2,dy=Math.sin(it.a)*it.len/2;ctx.strokeStyle='rgba(250,250,250,'+(0.85*it.born)+')';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(it.x-dx,it.y-dy);ctx.lineTo(it.x+dx,it.y+dy);ctx.stroke();ctx.strokeStyle='rgba(250,250,250,'+(0.4*it.born)+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(it.x-dx,it.y-dy+4);ctx.lineTo(it.x+dx,it.y+dy+4);ctx.stroke();for(let k=-2;k<=2;k++)dot(it.x+dx*k/2.5,it.y+dy*k/2.5,2.5,'rgba(255,255,255,.9)');}
    else if(it.k==='flower'){const o=it.open;ctx.save();ctx.translate(it.x,it.y);if(o){const gl=ctx.createRadialGradient(0,0,4,0,0,70);gl.addColorStop(0,'rgba(255,240,160,.55)');gl.addColorStop(1,'rgba(255,240,160,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,70,0,TAU);ctx.fill();}
      const n=8,R=o?30:16;for(let i=0;i<n;i++){const a=i/n*TAU+S.t*0.3*o;inked(ellP(Math.cos(a)*R*0.7,Math.sin(a)*R*0.7,R*0.55,R*0.3,a),o?'#f4a6c4':'#7aa04a',1.5);}dot(0,0,o?11:7,o?'#f2c43a':'#5f7d3a');ctx.restore();
      if(o){ctx.font='900 12px '+FONT;ctx.textAlign='center';ctx.fillStyle=INK;ctx.fillText('かむ！',it.x,it.y-44-Math.abs(Math.sin(S.t*5))*4);}}
    else if(it.k==='crack'){if(it.t>0){ctx.strokeStyle='rgba(30,15,5,'+(0.4+0.5*(1-it.t/1.5))+')';ctx.lineWidth=2.5;for(let i=0;i<7;i++){const a=i/7*TAU+hash(i+it.x)*0.6,l=it.r*(0.5+0.5*(1-it.t/1.5));ctx.beginPath();ctx.moveTo(it.x,it.y);ctx.lineTo(it.x+Math.cos(a)*l*0.5,it.y+Math.sin(a)*l*0.5+3);ctx.lineTo(it.x+Math.cos(a+0.2)*l,it.y+Math.sin(a+0.2)*l);ctx.stroke();}
        ctx.strokeStyle='rgba(200,69,45,'+(0.4+0.4*Math.sin(S.t*18))+')';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.arc(it.x,it.y,it.r,0,TAU);ctx.stroke();ctx.setLineDash([]);}
      else{const a=Math.min(1,it.hole/0.4);const hg=ctx.createRadialGradient(it.x,it.y,4,it.x,it.y,it.r);hg.addColorStop(0,'rgba(5,2,0,'+a+')');hg.addColorStop(0.75,'rgba(20,10,5,'+(0.9*a)+')');hg.addColorStop(1,'rgba(60,40,20,0)');ctx.fillStyle=hg;ctx.beginPath();ctx.arc(it.x,it.y,it.r+6,0,TAU);ctx.fill();ctx.strokeStyle='rgba(42,33,24,'+a+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(it.x,it.y,it.r,0,TAU);ctx.stroke();}}
    else if(it.k==='drip'){const k=1-it.t/1.1;ctx.fillStyle='rgba(20,10,5,'+(0.2+0.3*k)+')';ctx.beginPath();ctx.ellipse(it.x,it.y,10+30*k,6+18*k,0,0,TAU);ctx.fill();const y=it.y-(it.t/1.1)*300;inked(ellP(it.x,y,6,9),'#e8a83a',1.5);}
    else if(it.k==='sap'){const a=Math.min(1,it.life/1.5);ctx.globalAlpha=a;inked(ellP(it.x,it.y,it.r,it.r*0.62),'rgba(216,144,46,.82)',2);gloss(it.x-it.r*0.3,it.y-it.r*0.2,it.r*0.35,it.r*0.08,0.45);ctx.globalAlpha=1;}
  }
  if(g.id==='ogawa'&&g.pools){for(const pl of g.pools){ctx.save();ctx.translate(pl.x,pl.y);inked(ellP(0,0,pl.r,pl.r*0.7),'rgba(90,150,200,.45)',2);ctx.strokeStyle='rgba(230,245,255,.7)';ctx.lineWidth=2;const k=(S.t*0.7)%1;ctx.globalAlpha=1-k;ctx.beginPath();ctx.ellipse(0,0,pl.r*k,pl.r*0.7*k,0,0,TAU);ctx.stroke();ctx.globalAlpha=1;ctx.restore();}}
  if(g.id==='miki'&&(g.warn>0||g.gust>0)&&g.ang!=null){const wx=Math.cos(g.ang),wy=Math.sin(g.ang);ctx.save();ctx.globalAlpha=g.gust>0?0.7:0.35+0.35*Math.sin(S.t*18);ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.lineCap='round';
    for(let i=0;i<9;i++){const o=(i-4)*60,k=((S.t*(g.gust>0?2.4:0.8)+hash(i))%1)*2-1,cx=g.cx-wy*o+wx*k*300,cy=g.cy+wx*o+wy*k*300;ctx.beginPath();ctx.moveTo(cx-wx*40,cy-wy*40);ctx.lineTo(cx+wx*40,cy+wy*40);ctx.lineTo(cx+wx*28-wy*10,cy+wy*28+wx*10);ctx.stroke();}ctx.restore();ctx.globalAlpha=1;}
}

/* ---------------- final boss prize ---------------- */
function claimFinalPrize(){
  const got=[];items=items.filter(it=>{if(it.p&&(it.p.id==='tsuno'||it.boss)){S.store.push(it.p);got.push(it.p);return false;}return true;});
  if(!got.length){const p=mkPart('head','tsuno',1.2+S.cycle*0.15);S.store.push(p);got.push(p);}
  S.finalPrize=got.map(p=>partName(p));DEX.parts.tsuno=true;saveDex();
  diary('若頭の「'+S.finalPrize.join('」「')+'」を すみかに かざった。');
}

ACHS.push({id:'kizuna3',name:'兄弟の 盃',desc:'子分と 絆を 3まで ふかめる'},{id:'gimmick',name:'地の利',desc:'地形の しかけで 番長を 10回 ひるませる'});
