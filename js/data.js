'use strict';
/* =====================================================================
   ひと夏の番長 — data
   ===================================================================== */
const DT=1/60,TAU=Math.PI*2,DAY=150;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const angDiff=(a,b)=>{let d=b-a;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d;};
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const hash=k=>((Math.sin(k*127.1+311.7)*43758.5453)%1+1)%1;
function seeded(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
const HAS_DOM=typeof document!=='undefined';

/* ---------------- traits (random bonuses on dropped parts) ---------------- */
const TRAITS={
  sharp:{name:'するどい',desc:'一撃が 15% 強い'},
  quick:{name:'かるい',desc:'足が 10% 速い'},
  hard:{name:'かたい',desc:'うけるダメージ 10% へる'},
  vamp:{name:'吸い取り',desc:'かんだ ダメージの 12% 回復'},
  crit:{name:'会心',desc:'15% で 2倍ダメージ'},
  venom:{name:'毒まとい',desc:'かみつきに 毒が のる'},
  thorns:{name:'トゲトゲ',desc:'かまれると 25% やり返す'},
  guts:{name:'根性',desc:'エリアごとに 1回 たおれずに ふんばる'},
  glutton:{name:'大食い',desc:'食べものの 回復と 経験が ふえる'},
  rapid:{name:'はやがみ',desc:'かむ間かくが 15% みじかい'},
  ram:{name:'体当たり',desc:'突進の ダメージ 1.5倍'},
  boss:{name:'番長気質',desc:'格下の虫が おそれて 近よらない'}
};
const TRAIT_KEYS=Object.keys(TRAITS);
const RARITY=[{name:'',col:'#2a2118',glow:'rgba(255,240,190,'},{name:'めずらしい',col:'#2f6fb0',glow:'rgba(120,180,255,'},{name:'伝説の',col:'#b8860b',glow:'rgba(255,205,60,'}];

/* ---------------- parts ---------------- */
const PARTS={
  head:{
    mouth:{name:'ちいさな口',dmg:6,cd:0.34,range:14,arc:0.9,desc:'さいしょから ついている口。'},
    ago:{name:'アリのアゴ',dmg:9,cd:0.28,range:18,arc:1.0,desc:'軽くて すばやく かめる。一撃は 小さめ。'},
    oago:{name:'オサの大アゴ',dmg:24,cd:0.5,range:28,arc:1.4,desc:'重い一撃。そのかわり かむのが おそい。'},
    kiba:{name:'クモの毒キバ',dmg:11,cd:0.36,range:18,arc:1.0,poison:5,desc:'かんだ相手に 毒が回る。'},
    okama:{name:'カマキリの大カマ',dmg:17,cd:0.44,range:46,arc:2.3,desc:'とおくまで ひろく 切る。一撃は やや軽い。'},
    mizukama:{name:'ミズカマキリの腕',dmg:14,cd:0.42,range:62,arc:0.6,grab:true,desc:'細長い腕で、遠くの相手を 引きよせる。'},
    zari:{name:'ザリガニの大バサミ',dmg:22,cd:0.46,range:26,arc:1.2,guard:0.55,desc:'正面からの こうげきを ハサミで うける。'},
    kamikiri:{name:'カミキリのアゴ',dmg:26,cd:0.38,range:22,arc:1.0,desc:'まっすぐ前を するどく かみ切る。範囲は せまい。'},
    hirata:{name:'ヒラタの平バサミ',dmg:34,cd:0.52,range:26,arc:1.1,kb:1.6,desc:'ぶあつい ハサミで ねじふせる。'},
    kuwa:{name:'クワガタの大バサミ',dmg:46,cd:0.62,range:32,arc:1.3,kb:2.2,desc:'はさんで 投げとばす 大技。かむのは おそい。'},
    tsuno:{name:'カブトの角',dmg:54,cd:0.6,range:30,arc:1.5,kb:2.8,desc:'若頭の 角。すくいあげて ふきとばす。'},
    kongou:{name:'金剛のアゴ',dmg:20,cd:0.22,range:22,arc:1.15,nushi:true,desc:'アリの ぬしの アゴ。軽いのに 重い。とても はやく かめる。'},
    onizuno:{name:'鬼角のアゴ',dmg:44,cd:0.42,range:32,arc:1.6,kb:2.4,nushi:true,desc:'コクワの ぬしの アゴ。ひろく 重く、はやい。'}
  },
  legs:{
    std:{name:'ふつうの脚',speed:150,dash:470,desc:''},
    kama:{name:'カマドウマの脚',speed:178,dash:660,desc:'突進が よく のびる。'},
    batta:{name:'バッタの脚',speed:200,dash:820,desc:'速く、突進も 遠くまで とどく。'},
    geji:{name:'ゲジの脚',speed:245,dash:360,desc:'いちばん すばやい。突進は みじかい。'},
    amenbo:{name:'アメンボの脚',speed:190,dash:600,water:true,desc:'水の上を すいすい 歩ける。'},
    mukade:{name:'ムカデの脚',speed:225,dash:520,desc:'速くて、突進で ふれた相手に 毒。',dashPoison:6},
    kazekiri:{name:'風切りの脚',speed:235,dash:960,nushi:true,desc:'トノサマの ぬしの脚。風より 速く、どこまでも 跳ぶ。'}
  },
  tail:{
    none:{name:'なし',desc:''},
    hasami:{name:'ハサミムシのハサミ',counter:12,desc:'うしろから かまれると はさみ返す。'},
    hari:{name:'ハチの毒バリ',counter:14,poison:4,desc:'刺し返しに 毒。かみつきにも 毒が のる。'},
    mitsu:{name:'女王の蜜バリ',counter:10,heal:0.08,desc:'かむたびに 蜜で 少し 回復する。'},
    gomimushi:{name:'ゴミムシのガス袋',gas:true,desc:'突進の おわりに ガスを ぷしゅっと ふく。'},
    ohari:{name:'スズメバチの大毒バリ',counter:28,poison:7,desc:'刺し返しも 毒も ずっと つよい。'},
    ougon:{name:'黄金の蜜バリ',counter:22,poison:4,heal:0.12,nushi:true,desc:'ミツバチの ぬしの ハリ。刺し返し・毒・回復が ぜんぶ つく。'}
  },
  back:{
    none:{name:'なし',desc:''},
    koura:{name:'テントウの甲羅',def:0.75,desc:'うける ダメージが へる。'},
    kusai:{name:'カメムシのにおい袋',def:0.95,stink:true,desc:'かまれると においで まわりの虫を にげださせる。'},
    kara:{name:'ザリガニのから',def:0.6,spd:0.88,desc:'とても かたい。少し 重い。'},
    ageha:{name:'アゲハの羽',def:1.05,dashMul:1.45,glide:true,desc:'突進で 水の上も ふわりと わたれる。'},
    kumahane:{name:'クマバチの羽',def:0.85,spd:0.95,slam:1.8,desc:'突進の 体当たりが とても 重い。'},
    hane:{name:'セミの羽',def:1.15,dashMul:1.35,dashInv:true,desc:'突進が のび、突進中は 無敵。体は やわらかくなる。'},
    mino:{name:'ミノムシのみの',def:0.58,spd:0.82,desc:'とても かたい。足が おそくなる。'},
    kanabun:{name:'カナブンの金の甲羅',def:0.55,spd:0.92,desc:'ぴかぴかの 甲羅。とても かたい。'},
    murasaki:{name:'オオムラサキの羽',def:0.9,dashMul:1.25,regen:1.5,desc:'少しずつ 体力が もどる。突進も のびる。'},
    kougyoku:{name:'紅玉のから',def:0.5,spd:0.96,reflect:0.35,nushi:true,desc:'ザリの ぬしの から。とても かたく、うけた力を 少し はね返す。'},
    raiden:{name:'雷の羽',def:1.0,dashMul:1.5,dashInv:true,slam:1.5,nushi:true,desc:'アシナガの ぬしの 羽。突進は 稲妻のように 速く 重い。'},
    gekka:{name:'月下の羽',def:0.82,dashMul:1.3,glide:true,regen:2.5,nushi:true,desc:'ヤママユの ぬしの 羽。月の光で 体力が どんどん もどる。'}
  }
};
const SLOTS=['head','legs','tail','back'];
const SLOTNAME={head:'頭',legs:'脚',tail:'尾',back:'背'};
const DEFAULT_ID={head:'mouth',legs:'std',tail:'none',back:'none'};
const isDefault=(slot,id)=>DEFAULT_ID[slot]===id;

const COMBOS=[
  {id:'moudoku',name:'猛毒',need:[['head',['kiba']],['tail',['hari','ohari','ougon']]],desc:'毒が 2倍の はやさで 回り、毒で たおれた虫から まわりへ うつる。',hint:'毒の キバ ＋ 毒の ハリ'},
  {id:'ootobi',name:'大跳び突進',need:[['legs',['batta','kazekiri']],['back',['hane','ageha','raiden','gekka']]],desc:'突進で 敵を とびこえ、着地で まわりを ふきとばす。',hint:'よく跳ぶ脚 ＋ うすい羽'},
  {id:'iai',name:'居合',need:[['head',['okama']],['legs',['kama']]],desc:'突進の おわりに 大カマで ぐるりと ひと切り。',hint:'カマ ＋ カマ'},
  {id:'teppeki',name:'鉄壁ばさみ',need:[['back',['koura','kanabun','mino','kara','kougyoku']],['tail',['hasami']]],desc:'まるまっている間、ふれた敵を はさみつづける。',hint:'かたい背中 ＋ うしろの ハサミ'},
  {id:'renkami',name:'連続かみ',need:[['legs',['geji','mukade']],['head',['ago','oago','kamikiri','kongou']]],desc:'かむ はやさが 2倍になる。',hint:'たくさんの脚 ＋ アゴ'},
  {id:'akushu',name:'悪臭バリア',need:[['back',['kusai']],['tail',['hasami','hari','ohari','gomimushi']]],desc:'まるまると においを まき、まわりの敵が にげだす。',hint:'くさい背中 ＋ うしろの武器'},
  {id:'fukaku',name:'番長の風格',need:[['head',['kuwa','hirata','tsuno','onizuno']],['back',['kanabun','kougyoku']]],desc:'かむ力が 2割 上がり、格下の虫は 近よらない。',hint:'大きな ハサミ ＋ 金の背中'},
  {id:'suimen',name:'水面走り',need:[['legs',['amenbo']],['back',['ageha','hane','raiden','gekka']]],desc:'突進が 水しぶきの 波になり、通った所の 敵を はねとばす。',hint:'水を歩く脚 ＋ かるい羽'},
  {id:'koukaku',name:'甲殻のよしみ',need:[['head',['zari']],['back',['kara','kougyoku']]],desc:'まるまり中に うけた こうげきを ハサミで はじき返す。',hint:'同じ 甲殻類の ハサミ ＋ から'},
  {id:'hananomitsu',name:'花の蜜',need:[['tail',['mitsu','ougon']],['back',['ageha','murasaki','gekka']]],desc:'体力が どんどん もどる。',hint:'蜜の ハリ ＋ 花の羽'},
  {id:'mukadejigoku',name:'百足地獄',need:[['legs',['mukade']],['head',['kiba']]],desc:'歩いた あとに 毒の すじが のこる。',hint:'たくさんの脚 ＋ 毒の キバ'},
  {id:'gouriki',name:'剛力',need:[['head',['hirata','kuwa','tsuno','onizuno']],['back',['kumahane','raiden']]],desc:'突進の ダメージが 2倍、相手を 大きく ふきとばす。',hint:'大きな ハサミ ＋ 重い羽'}
];
/* how each わざ is used: btn = roll / bite / auto */
const COMBO_HOW={
  moudoku:{btn:'bite',tag:'毒×2',how:'かむと 毒が 2倍の はやさで 回る。毒で たおした虫の まわりにも 毒が うつる。'},
  ootobi:{btn:'roll',tag:'大跳び',how:'まるまる を はなして 突進すると 敵を とびこえ、着地で まわりを ふきとばす。'},
  iai:{btn:'roll',tag:'居合',how:'まるまる を はなして 突進した おわりに、前を ぐるりと 切りつける。'},
  teppeki:{btn:'roll',tag:'鉄壁',how:'まるまる を おしている間、ふれた敵を はさみつづける。かこまれた時に。'},
  renkami:{btn:'bite',tag:'連続',how:'かむ の 間かくが 半分に なる。れんだで どんどん かめる。'},
  akushu:{btn:'roll',tag:'悪臭',how:'まるまる を おした しゅんかん においを まき、まわりの敵が にげだす。'},
  fukaku:{btn:'auto',tag:'風格',how:'いつでも かむ力が 2割アップ。自分より 弱い虫は 近よってこない。'},
  suimen:{btn:'roll',tag:'水面',how:'突進した あとに 波が のこり、ふれた敵を はねとばす。'},
  koukaku:{btn:'roll',tag:'はじき',how:'まるまる を おしている間に うけた こうげきを はじき返して ダメージ。'},
  hananomitsu:{btn:'auto',tag:'蜜',how:'なにも しなくても 体力が すこしずつ もどる。'},
  mukadejigoku:{btn:'auto',tag:'毒すじ',how:'歩いた あとに 毒の すじが のこる。敵を ひきつれて 歩こう。'},
  gouriki:{btn:'roll',tag:'剛力',how:'突進の ダメージが 2倍、ぶつかった敵を 大きく ふきとばす。'}
};
const BTN_NAME={roll:'まるまる',bite:'かむ',auto:'じどう'};
function activeCombos(ids){return COMBOS.filter(c=>c.need.every(([s,list])=>list.includes(ids[s])));}

/* ---------------- bugs ----------------
   stats are at level 1; level scaling: hp*(1+0.3*(lv-1)), dmg*(1+0.16*(lv-1)) */
const TYPES={
  // 地べた
  ari:{name:'アリの三下',hp:16,dmg:4,r:9,speed:94,xp:3,aggro:150,body:'ant',head:'ago',ai:'melee',col:'#a2412b',dark:'#6e2617',drop:['head','ago',0.16],dex:'林の 下っぱ。数で せめてくる。'},
  hasami:{name:'ハサミのチビ',hp:40,dmg:7,r:13,speed:86,xp:7,aggro:170,body:'earwig',tail:'hasami',ai:'melee',col:'#8a4a26',dark:'#5a2c14',drop:['tail','hasami',0.25],dex:'しっぽの ハサミで うしろを 守る。'},
  kamadouma:{name:'跳ねカマ',hp:38,dmg:7,r:13,speed:72,xp:7,aggro:210,body:'cricket',legs:'kama',ai:'hopper',col:'#c79e62',dark:'#8f6a35',drop:['legs','kama',0.3],dex:'ぴょんと 跳ねて 間合いを つめる。'},
  waraji:{name:'ワラジの ゴロ',hp:44,dmg:7,r:12,speed:70,xp:8,aggro:220,body:'louse',ai:'roller',col:'#8f8576',dark:'#4f473e',dex:'遠い親せき。まるまって 転がってくる。'},
  mimizu:{name:'ミミズの ご隠居',hp:70,dmg:0,r:13,speed:40,xp:18,aggro:0,body:'worm',ai:'burrow',col:'#d38f86',dark:'#8a4a48',dex:'土の中から ときどき 顔を出す。たおすと 栄養たっぷり。'},
  hasamioya:{name:'ハサミの親分 テツ',hp:170,dmg:9,r:18,speed:92,xp:24,aggro:260,body:'earwig',tail:'hasami',ai:'melee',col:'#7a3a1a',dark:'#4a200c',lvOff:1,keeper:true,charge:true,drop:['tail','hasami',1],
    meet:'この先へ 行きてえなら、おれの ハサミを くぐってみな。',down:'ちっ……通りな。番長は 根っこの奥だ。',dex:'地べたの 親分。突進と ハサミが 自慢。'},
  geji:{name:'ゲジ松',hp:180,dmg:10,r:17,speed:165,xp:28,aggro:280,body:'centipede',ai:'melee',col:'#a08c64',dark:'#4a3a24',lvOff:1,keeper:true,drop:['legs','geji',1],
    meet:'シャカシャカシャカ……おれの 足に ついてこれるか？',down:'はぁ、はぁ……足、もってきな。',dex:'たくさんの脚で 走りまわる。とにかく 速い。'},
  osa:{name:'地べたの番長 オサ',hp:420,dmg:13,r:25,speed:115,xp:50,aggro:320,body:'beetle',head:'oago',ai:'melee',col:'#4a6e5e',dark:'#26413a',lvOff:2,boss:true,charge:true,drop:['head','oago',1],dex:'地べたを しめる 番長。大アゴの 突進が こわい。'},
  // 草むら
  batta:{name:'トノサマの若いの',hp:46,dmg:7,r:14,speed:80,xp:9,aggro:220,body:'cricket',legs:'batta',ai:'hopper',col:'#86b043',dark:'#4f7323',drop:['legs','batta',0.25],dex:'ひとっ跳びで 間合いを つめてくる。'},
  tento:{name:'ナナホシ',hp:72,dmg:6,r:13,speed:55,xp:10,aggro:160,body:'dome',spots:true,ai:'melee',tank:true,col:'#d63a2a',dark:'#7a1d14',drop:['back','koura',0.25],dex:'まるい 甲羅で こうげきを はじく。'},
  kumo:{name:'ジョロウの子',hp:50,dmg:8,r:13,speed:95,xp:12,aggro:260,body:'spider',ai:'ranged',shot:'web',col:'#e1b93a',dark:'#2f2a24',drop:['head','kiba',0.2],dex:'糸を 飛ばして 動きを とめる。'},
  kamakiriko:{name:'カマキリの子分',hp:62,dmg:10,r:14,speed:85,xp:12,aggro:200,body:'mantis',ai:'slasher',col:'#9ec25a',dark:'#5e7f2c',drop:['head','okama',0.06],dex:'カマを ふりかぶったら 下がれ。'},
  kamemushi:{name:'カメムシの クサ吉',hp:280,dmg:9,r:17,speed:72,xp:34,aggro:240,body:'shield',ai:'melee',tank:true,stinky:true,col:'#6b7f3a',dark:'#3a4a1a',lvOff:1,keeper:true,drop:['back','kusai',1],
    meet:'くさいって 言うな！ これは おれの 誇りだ！',down:'う、うう……におい袋、くれてやる……',dex:'かむと くさい においを まきちらす。'},
  jorou:{name:'ジョロウの姐御',hp:260,dmg:11,r:20,speed:100,xp:36,aggro:300,body:'spider',ai:'ranged',shot:'web',multi:3,col:'#e9c040',dark:'#2f2a24',lvOff:1,keeper:true,drop:['head','kiba',1],
    meet:'あたしの 巣を とおるなら、通行料を いただくよ。',down:'ふん……キバが ほしけりゃ 持っていきな。',dex:'草むらの 巣の あるじ。糸の 雨を ふらせる。'},
  kamazo:{name:'草むらの番長 カマ蔵',hp:640,dmg:16,r:28,speed:108,xp:70,aggro:330,body:'mantis',ai:'slasher',col:'#7ea845',dark:'#45661e',lvOff:2,boss:true,leap:true,drop:['head','okama',1],dex:'草むらの 番長。二度切りと 飛びかかり。'},
  // 小川
  amenbo:{name:'アメンボの すべり屋',hp:44,dmg:7,r:13,speed:170,xp:10,aggro:240,body:'strider',ai:'water',col:'#5a4c3e',dark:'#2a2018',drop:['legs','amenbo',0.18],dex:'水の上を すべるように 走る。'},
  mizukamakiri:{name:'ミズカマの 釣り師',hp:60,dmg:9,r:14,speed:70,xp:12,aggro:240,body:'watermantis',ai:'grabber',col:'#8a7650',dark:'#4a3a20',drop:['head','mizukama',0.16],dex:'長い腕で 引きよせてくる。'},
  ebigani:{name:'エビガニの 小僧',hp:84,dmg:9,r:14,speed:70,xp:12,aggro:190,body:'crayfish',ai:'melee',tank:true,col:'#c0503a',dark:'#6a2418',drop:['back','kara',0.14],dex:'小さくても ハサミは 本物。'},
  amekichi:{name:'アメンボの アメ吉',hp:280,dmg:10,r:18,speed:210,xp:38,aggro:320,body:'strider',ai:'water',col:'#4a3e30',dark:'#1e160e',lvOff:1,keeper:true,drop:['legs','amenbo',1],
    meet:'水の上じゃ、おれに 追いつける やつは いねえ。',down:'す、すべった……脚、つかいな。',dex:'小川の 早足。水の上から 体当たりしてくる。'},
  kamaroku:{name:'ミズカマキリの カマ六',hp:320,dmg:12,r:19,speed:80,xp:40,aggro:300,body:'watermantis',ai:'grabber',col:'#7a6640',dark:'#3a2e18',lvOff:1,keeper:true,drop:['head','mizukama',1],
    meet:'釣りは 待つのが コツでね。……かかったな。',down:'ふふ、今日は ボウズか。腕、くれてやるよ。',dex:'細長い 腕の 釣り名人。'},
  zari:{name:'小川の番長 赤鬼のザリ',hp:860,dmg:17,r:30,speed:100,xp:90,aggro:330,body:'crayfish',ai:'melee',guard:true,charge:true,spin:true,col:'#c8402a',dark:'#5a1a10',lvOff:2,boss:true,drop:['head','zari',1],dex:'同じ 甲殻類の 大先輩。正面は ハサミで かたい。'},
  // 花畑
  mitsubachi:{name:'ミツバチの はたらき手',hp:26,dmg:6,r:10,speed:160,xp:6,aggro:240,body:'bee',fuzzy:true,ai:'flyer',col:'#e8b83a',dark:'#3a2a10',drop:['tail','hari',0.1],dex:'花畑を 守る はたらき者。'},
  monshiro:{name:'モンシロの 娘',hp:32,dmg:0,r:13,speed:110,xp:14,aggro:180,body:'butterfly',wing:'#f6f2e6',wing2:'#2a2118',ai:'passive',fly:true,col:'#f6f2e6',dark:'#2a2118',drop:['back','ageha',0.04],dex:'ひらひら 逃げる。たまに めずらしい 羽を 落とす。'},
  hanamuguri:{name:'ハナムグリの 花好き',hp:76,dmg:7,r:13,speed:62,xp:11,aggro:170,body:'dome',metal:true,ai:'melee',tank:true,col:'#7a8a3a',dark:'#3a4a1a',drop:['back','koura',0.14],dex:'花に もぐる。甲羅が かたい。'},
  abu:{name:'アブの 乱暴者',hp:40,dmg:8,r:12,speed:190,xp:10,aggro:280,body:'fly',ai:'flyer',col:'#b88a3a',dark:'#3a2a10',dex:'ぶんぶん 速い。目が 大きい。'},
  kumabachi:{name:'クマバチの ゴン',hp:340,dmg:12,r:20,speed:130,xp:44,aggro:320,body:'bee',fuzzy:true,big:true,ai:'flyer',col:'#2a2420',dark:'#e8c84a',lvOff:1,keeper:true,drop:['back','kumahane',1],
    meet:'ブゥゥン……ここは 通さねえ。',down:'ブ……ブゥ……羽、もってけ……',dex:'まるっこくて 重い。体当たりが すごい。'},
  ageha:{name:'アゲハの 姫',hp:280,dmg:10,r:20,speed:140,xp:42,aggro:320,body:'butterfly',wing:'#f2d35a',wing2:'#2a2118',swallow:true,ai:'flyer',dust:true,col:'#f2d35a',dark:'#2a2118',lvOff:1,keeper:true,drop:['back','ageha',1],
    meet:'あら、地べたの 子が 花畑に 何の用？',down:'……羽が よごれちゃった。あげるわ。',dex:'りんぷんを まいて 目を くらませる。'},
  joou:{name:'花畑の番長 ミツバチの女王',hp:920,dmg:15,r:28,speed:110,xp:110,aggro:340,body:'bee',fuzzy:true,big:true,crown:true,ai:'ranged',shot:'honey',multi:3,summon:'mitsubachi',col:'#e8a82a',dark:'#3a2410',lvOff:2,boss:true,drop:['tail','mitsu',1],dex:'花畑の 女王。はたらき手を よび、蜜の 弾を はく。'},
  // 朽ち木
  kokuwa:{name:'コクワの 若い衆',hp:70,dmg:10,r:14,speed:86,xp:13,aggro:200,body:'beetle',head:'kokuwa',ai:'melee',col:'#3a2a1e',dark:'#1a120a',drop:['head','hirata',0.05],dex:'小さくても クワガタの はしくれ。'},
  gomimushi:{name:'ゴミムシの へっぴり',hp:56,dmg:8,r:13,speed:100,xp:12,aggro:200,body:'beetle',ai:'gas',col:'#2a2a2a',dark:'#d07a2a',drop:['tail','gomimushi',0.22],dex:'近づくと おしりから ガスを ふく。'},
  mukade:{name:'ムカデの 鉄砲',hp:88,dmg:11,r:15,speed:140,xp:15,aggro:240,body:'centipede',ai:'melee',venom:3,col:'#3a2a2a',dark:'#c84a2a',drop:['legs','mukade',0.14],dex:'速くて 毒もち。かまれると いたい。'},
  youchuu:{name:'カブトの 幼虫',hp:110,dmg:0,r:16,speed:22,xp:26,aggro:0,body:'larva',ai:'passive',col:'#efe6cf',dark:'#b8763a',dex:'朽ち木の 中で ねむっている。来年の 夏の 主役。'},
  oomukade:{name:'オオムカデの 百',hp:400,dmg:14,r:20,speed:170,xp:50,aggro:320,body:'centipede',ai:'melee',venom:5,charge:true,col:'#2a1a1a',dark:'#d85a2a',lvOff:1,keeper:true,drop:['legs','mukade',1],
    meet:'百の脚で 百回 かんでやる。',down:'九十九……九十八……もう、数えられん……',dex:'朽ち木の 主。速くて 毒が 強い。'},
  hirata:{name:'ヒラタの 兄弟',hp:420,dmg:15,r:20,speed:92,xp:52,aggro:300,body:'beetle',head:'hirata',ai:'melee',toss:true,col:'#2a1e16',dark:'#120a06',lvOff:1,keeper:true,drop:['head','hirata',1],
    meet:'兄貴の 前に、おれたち 兄弟が 相手だ。',down:'ぐう……兄貴、すまねえ……',dex:'平たい ハサミで ねじふせる。'},
  kuwagata:{name:'朽ち木の番長 クワガタの兄貴',hp:1020,dmg:19,r:27,speed:112,xp:130,aggro:330,body:'beetle',head:'kuwa',ai:'melee',toss:true,charge:true,col:'#3a2418',dark:'#1a0f08',lvOff:2,boss:true,drop:['head','kuwa',1],dex:'若頭の 右腕。はさんで 投げとばす。'},
  // 木の幹
  kuroari:{name:'クロオオアリの衆',hp:60,dmg:9,r:12,speed:112,xp:10,aggro:190,body:'ant',head:'ago',ai:'melee',col:'#2c2622',dark:'#0f0c0a',drop:['head','ago',0.12],dex:'幹を のぼり おりする 大きな アリ。'},
  semi:{name:'アブラゼミ',hp:70,dmg:0,r:16,speed:105,xp:18,aggro:200,body:'cicada',ai:'passive',col:'#6a5a3e',dark:'#3a2f1f',drop:['back','hane',0.32],dex:'七日の いのちを 鳴きつくす。'},
  hachi:{name:'アシナガの 鉄砲玉',hp:60,dmg:11,r:12,speed:150,xp:14,aggro:260,body:'wasp',tail:'hari',ai:'flyer',col:'#e3a92b',dark:'#5a3a10',drop:['tail','hari',0.22],dex:'空から まっすぐ 刺しにくる。'},
  kamikiri:{name:'ゴマダラの 若旦那',hp:110,dmg:12,r:15,speed:70,xp:16,aggro:180,body:'longhorn',head:'kamikiri',ai:'melee',col:'#2f2f3a',dark:'#15151c',drop:['head','kamikiri',0.22],dex:'まだら模様の 若旦那。アゴが するどい。'},
  mino:{name:'ミノムシの ミノ吉',hp:540,dmg:12,r:19,speed:48,xp:56,aggro:220,body:'bagworm',ai:'melee',tank:true,col:'#8a7a5a',dark:'#4a3e28',lvOff:1,keeper:true,drop:['back','mino',1],
    meet:'……（みのの中から じっと こちらを 見ている）',down:'……みの、あげる。',dex:'みのに こもって 動かない。とても かたい。'},
  gomadara:{name:'ゴマダラの 大旦那',hp:560,dmg:15,r:21,speed:78,xp:60,aggro:260,body:'longhorn',head:'kamikiri',ai:'melee',charge:true,col:'#25252f',dark:'#101016',lvOff:1,keeper:true,drop:['head','kamikiri',1],
    meet:'ゴマダラ家の 門を、そうやすやすと 通すわけには いかん。',down:'見事。わしの アゴを 使うがよい。',dex:'幹の 門を 守る 古株。'},
  suzume:{name:'幹の番長 スズメバチの姐さん',hp:1100,dmg:20,r:24,speed:160,xp:150,aggro:340,body:'wasp',big:true,tail:'ohari',ai:'flyer',summon:'hachi',shot:'sting',col:'#e8902a',dark:'#3a2410',lvOff:2,boss:true,drop:['tail','ohari',1],dex:'幹の 番長。子分を よび、急降下で 刺す。'},
  // 樹液酒場
  kanabun:{name:'カナブンの 用心棒',hp:120,dmg:13,r:15,speed:82,xp:18,aggro:200,body:'dome',metal:true,ai:'melee',tank:true,col:'#3f8a5a',dark:'#1d4a2e',drop:['back','kanabun',0.2],dex:'ぴかぴかの 用心棒。かたくて 重い。'},
  ga:{name:'夜の ガ',hp:60,dmg:9,r:14,speed:130,xp:12,aggro:240,body:'moth',ai:'flyer',col:'#8a7a66',dark:'#3a3026',dex:'あかりに さそわれて 飛んでくる。'},
  kanagashira:{name:'カナブンの 用心棒頭',hp:680,dmg:16,r:21,speed:88,xp:70,aggro:280,body:'dome',metal:true,ai:'melee',tank:true,charge:true,col:'#2f7a4a',dark:'#164028',lvOff:1,keeper:true,drop:['back','kanabun',1],
    meet:'若頭の 前には、おれたちが いる。',down:'ぐ……ここまでか。甲羅は くれてやる。',dex:'樹液酒場の 入り口を 守る 頭。'},
  oomurasaki:{name:'オオムラサキの 夫人',hp:620,dmg:15,r:22,speed:150,xp:70,aggro:320,body:'butterfly',wing:'#6a4aa8',wing2:'#2a2118',ai:'flyer',dust:true,col:'#6a4aa8',dark:'#2a2118',lvOff:1,keeper:true,drop:['back','murasaki',1],
    meet:'あの子の 席に 近づく 虫は、わたくしが 相手よ。',down:'まあ……若頭も、そろそろ 年貢の おさめどきね。',dex:'国の蝶。樹液酒場の 常連。'},
  kabuto:{name:'林の若頭 カブト',hp:1300,dmg:20,r:34,speed:122,xp:0,aggro:380,body:'kabuto',ai:'melee',charge:true,toss:true,sweep:true,summon:'kanabun',col:'#5a3420',dark:'#2a160c',lvOff:3,boss:true,final:true,drop:['head','tsuno',1],dex:'番長の座に すわる、林の 若頭。'},
  // ぬし — one per area, very rarely seen
  nushi_jibeta:{name:'大アリの ぬし 金剛',base:'ari',hp:300,dmg:12,r:17,speed:128,xp:140,aggro:300,body:'ant',head:'ago',ai:'melee',charge:true,col:'#c8902a',dark:'#5a3410',lvOff:3,nushi:true,drop:['head','kongou',1],dex:'地べたの 奥に すむ 金色の 大アリ。めったに 姿を 見せない。'},
  nushi_kusamura:{name:'トノサマの ぬし 風切',base:'batta',hp:480,dmg:15,r:21,speed:120,xp:200,aggro:320,body:'cricket',legs:'batta',ai:'hopper',leap:true,col:'#5ea050',dark:'#2f5a20',lvOff:3,nushi:true,drop:['legs','kazekiri',1],dex:'草むらを 風のように 跳ぶ 大トノサマ。'},
  nushi_ogawa:{name:'ザリの ぬし 紅玉',base:'ebigani',hp:800,dmg:18,r:24,speed:90,xp:260,aggro:300,body:'crayfish',ai:'melee',guard:true,spin:true,tank:true,col:'#e0302a',dark:'#7a1010',lvOff:3,nushi:true,drop:['back','kougyoku',1],dex:'小川の 深みに ひそむ、宝石のような 赤い ザリ。'},
  nushi_hanabatake:{name:'ミツバチの ぬし 黄金',base:'mitsubachi',hp:700,dmg:15,r:19,speed:170,xp:300,aggro:340,body:'bee',fuzzy:true,crown:true,ai:'flyer',summon:'mitsubachi',col:'#f2c43a',dark:'#5a3a10',lvOff:3,nushi:true,drop:['tail','ougon',1],dex:'花畑の どこかで 黄金の 蜜を あつめる 古い ミツバチ。'},
  nushi_kuchiki:{name:'コクワの ぬし 鬼角',base:'kokuwa',hp:1300,dmg:22,r:24,speed:100,xp:380,aggro:320,body:'beetle',head:'kuwa',ai:'melee',toss:true,charge:true,col:'#4a1e14',dark:'#1a0806',lvOff:3,nushi:true,drop:['head','onizuno',1],dex:'朽ち木の 底で 何十年も 生きている という 鬼のような コクワ。'},
  nushi_miki:{name:'アシナガの ぬし 雷',base:'hachi',hp:1100,dmg:24,r:19,speed:200,xp:420,aggro:360,body:'wasp',tail:'hari',ai:'flyer',shot:'sting',col:'#f2d03a',dark:'#2a2410',lvOff:3,nushi:true,drop:['back','raiden',1],dex:'幹の 上を 稲妻のように 飛ぶ ハチ。羽音が 雷に 似ている。'},
  nushi_sakaba:{name:'ヤママユの ぬし 月影',base:'ga',hp:1500,dmg:24,r:26,speed:150,xp:500,aggro:340,body:'moth',wing:'#cfe8c0',ai:'flyer',dust:true,col:'#cfe8c0',dark:'#5a7a4a',lvOff:3,nushi:true,drop:['back','gekka',1],dex:'月夜にだけ あらわれる という 大きな 白い ガ。'},
  // rare
  sumou:{name:'相撲好きの コガネ',hp:9999,dmg:0,r:19,speed:120,xp:0,aggro:0,body:'dome',metal:true,ai:'sumo',col:'#c9a23a',dark:'#7a5f1a',dex:'土俵で 待つ 相撲好き。めったに 会えない。'}
};
const DEX_ORDER=['ari','hasami','kamadouma','waraji','mimizu','hasamioya','geji','osa','batta','tento','kumo','kamakiriko','kamemushi','jorou','kamazo','amenbo','mizukamakiri','ebigani','amekichi','kamaroku','zari',
  'mitsubachi','monshiro','hanamuguri','abu','kumabachi','ageha','joou','kokuwa','gomimushi','mukade','youchuu','oomukade','hirata','kuwagata','kuroari','semi','hachi','kamikiri','mino','gomadara','suzume','kanabun','ga','kanagashira','oomurasaki','kabuto','sumou','nushi_jibeta','nushi_kusamura','nushi_ogawa','nushi_hanabatake','nushi_kuchiki','nushi_miki','nushi_sakaba'];

/* ---------------- areas ----------------
   each map: open field, two keepers in their own arenas, the boss lair fenced with a sacred rope (opens after both keepers) */
const AREAS=[
  {id:'jibeta',name:'地べた',sub:'クヌギの 根もと',lv:1,w:2800,h:2600,bg:'soil',time:'noon',bgm:'jibeta',obst:'rock',dens:1,
    mobs:[['ari',6],['hasami',2],['kamadouma',2],['waraji',2],['mimizu',1]],mobN:30,keepers:['hasamioya','geji'],boss:'osa',layout:0,food:['leaf','acorn'],
    intro:[{who:'カブトの若頭',text:'おう、ダンゴムシ。林の番長の座はな、つよい虫だけの もんだ。'},{who:'カブトの若頭',text:'おめえみてえなのは、地べたで 丸まってな。'},{who:'ダンゴムシ',text:'（……夏が終わるまでに、あの座に すわってやる）'},{who:'ダンゴムシ',text:'（番長のシマは しめ縄で かこまれてる。まずは 門番を 2匹 たおそう）'}],
    bossMeet:[{who:'地べたの番長 オサ',text:'…見ねえ顔だな。ここは おれのシマだ。'},{who:'地べたの番長 オサ',text:'丸まって 帰るか、ここで エサになるか。えらびな。'}],
    bossDown:[{who:'地べたの番長 オサ',text:'…おめえ、ただの ダンゴムシじゃ ねえな。'},{who:'地べたの番長 オサ',text:'この大アゴ、もってけ。草むらには カマ蔵の野郎がいる。せいぜい 気ぃつけな。'}],
    clear:'地べたの番長オサを たおした。下っぱの虫たちは、もう きみの顔を見ると 道をあける。'},
  {id:'kusamura',name:'草むら',sub:'背の高い 夏草の森',lv:4,w:2900,h:2700,bg:'grass',time:'noon',bgm:'kusamura',obst:'grass',webs:true,dens:1,
    mobs:[['batta',3],['tento',2],['kumo',2],['kamakiriko',2],['ari',2]],mobN:32,keepers:['kamemushi','jorou'],boss:'kamazo',layout:1,food:['leaf','berry'],
    intro:[{who:'ダンゴムシ',text:'（草むらは 背が高い。見上げると、空が 細い）'},{who:'トノサマの若いの',text:'お、地べた上がりか。ここじゃ 足が 速くなきゃ 生きてけねえぞ。'},{who:'ダンゴムシ',text:'（白い クモの巣に 入ると 足を とられる。気をつけよう）'}],
    bossMeet:[{who:'草むらの番長 カマ蔵',text:'…ほう。オサを やったのは おめえか。'},{who:'草むらの番長 カマ蔵',text:'おれの カマは 二度 振らねえ。一度で 終わる。'}],
    bossDown:[{who:'草むらの番長 カマ蔵',text:'くっ……持ってけ。この カマで 先へ 行きな。'},{who:'草むらの番長 カマ蔵',text:'小川には 赤鬼が いる。おめえと 同じ、からの ある やつだ。'}],
    clear:'草むらの番長カマ蔵を たおした。夏草の あいだを 風が ぬけていく。せせらぎの 音が 聞こえる。'},
  {id:'ogawa',name:'小川のほとり',sub:'せせらぎと 飛び石',lv:7,w:3000,h:2800,bg:'sand',time:'noon',bgm:'kawa',obst:'pebble',river:true,frog:true,dens:0.8,
    mobs:[['amenbo',3],['mizukamakiri',2],['ebigani',2],['batta',1]],mobN:30,keepers:['amekichi','kamaroku'],boss:'zari',layout:2,food:['leaf','berry'],
    intro:[{who:'ダンゴムシ',text:'（水だ。ダンゴムシは 泳げない。飛び石と 葉っぱの 上を 渡ろう）'},{who:'エビガニの 小僧',text:'へっ、陸の からもちか。親分の 赤鬼さまに 会ったら、ちびるぜ。'},{who:'ダンゴムシ',text:'（水ぎわの 波紋に 注意。カエルが ひそんでいる）'}],
    bossMeet:[{who:'赤鬼のザリ',text:'ほう、からもちの 若いのか。おれも むかしは 小さかった。'},{who:'赤鬼のザリ',text:'このハサミを こえられたら、甲殻類の 誇りを わけてやろう。'}],
    bossDown:[{who:'赤鬼のザリ',text:'……いい からだ。いい 根性だ。'},{who:'赤鬼のザリ',text:'花畑の 女王は、数で 来る。ひとりで 戦うと 思うなよ。'}],
    clear:'小川の番長 赤鬼のザリを たおした。水面に 夏の 日ざしが きらきら はねる。'},
  {id:'hanabatake',name:'花畑',sub:'あまい においの 野原',lv:10,w:3000,h:2800,bg:'flower',time:'after',bgm:'hana',obst:'flower',dens:1,
    mobs:[['mitsubachi',4],['monshiro',2],['hanamuguri',2],['abu',2]],mobN:32,keepers:['kumabachi','ageha'],boss:'joou',layout:3,food:['berry','nectar'],
    intro:[{who:'ダンゴムシ',text:'（あまい においで 頭が くらくらする）'},{who:'モンシロの 娘',text:'あら、こんなところに ダンゴムシ。女王さまに 見つかったら たいへんよ。'},{who:'ダンゴムシ',text:'（ハチは 空から 来る。まるまって やりすごそう）'}],
    bossMeet:[{who:'ミツバチの女王',text:'まあ、地べたの 子。わらわの 花畑で 何を しているの。'},{who:'ミツバチの女王',text:'はたらき手たち、おもてなし してさしあげて。'}],
    bossDown:[{who:'ミツバチの女王',text:'……おどろいた。わらわの 子たちを ここまで。'},{who:'ミツバチの女王',text:'この 蜜バリを。朽ち木の 兄貴は、手ごわいわよ。'}],
    clear:'花畑の番長 ミツバチの女王を たおした。花びらが 風に のって 舞いあがる。'},
  {id:'kuchiki',name:'朽ち木',sub:'こけと きのこの 森',lv:13,w:3000,h:2800,bg:'rot',time:'shade',bgm:'kuchiki',obst:'stump',shrooms:true,dens:1,
    mobs:[['kokuwa',3],['gomimushi',2],['mukade',2],['youchuu',1]],mobN:32,keepers:['oomukade','hirata'],boss:'kuwagata',layout:0,food:['acorn','sap'],
    intro:[{who:'ダンゴムシ',text:'（しめった においが する。たおれた 木が 森に なっている）'},{who:'カブトの 幼虫',text:'……むにゃ……来年の 夏に なったら……ぼくも……'},{who:'ダンゴムシ',text:'（赤い きのこは 毒の 胞子を ふく。近よらないように しよう）'}],
    bossMeet:[{who:'クワガタの兄貴',text:'若頭に 会いてえなら、まず おれを 越えていけ。'},{who:'クワガタの兄貴',text:'手加減は しねえ。それが 礼儀ってもんだ。'}],
    bossDown:[{who:'クワガタの兄貴',text:'へっ……いい 突進だ。'},{who:'クワガタの兄貴',text:'幹の 姐さんを 越えたら、若頭は すぐそこだ。行ってこい。'}],
    clear:'朽ち木の番長 クワガタの兄貴を たおした。こもれびの 中、クヌギの 幹が そびえている。'},
  {id:'miki',name:'木の幹',sub:'夕日に そまる クヌギ',lv:16,w:2400,h:3400,bg:'bark',time:'evening',bgm:'miki',obst:'knot',bird:true,dens:1,
    mobs:[['kuroari',4],['semi',2],['hachi',2],['kamikiri',2]],mobN:32,keepers:['mino','gomadara'],boss:'suzume',layout:4,food:['sap','acorn'],
    intro:[{who:'ダンゴムシ',text:'（幹は まっすぐ 上へ のびている。風が 少し 涼しい）'},{who:'アブラゼミ',text:'ジジジ……夏は みじかいぞ。おれたちは 七日しか ないんだ。'},{who:'ダンゴムシ',text:'（空から 鳥の影が 来たら、まるまって やりすごそう）'}],
    bossMeet:[{who:'スズメバチの姐さん',text:'あら、ちいさいのが 来たわね。'},{who:'スズメバチの姐さん',text:'この幹は あたしの 庭。かわいい子たちに 刺されて おかえり。'}],
    bossDown:[{who:'スズメバチの姐さん',text:'ふふ……やるじゃない。'},{who:'スズメバチの姐さん',text:'あの カブトの坊やにも、そろそろ 誰かが 言ってやる時ね。'}],
    clear:'幹の番長 スズメバチの姐さんを たおした。見上げると 一番星。樹液の 甘い においが 夜風に のってくる。'},
  {id:'sakaba',name:'樹液酒場',sub:'夜の 番長の座',lv:19,w:2800,h:2800,bg:'sapbark',time:'night',bgm:'jueki',obst:'knot',saps:true,dark:true,dens:0.9,final:true,
    mobs:[['kanabun',3],['kuroari',2],['hachi',2],['ga',2]],mobN:28,keepers:['kanagashira','oomurasaki'],boss:'kabuto',layout:4,food:['sap','berry'],
    intro:[{who:'ダンゴムシ',text:'（夜だ。樹液の 金色の 光が、ぽつぽつと 灯っている）'},{who:'カナブンの 用心棒',text:'ここは 樹液酒場。番長の座は、いちばん奥の 大だまりだ。'},{who:'ダンゴムシ',text:'（金色の 樹液だまりに 入ると、元気が もどる）'}],
    bossMeet:[{who:'カブトの若頭',text:'…あの時の ダンゴムシか。'},{who:'カブトの若頭',text:'よく ここまで 来たな。いいだろう、夏の終わりの 一勝負だ。'}],
    bossMeetNG:[{who:'カブトの若頭',text:'約束どおり、取り返しに 来たぜ。'},{who:'カブトの若頭',text:'今年の おれは、去年とは ちがう。'}],
    bossDown:[],clear:''}
];
function xpNeed(lv){return Math.round(12*Math.pow(lv,1.72));}
const MAX_LV=100;

/* ---------------- follower skills ----------------
   learned at +3 levels after joining (keepers know it from the start), mastered (真) at +8 */
const ALLY_SKILLS={
  nage:{name:'投げとばし',desc:'あいてを はさんで 遠くへ 投げとばす 大技。',cd:6},
  ito:{name:'糸しばり',desc:'糸を はいて まわりの 敵の 動きを 止める。',cd:8},
  mitsu:{name:'蜜わけ',desc:'兄貴の 体力が へったら 蜜を わけて 回復する。',cd:14},
  nioi:{name:'においの壁',desc:'兄貴の まわりの 敵を においで 追いはらう。',cd:11},
  kama:{name:'かまいたち',desc:'前方の 敵を まとめて 切りさく。',cd:7},
  shippu:{name:'疾風',desc:'敵の 群れを 走りぬけて 切りきざむ。',cd:6},
  mawari:{name:'身代わり',desc:'敵の 注意を ひきつけ、かたくなって 兄貴を 守る。',cd:12},
  tobi:{name:'跳び蹴り',desc:'高く 跳んで、着地で まわりを ふきとばす。',cd:7},
  rinpun:{name:'りんぷん',desc:'敵の 上に 粉を まいて、動きを おそくし けずる。',cd:9}
};
function skillOf(type){
  const T=TYPES[type];
  if(['kumo','jorou'].includes(type))return 'ito';
  if(['mitsubachi','kumabachi','joou'].includes(type))return 'mitsu';
  if(T.stinky||type==='gomimushi')return 'nioi';
  if(T.body==='mantis'||T.body==='watermantis')return 'kama';
  if(T.body==='butterfly'||T.body==='moth'||T.dust)return 'rinpun';
  if(T.ai==='hopper'||T.leap)return 'tobi';
  if(T.tank||T.body==='bagworm'||T.body==='dome')return 'mawari';
  if(T.toss||T.body==='crayfish'||T.tail==='hasami'||T.head==='hirata'||T.head==='kuwa')return 'nage';
  if(T.speed>=140||T.body==='centipede'||T.ai==='water'||T.ai==='flyer')return 'shippu';
  return 'nage';
}
/* ---------------- titles (achievements) ---------------- */
const ACHS=[
  {id:'first',name:'はじめての一勝',desc:'虫を はじめて たおす'},
  {id:'k100',name:'百匹がり',desc:'虫を 合計 100ぴき たおす'},
  {id:'k500',name:'林の暴れん坊',desc:'虫を 合計 500ぴき たおす'},
  {id:'k1500',name:'千匹番長',desc:'虫を 合計 1500ぴき たおす'},
  {id:'keeper',name:'門をくぐる者',desc:'門番を はじめて たおす'},
  {id:'boss1',name:'地べた上がり',desc:'地べたの番長 オサに 勝つ'},
  {id:'boss4',name:'花より番長',desc:'4つの 場所を しめる'},
  {id:'ending',name:'ひと夏の番長',desc:'番長の座に すわる'},
  {id:'ng',name:'二度目の夏',desc:'2年目の 夏を はじめる'},
  {id:'ng2',name:'返り咲き',desc:'2年目の夏も 番長の座に すわる'},
  {id:'fast',name:'はやての番長',desc:'8月12日までに 番長の座に すわる'},
  {id:'nodeath',name:'無傷の夏',desc:'一度も やられずに 番長の座に すわる'},
  {id:'crit',name:'会心の一撃',desc:'会心の一撃を 合計 100回 出す'},
  {id:'heavy',name:'重い一撃',desc:'一撃で 300 以上の ダメージ'},
  {id:'combo1',name:'わざ師',desc:'わざを 1つ 見つける'},
  {id:'combo6',name:'わざの達人',desc:'わざを 6つ 見つける'},
  {id:'comboAll',name:'わざの極み',desc:'わざを ぜんぶ 見つける'},
  {id:'legend',name:'伝説の目利き',desc:'伝説の 部位を 手に入れる'},
  {id:'lucky',name:'レアハンター',desc:'レアドロップを 手に入れる'},
  {id:'star5',name:'★5の職人',desc:'部位を ★5まで 育てる'},
  {id:'parts',name:'部位コレクター',desc:'部位を 20しゅるい 見つける'},
  {id:'ally',name:'はじめての子分',desc:'子分を つくる'},
  {id:'skill',name:'絆のわざ',desc:'子分が わざを おぼえる'},
  {id:'master',name:'真の絆',desc:'子分の わざが 真に なる'},
  {id:'allyLv',name:'鍛えた子分',desc:'子分を Lv30に 育てる'},
  {id:'sumo1',name:'土俵の主',desc:'相撲で 勝つ'},
  {id:'sumo3',name:'横綱',desc:'相撲で 3回 勝つ'},
  {id:'nushi1',name:'ぬし狩り',desc:'ぬしを たおす'},
  {id:'nushi4',name:'ぬし討伐隊',desc:'ぬしを 4しゅるい たおす'},
  {id:'nushiAll',name:'ぬしの王',desc:'7匹の ぬしを ぜんぶ たおす'},
  {id:'elite',name:'あばれ退治',desc:'あばれを 合計 30ぴき たおす'},
  {id:'dex',name:'虫博士',desc:'ずかんを 45しゅるい うめる'},
  {id:'lv30',name:'大きくなった',desc:'Lv30に なる'},
  {id:'lv50',name:'林の巨人',desc:'Lv50に なる'}
];
/* ---------------- boss & keeper move sets ----------------
   each boss picks from its moves by distance; moves2 are added once it gets serious (half hp) */
const MOVE_DEF={
  bite:{min:0,max:'reach',w:3},charge:{min:140,max:340,w:2,name:'突進'},rush:{min:110,max:380,w:1.6,name:'三連突進'},leap:{min:150,max:380,w:1.6,name:'飛びかかり'},
  spin:{min:0,max:80,w:1.6,name:'大回転'},sweep:{min:0,max:100,w:2,name:'薙ぎ払い'},slash:{min:0,max:95,w:3,name:'連続斬り'},quake:{min:0,max:200,w:1.4,name:'地ならし'},
  ring:{min:0,max:420,w:1.4,name:'全方位'},shoot:{min:110,max:380,w:2.2,name:'ねらい撃ち'},field:{min:40,max:380,w:1.4,name:'わな'},summon:{min:0,max:700,w:0.9},
  grab:{min:0,max:175,w:2.2},dive:{min:0,max:280,w:3},guard:{min:0,max:200,w:1,name:'かまえ'},dust:{min:0,max:260,w:1.5,name:'りんぷん'}
};
const MOVESETS={
  hasamioya:{moves:['bite','charge','spin'],moves2:['rush'],names:{spin:'ハサミ回し'}},
  geji:{moves:['bite','rush','charge'],moves2:['leap'],names:{rush:'百足走り'}},
  osa:{moves:['bite','charge'],moves2:['rush','sweep'],names:{quake:'大アゴ落とし',sweep:'大アゴ薙ぎ'}},
  kamemushi:{moves:['bite','field','charge'],moves2:['ring'],field:'hostgas',shot:'pellet',names:{field:'においばくだん',ring:'におい玉'}},
  jorou:{dist:200,moves:['shoot','field','bite'],moves2:['ring','summon'],field:'web',summon:'kumo',shot:'web',names:{field:'糸のわな',ring:'糸の雨'},summonText:'おいで、坊やたち'},
  kamazo:{moves:['slash','leap','sweep'],moves2:['rush'],names:{slash:'二段斬り',sweep:'大薙ぎ',rush:'かまいたち走り'}},
  amekichi:{moves:['charge','rush','bite'],moves2:['ring'],shot:'water',names:{ring:'水しぶき'}},
  kamaroku:{moves:['grab','slash','bite'],moves2:['field'],field:'web',names:{field:'釣り糸'}},
  zari:{moves:['bite','spin','charge','guard'],moves2:['quake','ring'],shot:'water',names:{quake:'大バサミ落とし',ring:'泡ふき',guard:'ハサミがまえ'}},
  kumabachi:{moves:['dive','charge','quake'],moves2:['rush'],names:{quake:'ボディプレス'}},
  ageha:{moves:['dive','dust','ring'],moves2:['field'],shot:'scale',field:'dust',names:{ring:'りんぷんの輪',field:'まぼろしの粉'}},
  joou:{dist:190,moves:['shoot','summon','ring'],moves2:['field','dive'],shot:'honey',field:'honey',summon:'mitsubachi',names:{ring:'蜜の花火',field:'蜜だまり'},summonText:'おいで、かわいい子たち'},
  oomukade:{moves:['bite','rush','field'],moves2:['charge'],field:'spore',names:{field:'毒のすじ',rush:'百足なだれ'}},
  hirata:{moves:['bite','charge','sweep'],moves2:['quake'],names:{quake:'平バサミ落とし'}},
  kuwagata:{moves:['bite','charge','sweep','rush'],moves2:['quake','leap'],names:{sweep:'はさみ投げ',quake:'大地割り'}},
  mino:{moves:['bite','guard','ring'],moves2:['quake'],shot:'twig',names:{ring:'みの飛ばし',guard:'みのごもり'}},
  gomadara:{moves:['bite','charge','sweep'],moves2:['rush','ring'],shot:'pellet',names:{sweep:'触角むち',ring:'ゴマ飛ばし'}},
  suzume:{moves:['dive','shoot','summon'],moves2:['rush','ring'],shot:'sting',summon:'hachi',names:{ring:'毒針の雨',rush:'三連急降下'},summonText:'あんたたち、やっておしまい'},
  kanagashira:{moves:['bite','charge','guard'],moves2:['rush','quake'],names:{guard:'金の守り'}},
  oomurasaki:{moves:['dive','dust','ring'],moves2:['summon','field'],shot:'scale',field:'dust',summon:'ga',names:{ring:'むらさきの舞'},summonText:'みなさま、お相手を'},
  kabuto:{moves:['bite','charge','sweep','summon'],moves2:['quake','rush','leap'],summon:'kanabun',names:{sweep:'角すくい',quake:'若頭落とし',rush:'三連突撃',leap:'大跳躍'},summonText:'おい、手を かせ！'},
  nushi_jibeta:{moves:['bite','rush','summon'],moves2:['quake'],summon:'ari',summonText:'ギチギチ……'},
  nushi_kusamura:{moves:['leap','bite','rush'],moves2:['quake'],names:{leap:'風切り跳び'}},
  nushi_ogawa:{moves:['bite','spin','guard','ring'],moves2:['quake'],shot:'water'},
  nushi_hanabatake:{moves:['dive','summon','ring'],moves2:['field'],shot:'honey',field:'honey',summon:'mitsubachi'},
  nushi_kuchiki:{moves:['bite','charge','sweep','quake'],moves2:['rush'],names:{quake:'鬼の地割り'}},
  nushi_miki:{moves:['dive','shoot','rush'],moves2:['ring'],shot:'sting',names:{rush:'稲妻'}},
  nushi_sakaba:{moves:['dive','dust','ring'],moves2:['field','summon'],shot:'scale',field:'dust',summon:'ga',names:{ring:'月光'}}
};
/* follower team-up finishers (one per signature move) */
const COMBO_MOVES={nage:'大車輪',ito:'網打ち',mitsu:'蜜の雨',nioi:'大悪臭',kama:'十字斬り',shippu:'百烈疾風',mawari:'鉄壁陣',tobi:'流星キック',rinpun:'花吹雪'};
ACHS.push({id:'renkei',name:'阿吽の呼吸',desc:'連携わざを はじめて 出す'},{id:'renkei2',name:'総出の一撃',desc:'すみかの 子分も かけつける 連携わざを 出す'},{id:'patterns',name:'見切り名人',desc:'番長の 本気の わざを まるまって 10回 ふせぐ'});
/* ---------------- training ground ---------------- */
TYPES.wara={name:'わら人形',hp:1,dmg:0,r:20,speed:0,xp:0,aggro:0,body:'dummy',ai:'dummy',dummy:true,col:'#d8b86a',dark:'#8a6a34',dex:''};
TYPES.kakashi={name:'動く まと',hp:1,dmg:0,r:17,speed:95,xp:0,aggro:0,body:'dummy',ai:'dummyMove',dummy:true,col:'#e0c27a',dark:'#a0402a',dex:''};
TYPES.shihan={name:'けいこ相手 ハサミの師範',hp:1,dmg:4,r:19,speed:105,xp:0,aggro:9999,body:'earwig',tail:'hasami',ai:'melee',dummy:true,col:'#a09888',dark:'#4a4438',dex:''};
MOVESETS.shihan={moves:['bite','charge','quake','ring','sweep','field','rush'],field:'hostgas',shot:'pellet',names:{quake:'師範の地ならし',ring:'師範の豆まき'}};
/* night-only visitors per area */
const NIGHT_MOBS={jibeta:'kamadouma',kusamura:'kumo',ogawa:'ga',hanabatake:'ga',kuchiki:'ga',miki:'ga',sakaba:null};
ACHS.push({id:'chal1',name:'挑戦者',desc:'番長への 挑戦状を はじめて 達成する'},{id:'chalAll',name:'真の番長',desc:'7つの 挑戦状を すべて 達成する'},
  {id:'yofukashi',name:'よふかし',desc:'夜に 虫を 30ぴき たおす'},{id:'yudachi',name:'雨の日の収穫',desc:'夕立の中で めずらしい部位を 手に入れる'},{id:'dojo',name:'けいこの虫',desc:'けいこ場で 連携わざを ためす'});
/* what each boss shouts when it gets serious */
const RAGE={hasamioya:'ハサミの 本当の 使い方、見せてやらぁ！',geji:'シャカシャカ……本気の 速さだ！',osa:'地べたの 番長を なめるなよ！',kamemushi:'もう 遠慮は しねえ！ 全力で におうぞ！',jorou:'あたしの 巣で 好きには させないよ！',
  kamazo:'次の 一太刀で 終わらせる。',amekichi:'水の上の 本気を 見せてやる！',kamaroku:'大物は、ここからが 勝負なんだ。',zari:'赤鬼の 名は だてじゃないぞ！',kumabachi:'ブゥゥゥン！！ もう 止まらねえ！',
  ageha:'羽を よごした 罪は 重いわよ！',joou:'はたらき手たち、本気で おもてなしなさい！',oomukade:'百の脚、ぜんぶ 使ってやる！',hirata:'兄貴の ためにも、負けられねえ！',kuwagata:'ここからが 本当の 勝負だ！',
  mino:'……（みのが ふくれあがった）',gomadara:'ゴマダラ家の 意地、見せよう。',suzume:'いいわ、本気で 刺してあげる。',kanagashira:'若頭には 指一本 ふれさせねえ！',oomurasaki:'わたくしを 怒らせたわね。',
  kabuto:'……おもしれえ。こんなに 熱く なったのは ひさしぶりだ！',nushi_jibeta:'ギチギチギチ……！',nushi_kusamura:'ヒュウウウ……！',nushi_ogawa:'ガキン！ ガキン！',nushi_hanabatake:'ブゥゥゥゥン……！',
  nushi_kuchiki:'グオオオ……！',nushi_miki:'バリバリバリッ！',nushi_sakaba:'……（月の光が 強くなった）'};

/* =====================================================================
   2年目からの夏：よそ者（外来の虫）が 林に 入ってくる
   ===================================================================== */
PARTS.head.hiari={name:'ヒアリの 火アゴ',dmg:15,cd:0.3,range:20,arc:1.05,poison:4,desc:'よそ者の アゴ。すばやく かめて、焼けるような 毒。'};
PARTS.head.gokegumo={name:'ゴケグモの 赤キバ',dmg:16,cd:0.36,range:20,arc:1.0,poison:9,desc:'赤い すじの クモの キバ。毒が とても つよい。'};
PARTS.tail.hiaribari={name:'女帝の 火バリ',counter:20,poison:8,desc:'ヒアリの 女帝の ハリ。刺し返しに 強い毒。かみつきにも 毒が のる。'};
PARTS.back.tsuyahada={name:'ツヤハダの 黒鞘',def:0.68,spd:1.06,desc:'つやつやの 黒い 背中。かたいのに 軽い。'};
COMBOS.push({id:'yosomono',name:'火毒',need:[['head',['hiari','gokegumo']],['tail',['hiaribari','hari','ohari']]],desc:'毒が 3倍の はやさで 回り、毒で たおれた 虫が 爆ぜる。',hint:'よそ者の キバ ＋ 毒の ハリ'});
COMBO_HOW.yosomono={btn:'bite',tag:'火毒',how:'かむと 毒が 3倍で 回る。毒で たおした虫は 爆ぜて、まわりを 焼く。'};
COMBOS.push({id:'kokuyou',name:'黒曜の突撃',need:[['back',['tsuyahada']],['legs',['batta','kama','kazekiri','mukade']]],desc:'突進の あいだ 無敵に なり、ぶつかった 敵の 守りを くだく。',hint:'黒い 背中 ＋ よく のびる脚'});
COMBO_HOW.kokuyou={btn:'roll',tag:'黒曜',how:'まるまる を はなして 突進する間は 無敵。ぶつかった敵は しばらく 守りが くずれる（うける ダメージ 1.5倍）。'};

TYPES.hiari={name:'よそ者の ヒアリ',hp:26,dmg:6,r:9,speed:112,xp:6,aggro:210,body:'ant',head:'ago',ai:'melee',venom:3,col:'#d8452a',dark:'#7a1a0a',invader:true,drop:['head','hiari',0.07],dex:'海の 向こうから 来た 赤い アリ。数で 押しよせ、刺されると 焼けるように いたい。'};
TYPES.gokegumo={name:'セアカゴケグモ',hp:62,dmg:9,r:12,speed:92,xp:15,aggro:260,body:'spider',ai:'ranged',shot:'sting',col:'#1c1418',dark:'#0a0608',invader:true,drop:['head','gokegumo',0.1],dex:'背中に 赤い すじの ある 毒グモ。物かげから 毒を 飛ばす。'};
TYPES.tsuyahada={name:'ツヤハダの 流れ者',hp:125,dmg:12,r:15,speed:76,xp:21,aggro:210,body:'longhorn',head:'kamikiri',ai:'melee',charge:true,col:'#15151c',dark:'#000004',invader:true,drop:['back','tsuyahada',0.1],dex:'白い 星の ある 黒い カミキリ。木を くいあらす よそ者。'};
RAGE.hiari=RAGE.gokegumo=RAGE.tsuyahada='';
/* the outsider leader that takes over one keeper's arena in each area (stats follow the keeper it replaces) */
const INV_TEMPLATES={
  ant:{name:'ヒアリの 切りこみ隊長',body:'ant',head:'oago',ai:'melee',charge:true,venom:4,summon:'hiari',col:'#d8452a',dark:'#6a1408',r:20,drop:['head','hiari',1],
    meet:'この林の 甘い 汁は、きょうから おれたちの もんだ。',down:'ぐっ……地べたの 虫が、ここまで やるとは……。',rage:'全隊、かかれっ！',
    moves:{moves:['bite','charge','summon'],moves2:['rush','sweep'],summon:'hiari',names:{summon:'突撃隊',rush:'火の 行軍'},summonText:'全隊、かかれ！'},dex:'よそ者の アリを ひきいる 切りこみ隊長。'},
  spider:{name:'ゴケグモの 毒姫',body:'spider',ai:'ranged',shot:'sting',multi:3,venom:5,summon:'gokegumo',col:'#1c1418',dark:'#0a0608',r:20,drop:['head','gokegumo',1],
    meet:'あら、地元の 坊や。わたしの 巣に ようこそ。',down:'……ふふ、田舎の 虫も、すてたもんじゃ ないわね。',rage:'もう 遊びは おしまいよ。',
    moves:{dist:200,moves:['shoot','field','bite'],moves2:['ring','summon'],field:'web',summon:'gokegumo',shot:'sting',names:{field:'赤い 糸',ring:'毒の 雨'},summonText:'おいで、赤い 子たち'},dex:'よそ者の 毒グモを たばねる 女。'},
  longhorn:{name:'クビアカの 用心棒',body:'longhorn',head:'kamikiri',ai:'melee',charge:true,toss:true,col:'#121218',dark:'#000004',r:22,drop:['back','tsuyahada',1],
    meet:'……仕事だ。わるく 思うな。',down:'林の 木は……おまえらの もの、か……。',rage:'首の 赤は、ダテじゃ ねえ。',
    moves:{moves:['bite','charge','sweep'],moves2:['rush','quake'],names:{sweep:'長触角',quake:'木くい落とし'}},dex:'首の 赤い カミキリ。よそ者に やとわれた 用心棒。'},
  queen:{name:'ヒアリの 女帝',body:'ant',head:'oago',big:true,crown:true,ai:'melee',charge:true,venom:6,summon:'hiari',col:'#e0502a',dark:'#5a1006',r:26,drop:['tail','hiaribari',1],
    meet:'番長の座……あの 甘い だまりは、女帝に こそ ふさわしい。',down:'この 林には……かなわぬ ようね。海の 向こうへ 帰りましょう。',rage:'焼きつくせ！',
    moves:{moves:['bite','charge','summon','ring'],moves2:['rush','field'],summon:'hiari',shot:'pellet',field:'dust',names:{ring:'火の粉',field:'火の 砂',rush:'女帝の 行軍'},summonText:'わが子らよ！'},dex:'よそ者の アリ軍団の 頂点に 立つ 女帝。'}
};
const INV_BY_AREA=['ant','ant','spider','spider','longhorn','longhorn','queen'];
const INV_MOBS=[['hiari'],['hiari','gokegumo'],['hiari','gokegumo'],['hiari','gokegumo','tsuyahada'],['hiari','gokegumo','tsuyahada'],['hiari','gokegumo','tsuyahada'],['hiari','gokegumo','tsuyahada']];
AREAS.forEach((A,i)=>{const tp=INV_TEMPLATES[INV_BY_AREA[i]],K=TYPES[A.keepers[1]],id='inv_'+A.id;
  TYPES[id]=Object.assign({},tp,{hp:Math.round(K.hp*1.1),dmg:K.dmg*1.0,speed:Math.max(K.speed,90),xp:Math.round(K.xp*1.35),aggro:300,lvOff:(K.lvOff||1),keeper:true,invader:true,moves:undefined,meet:tp.meet,down:tp.down});
  MOVESETS[id]=tp.moves;RAGE[id]=tp.rage;});
DEX_ORDER.push('hiari','gokegumo','tsuyahada',...AREAS.map(A=>'inv_'+A.id));
ACHS.push({id:'invader',name:'林の 守り神',desc:'よそ者の 頭を 3体 たおす'},{id:'invader7',name:'よそ者 おことわり',desc:'よそ者の 頭を ぜんぶ たおす'},{id:'pitari',name:'阿吽の 極み',desc:'連携わざで「ピタリ！」を 10回 出す'});
