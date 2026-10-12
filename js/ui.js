'use strict';
/* =====================================================================
   ひと夏の番長 — DOM UI, input, main loop
   ===================================================================== */
const $=id=>document.getElementById(id);
const stick={id:null,ox:0,oy:0};
const key={};
let hudKey='',bookTab='body',homeTab='body',homeSlot=null,storeFilter='all';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const OVERLAYS=['title','partCard','sumikaCard','downCard','clearCard','bookCard','endCard','talk','cine'];
function hideAll(){OVERLAYS.forEach(id=>{const el=$(id);if(el)el.hidden=true;});}
function partChip(p){const R=RARITY[p.rar];return '<b style="color:'+(p.rar?R.col:'inherit')+'">'+esc(partName(p))+'</b>';}
function traitsHTML(p){return p.tr.length?'<span class="traits">'+p.tr.map(k=>'<i title="'+esc(TRAITS[k].desc)+'">'+TRAITS[k].name+'</i>').join('')+'</span>':'';}
function qText(p){return isDefault(p.s,p.id)?'':'できばえ '+Math.round(p.q*100)+'%';}
function paintDango(canvas,eq,scale){
  const c=canvas,cc=c.getContext('2d'),keep=ctx;ctx=cc;cc.setTransform(1,0,0,1,0,0);cc.clearRect(0,0,c.width,c.height);
  const k=c.width/96;cc.setTransform(k,0,0,k,0,0);const id=eq.head.id,long=['kuwa','tsuno','mizukama','okama','hirata','oago'].includes(id);cc.translate(48,long?60:52);cc.rotate(-Math.PI/2);drawDango(eqIds(eq),scale||(long?17:20),{walk:0.6});ctx=keep;
}
const UI={
  banner(t,s){$('bannerT').textContent=t;$('bannerS').textContent=s||'';$('bannerS').hidden=!s;const el=$('banner');el.hidden=false;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(UI.btm);UI.btm=setTimeout(()=>{el.hidden=true;},2900);},
  say(lines,cb){UI.talkQ=lines.slice();UI.talkCb=cb;UI.choices=null;UI.showTalk();},
  showTalk(){
    const q=UI.talkQ;
    if(!q||!q.length){$('talk').hidden=true;const c=UI.talkCb;UI.talkCb=null;if(c)c();return;}
    const l=q[0];$('talkWho').textContent=l.who;$('talkWho').hidden=!l.who;$('talkText').textContent=l.text;$('talkChoices').innerHTML='';$('talkNext').hidden=false;$('talk').hidden=false;sfx('talk');
  },
  nextTalk(){if(UI.choices)return;if(UI.talkQ&&UI.talkQ.length){UI.talkQ.shift();UI.showTalk();}},
  ask(who,text,opts,cb){
    UI.talkQ=[];UI.choices=opts;$('talkWho').textContent=who;$('talkWho').hidden=!who;$('talkText').textContent=text;$('talkNext').hidden=true;
    $('talkChoices').innerHTML=opts.map((o,i)=>'<button type="button" class="go'+(i?' alt':'')+'" data-i="'+i+'">'+esc(o)+'</button>').join('');
    $('talk').hidden=false;sfx('talk');
    UI.askCb=k=>{UI.choices=null;$('talk').hidden=true;$('talkChoices').innerHTML='';cb(k);};
  },
  enterArea(o){
    hideAll();$('skipBtn').hidden=true;$('hud').hidden=false;$('btns').hidden=false;$('obj').hidden=false;$('stickHint').hidden=S.areaI>0||!!o.fromSave||S.cycle>0||!!S.tutRun;
    hudKey='';const A=AREA();$('areaNameB').textContent=A.name;$('areaNameS').textContent=A.sub+' ／ '+dateStr()+(S.cycle?' ／ '+(S.cycle+1)+'年目':'');
    const el=$('areaName');el.hidden=false;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(UI.atm);UI.atm=setTimeout(()=>{el.hidden=true;},2600);
  },
  bossIntro(e){
    $('bossIntroSub').textContent=e.T.final?'林の 若頭':AREA().name+'の 番長';$('bossIntroName').textContent=e.T.name.replace(/^.*番長 ?/,'').replace('林の若頭 ','');
    const el=$('bossIntro');el.hidden=false;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(UI.bitm);UI.bitm=setTimeout(()=>{el.hidden=true;},2200);sfx('drum');
  },
  /* ---------- part card ---------- */
  partCard(it){
    const p=it.p,D=PARTS[p.s][p.id],cur=P.eq[p.s],same=cur.id===p.id;
    UI.cardItem=it;
    const neq=Object.assign({},P.eq,{[p.s]:p}),a=calcStats(P.eq,P.lv),b=calcStats(neq,P.lv);
    $('pcSlot').textContent=SLOTNAME[p.s]+'の部位';$('pcName').innerHTML=partChip(p);$('pcRar').textContent=p.rar?RARITY[p.rar].name+'しな！':'';$('pcRar').style.color=RARITY[p.rar].col;
    $('pcQ').innerHTML=qText(p)+' '+traitsHTML(p);
    $('pcDesc').textContent=D.desc||'';
    if(same){const A=mergePreview(cur,p),B=mergePreview(p,cur);
      $('pcCmp').innerHTML='<div class="mg"><p class="small">おなじ部位どうしで ★合成 できる。のこす方を えらんでね（めずらしさ・できばえは のこした方の まま。★が 1つ 上がり、消える方の 特性を 1つ 引きつぐ）。</p>'+
        '<button type="button" class="entry mgbtn" data-mg="merge"><span class="mghead">A：いま つけている方を のこす</span><small>のこる：'+partChip(cur)+'　／　素材になって消える：拾った方</small><span class="mgres">けっか → '+partChip(A)+' '+qText(A)+traitsHTML(A)+(A.gained?' <small>（'+TRAITS[A.gained].name+'を 引きつぐ）</small>':'')+'</span></button>'+
        '<button type="button" class="entry mgbtn" data-mg="swapmerge"><span class="mghead">B：拾った方を のこして つけかえる</span><small>のこる：'+partChip(p)+'　／　素材になって消える：いま つけている方</small><span class="mgres">けっか → '+partChip(B)+' '+qText(B)+traitsHTML(B)+(B.gained?' <small>（'+TRAITS[B.gained].name+'を 引きつぐ）</small>':'')+'</span></button></div>';}
    else $('pcCmp').innerHTML=cmpHTML(a,b);
    const before=a.combos,after=b.combos;let notes='';
    if(D.poison)notes+='<div class="note">毒 ・ かんだ相手を じわじわ けずる</div>';if(D.counter)notes+='<div class="note">うしろから かまれると やり返す</div>';if(D.dashInv)notes+='<div class="note">突進中は 無敵</div>';if(D.stink)notes+='<div class="note">かまれると においで 敵を にげださせる</div>';if(D.kb)notes+='<div class="note">かんだ相手を ふきとばす</div>';if(D.grab)notes+='<div class="note">かんだ相手を 引きよせる</div>';if(D.guard)notes+='<div class="note">正面からの こうげきを へらす</div>';if(D.water)notes+='<div class="note">水の上を 歩ける</div>';if(D.glide)notes+='<div class="note">突進で 水の上を わたれる</div>';if(D.regen)notes+='<div class="note">体力が 少しずつ もどる</div>';if(D.gas)notes+='<div class="note">突進の おわりに ガス</div>';
    if(!same){COMBOS.filter(c=>after.includes(c.id)&&!before.includes(c.id)).forEach(c=>notes+='<div class="note waza-note"><b>わざ「'+c.name+'」が 使えるように なる！</b><br>'+UI.wazaHTML(c,true)+'</div>');
      const ids=eqIds(neq);COMBOS.filter(c=>!after.includes(c.id)&&c.need.some(([sl])=>sl===p.s)).forEach(c=>{const ok=c.need.filter(([sl,l])=>l.includes(ids[sl]));if(ok.length===c.need.length-1&&ok.some(([sl])=>sl===p.s)){const miss=c.need.find(([sl,l])=>!l.includes(ids[sl]));notes+='<div class="note">あと '+SLOTNAME[miss[0]]+'しだいで わざ「'+(DEX.combos[c.id]?c.name:'？？？')+'」（'+c.hint+'）</div>';}});COMBOS.filter(c=>before.includes(c.id)&&!after.includes(c.id)).forEach(c=>notes+='<div class="note lose">わざ「'+c.name+'」が 使えなくなる</div>');}
    if(!same){const b0=bloodOf(P.eq),b1=bloodOf(neq);if(b1&&(!b0||b0.k!==b1.k||b0.tier!==b1.tier))notes+='<div class="note">'+BLOODS[b1.k].n+(b1.tier>1?'（濃い）':'')+'が めざめる：'+BLOODS[b1.k].d[b1.tier-1]+'</div>';else if(b0&&!b1)notes+='<div class="note lose">'+BLOODS[b0.k].n+'が 消える</div>';}
    $('pcNotes').innerHTML=notes;
    $('pcNow').innerHTML='いまの'+SLOTNAME[p.s]+'：'+partChip(cur)+(isDefault(cur.s,cur.id)?'':' （つけかえると すみかへ おくる）');
    paintDango($('pcCanvas'),same?P.eq:neq);
    $('pcMerge').hidden=true;$('pcSwapMerge').hidden=true;$('pcEquip').textContent=same?'つけかえる':'からだに つける';
    $('pcMerge').disabled=$('pcSwapMerge').disabled=same&&cur.st>=5&&p.st>=5;
    $('pcStore').textContent='すみかへ おくる（'+S.store.length+'/'+STORE_MAX+'）';$('pcStore').disabled=S.store.length>=STORE_MAX;
    $('pcEat').textContent='たべる（+'+partXP(p)+'）';
    $('partCard').hidden=false;
  },
  closeCard(choice){const it=UI.cardItem;$('partCard').hidden=true;UI.cardItem=null;if(it)resolveItem(it,choice);hudKey='';},
  /* ---------- home ---------- */
  sumika(){homeTab='body';homeSlot=null;$('sumikaCard').hidden=false;UI.renderHome();hudKey='';},
  renderHome(){
    [...$('homeTabs').children].forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===homeTab)));
    $('homeStoreN').textContent=S.store.length+'/'+STORE_MAX;
    {const tb=[...$('homeTabs').children].find(b=>b.dataset.tab==='ally');if(tb)tb.textContent='なかま'+(S.roster.some(kzReady)||PAIRS.some(pr=>pairState(pr).ok)?' ！':'');}
    const body=$('homeBody');let h='';
    if(homeTab==='body'){
      const s=ST;
      h+='<div class="home-top"><canvas id="homeCanvas" width="192" height="192"></canvas><dl class="statgrid">'+
        '<dt>Lv</dt><dd>'+P.lv+'</dd><dt>体力</dt><dd>'+Math.round(s.maxhp)+'</dd><dt>一撃</dt><dd>'+Math.round(s.dmg)+'</dd><dt>かむ間かく</dt><dd>'+s.cd.toFixed(2)+'秒</dd><dt>足</dt><dd>'+Math.round(s.speed)+'</dd><dt>突進</dt><dd>'+Math.round(s.dash)+'</dd><dt>うける ダメージ</dt><dd>'+Math.round(s.def*100)+'%</dd></dl></div>';
      {const b=bloodOf(P.eq);h+=b?'<div class="entry blood"><b>'+BLOODS[b.k].n+(b.tier>1?'（濃い）':'')+'</b><small>同じ 系統の 部位 '+b.n+'つ ・ '+BLOODS[b.k].d[b.tier-1]+(b.tier<2?'（3つで もっと 濃くなる）':'')+'</small></div>':'<p class="small">同じ 系統の 部位を 2つ 以上 つけると「○○の血」が めざめる。</p>';}
      const cs=activeCombos(eqIds(P.eq));h+=cs.length?cs.map(c=>'<div class="entry"><b>わざ「'+c.name+'」</b><small>'+UI.wazaHTML(c,true)+'</small></div>').join(''):'<div class="combos"><small>わざ なし ― 部位の 組み合わせで 生まれる</small></div>';
      for(const sl of SLOTS){const p=P.eq[sl],cand=S.store.filter(x=>x.s===sl);
        h+='<div class="entry slotrow'+(homeSlot===sl?' open':'')+'"><button type="button" class="slotbtn" data-slot="'+sl+'"><span class="tag">'+SLOTNAME[sl]+'</span> '+partChip(p)+' <small>'+qText(p)+'</small>'+traitsHTML(p)+'<em>'+(cand.length?'すみかに '+cand.length+'こ ▾':'')+'</em></button>';
        if(homeSlot===sl){h+='<div class="cands">';if(!isDefault(sl,p.id))h+='<div class="cand"><span>はずして すみかへ</span><button type="button" class="mini" data-unequip="'+sl+'">はずす</button></div>';
          cand.sort((a,b)=>partScore(b)-partScore(a)).forEach(c=>{const b=calcStats(Object.assign({},P.eq,{[sl]:c}),P.lv);const nw=b.combos.filter(id=>!s.combos.includes(id)).map(id=>COMBOS.find(x=>x.id===id).name),ls=s.combos.filter(id=>!b.combos.includes(id)).map(id=>COMBOS.find(x=>x.id===id).name);h+='<div class="cand"><span>'+partChip(c)+' <small>'+qText(c)+'</small>'+traitsHTML(c)+'<br><small>'+cmpBrief(s,b)+'</small>'+(nw.length?'<br><small class="wzplus">＋わざ「'+nw.join('」「')+'」</small>':'')+(ls.length?'<br><small class="wzminus">－わざ「'+ls.join('」「')+'」</small>':'')+'</span><button type="button" class="mini" data-equip="'+c.u+'">つける</button></div>';});
          if(!cand.length&&isDefault(sl,p.id))h+='<small>すみかに この部位は ない。</small>';h+='</div>';}
        h+='</div>';}
    }else if(homeTab==='store'){
      {const cm=S.store.filter(p=>p.rar===0&&p.st===1&&!p.tr.length).length;
        h+='<div class="entry dango"><div><b>蜜だんご × '+(S.dango||0)+'</b>'+(dangoActive()?' <small class="on">におい中 のこり '+Math.ceil(S.dangoT/60)+'分</small>':'')+'<br><small>つかうと 4分の あいだ、甘い においで 虫が 子分に なりたがる（なりやすさ 4倍・門番も +35%）。こせいの 良い 子や、秘伝わざ もちが 来やすい。<br>つくりかた：ふつうの 部位 3こ（いま '+cm+'こ）。ミツバチや 女王、ぬしも 落とす。</small></div>'+
          '<div class="row tight"><button type="button" class="mini gold" data-dmake="1"'+(cm<3?' disabled':'')+'>つくる</button><button type="button" class="mini" data-duse="1"'+(!(S.dango>0)||dangoActive()?' disabled':'')+'>つかう</button></div></div>';}
      {const T=S.trophies||[];h+='<div class="entry trophy"><b>すみかの 飾り（'+T.length+'/'+TROPHY_MAX+'）</b><small>部位を かざると ちょっとした ききめが ある。番長や ぬしの 部位は ききめが 大きい。</small>'+T.map((p,i)=>'<div class="cand"><span>'+partChip(p)+'<br><small>'+trophyText(p)+'</small></span><button type="button" class="mini" data-unhang="'+i+'">おろす</button></div>').join('')+'</div>';}
      if(!S.store.length)h+='<p class="small">まだ なにも ない。ひろった 部位を「すみかへ おくる」と ここに たまる。</p>';
      const commons=S.store.filter(p=>p.rar===0&&p.st===1&&!p.tr.length);
      h+='<div class="chips">'+['all',...SLOTS].map(k=>'<button type="button" data-filter="'+k+'" aria-pressed="'+(storeFilter===k)+'">'+(k==='all'?'すべて':SLOTNAME[k])+'</button>').join('')+
        (commons.length?'<button type="button" data-eatall="1">ふつうの部位を まとめて たべる（'+commons.length+'）</button>':'')+'</div>';
      const sorted=S.store.filter(p=>storeFilter==='all'||p.s===storeFilter).sort((a,b)=>SLOTS.indexOf(a.s)-SLOTS.indexOf(b.s)||a.id.localeCompare(b.id)||partScore(b)-partScore(a));
      for(const p of sorted){const eqSame=P.eq[p.s].id===p.id,others=S.store.filter(x=>x!==p&&x.id===p.id);
        let btns='<button type="button" class="mini" data-equip="'+p.u+'">つける</button>';
        if(eqSame&&(p.st<5||P.eq[p.s].st<5))btns+='<button type="button" class="mini gold" data-mergeeq="'+p.u+'">★合成：つけている方を のこす</button><button type="button" class="mini gold" data-swapm="'+p.u+'">★合成：これを のこして つける</button>';
        else if(others.length&&p.st<5)btns+='<button type="button" class="mini gold" data-mergebase="'+p.u+'">★合成：これを のこす</button>';
        btns+='<button type="button" class="mini" data-eat="'+p.u+'">たべる +'+partXP(p)+'</button>';if((S.trophies||[]).length<TROPHY_MAX)btns+='<button type="button" class="mini" data-hang="'+p.u+'">かざる（'+trophyText(p)+'）</button>';
        h+='<div class="entry'+(eqSame?' active':'')+'"><div><span class="tag">'+SLOTNAME[p.s]+'</span> '+partChip(p)+' <small>'+qText(p)+'</small>'+traitsHTML(p)+(eqSame?' <small>（いま つけているのと 同じ部位）</small>':'')+'</div><div class="row tight">'+btns+'</div></div>';}
      h+='<p class="small">★合成：おなじ部位を かさねると ★が ふえて 強くなる（★5まで）。「のこす」方の めずらしさ・できばえは そのまま、★が 1つ 上がり、消える方の 特性を 1つ 引きつぐ。</p>';
    }else if(homeTab==='ally'){
      h+='<p class="small">なかま '+S.roster.length+' / '+ROSTER_MAX+'。'+(duoUnlocked()?'子分は 2匹まで つれて行ける。2匹のときは ひとりずつの 力は 少し ひかえめに なるが、相性しだいで コンビわざや 合体わざを 使う。':'いまは 1匹だけ。地べたの番長を たおすと 2匹 つれて行ける。')+'一緒に 戦うと レベルが 上がり、わざを おぼえる。</p>';
      {const a=S.roster[S.allyI],b=S.roster[S.allyJ];if(a&&b){const c=compatOf(a,b),pr=pairOf(a,b);h+='<div class="entry compat"><b>ふたりの 相性：'+COMPAT[c].m+' '+COMPAT[c].n+'</b><small>'+esc(a.name)+' × '+esc(b.name)+'<br>'+COMPAT[c].d+(c===2?'<br>コンビわざ／合体わざ「'+(pr?PAIR_MOVES[pr.id]:'ふたりがかり')+'」':'')+'</small></div>';}}
      {const ps=PAIRS.map(pr=>({pr,st:pairState(pr)})).filter(x=>x.st.m);
        if(ps.length){h+='<div class="entry pairs"><b>かけあい</b><small>絆を ふかめた 子分どうしが そろうと、すみかで 話を はじめる。なかよしに なると 連携わざで 必ず かけつける。</small>';
          for(const {pr,st} of ps){const [a,b]=st.m;h+='<div class="cand"><span>'+esc(a.name)+' × '+esc(b.name)+'<br><small>'+(st.done?'なかよし ✓':st.ok?'<b>話したそうに している</b>':'ふたりとも 絆 ●1 以上で 見られる')+'</small></span>'+(st.ok?'<button type="button" class="mini gold talkbtn" data-pair="'+pr.id+'">見る</button>':'')+'</div>';}
          h+='</div>';}}
      if(!S.roster.length)h+='<p class="small">まだ 子分は いない。門番を たおしたり、たまに 負けた虫が なかまに なりたがる。</p>';
      S.roster.forEach((r,i)=>{const T=TYPES[r.type],act=i===S.allyI||i===S.allyJ,st=allyStats(r),tier=skillTier(r),sk=ALLY_SKILLS[skillOf(r.type)],lv0=r.lv0??r.lv;
        const next=tier===0?'Lv'+(lv0+3)+'で わざを おぼえる':tier===1?'Lv'+(lv0+8)+'で 真・'+sk.name+'に':'わざを きわめた';
        h+='<div class="entry'+(act?' active':'')+'"><div><b>'+esc(T.name)+'</b> <small>Lv'+st.lv+(i===S.allyI?' ・ つれている（1匹目）':i===S.allyJ?' ・ つれている（2匹目）':r.faint?' ・ すみかで 休養中':' ・ すみかで 待機')+'</small>'+
          '<div class="bar xp" style="margin:4px 0"><i style="width:'+clamp((r.xp||0)/allyNeed(r.lv)*100,0,100)+'%"></i></div>'+
          '<small>'+allyTraitLine(r)+(r.trait?'<br><span class="tdesc">'+ALLY_TRAITS[r.trait].name+'：'+ALLY_TRAITS[r.trait].desc+'</span>':'')+'</small><br>'+
          '<small>わざ：'+(tier?'<b>'+(tier===2?'真・':'')+sk.name+'</b> ― '+sk.desc:'？？？（'+sk.name.length+'文字）')+(r.rare?'<br>秘伝わざ：'+(tier?'<b>'+ALLY_SKILLS[r.rare].name+'</b> ― '+ALLY_SKILLS[r.rare].desc:'？？？（わざを おぼえると 使いはじめる）'):'')+'<br>'+next+'</small><br>'+
          '<small class="kz">絆 '+'<b>'+'●'.repeat(r.kz||0)+'</b>'+'○'.repeat(3-(r.kz||0))+((r.kz||0)<3?(kzReady(r)?' ・ <b>話したいことが あるようだ</b>':' ・ あと '+Math.max(1,Math.ceil((KZ_NEED[r.kz||0]-(r.bt||0))/60))+'分 一緒に たたかうと 話せる'):' ・ 絆・連携わざ')+'</small><br><small>'+esc(T.dex)+'</small></div><div class="row tight">'+
          (kzReady(r)?'<button type="button" class="mini gold talkbtn" data-talk="'+i+'">話す！</button>':'')+
          (r.faint?'<small class="rest">休養中 あと '+Math.ceil(r.restT||0)+'秒（外で すごすと 回復'+(r.autoBack?'。元気に なったら 自動で もどってくる':'')+'）</small>'+(S.dango>0?'<button type="button" class="mini gold" data-revive="'+i+'">蜜だんごで 元気に</button>':''):'')+(r.faint&&i!==S.allyI&&i!==S.allyJ?'':i===S.allyI?'<button type="button" class="mini" data-rest="'+i+'">休ませる</button>':i===S.allyJ?'<button type="button" class="mini" data-rest2="'+i+'">休ませる</button>':(S.allyI<0||!S.roster[S.allyI]?'<button type="button" class="mini gold" data-take="'+i+'">つれていく</button>':(duoUnlocked()?'<button type="button" class="mini gold" data-take2="'+i+'">'+(S.allyJ>=0&&S.roster[S.allyJ]?'2匹目と 交代':'2匹目に つれていく')+'</button>':'')+'<button type="button" class="mini" data-take="'+i+'">1匹目と 交代</button>'))+'<button type="button" class="mini" data-bye="'+i+'">わかれる</button></div></div>';});
    }else if(homeTab==='dojo'){
      h+='<p class="small">けいこ場では やられない。わら人形と 動く まとで 一撃の 重さ（ダメージ/秒）を はかったり、師範の 輪に 入って ボスの わざを まるまって ふせぐ 練習が できる。子分を つれていけば 絆が すぐ たまるので、連携わざも ためせる。</p>';
      h+='<div class="entry"><b>いまの からだ</b><small>一撃 '+Math.round(ST.dmg)+' ・ かむ間かく '+ST.cd.toFixed(2)+'秒 ・ わざ '+(ST.combos.map(id=>COMBOS.find(c=>c.id===id).name).join('、')||'なし')+'</small><small>子分：'+(ALLY?ALLY.T.name+'（連携わざ「'+COMBO_MOVES[skillOf(ALLY.type)]+'」）':'なし')+'</small></div>';
      h+='<button type="button" class="go" data-dojo="1">けいこ場へ 行く</button>';
    }else if(homeTab==='quest'){
      qEnsure();h+='<p class="small">林の 虫たちからの たのみごと。はたすと その場で お礼が もらえる。日が かわるか、べつの エリアへ 行くと 新しい たのみに かわる。</p>';
      for(const q of S.quests||[]){h+='<div class="entry quest'+(q.done?' done':'')+'"><b>'+esc(q.giver)+'</b><small>「'+esc(q.say)+q.text+'」</small><div class="bar xp" style="margin:4px 0"><i style="width:'+clamp(q.got/q.n*100,0,100)+'%"></i></div><small>'+(q.done?'<b>達成！</b>':Math.min(q.got,q.n)+' / '+q.n+' '+q.unit)+' ・ お礼：'+qRewardText(q.reward)+'</small></div>';}
    }else if(homeTab==='map'){
      h+='<p class="small">しめた 場所には いつでも もどれる。番長たちも また 待っている（部位あつめに）。</p>';
      AREAS.forEach((A,i)=>{const ok=i<=S.unlocked||S.cleared.includes(i),done=S.cleared.includes(i),here=i===S.areaI;
        h+='<div class="entry'+(ok?'':' locked')+'"><div><b>'+(ok?A.name:'？？？')+'</b> <small>'+(ok?A.sub+' ・ Lv'+(A.lv+18*S.cycle)+'〜':'')+(done?' ・ しめた':'')+(here?' ・ いま ここ':'')+'</small></div>'+'<div class="row tight">'+(ok&&!here?'<button type="button" class="mini gold" data-go="'+i+'">行く</button>':'')+(done?'<button type="button" class="mini chal" data-chal="'+i+'">挑戦状</button>':'')+'</div>'+(done&&(DEX.chal||{})[A.id]?'<small>挑戦状 ベスト '+fmtTime(DEX.chal[A.id].best)+'</small>':'')+'</div>';});
      h+='<p class="small">挑戦状：しめた場所の 番長と 門番が 覚醒して 待っている。しめ縄は ほどけている。勝てば よい部位が 2つ と タイムが のこる。</p>';
    }
    body.innerHTML=h;
    if(homeTab==='body')paintDango($('homeCanvas'),P.eq);
  },
  homeAction(e){
    const b=e.target.closest('button');if(!b)return;const d=b.dataset;
    const find=u=>S.store.find(x=>x.u===+u);
    if(d.slot){homeSlot=homeSlot===d.slot?null:d.slot;}
    else if(d.unequip){unequip(d.unequip);sfx('store');}
    else if(d.equip){const p=find(d.equip);if(p){equipPart(p);sfx('lvup');}}
    else if(d.filter){storeFilter=d.filter;}
    else if(d.eatall){const n=eatCommons();UI.banner('もぐもぐ','ふつうの部位を '+n+'こ たべた');}
    else if(d.mergeeq){const p=find(d.mergeeq);if(p){const base=P.eq[p.s];mergeParts(base,p);UI.banner(partName(base),'★'+base.st+'に そだった！');}}
    else if(d.swapm){const p=find(d.swapm);if(p){swapMerge(p);UI.banner(partName(p),'つけかえて ★'+p.st+'に そだった！');}}
    else if(d.mergebase){const p=find(d.mergebase);if(p){const mat=S.store.filter(x=>x!==p&&x.id===p.id).sort((a,b)=>partScore(a)-partScore(b))[0];if(mat){mergeParts(p,mat);UI.banner(partName(p),'★'+p.st+'に そだった！');}}}
    else if(d.eat){const p=find(d.eat);if(p){if(p.rar||p.st>1||p.tr.length){UI.confirm('「'+partName(p)+'」を たべる？',()=>{eatPart(p);writeSave();UI.renderHome();hudKey='';});return;}eatPart(p);}}
    else if(d.revive){if(reviveWithDango(+d.revive)){UI.banner(S.roster[+d.revive].name+'が 元気に なった','蜜だんごを 1こ つかった');spawnAllyIfChanged();}}
    else if(d.hang){const p=find(d.hang);if(p&&hangTrophy(p)){UI.banner('すみかに かざった',partName(p)+' ・ '+trophyText(p));checkAch();}}
    else if(d.unhang){if(!takeTrophy(+d.unhang))UI.banner('すみかが いっぱい','もちものに あきが ない');}
    else if(d.talk){kzTalk(+d.talk);return;}
    else if(d.pair){pairTalk(d.pair);return;}
    else if(d.dmake){if(makeDango())UI.banner('蜜だんごを つくった','もちもの の「つかう」で 甘い においを まとう');}
    else if(d.duse){if(useDango()){UI.banner('蜜だんごを つかった','4分の あいだ、虫が 子分に なりたがる');checkAch();}}
    else if(d.take){setActiveAlly(+d.take);sfx('ally');}
    else if(d.rest){if(S.allyJ>=0){S.allyI=S.allyJ;S.allyJ=-1;}else S.allyI=-1;ALLY=null;ALLY2=null;spawnAllyIfChanged();sfx('store');}
    else if(d.rest2){S.allyJ=-1;ALLY2=null;sfx('store');}
    else if(d.take2){const k=+d.take2;if(k!==S.allyI){S.allyJ=k;spawnAllyIfChanged();sfx('ally');}}
    else if(d.bye){const r=S.roster[+d.bye];UI.confirm(r.name+'と わかれる？（もう もどってこない）',()=>{releaseAlly(+d.bye);UI.renderHome();});return;}
    else if(d.go){const i=+d.go;$('sumikaCard').hidden=true;travelTo(i);return;}
    else if(d.chal){const i=+d.chal;UI.confirm(AREAS[i].name+'の 挑戦状を うける？ 覚醒した 番長が 待っている。',()=>{$('sumikaCard').hidden=true;travelTo(i,{challenge:true});});return;}
    else if(d.dojo){$('sumikaCard').hidden=true;enterDojo();hudKey='';return;}
    writeSave();UI.renderHome();hudKey='';
  },
  /* ---------- first-time coaching for かむ / まるまる ---------- */
  /* ---------- first-stage coaching (every new game; can be closed) ---------- */
  coach(){
    const el=$('coach');const off=!S.tutRun||S.areaI!==0||S.talk||S.state!=='play'||S.rk;
    if(off){if(!el.hidden){el.hidden=true;UI.coSt=-1;$('bBite').classList.remove('coachme');$('bRoll').classList.remove('coachme');}return;}
    const c=UI.co=UI.co||{st:0,t:0};c.t+=1;
    const steps=[
      {btn:null,ar:'-999px',pos:'left',html:'<b>うごく</b>：画面の 左がわを 指で なぞる。<br>なぞった 向きへ 歩く。',done:()=>(c.mv=(c.mv||0)+(Math.hypot(inp.x,inp.y)>0.3?1:0))>60},
      {btn:'bBite',ar:'40px',html:'<b>かむ</b>：タップで かみつく。<br>近くの 虫に ためしてみよう。',done:()=>S.stats.kills>0||c.bites>=3},
      {btn:'bRoll',ar:'150px',html:'<b>まるまる</b> を <b>おしっぱなし</b>に すると、まるまって ガード。<br>こうげきを ふせげる。',done:()=>c.held>25},
      {btn:'bRoll',ar:'150px',html:'そのまま <b>はなす</b>と……<b>突進</b>！<br>スティックの 向きへ ころがって 体当たり。',done:()=>P.dashT>0},
      {btn:null,ar:'150px',html:'いいぞ！ こうげきが 当たる <b>直前に まるまる</b>と「ジャスト」で 反撃できる。<br>小石に 突進すると はじき飛ばせる。',done:()=>c.t>c.t4+300}];
    if(c.st>=steps.length){S.tutRun=false;DEX.tut=1;saveDex();el.hidden=true;return;}
    if(c.st===1&&P.biteT>0.15)c.bites=(c.bites||0)+1;
    if(c.st===2&&P.rolled)c.held=(c.held||0)+1;
    const sp=steps[c.st];
    if(UI.coSt!==c.st){UI.coSt=c.st;$('coachT').innerHTML=sp.html+'<small class="cstep">'+(c.st+1)+' / '+steps.length+'</small>';el.style.setProperty('--ar',sp.ar);el.classList.toggle('left',sp.pos==='left');el.hidden=false;el.style.animation='none';void el.offsetWidth;el.style.animation='';
      $('bBite').classList.toggle('coachme',sp.btn==='bBite');$('bRoll').classList.toggle('coachme',sp.btn==='bRoll');if(c.st===4)c.t4=c.t;}
    if(c.t>60&&sp.done()){c.st++;c.t=Math.max(c.t,61);if(c.st<steps.length)sfx('star');}
  },
  orderMenu(show){const m=$('orderMenu');if(!show){m.hidden=true;return;}m.innerHTML=Object.keys(ORDERS).map(k=>'<button type="button" data-ord="'+k+'" class="'+(order()===k?'on':'')+'"><b>'+ORDERS[k].n+'</b><small>'+ORDERS[k].d+'</small></button>').join('');m.hidden=false;},
  /* ---------- わざ helpers ---------- */
  btnTags(){
    for(const b of ['roll','bite']){const ids=ST.combos.filter(id=>COMBO_HOW[id].btn===b),el=$(b+'Tag');
      el.hidden=!ids.length;el.textContent=ids.slice(0,2).map(id=>COMBO_HOW[id].tag).join('・')+(ids.length>2?' +'+(ids.length-2):'');}
  },
  tagHit(btn){const el=$(btn+'Tag');if(!el||el.hidden)return;el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit');},
  wazaQ:[],
  waza(c){UI.wazaQ.push(c);if($('wazaCard').hidden)UI.wazaNext();},
  wazaNext(){const c=UI.wazaQ.shift();if(!c){$('wazaCard').hidden=true;S.talk=UI.wazaPrevTalk||false;return;}
    if($('wazaCard').hidden){UI.wazaPrevTalk=S.talk;S.talk=true;}
    const H=COMBO_HOW[c.id];$('wzName').textContent=c.name;
    const b=$('wzBtn');b.className='wz-btn '+H.btn;b.innerHTML=H.btn==='roll'?'まる<br>まる':H.btn==='bite'?'かむ':'いつでも';
    $('wzHow').textContent=H.how;
    $('wzParts').innerHTML='部位の 組み合わせ：'+c.need.map(([sl])=>'<b>'+SLOTNAME[sl]+'</b> '+esc(PARTS[sl][P.eq[sl].id].name)).join(' ＋ ')+'<br>'+(H.btn==='auto'?'つけている間 ずっと はたらく。':'ボタンの 上の ラベル「'+H.tag+'」が 目じるし。');
    $('wazaCard').hidden=false;sfx('combo');},
  wazaHTML(c,known){const H=COMBO_HOW[c.id];return '<span class="wzchip '+H.btn+'">'+(H.btn==='auto'?'じどう':BTN_NAME[H.btn]+'で')+'</span> '+(known?H.how:'ヒント：'+c.hint);},
  confirm(text,yes){$('confirmText').textContent=text;$('confirmCard').hidden=false;UI.confirmYes=yes;},
  /* ---------- down / clear ---------- */
  down(msg){$('downText').textContent=msg;$('downCard').hidden=false;},
  clear(){
    const A=AREA(),next=S.areaI+1;
    $('clearDate').textContent=dateStr();$('clearTitle').textContent=A.name+'を しめた！';$('clearText').textContent=A.clear||'';
    $('clearLadder').innerHTML=AREAS.map((a,i)=>'<span class="'+(S.cleared.includes(i)?'done':i===next?'now':'lock')+'">'+(i<=S.unlocked||S.cleared.includes(i)?a.name:'？')+'</span>').join('→');
    $('clearGo').textContent=next<AREAS.length?AREAS[next].name+'へ すすむ':'すすむ';$('clearGo').hidden=next>=AREAS.length;
    $('clearCard').hidden=false;
  },
  /* ---------- ending ---------- */
  ending(scene){
    hideAll();['hud','btns','obj','stickHint','areaName','banner','bossIntro','achPop','coach'].forEach(id=>$(id).hidden=true);UI.coSt=-1;
    if(scene<0){$('cine').hidden=true;return;}
    const lines=endingLines(),l=lines[END.line];
    if(!l){$('cine').hidden=true;return;}
    $('cineWho').textContent=l.who;$('cineWho').hidden=!l.who;$('cineText').textContent='';$('cine').hidden=SCN()[scene].id==='diary';
    UI.typing={text:l.text,i:0};clearInterval(UI.typeTm);
    UI.typeTm=setInterval(()=>{const ty=UI.typing;if(!ty){clearInterval(UI.typeTm);return;}ty.i++;$('cineText').textContent=ty.text.slice(0,ty.i);if(ty.i%3===0&&ty.text[ty.i-1]!==' ')sfx('talk');if(ty.i>=ty.text.length)clearInterval(UI.typeTm);},45);
  },
  openingStart(){$('skipBtn').hidden=false;},
  openingDone(){$('skipBtn').hidden=true;$('cine').hidden=true;},
  finishTyping(){const ty=UI.typing;if(!ty)return;ty.i=ty.text.length;$('cineText').textContent=ty.text;clearInterval(UI.typeTm);},
  endCard(){
    hideAll();const m=Math.floor(S.playT/60),sec=Math.floor(S.playT%60);
    $('endRank').textContent=S.endRank;$('endLead').textContent=(S.cycle?(S.cycle+1)+'年目の ':'')+'ひと夏の 絵日記';
    const st=S.stats;
    $('endStats').innerHTML='<dt>番長に なった日</dt><dd>'+dateStr()+'</dd><dt>からだ</dt><dd>Lv'+P.lv+'</dd><dt>あそんだ時間</dt><dd>'+m+'分'+sec+'秒</dd><dt>たおした虫</dt><dd>'+st.kills+'ひき（あばれ '+st.elites+'）</dd><dt>番長・門番</dt><dd>'+st.bosses+'回 勝った</dd><dt>いちばん重い一撃</dt><dd>'+st.maxHit+'</dd><dt>相撲</dt><dd>'+st.sumo+'勝</dd><dt>ずかん</dt><dd>'+DEX_ORDER.filter(t=>DEX.bugs[t]).length+' / '+DEX_ORDER.length+'</dd><dt>子分</dt><dd>'+(S.roster.map(r=>esc(r.name)).join('、')||'なし')+'</dd><dt>わざ</dt><dd>'+(activeCombos(eqIds(P.eq)).map(c=>c.name).join('、')||'なし')+'</dd>';
    $('endDiary').innerHTML=diaryHTML();
    $('endCard').hidden=false;
  },
  achieve(a){const el=$('achPop');$('achName').textContent=a.name;$('achDesc').textContent=a.desc;el.hidden=false;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(UI.achtm);UI.achtm=setTimeout(()=>{el.hidden=true;},3600);},
  hud(){
    if(!P||!ST||S.state==='title'||S.state==='ending'||S.state==='endcard')return;
    const al=ALLY&&!ALLY.dead?ALLY:null;
    const k=[skyPhase(),isRain(),S.dojo,Math.floor(S.chalT||0),Math.round(S.bond||0),DEX.title||'',al?al.rec.lv:0,P.hp|0,ST.maxhp|0,P.lv,P.xp,...SLOTS.map(s=>P.eq[s].u+':'+P.eq[s].st),dayNum(),S.areaI,ST.combos.length,al?al.hp|0:-1,ALLY2&&!ALLY2.dead?ALLY2.hp|0:-1,S.keepersDown,S.bossDown,!!S.exit,MAP.lair.open].join('|');
    if(k!==hudKey){hudKey=k;
      $('lv').textContent='Lv'+P.lv;$('dangoTag').hidden=!dangoActive();const tt=ACHS.find(a=>a.id===DEX.title);$('titleTag').textContent=tt?'「'+tt.name+'」':'';$('titleTag').hidden=!tt;$('hpText').textContent=Math.max(0,Math.ceil(P.hp))+'/'+Math.round(ST.maxhp);$('hpBar').style.width=clamp(P.hp/ST.maxhp*100,0,100)+'%';
      $('hpBar').classList.toggle('low',P.hp<ST.maxhp*0.3);
      $('xpBar').style.width=(P.lv>=MAX_LV?100:clamp(P.xp/xpNeed(P.lv)*100,0,100))+'%';
      UI.btnTags();
      {const a2=ALLY2&&!ALLY2.dead?ALLY2:null;$('allyName2').hidden=$('allyBar2w').hidden=!a2;if(a2){const c=duoCompat();$('allyName2').textContent='2匹目 Lv'+a2.rec.lv+' '+a2.T.name+(c>=0?' ・ 相性'+COMPAT[c].m:'');$('allyBar2').style.width=clamp(a2.hp/a2.maxhp*100,0,100)+'%';}}
      $('allyBox').hidden=!al;$('bondBar').style.width=(al?S.bond||0:0)+'%';$('bondBar').classList.toggle('full',(S.bond||0)>=100);
      if(al){const tier=skillTier(al.rec);$('allyName').textContent='子分 Lv'+al.rec.lv+' '+al.T.name+(tier?' ・ '+(tier===2?'真・':'')+ALLY_SKILLS[skillOf(al.type)].name:'');$('allyBar').style.width=clamp(al.hp/al.maxhp*100,0,100)+'%';}
      const ph=MAP.dojo?'':{day:'昼',dusk:'夕方',night:'夜',dawn:'明け方'}[skyPhase()];$('date').textContent=dateStr()+(ph?' '+ph:'')+(isRain()?' ☂':'');$('areaSmall').textContent=AREA().name+(S.cycle?'・'+(S.cycle+1)+'年目':'');
      const ob=objective();if(ob!==UI.objText){UI.objText=ob;UI.objT=0;$('obj').textContent=ob;}
    }
    if(!$('stickHint').hidden){if(Math.hypot(inp.x,inp.y)>0.3)UI.moveT=(UI.moveT||0)+1;if(UI.moveT>150||S.t>40)$('stickHint').hidden=true;}
    UI.objT=(UI.objT||0)+1;$('obj').classList.toggle('fade',UI.objT>360||!!S.sumo||!!S.bossBar);
    {const br=typeof bondReady==='function'&&bondReady(),has=!!(ALLY&&!ALLY.dead)&&S.state==='play',k=br+'|'+has+'|'+order()+'|'+Math.round(S.bond||0);
      if(k!==UI.brk){UI.brk=k;const b=$('bCombo');b.hidden=!has;b.classList.toggle('idle',!br);b.style.setProperty('--g',Math.round(S.bond||0)+'%');
        b.innerHTML=br?COMBO_MOVES[skillOf(ALLY.type)]:'<span class="ord">'+ORDERS[order()].n+'</span><small>長おしで 指示</small>';}
      if(!has&&!$('orderMenu').hidden)$('orderMenu').hidden=true;}
    UI.coach();if(UI.mmT%30===0&&dangoActive())$('dangoTag').textContent='蜜 '+Math.floor(S.dangoT/60)+':'+String(Math.floor(S.dangoT%60)).padStart(2,'0');
    UI.mmT=(UI.mmT||0)+1;if(UI.mmT%6===0)drawMinimap($('mini'));
    if(UI.mmT%30===0){const r=document.querySelector('.me').getBoundingClientRect();$('obj').style.top=Math.round(r.bottom+8)+'px';const sd=document.querySelector('.side').getBoundingClientRect(),ob=$('obj').getBoundingClientRect(),of=$('obj').classList.contains('fade')||$('obj').hidden;UI.topY=Math.round(Math.max(sd.bottom,of?0:ob.bottom,r.bottom)+8);}
  }
};
function cmpRows(){return [['一撃',s=>s.dmg,90],['かむ速さ',s=>1/s.cd,6],['範囲',s=>s.range*s.arc,140],['足',s=>s.speed,280],['突進',s=>s.dash,1200],['かたさ',s=>1/s.def,3.2]];}
function cmpHTML(a,b){
  return cmpRows().map(([lbl,f,max])=>{const va=f(a),vb=f(b),diff=vb/va-1,cls=Math.abs(diff)<0.02?'':diff>0?'up':'down',txt=Math.abs(diff)<0.02?'＝':(diff>0?'▲':'▼')+Math.round(Math.abs(diff)*100)+'%';
    return '<div class="cmp-row"><span>'+lbl+'</span><span class="cmp-bar"><i style="width:'+clamp(va/max*100,2,100)+'%"></i><b style="width:'+clamp(vb/max*100,2,100)+'%"></b></span><span class="'+cls+'">'+txt+'</span></div>';}).join('');
}
function cmpBrief(a,b){const out=[];for(const [lbl,f] of cmpRows()){const d=f(b)/f(a)-1;if(Math.abs(d)>=0.03)out.push('<span class="'+(d>0?'up':'down')+'">'+lbl+(d>0?'▲':'▼')+Math.round(Math.abs(d)*100)+'%</span>');}return out.join(' ')||'かわらない';}
function diaryHTML(){
  const days=Object.keys(S.diary).map(Number).sort((a,b)=>a-b);
  if(!days.length)return '<p class="small">まだ なにも 書いていない。</p>';
  return days.map(d=>'<div class="day"><b>'+dateStr(d)+'</b><br>'+S.diary[d].map(esc).join('<br>')+'</div>').join('');
}
/* ---------- notebook ---------- */
function openBook(){if(S.state!=='play'||S.talk)return;S.state='pause';$('bookCard').hidden=false;renderBook();}
function closeBook(){$('bookCard').hidden=true;S.state='play';}
function renderBook(){
  [...$('tabs').children].forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===bookTab)));
  const body=$('bookBody');let h='';
  if(bookTab==='body'){
    h+='<div class="ladder">'+AREAS.map((a,i)=>'<span class="'+(S.cleared.includes(i)?'done':i===S.areaI?'now':'lock')+'">'+(i<=S.unlocked||S.cleared.includes(i)?a.name:'？')+'</span>').join('→')+'</div>';
    h+='<p class="small">いまの もくひょう：<b>'+esc(objective())+'</b></p>';
    h+=SLOTS.map(sl=>{const p=P.eq[sl],D=PARTS[sl][p.id];return '<div class="entry"><b><span class="tag">'+SLOTNAME[sl]+'</span> '+partChip(p)+'</b><small>'+qText(p)+traitsHTML(p)+' '+(D.desc||'まだ 何も ついていない。')+'</small></div>';}).join('');
    h+='<p class="small">部位の つけかえ・合成・子分の 入れかえは「すみか」で できる。</p>';
  }else if(bookTab==='waza'){
    h+='<p class="small">部位の 組み合わせで 使える わざ。</p>';
    const on=ST.combos;
    h+=COMBOS.map(c=>{const known=DEX.combos[c.id]||on.includes(c.id);return '<div class="entry'+(known?'':' locked')+'"><b>'+(known?c.name:'？？？')+(on.includes(c.id)?'（はつどう中）':'')+'</b><small>'+UI.wazaHTML(c,known)+'</small></div>';}).join('');
    h+='<p class="small">とくせい：部位に ついている おまけ。</p>'+TRAIT_KEYS.map(k=>'<div class="entry"><b>'+TRAITS[k].name+'</b><small>'+TRAITS[k].desc+'</small></div>').join('');
  }else if(bookTab==='zukan'){
    const seen=DEX_ORDER.filter(t=>DEX.bugs[t]).length;
    h+='<p class="small">たおした虫：'+seen+' / '+DEX_ORDER.length+'しゅるい</p><div class="dexgrid">';
    h+=DEX_ORDER.map(t=>{const n=DEX.bugs[t],T=TYPES[t];let drops='';
      if(n){const d=T.drop,rd=RARE_DROPS[t];if(d)drops+='<br><small>落とす：'+(DEX.parts[d[1]]?PARTS[d[0]][d[1]].name:'？？？')+(T.boss?'（かならず）':T.keeper?'（よく）':d[2]>=0.2?'（ときどき）':'（まれに）')+'</small>';if(rd)drops+='<br><small>レア：'+((DEX.rare||{})[rd[1]]?PARTS[rd[0]][rd[1]].name:'？？？')+'</small>';}
      return '<div class="entry'+(n?'':' locked')+'"><canvas class="dexc" data-t="'+(n?t:'')+'" width="96" height="96"></canvas><b>'+(n?esc(T.name):'？？？')+'</b><small>'+(n?esc(T.dex)+'（'+n+'ひき）':'まだ 会っていない。')+'</small>'+drops+'</div>';}).join('');
    h+='</div>';
  }else if(bookTab==='parts'){
    const all=[];for(const sl of SLOTS)for(const id in PARTS[sl])if(!isDefault(sl,id))all.push([sl,id]);
    const found=all.filter(([,id])=>DEX.parts[id]).length;
    h+='<p class="small">見つけた 部位：'+found+' / '+all.length+'しゅるい</p>';
    const from=id=>{const out=[];for(const t of DEX_ORDER){const T=TYPES[t];if(T.drop&&T.drop[1]===id&&DEX.bugs[t])out.push(T.name);const rd=RARE_DROPS[t];if(rd&&rd[1]===id&&DEX.bugs[t]&&(DEX.rare||{})[id])out.push(T.name+'（レア）');}return out;};
    h+=all.map(([sl,id])=>{const ok=DEX.parts[id],D=PARTS[sl][id],f=from(id);return '<div class="entry'+(ok?'':' locked')+'"><b><span class="tag">'+SLOTNAME[sl]+'</span> '+(ok?D.name:'？？？')+'</b><small>'+(ok?esc(D.desc):'まだ 見つけていない。')+(f.length?'<br>落とす虫：'+f.map(esc).join('、'):'')+'</small></div>';}).join('');
  }else if(bookTab==='ach'){
    const got=ACHS.filter(a=>(DEX.ach||{})[a.id]);
    h+='<p class="small">称号：'+got.length+' / '+ACHS.length+'。手に入れた 称号を タップすると 名前の よこに かざれる。</p>';
    h+=ACHS.map(a=>{const d=(DEX.ach||{})[a.id],on=DEX.title===a.id;return '<button type="button" class="entry achbtn'+(d?'':' locked')+(on?' active':'')+'" data-ach="'+a.id+'"'+(d?'':' disabled')+'><b>'+(d?a.name:'？？？')+(on?'（かざり中）':'')+'</b><small>'+a.desc+(d?' ・ '+d:'')+'</small></button>';}).join('');
  }else if(bookTab==='nikki'){h+=diaryHTML();}
  else{h+=['bgm','se','shake','vib'].map(k=>'<div class="toggle">'+({bgm:'BGM',se:'こうかおん',shake:'画面の ゆれ',vib:'ふるえ（対応機種）'})[k]+'<button type="button" data-opt="'+k+'" aria-pressed="'+OPT[k]+'">'+(OPT[k]?'ON':'OFF')+'</button></div>').join('');
    h+='<p class="small">そうさ：左がわを なぞって 移動。「かむ」で こうげき（おしっぱなしで 連続）。近くの 敵へ 自動で 向く。「まるまる」を おしてる間は かたい。はなすと 突進。<br>キーボード：矢印/WASD 移動・Z/スペース かむ・X/シフト まるまる・C 連携わざ・Esc てちょう<br>子分と 一緒に 戦うと「絆」が たまり、いっぱいになると 連携わざが 出せる。</p>';}
  body.innerHTML=h;body.scrollTop=0;
  if(bookTab==='zukan'){body.querySelectorAll('canvas.dexc').forEach(c=>{const t=c.dataset.t;const g=c.getContext('2d');g.clearRect(0,0,96,96);if(!t){g.fillStyle='rgba(42,33,24,.15)';g.font='bold 40px sans-serif';g.textAlign='center';g.fillText('？',48,62);return;}const keep=ctx;ctx=g;g.setTransform(1,0,0,1,0,0);g.translate(48,52);g.rotate(-Math.PI/2);const T=TYPES[t];drawBugBody(T,Math.min(26,T.r)*0.95,{type:t,walk:0.8,flap:1});ctx=keep;});}
}
function setOpt(k){OPT[k]=!OPT[k];try{localStorage.setItem(OPT_KEY,JSON.stringify(OPT));}catch(e){}setVolumes();}
/* ---------- title ---------- */
function toTitle(){
  S.state='title';S.talk=false;music.play('title');hideAll();
  ['hud','btns','obj','stickHint','areaName','banner','bossIntro','confirmCard'].forEach(id=>$(id).hidden=true);
  $('title').hidden=false;
  const s=readSave();$('contBtn').hidden=!s;
  if(s)$('contBtn').textContent='つづきから（'+AREAS[Math.min(s.areaI,AREAS.length-1)].name+(s.cycle?'・'+(s.cycle+1)+'年目':'')+'）';
  const done=s&&s.cleared&&s.cleared.includes(AREAS.length-1);$('ngBtn').hidden=!done;if(done)$('ngBtn').textContent='来年の夏へ（'+(s.cycle+2)+'年目）';
  $('titleSub').textContent=DEX.clears?'番長の座に すわった 回数：'+DEX.clears+'回':'ダンゴムシ、ひと夏の 成り上がり';
  if(!P){P=newPlayer();refreshStats();}
  S.cycle=s?s.cycle||0:0;loadArea(0,{title:true});ALLY=null;S.state='title';
}
function bindHold(el,on,off){
  el.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();try{el.setPointerCapture(e.pointerId);}catch(_){}el.classList.add('on');on();});
  const up=()=>{el.classList.remove('on');if(off)off();};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);el.addEventListener('contextmenu',e=>e.preventDefault());
}
function boot(){
  cv=$('cv');ctx=cv.getContext('2d');loadDex();
  try{const o=JSON.parse(localStorage.getItem(OPT_KEY)||'null');if(o)Object.assign(OPT,o);}catch(e){}
  window.addEventListener('resize',resize);resize();
  let rollBtn=false;
  bindHold($('bBite'),()=>{inp.bite=true;inp.biteHold=true;},()=>{inp.biteHold=false;});
  {const b=$('bCombo');let tm=null,long=false;
    b.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();long=false;clearTimeout(tm);tm=setTimeout(()=>{long=true;UI.orderMenu(true);vib(20);},420);});
    const up=e=>{e.preventDefault();clearTimeout(tm);if(!long){if(bondReady())inp.combo=true;else{const m=$('orderMenu');if(m.hidden)UI.orderMenu(true);else m.hidden=true;}}};
    b.addEventListener('pointerup',up);b.addEventListener('pointercancel',()=>clearTimeout(tm));
    $('orderMenu').addEventListener('click',e=>{const k=e.target.closest('[data-ord]');if(!k)return;setOrder(k.dataset.ord);$('orderMenu').hidden=true;UI.brk='';});
    $('coachX').addEventListener('click',()=>{S.tutRun=false;$('coach').hidden=true;$('bBite').classList.remove('coachme');$('bRoll').classList.remove('coachme');});}
  bindHold($('bRoll'),()=>{rollBtn=true;},()=>{rollBtn=false;});
  $('start').addEventListener('click',()=>{initAudio();if(readSave()){UI.confirm('いまの きろくを けして、はじめから あそぶ？',()=>newGame());}else newGame();});
  $('contBtn').addEventListener('click',()=>{initAudio();continueGame();});
  $('ngBtn').addEventListener('click',()=>{initAudio();nextSummer();});
  $('skipBtn').addEventListener('click',e=>{e.stopPropagation();initAudio();skipOpening();});
  $('pauseBtn').addEventListener('click',()=>{initAudio();openBook();});
  $('tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;bookTab=b.dataset.tab;renderBook();});
  $('bookBody').addEventListener('click',e=>{const b=e.target.closest('button[data-opt]');if(b){setOpt(b.dataset.opt);renderBook();return;}const a=e.target.closest('button[data-ach]');if(a){DEX.title=DEX.title===a.dataset.ach?null:a.dataset.ach;saveDex();hudKey='';renderBook();}});
  $('resume').addEventListener('click',closeBook);
  $('toTitle').addEventListener('click',()=>{writeSave();toTitle();});
  $('homeTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;homeTab=b.dataset.tab;homeSlot=null;UI.renderHome();});
  $('homeBody').addEventListener('click',e=>UI.homeAction(e));
  $('homeGo').addEventListener('click',()=>{$('sumikaCard').hidden=true;leaveSumika();hudKey='';});
  $('confirmYes').addEventListener('click',()=>{$('confirmCard').hidden=true;const f=UI.confirmYes;UI.confirmYes=null;if(f)f();});
  $('wzOk').addEventListener('click',()=>UI.wazaNext());
  $('confirmNo').addEventListener('click',()=>{$('confirmCard').hidden=true;UI.confirmYes=null;});
  $('clearGo').addEventListener('click',()=>{$('clearCard').hidden=true;enterArea(S.areaI+1);});
  $('clearStay').addEventListener('click',()=>{$('clearCard').hidden=true;S.state='play';music.play(AREA().bgm);});
  $('downGo').addEventListener('click',()=>{$('downCard').hidden=true;respawn();});
  $('pcEquip').addEventListener('click',()=>UI.closeCard('equip'));
  $('pcMerge').addEventListener('click',()=>UI.closeCard('merge'));
  $('pcSwapMerge').addEventListener('click',()=>UI.closeCard('swapmerge'));
  $('pcCmp').addEventListener('click',e=>{const b=e.target.closest('button[data-mg]');if(b)UI.closeCard(b.dataset.mg);});
  $('pcStore').addEventListener('click',()=>UI.closeCard('store'));
  $('pcEat').addEventListener('click',()=>UI.closeCard('eat'));
  $('pcLeave').addEventListener('click',()=>UI.closeCard('leave'));
  $('talk').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;e.preventDefault();UI.nextTalk();});
  $('talkChoices').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!UI.askCb)return;const f=UI.askCb;UI.askCb=null;f(+b.dataset.i);});
  $('cine').addEventListener('pointerdown',e=>{e.preventDefault();advanceEnding();});
  cv.addEventListener('pointerdown',e=>{if(S.cutin){S.cutin.t=Math.max(S.cutin.t,1.3);return;}if(S.state==='ending'){advanceEnding();return;}if(!$('talk').hidden&&!UI.choices){UI.nextTalk();}});
  $('endNext').addEventListener('click',()=>{initAudio();nextSummer();});
  $('endGo').addEventListener('click',toTitle);
  cv.addEventListener('pointerdown',e=>{
    initAudio();
    if(S.state!=='play'||S.talk)return;
    if(e.clientX<W*0.62&&stick.id===null){stick.id=e.pointerId;stick.ox=e.clientX;stick.oy=e.clientY;inp.x=0;inp.y=0;try{cv.setPointerCapture(e.pointerId);}catch(_){}$('stickHint').hidden=true;}
  });
  cv.addEventListener('pointermove',e=>{if(e.pointerId!==stick.id)return;let dx=e.clientX-stick.ox,dy=e.clientY-stick.oy;const d=Math.hypot(dx,dy);if(d>44){stick.ox+=dx/d*(d-44);stick.oy+=dy/d*(d-44);dx=e.clientX-stick.ox;dy=e.clientY-stick.oy;}inp.x=dx/44;inp.y=dy/44;});
  const end=e=>{if(e.pointerId===stick.id){stick.id=null;inp.x=0;inp.y=0;}};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  window.addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();
    initAudio();
    if(!key[e.code]&&(e.code==='KeyZ'||e.code==='Space'||e.code==='Enter')){
      if(S.state==='ending')advanceEnding();
      else if(!$('talk').hidden&&!UI.choices)UI.nextTalk();
      else if(e.code!=='Enter')inp.bite=true;}
    if(e.code==='KeyC')inp.combo=true;
    if(e.code==='Escape'){if(S.state==='play')openBook();else if(S.state==='pause')closeBook();}
    key[e.code]=true;
  });
  window.addEventListener('keyup',e=>{key[e.code]=false;});
  window.addEventListener('blur',()=>{for(const k in key)key[k]=false;rollBtn=false;inp.biteHold=false;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(S.state==='play'&&!S.talk)openBook();writeSave();}});
  document.addEventListener('gesturestart',e=>e.preventDefault());
  document.addEventListener('pointerdown',()=>initAudio(),{once:true});
  toTitle();
  let last=performance.now(),acc=0;
  (function frame(now){
    const rdt=Math.min(0.1,(now-last)/1000);last=now;if(S.slowmo>0){S.slowmo-=rdt;acc+=rdt*0.3;}else acc+=rdt;
    const kx=(key.ArrowRight||key.KeyD?1:0)-(key.ArrowLeft||key.KeyA?1:0),ky=(key.ArrowDown||key.KeyS?1:0)-(key.ArrowUp||key.KeyW?1:0);
    if(kx||ky){const l=Math.hypot(kx,ky);inp.x=kx/l;inp.y=ky/l;}else if(stick.id===null){inp.x=0;inp.y=0;}
    inp.roll=rollBtn||!!(key.KeyX||key.ShiftLeft||key.ShiftRight);
    let n=0;while(acc>=DT&&n<4){if(S.state==='title')titleStep();else step();acc-=DT;n++;}if(n===4)acc=0;
    render();UI.hud();requestAnimationFrame(frame);})(last);
}
/* the title screen drifts over the first area */
function titleStep(){
  S.t+=DT;ART_T=S.t;
  S.cam.x=MAP.w/2+Math.sin(S.t*0.07)*700;S.cam.y=MAP.h/2+Math.cos(S.t*0.05)*800;P.x=-9999;P.y=-9999;
  for(const e of E){if(e.T.boss||e.T.keeper||e.T.ai==='sumo')continue;e.t-=DT;if(e.t<=0){e.t=rnd(1.2,3);const a=rnd(0,TAU);e.tx=e.home.x+Math.cos(a)*100;e.ty=e.home.y+Math.sin(a)*100;}
    const dx=e.tx-e.x,dy=e.ty-e.y,d=Math.hypot(dx,dy);if(d>6){e.x+=dx/d*30*DT;e.y+=dy/d*30*DT;e.ang+=angDiff(e.ang,Math.atan2(dy,dx))*0.1;e.walk+=DT*4;}e.flap+=DT*30;if(e.T.ai==='flyer')e.z=14;}
}
if(HAS_DOM)window.addEventListener('DOMContentLoaded',boot);
