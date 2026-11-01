/* Empire Tycoon — EXTRAS : ta propre crypto + plein d'autres façons de gagner de l'argent */
(function(){
'use strict';
const KEY='empire_extras_v1';
const D=()=>({coin:null,jobs:{},rigs:[0,0,0,0],subs:0,videos:0,deposit:0,vidReady:0});
let X=D();
try{const r=localStorage.getItem(KEY);if(r)X=Object.assign(D(),JSON.parse(r))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(X))}catch(e){}};

const RIGS=[
 {n:'Mineur GPU',i:'🖥️',c:400,r:2.5},
 {n:'Mineur ASIC',i:'⚙️',c:6000,r:40},
 {n:'Ferme de minage',i:'🏭',c:90000,r:650},
 {n:'Centre de données',i:'🛰️',c:1500000,r:11000}];
const JOBS=[
 {id:'liv',n:'Livraison express',i:'🛵',d:10,b:25},
 {id:'free',n:'Mission freelance',i:'💻',d:30,b:90},
 {id:'cons',n:'Consulting',i:'📊',d:60,b:220},
 {id:'contrat',n:'Gros contrat',i:'📝',d:150,b:700}];
const EMOJIS=['🚀','🐶','🐸','🦄','🔥','💎','🌙','🐱'];
const LAUNCH_COST=5000, DEPOSIT_CAP=20000000;
let pick=EMOJIS[0];

/* Revenus passifs ajoutés au revenu principal du jeu */
const _g=getIncomePerSecond;
const rigGps=()=>RIGS.reduce((s,r,i)=>s+X.rigs[i]*r.r,0);
const extraGps=()=>rigGps()+X.subs*0.01+X.deposit*0.0002;
window.getIncomePerSecond=function(){return _g()+extraGps()};

/* Recommencer la partie => reset des extras aussi */
const _rs=window.resetGame;
window.resetGame=function(f){_rs(f);X=D();save();build();upd()};

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fp=p=>p>=1000?fmt(p):p.toFixed(p<1?3:2)+' $';
const spend=c=>{if(state.money<c)return false;state.money-=c;return true};
const coinVal=()=>X.coin?X.coin.held*X.coin.price:0;
const jobReward=j=>Math.floor(j.b+_g()*j.d*0.5);
const rigCost=i=>Math.floor(RIGS[i].c*Math.pow(1.2,X.rigs[i]));
const vidCost=()=>Math.floor(100*Math.pow(1.1,X.videos));
const el=id=>document.getElementById(id);
const cx=()=>window.innerWidth/2;

/* ---------- Style + onglet ---------- */
const st=document.createElement('style');
st.textContent=`.x-sec{margin-bottom:26px}.x-sub{color:var(--text-muted);font-size:.8rem;margin:-6px 0 10px}
.x-prog{height:9px;background:#090b0f;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.08)}
.x-prog>i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--gold-dark),var(--gold-bright));transition:width .3s}
.x-emojis{display:flex;flex-wrap:wrap;gap:8px}.x-emojis button{font-size:1.6rem;background:#12161f;border:2px solid transparent;border-radius:12px;padding:6px 10px;cursor:pointer}
.x-emojis button.on{border-color:var(--gold);background:rgba(245,185,66,.15)}
.x-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.x-row3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.x-inp{background:#090c10;border:1px solid var(--gold);color:var(--gold-bright);font-size:1rem;font-weight:800;padding:10px 12px;border-radius:8px;width:100%;user-select:text;-webkit-user-select:text}
nav{grid-template-columns:repeat(6,1fr)!important;gap:2px!important}.nav-btn{font-size:.66rem!important;padding:8px 0!important}.nav-icon{font-size:1.25rem!important}`;
document.head.appendChild(st);

const panel=document.createElement('div');panel.className='tab-panel';panel.id='tab-extras';
document.querySelector('main').appendChild(panel);
const nb=document.createElement('button');nb.className='nav-btn';
nb.innerHTML='<span class="nav-icon">💼</span><span>Plus</span>';
nb.onclick=function(){switchTab('extras',nb);build();upd()};
document.querySelector('nav').appendChild(nb);

/* ---------- Construction de l'interface ---------- */
function build(){
 const jobs=JOBS.map(j=>`<div class="item-card"><div class="card-header"><div class="card-icon">${j.i}</div><div class="card-info"><h3>${j.n}</h3><p id="xj-r-${j.id}"></p></div><div class="card-count">${j.d}s</div></div><div class="x-prog"><i id="xj-b-${j.id}"></i></div><div class="card-actions"><button class="btn-action" id="xj-btn-${j.id}" onclick="Extras.job('${j.id}')"></button></div></div>`).join('');
 const rigs=RIGS.map((r,i)=>`<div class="item-card"><div class="card-header"><div class="card-icon">${r.i}</div><div class="card-info"><h3>${r.n}</h3><p>+${fmt(r.r)} / sec chacun</p></div><div class="card-count" id="xr-n-${i}">x0</div></div><div class="card-actions"><button class="btn-action" id="xr-btn-${i}" onclick="Extras.rig(${i})"></button></div></div>`).join('');
 panel.innerHTML=`
 <div class="x-sec"><div class="section-title"><span>🪙 Ma propre Crypto</span></div><div id="x-coin"></div></div>
 <div class="x-sec"><div class="section-title"><span>⚡ Jobs rapides</span></div><div class="x-sub">Lance une mission, reviens récupérer la paie (même app fermée).</div><div class="cards-grid" id="x-jobs">${jobs}</div></div>
 <div class="x-sec"><div class="section-title"><span>⛏️ Minage de crypto</span></div><div class="x-sub">Des machines qui minent pour toi, 24h/24.</div><div class="cards-grid">${rigs}</div></div>
 <div class="x-sec"><div class="section-title"><span>🎬 Chaîne YouTube</span></div>
  <div class="item-card"><div class="card-header"><div class="card-icon">📺</div><div class="card-info"><h3>Ta chaîne</h3><p id="x-yt-info"></p></div><div class="card-count" id="x-yt-subs"></div></div><div class="card-actions"><button class="btn-action" id="x-yt-btn" onclick="Extras.video()"></button></div></div></div>
 <div class="x-sec"><div class="section-title"><span>🏦 Compte épargne</span></div>
  <div class="item-card"><div class="card-header"><div class="card-icon">💰</div><div class="card-info"><h3>Épargne sécurisée</h3><p id="x-sv-info"></p></div></div>
  <div class="x-row3"><button class="btn-action" onclick="Extras.dep(.25)">Déposer 25%</button><button class="btn-action" onclick="Extras.dep(1)">Tout déposer</button><button class="btn-action btn-secondary" onclick="Extras.wd()">Retirer</button></div></div></div>`;
 lastCoin=undefined;renderCoin();
}

let lastCoin;
function renderCoin(){
 const box=el('x-coin');if(!box)return;
 const has=!!X.coin;if(lastCoin===has)return;lastCoin=has;
 if(!has){
  box.innerHTML=`<div class="market-container"><div class="x-sub" style="margin:0">Crée ta crypto, fais monter son prix avec du marketing, puis revends tes tokens. Attention : les scandales existent !</div>
  <input class="x-inp" id="x-name" maxlength="16" placeholder="Nom de ta crypto (ex : MoonCoin)">
  <input class="x-inp" id="x-sym" maxlength="4" placeholder="Symbole (ex : MOON)" style="text-transform:uppercase">
  <div class="x-emojis" id="x-emojis">${EMOJIS.map(e=>`<button class="${e===pick?'on':''}" onclick="Extras.emoji('${e}')">${e}</button>`).join('')}</div>
  <button class="btn-action" id="x-launch" onclick="Extras.launch()">🚀 Lancer ma crypto • ${fmt(LAUNCH_COST)}</button></div>`;
 }else{
  const c=X.coin;
  box.innerHTML=`<div class="market-container"><div class="card-header"><div class="card-icon">${c.emoji}</div><div class="card-info"><h3>${esc(c.name)} (${esc(c.sym)})</h3><p>Ta crypto</p></div></div>
  <div class="chart-box" style="height:130px"><canvas id="x-c-cv"></canvas></div>
  <div class="market-hud"><div class="stat-box"><span class="stat-label">Prix</span><span class="stat-val" id="x-c-price"></span></div><div class="stat-box"><span class="stat-label">Tes tokens</span><span class="stat-val" id="x-c-held"></span></div><div class="stat-box"><span class="stat-label">Valeur</span><span class="stat-val" id="x-c-val"></span></div><div class="stat-box"><span class="stat-label">Hype</span><span class="stat-val" id="x-c-hypev"></span></div></div>
  <div class="x-prog"><i id="x-c-hype"></i></div>
  <div class="x-row"><button class="btn-action btn-secondary" id="x-mk" onclick="Extras.mk()"></button><button class="btn-action btn-secondary" id="x-inf" onclick="Extras.inf()"></button></div>
  <div class="x-row"><button class="btn-action btn-buy" onclick="Extras.buy(.25)">ACHETER 25% cash</button><button class="btn-action btn-buy" onclick="Extras.buy(1)">ACHETER MAX</button><button class="btn-action btn-sell" onclick="Extras.sell(.25)">VENDRE 25%</button><button class="btn-action btn-sell" onclick="Extras.sell(1)">TOUT VENDRE</button></div></div>`;
 }
}

/* ---------- Mise à jour de l'affichage ---------- */
function upd(){
 if(!panel.classList.contains('active'))return;
 renderCoin();
 const now=Date.now(),m=state.money;
 if(X.coin){const c=X.coin;
  el('x-c-price').textContent=fp(c.price);el('x-c-held').textContent=Math.floor(c.held).toLocaleString('fr-FR');
  el('x-c-val').textContent=fmt(coinVal());el('x-c-hypev').textContent=Math.round(c.hype)+'%';el('x-c-hype').style.width=c.hype+'%';
  const mc=Math.floor(400+coinVal()*.03),ic=Math.floor(2500+coinVal()*.06);
  el('x-mk').textContent='📣 Marketing • '+fmt(mc);el('x-mk').disabled=m<mc;
  el('x-inf').textContent='🤳 Influenceur • '+fmt(ic);el('x-inf').disabled=m<ic;
  drawCoin();
 }else{const b=el('x-launch');if(b)b.disabled=m<LAUNCH_COST}
 JOBS.forEach(j=>{const end=X.jobs[j.id],btn=el('xj-btn-'+j.id),bar=el('xj-b-'+j.id);
  el('xj-r-'+j.id).textContent='Gain : +'+fmt(jobReward(j));
  if(!end){btn.textContent='Lancer la mission';btn.disabled=false;bar.style.width='0'}
  else if(now<end){const left=Math.ceil((end-now)/1000);btn.textContent='En cours… '+left+'s';btn.disabled=true;bar.style.width=(100-(end-now)/(j.d*10))+'%'}
  else{btn.textContent='💰 Récupérer +'+fmt(jobReward(j));btn.disabled=false;bar.style.width='100%'}});
 RIGS.forEach((r,i)=>{el('xr-n-'+i).textContent='x'+X.rigs[i];const b=el('xr-btn-'+i);b.textContent='Acheter • '+fmt(rigCost(i));b.disabled=m<rigCost(i)});
 el('x-yt-info').textContent='+'+(X.subs*0.01).toFixed(1)+' $ / sec • '+X.videos+' vidéos';
 el('x-yt-subs').textContent=Math.floor(X.subs).toLocaleString('fr-FR')+' 👥';
 const yb=el('x-yt-btn'),wait=Math.ceil((X.vidReady-now)/1000);
 yb.textContent=wait>0?'Montage… '+wait+'s':'🎥 Poster une vidéo • '+fmt(vidCost());yb.disabled=wait>0||m<vidCost();
 el('x-sv-info').textContent='Épargné : '+fmt(X.deposit)+' • +'+fmt(X.deposit*0.0002)+' / sec (max '+fmt(DEPOSIT_CAP)+')';
}
function drawCoin(){
 const cv=el('x-c-cv');if(!cv||!X.coin)return;const p=cv.parentElement;
 cv.width=p.clientWidth||300;cv.height=p.clientHeight||130;
 const c=cv.getContext('2d'),h=X.coin.hist,w=cv.width,H=cv.height;
 const mn=Math.min(...h)*.95,mx=Math.max(...h)*1.05,rg=Math.max(1e-9,mx-mn);
 c.beginPath();h.forEach((v,i)=>{const x=i/(h.length-1)*(w-16)+8,y=H-10-((v-mn)/rg)*(H-20);i?c.lineTo(x,y):c.moveTo(x,y)});
 c.strokeStyle=h[h.length-1]>=h[0]?'#10b981':'#ef4444';c.lineWidth=3;c.stroke();
}

/* ---------- Marché de ta crypto ---------- */
setInterval(()=>{
 const c=X.coin;if(!c)return;
 const drift=(c.hype-35)/35*0.008,noise=(Math.random()-.5)*0.07;
 c.price=Math.max(0.01,c.price*(1+drift+noise));
 const r=Math.random(),pump=0.012+c.hype/100*0.012;
 if(r<pump){c.price*=1.5;c.hype=Math.min(100,c.hype+10);showToast('🚀 '+c.sym+' devient viral ! +50%')}
 else if(r<pump+0.014){c.price*=0.55;c.hype=Math.max(0,c.hype-20);showToast('💥 Scandale ! '+c.sym+' s’effondre (-45%)')}
 c.hype=Math.max(0,Math.min(100,c.hype*0.985));
 c.hist.push(c.price);if(c.hist.length>60)c.hist.shift();
},1200);
setInterval(upd,400);
setInterval(save,2000);
document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
window.addEventListener('pagehide',save);

/* ---------- Actions du joueur ---------- */
window.Extras={
 emoji(e){pick=e;document.querySelectorAll('#x-emojis button').forEach(b=>b.classList.toggle('on',b.textContent===e))},
 launch(){
  const name=(el('x-name').value.trim()||'MaCoin').slice(0,16);
  const sym=(el('x-sym').value.toUpperCase().replace(/[^A-Z]/g,'')||name.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3)||'COIN').slice(0,4);
  if(!spend(LAUNCH_COST)){showToast('Pas assez d’argent pour lancer ta crypto');return}
  X.coin={name,sym,emoji:pick,price:0.5,hist:Array(40).fill(0.5),hype:20,held:4000};
  SoundFX.fanfare();spawnConfetti();showToast('🎉 '+name+' ('+sym+') est lancée !');
  lastCoin=undefined;renderCoin();updateHUD();save();upd();
 },
 mk(){const c=X.coin,cost=Math.floor(400+coinVal()*.03);if(!spend(cost))return;
  c.hype=Math.min(100,c.hype+15);c.price*=1.02;SoundFX.buy();showToast('📣 Campagne lancée !');updateHUD();upd()},
 inf(){const c=X.coin,cost=Math.floor(2500+coinVal()*.06);if(!spend(cost))return;
  if(Math.random()<.35){c.hype=Math.min(100,c.hype+5);SoundFX.loss();showToast('😬 L’influenceur a fait un flop…')}
  else{c.hype=Math.min(100,c.hype+35);c.price*=1.08;SoundFX.coin();spawnParticles(cx(),300,14,['🤳','🚀','✨']);showToast('🤳 Ton influenceur fait le buzz !')}
  updateHUD();upd()},
 buy(f){const c=X.coin,amt=Math.floor(state.money*f),q=Math.floor(amt/c.price);if(q<1)return;
  const cost=q*c.price;state.money-=cost;c.held+=q;c.price*=1+Math.min(.25,cost/150000);SoundFX.buy();updateHUD();upd()},
 sell(f){const c=X.coin,q=Math.floor(c.held*f);if(q<1)return;
  const rev=q*c.price;c.held-=q;c.price=Math.max(0.01,c.price*(1-Math.min(.25,rev/150000)));
  addMoney(rev,cx(),300,true);SoundFX.coin();spawnParticles(cx(),300,12,['🪙','💵']);updateHUD();upd()},
 job(id){const j=JOBS.find(x=>x.id===id),end=X.jobs[id],now=Date.now();
  if(!end){X.jobs[id]=now+j.d*1000;SoundFX.buy()}
  else if(now>=end){const g=jobReward(j);delete X.jobs[id];addMoney(g,cx(),300,true);SoundFX.coin();spawnParticles(cx(),300,10,['💵','🪙'])}
  save();updateHUD();upd()},
 rig(i){const c=rigCost(i);if(!spend(c))return;X.rigs[i]++;SoundFX.buy();spawnParticles(cx(),300,8,[RIGS[i].i,'⚡']);updateHUD();upd()},
 video(){const now=Date.now();if(now<X.vidReady)return;const c=vidCost();if(!spend(c))return;
  const viral=Math.random()<.06,gain=Math.round((10+Math.random()*40)*(viral?8:1));
  X.subs+=gain;X.videos++;X.vidReady=now+4000;SoundFX.coin();
  showToast(viral?'🔥 Vidéo virale ! +'+gain+' abonnés':'🎥 +'+gain+' abonnés');updateHUD();upd()},
 dep(f){const a=Math.min(Math.floor(state.money*f),DEPOSIT_CAP-X.deposit);if(a<1)return;state.money-=a;X.deposit+=a;SoundFX.buy();updateHUD();upd()},
 wd(){if(X.deposit<1)return;state.money+=X.deposit;X.deposit=0;SoundFX.coin();updateHUD();upd()}
};
build();
})();
