import { demo } from './data.js';

const app = document.querySelector('#app');
const state = {
  me: null,
  config: { turnstileSiteKey: '', paymentsEnabled: false },
  live: { news: [], fixtures: [], standings: [], players: [], clubs: [], transfers: [] },
  demoCoins: 0,
  following: new Set(JSON.parse(localStorage.getItem('epl_following') || '[]')),
  owned: new Set(),
  slideIndex: 0,
  slideTimer: null,
};

const routes = [
  ['/', renderHome], ['/news', renderNews], ['/liga', renderLeague], ['/tabelle', renderTable], ['/teams', renderTeams],
  ['/spieler', renderPlayers], ['/transfers', renderTransfers], ['/shop', renderShop], ['/regeln', renderRules],
  ['/registrieren', renderRegister], ['/login', renderLogin], ['/manager', renderManager], ['/admin', renderAdmin],
];

const POSITIONS = ['ST','ZOM','ZM','ZDM','LM','RM','LV','RV','IV','TW'];

function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;' }[c]));}
function fmt(n){return new Intl.NumberFormat('de-DE').format(Number(n||0));}
function euro(cents){return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format((Number(cents)||0)/100);}
function path(){return location.pathname.replace(/\/$/,'') || '/';}
function navActive(href){const p=path(); return href==='/' ? p==='/' : p===href || p.startsWith(href+'/');}
function saveLocal(){localStorage.setItem('epl_following',JSON.stringify([...state.following]));}
function goto(url){history.pushState({},'',url); route(); window.scrollTo({top:0,behavior:'instant'});}
function toast(msg,type='ok'){const el=document.createElement('div');el.className=`toast ${type}`;el.textContent=msg;document.querySelector('#toast-root').append(el);setTimeout(()=>el.remove(),3200)}
function formatDateTime(v){if(!v) return '—'; const d=new Date(v); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function assetUrl(v,fallback){if(!v) return fallback; if(v.startsWith('http')||v.startsWith('/')) return v; return `/api/media/${v}`;}
function avatarFor(player){return assetUrl(player?.avatar_key || player?.avatar, demo.brand.defaultAvatar)}
function clubLogoFor(club){return assetUrl(club?.logo_key || club?.logo, demo.brand.defaultClub)}
function coverFor(obj){return assetUrl(obj?.cover_key || obj?.cover, demo.brand.defaultCover)}
function clubName(obj){return obj?.club || obj?.name || 'Unbekannter Club';}
function emptyCard(title,text){return `<div class="empty"><strong>${title}</strong><div style="margin-top:8px">${text}</div></div>`;}

async function api(url, options={}){
  const headers = { ...(options.headers||{}) };
  if (!(options.body instanceof FormData) && !headers['Content-Type']) headers['Content-Type']='application/json';
  const res = await fetch(url,{credentials:'include',...options,headers});
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function bootstrap(){
  try { state.config = await api('/api/config'); } catch {}
  try { state.me = (await api('/api/auth/me')).user; } catch {}
  await refreshPublicData();
  route();
}
async function refreshPublicData(){
  try{
    const boot = await api('/api/bootstrap');
    state.live.news = boot.news || [];
    state.live.fixtures = boot.fixtures || [];
    state.live.standings = boot.standings || [];
    state.live.players = boot.players || [];
    state.live.clubs = boot.clubs || [];
    state.live.transfers = boot.transfers || [];
  }catch{}
}

window.addEventListener('popstate',route);
document.addEventListener('click',e=>{const a=e.target.closest('a[data-link]'); if(a){e.preventDefault();goto(a.getAttribute('href'));}});

function layout(content){
  const nav=[['/','Home'],['/news','News'],['/liga','Liga'],['/tabelle','Tabelle'],['/teams','Teams'],['/spieler','Spieler'],['/transfers','Transfers'],['/shop','Shop'],['/regeln','Regeln']];
  return `<div class="shell">
    <header class="site-header"><div class="container header-inner">
      <a href="/" data-link class="brand"><img src="${demo.brand.logo}" alt="${esc(demo.brand.name)}"></a>
      <nav class="nav">${nav.map(([h,l])=>`<a data-link class="nav-link ${navActive(h)?'active':''}" href="${h}">${l}</a>`).join('')}</nav>
      <button class="mobile-toggle" id="mobileMenu">☰</button>
      <div class="header-actions">${state.me?`<a class="login-link" data-link href="/spieler/${esc(state.me.username.toLowerCase())}">👤 ${esc(state.me.username)}</a><button class="btn btn-primary" data-action="logout">ABMELDEN</button>`:`<a class="btn btn-primary" data-link href="/registrieren">♙ REGISTRIEREN</a><a class="login-link" data-link href="/login">👤 Login</a>`}</div>
    </div></header>
    <main class="page">${content}</main>${footer()}</div>`;
}
function footer(){return `<footer class="site-footer"><div class="container footer-inner"><div class="socials"><span>FOLGE UNS</span>${['D','X','◎','▶','♪'].map(x=>`<span class="social-bubble">${x}</span>`).join('')}</div><div class="footer-brand"><strong>EPL</strong> ELITE PRO LEAGUE – COMPETE. CONNECT. CONQUER.</div><div class="footer-links"><a href="/regeln" data-link>Impressum</a><a href="/regeln" data-link>Datenschutz</a><a href="/regeln" data-link>AGB</a><a href="/regeln" data-link>Kontakt</a></div></div></footer>`}

function route(){
  const p=path();
  if(state.slideTimer){clearInterval(state.slideTimer); state.slideTimer=null;}
  let renderer;
  if(p.startsWith('/spieler/')) renderer=()=>renderPlayerProfileShell(decodeURIComponent(p.split('/')[2]||''));
  else if(p.startsWith('/club/')) renderer=()=>renderClubProfileShell(decodeURIComponent(p.split('/')[2]||''));
  else renderer=(routes.find(([r])=>r===p)||routes[0])[1];
  app.innerHTML = layout(renderer());
  bindGlobal();
  bindPage(p);
}
function bindGlobal(){
  document.querySelector('[data-action="logout"]')?.addEventListener('click',async()=>{try{await api('/api/auth/logout',{method:'POST',body:'{}'})}catch{} state.me=null; toast('Du bist abgemeldet.'); goto('/');});
  document.querySelector('#mobileMenu')?.addEventListener('click',()=>toast('Mobile Navigation: nutze die Hauptbereiche über das Menü oder die Startseite.'));
}

function renderHome(){
  const slides = demo.heroSlides;
  const news = state.live.news.length ? state.live.news : demo.newsPlaceholders;
  const fixtures = state.live.fixtures.slice(0,4);
  const scorers = [...state.live.players].sort((a,b)=>(b.goals||0)-(a.goals||0)).slice(0,5);
  return `<section class="home-hero" id="heroSlider">
    ${slides.map((s,i)=>`<div class="hero-slide ${i===0?'active':''}" data-slide="${i}"><img class="hero-visual" src="${s.visual}" alt="${esc(s.title)}"><div class="container"><div class="hero-content"><div class="eyebrow">${s.eyebrow}</div><h1 class="hero-title">${s.title.replace(/\n/g,'<br>')}</h1><div class="hero-copy">${s.copy}</div><div class="hero-ctas"><a class="btn btn-primary" data-link href="${s.ctaPrimary.href}">${s.ctaPrimary.label}</a><a class="btn btn-ghost" data-link href="${s.ctaSecondary.href}">${s.ctaSecondary.label}</a></div></div></div></div>`).join('')}
    <button class="slider-arrow left" data-slide-nav="prev">‹</button><button class="slider-arrow right" data-slide-nav="next">›</button>
    <div class="slider-dots">${slides.map((_,i)=>`<i class="dot ${i===0?'active':''}" data-slide-dot="${i}"></i>`).join('')}</div>
  </section>
  <div class="container"><div class="welcome-row"><section class="panel welcome-box"><img class="trophy-mini" src="${demo.brand.trophy}" alt="EPL Trophy"><div class="welcome-copy"><h2>Willkommen bei der Elite Pro League</h2><p>Die Elite Pro League ist die kompetitive Online Pro-Clubs-Liga für ambitionierte Spieler, starke Teams und echte Fußball-Esports-Action. Erlebe faire Ligen, spannende Matches und eine Community, die den Unterschied macht.</p><div class="mini-features"><span>🏆 Echte Wettbewerbe</span><span>♧ Aktive Community</span><span>◉ Professionelle Organisation</span><span>🛡 Faire Regeln</span></div></div></section><section class="panel register-callout"><h3>⚑ REGISTRIERUNG IST GEÖFFNET!</h3><p>Erstelle jetzt dein Spielerprofil, tritt einem Club bei oder gründe dein eigenes Team und werde Teil der nächsten Saison der Elite Pro League.</p><div class="steps"><div class="step"><span class="step-ico">♙</span><span>Profil erstellen<br>und loslegen</span></div><span class="step-arrow">→</span><div class="step"><span class="step-ico">♧</span><span>Club beitreten<br>oder gründen</span></div><span class="step-arrow">→</span><div class="step"><span class="step-ico">🏆</span><span>Um den Titel<br>kämpfen</span></div><a class="btn btn-primary" data-link href="/registrieren">JETZT REGISTRIEREN</a></div></section></div>
  <div class="home-grid">
    <section class="panel home-card"><div class="section-head"><span class="panel-title">Neueste News</span><a data-link href="/news" class="section-link">Alle News ›</a></div>${news.map(n=>`<article class="news-item"><img src="${n.image || demo.brand.trophy}" alt=""><div><h4>${esc(n.title)}</h4><p>${esc(n.excerpt||'')}</p><time>${esc(n.published_at?formatDateTime(n.published_at):'Noch kein Datum')}</time></div></article>`).join('')}</section>
    <section class="panel home-card"><div class="section-head"><span class="panel-title">Nächste Spiele</span><a data-link href="/liga" class="section-link">Alle Spiele ›</a></div>${fixtures.length?fixtures.map(f=>`<div class="fixture"><span>${formatDateTime(f.scheduled_at).split(' ')[0]}</span><span>${formatDateTime(f.scheduled_at).split(' ')[1]||'--:--'}</span><span class="team"><img class="club-mark sm" src="${clubLogoFor({logo_key:f.home_logo_key})}"><span>${esc(f.home_name)}<small class="div">${esc(f.division_name||'Division')}</small></span></span><span>vs</span><span class="team"><img class="club-mark sm" src="${clubLogoFor({logo_key:f.away_logo_key})}"><span>${esc(f.away_name)}</span></span></div>`).join(''):`${emptyCard('Noch kein Spielplan vorhanden.','Wenn Matches erstellt wurden, erscheinen hier automatisch die kommenden Begegnungen.')}`}</section>
    <section class="panel home-card"><div class="section-head"><span class="panel-title">Top-Scorer</span><a data-link href="/spieler" class="section-link">Alle Statistiken ›</a></div>${scorers.length?scorers.map((p,i)=>`<div class="scorer"><span>${i+1}.</span><img src="${avatarFor(p)}" alt=""><div><div class="name">${esc(p.username)}</div><div class="club">${esc(clubName(p))}</div></div><div class="goals">${fmt(p.goals)}<small style="display:block;font-size:8px;color:#a7b2bf">TORE</small></div></div>`).join(''):emptyCard('Noch keine Spielerstatistiken vorhanden.','Sobald Spieler registriert und Matchdaten gepflegt werden, erscheint hier die Scorerliste.')}</section>
    <section class="panel home-card"><div class="panel-title">Warum EPL?</div>${demo.featureIcons.map(x=>`<div class="feature-row"><div class="feature-icon img"><img src="${x.image}" alt="${esc(x.title)}"></div><div><strong>${x.title}</strong><p>${x.text}</p></div></div>`).join('')}</section>
  </div></div>`;
}

function renderPlayerProfileShell(slug){
  return `<section class="container simple-page"><div id="playerProfileMount" class="loading-block">Spielerprofil wird geladen…</div></section>`;
}
function renderClubProfileShell(slug){
  return `<section class="container simple-page"><div id="clubProfileMount" class="loading-block">Teamprofil wird geladen…</div></section>`;
}

function renderPlayerProfile(data, slug){
  if(!data?.profile) return `<div class="panel data-panel">${emptyCard('Profil nicht gefunden.','Dieses Profil existiert noch nicht oder wurde noch nicht erstellt.')}<div style="text-align:center;margin-top:16px"><a class="btn btn-primary" data-link href="/registrieren">PROFIL ERSTELLEN</a></div></div>`;
  const p=data.profile, stats=data.stats||{}; const own=state.me && state.me.username?.toLowerCase()===p.username.toLowerCase(); const followKey=`player:${slug}`; const following=state.following.has(followKey);
  return `<section class="profile-hero"><img class="profile-cover" src="${coverFor(p)}" alt="Titelbild"><div class="container profile-info"><div class="profile-avatar-wrap"><img class="profile-avatar" src="${avatarFor(p)}" alt="${esc(p.username)}"></div><div class="profile-main"><div class="profile-nameblock"><h1>${esc(p.username)} ${p.verified?'<span class="verified">✓</span>':''}</h1><div class="subline">${esc(p.position||'Spieler')} ${p.secondary_position?`• ${esc(p.secondary_position)}`:''} • Elite Pro League</div><p>${esc(p.bio || 'Kein Profiltext vorhanden.')}</p><div class="profile-actions"><button class="btn btn-primary" data-follow="${followKey}">${following?'✓ FOLGE ICH':'+ FOLGEN'}</button><button class="btn btn-ghost" data-message>◌ Nachricht</button>${own?'<button class="btn btn-ghost" data-edit-profile>✎ Profil bearbeiten</button>':''}</div></div></div></div></section>
  <div class="container"><section class="panel profile-statbar"><div class="profile-stat"><span class="mini-badge">EPL</span></div><div class="profile-stat"><strong>${fmt(p.followers||0)}</strong><span>Follower</span></div><div class="profile-stat"><strong>${fmt(p.following||0)}</strong><span>Folge ich</span></div><div class="profile-stat"><strong>${fmt(stats.matches)}</strong><span>Matches</span></div><div class="profile-stat"><strong>${fmt(stats.goals)}</strong><span>Tore</span></div><div class="profile-stat"><strong>${fmt(stats.assists)}</strong><span>Assists</span></div><div class="profile-stat rating"><strong>${Number(stats.rating||0).toFixed(2)}</strong><span>Rating</span></div></section>
  <div class="profile-tabs">${['Beiträge','Highlights','Statistiken','Karriere','Clubs'].map((x,i)=>`<button class="tab-btn ${i===0?'active':''}">${x}</button>`).join('')}</div>
  <div class="profile-layout"><section><article class="panel feed-card"><div class="feed-user"><img src="${avatarFor(p)}"><div><strong>${esc(p.username)}</strong><div class="tiny muted">Community Feed</div></div></div><div class="feed-copy"><p>Hier erscheinen automatisch Beiträge, Match-Highlights und Profilaktivitäten, sobald der Spieler Content postet oder Matchdaten erfasst werden.</p><div class="tiny muted">Direkt nach dem Go-Live startet das Profil sauber ohne künstliche Platzhalter.</div></div></article></section><aside><section class="panel side-stats"><div class="section-head"><span class="panel-title">Saison Statistiken</span></div><div class="stat-grid-4"><div><strong>${fmt(stats.matches)}</strong><span>Spiele</span></div><div><strong>${fmt(stats.goals)}</strong><span>Tore</span></div><div><strong>${fmt(stats.assists)}</strong><span>Assists</span></div><div><strong>${Number(stats.rating||0).toFixed(2)}</strong><span>Rating</span></div></div></section><section class="panel side-stats"><div class="panel-title">Attribute</div><div class="attr-list">${[['PAC',p.pace||0],['SHO',p.shooting||0],['PAS',p.passing||0],['DRI',p.dribbling||0],['DEF',p.defending||0],['PHY',p.physical||0]].map(x=>`<div class="attr-row"><span>${x[0]}</span><div class="bar"><i style="width:${Math.max(8,Math.min(100,Number(x[1]||0)))}%"></i></div><strong>${fmt(x[1])}</strong></div>`).join('')}</div></section></aside></div></div>`;
}

function renderClubProfile(data, slug){
  if(!data?.club) return `<div class="panel data-panel">${emptyCard('Club nicht gefunden.','Dieser Club existiert noch nicht oder wurde noch nicht angelegt.')}<div style="text-align:center;margin-top:16px"><a class="btn btn-primary" data-link href="/teams">ZU DEN TEAMS</a></div></div>`;
  const c=data.club, squad=data.squad||[]; const followKey=`club:${slug}`; const following=state.following.has(followKey);
  return `<section class="club-hero"><img class="club-cover" src="${coverFor(c)}" alt="Titelbild"><div class="container club-info"><div class="club-logo-card"><img src="${clubLogoFor(c)}" alt="${esc(c.name)}"></div><div class="club-title"><h1>${esc(c.name)} ${c.verified?'<span class="verified">✓</span>':''}</h1><span class="badge">${esc(c.division_name||'Noch ohne Division')}</span><p>Manager: ${esc(c.manager_username||'Noch keiner zugewiesen')}</p><p>EA Club ID: ${esc(c.ea_club_id || 'Noch nicht hinterlegt')}</p><div class="club-actions"><button class="btn btn-primary" data-follow="${followKey}">${following?'✓ FOLGE ICH':'+ FOLGEN'}</button><button class="btn btn-ghost" data-apply>◉ BEWERBEN</button><button class="btn btn-ghost" data-message>✉ KONTAKT</button></div></div><section class="panel club-summary"><div class="summary-item">♧<strong style="display:block;font-family:Rajdhani;font-size:22px">${fmt(c.followers_count||0)}</strong><span class="tiny muted">Follower</span></div><div class="rep"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:28px;color:#168fff">▥</span><div><span class="tiny">Club Reputation</span><strong style="display:block">${fmt(c.reputation||0)}</strong></div></div><div class="rep-bar"><span style="width:${Math.min(100,Math.max(6,Math.round((Number(c.reputation||0)/5000)*100)))}%"></span></div></div></section></div></section>
  <div class="container"><div class="club-tabs">${['Feed','Kader','Statistiken','Spiele','Transfers','Galerie'].map((x,i)=>`<button class="tab-btn ${i===0?'active':''}">${x}</button>`).join('')}</div><div class="club-layout"><section class="panel"><div class="panel-title" style="padding:10px 12px 2px">Club Feed</div><div class="empty">Sobald der Club Beiträge, News oder Galeriebilder veröffentlicht, erscheinen sie hier automatisch.</div></section><div><section class="panel data-panel"><div class="section-head"><span class="panel-title">Kader</span><span class="section-link">GESAMTEN KADER ANZEIGEN ›</span></div>${squad.length?`<div class="squad-grid">${squad.map(m=>`<div class="player-card"><span class="rating">${fmt(m.overall||0)}</span><span class="pos">${esc(m.position||'--')}</span><div class="player-face"><img src="${avatarFor(m)}"></div><div class="pname">${esc(m.username)}</div><div class="pcountry">${esc(m.role||'PLAYER')}</div></div>`).join('')}</div>`:emptyCard('Noch kein Kader vorhanden.','Sobald Spieler dem Club beitreten, erscheint hier automatisch die Startelf und der komplette Kader.')}</section></div><aside><section class="panel right-list"><div class="panel-title">Club Erfolge</div><div class="empty">Erfolge und Trophäen erscheinen, sobald sie in der Datenbank hinterlegt werden.</div></section><section class="panel right-list" style="margin-top:8px"><div class="panel-title">Transfermarkt</div><div class="empty">Transferaktivitäten werden hier nach Vertragsbewegungen automatisch angezeigt.</div></section></aside></div></div>`;
}

function renderShop(){
  const coins = state.me?.coins ?? state.demoCoins;
  return `<div class="container shop-page"><section class="panel coin-hero"><img class="coin-art" src="${demo.brand.defaultCoinArt}" alt="Coins"><div class="coin-copy"><div class="panel-title">DEIN EPL COINS BALANCE</div><div class="coin-balance"><span class="coin-icon">E</span>${fmt(coins)}<span style="font-family:Inter;font-size:15px;font-weight:500">EPL COINS</span></div><p>Coins kannst du durch starke Leistungen verdienen oder im Shop mit echtem Geld erwerben.</p><button class="btn btn-ghost" data-wallet>VERLAUF ANSEHEN</button></div></section><div class="shop-layout"><div><section class="panel shop-main"><div class="panel-title" style="font-size:19px;color:#f1f4f8">SHOP – <span class="blue">PREMIUM COSMETICS</span></div><div class="shop-tabs">${['Alle','Profilbildrahmen','Titelbildrahmen','Namenseffekte','Badges','Bundles'].map((x,i)=>`<button class="shop-tab ${i===0?'active':''}">${x}</button>`).join('')}</div><div class="product-grid">${demo.shop.map(s=>`<article class="product-card"><h3>${s.name}</h3><div class="ptype">${s.type}</div><img src="${s.image}" alt="${s.name}"><div class="price"><span class="coin-icon">E</span><div><strong>${fmt(s.price)}</strong><small style="display:block;color:#a9b4bf">EPL COINS</small></div></div><button class="btn btn-ghost" data-buy-item="${s.id}">${state.owned.has(String(s.id))?'IM BESITZ':'DETAILS'}</button></article>`).join('')}</div></section><section class="panel bundle-strip"><div><h3>BUNDLES – MEHR SPAREN, <span class="blue">MEHR ERHALTEN!</span></h3><p>Sichere dir exklusive Bundles mit Coins und limitierten Cosmetics.</p></div><button class="btn btn-primary">🎁 BUNDLES ANSEHEN</button></section></div><aside class="shop-side"><section class="panel"><div class="panel-title">EPL COINS KAUFEN</div>${demo.coinPacks.map(p=>`<div class="pack-row"><span class="coin-icon" style="width:34px;height:34px;font-size:19px">E</span><div><strong>${fmt(p.coins)}</strong><small>EPL COINS ${p.bonus?`<span class="blue">${p.bonus}</span>`:''}</small></div><div class="price-eur">${euro(p.cents)}</div><button class="btn btn-primary btn-small" data-coin-pack="${p.id}">KAUFEN</button></div>`).join('')}</section><section class="panel"><div class="panel-title">WIE VERDIENT MAN COINS?</div>${demo.starterRewards.map(x=>`<div class="reward-row"><span>${x[0]}</span><span>${x[1]}</span><span class="reward">${x[2]}</span></div>`).join('')}</section></aside></div></div>`;
}

function renderTable(){
  const rows = state.live.standings;
  return `<div class="container table-page"><div class="page-heading"><div><div class="eyebrow">EPL Division 1</div><h1>Tabelle</h1><p>Saisonbetrieb mit echter Berechnung aus bestätigten Matches.</p></div><span class="badge">LIVE</span></div><section class="panel data-panel">${rows.length?`<table class="standings"><thead><tr><th>#</th><th>Team</th><th>Sp</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Diff</th><th>Pkt</th></tr></thead><tbody>${rows.map((c,i)=>`<tr><td class="pos">${i+1}</td><td><a data-link href="/club/${c.slug}" class="team-cell"><img class="club-mark" src="${demo.brand.defaultClub}"><b>${esc(c.name)}</b></a></td><td>${fmt(c.played)}</td><td>${fmt(c.wins)}</td><td>${fmt(c.draws)}</td><td>${fmt(c.losses)}</td><td>${fmt(c.gf)}:${fmt(c.ga)}</td><td class="${(c.gf-c.ga)>=0?'green':'red'}">${(c.gf-c.ga)>=0?'+':''}${fmt((c.gf-c.ga))}</td><td><b>${fmt(c.points)}</b></td></tr>`).join('')}</tbody></table>`:emptyCard('Noch keine Tabelle vorhanden.','Sobald Clubs einer Saison zugewiesen und bestätigte Matches erfasst wurden, erscheint hier die Ligatabelle.')}</section></div>`;
}

function renderLeague(){
  const items = state.live.fixtures;
  const upcoming = items.filter(x=>x.status!=='CONFIRMED');
  const results = items.filter(x=>x.status==='CONFIRMED');
  return `<div class="container simple-page"><div class="page-heading"><div><div class="eyebrow">Saisonbetrieb</div><h1>Liga & Spielplan</h1><p>Fixtures, Ergebnisse und Wettbewerbe der Elite Pro League.</p></div><span class="badge">EPL</span></div><div class="matches-split"><section class="panel data-panel"><div class="section-head"><span class="panel-title">Nächste Spiele</span></div>${upcoming.length?upcoming.map(f=>`<div class="match-row" style="grid-template-columns:120px 1fr 50px 1fr 70px"><span>${formatDateTime(f.scheduled_at)}</span><span class="team-cell"><img class="club-mark sm" src="${demo.brand.defaultClub}"> ${esc(f.home_name)}</span><b class="blue">VS</b><span class="team-cell"><img class="club-mark sm" src="${demo.brand.defaultClub}"> ${esc(f.away_name)}</span><span>${esc(f.division_name||'')}</span></div>`).join(''):emptyCard('Noch kein Spielplan vorhanden.','Lege im Admin-Panel Matchdays und Begegnungen an, damit hier kommende Spiele erscheinen.')}</section><section class="panel data-panel"><div class="panel-title">Letzte Ergebnisse</div>${results.length?results.map(r=>`<div class="match-row" style="grid-template-columns:120px 1fr 70px 1fr"><span>${formatDateTime(r.scheduled_at)}</span><span>${esc(r.home_name)}</span><b class="blue">${fmt(r.home_score)}:${fmt(r.away_score)}</b><span>${esc(r.away_name)}</span></div>`).join(''):emptyCard('Noch keine Ergebnisse vorhanden.','Bestätigte Matches werden hier automatisch als Resultate angezeigt.')}</section></div></div>`;
}

function renderTeams(){
  const clubs = state.live.clubs;
  return `<div class="container simple-page"><div class="page-heading"><div><div class="eyebrow">Clubs</div><h1>Teams</h1><p>Registrierte EPL Clubs mit Social-Media-Look, Reputationswert und Bewerbungsfunktion.</p></div>${state.me?'<button class="btn btn-primary" data-create-club>+ CLUB GRÜNDEN</button>':''}</div>${clubs.length?`<div class="teams-grid">${clubs.map(c=>`<a data-link href="/club/${c.slug}" class="panel team-tile"><div class="team-top"><img class="team-logo" src="${clubLogoFor(c)}"><div><h3>${esc(c.name)}</h3><div class="blue tiny">${esc(c.division||'Noch ohne Division')}</div><div class="muted tiny">Manager: ${esc(c.manager||'—')}</div></div></div><div class="team-stats"><div><strong>${fmt(c.points||0)}</strong><span>Punkte</span></div><div><strong>${fmt(c.followers_count||0)}</strong><span>Follower</span></div><div><strong>${fmt(c.reputation||0)}</strong><span>Reputation</span></div></div></a>`).join('')}</div>`:emptyCard('Noch keine Clubs registriert.','Sobald die ersten Teams gegründet wurden, erscheinen sie hier automatisch mit Logo, Social-Profil und Bewerbungsfunktion.')}</div>`;
}

function renderPlayers(){
  return `<div class="container simple-page"><div class="page-heading"><div><div class="eyebrow">Community</div><h1>Spieler</h1><p>Alle registrierten Spielerprofile mit Social Feed, Karriere und Leistungsdaten.</p></div><input class="btn" id="playerSearch" placeholder="Spieler suchen…"></div><div class="players-grid" id="playersGrid">${playersCards(state.live.players)}</div></div>`;
}
function playersCards(list){ return list.length ? list.map(p=>`<a data-link href="/spieler/${p.slug}" class="panel player-tile"><img src="${avatarFor(p)}"><div><h3>${esc(p.username)}</h3><div class="blue">${esc(p.position||'Spieler')}</div><div class="meta">${esc(clubName(p))} • ${esc(p.country||'—')}</div></div><div class="player-mini-stats"><div><strong>${fmt(p.matches)}</strong><span>Matches</span></div><div><strong>${fmt(p.goals)}</strong><span>Tore</span></div><div><strong>${fmt(p.assists)}</strong><span>Assists</span></div><div><strong>${fmt(p.rating)}</strong><span>GES</span></div></div></a>`).join('') : emptyCard('Noch keine Spieler registriert.','Sobald sich die ersten Spieler registrieren, erscheinen hier automatisch ihre Profile.'); }

function renderNews(){
  const news = state.live.news.length ? state.live.news : demo.newsPlaceholders;
  return `<div class="container simple-page"><div class="page-heading"><div><div class="eyebrow">EPL Redaktion</div><h1>News</h1><p>Ligabetrieb, Transfers, Interviews und Community Updates.</p></div></div><div class="teams-grid">${news.map(n=>`<article class="panel team-tile"><img src="${n.image || demo.brand.trophy}" style="width:100%;height:105px;object-fit:cover;border-radius:7px"><h3 style="margin-top:12px">${esc(n.title)}</h3><p class="muted tiny" style="line-height:1.6">${esc(n.excerpt||'')}</p><span class="section-link">${esc(n.published_at?formatDateTime(n.published_at):'Noch kein Datum')} • WEITERLESEN ›</span></article>`).join('')}</div></div>`;
}

function renderTransfers(){
  const transfers = state.live.transfers;
  return `<div class="container simple-page"><div class="page-heading"><div><div class="eyebrow">Markt</div><h1>Transfers</h1><p>Vertragsbewegungen, Free Agents und Bewerbungen.</p></div><button class="btn btn-primary" data-freeagent>FREE-AGENT STATUS</button></div><div class="transfer-market"><section class="panel data-panel"><div class="panel-title">Aktuelle Transfers</div>${transfers.length?transfers.map(t=>`<div class="transfer-card"><img src="${demo.brand.defaultAvatar}" style="width:42px;height:42px;border-radius:50%"><div><strong>${esc(t.player||'Unbekannt')}</strong><small class="muted" style="display:block">${esc(t.position||'--')} | ${fmt(t.rating)} GES</small></div><span>${esc(t.from_club || 'Free Agent')}</span><span class="arrow-big">→</span><span>${esc(t.to_club || 'Noch offen')}</span><span class="${t.type==='JOIN'?'green':'blue'}">${esc(t.type||'TRANSFER')}<small style="display:block;color:#9da8b4">${esc(t.created_at?formatDateTime(t.created_at):'')}</small></span></div>`).join(''):emptyCard('Noch keine Transfers vorhanden.','Sobald Verträge, Bewerbungen oder Transfers erfasst werden, erscheinen sie hier automatisch.')}</section><aside class="panel data-panel"><div class="panel-title">Free Agents</div><div class="empty">Aktiviere im Profil den Free-Agent-Status, damit interessierte Manager dich hier finden.</div></aside></div></div>`;
}

function renderRules(){
  return `<div class="container simple-page"><div class="page-heading"><div><div class="eyebrow">Fair Play</div><h1>Regelwerk</h1><p>Grundregeln für Spieler, Manager und Ligabetrieb.</p></div></div><div class="rules-grid"><aside class="panel rule-nav">${['Allgemein','Registrierung','Kader & Verträge','Matchbetrieb','Ergebnisse','Transfers','Sperren','Verhalten'].map((x,i)=>`<button class="${i===0?'active':''}">${x}</button>`).join('')}</aside><article class="panel rule-content"><h2>1. Allgemeine Bestimmungen</h2><p>Die Elite Pro League ist eine kompetitive Pro-Clubs-Liga. Jeder Spieler darf nur einen aktiven Account führen. Unsportliches Verhalten, absichtliche Spielmanipulation oder Täuschung kann zu Sanktionen führen.</p><h3>2. Registrierung</h3><p>Spieler registrieren sich mit E-Mail, Username und Profilinformationen. Manager und Liga-Admins verwalten anschließend Clubs, Verträge, Bewerbungen und Spieltage.</p><h3>3. Matchbetrieb</h3><p>Spiele werden nach Spielplan angesetzt. Ergebnisse müssen bestätigt werden, bevor sie in Tabelle und Statistiken einfließen.</p><h3>4. Transfers</h3><p>Vertragsangebote, Bewerbungen und Wechsel laufen über die Plattform und können von berechtigten Rollen nachvollzogen werden.</p></article></div></div>`;
}

function renderRegister(){return `<div class="auth-wrap"><section class="panel auth-card"><h1>Registrierung</h1><p class="muted">Erstelle dein EPL Spielerprofil und starte direkt in die Liga.</p><form id="registerForm"><div class="form-grid"><div class="field"><label>Username</label><input name="username" required></div><div class="field"><label>E-Mail</label><input type="email" name="email" required></div><div class="field"><label>Passwort</label><input type="password" name="password" required></div><div class="field"><label>Passwort wiederholen</label><input type="password" name="password2" required></div><div class="field"><label>EA ID</label><input name="eaId"></div><div class="field"><label>Plattform</label><select name="platform"><option>common-gen5</option><option>common-gen4</option><option>pc</option></select></div><div class="field"><label>Discord</label><input name="discord"></div><div class="field"><label>Land</label><input name="country" value="DE"></div><div class="field"><label>Hauptposition</label><select name="position">${POSITIONS.map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field"><label>Nebenposition</label><select name="secondaryPosition">${POSITIONS.map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field full"><div id="turnstileSlot"></div></div></div><div class="form-actions"><button class="btn btn-primary">PROFIL ERSTELLEN</button></div></form></section></div>`;}
function renderLogin(){return `<div class="auth-wrap"><section class="panel auth-card"><h1>Login</h1><p class="muted">Melde dich mit deinem EPL Account an.</p><form id="loginForm"><div class="form-grid"><div class="field full"><label>E-Mail oder Username</label><input name="login" required></div><div class="field full"><label>Passwort</label><input type="password" name="password" required></div><div class="field full"><div id="turnstileSlot"></div></div></div><div class="form-actions"><button class="btn btn-primary">ANMELDEN</button></div></form></section></div>`;}

function dashboardShell(title, side, body){
  return `<div class="container simple-page"><div class="page-heading"><div><div class="eyebrow">Control Center</div><h1>${title}</h1><p>Direkt für Cloudflare Pages, D1 und R2 vorbereitet.</p></div></div><div class="dashboard-grid"><aside class="panel dash-side"><div class="dash-user"><strong>${esc(state.me?.username || 'Gast')}</strong><div class="tiny muted">${esc(state.me?.role || '—')}</div></div><div class="dash-menu">${side.map((x,i)=>`<button class="${i===0?'active':''}">${x}</button>`).join('')}</div></aside><div>${body}</div></div></div>`;
}
function renderManager(){return dashboardShell('Manager Panel',['Übersicht','Kader','Verträge','Bewerbungen','Aufstellung','Matches','Club Einstellungen'],`<div class="metric-grid">${[['Aktiver Kader',0],['Offene Bewerbungen',0],['Laufende Verträge',0],['Anstehende Matches',0]].map(m=>`<section class="panel metric"><strong>${m[1]}</strong><span>${m[0]}</span></section>`).join('')}</div><section class="panel dash-main" style="margin-top:12px">${emptyCard('Online-ready ohne Platzhalter','Dieses Panel ist sofort einsatzbereit. Sobald ein Manager Clubs, Spieler oder Verträge in D1 angelegt hat, erscheinen die echten Daten hier automatisch.')}</section>`);}
function renderAdmin(){return dashboardShell('Admin Panel',['Dashboard','Benutzer','Clubs','Seasons','Divisionen','Spielplan','Ergebnisse','Transfers','News','Settings'],`<div class="metric-grid">${[['Benutzer',state.live.players.length],['Clubs',state.live.clubs.length],['News',state.live.news.length],['Transfers',state.live.transfers.length]].map(m=>`<section class="panel metric"><strong>${m[1]}</strong><span>${m[0]}</span></section>`).join('')}</div><section class="panel dash-main" style="margin-top:12px"><table class="admin-table"><thead><tr><th>Bereich</th><th>Status</th><th>Hinweis</th></tr></thead><tbody><tr><td>D1</td><td class="green">Vorbereitet</td><td>Schema, Rollen, Verträge, Coins und Shop sind angelegt.</td></tr><tr><td>R2</td><td class="green">Vorbereitet</td><td>Profilbilder, Clublogos und Cover können per Upload gespeichert werden.</td></tr><tr><td>Turnstile</td><td class="green">Vorbereitet</td><td>Serverseitige Prüfung für Registrierung und Login vorhanden.</td></tr><tr><td>Live-Daten</td><td class="blue">Ohne Platzhalter</td><td>Öffentliche Bereiche zeigen nur noch reale Daten aus D1.</td></tr></tbody></table></section>`);}

function modal(title, body){const wrap=document.createElement('div');wrap.className='modal-backdrop';wrap.innerHTML=`<section class="panel modal"><button class="modal-close">×</button><h2>${title}</h2>${body}</section>`;document.body.append(wrap);wrap.querySelector('.modal-close').onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};return wrap}

function bindPage(p){
  bindHeroSlider();
  document.querySelector('#playerSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase(); document.querySelector('#playersGrid').innerHTML = playersCards(state.live.players.filter(x=>`${x.username} ${clubName(x)}`.toLowerCase().includes(q)));});
  document.querySelectorAll('[data-follow]').forEach(btn=>btn.addEventListener('click',async()=>{const key=btn.dataset.follow; const [type,slug]=key.split(':'); if(state.following.has(key)) state.following.delete(key); else state.following.add(key); saveLocal(); btn.textContent=state.following.has(key)?'✓ FOLGE ICH':'+ FOLGEN'; if(state.me){try{await api('/api/social/follow',{method:'POST',body:JSON.stringify({type,slug})})}catch(e){toast(e.message,'error')}} }));
  document.querySelectorAll('[data-message]').forEach(b=>b.addEventListener('click',()=>toast('Nachrichtenfunktion ist vorbereitet und wird nach dem Go-Live mit echten D1-Daten genutzt.')));
  document.querySelector('[data-wallet]')?.addEventListener('click',()=>modal('EPL Coins Verlauf',`<p class="muted">Deine Wallet speichert jede Gutschrift und Ausgabe nachvollziehbar in D1.</p><table class="admin-table"><tr><td>Siegbonus</td><td class="green">+150 E</td></tr><tr><td>Man of the Match</td><td class="green">+100 E</td></tr><tr><td>Shop-Kauf</td><td class="red">- Coins</td></tr></table>`));
  document.querySelector('[data-create-club]')?.addEventListener('click',()=>{if(!state.me)return goto('/login'); const m=modal('Club gründen',`<form id="clubForm"><div class="form-grid"><div class="field full"><label>Clubname</label><input name="name" required></div><div class="field"><label>EA Club ID</label><input name="eaClubId"></div><div class="field"><label>Plattform</label><select name="platform"><option>common-gen5</option><option>pc</option></select></div></div><div class="form-actions"><button class="btn btn-primary">CLUB ERSTELLEN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();const fd=Object.fromEntries(new FormData(e.target));try{await api('/api/clubs',{method:'POST',body:JSON.stringify(fd)});toast('Club angelegt.');m.remove(); await refreshPublicData(); route();}catch(err){toast(err.message,'error')}}});
  document.querySelector('[data-apply]')?.addEventListener('click',()=>{if(!state.me)return goto('/login'); const slug = path().split('/')[2]; const m=modal('Bei Club bewerben',`<form id="applyForm"><div class="field"><label>Nachricht</label><textarea name="message" rows="5">Hallo, ich möchte mich für euren Club bewerben.</textarea></div><div class="form-actions"><button class="btn btn-primary">BEWERBUNG SENDEN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await api('/api/applications',{method:'POST',body:JSON.stringify({clubSlug:slug,message:e.target.message.value})});toast('Bewerbung wurde gesendet.');m.remove()}catch(err){toast(err.message,'error')}}});
  document.querySelector('#registerForm') && bindRegister();
  document.querySelector('#loginForm') && bindLogin();
  document.querySelectorAll('[data-buy-item]').forEach(b=>b.addEventListener('click',()=>buyItem(Number(b.dataset.buyItem),b)));
  document.querySelectorAll('[data-coin-pack]').forEach(b=>b.addEventListener('click',()=>buyCoins(b.dataset.coinPack)));
  document.querySelector('[data-edit-profile]')?.addEventListener('click',()=>{const m=modal('Profil bearbeiten',`<form id="profileEditForm"><div class="form-grid"><div class="field full"><label>Bio</label><textarea name="bio" rows="4"></textarea></div><div class="field"><label>EA ID</label><input name="eaId"></div><div class="field"><label>Discord</label><input name="discord"></div><div class="field"><label>Hauptposition</label><select name="position">${POSITIONS.map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field"><label>Nebenposition</label><select name="secondaryPosition">${POSITIONS.map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field"><label>Profilbild</label><input type="file" name="avatar" accept="image/png,image/jpeg,image/webp"></div><div class="field"><label>Titelbild</label><input type="file" name="cover" accept="image/png,image/jpeg,image/webp"></div><div class="field full"><label><input type="checkbox" name="freeAgent"> Als Free Agent anzeigen</label></div></div><div class="form-actions"><button class="btn btn-primary">SPEICHERN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault(); const f=e.target; try{await api('/api/profile',{method:'POST',body:JSON.stringify({bio:f.bio.value,eaId:f.eaId.value,discord:f.discord.value,position:f.position.value,secondaryPosition:f.secondaryPosition.value,freeAgent:f.freeAgent.checked})}); for(const [kind,input] of [['avatar',f.avatar],['cover',f.cover]]){ if(input.files[0]){ const fd=new FormData(); fd.append('kind',kind); fd.append('file',input.files[0]); const r=await fetch('/api/upload',{method:'POST',credentials:'include',body:fd}); if(!r.ok){const d=await r.json().catch(()=>({})); throw new Error(d.error||'Upload fehlgeschlagen.');}} } toast('Profil wurde aktualisiert.');m.remove();}catch(err){toast(err.message,'error')}}});
  if(p.startsWith('/spieler/')) hydratePlayerProfile(decodeURIComponent(p.split('/')[2]||''));
  if(p.startsWith('/club/')) hydrateClubProfile(decodeURIComponent(p.split('/')[2]||''));
}

function bindHeroSlider(){
  const root=document.querySelector('#heroSlider'); if(!root) return;
  const slides=[...root.querySelectorAll('.hero-slide')], dots=[...root.querySelectorAll('[data-slide-dot]')];
  const setSlide=(idx)=>{ state.slideIndex=(idx+slides.length)%slides.length; slides.forEach((s,i)=>s.classList.toggle('active',i===state.slideIndex)); dots.forEach((d,i)=>d.classList.toggle('active',i===state.slideIndex)); };
  setSlide(0);
  root.querySelector('[data-slide-nav="prev"]')?.addEventListener('click',()=>setSlide(state.slideIndex-1));
  root.querySelector('[data-slide-nav="next"]')?.addEventListener('click',()=>setSlide(state.slideIndex+1));
  dots.forEach((d,i)=>d.addEventListener('click',()=>setSlide(i)));
  state.slideTimer = setInterval(()=>setSlide(state.slideIndex+1), 5000);
}
async function hydratePlayerProfile(slug){
  const mount=document.querySelector('#playerProfileMount'); if(!mount) return;
  try{ const data=await api(`/api/profile/${encodeURIComponent(slug)}`); mount.outerHTML=renderPlayerProfile(data,slug); bindPage('/spieler/'+slug); }catch{ mount.outerHTML=renderPlayerProfile(null,slug); }
}
async function hydrateClubProfile(slug){
  const mount=document.querySelector('#clubProfileMount'); if(!mount) return;
  try{ const data=await api(`/api/club/${encodeURIComponent(slug)}`); mount.outerHTML=renderClubProfile(data,slug); bindPage('/club/'+slug); }catch{ mount.outerHTML=renderClubProfile(null,slug); }
}
async function bindTurnstile(form){ if(!state.config.turnstileSiteKey) return ()=>''; await new Promise(r=>{ if(window.turnstile) return r(); const s=document.createElement('script'); s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async=true; s.onload=r; document.head.append(s); }); let token=''; window.turnstile.render(form.querySelector('#turnstileSlot'),{sitekey:state.config.turnstileSiteKey,theme:'dark',callback:t=>token=t}); return ()=>token; }
async function bindRegister(){ const form=document.querySelector('#registerForm'); const getToken=await bindTurnstile(form); form.onsubmit=async e=>{e.preventDefault(); const fd=Object.fromEntries(new FormData(form)); if(fd.password!==fd.password2) return toast('Passwörter stimmen nicht überein.','error'); delete fd.password2; fd.turnstileToken=getToken(); try{ const r=await api('/api/auth/register',{method:'POST',body:JSON.stringify(fd)}); state.me=r.user; await refreshPublicData(); toast('Account erstellt.'); goto(`/spieler/${r.user.username.toLowerCase()}`); }catch(err){ toast(err.message,'error'); }}; }
async function bindLogin(){ const form=document.querySelector('#loginForm'); const getToken=await bindTurnstile(form); form.onsubmit=async e=>{e.preventDefault(); const fd=Object.fromEntries(new FormData(form)); fd.turnstileToken=getToken(); try{ const r=await api('/api/auth/login',{method:'POST',body:JSON.stringify(fd)}); state.me=r.user; toast('Login erfolgreich.'); goto('/'); }catch(err){ toast(err.message,'error'); }}; }
async function buyItem(id,btn){ const item=demo.shop.find(x=>x.id===id); if(!state.me){ toast('Bitte zuerst anmelden, um Shop-Artikel zu kaufen.','error'); return goto('/login'); } if(state.owned.has(String(id))) return toast('Dieses Cosmetic besitzt du bereits.'); try{ const r=await api('/api/shop/purchase',{method:'POST',body:JSON.stringify({itemId:id})}); state.me.coins=r.balance; state.owned.add(String(id)); route(); toast(`${item.name} gekauft.`);}catch(e){toast(e.message,'error')} }
async function buyCoins(packId){ const pack=demo.coinPacks.find(x=>x.id===packId); if(!state.me){ toast('Bitte zuerst anmelden, um EPL Coins zu kaufen.','error'); return goto('/login'); } if(!state.config.paymentsEnabled){ return toast('Echtgeld-Käufe sind momentan noch nicht aktiviert.','error'); } try{ const r=await api('/api/payments/checkout',{method:'POST',body:JSON.stringify({packId})}); location.href=r.url; }catch(e){toast(e.message,'error')} }

bootstrap();
