const json = (data, status=200, headers={}) => new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const fail = (message, status=400) => json({error:message}, status);
const enc = new TextEncoder();
const packs = {
  coins_500: {coins:500,cents:499},
  coins_1200: {coins:1200,cents:999},
  coins_2500: {coins:2500,cents:1999},
};

export async function onRequest(context){
  const {request, env} = context;
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/?/, '');
  const method = request.method.toUpperCase();
  try {
    if(route === 'config' && method === 'GET') return json({
      paymentsEnabled:String(env.PAYMENTS_ENABLED||'false')==='true',
      oauthGoogleEnabled:!!(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET),
      oauthDiscordEnabled:!!(env.DISCORD_CLIENT_ID&&env.DISCORD_CLIENT_SECRET),
      parentalConsentEmailEnabled:!!(env.RESEND_API_KEY&&env.PARENT_CONSENT_FROM_EMAIL)
    });
    if(route === 'auth/register' && method === 'POST') return fail('Passwort-Registrierung wurde deaktiviert. Bitte Google oder Discord verwenden.',410);
    if(route === 'auth/login' && method === 'POST') return fail('Passwort-Login wurde deaktiviert. Bitte Google oder Discord verwenden.',410);
    if(route === 'auth/oauth/google/start' && method === 'GET') return oauthStart('google',request,env);
    if(route === 'auth/oauth/google/callback' && method === 'GET') return oauthCallback('google',request,env);
    if(route === 'auth/oauth/discord/start' && method === 'GET') return oauthStart('discord',request,env);
    if(route === 'auth/oauth/discord/callback' && method === 'GET') return oauthCallback('discord',request,env);
    if(route === 'profile/setup' && method === 'POST') return setupProfile(request,env);
    if(route === 'parental-consent/check' && method === 'GET') return parentalConsentCheck(request,env);
    if(route === 'parental-consent/approve' && method === 'POST') return parentalConsentApprove(request,env);
    if(route === 'account/data-request' && method === 'POST') return createPrivacyAccessRequest(request,env);
    if(route === 'account/export' && method === 'GET') return exportAccountData(request,env);
    if(route === 'account/delete' && method === 'POST') return deleteAccount(request,env);
    if(route === 'auth/logout' && method === 'POST') return logout(request,env);
    if(route === 'auth/me' && method === 'GET') return me(request,env);
    if(route === 'presence' && method === 'POST') return heartbeat(request,env);
    if(route === 'notifications' && method === 'GET') return listNotifications(request,env);
    if(route === 'notifications/read' && method === 'POST') return readNotifications(request,env);
    if(route === 'mentions' && method === 'GET') return searchMentions(request,env);
    if(route === 'mentions/resolve' && method === 'GET') return resolveMentionRequest(request,env);
    if(route === 'contracts/mine' && method === 'GET') return listMyContracts(request,env);
    if(/^contracts\/\d+\/respond$/.test(route) && method === 'POST') return respondContract(route,request,env);
    if(/^contracts\/\d+\/release$/.test(route) && method === 'POST') return respondContractRelease(route,request,env);
    if(route === 'social/state' && method === 'GET') return socialState(request,env);
    if(route === 'social/feed' && method === 'GET') return socialFeed(request,env);
    if(route === 'social/follow' && method === 'POST') return follow(request,env);
    if(route === 'inventory' && method === 'GET') return getInventory(request,env);
    if(route === 'shop/catalog' && method === 'GET') return getShopCatalog(request,env);
    if(route === 'cms/public' && method === 'GET') return getCmsPublic(env);
    if(route === 'goals' && method === 'GET') return getSeasonGoals(request,env);
    if(route === 'achievements' && method === 'GET') return getAchievementsOverview(request,env);
    if(route === 'market-values' && method === 'GET') return getMarketValues(request,env);
    if(route === 'daily-hub' && method === 'GET') return getDailyHub(request,env);
    if(route === 'goals/select' && method === 'POST') return selectPlayerGoals(request,env);
    if(route === 'shop/equip' && method === 'POST') return equipItem(request,env);
    if(route === 'shop/remove-owned' && method === 'POST') return removeOwnedItem(request,env);
    if(route === 'social/like-target' && method === 'POST') return toggleTargetLike(request,env);
    if(route === 'messages' && method === 'GET') return listConversations(request,env);
    if(route === 'messages/start' && method === 'POST') return startConversation(request,env);
    if(/^messages\/\d+$/.test(route) && method === 'GET') return getConversationMessages(route,request,env);
    if(/^messages\/\d+\/send$/.test(route) && method === 'POST') return sendConversationMessage(route,request,env);
    if(route === 'clubs' && method === 'POST') return createClub(request,env);
    if(route === 'applications' && method === 'POST') return createApplication(request,env);
    if(route === 'contracts' && method === 'POST') return createContract(request,env);
    if(route === 'shop/purchase' && method === 'POST') return purchaseItem(request,env);
    if(route === 'payments/checkout' && method === 'POST') return createCheckout(request,env);
    if(route === 'payments/stripe/webhook' && method === 'POST') return stripeWebhook(request,env);
    if(route === 'upload' && method === 'POST') return uploadMedia(request,env);
    if(route.startsWith('media/') && method === 'GET') return getMedia(route.slice(6),env);
    if(route === 'profile' && method === 'POST') return updateProfile(request,env);
    if(route.startsWith('profile/') && method === 'GET') return getProfile(route.slice(8),request,env);
    if(route.startsWith('club/') && method === 'GET') return getClub(route.slice(5),request,env);
    if(route === 'standings' && method === 'GET') return getStandings(request,env);
    if(route === 'fixtures' && method === 'GET') return getFixtures(env);
    if(route === 'wallet' && method === 'GET') return getWallet(request,env);
    if(route === 'ea/club-info' && method === 'GET') return eaClubInfo(request,env);
    if(route === 'bootstrap' && method === 'GET') return getBootstrap(env);
    if(route === 'players' && method === 'GET') return listPlayers(env);
    if(route === 'clubs' && method === 'GET') return listClubs(env);
    if(route === 'news' && method === 'GET') return listNews(env);
    if(/^news\/[^/]+\/social$/.test(route) && method === 'GET') return getNewsSocial(route,request,env);
    if(/^news\/[^/]+\/reaction$/.test(route) && method === 'POST') return newsReaction(route,request,env);
    if(/^news\/[^/]+\/comments$/.test(route) && method === 'GET') return getNewsComments(route,request,env);
    if(/^news\/[^/]+\/comments$/.test(route) && method === 'POST') return createNewsComment(route,request,env);
    if(/^news-comments\/\d+\/like$/.test(route) && method === 'POST') return newsCommentLike(route,request,env);
    if(route.startsWith('news/') && method === 'GET') return getNewsArticle(route.slice(5),env);
    if(route === 'transfers' && method === 'GET') return listTransfers(env);
    if(route === 'rules' && method === 'GET') return getLeagueRules(env);
    if(/^posts\/\d+\/reaction$/.test(route) && method === 'POST') return postReaction(route,request,env);
    if(/^posts\/\d+\/comments$/.test(route) && method === 'GET') return getPostComments(route,request,env);
    if(/^posts\/\d+\/comments$/.test(route) && method === 'POST') return createComment(route,request,env);
    if(/^comments\/\d+\/like$/.test(route) && method === 'POST') return commentLike(route,request,env);
    if(/^comments\/\d+$/.test(route) && method === 'DELETE') return deleteOwnComment(route,request,env);
    if(/^posts\/\d+$/.test(route) && method === 'DELETE') return deleteOwnPost(route,request,env);
    if(route === 'posts' && method === 'POST') return createPost(request,env);
    if(route === 'reports' && method === 'POST') return createReport(request,env);
    if(route === 'admin/coin-award' && method === 'POST') return adminCoinAward(request,env);
    if(route === 'admin/awards' && method === 'GET') return adminAwardsOverview(request,env);
    if(route === 'admin/awards/grant' && method === 'POST') return adminAwardGrant(request,env);
    if(route === 'admin/awards/revoke' && method === 'POST') return adminAwardRevoke(request,env);
    if(route === 'admin/overview' && method === 'GET') return adminOverview(request,env);
    if(route === 'admin/totw' && method === 'GET') return adminTotwOverview(request,env);
    if(route === 'admin/totw/candidates' && method === 'GET') return adminTotwCandidates(request,env);
    if(route === 'admin/totw/award' && method === 'POST') return adminTotwAward(request,env);
    if(route === 'admin/reports' && method === 'GET') return adminReports(request,env);
    if(/^admin\/report\/\d+$/.test(route) && method === 'GET') return adminReportDetail(route,request,env);
    if(route === 'admin/cms' && method === 'GET') return adminCmsOverview(request,env);
    if(route === 'admin/shop' && method === 'GET') return adminShopOverview(request,env);
    if(route === 'admin/user/access' && method === 'POST') return adminUserAccess(request,env);
    if(route === 'admin/user/profile' && method === 'POST') return adminUserProfile(request,env);
    if(route === 'admin/market-value' && method === 'POST') return adminMarketValue(request,env);
    if(route === 'admin/club/save' && method === 'POST') return adminClubSave(request,env);
    if(route === 'admin/club/manager' && method === 'POST') return adminClubManager(request,env);
    if(route === 'admin/club/coin-award' && method === 'POST') return adminClubCoinAward(request,env);
    if(route === 'admin/season/save' && method === 'POST') return adminSeasonSave(request,env);
    if(route === 'admin/division/save' && method === 'POST') return adminDivisionSave(request,env);
    if(route === 'admin/division/delete' && method === 'POST') return adminDivisionDelete(request,env);
    if(route === 'admin/match/save' && method === 'POST') return adminMatchSave(request,env);
    if(route === 'admin/matches/generate' && method === 'POST') return adminGenerateMatches(request,env);
    if(route === 'admin/match/detail' && method === 'GET') return adminMatchDetail(request,env);
    if(route === 'admin/match/result' && method === 'POST') return adminMatchResult(request,env);
    if(route === 'admin/match/reset-result' && method === 'POST') return adminResetMatchResult(request,env);
    if(route === 'admin/schedule/reset' && method === 'POST') return adminResetSchedule(request,env);
    if(route === 'admin/news/save' && method === 'POST') return adminNewsSave(request,env);
    if(route === 'admin/news/delete' && method === 'POST') return adminNewsDelete(request,env);
    if(route === 'admin/rules' && method === 'GET') return adminRulesOverview(request,env);
    if(route === 'admin/rule/save' && method === 'POST') return adminRuleSave(request,env);
    if(route === 'admin/transfer-window/save' && method === 'POST') return adminTransferWindowSave(request,env);
    if(route === 'admin/transfer/save' && method === 'POST') return adminTransferSave(request,env);
    if(route === 'admin/content/delete' && method === 'POST') return adminContentDelete(request,env);
    if(route === 'admin/report/resolve' && method === 'POST') return adminReportResolve(request,env);
    if(route === 'admin/cms/page/save' && method === 'POST') return adminCmsPageSave(request,env);
    if(route === 'admin/cms/text/save' && method === 'POST') return adminCmsTextSave(request,env);
    if(route === 'admin/cms/slide/save' && method === 'POST') return adminCmsSlideSave(request,env);
    if(route === 'admin/cms/slide/delete' && method === 'POST') return adminCmsSlideDelete(request,env);
    if(route === 'admin/cms/block/save' && method === 'POST') return adminCmsBlockSave(request,env);
    if(route === 'admin/cms/block/delete' && method === 'POST') return adminCmsBlockDelete(request,env);
    if(route === 'admin/shop/save' && method === 'POST') return adminShopSave(request,env);
    if(route === 'admin/season/finalize' && method === 'POST') return adminFinalizeSeason(request,env);
    if(route === 'manager/overview' && method === 'GET') return managerOverview(request,env);
    if(route === 'manager/club' && method === 'POST') return managerClubUpdate(request,env);
    if(route === 'manager/player/update' && method === 'POST') return managerPlayerUpdate(request,env);
    if(route === 'manager/player/remove' && method === 'POST') return managerPlayerRemove(request,env);
    if(route === 'manager/player/remove-red-card' && method === 'POST') return managerRemoveRedCard(request,env);
    if(route === 'manager/application/action' && method === 'POST') return managerApplicationAction(request,env);
    if(route === 'manager/match/stats' && method === 'POST') return managerMatchStats(request,env);
    if(route === 'manager/match/stats-batch' && method === 'POST') return managerMatchStatsBatch(request,env);
    if(route === 'manager/match/schedule' && method === 'POST') return managerMatchSchedule(request,env);
    if(route === 'coins/gift' && method === 'POST') return fail('Coin-Geschenke zwischen Spielern oder Teams sind deaktiviert.',410);
    if(route === 'manager/goals/select' && method === 'POST') return selectClubGoals(request,env);
    if(/^matches\/\d+\/submit$/.test(route) && method === 'POST') return submitMatch(route,request,env);
    if(/^matches\/\d+\/confirm$/.test(route) && method === 'POST') return confirmMatch(route,request,env);
    return fail('API route not found',404);
  } catch (err) {
    console.error(err);
    return fail(err?.message || 'Internal server error', err?.status || 500);
  }
}

function requireDb(env){if(!env.DB) throw new Error('D1 binding DB fehlt. In Cloudflare Pages unter Settings > Bindings hinzufügen.');return env.DB}
function cookieMap(request){const raw=request.headers.get('cookie')||'';return Object.fromEntries(raw.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),decodeURIComponent(x.slice(i+1))]}))}
function randomId(bytes=32){const a=new Uint8Array(bytes);crypto.getRandomValues(a);return b64url(a)}
function b64url(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
function fromB64url(s){s=s.replaceAll('-','+').replaceAll('_','/');while(s.length%4)s+='=';const raw=atob(s);return Uint8Array.from(raw,c=>c.charCodeAt(0))}
function secureCookie(value,maxAge){return `epl_session=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
function slugify(s){return String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)}
function cleanText(s,max=500){return String(s||'').trim().slice(0,max)}
function sanitizeNewsHtml(input=''){
  let html=String(input||'').slice(0,100000);
  html=html.replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|option|meta|link)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,'');
  html=html.replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|option|meta|link)\b[^>]*\/?\s*>/gi,'');
  html=html.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'');
  html=html.replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi,'$1="#"');
  const allowed=new Set(['div','p','br','strong','b','em','i','u','s','h2','h3','h4','blockquote','ul','ol','li','a','img','hr','span','font']);
  const safeStyle=(attrs='')=>{
    const raw=(attrs.match(/style\s*=\s*["']([^"']*)["']/i)||[])[1]||'';const keep=[];
    for(const part of raw.split(';')){const [k,...vv]=part.split(':');if(!k||!vv.length)continue;const key=k.trim().toLowerCase(),v=vv.join(':').trim();
      if(key==='text-align'&&/^(left|center|right|justify)$/.test(v))keep.push(`text-align:${v}`);
      if(key==='font-family'&&/^[A-Za-z0-9 ,"'_-]{1,80}$/.test(v))keep.push(`font-family:${v}`);
      if(key==='font-size'&&/^(?:[8-9]|[1-4][0-9]|50)(?:px)?$/.test(v.replace(/\s/g,'')))keep.push(`font-size:${v.replace(/\s/g,'')}`);
      if(key==='color'&&/^(#[0-9a-f]{3,8}|rgb\([0-9 ,.]+\)|[a-z]{3,20})$/i.test(v))keep.push(`color:${v}`);
    }return keep.length?` style="${htmlEsc(keep.join(';'))}"`:'';
  };
  html=html.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi,(tag,name,attrs='')=>{
    name=String(name).toLowerCase();if(!allowed.has(name))return '';
    if(tag.startsWith('</'))return `</${name}>`;
    if(name==='a'){const href=(attrs.match(/href\s*=\s*["']([^"']+)["']/i)||[])[1]||'#';const safe=/^(https?:\/\/|\/|#)/i.test(href)?href:'#';return `<a href="${htmlEsc(safe)}" target="_blank" rel="noopener noreferrer">`;}
    if(name==='img'){const src=(attrs.match(/src\s*=\s*["']([^"']+)["']/i)||[])[1]||'';if(!/^(https?:\/\/|\/api\/media\/|\/assets\/)/i.test(src))return '';const alt=(attrs.match(/alt\s*=\s*["']([^"']*)["']/i)||[])[1]||'';return `<img src="${htmlEsc(src)}" alt="${htmlEsc(alt)}" loading="lazy">`;}
    if(name==='font'){
      const face=(attrs.match(/face\s*=\s*["']([^"']+)["']/i)||[])[1]||'',size=(attrs.match(/size\s*=\s*["']?([1-7])["']?/i)||[])[1]||'',color=(attrs.match(/color\s*=\s*["']([^"']+)["']/i)||[])[1]||'';let out='';if(face&&/^[A-Za-z0-9 ,"'_-]{1,80}$/.test(face))out+=` face="${htmlEsc(face)}"`;if(size)out+=` size="${size}"`;if(color&&/^(#[0-9a-f]{3,8}|[a-z]{3,20})$/i.test(color))out+=` color="${htmlEsc(color)}"`;return `<font${out}>`;
    }
    return `<${name}${safeStyle(attrs)}>`;
  });
  return html.trim();
}
function stripHtml(input=''){return String(input||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
async function seasonContextForClub(db,clubId){
  let season=await db.prepare(`SELECT s.* FROM seasons s JOIN season_clubs sc ON sc.season_id=s.id WHERE sc.club_id=? AND s.status='ACTIVE' ORDER BY s.id DESC LIMIT 1`).bind(clubId).first();
  if(!season)season=await db.prepare(`SELECT s.* FROM seasons s JOIN season_clubs sc ON sc.season_id=s.id WHERE sc.club_id=? AND s.status IN ('REGISTRATION','DRAFT') ORDER BY CASE s.status WHEN 'REGISTRATION' THEN 0 ELSE 1 END,s.id DESC LIMIT 1`).bind(clubId).first();
  if(!season)return null;
  await db.prepare(`INSERT OR IGNORE INTO club_season_limits(season_id,club_id) VALUES(?,?)`).bind(season.id,clubId).run();
  const limits=await db.prepare(`SELECT * FROM club_season_limits WHERE season_id=? AND club_id=?`).bind(season.id,clubId).first();
  const window=await db.prepare(`SELECT * FROM transfer_windows WHERE season_id=? AND status='OPEN' AND (opens_at IS NULL OR opens_at='' OR opens_at<=datetime('now')) AND (closes_at IS NULL OR closes_at='' OR closes_at>=datetime('now')) ORDER BY id DESC LIMIT 1`).bind(season.id).first();
  return {season,limits,window};
}
async function activeRosterCount(db,clubId){const r=await db.prepare(`SELECT COUNT(*) count FROM club_members WHERE club_id=? AND left_at IS NULL`).bind(clubId).first();return Number(r?.count||0);}
async function consumeTransferAllowance(db,clubId,ctx){
  if(!ctx?.season||ctx.season.status!=='ACTIVE')return {source:'PRESEASON',used:0};
  const limits=ctx.limits||{};
  if(Number(limits.transfers_used||0)<Number(limits.base_transfer_limit||5)){
    await db.prepare(`UPDATE club_season_limits SET transfers_used=transfers_used+1,updated_at=datetime('now') WHERE season_id=? AND club_id=?`).bind(ctx.season.id,clubId).run();
    return {source:'BASE',used:Number(limits.transfers_used||0)+1};
  }
  await db.prepare(`INSERT OR IGNORE INTO club_shop_entitlements(club_id) VALUES(?)`).bind(clubId).run();
  const ent=await db.prepare(`SELECT transfer_credits FROM club_shop_entitlements WHERE club_id=?`).bind(clubId).first();
  if(Number(ent?.transfer_credits||0)<1)throw httpError('Die 5 Saison-Transfers sind verbraucht und es sind keine zusätzlichen Transfer-Credits vorhanden. Kaufe im Club-Shop +5 Spieler-Transfers.',409);
  await db.prepare(`UPDATE club_shop_entitlements SET transfer_credits=transfer_credits-1,updated_at=datetime('now') WHERE club_id=?`).bind(clubId).run();
  return {source:'SHOP',used:Number(limits.transfers_used||0)};
}
async function consumeReleaseAllowance(db,clubId,ctx){
  if(!ctx?.season)throw httpError('Der Club ist aktuell keiner Saison zugeordnet.',409);
  const limits=ctx.limits||{};
  if(Number(limits.releases_used||0)<Number(limits.base_release_limit||5)){
    await db.prepare(`UPDATE club_season_limits SET releases_used=releases_used+1,updated_at=datetime('now') WHERE season_id=? AND club_id=?`).bind(ctx.season.id,clubId).run();
    return {source:'BASE',remaining:Math.max(0,Number(limits.base_release_limit||5)-Number(limits.releases_used||0)-1)};
  }
  await db.prepare(`INSERT OR IGNORE INTO club_shop_entitlements(club_id) VALUES(?)`).bind(clubId).run();
  const ent=await db.prepare(`SELECT release_credits FROM club_shop_entitlements WHERE club_id=?`).bind(clubId).first();
  if(Number(ent?.release_credits||0)<1)throw httpError('Die 5 Saison-Entlassungen sind verbraucht und es sind keine zusätzlichen Entlassungs-Credits vorhanden. Kaufe im Club-Shop +5 Spieler-Entlassungen.',409);
  await db.prepare(`UPDATE club_shop_entitlements SET release_credits=release_credits-1,updated_at=datetime('now') WHERE club_id=?`).bind(clubId).run();
  return {source:'SHOP',remaining:Math.max(0,Number(ent.release_credits||0)-1)};
}
async function validateOfficialLineup(db,rows,clubId){
  const played=(rows||[]).filter(x=>x&&x.played&&asId(x.userId));
  if(played.length<6)throw httpError('Nach EPL-Regelwerk müssen mindestens 5 Feldspieler + 1 menschlicher Torwart (6 Spieler) eingesetzt werden.',409);
  const ids=played.map(x=>asId(x.userId));let keeper=false;
  for(const uid of ids){const p=await db.prepare(`SELECT position FROM profiles WHERE user_id=?`).bind(uid).first();if(p?.position==='TW'){keeper=true;break;}}
  if(!keeper)throw httpError('Nach EPL-Regelwerk muss mindestens ein menschlicher Torwart (Position TW) eingesetzt werden.',409);
  for(const uid of ids){const member=await db.prepare(`SELECT 1 FROM club_members WHERE club_id=? AND user_id=? AND left_at IS NULL`).bind(clubId,uid).first();if(!member)throw httpError('Nicht spielberechtigter Spieler erkannt: Alle eingesetzten Spieler müssen registriert und dem Club zugeordnet sein.',409);}
  return true;
}
async function sha256Hex(value){const hash=await crypto.subtle.digest('SHA-256',enc.encode(String(value)));return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function htmlEsc(value=''){return String(value).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function ageFromBirthDate(value){const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;const y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]),birth=new Date(Date.UTC(y,mo-1,d));if(birth.getUTCFullYear()!=y||birth.getUTCMonth()!=mo-1||birth.getUTCDate()!=d)return null;const now=new Date();let age=now.getUTCFullYear()-y;const before=(now.getUTCMonth()+1<mo)||((now.getUTCMonth()+1===mo)&&now.getUTCDate()<d);if(before)age--;return age}
async function sendParentConsentEmail(env,{to,username,consentUrl}){
  if(!env.RESEND_API_KEY||!env.PARENT_CONSENT_FROM_EMAIL)throw httpError('Elternzustimmungs-E-Mail ist noch nicht eingerichtet. Bitte wende dich an die EPL Administration.',503);
  const body={from:String(env.PARENT_CONSENT_FROM_EMAIL),to:[to],subject:`EPL – Zustimmung für ${username}`,html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h2>EPL – Elite Pro League</h2><p>Für das EPL-Konto <strong>${htmlEsc(username)}</strong> wurde angegeben, dass die Nutzerin oder der Nutzer 13 bis 15 Jahre alt ist.</p><p>Wenn du erziehungsberechtigt bist und der Nutzung zustimmst, öffne bitte diesen persönlichen Link:</p><p><a href="${htmlEsc(consentUrl)}" style="display:inline-block;padding:12px 18px;background:#0b85ff;color:#fff;text-decoration:none;border-radius:8px">Zustimmung prüfen</a></p><p>Der Link ist 48 Stunden gültig. Wenn du diese Anfrage nicht erwartest, ignoriere diese E-Mail.</p></div>`};
  const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!res.ok){console.error('Parental consent email failed',res.status,await res.text().catch(()=>''));throw httpError('Die Elternzustimmungs-E-Mail konnte nicht versendet werden.',502);}return true;
}

function siteOrigin(request,env){
  const configured=String(env.PUBLIC_SITE_URL||'').trim();
  if(configured){try{return new URL(configured).origin}catch{}}
  return new URL(request.url).origin;
}
function oauthCookie(value,maxAge=600){return `epl_oauth=${encodeURIComponent(value)}; Path=/api/auth/oauth/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
function clearOauthCookie(){return 'epl_oauth=; Path=/api/auth/oauth/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'}
function redirectResponse(location,cookies=[]){
  const headers=new Headers({location,'cache-control':'no-store'});
  for(const cookie of cookies)headers.append('set-cookie',cookie);
  return new Response(null,{status:302,headers});
}
function oauthFailure(request,env,message){
  const target=new URL('/login',siteOrigin(request,env));
  target.searchParams.set('oauth_error',cleanText(message,180));
  return redirectResponse(target.toString(),[clearOauthCookie()]);
}
function oauthConfig(provider,request,env){
  const origin=siteOrigin(request,env);
  if(provider==='google')return {
    clientId:String(env.GOOGLE_CLIENT_ID||'').trim(),clientSecret:String(env.GOOGLE_CLIENT_SECRET||'').trim(),
    authorizeUrl:'https://accounts.google.com/o/oauth2/v2/auth',tokenUrl:'https://oauth2.googleapis.com/token',
    userUrl:'https://openidconnect.googleapis.com/v1/userinfo',scope:'openid email profile',redirectUri:`${origin}/api/auth/oauth/google/callback`
  };
  if(provider==='discord')return {
    clientId:String(env.DISCORD_CLIENT_ID||'').trim(),clientSecret:String(env.DISCORD_CLIENT_SECRET||'').trim(),
    authorizeUrl:'https://discord.com/oauth2/authorize',tokenUrl:'https://discord.com/api/oauth2/token',
    userUrl:'https://discord.com/api/v10/users/@me',scope:'identify email',redirectUri:`${origin}/api/auth/oauth/discord/callback`
  };
  throw httpError('Unbekannter OAuth-Anbieter.',400);
}
async function oauthStart(provider,request,env){
  const cfg=oauthConfig(provider,request,env);
  if(!cfg.clientId||!cfg.clientSecret)return oauthFailure(request,env,`${provider==='google'?'Google':'Discord'} Login ist noch nicht eingerichtet.`);
  const state=randomId(24),auth=new URL(cfg.authorizeUrl);
  auth.searchParams.set('client_id',cfg.clientId);auth.searchParams.set('redirect_uri',cfg.redirectUri);auth.searchParams.set('response_type','code');auth.searchParams.set('scope',cfg.scope);auth.searchParams.set('state',state);
  if(provider==='google')auth.searchParams.set('prompt','select_account');
  return redirectResponse(auth.toString(),[oauthCookie(`${provider}|${state}`)]);
}
async function oauthCallback(provider,request,env){
  const db=requireDb(env),url=new URL(request.url),cfg=oauthConfig(provider,request,env);
  const returnedState=url.searchParams.get('state')||'',code=url.searchParams.get('code')||'',providerError=url.searchParams.get('error');
  const saved=String(cookieMap(request).epl_oauth||''),split=saved.indexOf('|'),savedProvider=split>=0?saved.slice(0,split):'',savedState=split>=0?saved.slice(split+1):'';
  if(providerError)return oauthFailure(request,env,'Anmeldung wurde abgebrochen oder nicht erlaubt.');
  if(!code||!returnedState||savedProvider!==provider||savedState!==returnedState)return oauthFailure(request,env,'OAuth-Sicherheitsprüfung fehlgeschlagen. Bitte erneut anmelden.');
  if(!cfg.clientId||!cfg.clientSecret)return oauthFailure(request,env,'OAuth-Anbieter ist noch nicht vollständig eingerichtet.');

  const form=new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:cfg.redirectUri,client_id:cfg.clientId,client_secret:cfg.clientSecret});
  let token;
  try{
    const tokenRes=await fetch(cfg.tokenUrl,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},body:form});
    token=await tokenRes.json();
    if(!tokenRes.ok||!token.access_token){console.error('OAuth token exchange failed',provider,tokenRes.status,JSON.stringify(token));return oauthFailure(request,env,'Anmeldung beim Anbieter konnte nicht abgeschlossen werden.');}
  }catch(error){console.error('OAuth token request failed',provider,error);return oauthFailure(request,env,'OAuth-Verbindung konnte nicht hergestellt werden.');}

  let identity;
  try{
    const userRes=await fetch(cfg.userUrl,{headers:{Authorization:`Bearer ${token.access_token}`,'Accept':'application/json'}}),raw=await userRes.json();
    if(!userRes.ok){console.error('OAuth userinfo failed',provider,userRes.status,JSON.stringify(raw));return oauthFailure(request,env,'Profildaten konnten nicht vom Anbieter geladen werden.');}
    identity=normalizeOAuthIdentity(provider,raw);
  }catch(error){console.error('OAuth userinfo request failed',provider,error);return oauthFailure(request,env,'Profildaten konnten nicht geladen werden.');}

  if(!identity.id||!identity.email)return oauthFailure(request,env,'Der Anbieter hat keine nutzbare E-Mail-Adresse übermittelt.');
  if(identity.emailVerified===false)return oauthFailure(request,env,'Bitte bestätige zuerst deine E-Mail-Adresse beim Anbieter.');

  let user=await db.prepare(`SELECT u.id,u.email,u.username,u.role,u.status,COALESCE(po.completed,0) profile_completed
    FROM oauth_accounts oa JOIN users u ON u.id=oa.user_id LEFT JOIN profile_onboarding po ON po.user_id=u.id
    WHERE oa.provider=? AND oa.provider_user_id=?`).bind(provider,identity.id).first();

  if(!user){
    user=await db.prepare(`SELECT u.id,u.email,u.username,u.role,u.status,COALESCE(po.completed,0) profile_completed
      FROM users u LEFT JOIN profile_onboarding po ON po.user_id=u.id WHERE u.email=? COLLATE NOCASE`).bind(identity.email).first();
    if(user){
      await db.prepare(`INSERT INTO oauth_accounts(provider,provider_user_id,user_id,provider_email,provider_username,avatar_url) VALUES(?,?,?,?,?,?)`).bind(provider,identity.id,user.id,identity.email,identity.username,identity.avatarUrl).run();
    }else{
      const username=await uniqueUsername(db,identity.username||identity.displayName||`${provider}player`,identity.id),placeholder=`oauth_only$${randomId(24)}`;
      const created=await db.prepare('INSERT INTO users(email,username,password_hash) VALUES(?,?,?)').bind(identity.email,username,placeholder).run(),userId=created.meta.last_row_id;
      await db.batch([
        db.prepare(`INSERT INTO profiles(user_id,ea_id,platform,discord,country,position,secondary_position,bio) VALUES(?,?,?,?,?,?,?,?)`).bind(userId,'','',provider==='discord'?identity.username:'','DE','','','Neu in der Elite Pro League.'),
        db.prepare('INSERT INTO coin_wallets(user_id,balance,lifetime_earned) VALUES(?,60,60)').bind(userId),
        db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,60,'PERFORMANCE','WELCOME',?,'Willkommensguthaben für Profil- und Titelbild')`).bind(userId,String(userId)),
        db.prepare('INSERT INTO profile_onboarding(user_id,shirt_number,completed) VALUES(?,NULL,0)').bind(userId),
        db.prepare(`INSERT INTO oauth_accounts(provider,provider_user_id,user_id,provider_email,provider_username,avatar_url) VALUES(?,?,?,?,?,?)`).bind(provider,identity.id,userId,identity.email,identity.username,identity.avatarUrl)
      ]);
      user={id:userId,email:identity.email,username,role:'PLAYER',status:'ACTIVE',profile_completed:0};
    }
  }else{
    await db.prepare(`UPDATE oauth_accounts SET provider_email=?,provider_username=?,avatar_url=?,updated_at=datetime('now') WHERE provider=? AND provider_user_id=?`).bind(identity.email,identity.username,identity.avatarUrl,provider,identity.id).run();
  }

  if(user.status==='SUSPENDED'){
    const activeRestriction=await db.prepare(`SELECT id,rule_code,reason,ends_at FROM user_restrictions WHERE user_id=? AND active=1 ORDER BY created_at DESC LIMIT 1`).bind(user.id).first();
    const expiry=activeRestriction?.ends_at?Date.parse(String(activeRestriction.ends_at).replace(' ','T')+'Z'):NaN;
    if(Number.isFinite(expiry)&&expiry<=Date.now()){
      await db.batch([db.prepare(`UPDATE users SET status='ACTIVE',updated_at=datetime('now') WHERE id=?`).bind(user.id),db.prepare(`UPDATE user_restrictions SET active=0,lifted_at=datetime('now') WHERE id=?`).bind(activeRestriction.id)]);
      user.status='ACTIVE';
    }
  }
  if(user.status!=='ACTIVE'){const r=await db.prepare(`SELECT rule_code,reason,ends_at FROM user_restrictions WHERE user_id=? AND active=1 ORDER BY created_at DESC LIMIT 1`).bind(user.id).first();const until=r?.ends_at?` bis ${r.ends_at}`:'';return oauthFailure(request,env,`Dein Konto ist eingeschränkt${until}. ${r?.rule_code?`Regel ${r.rule_code}: `:''}${r?.reason||'Bitte kontaktiere die EPL Administration.'}`);}
  const sid=randomId(32),maxAge=60*60*24*30;
  await db.batch([db.prepare("DELETE FROM sessions WHERE expires_at<=datetime('now')"),db.prepare(`INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,datetime('now','+30 days'))`).bind(sid,user.id)]);
  const destination=Number(user.profile_completed||0)===1?'/' : '/profil-einrichten';
  return redirectResponse(new URL(destination,siteOrigin(request,env)).toString(),[secureCookie(sid,maxAge),clearOauthCookie()]);
}
function normalizeOAuthIdentity(provider,raw){
  if(provider==='google')return {id:String(raw.sub||''),email:String(raw.email||'').toLowerCase(),emailVerified:raw.email_verified===true,username:cleanText(raw.name||raw.given_name||'GooglePlayer',80),displayName:cleanText(raw.name||'',80),avatarUrl:cleanText(raw.picture||'',500)};
  return {id:String(raw.id||''),email:String(raw.email||'').toLowerCase(),emailVerified:raw.verified===true,username:cleanText(raw.global_name||raw.username||'DiscordPlayer',80),displayName:cleanText(raw.global_name||raw.username||'',80),avatarUrl:raw.avatar&&raw.id?`https://cdn.discordapp.com/avatars/${raw.id}/${raw.avatar}.png?size=256`:''};
}
function usernameBase(value,providerId){
  let base=String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_.-]+/g,'').replace(/^[._-]+|[._-]+$/g,'').slice(0,24);
  if(base.length<3)base=`Player${String(providerId||randomId(4)).replace(/[^A-Za-z0-9]/g,'').slice(-8)}`.slice(0,24);
  return base;
}
async function uniqueUsername(db,value,providerId){
  const base=usernameBase(value,providerId);
  for(let i=0;i<40;i++){const suffix=i===0?'':String(i+1),candidate=`${base.slice(0,24-suffix.length)}${suffix}`;const exists=await db.prepare('SELECT 1 FROM users WHERE username=? COLLATE NOCASE').bind(candidate).first();if(!exists)return candidate;}
  return `Player${randomId(6).replace(/[^A-Za-z0-9]/g,'').slice(0,12)}`;
}
async function currentUser(request,env){
  const db=requireDb(env), sid=cookieMap(request).epl_session;if(!sid)return null;
  const row=await db.prepare(`SELECT u.id,u.email,u.username,u.role,u.status,u.birth_date,u.legal_terms_accepted_at,u.privacy_acknowledged_at,u.community_guidelines_accepted_at,p.avatar_key,p.cover_key,p.ea_id,p.platform,p.position,p.secondary_position,p.country,p.bio,p.discord,p.tiktok,p.twitch,p.free_agent,p.equipped_avatar_frame_id,p.equipped_cover_frame_id,p.equipped_name_effect_id,p.equipped_name_font_id,p.equipped_name_color_id,p.equipped_badge_id,p.use_totw_frame,p.shop_verified,p.shop_spotlight,
      COALESCE(w.balance,0) AS coins,COALESCE(po.shirt_number,0) AS shirt_number,COALESCE(po.parental_consent_status,'NOT_REQUIRED') parental_consent_status,po.guardian_email,
      COALESCE(po.completed,CASE WHEN length(trim(COALESCE(p.ea_id,'')))>0 AND length(trim(COALESCE(p.position,'')))>0 THEN 1 ELSE 0 END) AS profile_completed,
      ur.status restriction_status,ur.rule_code restriction_rule,ur.reason restriction_reason,ur.ends_at restriction_until
    FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN coin_wallets w ON w.user_id=u.id LEFT JOIN profile_onboarding po ON po.user_id=u.id
    LEFT JOIN user_restrictions ur ON ur.id=(SELECT id FROM user_restrictions r WHERE r.user_id=u.id AND r.active=1 ORDER BY r.created_at DESC LIMIT 1)
    WHERE s.id=? AND s.expires_at>datetime('now')`).bind(sid).first();
  if(!row)return null;
  if(row.status==='SUSPENDED'&&row.restriction_until){
    const until=Date.parse(String(row.restriction_until).replace(' ','T')+'Z');
    if(Number.isFinite(until)&&until<=Date.now()){
      await db.batch([
        db.prepare(`UPDATE users SET status='ACTIVE',updated_at=datetime('now') WHERE id=?`).bind(row.id),
        db.prepare(`UPDATE user_restrictions SET active=0,lifted_at=datetime('now') WHERE user_id=? AND active=1 AND status='SUSPENDED'`).bind(row.id)
      ]);
      row.status='ACTIVE';row.restriction_status=null;row.restriction_rule=null;row.restriction_reason=null;row.restriction_until=null;
    }
  }
  row.admin_roles=await getAdminRoles(db,row.id);
  row.is_admin=row.role==='SUPER_ADMIN'||row.admin_roles.length>0;
  const managed=await db.prepare(`SELECT c.slug,cm.role FROM club_members cm JOIN clubs c ON c.id=cm.club_id WHERE cm.user_id=? AND cm.left_at IS NULL AND cm.role IN ('MANAGER','CO_MANAGER') LIMIT 1`).bind(row.id).first();
  row.managed_club_slug=managed?.slug||null;row.club_role=managed?.role||null;
  return row;
}
async function requireUser(request,env,roles){const u=await currentUser(request,env);if(!u)throw httpError('Bitte zuerst anmelden.',401);if(u.status!=='ACTIVE')throw httpError('Account ist nicht aktiv.',403);if(roles && !roles.includes(u.role))throw httpError('Keine Berechtigung.',403);return u}
function httpError(message,status){const e=new Error(message);e.status=status;return e}

const ADMIN_ROLE_PERMISSIONS={
  FULL_ADMIN:['*'],
  USER_ADMIN:['users','profiles','moderation'],
  LEAGUE_ADMIN:['clubs','leagues','matches','transfers'],
  MATCH_ADMIN:['matches','stats'],
  NEWS_ADMIN:['news'],
  COIN_ADMIN:['coins']
};
async function getAdminRoles(db,userId){
  try{const r=await db.prepare('SELECT role FROM user_admin_roles WHERE user_id=? ORDER BY role').bind(userId).all();return (r.results||[]).map(x=>x.role)}catch{return []}
}
async function requireAdminPermission(request,env,permission,{ownerOnly=false}={}){
  const db=requireDb(env),u=await requireUser(request,env);
  if(u.role==='SUPER_ADMIN')return u;
  if(ownerOnly)throw httpError('Nur der Website-Hauptadmin darf Admin-Rollen vergeben.',403);
  const roles=await getAdminRoles(db,u.id);
  const allowed=roles.some(r=>(ADMIN_ROLE_PERMISSIONS[r]||[]).includes('*')||(ADMIN_ROLE_PERMISSIONS[r]||[]).includes(permission));
  if(!allowed)throw httpError('Keine Berechtigung für diesen Admin-Bereich.',403);
  u.admin_roles=roles;return u;
}
async function canClubPermission(db,user,clubId,permission){
  if(user.role==='SUPER_ADMIN')return true;
  const adminRoles=await getAdminRoles(db,user.id);
  if(adminRoles.some(r=>r==='FULL_ADMIN'||r==='LEAGUE_ADMIN'||r==='MATCH_ADMIN')){
    if(permission!=='manage_page'||adminRoles.some(r=>r==='FULL_ADMIN'||r==='LEAGUE_ADMIN'))return true;
  }
  const club=await db.prepare('SELECT manager_user_id FROM clubs WHERE id=?').bind(clubId).first();
  if(club?.manager_user_id===user.id)return true;
  const col={manage_page:'can_manage_page',submit_results:'can_submit_results',manage_stats:'can_manage_stats',manage_roster:'can_manage_roster'}[permission];
  if(!col)return false;
  const row=await db.prepare(`SELECT ${col} allowed FROM club_staff_permissions WHERE club_id=? AND user_id=?`).bind(clubId,user.id).first();
  return Number(row?.allowed||0)===1;
}

async function notifyUser(db,userId,type,title,body='',href=''){
  if(!userId)return;
  await db.prepare(`INSERT INTO notifications(user_id,type,title,body,href) VALUES(?,?,?,?,?)`).bind(userId,cleanText(type,40)||'INFO',cleanText(title,120),cleanText(body,500),cleanText(href,250)).run();
}
function mentionTokens(text=''){
  const found=new Set(),re=/(^|[^A-Za-z0-9_.-])@([A-Za-z0-9_.-]{2,50})/g;let m;
  while((m=re.exec(String(text))))found.add(m[2].toLowerCase());
  return [...found].slice(0,30);
}
function compactMention(v=''){return String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
async function resolveMention(db,token){
  token=cleanText(token,50).toLowerCase();if(!token)return null;
  const user=await db.prepare(`SELECT id,username FROM users WHERE lower(username)=? AND status='ACTIVE' LIMIT 1`).bind(token).first();
  if(user)return {type:'player',id:user.id,label:user.username,slug:user.username.toLowerCase(),mention:user.username};
  const compact=compactMention(token),clubs=(await db.prepare(`SELECT id,name,slug,manager_user_id FROM clubs WHERE lower(slug)=? OR replace(lower(slug),'-','')=? OR lower(slug) LIKE ? OR replace(lower(slug),'-','') LIKE ? ORDER BY CASE WHEN lower(slug)=? THEN 0 WHEN replace(lower(slug),'-','')=? THEN 1 ELSE 2 END,name LIMIT 3`).bind(token,compact,`${token}%`,`${compact}%`,token,compact).all()).results||[];
  if(clubs.length===1){const c=clubs[0];return {type:'club',id:c.id,label:c.name,slug:c.slug,mention:c.slug,manager_user_id:c.manager_user_id};}
  return null;
}
async function searchMentions(request,env){
  const db=requireDb(env),url=new URL(request.url),q=cleanText(url.searchParams.get('q')||'',40).toLowerCase(),like=`${q}%`,compact=compactMention(q),items=[];
  const users=(await db.prepare(`SELECT u.id,u.username,p.avatar_key FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.status='ACTIVE' AND (?='' OR lower(u.username) LIKE ?) ORDER BY u.username COLLATE NOCASE LIMIT 5`).bind(q,like).all()).results||[];
  for(const u of users)items.push({type:'player',id:u.id,label:u.username,slug:u.username.toLowerCase(),mention:u.username,avatar_key:u.avatar_key});
  const clubs=(await db.prepare(`SELECT id,name,slug,logo_key FROM clubs WHERE ?='' OR lower(name) LIKE ? OR lower(slug) LIKE ? OR replace(lower(slug),'-','') LIKE ? ORDER BY name COLLATE NOCASE LIMIT 5`).bind(q,like,like,`${compact}%`).all()).results||[];
  for(const c of clubs)items.push({type:'club',id:c.id,label:c.name,slug:c.slug,mention:c.slug,avatar_key:c.logo_key});
  return json({items:items.slice(0,8)});
}
async function resolveMentionRequest(request,env){
  const db=requireDb(env),url=new URL(request.url),target=await resolveMention(db,url.searchParams.get('token')||'');if(!target)return fail('Mention nicht gefunden.',404);return json(target);
}
async function notifyMentions(db,text,actorUserId,{actorLabel='',href='',type='MENTION'}={}){
  const tokens=mentionTokens(text);if(!tokens.length)return;
  const notified=new Set();
  for(const token of tokens){
    const target=await resolveMention(db,token);if(!target)continue;
    if(target.type==='player'){
      if(Number(target.id)===Number(actorUserId)||notified.has(`u:${target.id}`))continue;
      notified.add(`u:${target.id}`);await notifyUser(db,target.id,type,`${actorLabel||'Jemand'} hat dich erwähnt`,String(text).slice(0,220),href||`/spieler/${target.slug}`);continue;
    }
    const recipients=new Set();
    if(target.manager_user_id)recipients.add(Number(target.manager_user_id));
    const staff=(await db.prepare(`SELECT DISTINCT user_id FROM club_members WHERE club_id=? AND left_at IS NULL AND role IN ('MANAGER','CO_MANAGER') UNION SELECT DISTINCT user_id FROM club_staff_permissions WHERE club_id=? AND can_manage_page=1`).bind(target.id,target.id).all()).results||[];
    for(const row of staff)recipients.add(Number(row.user_id));
    for(const uid of recipients){if(!uid||uid===Number(actorUserId)||notified.has(`u:${uid}`))continue;notified.add(`u:${uid}`);await notifyUser(db,uid,'CLUB_MENTION',`${actorLabel||'Jemand'} hat ${target.label} erwähnt`,String(text).slice(0,220),href||`/club/${target.slug}`);}
  }
}
async function addClubReputation(db,clubId,amount,eventType,referenceType,referenceId,description=''){
  clubId=Number(clubId);amount=Math.trunc(Number(amount)||0);if(!clubId||!amount)return false;
  const exists=await db.prepare(`SELECT 1 FROM club_reputation_events WHERE club_id=? AND event_type=? AND reference_type=? AND reference_id=?`).bind(clubId,eventType,referenceType,String(referenceId)).first();
  if(exists)return false;
  await db.batch([
    db.prepare(`INSERT INTO club_reputation_events(club_id,amount,event_type,reference_type,reference_id,description) VALUES(?,?,?,?,?,?)`).bind(clubId,amount,eventType,referenceType,String(referenceId),cleanText(description,240)),
    db.prepare(`UPDATE clubs SET reputation=MAX(0,reputation+?),updated_at=datetime('now') WHERE id=?`).bind(amount,clubId)
  ]);return true;
}
async function listNotifications(request,env){
  const db=requireDb(env),u=await requireUser(request,env),url=new URL(request.url),limit=Math.max(10,Math.min(100,Number(url.searchParams.get('limit')||60)));
  const rows=await db.prepare(`SELECT id,type,title,body,href,read_at,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT ?`).bind(u.id,limit).all();
  const unread=await db.prepare(`SELECT COUNT(*) count FROM notifications WHERE user_id=? AND read_at IS NULL`).bind(u.id).first();
  return json({notifications:rows.results||[],unread:Number(unread?.count||0)});
}
async function readNotifications(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json().catch(()=>({})),id=Number(b.id||0);
  if(id)await db.prepare(`UPDATE notifications SET read_at=COALESCE(read_at,datetime('now')) WHERE id=? AND user_id=?`).bind(id,u.id).run();
  else await db.prepare(`UPDATE notifications SET read_at=COALESCE(read_at,datetime('now')) WHERE user_id=?`).bind(u.id).run();
  return json({ok:true});
}

async function heartbeat(request,env){
  const db=requireDb(env),u=await requireUser(request,env);
  await db.prepare(`UPDATE profiles SET last_seen_at=datetime('now') WHERE user_id=?`).bind(u.id).run();
  return json({ok:true,online:true,reward:0});
}
async function logout(request,env){
  const db=requireDb(env),sid=cookieMap(request).epl_session;
  if(sid){
    const row=await db.prepare('SELECT user_id FROM sessions WHERE id=?').bind(sid).first();
    if(row?.user_id)await db.prepare(`UPDATE profiles SET last_seen_at=datetime('now','-1 day') WHERE user_id=?`).bind(row.user_id).run();
    await db.prepare('DELETE FROM sessions WHERE id=?').bind(sid).run();
  }
  return json({ok:true},200,{'set-cookie':'epl_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'});
}
async function me(request,env){
  const user=await currentUser(request,env);
  if(!user)return fail('Nicht angemeldet.',401);
  await requireDb(env).prepare(`UPDATE profiles SET last_seen_at=datetime('now') WHERE user_id=?`).bind(user.id).run();
  return json({user});
}

async function socialState(request,env){
  const db=requireDb(env),u=await requireUser(request,env);
  const [players,clubs]=await Promise.all([
    db.prepare(`SELECT lower(t.username) slug FROM follows f JOIN users t ON t.id=f.followed_user_id WHERE f.follower_user_id=?`).bind(u.id).all(),
    db.prepare(`SELECT c.slug FROM club_follows f JOIN clubs c ON c.id=f.club_id WHERE f.user_id=?`).bind(u.id).all()
  ]);
  return json({following:[...(players.results||[]).map(x=>`player:${x.slug}`),...(clubs.results||[]).map(x=>`club:${x.slug}`)]});
}
async function socialFeed(request,env){
  const db=requireDb(env),u=await requireUser(request,env);
  const r=await db.prepare(`SELECT p.id,p.body,p.media_key,p.created_at,
      CASE WHEN p.club_id IS NOT NULL THEN 'club' ELSE 'player' END author_type,
      COALESCE(c.name,au.username) author_name,COALESCE(c.slug,lower(au.username)) author_slug,
      CASE WHEN p.club_id IS NOT NULL THEN c.logo_key ELSE ap.avatar_key END author_image_key,
      CASE WHEN p.club_id IS NULL AND ap.last_seen_at>=datetime('now','-7 minutes') THEN 1 ELSE 0 END author_online,
      ((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id)+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id)) reactions,
      (SELECT COUNT(*) FROM comments cm WHERE cm.post_id=p.id) comments,
      ((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.reaction='LIKE')+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id AND cpr.reaction='LIKE')) likes,
      ((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.reaction='FIRE')+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id AND cpr.reaction='FIRE')) fires,
      ((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.reaction='CLAP')+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id AND cpr.reaction='CLAP')) claps,
      ((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.reaction='GOAL')+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id AND cpr.reaction='GOAL')) goals
    FROM posts p
    LEFT JOIN users au ON au.id=p.author_user_id LEFT JOIN profiles ap ON ap.user_id=au.id LEFT JOIN clubs c ON c.id=p.club_id
    WHERE (p.author_user_id IN (SELECT followed_user_id FROM follows WHERE follower_user_id=?))
       OR (p.club_id IN (SELECT club_id FROM club_follows WHERE user_id=?))
    ORDER BY p.created_at DESC LIMIT 40`).bind(u.id,u.id).all();
  return json({posts:r.results||[]});
}
async function getInventory(request,env){
  const db=requireDb(env),u=await requireUser(request,env);
  const [items,p,totw]=await Promise.all([
    db.prepare(`SELECT si.id,si.sku,si.name,si.category,si.description,si.price_coins,si.price_eur_cents,si.asset_key,si.rarity,si.shop_group,si.item_type,si.style_key,si.style_value,ui.acquired_at FROM user_inventory ui JOIN shop_items si ON si.id=ui.item_id WHERE ui.user_id=? ORDER BY ui.acquired_at DESC`).bind(u.id).all(),
    db.prepare(`SELECT equipped_avatar_frame_id,equipped_cover_frame_id,equipped_name_effect_id,equipped_name_font_id,equipped_name_color_id,equipped_badge_id,use_totw_frame,shop_verified,shop_spotlight FROM profiles WHERE user_id=?`).bind(u.id).first(),
    db.prepare(`SELECT id,season_id,division_id,matchday,slot_label,selected_at,expires_at FROM totw_selections WHERE user_id=? AND expires_at>datetime('now') ORDER BY expires_at DESC LIMIT 1`).bind(u.id).first()
  ]);
  if(!totw&&Number(p?.use_totw_frame))await db.prepare(`UPDATE profiles SET use_totw_frame=0 WHERE user_id=?`).bind(u.id).run();
  return json({items:items.results||[],equipped:{avatarFrame:totw&&Number(p?.use_totw_frame)?'TOTW':(p?.equipped_avatar_frame_id||null),coverFrame:p?.equipped_cover_frame_id||null,nameEffect:p?.equipped_name_effect_id||null,nameFont:p?.equipped_name_font_id||null,nameColor:p?.equipped_name_color_id||null,badge:p?.equipped_badge_id||null},profileShop:{verified:!!Number(p?.shop_verified),spotlight:!!Number(p?.shop_spotlight)},totw:totw?{available:true,equipped:!!Number(p?.use_totw_frame),expiresAt:totw.expires_at,matchday:totw.matchday,assetKey:'/assets/totw/SpielerDerWocheRahmen.png'}:{available:false,equipped:false,assetKey:'/assets/totw/SpielerDerWocheRahmen.png'}});
}
async function equipItem(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json();
  const slot=cleanText(b.slot,30),rawItem=b.itemId,itemId=rawItem===null||rawItem===''?null:(String(rawItem).toUpperCase()==='TOTW'?'TOTW':Number(rawItem));
  const slots={
    avatar_frame:{category:'AVATAR_FRAME',col:'equipped_avatar_frame_id',itemTypes:['AVATAR_FRAME','ANIMATED_AVATAR_FRAME']},avatarFrame:{category:'AVATAR_FRAME',col:'equipped_avatar_frame_id',itemTypes:['AVATAR_FRAME','ANIMATED_AVATAR_FRAME']},
    cover_frame:{category:'COVER_FRAME',col:'equipped_cover_frame_id',itemTypes:['COVER_FRAME']},coverFrame:{category:'COVER_FRAME',col:'equipped_cover_frame_id',itemTypes:['COVER_FRAME']},
    name_effect:{category:'NAME_EFFECT',col:'equipped_name_effect_id',itemTypes:['NAME_EFFECT']},nameEffect:{category:'NAME_EFFECT',col:'equipped_name_effect_id',itemTypes:['NAME_EFFECT']},
    name_font:{category:'NAME_EFFECT',col:'equipped_name_font_id',itemTypes:['NAME_FONT']},nameFont:{category:'NAME_EFFECT',col:'equipped_name_font_id',itemTypes:['NAME_FONT']},
    name_color:{category:'NAME_EFFECT',col:'equipped_name_color_id',itemTypes:['NAME_COLOR']},nameColor:{category:'NAME_EFFECT',col:'equipped_name_color_id',itemTypes:['NAME_COLOR']},
    badge:{category:'BADGE',col:'equipped_badge_id',itemTypes:['BADGE']}
  };
  const cfg=slots[slot];if(!cfg)return fail('Ungültiger Cosmetic-Slot.');
  if(itemId==='TOTW'){
    if(cfg.category!=='AVATAR_FRAME')return fail('TOTW kann nur als Profilbildrahmen verwendet werden.',409);
    const active=await db.prepare(`SELECT id,expires_at FROM totw_selections WHERE user_id=? AND expires_at>datetime('now') ORDER BY expires_at DESC LIMIT 1`).bind(u.id).first();
    if(!active)return fail('Dein TOTW-Rahmen ist nicht mehr aktiv.',403);
    await db.prepare(`UPDATE profiles SET use_totw_frame=1,updated_at=datetime('now') WHERE user_id=?`).bind(u.id).run();return getInventory(request,env);
  }
  if(itemId!==null){
    if(!Number.isInteger(itemId)||itemId<=0)return fail('Ungültiges Shop-Item.');
    const owned=await db.prepare(`SELECT si.id,si.category,si.item_type FROM user_inventory ui JOIN shop_items si ON si.id=ui.item_id WHERE ui.user_id=? AND ui.item_id=?`).bind(u.id,itemId).first();
    if(!owned)return fail('Dieses Cosmetic befindet sich nicht in deinem Inventar.',403);
    if(owned.category!==cfg.category||!cfg.itemTypes.includes(String(owned.item_type||'')))return fail('Dieses Cosmetic passt nicht in den gewählten Slot.',409);
  }
  const stmts=[db.prepare(`UPDATE profiles SET ${cfg.col}=?,${cfg.category==='AVATAR_FRAME'?'use_totw_frame=0,':''}updated_at=datetime('now') WHERE user_id=?`).bind(itemId,u.id)];
  if(cfg.col==='equipped_avatar_frame_id')stmts.push(db.prepare(`UPDATE user_inventory SET equipped=CASE WHEN item_id=? THEN 1 ELSE 0 END WHERE user_id=? AND item_id IN (SELECT id FROM shop_items WHERE item_type IN ('AVATAR_FRAME','ANIMATED_AVATAR_FRAME'))`).bind(itemId||-1,u.id));else stmts.push(db.prepare(`UPDATE user_inventory SET equipped=CASE WHEN item_id=? THEN 1 ELSE 0 END WHERE user_id=? AND item_id IN (SELECT id FROM shop_items WHERE item_type=?)`).bind(itemId||-1,u.id,cfg.itemTypes[0]));await db.batch(stmts);return getInventory(request,env);
}
async function removeOwnedItem(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),itemId=Number(b.itemId);
  if(!Number.isInteger(itemId)||itemId<=0)return fail('Ungültiges Shop-Item.');
  const item=await db.prepare(`SELECT si.id,si.name,si.category,si.item_type FROM user_inventory ui JOIN shop_items si ON si.id=ui.item_id WHERE ui.user_id=? AND ui.item_id=?`).bind(u.id,itemId).first();
  if(!item)return fail('Dieser Inhalt befindet sich nicht in deinem Inventar.',404);
  const col={AVATAR_FRAME:'equipped_avatar_frame_id',ANIMATED_AVATAR_FRAME:'equipped_avatar_frame_id',COVER_FRAME:'equipped_cover_frame_id',NAME_EFFECT:'equipped_name_effect_id',NAME_FONT:'equipped_name_font_id',NAME_COLOR:'equipped_name_color_id',BADGE:'equipped_badge_id'}[item.item_type]||({AVATAR_FRAME:'equipped_avatar_frame_id',COVER_FRAME:'equipped_cover_frame_id',BADGE:'equipped_badge_id'}[item.category]);
  const stmts=[];
  if(col)stmts.push(db.prepare(`UPDATE profiles SET ${col}=NULL,updated_at=datetime('now') WHERE user_id=? AND ${col}=?`).bind(u.id,itemId));
  if(item.item_type==='PROFILE_VERIFIED')stmts.push(db.prepare(`UPDATE profiles SET shop_verified=0,updated_at=datetime('now') WHERE user_id=?`).bind(u.id));
  if(item.item_type==='PROFILE_SPOTLIGHT')stmts.push(db.prepare(`UPDATE profiles SET shop_spotlight=0,updated_at=datetime('now') WHERE user_id=?`).bind(u.id));
  stmts.push(db.prepare('DELETE FROM user_inventory WHERE user_id=? AND item_id=?').bind(u.id,itemId));
  await db.batch(stmts);return json({ok:true,itemId,name:item.name});
}

async function startConversation(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),target=await resolveMessageTarget(db,b,u);
  if(!target)return fail('Empfänger nicht gefunden.',404);if(target.id===u.id)return fail('Du kannst dir nicht selbst schreiben.',409);
  const a=Math.min(u.id,target.id),z=Math.max(u.id,target.id);
  await db.prepare(`INSERT INTO conversations(user_a,user_b) VALUES(?,?) ON CONFLICT(user_a,user_b) DO UPDATE SET updated_at=updated_at`).bind(a,z).run();
  const c=await db.prepare('SELECT id FROM conversations WHERE user_a=? AND user_b=?').bind(a,z).first();return json({conversationId:c.id,target});
}
async function listConversations(request,env){
  const db=requireDb(env),u=await requireUser(request,env);
  const r=await db.prepare(`SELECT c.id,c.updated_at,other.id other_user_id,other.username,p.avatar_key,CASE WHEN p.last_seen_at>=datetime('now','-7 minutes') THEN 1 ELSE 0 END is_online,
      (SELECT body FROM direct_messages dm WHERE dm.conversation_id=c.id AND dm.deleted_at IS NULL ORDER BY dm.id DESC LIMIT 1) last_message,
      (SELECT created_at FROM direct_messages dm WHERE dm.conversation_id=c.id AND dm.deleted_at IS NULL ORDER BY dm.id DESC LIMIT 1) last_message_at,
      (SELECT COUNT(*) FROM direct_messages dm WHERE dm.conversation_id=c.id AND dm.sender_user_id<>? AND dm.read_at IS NULL AND dm.deleted_at IS NULL) unread
    FROM conversations c JOIN users other ON other.id=CASE WHEN c.user_a=? THEN c.user_b ELSE c.user_a END LEFT JOIN profiles p ON p.user_id=other.id
    WHERE c.user_a=? OR c.user_b=? ORDER BY COALESCE(last_message_at,c.updated_at) DESC`).bind(u.id,u.id,u.id,u.id).all();return json({conversations:r.results||[]});
}
async function getConversationMessages(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),id=Number(route.split('/')[1]);
  const c=await db.prepare('SELECT * FROM conversations WHERE id=? AND (user_a=? OR user_b=?)').bind(id,u.id,u.id).first();if(!c)return fail('Unterhaltung nicht gefunden.',404);
  await db.prepare(`UPDATE direct_messages SET read_at=datetime('now') WHERE conversation_id=? AND sender_user_id<>? AND read_at IS NULL`).bind(id,u.id).run();
  const r=await db.prepare(`SELECT dm.id,dm.body,dm.created_at,dm.read_at,dm.sender_user_id,u.username,p.avatar_key FROM direct_messages dm JOIN users u ON u.id=dm.sender_user_id LEFT JOIN profiles p ON p.user_id=u.id WHERE dm.conversation_id=? AND dm.deleted_at IS NULL ORDER BY dm.id ASC LIMIT 300`).bind(id).all();
  const otherId=c.user_a===u.id?c.user_b:c.user_a,other=await db.prepare(`SELECT u.id,u.username,p.avatar_key,CASE WHEN p.last_seen_at>=datetime('now','-7 minutes') THEN 1 ELSE 0 END is_online FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?`).bind(otherId).first();
  return json({conversation:{id,other},messages:r.results||[]});
}
async function sendConversationMessage(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),id=Number(route.split('/')[1]),b=await request.json(),body=cleanText(b.body,3000);
  if(!body)return fail('Nachricht ist leer.');const c=await db.prepare('SELECT id FROM conversations WHERE id=? AND (user_a=? OR user_b=?)').bind(id,u.id,u.id).first();if(!c)return fail('Unterhaltung nicht gefunden.',404);
  const r=await db.prepare('INSERT INTO direct_messages(conversation_id,sender_user_id,body) VALUES(?,?,?)').bind(id,u.id,body).run();await db.prepare(`UPDATE conversations SET updated_at=datetime('now') WHERE id=?`).bind(id).run();const full=await db.prepare('SELECT user_a,user_b FROM conversations WHERE id=?').bind(id).first();const targetId=Number(full.user_a)===Number(u.id)?full.user_b:full.user_a;await notifyUser(db,targetId,'MESSAGE',`Neue Nachricht von ${u.username}`,body.slice(0,180),'/nachrichten');return json({ok:true,id:r.meta.last_row_id});
}

function newsSlugFromRoute(route){return decodeURIComponent(route.split('/')[1]||'');}
async function getNewsSocial(route,request,env){
  const db=requireDb(env),viewer=await currentUser(request,env),slug=newsSlugFromRoute(route),n=await db.prepare(`SELECT id FROM news WHERE slug=? AND status='PUBLISHED'`).bind(slug).first();if(!n)return fail('News nicht gefunden.',404);
  const counts=await db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN reaction='LIKE' THEN 1 ELSE 0 END) likes,SUM(CASE WHEN reaction='FIRE' THEN 1 ELSE 0 END) fires,SUM(CASE WHEN reaction='CLAP' THEN 1 ELSE 0 END) claps,SUM(CASE WHEN reaction='GOAL' THEN 1 ELSE 0 END) goals FROM news_reactions WHERE news_id=?`).bind(n.id).first();
  let mine=null;if(viewer)mine=(await db.prepare('SELECT reaction FROM news_reactions WHERE news_id=? AND user_id=?').bind(n.id,viewer.id).first())?.reaction||null;
  return json({counts:counts||{},myReaction:mine});
}
async function newsReaction(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),slug=newsSlugFromRoute(route),b=await request.json(),reaction=cleanText(b.reaction,10).toUpperCase();if(!['LIKE','FIRE','CLAP','GOAL'].includes(reaction))return fail('Ungültige Reaktion.');
  const n=await db.prepare(`SELECT id FROM news WHERE slug=? AND status='PUBLISHED'`).bind(slug).first();if(!n)return fail('News nicht gefunden.',404);const old=await db.prepare('SELECT reaction FROM news_reactions WHERE news_id=? AND user_id=?').bind(n.id,u.id).first();
  if(old?.reaction===reaction)await db.prepare('DELETE FROM news_reactions WHERE news_id=? AND user_id=?').bind(n.id,u.id).run();else await db.prepare(`INSERT INTO news_reactions(news_id,user_id,reaction) VALUES(?,?,?) ON CONFLICT(news_id,user_id) DO UPDATE SET reaction=excluded.reaction,created_at=datetime('now')`).bind(n.id,u.id,reaction).run();return getNewsSocial(route.replace('/reaction','/social'),request,env);
}
async function getNewsComments(route,request,env){
  const db=requireDb(env),viewer=await currentUser(request,env),slug=newsSlugFromRoute(route),n=await db.prepare(`SELECT id FROM news WHERE slug=? AND status='PUBLISHED'`).bind(slug).first();if(!n)return fail('News nicht gefunden.',404);
  const r=await db.prepare(`SELECT c.id,c.body,c.parent_comment_id,c.created_at,u.username,p.avatar_key,CASE WHEN p.last_seen_at>=datetime('now','-7 minutes') THEN 1 ELSE 0 END is_online,(SELECT COUNT(*) FROM news_comment_likes l WHERE l.comment_id=c.id) likes,${viewer?'EXISTS(SELECT 1 FROM news_comment_likes l2 WHERE l2.comment_id=c.id AND l2.user_id=?)':'0'} liked FROM news_comments c JOIN users u ON u.id=c.user_id LEFT JOIN profiles p ON p.user_id=u.id WHERE c.news_id=? ORDER BY c.created_at ASC`).bind(...(viewer?[viewer.id,n.id]:[n.id])).all();return json({comments:r.results||[]});
}
async function createNewsComment(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),slug=newsSlugFromRoute(route),b=await request.json(),body=cleanText(b.body,1500),parentId=b.parentId?Number(b.parentId):null;if(!body)return fail('Kommentar ist leer.');const n=await db.prepare(`SELECT id FROM news WHERE slug=? AND status='PUBLISHED'`).bind(slug).first();if(!n)return fail('News nicht gefunden.',404);
  let parent=null;if(parentId){parent=await db.prepare('SELECT id,user_id FROM news_comments WHERE id=? AND news_id=?').bind(parentId,n.id).first();if(!parent)return fail('Antwort-Kommentar nicht gefunden.',404);}const r=await db.prepare('INSERT INTO news_comments(news_id,user_id,body,parent_comment_id) VALUES(?,?,?,?)').bind(n.id,u.id,body,parentId).run();const href=`/news/${encodeURIComponent(slug)}`;await notifyMentions(db,body,u.id,{actorLabel:u.username,href,type:'NEWS_MENTION'});if(parent?.user_id&&Number(parent.user_id)!==Number(u.id))await notifyUser(db,parent.user_id,'NEWS_REPLY',`${u.username} hat auf deinen News-Kommentar geantwortet`,body.slice(0,180),href);return json({ok:true,id:r.meta.last_row_id});
}
async function newsCommentLike(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),id=Number(route.split('/')[1]),c=await db.prepare('SELECT id FROM news_comments WHERE id=?').bind(id).first();if(!c)return fail('Kommentar nicht gefunden.',404);const x=await db.prepare('SELECT 1 FROM news_comment_likes WHERE comment_id=? AND user_id=?').bind(id,u.id).first();if(x)await db.prepare('DELETE FROM news_comment_likes WHERE comment_id=? AND user_id=?').bind(id,u.id).run();else await db.prepare('INSERT INTO news_comment_likes(comment_id,user_id) VALUES(?,?)').bind(id,u.id).run();const n=await db.prepare('SELECT COUNT(*) count FROM news_comment_likes WHERE comment_id=?').bind(id).first();return json({liked:!x,count:n.count||0});
}

async function follow(request,env){
  const db=requireDb(env),u=await requireUser(request,env),body=await request.json(),type=body.type,slug=cleanText(body.slug,60);
  if(type==='player'){
    const target=await db.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE').bind(slug).first() || await db.prepare('SELECT id FROM users WHERE lower(username)=?').bind(slug.toLowerCase()).first();
    if(!target)return fail('Spieler nicht gefunden.',404);if(target.id===u.id)return fail('Du kannst dir nicht selbst folgen.');
    const existing=await db.prepare('SELECT 1 FROM follows WHERE follower_user_id=? AND followed_user_id=?').bind(u.id,target.id).first();
    if(existing)await db.prepare('DELETE FROM follows WHERE follower_user_id=? AND followed_user_id=?').bind(u.id,target.id).run();else{await db.prepare('INSERT INTO follows(follower_user_id,followed_user_id) VALUES(?,?)').bind(u.id,target.id).run();await notifyUser(db,target.id,'NEW_FOLLOWER',`${u.username} folgt dir jetzt`,'Du hast einen neuen Follower in der EPL Community.',`/spieler/${slug.toLowerCase()}`);}
    return json({following:!existing});
  }
  if(type==='club'){
    const club=await db.prepare('SELECT id,name,manager_user_id FROM clubs WHERE slug=?').bind(slug).first();if(!club)return fail('Club nicht gefunden.',404);
    const existing=await db.prepare('SELECT 1 FROM club_follows WHERE user_id=? AND club_id=?').bind(u.id,club.id).first();
    if(existing){await db.batch([db.prepare('DELETE FROM club_follows WHERE user_id=? AND club_id=?').bind(u.id,club.id),db.prepare('UPDATE clubs SET followers_count=MAX(0,followers_count-1) WHERE id=?').bind(club.id)]);}else{await db.batch([db.prepare('INSERT INTO club_follows(user_id,club_id) VALUES(?,?)').bind(u.id,club.id),db.prepare('UPDATE clubs SET followers_count=followers_count+1 WHERE id=?').bind(club.id)]);if(club.manager_user_id&&Number(club.manager_user_id)!==Number(u.id))await notifyUser(db,club.manager_user_id,'CLUB_FOLLOW',`${u.username} folgt ${club.name}`,'Dein Club hat einen neuen Follower erhalten.',`/club/${slug}`);}return json({following:!existing});
  }
  return fail('Ungültiger Follow-Typ.');
}

async function createClub(request,env){
  await requireUser(request,env);
  return fail('Clubs können nur von EPL-Admins angelegt werden. Ein Admin weist dir einen Club als Vereinsmanager zu.',403);
}
async function createApplication(request,env){const db=requireDb(env),u=await requireUser(request,env),b=await request.json();const club=await db.prepare('SELECT id FROM clubs WHERE slug=?').bind(cleanText(b.clubSlug,60)).first();if(!club)return fail('Club nicht gefunden.',404);const existing=await db.prepare(`SELECT 1 FROM applications WHERE user_id=? AND club_id=? AND status='OPEN'`).bind(u.id,club.id).first();if(existing)return fail('Du hast bereits eine offene Bewerbung.',409);const r=await db.prepare('INSERT INTO applications(user_id,club_id,message) VALUES(?,?,?)').bind(u.id,club.id,cleanText(b.message,1000)).run();return json({id:r.meta.last_row_id,status:'OPEN'},201)}
async function finalizeContractTransfer(db,ct,playerId){
  const targetClub=await db.prepare(`SELECT id,name,slug FROM clubs WHERE id=?`).bind(ct.club_id).first();if(!targetClub)throw httpError('Zielclub nicht gefunden.',404);
  const current=await db.prepare(`SELECT cm.id,cm.club_id,c.name club_name,c.slug club_slug FROM club_members cm JOIN clubs c ON c.id=cm.club_id WHERE cm.user_id=? AND cm.left_at IS NULL LIMIT 1`).bind(playerId).first();
  if(current&&Number(current.club_id)===Number(ct.club_id))throw httpError('Spieler ist bereits Mitglied dieses Clubs.',409);
  const roster=await activeRosterCount(db,ct.club_id),ctx=await seasonContextForClub(db,ct.club_id),limit=Number(ctx?.limits?.roster_limit||25);if(roster>=limit)throw httpError(`Der Kader ist voll (${roster}/${limit}).`,409);
  if(ctx?.season?.status==='ACTIVE')await consumeTransferAllowance(db,ct.club_id,ctx);
  const stmts=[];
  if(current){stmts.push(db.prepare(`UPDATE club_members SET left_at=datetime('now') WHERE id=?`).bind(current.id));stmts.push(db.prepare(`DELETE FROM club_staff_permissions WHERE club_id=? AND user_id=?`).bind(current.club_id,playerId));}
  stmts.push(db.prepare(`UPDATE contracts SET status='ACTIVE',starts_at=COALESCE(starts_at,date('now')),responded_at=datetime('now') WHERE id=?`).bind(ct.id));
  stmts.push(db.prepare(`INSERT INTO club_members(club_id,user_id,role,joined_at,squad_status) VALUES(?,?,'PLAYER',datetime('now'),'SQUAD')`).bind(ct.club_id,playerId));
  stmts.push(db.prepare(`UPDATE profiles SET free_agent=0,updated_at=datetime('now') WHERE user_id=?`).bind(playerId));
  stmts.push(db.prepare(`INSERT INTO transfers(user_id,from_club_id,to_club_id,contract_id,type,occurred_at) VALUES(?,?,?,?,?,datetime('now'))`).bind(playerId,current?.club_id||null,ct.club_id,ct.id,current?'TRANSFER':'SIGNING'));
  await db.batch(stmts);return {targetClub,current,ctx};
}
async function createContract(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json();const club=await db.prepare('SELECT id,manager_user_id,name,slug FROM clubs WHERE slug=?').bind(cleanText(b.clubSlug||u.managed_club_slug,60)).first();if(!club)return fail('Club nicht gefunden.',404);if(!(await canClubPermission(db,u,club.id,'manage_roster')))return fail('Du verwaltest diesen Club nicht.',403);
  const player=await db.prepare(`SELECT u.id,u.username,p.free_agent,(SELECT club_id FROM club_members WHERE user_id=u.id AND left_at IS NULL LIMIT 1) active_club FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.username=? COLLATE NOCASE AND u.status='ACTIVE'`).bind(cleanText(b.username,24)).first();if(!player)return fail('Spieler nicht gefunden.',404);if(Number(player.active_club)===Number(club.id))return fail('Dieser Spieler ist bereits Mitglied deines Clubs.',409);
  const ctx=await seasonContextForClub(db,club.id);if(!ctx)return fail('Der Club ist aktuell keiner Saison zugeordnet.',409);const roster=await activeRosterCount(db,club.id),limit=Number(ctx.limits?.roster_limit||25);if(roster>=limit)return fail(`Der Kader ist voll (${roster}/${limit}).`,409);
  const sourceClubId=asId(player.active_club),preseason=ctx.season.status!=='ACTIVE',windowOpen=!!ctx.window;
  if(!sourceClubId&&!preseason&&!windowOpen)return fail('Das Transferfenster ist geschlossen. Free Agents können während einer aktiven Saison nur in einem geöffneten Transferfenster verpflichtet werden.',409);
  const releaseRequired=sourceClubId&&!windowOpen?1:0;
  const pending=await db.prepare(`SELECT id FROM contracts WHERE club_id=? AND user_id=? AND status='OFFERED'`).bind(club.id,player.id).first();if(pending)return fail('Dieser Spieler hat bereits ein offenes Angebot von deinem Club.',409);
  const r=await db.prepare(`INSERT INTO contracts(club_id,user_id,offered_by,starts_at,ends_at,message,transfer_credit_reserved,source_club_id,season_id,transfer_window_id,release_required) VALUES(?,?,?,?,?,?,0,?,?,?,?)`).bind(club.id,player.id,u.id,b.startsAt||null,b.endsAt||null,cleanText(b.message,800),sourceClubId,ctx.season.id,ctx.window?.id||null,releaseRequired).run();
  const extra=releaseRequired?' Für den Wechsel außerhalb des Transferfensters ist zusätzlich die Freigabe des bisherigen Clubs erforderlich.':'';await notifyUser(db,player.id,'CONTRACT_OFFER',`${club.name} bietet dir einen Vertrag an`,`${cleanText(b.message,260)||'Du hast ein neues Vertragsangebot erhalten.'}${extra}`,'/benachrichtigungen');return json({id:r.meta.last_row_id,status:'OFFERED',releaseRequired:!!releaseRequired,windowOpen,seasonStatus:ctx.season.status},201)
}
async function listMyContracts(request,env){const db=requireDb(env),u=await requireUser(request,env);const r=await db.prepare(`SELECT ct.id,ct.status,ct.message,ct.starts_at,ct.ends_at,ct.created_at,ct.release_required,ct.release_approved_at,ct.player_accepted_at,c.id club_id,c.name club_name,c.slug club_slug,c.logo_key,o.username offered_by_name,sc.name source_club_name FROM contracts ct JOIN clubs c ON c.id=ct.club_id LEFT JOIN clubs sc ON sc.id=ct.source_club_id LEFT JOIN users o ON o.id=ct.offered_by WHERE ct.user_id=? ORDER BY CASE ct.status WHEN 'OFFERED' THEN 0 ELSE 1 END,ct.created_at DESC LIMIT 50`).bind(u.id).all();return json({contracts:r.results||[]});}
async function respondContract(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),id=Number(route.split('/')[1]),b=await request.json(),action=String(b.action||'').toUpperCase();if(!['ACCEPT','REJECT'].includes(action))return fail('Ungültige Vertragsaktion.');const ct=await db.prepare(`SELECT ct.*,c.name club_name,c.slug club_slug,c.manager_user_id FROM contracts ct JOIN clubs c ON c.id=ct.club_id WHERE ct.id=? AND ct.user_id=?`).bind(id,u.id).first();if(!ct)return fail('Vertragsangebot nicht gefunden.',404);if(ct.status!=='OFFERED')return fail('Dieses Angebot wurde bereits beantwortet.',409);
  if(action==='REJECT'){await db.prepare(`UPDATE contracts SET status='REJECTED',responded_at=datetime('now') WHERE id=?`).bind(id).run();await notifyUser(db,ct.offered_by,'CONTRACT_REJECTED',`${u.username} hat das Vertragsangebot abgelehnt`,ct.club_name,`/club/${ct.club_slug}`);return json({ok:true,status:'REJECTED'});}
  const current=await db.prepare(`SELECT club_id FROM club_members WHERE user_id=? AND left_at IS NULL LIMIT 1`).bind(u.id).first();if(current&&ct.source_club_id&&Number(current.club_id)!==Number(ct.source_club_id))return fail('Deine Clubzugehörigkeit hat sich seit dem Angebot geändert.',409);if(!current&&ct.source_club_id)return fail('Deine ursprüngliche Clubzugehörigkeit besteht nicht mehr. Bitte lass dir ein neues Angebot senden.',409);
  await db.prepare(`UPDATE contracts SET player_accepted_at=datetime('now'),responded_at=datetime('now') WHERE id=?`).bind(id).run();
  if(Number(ct.release_required)&&!ct.release_approved_at){const old=await db.prepare(`SELECT c.name,c.manager_user_id FROM clubs c WHERE c.id=?`).bind(ct.source_club_id).first();if(old?.manager_user_id)await notifyUser(db,old.manager_user_id,'TRANSFER_RELEASE_REQUEST',`${u.username} bittet um Transferfreigabe`,`${u.username} hat ein Angebot von ${ct.club_name} angenommen. Bitte Freigabe im VM Panel prüfen.`,'/manager');await notifyUser(db,ct.offered_by,'TRANSFER_WAITING_RELEASE',`${u.username} hat angenommen – Freigabe ausstehend`,`Für den Wechsel wird noch die Freigabe von ${old?.name||'dem bisherigen Club'} benötigt.`,'/manager');return json({ok:true,status:'PENDING_RELEASE',releaseRequired:true});}
  const fresh={...ct,id};await finalizeContractTransfer(db,fresh,u.id);await notifyUser(db,ct.offered_by,'CONTRACT_ACCEPTED',`${u.username} hat den Vertrag angenommen`,`${u.username} ist jetzt Spieler von ${ct.club_name}.`,`/club/${ct.club_slug}`);await notifyUser(db,u.id,'CONTRACT_ACTIVE',`Willkommen bei ${ct.club_name}`,'Dein Vertrag wurde aktiviert und du bist jetzt Teil des Kaders.',`/club/${ct.club_slug}`);return json({ok:true,status:'ACTIVE',clubSlug:ct.club_slug});
}
async function respondContractRelease(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),id=Number(route.split('/')[1]),b=await request.json(),action=String(b.action||'').toUpperCase();if(!['APPROVE','REJECT'].includes(action))return fail('Ungültige Freigabe-Aktion.');const ct=await db.prepare(`SELECT ct.*,nu.username player_name,nc.name new_club_name,nc.slug new_club_slug FROM contracts ct JOIN users nu ON nu.id=ct.user_id JOIN clubs nc ON nc.id=ct.club_id WHERE ct.id=?`).bind(id).first();if(!ct||ct.status!=='OFFERED'||!Number(ct.release_required)||!ct.source_club_id)return fail('Keine offene Transferfreigabe gefunden.',404);if(!(await canClubPermission(db,u,ct.source_club_id,'manage_roster')))return fail('Du darfst diese Freigabe nicht entscheiden.',403);
  if(action==='REJECT'){await db.prepare(`UPDATE contracts SET status='REJECTED',responded_at=datetime('now') WHERE id=?`).bind(id).run();await notifyUser(db,ct.user_id,'TRANSFER_RELEASE_REJECTED','Transferfreigabe wurde abgelehnt',`Dein bisheriger Club hat die Freigabe für den Wechsel zu ${ct.new_club_name} abgelehnt.`,'/benachrichtigungen');await notifyUser(db,ct.offered_by,'TRANSFER_RELEASE_REJECTED',`${ct.player_name}: Freigabe abgelehnt`,`${ct.player_name} kann derzeit nicht zu ${ct.new_club_name} wechseln.`,'/manager');return json({ok:true,status:'REJECTED'});}
  await db.prepare(`UPDATE contracts SET release_approved_by=?,release_approved_at=datetime('now') WHERE id=?`).bind(u.id,id).run();if(!ct.player_accepted_at){await notifyUser(db,ct.user_id,'TRANSFER_RELEASE_APPROVED','Transferfreigabe erteilt',`Dein bisheriger Club hat die Freigabe für ${ct.new_club_name} erteilt. Du musst das Angebot noch annehmen.`,'/benachrichtigungen');return json({ok:true,status:'WAITING_PLAYER'});}
  await finalizeContractTransfer(db,{...ct,release_approved_at:new Date().toISOString()},ct.user_id);await notifyUser(db,ct.user_id,'CONTRACT_ACTIVE',`Wechsel zu ${ct.new_club_name} bestätigt`,'Freigabe und Vertragsannahme liegen vor. Du wurdest dem neuen Kader zugeordnet.',`/club/${ct.new_club_slug}`);await notifyUser(db,ct.offered_by,'CONTRACT_ACCEPTED',`${ct.player_name} wechselt zu ${ct.new_club_name}`,'Die Freigabe des bisherigen Clubs wurde erteilt.',`/club/${ct.new_club_slug}`);return json({ok:true,status:'ACTIVE',clubSlug:ct.new_club_slug});
}

async function purchaseItem(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),itemId=Number(b.itemId);
  const item=await db.prepare('SELECT id,name,category,price_coins,shop_group,item_type FROM shop_items WHERE id=? AND active=1').bind(itemId).first();if(!item)return fail('Shop-Item nicht gefunden.',404);
  if(item.shop_group==='TEAM'){
    const club=await db.prepare(`SELECT DISTINCT c.id,c.name FROM clubs c LEFT JOIN club_members cm ON cm.club_id=c.id WHERE c.manager_user_id=? OR (cm.user_id=? AND cm.left_at IS NULL AND cm.role IN ('MANAGER','CO_MANAGER')) LIMIT 1`).bind(u.id,u.id).first();if(!club)return fail('Dieses Angebot ist nur für Vereinsmanager sichtbar.',403);
    await db.prepare(`INSERT OR IGNORE INTO club_shop_entitlements(club_id) VALUES(?)`).bind(club.id).run();const wallet=await db.prepare('SELECT balance FROM club_coin_wallets WHERE club_id=?').bind(club.id).first();if(!wallet||Number(wallet.balance)<Number(item.price_coins))return fail('Nicht genügend EPL Coins in der Clubkasse.',409);
    const col={TEAM_RELEASE_5:'release_credits',TEAM_TRANSFER_5:'transfer_credits',TEAM_RED_CARD_REMOVE:'red_card_removal_credits'}[item.item_type],amount={TEAM_RELEASE_5:5,TEAM_TRANSFER_5:5,TEAM_RED_CARD_REMOVE:1}[item.item_type]||0;if(!col||!amount)return fail('Unbekanntes Team-Shop-Item.',409);
    const ref=`TEAMSHOP:${item.id}:${Date.now()}:${u.id}`;await db.batch([db.prepare(`UPDATE club_coin_wallets SET balance=balance-?,lifetime_spent=lifetime_spent+?,updated_at=datetime('now') WHERE club_id=?`).bind(item.price_coins,item.price_coins,club.id),db.prepare(`UPDATE club_shop_entitlements SET ${col}=${col}+?,updated_at=datetime('now') WHERE club_id=?`).bind(amount,club.id),db.prepare(`INSERT INTO club_coin_transactions(club_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'ADMIN_ADJUSTMENT','TEAM_SHOP',?,?)`).bind(club.id,-item.price_coins,ref,`${item.name} – gekauft von ${u.username}`)]);const ent=await db.prepare(`SELECT transfer_credits,release_credits,red_card_removal_credits FROM club_shop_entitlements WHERE club_id=?`).bind(club.id).first();return json({ok:true,walletType:'CLUB',balance:Number(wallet.balance)-Number(item.price_coins),clubId:club.id,clubName:club.name,teamEntitlements:ent});
  }
  const wallet=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(u.id).first();if(!wallet||wallet.balance<item.price_coins)return fail('Nicht genügend EPL Coins.',409);const owned=await db.prepare('SELECT 1 FROM user_inventory WHERE user_id=? AND item_id=?').bind(u.id,itemId).first();if(owned)return fail('Item bereits im Besitz.',409);
  if(item.item_type==='PROFILE_VERIFIED'){const profile=await db.prepare(`SELECT verified,shop_verified FROM profiles WHERE user_id=?`).bind(u.id).first();if(Number(profile?.verified)||Number(profile?.shop_verified))return fail('Dein Profil ist bereits verifiziert.',409);}if(item.item_type==='PROFILE_SPOTLIGHT'){const profile=await db.prepare(`SELECT shop_spotlight FROM profiles WHERE user_id=?`).bind(u.id).first();if(Number(profile?.shop_spotlight))return fail('Profile Spotlight ist bereits aktiv.',409);}
  const stmts=[db.prepare(`UPDATE coin_wallets SET balance=balance-?,lifetime_spent=lifetime_spent+?,updated_at=datetime('now') WHERE user_id=?`).bind(item.price_coins,item.price_coins,u.id),db.prepare('INSERT OR IGNORE INTO user_inventory(user_id,item_id) VALUES(?,?)').bind(u.id,itemId),db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'SHOP_PURCHASE','SHOP_ITEM',?,?)`).bind(u.id,-item.price_coins,String(itemId),item.name)];if(item.item_type==='PROFILE_VERIFIED')stmts.push(db.prepare(`UPDATE profiles SET shop_verified=1,updated_at=datetime('now') WHERE user_id=?`).bind(u.id));if(item.item_type==='PROFILE_SPOTLIGHT')stmts.push(db.prepare(`UPDATE profiles SET shop_spotlight=1,updated_at=datetime('now') WHERE user_id=?`).bind(u.id));if(item.category==='BUNDLE'&&item.shop_group!=='TEAM'){const parts=await db.prepare('SELECT item_id FROM shop_bundle_items WHERE bundle_item_id=?').bind(itemId).all();for(const part of parts.results||[])stmts.push(db.prepare('INSERT OR IGNORE INTO user_inventory(user_id,item_id) VALUES(?,?)').bind(u.id,part.item_id));}await db.batch(stmts);const member=await db.prepare(`SELECT club_id FROM club_members WHERE user_id=? AND left_at IS NULL LIMIT 1`).bind(u.id).first();if(member)await addClubReputation(db,member.club_id,5,'SHOP_PURCHASE','ITEM',`${u.id}:${itemId}`,'Shop-Kauf eines Clubmitglieds +5 Reputation');return json({ok:true,walletType:'PLAYER',balance:wallet.balance-item.price_coins});
}
async function getWallet(request,env){const db=requireDb(env),u=await requireUser(request,env);const wallet=await db.prepare('SELECT * FROM coin_wallets WHERE user_id=?').bind(u.id).first();const tx=await db.prepare('SELECT amount,type,description,created_at FROM coin_transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(u.id).all();const gifts=await db.prepare(`SELECT cg.amount,cg.created_at,cg.sender_user_id,cg.recipient_user_id,su.username sender_name,ru.username recipient_name,sc.name sender_club,rc.name recipient_club FROM coin_gifts cg LEFT JOIN users su ON su.id=cg.sender_user_id LEFT JOIN users ru ON ru.id=cg.recipient_user_id LEFT JOIN clubs sc ON sc.id=cg.sender_club_id LEFT JOIN clubs rc ON rc.id=cg.recipient_club_id WHERE cg.sender_user_id=? OR cg.recipient_user_id=? ORDER BY cg.created_at DESC LIMIT 30`).bind(u.id,u.id).all();return json({wallet,transactions:tx.results||[],gifts:gifts.results||[]})}

async function createCheckout(request,env){
  const db=requireDb(env),u=await requireUser(request,env);
  if(String(env.PAYMENTS_ENABLED||'false')!=='true')return fail('Echtgeld-Zahlungen sind noch nicht aktiviert.',503);
  if(!env.STRIPE_SECRET_KEY)return fail('Stripe Secret fehlt.',503);
  const b=await request.json(),site=(env.PUBLIC_SITE_URL||new URL(request.url).origin).replace(/\/$/,'');
  const orderId=crypto.randomUUID(),form=new URLSearchParams();
  form.set('mode','payment');form.set('success_url',`${site}/shop?payment=success&session_id={CHECKOUT_SESSION_ID}`);form.set('cancel_url',`${site}/shop?payment=cancelled`);
  form.set('line_items[0][quantity]','1');form.set('line_items[0][price_data][currency]','eur');
  form.set('metadata[order_id]',orderId);form.set('metadata[user_id]',String(u.id));
  let orderKind='COINS';
  if(b.itemId){
    const item=await db.prepare('SELECT id,name,category,price_eur_cents FROM shop_items WHERE id=? AND active=1').bind(Number(b.itemId)).first();
    if(!item||!item.price_eur_cents)return fail('Dieses Shop-Item ist nicht für Echtgeld freigeschaltet.',409);
    orderKind='SHOP_ITEM';
    form.set('line_items[0][price_data][unit_amount]',String(item.price_eur_cents));
    form.set('line_items[0][price_data][product_data][name]',item.name);
    form.set('metadata[order_kind]',orderKind);form.set('metadata[item_id]',String(item.id));
    const res=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded'},body:form});
    const out=await res.json();if(!res.ok)return fail(out.error?.message||'Stripe Checkout konnte nicht erstellt werden.',502);
    await db.prepare('INSERT INTO shop_orders(id,user_id,item_id,amount_cents,provider_session_id) VALUES(?,?,?,?,?)').bind(orderId,u.id,item.id,item.price_eur_cents,out.id).run();
    return json({url:out.url,orderId});
  }
  const pack=packs[b.packId];if(!pack)return fail('Ungültiges Coin-Paket.');
  form.set('line_items[0][price_data][unit_amount]',String(pack.cents));
  form.set('line_items[0][price_data][product_data][name]',`${pack.coins.toLocaleString('de-DE')} EPL Coins`);
  form.set('metadata[order_kind]',orderKind);form.set('metadata[coins]',String(pack.coins));
  const res=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded'},body:form});
  const out=await res.json();if(!res.ok)return fail(out.error?.message||'Stripe Checkout konnte nicht erstellt werden.',502);
  await db.prepare('INSERT INTO coin_orders(id,user_id,pack_id,coins,amount_cents,provider_session_id) VALUES(?,?,?,?,?,?)').bind(orderId,u.id,b.packId,pack.coins,pack.cents,out.id).run();
  return json({url:out.url,orderId});
}
async function stripeWebhook(request,env){
  const db=requireDb(env);if(!env.STRIPE_WEBHOOK_SECRET)return fail('Stripe webhook secret fehlt.',503);
  const raw=await request.text(),sig=request.headers.get('Stripe-Signature')||'';
  if(!(await verifyStripe(raw,sig,env.STRIPE_WEBHOOK_SECRET)))return fail('Ungültige Stripe Signatur.',400);
  const evt=JSON.parse(raw);if(evt.type!=='checkout.session.completed')return json({received:true});
  const session=evt.data.object;if(session.payment_status!=='paid')return json({received:true});
  const orderId=session.metadata?.order_id,kind=session.metadata?.order_kind||'COINS';if(!orderId)return fail('Order metadata fehlt.',400);
  if(kind==='SHOP_ITEM'){
    const order=await db.prepare(`SELECT so.*,si.name,si.category FROM shop_orders so JOIN shop_items si ON si.id=so.item_id WHERE so.id=?`).bind(orderId).first();
    if(!order)return fail('Shop-Order nicht gefunden.',404);if(order.status==='PAID')return json({received:true,duplicate:true});
    const stmts=[
      db.prepare(`UPDATE shop_orders SET status='PAID',paid_at=datetime('now') WHERE id=? AND status='PENDING'`).bind(orderId),
      db.prepare('INSERT OR IGNORE INTO user_inventory(user_id,item_id) VALUES(?,?)').bind(order.user_id,order.item_id)
    ];
    if(order.category==='BUNDLE'){
      const parts=await db.prepare('SELECT item_id FROM shop_bundle_items WHERE bundle_item_id=?').bind(order.item_id).all();
      for(const part of parts.results||[])stmts.push(db.prepare('INSERT OR IGNORE INTO user_inventory(user_id,item_id) VALUES(?,?)').bind(order.user_id,part.item_id));
    }
    await db.batch(stmts);const member=await db.prepare(`SELECT club_id FROM club_members WHERE user_id=? AND left_at IS NULL LIMIT 1`).bind(order.user_id).first();if(member)await addClubReputation(db,member.club_id,5,'SHOP_PURCHASE','PAID_ITEM',orderId,'Echtgeld-Shop-Kauf eines Clubmitglieds +5 Reputation');return json({received:true});
  }
  const order=await db.prepare('SELECT * FROM coin_orders WHERE id=?').bind(orderId).first();if(!order)return fail('Order nicht gefunden.',404);if(order.status==='PAID')return json({received:true,duplicate:true});
  await db.batch([
    db.prepare(`UPDATE coin_orders SET status='PAID',paid_at=datetime('now') WHERE id=? AND status='PENDING'`).bind(orderId),
    db.prepare('UPDATE coin_wallets SET balance=balance+?,lifetime_earned=lifetime_earned+?,updated_at=datetime(\'now\') WHERE user_id=?').bind(order.coins,order.coins,order.user_id),
    db.prepare(`INSERT OR IGNORE INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'REAL_MONEY_PURCHASE','COIN_ORDER',?,?)`).bind(order.user_id,order.coins,orderId,`${order.coins} EPL Coins gekauft`)
  ]);return json({received:true});
}
async function verifyStripe(payload,header,secret){const parts=Object.fromEntries(header.split(',').map(x=>x.split('=')));const t=parts.t,v1=parts.v1;if(!t||!v1)return false;if(Math.abs(Date.now()/1000-Number(t))>300)return false;const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',key,enc.encode(`${t}.${payload}`));const hex=[...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');if(hex.length!==v1.length)return false;let d=0;for(let i=0;i<hex.length;i++)d|=hex.charCodeAt(i)^v1.charCodeAt(i);return d===0}

async function uploadMedia(request,env){
  const u=await requireUser(request,env),db=requireDb(env);
  const form=await request.formData(),file=form.get('file'),kind=String(form.get('kind')||'avatar'),externalUrl=cleanText(form.get('externalUrl'),1200);
  const allowedKinds=['avatar','cover','club-logo','club-cover','post-media','cms-media','shop-media','shop-animated-media'];
  if(!allowedKinds.includes(kind))return fail('Ungültiger Bildtyp.');
  if(kind==='cms-media')await requireAdminPermission(request,env,'cms');
  if(kind==='shop-media'||kind==='shop-animated-media')await requireAdminPermission(request,env,'shop');
  if(externalUrl&&file instanceof File)return fail('Bitte entweder Datei oder URL verwenden, nicht beides.');
  if(!externalUrl&&!(file instanceof File))return fail('Keine Datei oder Bild-URL übermittelt.');
  if(externalUrl){
    let parsed;try{parsed=new URL(externalUrl)}catch{return fail('Ungültige Bild-URL.');}
    if(parsed.protocol!=='https:')return fail('Externe Bilder müssen eine https:// URL verwenden.');
  }
  if(!externalUrl){
    if(!env.MEDIA)return fail('R2 binding MEDIA fehlt.',503);
    if(kind==='shop-animated-media'){
      if(!['image/gif','image/png','image/webp'].includes(file.type))return fail('Animierte Rahmen müssen GIF, PNG/APNG oder WebP sein.');
      if(file.size>6*1024*1024)return fail('Animierter Rahmen ist zu groß. Maximal 6 MB.');
    }else if(file.type!=='image/webp')return fail('Bilder müssen vor dem Upload als WebP optimiert werden.');
    const maxBytes=kind==='shop-animated-media'?6*1024*1024:(kind==='avatar'||kind==='club-logo')?450*1024:(kind==='post-media'||kind==='cms-media'||kind==='shop-media'?1000*1024:800*1024);
    if(file.size>maxBytes)return fail(`Bild ist zu groß. Maximal ${Math.round(maxBytes/1024)} KB erlaubt.`);
  }
  let key,oldKey=null,oldWasR2=false;
  if(kind==='post-media'||kind==='cms-media'||kind==='shop-media'||kind==='shop-animated-media'){
    if(externalUrl)return json({key:externalUrl,url:externalUrl,external:true,bytes:0});
    const animated=kind==='shop-animated-media',ext=animated?(file.type==='image/gif'?'gif':file.type==='image/webp'?'webp':'png'):'webp',contentType=animated?file.type:'image/webp';
    key=kind==='post-media'?`posts/${u.id}/media-${crypto.randomUUID()}.webp`:kind==='shop-media'?`shop/${u.id}/media-${crypto.randomUUID()}.webp`:kind==='shop-animated-media'?`shop/animated/${u.id}/frame-${crypto.randomUUID()}.${ext}`:`cms/${u.id}/media-${crypto.randomUUID()}.webp`;
    await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType,cacheControl:'public, max-age=31536000, immutable'},customMetadata:{kind,optimized:animated?'preserve-animation':'client-webp-v9'}});
    return json({key,url:`/api/media/${encodeURIComponent(key)}`,contentType,bytes:file.size,animated});
  }
  if(kind==='club-logo'||kind==='club-cover'){
    const clubSlug=cleanText(form.get('clubSlug'),60);
    const club=await db.prepare('SELECT id,manager_user_id,logo_key,cover_key FROM clubs WHERE slug=?').bind(clubSlug).first();
    if(!club)return fail('Club nicht gefunden.',404);
    if(!(await canClubPermission(db,u,club.id,'manage_page')))return fail('Du verwaltest diesen Club nicht.',403);
    oldKey=kind==='club-logo'?club.logo_key:club.cover_key;oldWasR2=!!(oldKey&&!/^https?:\/\//i.test(oldKey)&&!oldKey.startsWith('/'));
    if(externalUrl)key=externalUrl;else{key=`clubs/${club.id}/${kind}-${crypto.randomUUID()}.webp`;await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:'image/webp',cacheControl:'public, max-age=31536000, immutable'},customMetadata:{kind,optimized:'client-webp-v9'}});}
    const col=kind==='club-logo'?'logo_key':'cover_key';await db.prepare(`UPDATE clubs SET ${col}=?,updated_at=datetime('now') WHERE id=?`).bind(key,club.id).run();
  }else{
    const profile=await db.prepare('SELECT avatar_key,cover_key FROM profiles WHERE user_id=?').bind(u.id).first();if(!profile)return fail('Profil nicht gefunden.',404);
    const wallet=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(u.id).first();if(Number(wallet?.balance||0)<10)return fail('Für eine Änderung von Profil- oder Titelbild brauchst du 10 EPL Coins.',409);
    oldKey=kind==='avatar'?profile.avatar_key:profile.cover_key;oldWasR2=!!(oldKey&&!/^https?:\/\//i.test(oldKey)&&!oldKey.startsWith('/'));
    if(externalUrl)key=externalUrl;else{key=`profiles/${u.id}/${kind}-${crypto.randomUUID()}.webp`;await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:'image/webp',cacheControl:'public, max-age=31536000, immutable'},customMetadata:{kind,optimized:'client-webp-v9'}});}
    const col=kind==='avatar'?'avatar_key':'cover_key',ref=crypto.randomUUID(),label=kind==='avatar'?'Profilbild geändert':'Titelbild geändert';
    await db.batch([
      db.prepare(`UPDATE profiles SET ${col}=?,updated_at=datetime('now') WHERE user_id=?`).bind(key,u.id),
      db.prepare(`UPDATE coin_wallets SET balance=balance-10,lifetime_spent=lifetime_spent+10,updated_at=datetime('now') WHERE user_id=?`).bind(u.id),
      db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,-10,'SHOP_PURCHASE','PROFILE_MEDIA_CHANGE',?,?)`).bind(u.id,ref,label),
      db.prepare(`INSERT INTO profile_media_changes(user_id,kind,source,old_value,new_value,cost_coins) VALUES(?,?,?,?,?,10)`).bind(u.id,kind,externalUrl?'URL':'UPLOAD',oldKey||null,key)
    ]);
  }
  if(oldWasR2&&oldKey&&oldKey!==key&&env.MEDIA){try{await env.MEDIA.delete(oldKey)}catch(err){console.warn('Altes R2 Bild konnte nicht gelöscht werden',oldKey,err)}}
  const balance=(kind==='avatar'||kind==='cover')?(await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(u.id).first())?.balance:null;
  return json({key,url:externalUrl?externalUrl:`/api/media/${encodeURIComponent(key)}`,external:!!externalUrl,contentType:externalUrl?null:'image/webp',bytes:externalUrl?0:file.size,balance});
}

async function getMedia(key,env){if(!env.MEDIA)return new Response('Not found',{status:404});key=decodeURIComponent(key);const obj=await env.MEDIA.get(key);if(!obj)return new Response('Not found',{status:404});const h=new Headers();obj.writeHttpMetadata(h);h.set('etag',obj.httpEtag);h.set('cache-control',h.get('cache-control')||'public, max-age=3600');return new Response(obj.body,{headers:h})}


async function postReaction(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),postId=Number(route.split('/')[1]),b=await request.json(),reaction=cleanText(b.reaction,10).toUpperCase(),asClubSlug=cleanText(b.asClubSlug,60);
  if(!['LIKE','FIRE','CLAP','GOAL'].includes(reaction))return fail('Ungültige Reaktion.');
  const post=await db.prepare('SELECT id FROM posts WHERE id=?').bind(postId).first();if(!post)return fail('Beitrag nicht gefunden.',404);
  let mine=null;
  if(asClubSlug){
    const club=await db.prepare('SELECT id FROM clubs WHERE slug=?').bind(asClubSlug).first();if(!club)return fail('Club nicht gefunden.',404);
    if(!(await canClubPermission(db,u,club.id,'manage_page')))return fail('Du darfst nicht als dieser Club reagieren.',403);
    const existing=await db.prepare('SELECT reaction FROM club_post_reactions WHERE post_id=? AND club_id=?').bind(postId,club.id).first();
    if(existing?.reaction===reaction)await db.prepare('DELETE FROM club_post_reactions WHERE post_id=? AND club_id=?').bind(postId,club.id).run();
    else await db.prepare(`INSERT INTO club_post_reactions(post_id,club_id,user_id,reaction) VALUES(?,?,?,?) ON CONFLICT(post_id,club_id) DO UPDATE SET user_id=excluded.user_id,reaction=excluded.reaction,created_at=datetime('now')`).bind(postId,club.id,u.id,reaction).run();
    const row=await db.prepare('SELECT reaction FROM club_post_reactions WHERE post_id=? AND club_id=?').bind(postId,club.id).first();mine=row?.reaction||null;
  }else{
    const existing=await db.prepare('SELECT reaction FROM post_reactions WHERE post_id=? AND user_id=?').bind(postId,u.id).first();
    if(existing?.reaction===reaction)await db.prepare('DELETE FROM post_reactions WHERE post_id=? AND user_id=?').bind(postId,u.id).run();
    else await db.prepare(`INSERT INTO post_reactions(post_id,user_id,reaction) VALUES(?,?,?) ON CONFLICT(post_id,user_id) DO UPDATE SET reaction=excluded.reaction,created_at=datetime('now')`).bind(postId,u.id,reaction).run();
    const row=await db.prepare('SELECT reaction FROM post_reactions WHERE post_id=? AND user_id=?').bind(postId,u.id).first();mine=row?.reaction||null;
  }
  const counts=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM post_reactions WHERE post_id=?)+(SELECT COUNT(*) FROM club_post_reactions WHERE post_id=?) total,
    (SELECT COUNT(*) FROM post_reactions WHERE post_id=? AND reaction='LIKE')+(SELECT COUNT(*) FROM club_post_reactions WHERE post_id=? AND reaction='LIKE') likes,
    (SELECT COUNT(*) FROM post_reactions WHERE post_id=? AND reaction='FIRE')+(SELECT COUNT(*) FROM club_post_reactions WHERE post_id=? AND reaction='FIRE') fires,
    (SELECT COUNT(*) FROM post_reactions WHERE post_id=? AND reaction='CLAP')+(SELECT COUNT(*) FROM club_post_reactions WHERE post_id=? AND reaction='CLAP') claps,
    (SELECT COUNT(*) FROM post_reactions WHERE post_id=? AND reaction='GOAL')+(SELECT COUNT(*) FROM club_post_reactions WHERE post_id=? AND reaction='GOAL') goals`).bind(postId,postId,postId,postId,postId,postId,postId,postId,postId,postId).first();
  return json({ok:true,counts:{total:Number(counts?.total||0),likes:Number(counts?.likes||0),fires:Number(counts?.fires||0),claps:Number(counts?.claps||0),goals:Number(counts?.goals||0)},mine,actor:asClubSlug?'club':'player'});
}
async function getPostComments(route,request,env){
  const db=requireDb(env),postId=Number(route.split('/')[1]),viewer=await currentUser(request,env),viewerId=viewer?.id||0;
  const post=await db.prepare('SELECT id FROM posts WHERE id=?').bind(postId).first();if(!post)return fail('Beitrag nicht gefunden.',404);
  const r=await db.prepare(`SELECT c.id,c.parent_comment_id,c.body,c.created_at,c.actor_club_id,
      COALESCE(ac.name,u.username) username,CASE WHEN c.actor_club_id IS NOT NULL THEN ac.logo_key ELSE p.avatar_key END avatar_key,
      CASE WHEN c.actor_club_id IS NULL AND p.last_seen_at>=datetime('now','-7 minutes') THEN 1 ELSE 0 END is_online,
      CASE WHEN c.actor_club_id IS NOT NULL THEN 'club' ELSE 'player' END author_type,
      COALESCE(ac.slug,lower(u.username)) author_slug,
      (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id=c.id) likes,
      EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id=c.id AND cl.user_id=?) liked_by_me
    FROM comments c JOIN users u ON u.id=c.user_id LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN clubs ac ON ac.id=c.actor_club_id
    WHERE c.post_id=? ORDER BY c.created_at ASC LIMIT 200`).bind(viewerId,postId).all();
  return json({comments:r.results||[]});
}
async function createComment(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),postId=Number(route.split('/')[1]),b=await request.json(),body=cleanText(b.body,1000),parentId=b.parentCommentId?Number(b.parentCommentId):null,asClubSlug=cleanText(b.asClubSlug,60);
  if(!body)return fail('Kommentar ist leer.');
  const post=await db.prepare('SELECT id FROM posts WHERE id=?').bind(postId).first();if(!post)return fail('Beitrag nicht gefunden.',404);
  if(parentId){const parent=await db.prepare('SELECT id FROM comments WHERE id=? AND post_id=?').bind(parentId,postId).first();if(!parent)return fail('Antwort-Kommentar nicht gefunden.',404);}
  let actorClubId=null;
  if(asClubSlug){const club=await db.prepare('SELECT id FROM clubs WHERE slug=?').bind(asClubSlug).first();if(!club)return fail('Club nicht gefunden.',404);if(!(await canClubPermission(db,u,club.id,'manage_page')))return fail('Du darfst nicht als dieser Club kommentieren.',403);actorClubId=club.id;}
  const r=await db.prepare('INSERT INTO comments(post_id,user_id,body,parent_comment_id,actor_club_id) VALUES(?,?,?,?,?)').bind(postId,u.id,body,parentId,actorClubId).run();
  const postInfo=await db.prepare(`SELECT p.author_user_id,p.club_id,au.username author_username,c.slug club_slug,c.manager_user_id FROM posts p LEFT JOIN users au ON au.id=p.author_user_id LEFT JOIN clubs c ON c.id=p.club_id WHERE p.id=?`).bind(postId).first();const actorClub=actorClubId?await db.prepare('SELECT name FROM clubs WHERE id=?').bind(actorClubId).first():null,actorLabel=actorClub?.name||u.username,href=postInfo?.club_slug?`/club/${postInfo.club_slug}`:`/spieler/${String(postInfo?.author_username||'').toLowerCase()}`;await notifyMentions(db,body,u.id,{actorLabel,href,type:'COMMENT_MENTION'});let ownerId=postInfo?.author_user_id||postInfo?.manager_user_id;if(ownerId&&Number(ownerId)!==Number(u.id))await notifyUser(db,ownerId,'POST_COMMENT',`${actorLabel} hat deinen Beitrag kommentiert`,body.slice(0,180),href);if(parentId){const parent=await db.prepare('SELECT user_id FROM comments WHERE id=?').bind(parentId).first();if(parent?.user_id&&Number(parent.user_id)!==Number(u.id))await notifyUser(db,parent.user_id,'COMMENT_REPLY',`${actorLabel} hat dir geantwortet`,body.slice(0,180),href);}
  return json({ok:true,id:r.meta.last_row_id},201);
}
async function commentLike(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),commentId=Number(route.split('/')[1]);
  const c=await db.prepare('SELECT id FROM comments WHERE id=?').bind(commentId).first();if(!c)return fail('Kommentar nicht gefunden.',404);
  const existing=await db.prepare('SELECT 1 FROM comment_likes WHERE comment_id=? AND user_id=?').bind(commentId,u.id).first();
  if(existing)await db.prepare('DELETE FROM comment_likes WHERE comment_id=? AND user_id=?').bind(commentId,u.id).run();
  else await db.prepare('INSERT INTO comment_likes(comment_id,user_id) VALUES(?,?)').bind(commentId,u.id).run();
  const count=await db.prepare('SELECT COUNT(*) count FROM comment_likes WHERE comment_id=?').bind(commentId).first();
  return json({liked:!existing,likes:Number(count?.count||0)});
}

async function createPost(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),body=cleanText(b.body,2000);if(!body)return fail('Beitrag ist leer.');
  let clubId=null,actorLabel=u.username,href=`/spieler/${u.username.toLowerCase()}`;
  if(b.clubSlug){const c=await db.prepare('SELECT id,manager_user_id,name,slug FROM clubs WHERE slug=?').bind(cleanText(b.clubSlug,60)).first();if(!c)return fail('Club nicht gefunden.',404);if(!(await canClubPermission(db,u,c.id,'manage_page')))return fail('Du darfst für diesen Club nicht posten.',403);clubId=c.id;actorLabel=c.name;href=`/club/${c.slug}`;}
  const mediaKey=cleanText(b.mediaKey,1200)||null;if(mediaKey&&/^https?:\/\//i.test(mediaKey)&&!/^https:\/\//i.test(mediaKey))return fail('Externe Beitragsbilder müssen https:// verwenden.');
  const r=await db.prepare('INSERT INTO posts(author_user_id,club_id,body,media_key,match_id) VALUES(?,?,?,?,?)').bind(clubId?null:u.id,clubId,body,mediaKey,b.matchId||null).run();
  await notifyMentions(db,body,u.id,{actorLabel,href,type:'POST_MENTION'});return json({id:r.meta.last_row_id},201)
}

async function deleteOwnPost(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),postId=Number(route.split('/')[1]);
  const post=await db.prepare('SELECT id,author_user_id,club_id,media_key FROM posts WHERE id=?').bind(postId).first();if(!post)return fail('Beitrag nicht gefunden.',404);
  const isAdmin=u.role==='SUPER_ADMIN'||(await getAdminRoles(db,u.id)).some(r=>r==='FULL_ADMIN'||r==='USER_ADMIN');
  const ownUser=Number(post.author_user_id)===Number(u.id);const ownClub=post.club_id?await canClubPermission(db,u,post.club_id,'manage_page'):false;
  if(!isAdmin&&!ownUser&&!ownClub)return fail('Du darfst diesen Beitrag nicht löschen.',403);
  await db.prepare('DELETE FROM posts WHERE id=?').bind(postId).run();
  if(post.media_key&&env.MEDIA&&!/^https?:\/\//i.test(post.media_key)){try{await env.MEDIA.delete(post.media_key)}catch{}}
  return json({ok:true});
}
async function deleteOwnComment(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),commentId=Number(route.split('/')[1]);
  const c=await db.prepare('SELECT id,user_id,actor_club_id FROM comments WHERE id=?').bind(commentId).first();if(!c)return fail('Kommentar nicht gefunden.',404);
  const isAdmin=u.role==='SUPER_ADMIN'||(await getAdminRoles(db,u.id)).some(r=>r==='FULL_ADMIN'||r==='USER_ADMIN');
  const ownUser=Number(c.user_id)===Number(u.id);const ownClub=c.actor_club_id?await canClubPermission(db,u,c.actor_club_id,'manage_page'):false;
  if(!isAdmin&&!ownUser&&!ownClub)return fail('Du darfst diesen Kommentar nicht löschen.',403);
  await db.prepare('DELETE FROM comments WHERE id=?').bind(commentId).run();return json({ok:true});
}
async function toggleTargetLike(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),type=String(b.type||'').toLowerCase(),slug=cleanText(b.slug,80);
  if(type!=='club')return fail('Likes auf Spielerprofile wurden deaktiviert. Clubs können weiterhin geliked werden.',410);
  const club=await db.prepare('SELECT id,name,manager_user_id FROM clubs WHERE slug=?').bind(slug).first();if(!club)return fail('Club nicht gefunden.',404);
  const existing=await db.prepare('SELECT 1 FROM club_likes WHERE user_id=? AND club_id=?').bind(u.id,club.id).first();
  if(existing)await db.prepare('DELETE FROM club_likes WHERE user_id=? AND club_id=?').bind(u.id,club.id).run();else await db.prepare('INSERT INTO club_likes(user_id,club_id) VALUES(?,?)').bind(u.id,club.id).run();
  const count=await db.prepare('SELECT COUNT(*) count FROM club_likes WHERE club_id=?').bind(club.id).first();
  if(!existing&&club.manager_user_id&&Number(club.manager_user_id)!==Number(u.id))await notifyUser(db,club.manager_user_id,'CLUB_LIKE',`${u.username} gefällt ${club.name}`,`${u.username} hat eure Clubseite geliked.`,`/club/${slug}`);
  return json({liked:!existing,count:Number(count?.count||0)});
}
async function createReport(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),type=cleanText(b.targetType,20).toUpperCase(),targetId=cleanText(b.targetId,100),reason=cleanText(b.reason,120),details=cleanText(b.details,1200),sourceUrl=cleanText(b.sourceUrl,500);
  const allowed=['POST','COMMENT','USER','CLUB','NEWS','MESSAGE','OTHER'];if(!allowed.includes(type)||!targetId||!reason)return fail('Meldung unvollständig.');
  if(type==='MESSAGE'){
    const m=await db.prepare(`SELECT dm.id,dm.sender_user_id,c.user_a,c.user_b FROM direct_messages dm JOIN conversations c ON c.id=dm.conversation_id WHERE dm.id=? AND dm.deleted_at IS NULL`).bind(Number(targetId)).first();if(!m)return fail('Nachricht nicht gefunden.',404);if(![Number(m.user_a),Number(m.user_b)].includes(Number(u.id)))return fail('Du kannst nur Nachrichten aus deinen eigenen Unterhaltungen melden.',403);if(Number(m.sender_user_id)===Number(u.id))return fail('Eigene Nachrichten müssen nicht gemeldet werden.');
  }
  const dup=await db.prepare(`SELECT id FROM reports WHERE reporter_user_id=? AND target_type=? AND target_id=? AND status IN ('OPEN','REVIEWED') LIMIT 1`).bind(u.id,type,targetId).first();if(dup)return fail('Du hast diesen Inhalt bereits gemeldet.',409);
  const r=await db.prepare(`INSERT INTO reports(reporter_user_id,target_type,target_id,reason,details,source_url) VALUES(?,?,?,?,?,?)`).bind(u.id,type,targetId,reason,details,sourceUrl).run();return json({ok:true,id:r.meta.last_row_id},201);
}
async function adminReports(request,env){const db=requireDb(env);await requireAdminPermission(request,env,'moderation');const rows=await db.prepare(`SELECT r.*,u.username reporter FROM reports r JOIN users u ON u.id=r.reporter_user_id ORDER BY CASE r.status WHEN 'OPEN' THEN 0 WHEN 'REVIEWED' THEN 1 ELSE 2 END,r.created_at DESC LIMIT 300`).all();return json({reports:rows.results||[]});}
async function reportTarget(db,report){
  const id=report.target_id;
  if(report.target_type==='POST')return db.prepare(`SELECT p.id,p.body,p.media_key,p.created_at,COALESCE(c.name,u.username) author FROM posts p LEFT JOIN users u ON u.id=p.author_user_id LEFT JOIN clubs c ON c.id=p.club_id WHERE p.id=?`).bind(Number(id)).first();
  if(report.target_type==='COMMENT')return db.prepare(`SELECT cm.id,cm.body,cm.created_at,COALESCE(c.name,u.username) author,p.body post_body FROM comments cm LEFT JOIN users u ON u.id=cm.user_id LEFT JOIN clubs c ON c.id=cm.actor_club_id JOIN posts p ON p.id=cm.post_id WHERE cm.id=?`).bind(Number(id)).first();
  if(report.target_type==='USER')return db.prepare(`SELECT u.id,u.username,u.status,p.bio,p.avatar_key FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?`).bind(Number(id)).first();
  if(report.target_type==='CLUB')return db.prepare(`SELECT id,name,slug,bio,logo_key FROM clubs WHERE id=?`).bind(Number(id)).first();
  if(report.target_type==='NEWS')return db.prepare(`SELECT n.id,n.title,n.body,n.image_key,n.created_at,u.username author FROM news n LEFT JOIN users u ON u.id=n.author_user_id WHERE n.id=? OR n.slug=?`).bind(Number(id)||0,id).first();
  if(report.target_type==='MESSAGE'){
    const msg=await db.prepare(`SELECT dm.id,dm.conversation_id,dm.body,dm.created_at,u.username author FROM direct_messages dm JOIN users u ON u.id=dm.sender_user_id WHERE dm.id=?`).bind(Number(id)).first();if(!msg)return null;const context=await db.prepare(`SELECT dm.id,dm.body,dm.created_at,u.username author FROM direct_messages dm JOIN users u ON u.id=dm.sender_user_id WHERE dm.conversation_id=? AND dm.id BETWEEN ? AND ? ORDER BY dm.id`).bind(msg.conversation_id,Math.max(1,Number(msg.id)-2),Number(msg.id)+2).all();return {...msg,message_context:context.results||[]};
  }
  return {body:report.details||'',created_at:report.created_at};
}
async function adminReportDetail(route,request,env){const db=requireDb(env);await requireAdminPermission(request,env,'moderation');const id=Number(route.split('/').pop()),report=await db.prepare(`SELECT r.*,u.username reporter FROM reports r JOIN users u ON u.id=r.reporter_user_id WHERE r.id=?`).bind(id).first();if(!report)return fail('Meldung nicht gefunden.',404);return json({report,target:await reportTarget(db,report)});}
async function adminReportResolve(request,env){const db=requireDb(env),admin=await requireAdminPermission(request,env,'moderation'),b=await request.json(),id=asId(b.reportId),status=cleanText(b.status,20).toUpperCase(),decisionReason=cleanText(b.decisionReason,1200),decisionAction=cleanText(b.decisionAction,80);if(!id||!['REVIEWED','RESOLVED','REJECTED'].includes(status))return fail('Ungültige Moderationsentscheidung.');if(['RESOLVED','REJECTED'].includes(status)&&decisionReason.length<3)return fail('Bitte dokumentiere kurz die Begründung der Entscheidung.');const report=await db.prepare('SELECT * FROM reports WHERE id=?').bind(id).first();if(!report)return fail('Meldung nicht gefunden.',404);await db.batch([db.prepare(`UPDATE reports SET status=?,decision_reason=?,decision_action=?,handled_by=?,handled_at=datetime('now') WHERE id=?`).bind(status,decisionReason,decisionAction,admin.id,id),db.prepare(`INSERT INTO moderation_actions(report_id,moderator_user_id,target_type,target_id,action,reason) VALUES(?,?,?,?,?,?)`).bind(id,admin.id,report.target_type,report.target_id,decisionAction||status,decisionReason||status)]);return json({ok:true});}
async function adminContentDelete(request,env){const db=requireDb(env),admin=await requireAdminPermission(request,env,'moderation'),b=await request.json(),type=cleanText(b.targetType,20).toUpperCase(),id=cleanText(b.targetId,100),reason=cleanText(b.reason,500)||'Moderationsentscheidung';if(type==='POST')await db.prepare('DELETE FROM posts WHERE id=?').bind(Number(id)).run();else if(type==='COMMENT')await db.prepare('DELETE FROM comments WHERE id=?').bind(Number(id)).run();else if(type==='NEWS')await db.prepare('DELETE FROM news WHERE id=? OR slug=?').bind(Number(id)||0,id).run();else if(type==='MESSAGE')await db.prepare(`UPDATE direct_messages SET deleted_at=datetime('now'),body='[Nachricht durch Moderation entfernt]' WHERE id=?`).bind(Number(id)).run();else return fail('Dieser Inhaltstyp kann hier nicht gelöscht werden.');await db.prepare(`INSERT INTO moderation_actions(moderator_user_id,target_type,target_id,action,reason) VALUES(?,?,?,'CONTENT_REMOVED',?)`).bind(admin.id,type,id,reason).run();return json({ok:true});}
async function createPrivacyAccessRequest(request,env){const db=requireDb(env),u=await currentUser(request,env);if(!u)throw httpError('Bitte zuerst anmelden.',401);const r=await db.prepare(`INSERT INTO privacy_requests(user_id,request_type,status) VALUES(?,'ACCESS','OPEN')`).bind(u.id).run();return json({ok:true,id:r.meta.last_row_id});}
async function exportAccountData(request,env){
  const db=requireDb(env),u=await currentUser(request,env);if(!u)throw httpError('Bitte zuerst anmelden.',401);const q=async(sql,...bind)=>(await db.prepare(sql).bind(...bind).all()).results||[];
  const data={generatedAt:new Date().toISOString(),account:await db.prepare(`SELECT id,email,username,role,status,birth_date,created_at,updated_at FROM users WHERE id=?`).bind(u.id).first(),profile:await db.prepare(`SELECT * FROM profiles WHERE user_id=?`).bind(u.id).first(),onboarding:await db.prepare(`SELECT user_id,shirt_number,completed,parental_consent_status,guardian_email,updated_at FROM profile_onboarding WHERE user_id=?`).bind(u.id).first(),clubMemberships:await q(`SELECT cm.*,c.name club_name FROM club_members cm JOIN clubs c ON c.id=cm.club_id WHERE cm.user_id=?`,u.id),posts:await q(`SELECT id,body,media_key,created_at FROM posts WHERE author_user_id=?`,u.id),comments:await q(`SELECT id,post_id,body,created_at FROM comments WHERE user_id=?`,u.id),notifications:await q(`SELECT type,title,body,href,read_at,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC`,u.id),coinTransactions:await q(`SELECT amount,type,reference_type,description,created_at FROM coin_transactions WHERE user_id=? ORDER BY created_at DESC`,u.id),messages:await q(`SELECT dm.id,dm.body,dm.created_at,dm.read_at,CASE WHEN dm.sender_user_id=? THEN 'sent' ELSE 'received' END direction FROM direct_messages dm JOIN conversations c ON c.id=dm.conversation_id WHERE (c.user_a=? OR c.user_b=?) AND dm.deleted_at IS NULL ORDER BY dm.created_at`,u.id,u.id,u.id),reports:await q(`SELECT target_type,target_id,reason,details,status,decision_reason,created_at FROM reports WHERE reporter_user_id=? ORDER BY created_at DESC`,u.id)};
  await db.prepare(`UPDATE privacy_requests SET status='COMPLETED',completed_at=datetime('now') WHERE user_id=? AND request_type='ACCESS' AND status='OPEN'`).bind(u.id).run();return json({ok:true,data});
}
async function deleteAccount(request,env){
  const db=requireDb(env),u=await currentUser(request,env);if(!u)throw httpError('Bitte zuerst anmelden.',401);const b=await request.json();if(cleanText(b.confirmUsername,40).toLowerCase()!==String(u.username).toLowerCase())return fail('Bitte bestätige deinen Benutzernamen exakt.');if(!b.confirmDeletion)return fail('Bitte bestätige die endgültige Kontolöschung.');
  const media=(await db.prepare(`SELECT avatar_key k FROM profiles WHERE user_id=? UNION ALL SELECT cover_key k FROM profiles WHERE user_id=? UNION ALL SELECT media_key k FROM posts WHERE author_user_id=?`).bind(u.id,u.id,u.id).all()).results||[];for(const x of media){const k=String(x.k||'');if(k&&env.MEDIA&&!/^https?:\/\//i.test(k)){try{await env.MEDIA.delete(k.replace(/^\/api\/media\//,''))}catch{}}}
  const suffix=randomId(8).replace(/[^A-Za-z0-9]/g,'').slice(0,10),deletedUsername=`DeletedUser${u.id}_${suffix}`.slice(0,24),deletedEmail=`deleted-${u.id}-${suffix}@invalid.local`;
  const statements=[
    db.prepare(`INSERT INTO privacy_requests(user_id,request_type,status,completed_at) VALUES(?,'DELETE','COMPLETED',datetime('now'))`).bind(u.id),
    db.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(u.id),
    db.prepare(`DELETE FROM oauth_accounts WHERE user_id=?`).bind(u.id),
    db.prepare(`DELETE FROM notifications WHERE user_id=?`).bind(u.id),
    db.prepare(`DELETE FROM conversations WHERE user_a=? OR user_b=?`).bind(u.id,u.id),
    db.prepare(`DELETE FROM posts WHERE author_user_id=?`).bind(u.id),
    db.prepare(`DELETE FROM comments WHERE user_id=?`).bind(u.id),
    db.prepare(`DELETE FROM user_inventory WHERE user_id=?`).bind(u.id),
    db.prepare(`DELETE FROM user_admin_roles WHERE user_id=?`).bind(u.id),
    db.prepare(`DELETE FROM parental_consents WHERE user_id=?`).bind(u.id),
    db.prepare(`UPDATE coin_wallets SET balance=0,updated_at=datetime('now') WHERE user_id=?`).bind(u.id),
    db.prepare(`UPDATE profiles SET ea_id='',platform='',console_id='',avatar_key=NULL,cover_key=NULL,discord='',tiktok='',twitch='',country='',bio='',free_agent=0,equipped_avatar_frame_id=NULL,equipped_cover_frame_id=NULL,equipped_name_effect_id=NULL,equipped_name_font_id=NULL,equipped_name_color_id=NULL,equipped_badge_id=NULL,use_totw_frame=0,updated_at=datetime('now') WHERE user_id=?`).bind(u.id),
    db.prepare(`UPDATE profile_onboarding SET completed=0,guardian_email=NULL,parental_consent_status='NOT_REQUIRED',updated_at=datetime('now') WHERE user_id=?`).bind(u.id),
    db.prepare(`UPDATE users SET email=?,username=?,password_hash=?,status='BANNED',birth_date=NULL,legal_terms_accepted_at=NULL,privacy_acknowledged_at=NULL,community_guidelines_accepted_at=NULL,updated_at=datetime('now') WHERE id=?`).bind(deletedEmail,deletedUsername,`deleted$${randomId(24)}`,u.id)
  ];
  await db.batch(statements);return json({ok:true,anonymized:true},200,{'set-cookie':'epl_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'});
}

async function adminCoinAward(request,env){const db=requireDb(env),u=await requireAdminPermission(request,env,'coins'),b=await request.json(),amount=Math.trunc(Number(b.amount));if(!Number.isFinite(amount)||amount===0||Math.abs(amount)>10000)return fail('Ungültiger Coin-Betrag.');const target=await db.prepare('SELECT id,username FROM users WHERE username=? COLLATE NOCASE').bind(cleanText(b.username,24)).first();if(!target)return fail('Spieler nicht gefunden.',404);if(amount<0){const w=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(target.id).first();if(!w||w.balance+amount<0)return fail('Wallet würde negativ werden.',409);}const ref=crypto.randomUUID();await db.batch([db.prepare('UPDATE coin_wallets SET balance=balance+?,lifetime_earned=lifetime_earned+CASE WHEN ?>0 THEN ? ELSE 0 END,lifetime_spent=lifetime_spent+CASE WHEN ?<0 THEN -? ELSE 0 END,updated_at=datetime(\'now\') WHERE user_id=?').bind(amount,amount,amount,amount,amount,target.id),db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'ADMIN_ADJUSTMENT','ADMIN',?,?)`).bind(target.id,amount,ref,cleanText(b.description,200)||`Admin-Anpassung durch ${u.username}`)]);const w2=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(target.id).first();return json({ok:true,balance:w2.balance})}
async function adminAwardsOverview(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'awards'),url=new URL(request.url),userId=asId(url.searchParams.get('userId'));
  const [players,trophies,achievementDefs,recent]=await Promise.all([
    db.prepare(`SELECT u.id,u.username,p.position,p.avatar_key,c.name club_name FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id WHERE u.status!='BANNED' ORDER BY u.username COLLATE NOCASE`).all(),
    db.prepare(`SELECT id,name,icon_key,type,season_id FROM trophies ORDER BY CASE type WHEN 'TROPHY' THEN 0 WHEN 'BADGE' THEN 1 ELSE 2 END,name COLLATE NOCASE`).all(),
    db.prepare(`SELECT id,code,title,description,category,asset_key FROM achievement_definitions WHERE active=1 ORDER BY sort_order,id`).all(),
    db.prepare(`SELECT l.id,l.user_id,u.username,l.award_kind,l.quantity_delta,l.custom_title,l.note,l.created_at,a.username admin_username,t.name trophy_name,ad.title achievement_title FROM admin_award_log l JOIN users u ON u.id=l.user_id JOIN users a ON a.id=l.admin_user_id LEFT JOIN trophies t ON t.id=l.trophy_id LEFT JOIN achievement_definitions ad ON ad.id=l.achievement_id ORDER BY l.id DESC LIMIT 100`).all()
  ]);
  let holdings={trophies:[],achievements:[],custom:[],totwCount:0};
  if(userId){
    const [owned,unlocks,custom,totw]=await Promise.all([
      db.prepare(`SELECT t.id,t.name,t.icon_key,t.type,ut.quantity,ut.awarded_at FROM user_trophies ut JOIN trophies t ON t.id=ut.trophy_id WHERE ut.user_id=? ORDER BY t.type,t.name`).bind(userId).all(),
      db.prepare(`SELECT ad.id,ad.title,ad.asset_key,ad.category,pau.unlocked_at FROM player_achievement_unlocks pau JOIN achievement_definitions ad ON ad.id=pau.achievement_id WHERE pau.user_id=? ORDER BY pau.unlocked_at DESC`).bind(userId).all(),
      db.prepare(`SELECT id,title,subtitle,icon_key,awarded_at FROM player_achievements WHERE user_id=? ORDER BY awarded_at DESC`).bind(userId).all(),
      db.prepare(`SELECT COUNT(*) count FROM totw_selections WHERE user_id=?`).bind(userId).first()
    ]);
    holdings={trophies:owned.results||[],achievements:unlocks.results||[],custom:custom.results||[],totwCount:Number(totw?.count||0)};
  }
  return json({admin:{id:admin.id,username:admin.username,role:admin.role},players:players.results||[],trophies:trophies.results||[],achievementDefinitions:achievementDefs.results||[],holdings,recent:recent.results||[]});
}

async function adminAwardGrant(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'awards'),b=await request.json(),userId=asId(b.userId),kind=cleanText(b.kind,20).toUpperCase(),note=cleanText(b.note,300);
  if(!userId)return fail('Spieler fehlt.');const target=await db.prepare('SELECT id,username FROM users WHERE id=?').bind(userId).first();if(!target)return fail('Spieler nicht gefunden.',404);
  if(kind==='TROPHY'){
    const trophyId=asId(b.trophyId),qty=Math.max(1,Math.min(20,Math.trunc(Number(b.quantity)||1)));if(!trophyId)return fail('Trophäe/Badge fehlt.');const award=await db.prepare('SELECT id,name,type FROM trophies WHERE id=?').bind(trophyId).first();if(!award)return fail('Auszeichnung nicht gefunden.',404);
    await db.batch([
      db.prepare(`INSERT INTO user_trophies(user_id,trophy_id,quantity,awarded_at) VALUES(?,?,?,datetime('now')) ON CONFLICT(user_id,trophy_id) DO UPDATE SET quantity=user_trophies.quantity+excluded.quantity,awarded_at=datetime('now')`).bind(userId,trophyId,qty),
      db.prepare(`INSERT INTO admin_award_log(user_id,award_kind,trophy_id,quantity_delta,note,admin_user_id) VALUES(?,'TROPHY',?,?,?,?)`).bind(userId,trophyId,qty,note,admin.id)
    ]);
    const row=await db.prepare('SELECT quantity FROM user_trophies WHERE user_id=? AND trophy_id=?').bind(userId,trophyId).first();await notifyUser(db,userId,'AWARD',`${award.name} erhalten`,`${qty>1?qty+'× ':''}${award.type==='BADGE'?'Badge':'Trophäe'} wurde dir von einem EPL Full Admin verliehen.${note?' '+note:''}`,'/spieler/'+target.username.toLowerCase());return json({ok:true,quantity:Number(row?.quantity||qty),name:award.name});
  }
  if(kind==='ACHIEVEMENT'){
    const achievementId=asId(b.achievementId);if(!achievementId)return fail('Achievement fehlt.');const a=await db.prepare('SELECT id,title FROM achievement_definitions WHERE id=? AND active=1').bind(achievementId).first();if(!a)return fail('Achievement nicht gefunden.',404);const exists=await db.prepare('SELECT 1 FROM player_achievement_unlocks WHERE user_id=? AND achievement_id=?').bind(userId,achievementId).first();if(exists)return fail('Dieses Achievement ist bereits freigeschaltet.',409);
    await db.batch([db.prepare(`INSERT INTO player_achievement_unlocks(user_id,achievement_id,unlocked_at) VALUES(?,?,datetime('now'))`).bind(userId,achievementId),db.prepare(`INSERT INTO admin_award_log(user_id,award_kind,achievement_id,quantity_delta,note,admin_user_id) VALUES(?,'ACHIEVEMENT',?,1,?,?)`).bind(userId,achievementId,note,admin.id)]);await notifyUser(db,userId,'ACHIEVEMENT',`Achievement freigeschaltet: ${a.title}`,note||'Dieses Achievement wurde dir manuell durch einen EPL Full Admin verliehen.','/erfolge');return json({ok:true,name:a.title});
  }
  if(kind==='CUSTOM'){
    const title=cleanText(b.title,120),subtitle=cleanText(b.subtitle,260),iconKey=cleanText(b.iconKey,1200);if(!title)return fail('Titel fehlt.');const r=await db.prepare(`INSERT INTO player_achievements(user_id,title,subtitle,icon_key,awarded_at) VALUES(?,?,?,?,datetime('now')) RETURNING id`).bind(userId,title,subtitle,iconKey||null).first();await db.prepare(`INSERT INTO admin_award_log(user_id,award_kind,custom_title,quantity_delta,note,admin_user_id) VALUES(?,'CUSTOM',?,1,?,?)`).bind(userId,title,note,admin.id).run();await notifyUser(db,userId,'AWARD',title,subtitle||note||'Neue EPL-Auszeichnung erhalten.','/spieler/'+target.username.toLowerCase());return json({ok:true,id:r?.id,title});
  }
  return fail('Ungültiger Auszeichnungstyp.');
}

async function adminAwardRevoke(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'awards'),b=await request.json(),userId=asId(b.userId),kind=cleanText(b.kind,20).toUpperCase(),note=cleanText(b.note,300)||'Durch Full Admin entfernt';if(!userId)return fail('Spieler fehlt.');
  if(kind==='TROPHY'){
    const trophyId=asId(b.trophyId),removeAll=bool01(b.removeAll),qty=Math.max(1,Math.min(20,Math.trunc(Number(b.quantity)||1)));
    if(!trophyId)return fail('Auszeichnung fehlt.');const row=await db.prepare(`SELECT ut.quantity,t.name FROM user_trophies ut JOIN trophies t ON t.id=ut.trophy_id WHERE ut.user_id=? AND ut.trophy_id=?`).bind(userId,trophyId).first();if(!row)return fail('Diese Auszeichnung besitzt der Spieler nicht.',404);const remove=removeAll?Number(row.quantity):Math.min(Number(row.quantity),qty);if(remove>=Number(row.quantity))await db.prepare('DELETE FROM user_trophies WHERE user_id=? AND trophy_id=?').bind(userId,trophyId).run();else await db.prepare(`UPDATE user_trophies SET quantity=quantity-?,awarded_at=datetime('now') WHERE user_id=? AND trophy_id=?`).bind(remove,userId,trophyId).run();await db.prepare(`INSERT INTO admin_award_log(user_id,award_kind,trophy_id,quantity_delta,note,admin_user_id) VALUES(?,'TROPHY',?, ?,?,?)`).bind(userId,trophyId,-remove,note,admin.id).run();return json({ok:true,removed:remove,name:row.name});
  }
  if(kind==='ACHIEVEMENT'){
    const achievementId=asId(b.achievementId);if(!achievementId)return fail('Achievement fehlt.');await db.prepare('DELETE FROM player_achievement_unlocks WHERE user_id=? AND achievement_id=?').bind(userId,achievementId).run();await db.prepare(`INSERT INTO admin_award_log(user_id,award_kind,achievement_id,quantity_delta,note,admin_user_id) VALUES(?,'ACHIEVEMENT',?,-1,?,?)`).bind(userId,achievementId,note,admin.id).run();return json({ok:true});
  }
  if(kind==='CUSTOM'){
    const customId=asId(b.customId);if(!customId)return fail('Auszeichnung fehlt.');const row=await db.prepare('SELECT title FROM player_achievements WHERE id=? AND user_id=?').bind(customId,userId).first();if(!row)return fail('Auszeichnung nicht gefunden.',404);await db.prepare('DELETE FROM player_achievements WHERE id=? AND user_id=?').bind(customId,userId).run();await db.prepare(`INSERT INTO admin_award_log(user_id,award_kind,custom_title,quantity_delta,note,admin_user_id) VALUES(?,'CUSTOM',?,-1,?,?)`).bind(userId,row.title,note,admin.id).run();return json({ok:true});
  }
  return fail('Ungültiger Auszeichnungstyp.');
}

async function submitMatch(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),id=Number(route.split('/')[1]),b=await request.json();
  const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(id).first();if(!m)return fail('Match nicht gefunden.',404);
  if(m.status==='SUBMITTED')return fail('Das Ergebnis wurde bereits von einer Seite eingetragen. Die Gegenseite kann es jetzt nur noch bestätigen; Korrekturen nimmt ein Admin vor.',409);
  if(['CONFIRMED','CANCELLED'].includes(m.status))return fail('Dieses Match ist bereits abgeschlossen.',409);
  const canHome=await canClubPermission(db,u,m.home_club_id,'submit_results'),canAway=await canClubPermission(db,u,m.away_club_id,'submit_results');
  if(!canHome&&!canAway)return fail('Du darfst für keinen beteiligten Club Ergebnisse melden.',403);
  const hs=Math.trunc(Number(b.homeScore)),as=Math.trunc(Number(b.awayScore));if(hs<0||as<0||hs>99||as>99)return fail('Ungültiges Ergebnis.');
  const clubId=canHome?m.home_club_id:m.away_club_id;
  await db.batch([
    db.prepare(`UPDATE matches SET home_score=?,away_score=?,status='SUBMITTED',submitted_by=?,notes=?,updated_at=datetime('now') WHERE id=?`).bind(hs,as,u.id,cleanText(b.notes,500),id),
    db.prepare(`INSERT INTO match_club_submissions(match_id,club_id,submitted_by,result_submitted_at,evidence_keep_until,updated_at) VALUES(?,?,?,datetime('now'),datetime('now','+7 days'),datetime('now')) ON CONFLICT(match_id,club_id) DO UPDATE SET submitted_by=excluded.submitted_by,result_submitted_at=excluded.result_submitted_at,evidence_keep_until=datetime('now','+7 days'),updated_at=datetime('now')`).bind(id,clubId,u.id)
  ]);
  return json({ok:true,status:'SUBMITTED',submittedClubId:clubId});
}
async function confirmMatch(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),id=Number(route.split('/')[1]);const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(id).first();if(!m)return fail('Match nicht gefunden.',404);if(m.status!=='SUBMITTED')return fail('Match ist nicht zur Bestätigung eingereicht.',409);
  if(u.role!=='SUPER_ADMIN'){
    const roles=await getAdminRoles(db,u.id),isMatchAdmin=roles.some(r=>r==='FULL_ADMIN'||r==='LEAGUE_ADMIN'||r==='MATCH_ADMIN');
    if(!isMatchAdmin){
      const canHome=await canClubPermission(db,u,m.home_club_id,'submit_results'),canAway=await canClubPermission(db,u,m.away_club_id,'submit_results');if(!canHome&&!canAway)return fail('Keine Berechtigung.',403);
      const submission=await db.prepare(`SELECT club_id FROM match_club_submissions WHERE match_id=? AND result_submitted_at IS NOT NULL ORDER BY result_submitted_at DESC LIMIT 1`).bind(id).first();
      const ownClub=canHome?Number(m.home_club_id):Number(m.away_club_id);if(Number(submission?.club_id)===ownClub)return fail('Das Ergebnis muss vom Gegner oder Admin bestätigt werden.',403);
    }
  }
  await db.prepare(`UPDATE matches SET status='CONFIRMED',confirmed_by=?,updated_at=datetime('now') WHERE id=?`).bind(u.id,id).run();await awardMatchCoins(db,m);return json({ok:true,status:'CONFIRMED'});
}

async function setupProfile(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json();
  const username=cleanText(b.username,24),eaId=cleanText(b.eaId,80),platform=cleanText(b.platform,30),position=cleanText(b.position,8),secondary=cleanText(b.secondaryPosition,8),country=cleanText(b.country||'DE',2).toUpperCase(),shirtNumber=Number(b.shirtNumber),birthDate=cleanText(b.birthDate,10),age=ageFromBirthDate(birthDate);
  if(!/^[A-Za-z0-9_.-]{3,24}$/.test(username))return fail('EPL Benutzername: 3–24 Zeichen, nur Buchstaben, Zahlen, _ . -');
  if(eaId.length<3)return fail('Bitte gib deine EA ID an.');
  if(!['ps5','xbox-series','pc'].includes(platform))return fail('Bitte wähle eine gültige Plattform.');
  if(!['ST','ZOM','ZM','ZDM','LM','RM','LV','RV','IV','TW'].includes(position))return fail('Bitte wähle deine Hauptposition.');
  if(secondary&&!['ST','ZOM','ZM','ZDM','LM','RM','LV','RV','IV','TW'].includes(secondary))return fail('Ungültige Nebenposition.');
  if(!Number.isInteger(shirtNumber)||shirtNumber<1||shirtNumber>99)return fail('Trikotnummer muss zwischen 1 und 99 liegen.');
  if(!/^[A-Z]{2}$/.test(country))return fail('Land muss als zweistelliger Code angegeben werden, z. B. DE.');
  if(age===null)return fail('Bitte gib ein gültiges Geburtsdatum an.');
  if(age<13)return fail('Personen unter 13 Jahren können kein eigenes EPL-Konto erstellen.',403);
  if(!b.acceptTerms||!b.acceptPrivacy||!b.acceptCommunity)return fail('Bitte bestätige Nutzungsbedingungen, Datenschutz und Community-Richtlinien.');
  const taken=await db.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE AND id<>?').bind(username,u.id).first();if(taken)return fail('Dieser EPL Benutzername ist bereits vergeben.',409);
  const legalNow="datetime('now')";
  if(age>=13&&age<=15){
    const guardianEmail=cleanText(b.guardianEmail,254).toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guardianEmail))return fail('Für Nutzer zwischen 13 und 15 Jahren ist eine gültige E-Mail-Adresse eines Erziehungsberechtigten erforderlich.');
    if(!env.RESEND_API_KEY||!env.PARENT_CONSENT_FROM_EMAIL)return fail('Die Registrierung für 13–15-Jährige ist erst möglich, sobald der Versand der Elternzustimmung eingerichtet wurde.',503);
    const token=randomId(32),tokenHash=await sha256Hex(token),origin=siteOrigin(request,env),consentUrl=`${origin}/elternzustimmung?token=${encodeURIComponent(token)}`;
    await db.batch([
      db.prepare(`UPDATE users SET username=?,birth_date=?,legal_terms_accepted_at=${legalNow},privacy_acknowledged_at=${legalNow},community_guidelines_accepted_at=${legalNow},updated_at=datetime('now') WHERE id=?`).bind(username,birthDate,u.id),
      db.prepare(`UPDATE profiles SET ea_id=?,platform=?,country=?,position=?,secondary_position=?,updated_at=datetime('now') WHERE user_id=?`).bind(eaId,platform,country,position,secondary,u.id),
      db.prepare(`INSERT INTO profile_onboarding(user_id,shirt_number,completed,parental_consent_status,guardian_email,updated_at) VALUES(?,?,0,'PENDING',?,datetime('now')) ON CONFLICT(user_id) DO UPDATE SET shirt_number=excluded.shirt_number,completed=0,parental_consent_status='PENDING',guardian_email=excluded.guardian_email,updated_at=datetime('now')`).bind(u.id,shirtNumber,guardianEmail),
      db.prepare(`UPDATE parental_consents SET status='EXPIRED' WHERE user_id=? AND status='PENDING'`).bind(u.id),
      db.prepare(`INSERT INTO parental_consents(user_id,guardian_email,token_hash,status,expires_at) VALUES(?,?,?,'PENDING',datetime('now','+48 hours'))`).bind(u.id,guardianEmail,tokenHash)
    ]);
    try{
      await sendParentConsentEmail(env,{to:guardianEmail,username,consentUrl});
    }catch(error){
      console.error('Parental consent email failed',error);
      await db.batch([
        db.prepare(`UPDATE parental_consents SET status='EXPIRED' WHERE user_id=? AND status='PENDING'`).bind(u.id),
        db.prepare(`UPDATE profile_onboarding SET parental_consent_status='NOT_REQUIRED',completed=0,updated_at=datetime('now') WHERE user_id=?`).bind(u.id)
      ]);
      return fail('Die Zustimmungs-E-Mail konnte nicht versendet werden. Bitte prüfe die Adresse oder versuche es später erneut.',502);
    }
    const refreshed=await currentUser(request,env);return json({ok:true,parentalConsentRequired:true,user:refreshed});
  }
  await db.batch([
    db.prepare(`UPDATE users SET username=?,birth_date=?,legal_terms_accepted_at=${legalNow},privacy_acknowledged_at=${legalNow},community_guidelines_accepted_at=${legalNow},updated_at=datetime('now') WHERE id=?`).bind(username,birthDate,u.id),
    db.prepare(`UPDATE profiles SET ea_id=?,platform=?,country=?,position=?,secondary_position=?,updated_at=datetime('now') WHERE user_id=?`).bind(eaId,platform,country,position,secondary,u.id),
    db.prepare(`INSERT INTO profile_onboarding(user_id,shirt_number,completed,parental_consent_status,guardian_email,updated_at) VALUES(?,?,1,'NOT_REQUIRED',NULL,datetime('now')) ON CONFLICT(user_id) DO UPDATE SET shirt_number=excluded.shirt_number,completed=1,parental_consent_status='NOT_REQUIRED',guardian_email=NULL,updated_at=datetime('now')`).bind(u.id,shirtNumber)
  ]);
  const refreshed=await currentUser(request,env);return json({ok:true,user:refreshed});
}

async function parentalConsentCheck(request,env){
  const db=requireDb(env),url=new URL(request.url),token=cleanText(url.searchParams.get('token'),200);if(!token)return fail('Zustimmungslink fehlt.',400);const hash=await sha256Hex(token);const row=await db.prepare(`SELECT pc.id,pc.status,pc.guardian_email,pc.expires_at,u.username,u.birth_date FROM parental_consents pc JOIN users u ON u.id=pc.user_id WHERE pc.token_hash=?`).bind(hash).first();if(!row)return fail('Dieser Zustimmungslink ist ungültig.',404);if(row.status!=='PENDING')return json({status:row.status,username:row.username,expiresAt:row.expires_at});if(new Date(row.expires_at+'Z').getTime()<Date.now()){await db.prepare(`UPDATE parental_consents SET status='EXPIRED' WHERE id=?`).bind(row.id).run();return fail('Dieser Zustimmungslink ist abgelaufen.',410);}return json({status:'PENDING',username:row.username,guardianEmailMasked:String(row.guardian_email).replace(/^(.{1,2}).*(@.*)$/,'$1***$2'),expiresAt:row.expires_at});
}
async function parentalConsentApprove(request,env){
  const db=requireDb(env),b=await request.json(),token=cleanText(b.token,200),guardianName=cleanText(b.guardianName,120);if(!token||guardianName.length<2||!b.confirmResponsibility||!b.confirmConsent)return fail('Bitte bestätige alle Angaben.');const hash=await sha256Hex(token),row=await db.prepare(`SELECT pc.*,u.username FROM parental_consents pc JOIN users u ON u.id=pc.user_id WHERE pc.token_hash=?`).bind(hash).first();if(!row)return fail('Zustimmungslink ungültig.',404);if(row.status!=='PENDING')return fail('Diese Anfrage wurde bereits bearbeitet.',409);if(new Date(row.expires_at+'Z').getTime()<Date.now())return fail('Dieser Zustimmungslink ist abgelaufen.',410);const ip=request.headers.get('CF-Connecting-IP')||'',ipHash=ip?await sha256Hex(ip):null;await db.batch([db.prepare(`UPDATE parental_consents SET status='APPROVED',guardian_name=?,consented_at=datetime('now'),ip_hash=?,user_agent=? WHERE id=?`).bind(guardianName,ipHash,cleanText(request.headers.get('User-Agent'),300),row.id),db.prepare(`UPDATE profile_onboarding SET parental_consent_status='APPROVED',completed=1,updated_at=datetime('now') WHERE user_id=?`).bind(row.user_id)]);await notifyUser(db,row.user_id,'PARENTAL_CONSENT','Elternzustimmung bestätigt','Die Zustimmung wurde bestätigt. Dein EPL Profil kann jetzt vollständig genutzt werden.','/');return json({ok:true,username:row.username});
}

async function updateProfile(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json();
  const fields={
    ea_id:b.eaId===undefined?cleanText(u.ea_id,80):cleanText(b.eaId,80),
    platform:b.platform===undefined?cleanText(u.platform,30):cleanText(b.platform,30),
    console_id:cleanText(b.consoleId,80),discord:b.discord===undefined?cleanText(u.discord,250):cleanText(b.discord,250),tiktok:b.tiktok===undefined?cleanText(u.tiktok,250):cleanText(b.tiktok,250),twitch:b.twitch===undefined?cleanText(u.twitch,250):cleanText(b.twitch,250),
    country:b.country===undefined?cleanText(u.country||'DE',2).toUpperCase():cleanText(b.country||'DE',2).toUpperCase(),
    position:b.position===undefined?cleanText(u.position,8):cleanText(b.position,8),
    secondary_position:b.secondaryPosition===undefined?cleanText(u.secondary_position,8):cleanText(b.secondaryPosition,8),
    bio:b.bio===undefined?cleanText(u.bio,500):cleanText(b.bio,500),free_agent:b.freeAgent?1:0
  };
  await db.prepare(`UPDATE profiles SET ea_id=?,platform=?,console_id=?,discord=?,tiktok=?,twitch=?,country=?,position=?,secondary_position=?,bio=?,free_agent=?,updated_at=datetime('now') WHERE user_id=?`).bind(fields.ea_id,fields.platform,fields.console_id,fields.discord,fields.tiktok,fields.twitch,fields.country,fields.position,fields.secondary_position,fields.bio,fields.free_agent,u.id).run();
  if(b.shirtNumber!==undefined){const n=Number(b.shirtNumber);if(Number.isInteger(n)&&n>=1&&n<=99)await db.prepare(`INSERT INTO profile_onboarding(user_id,shirt_number,completed,updated_at) VALUES(?,?,1,datetime('now')) ON CONFLICT(user_id) DO UPDATE SET shirt_number=excluded.shirt_number,updated_at=datetime('now')`).bind(u.id,n).run();}
  return json({ok:true,profile:fields});
}

async function requireAnyAdmin(request,env){
  const db=requireDb(env),u=await requireUser(request,env);
  if(u.role==='SUPER_ADMIN')return u;
  const roles=await getAdminRoles(db,u.id);
  if(!roles.length)throw httpError('Kein Admin-Zugriff.',403);
  u.admin_roles=roles;return u;
}
function asId(v){const n=Number(v);return Number.isInteger(n)&&n>0?n:null}
function bool01(v){return v===true||v===1||v==='1'||v==='true'?1:0}
const ADMIN_ROLES_ALLOWED=['FULL_ADMIN','USER_ADMIN','LEAGUE_ADMIN','MATCH_ADMIN','NEWS_ADMIN','COIN_ADMIN'];

async function adminOverview(request,env){
  const db=requireDb(env),admin=await requireAnyAdmin(request,env);
  const [users,clubs,seasons,divisions,matches,news,transfers]=await Promise.all([
    db.prepare(`SELECT u.id,u.username,u.email,u.role,u.status,u.created_at,p.ea_id,p.platform,p.country,p.position,p.secondary_position,p.bio,p.discord,p.tiktok,p.twitch,p.market_value_override,p.pac,p.sho,p.pas,p.dri,p.def,p.phy,p.overall,p.verified,
      COALESCE(po.shirt_number,0) shirt_number,COALESCE(w.balance,0) coins,COALESCE(GROUP_CONCAT(DISTINCT ar.role),'') admin_roles,
      ur.rule_code restriction_rule,ur.reason restriction_reason,ur.ends_at restriction_until,
      c.name club_name,c.id club_id,cm.role club_role
      FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN profile_onboarding po ON po.user_id=u.id LEFT JOIN coin_wallets w ON w.user_id=u.id
      LEFT JOIN user_admin_roles ar ON ar.user_id=u.id LEFT JOIN user_restrictions ur ON ur.id=(SELECT id FROM user_restrictions r WHERE r.user_id=u.id AND r.active=1 ORDER BY r.created_at DESC LIMIT 1) LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id
      GROUP BY u.id ORDER BY u.created_at DESC`).all(),
    db.prepare(`SELECT c.id,c.name,c.slug,c.ea_club_id,c.platform,c.division_id,c.reputation,c.followers_count,c.verified,u.username manager_username,u.id manager_user_id,d.name division_name,
      cd.bio,cd.discord,cd.tiktok,cd.twitch,cd.website,COALESCE(cw.balance,0) club_coins FROM clubs c LEFT JOIN users u ON u.id=c.manager_user_id LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN club_details cd ON cd.club_id=c.id LEFT JOIN club_coin_wallets cw ON cw.club_id=c.id ORDER BY c.created_at DESC`).all(),
    db.prepare(`SELECT * FROM seasons ORDER BY id DESC`).all(),
    db.prepare(`SELECT d.*,s.name season_name FROM divisions d JOIN seasons s ON s.id=d.season_id ORDER BY d.season_id DESC,d.level ASC`).all(),
    db.prepare(`SELECT m.*,h.name home_name,a.name away_name,s.name season_name,d.name division_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id JOIN seasons s ON s.id=m.season_id JOIN divisions d ON d.id=m.division_id ORDER BY m.season_id DESC,m.division_id ASC,m.matchday ASC,CASE WHEN m.scheduled_at='' THEN 1 ELSE 0 END,m.scheduled_at ASC LIMIT 500`).all(),
    db.prepare(`SELECT n.id,n.slug,n.title,n.excerpt,n.body,n.body_html,n.image_key,n.status,n.published_at,n.created_at,u.username author FROM news n LEFT JOIN users u ON u.id=n.author_user_id ORDER BY n.created_at DESC LIMIT 100`).all(),
    db.prepare(`SELECT t.id,t.type,t.occurred_at,u.username player,fc.name from_club,tc.name to_club FROM transfers t JOIN users u ON u.id=t.user_id LEFT JOIN clubs fc ON fc.id=t.from_club_id LEFT JOIN clubs tc ON tc.id=t.to_club_id ORDER BY t.occurred_at DESC LIMIT 100`).all()
  ]);
  const roles=admin.role==='SUPER_ADMIN'?['FULL_ADMIN']:(admin.admin_roles||[]);
  const can=p=>admin.role==='SUPER_ADMIN'||roles.some(r=>(ADMIN_ROLE_PERMISSIONS[r]||[]).includes('*')||(ADMIN_ROLE_PERMISSIONS[r]||[]).includes(p));
  const rawUsers=users.results||[];
  const safeUsers=can('profiles')?rawUsers:(can('clubs')||can('coins')||can('transfers')?rawUsers.map(u=>({id:u.id,username:u.username,ea_id:u.ea_id,position:u.position,club_name:u.club_name,club_id:u.club_id,club_role:u.club_role,coins:u.coins,role:u.role,status:u.status,admin_roles:''})):[]);
  let transferWindows=[];if(can('transfers')){const tw=await db.prepare(`SELECT tw.*,s.name season_name FROM transfer_windows tw JOIN seasons s ON s.id=tw.season_id ORDER BY tw.season_id DESC,tw.id DESC`).all();transferWindows=tw.results||[];}
  return json({admin:{id:admin.id,username:admin.username,role:admin.role,admin_roles:admin.admin_roles||[]},users:safeUsers,clubs:(can('clubs')||can('matches')||can('transfers')||can('coins'))?(clubs.results||[]):[],seasons:(can('leagues')||can('matches')||can('transfers'))?(seasons.results||[]):[],divisions:(can('leagues')||can('matches'))?(divisions.results||[]):[],matches:can('matches')?(matches.results||[]):[],news:can('news')?(news.results||[]):[],transfers:can('transfers')?(transfers.results||[]):[],transferWindows});
}

async function adminUserAccess(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'moderation'),b=await request.json(),userId=asId(b.userId);
  if(!userId)return fail('Benutzer fehlt.');const target=await db.prepare('SELECT id,username,role,status FROM users WHERE id=?').bind(userId).first();if(!target)return fail('Benutzer nicht gefunden.',404);if(target.role==='SUPER_ADMIN'&&admin.role!=='SUPER_ADMIN')return fail('Der Website-Hauptadmin kann nur durch den Hauptadmin selbst verwaltet werden.',403);if(target.id===admin.id&&b.status&&b.status!=='ACTIVE')return fail('Du kannst dich nicht selbst sperren.',409);
  const canAssignAdminRoles=admin.role==='SUPER_ADMIN';const existingRoles=await getAdminRoles(db,userId);const roles=canAssignAdminRoles?[...new Set(Array.isArray(b.adminRoles)?b.adminRoles:[])].filter(x=>ADMIN_ROLES_ALLOWED.includes(x)):existingRoles,status=['ACTIVE','SUSPENDED','BANNED'].includes(b.status)?b.status:'ACTIVE';let baseRole=['PLAYER','MANAGER'].includes(b.baseRole)?b.baseRole:target.role;if(target.role==='SUPER_ADMIN')baseRole='SUPER_ADMIN';
  const ruleCode=cleanText(b.ruleCode,80),reason=cleanText(b.restrictionReason,800),until=cleanText(b.restrictionUntil,40)||null;if(status!=='ACTIVE'&&reason.length<3)return fail('Bei einer Sperre ist eine Begründung erforderlich.');
  const statements=[db.prepare(`UPDATE users SET status=?,role=?,updated_at=datetime('now') WHERE id=?`).bind(status,baseRole,userId)];
  if(canAssignAdminRoles){statements.push(db.prepare('DELETE FROM user_admin_roles WHERE user_id=?').bind(userId));for(const role of roles)statements.push(db.prepare('INSERT INTO user_admin_roles(user_id,role,assigned_by) VALUES(?,?,?)').bind(userId,role,admin.id));}
  if(status==='ACTIVE')statements.push(db.prepare(`UPDATE user_restrictions SET active=0,lifted_at=datetime('now'),lifted_by=? WHERE user_id=? AND active=1`).bind(admin.id,userId));else{statements.push(db.prepare(`UPDATE user_restrictions SET active=0,lifted_at=datetime('now'),lifted_by=? WHERE user_id=? AND active=1`).bind(admin.id,userId));statements.push(db.prepare(`INSERT INTO user_restrictions(user_id,status,rule_code,reason,ends_at,created_by) VALUES(?,?,?,?,?,?)`).bind(userId,status,ruleCode,reason,until,admin.id));statements.push(db.prepare(`INSERT INTO notifications(user_id,type,title,body,href) VALUES(?,?,?,?,?)`).bind(userId,'ACCOUNT_RESTRICTION',status==='BANNED'?'Dein EPL Konto wurde gesperrt':'Dein EPL Konto wurde eingeschränkt',`Dein Konto wurde wegen ${ruleCode?`Verstoß gegen ${ruleCode}`:'eines Regelverstoßes'}${until?` bis ${until}`:''} eingeschränkt. ${reason}`,'/einstellungen'));}
  await db.batch(statements);return json({ok:true,username:target.username,adminRoles:roles,status,baseRole,adminRolesChanged:canAssignAdminRoles});
}

async function adminUserProfile(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'profiles'),b=await request.json(),userId=asId(b.userId);if(!userId)return fail('Benutzer fehlt.');
  const target=await db.prepare('SELECT u.id,u.username,p.user_id profile_id FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?').bind(userId).first();if(!target)return fail('Benutzer nicht gefunden.',404);
  const username=cleanText(b.username||target.username,24);if(!/^[A-Za-z0-9_.-]{3,24}$/.test(username))return fail('Ungültiger Benutzername.');
  const taken=await db.prepare('SELECT 1 FROM users WHERE username=? COLLATE NOCASE AND id<>?').bind(username,userId).first();if(taken)return fail('Benutzername bereits vergeben.',409);
  if(!target.profile_id)await db.prepare('INSERT INTO profiles(user_id) VALUES(?)').bind(userId).run();
  const position=cleanText(b.position,8),secondary=cleanText(b.secondaryPosition,8),country=cleanText(b.country||'DE',2).toUpperCase();
  const nums=['pac','sho','pas','dri','def','phy','overall'].map(k=>Math.max(0,Math.min(99,Math.trunc(Number(b[k]??70)))));
  await db.batch([
    db.prepare(`UPDATE users SET username=?,updated_at=datetime('now') WHERE id=?`).bind(username,userId),
    db.prepare(`UPDATE profiles SET ea_id=?,platform=?,country=?,position=?,secondary_position=?,bio=?,discord=?,tiktok=?,twitch=?,market_value_override=?,verified=?,pac=?,sho=?,pas=?,dri=?,def=?,phy=?,overall=?,updated_at=datetime('now') WHERE user_id=?`)
      .bind(cleanText(b.eaId,80),cleanText(b.platform,30),country,position,secondary,cleanText(b.bio,500),cleanText(b.discord,250),cleanText(b.tiktok,250),cleanText(b.twitch,250),b.marketValueOverride?Math.max(250000,Math.min(50000000,Math.trunc(Number(b.marketValueOverride)))):null,bool01(b.verified),...nums,userId),
    db.prepare(`INSERT INTO profile_onboarding(user_id,shirt_number,completed,updated_at) VALUES(?,?,1,datetime('now')) ON CONFLICT(user_id) DO UPDATE SET shirt_number=excluded.shirt_number,completed=1,updated_at=datetime('now')`)
      .bind(userId,Math.max(1,Math.min(99,Math.trunc(Number(b.shirtNumber)||10))))
  ]);
  return json({ok:true});
}

async function adminMarketValue(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'profiles');const b=await request.json(),userId=asId(b.userId);if(!userId)return fail('Spieler fehlt.');
  const valueRaw=b.value===null||b.value===''?null:Math.trunc(Number(b.value));if(valueRaw!==null&&(!Number.isFinite(valueRaw)||valueRaw<250000||valueRaw>50000000))return fail('Marktwert muss zwischen 250.000 und 50.000.000 EPL € liegen.');
  const player=await db.prepare('SELECT u.username FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?').bind(userId).first();if(!player)return fail('Spieler nicht gefunden.',404);
  await db.prepare("UPDATE profiles SET market_value_override=?,updated_at=datetime('now') WHERE user_id=?").bind(valueRaw,userId).run();
  const row=await marketRowForUser(db,userId),value=marketValueFromRow(row||{});await db.prepare(`INSERT INTO market_value_snapshots(user_id,value_eur,reason) VALUES(?,?,'ADMIN_OVERRIDE')`).bind(userId,value).run();
  return json({ok:true,username:player.username,marketValue:value,manual:valueRaw!==null});
}

async function adminClubSave(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'clubs'),b=await request.json(),id=asId(b.id),name=cleanText(b.name,50);if(name.length<3)return fail('Clubname ist zu kurz.');
  const slug=slugify(name),divisionId=asId(b.divisionId),rep=Math.max(0,Math.min(99999,Math.trunc(Number(b.reputation)||1000)));
  let clubId=id;
  if(id){
    const exists=await db.prepare('SELECT id FROM clubs WHERE id=?').bind(id).first();if(!exists)return fail('Club nicht gefunden.',404);
    await db.prepare(`UPDATE clubs SET name=?,slug=?,ea_club_id=?,platform=?,division_id=?,reputation=?,verified=?,updated_at=datetime('now') WHERE id=?`).bind(name,slug,cleanText(b.eaClubId,50),cleanText(b.platform,30),divisionId,rep,bool01(b.verified),id).run();
  }else{
    const r=await db.prepare(`INSERT INTO clubs(name,slug,ea_club_id,platform,division_id,reputation,verified) VALUES(?,?,?,?,?,?,?)`).bind(name,slug,cleanText(b.eaClubId,50),cleanText(b.platform,30),divisionId,rep,bool01(b.verified)).run();clubId=r.meta.last_row_id;
  }
  await db.prepare(`INSERT INTO club_details(club_id,bio,discord,tiktok,twitch,website,updated_at) VALUES(?,?,?,?,?,?,datetime('now')) ON CONFLICT(club_id) DO UPDATE SET bio=excluded.bio,discord=excluded.discord,tiktok=excluded.tiktok,twitch=excluded.twitch,website=excluded.website,updated_at=datetime('now')`).bind(clubId,cleanText(b.bio,1000),cleanText(b.discord,250),cleanText(b.tiktok,250),cleanText(b.twitch,250),cleanText(b.website,250)).run();
  if(divisionId){
    const div=await db.prepare('SELECT season_id FROM divisions WHERE id=?').bind(divisionId).first();
    if(div){
      await db.batch([
        db.prepare('DELETE FROM season_clubs WHERE season_id=? AND club_id=?').bind(div.season_id,clubId),
        db.prepare('INSERT OR REPLACE INTO season_clubs(season_id,division_id,club_id,points_adjustment) VALUES(?,?,?,COALESCE((SELECT points_adjustment FROM season_clubs WHERE season_id=? AND club_id=?),0))').bind(div.season_id,divisionId,clubId,div.season_id,clubId),
        db.prepare('INSERT OR IGNORE INTO club_season_limits(season_id,club_id) VALUES(?,?)').bind(div.season_id,clubId)
      ]);
    }
  }
  return json({ok:true,id:clubId,slug,by:admin.username});
}

async function adminClubManager(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'clubs'),b=await request.json(),clubId=asId(b.clubId),userId=asId(b.userId);if(!clubId||!userId)return fail('Club und Spieler sind erforderlich.');
  const [club,user]=await Promise.all([db.prepare('SELECT id,manager_user_id FROM clubs WHERE id=?').bind(clubId).first(),db.prepare('SELECT id,role FROM users WHERE id=?').bind(userId).first()]);if(!club||!user)return fail('Club oder Spieler nicht gefunden.',404);
  const other=await db.prepare('SELECT club_id FROM club_members WHERE user_id=? AND left_at IS NULL AND club_id<>?').bind(userId,clubId).first();if(other)return fail('Dieser Spieler ist bereits Mitglied eines anderen Clubs.',409);
  const active=await db.prepare('SELECT id FROM club_members WHERE club_id=? AND user_id=? AND left_at IS NULL').bind(clubId,userId).first();
  const statements=[db.prepare('UPDATE clubs SET manager_user_id=?,updated_at=datetime(\'now\') WHERE id=?').bind(userId,clubId),db.prepare(`UPDATE users SET role=CASE WHEN role='PLAYER' THEN 'MANAGER' ELSE role END,updated_at=datetime('now') WHERE id=?`).bind(userId),db.prepare(`INSERT INTO club_staff_permissions(club_id,user_id,can_manage_page,can_submit_results,can_manage_stats,can_manage_roster,assigned_by,updated_at) VALUES(?,?,?,?,?,?,?,datetime('now')) ON CONFLICT(club_id,user_id) DO UPDATE SET can_manage_page=1,can_submit_results=1,can_manage_stats=1,can_manage_roster=1,assigned_by=excluded.assigned_by,updated_at=datetime('now')`).bind(clubId,userId,1,1,1,1,admin.id)];
  if(active)statements.push(db.prepare(`UPDATE club_members SET role='MANAGER' WHERE id=?`).bind(active.id));else statements.push(db.prepare(`INSERT INTO club_members(club_id,user_id,role) VALUES(?,?,'MANAGER')`).bind(clubId,userId));
  await db.batch(statements);return json({ok:true});
}

async function adminClubCoinAward(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'coins'),b=await request.json(),clubId=asId(b.clubId),amount=Math.trunc(Number(b.amount));
  if(!clubId||!Number.isFinite(amount)||amount===0||Math.abs(amount)>100000)return fail('Ungültiger Club-Coin-Betrag.');
  const club=await db.prepare('SELECT id,name FROM clubs WHERE id=?').bind(clubId).first();if(!club)return fail('Club nicht gefunden.',404);
  await db.prepare(`INSERT OR IGNORE INTO club_coin_wallets(club_id,balance) VALUES(?,0)`).bind(clubId).run();
  const wallet=await db.prepare('SELECT balance FROM club_coin_wallets WHERE club_id=?').bind(clubId).first();if(amount<0&&Number(wallet?.balance||0)+amount<0)return fail('Clubkasse würde negativ werden.',409);
  const ref=crypto.randomUUID();
  await db.batch([
    db.prepare(`UPDATE club_coin_wallets SET balance=balance+?,lifetime_earned=lifetime_earned+CASE WHEN ?>0 THEN ? ELSE 0 END,lifetime_spent=lifetime_spent+CASE WHEN ?<0 THEN -? ELSE 0 END,updated_at=datetime('now') WHERE club_id=?`).bind(amount,amount,amount,amount,amount,clubId),
    db.prepare(`INSERT INTO club_coin_transactions(club_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'ADMIN_ADJUSTMENT','ADMIN',?,?)`).bind(clubId,amount,ref,cleanText(b.description,200)||`Club-Coin-Anpassung durch ${admin.username}`)
  ]);
  const updated=await db.prepare('SELECT balance FROM club_coin_wallets WHERE club_id=?').bind(clubId).first();return json({ok:true,balance:Number(updated?.balance||0)});
}

async function adminSeasonSave(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'leagues');const b=await request.json(),id=asId(b.id),name=cleanText(b.name,80),status=['DRAFT','REGISTRATION','ACTIVE','FINISHED'].includes(b.status)?b.status:'DRAFT';if(!name)return fail('Saisonname fehlt.');
  if(id)await db.prepare('UPDATE seasons SET name=?,status=?,starts_at=?,ends_at=? WHERE id=?').bind(name,status,b.startsAt||null,b.endsAt||null,id).run();else await db.prepare('INSERT INTO seasons(name,status,starts_at,ends_at) VALUES(?,?,?,?)').bind(name,status,b.startsAt||null,b.endsAt||null).run();return json({ok:true});
}
async function adminDivisionSave(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'leagues');const b=await request.json(),id=asId(b.id),seasonId=asId(b.seasonId),name=cleanText(b.name,80),level=Math.max(1,Math.trunc(Number(b.level)||1)),maxClubs=Math.max(2,Math.min(64,Math.trunc(Number(b.maxClubs)||16)));if(!seasonId||!name)return fail('Saison und Ligename fehlen.');
  if(id)await db.prepare('UPDATE divisions SET season_id=?,name=?,level=?,max_clubs=? WHERE id=?').bind(seasonId,name,level,maxClubs,id).run();else await db.prepare('INSERT INTO divisions(season_id,name,level,max_clubs) VALUES(?,?,?,?)').bind(seasonId,name,level,maxClubs).run();return json({ok:true});
}
async function adminDivisionDelete(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'leagues');const b=await request.json(),id=asId(b.id);if(!id)return fail('Liga fehlt.');const d=await db.prepare(`SELECT d.id,d.name,(SELECT COUNT(*) FROM matches WHERE division_id=d.id) matches_count FROM divisions d WHERE d.id=?`).bind(id).first();if(!d)return fail('Liga nicht gefunden.',404);
  const matches=await db.prepare(`SELECT id FROM matches WHERE division_id=?`).bind(id).all();for(const m of matches.results||[])await reverseMatchAwards(db,m.id);
  await db.batch([db.prepare(`UPDATE clubs SET division_id=NULL,updated_at=datetime('now') WHERE division_id=?`).bind(id),db.prepare(`DELETE FROM divisions WHERE id=?`).bind(id)]);return json({ok:true,name:d.name,deletedMatches:Number(d.matches_count||0)});
}
async function reverseMatchAwards(db,matchId){
  const tx=await db.prepare(`SELECT id,user_id,amount FROM coin_transactions WHERE type='PERFORMANCE' AND reference_type='MATCH' AND reference_id=?`).bind(String(matchId)).all();for(const x of tx.results||[]){await db.prepare(`UPDATE coin_wallets SET balance=MAX(0,balance-?),lifetime_earned=MAX(0,lifetime_earned-?),updated_at=datetime('now') WHERE user_id=?`).bind(Math.max(0,Number(x.amount||0)),Math.max(0,Number(x.amount||0)),x.user_id).run();await db.prepare('DELETE FROM coin_transactions WHERE id=?').bind(x.id).run();}
  const ctx=await db.prepare(`SELECT id,club_id,amount FROM club_coin_transactions WHERE type='PERFORMANCE' AND reference_type='MATCH' AND reference_id=?`).bind(String(matchId)).all();for(const x of ctx.results||[]){await db.prepare(`UPDATE club_coin_wallets SET balance=MAX(0,balance-?),lifetime_earned=MAX(0,lifetime_earned-?),updated_at=datetime('now') WHERE club_id=?`).bind(Math.max(0,Number(x.amount||0)),Math.max(0,Number(x.amount||0)),x.club_id).run();await db.prepare('DELETE FROM club_coin_transactions WHERE id=?').bind(x.id).run();}
  const reps=await db.prepare(`SELECT id,club_id,amount FROM club_reputation_events WHERE reference_type='MATCH' AND reference_id=?`).bind(String(matchId)).all();for(const x of reps.results||[]){await db.prepare(`UPDATE clubs SET reputation=MAX(0,reputation-?) WHERE id=?`).bind(Math.max(0,Number(x.amount||0)),x.club_id).run();await db.prepare('DELETE FROM club_reputation_events WHERE id=?').bind(x.id).run();}
}
async function adminResetMatchResult(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'matches');const b=await request.json(),id=asId(b.matchId);if(!id)return fail('Match fehlt.');const m=await db.prepare('SELECT id FROM matches WHERE id=?').bind(id).first();if(!m)return fail('Match nicht gefunden.',404);await reverseMatchAwards(db,id);await db.batch([db.prepare('DELETE FROM player_stats WHERE match_id=?').bind(id),db.prepare('DELETE FROM match_club_submissions WHERE match_id=?').bind(id),db.prepare(`UPDATE matches SET home_score=NULL,away_score=NULL,status='SCHEDULED',submitted_by=NULL,confirmed_by=NULL,notes=NULL,updated_at=datetime('now') WHERE id=?`).bind(id)]);return json({ok:true});
}
async function adminResetSchedule(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'matches');const b=await request.json(),seasonId=asId(b.seasonId),divisionId=asId(b.divisionId);if(!seasonId||!divisionId)return fail('Saison und Liga sind erforderlich.');const rows=await db.prepare(`SELECT id FROM matches WHERE season_id=? AND division_id=?`).bind(seasonId,divisionId).all();for(const m of rows.results||[])await reverseMatchAwards(db,m.id);await db.prepare(`DELETE FROM matches WHERE season_id=? AND division_id=?`).bind(seasonId,divisionId).run();return json({ok:true,deleted:(rows.results||[]).length});
}

async function adminMatchSave(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'matches');
  const b=await request.json(),id=asId(b.id),seasonId=asId(b.seasonId),divisionId=asId(b.divisionId),home=asId(b.homeClubId),away=asId(b.awayClubId),matchday=Math.max(1,Math.trunc(Number(b.matchday)||1)),scheduled=cleanText(b.scheduledAt,40);
  if(!seasonId||!divisionId||!home||!away||home===away)return fail('Matchdaten sind unvollständig.');
  const members=await db.prepare(`SELECT club_id FROM season_clubs WHERE season_id=? AND division_id=? AND club_id IN (?,?)`).bind(seasonId,divisionId,home,away).all();
  if((members.results||[]).length<2)return fail('Beide Clubs müssen dieser Saison und Liga zugewiesen sein.',409);
  if(id)await db.prepare(`UPDATE matches SET season_id=?,division_id=?,matchday=?,home_club_id=?,away_club_id=?,scheduled_at=?,updated_at=datetime('now') WHERE id=?`).bind(seasonId,divisionId,matchday,home,away,scheduled||'',id).run();
  else await db.prepare(`INSERT INTO matches(season_id,division_id,matchday,home_club_id,away_club_id,scheduled_at) VALUES(?,?,?,?,?,?)`).bind(seasonId,divisionId,matchday,home,away,scheduled||'').run();
  return json({ok:true});
}

function roundRobinRounds(ids){
  const arr=[...ids];if(arr.length%2)arr.push(null);const n=arr.length,rounds=[];let cur=[...arr];
  for(let r=0;r<n-1;r++){
    const games=[];
    for(let i=0;i<n/2;i++){
      let a=cur[i],b=cur[n-1-i];if(a==null||b==null)continue;
      if((r+i)%2===0)games.push([a,b]);else games.push([b,a]);
    }
    rounds.push(games);cur=[cur[0],cur[n-1],...cur.slice(1,n-1)];
  }
  return rounds;
}
async function adminGenerateMatches(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'matches'),b=await request.json();
  const seasonId=asId(b.seasonId),divisionId=asId(b.divisionId),mode=String(b.mode||'DOUBLE').toUpperCase(),replace=!!b.replace,target=Math.max(1,Math.min(60,Math.trunc(Number(b.targetMatchesPerTeam)||0)));
  if(!seasonId||!divisionId)return fail('Saison und Liga sind erforderlich.');
  const div=await db.prepare('SELECT id,name,season_id FROM divisions WHERE id=? AND season_id=?').bind(divisionId,seasonId).first();if(!div)return fail('Liga gehört nicht zur gewählten Saison.',409);
  let clubs=await db.prepare('SELECT club_id FROM season_clubs WHERE season_id=? AND division_id=? ORDER BY club_id').bind(seasonId,divisionId).all();
  if(!(clubs.results||[]).length){clubs=await db.prepare('SELECT id club_id FROM clubs WHERE division_id=? ORDER BY id').bind(divisionId).all();}
  const ids=(clubs.results||[]).map(x=>Number(x.club_id));if(ids.length<2)return fail('In dieser Liga sind nicht genügend Teams eingetragen.',409);
  const existing=await db.prepare('SELECT COUNT(*) total,SUM(CASE WHEN status IN (\'CONFIRMED\',\'SUBMITTED\',\'DISPUTED\') THEN 1 ELSE 0 END) locked FROM matches WHERE season_id=? AND division_id=?').bind(seasonId,divisionId).first();
  if(Number(existing?.total||0)>0&&!replace)return fail(`Für diese Liga existieren bereits ${existing.total} Matches. Aktiviere „Spielplan ersetzen“, wenn du neu generieren willst.`,409);
  if(replace&&Number(existing?.locked||0)>0)return fail('Der Spielplan kann nicht ersetzt werden, weil bereits Ergebnisse eingereicht oder bestätigt wurden.',409);
  if(replace)await db.prepare(`DELETE FROM matches WHERE season_id=? AND division_id=? AND status IN ('SCHEDULED','CANCELLED')`).bind(seasonId,divisionId).run();
  const base=roundRobinRounds(ids),rounds=[];
  if(mode==='SINGLE'){rounds.push(...base);}
  else if(mode==='TARGET'){
    const wanted=Math.max(ids.length-1,target||ids.length-1);let played=0,cycle=0;
    while(played<wanted){const src=base[cycle%base.length].map(([h,a])=>cycle<base.length?[h,a]:[a,h]);rounds.push(src);played++;cycle++;}
  }else{rounds.push(...base,...base.map(g=>g.map(([h,a])=>[a,h])));}
  const batchId=crypto.randomUUID();let created=0,matchday=1;
  for(const games of rounds){
    const stmts=[];
    for(const [home,away] of games){stmts.push(db.prepare(`INSERT INTO matches(season_id,division_id,matchday,home_club_id,away_club_id,scheduled_at,status) VALUES(?,?,?,?,?,'','SCHEDULED')`).bind(seasonId,divisionId,matchday,home,away));}
    for(let i=0;i<stmts.length;i+=40){const res=await db.batch(stmts.slice(i,i+40));created+=res.length;}
    matchday++;
  }
  // Tag generated matches that do not already have metadata.
  await db.prepare(`INSERT OR IGNORE INTO match_schedule_meta(match_id,generated_by,generated_at,source) SELECT id,?,datetime('now'),? FROM matches WHERE season_id=? AND division_id=?`).bind(admin.id,`AUTO:${batchId}`,seasonId,divisionId).run();
  return json({ok:true,clubs:ids.length,matchdays:rounds.length,matches:rounds.reduce((a,x)=>a+x.length,0),mode});
}

async function adminMatchDetail(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'matches');const u=new URL(request.url),id=asId(u.searchParams.get('id'));if(!id)return fail('Match fehlt.');
  const match=await db.prepare(`SELECT m.*,h.name home_name,a.name away_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id WHERE m.id=?`).bind(id).first();if(!match)return fail('Match nicht gefunden.',404);
  const roster=async clubId=>(await db.prepare(`SELECT u.id,u.username,p.position,p.avatar_key,cm.shirt_number,ps.goals,ps.assists,ps.saves,ps.clean_sheet,ps.yellow_cards,ps.red_cards,ps.rating,ps.motm,CASE WHEN ps.id IS NULL THEN 0 ELSE 1 END played FROM club_members cm JOIN users u ON u.id=cm.user_id LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN player_stats ps ON ps.match_id=? AND ps.user_id=u.id WHERE cm.club_id=? AND cm.left_at IS NULL ORDER BY u.username`).bind(id,clubId).all()).results||[];
  return json({match,homeSquad:await roster(match.home_club_id),awaySquad:await roster(match.away_club_id)});
}
async function adminMatchResult(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'matches'),b=await request.json(),id=asId(b.matchId),hs=Math.trunc(Number(b.homeScore)),as=Math.trunc(Number(b.awayScore));if(!id||hs<0||as<0||hs>99||as>99)return fail('Ungültiges Ergebnis.');
  const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(id).first();if(!m)return fail('Match nicht gefunden.',404);const wasConfirmed=m.status==='CONFIRMED',stats=Array.isArray(b.stats)?b.stats:[];
  const motmCount=stats.filter(x=>x&&x.played&&x.motm).length;if(motmCount>1)return fail('Es kann pro Match nur einen Man of the Match geben.',409);
  for(const clubId of [Number(m.home_club_id),Number(m.away_club_id)]){const own=stats.filter(x=>Number(x?.clubId)===clubId);if(own.some(x=>x&&x.played))await validateOfficialLineup(db,own,clubId);}
  const statStmts=[];
  for(const row of stats){
    const userId=asId(row.userId),clubId=asId(row.clubId);if(!userId||![Number(m.home_club_id),Number(m.away_club_id)].includes(Number(clubId)))continue;
    const member=await db.prepare('SELECT 1 FROM club_members WHERE club_id=? AND user_id=? AND left_at IS NULL').bind(clubId,userId).first();if(!member)return fail('Ein ausgewählter Spieler gehört nicht zum Match-Club.',409);
    if(!row.played){statStmts.push(db.prepare('DELETE FROM player_stats WHERE match_id=? AND user_id=?').bind(id,userId));continue;}
    statStmts.push(db.prepare(`INSERT INTO player_stats(match_id,user_id,club_id,goals,assists,saves,clean_sheet,yellow_cards,red_cards,rating,motm) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(match_id,user_id) DO UPDATE SET club_id=excluded.club_id,goals=excluded.goals,assists=excluded.assists,saves=excluded.saves,clean_sheet=excluded.clean_sheet,yellow_cards=excluded.yellow_cards,red_cards=excluded.red_cards,rating=excluded.rating,motm=excluded.motm`).bind(id,userId,clubId,Math.max(0,Math.trunc(Number(row.goals)||0)),Math.max(0,Math.trunc(Number(row.assists)||0)),Math.max(0,Math.trunc(Number(row.saves)||0)),bool01(row.cleanSheet),Math.max(0,Math.min(2,Math.trunc(Number(row.yellowCards)||0))),Math.max(0,Math.min(1,Math.trunc(Number(row.redCards)||0))),Math.max(0,Math.min(10,Number(row.rating)||0)),bool01(row.motm)));
  }
  for(let i=0;i<statStmts.length;i+=40)await db.batch(statStmts.slice(i,i+40));
  await db.prepare(`UPDATE matches SET home_score=?,away_score=?,status='CONFIRMED',confirmed_by=?,notes=?,updated_at=datetime('now') WHERE id=?`).bind(hs,as,admin.id,cleanText(b.notes,500),id).run();
  if(!wasConfirmed)await awardMatchCoins(db,{...m,home_score:hs,away_score:as});
  const playedUsers=[...new Set(stats.filter(x=>x&&x.played&&asId(x.userId)).map(x=>asId(x.userId)))];for(const uid of playedUsers){try{await evaluateAchievements(db,uid);const mv=await marketRowForUser(db,uid);if(mv){const value=marketValueFromRow(mv),last=await db.prepare(`SELECT value_eur FROM market_value_snapshots WHERE user_id=? ORDER BY id DESC LIMIT 1`).bind(uid).first();if(!last||Number(last.value_eur)!==value)await db.prepare(`INSERT INTO market_value_snapshots(user_id,value_eur,reason) VALUES(?,?,'MATCH_CONFIRMED')`).bind(uid,value).run();}}catch{}}
  return json({ok:true});
}
async function adminNewsSave(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'news'),b=await request.json(),id=asId(b.id),title=cleanText(b.title,160),html=sanitizeNewsHtml(b.bodyHtml||''),body=cleanText(b.body||stripHtml(html),30000),status=['DRAFT','PUBLISHED','ARCHIVED'].includes(b.status)?b.status:'DRAFT';if(!title||(!body&&!html))return fail('Titel und Inhalt sind erforderlich.');const slug=slugify(b.slug||title),excerpt=cleanText(b.excerpt||stripHtml(html||body).slice(0,300),400),imageKey=cleanText(b.imageKey,1200)||null,published=status==='PUBLISHED'?(b.publishedAt||new Date().toISOString()):null;
  if(id)await db.prepare(`UPDATE news SET slug=?,title=?,excerpt=?,body=?,body_html=?,image_key=?,status=?,author_user_id=?,published_at=?,updated_at=datetime('now') WHERE id=?`).bind(slug,title,excerpt,body,html||null,imageKey,status,admin.id,published,id).run();else await db.prepare(`INSERT INTO news(slug,title,excerpt,body,body_html,image_key,status,author_user_id,published_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,datetime('now'))`).bind(slug,title,excerpt,body,html||null,imageKey,status,admin.id,published).run();return json({ok:true});
}
async function adminNewsDelete(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'news');const b=await request.json(),id=asId(b.id);if(!id)return fail('News fehlt.');const row=await db.prepare(`SELECT title,image_key FROM news WHERE id=?`).bind(id).first();if(!row)return fail('News nicht gefunden.',404);await db.prepare(`DELETE FROM news WHERE id=?`).bind(id).run();return json({ok:true,title:row.title});
}
async function getLeagueRules(env){
  const db=requireDb(env),[sections,rules]=await Promise.all([db.prepare(`SELECT id,code,title,intro,sort_order FROM league_rule_sections WHERE active=1 ORDER BY sort_order,id`).all(),db.prepare(`SELECT id,section_id,code,title,body,severity,sort_order FROM league_rules WHERE active=1 ORDER BY section_id,sort_order,id`).all()]);const grouped=(sections.results||[]).map(sec=>({...sec,rules:(rules.results||[]).filter(r=>Number(r.section_id)===Number(sec.id))}));return json({sections:grouped});
}
async function adminRulesOverview(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'leagues');const [sections,rules]=await Promise.all([db.prepare(`SELECT * FROM league_rule_sections ORDER BY sort_order,id`).all(),db.prepare(`SELECT r.*,s.title section_title FROM league_rules r JOIN league_rule_sections s ON s.id=r.section_id ORDER BY s.sort_order,r.sort_order,r.id`).all()]);return json({sections:sections.results||[],rules:rules.results||[]});
}
async function adminRuleSave(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'leagues'),b=await request.json(),id=asId(b.id),sectionId=asId(b.sectionId),title=cleanText(b.title,160),body=cleanText(b.body,5000),severity=['INFO','IMPORTANT','CRITICAL'].includes(String(b.severity||'').toUpperCase())?String(b.severity).toUpperCase():'INFO',sortOrder=Math.trunc(Number(b.sortOrder)||0);if(!sectionId||!title||!body)return fail('Bereich, Titel und Regeltext sind erforderlich.');if(id)await db.prepare(`UPDATE league_rules SET section_id=?,title=?,body=?,severity=?,sort_order=?,active=?,updated_by=?,updated_at=datetime('now') WHERE id=?`).bind(sectionId,title,body,severity,sortOrder,bool01(b.active),admin.id,id).run();else await db.prepare(`INSERT INTO league_rules(section_id,code,title,body,severity,sort_order,active,updated_by) VALUES(?,?,?,?,?,?,?,?)`).bind(sectionId,slugify(`rule-${Date.now()}-${title}`),title,body,severity,sortOrder,bool01(b.active),admin.id).run();return json({ok:true});
}
async function adminTransferWindowSave(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'transfers'),b=await request.json(),id=asId(b.id),seasonId=asId(b.seasonId),name=cleanText(b.name,100),status=['DRAFT','OPEN','CLOSED'].includes(String(b.status||'').toUpperCase())?String(b.status).toUpperCase():'DRAFT';if(!seasonId||!name)return fail('Saison und Name sind erforderlich.');if(status==='OPEN')await db.prepare(`UPDATE transfer_windows SET status='CLOSED',updated_at=datetime('now') WHERE season_id=? AND status='OPEN' AND id<>COALESCE(?,0)`).bind(seasonId,id).run();if(id)await db.prepare(`UPDATE transfer_windows SET season_id=?,name=?,opens_at=?,closes_at=?,status=?,updated_at=datetime('now') WHERE id=?`).bind(seasonId,name,b.opensAt||null,b.closesAt||null,status,id).run();else await db.prepare(`INSERT INTO transfer_windows(season_id,name,opens_at,closes_at,status,created_by) VALUES(?,?,?,?,?,?)`).bind(seasonId,name,b.opensAt||null,b.closesAt||null,status,admin.id).run();return json({ok:true});
}

async function adminTransferSave(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'transfers'),b=await request.json(),userId=asId(b.userId),from=asId(b.fromClubId),to=asId(b.toClubId),type=['SIGNING','TRANSFER','RELEASE','LOAN'].includes(b.type)?b.type:null;if(!userId||!type)return fail('Spieler und Transfertyp sind erforderlich.');const player=await db.prepare(`SELECT u.id,u.username FROM users u WHERE u.id=?`).bind(userId).first();if(!player)return fail('Spieler nicht gefunden.',404);
  const active=await db.prepare(`SELECT cm.id,cm.club_id FROM club_members cm WHERE cm.user_id=? AND cm.left_at IS NULL LIMIT 1`).bind(userId).first();
  if(type==='RELEASE'){
    const source=from||active?.club_id;if(!source||!active||Number(active.club_id)!==Number(source))return fail('Der Spieler ist nicht im angegebenen Ausgangsclub.',409);await db.batch([db.prepare(`UPDATE club_members SET left_at=COALESCE(?,datetime('now')) WHERE id=?`).bind(b.occurredAt||null,active.id),db.prepare(`DELETE FROM club_staff_permissions WHERE club_id=? AND user_id=?`).bind(source,userId),db.prepare(`UPDATE profiles SET free_agent=1,updated_at=datetime('now') WHERE user_id=?`).bind(userId),db.prepare(`INSERT INTO transfers(user_id,from_club_id,to_club_id,type,occurred_at) VALUES(?,?,NULL,'RELEASE',COALESCE(?,datetime('now')))`).bind(userId,source,b.occurredAt||null)]);return json({ok:true,by:admin.username});
  }
  if(!to)return fail('Zielclub fehlt.');const roster=await activeRosterCount(db,to),ctx=await seasonContextForClub(db,to),limit=Number(ctx?.limits?.roster_limit||25);if(roster>=limit&&Number(active?.club_id)!==Number(to))return fail(`Der Zielkader ist voll (${roster}/${limit}).`,409);if(active&&Number(active.club_id)===Number(to))return fail('Spieler ist bereits im Zielclub.',409);
  const stmts=[];if(active){stmts.push(db.prepare(`UPDATE club_members SET left_at=COALESCE(?,datetime('now')) WHERE id=?`).bind(b.occurredAt||null,active.id));stmts.push(db.prepare(`DELETE FROM club_staff_permissions WHERE club_id=? AND user_id=?`).bind(active.club_id,userId));}
  stmts.push(db.prepare(`INSERT INTO club_members(club_id,user_id,role,joined_at,squad_status) VALUES(?,?,'PLAYER',COALESCE(?,datetime('now')),'SQUAD')`).bind(to,userId,b.occurredAt||null));stmts.push(db.prepare(`UPDATE profiles SET free_agent=0,updated_at=datetime('now') WHERE user_id=?`).bind(userId));stmts.push(db.prepare(`INSERT INTO transfers(user_id,from_club_id,to_club_id,type,occurred_at) VALUES(?,?,?,?,COALESCE(?,datetime('now')))`).bind(userId,active?.club_id||from||null,to,active?'TRANSFER':type,b.occurredAt||null));await db.batch(stmts);return json({ok:true,by:admin.username});
}

async function managerOverview(request,env){
  const db=requireDb(env),u=await requireUser(request,env);
  const club=await db.prepare(`SELECT DISTINCT c.*,d.name division_name,cd.bio,cd.discord,cd.tiktok,cd.twitch,cd.website,COALESCE(cw.balance,0) club_coins FROM clubs c LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN club_details cd ON cd.club_id=c.id LEFT JOIN club_coin_wallets cw ON cw.club_id=c.id LEFT JOIN club_members cm ON cm.club_id=c.id LEFT JOIN club_staff_permissions cp ON cp.club_id=c.id AND cp.user_id=? WHERE c.manager_user_id=? OR (cm.user_id=? AND cm.left_at IS NULL AND cm.role IN ('MANAGER','CO_MANAGER')) OR cp.can_manage_page=1 OR cp.can_submit_results=1 OR cp.can_manage_stats=1 OR cp.can_manage_roster=1 LIMIT 1`).bind(u.id,u.id,u.id).first();
  if(!club)return fail('Du verwaltest aktuell keinen Club.',403);
  const [squad,matches,applications,releaseRequests]=await Promise.all([
    db.prepare(`SELECT u.id,u.username,p.position,p.secondary_position,p.overall,p.avatar_key,p.country,cm.role,cm.shirt_number,cm.squad_status,COALESCE((SELECT SUM(ps.red_cards) FROM player_stats ps WHERE ps.user_id=u.id AND ps.club_id=cm.club_id),0) red_cards FROM club_members cm JOIN users u ON u.id=cm.user_id LEFT JOIN profiles p ON p.user_id=u.id WHERE cm.club_id=? AND cm.left_at IS NULL ORDER BY CASE cm.role WHEN 'MANAGER' THEN 0 WHEN 'CO_MANAGER' THEN 1 WHEN 'CAPTAIN' THEN 2 ELSE 3 END,u.username`).bind(club.id).all(),
    db.prepare(`SELECT m.*,h.name home_name,a.name away_name,mcs.result_submitted_at,mcs.stats_submitted_at,mcs.evidence_keep_until,(SELECT club_id FROM match_club_submissions sx WHERE sx.match_id=m.id AND sx.result_submitted_at IS NOT NULL ORDER BY sx.result_submitted_at DESC LIMIT 1) result_submitted_club_id FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id LEFT JOIN match_club_submissions mcs ON mcs.match_id=m.id AND mcs.club_id=? WHERE m.home_club_id=? OR m.away_club_id=? ORDER BY CASE WHEN m.scheduled_at='' THEN 0 ELSE 1 END ASC,m.matchday ASC,m.scheduled_at DESC LIMIT 100`).bind(club.id,club.id,club.id).all(),
    db.prepare(`SELECT a.id,a.status,a.message,a.created_at,u.username,p.position,p.overall FROM applications a JOIN users u ON u.id=a.user_id LEFT JOIN profiles p ON p.user_id=u.id WHERE a.club_id=? ORDER BY a.created_at DESC LIMIT 30`).bind(club.id).all(),
    db.prepare(`SELECT ct.id,ct.status,ct.player_accepted_at,ct.release_approved_at,ct.created_at,u.username player_name,nc.name new_club_name,nc.slug new_club_slug,ou.username offered_by_name FROM contracts ct JOIN users u ON u.id=ct.user_id JOIN clubs nc ON nc.id=ct.club_id LEFT JOIN users ou ON ou.id=ct.offered_by WHERE ct.source_club_id=? AND ct.release_required=1 AND ct.status='OFFERED' ORDER BY CASE WHEN ct.player_accepted_at IS NOT NULL THEN 0 ELSE 1 END,ct.created_at DESC`).bind(club.id).all()
  ]);
  await db.prepare(`INSERT OR IGNORE INTO club_shop_entitlements(club_id) VALUES(?)`).bind(club.id).run();const entitlements=await db.prepare(`SELECT transfer_credits,release_credits,red_card_removal_credits FROM club_shop_entitlements WHERE club_id=?`).bind(club.id).first();const ctx=await seasonContextForClub(db,club.id);const limits=ctx?.limits||{base_release_limit:5,releases_used:0,base_transfer_limit:5,transfers_used:0,roster_limit:25};
  return json({club,squad:squad.results||[],matches:matches.results||[],applications:applications.results||[],releaseRequests:releaseRequests.results||[],entitlements:entitlements||{transfer_credits:0,release_credits:0,red_card_removal_credits:0},season:ctx?.season||null,transferWindow:ctx?.window||null,limits:{...limits,rosterCount:(squad.results||[]).length}});
}
async function managerClubUpdate(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),clubId=asId(b.clubId);if(!clubId)return fail('Club fehlt.');if(!(await canClubPermission(db,u,clubId,'manage_page')))return fail('Keine Rechte für die Clubseite.',403);
  await db.prepare(`INSERT INTO club_details(club_id,bio,discord,tiktok,twitch,website,updated_at) VALUES(?,?,?,?,?,?,datetime('now')) ON CONFLICT(club_id) DO UPDATE SET bio=excluded.bio,discord=excluded.discord,tiktok=excluded.tiktok,twitch=excluded.twitch,website=excluded.website,updated_at=datetime('now')`).bind(clubId,cleanText(b.bio,1000),cleanText(b.discord,250),cleanText(b.tiktok,250),cleanText(b.twitch,250),cleanText(b.website,250)).run();return json({ok:true});
}
async function managerPlayerUpdate(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),clubId=asId(b.clubId),userId=asId(b.userId);
  if(!clubId||!userId)return fail('Club und Spieler fehlen.');
  if(!(await canClubPermission(db,u,clubId,'manage_roster')))return fail('Keine Kader-Rechte.',403);
  const club=await db.prepare('SELECT manager_user_id FROM clubs WHERE id=?').bind(clubId).first();if(!club)return fail('Club nicht gefunden.',404);
  const member=await db.prepare('SELECT id,role FROM club_members WHERE club_id=? AND user_id=? AND left_at IS NULL').bind(clubId,userId).first();if(!member)return fail('Spieler gehört nicht zum Club.',404);
  const positions=['ST','ZOM','ZM','ZDM','LM','RM','LV','RV','IV','TW'];
  const position=cleanText(b.position,8).toUpperCase(),secondary=cleanText(b.secondaryPosition,8).toUpperCase();
  if(!positions.includes(position))return fail('Ungültige Hauptposition.');
  if(secondary&&!positions.includes(secondary))return fail('Ungültige Nebenposition.');
  const shirt=Math.max(1,Math.min(99,Math.trunc(Number(b.shirtNumber)||1)));
  const squadStatus=['SQUAD','STARTER','BENCH','RESERVE'].includes(String(b.squadStatus||'').toUpperCase())?String(b.squadStatus).toUpperCase():'SQUAD';
  let role=['PLAYER','CAPTAIN','CO_MANAGER'].includes(String(b.clubRole||'').toUpperCase())?String(b.clubRole).toUpperCase():'PLAYER';
  if(Number(club.manager_user_id)===userId)role='MANAGER';
  const statements=[
    db.prepare(`UPDATE profiles SET position=?,secondary_position=?,updated_at=datetime('now') WHERE user_id=?`).bind(position,secondary,userId),
    db.prepare(`UPDATE club_members SET shirt_number=?,role=?,squad_status=? WHERE id=?`).bind(shirt,role,squadStatus,member.id)
  ];
  if(role==='CO_MANAGER'){
    statements.push(db.prepare(`INSERT INTO club_staff_permissions(club_id,user_id,can_manage_page,can_submit_results,can_manage_stats,can_manage_roster,assigned_by,updated_at) VALUES(?,?,?,?,?,?,?,datetime('now')) ON CONFLICT(club_id,user_id) DO UPDATE SET can_manage_page=1,can_submit_results=1,can_manage_stats=1,can_manage_roster=1,assigned_by=excluded.assigned_by,updated_at=datetime('now')`).bind(clubId,userId,1,1,1,1,u.id));
    statements.push(db.prepare(`UPDATE users SET role=CASE WHEN role='PLAYER' THEN 'MANAGER' ELSE role END,updated_at=datetime('now') WHERE id=?`).bind(userId));
  }else if(Number(club.manager_user_id)!==userId){
    statements.push(db.prepare('DELETE FROM club_staff_permissions WHERE club_id=? AND user_id=?').bind(clubId,userId));
  }
  await db.batch(statements);return json({ok:true});
}

async function managerPlayerRemove(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),clubId=asId(b.clubId),userId=asId(b.userId);
  if(!clubId||!userId)return fail('Club und Spieler fehlen.');if(!(await canClubPermission(db,u,clubId,'manage_roster')))return fail('Keine Kader-Rechte.',403);
  const club=await db.prepare('SELECT manager_user_id FROM clubs WHERE id=?').bind(clubId).first();if(!club)return fail('Club nicht gefunden.',404);if(Number(club.manager_user_id)===userId)return fail('Der Haupt-VM kann nicht über das Kader-Menü entfernt werden.',409);
  const member=await db.prepare('SELECT id FROM club_members WHERE club_id=? AND user_id=? AND left_at IS NULL').bind(clubId,userId).first();if(!member)return fail('Spieler gehört nicht zum Club.',404);
  const ctx=await seasonContextForClub(db,clubId),used=Number(ctx?.limits?.releases_used||0),base=Number(ctx?.limits?.base_release_limit||5);await consumeReleaseAllowance(db,clubId,ctx);
  await db.batch([db.prepare(`UPDATE club_members SET left_at=datetime('now') WHERE id=?`).bind(member.id),db.prepare('DELETE FROM club_staff_permissions WHERE club_id=? AND user_id=?').bind(clubId,userId),db.prepare(`UPDATE profiles SET free_agent=1,updated_at=datetime('now') WHERE user_id=?`).bind(userId),db.prepare(`INSERT INTO transfers(user_id,from_club_id,to_club_id,type,occurred_at) VALUES(?,?,NULL,'RELEASE',datetime('now'))`).bind(userId,clubId)]);
  const fresh=await seasonContextForClub(db,clubId),ent=await db.prepare(`SELECT release_credits FROM club_shop_entitlements WHERE club_id=?`).bind(clubId).first();return json({ok:true,seasonId:fresh?.season?.id||null,baseUsed:Number(fresh?.limits?.releases_used||Math.min(base,used+1)),baseLimit:Number(fresh?.limits?.base_release_limit||base),extraCredits:Number(ent?.release_credits||0)});
}

async function managerRemoveRedCard(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),clubId=asId(b.clubId),userId=asId(b.userId);if(!clubId||!userId)return fail('Club und Spieler fehlen.');if(!(await canClubPermission(db,u,clubId,'manage_roster')))return fail('Keine Kader-Rechte.',403);const member=await db.prepare(`SELECT 1 FROM club_members WHERE club_id=? AND user_id=? AND left_at IS NULL`).bind(clubId,userId).first();if(!member)return fail('Spieler gehört nicht zum Club.',404);await db.prepare(`INSERT OR IGNORE INTO club_shop_entitlements(club_id) VALUES(?)`).bind(clubId).run();const ent=await db.prepare(`SELECT red_card_removal_credits FROM club_shop_entitlements WHERE club_id=?`).bind(clubId).first();if(Number(ent?.red_card_removal_credits||0)<1)return fail('Kein Rote-Karte-entfernen-Credit verfügbar. Kaufe ihn im EPL Shop.',409);const stat=await db.prepare(`SELECT ps.match_id FROM player_stats ps JOIN matches m ON m.id=ps.match_id WHERE ps.user_id=? AND ps.club_id=? AND ps.red_cards>0 ORDER BY COALESCE(m.scheduled_at,m.created_at) DESC,ps.match_id DESC LIMIT 1`).bind(userId,clubId).first();if(!stat)return fail('Für diesen Spieler ist keine rote Karte gespeichert.',409);await db.batch([db.prepare(`UPDATE player_stats SET red_cards=MAX(0,red_cards-1) WHERE match_id=? AND user_id=?`).bind(stat.match_id,userId),db.prepare(`UPDATE club_shop_entitlements SET red_card_removal_credits=red_card_removal_credits-1,updated_at=datetime('now') WHERE club_id=?`).bind(clubId)]);return json({ok:true,matchId:stat.match_id});
}

async function managerApplicationAction(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),applicationId=asId(b.applicationId),action=cleanText(b.action,20).toUpperCase();
  if(!applicationId||!['ACCEPT','REJECT'].includes(action))return fail('Ungültige Bewerbungsaktion.');const app=await db.prepare('SELECT * FROM applications WHERE id=?').bind(applicationId).first();if(!app)return fail('Bewerbung nicht gefunden.',404);if(!(await canClubPermission(db,u,app.club_id,'manage_roster')))return fail('Keine Kader-Rechte.',403);if(app.status!=='OPEN')return fail('Diese Bewerbung wurde bereits bearbeitet.',409);
  if(action==='REJECT'){await db.prepare(`UPDATE applications SET status='REJECTED',updated_at=datetime('now') WHERE id=?`).bind(applicationId).run();return json({ok:true,status:'REJECTED'});}
  const other=await db.prepare('SELECT club_id FROM club_members WHERE user_id=? AND left_at IS NULL').bind(app.user_id).first();if(other)return fail('Der Spieler ist bereits Mitglied eines Clubs. Nutze für Clubwechsel das Vertrags-/Transfersystem.',409);
  const ctx=await seasonContextForClub(db,app.club_id);if(!ctx)return fail('Der Club ist aktuell keiner Saison zugeordnet.',409);const roster=await activeRosterCount(db,app.club_id),limit=Number(ctx.limits?.roster_limit||25);if(roster>=limit)return fail(`Der Kader ist voll (${roster}/${limit}).`,409);
  if(ctx.season.status==='ACTIVE'&&!ctx.window)return fail('Das Transferfenster ist geschlossen. Bewerbungen können während der aktiven Saison erst bei geöffnetem Transferfenster angenommen werden.',409);
  if(ctx.season.status==='ACTIVE')await consumeTransferAllowance(db,app.club_id,ctx);
  await db.batch([db.prepare(`UPDATE applications SET status='ACCEPTED',updated_at=datetime('now') WHERE id=?`).bind(applicationId),db.prepare(`INSERT INTO club_members(club_id,user_id,role,shirt_number,squad_status) VALUES(?,?,'PLAYER',NULL,'SQUAD')`).bind(app.club_id,app.user_id),db.prepare(`UPDATE profiles SET free_agent=0,updated_at=datetime('now') WHERE user_id=?`).bind(app.user_id),db.prepare(`INSERT INTO transfers(user_id,from_club_id,to_club_id,type,occurred_at) VALUES(?,NULL,?,'SIGNING',datetime('now'))`).bind(app.user_id,app.club_id)]);return json({ok:true,status:'ACCEPTED'});
}

async function managerMatchSchedule(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),matchId=asId(b.matchId),scheduled=cleanText(b.scheduledAt,40);if(!matchId||!scheduled)return fail('Datum und Startzeit fehlen.');
  const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(matchId).first();if(!m)return fail('Match nicht gefunden.',404);
  let clubId=null;if(await canClubPermission(db,u,m.home_club_id,'submit_results'))clubId=m.home_club_id;else if(await canClubPermission(db,u,m.away_club_id,'submit_results'))clubId=m.away_club_id;else return fail('Du darfst den Termin dieses Matches nicht setzen.',403);
  if(['CONFIRMED','CANCELLED'].includes(m.status))return fail('Der Termin eines abgeschlossenen Matches kann nicht mehr geändert werden.',409);
  await db.batch([
    db.prepare(`UPDATE matches SET scheduled_at=?,updated_at=datetime('now') WHERE id=?`).bind(scheduled,matchId),
    db.prepare(`INSERT INTO match_schedule_meta(match_id,scheduled_by,scheduled_updated_at,source) VALUES(?,?,datetime('now'),'VM') ON CONFLICT(match_id) DO UPDATE SET scheduled_by=excluded.scheduled_by,scheduled_updated_at=excluded.scheduled_updated_at`).bind(matchId,u.id)
  ]);return json({ok:true,clubId,scheduledAt:scheduled});
}
async function managerMatchStatsBatch(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),matchId=asId(b.matchId),rows=Array.isArray(b.stats)?b.stats:[];if(!matchId)return fail('Match fehlt.');const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(matchId).first();if(!m)return fail('Match nicht gefunden.',404);
  let clubId=null;if(await canClubPermission(db,u,m.home_club_id,'manage_stats'))clubId=m.home_club_id;else if(await canClubPermission(db,u,m.away_club_id,'manage_stats'))clubId=m.away_club_id;else return fail('Keine Statistik-Rechte für dieses Match.',403);
  if(rows.filter(x=>x&&x.played&&x.motm).length>1)return fail('Für deinen Club kann nur ein MOTM markiert werden.',409);
  await validateOfficialLineup(db,rows,clubId);
  const stmts=[];
  for(const row of rows){const userId=asId(row.userId);if(!userId)continue;const member=await db.prepare('SELECT 1 FROM club_members WHERE club_id=? AND user_id=? AND left_at IS NULL').bind(clubId,userId).first();if(!member)return fail('Ein ausgewählter Spieler gehört nicht zu deinem Club.',409);if(!row.played){stmts.push(db.prepare('DELETE FROM player_stats WHERE match_id=? AND user_id=?').bind(matchId,userId));continue;}stmts.push(db.prepare(`INSERT INTO player_stats(match_id,user_id,club_id,goals,assists,saves,clean_sheet,yellow_cards,red_cards,rating,motm) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(match_id,user_id) DO UPDATE SET club_id=excluded.club_id,goals=excluded.goals,assists=excluded.assists,saves=excluded.saves,clean_sheet=excluded.clean_sheet,yellow_cards=excluded.yellow_cards,red_cards=excluded.red_cards,rating=excluded.rating,motm=excluded.motm`).bind(matchId,userId,clubId,Math.max(0,Math.trunc(Number(row.goals)||0)),Math.max(0,Math.trunc(Number(row.assists)||0)),Math.max(0,Math.trunc(Number(row.saves)||0)),bool01(row.cleanSheet),Math.max(0,Math.min(2,Math.trunc(Number(row.yellowCards)||0))),Math.max(0,Math.min(1,Math.trunc(Number(row.redCards)||0))),Math.max(0,Math.min(10,Number(row.rating)||0)),bool01(row.motm)));}
  stmts.push(db.prepare(`INSERT INTO match_club_submissions(match_id,club_id,submitted_by,stats_submitted_at,evidence_keep_until,updated_at) VALUES(?,?,?,datetime('now'),datetime('now','+7 days'),datetime('now')) ON CONFLICT(match_id,club_id) DO UPDATE SET submitted_by=excluded.submitted_by,stats_submitted_at=excluded.stats_submitted_at,evidence_keep_until=datetime('now','+7 days'),updated_at=datetime('now')`).bind(matchId,clubId,u.id));
  for(let i=0;i<stmts.length;i+=40)await db.batch(stmts.slice(i,i+40));return json({ok:true,clubId});
}

async function managerMatchStats(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),matchId=asId(b.matchId),userId=asId(b.userId);if(!matchId||!userId)return fail('Match und Spieler fehlen.');const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(matchId).first();if(!m)return fail('Match nicht gefunden.',404);
  let clubId=null;if(await canClubPermission(db,u,m.home_club_id,'manage_stats'))clubId=m.home_club_id;else if(await canClubPermission(db,u,m.away_club_id,'manage_stats'))clubId=m.away_club_id;else return fail('Keine Statistik-Rechte für dieses Match.',403);
  const member=await db.prepare('SELECT 1 FROM club_members WHERE club_id=? AND user_id=? AND left_at IS NULL').bind(clubId,userId).first();if(!member)return fail('Spieler gehört nicht zum Club.',409);
  const goals=Math.max(0,Math.min(99,Math.trunc(Number(b.goals)||0))),assists=Math.max(0,Math.min(99,Math.trunc(Number(b.assists)||0))),saves=Math.max(0,Math.min(99,Math.trunc(Number(b.saves)||0))),rating=Math.max(0,Math.min(10,Number(b.rating)||0));
  await db.prepare(`INSERT INTO player_stats(match_id,user_id,club_id,goals,assists,saves,clean_sheet,yellow_cards,red_cards,rating,motm) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(match_id,user_id) DO UPDATE SET club_id=excluded.club_id,goals=excluded.goals,assists=excluded.assists,saves=excluded.saves,clean_sheet=excluded.clean_sheet,yellow_cards=excluded.yellow_cards,red_cards=excluded.red_cards,rating=excluded.rating,motm=excluded.motm`).bind(matchId,userId,clubId,goals,assists,saves,bool01(b.cleanSheet),Math.max(0,Math.min(2,Math.trunc(Number(b.yellowCards)||0))),Math.max(0,Math.min(1,Math.trunc(Number(b.redCards)||0))),rating,bool01(b.motm)).run();return json({ok:true});
}

async function giftCoins(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),amount=Math.trunc(Number(b.amount)),message=cleanText(b.message,240),source=String(b.source||'PLAYER').toUpperCase(),targetType=String(b.targetType||'PLAYER').toUpperCase();
  if(!Number.isInteger(amount)||amount<1||amount>10000)return fail('Geschenkbetrag muss zwischen 1 und 10.000 EPL Coins liegen.');
  if(!['PLAYER','CLUB'].includes(targetType)||!['PLAYER','CLUB'].includes(source))return fail('Ungültiges Geschenkziel.');
  let senderUserId=null,senderClubId=null,targetUserId=null,targetClubId=null,targetName='';
  if(source==='PLAYER')senderUserId=u.id;else{
    senderClubId=asId(b.sourceClubId);if(!senderClubId)return fail('Club fehlt.');if(!(await canClubPermission(db,u,senderClubId,'manage_roster')))return fail('Du darfst nicht über diese Clubkasse verfügen.',403);
  }
  if(targetType==='PLAYER'){
    if(b.targetUserId)targetUserId=asId(b.targetUserId);else{const t=await db.prepare('SELECT id,username FROM users WHERE username=? COLLATE NOCASE').bind(cleanText(b.targetUsername,24)).first();targetUserId=t?.id;targetName=t?.username||'';}
    if(!targetUserId)return fail('Empfänger nicht gefunden.',404);if(senderUserId&&Number(senderUserId)===Number(targetUserId))return fail('Du kannst dir nicht selbst Coins schenken.',409);
    if(!targetName){const t=await db.prepare('SELECT username FROM users WHERE id=?').bind(targetUserId).first();targetName=t?.username||'Spieler';}
  }else{
    if(b.targetClubId)targetClubId=asId(b.targetClubId);else{const c=await db.prepare('SELECT id,name FROM clubs WHERE slug=?').bind(cleanText(b.targetSlug,80)).first();targetClubId=c?.id;targetName=c?.name||'';}
    if(!targetClubId)return fail('Club nicht gefunden.',404);if(senderClubId&&Number(senderClubId)===Number(targetClubId))return fail('Der Club kann nicht an sich selbst schenken.',409);
    if(!targetName){const c=await db.prepare('SELECT name FROM clubs WHERE id=?').bind(targetClubId).first();targetName=c?.name||'Club';}
  }
  if(senderUserId){await db.prepare('INSERT OR IGNORE INTO coin_wallets(user_id,balance) VALUES(?,0)').bind(senderUserId).run();const w=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(senderUserId).first();if(Number(w?.balance||0)<amount)return fail('Nicht genügend EPL Coins.',409);}
  else{await db.prepare('INSERT OR IGNORE INTO club_coin_wallets(club_id,balance) VALUES(?,0)').bind(senderClubId).run();const w=await db.prepare('SELECT balance FROM club_coin_wallets WHERE club_id=?').bind(senderClubId).first();if(Number(w?.balance||0)<amount)return fail('Nicht genügend Coins in der Clubkasse.',409);}
  const stmts=[];
  if(senderUserId)stmts.push(db.prepare(`UPDATE coin_wallets SET balance=balance-?,lifetime_spent=lifetime_spent+?,updated_at=datetime('now') WHERE user_id=?`).bind(amount,amount,senderUserId));else stmts.push(db.prepare(`UPDATE club_coin_wallets SET balance=balance-?,lifetime_spent=lifetime_spent+?,updated_at=datetime('now') WHERE club_id=?`).bind(amount,amount,senderClubId));
  if(targetUserId){stmts.push(db.prepare(`INSERT INTO coin_wallets(user_id,balance,lifetime_earned,lifetime_spent,updated_at) VALUES(?,?,?,0,datetime('now')) ON CONFLICT(user_id) DO UPDATE SET balance=balance+excluded.balance,lifetime_earned=lifetime_earned+excluded.lifetime_earned,updated_at=datetime('now')`).bind(targetUserId,amount,amount));}
  else{stmts.push(db.prepare(`INSERT INTO club_coin_wallets(club_id,balance,lifetime_earned,lifetime_spent,updated_at) VALUES(?,?,?,0,datetime('now')) ON CONFLICT(club_id) DO UPDATE SET balance=balance+excluded.balance,lifetime_earned=lifetime_earned+excluded.lifetime_earned,updated_at=datetime('now')`).bind(targetClubId,amount,amount));}
  stmts.push(db.prepare(`INSERT INTO coin_gifts(sender_user_id,sender_club_id,recipient_user_id,recipient_club_id,amount,message) VALUES(?,?,?,?,?,?)`).bind(senderUserId,senderClubId,targetUserId,targetClubId,amount,message));
  await db.batch(stmts);return json({ok:true,amount,targetName});
}

async function awardMatchCoins(db,m){
  const stats=await db.prepare('SELECT user_id,club_id,goals,assists,saves,motm,clean_sheet FROM player_stats WHERE match_id=?').bind(m.id).all();
  const winner=m.home_score>m.away_score?m.home_club_id:m.away_score>m.home_score?m.away_club_id:null;
  for(const st of stats.results||[]){
    let amount=20,parts=['Einsatz +20'];
    if(winner&&st.club_id===winner){amount+=100;parts.push('Sieg +100');}
    if(Number(st.goals)>0){const v=Number(st.goals)*25;amount+=v;parts.push(`${st.goals} Tore +${v}`);}
    if(Number(st.assists)>0){const v=Number(st.assists)*15;amount+=v;parts.push(`${st.assists} Assists +${v}`);}
    if(Number(st.saves)>0){const v=Math.min(75,Number(st.saves)*5);amount+=v;parts.push(`${st.saves} Saves +${v}`);}
    if(st.clean_sheet){amount+=60;parts.push('Clean Sheet +60');}
    if(st.motm){amount+=100;parts.push('MOTM +100');}
    const exists=await db.prepare(`SELECT 1 FROM coin_transactions WHERE user_id=? AND type='PERFORMANCE' AND reference_type='MATCH' AND reference_id=?`).bind(st.user_id,String(m.id)).first();
    if(exists)continue;
    await db.batch([
      db.prepare(`INSERT INTO coin_wallets(user_id,balance,lifetime_earned,lifetime_spent,updated_at) VALUES(?,?,?,0,datetime('now')) ON CONFLICT(user_id) DO UPDATE SET balance=balance+excluded.balance,lifetime_earned=lifetime_earned+excluded.lifetime_earned,updated_at=datetime('now')`).bind(st.user_id,amount,amount),
      db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'PERFORMANCE','MATCH',?,?)`).bind(st.user_id,amount,String(m.id),parts.join(' • '))
    ]);
  }
  // Club treasury: every confirmed match adds participation coins, plus result and clean-sheet bonuses.
  for(const clubId of [m.home_club_id,m.away_club_id]){
    if(!clubId)continue;let amount=50,parts=['Matchteilnahme +50'];
    if(winner===clubId){amount+=100;parts.push('Sieg +100');}else if(!winner){amount+=50;parts.push('Unentschieden +50');}
    const clean=(clubId===m.home_club_id?Number(m.away_score)===0:Number(m.home_score)===0);if(clean){amount+=50;parts.push('Clean Sheet +50');}
    const exists=await db.prepare(`SELECT 1 FROM club_coin_transactions WHERE club_id=? AND type='PERFORMANCE' AND reference_type='MATCH' AND reference_id=?`).bind(clubId,String(m.id)).first();if(exists)continue;
    await db.batch([
      db.prepare(`INSERT OR IGNORE INTO club_coin_wallets(club_id,balance) VALUES(?,0)`).bind(clubId),
      db.prepare(`UPDATE club_coin_wallets SET balance=balance+?,lifetime_earned=lifetime_earned+?,updated_at=datetime('now') WHERE club_id=?`).bind(amount,amount,clubId),
      db.prepare(`INSERT INTO club_coin_transactions(club_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'PERFORMANCE','MATCH',?,?)`).bind(clubId,amount,String(m.id),parts.join(' • '))
    ]);
    await addClubReputation(db,clubId,winner===clubId?15:10,'MATCH','MATCH',String(m.id),winner===clubId?'Match gespielt + Sieg':'Match gespielt');
  }
}

// ============================================================
// EPL v10: manual TOTW, achievements, career, market values, daily hub
// ============================================================
function marketValueFromRow(r={}){
  if(r.market_value_override!=null && Number(r.market_value_override)>0)return Math.max(250000,Math.min(50000000,Math.round(Number(r.market_value_override)/10000)*10000));
  const matches=Number(r.matches||0),goals=Number(r.goals||0),assists=Number(r.assists||0),saves=Number(r.saves||0),clean=Number(r.clean_sheets||0),motm=Number(r.motm||0),rating=Number(r.avg_rating||0),form=Number(r.form_rating||0),totw=Number(r.totw_count||0),unlocks=Number(r.achievement_count||0),level=Number(r.division_level||0),gk=String(r.position||'').toUpperCase()==='TW';
  // EPL-only virtual market value. Deliberately NO age factor: performance, experience, league level and awards decide the value.
  let value=350000+Math.min(matches,300)*18000;
  if(rating>0)value+=Math.max(0,rating-6)*900000;
  if(form>0)value+=(form-6.5)*400000; // recent five-match form can raise or lower the value
  value+=gk?(saves*6000+clean*85000):(goals*55000+assists*40000);
  value+=motm*70000+Math.min(totw,7)*100000+Math.min(unlocks,10)*60000;
  const mult=level===1?1.25:level===2?1.12:level===3?1:level>3?.95:.92;
  value*=mult;return Math.max(250000,Math.min(50000000,Math.round(value/10000)*10000));
}
async function marketRowForUser(db,userId){
  return db.prepare(`SELECT u.id,u.username,p.position,p.avatar_key,p.overall,p.market_value_override,d.level division_level,c.name club_name,c.slug club_slug,
    COUNT(DISTINCT CASE WHEN m.status='CONFIRMED' THEN ps.match_id END) matches,
    COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.goals ELSE 0 END),0) goals,
    COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.assists ELSE 0 END),0) assists,
    COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.saves ELSE 0 END),0) saves,
    COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.clean_sheet ELSE 0 END),0) clean_sheets,
    COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.motm ELSE 0 END),0) motm,
    ROUND(AVG(CASE WHEN m.status='CONFIRMED' THEN ps.rating END),2) avg_rating,
    (SELECT ROUND(AVG(f.rating),2) FROM (SELECT ps2.rating FROM player_stats ps2 JOIN matches m2 ON m2.id=ps2.match_id WHERE ps2.user_id=u.id AND m2.status='CONFIRMED' ORDER BY COALESCE(NULLIF(m2.scheduled_at,''),m2.created_at) DESC,m2.id DESC LIMIT 5) f) form_rating,
    (SELECT COUNT(*) FROM totw_selections t WHERE t.user_id=u.id) totw_count,
    (SELECT COUNT(*) FROM player_achievement_unlocks au WHERE au.user_id=u.id) achievement_count
    FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id LEFT JOIN divisions d ON d.id=c.division_id
    LEFT JOIN player_stats ps ON ps.user_id=u.id LEFT JOIN matches m ON m.id=ps.match_id WHERE u.id=? GROUP BY u.id`).bind(userId).first();
}
async function achievementMetrics(db,userId){
  const agg=await db.prepare(`SELECT COUNT(DISTINCT ps.match_id) matches,COALESCE(SUM(ps.goals),0) goals,COALESCE(SUM(ps.assists),0) assists,COALESCE(SUM(ps.clean_sheet),0) clean_sheets FROM player_stats ps JOIN matches m ON m.id=ps.match_id WHERE ps.user_id=? AND m.status='CONFIRMED'`).bind(userId).first();
  const oneClub=await db.prepare(`SELECT MAX(cnt) value FROM (SELECT ps.club_id,COUNT(DISTINCT ps.match_id) cnt FROM player_stats ps JOIN matches m ON m.id=ps.match_id WHERE ps.user_id=? AND m.status='CONFIRMED' GROUP BY ps.club_id)`).bind(userId).first();
  const seasonsClub=await db.prepare(`SELECT MAX(cnt) value FROM (SELECT ps.club_id,COUNT(DISTINCT m.season_id) cnt FROM player_stats ps JOIN matches m ON m.id=ps.match_id WHERE ps.user_id=? AND m.status='CONFIRMED' GROUP BY ps.club_id)`).bind(userId).first();
  const rival=await db.prepare(`SELECT MAX(g) value FROM (SELECT CASE WHEN m.home_club_id=ps.club_id THEN m.away_club_id ELSE m.home_club_id END opponent,SUM(ps.goals) g FROM player_stats ps JOIN matches m ON m.id=ps.match_id WHERE ps.user_id=? AND m.status='CONFIRMED' GROUP BY opponent)`).bind(userId).first();
  const games=(await db.prepare(`SELECT ps.club_id,m.home_club_id,m.away_club_id,m.home_score,m.away_score FROM player_stats ps JOIN matches m ON m.id=ps.match_id WHERE ps.user_id=? AND m.status='CONFIRMED' ORDER BY COALESCE(NULLIF(m.scheduled_at,''),m.created_at),m.id`).bind(userId).all()).results||[];
  let streak=0,best=0;for(const g of games){const own=Number(g.club_id)===Number(g.home_club_id)?Number(g.home_score):Number(g.away_score),opp=Number(g.club_id)===Number(g.home_club_id)?Number(g.away_score):Number(g.home_score);if(own>=opp){streak++;best=Math.max(best,streak)}else streak=0;}
  const top=await db.prepare(`WITH totals AS (SELECT m.season_id,ps.user_id,SUM(ps.goals) goals FROM player_stats ps JOIN matches m ON m.id=ps.match_id JOIN seasons s ON s.id=m.season_id WHERE m.status='CONFIRMED' AND s.status='FINISHED' GROUP BY m.season_id,ps.user_id), mx AS (SELECT season_id,MAX(goals) max_goals FROM totals GROUP BY season_id) SELECT COUNT(*) value FROM totals t JOIN mx ON mx.season_id=t.season_id AND mx.max_goals=t.goals WHERE t.user_id=? AND t.goals>0`).bind(userId).first();
  return {GOALS_TOTAL:Number(agg?.goals||0),ASSISTS_TOTAL:Number(agg?.assists||0),CLEAN_SHEETS:Number(agg?.clean_sheets||0),MATCHES_TOTAL:Number(agg?.matches||0),MATCHES_ONE_CLUB:Number(oneClub?.value||0),SEASONS_SAME_CLUB:Number(seasonsClub?.value||0),UNBEATEN_STREAK:best,GOALS_VS_RIVAL:Number(rival?.value||0),TOP_SCORER:Number(top?.value||0)};
}
async function evaluateAchievements(db,userId){
  const defs=(await db.prepare(`SELECT * FROM achievement_definitions WHERE active=1 ORDER BY sort_order,id`).all()).results||[],metrics=await achievementMetrics(db,userId),existing=new Set(((await db.prepare(`SELECT achievement_id FROM player_achievement_unlocks WHERE user_id=?`).bind(userId).all()).results||[]).map(x=>Number(x.achievement_id))),unlocked=[];
  for(const d of defs){const progress=Number(metrics[d.metric]||0);if(progress>=Number(d.target_value)&&!existing.has(Number(d.id))){await db.prepare(`INSERT OR IGNORE INTO player_achievement_unlocks(user_id,achievement_id) VALUES(?,?)`).bind(userId,d.id).run();await notifyUser(db,userId,'ACHIEVEMENT',`Achievement freigeschaltet: ${d.title}`,d.description,'/erfolge');unlocked.push(d.id);}}
  return {defs,metrics,unlocked};
}
async function achievementView(db,userId){
  const ev=await evaluateAchievements(db,userId),unlocks=(await db.prepare(`SELECT achievement_id,unlocked_at FROM player_achievement_unlocks WHERE user_id=?`).bind(userId).all()).results||[],map=new Map(unlocks.map(x=>[Number(x.achievement_id),x.unlocked_at]));
  return ev.defs.map(d=>({...d,progress:Number(ev.metrics[d.metric]||0),unlocked:map.has(Number(d.id)),unlocked_at:map.get(Number(d.id))||null}));
}
async function getAchievementsOverview(request,env){
  const db=requireDb(env),viewer=await currentUser(request,env),url=new URL(request.url),username=cleanText(url.searchParams.get('username')||viewer?.username||'',40);if(!username)return fail('Bitte anmelden oder einen Benutzernamen angeben.',401);
  const u=await db.prepare(`SELECT id,username FROM users WHERE lower(username)=lower(?)`).bind(username).first();if(!u)return fail('Spieler nicht gefunden.',404);
  const [achievements,manual,trophies,catalog,totw]=await Promise.all([achievementView(db,u.id),db.prepare(`SELECT id,title,subtitle,icon_key,awarded_at FROM player_achievements WHERE user_id=? ORDER BY awarded_at DESC`).bind(u.id).all(),db.prepare(`SELECT t.id,t.name,t.icon_key,t.type,ut.quantity,ut.awarded_at FROM user_trophies ut JOIN trophies t ON t.id=ut.trophy_id WHERE ut.user_id=? ORDER BY ut.awarded_at DESC`).bind(u.id).all(),db.prepare(`SELECT id,name,icon_key,type FROM trophies ORDER BY type,name`).all(),db.prepare(`SELECT COUNT(*) count FROM totw_selections WHERE user_id=?`).bind(u.id).first()]);
  return json({player:u,achievements,manual:manual.results||[],trophies:trophies.results||[],trophyCatalog:catalog.results||[],totwCount:Number(totw?.count||0)});
}
async function careerForUser(db,userId){
  const seasons=(await db.prepare(`SELECT s.id season_id,s.name season_name,c.id club_id,c.name club_name,c.slug club_slug,d.name division_name,p.position,
    COUNT(DISTINCT ps.match_id) matches,COALESCE(SUM(ps.goals),0) goals,COALESCE(SUM(ps.assists),0) assists,COALESCE(SUM(ps.saves),0) saves,COALESCE(SUM(ps.clean_sheet),0) clean_sheets,COALESCE(SUM(ps.motm),0) motm,ROUND(AVG(ps.rating),2) rating
    FROM player_stats ps JOIN matches m ON m.id=ps.match_id JOIN seasons s ON s.id=m.season_id JOIN clubs c ON c.id=ps.club_id LEFT JOIN divisions d ON d.id=m.division_id LEFT JOIN profiles p ON p.user_id=ps.user_id
    WHERE ps.user_id=? AND m.status='CONFIRMED' GROUP BY s.id,c.id ORDER BY s.id DESC`).bind(userId).all()).results||[];
  const clubs=(await db.prepare(`SELECT c.name,c.slug,cm.role,cm.joined_at,cm.left_at FROM club_members cm JOIN clubs c ON c.id=cm.club_id WHERE cm.user_id=? ORDER BY cm.joined_at DESC`).bind(userId).all()).results||[];
  const transfers=(await db.prepare(`SELECT t.type,t.occurred_at,fc.name from_club,tc.name to_club FROM transfers t LEFT JOIN clubs fc ON fc.id=t.from_club_id LEFT JOIN clubs tc ON tc.id=t.to_club_id WHERE t.user_id=? ORDER BY t.occurred_at DESC`).bind(userId).all()).results||[];
  return {seasons,clubs,transfers};
}
async function getMarketValues(request,env){
  const db=requireDb(env),url=new URL(request.url),username=cleanText(url.searchParams.get('username')||'',40);
  const rows=(await db.prepare(`SELECT u.id,u.username,p.position,p.avatar_key,p.overall,p.market_value_override,d.level division_level,c.name club_name,c.slug club_slug,
    COUNT(DISTINCT CASE WHEN m.status='CONFIRMED' THEN ps.match_id END) matches,COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.goals ELSE 0 END),0) goals,COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.assists ELSE 0 END),0) assists,COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.saves ELSE 0 END),0) saves,COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.clean_sheet ELSE 0 END),0) clean_sheets,COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.motm ELSE 0 END),0) motm,ROUND(AVG(CASE WHEN m.status='CONFIRMED' THEN ps.rating END),2) avg_rating,(SELECT ROUND(AVG(f.rating),2) FROM (SELECT ps2.rating FROM player_stats ps2 JOIN matches m2 ON m2.id=ps2.match_id WHERE ps2.user_id=u.id AND m2.status='CONFIRMED' ORDER BY COALESCE(NULLIF(m2.scheduled_at,''),m2.created_at) DESC,m2.id DESC LIMIT 5) f) form_rating,(SELECT COUNT(*) FROM totw_selections t WHERE t.user_id=u.id) totw_count,(SELECT COUNT(*) FROM player_achievement_unlocks au WHERE au.user_id=u.id) achievement_count
    FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN player_stats ps ON ps.user_id=u.id LEFT JOIN matches m ON m.id=ps.match_id WHERE u.status='ACTIVE' AND (?='' OR lower(u.username)=lower(?)) GROUP BY u.id ORDER BY u.username`).bind(username,username).all()).results||[];
  const valued=rows.map(r=>({...r,market_value:marketValueFromRow(r)})).sort((a,b)=>b.market_value-a.market_value);return json({players:valued.slice(0,username?1:200)});
}
async function getDailyHub(request,env){
  const db=requireDb(env),u=await requireUser(request,env);await evaluateAchievements(db,u.id);
  const club=await db.prepare(`SELECT c.id,c.name,c.slug,d.id division_id,d.name division_name,d.season_id FROM club_members cm JOIN clubs c ON c.id=cm.club_id LEFT JOIN divisions d ON d.id=c.division_id WHERE cm.user_id=? AND cm.left_at IS NULL LIMIT 1`).bind(u.id).first();
  const upcoming=club?await db.prepare(`SELECT m.id,m.scheduled_at,m.matchday,h.name home_name,a.name away_name,d.name division_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id LEFT JOIN divisions d ON d.id=m.division_id WHERE (m.home_club_id=? OR m.away_club_id=?) AND m.status='SCHEDULED' ORDER BY CASE WHEN m.scheduled_at='' THEN 1 ELSE 0 END,m.scheduled_at,m.matchday LIMIT 1`).bind(club.id,club.id).first():null;
  const [unread,msgs,wallet,latestUnlocks,market]=await Promise.all([db.prepare(`SELECT COUNT(*) count FROM notifications WHERE user_id=? AND read_at IS NULL`).bind(u.id).first(),db.prepare(`SELECT COUNT(*) count FROM direct_messages dm JOIN conversations c ON c.id=dm.conversation_id WHERE (c.user_a=? OR c.user_b=?) AND dm.sender_user_id<>? AND dm.read_at IS NULL AND dm.deleted_at IS NULL`).bind(u.id,u.id,u.id).first(),db.prepare(`SELECT balance FROM coin_wallets WHERE user_id=?`).bind(u.id).first(),db.prepare(`SELECT ad.title,ad.asset_key,pau.unlocked_at FROM player_achievement_unlocks pau JOIN achievement_definitions ad ON ad.id=pau.achievement_id WHERE pau.user_id=? ORDER BY pau.unlocked_at DESC LIMIT 3`).bind(u.id).all(),marketRowForUser(db,u.id)]);
  const totw=await db.prepare(`SELECT matchday,expires_at FROM totw_selections WHERE user_id=? AND expires_at>datetime('now') ORDER BY expires_at DESC LIMIT 1`).bind(u.id).first();
  let clubStanding=null;if(club?.division_id&&club?.season_id){clubStanding=await db.prepare(`WITH memberships AS (SELECT season_id,division_id,club_id,points_adjustment FROM season_clubs WHERE season_id=? AND division_id=? UNION SELECT d.season_id,d.id,c.id,0 FROM clubs c JOIN divisions d ON d.id=c.division_id WHERE d.season_id=? AND d.id=? AND NOT EXISTS(SELECT 1 FROM season_clubs sc WHERE sc.season_id=d.season_id AND sc.club_id=c.id)), stats AS (SELECT mem.club_id,COUNT(m.id) played,SUM(CASE WHEN (m.home_club_id=mem.club_id AND m.home_score>m.away_score) OR (m.away_club_id=mem.club_id AND m.away_score>m.home_score) THEN 1 ELSE 0 END) wins,SUM(CASE WHEN m.id IS NOT NULL AND m.home_score=m.away_score THEN 1 ELSE 0 END) draws,SUM(CASE WHEN m.home_club_id=mem.club_id THEN m.home_score WHEN m.away_club_id=mem.club_id THEN m.away_score ELSE 0 END) gf,SUM(CASE WHEN m.home_club_id=mem.club_id THEN m.away_score WHEN m.away_club_id=mem.club_id THEN m.home_score ELSE 0 END) ga FROM memberships mem LEFT JOIN matches m ON m.season_id=? AND m.division_id=? AND (m.home_club_id=mem.club_id OR m.away_club_id=mem.club_id) AND m.status='CONFIRMED' GROUP BY mem.club_id), ranked AS (SELECT mem.club_id,COALESCE(st.played,0) played,COALESCE(st.wins,0) wins,COALESCE(st.draws,0) draws,COALESCE(st.gf,0) gf,COALESCE(st.ga,0) ga,(COALESCE(st.wins,0)*3+COALESCE(st.draws,0)+COALESCE(mem.points_adjustment,0)) points,ROW_NUMBER() OVER(ORDER BY (COALESCE(st.wins,0)*3+COALESCE(st.draws,0)+COALESCE(mem.points_adjustment,0)) DESC,(COALESCE(st.gf,0)-COALESCE(st.ga,0)) DESC,COALESCE(st.gf,0) DESC,c.name) position,COUNT(*) OVER() total_clubs FROM memberships mem JOIN clubs c ON c.id=mem.club_id LEFT JOIN stats st ON st.club_id=mem.club_id) SELECT * FROM ranked WHERE club_id=?`).bind(club.season_id,club.division_id,club.season_id,club.division_id,club.season_id,club.division_id,club.id).first();}
  return json({user:{id:u.id,username:u.username,coins:Number(wallet?.balance||0)},club,clubStanding,upcoming,unreadNotifications:Number(unread?.count||0),unreadMessages:Number(msgs?.count||0),marketValue:market?marketValueFromRow(market):250000,totw,latestAchievements:latestUnlocks.results||[]});
}
async function adminTotwOverview(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'matches');
  const [seasons,divisions,players,selections]=await Promise.all([db.prepare(`SELECT id,name,status FROM seasons ORDER BY id DESC`).all(),db.prepare(`SELECT d.id,d.name,d.level,d.season_id,s.name season_name FROM divisions d JOIN seasons s ON s.id=d.season_id ORDER BY s.id DESC,d.level`).all(),db.prepare(`SELECT u.id,u.username,p.position,p.avatar_key,c.name club_name,c.division_id,d.name division_name,COUNT(DISTINCT CASE WHEN m.status='CONFIRMED' THEN ps.match_id END) matches,COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.goals ELSE 0 END),0) goals,COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.assists ELSE 0 END),0) assists,COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.saves ELSE 0 END),0) saves,COALESCE(SUM(CASE WHEN m.status='CONFIRMED' THEN ps.clean_sheet ELSE 0 END),0) clean_sheets,ROUND(AVG(CASE WHEN m.status='CONFIRMED' THEN ps.rating END),2) rating FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN player_stats ps ON ps.user_id=u.id LEFT JOIN matches m ON m.id=ps.match_id WHERE u.status='ACTIVE' GROUP BY u.id ORDER BY c.name,u.username`).all(),db.prepare(`SELECT t.*,u.username,p.position,c.name club_name,s.name season_name,d.name division_name,au.username selected_by_name FROM totw_selections t JOIN users u ON u.id=t.user_id LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id JOIN seasons s ON s.id=t.season_id LEFT JOIN divisions d ON d.id=t.division_id JOIN users au ON au.id=t.selected_by ORDER BY t.selected_at DESC LIMIT 100`).all()]);
  return json({seasons:seasons.results||[],divisions:divisions.results||[],players:players.results||[],selections:selections.results||[],frameAsset:'/assets/totw/SpielerDerWocheRahmen.png'});
}
async function adminTotwCandidates(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'matches');const url=new URL(request.url),seasonId=asId(url.searchParams.get('seasonId')),divisionId=url.searchParams.get('divisionId')?asId(url.searchParams.get('divisionId')):null,matchday=Math.max(1,Math.min(99,Number(url.searchParams.get('matchday')||1)));if(!seasonId)return fail('Saison fehlt.');
  const rows=await db.prepare(`SELECT u.id,u.username,p.position,p.avatar_key,c.id club_id,c.name club_name,d.name division_name,
    COUNT(DISTINCT ps.match_id) matches,COALESCE(SUM(ps.goals),0) goals,COALESCE(SUM(ps.assists),0) assists,COALESCE(SUM(ps.saves),0) saves,COALESCE(SUM(ps.clean_sheet),0) clean_sheets,COALESCE(SUM(ps.motm),0) motm,ROUND(AVG(ps.rating),2) rating
    FROM player_stats ps JOIN matches m ON m.id=ps.match_id JOIN users u ON u.id=ps.user_id LEFT JOIN profiles p ON p.user_id=u.id JOIN clubs c ON c.id=ps.club_id LEFT JOIN divisions d ON d.id=m.division_id
    WHERE m.season_id=? AND m.matchday=? AND m.status='CONFIRMED' AND (? IS NULL OR m.division_id=?) GROUP BY u.id,c.id ORDER BY CASE WHEN p.position='TW' THEN COALESCE(SUM(ps.saves),0) ELSE COALESCE(SUM(ps.goals),0)+COALESCE(SUM(ps.assists),0) END DESC,AVG(ps.rating) DESC,u.username`).bind(seasonId,matchday,divisionId,divisionId).all();
  return json({players:rows.results||[],seasonId,divisionId,matchday});
}

async function adminTotwAward(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'matches'),b=await request.json(),seasonId=asId(b.seasonId),divisionId=b.divisionId?asId(b.divisionId):null,matchday=Math.max(1,Math.min(99,Number(b.matchday||1))),userId=asId(b.userId),slot=cleanText(b.slotLabel,20)||'TOTW';if(!seasonId||!userId)return fail('Saison und Spieler sind erforderlich.');
  const user=await db.prepare(`SELECT u.id,u.username,c.division_id FROM users u LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id WHERE u.id=? AND u.status='ACTIVE'`).bind(userId).first();if(!user)return fail('Spieler nicht gefunden.',404);if(divisionId&&Number(user.division_id)!==Number(divisionId))return fail('Der Spieler gehört aktuell nicht zu dieser Liga.',409);const divOk=divisionId?await db.prepare(`SELECT id FROM divisions WHERE id=? AND season_id=?`).bind(divisionId,seasonId).first():true;if(!divOk)return fail('Liga gehört nicht zur gewählten Saison.',409);
  const played=await db.prepare(`SELECT 1 FROM player_stats ps JOIN matches m ON m.id=ps.match_id WHERE ps.user_id=? AND m.season_id=? AND m.matchday=? AND m.status='CONFIRMED' AND (? IS NULL OR m.division_id=?) LIMIT 1`).bind(userId,seasonId,matchday,divisionId,divisionId).first();if(!played)return fail('TOTW kann nur an Spieler vergeben werden, die in einem bestätigten Match dieses Spieltags Statistiken besitzen.',409);
  const count=await db.prepare(`SELECT COUNT(*) count FROM totw_selections WHERE season_id=? AND COALESCE(division_id,0)=COALESCE(?,0) AND matchday=?`).bind(seasonId,divisionId,matchday).first();if(Number(count?.count||0)>=11)return fail('Für diesen Spieltag wurden bereits 11 TOTW-Spieler ausgewählt.',409);
  const exists=await db.prepare(`SELECT id FROM totw_selections WHERE season_id=? AND COALESCE(division_id,0)=COALESCE(?,0) AND matchday=? AND user_id=?`).bind(seasonId,divisionId,matchday,userId).first();if(exists)return fail('Dieser Spieler ist bereits im TOTW dieses Spieltags.',409);
  const txRef=`${seasonId}:${divisionId||0}:${matchday}:${userId}`;await db.batch([db.prepare(`INSERT INTO totw_selections(season_id,division_id,matchday,user_id,slot_label,selected_by,expires_at,coins_awarded) VALUES(?,?,?,?,?,?,datetime('now','+7 days'),250)`).bind(seasonId,divisionId,matchday,userId,slot,admin.id),db.prepare(`INSERT OR IGNORE INTO coin_wallets(user_id,balance) VALUES(?,0)`).bind(userId),db.prepare(`UPDATE coin_wallets SET balance=balance+250,lifetime_earned=lifetime_earned+250,updated_at=datetime('now') WHERE user_id=?`).bind(userId),db.prepare(`INSERT OR IGNORE INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,250,'ADMIN_ADJUSTMENT','TOTW',?,'EPL Team of the Week – 250 Coins')`).bind(userId,txRef),db.prepare(`INSERT INTO player_achievements(user_id,title,subtitle,icon_key) VALUES(?,?,?,?)`).bind(userId,'EPL Team of the Week',`Spieltag ${matchday} • ${slot}`,'/assets/totw/SpielerDerWocheRahmen.png')]);await notifyUser(db,userId,'TOTW','Du bist im EPL Team of the Week!',`Du erhältst 250 EPL Coins und kannst den exklusiven TOTW-Profilbildrahmen 7 Tage lang ausrüsten.`,'/spieler/'+user.username.toLowerCase());return json({ok:true,username:user.username,expiresInDays:7,coins:250});
}

async function eaClubInfo(request,env){const u=new URL(request.url),clubId=(u.searchParams.get('clubId')||'').trim(),platform=(u.searchParams.get('platform')||'common-gen5').trim();if(!/^\d{1,12}$/.test(clubId))return fail('Ungültige EA Club ID.');if(!['common-gen5','common-gen4'].includes(platform))return fail('Ungültige Plattform.');const target=`https://proclubs.ea.com/api/fc/clubs/info?platform=${encodeURIComponent(platform)}&clubIds=${encodeURIComponent(clubId)}`;const res=await fetch(target,{headers:{accept:'application/json','user-agent':'EPL-Elite-Pro-League/1.0'},signal:AbortSignal.timeout(9000)});if(!res.ok)return fail(`EA Clubs antwortet mit HTTP ${res.status}.`,502);const data=await res.json();return json({provider:'EA Clubs',clubId,platform,data});}
async function getProfile(slug,request,env){
  const db=requireDb(env),viewer=await currentUser(request,env);
  const p=await db.prepare(`SELECT u.id,u.username,u.role,p.*,COALESCE(po.shirt_number,0) shirt_number,COALESCE(w.balance,0) coins,
    CASE WHEN p.last_seen_at>=datetime('now','-7 minutes') THEN 1 ELSE 0 END is_online,
    (SELECT COUNT(*) FROM follows WHERE followed_user_id=u.id) followers,
    (SELECT COUNT(*) FROM follows WHERE follower_user_id=u.id) following,
    c.id club_id,c.name club,c.slug club_slug,cm.role club_role
    FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN profile_onboarding po ON po.user_id=u.id LEFT JOIN coin_wallets w ON w.user_id=u.id
    LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id
    WHERE lower(u.username)=?`).bind(slug.toLowerCase()).first();
  if(!p)return fail('Spieler nicht gefunden.',404);
  const activeTotw=await db.prepare(`SELECT id,matchday,slot_label,expires_at FROM totw_selections WHERE user_id=? AND expires_at>datetime('now') ORDER BY expires_at DESC LIMIT 1`).bind(p.id).first();
  p.totw_frame_active=!!activeTotw;p.totw_frame_expires_at=activeTotw?.expires_at||null;p.totw_matchday=activeTotw?.matchday||null;
  if(!activeTotw&&Number(p.use_totw_frame)){await db.prepare(`UPDATE profiles SET use_totw_frame=0 WHERE user_id=?`).bind(p.id).run();p.use_totw_frame=0;}
  p.profile_likes=0;p.viewer_liked=false;
  const [stats,posts,recentMatches,achievements,clubHistory,badges]=await Promise.all([
    db.prepare(`SELECT COUNT(*) matches,COALESCE(SUM(goals),0) goals,COALESCE(SUM(assists),0) assists,ROUND(AVG(rating),2) rating,
      COALESCE(SUM(saves),0) saves,COALESCE(SUM(clean_sheet),0) clean_sheets,COALESCE(SUM(motm),0) motm,
      COALESCE(SUM(yellow_cards),0) yellow_cards,COALESCE(SUM(red_cards),0) red_cards FROM player_stats WHERE user_id=?`).bind(p.id).first(),
    db.prepare(`SELECT p.id,p.body,p.media_key,p.created_at,((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id)+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id)) reactions,
      ((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.reaction='LIKE')+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id AND cpr.reaction='LIKE')) likes,
      ((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.reaction='FIRE')+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id AND cpr.reaction='FIRE')) fires,
      ((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.reaction='CLAP')+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id AND cpr.reaction='CLAP')) claps,
      ((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.reaction='GOAL')+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id AND cpr.reaction='GOAL')) goals,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) comments FROM posts p WHERE p.author_user_id=? ORDER BY p.created_at DESC LIMIT 30`).bind(p.id).all(),
    db.prepare(`SELECT m.id,m.scheduled_at,m.home_score,m.away_score,m.status,h.name home_name,a.name away_name,ps.goals,ps.assists,ps.saves,ps.clean_sheet,ps.rating,ps.motm
      FROM player_stats ps JOIN matches m ON m.id=ps.match_id JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id
      WHERE ps.user_id=? ORDER BY m.scheduled_at DESC LIMIT 20`).bind(p.id).all(),
    db.prepare(`SELECT id,title,subtitle,icon_key,awarded_at FROM player_achievements WHERE user_id=? ORDER BY awarded_at DESC LIMIT 20`).bind(p.id).all(),
    db.prepare(`SELECT c.name,c.slug,cm.role,cm.joined_at,cm.left_at FROM club_members cm JOIN clubs c ON c.id=cm.club_id WHERE cm.user_id=? ORDER BY cm.joined_at DESC`).bind(p.id).all(),
    db.prepare(`SELECT si.id,si.name,si.description,si.asset_key,si.rarity FROM user_inventory ui JOIN shop_items si ON si.id=ui.item_id WHERE ui.user_id=? AND si.category='BADGE' AND si.item_type='BADGE' ORDER BY ui.acquired_at DESC LIMIT 8`).bind(p.id).all()
  ]);
  let inventory=[];
  if(viewer?.id===p.id){const inv=await db.prepare(`SELECT si.id,si.name,si.category,si.description,si.rarity,si.asset_key,si.price_coins,si.price_eur_cents,si.shop_group,si.item_type,si.style_key,si.style_value,ui.acquired_at FROM user_inventory ui JOIN shop_items si ON si.id=ui.item_id WHERE ui.user_id=? ORDER BY ui.acquired_at DESC`).bind(p.id).all();inventory=inv.results||[];}
  const [achievementProgress,career,marketRow,trophyRows,marketHistoryRows]=await Promise.all([achievementView(db,p.id),careerForUser(db,p.id),marketRowForUser(db,p.id),db.prepare(`SELECT t.id,t.name title,('x'||ut.quantity) subtitle,t.icon_key,t.type award_type,ut.quantity,ut.awarded_at FROM user_trophies ut JOIN trophies t ON t.id=ut.trophy_id WHERE ut.user_id=? ORDER BY ut.awarded_at DESC`).bind(p.id).all(),db.prepare(`SELECT value_eur,reason,created_at FROM market_value_snapshots WHERE user_id=? ORDER BY id DESC LIMIT 12`).bind(p.id).all()]);
  const unlockedAuto=achievementProgress.filter(x=>x.unlocked).map(x=>({id:`achievement-${x.id}`,title:x.title,subtitle:x.description,icon_key:x.asset_key,awarded_at:x.unlocked_at,category:x.category}));
  const totwHistory=await db.prepare(`SELECT COUNT(*) count,MAX(selected_at) awarded_at FROM totw_selections WHERE user_id=?`).bind(p.id).first();
  const totwAwards=Number(totwHistory?.count||0)>0?[{id:'totw-history',title:'EPL Team of the Week',subtitle:`x${Number(totwHistory.count)}`,icon_key:'/assets/totw/SpielerDerWocheRahmen.png',quantity:Number(totwHistory.count),award_type:'TOTW',awarded_at:totwHistory.awarded_at}]:[];
  p.market_value=marketRow?marketValueFromRow(marketRow):250000;
  return json({profile:p,stats:stats||{},posts:posts.results||[],recentMatches:recentMatches.results||[],achievements:[...totwAwards,...(trophyRows.results||[]),...unlockedAuto,...(achievements.results||[])],achievementProgress,career,marketHistory:marketHistoryRows.results||[],clubHistory:clubHistory.results||[],inventory,badges:badges.results||[]});
}
async function getClub(slug,request,env){
  const db=requireDb(env),viewer=await currentUser(request,env);
  const c=await db.prepare(`SELECT c.*,u.username manager_username,d.name division_name,cd.bio,cd.discord,cd.tiktok,cd.twitch,cd.website
    FROM clubs c LEFT JOIN users u ON u.id=c.manager_user_id LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN club_details cd ON cd.club_id=c.id WHERE c.slug=?`).bind(slug).first();
  if(!c)return fail('Club nicht gefunden.',404);
  const likeCount=await db.prepare('SELECT COUNT(*) count FROM club_likes WHERE club_id=?').bind(c.id).first();
  c.profile_likes=likeCount?.count||0;c.viewer_liked=viewer?!!(await db.prepare('SELECT 1 FROM club_likes WHERE user_id=? AND club_id=?').bind(viewer.id,c.id).first()):false;
  const [squad,posts,recentMatches,upcomingMatches,transfers,achievements,topPlayers]=await Promise.all([
    db.prepare(`SELECT u.id,u.username,cm.role,COALESCE(cm.shirt_number,po.shirt_number) shirt_number,p.position,p.overall,p.avatar_key,p.country,CASE WHEN p.last_seen_at>=datetime('now','-7 minutes') THEN 1 ELSE 0 END is_online
      FROM club_members cm JOIN users u ON u.id=cm.user_id LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN profile_onboarding po ON po.user_id=u.id
      WHERE cm.club_id=? AND cm.left_at IS NULL ORDER BY CASE cm.role WHEN 'MANAGER' THEN 0 WHEN 'CO_MANAGER' THEN 1 WHEN 'CAPTAIN' THEN 2 ELSE 3 END,u.username`).bind(c.id).all(),
    db.prepare(`SELECT p.id,p.body,p.media_key,p.created_at,((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id)+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id)) reactions,((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.reaction='LIKE')+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id AND cpr.reaction='LIKE')) likes,((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.reaction='FIRE')+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id AND cpr.reaction='FIRE')) fires,((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.reaction='CLAP')+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id AND cpr.reaction='CLAP')) claps,((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.reaction='GOAL')+(SELECT COUNT(*) FROM club_post_reactions cpr WHERE cpr.post_id=p.id AND cpr.reaction='GOAL')) goals,(SELECT COUNT(*) FROM comments cm WHERE cm.post_id=p.id) comments FROM posts p WHERE p.club_id=? ORDER BY p.created_at DESC LIMIT 10`).bind(c.id).all(),
    db.prepare(`SELECT m.id,m.scheduled_at,m.home_score,m.away_score,m.status,h.name home_name,a.name away_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id WHERE (m.home_club_id=? OR m.away_club_id=?) AND m.status='CONFIRMED' ORDER BY m.scheduled_at DESC LIMIT 6`).bind(c.id,c.id).all(),
    db.prepare(`SELECT m.id,m.scheduled_at,m.status,h.name home_name,a.name away_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id WHERE (m.home_club_id=? OR m.away_club_id=?) AND m.status IN ('SCHEDULED','SUBMITTED') ORDER BY m.scheduled_at ASC LIMIT 6`).bind(c.id,c.id).all(),
    db.prepare(`SELECT t.id,t.type,t.occurred_at,u.username player,fc.name from_club,tc.name to_club FROM transfers t JOIN users u ON u.id=t.user_id LEFT JOIN clubs fc ON fc.id=t.from_club_id LEFT JOIN clubs tc ON tc.id=t.to_club_id WHERE t.from_club_id=? OR t.to_club_id=? ORDER BY t.occurred_at DESC LIMIT 8`).bind(c.id,c.id).all(),
    db.prepare(`SELECT id,title,subtitle,icon_key,awarded_at FROM club_achievements WHERE club_id=? ORDER BY awarded_at DESC LIMIT 8`).bind(c.id).all(),
    db.prepare(`SELECT u.username,p.position,p.overall,p.avatar_key,COALESCE(SUM(ps.goals),0) goals,COALESCE(ROUND(AVG(ps.rating),2),0) rating
      FROM club_members cm JOIN users u ON u.id=cm.user_id LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN player_stats ps ON ps.user_id=u.id AND ps.club_id=?
      WHERE cm.club_id=? AND cm.left_at IS NULL GROUP BY u.id ORDER BY goals DESC,rating DESC LIMIT 5`).bind(c.id,c.id).all()
  ]);
  return json({club:c,squad:squad.results||[],posts:posts.results||[],recentMatches:recentMatches.results||[],upcomingMatches:upcomingMatches.results||[],transfers:transfers.results||[],achievements:achievements.results||[],topPlayers:topPlayers.results||[]});
}
async function getStandings(request,env){
  const db=requireDb(env),url=new URL(request.url),requestedSeason=asId(url.searchParams.get('seasonId')),requestedDivision=asId(url.searchParams.get('divisionId'));
  const season=requestedSeason?await db.prepare('SELECT * FROM seasons WHERE id=?').bind(requestedSeason).first():await db.prepare(`SELECT * FROM seasons ORDER BY CASE status WHEN 'ACTIVE' THEN 0 WHEN 'REGISTRATION' THEN 1 WHEN 'DRAFT' THEN 2 ELSE 3 END,id DESC LIMIT 1`).first();
  if(!season)return json({season:null,divisions:[],standings:[]});
  const divisions=(await db.prepare('SELECT id,name,level,max_clubs FROM divisions WHERE season_id=? ORDER BY level,id').bind(season.id).all()).results||[];
  const sql=`WITH memberships AS (
      SELECT season_id,division_id,club_id,points_adjustment FROM season_clubs WHERE season_id=?
      UNION
      SELECT d.season_id,d.id,c.id,0 FROM clubs c JOIN divisions d ON d.id=c.division_id WHERE d.season_id=? AND NOT EXISTS(SELECT 1 FROM season_clubs sc WHERE sc.season_id=d.season_id AND sc.club_id=c.id)
    ), stats AS (
      SELECT mem.club_id,mem.division_id,
      COUNT(m.id) played,
      SUM(CASE WHEN (m.home_club_id=mem.club_id AND m.home_score>m.away_score) OR (m.away_club_id=mem.club_id AND m.away_score>m.home_score) THEN 1 ELSE 0 END) wins,
      SUM(CASE WHEN m.id IS NOT NULL AND m.home_score=m.away_score THEN 1 ELSE 0 END) draws,
      SUM(CASE WHEN (m.home_club_id=mem.club_id AND m.home_score<m.away_score) OR (m.away_club_id=mem.club_id AND m.away_score<m.home_score) THEN 1 ELSE 0 END) losses,
      SUM(CASE WHEN m.home_club_id=mem.club_id THEN m.home_score WHEN m.away_club_id=mem.club_id THEN m.away_score ELSE 0 END) gf,
      SUM(CASE WHEN m.home_club_id=mem.club_id THEN m.away_score WHEN m.away_club_id=mem.club_id THEN m.home_score ELSE 0 END) ga
      FROM memberships mem LEFT JOIN matches m ON m.season_id=? AND m.division_id=mem.division_id AND (m.home_club_id=mem.club_id OR m.away_club_id=mem.club_id) AND m.status='CONFIRMED'
      GROUP BY mem.club_id,mem.division_id
    )
    SELECT c.id,c.name,c.slug,c.logo_key,mem.division_id,d.name division_name,d.level division_level,
      COALESCE(st.played,0) played,COALESCE(st.wins,0) wins,COALESCE(st.draws,0) draws,COALESCE(st.losses,0) losses,COALESCE(st.gf,0) gf,COALESCE(st.ga,0) ga,
      (COALESCE(st.wins,0)*3+COALESCE(st.draws,0)+COALESCE(mem.points_adjustment,0)) points
    FROM memberships mem JOIN clubs c ON c.id=mem.club_id JOIN divisions d ON d.id=mem.division_id LEFT JOIN stats st ON st.club_id=mem.club_id AND st.division_id=mem.division_id
    WHERE (? IS NULL OR mem.division_id=?) ORDER BY d.level,points DESC,(gf-ga) DESC,gf DESC,c.name`;
  const r=await db.prepare(sql).bind(season.id,season.id,season.id,requestedDivision,requestedDivision).all();
  return json({season:{id:season.id,name:season.name,status:season.status},divisions,standings:r.results||[]});
}
async function getFixtures(env){const db=requireDb(env);const r=await db.prepare(`SELECT m.*,h.name home_name,h.slug home_slug,a.name away_name,a.slug away_slug,d.name division_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id JOIN divisions d ON d.id=m.division_id ORDER BY CASE WHEN scheduled_at='' THEN 1 ELSE 0 END,scheduled_at ASC,matchday ASC LIMIT 100`).all();return json({fixtures:r.results})}

async function listPlayers(env){
  const db=requireDb(env);
  const r=await db.prepare(`SELECT u.username,lower(u.username) slug,p.position,p.secondary_position,p.country,p.avatar_key,p.overall,
    CASE WHEN p.last_seen_at>=datetime('now','-7 minutes') THEN 1 ELSE 0 END is_online,p.equipped_avatar_frame_id,p.equipped_name_effect_id,p.equipped_name_font_id,p.equipped_name_color_id,p.shop_verified,p.shop_spotlight,p.use_totw_frame,
    EXISTS(SELECT 1 FROM totw_selections tw WHERE tw.user_id=u.id AND tw.expires_at>datetime('now')) totw_frame_active,
    c.id club_id,COALESCE(c.name,'Free Agent') club,c.division_id,d.name division_name,d.level division_level,
    COALESCE((SELECT COUNT(*) FROM player_stats ps WHERE ps.user_id=u.id),0) matches,
    COALESCE((SELECT SUM(ps.goals) FROM player_stats ps WHERE ps.user_id=u.id),0) goals,
    COALESCE((SELECT SUM(ps.assists) FROM player_stats ps WHERE ps.user_id=u.id),0) assists,
    COALESCE((SELECT SUM(ps.saves) FROM player_stats ps WHERE ps.user_id=u.id),0) saves,
    COALESCE((SELECT SUM(ps.clean_sheet) FROM player_stats ps WHERE ps.user_id=u.id),0) clean_sheets,
    COALESCE(ROUND((SELECT AVG(ps.rating) FROM player_stats ps WHERE ps.user_id=u.id),2),COALESCE(p.overall,0)) rating
    FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN profile_onboarding po ON po.user_id=u.id
    LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id LEFT JOIN divisions d ON d.id=c.division_id
    WHERE u.status='ACTIVE' AND COALESCE(po.completed,CASE WHEN length(trim(COALESCE(p.ea_id,'')))>0 AND length(trim(COALESCE(p.position,'')))>0 THEN 1 ELSE 0 END)=1
    ORDER BY CASE WHEN p.position='TW' THEN COALESCE((SELECT SUM(ps.saves) FROM player_stats ps WHERE ps.user_id=u.id),0) ELSE COALESCE((SELECT SUM(ps.goals) FROM player_stats ps WHERE ps.user_id=u.id),0) END DESC,u.created_at DESC`).all();
  return json({players:r.results});
}
async function listClubs(env){
  const db=requireDb(env);
  const r=await db.prepare(`SELECT c.id,c.name,c.slug,c.logo_key,c.cover_key,c.reputation,c.followers_count,c.verified,c.division_id,d.name division,d.level division_level,u.username manager,COALESCE((SELECT COUNT(*) FROM club_members cm WHERE cm.club_id=c.id AND cm.left_at IS NULL),0) squad_size,COALESCE((SELECT COUNT(*) FROM matches m WHERE (m.home_club_id=c.id OR m.away_club_id=c.id) AND m.status='CONFIRMED'),0) played,COALESCE((SELECT COUNT(*)*3 FROM matches m WHERE ((m.home_club_id=c.id AND m.home_score>m.away_score) OR (m.away_club_id=c.id AND m.away_score>m.home_score)) AND m.status='CONFIRMED'),0)+COALESCE((SELECT COUNT(*) FROM matches m WHERE (m.home_club_id=c.id OR m.away_club_id=c.id) AND m.home_score=m.away_score AND m.status='CONFIRMED'),0) points FROM clubs c LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN users u ON u.id=c.manager_user_id ORDER BY c.created_at DESC`).all();
  return json({clubs:r.results});
}
async function listNews(env){
  const db=requireDb(env);
  const r=await db.prepare(`SELECT id,slug,title,excerpt,image_key,published_at FROM news WHERE status='PUBLISHED' ORDER BY COALESCE(published_at,created_at) DESC LIMIT 20`).all();
  return json({news:r.results});
}
async function listTransfers(env){
  const db=requireDb(env);
  const r=await db.prepare(`SELECT t.id,t.type,t.occurred_at AS created_at,u.username player,p.position,p.overall rating,fc.name from_club,tc.name to_club FROM transfers t LEFT JOIN users u ON u.id=t.user_id LEFT JOIN profiles p ON p.user_id=t.user_id LEFT JOIN clubs fc ON fc.id=t.from_club_id LEFT JOIN clubs tc ON tc.id=t.to_club_id ORDER BY t.occurred_at DESC LIMIT 30`).all();
  return json({transfers:r.results});
}
async function getBootstrap(env){
  const db=requireDb(env);
  const [news,fixtures,players,clubs,transfers,standings,recentUsers]=await Promise.all([
    db.prepare(`SELECT id,slug,title,excerpt,image_key,published_at FROM news WHERE status='PUBLISHED' ORDER BY COALESCE(published_at,created_at) DESC LIMIT 3`).all(),
    db.prepare(`SELECT m.id,m.scheduled_at,m.status,h.name home_name,h.slug home_slug,h.logo_key home_logo_key,a.name away_name,a.slug away_slug,a.logo_key away_logo_key,d.name division_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id JOIN divisions d ON d.id=m.division_id ORDER BY CASE WHEN m.scheduled_at='' THEN 1 ELSE 0 END,m.scheduled_at ASC,m.matchday ASC LIMIT 6`).all(),
    db.prepare(`SELECT u.username,lower(u.username) slug,p.position,p.country,p.avatar_key,p.equipped_avatar_frame_id,p.equipped_name_effect_id,p.equipped_name_font_id,p.equipped_name_color_id,p.shop_verified,p.shop_spotlight,p.use_totw_frame,EXISTS(SELECT 1 FROM totw_selections tw WHERE tw.user_id=u.id AND tw.expires_at>datetime('now')) totw_frame_active,CASE WHEN p.last_seen_at>=datetime('now','-7 minutes') THEN 1 ELSE 0 END is_online,c.id club_id,COALESCE(c.name,'Free Agent') club,c.division_id,d.name division_name,d.level division_level,COALESCE((SELECT SUM(ps.goals) FROM player_stats ps WHERE ps.user_id=u.id),0) goals,COALESCE((SELECT SUM(ps.assists) FROM player_stats ps WHERE ps.user_id=u.id),0) assists,COALESCE((SELECT COUNT(*) FROM player_stats ps WHERE ps.user_id=u.id),0) matches,COALESCE(ROUND((SELECT AVG(ps.rating) FROM player_stats ps WHERE ps.user_id=u.id),2),COALESCE(p.overall,0)) rating FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN profile_onboarding po ON po.user_id=u.id LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id LEFT JOIN divisions d ON d.id=c.division_id WHERE u.status='ACTIVE' AND COALESCE(po.completed,CASE WHEN length(trim(COALESCE(p.ea_id,'')))>0 AND length(trim(COALESCE(p.position,'')))>0 THEN 1 ELSE 0 END)=1 ORDER BY goals DESC,matches DESC LIMIT 6`).all(),
    db.prepare(`SELECT c.name,c.slug,c.logo_key,c.reputation,c.followers_count,COALESCE(d.name,'Ohne Division') division,u.username manager FROM clubs c LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN users u ON u.id=c.manager_user_id ORDER BY c.created_at DESC LIMIT 8`).all(),
    db.prepare(`SELECT t.id,t.type,t.occurred_at AS created_at,u.username player,p.position,p.overall rating,fc.name from_club,tc.name to_club FROM transfers t LEFT JOIN users u ON u.id=t.user_id LEFT JOIN profiles p ON p.user_id=t.user_id LEFT JOIN clubs fc ON fc.id=t.from_club_id LEFT JOIN clubs tc ON tc.id=t.to_club_id ORDER BY t.occurred_at DESC LIMIT 6`).all(),
    db.prepare(`WITH stats AS (SELECT sc.club_id,COUNT(m.id) played,SUM(CASE WHEN (m.home_club_id=sc.club_id AND m.home_score>m.away_score) OR (m.away_club_id=sc.club_id AND m.away_score>m.home_score) THEN 1 ELSE 0 END) wins,SUM(CASE WHEN m.home_score=m.away_score THEN 1 ELSE 0 END) draws,SUM(CASE WHEN (m.home_club_id=sc.club_id AND m.home_score<m.away_score) OR (m.away_club_id=sc.club_id AND m.away_score<m.home_score) THEN 1 ELSE 0 END) losses,SUM(CASE WHEN m.home_club_id=sc.club_id THEN m.home_score ELSE m.away_score END) gf,SUM(CASE WHEN m.home_club_id=sc.club_id THEN m.away_score ELSE m.home_score END) ga FROM season_clubs sc LEFT JOIN matches m ON m.season_id=sc.season_id AND (m.home_club_id=sc.club_id OR m.away_club_id=sc.club_id) AND m.status='CONFIRMED' WHERE sc.season_id=1 GROUP BY sc.club_id) SELECT c.id,c.name,c.slug,COALESCE(s.played,0) played,COALESCE(s.wins,0) wins,COALESCE(s.draws,0) draws,COALESCE(s.losses,0) losses,COALESCE(s.gf,0) gf,COALESCE(s.ga,0) ga,(COALESCE(s.wins,0)*3+COALESCE(s.draws,0)) points FROM clubs c JOIN season_clubs sc ON sc.club_id=c.id AND sc.season_id=1 LEFT JOIN stats s ON s.club_id=c.id ORDER BY points DESC,(gf-ga) DESC,gf DESC LIMIT 6`).all(),
    db.prepare(`SELECT u.username,lower(u.username) slug,u.created_at,p.avatar_key,p.position,CASE WHEN p.last_seen_at>=datetime('now','-7 minutes') THEN 1 ELSE 0 END is_online FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN profile_onboarding po ON po.user_id=u.id WHERE u.status='ACTIVE' AND COALESCE(po.completed,0)=1 ORDER BY u.created_at DESC LIMIT 6`).all()
  ]);
  return json({news:news.results,fixtures:fixtures.results,players:players.results,clubs:clubs.results,transfers:transfers.results,standings:standings.results,recentUsers:recentUsers.results||[]});
}

// ============================================================
// EPL v4 additions: dynamic Shop/CMS, moderation and goals
// ============================================================
async function getCmsPublic(env){
  const db=requireDb(env);const [pages,slides,blocks,entries]=await Promise.all([
    db.prepare(`SELECT page_key,eyebrow,title,subtitle,updated_at FROM cms_page_settings ORDER BY page_key`).all(),
    db.prepare(`SELECT id,eyebrow,title,copy,cta_primary_label,cta_primary_href,cta_secondary_label,cta_secondary_href,visual_key,sort_order,active,updated_at FROM cms_home_slides WHERE active=1 ORDER BY sort_order,id`).all(),
    db.prepare(`SELECT id,page_key,title,body,image_key,cta_label,cta_href,sort_order,active,updated_at FROM cms_page_blocks WHERE active=1 ORDER BY page_key,sort_order,id`).all(),
    db.prepare(`SELECT id,page_key,content_key,label,value,sort_order,updated_at FROM cms_content_entries ORDER BY page_key,sort_order,id`).all()
  ]);return json({pages:pages.results||[],slides:slides.results||[],blocks:blocks.results||[],entries:entries.results||[]});
}
async function adminCmsOverview(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'cms');const [pages,slides,blocks,entries]=await Promise.all([
    db.prepare(`SELECT * FROM cms_page_settings ORDER BY page_key`).all(),db.prepare(`SELECT * FROM cms_home_slides ORDER BY sort_order,id`).all(),db.prepare(`SELECT * FROM cms_page_blocks ORDER BY page_key,sort_order,id`).all(),db.prepare(`SELECT * FROM cms_content_entries ORDER BY page_key,sort_order,id`).all()
  ]);return json({pages:pages.results||[],slides:slides.results||[],blocks:blocks.results||[],entries:entries.results||[]});
}
async function getNewsArticle(slug,env){
  const db=requireDb(env),article=await db.prepare(`SELECT n.id,n.slug,n.title,n.excerpt,n.body,n.body_html,n.image_key,n.published_at,n.created_at,COALESCE(u.username,'EPL Redaktion') author FROM news n LEFT JOIN users u ON u.id=n.author_user_id WHERE (n.slug=? OR n.id=?) AND n.status='PUBLISHED' LIMIT 1`).bind(cleanText(slug,160),Number(slug)||0).first();if(!article)return fail('News-Artikel nicht gefunden.',404);return json({article});
}

async function getShopCatalog(request,env){
  const db=requireDb(env),viewer=await currentUser(request,env);let managedClub=null,teamEntitlements=null;if(viewer?.managed_club_slug){managedClub=await db.prepare(`SELECT c.id,c.name,c.slug,COALESCE(cw.balance,0) club_balance FROM clubs c LEFT JOIN club_coin_wallets cw ON cw.club_id=c.id WHERE c.slug=?`).bind(viewer.managed_club_slug).first();if(managedClub){await db.prepare(`INSERT OR IGNORE INTO club_shop_entitlements(club_id) VALUES(?)`).bind(managedClub.id).run();teamEntitlements=await db.prepare(`SELECT transfer_credits,release_credits,red_card_removal_credits FROM club_shop_entitlements WHERE club_id=?`).bind(managedClub.id).first();}}
  const [items,parts]=await Promise.all([db.prepare(`SELECT id,sku,name,category,description,price_coins,price_eur_cents,asset_key,rarity,active,shop_group,item_type,style_key,style_value FROM shop_items WHERE active=1 AND (shop_group<>'TEAM' OR ?=1) ORDER BY CASE shop_group WHEN 'AVATAR_FRAME' THEN 1 WHEN 'ANIMATED_FRAME' THEN 2 WHEN 'COVER_FRAME' THEN 3 WHEN 'NAME_STYLES' THEN 4 WHEN 'BADGE' THEN 5 WHEN 'BUNDLE' THEN 6 WHEN 'TEAM' THEN 7 WHEN 'OTHER' THEN 8 ELSE 9 END,id`).bind(managedClub?1:0).all(),db.prepare(`SELECT sbi.bundle_item_id,sbi.item_id,si.name,si.category,si.asset_key,si.rarity FROM shop_bundle_items sbi JOIN shop_items si ON si.id=sbi.item_id ORDER BY sbi.bundle_item_id,sbi.item_id`).all()]);const byBundle={};for(const x of parts.results||[])(byBundle[x.bundle_item_id]??=[]).push(x);return json({items:(items.results||[]).map(x=>({...x,bundle_items:byBundle[x.id]||[]})),managedClub,teamEntitlements});
}
async function adminShopOverview(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'shop');
  const [items,parts]=await Promise.all([
    db.prepare(`SELECT id,sku,name,category,description,price_coins,price_eur_cents,asset_key,rarity,active,shop_group,item_type,style_key,style_value FROM shop_items ORDER BY shop_group,category,id`).all(),
    db.prepare(`SELECT bundle_item_id,item_id FROM shop_bundle_items ORDER BY bundle_item_id,item_id`).all()
  ]);const by={};for(const x of parts.results||[])(by[x.bundle_item_id]??=[]).push(x.item_id);return json({items:(items.results||[]).map(x=>({...x,bundle_item_ids:by[x.id]||[]}))});
}

async function adminCmsPageSave(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'cms'),b=await request.json(),pageKey=cleanText(b.pageKey,40).toLowerCase();
  if(!pageKey)return fail('Seite fehlt.');
  await db.prepare(`INSERT INTO cms_page_settings(page_key,eyebrow,title,subtitle,updated_by,updated_at) VALUES(?,?,?,?,?,datetime('now')) ON CONFLICT(page_key) DO UPDATE SET eyebrow=excluded.eyebrow,title=excluded.title,subtitle=excluded.subtitle,updated_by=excluded.updated_by,updated_at=datetime('now')`).bind(pageKey,cleanText(b.eyebrow,80),cleanText(b.title,120),cleanText(b.subtitle,500),admin.id).run();
  return json({ok:true});
}
async function adminCmsTextSave(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'cms'),b=await request.json(),id=asId(b.id),pageKey=cleanText(b.pageKey,40).toLowerCase(),contentKey=cleanText(b.contentKey,80),label=cleanText(b.label,150),value=cleanText(b.value,4000),sortOrder=Math.trunc(Number(b.sortOrder)||0);
  if(!pageKey||!contentKey||!label)return fail('Seite, Schlüssel und Bezeichnung sind Pflicht.');
  if(id)await db.prepare(`UPDATE cms_content_entries SET page_key=?,content_key=?,label=?,value=?,sort_order=?,updated_by=?,updated_at=datetime('now') WHERE id=?`).bind(pageKey,contentKey,label,value,sortOrder,admin.id,id).run();
  else await db.prepare(`INSERT INTO cms_content_entries(page_key,content_key,label,value,sort_order,updated_by) VALUES(?,?,?,?,?,?) ON CONFLICT(page_key,content_key) DO UPDATE SET label=excluded.label,value=excluded.value,sort_order=excluded.sort_order,updated_by=excluded.updated_by,updated_at=datetime('now')`).bind(pageKey,contentKey,label,value,sortOrder,admin.id).run();
  return json({ok:true});
}

async function adminCmsSlideSave(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'cms'),b=await request.json(),id=asId(b.id),title=cleanText(b.title,180);if(!title)return fail('Titel fehlt.');
  const vals=[cleanText(b.eyebrow,80),title,cleanText(b.copy,800),cleanText(b.ctaPrimaryLabel,60),cleanText(b.ctaPrimaryHref,200),cleanText(b.ctaSecondaryLabel,60),cleanText(b.ctaSecondaryHref,200),cleanText(b.visualKey,1200),Math.trunc(Number(b.sortOrder)||0),bool01(b.active),admin.id];
  if(id)await db.prepare(`UPDATE cms_home_slides SET eyebrow=?,title=?,copy=?,cta_primary_label=?,cta_primary_href=?,cta_secondary_label=?,cta_secondary_href=?,visual_key=?,sort_order=?,active=?,updated_by=?,updated_at=datetime('now') WHERE id=?`).bind(...vals,id).run();
  else await db.prepare(`INSERT INTO cms_home_slides(eyebrow,title,copy,cta_primary_label,cta_primary_href,cta_secondary_label,cta_secondary_href,visual_key,sort_order,active,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(...vals).run();
  return json({ok:true});
}
async function adminCmsSlideDelete(request,env){const db=requireDb(env);await requireAdminPermission(request,env,'cms');const b=await request.json(),id=asId(b.id);if(!id)return fail('Slide fehlt.');await db.prepare('DELETE FROM cms_home_slides WHERE id=?').bind(id).run();return json({ok:true});}
async function adminCmsBlockSave(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'cms'),b=await request.json(),id=asId(b.id),pageKey=cleanText(b.pageKey,40).toLowerCase(),title=cleanText(b.title,150);if(!pageKey||!title)return fail('Seite und Titel sind Pflicht.');
  const vals=[pageKey,title,cleanText(b.body,4000),cleanText(b.imageKey,1200),cleanText(b.ctaLabel,60),cleanText(b.ctaHref,200),Math.trunc(Number(b.sortOrder)||0),bool01(b.active),admin.id];
  if(id)await db.prepare(`UPDATE cms_page_blocks SET page_key=?,title=?,body=?,image_key=?,cta_label=?,cta_href=?,sort_order=?,active=?,updated_by=?,updated_at=datetime('now') WHERE id=?`).bind(...vals,id).run();
  else await db.prepare(`INSERT INTO cms_page_blocks(page_key,title,body,image_key,cta_label,cta_href,sort_order,active,updated_by) VALUES(?,?,?,?,?,?,?,?,?)`).bind(...vals).run();return json({ok:true});
}
async function adminCmsBlockDelete(request,env){const db=requireDb(env);await requireAdminPermission(request,env,'cms');const b=await request.json(),id=asId(b.id);if(!id)return fail('Block fehlt.');await db.prepare('DELETE FROM cms_page_blocks WHERE id=?').bind(id).run();return json({ok:true});}

async function adminShopSave(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'shop');const b=await request.json(),id=asId(b.id),name=cleanText(b.name,100),requested=cleanText(b.category,30).toUpperCase();
  if(!name||!['AVATAR_FRAME','ANIMATED_FRAME','COVER_FRAME','NAME_EFFECT','BADGE','BUNDLE'].includes(requested))return fail('Ungültiges Shop-Item.');
  const cat=requested==='ANIMATED_FRAME'?'AVATAR_FRAME':requested,existing=id?await db.prepare(`SELECT category,shop_group,item_type FROM shop_items WHERE id=?`).bind(id).first():null;
  let group,type;if(requested==='ANIMATED_FRAME'){group='ANIMATED_FRAME';type='ANIMATED_AVATAR_FRAME';}else if(existing&&existing.category===cat&&existing.shop_group&&existing.item_type&&existing.shop_group!=='ANIMATED_FRAME'){group=existing.shop_group;type=existing.item_type;}else{group={AVATAR_FRAME:'AVATAR_FRAME',COVER_FRAME:'COVER_FRAME',NAME_EFFECT:'NAME_STYLES',BADGE:'BADGE',BUNDLE:'BUNDLE'}[cat]||'COSMETIC';type={AVATAR_FRAME:'AVATAR_FRAME',COVER_FRAME:'COVER_FRAME',NAME_EFFECT:'NAME_EFFECT',BADGE:'BADGE',BUNDLE:'BUNDLE'}[cat]||'COSMETIC';}
  const sku=cleanText(b.sku||slugify(name).replaceAll('-','_'),80),vals=[sku,name,cat,cleanText(b.description,600),Math.max(0,Math.trunc(Number(b.priceCoins)||0)),Math.max(0,Math.trunc(Number(b.priceEurCents)||0)),cleanText(b.assetKey,1200),cleanText(b.rarity||'COMMON',30),bool01(b.active),group,type];let itemId=id;
  if(id)await db.prepare(`UPDATE shop_items SET sku=?,name=?,category=?,description=?,price_coins=?,price_eur_cents=?,asset_key=?,rarity=?,active=?,shop_group=?,item_type=? WHERE id=?`).bind(...vals,id).run();
  else{const r=await db.prepare(`INSERT INTO shop_items(sku,name,category,description,price_coins,price_eur_cents,asset_key,rarity,active,shop_group,item_type) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(...vals).run();itemId=Number(r.meta.last_row_id);}
  if(cat==='BUNDLE'&&group==='BUNDLE'){
    const ids=[...new Set((Array.isArray(b.bundleItemIds)?b.bundleItemIds:[]).map(Number).filter(x=>Number.isInteger(x)&&x>0&&x!==itemId))];
    const statements=[db.prepare('DELETE FROM shop_bundle_items WHERE bundle_item_id=?').bind(itemId)];
    for(const child of ids){const exists=await db.prepare(`SELECT id FROM shop_items WHERE id=? AND category<>'BUNDLE'`).bind(child).first();if(exists)statements.push(db.prepare('INSERT OR IGNORE INTO shop_bundle_items(bundle_item_id,item_id) VALUES(?,?)').bind(itemId,child));}
    await db.batch(statements);
  }else if(itemId){await db.prepare('DELETE FROM shop_bundle_items WHERE bundle_item_id=?').bind(itemId).run();}
  return json({ok:true,id:itemId});
}

async function currentActiveSeason(db){return await db.prepare(`SELECT * FROM seasons WHERE status='ACTIVE' ORDER BY id DESC LIMIT 1`).first()||await db.prepare(`SELECT * FROM seasons ORDER BY id DESC LIMIT 1`).first();}
async function playerGoalMetric(db,userId,seasonId,metric){
  const r=await db.prepare(`SELECT COUNT(ps.id) matches,COALESCE(SUM(ps.goals),0) goals,COALESCE(SUM(ps.assists),0) assists,COALESCE(SUM(ps.saves),0) saves,COALESCE(SUM(ps.clean_sheet),0) clean_sheets,COALESCE(SUM(ps.motm),0) motm,COALESCE(AVG(ps.rating),0) avg_rating FROM player_stats ps JOIN matches m ON m.id=ps.match_id WHERE ps.user_id=? AND m.season_id=? AND m.status='CONFIRMED'`).bind(userId,seasonId).first()||{};
  const map={MATCHES:r.matches,GOALS:r.goals,ASSISTS:r.assists,SAVES:r.saves,CLEAN_SHEETS:r.clean_sheets,MOTM:r.motm,AVG_RATING:r.avg_rating,GOAL_CONTRIBUTIONS:Number(r.goals||0)+Number(r.assists||0)};return Number(map[metric]||0);
}
async function clubSeasonSummary(db,clubId,seasonId){
  const r=await db.prepare(`SELECT COUNT(*) played,
    COALESCE(SUM(CASE WHEN (home_club_id=? AND home_score>away_score) OR (away_club_id=? AND away_score>home_score) THEN 1 ELSE 0 END),0) wins,
    COALESCE(SUM(CASE WHEN home_score=away_score THEN 1 ELSE 0 END),0) draws,
    COALESCE(SUM(CASE WHEN (home_club_id=? AND away_score=0) OR (away_club_id=? AND home_score=0) THEN 1 ELSE 0 END),0) clean_sheets,
    COALESCE(SUM(CASE WHEN home_club_id=? THEN home_score ELSE away_score END),0) gf,
    COALESCE(SUM(CASE WHEN home_club_id=? THEN away_score ELSE home_score END),0) ga
    FROM matches WHERE season_id=? AND status='CONFIRMED' AND (home_club_id=? OR away_club_id=?)`).bind(clubId,clubId,clubId,clubId,clubId,clubId,seasonId,clubId,clubId).first()||{};
  return {...r,points:Number(r.wins||0)*3+Number(r.draws||0)};
}
async function clubGoalMetric(db,clubId,seasonId,metric){
  const s=await clubSeasonSummary(db,clubId,seasonId);if(metric==='WINS')return Number(s.wins||0);if(metric==='POINTS')return Number(s.points||0);if(metric==='CLEAN_SHEETS')return Number(s.clean_sheets||0);if(metric==='GOALS_FOR')return Number(s.gf||0);if(metric==='PLAYED')return Number(s.played||0);
  if(metric==='CHAMPION'){
    const clubs=await db.prepare('SELECT club_id FROM season_clubs WHERE season_id=?').bind(seasonId).all();let best=null,champion=null;
    for(const c of clubs.results||[]){const x=await clubSeasonSummary(db,c.club_id,seasonId),score=[x.points,Number(x.gf||0)-Number(x.ga||0),Number(x.gf||0)];if(!best||score[0]>best[0]||(score[0]===best[0]&&score[1]>best[1])||(score[0]===best[0]&&score[1]===best[1]&&score[2]>best[2])){best=score;champion=c.club_id;}}
    return champion===clubId?1:0;
  }return 0;
}
async function getSeasonGoals(request,env){
  const db=requireDb(env),u=await requireUser(request,env),season=await currentActiveSeason(db);if(!season)return json({season:null,player:{templates:[],selected:[],maxChoices:5,walletBalance:Number(u.coins||0)},club:null});
  const p=await db.prepare('SELECT position FROM profiles WHERE user_id=?').bind(u.id).first(),group=p?.position==='TW'?'GK':'FIELD';
  const templates=await db.prepare(`SELECT * FROM season_goal_templates WHERE scope='PLAYER' AND active=1 AND position_group IN ('ANY',?) ORDER BY entry_cost_coins,target_value`).bind(group).all();
  const sel=await db.prepare(`SELECT usg.*,sgt.code,sgt.metric,sgt.title,sgt.description,sgt.target_value,CASE WHEN usg.payout_coins>0 THEN usg.payout_coins ELSE sgt.reward_coins END reward_coins,COALESCE(usg.entry_cost_coins,sgt.entry_cost_coins,0) entry_cost_coins FROM user_season_goals usg JOIN season_goal_templates sgt ON sgt.id=usg.goal_id WHERE usg.season_id=? AND usg.user_id=? ORDER BY usg.selected_at`).bind(season.id,u.id).all();
  const selected=[];for(const g of sel.results||[]){const progress=await playerGoalMetric(db,u.id,season.id,g.metric);selected.push({...g,progress_value:progress,progress_percent:g.target_value?Math.min(100,Math.round(progress/Number(g.target_value)*100)):0});}
  const wallet=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(u.id).first();
  let club=null;if(u.managed_club_slug){const c=await db.prepare(`SELECT c.id,c.name,c.slug,COALESCE(cw.balance,0) wallet_balance FROM clubs c LEFT JOIN club_coin_wallets cw ON cw.club_id=c.id WHERE c.slug=?`).bind(u.managed_club_slug).first();if(c){const ct=await db.prepare(`SELECT * FROM season_goal_templates WHERE scope='CLUB' AND active=1 ORDER BY entry_cost_coins,target_value`).all(),cs=await db.prepare(`SELECT csg.*,sgt.code,sgt.metric,sgt.title,sgt.description,sgt.target_value,CASE WHEN csg.payout_coins>0 THEN csg.payout_coins ELSE sgt.reward_coins END reward_coins,COALESCE(csg.entry_cost_coins,sgt.entry_cost_coins,0) entry_cost_coins FROM club_season_goals csg JOIN season_goal_templates sgt ON sgt.id=csg.goal_id WHERE csg.season_id=? AND csg.club_id=?`).bind(season.id,c.id).all(),selectedClub=[];for(const g of cs.results||[]){const progress=await clubGoalMetric(db,c.id,season.id,g.metric);selectedClub.push({...g,progress_value:progress,progress_percent:g.target_value?Math.min(100,Math.round(progress/Number(g.target_value)*100)):0});}club={club:c,templates:ct.results||[],selected:selectedClub,maxChoices:5,walletBalance:Number(c.wallet_balance||0)};}}
  return json({season,player:{group,templates:templates.results||[],selected,maxChoices:5,walletBalance:Number(wallet?.balance||0)},club});
}
async function selectPlayerGoals(request,env){
  const db=requireDb(env),u=await requireUser(request,env),season=await currentActiveSeason(db);if(!season||season.status!=='ACTIVE')return fail('Aktuell läuft keine aktive Saison.',409);
  const b=await request.json(),ids=[...new Set((Array.isArray(b.goalIds)?b.goalIds:[]).map(Number).filter(Number.isInteger))];if(ids.length>5)return fail('Du kannst maximal 5 persönliche Saisonziele auswählen.');
  const p=await db.prepare('SELECT position FROM profiles WHERE user_id=?').bind(u.id).first(),group=p?.position==='TW'?'GK':'FIELD';
  const existingRows=await db.prepare(`SELECT goal_id FROM user_season_goals WHERE season_id=? AND user_id=?`).bind(season.id,u.id).all(),existingIds=new Set((existingRows.results||[]).map(x=>Number(x.goal_id)));
  for(const existingId of existingIds)if(!ids.includes(existingId))return fail('Bereits gekaufte Saisonziele sind für diese Saison gesperrt und können nicht wieder abgewählt werden.',409);
  const newIds=ids.filter(id=>!existingIds.has(id));const goals=[];let totalCost=0;
  for(const id of newIds){const g=await db.prepare(`SELECT id,title,entry_cost_coins,reward_coins FROM season_goal_templates WHERE id=? AND scope='PLAYER' AND active=1 AND position_group IN ('ANY',?)`).bind(id,group).first();if(!g)return fail('Ein ausgewähltes Ziel passt nicht zu deiner Position.');goals.push(g);totalCost+=Number(g.entry_cost_coins||0);}
  const wallet=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(u.id).first();if(Number(wallet?.balance||0)<totalCost)return fail(`Nicht genug EPL Coins. Für die neuen Saisonziele brauchst du ${totalCost} Coins.`,409);
  const stmts=[];if(totalCost>0)stmts.push(db.prepare(`UPDATE coin_wallets SET balance=balance-?,lifetime_spent=lifetime_spent+?,updated_at=datetime('now') WHERE user_id=?`).bind(totalCost,totalCost,u.id));
  for(const g of goals){stmts.push(db.prepare(`INSERT INTO user_season_goals(season_id,user_id,goal_id,entry_cost_coins,payout_coins) VALUES(?,?,?,?,?)`).bind(season.id,u.id,g.id,Number(g.entry_cost_coins||0),Number(g.reward_coins||0)));if(Number(g.entry_cost_coins||0)>0)stmts.push(db.prepare(`INSERT OR IGNORE INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'PERFORMANCE','SEASON_GOAL_ENTRY',?,?)`).bind(u.id,-Number(g.entry_cost_coins||0),`${season.id}:${g.id}`,`Saisonziel-Einsatz: ${g.title}`));}
  if(stmts.length)await db.batch(stmts);return getSeasonGoals(request,env);
}
async function selectClubGoals(request,env){
  const db=requireDb(env),u=await requireUser(request,env),season=await currentActiveSeason(db);if(!season||season.status!=='ACTIVE')return fail('Aktuell läuft keine aktive Saison.',409);
  const b=await request.json(),club=await db.prepare('SELECT id,name FROM clubs WHERE slug=?').bind(cleanText(b.clubSlug||u.managed_club_slug,60)).first();if(!club)return fail('Club nicht gefunden.',404);if(!(await canClubPermission(db,u,club.id,'manage_page')))return fail('Keine VM-Rechte.',403);
  const ids=[...new Set((Array.isArray(b.goalIds)?b.goalIds:[]).map(Number).filter(Number.isInteger))];if(ids.length>5)return fail('Ein Club kann maximal 5 Saisonziele auswählen.');
  const existingRows=await db.prepare(`SELECT goal_id FROM club_season_goals WHERE season_id=? AND club_id=?`).bind(season.id,club.id).all(),existingIds=new Set((existingRows.results||[]).map(x=>Number(x.goal_id)));
  for(const existingId of existingIds)if(!ids.includes(existingId))return fail('Bereits gekaufte Club-Saisonziele sind für diese Saison gesperrt und können nicht wieder abgewählt werden.',409);
  const newIds=ids.filter(id=>!existingIds.has(id));const goals=[];let totalCost=0;
  for(const id of newIds){const g=await db.prepare(`SELECT id,title,entry_cost_coins,reward_coins FROM season_goal_templates WHERE id=? AND scope='CLUB' AND active=1`).bind(id).first();if(!g)return fail('Ungültiges Clubziel.');goals.push(g);totalCost+=Number(g.entry_cost_coins||0);}
  await db.prepare(`INSERT OR IGNORE INTO club_coin_wallets(club_id,balance) VALUES(?,0)`).bind(club.id).run();const wallet=await db.prepare('SELECT balance FROM club_coin_wallets WHERE club_id=?').bind(club.id).first();if(Number(wallet?.balance||0)<totalCost)return fail(`Nicht genug Coins in der Clubkasse. Für die neuen Ziele braucht ${club.name} ${totalCost} Coins.`,409);
  const stmts=[];if(totalCost>0)stmts.push(db.prepare(`UPDATE club_coin_wallets SET balance=balance-?,lifetime_spent=lifetime_spent+?,updated_at=datetime('now') WHERE club_id=?`).bind(totalCost,totalCost,club.id));
  for(const g of goals){stmts.push(db.prepare(`INSERT INTO club_season_goals(season_id,club_id,goal_id,selected_by,entry_cost_coins,payout_coins) VALUES(?,?,?,?,?,?)`).bind(season.id,club.id,g.id,u.id,Number(g.entry_cost_coins||0),Number(g.reward_coins||0)));if(Number(g.entry_cost_coins||0)>0)stmts.push(db.prepare(`INSERT OR IGNORE INTO club_coin_transactions(club_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'SEASON_GOAL','SEASON_GOAL_ENTRY',?,?)`).bind(club.id,-Number(g.entry_cost_coins||0),`${season.id}:${g.id}`,`Club-Saisonziel-Einsatz: ${g.title}`));}
  if(stmts.length)await db.batch(stmts);return getSeasonGoals(request,env);
}
async function adminFinalizeSeason(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'leagues');const b=await request.json(),seasonId=asId(b.seasonId);if(!seasonId)return fail('Saison fehlt.');const season=await db.prepare('SELECT * FROM seasons WHERE id=?').bind(seasonId).first();if(!season)return fail('Saison nicht gefunden.',404);
  const pgoals=await db.prepare(`SELECT usg.user_id,usg.goal_id,sgt.metric,sgt.target_value,CASE WHEN usg.payout_coins>0 THEN usg.payout_coins ELSE sgt.reward_coins END reward_coins,sgt.title FROM user_season_goals usg JOIN season_goal_templates sgt ON sgt.id=usg.goal_id WHERE usg.season_id=? AND usg.status='SELECTED'`).bind(seasonId).all();let playerAwards=0,clubAwards=0;
  for(const g of pgoals.results||[]){
    const progress=await playerGoalMetric(db,g.user_id,seasonId,g.metric),ok=progress>=Number(g.target_value);await db.prepare(`UPDATE user_season_goals SET status=?,progress_value=?,completed_at=CASE WHEN ?='COMPLETED' THEN datetime('now') ELSE NULL END WHERE season_id=? AND user_id=? AND goal_id=?`).bind(ok?'COMPLETED':'FAILED',progress,ok?'COMPLETED':'FAILED',seasonId,g.user_id,g.goal_id).run();
    if(ok){const ref=`${seasonId}:${g.goal_id}`;const exists=await db.prepare(`SELECT 1 FROM coin_transactions WHERE user_id=? AND type='PERFORMANCE' AND reference_type='SEASON_GOAL' AND reference_id=?`).bind(g.user_id,ref).first();if(!exists){await db.batch([db.prepare(`UPDATE coin_wallets SET balance=balance+?,lifetime_earned=lifetime_earned+?,updated_at=datetime('now') WHERE user_id=?`).bind(g.reward_coins,g.reward_coins,g.user_id),db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'PERFORMANCE','SEASON_GOAL',?,?)`).bind(g.user_id,g.reward_coins,ref,`Saisonziel erfolgreich: ${g.title}`)]);await notifyUser(db,g.user_id,'SEASON_GOAL',`Saisonziel geschafft: ${g.title}`,`+${g.reward_coins} EPL Coins wurden ausgezahlt.`,'/spieler');const club=await db.prepare(`SELECT club_id FROM club_members WHERE user_id=? AND left_at IS NULL LIMIT 1`).bind(g.user_id).first();if(club)await addClubReputation(db,club.club_id,25,'PLAYER_SEASON_GOAL','GOAL',ref,`Spieler-Saisonziel geschafft: ${g.title}`);playerAwards++;}}
  }
  const cgoals=await db.prepare(`SELECT csg.club_id,csg.goal_id,sgt.metric,sgt.target_value,CASE WHEN csg.payout_coins>0 THEN csg.payout_coins ELSE sgt.reward_coins END reward_coins,sgt.title FROM club_season_goals csg JOIN season_goal_templates sgt ON sgt.id=csg.goal_id WHERE csg.season_id=? AND csg.status='SELECTED'`).bind(seasonId).all();
  for(const g of cgoals.results||[]){
    const progress=await clubGoalMetric(db,g.club_id,seasonId,g.metric),ok=progress>=Number(g.target_value);await db.prepare(`UPDATE club_season_goals SET status=?,progress_value=?,completed_at=CASE WHEN ?='COMPLETED' THEN datetime('now') ELSE NULL END WHERE season_id=? AND club_id=? AND goal_id=?`).bind(ok?'COMPLETED':'FAILED',progress,ok?'COMPLETED':'FAILED',seasonId,g.club_id,g.goal_id).run();
    if(ok){const ref=`${seasonId}:${g.club_id}:${g.goal_id}`,exists=await db.prepare(`SELECT 1 FROM club_coin_transactions WHERE club_id=? AND type='SEASON_GOAL' AND reference_type='SEASON_GOAL_PAYOUT' AND reference_id=?`).bind(g.club_id,ref).first();if(!exists){await db.batch([db.prepare(`INSERT OR IGNORE INTO club_coin_wallets(club_id,balance) VALUES(?,0)`).bind(g.club_id),db.prepare(`UPDATE club_coin_wallets SET balance=balance+?,lifetime_earned=lifetime_earned+?,updated_at=datetime('now') WHERE club_id=?`).bind(g.reward_coins,g.reward_coins,g.club_id),db.prepare(`INSERT INTO club_coin_transactions(club_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'SEASON_GOAL','SEASON_GOAL_PAYOUT',?,?)`).bind(g.club_id,g.reward_coins,ref,`Club-Saisonziel erfolgreich: ${g.title}`)]);await addClubReputation(db,g.club_id,100,'CLUB_SEASON_GOAL','GOAL',ref,`Club-Saisonziel geschafft: ${g.title}`);const mgr=await db.prepare('SELECT manager_user_id FROM clubs WHERE id=?').bind(g.club_id).first();if(mgr?.manager_user_id)await notifyUser(db,mgr.manager_user_id,'CLUB_SEASON_GOAL',`Clubziel geschafft: ${g.title}`,`+${g.reward_coins} EPL Coins für die Clubkasse.`,'/manager');clubAwards++;}}
  }
  if(b.finishSeason!==false)await db.prepare(`UPDATE seasons SET status='FINISHED' WHERE id=?`).bind(seasonId).run();return json({ok:true,playerAwards,clubAwards});
}
