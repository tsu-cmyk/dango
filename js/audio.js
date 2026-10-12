'use strict';
/* =====================================================================
   ひと夏の番長 — audio (procedural WebAudio: sfx + sequenced songs)
   ===================================================================== */
let AC=null,master=null,musGain=null,sfxGain=null,NOISE=null;
const OPT={bgm:true,se:true,shake:true,vib:true};
const MUS_VOL=0.42;
function initAudio(){
  if(!HAS_DOM)return;
  if(AC){if(AC.state==='suspended'&&AC.resume)AC.resume();return;}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){AC=null;return;}
  master=AC.createGain();master.gain.value=0.9;master.connect(AC.destination);
  const comp=AC.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.connect(master);
  musGain=AC.createGain();musGain.gain.value=0.0001;musGain.connect(comp);
  sfxGain=AC.createGain();sfxGain.gain.value=OPT.se?0.5:0;sfxGain.connect(comp);
  const n=AC.sampleRate;NOISE=AC.createBuffer(1,n,AC.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  music.start();if(music.name)music.load(music.name);
}
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak),t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec);}
function osc(type,f,t,dur,dest){const o=AC.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.connect(dest);o.start(t);o.stop(t+dur+0.05);return o;}
function noiseSrc(t,dur,dest){const s=AC.createBufferSource();s.buffer=NOISE;s.loop=true;s.connect(dest);s.start(t,Math.random()*0.5);if(dur)s.stop(t+dur+0.05);return s;}
function tone(f,dur,type,vol,f2,delay){if(!AC)return;const t=AC.currentTime+(delay||0),g=AC.createGain();g.connect(sfxGain);const o=osc(type||'square',f,t,dur,g);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);env(g,t,0.008,vol||0.1,dur);}
function noise(dur,vol,hp,lp,delay){if(!AC)return;const t=AC.currentTime+(delay||0),g=AC.createGain(),f=AC.createBiquadFilter();f.type=lp?'lowpass':'highpass';f.frequency.value=lp||hp||800;f.connect(g);g.connect(sfxGain);noiseSrc(t,dur,f);env(g,t,0.005,vol||0.2,dur);}
const lastS={};
function sfx(k){
  if(!AC)return;const now=AC.currentTime;if(lastS[k]&&now-lastS[k]<0.05)return;lastS[k]=now;
  switch(k){
    case 'bite':noise(0.06,0.3,2000);tone(260,0.06,'square',0.06,180);break;
    case 'hit':tone(180,0.08,'square',0.1,90);noise(0.05,0.18,1200);break;
    case 'crit':tone(240,0.12,'square',0.12,60);noise(0.12,0.3,900);tone(1600,0.1,'triangle',0.08,2400,0.03);break;
    case 'ouch':tone(320,0.18,'sawtooth',0.09,140);break;
    case 'down':tone(400,0.3,'triangle',0.14,80);break;
    case 'eat':tone(660,0.06,'square',0.05);tone(880,0.07,'square',0.05,null,0.05);break;
    case 'lvup':[523,659,784,1046].forEach((f,i)=>tone(f,0.14,'square',0.07,null,i*0.07));break;
    case 'star':[784,988,1175,1568].forEach((f,i)=>tone(f,0.12,'triangle',0.1,null,i*0.06));break;
    case 'combo':[392,523,659,784,1046,1318].forEach((f,i)=>tone(f,0.16,'square',0.07,null,i*0.06));break;
    case 'ally':[523,659,523,784].forEach((f,i)=>tone(f,0.12,'triangle',0.1,null,i*0.08));break;
    case 'gate':tone(140,0.5,'sawtooth',0.08,90);[392,523,659].forEach((f,i)=>tone(f,0.2,'triangle',0.1,null,0.2+i*0.08));break;
    case 'roll':tone(200,0.1,'triangle',0.14,120);break;
    case 'dash':noise(0.2,0.2,500);tone(150,0.2,'triangle',0.14,300);break;
    case 'clink':tone(1500,0.15,'square',0.06);tone(2200,0.1,'sine',0.06,null,0.02);break;
    case 'hop':tone(300,0.1,'triangle',0.07,600);break;
    case 'roar':tone(110,0.4,'sawtooth',0.13,70);noise(0.3,0.15,null,600);break;
    case 'part':[392,523,659].forEach((f,i)=>tone(f,0.16,'triangle',0.12,null,i*0.08));break;
    case 'rare':[523,784,1046,1568,2093].forEach((f,i)=>tone(f,0.22,'triangle',0.09,null,i*0.07));break;
    case 'talk':tone(700+Math.random()*200,0.03,'square',0.03);break;
    case 'slash':noise(0.12,0.3,3000);tone(900,0.1,'sawtooth',0.05,300);break;
    case 'web':tone(1200,0.12,'sine',0.05,500);break;
    case 'buzz':tone(180,0.35,'sawtooth',0.07,240);break;
    case 'thud':tone(90,0.3,'sine',0.25,40);noise(0.2,0.2,null,400);break;
    case 'stink':noise(0.5,0.12,null,500);tone(120,0.4,'sawtooth',0.04,80);break;
    case 'bird':tone(1800,0.12,'sine',0.1,2400);tone(2400,0.12,'sine',0.1,1600,0.15);break;
    case 'frog':tone(140,0.12,'square',0.1,90);tone(120,0.14,'square',0.1,70,0.16);break;
    case 'tongue':noise(0.15,0.25,1500);tone(500,0.15,'sawtooth',0.08,120);break;
    case 'spore':noise(0.4,0.12,null,900);break;
    case 'splash':noise(0.25,0.18,600);tone(500,0.12,'sine',0.05,200);break;
    case 'store':tone(520,0.08,'triangle',0.1);tone(390,0.1,'triangle',0.1,null,0.08);break;
    case 'merge':[523,659,784,1046,1318,1568].forEach((f,i)=>tone(f,0.14,'triangle',0.09,null,i*0.05));noise(0.3,0.08,4000,null,0.3);break;
    case 'elite':tone(220,0.3,'sawtooth',0.08,330);tone(330,0.3,'sawtooth',0.06,440,0.12);break;
    case 'phase':tone(80,0.6,'sawtooth',0.14,160);noise(0.5,0.2,null,700);[262,311,370].forEach((f,i)=>tone(f,0.3,'square',0.06,null,0.2+i*0.1));break;
    case 'firework':noise(0.6,0.25,null,1800);tone(80,0.4,'sine',0.25,40);break;
    case 'whistle':tone(700,0.7,'sine',0.06,1600);break;
    case 'heal':[660,880,1100].forEach((f,i)=>tone(f,0.16,'sine',0.07,null,i*0.05));break;
    case 'pull':tone(300,0.2,'sawtooth',0.07,700);break;
    case 'grab':tone(220,0.15,'square',0.08,110);noise(0.08,0.2,1500);break;
    case 'gas':noise(0.5,0.22,null,700);tone(90,0.3,'sawtooth',0.06,60);break;
    case 'burrow':noise(0.3,0.18,null,500);break;
    case 'clear':[523,659,784,1046,784,1046].forEach((f,i)=>tone(f,0.2,'square',0.07,null,i*0.1));break;
    case 'drum':tone(110,0.3,'sine',0.25,52);noise(0.1,0.15,null,900);break;
    case 'thunder':noise(0.12,0.4,1800);noise(2.8,0.45,null,170,0.12);tone(48,2.2,'sine',0.35,28,0.1);break;
    case 'cutin':noise(0.35,0.3,2500);tone(220,0.5,'sawtooth',0.12,880);tone(110,0.6,'square',0.08,55,0.2);break;
    case 'finish':tone(60,1.2,'sine',0.4,30);noise(0.8,0.35,null,500);[262,330,392,523].forEach((f,i)=>tone(f,0.5,'triangle',0.06,null,0.5+i*0.08));break;
    case 'fanfare':[392,523,659,784,659,784,1046].forEach((f,i)=>tone(f,0.22,'square',0.07,null,i*0.11));[196,262,330].forEach(f=>tone(f,0.9,'triangle',0.06,null,0.7));break;
  }
}
const NOTE_I={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
function nf(n){const m=n.match(/^([A-G](?:#|b)?)(-?\d)$/);if(!m)return 0;return 440*Math.pow(2,(NOTE_I[m[1]]+(+m[2]+1)*12-69)/12);}
function chordNotes(c,oct){const m=c.match(/^([A-G](?:#|b)?)(m?)(7?)$/),root=NOTE_I[m[1]],iv=[0,m[2]?3:4,7];if(m[3])iv.push(10);return iv.map(i=>440*Math.pow(2,(root+i+(oct+1)*12-69)/12));}
const INST={
  marimba(t,f,d,v){const g=AC.createGain();g.connect(musGain);osc('sine',f,t,0.6,g);env(g,t,0.004,v,0.45);const g2=AC.createGain();g2.connect(musGain);osc('sine',f*4,t,0.15,g2);env(g2,t,0.002,v*0.25,0.08);},
  pluck(t,f,d,v){const g=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(3200,t);lp.frequency.exponentialRampToValueAtTime(400,t+0.25);lp.connect(g);g.connect(musGain);osc('triangle',f,t,0.4,lp);osc('square',f,t,0.3,lp).detune.value=4;env(g,t,0.003,v,0.3);},
  whistle(t,f,d,v){const g=AC.createGain();g.connect(musGain);const o=osc('sine',f,t,d+0.15,g);const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=5.5;lg.gain.value=f*0.012;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+d+0.2);
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+0.03);g.gain.setValueAtTime(v,t+Math.max(0.03,d-0.05));g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.12);},
  flute(t,f,d,v){INST.whistle(t,f,d,v*0.9);const g=AC.createGain(),bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f*2;bp.Q.value=3;bp.connect(g);g.connect(musGain);noiseSrc(t,d+0.1,bp);env(g,t,0.04,v*0.25,d);},
  lead(t,f,d,v){const g=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;lp.connect(g);g.connect(musGain);osc('square',f,t,d+0.1,lp);osc('sawtooth',f*1.003,t,d+0.1,lp);
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+0.01);g.gain.setValueAtTime(v*0.8,t+Math.max(0.02,d-0.03));g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.08);},
  musicbox(t,f,d,v){const g=AC.createGain();g.connect(musGain);osc('sine',f,t,1.6,g);env(g,t,0.003,v,1.4);const g2=AC.createGain();g2.connect(musGain);osc('sine',f*3,t,0.4,g2);env(g2,t,0.002,v*0.18,0.3);},
  bass(t,f,d,v){const g=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;lp.connect(g);g.connect(musGain);osc('triangle',f,t,d+0.1,lp);osc('square',f,t,d+0.1,lp).detune.value=-3;
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+0.008);g.gain.exponentialRampToValueAtTime(v*0.5,t+d*0.7);g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.06);},
  pad(t,f,d,v){const g=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1100;lp.connect(g);g.connect(musGain);osc('sawtooth',f,t,d+0.6,lp).detune.value=-7;osc('sawtooth',f,t,d+0.6,lp).detune.value=7;
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+0.25);g.gain.setValueAtTime(v,t+d);g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.5);},
  kick(t,v){const g=AC.createGain();g.connect(musGain);const o=osc('sine',150,t,0.3,g);o.frequency.exponentialRampToValueAtTime(42,t+0.2);env(g,t,0.002,v,0.25);},
  snare(t,v){const g=AC.createGain(),bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1800;bp.Q.value=0.8;bp.connect(g);g.connect(musGain);noiseSrc(t,0.15,bp);env(g,t,0.002,v,0.13);const g2=AC.createGain();g2.connect(musGain);osc('triangle',190,t,0.1,g2);env(g2,t,0.002,v*0.4,0.08);},
  hat(t,v){const g=AC.createGain(),hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=7000;hp.connect(g);g.connect(musGain);noiseSrc(t,0.05,hp);env(g,t,0.001,v,0.04);},
  wood(t,v){const g=AC.createGain();g.connect(musGain);osc('sine',1250,t,0.08,g);env(g,t,0.001,v,0.06);},
  shaker(t,v){const g=AC.createGain(),bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=5200;bp.Q.value=1.4;bp.connect(g);g.connect(musGain);noiseSrc(t,0.07,bp);env(g,t,0.01,v,0.05);},
  taiko(t,v){const g=AC.createGain();g.connect(musGain);const o=osc('sine',110,t,0.5,g);o.frequency.exponentialRampToValueAtTime(52,t+0.35);env(g,t,0.003,v,0.42);
    const g2=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;lp.connect(g2);g2.connect(musGain);noiseSrc(t,0.12,lp);env(g2,t,0.002,v*0.5,0.1);},
  cicada(t,v,kind){
    const g=AC.createGain(),bp=AC.createBiquadFilter();bp.type='bandpass';bp.Q.value=6;g.connect(musGain);bp.connect(g);noiseSrc(t,2.4,bp);g.gain.setValueAtTime(0.0001,t);
    if(kind==='higurashi'){bp.frequency.setValueAtTime(4600,t);bp.frequency.linearRampToValueAtTime(3800,t+1.9);for(let i=0;i<14;i++){const tt=t+i*0.13;g.gain.exponentialRampToValueAtTime(v*(1-i/18),tt+0.02);g.gain.exponentialRampToValueAtTime(0.0001,tt+0.11);}}
    else if(kind==='minmin'){bp.frequency.value=3600;for(let i=0;i<6;i++){const tt=t+i*0.34;g.gain.exponentialRampToValueAtTime(v,tt+0.1);g.gain.exponentialRampToValueAtTime(v*0.15,tt+0.3);}g.gain.exponentialRampToValueAtTime(0.0001,t+2.3);}
    else if(kind==='stream'){bp.frequency.value=900;bp.Q.value=0.7;g.gain.exponentialRampToValueAtTime(v*0.8,t+0.6);g.gain.setValueAtTime(v*0.8,t+1.8);g.gain.exponentialRampToValueAtTime(0.0001,t+2.3);}
    else if(kind==='cricket'){bp.frequency.value=4300;bp.Q.value=12;for(let i=0;i<8;i++){const tt=t+i*0.24;g.gain.exponentialRampToValueAtTime(v,tt+0.03);g.gain.exponentialRampToValueAtTime(0.0001,tt+0.12);}}
    else{bp.frequency.value=5200;bp.Q.value=2;g.gain.exponentialRampToValueAtTime(v*0.7,t+0.3);g.gain.setValueAtTime(v*0.7,t+1.8);g.gain.exponentialRampToValueAtTime(0.0001,t+2.3);}
  }
};
const SONGS={
  title:{bpm:92,swing:0.1,lead:'marimba',lv:0.22,comp:'arp',cv:0.07,ci:'musicbox',bass:'1 . . . 5 . . . 1 . . . 5 . . .',bv:0.2,amb:'minmin',
    chords:['F','Dm','Bb','C','F','Dm','Bb','C'],drums:{wood:'....x.......x...',hat:'..x...x...x...x.'},
    mel:['A5 . . . C6 . A5 . G5 . F5 . . . C5 .','D5 . F5 . A5 - - . G5 . F5 . D5 . . .','D5 . F5 . Bb5 . A5 . G5 . F5 . D5 . F5 .','G5 - - - E5 . . . C5 . . . . . . .',
      'A5 . . . C6 . F6 . E6 . C6 . A5 . . .','F5 . . A5 . . D6 . C6 . A5 . F5 . . .','D6 . . C6 Bb5 . A5 . G5 . F5 . G5 . A5 .','G5 - - - . . . . . . . . . . . .']},
  jibeta:{bpm:108,swing:0.14,lead:'marimba',lv:0.24,comp:'stab',cv:0.08,ci:'pluck',bass:'1 . . 5 . . 1 . 8 . . 5 . 1 . .',bv:0.24,amb:'minmin',
    chords:['C','Am','F','G','C','Am','Dm','G'],drums:{kick:'x.....x.x.......',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'},
    mel:['E5 . G5 . A5 . G5 E5 . . D5 . C5 . D5 .','E5 . . . C5 . A4 . C5 . D5 . E5 - . .','F5 . A5 . A5 G5 F5 . A4 . C5 . F5 - . .','G5 . . F5 E5 . D5 . B4 . . . G4 . . .',
      'E5 . G5 . C6 . B5 . A5 . G5 . E5 . G5 .','A5 - . G5 E5 . C5 . E5 . . D5 C5 . A4 .','D5 . F5 . A5 . G5 . F5 . E5 . D5 . F5 .','G5 - - - B4 . D5 . G5 . . . . . . .']},
  kusamura:{bpm:126,swing:0.06,lead:'whistle',lv:0.17,comp:'arp',cv:0.06,ci:'pluck',bass:'1 . 1 . 5 . 1 . 1 . 1 . 5 . 8 .',bv:0.22,amb:'kuma',
    chords:['D','G','A','D','Bm','G','Em','A'],drums:{kick:'x...x...x...x...',snare:'....x.......x...',hat:'xxxxxxxxxxxxxxxx'},
    mel:['F#5 . A5 . D6 . A5 . B5 . A5 . F#5 . E5 .','D5 . . . G5 . B5 . A5 - G5 . E5 . D5 .','E5 . A5 . C#6 . B5 . A5 . E5 . F#5 . G5 .','A5 - - . F#5 . D5 . F#5 . A5 . D6 - . .',
      'B5 . . A5 F#5 . D5 . F#5 . B5 . A5 . F#5 .','G5 . B5 . D6 . B5 . G5 . . . D5 . G5 .','E5 . G5 . B5 . A5 . G5 . F#5 . E5 . D5 .','C#5 . E5 . A5 - - - G5 . E5 . C#5 . A4 .']},
  kawa:{bpm:112,swing:0.08,lead:'flute',lv:0.19,comp:'arp',cv:0.06,ci:'marimba',bass:'1 . . 5 . . 8 . 1 . . 5 . . 8 .',bv:0.2,amb:'stream',
    chords:['G','Em','C','D','G','Bm','C','D'],drums:{shaker:'x.xxx.xxx.xxx.xx',kick:'x.......x.......',wood:'......x.......x.'},
    mel:['B5 . D6 . B5 . G5 . A5 . B5 . D5 . . .','E5 . G5 . B5 - - . A5 . G5 . E5 . . .','E5 . G5 . C6 . B5 . A5 . G5 . E5 . G5 .','A5 - - - F#5 . . . D5 . . . . . . .',
      'G5 . B5 . D6 . G6 . F#6 . D6 . B5 . . .','F#6 . . D6 B5 . F#5 . B5 . . A5 G5 . F#5 .','E5 . G5 . C6 . E6 . D6 . C6 . B5 . A5 .','G5 - - - D5 . . . G5 . . . . . . .']},
  hana:{bpm:120,swing:0.12,lead:'marimba',lv:0.23,comp:'stab',cv:0.06,ci:'musicbox',bass:'1 . . . 5 . . . 1 . . 5 8 . 5 .',bv:0.2,amb:'minmin',
    chords:['F','C','Dm','Bb','F','Am','Bb','C'],drums:{kick:'x.......x.......',hat:'..x...x...x...x.',shaker:'x.x.x.x.x.x.x.x.'},
    mel:['C6 . A5 . F5 . A5 . C6 . D6 . C6 . A5 .','G5 . . . E5 . G5 . C6 - - . . . . .','A5 . F5 . D5 . F5 . A5 . C6 . D6 . F6 .','D6 - - . C6 . Bb5 . A5 . G5 . F5 . . .',
      'F5 . A5 . C6 . F6 . E6 . C6 . A5 . C6 .','E6 . . . C6 . A5 . E5 . . . A5 . . .','D6 . Bb5 . F5 . Bb5 . D6 . F6 . E6 . D6 .','C6 - - - G5 . . . E5 . . . C5 . . .']},
  kuchiki:{bpm:96,swing:0.04,lead:'pluck',lv:0.2,comp:'pad',cv:0.035,ci:'pad',bass:'1 . . . . . 1 . 5 . . . 1 . . .',bv:0.24,amb:'cricket',
    chords:['Dm','Dm','Bb','A','Gm','Dm','E','A'],drums:{kick:'x.....x.........',wood:'....x.......x..x',hat:'..x...x...x...x.'},
    mel:['D5 . . F5 . . A5 . G5 . F5 . E5 . . .','D5 - - - . . A4 . D5 . E5 . F5 . . .','F5 . . D5 . . Bb4 . D5 . F5 . Bb5 - . .','A5 - - - G5 . F5 . E5 . . . C#5 . . .',
      'G5 . . Bb5 . . D6 . C6 . Bb5 . A5 . G5 .','F5 - - . A5 . D6 - - . C6 . A5 . . .','G#5 . . B5 . . D6 . E6 - - . D6 . B5 .','A5 - - - - - - - E5 . . . C#5 . . .']},
  miki:{bpm:116,swing:0,lead:'flute',lv:0.2,comp:'pad',cv:0.035,ci:'pad',bass:'1 . . 1 . . 1 . 1 . . 1 . 5 . .',bv:0.24,amb:'higurashi',
    chords:['Am','Am','F','F','G','G','E','E'],drums:{kick:'x..x..x.x..x..x.',snare:'....x.......x..x',hat:'..x...x...x...x.',taiko:'x.......x.......'},
    mel:['A4 - - . C5 . E5 . D5 - - . C5 . B4 .','A4 - - - . . . . E5 . D5 . C5 . B4 .','C5 - - . F5 . A5 . G5 - - . F5 . E5 .','F5 - - - . . . . A4 . C5 . F5 . E5 .',
      'D5 - - . G5 . B5 . A5 - - . G5 . F5 .','G5 - - - . . . . D5 . E5 . F5 . G5 .','G#5 - - . B5 . E6 . D6 - - . B5 . G#5 .','E5 - - - - - - - . . . . E4 . G#4 .']},
  jueki:{bpm:100,swing:0.08,lead:'whistle',lv:0.19,comp:'arp',cv:0.05,ci:'musicbox',pad:true,bass:'1 . . . 1 . . 5 1 . . . 1 . 5 .',bv:0.22,amb:'cricket',
    chords:['Em','C','D','Bm','Em','C','Am','B7'],drums:{taiko:'x.......x...x...',kick:'x.......x.......',hat:'..x...x...x...x.'},
    mel:['B4 . E5 . G5 . B5 - - . A5 . G5 . F#5 .','E5 - - . G5 . C6 - - . B5 . A5 . G5 .','F#5 - - . A5 . D6 - - . C6 . B5 . A5 .','B5 - - - - - . . F#5 . A5 . B5 - . .',
      'G5 . B5 . E6 - - . D6 . B5 . G5 . E5 .','C6 - - . B5 . G5 - - . E5 . G5 . A5 .','A5 - . C6 B5 . A5 . E5 . A5 . C6 . E6 .','D#6 - - - B5 - - - F#5 . . . D#5 . . .']},
  sumika:{bpm:84,swing:0.1,lead:'musicbox',lv:0.2,comp:'arp',cv:0.05,ci:'marimba',bass:'1 . . . . . . . 5 . . . . . . .',bv:0.16,amb:'minmin',
    chords:['C','Am','F','G','C','Em','F','G'],drums:{},
    mel:['E5 . . . G5 . . . C6 . . . G5 . . .','A5 . . . E5 . . . C5 . . . E5 . . .','F5 . . . A5 . . . C6 . . . A5 . . .','G5 . . . B5 . . . D6 . . . . . . .',
      'C6 . . . B5 . . . G5 . . . E5 . . .','G5 . . . E5 . . . B4 . . . E5 . . .','A5 . . . F5 . . . C5 . . . F5 . A5 .','G5 - - - . . . . . . . . . . . .']},
  matsuri:{bpm:138,swing:0.1,lead:'flute',lv:0.18,comp:'stab',cv:0.05,ci:'pluck',bass:'1 . . 1 5 . . . 1 . . 1 8 . 5 .',bv:0.22,
    chords:['Am','Am','G','Am','Am','C','G','Am'],drums:{taiko:'x..x..x.x..x..x.',wood:'..x...x...x...x.',shaker:'xxxxxxxxxxxxxxxx'},
    mel:['A5 . C6 . A5 . G5 . E5 . G5 . A5 . . .','C6 . D6 . E6 . D6 . C6 . A5 . . . . .','G5 . A5 . G5 . E5 . D5 . E5 . G5 . . .','A5 - - - . . . . E5 . G5 . A5 . . .',
      'E6 . . D6 C6 . A5 . C6 . . A5 G5 . E5 .','G5 . A5 . C6 . E6 . D6 . C6 . A5 . . .','D6 . C6 . A5 . G5 . E5 . D5 . E5 . G5 .','A5 - - - A5 . . . A4 . . . . . . .']},
  keeper:{bpm:132,swing:0.05,lead:'pluck',lv:0.16,comp:'stab',cv:0.06,ci:'pluck',bass:'1 . 1 . 5 . 1 . 1 . 1 . 5 . 1 .',bv:0.24,
    chords:['Am','Am','G','G','F','F','E','E'],drums:{kick:'x...x...x...x...',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',taiko:'x.......x.x.....'},
    mel:['A5 . A5 . C6 . A5 . E5 . . . A5 . C6 .','B5 . A5 . G5 . E5 . . . . . . . . .','G5 . G5 . B5 . G5 . D5 . . . G5 . B5 .','A5 . G5 . F5 . D5 . . . . . . . . .',
      'F5 . A5 . C6 . A5 . F5 . A5 . C6 . F6 .','E6 . D6 . C6 . A5 . . . . . . . . .','E5 . G#5 . B5 . E6 . D6 . B5 . G#5 . B5 .','E5 - - - . . . . E6 - - - . . . .']},
  boss:{bpm:142,swing:0,lead:'lead',lv:0.1,comp:'stab',cv:0.07,ci:'pluck',bass:'1 1 . 1 1 . 1 1 1 1 . 1 1 . 5 8',bv:0.26,
    chords:['Dm','Dm','Bb','C','Dm','Dm','Bb','A'],drums:{kick:'x.x...x.x.x...x.',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',taiko:'x...x...x...x...'},
    mel:['D5 . D5 . F5 . D5 . A5 . G5 . F5 . E5 .','D5 . D5 . F5 . A5 . D6 . C6 . A5 . F5 .','Bb5 . A5 . G5 . F5 . D5 . F5 . G5 . Bb5 .','C6 . Bb5 . A5 . G5 . E5 . G5 . C6 . E6 .',
      'D6 . . D6 . . C6 . A5 . . F5 . . D5 .','F5 . . G5 . . A5 . D6 . . C6 . . A5 .','Bb5 . A5 . Bb5 . D6 . F6 - - . D6 . Bb5 .','A5 . C#6 . E6 . A6 - - - E6 . C#6 . A5 .']},
  final:{bpm:150,swing:0,lead:'lead',lv:0.1,comp:'stab',cv:0.07,ci:'pluck',pad:true,bass:'1 . 1 1 . 1 1 . 1 . 1 1 . 1 5 8',bv:0.26,
    chords:['Em','C','D','B','Em','C','Am','B'],drums:{kick:'x.x.x.x.x.x.x.x.',snare:'....x.......x.x.',hat:'xxxxxxxxxxxxxxxx',taiko:'x..x..x.x..x..x.'},
    mel:['E5 . G5 . B5 . E6 . D6 . B5 . G5 . A5 .','G5 . E5 . C5 . E5 . G5 . C6 . B5 . G5 .','F#5 . A5 . D6 . F#6 . E6 . D6 . A5 . F#5 .','D#6 - - - B5 - - - F#5 . B5 . D#6 . F#6 .',
      'G6 - - . F#6 . E6 . B5 . . . G5 . E5 .','C6 - - . B5 . G5 . E5 . G5 . C6 . E6 .','A5 . C6 . E6 . A6 . G6 . E6 . C6 . A5 .','B5 . D#6 . F#6 . B6 - - - - - - - . .']},
  ending:{bpm:76,swing:0,lead:'musicbox',lv:0.2,comp:'pad',cv:0.045,ci:'pad',bass:'1 . . . . . . . 5 . . . . . . .',bv:0.16,amb:'higurashi',
    chords:['C','G','Am','Em','F','C','F','G'],drums:{},
    mel:['E5 . . . G5 . . . C6 . . . B5 . A5 .','B5 . . . D5 . . . G5 . . . . . . .','C6 . . . B5 . . . A5 . . . E5 . . .','G5 . . . . . . . E5 . . . . . . .',
      'F5 . . . A5 . . . C6 . . . A5 . . .','G5 . . . E5 . . . C5 . . . E5 . G5 .','A5 . . . C6 . . . F6 . . . E6 . D6 .','D6 . . . . . . . B5 . . . G5 . . .']},
  nushi:{bpm:118,swing:0,lead:'flute',lv:0.2,comp:'pad',cv:0.04,ci:'pad',pad:true,bass:'1 . . . 1 . 5 . 1 . . . 1 . 8 .',bv:0.26,
    chords:['Dm','Eb','Dm','Eb','Cm','Dm','Bb','A'],drums:{taiko:'x..x....x..x..x.',kick:'x.......x.......',hat:'....x.......x...',wood:'..x...x...x...x.'},
    mel:['D5 - - . F5 . Eb5 . D5 . . . A4 . . .','Bb4 - - . Eb5 . D5 . C5 - - - . . . .','D5 . F5 . A5 - - . G5 . F5 . Eb5 . D5 .','Eb5 - - - G5 - - - Bb5 - - - A5 . . .',
      'G5 . . Bb5 . . C6 . Bb5 . G5 . Eb5 . . .','F5 - - . D5 . F5 . A5 - - - . . . .','Bb5 . A5 . G5 . F5 . D5 . F5 . Bb5 . D6 .','C#6 - - - A5 - - - E5 - - - C#5 . . .']},
  victory:{bpm:112,swing:0.06,lead:'whistle',lv:0.2,comp:'arp',cv:0.06,ci:'marimba',pad:true,bass:'1 . . 5 . . 8 . 1 . . 5 . . 8 .',bv:0.22,amb:'higurashi',
    chords:['C','G','Am','F','C','G','F','G'],drums:{kick:'x.......x.......',hat:'..x...x...x...x.',taiko:'x...............'},
    mel:['G5 . C6 . E6 . D6 . C6 . . . G5 . . .','B5 . D6 . G6 . F6 . D6 . . . B5 . . .','C6 . E6 . A6 - - . G6 . E6 . C6 . . .','A5 . C6 . F6 - - . E6 . C6 . A5 . . .',
      'E6 . . . D6 . C6 . G5 . C6 . E6 . G6 .','F6 - - . E6 . D6 . B5 . D6 . G6 . . .','A6 - - . G6 . F6 . E6 . D6 . C6 . A5 .','B5 - - - D6 - - - G6 - - - . . . .']}
};
for(const k in SONGS){const s=SONGS[k];s.melT=s.mel.map(b=>b.trim().split(/\s+/));s.bassT=s.bass.split(/\s+/);}
const music={cur:null,name:null,step:0,next:0,timer:null,gen:0,
  start(){if(!this.timer)this.timer=setInterval(()=>this.tick(),25);},
  play(name){if(name===this.name)return;this.name=name;if(AC)this.load(name);},
  load(name){
    const g=musGain,now=AC.currentTime,gen=++this.gen;
    g.gain.cancelScheduledValues(now);g.gain.setValueAtTime(Math.max(0.0001,g.gain.value),now);g.gain.linearRampToValueAtTime(0.0001,now+0.3);
    this.cur=null;
    setTimeout(()=>{if(gen!==this.gen||!name)return;this.cur=SONGS[name];this.step=0;this.next=AC.currentTime+0.06;const t=AC.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(OPT.bgm?MUS_VOL:0.0001,t+0.4);},330);
  },
  tick(){
    if(!AC||!this.cur)return;const s=this.cur,sd=60/s.bpm/4;
    if(this.next<AC.currentTime-0.5)this.next=AC.currentTime+0.05;
    while(this.next<AC.currentTime+0.14){
      const i=this.step,st=i%16,bar=Math.floor(i/16)%8,loop=Math.floor(i/128),t=this.next+(st%2===1?s.swing*sd:0);
      try{this.sched(s,st,bar,loop,t,sd);}catch(e){}
      this.step++;this.next+=sd;
    }
  },
  sched(s,st,bar,loop,t,sd){
    const ch=s.chords[bar],tok=s.melT[bar][st];
    if(tok&&tok!=='.'&&tok!=='-'){let n=1;while(st+n<16&&s.melT[bar][st+n]==='-')n++;const f=nf(tok);INST[s.lead](t,f,n*sd,s.lv);if(loop%2===1&&s.lead!=='musicbox')INST.musicbox(t,f/2,n*sd,s.lv*0.3);}
    const bt=s.bassT[st];if(bt&&bt!=='.'){const r=chordNotes(ch,2)[0],f=bt==='5'?r*1.4983:bt==='8'?r*2:r;INST.bass(t,f,sd*1.6,s.bv);}
    const cn=chordNotes(ch,4);
    if(s.comp==='arp'){if(st%2===0){const pat=[0,1,2,1,0,2,1,2];INST[s.ci](t,cn[pat[(st/2)%8]%cn.length]*(st>=8?2:1),sd*1.5,s.cv);}}
    else if(s.comp==='stab'){if(st%4===2)cn.slice(0,3).forEach(f=>INST[s.ci](t,f,sd,s.cv*0.7));}
    else if(s.comp==='pad'){if(st===0)cn.slice(0,3).forEach(f=>INST.pad(t,f,sd*15,s.cv));}
    if(s.pad&&st===0)cn.slice(0,3).forEach(f=>INST.pad(t,f/2,sd*15,0.022));
    for(const d in s.drums){if(s.drums[d][st]==='x'){const v={kick:0.5,snare:0.22,hat:st%4===0?0.06:0.035,wood:0.12,taiko:0.45,shaker:st%4===0?0.05:0.025}[d];INST[d](t,v);}}
    if(s.amb&&st===0&&bar%2===0&&Math.random()<0.6)INST.cicada(t+Math.random()*0.5,s.amb==='stream'?0.05:0.03,s.amb);
  }
};
const rain={src:null,g:null,
  start(){if(!AC||this.src)return;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;this.g=AC.createGain();this.g.gain.value=0.0001;lp.connect(this.g);this.g.connect(sfxGain);this.src=noiseSrc(AC.currentTime,0,lp);this.g.gain.linearRampToValueAtTime(0.09,AC.currentTime+2);},
  stop(){if(!this.src)return;const s=this.src,g=this.g;g.gain.linearRampToValueAtTime(0.0001,AC.currentTime+2);setTimeout(()=>{try{s.stop();}catch(e){}},2200);this.src=null;}};
/* ambient night insects (independent of the music) */
const amb={mode:null,timer:null,
  set(m){if(m===this.mode)return;this.mode=m;if(!this.timer&&HAS_DOM)this.timer=setInterval(()=>this.tick(),250);},
  tick(){if(!AC||!OPT.se||!this.mode)return;const t=AC.currentTime+0.05;
    if(this.mode==='night'){if(Math.random()<0.32)ambChirp(t+Math.random()*0.2);if(Math.random()<0.16)ambBell(t+Math.random()*0.2);}
    else if(this.mode==='rain'){if(Math.random()<0.08)ambChirp(t,0.5);}}};
function ambChirp(t,k){k=k||1;const g=AC.createGain(),bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=3600+Math.random()*700;bp.Q.value=14;bp.connect(g);g.connect(sfxGain);noiseSrc(t,0.8,bp);g.gain.setValueAtTime(0.0001,t);
  const n=4+Math.floor(Math.random()*6),v=(0.05+Math.random()*0.05)*k;for(let i=0;i<n;i++){const tt=t+i*0.075;g.gain.exponentialRampToValueAtTime(v,tt+0.015);g.gain.exponentialRampToValueAtTime(0.0001,tt+0.06);}}
function ambBell(t){const g=AC.createGain();g.connect(sfxGain);const f=4200+Math.random()*400;osc('sine',f,t,0.9,g);osc('sine',f*2.01,t,0.9,g);g.gain.setValueAtTime(0.0001,t);
  for(let i=0;i<12;i++){const tt=t+i*0.06;g.gain.exponentialRampToValueAtTime(0.028*(1-i/16),tt+0.02);g.gain.exponentialRampToValueAtTime(0.002,tt+0.055);}g.gain.exponentialRampToValueAtTime(0.0001,t+0.85);}
function setVolumes(){if(!AC)return;musGain.gain.cancelScheduledValues(AC.currentTime);musGain.gain.setTargetAtTime(OPT.bgm&&music.cur?MUS_VOL:0.0001,AC.currentTime,0.05);sfxGain.gain.value=OPT.se?0.5:0;}
