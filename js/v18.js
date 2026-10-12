'use strict';
/* =====================================================================
   ひと夏の番長 — v18: たのみごと (small requests from forest folk),
   子どもの虫取り網 (a summer-holiday hazard), 宝さがし (dig with まるまる)
   ===================================================================== */

/* ---------------- たのみごと ---------------- */
const Q_GIVERS=[['ミミズの ご隠居','わしの 庭を あらす 連中が おってのう。'],['テントウの おばちゃん','ちょいと たのまれて くれるかい？'],['アリの 見張り番','女王さまの 命令で……いや、おねがいです！'],['カタツムリの 旅人','ゆっくりで いいから、たのめるかな。'],['セミの 兄さん','鳴いてる ひまが ないんだ、たのむ！']];
function qMake(){
  const A=AREA(),mobs=A.mobs.map(m=>m[0]).filter(t=>TYPES[t]&&TYPES[t].ai!=='passive'&&TYPES[t].ai!=='burrow'),giver=pick(Q_GIVERS),t=pick(mobs);
  const pool=[
    ()=>({k:'kill',type:t,n:5+Math.floor(Math.random()*4),text:'「'+TYPES[t].name+'」を たおして',unit:'ひき'}),
    ()=>({k:'elite',n:1,text:'あばれ虫を たおして',unit:'ひき'}),
    ()=>({k:'food',n:6,text:'たべものを 食べて 元気を つけて',unit:'こ'}),
    ()=>({k:'ball',n:4,text:'小石や 木の実を 敵に 当てて',unit:'回'}),
    ()=>({k:'just',n:2,text:'ジャストまるまるを きめて',unit:'回'}),
    ()=>({k:'chain',n:20,text:'れんげきを つなげて',unit:'れんげき',max:true}),
    ()=>({k:'dig',n:2,text:'宝の かがやきを 掘りあてて',unit:'回'})];
  if(MAP&&MAP.balls&&MAP.balls.length)pool.push(pool[3]);
  const q=pick(pool)();q.got=0;q.giver=giver[0];q.say=giver[1];q.done=false;
  const r=Math.random();q.reward=r<0.3?{k:'dango',n:1}:r<0.6?{k:'part'}:r<0.8?{k:'xp',n:Math.round(40+areaLv()*12)}:{k:'bond',n:90};
  return q;
}
function qRewardText(rw){return rw.k==='dango'?'蜜だんご ×'+rw.n:rw.k==='part'?'めずらしい 部位':rw.k==='xp'?'経験値 '+rw.n:'子分の 絆（一緒に戦った時間 +'+Math.round(rw.n/60*10)/10+'分）';}
function qEnsure(){if(S.dojo)return;const day=dayNum();if(!S.quests||S.qDay!==day||S.qArea!==S.areaI||S.quests.every(q=>q.done)){const L=[];for(let k=0;k<20&&L.length<3;k++){const q=qMake();if(!L.some(o=>o.k===q.k))L.push(q);}S.quests=L;S.qDay=day;S.qArea=S.areaI;}}
function qProgress(k,v,type){
  if(!S.quests)return;for(const q of S.quests){if(q.done||q.k!==k)continue;if(q.k==='kill'&&q.type!==type)continue;
    const was=q.got;q.got=q.max?Math.max(q.got,v):q.got+(v||1);if(q.got!==was&&q.got<q.n&&!q.max)pop(P.x,P.y-50,'たのみ '+q.got+'/'+q.n,'#5f7d3a');
    if(q.got>=q.n){q.done=true;qReward(q);}}
}
function qReward(q){
  const rw=q.reward;sfx('fanfare');banner('たのみごと 達成！',q.giver+'「ありがとう！」 → '+qRewardText(rw));tot('quests',1);
  if(rw.k==='dango')gainDango(rw.n,P.x,P.y);
  else if(rw.k==='xp')addXP(rw.n,P.x,P.y-30);
  else if(rw.k==='bond'){for(const A of allies())A.rec.bt=(A.rec.bt||0)+rw.n;pop(P.x,P.y-40,'絆が ふかまった','#5f7d3a',true);}
  else{const pool=AREA().mobs.map(m=>TYPES[m[0]].drop).filter(Boolean);const d=pick(pool)||['head','ago'];const p=mkPart(d[0],d[1],1.6);if(p.rar<1)p.rar=1;dropItem(P.x+20,P.y-20,p);announceDrop(p,true);}
  diary(q.giver+'の たのみごとを はたした。');checkAch();
}

/* ---------------- 子どもの 虫取り網 ---------------- */
function netOK(){return !!MAP&&!MAP.dojo&&!AREA().dark&&!S.bossBar&&!S.sumo&&!S.rk&&skyPhase()==='day'&&!isRain()&&S.state==='play';}
function nearCover(x,y){for(let i=0;i<8;i++){const a=i/8*TAU;if(blocked(x+Math.cos(a)*34,y+Math.sin(a)*34,6))return true;}return Math.hypot(x-MAP.sumika.x,y-MAP.sumika.y)<90;}
function netTick(){
  const n=S.net;
  if(!n){S.netT=(S.netT??rnd(70,110))-DT;if(S.netT<=0){S.netT=rnd(100,160);if(netOK()&&Math.random()<0.7){const a=rnd(0,TAU);S.net={x:P.x+Math.cos(a)*260,y:P.y+Math.sin(a)*260,r:200,t:0,ph:'warn'};banner('「あっ、虫だ！」','子どもが 虫取り網を ふりかぶった！ 石や 木の かげへ かくれろ！');sfx('whistle');vib(60);}}return;}
  n.t+=DT;
  if(n.ph==='warn'){const k=Math.min(1,DT*0.9);n.x+=(P.x-n.x)*k;n.y+=(P.y-n.y)*k;if(n.t>3.2){n.ph='swoop';n.t=0;sfx('buzz');S.shake=10;}}
  else if(n.ph==='swoop'&&n.t>0.25&&!n.done){n.done=true;S.flash=0.2;let caught=0;
    for(const e of E){if(e.dead||e.T.boss||e.T.keeper||e.T.nushi||e.T.ai==='sumo'||e.state==='under')continue;if(Math.hypot(e.x-n.x,e.y-n.y)<n.r&&!nearCover(e.x,e.y)){e.dead=true;corpses.push({e,t:0});caught++;}}
    if(caught)pop(n.x,n.y-40,caught+'ひき つかまった……','#5a4a30',true);
    for(const A of allies())if(Math.hypot(A.x-n.x,A.y-n.y)<n.r&&!nearCover(A.x,A.y)){hurtAlly(A,A.maxhp*0.3,null);pop(A.x,A.y-A.r-20,'あぶねえ！',INK,true);}
    if(Math.hypot(P.x-n.x,P.y-n.y)<n.r){
      if(nearCover(P.x,P.y)){pop(P.x,P.y-40,'かくれて やりすごした！','#2f6fb0',true);addXP(10+areaLv()*3,P.x,P.y);tot('netDodge',1);}
      else{hurtPlayer(ST.maxhp*0.3,null,{unblockable:true,src:'net'});pop(P.x,P.y-40,'つかまった！','#c8452d',true);
        later(()=>{if(S.state!=='play')return;for(let k=0;k<40;k++){const x=rnd(150,MAP.w-150),y=rnd(150,MAP.h-150);if(!blocked(x,y,20)&&!inLair(x,y)){P.x=x;P.y=y;break;}}P.stunT=0.6;P.inv=1.2;banner('虫かごから にげだした！','どこかに 放りだされた……');sfx('roll');},700);}}
    else{pop(P.x,P.y-40,'ふう、あぶなかった',INK);tot('netDodge',1);}}
  else if(n.ph==='swoop'&&n.t>1.1)S.net=null;
}
function drawNetWorld(){
  const n=S.net;if(!n)return;
  if(n.ph==='warn'){const k=Math.min(1,n.t/3.2);ctx.fillStyle='rgba(20,15,10,'+(0.12+0.28*k)+')';ctx.beginPath();ctx.ellipse(n.x,n.y,n.r*(0.7+0.3*k),n.r*(0.55+0.25*k),0,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(200,69,45,'+(0.4+0.4*Math.sin(S.t*14))+')';ctx.lineWidth=4;ctx.setLineDash([14,10]);ctx.beginPath();ctx.ellipse(n.x,n.y,n.r,n.r*0.8,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
    /* the mesh shadow */
    ctx.save();ctx.beginPath();ctx.ellipse(n.x,n.y,n.r*(0.7+0.3*k),n.r*(0.55+0.25*k),0,0,TAU);ctx.clip();ctx.strokeStyle='rgba(20,15,10,'+(0.15+0.2*k)+')';ctx.lineWidth=2;for(let i=-10;i<=10;i++){ctx.beginPath();ctx.moveTo(n.x+i*24-300,n.y-300);ctx.lineTo(n.x+i*24+300,n.y+300);ctx.moveTo(n.x+i*24+300,n.y-300);ctx.lineTo(n.x+i*24-300,n.y+300);ctx.stroke();}ctx.restore();}
  else{const k=Math.min(1,n.t/0.25),a=1-Math.max(0,(n.t-0.6)/0.5);ctx.globalAlpha=Math.max(0,a);
    ctx.save();ctx.translate(n.x,n.y);ctx.scale(1,0.8);ctx.strokeStyle='#f4f4ec';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,n.r*k,0,TAU);ctx.stroke();
    ctx.strokeStyle='rgba(244,244,236,.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,n.r*k,0,TAU);ctx.clip();for(let i=-10;i<=10;i++){ctx.moveTo(i*22-300,-300);ctx.lineTo(i*22+300,300);ctx.moveTo(i*22+300,-300);ctx.lineTo(i*22-300,300);}ctx.stroke();ctx.restore();
    ctx.strokeStyle='#a87a3a';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(n.x+n.r*0.9,n.y-n.r*0.5);ctx.lineTo(n.x+n.r*2.4,n.y-n.r*1.6);ctx.stroke();ctx.globalAlpha=1;}
}

/* ---------------- 宝さがし: a glint on the ground; hold まるまる on it to dig ---------------- */
function digSetup(){MAP.digs=[];if(MAP.dojo)return;for(let k=0;k<60&&MAP.digs.length<3;k++){const x=rnd(150,MAP.w-150),y=rnd(150,MAP.h-150);if(blocked(x,y,26)||inLair(x,y)||Math.hypot(x-MAP.start.x,y-MAP.start.y)<300)continue;MAP.digs.push({x,y,p:0});}}
function digTick(){
  if(!MAP||!MAP.digs)return;
  for(const d of MAP.digs){if(d.done)continue;const on=Math.hypot(P.x-d.x,P.y-d.y)<26;
    if(on&&P.rolled){d.p+=DT/1.4;if(Math.random()<DT*12)fx.push({x:d.x+rnd(-10,10),y:d.y,vx:rnd(-90,90),vy:rnd(-120,-40),t:0,life:0.4,c:'#8a6a3a'});if(Math.random()<DT*3)sfx('burrow');
      if(d.p>=1){d.done=true;digReward(d);}}
    else d.p=Math.max(0,d.p-DT*0.5);
    if(on&&!P.rolled&&!S.digHint){S.digHint=true;pop(d.x,d.y-30,'（まるまって 掘れそうだ）',INK);}}
  MAP.digs=MAP.digs.filter(d=>!d.done);
}
function digReward(d){
  sfx('star');S.shake=4;tot('digs',1);qProgress('dig',1);const r=Math.random();
  if(r<0.35){const pool=AREA().mobs.map(m=>TYPES[m[0]].drop).filter(Boolean);const dd=pick(pool)||['head','ago'];const p=mkPart(dd[0],dd[1],0.9+Math.random());dropItem(d.x,d.y,p);announceDrop(p,true);}
  else if(r<0.55){gainDango(1,d.x,d.y);}
  else if(r<0.8){for(let i=0;i<3;i++)foods.push({x:d.x+rnd(-20,20),y:d.y+rnd(-20,20),a:rnd(0,TAU),kind:pick(AREA().food),bob:0});pop(d.x,d.y-30,'たべものが 出てきた！',INK,true);}
  else{addXP(20+areaLv()*6,d.x,d.y-20);pop(d.x,d.y-40,'むかしの 番長の 牙……？','#d9a21b',true);}
}
function drawDigs(){if(!MAP||!MAP.digs)return;for(const d of MAP.digs){const b=0.5+0.5*Math.sin(S.t*4+d.x);ctx.fillStyle='rgba(120,90,50,.25)';ctx.beginPath();ctx.ellipse(d.x,d.y,18,10,0,0,TAU);ctx.fill();
  for(let i=0;i<3;i++){const a=S.t*1.5+i*2.1,x=d.x+Math.cos(a)*12,y=d.y+Math.sin(a)*6-4,s=2+2*b;ctx.fillStyle='rgba(255,240,160,'+(0.5+0.5*b)+')';ctx.beginPath();ctx.moveTo(x,y-s*2);ctx.lineTo(x+s*0.6,y);ctx.lineTo(x,y+s*2);ctx.lineTo(x-s*0.6,y);ctx.closePath();ctx.fill();}
  if(d.p>0){ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.beginPath();ctx.arc(d.x,d.y-34,12,-Math.PI/2,-Math.PI/2+TAU*d.p);ctx.stroke();ctx.strokeStyle='#f2c43a';ctx.lineWidth=3;ctx.stroke();}}}

ACHS.push({id:'quest10',name:'たよれる 兄貴',desc:'たのみごとを 10こ はたす'},{id:'net3',name:'かくれんぼ名人',desc:'子どもの 虫取り網を 3回 やりすごす'},{id:'dig5',name:'宝さがし',desc:'宝を 5回 掘りあてる'});
