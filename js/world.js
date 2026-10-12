'use strict';
/* =====================================================================
   ひと夏の番長 — world generation & collision
   Open maps: the boss lair (しめ縄 fence) at the top, two keeper arenas,
   the player's すみか near the start, a rare sumo ring somewhere.
   ===================================================================== */
let MAP=null;
const strSeed=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};

const OBST_KIND={rock:{k:'rock',r:[30,62]},grass:{k:'grass',r:[36,58]},pebble:{k:'rock',r:[24,46]},flower:{k:'flower',r:[40,70]},stump:{k:'stump',r:[46,82]},knot:{k:'knot',r:[30,56]}};
const DECOR_SET={
  soil:[['oak',3,['#b8863a','#a07030','#c99a4a','#8a6a3a']],['leaf',2,['#9cb758','#c6b04a']],['twig',2,[]],['pebble',3,['#c9c0ae','#b5ab98','#a39a8a']],['clover',2,['#7d9a46','#8aa64a']],['tuft',3,['#6f8f3a','#86a845']],['patch',2,['rgba(150,110,60,.18)','rgba(255,240,200,.18)']]],
  grass:[['tuft',6,['#5c7a2e','#6f8f3a','#86a845']],['clover',3,['#7d9a46','#6f8f3a']],['bloom',1,['#f6f2e6','#f4d35a']],['pebble',1,['#c9c0ae']],['leaf',1,['#9cb758']],['patch',2,['rgba(60,90,30,.18)','rgba(240,250,190,.2)']]],
  sand:[['pebble',6,['#c9c0ae','#b5ab98','#d8d0be','#a39a8a']],['tuft',2,['#86a845','#6f8f3a']],['twig',1,[]],['leaf',1,['#c6b04a']],['patch',2,['rgba(140,110,70,.15)','rgba(255,250,230,.25)']]],
  flower:[['bloom',4,['#f6f2e6','#f4a6c4','#f4d35a','#a6b8f0','#e8603a']],['petal',4,['#f4a6c4','#f6f2e6','#f4d35a']],['tuft',3,['#6f8f3a','#86a845']],['clover',3,['#7d9a46']],['patch',2,['rgba(250,220,240,.2)','rgba(255,250,200,.2)']]],
  rot:[['moss',4,['rgba(95,125,58,.7)','rgba(120,150,70,.6)']],['oak',3,['#8a5a2a','#6a4a2a','#a07040']],['twig',3,[]],['minishroom',2,[]],['chip',3,['#c9a56c','#a8844a']],['patch',2,['rgba(30,20,10,.18)','rgba(120,150,70,.15)']]],
  bark:[['crack',5,['rgba(42,25,12,.5)']],['lichen',3,['rgba(170,190,140,.6)','rgba(200,200,160,.5)']],['moss',2,['rgba(95,125,58,.6)']],['patch',2,['rgba(30,15,5,.2)','rgba(255,220,170,.1)']]],
  sapbark:[['crack',5,['rgba(10,5,2,.55)']],['drip',3,[]],['lichen',2,['rgba(140,150,110,.4)']],['patch',2,['rgba(0,0,0,.2)','rgba(240,160,60,.08)']]]
};

function genMap(ai,cycle){
  const A=AREAS[ai],R=seeded(strSeed(A.id)+cycle*7919);
  const rr=(a,b)=>a+R()*(b-a);
  const w=A.w,h=A.h;
  const M={ai,w,h,obst:[],webs:[],shrooms:[],saps:[],frogs:[],decor:[],river:null,sumo:null,grid:null};
  M.start={x:w/2,y:h-170};
  M.sumika={x:w/2+170,y:h-300,r:46};
  M.lair={x:w/2,y:A.id==='miki'?420:400,R:A.final?360:300,gate:Math.PI/2,gw:0.2,seed:strSeed(A.id)};
  const L=[
    [[0.2,0.5],[0.8,0.44]],[[0.24,0.36],[0.74,0.64]],[[0.24,0.76],[0.78,0.34]],[[0.2,0.6],[0.8,0.36]],[[0.28,0.7],[0.72,0.42]]
  ][A.layout];
  M.arenas=A.keepers.map((k,i)=>({x:w*L[i][0]+rr(-60,60),y:h*L[i][1]+rr(-60,60),R:210,keeper:k,seed:strSeed(k)}));
  /* river */
  if(A.river){
    const y0=h*0.56,pts=[];for(let x=-160;x<=w+160;x+=80)pts.push([x,y0+Math.sin(x/520+1)*120+Math.sin(x/170)*22]);
    const rv={pts,w:150,cross:[],reeds:[]};
    const ryAt=x=>{for(let i=0;i<pts.length-1;i++){if(x>=pts[i][0]&&x<=pts[i+1][0]){const t=(x-pts[i][0])/(pts[i+1][0]-pts[i][0]);return pts[i][1]+(pts[i+1][1]-pts[i][1])*t;}}return y0;};
    rv.yAt=ryAt;
    [['stones',0.14],['log',0.5],['lily',0.86]].forEach(([kind,fx],ci)=>{
      const cx=w*fx,cy=ryAt(cx),dy=ryAt(cx+10)-ryAt(cx-10),ang=Math.atan2(dy,20)+Math.PI/2;
      const ux=Math.cos(ang),uy=Math.sin(ang),half=rv.w/2+46;
      const c={kind,x:cx,y:cy,ax:cx-ux*half,ay:cy-uy*half,bx:cx+ux*half,by:cy+uy*half,wid:kind==='log'?34:44,stones:[],seed:ci*31+5};
      if(kind==='log'){c.x1=cx-ux*(half+10);c.y1=cy-uy*(half+10);c.x2=cx+ux*(half-30);c.y2=cy+uy*(half-30);c.r=26;}
      else{const n=kind==='stones'?5:4;for(let k=0;k<n;k++){const t=(k+0.5)/n-0.5,j=(k%2?1:-1)*10;c.stones.push({x:cx+ux*t*rv.w*1.05+uy*j,y:cy+uy*t*rv.w*1.05-ux*j,r:kind==='stones'?24:30,seed:ci*100+k*7,a:R()*TAU});}}
      rv.cross.push(c);
    });
    for(let x=0;x<w;x+=rr(50,110)){for(const s of [-1,1]){if(R()<0.5)continue;const y=ryAt(x)+s*(rv.w/2+rr(10,28));if(rv.cross.some(c=>Math.abs(c.x-x)<90))continue;rv.reeds.push({x:x+rr(-15,15),y});}}
    M.river=rv;
    /* frogs lurk in the water */
    for(let k=0;k<6;k++){const x=w*(0.08+k*0.17)+rr(-40,40);if(rv.cross.some(c=>Math.abs(c.x-x)<160))continue;M.frogs.push({x,y:ryAt(x)+rr(-20,20),st:'hide',t:rr(1,4),ang:0,len:200,cd:0});}
    M.start.y=h-170;M.sumika.y=h-300;
  }
  /* exclusion zones */
  const zones=[[M.start.x,M.start.y,240],[M.sumika.x,M.sumika.y,170],[M.lair.x,M.lair.y,M.lair.R+130],...M.arenas.map(a=>[a.x,a.y,a.R+70])];
  /* a corridor from the lair gate downward stays clear */
  const gateX=M.lair.x,gateY=M.lair.y+M.lair.R;
  const free=(x,y,pad)=>{
    if(x<60||y<60||x>w-60||y>h-60)return false;
    for(const z of zones)if(Math.hypot(x-z[0],y-z[1])<z[2]+pad)return false;
    if(Math.abs(x-gateX)<110&&y>gateY-20&&y<gateY+260)return false;
    if(M.river){const d=riverDist(M.river,x,y);if(d<M.river.w/2+pad+30)return false;}
    for(const o of M.obst){if(o.k==='log'){if(segDist(x,y,o.x1,o.y1,o.x2,o.y2)<o.r+pad+120)return false;}else if(Math.hypot(x-o.x,y-o.y)<o.r+pad+120)return false;}
    return true;
  };
  M.free=free;
  /* logs / branches first (they shape the space) */
  const logN=A.obst==='stump'?5:A.obst==='knot'?4:0;
  for(let k=0,tries=0;k<logN&&tries<400;tries++){
    const x=rr(200,w-200),y=rr(300,h-400),a=rr(0,TAU),len=rr(260,420),x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len;
    if(x2<120||x2>w-120||y2<120||y2>h-120)continue;
    let ok=true;for(let t=0;t<=1;t+=0.2){if(!free(x+(x2-x)*t,y+(y2-y)*t,40)){ok=false;break;}}if(!ok)continue;
    M.obst.push({k:'log',x1:x,y1:y,x2,y2,r:A.obst==='knot'?24:32,seed:k*17+3});k++;
  }
  /* main obstacle scatter */
  const kinds=A.obst==='rock'?['rock']:A.obst==='grass'?['grass','grass','rock']:A.obst==='pebble'?['pebble','pebble','grass']:A.obst==='flower'?['flower','flower','flower','rock']:A.obst==='stump'?['stump','rock','stump']:['knot'];
  const target=Math.round(w*h/52000*(A.dens||1));
  for(let k=0,tries=0;k<target&&tries<6000;tries++){
    const kd=OBST_KIND[kinds[Math.floor(R()*kinds.length)]],r=rr(kd.r[0],kd.r[1]),x=rr(80,w-80),y=rr(80,h-80);
    if(!free(x,y,r))continue;
    const o={k:kd.k,x,y,r,seed:Math.floor(R()*1e6),a:rr(0,TAU),v:Math.floor(R()*5)};
    if(A.bg==='rot'||A.bg==='grass')o.moss=R()<0.6;
    M.obst.push(o);k++;
  }
  /* hazards */
  if(A.webs)for(let k=0,t=0;k<14&&t<800;t++){const x=rr(150,w-150),y=rr(200,h-350),r=rr(42,62);if(!free(x,y,r-40))continue;if(M.webs.some(q=>Math.hypot(q.x-x,q.y-y)<300))continue;M.webs.push({x,y,r,a:rr(0,TAU)});k++;}
  if(A.shrooms)for(let k=0,t=0;k<12&&t<800;t++){const x=rr(150,w-150),y=rr(200,h-350),r=rr(22,30);if(!free(x,y,r))continue;if(M.shrooms.some(q=>Math.hypot(q.x-x,q.y-y)<320))continue;const m={k:'shroom',x,y,r,seed:k*3,puff:0,cd:rr(0,3)};M.shrooms.push(m);M.obst.push(m);k++;}
  if(A.saps){for(let k=0,t=0;k<7&&t<800;t++){const x=rr(150,w-150),y=rr(300,h-300);if(!free(x,y,30))continue;if(M.saps.some(q=>Math.hypot(q.x-x,q.y-y)<420))continue;M.saps.push({x,y,rx:rr(40,58),ry:rr(28,40)});k++;}}
  if(A.final)M.throne={x:M.lair.x,y:M.lair.y-60,rx:110,ry:70};
  /* decor */
  const set=DECOR_SET[A.bg],wsum=set.reduce((s,d)=>s+d[1],0);
  const nDec=Math.round(w*h/4200);
  for(let i=0;i<nDec;i++){let p=R()*wsum,d=set[0];for(const s of set){p-=s[1];if(p<=0){d=s;break;}}
    const x=rr(-40,w+40),y=rr(-40,h+40);if(M.river&&riverDist(M.river,x,y)<M.river.w/2+8&&d[0]!=='patch')continue;
    const sz=d[0]==='patch'?rr(60,160):d[0]==='oak'||d[0]==='leaf'?rr(9,16):d[0]==='tuft'?rr(10,18):d[0]==='crack'?rr(14,30):rr(6,13);
    M.decor.push({k:d[0],x,y,a:d[0]==='tuft'?0:rr(0,TAU),s:sz,c:d[2].length?d[2][Math.floor(R()*d[2].length)]:null});}
  M.decor.sort((a,b)=>(a.k==='patch'?0:1)-(b.k==='patch'?0:1));
  /* spatial buckets for culling */
  M.cell=400;M.grid={};const put=(o,x,y)=>{const key=Math.floor(x/M.cell)+','+Math.floor(y/M.cell);(M.grid[key]=M.grid[key]||[]).push(o);};
  M.decor.forEach(d=>put(d,d.x,d.y));
  /* border foliage (visual only) */
  M.border=[];const bk=A.bg==='bark'||A.bg==='sapbark'?'knot':A.bg==='flower'?'flower':A.bg==='grass'?'grass':A.bg==='rot'?'stump':'rock';
  for(let x=-60;x<w+120;x+=rr(70,120)){M.border.push({k:bk,x,y:-rr(40,90),r:rr(50,80),seed:Math.floor(R()*1e6),v:Math.floor(R()*5),a:rr(0,TAU)});M.border.push({k:bk,x,y:h+rr(40,90),r:rr(50,80),seed:Math.floor(R()*1e6),v:Math.floor(R()*5),a:rr(0,TAU)});}
  for(let y=0;y<h;y+=rr(70,120)){M.border.push({k:bk,x:-rr(40,90),y,r:rr(50,80),seed:Math.floor(R()*1e6),v:Math.floor(R()*5),a:rr(0,TAU)});M.border.push({k:bk,x:w+rr(40,90),y,r:rr(50,80),seed:Math.floor(R()*1e6),v:Math.floor(R()*5),a:rr(0,TAU)});}
  return M;
}
/* place the rare sumo ring (per visit) */
function placeSumo(M,chance){
  if(Math.random()>chance)return null;
  for(let t=0;t<600;t++){const x=rnd(300,M.w-300),y=rnd(M.h*0.3,M.h*0.8);if(!M.free(x,y,150))continue;if(Math.hypot(x-M.start.x,y-M.start.y)<900)continue;M.sumo={x,y,R:120};
    M.obst=M.obst.filter(o=>o.k==='log'||Math.hypot(o.x-x,o.y-y)>o.r+150);return M.sumo;}
  return null;
}
function segDist(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy;let t=l?((px-x1)*dx+(py-y1)*dy)/l:0;t=clamp(t,0,1);return Math.hypot(px-(x1+dx*t),py-(y1+dy*t));}
function segClosest(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy;let t=l?((px-x1)*dx+(py-y1)*dy)/l:0;t=clamp(t,0,1);return [x1+dx*t,y1+dy*t];}
function riverDist(rv,x,y){let best=1e9;for(let i=0;i<rv.pts.length-1;i++){const a=rv.pts[i],b=rv.pts[i+1];if(x<a[0]-200||x>b[0]+200)continue;const d=segDist(x,y,a[0],a[1],b[0],b[1]);if(d<best)best=d;}return best;}
function riverClosest(rv,x,y){let best=1e9,bp=null;for(let i=0;i<rv.pts.length-1;i++){const a=rv.pts[i],b=rv.pts[i+1];if(x<a[0]-200||x>b[0]+200)continue;const p=segClosest(x,y,a[0],a[1],b[0],b[1]),d=Math.hypot(x-p[0],y-p[1]);if(d<best){best=d;bp=p;}}return bp;}
function onCrossing(M,x,y,pad){if(!M.river)return false;for(const c of M.river.cross){if(segDist(x,y,c.ax,c.ay,c.bx,c.by)<c.wid+(pad||0))return true;}return false;}
function inWater(M,x,y){return !!M.river&&riverDist(M.river,x,y)<M.river.w/2-4&&!onCrossing(M,x,y,-10);}
/* opts: fly (ignores obstacles), water (may stand on water), glide (crosses water while dashing), noFence */
function collide(c,r,opts){
  opts=opts||{};const M=MAP;
  if(!opts.fly){
    for(const o of M.obst){
      if(o.k==='log'){const p=segClosest(c.x,c.y,o.x1,o.y1,o.x2,o.y2),dx=c.x-p[0],dy=c.y-p[1],d=Math.hypot(dx,dy),m=o.r+r;if(d<m){if(d<0.01){c.y+=m;continue;}c.x=p[0]+dx/d*m;c.y=p[1]+dy/d*m;}continue;}
      const dx=c.x-o.x,dy=c.y-o.y;if(Math.abs(dx)>o.r+r||Math.abs(dy)>o.r+r)continue;const d=Math.hypot(dx,dy),m=o.r*0.92+r;if(d<m){if(d<0.01){c.x+=m;continue;}c.x=o.x+dx/d*m;c.y=o.y+dy/d*m;}
    }
    if(M.river&&!opts.water&&!opts.glide){
      const rv=M.river,d=riverDist(rv,c.x,c.y),lim=rv.w/2+r*0.3;
      if(d<lim&&!onCrossing(M,c.x,c.y,0)){const p=riverClosest(rv,c.x,c.y);if(p){let dx=c.x-p[0],dy=c.y-p[1],dd=Math.hypot(dx,dy);if(dd<0.01){dx=0;dy=1;dd=1;}c.x=p[0]+dx/dd*lim;c.y=p[1]+dy/dd*lim;}}
    }
  }
  if(!opts.noFence){
    const L=M.lair,dx=c.x-L.x,dy=c.y-L.y,d=Math.hypot(dx,dy),band=r+10;
    if(Math.abs(d-L.R)<band){
      const a=Math.atan2(dy,dx),inGate=Math.abs(angDiff(L.gate,a))<L.gw*0.82;
      if(!(inGate&&L.open)){const out=c.inLair!==undefined?!c.inLair:d>L.R;const t=out?L.R+band:L.R-band;c.x=L.x+dx/(d||1)*t;c.y=L.y+dy/(d||1)*t;}
    }
  }
  c.x=clamp(c.x,r,M.w-r);c.y=clamp(c.y,r,M.h-r);
}
function blocked(x,y,pad){
  const M=MAP;for(const o of M.obst){if(o.k==='log'){if(segDist(x,y,o.x1,o.y1,o.x2,o.y2)<o.r+pad)return true;}else if(Math.hypot(o.x-x,o.y-y)<o.r+pad)return true;}
  if(M.river&&riverDist(M.river,x,y)<M.river.w/2+pad&&!onCrossing(M,x,y,0))return true;
  return false;
}
function inLair(x,y){const L=MAP.lair;return Math.hypot(x-L.x,y-L.y)<L.R;}
function visibleDecor(x0,y0,x1,y1){const M=MAP,c=M.cell,out=[];for(let gx=Math.floor(x0/c);gx<=Math.floor(x1/c);gx++)for(let gy=Math.floor(y0/c);gy<=Math.floor(y1/c);gy++){const b=M.grid[gx+','+gy];if(b)for(const d of b)out.push(d);}return out;}
