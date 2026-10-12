'use strict';
/* =====================================================================
   ひと夏の番長 — v15: random summer themes (3年目〜), 蜜だんご,
   follower pair banter, hand-built scenery for the opening
   ===================================================================== */

/* ---------------- summer themes ---------------- */
const THEMES={
  taifu:{name:'台風',card:'〜台風〜',desc:'ときどき 強い 突風が ふく。まるまっていれば 飛ばされない。'},
  hideri:{name:'日照り',card:'〜日照り〜',desc:'昼は 暑さで 体力が へっていく。水たまりで 体を ひやそう。そのかわり 経験値 +30%。'},
  hotaru:{name:'ホタル',card:'〜ホタルの夜〜',desc:'夜が 長い。ホタルに ふれると 光と 経験値が もらえる。夜は 部位が 落ちやすい。'},
  ooame:{name:'長雨',card:'〜長雨〜',desc:'雨が ふりつづく。ぬれた 地面では 突進が よく すべる（+30%）。'},
  taihatsu:{name:'大発生',card:'〜大発生〜',desc:'各地で 虫が 大発生。敵は 多いが、経験値 +20%、子分に なりやすい。'}
};
function theme(){return S.cycle>=2?(S.theme||'taifu'):null;}
function pickTheme(){const k=Object.keys(THEMES).filter(x=>x!==S.theme);return pick(k);}
function themeXpMul(){const t=theme();return t==='hideri'?1.3:t==='taihatsu'?1.2:1;}
function themeDropBonus(){return theme()==='hotaru'&&isNight()?0.35:0;}
function themeDashMul(){return theme()==='ooame'&&isRain()?1.3:1;}
function themeMobMul(){return theme()==='taihatsu'?1.5:1;}
function themeRecruitMul(){return theme()==='taihatsu'?2:1;}
function themePhase(f){if(theme()==='hotaru')return f<0.38?'day':f<0.46?'dusk':f<0.95?'night':'dawn';return f<0.6?'day':f<0.7?'dusk':f<0.93?'night':'dawn';}
function themeAreaSetup(){
  const t=theme();MAP.puddles=[];S.flies=[];S.swarm=null;
  if(!t||MAP.dojo)return;
  if(t==='hideri'){for(let k=0;k<200&&MAP.puddles.length<8;k++){const x=rnd(160,MAP.w-160),y=rnd(160,MAP.h-160);if(blocked(x,y,60)||inLair(x,y)||MAP.puddles.some(p=>Math.hypot(p.x-x,p.y-y)<500))continue;MAP.puddles.push({x,y,r:rnd(48,66),a:rnd(0,TAU)});}}
  if(t==='taihatsu'){const c=AREA().mobs.map(m=>m[0]).filter(x=>TYPES[x].ai!=='passive'&&TYPES[x].ai!=='burrow');S.swarm=pick(c);}
}
function themeAreaLines(){const t=theme();if(!t)return [];const L=[{who:'',text:'【'+THEMES[t].name+'の 夏】'+THEMES[t].desc}];if(t==='taihatsu'&&S.swarm)L.push({who:'',text:'このあたりでは「'+TYPES[S.swarm].name+'」が 大発生している！'});return L;}
function themeTick(){
  const t=theme();if(!t||S.dojo||!MAP)return;
  if(t==='hideri'){
    const ph=skyPhase();let cool=Math.hypot(P.x-MAP.sumika.x,P.y-MAP.sumika.y)<150||(MAP.river&&inWater(MAP,P.x,P.y));
    for(const p of MAP.puddles)if(Math.hypot(P.x-p.x,P.y-p.y)<p.r){cool=true;healPlayer(ST.maxhp*0.03*DT);if(Math.random()<DT*1.5)pop(P.x,P.y-30,'ひんやり',INK);}
    if(!cool&&(ph==='day'||ph==='dusk')&&!S.rk&&!isRain()&&P.hp>ST.maxhp*0.2){P.hp-=ST.maxhp*0.0035*DT;S.heatT=(S.heatT||0)-DT;if(S.heatT<=0){S.heatT=9;pop(P.x,P.y-34,'（あつい……）','#c8452d');}}
  }
  if(t==='hotaru'){
    if(isNight()){while(S.flies.length<16){const a=rnd(0,TAU),d=rnd(160,620);S.flies.push({x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d,ph:rnd(0,TAU),vx:0,vy:0});}}
    else if(S.flies.length&&Math.random()<DT*2)S.flies.pop();
    for(const f of S.flies){f.ph+=DT;f.vx+=Math.cos(f.ph*0.9)*20*DT;f.vy+=Math.sin(f.ph*1.3)*20*DT;f.vx*=0.98;f.vy*=0.98;f.x+=f.vx*DT;f.y+=f.vy*DT;
      if(Math.hypot(f.x-P.x,f.y-P.y)<ST.r+18){f.got=true;S.tbFlies=(S.tbFlies||0)+1;sfx('star');addXP(4+areaLv()*1.5,f.x,f.y-10);P.glowT=25;tot('flies',1);}
      if(Math.hypot(f.x-P.x,f.y-P.y)>900)f.got=true;}
    S.flies=S.flies.filter(f=>!f.got);P.glowT=(P.glowT||0)-DT;
  }
}
function drawThemeWorld(){
  const t=theme();if(!t||!MAP)return;
  if(t==='hideri')for(const p of MAP.puddles){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);inked(ellP(0,0,p.r,p.r*0.62),'rgba(120,180,220,.65)',2);ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;const k=(S.t*0.6)%1;ctx.globalAlpha=1-k;ctx.beginPath();ctx.ellipse(0,0,p.r*k,p.r*0.62*k,0,0,TAU);ctx.stroke();ctx.globalAlpha=1;gloss(-p.r*0.3,-p.r*0.2,p.r*0.3,p.r*0.08,0.5);ctx.restore();}
  if(t==='hotaru')for(const f of S.flies){const b=0.5+0.5*Math.sin(f.ph*4);const g=ctx.createRadialGradient(f.x,f.y,1,f.x,f.y,22);g.addColorStop(0,'rgba(230,255,140,'+(0.8*b)+')');g.addColorStop(1,'rgba(230,255,140,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,22,0,TAU);ctx.fill();dot(f.x,f.y,3,'#f4ffb0');}
}
function drawThemeScreen(){
  const t=theme();if(!t||!MAP||S.state!=='play'&&S.state!=='sumika')return;
  if(t==='hideri'&&(skyPhase()==='day'||skyPhase()==='dusk')){ctx.fillStyle='rgba(255,170,60,.1)';ctx.fillRect(0,0,W,Hh);ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=2;for(let i=0;i<7;i++){const y=Hh*(0.12+i*0.13);ctx.beginPath();for(let x=0;x<=W;x+=14)ctx.lineTo(x,y+Math.sin(x*0.025+S.t*2.5+i)*4);ctx.stroke();}}
}
/* bright firefly dots drawn on top of the night overlay */
function drawFliesScreen(v){
  if(theme()!=='hotaru'||!S.flies)return;ctx.save();ctx.globalCompositeOperation='lighter';
  for(const f of S.flies){const sx=(f.x-v.cx)*v.s+W/2,sy=(f.y-v.cy)*v.s+Hh/2;if(sx<-30||sy<-30||sx>W+30||sy>Hh+30)continue;const b=0.4+0.6*Math.max(0,Math.sin(f.ph*4));const g=ctx.createRadialGradient(sx,sy,1,sx,sy,18);g.addColorStop(0,'rgba(220,255,120,'+b+')');g.addColorStop(1,'rgba(220,255,120,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,18,0,TAU);ctx.fill();}
  ctx.restore();
}

/* ---------------- 蜜だんご ---------------- */
const DANGO_TIME=240;
function dangoActive(){return (S.dangoT||0)>0;}
function makeDango(){const list=S.store.filter(p=>p.rar===0&&p.st===1&&!p.tr.length).sort((a,b)=>partScore(a)-partScore(b)).slice(0,3);if(list.length<3)return false;S.store=S.store.filter(p=>!list.includes(p));S.dango=(S.dango||0)+1;sfx('eat');diary('蜜だんごを つくった。');return true;}
function useDango(){if(!(S.dango>0))return false;S.dango--;S.dangoT=DANGO_TIME;sfx('heal');tot('dango',1);diary('蜜だんごを つかった。甘い においが ただよう。');return true;}
function gainDango(n,x,y){S.dango=(S.dango||0)+n;sfx('star');pop(x,y-30,'蜜だんご +'+n,'#b8860b',true);}
function dangoTick(){if(S.dangoT>0&&!S.dojo){S.dangoT-=DT;if(Math.random()<DT*4)fx.push({x:P.x+rnd(-14,14),y:P.y+rnd(-14,14),vx:0,vy:-40,t:0,life:0.6,c:'#f2c43a'});if(S.dangoT<=0)toast('蜜だんごの においが 消えた','すみかで また つかえる');}}
function dangoRecruitMul(){return dangoActive()?4:1;}

/* ---------------- follower pair banter (かけあい) ---------------- */
const PAIRS=[
  {id:'jorou_kumo',types:['jorou','kumo'],lines:[['A','坊や、ちゃんと 糸の はり方 おぼえてる？'],['B','お、おかあさん！ ちゃんと やってるよ！'],['A','……兄貴さんの 前で 「おかあさん」は やめなさい。'],['B','（兄貴、聞かなかったことに してください）']]},
  {id:'kama_ito',fams:['kama','ito'],lines:[['A','クモどの。そなたの 糸、拙者の 刃で 切れぬものは ない。'],['B','あら、じゃあ ためしてみる？ 兄貴の 前で 恥を かくわよ。'],['A','……やめておこう。兄者に しかられる。'],['B','ふふ、かしこい カマキリね。']]},
  {id:'mitsu_nioi',fams:['mitsu','nioi'],lines:[['B','あの……ぼく、くさいから はなれてたほうが……'],['A','え？ 花の においも、きみの においも、守るための においでしょ？'],['B','……そんなふうに 言ってもらったの、はじめて。'],['A','いっしょに 兄貴を 守ろうね！']]},
  {id:'nage_mawari',fams:['nage','mawari'],lines:[['A','兄貴を 守るのは おれの 力だ！'],['B','……ちがう。おれの から。'],['A','じゃあ おれが 投げて、おまえが ふせぐ。'],['B','……それで いい。（ちょっと うれしそう）']]},
  {id:'shippu_tobi',fams:['shippu','tobi'],lines:[['A','どっちが 先に 兄貴の ところに つくか、競走っす！'],['B','いいよ！ ぼくは 跳んで ショートカット！'],['A','ずるいっす！'],['B','とどく 気持ちで 跳んだだけだよ！']]},
  {id:'rinpun_mitsu',fams:['rinpun','mitsu'],lines:[['A','花畑の 東の はしの ヒマワリ、もう 見た？'],['B','見ました！ 蜜が すっごく 甘いんですよね！'],['A','こんど 兄貴も つれて いきましょう。'],['B','兄貴、花の 上で まるまって ねそう……']]},
  {id:'kama_tobi',fams:['kama','tobi'],lines:[['B','……カマキリさん、ぼくのこと 食べたり しませんよね？'],['A','兄者の 子分を 食う 刃は 持たぬ。'],['B','よかったぁ……！'],['A','……ただ、その 跳ねかたは 少し うまそうでは ある。'],['B','ひっ！？']]},
  {id:'ito_rinpun',fams:['ito','rinpun'],lines:[['B','あの、わたしの 羽、巣に ひっかけないでね……？'],['A','あたしは 仲間を つかまえるほど ひまじゃないわ。'],['B','ほっ……。'],['A','……でも その 羽の 色、きれいね。巣に かざりたいくらい。'],['B','やっぱり こわい！']]},
  {id:'nioi_mawari',fams:['nioi','mawari'],lines:[['A','……となり、いい？'],['B','……ああ。'],['A','…………。'],['B','…………。'],['A','（なんか おちつく）'],['B','（……わかる）']]},
  {id:'nage_shippu',fams:['nage','shippu'],lines:[['B','おまえ、力は すごいけど おそいっすね！'],['A','おまえは 速いけど 軽いな！'],['B','……組めば 最強じゃないっすか？'],['A','兄貴の 連携に まぜてもらおうぜ！']]}
];
function pairMembers(pr){
  const R=S.roster;
  if(pr.types){const a=R.find(r=>r.type===pr.types[0]),b=R.find(r=>r.type===pr.types[1]);return a&&b?[a,b]:null;}
  const a=R.filter(r=>skillOf(r.type)===pr.fams[0]).sort((x,y)=>(y.kz||0)-(x.kz||0))[0],b=R.filter(r=>skillOf(r.type)===pr.fams[1]&&r!==a).sort((x,y)=>(y.kz||0)-(x.kz||0))[0];return a&&b?[a,b]:null;
}
function pairState(pr){const m=pairMembers(pr);if(!m)return {m:null,ok:false};const done=!!(S.pairDone||{})[pr.id];return {m,done,ok:!done&&(m[0].kz||0)>=1&&(m[1].kz||0)>=1};}
function pairTalk(id){
  const pr=PAIRS.find(p=>p.id===id),st=pr&&pairState(pr);if(!st||!st.ok)return;const [a,b]=st.m,u=UIH();
  $('sumikaCard').hidden=true;
  say(pr.lines.map(([w,t])=>({who:w==='A'?a.name:b.name,text:t})),()=>{S.pairDone=S.pairDone||{};S.pairDone[pr.id]=true;a.buddy=b.name;b.buddy=a.name;DEX.pairs=DEX.pairs||{};DEX.pairs[pr.id]=true;saveDex();
    sfx('star');banner('なかよしに なった',a.name+' と '+b.name+'（連携わざで 必ず かけつけ、威力 1.5倍）');diary(a.name+'と '+b.name+'が なかよしに なった。');
    writeSave();$('sumikaCard').hidden=false;homeTab='ally';u.renderHome();checkAch();});
}
function buddyOf(r){if(!r||!r.buddy)return null;return S.roster.find(x=>x!==r&&x.name===r.buddy&&!x.faint)||null;}
ACHS.push({id:'dango',name:'あまい罠',desc:'蜜だんごを はじめて つかう'},{id:'pair3',name:'にぎやかな すみか',desc:'子分どうしの かけあいを 3つ 見る'},{id:'themes',name:'四季ならぬ 四夏',desc:'3つの ちがう 夏の テーマを 体験する'});

/* ---------------- scenery for the opening ---------------- */
function srand(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
/* kunugi (sawtooth oak) leaf: long, narrow, bristle-tipped teeth, pointing +x */
function kLeaf(c,x,y,ang,len,col,lw){
  const w=len*0.17,n=9;c.save();c.translate(x,y);c.rotate(ang);c.beginPath();c.moveTo(0,0);
  for(let i=1;i<=n;i++){const t=i/n,px=len*t,hw=w*Math.sin(Math.PI*Math.min(1,t*1.05))*(1-t*0.25);c.lineTo(px-len*0.03,-hw);c.lineTo(px+len*0.02,-hw-len*0.03*(1-t));}
  c.lineTo(len*1.06,0);
  for(let i=n;i>=1;i--){const t=i/n,px=len*t,hw=w*Math.sin(Math.PI*Math.min(1,t*1.05))*(1-t*0.25);c.lineTo(px+len*0.02,hw+len*0.03*(1-t));c.lineTo(px-len*0.03,hw);}
  c.closePath();c.fillStyle=col;c.fill();c.lineWidth=lw||1;c.strokeStyle='rgba(30,40,20,.75)';c.stroke();
  c.strokeStyle='rgba(30,50,20,.45)';c.lineWidth=(lw||1)*0.8;c.beginPath();c.moveTo(0,0);c.lineTo(len,0);c.stroke();
  for(let i=1;i<7;i++){const t=i/7;c.beginPath();c.moveTo(len*t,0);c.lineTo(len*(t+0.06),-w*0.8*Math.sin(Math.PI*t));c.moveTo(len*t,0);c.lineTo(len*(t+0.06),w*0.8*Math.sin(Math.PI*t));c.stroke();}
  c.restore();
}
/* bark of a cylinder: shaded body with deep vertical fissures and corky plates */
function barkFill(c,rnd_,path,x0,x1,y0,y1){
  c.save();path();c.clip();
  const g=c.createLinearGradient(x0,0,x1,0);g.addColorStop(0,'#2e1d12');g.addColorStop(0.3,'#5a3c26');g.addColorStop(0.55,'#6e4b30');g.addColorStop(0.85,'#4a3020');g.addColorStop(1,'#2a1a10');c.fillStyle=g;c.fillRect(x0-10,y0-10,x1-x0+20,y1-y0+20);
  const w=x1-x0;
  for(let i=0;i<Math.round(w/7);i++){const x=x0+rnd_()*w,lw=1+rnd_()*3.5;c.strokeStyle='rgba(20,10,4,'+(0.35+rnd_()*0.4)+')';c.lineWidth=lw;c.beginPath();let xx=x;c.moveTo(xx,y0);for(let y=y0;y<=y1;y+=14+rnd_()*16){xx+=(rnd_()-0.5)*7;c.lineTo(xx,y);}c.stroke();
    c.strokeStyle='rgba(190,150,110,'+(0.08+rnd_()*0.12)+')';c.lineWidth=1;c.beginPath();xx=x+lw+1;c.moveTo(xx,y0);for(let y=y0;y<=y1;y+=18){xx+=(rnd_()-0.5)*6;c.lineTo(xx,y);}c.stroke();}
  for(let i=0;i<Math.round(w*(y1-y0)/9000);i++){const x=x0+rnd_()*w,y=y0+rnd_()*(y1-y0);c.strokeStyle='rgba(20,10,4,.45)';c.lineWidth=1.5;c.beginPath();c.moveTo(x-6,y);c.lineTo(x+6,y+rnd_()*4-2);c.stroke();}
  c.restore();path();c.lineWidth=3;c.strokeStyle=INK;c.stroke();
}
let SCENE_CACHE={};
function sceneCanvas(key,w,h,fn){const k=key+':'+w+'x'+h;if(SCENE_CACHE[k])return SCENE_CACHE[k];const cv2=document.createElement('canvas'),d=Math.min(2,DPR||1);cv2.width=Math.round(w*d);cv2.height=Math.round(h*d);const c=cv2.getContext('2d');c.scale(d,d);fn(c,w,h);SCENE_CACHE[k]=cv2;return cv2;}
/* the whole kunugi seen from afar: crown on top, trunk running to the bottom */
function paintTree(c,w,h){
  const r=srand(7),cx=w/2,crownY=h*0.3,baseW=w*0.36,topW=w*0.2,trunkTop=h*0.36;
  /* branches (drawn under the crown) */
  const br=[[-0.9,0.9],[-0.55,0.7],[-0.2,0.85],[0.15,0.8],[0.5,0.72],[0.85,0.9]];
  c.lineCap='round';
  for(const [dx,len] of br){const x0=cx+dx*topW*0.3,y0=trunkTop+20,x1=cx+dx*w*0.42,y1=crownY-h*0.12*len;c.strokeStyle=INK;c.lineWidth=26*len+4;c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo((x0+x1)/2,y0-30,x1,y1);c.stroke();c.strokeStyle='#4a3020';c.lineWidth=26*len-2;c.stroke();
    c.strokeStyle=INK;c.lineWidth=10;c.beginPath();c.moveTo((x0+x1)/2,(y0+y1)/2-10);c.lineTo(x1+(dx>0?40:-40),y1-50);c.stroke();c.strokeStyle='#4a3020';c.lineWidth=6;c.stroke();}
  /* trunk */
  const path=()=>{c.beginPath();c.moveTo(cx-topW/2,trunkTop);c.bezierCurveTo(cx-topW*0.55,h*0.6,cx-baseW*0.5,h*0.86,cx-baseW*0.62,h+10);c.lineTo(cx+baseW*0.62,h+10);c.bezierCurveTo(cx+baseW*0.5,h*0.86,cx+topW*0.55,h*0.6,cx+topW/2,trunkTop);c.closePath();};
  barkFill(c,r,path,cx-baseW*0.62,cx+baseW*0.62,trunkTop,h+10);
  /* sap seep with a little crowd */
  const sy=h*0.72,sx=cx+topW*0.08;const gl=c.createRadialGradient(sx,sy,4,sx,sy,90);gl.addColorStop(0,'rgba(255,200,80,.85)');gl.addColorStop(1,'rgba(255,200,80,0)');c.fillStyle=gl;c.beginPath();c.arc(sx,sy,90,0,TAU);c.fill();
  c.fillStyle='#d8902e';c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.ellipse(sx,sy,30,16,0,0,TAU);c.fill();c.stroke();for(const [dx,l] of [[-14,30],[6,46],[20,22]]){c.beginPath();c.moveTo(sx+dx-4,sy+8);c.quadraticCurveTo(sx+dx,sy+8+l,sx+dx+4,sy+8);c.fill();c.stroke();}
  c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(sx-10,sy-5,10,3,-0.2,0,TAU);c.fill();
  /* crown: one merged silhouette (ink rim → dark mass → lit lobes), then layers of real leaves */
  const clusters=[];for(let i=0;i<64;i++){const a=r()*TAU,d=Math.pow(r(),0.6);clusters.push({x:cx+Math.cos(a)*d*w*0.58,y:crownY-h*0.03+Math.sin(a)*d*h*0.2,s:w*(0.075+r()*0.05)});}
  clusters.sort((a,b)=>a.y-b.y);
  c.fillStyle=INK;for(const cl of clusters){c.beginPath();c.ellipse(cl.x,cl.y,cl.s+3.5,cl.s*0.8+3.5,0,0,TAU);c.fill();}
  c.fillStyle='#24461a';for(const cl of clusters){c.beginPath();c.ellipse(cl.x,cl.y,cl.s,cl.s*0.8,0,0,TAU);c.fill();}
  for(const cl of clusters){c.fillStyle='#3a6626';c.beginPath();c.ellipse(cl.x-cl.s*0.12,cl.y-cl.s*0.16,cl.s*0.82,cl.s*0.6,0,0,TAU);c.fill();}
  for(const cl of clusters){c.fillStyle='#4f8032';c.beginPath();c.ellipse(cl.x-cl.s*0.25,cl.y-cl.s*0.3,cl.s*0.5,cl.s*0.36,-0.3,0,TAU);c.fill();}
  const lit=['#3a6626','#4f8032','#62953c','#7aaa4a','#94c25e'];
  for(const cl of clusters){for(let j=0;j<18;j++){const a=r()*TAU,d=Math.sqrt(r())*cl.s*0.85,lx=cl.x+Math.cos(a)*d,ly=cl.y+Math.sin(a)*d*0.75;
      const light=clamp(0.5-(Math.cos(a)*d+Math.sin(a)*d)/(cl.s*2.2)+(r()-0.5)*0.4,0,0.999);
      kLeaf(c,lx,ly,a*0.5+r()*TAU*0.5,cl.s*(0.3+r()*0.16),lit[Math.floor(light*lit.length)],0.8);}}
  /* a few acorns hanging under the crown */
  for(let i=0;i<5;i++){const cl=clusters[clusters.length-1-i*3];if(!cl)break;const x=cl.x+(r()-0.5)*cl.s,y=cl.y+cl.s*0.7;c.fillStyle='#8a6a2a';c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();c.ellipse(x,y+5,5,7,0,0,TAU);c.fill();c.stroke();c.fillStyle='#6a5a2a';c.beginPath();c.ellipse(x,y-1,6,3.5,0,0,TAU);c.fill();c.stroke();}
}
/* low angle at the foot of the kunugi: flared trunk, roots, leaf litter */
function paintRoots(c,w,h){
  const r=srand(11),cx=w/2,gy=h*0.5;
  /* ground */
  const g=c.createLinearGradient(0,gy-40,0,h);g.addColorStop(0,'#a8844e');g.addColorStop(1,'#7a5a34');c.fillStyle=g;c.fillRect(0,gy-60,w,h);
  for(let i=0;i<260;i++){const x=r()*w,y=gy+r()*(h-gy);c.fillStyle='rgba(60,40,20,'+(0.08+r()*0.15)+')';c.beginPath();c.arc(x,y,1+r()*3,0,TAU);c.fill();}
  /* trunk with flared base */
  const tw=w*0.46;
  const path=()=>{c.beginPath();c.moveTo(cx-tw*0.42,-10);c.bezierCurveTo(cx-tw*0.44,gy*0.6,cx-tw*0.55,gy*0.9,cx-tw*0.95,gy+18);c.lineTo(cx+tw*0.95,gy+18);c.bezierCurveTo(cx+tw*0.55,gy*0.9,cx+tw*0.44,gy*0.6,cx+tw*0.42,-10);c.closePath();};
  barkFill(c,r,path,cx-tw*0.95,cx+tw*0.95,-10,gy+18);
  /* roots spreading into the soil */
  const roots=[[-1,0.9],[-0.6,0.7],[-0.15,0.45],[0.3,0.55],[0.7,0.8],[1,1]];
  for(const [dx,len] of roots){const x0=cx+dx*tw*0.55,y0=gy+6,x1=cx+dx*w*0.62,y1=gy+h*0.12*len+10;
    c.lineCap='round';c.strokeStyle=INK;c.lineWidth=30*len+6;c.beginPath();c.moveTo(x0,y0-10);c.quadraticCurveTo((x0+x1)/2,y0+4,x1,y1);c.stroke();
    c.strokeStyle='#5a3c26';c.lineWidth=30*len;c.stroke();c.strokeStyle='rgba(20,10,4,.35)';c.lineWidth=2;c.beginPath();c.moveTo(x0,y0-6);c.quadraticCurveTo((x0+x1)/2,y0+6,x1,y1);c.stroke();}
  /* moss */
  for(let i=0;i<18;i++){const x=cx+(r()-0.5)*tw*1.4,y=gy-r()*60;c.fillStyle='rgba(110,150,60,'+(0.35+r()*0.3)+')';c.beginPath();c.ellipse(x,y,8+r()*14,4+r()*6,0,0,TAU);c.fill();}
  /* leaf litter, acorns with caps, grass */
  for(let i=0;i<40;i++){const x=r()*w,y=gy+20+r()*(h-gy-20);kLeaf(c,x,y,r()*TAU,16+r()*14,['#a86a2a','#c8902e','#8a7a3a','#7a8a3a','#b07838'][Math.floor(r()*5)],1);}
  for(let i=0;i<6;i++){const x=r()*w,y=gy+30+r()*(h-gy-60);c.fillStyle='#a8743a';c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();c.ellipse(x,y+4,7,9,0.3,0,TAU);c.fill();c.stroke();c.fillStyle='#6a4a2a';c.beginPath();c.ellipse(x-1,y-4,8,4,0.3,0,TAU);c.fill();c.stroke();}
  c.strokeStyle='#5f7d3a';c.lineWidth=2;for(let i=0;i<70;i++){const x=r()*w,y=gy+10+r()*(h-gy),hh=8+r()*16,sw=(r()-0.5)*8;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+sw*0.5,y-hh*0.6,x+sw,y-hh);c.stroke();}
  /* soft light dapples */
  for(let i=0;i<10;i++){const x=r()*w,y=gy+r()*(h-gy);const lg=c.createRadialGradient(x,y,2,x,y,40);lg.addColorStop(0,'rgba(255,240,180,.28)');lg.addColorStop(1,'rgba(255,240,180,0)');c.fillStyle=lg;c.beginPath();c.ellipse(x,y,40,18,0,0,TAU);c.fill();}
}
