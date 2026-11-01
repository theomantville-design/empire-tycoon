/* Empire Tycoon — EXTRAS : ta propre crypto + plein d'autres façons de gagner de l'argent */
(function(){
'use strict';
const KEY='empire_extras_v1';
const D=()=>({coin:null,jobs:{},rigs:[0,0,0,0],subs:0,videos:0,deposit:0,vidReady:0,emp:[0,0,0,0],issues:[],occ:null,nid:1,rent:[1,1,1,1,1],rep:60,morale:60,raise:0,insured:false,debt:0,mk:1,mkEnd:0,pubReady:0});
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

/* ===== Réalisme : employés, locataires, problèmes ===== */
const EMP=[
 {n:'Gestionnaire immobilier',i:'🧑‍💼',c:2000,b:3,p:.004,d:'Trouve des locataires tout seul'},
 {n:'Réparateur',i:'🔧',c:1500,b:2,p:.003,d:'Répare les problèmes automatiquement'},
 {n:'Commercial',i:'📈',c:5000,b:10,p:.008,d:'+8% de revenus chacun (max 5)'},
 {n:'Agent de sécurité',i:'🛡️',c:3000,b:4,p:.004,d:'-15% de problèmes chacun (max 4)'}];
const MAXE=[99,99,5,4];
const PROB_TXT=['Fuite d’eau','Panne d’électricité','Chauffage en panne','Toit endommagé','Loyer impayé','Cambriolage'];
const BIZ_TXT=['Panne de machine','Employé absent','Vol de marchandises','Contrôle sanitaire','Grève','Panne informatique'];
const lastCnt=[];
const occOf=i=>X.occ?X.occ[i]:state.realEstate[i].count;
const empCost=i=>Math.floor(EMP[i].c*Math.pow(1.3,X.emp[i]));
const salaryEach=i=>(EMP[i].b+_g()*EMP[i].p)*(1+0.2*X.raise);
const salaries=()=>EMP.reduce((s,e,i)=>s+X.emp[i]*salaryEach(i),0);
function lossGps(){let L=0;const mm=(1+state.managerLevel*.25)*0.4;
 state.realEstate.forEach((r,i)=>{if(!r.count)return;const unit=r.baseRent*(1+r.reno*.5)*mm,occ=occOf(i),vac=Math.max(0,r.count-occ),iss=X.issues.filter(q=>q.kind==='prop'&&q.idx===i).length;L+=Math.min(r.count,vac+Math.min(occ,iss))*unit});
 state.businesses.forEach((b,i)=>{if(!b.count)return;const iss=X.issues.filter(q=>q.kind==='biz'&&q.idx===i).length;L+=Math.min(b.count,iss)*b.baseIncome*mm});
 return L}
const RENTM=[.75,1,1.3],RENTP=[.95,.75,.45],RENTL=[.5,1,2],RENTN=['Loyer bas','Loyer normal','Loyer élevé'];
const MKT=[{n:'Crise immobilière',m:.85,i:'📉'},{n:'Marché stable',m:1,i:'➖'},{n:'Boom immobilier',m:1.15,i:'📈'}];
function econ(){
 const mm=(1+state.managerLevel*.25)*0.4;
 let propG=0,propL=0,bizG=0,bizL=0,rentAdj=0;
 state.realEstate.forEach((r,i)=>{if(!r.count)return;const unit=r.baseRent*(1+r.reno*.5)*mm,occ=occOf(i),vac=Math.max(0,r.count-occ),iss=X.issues.filter(q=>q.kind==='prop'&&q.idx===i).length,lost=Math.min(r.count,vac+Math.min(occ,iss));
  propG+=r.count*unit;propL+=lost*unit;rentAdj+=(r.count-lost)*unit*(RENTM[X.rent[i]]-1)});
 state.businesses.forEach((b,i)=>{if(!b.count)return;const iss=X.issues.filter(q=>q.kind==='biz'&&q.idx===i).length;bizG+=b.count*b.baseIncome*mm;bizL+=Math.min(b.count,iss)*b.baseIncome*mm});
 const g=_g(),mk=MKT[X.mk].m,repM=0.8+0.4*X.rep/100,tot=X.emp.reduce((a,b)=>a+b,0),prod=tot?0.85+0.15*X.morale/100:1;
 let inc=g-propL-bizL+rentAdj+(mk-1)*(propG-propL)+(repM-1)*(bizG-bizL);
 inc*=(1+0.08*X.emp[2])*prod;
 const charges=Math.max(0,inc)*0.10,sal=salaries(),intr=X.debt*0.0002,ins=X.insured?g*0.03:0,extra=extraGps();
 return {g,loss:propL+bizL,inc,charges,sal,intr,ins,extra,mk,repM,prod,net:Math.max(0,inc-charges+extra-sal-intr-ins)};
}
window.getIncomePerSecond=function(){return econ().net};
const issueCost=q=>Math.floor((q.kind==='prop'?state.realEstate[q.idx].baseCost*.02+40:state.businesses[q.idx].baseCost*.03+40)*(X.insured?.4:1));
const tenantCost=i=>Math.floor(30+state.realEstate[i].baseCost*.03);
function autoTenant(){const v=[];state.realEstate.forEach((r,i)=>{if(r.count>occOf(i))v.push(i)});if(v.length){X.occ[v[Math.floor(Math.random()*v.length)]]++}}
function fixIssue(id,auto){const k=X.issues.findIndex(q=>q.id===id);if(k<0)return;const q=X.issues[k];
 if(!auto&&!spend(issueCost(q)))return;X.issues.splice(k,1);if(!auto){SoundFX.buy();updateHUD()}}
function worldTick(){
 if(!X.occ)X.occ=state.realEstate.map(r=>r.count);
 state.realEstate.forEach((r,i)=>{if(lastCnt[i]!==undefined&&r.count>lastCnt[i])showToast('🏠 Nouveau bien vide : trouve un locataire !');lastCnt[i]=r.count;if(X.occ[i]>r.count)X.occ[i]=r.count});
 const red=Math.min(.6,X.emp[3]*.15);
 if(X.issues.length<8&&Math.random()<0.035*(1-red)){
  const pool=[];state.realEstate.forEach((r,i)=>{for(let k=0;k<Math.min(r.count,4);k++)pool.push(['prop',i])});
  state.businesses.forEach((b,i)=>{for(let k=0;k<Math.min(b.count,4);k++)pool.push(['biz',i])});
  if(pool.length){const [kind,idx]=pool[Math.floor(Math.random()*pool.length)],arr=kind==='prop'?PROB_TXT:BIZ_TXT,
   nm=kind==='prop'?state.realEstate[idx].name:state.businesses[idx].name,text=arr[Math.floor(Math.random()*arr.length)];
   X.issues.push({id:X.nid++,kind,idx,text,t:Date.now()});showToast('⚠️ '+text+' – '+nm)}}
 const now=Date.now();
 for(let k=X.issues.length-1;k>=0;k--){const q=X.issues[k];
  if(q.kind==='prop'&&now-q.t>90000&&Math.random()<.08){X.issues.splice(k,1);if(X.occ[q.idx]>0)X.occ[q.idx]--;showToast('📦 Un locataire est parti à cause du problème non réglé')}}
 X.occ.forEach((n,i)=>{if(n>0&&Math.random()<0.004*RENTL[X.rent[i]]*Math.min(n,3)){X.occ[i]--;showToast('📦 Un locataire a déménagé ('+state.realEstate[i].name+')')}});
 if(now>X.mkEnd){const r=Math.random(),ph=r<.25?0:r<.75?1:2;if(ph!==X.mk||X.mkEnd)showToast(MKT[ph].i+' '+MKT[ph].n+(ph===0?' : loyers -15%':ph===2?' : loyers +15%':''));X.mk=ph;X.mkEnd=now+(90+Math.random()*60)*1000}
 const tot=X.emp.reduce((a,b)=>a+b,0);
 X.rep+=(Math.max(0,Math.min(100,70-6*X.issues.length+4*X.emp[2]))-X.rep)*0.04;
 if(tot){X.morale+=(Math.max(0,Math.min(100,55+9*X.raise-4*X.issues.length))-X.morale)*0.04;
  if(X.morale<25&&Math.random()<.03){const roles=[];X.emp.forEach((n,i)=>{if(n>0)roles.push(i)});const r=roles[Math.floor(Math.random()*roles.length)];X.emp[r]--;showToast('😠 '+EMP[r].n+' a démissionné (moral trop bas)')}}
 else X.morale+=(60-X.morale)*0.04;
 X.rep=Math.max(0,Math.min(100,X.rep));X.morale=Math.max(0,Math.min(100,X.morale));
 for(let k=0;k<X.emp[0];k++)if(Math.random()<.15)autoTenant();
 for(let k=0;k<X.emp[1];k++)if(Math.random()<.2&&X.issues.length)fixIssue(X.issues[0].id,true);
}

/* Recommencer la partie => reset des extras aussi */
const _rs=window.resetGame;
window.resetGame=function(f){_rs(f);X=D();X.occ=[0,0,0,0,0];lastCnt.length=0;save();ensureAssets();build();upd()};
const _ld=window.loadGame;window.loadGame=function(){_ld();ensureAssets();if(X.occ===null)X.occ=state.realEstate.map(r=>r.count)};

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fp=p=>p>=1000?fmt(p):p.toFixed(p<1?3:2)+' $';
const spend=c=>{if(state.money<c)return false;state.money-=c;return true};
const A=()=>state.assets.find(a=>a.id==='mycoin');
const coinVal=()=>{const a=A();return X.coin&&a?a.owned*a.price:0};
const NEWCOINS=[
 {id:'eth',name:'Etheria (ETHA)',price:1200,volatility:.09},
 {id:'sol',name:'SolarChain (SLR)',price:85,volatility:.11},
 {id:'ai',name:'AI Token (AIT)',price:320,volatility:.13},
 {id:'doge',name:'DogeMoon (DGM)',price:12,volatility:.17},
 {id:'shib',name:'ShibaRocket (SHR)',price:7,volatility:.22},
 {id:'nft',name:'NFT Galaxy (NFTG)',price:45,volatility:.25},
 {id:'usds',name:'StableCoin (USDS)',price:100,volatility:.004}];
function mkHist(p,v){const h=[];for(let i=0;i<45;i++){p=Math.max(5,p*(1+(Math.random()-.49)*v));h.push(p)}return h}
function ensureAssets(){
 if(!state||!state.assets)return;
 NEWCOINS.forEach(n=>{if(!state.assets.some(a=>a.id===n.id)){const h=mkHist(n.price,n.volatility);state.assets.push({id:n.id,name:n.name,price:h[h.length-1],history:h,volatility:n.volatility,owned:0,avgPrice:0})}});
 const c=X.coin;
 if(c){let a=A();
  if(!a){const p=c.price||5;a={id:'mycoin',name:'',price:p,history:c.hist||Array(45).fill(p),volatility:0,owned:c.held||0,avgPrice:p};state.assets.push(a)}
  if(c.held!==undefined){delete c.held;delete c.price;delete c.hist}
  a.name=c.emoji+' '+c.name+' ('+c.sym+')';a.volatility=0}
}
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
const emps=EMP.map((e,i)=>`<div class="item-card"><div class="card-header"><div class="card-icon">${e.i}</div><div class="card-info"><h3>${e.n}</h3><p>${e.d}</p></div><div class="card-count" id="xe-n-${i}">x0</div></div><div class="x-sub" style="margin:0" id="xe-s-${i}"></div><div class="x-row"><button class="btn-action" id="xe-h-${i}" onclick="Extras.hire(${i})"></button><button class="btn-action btn-sell" id="xe-f-${i}" onclick="Extras.fire(${i})">Licencier</button></div></div>`).join('');
 const tens=state.realEstate.map((r,i)=>`<div class="item-card" id="xt-card-${i}" style="display:none"><div class="card-header"><div class="card-icon">${r.icon}</div><div class="card-info"><h3>${r.name}</h3><p id="xt-i-${i}"></p></div><div class="card-count" id="xt-n-${i}"></div></div><div class="x-row3">${[0,1,2].map(l=>`<button class="chip-btn" id="xt-rb-${i}-${l}" onclick="Extras.rent(${i},${l})">${RENTN[l]}</button>`).join('')}</div><div class="card-actions"><button class="btn-action" id="xt-btn-${i}" onclick="Extras.tenant(${i})"></button></div></div>`).join('');
 const rigs=RIGS.map((r,i)=>`<div class="item-card"><div class="card-header"><div class="card-icon">${r.i}</div><div class="card-info"><h3>${r.n}</h3><p>+${fmt(r.r)} / sec chacun</p></div><div class="card-count" id="xr-n-${i}">x0</div></div><div class="card-actions"><button class="btn-action" id="xr-btn-${i}" onclick="Extras.rig(${i})"></button></div></div>`).join('');
 panel.innerHTML=`
 <div class="x-sec"><div class="section-title"><span>📊 Gestion de l’empire</span></div>
  <div class="item-card"><div class="x-sub" style="margin:0" id="xg-rept">⭐ Réputation</div><div class="x-prog"><i id="xg-rep"></i></div>
  <div class="x-sub" style="margin:8px 0 0" id="xg-mort">😊 Moral de l’équipe</div><div class="x-prog"><i id="xg-mor"></i></div>
  <div class="x-sub" style="margin:8px 0 0" id="xg-mk"></div></div>
  <div class="item-card" style="margin-top:12px"><div class="x-sub" style="margin:0;line-height:1.7" id="xg-bil"></div></div>
  <div class="x-row" style="margin-top:12px"><button class="btn-action" id="xg-pub" onclick="Extras.pub()"></button><button class="btn-action" id="xg-prime" onclick="Extras.prime()"></button><button class="btn-action" id="xg-raise" onclick="Extras.raise()"></button><button class="btn-action btn-secondary" id="xg-ins" onclick="Extras.insure()"></button></div>
  <div class="item-card" style="margin-top:12px"><div class="card-header"><div class="card-icon">🏦</div><div class="card-info"><h3>Prêt bancaire</h3><p id="xg-debt"></p></div></div>
  <div class="x-row"><button class="btn-action" id="xg-b1" onclick="Extras.borrow(.25)"></button><button class="btn-action" id="xg-b2" onclick="Extras.borrow(1)"></button><button class="btn-action btn-secondary" id="xg-r1" onclick="Extras.repay(.25)">Rembourser 25%</button><button class="btn-action btn-secondary" id="xg-r2" onclick="Extras.repay(1)">Tout rembourser</button></div></div></div>
 <div class="x-sec"><div class="section-title"><span>👔 Mes employés</span></div><div class="x-sub" id="x-sal"></div><div class="cards-grid">${emps}</div></div>
 <div class="x-sec"><div class="section-title"><span>⚠️ Problèmes en cours</span></div><div class="x-sub">Un problème non réglé te fait perdre des revenus.</div><div class="cards-grid" id="x-issues"></div></div>
 <div class="x-sec"><div class="section-title"><span>🏠 Locataires</span></div><div class="x-sub">Un bien vide ne rapporte rien : cherche des locataires ou engage un gestionnaire.</div><div class="cards-grid">${tens}</div></div>
 <div class="x-sec"><div class="section-title"><span>🪙 Ma propre Crypto</span></div><div id="x-coin"></div></div>
 <div class="x-sec"><div class="section-title"><span>⚡ Jobs rapides</span></div><div class="x-sub">Lance une mission, reviens récupérer la paie (même app fermée).</div><div class="cards-grid" id="x-jobs">${jobs}</div></div>
 <div class="x-sec"><div class="section-title"><span>⛏️ Minage de crypto</span></div><div class="x-sub">Des machines qui minent pour toi, 24h/24.</div><div class="cards-grid">${rigs}</div></div>
 <div class="x-sec"><div class="section-title"><span>🎬 Chaîne YouTube</span></div>
  <div class="item-card"><div class="card-header"><div class="card-icon">📺</div><div class="card-info"><h3>Ta chaîne</h3><p id="x-yt-info"></p></div><div class="card-count" id="x-yt-subs"></div></div><div class="card-actions"><button class="btn-action" id="x-yt-btn" onclick="Extras.video()"></button></div></div></div>
 <div class="x-sec"><div class="section-title"><span>🏦 Compte épargne</span></div>
  <div class="item-card"><div class="card-header"><div class="card-icon">💰</div><div class="card-info"><h3>Épargne sécurisée</h3><p id="x-sv-info"></p></div></div>
  <div class="x-row3"><button class="btn-action" onclick="Extras.dep(.25)">Déposer 25%</button><button class="btn-action" onclick="Extras.dep(1)">Tout déposer</button><button class="btn-action btn-secondary" onclick="Extras.wd()">Retirer</button></div></div></div>`;
 lastCoin=undefined;lastSig=null;renderCoin();
}

let lastCoin,lastSig=null;
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
 updWorld(m);
 if(X.coin&&A()){const c=X.coin,a=A();
  el('x-c-price').textContent=fp(a.price);el('x-c-held').textContent=Math.floor(a.owned).toLocaleString('fr-FR');
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
function updWorld(m){

 const E=econ(),cap=Math.floor(10000+_g()*600),tot=X.emp.reduce((a,b)=>a+b,0);
 el('x-sal').textContent='Salaires : -'+fmt(E.sal)+' / sec'+(X.raise?' (augmentation niv. '+X.raise+')':'');
 el('xg-rep').style.width=X.rep+'%';el('xg-rept').textContent='⭐ Réputation des clients : '+Math.round(X.rep)+'% (revenus des entreprises '+(E.repM>=1?'+':'')+Math.round((E.repM-1)*100)+'%)';
 el('xg-mor').style.width=X.morale+'%';el('xg-mort').textContent='😊 Moral de l’équipe : '+Math.round(X.morale)+'%'+(tot?(X.morale<25?' — ils vont démissionner !':X.morale<45?' — équipe démotivée':''):' (aucun employé)');
 el('xg-mk').textContent=MKT[X.mk].i+' '+MKT[X.mk].n+' : loyers '+(X.mk===0?'-15%':X.mk===2?'+15%':'normaux');
 el('xg-bil').innerHTML='<b>Bilan par seconde</b><br>Revenus : +'+fmt(E.g)+'<br>Pertes (vide, pannes) : -'+fmt(E.loss)+'<br>Charges (entretien, énergie) : -'+fmt(E.charges)+'<br>Salaires : -'+fmt(E.sal)+'<br>Intérêts du prêt : -'+fmt(E.intr)+(X.insured?'<br>Assurance : -'+fmt(E.ins):'')+'<br><b style="color:var(--green-bright)">Net : +'+fmt(E.net)+' / sec</b>';
 const pc=Math.floor(500+_g()*45),prc=Math.floor(E.sal*40+200),rc=Math.floor(3000*Math.pow(2.5,X.raise)),pw=Math.ceil((X.pubReady-Date.now())/1000);
 el('xg-pub').textContent=pw>0?'📢 Pub… '+pw+'s':'📢 Pub locale • '+fmt(pc);el('xg-pub').disabled=pw>0||m<pc;
 el('xg-prime').textContent='🎁 Prime équipe • '+fmt(prc);el('xg-prime').disabled=!tot||m<prc;
 el('xg-raise').textContent=X.raise>=5?'💶 Augmentation max':'💶 Augmenter salaires • '+fmt(rc);el('xg-raise').disabled=X.raise>=5||m<rc;
 el('xg-ins').textContent=X.insured?'🛡️ Assurance : ACTIVE':'🛡️ Prendre l’assurance';
 el('xg-debt').textContent='Dette : '+fmt(X.debt)+' • intérêts -'+fmt(X.debt*0.0002)+' / sec • plafond '+fmt(cap);
 const bc=Math.max(0,Math.floor(cap*.25)),bm=Math.max(0,cap-X.debt);
 el('xg-b1').textContent='Emprunter '+fmt(Math.min(bc,bm));el('xg-b1').disabled=bm<1;el('xg-b2').textContent='Emprunter max';el('xg-b2').disabled=bm<1;
 el('xg-r1').disabled=X.debt<1||m<1;el('xg-r2').disabled=X.debt<1||m<X.debt;
 EMP.forEach((e,i)=>{el('xe-n-'+i).textContent='x'+X.emp[i];
  el('xe-s-'+i).textContent=X.emp[i]?'Salaire : '+fmt(salaryEach(i))+' / sec chacun':'Salaire : '+fmt(salaryEach(i))+' / sec';
  const h=el('xe-h-'+i);h.textContent='Engager • '+fmt(empCost(i));h.disabled=m<empCost(i)||X.emp[i]>=MAXE[i];el('xe-f-'+i).disabled=!X.emp[i]});
 const sig=X.issues.map(q=>q.id).join(',');
 if(sig!==lastSig){lastSig=sig;const box=el('x-issues');
  box.innerHTML=X.issues.length?X.issues.map(q=>{const nm=q.kind==='prop'?state.realEstate[q.idx]:state.businesses[q.idx];
   return `<div class="item-card"><div class="card-header"><div class="card-icon">⚠️</div><div class="card-info"><h3>${q.text}</h3><p style="color:#fca5a5">${nm.name}</p></div></div><div class="card-actions"><button class="btn-action btn-secondary" id="xi-b-${q.id}" onclick="Extras.fix(${q.id})"></button></div></div>`}).join('')
   :'<div class="item-card"><div class="card-header"><div class="card-icon">✅</div><div class="card-info"><h3>Tout va bien</h3><p>Aucun problème pour le moment</p></div></div></div>'}
 X.issues.forEach(q=>{const b=el('xi-b-'+q.id);if(b){const c=issueCost(q);b.textContent='🔧 Réparer • '+fmt(c);b.disabled=m<c}});
 state.realEstate.forEach((r,i)=>{const card=el('xt-card-'+i);card.style.display=r.count?'':'none';if(!r.count)return;
  const occ=occOf(i);el('xt-n-'+i).textContent=occ+'/'+r.count;
  el('xt-i-'+i).textContent=occ>=r.count?'Tous les logements sont loués':(r.count-occ)+' vide(s) – aucun loyer';
  [0,1,2].forEach(l=>{const rb=el('xt-rb-'+i+'-'+l);if(rb){rb.style.background=X.rent[i]===l?'var(--gold)':'';rb.style.color=X.rent[i]===l?'#000':''}});
  const b=el('xt-btn-'+i);b.textContent='Chercher un locataire • '+fmt(tenantCost(i));b.disabled=occ>=r.count||m<tenantCost(i)})
}
function drawCoin(){
 const cv=el('x-c-cv');if(!cv||!X.coin||!A())return;const p=cv.parentElement;
 cv.width=p.clientWidth||300;cv.height=p.clientHeight||130;
 const c=cv.getContext('2d'),h=A().history,w=cv.width,H=cv.height;
 const mn=Math.min(...h)*.95,mx=Math.max(...h)*1.05,rg=Math.max(1e-9,mx-mn);
 c.beginPath();h.forEach((v,i)=>{const x=i/(h.length-1)*(w-16)+8,y=H-10-((v-mn)/rg)*(H-20);i?c.lineTo(x,y):c.moveTo(x,y)});
 c.strokeStyle=h[h.length-1]>=h[0]?'#10b981':'#ef4444';c.lineWidth=3;c.stroke();
}

/* ---------- Marché de ta crypto ---------- */
setInterval(()=>{
 const c=X.coin,a=A();if(!c||!a)return;
 const drift=(c.hype-35)/35*0.008,noise=(Math.random()-.5)*0.07;
 a.price=Math.max(1,a.price*(1+drift+noise));
 const r=Math.random(),pump=0.012+c.hype/100*0.012;
 if(r<pump){a.price*=1.5;c.hype=Math.min(100,c.hype+10);showToast('🚀 '+c.sym+' devient viral ! +50%')}
 else if(r<pump+0.014){a.price=Math.max(1,a.price*0.55);c.hype=Math.max(0,c.hype-20);showToast('💥 Scandale ! '+c.sym+' s’effondre (-45%)')}
 c.hype=Math.max(0,Math.min(100,c.hype*0.985));
},1200);
setInterval(worldTick,1200);
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
  X.coin={name,sym,emoji:pick,hype:20};ensureAssets();const na=A();na.price=5;na.history=Array(45).fill(5);na.owned=400;na.avgPrice=5;
  SoundFX.fanfare();spawnConfetti();showToast('🎉 '+name+' ('+sym+') est lancée ! Retrouve-la aussi dans Bourse');
  lastCoin=undefined;renderCoin();updateHUD();save();upd();
 },
 mk(){const c=X.coin,cost=Math.floor(400+coinVal()*.03);if(!spend(cost))return;
  c.hype=Math.min(100,c.hype+15);A().price*=1.02;SoundFX.buy();showToast('📣 Campagne lancée !');updateHUD();upd()},
 inf(){const c=X.coin,cost=Math.floor(2500+coinVal()*.06);if(!spend(cost))return;
  if(Math.random()<.35){c.hype=Math.min(100,c.hype+5);SoundFX.loss();showToast('😬 L’influenceur a fait un flop…')}
  else{c.hype=Math.min(100,c.hype+35);A().price*=1.08;SoundFX.coin();spawnParticles(cx(),300,14,['🤳','🚀','✨']);showToast('🤳 Ton influenceur fait le buzz !')}
  updateHUD();upd()},
 buy(f){const a=A();if(!a)return;const amt=Math.floor(state.money*f),imp=Math.min(.25,amt/150000),unit=a.price*(1+imp/2),q=Math.floor(amt/unit);if(q<1)return;
  const cost=q*unit;state.money-=cost;a.avgPrice=(a.owned*a.avgPrice+cost)/(a.owned+q);a.owned+=q;a.price*=1+imp;SoundFX.buy();updateHUD();upd()},
 sell(f){const a=A();if(!a)return;const q=Math.floor(a.owned*f);if(q<1)return;
  const imp=Math.min(.25,q*a.price/150000),rev=q*a.price*(1-imp/2);a.owned-=q;if(a.owned<=0)a.avgPrice=0;a.price=Math.max(1,a.price*(1-imp));
  addMoney(rev,cx(),300,true);SoundFX.coin();spawnParticles(cx(),300,12,['🪙','💵']);updateHUD();upd()},
 pub(){const c=Math.floor(500+_g()*45);if(Date.now()<X.pubReady||!spend(c))return;X.rep=Math.min(100,X.rep+15);X.pubReady=Date.now()+20000;SoundFX.coin();showToast('📢 Ta pub fait venir de nouveaux clients !');updateHUD();save();upd()},
 prime(){const c=Math.floor(econ().sal*40+200);if(!spend(c))return;X.morale=Math.min(100,X.morale+25);SoundFX.coin();showToast('🎁 Ton équipe est ravie de sa prime !');updateHUD();save();upd()},
 raise(){const c=Math.floor(3000*Math.pow(2.5,X.raise));if(X.raise>=5||!spend(c))return;X.raise++;X.morale=Math.min(100,X.morale+10);SoundFX.buy();showToast('💶 Salaires augmentés (niveau '+X.raise+')');updateHUD();save();upd()},
 insure(){X.insured=!X.insured;SoundFX.buy();showToast(X.insured?'🛡️ Assuré : réparations à -60%':'Assurance résiliée');save();upd()},
 borrow(f){const cap=Math.floor(10000+_g()*600),room=Math.max(0,cap-X.debt),a=Math.floor(Math.min(room,f===1?room:cap*f));if(a<1)return;X.debt+=a;state.money+=a;SoundFX.coin();showToast('🏦 Prêt accordé : +'+fmt(a));updateHUD();save();upd()},
 repay(f){const a=Math.floor(Math.min(X.debt,f===1?X.debt:X.debt*f,state.money));if(a<1)return;state.money-=a;X.debt-=a;SoundFX.buy();showToast('✅ Remboursé : '+fmt(a));updateHUD();save();upd()},
 rent(i,l){X.rent[i]=l;SoundFX.buy();save();upd()},
 hire(i){const c=empCost(i);if(X.emp[i]>=MAXE[i]||!spend(c))return;X.emp[i]++;SoundFX.buy();showToast('🤝 '+EMP[i].n+' engagé !');updateHUD();save();upd()},
 fire(i){if(!X.emp[i])return;X.emp[i]--;SoundFX.loss();showToast('👋 '+EMP[i].n+' licencié');save();upd()},
 fix(id){fixIssue(id,false);showToast('✅ Problème réglé');save();upd()},
 tenant(i){const r=state.realEstate[i];if(occOf(i)>=r.count||!spend(tenantCost(i)))return;
  if(Math.random()<RENTP[X.rent[i]]){X.occ[i]++;SoundFX.coin();showToast('🔑 Locataire trouvé pour ton '+r.name+' !')}else{SoundFX.loss();showToast('😕 Aucun candidat cette fois…')}
  updateHUD();save();upd()},
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
ensureAssets();
build();
})();
