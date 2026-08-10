import { demo } from './data.js';

const app = document.querySelector('#app');
const state = {
  me: null,
  config: { paymentsEnabled: false, oauthGoogleEnabled: false, oauthDiscordEnabled: false },
  live: { news: [], fixtures: [], standings: [], players: [], clubs: [], transfers: [] },
  demoCoins: 0,
  following: new Set(JSON.parse(localStorage.getItem('epl_following') || '[]')),
  owned: new Set(),
  inventory: [],
  equipped: { avatarFrame:null, coverFrame:null, nameEffect:null },
  socialFeed: [],
  presenceTimer: null,
  slideIndex: 0,
  slideTimer: null,
  admin: null,
  manager: null,
};

const routes = [
  ['/', renderHome], ['/news', renderNews], ['/liga', renderLeague], ['/tabelle', renderTable], ['/teams', renderTeams],
  ['/spieler', renderPlayers], ['/transfers', renderTransfers], ['/shop', renderShop], ['/regeln', renderRules],
  ['/registrieren', renderRegister], ['/login', renderLogin], ['/profil-einrichten', renderProfileSetup], ['/manager', renderManager], ['/admin', renderAdmin],
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
function shopItemById(id){return demo.shop.find(x=>Number(x.id)===Number(id))||null;}
function shopImageById(id){return shopItemById(id)?.image||'';}
function onlineDot(online){return `<span class="presence-dot ${Number(online)?'online':'offline'}" title="${Number(online)?'Online':'Offline'}"></span>`;}
function authorImage(post){return assetUrl(post?.author_image_key,post?.author_type==='club'?demo.brand.defaultClub:demo.brand.defaultAvatar);}
function emptyCard(title,text){return `<div class="empty"><strong>${title}</strong><div style="margin-top:8px">${text}</div></div>`;}
function consumeOAuthNotice(){
  const params=new URLSearchParams(location.search),message=params.get('oauth_error');
  if(!message)return;
  toast(message,'error');
  history.replaceState({},'',location.pathname);
}

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
  if(state.me){
    await Promise.all([refreshSocialState(),refreshInventory(),refreshSocialFeed()]);
    startPresence();
  }
  route();
  consumeOAuthNotice();
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
async function refreshSocialState(){
  if(!state.me)return;
  try{const r=await api('/api/social/state');state.following=new Set(r.following||[]);saveLocal();}catch{}
}
async function refreshInventory(){
  if(!state.me){state.inventory=[];state.owned=new Set();return;}
  try{const r=await api('/api/inventory');state.inventory=r.items||[];state.equipped=r.equipped||{avatarFrame:null,coverFrame:null,nameEffect:null};state.owned=new Set(state.inventory.map(x=>String(x.id)));}catch{}
}
async function refreshSocialFeed(){
  if(!state.me){state.socialFeed=[];return;}
  try{state.socialFeed=(await api('/api/social/feed')).posts||[];}catch{state.socialFeed=[];}
}
function startPresence(){
  if(state.presenceTimer)clearInterval(state.presenceTimer);
  const ping=async()=>{try{await api('/api/presence',{method:'POST',body:'{}'});}catch{}};
  ping();state.presenceTimer=setInterval(ping,60000);
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
      <div class="header-actions">${state.me?`${state.me.managed_club_slug?'<a class="login-link control-link" data-link href="/manager">VM PANEL</a>':''}${state.me.is_admin||state.me.role==='SUPER_ADMIN'?'<a class="login-link control-link" data-link href="/admin">ADMIN</a>':''}<a class="login-link" data-link href="/spieler/${esc(state.me.username.toLowerCase())}">👤 ${esc(state.me.username)}</a><button class="btn btn-primary" data-action="logout">ABMELDEN</button>`:`<a class="btn btn-primary" data-link href="/registrieren">♙ REGISTRIEREN</a><a class="login-link" data-link href="/login">👤 Login</a>`}</div>
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

function socialPostCard(post,{compact=false}={}){
  const player=post.author_type!=='club';
  return `<article class="panel social-post" data-post-card="${post.id}">
    <div class="social-post-head">
      <a data-link href="/${player?'spieler':'club'}/${esc(post.author_slug)}" class="social-author-avatar"><img src="${authorImage(post)}" alt="">${player?onlineDot(post.author_online):''}</a>
      <div><a data-link href="/${player?'spieler':'club'}/${esc(post.author_slug)}"><strong>${esc(post.author_name)}</strong></a><small>${player?(Number(post.author_online)?'Online':'Offline'):'Club'} • ${formatDateTime(post.created_at)}</small></div>
    </div>
    <p class="social-post-body">${esc(post.body)}</p>
    ${post.media_key?`<img class="social-post-media" src="${assetUrl(post.media_key,'')}" alt="Beitragsbild">`:''}
    ${state.me?.managed_club_slug?`<div class="social-identity"><label>Interagieren als <select data-social-actor><option value="">${esc(state.me.username)}</option><option value="${esc(state.me.managed_club_slug)}">Club (${esc(state.me.managed_club_slug)})</option></select></label></div>`:''}
    <div class="reaction-summary"><span>❤️ ${fmt(post.likes||0)}</span><span>🔥 ${fmt(post.fires||0)}</span><span>👏 ${fmt(post.claps||0)}</span><span>⚽ ${fmt(post.goals||0)}</span><button type="button" data-comments-toggle="${post.id}">💬 ${fmt(post.comments||0)} Kommentare</button></div>
    <div class="reaction-actions">
      <button type="button" data-post-reaction="LIKE" data-post-id="${post.id}">❤️ Gefällt mir</button>
      <button type="button" data-post-reaction="FIRE" data-post-id="${post.id}">🔥</button>
      <button type="button" data-post-reaction="CLAP" data-post-id="${post.id}">👏</button>
      <button type="button" data-post-reaction="GOAL" data-post-id="${post.id}">⚽</button>
      <button type="button" data-comments-toggle="${post.id}">Kommentieren</button>
    </div>
    <div class="post-comments" data-comments-for="${post.id}" hidden></div>
  </article>`;
}
function renderHomeSocialFeed(){
  if(!state.me)return '';
  const cards=state.socialFeed.length?state.socialFeed.map(p=>socialPostCard(p)).join(''):`<div class="panel social-feed-empty">${emptyCard('Dein Feed ist noch leer','Folge Spielern oder Clubs. Deren neue Beiträge erscheinen danach automatisch hier.')}</div>`;
  return `<section class="container home-social"><div class="social-feed-head"><div><div class="eyebrow">DEIN NETZWERK</div><h2>Community Feed</h2><p>Neueste Beiträge von Spielern und Clubs, denen du folgst.</p></div><a class="btn btn-ghost" data-link href="/spieler">SPIELER ENTDECKEN</a></div><div class="home-social-grid"><div class="social-feed-stream">${cards}</div><aside class="panel social-feed-side"><div class="panel-title">EPL SOCIAL</div><p>Folge Spielern und Teams, reagiere auf Beiträge, kommentiere und antworte direkt in deinem persönlichen Feed.</p><div class="social-side-stat"><strong>${fmt([...state.following].filter(x=>x.startsWith('player:')).length)}</strong><span>Spieler gefolgt</span></div><div class="social-side-stat"><strong>${fmt([...state.following].filter(x=>x.startsWith('club:')).length)}</strong><span>Clubs gefolgt</span></div></aside></div></section>`;
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
  <div class="container"><div class="welcome-row"><section class="panel welcome-box"><img class="trophy-mini" src="${demo.brand.trophy}" alt="EPL"><div class="welcome-copy"><h2>Willkommen bei der Elite Pro League</h2><p>Die Elite Pro League ist die kompetitive Online Pro-Clubs-Liga für ambitionierte Spieler, starke Teams und echte Fußball-Esports-Action.</p><div class="mini-features"><span>🏆 Echte Wettbewerbe</span><span>⚔ Aktive Community</span><span>◉ Professionelle Organisation</span><span>○ Faire Regeln</span></div></div></section><section class="panel register-callout"><h3>⚑ REGISTRIERUNG IST GEÖFFNET!</h3><p>Erstelle jetzt dein Spielerprofil, tritt einem Club bei oder gründe dein eigenes Team.</p><div class="steps"><span class="step">♟ Profil erstellen<br>und loslegen</span><b class="step-arrow">→</b><span class="step">♧ Club beitreten<br>oder gründen</span><b class="step-arrow">→</b><span class="step">🏆 Um den Titel<br>kämpfen</span><a class="btn btn-primary" data-link href="/registrieren">JETZT REGISTRIEREN</a></div></section></div>
  <div class="home-grid">
    <section class="panel home-card"><div class="section-head"><span class="panel-title">Neueste News</span><a data-link href="/news" class="section-link">Alle News ›</a></div>${news.slice(0,3).map(n=>`<div class="news-item"><img src="${n.image||assetUrl(n.image_key,demo.brand.trophy)}"><div><h4>${esc(n.title)}</h4><p>${esc(n.excerpt||'')}</p><time>${esc(n.published_at?formatDateTime(n.published_at):'')}</time></div></div>`).join('')}</section>
    <section class="panel home-card"><div class="section-head"><span class="panel-title">Nächste Spiele</span><a data-link href="/liga" class="section-link">Alle Spiele ›</a></div>${fixtures.length?fixtures.map(f=>`<div class="fixture"><span>${formatDateTime(f.scheduled_at).split(' ')[0]}</span><span>${formatDateTime(f.scheduled_at).split(' ')[1]||'--:--'}</span><span class="team"><img class="club-mark sm" src="${clubLogoFor({logo_key:f.home_logo_key})}"><span>${esc(f.home_name)}<small class="div">${esc(f.division_name||'Division')}</small></span></span><span>vs</span><span class="team"><img class="club-mark sm" src="${clubLogoFor({logo_key:f.away_logo_key})}"><span>${esc(f.away_name)}</span></span></div>`).join(''):`${emptyCard('Noch kein Spielplan vorhanden.','Wenn Matches erstellt wurden, erscheinen hier automatisch die kommenden Begegnungen.')}`}</section>
    <section class="panel home-card"><div class="section-head"><span class="panel-title">Top-Scorer</span><a data-link href="/spieler" class="section-link">Alle Statistiken ›</a></div>${scorers.length?scorers.map((p,i)=>`<div class="scorer"><span>${i+1}.</span><span class="mini-avatar-wrap"><img src="${avatarFor(p)}" alt="">${onlineDot(p.is_online)}</span><div><div class="name">${esc(p.username)}</div><div class="club">${esc(clubName(p))}</div></div><div class="goals">${fmt(p.goals)}<small style="display:block;font-size:8px;color:#a7b2bf">TORE</small></div></div>`).join(''):emptyCard('Noch keine Spielerstatistiken vorhanden.','Sobald Spieler registriert und Matchdaten gepflegt werden, erscheint hier die Scorerliste.')}</section>
    <section class="panel home-card"><div class="panel-title">Warum EPL?</div>${demo.featureIcons.map(x=>`<div class="feature-row"><div class="feature-icon img"><img src="${x.image}" alt="${esc(x.title)}"></div><div><strong>${x.title}</strong><p>${x.text}</p></div></div>`).join('')}</section>
  </div></div>${renderHomeSocialFeed()}`;
}

function renderPlayerProfileShell(slug){
  return `<section class="container simple-page"><div id="playerProfileMount" class="loading-block">Spielerprofil wird geladen…</div></section>`;
}
function renderClubProfileShell(slug){
  return `<section class="container simple-page"><div id="clubProfileMount" class="loading-block">Teamprofil wird geladen…</div></section>`;
}

function postComposer({clubSlug='',avatar='',name=''}={}){
  if(!state.me)return '';
  return `<form class="panel social-composer" data-post-composer data-club-slug="${esc(clubSlug)}"><div class="composer-head">${avatar?`<img src="${avatar}" alt="">`:''}<div><strong>${esc(name||state.me.username)}</strong><small>${clubSlug?'Als Club posten':'Auf deinem Spielerprofil posten'}</small></div></div><textarea name="body" rows="3" maxlength="2000" placeholder="Was gibt es Neues?" required></textarea><div class="composer-media"><label class="btn btn-ghost btn-small">＋ BILD <input type="file" name="postMedia" accept="image/png,image/jpeg,image/webp" hidden></label><small data-crop-status="post-media">Optional • Bild wird optimiert.</small></div><div class="composer-actions"><span>Kommentare, Antworten & Reaktionen aktiviert</span><button class="btn btn-primary btn-small" type="submit">BEITRAG POSTEN</button></div></form>`;
}
function renderInventoryCards(items,equipped={}){
  if(!items?.length)return emptyCard('Noch keine Shop-Inhalte','Gekaufte Profilrahmen, Titelbildrahmen, Namenseffekte und Badges erscheinen hier.');
  return `<div class="inventory-grid">${items.map(item=>{const img=shopImageById(item.id);const active=Number(equipped.avatarFrame)===Number(item.id)||Number(equipped.coverFrame)===Number(item.id)||Number(equipped.nameEffect)===Number(item.id);return `<article class="panel inventory-card ${active?'equipped':''}">${img?`<img src="${img}" alt="${esc(item.name)}">`:''}<div><span class="inventory-category">${esc(item.category)}</span><h3>${esc(item.name)}</h3><p>${esc(item.description||'')}</p><small>${esc(item.rarity||'')}</small>${active?'<b>✓ AUSGERÜSTET</b>':''}</div></article>`}).join('')}</div>`;
}
function renderPlayerProfile(data, slug){
  if(!data?.profile) return `<div class="container simple-page"><div class="panel data-panel">${emptyCard('Profil nicht gefunden.','Dieses Profil existiert noch nicht oder wurde noch nicht erstellt.')}</div></div>`;
  const p=data.profile, stats=data.stats||{}, posts=data.posts||[], matches=data.recentMatches||[], achievements=data.achievements||[], clubHistory=data.clubHistory||[], inventory=data.inventory||[];
  const own=state.me && state.me.username?.toLowerCase()===p.username.toLowerCase(), followKey=`player:${slug}`, following=state.following.has(followKey);
  const pos=[p.position,p.secondary_position].filter(Boolean).join(' / ')||'Spieler';
  const avatarFrame=shopImageById(p.equipped_avatar_frame_id),coverFrame=shopImageById(p.equipped_cover_frame_id),nameEffect=Number(p.equipped_name_effect_id)>0;
  const authoredPosts=posts.map(post=>({...post,author_type:'player',author_name:p.username,author_slug:slug,author_image_key:p.avatar_key,author_online:p.is_online}));
  const postCards=authoredPosts.length?authoredPosts.map(post=>socialPostCard(post)).join(''):`<article class="panel ref-empty-card">${emptyCard('Noch keine Beiträge','Erstelle deinen ersten Beitrag und teile Neuigkeiten mit der EPL Community.')}</article>`;
  const highlightPosts=authoredPosts.filter(x=>x.media_key);
  const matchCards=matches.length?matches.map((m,i)=>`<article class="panel ref-match-card"><div class="ref-card-head"><span>${esc(i===0?'LETZTES SPIEL':'MATCH')}</span><small>${formatDateTime(m.scheduled_at)}</small></div><div class="ref-score-row"><span>${esc(m.home_name)}</span><strong>${m.home_score ?? '-'} : ${m.away_score ?? '-'}</strong><span>${esc(m.away_name)}</span></div><div class="ref-match-sub"><span><b>${fmt(m.goals)}</b>Tore</span><span><b>${fmt(m.assists)}</b>Assists</span><span><b>${Number(m.rating||0).toFixed(1)}</b>Rating</span></div></article>`).join(''):`<article class="panel ref-empty-card">${emptyCard('Noch keine Matches','Sobald bestätigte Match-Statistiken vorliegen, erscheinen hier die letzten Spiele.')}</article>`;
  const achievementCards=achievements.length?achievements.map(a=>`<div class="ref-trophy"><div class="ref-trophy-icon">🏆</div><strong>${esc(a.title)}</strong><small>${esc(a.subtitle||'')}</small></div>`).join(''):`<div class="ref-mini-empty">Noch keine Trophäen</div>`;
  const attrs=[['PAC',p.pac],['SHO',p.sho],['PAS',p.pas],['DRI',p.dri],['DEF',p.def],['PHY',p.phy]];
  const tabs=[['posts','Beiträge'],['highlights','Highlights'],['stats','Statistiken'],['career','Karriere'],['clubs','Clubs'],...(own?[['inventory','Shop-Inhalte']]:[])];
  return `<section class="ref-player-hero">
    <img class="ref-player-cover" src="${coverFor(p)}" alt="Titelbild">${coverFrame?`<img class="equipped-cover-frame" src="${coverFrame}" alt="Titelbildrahmen">`:''}
    <div class="container ref-player-hero-inner">
      <div class="ref-avatar square-avatar"><img class="avatar-base" src="${avatarFor(p)}" alt="${esc(p.username)}">${avatarFrame?`<img class="equipped-avatar-frame" src="${avatarFrame}" alt="Profilbildrahmen">`:''}${onlineDot(p.is_online)}</div>
      <div class="ref-player-copy"><h1 class="${nameEffect?'equipped-name-effect':''}">${esc(p.username)} ${p.verified?'<i class="verified">✓</i>':''}</h1><div class="ref-subtitle">${esc(pos)} • ${esc(p.club||'Elite Pro League')} • <span class="${Number(p.is_online)?'green':'muted'}">${Number(p.is_online)?'Online':'Offline'}</span></div><p>${esc(p.bio||'Neu in der Elite Pro League.')}</p><div class="profile-actions"><button class="btn btn-primary" data-follow="${followKey}">${following?'✓ FOLGE ICH':'+ FOLGEN'}</button><button class="btn btn-ghost" data-message>▣ Nachricht</button>${own?'<button class="btn btn-ghost" data-edit-profile>✎ Profil & Cosmetics</button>':''}</div></div>
    </div>
  </section>
  <div class="container ref-profile-wrap">
    <section class="panel ref-profile-statbar"><div class="ref-rank">🏆 <span>EPL PRO</span></div><div><strong>${fmt(p.followers)}</strong><span>Follower</span></div><div><strong>${fmt(p.following)}</strong><span>Folge ich</span></div><div><strong>${fmt(stats.matches)}</strong><span>Matches</span></div><div><strong>${fmt(stats.goals)}</strong><span>Tore</span></div><div><strong>${fmt(stats.assists)}</strong><span>Assists</span></div><div class="ref-rating"><strong>${Number(stats.rating||0).toFixed(2)}</strong><span>Rating</span></div></section>
    <div class="ref-tabs">${tabs.map(([key,label],i)=>`<button class="tab-btn ${i===0?'active':''}" data-profile-tab="${key}">${label}</button>`).join('')}</div>

    <section data-profile-panel="posts" class="profile-tab-panel active"><div class="ref-profile-grid"><section class="ref-feed-column">${own?postComposer({avatar:avatarFor(p),name:p.username}):''}${postCards}</section><section class="ref-center-column">${matchCards}</section><aside class="ref-side-column"><section class="panel ref-side-box"><div class="ref-box-title"><span>SAISON STATISTIKEN</span></div><div class="ref-season-grid"><div><strong>${fmt(stats.matches)}</strong><span>Spiele</span></div><div><strong>${fmt(stats.goals)}</strong><span>Tore</span></div><div><strong>${fmt(stats.assists)}</strong><span>Assists</span></div><div><strong>${Number(stats.rating||0).toFixed(2)}</strong><span>Rating</span></div></div></section><section class="panel ref-side-box"><div class="ref-box-title"><span>TROPHÄEN</span></div><div class="ref-trophy-grid">${achievementCards}</div></section><section class="panel ref-side-box"><div class="ref-box-title"><span>ATTRIBUTE</span><b>GES ${fmt(p.overall)}</b></div><div class="ref-attrs">${attrs.map(([k,v])=>`<div><span>${k}</span><i><em style="width:${Math.max(0,Math.min(100,Number(v||0)))}%"></em></i><strong>${fmt(v)}</strong></div>`).join('')}</div></section></aside></div></section>

    <section data-profile-panel="highlights" class="profile-tab-panel"><div class="tab-section-head"><h2>Highlights</h2><p>Beiträge mit Bildern und Medien aus diesem Spielerprofil.</p></div><div class="profile-tab-grid">${highlightPosts.length?highlightPosts.map(post=>socialPostCard(post)).join(''):emptyCard('Noch keine Highlights','Sobald ein Beitrag mit Medien veröffentlicht wurde, erscheint er hier.')}</div></section>

    <section data-profile-panel="stats" class="profile-tab-panel"><div class="tab-section-head"><h2>Statistiken</h2><p>Leistungswerte aus bestätigten EPL Matches.</p></div><div class="stats-detail-grid"><section class="panel ref-side-box"><div class="ref-box-title"><span>SAISON</span></div><div class="big-stat-grid"><div><strong>${fmt(stats.matches)}</strong><span>Spiele</span></div><div><strong>${fmt(stats.goals)}</strong><span>Tore</span></div><div><strong>${fmt(stats.assists)}</strong><span>Assists</span></div><div><strong>${fmt(stats.saves)}</strong><span>Saves</span></div><div><strong>${fmt(stats.motm)}</strong><span>MOTM</span></div><div><strong>${Number(stats.rating||0).toFixed(2)}</strong><span>Rating</span></div></div></section><section class="panel ref-side-box"><div class="ref-box-title"><span>FC ATTRIBUTE</span><b>GES ${fmt(p.overall)}</b></div><div class="ref-attrs large">${attrs.map(([k,v])=>`<div><span>${k}</span><i><em style="width:${Math.max(0,Math.min(100,Number(v||0)))}%"></em></i><strong>${fmt(v)}</strong></div>`).join('')}</div></section></div></section>

    <section data-profile-panel="career" class="profile-tab-panel"><div class="tab-section-head"><h2>Karriere</h2><p>Spielhistorie und persönliche Auszeichnungen.</p></div><div class="career-grid"><div>${matchCards}</div><section class="panel ref-side-box"><div class="ref-box-title"><span>TROPHÄEN & AUSZEICHNUNGEN</span></div><div class="ref-trophy-grid expanded">${achievementCards}</div></section></div></section>

    <section data-profile-panel="clubs" class="profile-tab-panel"><div class="tab-section-head"><h2>Clubs</h2><p>Aktueller Verein und bisherige EPL Vereinsstationen.</p></div><div class="club-history-list">${clubHistory.length?clubHistory.map(c=>`<a class="panel club-history-card" data-link href="/club/${esc(c.slug)}"><strong>${esc(c.name)}</strong><span>${esc(c.role||'PLAYER')}</span><small>${formatDateTime(c.joined_at)} ${c.left_at?`– ${formatDateTime(c.left_at)}`:'– aktuell'}</small></a>`).join(''):emptyCard('Noch keine Vereinsstationen','Dieser Spieler war bisher keinem Club zugeordnet.')}</div></section>

    ${own?`<section data-profile-panel="inventory" class="profile-tab-panel"><div class="tab-section-head"><div><h2>Meine Shop-Inhalte</h2><p>Alle gekauften Cosmetics. Ausrüsten kannst du sie über „Profil & Cosmetics“.</p></div><button class="btn btn-primary" data-edit-profile>PROFIL & COSMETICS</button></div>${renderInventoryCards(inventory,{avatarFrame:p.equipped_avatar_frame_id,coverFrame:p.equipped_cover_frame_id,nameEffect:p.equipped_name_effect_id})}</section>`:''}
  </div>`;
}

function renderClubProfile(data, slug){
  if(!data?.club) return `<div class="container simple-page"><div class="panel data-panel">${emptyCard('Club nicht gefunden.','Dieser Club existiert noch nicht oder wurde noch nicht angelegt.')}</div></div>`;
  const c=data.club,squad=data.squad||[],posts=data.posts||[],recent=data.recentMatches||[],upcoming=data.upcomingMatches||[],transfers=data.transfers||[],achievements=data.achievements||[],topPlayers=data.topPlayers||[];
  const followKey=`club:${slug}`, following=state.following.has(followKey), canEdit=!!state.me&&(state.me.role==='SUPER_ADMIN'||state.me.is_admin||state.me.managed_club_slug===slug);
  const authoredPosts=posts.map(post=>({...post,author_type:'club',author_name:c.name,author_slug:slug,author_image_key:c.logo_key,author_online:0}));
  const postList=authoredPosts.length?authoredPosts.map(post=>socialPostCard(post)).join(''):`<div class="ref-mini-empty big">Noch keine Club-Beiträge.</div>`;
  const squadCards=squad.length?squad.map(m=>`<a class="ref-squad-card" data-link href="/spieler/${esc(m.username.toLowerCase())}"><span class="ref-squad-rating">${fmt(m.overall)}</span><span class="ref-squad-pos">${esc(m.position||'--')}</span><span class="squad-avatar-wrap"><img src="${avatarFor(m)}">${onlineDot(m.is_online)}</span><strong>${esc(m.username)}</strong><small>${esc(m.role||'PLAYER')}</small></a>`).join(''):`<div class="ref-mini-empty big">Noch kein Kader vorhanden.</div>`;
  const recentLines=recent.length?recent.map(m=>`<div class="ref-game-line"><small>${formatDateTime(m.scheduled_at)}</small><span>${esc(m.home_name)}</span><strong>${m.home_score ?? '-'}:${m.away_score ?? '-'}</strong><span>${esc(m.away_name)}</span></div>`).join(''):'<div class="ref-mini-empty">Noch keine Ergebnisse.</div>';
  const upcomingLines=upcoming.length?upcoming.map(m=>`<div class="ref-game-line"><small>${formatDateTime(m.scheduled_at)}</small><span>${esc(m.home_name)}</span><strong>VS</strong><span>${esc(m.away_name)}</span></div>`).join(''):'<div class="ref-mini-empty">Noch keine Spiele geplant.</div>';
  return `<section class="ref-club-hero"><img class="ref-club-cover" src="${coverFor(c)}" alt=""><div class="container ref-club-hero-inner"><div class="ref-club-logo"><img src="${clubLogoFor(c)}"></div><div class="ref-club-copy"><h1>${esc(c.name)} ${c.verified?'<i class="verified">✓</i>':''}</h1><span class="badge">${esc(c.division_name||'Ohne Division')}</span><p>Manager: ${esc(c.manager_username||'Noch nicht vergeben')}</p><p>${esc(c.bio||'')}</p><div class="club-actions"><button class="btn btn-primary" data-follow="${followKey}">${following?'✓ FOLGE ICH':'+ FOLGEN'}</button><button class="btn btn-ghost" data-apply>▣ BEWERBEN</button><button class="btn btn-ghost" data-message>✉ KONTAKT</button>${canEdit?'<button class="btn btn-ghost" data-club-media>✎ CLUB MEDIEN</button>':''}</div></div><section class="panel ref-club-reputation"><div><strong>${fmt(c.followers_count)}</strong><span>Follower</span></div><div class="ref-rep"><span>Club Reputation</span><strong>${fmt(c.reputation)}</strong><i><em style="width:${Math.min(100,(Number(c.reputation||0)/5000)*100)}%"></em></i></div></section></div></section>
  <div class="container ref-club-wrap"><div class="ref-tabs club-profile-tabs">${[['feed','Feed'],['squad','Kader'],['stats','Statistiken'],['matches','Spiele'],['transfers','Transfers'],['gallery','Galerie']].map(([key,label],i)=>`<button class="tab-btn ${i===0?'active':''}" data-club-tab="${key}">${label}</button>`).join('')}</div>

  <section data-club-panel="feed" class="club-tab-panel active"><div class="ref-club-grid"><section class="ref-club-feed-column">${canEdit?postComposer({clubSlug:slug,avatar:clubLogoFor(c),name:c.name}):''}${postList}</section><section class="ref-club-main"><section class="panel ref-side-box"><div class="ref-box-title"><span>KADER – STARTELF</span></div><div class="ref-squad-grid">${squadCards}</div></section><div class="ref-games-split"><article class="panel ref-side-box"><div class="ref-box-title"><span>LETZTE SPIELE</span></div>${recentLines}</article><article class="panel ref-side-box"><div class="ref-box-title"><span>NÄCHSTE SPIELE</span></div>${upcomingLines}</article></div></section><aside class="ref-club-side"><section class="panel ref-side-box"><div class="ref-box-title"><span>TOP SPIELER</span></div>${topPlayers.length?topPlayers.map((m,i)=>`<div class="ref-top-player"><b>${i+1}.</b><img src="${avatarFor(m)}"><span><strong>${esc(m.username)}</strong><small>${esc(m.position||'--')} | ${fmt(m.overall)} GES</small></span><em>${fmt(m.goals)} Tore</em></div>`).join(''):'<div class="ref-mini-empty">Noch keine Statistiken.</div>'}</section><section class="panel ref-side-box"><div class="ref-box-title"><span>CLUB ERFOLGE</span></div>${achievements.length?achievements.slice(0,4).map(a=>`<div class="ref-achievement-line">🏆 <span>${esc(a.title)}<small>${esc(a.subtitle||'')}</small></span></div>`).join(''):'<div class="ref-mini-empty">Noch keine Erfolge.</div>'}</section><section class="panel ref-side-box"><div class="ref-box-title"><span>TRANSFERMARKT</span></div>${transfers.length?transfers.slice(0,5).map(t=>`<div class="ref-transfer-line"><span>${esc(t.player)}</span><strong class="${t.to_club===c.name?'green':'red'}">${t.to_club===c.name?'ZUGANG':'ABGANG'}</strong></div>`).join(''):'<div class="ref-mini-empty">Keine Transfers.</div>'}</section></aside></div></section>

  <section data-club-panel="squad" class="club-tab-panel"><div class="tab-section-head"><h2>Kader</h2><p>Alle aktuell registrierten Spieler des Clubs.</p></div><div class="ref-squad-grid full">${squadCards}</div></section>
  <section data-club-panel="stats" class="club-tab-panel"><div class="tab-section-head"><h2>Club Statistiken</h2><p>Leistungsübersicht und Top-Spieler.</p></div><div class="stats-detail-grid"><section class="panel ref-side-box"><div class="ref-box-title"><span>CLUB</span></div><div class="big-stat-grid"><div><strong>${fmt(c.followers_count)}</strong><span>Follower</span></div><div><strong>${fmt(c.reputation)}</strong><span>Reputation</span></div><div><strong>${fmt(squad.length)}</strong><span>Spieler</span></div></div></section><section class="panel ref-side-box"><div class="ref-box-title"><span>TOP SPIELER</span></div>${topPlayers.length?topPlayers.map((m,i)=>`<div class="ref-top-player"><b>${i+1}.</b><img src="${avatarFor(m)}"><span><strong>${esc(m.username)}</strong><small>${esc(m.position||'--')}</small></span><em>${fmt(m.goals)} Tore</em></div>`).join(''):emptyCard('Noch keine Statistik','Matchdaten werden nach bestätigten Spielen angezeigt.')}</section></div></section>
  <section data-club-panel="matches" class="club-tab-panel"><div class="tab-section-head"><h2>Spiele</h2><p>Ergebnisse und kommende Begegnungen.</p></div><div class="ref-games-split wide"><article class="panel ref-side-box"><div class="ref-box-title"><span>LETZTE SPIELE</span></div>${recentLines}</article><article class="panel ref-side-box"><div class="ref-box-title"><span>NÄCHSTE SPIELE</span></div>${upcomingLines}</article></div></section>
  <section data-club-panel="transfers" class="club-tab-panel"><div class="tab-section-head"><h2>Transfers</h2><p>Zugänge und Abgänge des Clubs.</p></div><section class="panel ref-side-box">${transfers.length?transfers.map(t=>`<div class="ref-transfer-line"><span>${esc(t.player)} <small>${formatDateTime(t.occurred_at)}</small></span><strong class="${t.to_club===c.name?'green':'red'}">${t.to_club===c.name?'ZUGANG':'ABGANG'}</strong></div>`).join(''):emptyCard('Keine Transfers','Hier erscheinen zukünftige Transfers automatisch.')}</section></section>
  <section data-club-panel="gallery" class="club-tab-panel"><div class="tab-section-head"><h2>Galerie</h2><p>Medien aus den Beiträgen des Clubs.</p></div><div class="club-gallery">${authoredPosts.filter(x=>x.media_key).length?authoredPosts.filter(x=>x.media_key).map(x=>`<img src="${assetUrl(x.media_key,'')}" alt="Club Galerie">`).join(''):emptyCard('Noch keine Galeriebilder','Medien aus Club-Beiträgen erscheinen automatisch hier.')}</div></section>
  </div>`;
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
function playersCards(list){ return list.length ? list.map(p=>`<a data-link href="/spieler/${p.slug}" class="panel player-tile"><span class="player-list-avatar"><img src="${avatarFor(p)}">${p.equipped_avatar_frame_id?`<img class="player-list-frame" src="${shopImageById(p.equipped_avatar_frame_id)}">`:''}${onlineDot(p.is_online)}</span><div><h3 class="${p.equipped_name_effect_id?'equipped-name-effect':''}">${esc(p.username)}</h3><div class="blue">${esc(p.position||'Spieler')}</div><div class="meta">${esc(clubName(p))} • ${esc(p.country||'—')} • <span class="${Number(p.is_online)?'green':'muted'}">${Number(p.is_online)?'Online':'Offline'}</span></div></div><div class="player-mini-stats"><div><strong>${fmt(p.matches)}</strong><span>Matches</span></div><div><strong>${fmt(p.goals)}</strong><span>Tore</span></div><div><strong>${fmt(p.assists)}</strong><span>Assists</span></div><div><strong>${fmt(p.rating)}</strong><span>GES</span></div></div></a>`).join('') : emptyCard('Noch keine Spieler registriert.','Sobald sich die ersten Spieler registrieren, erscheinen hier automatisch ihre Profile.'); }

function renderNews(){
  const news = state.live.news.length ? state.live.news : demo.newsPlaceholders;
  return `<div class="container simple-page"><div class="page-heading"><div><div class="eyebrow">EPL Redaktion</div><h1>News</h1><p>Ligabetrieb, Transfers, Interviews und Community Updates.</p></div></div><div class="teams-grid">${news.map(n=>`<article class="panel team-tile"><img src="${n.image || demo.brand.trophy}" style="width:100%;height:105px;object-fit:cover;border-radius:7px"><h3 style="margin-top:12px">${esc(n.title)}</h3><p class="muted tiny" style="line-height:1.6">${esc(n.excerpt||'')}</p><span class="section-link">${esc(n.published_at?formatDateTime(n.published_at):'Noch kein Datum')} • WEITERLESEN ›</span></article>`).join('')}</div></div>`;
}

function renderTransfers(){
  const transfers = state.live.transfers;
  return `<div class="container simple-page"><div class="page-heading"><div><div class="eyebrow">Markt</div><h1>Transfers</h1><p>Vertragsbewegungen, Free Agents und Bewerbungen.</p></div><button class="btn btn-primary" data-freeagent>FREE-AGENT STATUS</button></div><div class="transfer-market"><section class="panel data-panel"><div class="panel-title">Aktuelle Transfers</div>${transfers.length?transfers.map(t=>`<div class="transfer-card"><img src="${demo.brand.defaultAvatar}" style="width:42px;height:42px;border-radius:50%"><div><strong>${esc(t.player||'Unbekannt')}</strong><small class="muted" style="display:block">${esc(t.position||'--')} | ${fmt(t.rating)} GES</small></div><span>${esc(t.from_club || 'Free Agent')}</span><span class="arrow-big">→</span><span>${esc(t.to_club || 'Noch offen')}</span><span class="${t.type==='JOIN'?'green':'blue'}">${esc(t.type||'TRANSFER')}<small style="display:block;color:#9da8b4">${esc(t.created_at?formatDateTime(t.created_at):'')}</small></span></div>`).join(''):emptyCard('Noch keine Transfers vorhanden.','Sobald Verträge, Bewerbungen oder Transfers erfasst werden, erscheinen sie hier automatisch.')}</section><aside class="panel data-panel"><div class="panel-title">Free Agents</div><div class="empty">Aktiviere im Profil den Free-Agent-Status, damit interessierte Manager dich hier finden.</div></aside></div></div>`;
}

function renderRules(){
  return `<div class="container simple-page"><div class="page-heading"><div><div class="eyebrow">Fair Play</div><h1>Regelwerk</h1><p>Grundregeln für Spieler, Manager und Ligabetrieb.</p></div></div><div class="rules-grid"><aside class="panel rule-nav">${['Allgemein','Registrierung','Kader & Verträge','Matchbetrieb','Ergebnisse','Transfers','Sperren','Verhalten'].map((x,i)=>`<button class="${i===0?'active':''}">${x}</button>`).join('')}</aside><article class="panel rule-content"><h2>1. Allgemeine Bestimmungen</h2><p>Die Elite Pro League ist eine kompetitive Pro-Clubs-Liga. Jeder Spieler darf nur einen aktiven Account führen. Unsportliches Verhalten, absichtliche Spielmanipulation oder Täuschung kann zu Sanktionen führen.</p><h3>2. Registrierung</h3><p>Spieler melden sich sicher über Google oder Discord an und ergänzen anschließend EA ID, Plattform und Profilinformationen. Manager und Liga-Admins verwalten danach Clubs, Verträge, Bewerbungen und Spieltage.</p><h3>3. Matchbetrieb</h3><p>Spiele werden nach Spielplan angesetzt. Ergebnisse müssen bestätigt werden, bevor sie in Tabelle und Statistiken einfließen.</p><h3>4. Transfers</h3><p>Vertragsangebote, Bewerbungen und Wechsel laufen über die Plattform und können von berechtigten Rollen nachvollzogen werden.</p></article></div></div>`;
}

function oauthButton(provider,label,enabled){
  const cls=`oauth-btn oauth-${provider}${enabled?'':' disabled'}`;
  if(!enabled)return `<button class="${cls}" type="button" disabled><span class="oauth-mark">${provider==='google'?'G':'D'}</span><span>${label}</span><small>Noch nicht eingerichtet</small></button>`;
  return `<a class="${cls}" href="/api/auth/oauth/${provider}/start"><span class="oauth-mark">${provider==='google'?'G':'D'}</span><span>${label}</span><span class="oauth-arrow">→</span></a>`;
}
function renderOAuthAuth(mode='login'){
  if(state.me){
    const incomplete=Number(state.me.profile_completed||0)!==1;
    return `<div class="auth-wrap"><section class="panel auth-card oauth-card"><div class="oauth-kicker">EPL ACCOUNT</div><h1>Du bist bereits angemeldet</h1><p class="muted">Angemeldet als <strong>${esc(state.me.username)}</strong>.</p><div class="form-actions">${incomplete?'<a class="btn btn-primary" data-link href="/profil-einrichten">PROFIL VERVOLLSTÄNDIGEN</a>':`<a class="btn btn-primary" data-link href="/spieler/${esc(state.me.username.toLowerCase())}">ZU MEINEM PROFIL</a>`}</div></section></div>`;
  }
  const isRegister=mode==='register';
  return `<div class="auth-wrap"><section class="panel auth-card oauth-card">
    <div class="oauth-kicker">EPL • ELITE PRO LEAGUE</div>
    <h1>${isRegister?'EPL Account erstellen':'Bei EPL anmelden'}</h1>
    <p class="muted">${isRegister?'Registriere dich sicher mit deinem bestehenden Google- oder Discord-Konto.':'Nutze dein Google- oder Discord-Konto. Kein EPL-Passwort erforderlich.'}</p>
    <div class="oauth-stack">
      ${oauthButton('discord','Weiter mit Discord',state.config.oauthDiscordEnabled)}
      ${oauthButton('google','Weiter mit Google',state.config.oauthGoogleEnabled)}
    </div>
    <div class="oauth-security"><span>✓</span><div><strong>Kein Passwort bei EPL</strong><small>Google bzw. Discord bestätigt deine Identität. EPL erhält nur die für dein Konto nötigen Basisdaten.</small></div></div>
    <p class="oauth-foot">Nach der ersten Anmeldung ergänzt du nur noch EA ID, Plattform, Position und Trikotnummer.</p>
    ${(!state.config.oauthDiscordEnabled&&!state.config.oauthGoogleEnabled)?'<div class="oauth-warning">Die OAuth-Zugangsdaten müssen noch in Cloudflare eingerichtet werden.</div>':''}
  </section></div>`;
}
function renderRegister(){return renderOAuthAuth('register');}
function renderLogin(){return renderOAuthAuth('login');}
function renderProfileSetup(){
  if(!state.me)return `<div class="auth-wrap"><section class="panel auth-card"><h1>Anmeldung erforderlich</h1><p class="muted">Melde dich zuerst mit Google oder Discord an.</p><div class="form-actions"><a class="btn btn-primary" data-link href="/login">ZUM LOGIN</a></div></section></div>`;
  if(Number(state.me.profile_completed||0)===1)return `<div class="auth-wrap"><section class="panel auth-card"><h1>Profil ist vollständig</h1><p class="muted">Dein EPL Spielerprofil wurde bereits eingerichtet.</p><div class="form-actions"><a class="btn btn-primary" data-link href="/spieler/${esc(state.me.username.toLowerCase())}">MEIN PROFIL ÖFFNEN</a></div></section></div>`;
  const username=esc(state.me.username||'');
  return `<div class="auth-wrap profile-setup-wrap"><section class="panel auth-card profile-setup-card">
    <div class="setup-progress"><span class="done">1</span><i></i><span class="active">2</span></div>
    <div class="oauth-kicker">SCHRITT 2 VON 2</div><h1>Spielerprofil vervollständigen</h1>
    <p class="muted">Dein Login ist erledigt. Jetzt fehlen nur noch deine Pro-Clubs-Daten.</p>
    <form id="profileSetupForm"><div class="form-grid">
      <div class="field"><label>EPL Benutzername *</label><input name="username" value="${username}" minlength="3" maxlength="24" pattern="[A-Za-z0-9_.-]{3,24}" required><small>3–24 Zeichen: Buchstaben, Zahlen, _ . -</small></div>
      <div class="field"><label>EA ID *</label><input name="eaId" value="${esc(state.me.ea_id||'')}" maxlength="80" placeholder="z. B. ChabaChuba" required></div>
      <div class="field"><label>Plattform *</label><select name="platform" required><option value="">Bitte wählen</option><option value="ps5">PlayStation 5</option><option value="xbox-series">Xbox Series X|S</option><option value="pc">PC</option></select></div>
      <div class="field"><label>Land *</label><input name="country" value="${esc(state.me.country||'DE')}" maxlength="2" minlength="2" required></div>
      <div class="field"><label>Hauptposition *</label><select name="position" required><option value="">Bitte wählen</option>${POSITIONS.map(x=>`<option value="${x}">${x}</option>`).join('')}</select></div>
      <div class="field"><label>Nebenposition</label><select name="secondaryPosition"><option value="">Keine</option>${POSITIONS.map(x=>`<option value="${x}">${x}</option>`).join('')}</select></div>
      <div class="field"><label>Trikotnummer *</label><input type="number" name="shirtNumber" min="1" max="99" value="${Number(state.me.shirt_number||10)||10}" required></div>
      <div class="field setup-provider"><label>Login-E-Mail</label><div class="readonly-value">${esc(state.me.email||'')}</div><small>Kommt sicher von deinem Google-/Discord-Konto.</small></div>
    </div><div class="form-actions setup-actions"><button class="btn btn-primary" type="submit">EPL PROFIL ERSTELLEN</button></div></form>
  </section></div>`;
}

function dashboardShell(title, side, body){
  return `<div class="container simple-page"><div class="page-heading"><div><div class="eyebrow">Control Center</div><h1>${title}</h1><p>Direkt für Cloudflare Pages, D1 und R2 vorbereitet.</p></div></div><div class="dashboard-grid"><aside class="panel dash-side"><div class="dash-user"><strong>${esc(state.me?.username || 'Gast')}</strong><div class="tiny muted">${esc(state.me?.role || '—')}</div></div><div class="dash-menu">${side.map((x,i)=>`<button class="${i===0?'active':''}">${x}</button>`).join('')}</div></aside><div>${body}</div></div></div>`;
}
function renderManager(){if(!state.me)return `<div class="container simple-page">${emptyCard('Anmeldung erforderlich','Bitte melde dich zuerst an.')}</div>`;return `<div class="container simple-page"><div id="managerMount" class="panel dash-main">VM Panel wird geladen…</div></div>`;}
function renderAdmin(){if(!state.me)return `<div class="container simple-page">${emptyCard('Anmeldung erforderlich','Bitte melde dich zuerst an.')}</div>`;return `<div class="container simple-page"><div id="adminMount" class="panel dash-main">Admin Panel wird geladen…</div></div>`;}

const ADMIN_ROLE_LABELS={FULL_ADMIN:'Full Admin',USER_ADMIN:'User Admin',LEAGUE_ADMIN:'Liga Admin',MATCH_ADMIN:'Match Admin',NEWS_ADMIN:'News Admin',COIN_ADMIN:'Coin Admin'};
const FRONT_ADMIN_PERMS={FULL_ADMIN:['*'],USER_ADMIN:['users','profiles'],LEAGUE_ADMIN:['clubs','leagues','matches','transfers'],MATCH_ADMIN:['matches','stats'],NEWS_ADMIN:['news'],COIN_ADMIN:['coins']};
function adminCan(data,perm){if(data?.admin?.role==='SUPER_ADMIN')return true;return (data?.admin?.admin_roles||[]).some(r=>(FRONT_ADMIN_PERMS[r]||[]).includes('*')||(FRONT_ADMIN_PERMS[r]||[]).includes(perm));}
function opt(list,value,label='name'){return list.map(x=>`<option value="${x.id}" ${String(x.id)===String(value)?'selected':''}>${esc(x[label]||x.name||x.username)}</option>`).join('')}
function adminTabs(data){const tabs=[['dashboard','Dashboard',true],['users','Benutzer & Rollen',adminCan(data,'profiles')||data.admin.role==='SUPER_ADMIN'],['clubs','Clubs & VM',adminCan(data,'clubs')],['leagues','Ligen & Saisons',adminCan(data,'leagues')],['matches','Spielplan & Ergebnisse',adminCan(data,'matches')],['transfers','Transfers',adminCan(data,'transfers')],['news','News',adminCan(data,'news')]];return tabs.filter(x=>x[2]).map((x,i)=>`<button data-admin-tab="${x[0]}" class="${i===0?'active':''}">${x[1]}</button>`).join('')}

function renderAdminConsole(data){
  state.admin=data;
  const owner=data.admin.role==='SUPER_ADMIN';
  const users=data.users||[],clubs=data.clubs||[],seasons=data.seasons||[],divisions=data.divisions||[],matches=data.matches||[],news=data.news||[],transfers=data.transfers||[];
  const roleBadges=u=>u.role==='SUPER_ADMIN'?'<span class="admin-role owner">HAUPTADMIN</span>':(String(u.admin_roles||'').split(',').filter(Boolean).map(r=>`<span class="admin-role">${esc(ADMIN_ROLE_LABELS[r]||r)}</span>`).join('')||'<span class="muted">Spieler</span>');
  return `<div class="admin-console"><div class="page-heading admin-heading"><div><div class="eyebrow">EPL CONTROL CENTER</div><h1>Admin Panel</h1><p>Benutzer, Rollen, Clubs, Ligen, Matches, Statistiken, Coins, Transfers und News verwalten.</p></div><span class="badge">${owner?'WEBSITE OWNER':esc((data.admin.admin_roles||[]).map(r=>ADMIN_ROLE_LABELS[r]||r).join(' • ')||'ADMIN')}</span></div>
  <div class="admin-workspace"><aside class="panel admin-sidebar"><div class="dash-user"><strong>${esc(data.admin.username)}</strong><div class="tiny muted">${owner?'SUPER_ADMIN':'EPL ADMIN'}</div></div><div class="dash-menu">${adminTabs(data)}</div></aside><main class="admin-main">
    <section data-admin-section="dashboard"><div class="metric-grid"><section class="panel metric"><strong>${users.length}</strong><span>Benutzer</span></section><section class="panel metric"><strong>${clubs.length}</strong><span>Clubs</span></section><section class="panel metric"><strong>${matches.length}</strong><span>Matches</span></section><section class="panel metric"><strong>${news.length}</strong><span>News</span></section></div><section class="panel admin-card"><div class="panel-title">Rollenmodell</div><div class="admin-role-info"><div><b>Hauptadmin</b><span>Nur der Website-Besitzer kann andere Benutzer zu Admins ernennen.</span></div><div><b>Full Admin</b><span>Alle operativen Bereiche, aber keine Ernennung weiterer Admins.</span></div><div><b>VM / Vereinsmanager</b><span>Clubseite, Ergebnisse und Spielerstatistiken des eigenen Vereins.</span></div></div></section></section>
    <section data-admin-section="users" hidden><div class="admin-section-head"><div><h2>Benutzer & Rollen</h2><p>Profile bearbeiten, Coins vergeben, sperren und Admin-Rollen zuweisen.</p></div></div><section class="panel admin-card table-scroll"><table class="admin-table"><thead><tr><th>Benutzer</th><th>EA ID / Position</th><th>Club</th><th>Coins</th><th>Rechte</th><th>Aktionen</th></tr></thead><tbody>${users.map(u=>`<tr><td><strong>${esc(u.username)}</strong><small>${esc(u.email)} • ${esc(u.status)}</small></td><td>${esc(u.ea_id||'—')}<small>${esc(u.position||'—')} • GES ${fmt(u.overall)}</small></td><td>${esc(u.club_name||'Free Agent')}<small>${esc(u.club_role||'')}</small></td><td>${fmt(u.coins)}</td><td>${roleBadges(u)}</td><td class="action-cell"><button class="btn btn-small" data-admin-profile="${u.id}">Profil</button>${adminCan(data,'coins')?`<button class="btn btn-small" data-admin-coins="${u.id}">Coins</button>`:''}${owner&&u.role!=='SUPER_ADMIN'?`<button class="btn btn-small btn-primary" data-admin-access="${u.id}">Rollen</button>`:''}</td></tr>`).join('')}</tbody></table></section></section>
    <section data-admin-section="clubs" hidden><div class="admin-section-head"><div><h2>Clubs & Vereinsmanager</h2><p>Clubs anlegen/bearbeiten und einem registrierten Spieler VM-Rechte geben.</p></div><button class="btn btn-primary" data-admin-club-new>+ CLUB ANLEGEN</button></div><section class="admin-card-grid">${clubs.length?clubs.map(c=>`<article class="panel admin-club-card"><div><strong>${esc(c.name)}</strong><small>${esc(c.division_name||'Ohne Division')} • EA ${esc(c.ea_club_id||'—')}</small></div><div class="admin-club-manager">VM: <b>${esc(c.manager_username||'Nicht vergeben')}</b></div><div class="action-cell"><button class="btn btn-small" data-admin-club-edit="${c.id}">Bearbeiten</button><button class="btn btn-small btn-primary" data-admin-manager="${c.id}">VM zuweisen</button><a class="btn btn-small" data-link href="/club/${esc(c.slug)}">Page</a></div></article>`).join(''):emptyCard('Noch keine Clubs','Lege den ersten Club direkt hier an.')}</section></section>
    <section data-admin-section="leagues" hidden><div class="admin-section-head"><div><h2>Ligen & Saisons</h2><p>Saisons und Divisionen erstellen oder bearbeiten.</p></div><div class="action-cell"><button class="btn btn-primary" data-admin-season-new>+ SAISON</button><button class="btn" data-admin-division-new>+ LIGA</button></div></div><div class="admin-two-col"><section class="panel admin-card"><div class="panel-title">Saisons</div>${seasons.map(s=>`<div class="admin-list-row"><span><b>${esc(s.name)}</b><small>${esc(s.status)} • ${esc(s.starts_at||'—')} – ${esc(s.ends_at||'—')}</small></span><button class="btn btn-small" data-admin-season-edit="${s.id}">Bearbeiten</button></div>`).join('')||'<div class="ref-mini-empty">Noch keine Saison.</div>'}</section><section class="panel admin-card"><div class="panel-title">Divisionen / Ligen</div>${divisions.map(d=>`<div class="admin-list-row"><span><b>${esc(d.name)}</b><small>${esc(d.season_name)} • Level ${fmt(d.level)} • max. ${fmt(d.max_clubs)} Clubs</small></span><button class="btn btn-small" data-admin-division-edit="${d.id}">Bearbeiten</button></div>`).join('')||'<div class="ref-mini-empty">Noch keine Liga.</div>'}</section></div></section>
    <section data-admin-section="matches" hidden><div class="admin-section-head"><div><h2>Spielplan & Ergebnisse</h2><p>Begegnungen planen, Ergebnisse bestätigen oder korrigieren.</p></div><button class="btn btn-primary" data-admin-match-new>+ MATCH ANLEGEN</button></div><section class="panel admin-card table-scroll"><table class="admin-table"><thead><tr><th>Datum</th><th>Spieltag</th><th>Match</th><th>Status</th><th>Ergebnis</th><th></th></tr></thead><tbody>${matches.map(m=>`<tr><td>${formatDateTime(m.scheduled_at)}</td><td>${fmt(m.matchday)}</td><td><b>${esc(m.home_name)}</b> vs <b>${esc(m.away_name)}</b><small>${esc(m.division_name)}</small></td><td>${esc(m.status)}</td><td>${m.home_score==null?'—':`${m.home_score}:${m.away_score}`}</td><td class="action-cell"><button class="btn btn-small" data-admin-match-edit="${m.id}">Plan</button><button class="btn btn-small btn-primary" data-admin-result="${m.id}">Ergebnis</button></td></tr>`).join('')}</tbody></table></section></section>
    <section data-admin-section="transfers" hidden><div class="admin-section-head"><div><h2>Transfers</h2><p>Signings, Transfers, Releases und Leihen dokumentieren.</p></div><button class="btn btn-primary" data-admin-transfer-new>+ TRANSFER</button></div><section class="panel admin-card">${transfers.map(t=>`<div class="admin-list-row"><span><b>${esc(t.player)}</b><small>${esc(t.from_club||'Free Agent')} → ${esc(t.to_club||'Free Agent')}</small></span><span class="badge">${esc(t.type)}</span></div>`).join('')||'<div class="ref-mini-empty">Noch keine Transfers.</div>'}</section></section>
    <section data-admin-section="news" hidden><div class="admin-section-head"><div><h2>News</h2><p>News schreiben, Entwürfe speichern und veröffentlichen.</p></div><button class="btn btn-primary" data-admin-news-new>+ NEWS SCHREIBEN</button></div><section class="panel admin-card">${news.map(n=>`<div class="admin-list-row"><span><b>${esc(n.title)}</b><small>${esc(n.status)} • ${formatDateTime(n.published_at||n.created_at)} • ${esc(n.author||'')}</small></span><button class="btn btn-small" data-admin-news-edit="${n.id}">Bearbeiten</button></div>`).join('')||'<div class="ref-mini-empty">Noch keine News.</div>'}</section></section>
  </main></div></div>`;
}

function renderManagerConsole(data){
  state.manager=data;const c=data.club,squad=data.squad||[],matches=data.matches||[],apps=data.applications||[];
  return `<div class="manager-console"><div class="page-heading"><div><div class="eyebrow">VEREINSMANAGEMENT</div><h1>${esc(c.name)} – VM Panel</h1><p>Clubseite, Kader, Bewerbungen, Ergebnisse und Spielerstatistiken verwalten.</p></div><a class="btn" data-link href="/club/${esc(c.slug)}">CLUB PAGE</a></div><div class="metric-grid"><section class="panel metric"><strong>${squad.length}</strong><span>Kader</span></section><section class="panel metric"><strong>${apps.filter(a=>a.status==='OPEN').length}</strong><span>Bewerbungen</span></section><section class="panel metric"><strong>${matches.filter(m=>m.status==='SCHEDULED').length}</strong><span>Anstehend</span></section><section class="panel metric"><strong>${matches.filter(m=>m.status==='CONFIRMED').length}</strong><span>Bestätigt</span></section></div><div class="manager-grid"><section class="panel admin-card"><div class="admin-section-head"><div><div class="panel-title">Clubseite</div><p>Beschreibung und Links pflegen.</p></div><button class="btn btn-small" data-manager-club-edit>Bearbeiten</button></div><p>${esc(c.bio||'Noch keine Clubbeschreibung.')}</p></section><section class="panel admin-card"><div class="panel-title">Kader</div>${squad.map(m=>`<div class="admin-list-row"><span><b>${esc(m.username)}</b><small>${esc(m.position||'—')} • ${esc(m.role)} • #${fmt(m.shirt_number)}</small></span><span>GES ${fmt(m.overall)}</span></div>`).join('')||'<div class="ref-mini-empty">Kein Kader.</div>'}</section></div><section class="panel admin-card table-scroll"><div class="panel-title">Matches – Ergebnis & Statistiken</div><table class="admin-table"><thead><tr><th>Datum</th><th>Match</th><th>Status</th><th>Ergebnis</th><th>Aktionen</th></tr></thead><tbody>${matches.map(m=>`<tr><td>${formatDateTime(m.scheduled_at)}</td><td>${esc(m.home_name)} vs ${esc(m.away_name)}</td><td>${esc(m.status)}</td><td>${m.home_score==null?'—':`${m.home_score}:${m.away_score}`}</td><td class="action-cell"><button class="btn btn-small btn-primary" data-manager-result="${m.id}">Ergebnis melden</button><button class="btn btn-small" data-manager-stats="${m.id}">Spieler-Stats</button></td></tr>`).join('')}</tbody></table></section></div>`;
}

async function hydrateAdmin(){const mount=document.querySelector('#adminMount');if(!mount)return;try{const data=await api('/api/admin/overview');mount.outerHTML=renderAdminConsole(data);bindAdminConsole();}catch(e){mount.innerHTML=emptyCard('Kein Admin-Zugriff',e.message)}}
async function hydrateManager(){const mount=document.querySelector('#managerMount');if(!mount)return;try{const data=await api('/api/manager/overview');mount.outerHTML=renderManagerConsole(data);bindManagerConsole();}catch(e){mount.innerHTML=emptyCard('Kein VM-Zugriff',e.message)}}
async function reloadAdmin(){try{const data=await api('/api/admin/overview');const root=document.querySelector('.admin-console');if(root){root.outerHTML=renderAdminConsole(data);bindAdminConsole()}await refreshPublicData();}catch(e){toast(e.message,'error')}}
async function reloadManager(){try{const data=await api('/api/manager/overview');const root=document.querySelector('.manager-console');if(root){root.outerHTML=renderManagerConsole(data);bindManagerConsole()}await refreshPublicData();}catch(e){toast(e.message,'error')}}

function bindAdminConsole(){
  const data=state.admin;if(!data)return;
  document.querySelectorAll('[data-admin-tab]').forEach((b,i)=>b.onclick=()=>{document.querySelectorAll('[data-admin-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('[data-admin-section]').forEach(s=>s.hidden=s.dataset.adminSection!==b.dataset.adminTab)});
  document.querySelectorAll('[data-admin-profile]').forEach(b=>b.onclick=()=>openAdminProfile(Number(b.dataset.adminProfile)));
  document.querySelectorAll('[data-admin-coins]').forEach(b=>b.onclick=()=>openAdminCoins(Number(b.dataset.adminCoins)));
  document.querySelectorAll('[data-admin-access]').forEach(b=>b.onclick=()=>openAdminAccess(Number(b.dataset.adminAccess)));
  document.querySelector('[data-admin-club-new]')?.addEventListener('click',()=>openAdminClub(null));document.querySelectorAll('[data-admin-club-edit]').forEach(b=>b.onclick=()=>openAdminClub(Number(b.dataset.adminClubEdit)));document.querySelectorAll('[data-admin-manager]').forEach(b=>b.onclick=()=>openAdminManager(Number(b.dataset.adminManager)));
  document.querySelector('[data-admin-season-new]')?.addEventListener('click',()=>openAdminSeason(null));document.querySelectorAll('[data-admin-season-edit]').forEach(b=>b.onclick=()=>openAdminSeason(Number(b.dataset.adminSeasonEdit)));document.querySelector('[data-admin-division-new]')?.addEventListener('click',()=>openAdminDivision(null));document.querySelectorAll('[data-admin-division-edit]').forEach(b=>b.onclick=()=>openAdminDivision(Number(b.dataset.adminDivisionEdit)));
  document.querySelector('[data-admin-match-new]')?.addEventListener('click',()=>openAdminMatch(null));document.querySelectorAll('[data-admin-match-edit]').forEach(b=>b.onclick=()=>openAdminMatch(Number(b.dataset.adminMatchEdit)));document.querySelectorAll('[data-admin-result]').forEach(b=>b.onclick=()=>openAdminResult(Number(b.dataset.adminResult)));
  document.querySelector('[data-admin-transfer-new]')?.addEventListener('click',openAdminTransfer);document.querySelector('[data-admin-news-new]')?.addEventListener('click',()=>openAdminNews(null));document.querySelectorAll('[data-admin-news-edit]').forEach(b=>b.onclick=()=>openAdminNews(Number(b.dataset.adminNewsEdit)));
}

function openAdminAccess(id){const u=state.admin.users.find(x=>x.id===id);if(!u)return;const selected=String(u.admin_roles||'').split(',').filter(Boolean),m=modal(`Rollen – ${esc(u.username)}`,`<form><p class="muted">Nur der Website-Hauptadmin kann diese Rollen vergeben.</p><div class="admin-role-checks">${Object.entries(ADMIN_ROLE_LABELS).map(([k,v])=>`<label><input type="checkbox" name="roles" value="${k}" ${selected.includes(k)?'checked':''}> <b>${v}</b><small>${k==='FULL_ADMIN'?'Alle operativen Adminbereiche':k==='NEWS_ADMIN'?'Nur News schreiben/veröffentlichen':k==='MATCH_ADMIN'?'Ergebnisse und Spielerstatistiken':k==='LEAGUE_ADMIN'?'Clubs, Ligen, Spielplan und Transfers':k==='COIN_ADMIN'?'Coins vergeben/abziehen':'Benutzer und Profile bearbeiten'}</small></label>`).join('')}</div><div class="form-grid"><div class="field"><label>Account-Status</label><select name="status"><option ${u.status==='ACTIVE'?'selected':''}>ACTIVE</option><option ${u.status==='SUSPENDED'?'selected':''}>SUSPENDED</option><option ${u.status==='BANNED'?'selected':''}>BANNED</option></select></div><div class="field"><label>Basisrolle</label><select name="baseRole"><option value="PLAYER" ${u.role==='PLAYER'?'selected':''}>PLAYER</option><option value="MANAGER" ${u.role==='MANAGER'?'selected':''}>MANAGER</option></select></div></div><div class="form-actions"><button class="btn btn-primary">SPEICHERN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();const roles=[...m.querySelectorAll('input[name=roles]:checked')].map(x=>x.value);try{await api('/api/admin/user/access',{method:'POST',body:JSON.stringify({userId:id,adminRoles:roles,status:e.target.status.value,baseRole:e.target.baseRole.value})});toast('Rollen gespeichert.');m.remove();reloadAdmin()}catch(err){toast(err.message,'error')}}}
function openAdminProfile(id){const u=state.admin.users.find(x=>x.id===id);if(!u)return;const m=modal(`Profil – ${esc(u.username)}`,`<form><div class="form-grid"><div class="field"><label>Benutzername</label><input name="username" value="${esc(u.username)}"></div><div class="field"><label>EA ID</label><input name="eaId" value="${esc(u.ea_id||'')}"></div><div class="field"><label>Plattform</label><select name="platform"><option value="ps5" ${u.platform==='ps5'?'selected':''}>PS5</option><option value="xbox-series" ${u.platform==='xbox-series'?'selected':''}>Xbox Series</option><option value="pc" ${u.platform==='pc'?'selected':''}>PC</option></select></div><div class="field"><label>Land</label><input name="country" value="${esc(u.country||'DE')}" maxlength="2"></div><div class="field"><label>Hauptposition</label><select name="position">${POSITIONS.map(x=>`<option ${u.position===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Nebenposition</label><select name="secondaryPosition"><option value="">Keine</option>${POSITIONS.map(x=>`<option ${u.secondary_position===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Trikotnummer</label><input name="shirtNumber" type="number" min="1" max="99" value="${Number(u.shirt_number||10)}"></div><div class="field"><label><input name="verified" type="checkbox" ${u.verified?'checked':''}> Verifiziert</label></div>${['pac','sho','pas','dri','def','phy','overall'].map(k=>`<div class="field"><label>${k.toUpperCase()}</label><input type="number" name="${k}" min="0" max="99" value="${Number(u[k]||u.overall||70)}"></div>`).join('')}<div class="field full"><label>Bio</label><textarea name="bio" rows="3"></textarea></div></div><div class="form-actions"><button class="btn btn-primary">PROFIL SPEICHERN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f));d.userId=id;d.verified=f.verified.checked;try{await api('/api/admin/user/profile',{method:'POST',body:JSON.stringify(d)});toast('Profil aktualisiert.');m.remove();reloadAdmin()}catch(err){toast(err.message,'error')}}}
function openAdminCoins(id){const u=state.admin.users.find(x=>x.id===id);if(!u)return;const m=modal(`Coins – ${esc(u.username)}`,`<form><p>Aktuell: <b>${fmt(u.coins)} EPL Coins</b></p><div class="form-grid"><div class="field"><label>Betrag (+ oder -)</label><input name="amount" type="number" value="500" required></div><div class="field"><label>Grund</label><input name="description" value="Admin-Gutschrift"></div></div><div class="form-actions"><button class="btn btn-primary">BUCHEN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await api('/api/admin/coin-award',{method:'POST',body:JSON.stringify({username:u.username,amount:Number(e.target.amount.value),description:e.target.description.value})});toast('Coins gebucht.');m.remove();reloadAdmin()}catch(err){toast(err.message,'error')}}}
function openAdminClub(id){const c=id?state.admin.clubs.find(x=>x.id===id):{},m=modal(id?'Club bearbeiten':'Club anlegen',`<form><div class="form-grid"><div class="field"><label>Name</label><input name="name" value="${esc(c?.name||'')}" required></div><div class="field"><label>EA Club ID</label><input name="eaClubId" value="${esc(c?.ea_club_id||'')}"></div><div class="field"><label>Plattform</label><input name="platform" value="${esc(c?.platform||'common-gen5')}"></div><div class="field"><label>Division</label><select name="divisionId"><option value="">Keine</option>${opt(state.admin.divisions,c?.division_id)}</select></div><div class="field"><label>Reputation</label><input type="number" name="reputation" value="${Number(c?.reputation||1000)}"></div><div class="field"><label><input type="checkbox" name="verified" ${c?.verified?'checked':''}> Verifiziert</label></div><div class="field full"><label>Club-Bio</label><textarea name="bio" rows="4">${esc(c?.bio||'')}</textarea></div><div class="field"><label>Discord</label><input name="discord" value="${esc(c?.discord||'')}"></div><div class="field"><label>Website</label><input name="website" value="${esc(c?.website||'')}"></div></div><div class="form-actions"><button class="btn btn-primary">SPEICHERN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.id=id;d.verified=e.target.verified.checked;try{await api('/api/admin/club/save',{method:'POST',body:JSON.stringify(d)});toast('Club gespeichert.');m.remove();reloadAdmin()}catch(err){toast(err.message,'error')}}}
function openAdminManager(clubId){const c=state.admin.clubs.find(x=>x.id===clubId),m=modal(`VM zuweisen – ${esc(c.name)}`,`<form><p class="muted">Der gewählte Spieler erhält VM-Rechte für Clubseite, Ergebnisse, Spielerstatistiken und Kader.</p><div class="field"><label>Spieler</label><select name="userId">${state.admin.users.map(u=>`<option value="${u.id}" ${u.id===c.manager_user_id?'selected':''}>${esc(u.username)} – ${esc(u.ea_id||u.email)}</option>`).join('')}</select></div><div class="form-actions"><button class="btn btn-primary">ALS VM EINSETZEN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await api('/api/admin/club/manager',{method:'POST',body:JSON.stringify({clubId,userId:Number(e.target.userId.value)})});toast('VM-Rechte vergeben.');m.remove();reloadAdmin()}catch(err){toast(err.message,'error')}}}
function openAdminSeason(id){const s=id?state.admin.seasons.find(x=>x.id===id):{},m=modal(id?'Saison bearbeiten':'Saison anlegen',`<form><div class="form-grid"><div class="field"><label>Name</label><input name="name" value="${esc(s?.name||'')}" required></div><div class="field"><label>Status</label><select name="status">${['DRAFT','REGISTRATION','ACTIVE','FINISHED'].map(x=>`<option ${s?.status===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Start</label><input name="startsAt" type="date" value="${esc((s?.starts_at||'').slice(0,10))}"></div><div class="field"><label>Ende</label><input name="endsAt" type="date" value="${esc((s?.ends_at||'').slice(0,10))}"></div></div><div class="form-actions"><button class="btn btn-primary">SPEICHERN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.id=id;try{await api('/api/admin/season/save',{method:'POST',body:JSON.stringify(d)});m.remove();reloadAdmin()}catch(err){toast(err.message,'error')}}}
function openAdminDivision(id){const d=id?state.admin.divisions.find(x=>x.id===id):{},m=modal(id?'Liga bearbeiten':'Liga anlegen',`<form><div class="form-grid"><div class="field"><label>Saison</label><select name="seasonId">${opt(state.admin.seasons,d?.season_id)}</select></div><div class="field"><label>Liganame</label><input name="name" value="${esc(d?.name||'')}" required></div><div class="field"><label>Level</label><input type="number" name="level" value="${Number(d?.level||1)}"></div><div class="field"><label>Max. Clubs</label><input type="number" name="maxClubs" value="${Number(d?.max_clubs||16)}"></div></div><div class="form-actions"><button class="btn btn-primary">SPEICHERN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();const x=Object.fromEntries(new FormData(e.target));x.id=id;try{await api('/api/admin/division/save',{method:'POST',body:JSON.stringify(x)});m.remove();reloadAdmin()}catch(err){toast(err.message,'error')}}}
function openAdminMatch(id){const x=id?state.admin.matches.find(m=>m.id===id):{},m=modal(id?'Match bearbeiten':'Match anlegen',`<form><div class="form-grid"><div class="field"><label>Saison</label><select name="seasonId">${opt(state.admin.seasons,x?.season_id)}</select></div><div class="field"><label>Liga</label><select name="divisionId">${opt(state.admin.divisions,x?.division_id)}</select></div><div class="field"><label>Spieltag</label><input type="number" name="matchday" min="1" value="${Number(x?.matchday||1)}"></div><div class="field"><label>Anstoß</label><input type="datetime-local" name="scheduledAt" value="${esc((x?.scheduled_at||'').replace(' ','T').slice(0,16))}" required></div><div class="field"><label>Heim</label><select name="homeClubId">${opt(state.admin.clubs,x?.home_club_id)}</select></div><div class="field"><label>Auswärts</label><select name="awayClubId">${opt(state.admin.clubs,x?.away_club_id)}</select></div></div><div class="form-actions"><button class="btn btn-primary">SPEICHERN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.id=id;try{await api('/api/admin/match/save',{method:'POST',body:JSON.stringify(d)});m.remove();reloadAdmin()}catch(err){toast(err.message,'error')}}}
function openAdminResult(id){const x=state.admin.matches.find(m=>m.id===id),m=modal(`Ergebnis – ${esc(x.home_name)} vs ${esc(x.away_name)}`,`<form><div class="form-grid"><div class="field"><label>${esc(x.home_name)}</label><input type="number" name="homeScore" min="0" max="99" value="${x.home_score??0}"></div><div class="field"><label>${esc(x.away_name)}</label><input type="number" name="awayScore" min="0" max="99" value="${x.away_score??0}"></div><div class="field full"><label>Notiz</label><textarea name="notes" rows="3">${esc(x.notes||'')}</textarea></div></div><div class="form-actions"><button class="btn btn-primary">ERGEBNIS BESTÄTIGEN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await api('/api/admin/match/result',{method:'POST',body:JSON.stringify({matchId:id,homeScore:Number(e.target.homeScore.value),awayScore:Number(e.target.awayScore.value),notes:e.target.notes.value})});toast('Ergebnis gespeichert.');m.remove();reloadAdmin()}catch(err){toast(err.message,'error')}}}
function openAdminTransfer(){const m=modal('Transfer eintragen',`<form><div class="form-grid"><div class="field"><label>Spieler</label><select name="userId">${state.admin.users.map(u=>`<option value="${u.id}">${esc(u.username)}</option>`).join('')}</select></div><div class="field"><label>Typ</label><select name="type"><option>SIGNING</option><option>TRANSFER</option><option>RELEASE</option><option>LOAN</option></select></div><div class="field"><label>Von Club</label><select name="fromClubId"><option value="">Free Agent</option>${opt(state.admin.clubs)}</select></div><div class="field"><label>Zu Club</label><select name="toClubId"><option value="">Free Agent</option>${opt(state.admin.clubs)}</select></div></div><div class="form-actions"><button class="btn btn-primary">TRANSFER SPEICHERN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));try{await api('/api/admin/transfer/save',{method:'POST',body:JSON.stringify(d)});m.remove();reloadAdmin()}catch(err){toast(err.message,'error')}}}
function openAdminNews(id){const n=id?state.admin.news.find(x=>x.id===id):{},m=modal(id?'News bearbeiten':'News schreiben',`<form><div class="form-grid"><div class="field full"><label>Titel</label><input name="title" value="${esc(n?.title||'')}" required></div><div class="field full"><label>Teaser</label><textarea name="excerpt" rows="2">${esc(n?.excerpt||'')}</textarea></div><div class="field full"><label>Inhalt</label><textarea name="body" rows="10" required>${esc(n?.body||'')}</textarea></div><div class="field"><label>Status</label><select name="status"><option ${n?.status==='DRAFT'?'selected':''}>DRAFT</option><option ${n?.status==='PUBLISHED'?'selected':''}>PUBLISHED</option><option ${n?.status==='ARCHIVED'?'selected':''}>ARCHIVED</option></select></div><div class="field"><label>Bild-Key / URL</label><input name="imageKey" value="${esc(n?.image_key||'')}"></div></div><div class="form-actions"><button class="btn btn-primary">SPEICHERN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.id=id;try{await api('/api/admin/news/save',{method:'POST',body:JSON.stringify(d)});toast('News gespeichert.');m.remove();reloadAdmin()}catch(err){toast(err.message,'error')}}}

function bindManagerConsole(){
  document.querySelector('[data-manager-club-edit]')?.addEventListener('click',()=>{const c=state.manager.club,m=modal('Clubseite bearbeiten',`<form><div class="field"><label>Club-Bio</label><textarea name="bio" rows="5">${esc(c.bio||'')}</textarea></div><div class="form-grid"><div class="field"><label>Discord</label><input name="discord" value="${esc(c.discord||'')}"></div><div class="field"><label>Website</label><input name="website" value="${esc(c.website||'')}"></div></div><div class="form-actions"><button class="btn btn-primary">SPEICHERN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await api('/api/manager/club',{method:'POST',body:JSON.stringify({clubId:c.id,bio:e.target.bio.value,discord:e.target.discord.value,website:e.target.website.value})});m.remove();reloadManager()}catch(err){toast(err.message,'error')}}});
  document.querySelectorAll('[data-manager-result]').forEach(b=>b.onclick=()=>{const x=state.manager.matches.find(m=>m.id===Number(b.dataset.managerResult)),m=modal('Ergebnis melden',`<form><p><b>${esc(x.home_name)}</b> vs <b>${esc(x.away_name)}</b></p><div class="form-grid"><div class="field"><label>Heim</label><input type="number" name="homeScore" min="0" max="99" value="${x.home_score??0}"></div><div class="field"><label>Auswärts</label><input type="number" name="awayScore" min="0" max="99" value="${x.away_score??0}"></div><div class="field full"><label>Notiz</label><textarea name="notes"></textarea></div></div><div class="form-actions"><button class="btn btn-primary">ERGEBNIS EINREICHEN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await api(`/api/matches/${x.id}/submit`,{method:'POST',body:JSON.stringify({homeScore:Number(e.target.homeScore.value),awayScore:Number(e.target.awayScore.value),notes:e.target.notes.value})});toast('Ergebnis eingereicht.');m.remove();reloadManager()}catch(err){toast(err.message,'error')}}});
  document.querySelectorAll('[data-manager-stats]').forEach(b=>b.onclick=()=>{const matchId=Number(b.dataset.managerStats),m=modal('Spielerstatistik eintragen',`<form><div class="form-grid"><div class="field full"><label>Spieler</label><select name="userId">${state.manager.squad.map(u=>`<option value="${u.id}">${esc(u.username)} – ${esc(u.position||'—')}</option>`).join('')}</select></div><div class="field"><label>Tore</label><input type="number" name="goals" min="0" value="0"></div><div class="field"><label>Assists</label><input type="number" name="assists" min="0" value="0"></div><div class="field"><label>Saves</label><input type="number" name="saves" min="0" value="0"></div><div class="field"><label>Rating</label><input type="number" name="rating" min="0" max="10" step="0.1" value="7.0"></div><div class="field"><label>Gelbe Karten</label><input type="number" name="yellowCards" min="0" max="2" value="0"></div><div class="field"><label>Rote Karten</label><input type="number" name="redCards" min="0" max="1" value="0"></div><div class="field"><label><input type="checkbox" name="cleanSheet"> Clean Sheet</label></div><div class="field"><label><input type="checkbox" name="motm"> Man of the Match</label></div></div><div class="form-actions"><button class="btn btn-primary">STATISTIK SPEICHERN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f));d.matchId=matchId;d.cleanSheet=f.cleanSheet.checked;d.motm=f.motm.checked;try{await api('/api/manager/match/stats',{method:'POST',body:JSON.stringify(d)});toast('Spielerstatistik gespeichert.');m.remove();reloadManager()}catch(err){toast(err.message,'error')}}});
}


function modal(title, body){const wrap=document.createElement('div');wrap.className='modal-backdrop';wrap.innerHTML=`<section class="panel modal"><button class="modal-close">×</button><h2>${title}</h2>${body}</section>`;document.body.append(wrap);wrap.querySelector('.modal-close').onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};return wrap}

const IMAGE_RULES = {
  avatar: { label:'Profilbild', width:512, height:512, previewWidth:460, previewHeight:460, maxBytes:600*1024, quality:.84 },
  cover: { label:'Titelbild', width:1600, height:500, previewWidth:720, previewHeight:225, maxBytes:1200*1024, quality:.84 },
  'club-logo': { label:'Clublogo', width:512, height:512, previewWidth:460, previewHeight:460, maxBytes:600*1024, quality:.84 },
  'club-cover': { label:'Club-Titelbild', width:1600, height:500, previewWidth:720, previewHeight:225, maxBytes:1200*1024, quality:.84 },
  'post-media': { label:'Beitragsbild', width:1600, height:1000, previewWidth:720, previewHeight:450, maxBytes:1500*1024, quality:.84 },
};

function imageRule(kind){return IMAGE_RULES[kind] || IMAGE_RULES.avatar}
function humanBytes(bytes){if(bytes<1024)return `${bytes} B`;if(bytes<1024*1024)return `${Math.round(bytes/1024)} KB`;return `${(bytes/1024/1024).toFixed(1)} MB`}

async function decodeImage(file){
  if(!file || !file.type?.startsWith('image/')) throw new Error('Bitte eine Bilddatei auswählen.');
  if(file.size>10*1024*1024) throw new Error('Das Originalbild darf maximal 10 MB groß sein.');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Nur JPG, PNG oder WebP sind erlaubt.');
  const url=URL.createObjectURL(file);
  try{
    const img=new Image(); img.decoding='async'; img.src=url; await img.decode();
    return {img,url};
  }catch(err){URL.revokeObjectURL(url);throw new Error('Das Bild konnte nicht gelesen werden.');}
}

function canvasBlob(canvas, quality){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Bild konnte nicht verarbeitet werden.')),'image/webp',quality))}
async function compressCanvas(canvas,maxBytes,startQuality=.84){
  let quality=startQuality, blob=await canvasBlob(canvas,quality);
  while(blob.size>maxBytes && quality>.56){quality-=.07;blob=await canvasBlob(canvas,quality)}
  if(blob.size>maxBytes) throw new Error(`Das optimierte Bild ist noch zu groß (${humanBytes(blob.size)}). Bitte ein anderes Bild wählen.`);
  return blob;
}

async function openImageEditor(file,kind){
  const rule=imageRule(kind), decoded=await decodeImage(file), img=decoded.img;
  return new Promise(resolve=>{
    const wrap=document.createElement('div');wrap.className='modal-backdrop crop-backdrop';
    wrap.innerHTML=`<section class="panel modal crop-modal"><button class="modal-close" type="button">×</button><h2>${rule.label} zuschneiden</h2><p class="crop-help">Bild mit Maus/Finger verschieben und über den Regler zoomen. Gespeichert wird automatisch als WebP in ${rule.width}×${rule.height}px.</p><div class="crop-stage"><canvas class="crop-canvas" width="${rule.previewWidth}" height="${rule.previewHeight}"></canvas><div class="crop-guide"></div></div><div class="crop-controls"><label>Zoom <input class="crop-zoom" type="range" min="1" max="3" value="1" step="0.01"></label><span class="crop-output">${rule.width} × ${rule.height} WebP</span></div><div class="form-actions"><button class="btn btn-ghost crop-cancel" type="button">ABBRECHEN</button><button class="btn btn-primary crop-save" type="button">SPEICHERN</button></div></section>`;
    document.body.append(wrap);
    const canvas=wrap.querySelector('.crop-canvas'),ctx=canvas.getContext('2d',{alpha:false}),zoomInput=wrap.querySelector('.crop-zoom');
    const state={zoom:1,offsetX:0,offsetY:0,drag:false,startX:0,startY:0,startOffsetX:0,startOffsetY:0};
    const baseScale=Math.max(canvas.width/img.naturalWidth,canvas.height/img.naturalHeight);
    const clamp=()=>{const w=img.naturalWidth*baseScale*state.zoom,h=img.naturalHeight*baseScale*state.zoom;const maxX=Math.max(0,(w-canvas.width)/2),maxY=Math.max(0,(h-canvas.height)/2);state.offsetX=Math.max(-maxX,Math.min(maxX,state.offsetX));state.offsetY=Math.max(-maxY,Math.min(maxY,state.offsetY));};
    const draw=()=>{clamp();ctx.fillStyle='#020711';ctx.fillRect(0,0,canvas.width,canvas.height);const w=img.naturalWidth*baseScale*state.zoom,h=img.naturalHeight*baseScale*state.zoom;ctx.drawImage(img,(canvas.width-w)/2+state.offsetX,(canvas.height-h)/2+state.offsetY,w,h);};
    const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)}};
    canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);const p=point(e);state.drag=true;state.startX=p.x;state.startY=p.y;state.startOffsetX=state.offsetX;state.startOffsetY=state.offsetY;canvas.classList.add('dragging')});
    canvas.addEventListener('pointermove',e=>{if(!state.drag)return;const p=point(e);state.offsetX=state.startOffsetX+(p.x-state.startX);state.offsetY=state.startOffsetY+(p.y-state.startY);draw()});
    const endDrag=()=>{state.drag=false;canvas.classList.remove('dragging')};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
    zoomInput.addEventListener('input',()=>{const old=state.zoom;state.zoom=Number(zoomInput.value);if(old>0){state.offsetX*=state.zoom/old;state.offsetY*=state.zoom/old}draw()});
    canvas.addEventListener('wheel',e=>{e.preventDefault();const next=Math.max(1,Math.min(3,state.zoom+(e.deltaY<0?.08:-.08)));zoomInput.value=String(next);zoomInput.dispatchEvent(new Event('input'))},{passive:false});
    const finish=value=>{URL.revokeObjectURL(decoded.url);wrap.remove();resolve(value)};
    wrap.querySelector('.modal-close').onclick=()=>finish(null);wrap.querySelector('.crop-cancel').onclick=()=>finish(null);wrap.onclick=e=>{if(e.target===wrap)finish(null)};
    wrap.querySelector('.crop-save').onclick=async()=>{
      const save=wrap.querySelector('.crop-save');save.disabled=true;save.textContent='VERARBEITE…';
      try{
        const out=document.createElement('canvas');out.width=rule.width;out.height=rule.height;const outCtx=out.getContext('2d',{alpha:false});outCtx.fillStyle='#020711';outCtx.fillRect(0,0,out.width,out.height);
        const scale=Math.max(out.width/img.naturalWidth,out.height/img.naturalHeight)*state.zoom;
        const factorX=out.width/canvas.width,factorY=out.height/canvas.height;
        const w=img.naturalWidth*scale,h=img.naturalHeight*scale;
        outCtx.imageSmoothingEnabled=true;outCtx.imageSmoothingQuality='high';
        outCtx.drawImage(img,(out.width-w)/2+state.offsetX*factorX,(out.height-h)/2+state.offsetY*factorY,w,h);
        const blob=await compressCanvas(out,rule.maxBytes,rule.quality);finish(blob);
      }catch(err){save.disabled=false;save.textContent='SPEICHERN';toast(err.message,'error')}
    };
    draw();
  });
}

function bindCropInput(input,kind,store,status){
  input?.addEventListener('change',async()=>{
    const file=input.files?.[0];if(!file)return;
    try{
      status.textContent='Editor wird geöffnet…';
      const blob=await openImageEditor(file,kind);
      if(blob){store[kind]=blob;status.textContent=`✓ Optimiert: ${imageRule(kind).width}×${imageRule(kind).height}px • ${humanBytes(blob.size)}`;status.classList.add('ready')}
      else status.textContent='Keine Änderung ausgewählt.';
    }catch(err){status.textContent=err.message;status.classList.remove('ready');toast(err.message,'error')}
    input.value='';
  });
}

async function uploadProcessedImage(kind,blob,clubSlug=''){
  if(!blob)return null;
  const fd=new FormData();fd.append('kind',kind);if(clubSlug)fd.append('clubSlug',clubSlug);fd.append('file',new File([blob],`${kind}.webp`,{type:'image/webp'}));
  const r=await fetch('/api/upload',{method:'POST',credentials:'include',body:fd});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Upload fehlgeschlagen.');return d;
}

function bindProfileTabs(){
  document.querySelectorAll('[data-profile-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-profile-tab]').forEach(x=>x.classList.toggle('active',x===btn));
    document.querySelectorAll('[data-profile-panel]').forEach(x=>x.classList.toggle('active',x.dataset.profilePanel===btn.dataset.profileTab));
  }));
  document.querySelectorAll('[data-club-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-club-tab]').forEach(x=>x.classList.toggle('active',x===btn));
    document.querySelectorAll('[data-club-panel]').forEach(x=>x.classList.toggle('active',x.dataset.clubPanel===btn.dataset.clubTab));
  }));
}
function renderCommentsTree(comments,postId){
  const byParent=new Map();for(const c of comments){const k=Number(c.parent_comment_id||0);if(!byParent.has(k))byParent.set(k,[]);byParent.get(k).push(c);}
  const one=(c,depth=0)=>`<article class="social-comment ${depth?'reply':''}" data-comment-id="${c.id}"><div class="comment-avatar"><img src="${assetUrl(c.avatar_key,demo.brand.defaultAvatar)}">${onlineDot(c.is_online)}</div><div class="comment-main"><div class="comment-bubble"><a data-link href="/${c.author_type==='club'?'club':'spieler'}/${esc(c.author_slug)}"><strong>${esc(c.username)}</strong></a><small>${formatDateTime(c.created_at)}</small><p>${esc(c.body)}</p></div><div class="comment-actions"><button type="button" data-comment-like="${c.id}" data-post-id="${postId}" class="${Number(c.liked_by_me)?'active':''}">♥ ${fmt(c.likes)}</button>${state.me?`<button type="button" data-comment-reply="${c.id}" data-post-id="${postId}" data-username="${esc(c.username)}">Antworten</button>`:''}</div>${(byParent.get(Number(c.id))||[]).map(r=>one(r,depth+1)).join('')}<div class="reply-slot" data-reply-slot="${c.id}"></div></div></article>`;
  return (byParent.get(0)||[]).map(c=>one(c)).join('');
}
async function loadComments(postId,box){
  box.hidden=false;box.innerHTML='<div class="comments-loading">Kommentare werden geladen…</div>';
  try{const r=await api(`/api/posts/${postId}/comments`);box.innerHTML=`${r.comments.length?renderCommentsTree(r.comments,postId):'<div class="comments-empty">Noch keine Kommentare. Starte die Unterhaltung.</div>'}${state.me?`<form class="comment-composer" data-comment-form="${postId}"><input name="body" maxlength="1000" placeholder="Kommentar schreiben…" required><button class="btn btn-primary btn-small">SENDEN</button></form>`:'<div class="comments-login">Zum Kommentieren bitte anmelden.</div>'}`;bindCommentActions(postId,box);}catch(e){box.innerHTML=`<div class="comments-empty">${esc(e.message)}</div>`;}
}
function bindCommentActions(postId,box){
  box.querySelector('[data-comment-form]')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,body=f.body.value.trim();if(!body)return;try{const actor=box.closest('[data-post-card]')?.querySelector('[data-social-actor]')?.value||'';await api(`/api/posts/${postId}/comments`,{method:'POST',body:JSON.stringify({body,asClubSlug:actor||undefined})});await loadComments(postId,box);updatePostCommentCount(postId,1);}catch(err){toast(err.message,'error')}});
  box.querySelectorAll('[data-comment-like]').forEach(btn=>btn.addEventListener('click',async()=>{if(!state.me)return goto('/login');try{const r=await api(`/api/comments/${btn.dataset.commentLike}/like`,{method:'POST',body:'{}'});btn.textContent=`♥ ${fmt(r.likes)}`;btn.classList.toggle('active',r.liked);}catch(err){toast(err.message,'error')}}));
  box.querySelectorAll('[data-comment-reply]').forEach(btn=>btn.addEventListener('click',()=>{const slot=box.querySelector(`[data-reply-slot="${btn.dataset.commentReply}"]`);if(!slot)return;slot.innerHTML=`<form class="reply-composer"><input name="body" maxlength="1000" placeholder="Antwort an ${esc(btn.dataset.username)}…" required><button class="btn btn-primary btn-small">ANTWORTEN</button></form>`;slot.querySelector('form').onsubmit=async e=>{e.preventDefault();try{const actor=box.closest('[data-post-card]')?.querySelector('[data-social-actor]')?.value||'';await api(`/api/posts/${postId}/comments`,{method:'POST',body:JSON.stringify({body:e.currentTarget.body.value,parentCommentId:Number(btn.dataset.commentReply),asClubSlug:actor||undefined})});await loadComments(postId,box);updatePostCommentCount(postId,1);}catch(err){toast(err.message,'error')}};}));
}
function updatePostCommentCount(postId,delta=0){document.querySelectorAll(`[data-comments-toggle="${postId}"]`).forEach(btn=>{const m=btn.textContent.match(/(\d+)/);if(m)btn.textContent=btn.textContent.replace(m[1],String(Number(m[1])+delta));});}
function bindSocialActions(){
  document.querySelectorAll('[data-post-reaction]').forEach(btn=>btn.addEventListener('click',async()=>{if(!state.me)return goto('/login');const postId=Number(btn.dataset.postId),actor=btn.closest('[data-post-card]')?.querySelector('[data-social-actor]')?.value||'';try{const r=await api(`/api/posts/${postId}/reaction`,{method:'POST',body:JSON.stringify({reaction:btn.dataset.postReaction,asClubSlug:actor||undefined})});const card=btn.closest('[data-post-card]');if(card){const vals={LIKE:r.counts.likes,FIRE:r.counts.fires,CLAP:r.counts.claps,GOAL:r.counts.goals};card.querySelectorAll('[data-post-reaction]').forEach(x=>x.classList.toggle('active',x.dataset.postReaction===r.mine));const summary=card.querySelector('.reaction-summary');if(summary){const commentBtn=summary.querySelector('[data-comments-toggle]');summary.innerHTML=`<span>❤️ ${fmt(vals.LIKE)}</span><span>🔥 ${fmt(vals.FIRE)}</span><span>👏 ${fmt(vals.CLAP)}</span><span>⚽ ${fmt(vals.GOAL)}</span>`;if(commentBtn)summary.append(commentBtn);}}}catch(err){toast(err.message,'error')}}));
  document.querySelectorAll('[data-comments-toggle]').forEach(btn=>btn.addEventListener('click',async()=>{const postId=Number(btn.dataset.commentsToggle),box=document.querySelector(`[data-comments-for="${postId}"]`);if(!box)return;if(!box.hidden){box.hidden=true;return;}await loadComments(postId,box);}));
}
async function openProfileEditor(){
  if(!state.me)return goto('/login');await refreshInventory();
  const av=state.inventory.filter(x=>x.category==='AVATAR_FRAME'),cv=state.inventory.filter(x=>x.category==='COVER_FRAME'),nv=state.inventory.filter(x=>x.category==='NAME_EFFECT');
  const options=(list,current)=>`<option value="">Keiner</option>${list.map(x=>`<option value="${x.id}" ${Number(current)===Number(x.id)?'selected':''}>${esc(x.name)}</option>`).join('')}`;
  const m=modal('Profil & Cosmetics bearbeiten',`<form id="profileEditForm"><div class="form-grid"><div class="field full"><label>Bio</label><textarea name="bio" rows="4">${esc(state.me.bio||'')}</textarea></div><div class="field"><label>EA ID</label><input name="eaId" value="${esc(state.me.ea_id||'')}"></div><div class="field"><label>Discord</label><input name="discord" value="${esc(state.me.discord||'')}"></div><div class="field"><label>Hauptposition</label><select name="position">${POSITIONS.map(x=>`<option ${state.me.position===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Nebenposition</label><select name="secondaryPosition"><option value="">—</option>${POSITIONS.map(x=>`<option ${state.me.secondary_position===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field media-field"><label>Profilbild</label><input type="file" name="avatar" accept="image/png,image/jpeg,image/webp"><small data-crop-status="avatar">Quadratisch • 512×512 WebP</small></div><div class="field media-field"><label>Titelbild</label><input type="file" name="cover" accept="image/png,image/jpeg,image/webp"><small data-crop-status="cover">1600×500 WebP</small></div><div class="field full cosmetic-divider"><strong>GEKAUFTE SHOP-COSMETICS</strong><small>Nur bereits gekaufte Inhalte können ausgewählt werden.</small></div><div class="field"><label>Profilbildrahmen</label><select name="avatarFrame">${options(av,state.equipped.avatarFrame)}</select></div><div class="field"><label>Titelbildrahmen</label><select name="coverFrame">${options(cv,state.equipped.coverFrame)}</select></div><div class="field"><label>Namenseffekt</label><select name="nameEffect">${options(nv,state.equipped.nameEffect)}</select></div><div class="field full"><label><input type="checkbox" name="freeAgent" ${Number(state.me.free_agent)?'checked':''}> Als Free Agent anzeigen</label></div></div><div class="form-actions"><button class="btn btn-primary">SPEICHERN</button></div></form>`);
  const f=m.querySelector('form'),processed={};bindCropInput(f.avatar,'avatar',processed,m.querySelector('[data-crop-status="avatar"]'));bindCropInput(f.cover,'cover',processed,m.querySelector('[data-crop-status="cover"]'));
  f.onsubmit=async e=>{e.preventDefault();const submit=f.querySelector('.btn-primary');submit.disabled=true;submit.textContent='SPEICHERT…';try{await api('/api/profile',{method:'POST',body:JSON.stringify({bio:f.bio.value,eaId:f.eaId.value,discord:f.discord.value,position:f.position.value,secondaryPosition:f.secondaryPosition.value,freeAgent:f.freeAgent.checked})});await uploadProcessedImage('avatar',processed.avatar);await uploadProcessedImage('cover',processed.cover);for(const [slot,field] of [['avatar_frame','avatarFrame'],['cover_frame','coverFrame'],['name_effect','nameEffect']])await api('/api/shop/equip',{method:'POST',body:JSON.stringify({slot,itemId:f[field].value?Number(f[field].value):null})});await refreshInventory();state.me=(await api('/api/auth/me')).user;toast('Profil und Cosmetics wurden aktualisiert.');m.remove();const slug=path().split('/')[2];if(slug)hydratePlayerProfile(slug);}catch(err){submit.disabled=false;submit.textContent='SPEICHERN';toast(err.message,'error')}};
}
function bindPage(p){
  bindHeroSlider();bindProfileTabs();bindSocialActions();
  document.querySelector('#playerSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelector('#playersGrid').innerHTML=playersCards(state.live.players.filter(x=>`${x.username} ${clubName(x)}`.toLowerCase().includes(q)));});
  document.querySelectorAll('[data-follow]').forEach(btn=>btn.addEventListener('click',async()=>{const key=btn.dataset.follow,[type,slug]=key.split(':');if(!state.me)return goto('/login');try{const r=await api('/api/social/follow',{method:'POST',body:JSON.stringify({type,slug})});if(r.following)state.following.add(key);else state.following.delete(key);saveLocal();btn.textContent=r.following?'✓ FOLGE ICH':'+ FOLGEN';await refreshSocialFeed();}catch(e){toast(e.message,'error')}}));
  document.querySelectorAll('[data-message]').forEach(b=>b.addEventListener('click',()=>toast('Direktnachrichten werden in einem späteren Messaging-Modul ergänzt.')));
  document.querySelectorAll('[data-post-composer]').forEach(f=>{const processed={};bindCropInput(f.postMedia,'post-media',processed,f.querySelector('[data-crop-status="post-media"]'));f.addEventListener('submit',async e=>{e.preventDefault();const body=f.body.value.trim();if(!body)return;const submit=f.querySelector('button[type="submit"]');submit.disabled=true;try{const media=processed['post-media']?await uploadProcessedImage('post-media',processed['post-media']):null;await api('/api/posts',{method:'POST',body:JSON.stringify({body,clubSlug:f.dataset.clubSlug||undefined,mediaKey:media?.key||null})});toast('Beitrag veröffentlicht.');await refreshSocialFeed();const slug=path().split('/')[2];if(p.startsWith('/spieler/'))hydratePlayerProfile(slug);else if(p.startsWith('/club/'))hydrateClubProfile(slug);else route();}catch(err){submit.disabled=false;toast(err.message,'error')}});});
  document.querySelector('[data-wallet]')?.addEventListener('click',async()=>{try{const r=await api('/api/wallet');modal('EPL Coins Verlauf',`<p class="muted">Aktueller Kontostand: <strong>${fmt(r.wallet?.balance||0)} E</strong></p><table class="admin-table">${(r.transactions||[]).map(x=>`<tr><td>${esc(x.description)}</td><td class="${Number(x.amount)>=0?'green':'red'}">${Number(x.amount)>=0?'+':''}${fmt(x.amount)} E</td><td>${formatDateTime(x.created_at)}</td></tr>`).join('')}</table>`);}catch(e){toast(e.message,'error')}});
  document.querySelector('[data-create-club]')?.addEventListener('click',()=>{if(!state.me)return goto('/login');const m=modal('Club gründen',`<form id="clubForm"><div class="form-grid"><div class="field full"><label>Clubname</label><input name="name" required></div><div class="field"><label>EA Club ID</label><input name="eaClubId"></div><div class="field"><label>Plattform</label><select name="platform"><option>common-gen5</option><option>pc</option></select></div></div><div class="form-actions"><button class="btn btn-primary">CLUB ERSTELLEN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();const fd=Object.fromEntries(new FormData(e.target));try{await api('/api/clubs',{method:'POST',body:JSON.stringify(fd)});toast('Club angelegt.');m.remove();await refreshPublicData();state.me=(await api('/api/auth/me')).user;route();}catch(err){toast(err.message,'error')}}});
  document.querySelector('[data-apply]')?.addEventListener('click',()=>{if(!state.me)return goto('/login');const slug=path().split('/')[2],m=modal('Bei Club bewerben',`<form><div class="field"><label>Nachricht</label><textarea name="message" rows="5">Hallo, ich möchte mich für euren Club bewerben.</textarea></div><div class="form-actions"><button class="btn btn-primary">BEWERBUNG SENDEN</button></div></form>`);m.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await api('/api/applications',{method:'POST',body:JSON.stringify({clubSlug:slug,message:e.currentTarget.message.value})});toast('Bewerbung wurde gesendet.');m.remove()}catch(err){toast(err.message,'error')}}});
  document.querySelector('#profileSetupForm')&&bindProfileSetup();
  document.querySelectorAll('[data-buy-item]').forEach(b=>b.addEventListener('click',()=>buyItem(Number(b.dataset.buyItem),b)));
  document.querySelectorAll('[data-coin-pack]').forEach(b=>b.addEventListener('click',()=>buyCoins(b.dataset.coinPack)));
  document.querySelectorAll('[data-edit-profile]').forEach(b=>b.addEventListener('click',openProfileEditor));
  document.querySelector('[data-club-media]')?.addEventListener('click',()=>{const clubSlug=path().split('/')[2]||'',m=modal('Club Medien bearbeiten',`<form id="clubMediaForm"><p class="muted">Logo und Titelbild werden vor dem Upload zugeschnitten, verkleinert und als WebP gespeichert.</p><div class="form-grid"><div class="field media-field"><label>Clublogo</label><input type="file" name="logo" accept="image/png,image/jpeg,image/webp"><small data-crop-status="club-logo">Wird auf 512×512 WebP optimiert.</small></div><div class="field media-field"><label>Club-Titelbild</label><input type="file" name="cover" accept="image/png,image/jpeg,image/webp"><small data-crop-status="club-cover">Wird auf 1600×500 WebP optimiert.</small></div></div><div class="form-actions"><button type="button" class="btn btn-ghost" data-close-media>ABBRECHEN</button><button class="btn btn-primary">SPEICHERN</button></div></form>`);const f=m.querySelector('form'),processed={};m.querySelector('[data-close-media]').onclick=()=>m.remove();bindCropInput(f.logo,'club-logo',processed,m.querySelector('[data-crop-status="club-logo"]'));bindCropInput(f.cover,'club-cover',processed,m.querySelector('[data-crop-status="club-cover"]'));f.onsubmit=async e=>{e.preventDefault();if(!processed['club-logo']&&!processed['club-cover'])return toast('Bitte zuerst ein Logo oder Titelbild auswählen.','error');try{await uploadProcessedImage('club-logo',processed['club-logo'],clubSlug);await uploadProcessedImage('club-cover',processed['club-cover'],clubSlug);toast('Clubmedien wurden aktualisiert.');m.remove();hydrateClubProfile(clubSlug);}catch(err){toast(err.message,'error')}};});
  if(p==='/admin')hydrateAdmin();if(p==='/manager')hydrateManager();if(p.startsWith('/spieler/'))hydratePlayerProfile(decodeURIComponent(p.split('/')[2]||''));if(p.startsWith('/club/'))hydrateClubProfile(decodeURIComponent(p.split('/')[2]||''));
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
async function bindProfileSetup(){
  const form=document.querySelector('#profileSetupForm');if(!form)return;
  const platform=form.platform,position=form.position,secondary=form.secondaryPosition;
  if(state.me?.platform)platform.value=state.me.platform;
  if(state.me?.position)position.value=state.me.position;
  if(state.me?.secondary_position)secondary.value=state.me.secondary_position;
  form.onsubmit=async e=>{
    e.preventDefault();
    const submit=form.querySelector('button[type="submit"]'),fd=Object.fromEntries(new FormData(form));
    submit.disabled=true;submit.textContent='PROFIL WIRD ERSTELLT…';
    try{
      const r=await api('/api/profile/setup',{method:'POST',body:JSON.stringify(fd)});
      state.me=r.user;await refreshPublicData();toast('Dein EPL Spielerprofil ist bereit.');goto(`/spieler/${r.user.username.toLowerCase()}`);
    }catch(err){submit.disabled=false;submit.textContent='EPL PROFIL ERSTELLEN';toast(err.message,'error');}
  };
}
async function buyItem(id,btn){ const item=demo.shop.find(x=>x.id===id); if(!state.me){ toast('Bitte zuerst anmelden, um Shop-Artikel zu kaufen.','error'); return goto('/login'); } if(state.owned.has(String(id))) return toast('Dieses Cosmetic besitzt du bereits.'); try{ const r=await api('/api/shop/purchase',{method:'POST',body:JSON.stringify({itemId:id})}); state.me.coins=r.balance; await refreshInventory(); route(); toast(`${item.name} gekauft. Du kannst es jetzt unter Profil & Cosmetics ausrüsten.`);}catch(e){toast(e.message,'error')} }
async function buyCoins(packId){ const pack=demo.coinPacks.find(x=>x.id===packId); if(!state.me){ toast('Bitte zuerst anmelden, um EPL Coins zu kaufen.','error'); return goto('/login'); } if(!state.config.paymentsEnabled){ return toast('Echtgeld-Käufe sind momentan noch nicht aktiviert.','error'); } try{ const r=await api('/api/payments/checkout',{method:'POST',body:JSON.stringify({packId})}); location.href=r.url; }catch(e){toast(e.message,'error')} }

bootstrap();
