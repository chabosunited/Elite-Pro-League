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
      oauthDiscordEnabled:!!(env.DISCORD_CLIENT_ID&&env.DISCORD_CLIENT_SECRET)
    });
    if(route === 'auth/register' && method === 'POST') return fail('Passwort-Registrierung wurde deaktiviert. Bitte Google oder Discord verwenden.',410);
    if(route === 'auth/login' && method === 'POST') return fail('Passwort-Login wurde deaktiviert. Bitte Google oder Discord verwenden.',410);
    if(route === 'auth/oauth/google/start' && method === 'GET') return oauthStart('google',request,env);
    if(route === 'auth/oauth/google/callback' && method === 'GET') return oauthCallback('google',request,env);
    if(route === 'auth/oauth/discord/start' && method === 'GET') return oauthStart('discord',request,env);
    if(route === 'auth/oauth/discord/callback' && method === 'GET') return oauthCallback('discord',request,env);
    if(route === 'profile/setup' && method === 'POST') return setupProfile(request,env);
    if(route === 'auth/logout' && method === 'POST') return logout(request,env);
    if(route === 'auth/me' && method === 'GET') return me(request,env);
    if(route === 'presence' && method === 'POST') return heartbeat(request,env);
    if(route === 'social/state' && method === 'GET') return socialState(request,env);
    if(route === 'social/feed' && method === 'GET') return socialFeed(request,env);
    if(route === 'social/follow' && method === 'POST') return follow(request,env);
    if(route === 'inventory' && method === 'GET') return getInventory(request,env);
    if(route === 'shop/catalog' && method === 'GET') return getShopCatalog(env);
    if(route === 'cms/public' && method === 'GET') return getCmsPublic(env);
    if(route === 'goals' && method === 'GET') return getSeasonGoals(request,env);
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
    if(route === 'standings' && method === 'GET') return getStandings(env);
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
    if(/^posts\/\d+\/reaction$/.test(route) && method === 'POST') return postReaction(route,request,env);
    if(/^posts\/\d+\/comments$/.test(route) && method === 'GET') return getPostComments(route,request,env);
    if(/^posts\/\d+\/comments$/.test(route) && method === 'POST') return createComment(route,request,env);
    if(/^comments\/\d+\/like$/.test(route) && method === 'POST') return commentLike(route,request,env);
    if(route === 'posts' && method === 'POST') return createPost(request,env);
    if(route === 'reports' && method === 'POST') return createReport(request,env);
    if(route === 'admin/coin-award' && method === 'POST') return adminCoinAward(request,env);
    if(route === 'admin/overview' && method === 'GET') return adminOverview(request,env);
    if(route === 'admin/reports' && method === 'GET') return adminReports(request,env);
    if(route === 'admin/cms' && method === 'GET') return adminCmsOverview(request,env);
    if(route === 'admin/shop' && method === 'GET') return adminShopOverview(request,env);
    if(route === 'admin/user/access' && method === 'POST') return adminUserAccess(request,env);
    if(route === 'admin/user/profile' && method === 'POST') return adminUserProfile(request,env);
    if(route === 'admin/club/save' && method === 'POST') return adminClubSave(request,env);
    if(route === 'admin/club/manager' && method === 'POST') return adminClubManager(request,env);
    if(route === 'admin/season/save' && method === 'POST') return adminSeasonSave(request,env);
    if(route === 'admin/division/save' && method === 'POST') return adminDivisionSave(request,env);
    if(route === 'admin/match/save' && method === 'POST') return adminMatchSave(request,env);
    if(route === 'admin/match/result' && method === 'POST') return adminMatchResult(request,env);
    if(route === 'admin/news/save' && method === 'POST') return adminNewsSave(request,env);
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
    if(route === 'manager/match/stats' && method === 'POST') return managerMatchStats(request,env);
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
        db.prepare('INSERT INTO coin_wallets(user_id,balance) VALUES(?,0)').bind(userId),
        db.prepare('INSERT INTO profile_onboarding(user_id,shirt_number,completed) VALUES(?,NULL,0)').bind(userId),
        db.prepare(`INSERT INTO oauth_accounts(provider,provider_user_id,user_id,provider_email,provider_username,avatar_url) VALUES(?,?,?,?,?,?)`).bind(provider,identity.id,userId,identity.email,identity.username,identity.avatarUrl)
      ]);
      user={id:userId,email:identity.email,username,role:'PLAYER',status:'ACTIVE',profile_completed:0};
    }
  }else{
    await db.prepare(`UPDATE oauth_accounts SET provider_email=?,provider_username=?,avatar_url=?,updated_at=datetime('now') WHERE provider=? AND provider_user_id=?`).bind(identity.email,identity.username,identity.avatarUrl,provider,identity.id).run();
  }

  if(user.status!=='ACTIVE')return oauthFailure(request,env,'Dieser EPL-Account ist derzeit gesperrt.');
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
  const row=await db.prepare(`SELECT u.id,u.email,u.username,u.role,u.status,p.avatar_key,p.cover_key,p.ea_id,p.platform,p.position,p.secondary_position,p.country,p.bio,p.discord,p.free_agent,p.equipped_avatar_frame_id,p.equipped_cover_frame_id,p.equipped_name_effect_id,p.equipped_badge_id,
      COALESCE(w.balance,0) AS coins,COALESCE(po.shirt_number,0) AS shirt_number,
      COALESCE(po.completed,CASE WHEN length(trim(COALESCE(p.ea_id,'')))>0 AND length(trim(COALESCE(p.position,'')))>0 THEN 1 ELSE 0 END) AS profile_completed
    FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN coin_wallets w ON w.user_id=u.id LEFT JOIN profile_onboarding po ON po.user_id=u.id
    WHERE s.id=? AND s.expires_at>datetime('now')`).bind(sid).first();
  if(!row)return null;
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

async function heartbeat(request,env){
  const db=requireDb(env),u=await requireUser(request,env);
  await db.prepare(`UPDATE profiles SET last_seen_at=datetime('now') WHERE user_id=?`).bind(u.id).run();
  return json({ok:true,online:true});
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
      CASE WHEN p.club_id IS NULL AND ap.last_seen_at>=datetime('now','-2 minutes') THEN 1 ELSE 0 END author_online,
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
  const [items,p]=await Promise.all([
    db.prepare(`SELECT si.id,si.sku,si.name,si.category,si.description,si.price_coins,si.price_eur_cents,si.asset_key,si.rarity,ui.acquired_at
      FROM user_inventory ui JOIN shop_items si ON si.id=ui.item_id WHERE ui.user_id=? ORDER BY ui.acquired_at DESC`).bind(u.id).all(),
    db.prepare(`SELECT equipped_avatar_frame_id,equipped_cover_frame_id,equipped_name_effect_id,equipped_badge_id FROM profiles WHERE user_id=?`).bind(u.id).first()
  ]);
  return json({items:items.results||[],equipped:{avatarFrame:p?.equipped_avatar_frame_id||null,coverFrame:p?.equipped_cover_frame_id||null,nameEffect:p?.equipped_name_effect_id||null,badge:p?.equipped_badge_id||null}});
}
async function equipItem(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json();
  const slot=cleanText(b.slot,30),itemId=b.itemId===null||b.itemId===''?null:Number(b.itemId);
  const slots={
    avatar_frame:{category:'AVATAR_FRAME',col:'equipped_avatar_frame_id'},avatarFrame:{category:'AVATAR_FRAME',col:'equipped_avatar_frame_id'},
    cover_frame:{category:'COVER_FRAME',col:'equipped_cover_frame_id'},coverFrame:{category:'COVER_FRAME',col:'equipped_cover_frame_id'},
    name_effect:{category:'NAME_EFFECT',col:'equipped_name_effect_id'},nameEffect:{category:'NAME_EFFECT',col:'equipped_name_effect_id'},
    badge:{category:'BADGE',col:'equipped_badge_id'}
  };
  const cfg=slots[slot];if(!cfg)return fail('Ungültiger Cosmetic-Slot.');
  if(itemId!==null){
    if(!Number.isInteger(itemId)||itemId<=0)return fail('Ungültiges Shop-Item.');
    const owned=await db.prepare(`SELECT si.id,si.category FROM user_inventory ui JOIN shop_items si ON si.id=ui.item_id WHERE ui.user_id=? AND ui.item_id=?`).bind(u.id,itemId).first();
    if(!owned)return fail('Dieses Cosmetic befindet sich nicht in deinem Inventar.',403);
    if(owned.category!==cfg.category)return fail('Dieses Cosmetic passt nicht in den gewählten Slot.',409);
  }
  await db.prepare(`UPDATE profiles SET ${cfg.col}=?,updated_at=datetime('now') WHERE user_id=?`).bind(itemId,u.id).run();
  await db.prepare(`UPDATE user_inventory SET equipped=CASE WHEN item_id=? THEN 1 ELSE 0 END WHERE user_id=? AND item_id IN (SELECT id FROM shop_items WHERE category=?)`).bind(itemId||-1,u.id,cfg.category).run();
  return getInventory(request,env);
}


async function removeOwnedItem(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),itemId=Number(b.itemId);
  if(!Number.isInteger(itemId)||itemId<=0)return fail('Ungültiges Shop-Item.');
  const item=await db.prepare(`SELECT si.id,si.name,si.category FROM user_inventory ui JOIN shop_items si ON si.id=ui.item_id WHERE ui.user_id=? AND ui.item_id=?`).bind(u.id,itemId).first();
  if(!item)return fail('Dieser Inhalt befindet sich nicht in deinem Inventar.',404);
  const col={AVATAR_FRAME:'equipped_avatar_frame_id',COVER_FRAME:'equipped_cover_frame_id',NAME_EFFECT:'equipped_name_effect_id',BADGE:'equipped_badge_id'}[item.category];
  const stmts=[];
  if(col)stmts.push(db.prepare(`UPDATE profiles SET ${col}=NULL,updated_at=datetime('now') WHERE user_id=? AND ${col}=?`).bind(u.id,itemId));
  stmts.push(db.prepare('DELETE FROM user_inventory WHERE user_id=? AND item_id=?').bind(u.id,itemId));
  await db.batch(stmts);
  return json({ok:true,itemId,name:item.name});
}

async function toggleTargetLike(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),type=cleanText(b.type,12).toLowerCase(),slug=cleanText(b.slug,60).toLowerCase();
  if(type==='player'){
    const target=await db.prepare('SELECT id FROM users WHERE lower(username)=?').bind(slug).first();if(!target)return fail('Spieler nicht gefunden.',404);if(target.id===u.id)return fail('Du kannst dein eigenes Profil nicht liken.',409);
    const exists=await db.prepare('SELECT 1 FROM profile_likes WHERE user_id=? AND target_user_id=?').bind(u.id,target.id).first();
    if(exists)await db.prepare('DELETE FROM profile_likes WHERE user_id=? AND target_user_id=?').bind(u.id,target.id).run();else await db.prepare('INSERT INTO profile_likes(user_id,target_user_id) VALUES(?,?)').bind(u.id,target.id).run();
    const c=await db.prepare('SELECT COUNT(*) count FROM profile_likes WHERE target_user_id=?').bind(target.id).first();return json({liked:!exists,count:c.count||0});
  }
  if(type==='club'){
    const target=await db.prepare('SELECT id FROM clubs WHERE lower(slug)=?').bind(slug).first();if(!target)return fail('Club nicht gefunden.',404);
    const exists=await db.prepare('SELECT 1 FROM club_likes WHERE user_id=? AND club_id=?').bind(u.id,target.id).first();
    if(exists)await db.prepare('DELETE FROM club_likes WHERE user_id=? AND club_id=?').bind(u.id,target.id).run();else await db.prepare('INSERT INTO club_likes(user_id,club_id) VALUES(?,?)').bind(u.id,target.id).run();
    const c=await db.prepare('SELECT COUNT(*) count FROM club_likes WHERE club_id=?').bind(target.id).first();return json({liked:!exists,count:c.count||0});
  }
  return fail('Ungültiger Like-Typ.');
}

async function resolveMessageTarget(db,b,u){
  const type=cleanText(b.targetType,12).toLowerCase(),slug=cleanText(b.slug,60).toLowerCase();
  if(type==='player'){
    const target=await db.prepare('SELECT id,username FROM users WHERE lower(username)=? AND status=\'ACTIVE\'').bind(slug).first();if(!target)return null;return target;
  }
  if(type==='club'){
    const target=await db.prepare(`SELECT u.id,u.username FROM clubs c JOIN users u ON u.id=c.manager_user_id WHERE lower(c.slug)=? AND u.status='ACTIVE'`).bind(slug).first();if(!target)return null;return target;
  }
  return null;
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
  const r=await db.prepare(`SELECT c.id,c.updated_at,other.id other_user_id,other.username,p.avatar_key,CASE WHEN p.last_seen_at>=datetime('now','-2 minutes') THEN 1 ELSE 0 END is_online,
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
  const otherId=c.user_a===u.id?c.user_b:c.user_a,other=await db.prepare(`SELECT u.id,u.username,p.avatar_key,CASE WHEN p.last_seen_at>=datetime('now','-2 minutes') THEN 1 ELSE 0 END is_online FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?`).bind(otherId).first();
  return json({conversation:{id,other},messages:r.results||[]});
}
async function sendConversationMessage(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),id=Number(route.split('/')[1]),b=await request.json(),body=cleanText(b.body,3000);
  if(!body)return fail('Nachricht ist leer.');const c=await db.prepare('SELECT id FROM conversations WHERE id=? AND (user_a=? OR user_b=?)').bind(id,u.id,u.id).first();if(!c)return fail('Unterhaltung nicht gefunden.',404);
  const r=await db.prepare('INSERT INTO direct_messages(conversation_id,sender_user_id,body) VALUES(?,?,?)').bind(id,u.id,body).run();await db.prepare(`UPDATE conversations SET updated_at=datetime('now') WHERE id=?`).bind(id).run();return json({ok:true,id:r.meta.last_row_id});
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
  const r=await db.prepare(`SELECT c.id,c.body,c.parent_comment_id,c.created_at,u.username,p.avatar_key,CASE WHEN p.last_seen_at>=datetime('now','-2 minutes') THEN 1 ELSE 0 END is_online,(SELECT COUNT(*) FROM news_comment_likes l WHERE l.comment_id=c.id) likes,${viewer?'EXISTS(SELECT 1 FROM news_comment_likes l2 WHERE l2.comment_id=c.id AND l2.user_id=?)':'0'} liked FROM news_comments c JOIN users u ON u.id=c.user_id LEFT JOIN profiles p ON p.user_id=u.id WHERE c.news_id=? ORDER BY c.created_at ASC`).bind(...(viewer?[viewer.id,n.id]:[n.id])).all();return json({comments:r.results||[]});
}
async function createNewsComment(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),slug=newsSlugFromRoute(route),b=await request.json(),body=cleanText(b.body,1500),parentId=b.parentId?Number(b.parentId):null;if(!body)return fail('Kommentar ist leer.');const n=await db.prepare(`SELECT id FROM news WHERE slug=? AND status='PUBLISHED'`).bind(slug).first();if(!n)return fail('News nicht gefunden.',404);
  if(parentId){const parent=await db.prepare('SELECT id FROM news_comments WHERE id=? AND news_id=?').bind(parentId,n.id).first();if(!parent)return fail('Antwort-Kommentar nicht gefunden.',404);}const r=await db.prepare('INSERT INTO news_comments(news_id,user_id,body,parent_comment_id) VALUES(?,?,?,?)').bind(n.id,u.id,body,parentId).run();return json({ok:true,id:r.meta.last_row_id});
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
    if(existing)await db.prepare('DELETE FROM follows WHERE follower_user_id=? AND followed_user_id=?').bind(u.id,target.id).run();else await db.prepare('INSERT INTO follows(follower_user_id,followed_user_id) VALUES(?,?)').bind(u.id,target.id).run();
    return json({following:!existing});
  }
  if(type==='club'){
    const club=await db.prepare('SELECT id FROM clubs WHERE slug=?').bind(slug).first();if(!club)return fail('Club nicht gefunden.',404);
    const existing=await db.prepare('SELECT 1 FROM club_follows WHERE user_id=? AND club_id=?').bind(u.id,club.id).first();
    if(existing){await db.batch([db.prepare('DELETE FROM club_follows WHERE user_id=? AND club_id=?').bind(u.id,club.id),db.prepare('UPDATE clubs SET followers_count=MAX(0,followers_count-1) WHERE id=?').bind(club.id)]);}else{await db.batch([db.prepare('INSERT INTO club_follows(user_id,club_id) VALUES(?,?)').bind(u.id,club.id),db.prepare('UPDATE clubs SET followers_count=followers_count+1 WHERE id=?').bind(club.id)]);}return json({following:!existing});
  }
  return fail('Ungültiger Follow-Typ.');
}

async function createClub(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),name=cleanText(b.name,50),slug=slugify(name);if(name.length<3)return fail('Clubname ist zu kurz.');
  const active=await db.prepare('SELECT 1 FROM club_members WHERE user_id=? AND left_at IS NULL').bind(u.id).first();if(active)return fail('Du bist bereits Mitglied eines aktiven Clubs.',409);
  const result=await db.prepare('INSERT INTO clubs(name,slug,manager_user_id,ea_club_id,platform,reputation) VALUES(?,?,?,?,?,1000)').bind(name,slug,u.id,cleanText(b.eaClubId,50),cleanText(b.platform,30)).run();const id=result.meta.last_row_id;
  await db.batch([db.prepare(`INSERT INTO club_members(club_id,user_id,role) VALUES(?,?,'MANAGER')`).bind(id,u.id),db.prepare(`UPDATE users SET role=CASE WHEN role='PLAYER' THEN 'MANAGER' ELSE role END WHERE id=?`).bind(u.id)]);return json({club:{id,name,slug}},201);
}
async function createApplication(request,env){const db=requireDb(env),u=await requireUser(request,env),b=await request.json();const club=await db.prepare('SELECT id FROM clubs WHERE slug=?').bind(cleanText(b.clubSlug,60)).first();if(!club)return fail('Club nicht gefunden.',404);const existing=await db.prepare(`SELECT 1 FROM applications WHERE user_id=? AND club_id=? AND status='OPEN'`).bind(u.id,club.id).first();if(existing)return fail('Du hast bereits eine offene Bewerbung.',409);const r=await db.prepare('INSERT INTO applications(user_id,club_id,message) VALUES(?,?,?)').bind(u.id,club.id,cleanText(b.message,1000)).run();return json({id:r.meta.last_row_id,status:'OPEN'},201)}
async function createContract(request,env){const db=requireDb(env),u=await requireUser(request,env),b=await request.json();const club=await db.prepare('SELECT id,manager_user_id FROM clubs WHERE slug=?').bind(cleanText(b.clubSlug,60)).first();if(!club)return fail('Club nicht gefunden.',404);if(!(await canClubPermission(db,u,club.id,'manage_page')))return fail('Du verwaltest diesen Club nicht.',403);const player=await db.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE').bind(cleanText(b.username,24)).first();if(!player)return fail('Spieler nicht gefunden.',404);const r=await db.prepare('INSERT INTO contracts(club_id,user_id,offered_by,starts_at,ends_at,message) VALUES(?,?,?,?,?,?)').bind(club.id,player.id,u.id,b.startsAt||null,b.endsAt||null,cleanText(b.message,800)).run();return json({id:r.meta.last_row_id,status:'OFFERED'},201)}

async function purchaseItem(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),itemId=Number(b.itemId);
  const item=await db.prepare('SELECT id,name,category,price_coins FROM shop_items WHERE id=? AND active=1').bind(itemId).first();
  if(!item)return fail('Shop-Item nicht gefunden.',404);
  const wallet=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(u.id).first();
  if(!wallet||wallet.balance<item.price_coins)return fail('Nicht genügend EPL Coins.',409);
  if(item.category!=='BUNDLE'){
    const owned=await db.prepare('SELECT 1 FROM user_inventory WHERE user_id=? AND item_id=?').bind(u.id,itemId).first();
    if(owned)return fail('Item bereits im Besitz.',409);
  }
  const stmts=[
    db.prepare('UPDATE coin_wallets SET balance=balance-?,lifetime_spent=lifetime_spent+?,updated_at=datetime(\'now\') WHERE user_id=?').bind(item.price_coins,item.price_coins,u.id),
    db.prepare('INSERT OR IGNORE INTO user_inventory(user_id,item_id) VALUES(?,?)').bind(u.id,itemId),
    db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'SHOP_PURCHASE','SHOP_ITEM',?,?)`).bind(u.id,-item.price_coins,String(itemId),item.name)
  ];
  if(item.category==='BUNDLE'){
    const parts=await db.prepare('SELECT item_id FROM shop_bundle_items WHERE bundle_item_id=?').bind(itemId).all();
    for(const part of parts.results||[])stmts.push(db.prepare('INSERT OR IGNORE INTO user_inventory(user_id,item_id) VALUES(?,?)').bind(u.id,part.item_id));
  }
  await db.batch(stmts);
  return json({ok:true,balance:wallet.balance-item.price_coins});
}
async function getWallet(request,env){const db=requireDb(env),u=await requireUser(request,env);const wallet=await db.prepare('SELECT * FROM coin_wallets WHERE user_id=?').bind(u.id).first();const tx=await db.prepare('SELECT amount,type,description,created_at FROM coin_transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(u.id).all();return json({wallet,transactions:tx.results})}

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
    await db.batch(stmts);return json({received:true});
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
  const u=await requireUser(request,env);
  if(!env.MEDIA)return fail('R2 binding MEDIA fehlt.',503);
  const form=await request.formData(),file=form.get('file'),kind=String(form.get('kind')||'avatar');
  const allowedKinds=['avatar','cover','club-logo','club-cover','post-media','cms-media'];
  if(!allowedKinds.includes(kind))return fail('Ungültiger Bildtyp.');
  if(kind==='cms-media')await requireAdminPermission(request,env,'cms');
  if(!(file instanceof File))return fail('Keine Datei übermittelt.');
  if(file.type!=='image/webp')return fail('Bilder müssen vor dem Upload als WebP optimiert werden.');
  const maxBytes=(kind==='avatar'||kind==='club-logo')?600*1024:(kind==='post-media'||kind==='cms-media'?1800*1024:1200*1024);
  if(file.size>maxBytes)return fail(`Optimiertes Bild ist zu groß. Maximal ${Math.round(maxBytes/1024)} KB erlaubt.`);
  const db=requireDb(env);let key,oldKey=null;
  if(kind==='post-media'||kind==='cms-media'){
    key=kind==='post-media'?`posts/${u.id}/media-${crypto.randomUUID()}.webp`:`cms/${u.id}/media-${crypto.randomUUID()}.webp`;
    await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:'image/webp',cacheControl:'public, max-age=31536000, immutable'},customMetadata:{kind,optimized:'client-webp'}});
    return json({key,url:`/api/media/${encodeURIComponent(key)}`,contentType:'image/webp',bytes:file.size});
  }
  if(kind==='club-logo'||kind==='club-cover'){
    const clubSlug=cleanText(form.get('clubSlug'),60);
    const club=await db.prepare('SELECT id,manager_user_id,logo_key,cover_key FROM clubs WHERE slug=?').bind(clubSlug).first();
    if(!club)return fail('Club nicht gefunden.',404);
    if(!(await canClubPermission(db,u,club.id,'manage_page')))return fail('Du verwaltest diesen Club nicht.',403);
    key=`clubs/${club.id}/${kind}-${crypto.randomUUID()}.webp`;oldKey=kind==='club-logo'?club.logo_key:club.cover_key;
    await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:'image/webp',cacheControl:'public, max-age=31536000, immutable'},customMetadata:{kind,optimized:'client-webp'}});
    const col=kind==='club-logo'?'logo_key':'cover_key';await db.prepare(`UPDATE clubs SET ${col}=?,updated_at=datetime('now') WHERE id=?`).bind(key,club.id).run();
  }else{
    const profile=await db.prepare('SELECT avatar_key,cover_key FROM profiles WHERE user_id=?').bind(u.id).first();if(!profile)return fail('Profil nicht gefunden.',404);
    key=`profiles/${u.id}/${kind}-${crypto.randomUUID()}.webp`;oldKey=kind==='avatar'?profile.avatar_key:profile.cover_key;
    await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:'image/webp',cacheControl:'public, max-age=31536000, immutable'},customMetadata:{kind,optimized:'client-webp'}});
    const col=kind==='avatar'?'avatar_key':'cover_key';await db.prepare(`UPDATE profiles SET ${col}=?,updated_at=datetime('now') WHERE user_id=?`).bind(key,u.id).run();
  }
  if(oldKey&&oldKey!==key){try{await env.MEDIA.delete(oldKey)}catch(err){console.warn('Altes R2 Bild konnte nicht gelöscht werden',oldKey,err)}}
  return json({key,url:`/api/media/${encodeURIComponent(key)}`,contentType:'image/webp',bytes:file.size});
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
      CASE WHEN c.actor_club_id IS NULL AND p.last_seen_at>=datetime('now','-2 minutes') THEN 1 ELSE 0 END is_online,
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

async function createPost(request,env){const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),body=cleanText(b.body,2000);if(!body)return fail('Beitrag ist leer.');let clubId=null;if(b.clubSlug){const c=await db.prepare('SELECT id,manager_user_id FROM clubs WHERE slug=?').bind(cleanText(b.clubSlug,60)).first();if(!c)return fail('Club nicht gefunden.',404);if(!(await canClubPermission(db,u,c.id,'manage_page')))return fail('Du darfst für diesen Club nicht posten.',403);clubId=c.id;}const r=await db.prepare('INSERT INTO posts(author_user_id,club_id,body,media_key,match_id) VALUES(?,?,?,?,?)').bind(clubId?null:u.id,clubId,body,cleanText(b.mediaKey,250)||null,b.matchId||null).run();return json({id:r.meta.last_row_id},201)}
async function adminCoinAward(request,env){const db=requireDb(env),u=await requireAdminPermission(request,env,'coins'),b=await request.json(),amount=Math.trunc(Number(b.amount));if(!Number.isFinite(amount)||amount===0||Math.abs(amount)>10000)return fail('Ungültiger Coin-Betrag.');const target=await db.prepare('SELECT id,username FROM users WHERE username=? COLLATE NOCASE').bind(cleanText(b.username,24)).first();if(!target)return fail('Spieler nicht gefunden.',404);if(amount<0){const w=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(target.id).first();if(!w||w.balance+amount<0)return fail('Wallet würde negativ werden.',409);}const ref=crypto.randomUUID();await db.batch([db.prepare('UPDATE coin_wallets SET balance=balance+?,lifetime_earned=lifetime_earned+CASE WHEN ?>0 THEN ? ELSE 0 END,lifetime_spent=lifetime_spent+CASE WHEN ?<0 THEN -? ELSE 0 END,updated_at=datetime(\'now\') WHERE user_id=?').bind(amount,amount,amount,amount,amount,target.id),db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'ADMIN_ADJUSTMENT','ADMIN',?,?)`).bind(target.id,amount,ref,cleanText(b.description,200)||`Admin-Anpassung durch ${u.username}`)]);const w2=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(target.id).first();return json({ok:true,balance:w2.balance})}
async function submitMatch(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),id=Number(route.split('/')[1]),b=await request.json();
  const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(id).first();if(!m)return fail('Match nicht gefunden.',404);
  const canHome=await canClubPermission(db,u,m.home_club_id,'submit_results'),canAway=await canClubPermission(db,u,m.away_club_id,'submit_results');
  if(!canHome&&!canAway)return fail('Du darfst für keinen beteiligten Club Ergebnisse melden.',403);
  const hs=Math.trunc(Number(b.homeScore)),as=Math.trunc(Number(b.awayScore));if(hs<0||as<0||hs>99||as>99)return fail('Ungültiges Ergebnis.');
  await db.prepare(`UPDATE matches SET home_score=?,away_score=?,status='SUBMITTED',submitted_by=?,notes=?,updated_at=datetime('now') WHERE id=?`).bind(hs,as,u.id,cleanText(b.notes,500),id).run();
  return json({ok:true,status:'SUBMITTED'});
}
async function confirmMatch(route,request,env){
  const db=requireDb(env),u=await requireUser(request,env),id=Number(route.split('/')[1]);const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(id).first();if(!m)return fail('Match nicht gefunden.',404);if(m.status!=='SUBMITTED')return fail('Match ist nicht zur Bestätigung eingereicht.',409);
  if(u.role!=='SUPER_ADMIN'){
    const roles=await getAdminRoles(db,u.id),isMatchAdmin=roles.some(r=>r==='FULL_ADMIN'||r==='LEAGUE_ADMIN'||r==='MATCH_ADMIN');
    if(!isMatchAdmin){
      const canHome=await canClubPermission(db,u,m.home_club_id,'submit_results'),canAway=await canClubPermission(db,u,m.away_club_id,'submit_results');if(!canHome&&!canAway)return fail('Keine Berechtigung.',403);
      const submitter=await db.prepare('SELECT c.id FROM clubs c WHERE c.manager_user_id=? OR EXISTS(SELECT 1 FROM club_staff_permissions cp WHERE cp.club_id=c.id AND cp.user_id=? AND cp.can_submit_results=1)').bind(m.submitted_by,m.submitted_by).first();
      const ownClub=canHome?m.home_club_id:m.away_club_id;if(submitter?.id===ownClub)return fail('Das Ergebnis muss vom Gegner oder Admin bestätigt werden.',403);
    }
  }
  await db.prepare(`UPDATE matches SET status='CONFIRMED',confirmed_by=?,updated_at=datetime('now') WHERE id=?`).bind(u.id,id).run();await awardMatchCoins(db,m);return json({ok:true,status:'CONFIRMED'});
}

async function setupProfile(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json();
  const username=cleanText(b.username,24),eaId=cleanText(b.eaId,80),platform=cleanText(b.platform,30),position=cleanText(b.position,8),secondary=cleanText(b.secondaryPosition,8),country=cleanText(b.country||'DE',2).toUpperCase(),shirtNumber=Number(b.shirtNumber);
  if(!/^[A-Za-z0-9_.-]{3,24}$/.test(username))return fail('EPL Benutzername: 3–24 Zeichen, nur Buchstaben, Zahlen, _ . -');
  if(eaId.length<3)return fail('Bitte gib deine EA ID an.');
  if(!['ps5','xbox-series','pc'].includes(platform))return fail('Bitte wähle eine gültige Plattform.');
  if(!['ST','ZOM','ZM','ZDM','LM','RM','LV','RV','IV','TW'].includes(position))return fail('Bitte wähle deine Hauptposition.');
  if(secondary&&!['ST','ZOM','ZM','ZDM','LM','RM','LV','RV','IV','TW'].includes(secondary))return fail('Ungültige Nebenposition.');
  if(!Number.isInteger(shirtNumber)||shirtNumber<1||shirtNumber>99)return fail('Trikotnummer muss zwischen 1 und 99 liegen.');
  if(!/^[A-Z]{2}$/.test(country))return fail('Land muss als zweistelliger Code angegeben werden, z. B. DE.');
  const taken=await db.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE AND id<>?').bind(username,u.id).first();if(taken)return fail('Dieser EPL Benutzername ist bereits vergeben.',409);
  await db.batch([
    db.prepare(`UPDATE users SET username=?,updated_at=datetime('now') WHERE id=?`).bind(username,u.id),
    db.prepare(`UPDATE profiles SET ea_id=?,platform=?,country=?,position=?,secondary_position=?,updated_at=datetime('now') WHERE user_id=?`).bind(eaId,platform,country,position,secondary,u.id),
    db.prepare(`INSERT INTO profile_onboarding(user_id,shirt_number,completed,updated_at) VALUES(?,?,1,datetime('now')) ON CONFLICT(user_id) DO UPDATE SET shirt_number=excluded.shirt_number,completed=1,updated_at=datetime('now')`).bind(u.id,shirtNumber)
  ]);
  const refreshed=await currentUser(request,env);return json({ok:true,user:refreshed});
}

async function updateProfile(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json();
  const fields={
    ea_id:b.eaId===undefined?cleanText(u.ea_id,80):cleanText(b.eaId,80),
    platform:b.platform===undefined?cleanText(u.platform,30):cleanText(b.platform,30),
    console_id:cleanText(b.consoleId,80),discord:cleanText(b.discord,80),
    country:b.country===undefined?cleanText(u.country||'DE',2).toUpperCase():cleanText(b.country||'DE',2).toUpperCase(),
    position:b.position===undefined?cleanText(u.position,8):cleanText(b.position,8),
    secondary_position:b.secondaryPosition===undefined?cleanText(u.secondary_position,8):cleanText(b.secondaryPosition,8),
    bio:b.bio===undefined?cleanText(u.bio,500):cleanText(b.bio,500),free_agent:b.freeAgent?1:0
  };
  await db.prepare(`UPDATE profiles SET ea_id=?,platform=?,console_id=?,discord=?,country=?,position=?,secondary_position=?,bio=?,free_agent=?,updated_at=datetime('now') WHERE user_id=?`).bind(fields.ea_id,fields.platform,fields.console_id,fields.discord,fields.country,fields.position,fields.secondary_position,fields.bio,fields.free_agent,u.id).run();
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
    db.prepare(`SELECT u.id,u.username,u.email,u.role,u.status,u.created_at,p.ea_id,p.platform,p.country,p.position,p.secondary_position,p.bio,p.pac,p.sho,p.pas,p.dri,p.def,p.phy,p.overall,p.verified,
      COALESCE(po.shirt_number,0) shirt_number,COALESCE(w.balance,0) coins,COALESCE(GROUP_CONCAT(DISTINCT ar.role),'') admin_roles,
      c.name club_name,c.id club_id,cm.role club_role
      FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN profile_onboarding po ON po.user_id=u.id LEFT JOIN coin_wallets w ON w.user_id=u.id
      LEFT JOIN user_admin_roles ar ON ar.user_id=u.id LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id
      GROUP BY u.id ORDER BY u.created_at DESC`).all(),
    db.prepare(`SELECT c.id,c.name,c.slug,c.ea_club_id,c.platform,c.division_id,c.reputation,c.followers_count,c.verified,u.username manager_username,u.id manager_user_id,d.name division_name,
      cd.bio,cd.discord,cd.website FROM clubs c LEFT JOIN users u ON u.id=c.manager_user_id LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN club_details cd ON cd.club_id=c.id ORDER BY c.created_at DESC`).all(),
    db.prepare(`SELECT * FROM seasons ORDER BY id DESC`).all(),
    db.prepare(`SELECT d.*,s.name season_name FROM divisions d JOIN seasons s ON s.id=d.season_id ORDER BY d.season_id DESC,d.level ASC`).all(),
    db.prepare(`SELECT m.*,h.name home_name,a.name away_name,s.name season_name,d.name division_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id JOIN seasons s ON s.id=m.season_id JOIN divisions d ON d.id=m.division_id ORDER BY m.scheduled_at DESC LIMIT 100`).all(),
    db.prepare(`SELECT n.id,n.slug,n.title,n.excerpt,n.body,n.image_key,n.status,n.published_at,n.created_at,u.username author FROM news n LEFT JOIN users u ON u.id=n.author_user_id ORDER BY n.created_at DESC LIMIT 100`).all(),
    db.prepare(`SELECT t.id,t.type,t.occurred_at,u.username player,fc.name from_club,tc.name to_club FROM transfers t JOIN users u ON u.id=t.user_id LEFT JOIN clubs fc ON fc.id=t.from_club_id LEFT JOIN clubs tc ON tc.id=t.to_club_id ORDER BY t.occurred_at DESC LIMIT 100`).all()
  ]);
  const roles=admin.role==='SUPER_ADMIN'?['FULL_ADMIN']:(admin.admin_roles||[]);
  const can=p=>admin.role==='SUPER_ADMIN'||roles.some(r=>(ADMIN_ROLE_PERMISSIONS[r]||[]).includes('*')||(ADMIN_ROLE_PERMISSIONS[r]||[]).includes(p));
  const rawUsers=users.results||[];
  const safeUsers=can('profiles')?rawUsers:(can('clubs')||can('coins')||can('transfers')?rawUsers.map(u=>({id:u.id,username:u.username,ea_id:u.ea_id,position:u.position,club_name:u.club_name,club_id:u.club_id,club_role:u.club_role,coins:u.coins,role:u.role,status:u.status,admin_roles:''})):[]);
  return json({admin:{id:admin.id,username:admin.username,role:admin.role,admin_roles:admin.admin_roles||[]},users:safeUsers,clubs:(can('clubs')||can('matches')||can('transfers'))?(clubs.results||[]):[],seasons:(can('leagues')||can('matches'))?(seasons.results||[]):[],divisions:(can('leagues')||can('matches'))?(divisions.results||[]):[],matches:can('matches')?(matches.results||[]):[],news:can('news')?(news.results||[]):[],transfers:can('transfers')?(transfers.results||[]):[]});
}

async function adminUserAccess(request,env){
  const db=requireDb(env),owner=await requireAdminPermission(request,env,'users',{ownerOnly:true}),b=await request.json(),userId=asId(b.userId);
  if(!userId)return fail('Benutzer fehlt.');
  const target=await db.prepare('SELECT id,username,role FROM users WHERE id=?').bind(userId).first();if(!target)return fail('Benutzer nicht gefunden.',404);
  if(target.id===owner.id && b.status && b.status!=='ACTIVE')return fail('Der Hauptadmin kann sich nicht selbst sperren.',409);
  const roles=[...new Set(Array.isArray(b.adminRoles)?b.adminRoles:[])].filter(x=>ADMIN_ROLES_ALLOWED.includes(x));
  const status=['ACTIVE','SUSPENDED','BANNED'].includes(b.status)?b.status:'ACTIVE';
  let baseRole=['PLAYER','MANAGER'].includes(b.baseRole)?b.baseRole:target.role;
  if(target.role==='SUPER_ADMIN'&&target.id!==owner.id)baseRole='PLAYER';
  const statements=[db.prepare(`UPDATE users SET status=?,role=?,updated_at=datetime('now') WHERE id=?`).bind(status,baseRole,userId),db.prepare('DELETE FROM user_admin_roles WHERE user_id=?').bind(userId)];
  for(const role of roles)statements.push(db.prepare('INSERT INTO user_admin_roles(user_id,role,assigned_by) VALUES(?,?,?)').bind(userId,role,owner.id));
  await db.batch(statements);return json({ok:true,username:target.username,adminRoles:roles,status,baseRole});
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
    db.prepare(`UPDATE profiles SET ea_id=?,platform=?,country=?,position=?,secondary_position=?,bio=?,verified=?,pac=?,sho=?,pas=?,dri=?,def=?,phy=?,overall=?,updated_at=datetime('now') WHERE user_id=?`)
      .bind(cleanText(b.eaId,80),cleanText(b.platform,30),country,position,secondary,cleanText(b.bio,500),bool01(b.verified),...nums,userId),
    db.prepare(`INSERT INTO profile_onboarding(user_id,shirt_number,completed,updated_at) VALUES(?,?,1,datetime('now')) ON CONFLICT(user_id) DO UPDATE SET shirt_number=excluded.shirt_number,completed=1,updated_at=datetime('now')`)
      .bind(userId,Math.max(1,Math.min(99,Math.trunc(Number(b.shirtNumber)||10))))
  ]);
  return json({ok:true});
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
  await db.prepare(`INSERT INTO club_details(club_id,bio,discord,website,updated_at) VALUES(?,?,?,?,datetime('now')) ON CONFLICT(club_id) DO UPDATE SET bio=excluded.bio,discord=excluded.discord,website=excluded.website,updated_at=datetime('now')`).bind(clubId,cleanText(b.bio,1000),cleanText(b.discord,120),cleanText(b.website,250)).run();
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

async function adminSeasonSave(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'leagues');const b=await request.json(),id=asId(b.id),name=cleanText(b.name,80),status=['DRAFT','REGISTRATION','ACTIVE','FINISHED'].includes(b.status)?b.status:'DRAFT';if(!name)return fail('Saisonname fehlt.');
  if(id)await db.prepare('UPDATE seasons SET name=?,status=?,starts_at=?,ends_at=? WHERE id=?').bind(name,status,b.startsAt||null,b.endsAt||null,id).run();else await db.prepare('INSERT INTO seasons(name,status,starts_at,ends_at) VALUES(?,?,?,?)').bind(name,status,b.startsAt||null,b.endsAt||null).run();return json({ok:true});
}
async function adminDivisionSave(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'leagues');const b=await request.json(),id=asId(b.id),seasonId=asId(b.seasonId),name=cleanText(b.name,80),level=Math.max(1,Math.trunc(Number(b.level)||1)),maxClubs=Math.max(2,Math.min(64,Math.trunc(Number(b.maxClubs)||16)));if(!seasonId||!name)return fail('Saison und Ligename fehlen.');
  if(id)await db.prepare('UPDATE divisions SET season_id=?,name=?,level=?,max_clubs=? WHERE id=?').bind(seasonId,name,level,maxClubs,id).run();else await db.prepare('INSERT INTO divisions(season_id,name,level,max_clubs) VALUES(?,?,?,?)').bind(seasonId,name,level,maxClubs).run();return json({ok:true});
}
async function adminMatchSave(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'matches');const b=await request.json(),id=asId(b.id),seasonId=asId(b.seasonId),divisionId=asId(b.divisionId),home=asId(b.homeClubId),away=asId(b.awayClubId),matchday=Math.max(1,Math.trunc(Number(b.matchday)||1)),scheduled=cleanText(b.scheduledAt,40);if(!seasonId||!divisionId||!home||!away||home===away||!scheduled)return fail('Matchdaten sind unvollständig.');
  if(id)await db.prepare(`UPDATE matches SET season_id=?,division_id=?,matchday=?,home_club_id=?,away_club_id=?,scheduled_at=?,updated_at=datetime('now') WHERE id=?`).bind(seasonId,divisionId,matchday,home,away,scheduled,id).run();else await db.prepare(`INSERT INTO matches(season_id,division_id,matchday,home_club_id,away_club_id,scheduled_at) VALUES(?,?,?,?,?,?)`).bind(seasonId,divisionId,matchday,home,away,scheduled).run();return json({ok:true});
}
async function adminMatchResult(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'matches'),b=await request.json(),id=asId(b.matchId),hs=Math.trunc(Number(b.homeScore)),as=Math.trunc(Number(b.awayScore));if(!id||hs<0||as<0||hs>99||as>99)return fail('Ungültiges Ergebnis.');
  const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(id).first();if(!m)return fail('Match nicht gefunden.',404);const wasConfirmed=m.status==='CONFIRMED';
  await db.prepare(`UPDATE matches SET home_score=?,away_score=?,status='CONFIRMED',confirmed_by=?,notes=?,updated_at=datetime('now') WHERE id=?`).bind(hs,as,admin.id,cleanText(b.notes,500),id).run();if(!wasConfirmed)await awardMatchCoins(db,{...m,home_score:hs,away_score:as});return json({ok:true});
}
async function adminNewsSave(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'news'),b=await request.json(),id=asId(b.id),title=cleanText(b.title,160),body=cleanText(b.body,20000),status=['DRAFT','PUBLISHED','ARCHIVED'].includes(b.status)?b.status:'DRAFT';if(!title||!body)return fail('Titel und Inhalt sind erforderlich.');const slug=slugify(b.slug||title),excerpt=cleanText(b.excerpt,400),imageKey=cleanText(b.imageKey,250)||null,published=status==='PUBLISHED'?(b.publishedAt||new Date().toISOString()):null;
  if(id)await db.prepare(`UPDATE news SET slug=?,title=?,excerpt=?,body=?,image_key=?,status=?,author_user_id=?,published_at=? WHERE id=?`).bind(slug,title,excerpt,body,imageKey,status,admin.id,published,id).run();else await db.prepare(`INSERT INTO news(slug,title,excerpt,body,image_key,status,author_user_id,published_at) VALUES(?,?,?,?,?,?,?,?)`).bind(slug,title,excerpt,body,imageKey,status,admin.id,published).run();return json({ok:true});
}
async function adminTransferSave(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'transfers');const b=await request.json(),userId=asId(b.userId),from=asId(b.fromClubId),to=asId(b.toClubId),type=['SIGNING','TRANSFER','RELEASE','LOAN'].includes(b.type)?b.type:null;if(!userId||!type)return fail('Spieler und Transfertyp sind erforderlich.');await db.prepare(`INSERT INTO transfers(user_id,from_club_id,to_club_id,type,occurred_at) VALUES(?,?,?,?,COALESCE(?,datetime('now')))`).bind(userId,from,to,type,b.occurredAt||null).run();return json({ok:true});
}

async function managerOverview(request,env){
  const db=requireDb(env),u=await requireUser(request,env);
  const club=await db.prepare(`SELECT DISTINCT c.*,d.name division_name,cd.bio,cd.discord,cd.website FROM clubs c LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN club_details cd ON cd.club_id=c.id LEFT JOIN club_members cm ON cm.club_id=c.id LEFT JOIN club_staff_permissions cp ON cp.club_id=c.id AND cp.user_id=? WHERE c.manager_user_id=? OR (cm.user_id=? AND cm.left_at IS NULL AND cm.role IN ('MANAGER','CO_MANAGER')) OR cp.can_manage_page=1 OR cp.can_submit_results=1 OR cp.can_manage_stats=1 LIMIT 1`).bind(u.id,u.id,u.id).first();
  if(!club)return fail('Du verwaltest aktuell keinen Club.',403);
  const [squad,matches,applications]=await Promise.all([
    db.prepare(`SELECT u.id,u.username,p.position,p.overall,cm.role,cm.shirt_number FROM club_members cm JOIN users u ON u.id=cm.user_id LEFT JOIN profiles p ON p.user_id=u.id WHERE cm.club_id=? AND cm.left_at IS NULL ORDER BY CASE cm.role WHEN 'MANAGER' THEN 0 WHEN 'CO_MANAGER' THEN 1 WHEN 'CAPTAIN' THEN 2 ELSE 3 END,u.username`).bind(club.id).all(),
    db.prepare(`SELECT m.*,h.name home_name,a.name away_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id WHERE m.home_club_id=? OR m.away_club_id=? ORDER BY m.scheduled_at DESC LIMIT 30`).bind(club.id,club.id).all(),
    db.prepare(`SELECT a.id,a.status,a.message,a.created_at,u.username,p.position,p.overall FROM applications a JOIN users u ON u.id=a.user_id LEFT JOIN profiles p ON p.user_id=u.id WHERE a.club_id=? ORDER BY a.created_at DESC LIMIT 30`).bind(club.id).all()
  ]);
  return json({club,squad:squad.results||[],matches:matches.results||[],applications:applications.results||[]});
}
async function managerClubUpdate(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),clubId=asId(b.clubId);if(!clubId)return fail('Club fehlt.');if(!(await canClubPermission(db,u,clubId,'manage_page')))return fail('Keine Rechte für die Clubseite.',403);
  await db.prepare(`INSERT INTO club_details(club_id,bio,discord,website,updated_at) VALUES(?,?,?,?,datetime('now')) ON CONFLICT(club_id) DO UPDATE SET bio=excluded.bio,discord=excluded.discord,website=excluded.website,updated_at=datetime('now')`).bind(clubId,cleanText(b.bio,1000),cleanText(b.discord,120),cleanText(b.website,250)).run();return json({ok:true});
}
async function managerMatchStats(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),matchId=asId(b.matchId),userId=asId(b.userId);if(!matchId||!userId)return fail('Match und Spieler fehlen.');const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(matchId).first();if(!m)return fail('Match nicht gefunden.',404);
  let clubId=null;if(await canClubPermission(db,u,m.home_club_id,'manage_stats'))clubId=m.home_club_id;else if(await canClubPermission(db,u,m.away_club_id,'manage_stats'))clubId=m.away_club_id;else return fail('Keine Statistik-Rechte für dieses Match.',403);
  const member=await db.prepare('SELECT 1 FROM club_members WHERE club_id=? AND user_id=? AND left_at IS NULL').bind(clubId,userId).first();if(!member)return fail('Spieler gehört nicht zum Club.',409);
  const goals=Math.max(0,Math.min(99,Math.trunc(Number(b.goals)||0))),assists=Math.max(0,Math.min(99,Math.trunc(Number(b.assists)||0))),saves=Math.max(0,Math.min(99,Math.trunc(Number(b.saves)||0))),rating=Math.max(0,Math.min(10,Number(b.rating)||0));
  await db.prepare(`INSERT INTO player_stats(match_id,user_id,club_id,goals,assists,saves,clean_sheet,yellow_cards,red_cards,rating,motm) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(match_id,user_id) DO UPDATE SET club_id=excluded.club_id,goals=excluded.goals,assists=excluded.assists,saves=excluded.saves,clean_sheet=excluded.clean_sheet,yellow_cards=excluded.yellow_cards,red_cards=excluded.red_cards,rating=excluded.rating,motm=excluded.motm`).bind(matchId,userId,clubId,goals,assists,saves,bool01(b.cleanSheet),Math.max(0,Math.min(2,Math.trunc(Number(b.yellowCards)||0))),Math.max(0,Math.min(1,Math.trunc(Number(b.redCards)||0))),rating,bool01(b.motm)).run();return json({ok:true});
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
}
async function eaClubInfo(request,env){const u=new URL(request.url),clubId=(u.searchParams.get('clubId')||'').trim(),platform=(u.searchParams.get('platform')||'common-gen5').trim();if(!/^\d{1,12}$/.test(clubId))return fail('Ungültige EA Club ID.');if(!['common-gen5','common-gen4'].includes(platform))return fail('Ungültige Plattform.');const target=`https://proclubs.ea.com/api/fc/clubs/info?platform=${encodeURIComponent(platform)}&clubIds=${encodeURIComponent(clubId)}`;const res=await fetch(target,{headers:{accept:'application/json','user-agent':'EPL-Elite-Pro-League/1.0'},signal:AbortSignal.timeout(9000)});if(!res.ok)return fail(`EA Clubs antwortet mit HTTP ${res.status}.`,502);const data=await res.json();return json({provider:'EA Clubs',clubId,platform,data});}
async function getProfile(slug,request,env){
  const db=requireDb(env),viewer=await currentUser(request,env);
  const p=await db.prepare(`SELECT u.id,u.username,u.role,p.*,COALESCE(po.shirt_number,0) shirt_number,COALESCE(w.balance,0) coins,
    CASE WHEN p.last_seen_at>=datetime('now','-2 minutes') THEN 1 ELSE 0 END is_online,
    (SELECT COUNT(*) FROM follows WHERE followed_user_id=u.id) followers,
    (SELECT COUNT(*) FROM follows WHERE follower_user_id=u.id) following,
    c.id club_id,c.name club,c.slug club_slug,cm.role club_role
    FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN profile_onboarding po ON po.user_id=u.id LEFT JOIN coin_wallets w ON w.user_id=u.id
    LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id
    WHERE lower(u.username)=?`).bind(slug.toLowerCase()).first();
  if(!p)return fail('Spieler nicht gefunden.',404);
  const likeCount=await db.prepare('SELECT COUNT(*) count FROM profile_likes WHERE target_user_id=?').bind(p.id).first();
  p.profile_likes=likeCount?.count||0;p.viewer_liked=viewer?!!(await db.prepare('SELECT 1 FROM profile_likes WHERE user_id=? AND target_user_id=?').bind(viewer.id,p.id).first()):false;
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
    db.prepare(`SELECT si.id,si.name,si.description,si.asset_key,si.rarity FROM user_inventory ui JOIN shop_items si ON si.id=ui.item_id WHERE ui.user_id=? AND si.category='BADGE' ORDER BY ui.acquired_at DESC LIMIT 8`).bind(p.id).all()
  ]);
  let inventory=[];
  if(viewer?.id===p.id){const inv=await db.prepare(`SELECT si.id,si.name,si.category,si.description,si.rarity,si.asset_key,si.price_coins,si.price_eur_cents,ui.acquired_at FROM user_inventory ui JOIN shop_items si ON si.id=ui.item_id WHERE ui.user_id=? ORDER BY ui.acquired_at DESC`).bind(p.id).all();inventory=inv.results||[];}
  return json({profile:p,stats:stats||{},posts:posts.results||[],recentMatches:recentMatches.results||[],achievements:achievements.results||[],clubHistory:clubHistory.results||[],inventory,badges:badges.results||[]});
}
async function getClub(slug,request,env){
  const db=requireDb(env),viewer=await currentUser(request,env);
  const c=await db.prepare(`SELECT c.*,u.username manager_username,d.name division_name,cd.bio,cd.discord,cd.website
    FROM clubs c LEFT JOIN users u ON u.id=c.manager_user_id LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN club_details cd ON cd.club_id=c.id WHERE c.slug=?`).bind(slug).first();
  if(!c)return fail('Club nicht gefunden.',404);
  const likeCount=await db.prepare('SELECT COUNT(*) count FROM club_likes WHERE club_id=?').bind(c.id).first();
  c.profile_likes=likeCount?.count||0;c.viewer_liked=viewer?!!(await db.prepare('SELECT 1 FROM club_likes WHERE user_id=? AND club_id=?').bind(viewer.id,c.id).first()):false;
  const [squad,posts,recentMatches,upcomingMatches,transfers,achievements,topPlayers]=await Promise.all([
    db.prepare(`SELECT u.id,u.username,cm.role,COALESCE(cm.shirt_number,po.shirt_number) shirt_number,p.position,p.overall,p.avatar_key,p.country,CASE WHEN p.last_seen_at>=datetime('now','-2 minutes') THEN 1 ELSE 0 END is_online
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
async function getStandings(env){const db=requireDb(env);const r=await db.prepare(`WITH stats AS (SELECT sc.club_id,COUNT(m.id) played,SUM(CASE WHEN (m.home_club_id=sc.club_id AND m.home_score>m.away_score) OR (m.away_club_id=sc.club_id AND m.away_score>m.home_score) THEN 1 ELSE 0 END) wins,SUM(CASE WHEN m.home_score=m.away_score THEN 1 ELSE 0 END) draws,SUM(CASE WHEN (m.home_club_id=sc.club_id AND m.home_score<m.away_score) OR (m.away_club_id=sc.club_id AND m.away_score<m.home_score) THEN 1 ELSE 0 END) losses,SUM(CASE WHEN m.home_club_id=sc.club_id THEN m.home_score ELSE m.away_score END) gf,SUM(CASE WHEN m.home_club_id=sc.club_id THEN m.away_score ELSE m.home_score END) ga FROM season_clubs sc LEFT JOIN matches m ON m.season_id=sc.season_id AND (m.home_club_id=sc.club_id OR m.away_club_id=sc.club_id) AND m.status='CONFIRMED' WHERE sc.season_id=1 GROUP BY sc.club_id) SELECT c.id,c.name,c.slug,COALESCE(s.played,0) played,COALESCE(s.wins,0) wins,COALESCE(s.draws,0) draws,COALESCE(s.losses,0) losses,COALESCE(s.gf,0) gf,COALESCE(s.ga,0) ga,(COALESCE(s.wins,0)*3+COALESCE(s.draws,0)) points FROM clubs c JOIN season_clubs sc ON sc.club_id=c.id AND sc.season_id=1 LEFT JOIN stats s ON s.club_id=c.id ORDER BY points DESC,(gf-ga) DESC,gf DESC`).all();return json({standings:r.results})}
async function getFixtures(env){const db=requireDb(env);const r=await db.prepare(`SELECT m.*,h.name home_name,h.slug home_slug,a.name away_name,a.slug away_slug,d.name division_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id JOIN divisions d ON d.id=m.division_id ORDER BY scheduled_at ASC LIMIT 50`).all();return json({fixtures:r.results})}

async function listPlayers(env){
  const db=requireDb(env);
  const r=await db.prepare(`SELECT u.username,lower(u.username) slug,p.position,p.secondary_position,p.country,p.avatar_key,p.overall,
    CASE WHEN p.last_seen_at>=datetime('now','-2 minutes') THEN 1 ELSE 0 END is_online,p.equipped_avatar_frame_id,p.equipped_name_effect_id,
    COALESCE(c.name,'Free Agent') club,
    COALESCE((SELECT COUNT(*) FROM player_stats ps WHERE ps.user_id=u.id),0) matches,
    COALESCE((SELECT SUM(ps.goals) FROM player_stats ps WHERE ps.user_id=u.id),0) goals,
    COALESCE((SELECT SUM(ps.assists) FROM player_stats ps WHERE ps.user_id=u.id),0) assists,
    COALESCE((SELECT SUM(ps.saves) FROM player_stats ps WHERE ps.user_id=u.id),0) saves,
    COALESCE((SELECT SUM(ps.clean_sheet) FROM player_stats ps WHERE ps.user_id=u.id),0) clean_sheets,
    COALESCE(ROUND((SELECT AVG(ps.rating) FROM player_stats ps WHERE ps.user_id=u.id),2),COALESCE(p.overall,0)) rating
    FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN profile_onboarding po ON po.user_id=u.id
    LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id
    WHERE u.status='ACTIVE' AND COALESCE(po.completed,CASE WHEN length(trim(COALESCE(p.ea_id,'')))>0 AND length(trim(COALESCE(p.position,'')))>0 THEN 1 ELSE 0 END)=1
    ORDER BY CASE WHEN p.position='TW' THEN COALESCE((SELECT SUM(ps.saves) FROM player_stats ps WHERE ps.user_id=u.id),0) ELSE COALESCE((SELECT SUM(ps.goals) FROM player_stats ps WHERE ps.user_id=u.id),0) END DESC,u.created_at DESC`).all();
  return json({players:r.results});
}
async function listClubs(env){
  const db=requireDb(env);
  const r=await db.prepare(`SELECT c.id,c.name,c.slug,c.logo_key,c.cover_key,c.reputation,c.followers_count,c.verified,d.name division,u.username manager,COALESCE((SELECT COUNT(*) FROM club_members cm WHERE cm.club_id=c.id AND cm.left_at IS NULL),0) squad_size,COALESCE((SELECT COUNT(*) FROM matches m WHERE (m.home_club_id=c.id OR m.away_club_id=c.id) AND m.status='CONFIRMED'),0) played,COALESCE((SELECT COUNT(*)*3 FROM matches m WHERE ((m.home_club_id=c.id AND m.home_score>m.away_score) OR (m.away_club_id=c.id AND m.away_score>m.home_score)) AND m.status='CONFIRMED'),0)+COALESCE((SELECT COUNT(*) FROM matches m WHERE (m.home_club_id=c.id OR m.away_club_id=c.id) AND m.home_score=m.away_score AND m.status='CONFIRMED'),0) points FROM clubs c LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN users u ON u.id=c.manager_user_id ORDER BY c.created_at DESC`).all();
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
  const [news,fixtures,players,clubs,transfers,standings]=await Promise.all([
    db.prepare(`SELECT id,slug,title,excerpt,image_key,published_at FROM news WHERE status='PUBLISHED' ORDER BY COALESCE(published_at,created_at) DESC LIMIT 3`).all(),
    db.prepare(`SELECT m.id,m.scheduled_at,m.status,h.name home_name,h.slug home_slug,a.name away_name,a.slug away_slug,d.name division_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id JOIN divisions d ON d.id=m.division_id ORDER BY scheduled_at ASC LIMIT 6`).all(),
    db.prepare(`SELECT u.username,lower(u.username) slug,p.position,p.country,p.avatar_key,p.equipped_avatar_frame_id,p.equipped_name_effect_id,CASE WHEN p.last_seen_at>=datetime('now','-2 minutes') THEN 1 ELSE 0 END is_online,COALESCE(c.name,'Free Agent') club,COALESCE((SELECT SUM(ps.goals) FROM player_stats ps WHERE ps.user_id=u.id),0) goals,COALESCE((SELECT SUM(ps.assists) FROM player_stats ps WHERE ps.user_id=u.id),0) assists,COALESCE((SELECT COUNT(*) FROM player_stats ps WHERE ps.user_id=u.id),0) matches,COALESCE(ROUND((SELECT AVG(ps.rating) FROM player_stats ps WHERE ps.user_id=u.id),2),COALESCE(p.overall,0)) rating FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN profile_onboarding po ON po.user_id=u.id LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id WHERE u.status='ACTIVE' AND COALESCE(po.completed,CASE WHEN length(trim(COALESCE(p.ea_id,'')))>0 AND length(trim(COALESCE(p.position,'')))>0 THEN 1 ELSE 0 END)=1 ORDER BY goals DESC,matches DESC LIMIT 6`).all(),
    db.prepare(`SELECT c.name,c.slug,c.logo_key,c.reputation,c.followers_count,COALESCE(d.name,'Ohne Division') division,u.username manager FROM clubs c LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN users u ON u.id=c.manager_user_id ORDER BY c.created_at DESC LIMIT 8`).all(),
    db.prepare(`SELECT t.id,t.type,t.occurred_at AS created_at,u.username player,p.position,p.overall rating,fc.name from_club,tc.name to_club FROM transfers t LEFT JOIN users u ON u.id=t.user_id LEFT JOIN profiles p ON p.user_id=t.user_id LEFT JOIN clubs fc ON fc.id=t.from_club_id LEFT JOIN clubs tc ON tc.id=t.to_club_id ORDER BY t.occurred_at DESC LIMIT 6`).all(),
    db.prepare(`WITH stats AS (SELECT sc.club_id,COUNT(m.id) played,SUM(CASE WHEN (m.home_club_id=sc.club_id AND m.home_score>m.away_score) OR (m.away_club_id=sc.club_id AND m.away_score>m.home_score) THEN 1 ELSE 0 END) wins,SUM(CASE WHEN m.home_score=m.away_score THEN 1 ELSE 0 END) draws,SUM(CASE WHEN (m.home_club_id=sc.club_id AND m.home_score<m.away_score) OR (m.away_club_id=sc.club_id AND m.away_score<m.home_score) THEN 1 ELSE 0 END) losses,SUM(CASE WHEN m.home_club_id=sc.club_id THEN m.home_score ELSE m.away_score END) gf,SUM(CASE WHEN m.home_club_id=sc.club_id THEN m.away_score ELSE m.home_score END) ga FROM season_clubs sc LEFT JOIN matches m ON m.season_id=sc.season_id AND (m.home_club_id=sc.club_id OR m.away_club_id=sc.club_id) AND m.status='CONFIRMED' WHERE sc.season_id=1 GROUP BY sc.club_id) SELECT c.id,c.name,c.slug,COALESCE(s.played,0) played,COALESCE(s.wins,0) wins,COALESCE(s.draws,0) draws,COALESCE(s.losses,0) losses,COALESCE(s.gf,0) gf,COALESCE(s.ga,0) ga,(COALESCE(s.wins,0)*3+COALESCE(s.draws,0)) points FROM clubs c JOIN season_clubs sc ON sc.club_id=c.id AND sc.season_id=1 LEFT JOIN stats s ON s.club_id=c.id ORDER BY points DESC,(gf-ga) DESC,gf DESC LIMIT 6`).all()
  ]);
  return json({news:news.results,fixtures:fixtures.results,players:players.results,clubs:clubs.results,transfers:transfers.results,standings:standings.results});
}

// ============================================================
// EPL v4 additions: dynamic Shop/CMS, moderation and goals
// ============================================================
async function getShopCatalog(env){
  const db=requireDb(env);
  const [items,parts]=await Promise.all([
    db.prepare(`SELECT id,sku,name,category,description,price_coins,price_eur_cents,asset_key,rarity,active FROM shop_items WHERE active=1 ORDER BY CASE category WHEN 'AVATAR_FRAME' THEN 1 WHEN 'COVER_FRAME' THEN 2 WHEN 'NAME_EFFECT' THEN 3 WHEN 'BADGE' THEN 4 WHEN 'BUNDLE' THEN 5 ELSE 9 END,id`).all(),
    db.prepare(`SELECT sbi.bundle_item_id,sbi.item_id,si.name,si.category,si.asset_key,si.rarity FROM shop_bundle_items sbi JOIN shop_items si ON si.id=sbi.item_id ORDER BY sbi.bundle_item_id,sbi.item_id`).all()
  ]);
  const byBundle={};for(const x of parts.results||[])(byBundle[x.bundle_item_id]??=[]).push(x);
  return json({items:(items.results||[]).map(x=>({...x,bundle_items:byBundle[x.id]||[]}))});
}

async function getCmsPublic(env){
  const db=requireDb(env);
  try{
    const [pages,slides,blocks,entries]=await Promise.all([
      db.prepare('SELECT page_key,eyebrow,title,subtitle FROM cms_page_settings ORDER BY page_key').all(),
      db.prepare('SELECT id,eyebrow,title,copy,cta_primary_label,cta_primary_href,cta_secondary_label,cta_secondary_href,visual_key,sort_order,active FROM cms_home_slides WHERE active=1 ORDER BY sort_order,id').all(),
      db.prepare('SELECT id,page_key,title,body,image_key,cta_label,cta_href,sort_order,active FROM cms_page_blocks WHERE active=1 ORDER BY page_key,sort_order,id').all(),
      db.prepare('SELECT id,page_key,content_key,label,value,sort_order FROM cms_content_entries ORDER BY page_key,sort_order,id').all()
    ]);
    return json({pages:pages.results||[],slides:slides.results||[],blocks:blocks.results||[],entries:entries.results||[]});
  }catch{return json({pages:[],slides:[],blocks:[],entries:[]});}
}

async function getNewsArticle(slug,env){
  const db=requireDb(env),key=decodeURIComponent(cleanText(slug,100));
  const row=await db.prepare(`SELECT n.id,n.slug,n.title,n.excerpt,n.body,n.image_key,n.published_at,n.created_at,u.username author FROM news n LEFT JOIN users u ON u.id=n.author_user_id WHERE n.slug=? AND n.status='PUBLISHED'`).bind(key).first();
  if(!row)return fail('News-Artikel nicht gefunden.',404);return json({article:row});
}

async function createReport(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json();
  const type=cleanText(b.targetType,20).toUpperCase(),targetId=cleanText(b.targetId,80),reason=cleanText(b.reason,100),details=cleanText(b.details,800);
  if(!['POST','COMMENT','USER','CLUB','NEWS'].includes(type))return fail('Ungültiger Melde-Typ.');
  if(!targetId||reason.length<3)return fail('Bitte gib einen Meldegrund an.');
  const dupe=await db.prepare(`SELECT id FROM reports WHERE reporter_user_id=? AND target_type=? AND target_id=? AND status='OPEN' AND created_at>=datetime('now','-24 hours')`).bind(u.id,type,targetId).first();
  if(dupe)return fail('Du hast diesen Inhalt bereits gemeldet.',409);
  const r=await db.prepare(`INSERT INTO reports(reporter_user_id,target_type,target_id,reason,details) VALUES(?,?,?,?,?)`).bind(u.id,type,targetId,reason,details).run();
  return json({ok:true,id:r.meta.last_row_id},201);
}

async function adminReports(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'moderation');
  const r=await db.prepare(`SELECT r.*,u.username reporter FROM reports r JOIN users u ON u.id=r.reporter_user_id ORDER BY CASE r.status WHEN 'OPEN' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 200`).all();
  return json({reports:r.results||[]});
}

async function adminContentDelete(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'moderation'),b=await request.json(),type=cleanText(b.targetType,20).toUpperCase(),id=asId(b.targetId);
  if(!id)return fail('Inhalt fehlt.');
  if(type==='POST'){
    const p=await db.prepare('SELECT media_key FROM posts WHERE id=?').bind(id).first();if(!p)return fail('Beitrag nicht gefunden.',404);
    await db.prepare('DELETE FROM posts WHERE id=?').bind(id).run();if(p.media_key&&env.MEDIA){try{await env.MEDIA.delete(p.media_key)}catch{}}
  }else if(type==='COMMENT'){
    const c=await db.prepare('SELECT id FROM comments WHERE id=?').bind(id).first();if(!c)return fail('Kommentar nicht gefunden.',404);await db.prepare(`WITH RECURSIVE tree(id) AS (SELECT id FROM comments WHERE id=? UNION ALL SELECT c.id FROM comments c JOIN tree t ON c.parent_comment_id=t.id) DELETE FROM comments WHERE id IN (SELECT id FROM tree)`).bind(id).run();
  }else if(type==='NEWS'){
    const n=await db.prepare('SELECT id FROM news WHERE id=?').bind(id).first();if(!n)return fail('News nicht gefunden.',404);await db.prepare('DELETE FROM news WHERE id=?').bind(id).run();
  }else return fail('Dieser Inhaltstyp kann hier nicht gelöscht werden.');
  await db.prepare(`INSERT INTO moderation_actions(moderator_user_id,action,reason) VALUES(?,?,?)`).bind(admin.id,`DELETE_${type}`,cleanText(b.reason,300)||'Inhalt über Admin Panel gelöscht').run();
  return json({ok:true});
}

async function adminReportResolve(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'moderation'),b=await request.json(),id=asId(b.reportId),status=cleanText(b.status,20).toUpperCase();
  if(!id||!['REVIEWED','RESOLVED','REJECTED'].includes(status))return fail('Ungültige Meldungsaktion.');
  await db.prepare(`UPDATE reports SET status=?,handled_by=?,handled_at=datetime('now') WHERE id=?`).bind(status,admin.id,id).run();return json({ok:true});
}

async function adminCmsOverview(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'cms');
  const [pages,slides,blocks,entries]=await Promise.all([
    db.prepare('SELECT page_key,eyebrow,title,subtitle,updated_at FROM cms_page_settings ORDER BY page_key').all(),
    db.prepare('SELECT id,eyebrow,title,copy,cta_primary_label,cta_primary_href,cta_secondary_label,cta_secondary_href,visual_key,sort_order,active,updated_at FROM cms_home_slides ORDER BY sort_order,id').all(),
    db.prepare('SELECT id,page_key,title,body,image_key,cta_label,cta_href,sort_order,active,updated_at FROM cms_page_blocks ORDER BY page_key,sort_order,id').all(),
    db.prepare('SELECT id,page_key,content_key,label,value,sort_order,updated_at FROM cms_content_entries ORDER BY page_key,sort_order,id').all()
  ]);return json({pages:pages.results||[],slides:slides.results||[],blocks:blocks.results||[],entries:entries.results||[]});
}
async function adminShopOverview(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'shop');
  const [items,parts]=await Promise.all([
    db.prepare(`SELECT id,sku,name,category,description,price_coins,price_eur_cents,asset_key,rarity,active FROM shop_items ORDER BY category,id`).all(),
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
  const vals=[cleanText(b.eyebrow,80),title,cleanText(b.copy,800),cleanText(b.ctaPrimaryLabel,60),cleanText(b.ctaPrimaryHref,200),cleanText(b.ctaSecondaryLabel,60),cleanText(b.ctaSecondaryHref,200),cleanText(b.visualKey,300),Math.trunc(Number(b.sortOrder)||0),bool01(b.active),admin.id];
  if(id)await db.prepare(`UPDATE cms_home_slides SET eyebrow=?,title=?,copy=?,cta_primary_label=?,cta_primary_href=?,cta_secondary_label=?,cta_secondary_href=?,visual_key=?,sort_order=?,active=?,updated_by=?,updated_at=datetime('now') WHERE id=?`).bind(...vals,id).run();
  else await db.prepare(`INSERT INTO cms_home_slides(eyebrow,title,copy,cta_primary_label,cta_primary_href,cta_secondary_label,cta_secondary_href,visual_key,sort_order,active,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(...vals).run();
  return json({ok:true});
}
async function adminCmsSlideDelete(request,env){const db=requireDb(env);await requireAdminPermission(request,env,'cms');const b=await request.json(),id=asId(b.id);if(!id)return fail('Slide fehlt.');await db.prepare('DELETE FROM cms_home_slides WHERE id=?').bind(id).run();return json({ok:true});}
async function adminCmsBlockSave(request,env){
  const db=requireDb(env),admin=await requireAdminPermission(request,env,'cms'),b=await request.json(),id=asId(b.id),pageKey=cleanText(b.pageKey,40).toLowerCase(),title=cleanText(b.title,150);if(!pageKey||!title)return fail('Seite und Titel sind Pflicht.');
  const vals=[pageKey,title,cleanText(b.body,4000),cleanText(b.imageKey,300),cleanText(b.ctaLabel,60),cleanText(b.ctaHref,200),Math.trunc(Number(b.sortOrder)||0),bool01(b.active),admin.id];
  if(id)await db.prepare(`UPDATE cms_page_blocks SET page_key=?,title=?,body=?,image_key=?,cta_label=?,cta_href=?,sort_order=?,active=?,updated_by=?,updated_at=datetime('now') WHERE id=?`).bind(...vals,id).run();
  else await db.prepare(`INSERT INTO cms_page_blocks(page_key,title,body,image_key,cta_label,cta_href,sort_order,active,updated_by) VALUES(?,?,?,?,?,?,?,?,?)`).bind(...vals).run();return json({ok:true});
}
async function adminCmsBlockDelete(request,env){const db=requireDb(env);await requireAdminPermission(request,env,'cms');const b=await request.json(),id=asId(b.id);if(!id)return fail('Block fehlt.');await db.prepare('DELETE FROM cms_page_blocks WHERE id=?').bind(id).run();return json({ok:true});}

async function adminShopSave(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'shop');const b=await request.json(),id=asId(b.id),name=cleanText(b.name,100),cat=cleanText(b.category,30).toUpperCase();
  if(!name||!['AVATAR_FRAME','COVER_FRAME','NAME_EFFECT','BADGE','BUNDLE'].includes(cat))return fail('Ungültiges Shop-Item.');
  const sku=cleanText(b.sku||slugify(name).replaceAll('-','_'),80),vals=[sku,name,cat,cleanText(b.description,600),Math.max(0,Math.trunc(Number(b.priceCoins)||0)),Math.max(0,Math.trunc(Number(b.priceEurCents)||0)),cleanText(b.assetKey,300),cleanText(b.rarity||'COMMON',30),bool01(b.active)];let itemId=id;
  if(id)await db.prepare(`UPDATE shop_items SET sku=?,name=?,category=?,description=?,price_coins=?,price_eur_cents=?,asset_key=?,rarity=?,active=? WHERE id=?`).bind(...vals,id).run();
  else{const r=await db.prepare(`INSERT INTO shop_items(sku,name,category,description,price_coins,price_eur_cents,asset_key,rarity,active) VALUES(?,?,?,?,?,?,?,?,?)`).bind(...vals).run();itemId=Number(r.meta.last_row_id);}
  if(cat==='BUNDLE'){
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
  const s=await clubSeasonSummary(db,clubId,seasonId);if(metric==='WINS')return Number(s.wins||0);if(metric==='POINTS')return Number(s.points||0);if(metric==='CLEAN_SHEETS')return Number(s.clean_sheets||0);
  if(metric==='CHAMPION'){
    const clubs=await db.prepare('SELECT club_id FROM season_clubs WHERE season_id=?').bind(seasonId).all();let best=null,champion=null;
    for(const c of clubs.results||[]){const x=await clubSeasonSummary(db,c.club_id,seasonId),score=[x.points,Number(x.gf||0)-Number(x.ga||0),Number(x.gf||0)];if(!best||score[0]>best[0]||(score[0]===best[0]&&score[1]>best[1])||(score[0]===best[0]&&score[1]===best[1]&&score[2]>best[2])){best=score;champion=c.club_id;}}
    return champion===clubId?1:0;
  }return 0;
}
async function getSeasonGoals(request,env){
  const db=requireDb(env),u=await requireUser(request,env),season=await currentActiveSeason(db);if(!season)return json({season:null,player:{templates:[],selected:[]},club:null});
  const p=await db.prepare('SELECT position FROM profiles WHERE user_id=?').bind(u.id).first(),group=p?.position==='TW'?'GK':'FIELD';
  const templates=await db.prepare(`SELECT * FROM season_goal_templates WHERE scope='PLAYER' AND active=1 AND position_group IN ('ANY',?) ORDER BY reward_coins,target_value`).bind(group).all();
  const sel=await db.prepare(`SELECT usg.*,sgt.code,sgt.metric,sgt.title,sgt.description,sgt.target_value,sgt.reward_coins FROM user_season_goals usg JOIN season_goal_templates sgt ON sgt.id=usg.goal_id WHERE usg.season_id=? AND usg.user_id=? ORDER BY usg.selected_at`).bind(season.id,u.id).all();
  const selected=[];for(const g of sel.results||[]){const progress=await playerGoalMetric(db,u.id,season.id,g.metric);selected.push({...g,progress_value:progress,progress_percent:g.target_value?Math.min(100,Math.round(progress/Number(g.target_value)*100)):0});}
  let club=null;if(u.managed_club_slug){const c=await db.prepare('SELECT id,name,slug FROM clubs WHERE slug=?').bind(u.managed_club_slug).first();if(c){const ct=await db.prepare(`SELECT * FROM season_goal_templates WHERE scope='CLUB' AND active=1 ORDER BY reward_coins,target_value`).all(),cs=await db.prepare(`SELECT csg.*,sgt.code,sgt.metric,sgt.title,sgt.description,sgt.target_value,sgt.reward_coins FROM club_season_goals csg JOIN season_goal_templates sgt ON sgt.id=csg.goal_id WHERE csg.season_id=? AND csg.club_id=?`).bind(season.id,c.id).all(),selectedClub=[];for(const g of cs.results||[]){const progress=await clubGoalMetric(db,c.id,season.id,g.metric);selectedClub.push({...g,progress_value:progress,progress_percent:g.target_value?Math.min(100,Math.round(progress/Number(g.target_value)*100)):0});}club={club:c,templates:ct.results||[],selected:selectedClub,maxChoices:3};}}
  return json({season,player:{group,templates:templates.results||[],selected,maxChoices:3},club});
}
async function selectPlayerGoals(request,env){
  const db=requireDb(env),u=await requireUser(request,env),season=await currentActiveSeason(db);if(!season||season.status!=='ACTIVE')return fail('Aktuell läuft keine aktive Saison.',409);const b=await request.json(),ids=[...new Set((Array.isArray(b.goalIds)?b.goalIds:[]).map(Number).filter(Number.isInteger))];if(ids.length>3)return fail('Du kannst maximal 3 persönliche Saisonziele auswählen.');
  const p=await db.prepare('SELECT position FROM profiles WHERE user_id=?').bind(u.id).first(),group=p?.position==='TW'?'GK':'FIELD';for(const id of ids){const g=await db.prepare(`SELECT id FROM season_goal_templates WHERE id=? AND scope='PLAYER' AND active=1 AND position_group IN ('ANY',?)`).bind(id,group).first();if(!g)return fail('Ein ausgewähltes Ziel passt nicht zu deiner Position.');}
  const stmts=[db.prepare(`DELETE FROM user_season_goals WHERE season_id=? AND user_id=? AND status='SELECTED'`).bind(season.id,u.id)];for(const id of ids)stmts.push(db.prepare(`INSERT OR IGNORE INTO user_season_goals(season_id,user_id,goal_id) VALUES(?,?,?)`).bind(season.id,u.id,id));await db.batch(stmts);return getSeasonGoals(request,env);
}
async function selectClubGoals(request,env){
  const db=requireDb(env),u=await requireUser(request,env),season=await currentActiveSeason(db);if(!season||season.status!=='ACTIVE')return fail('Aktuell läuft keine aktive Saison.',409);const b=await request.json(),club=await db.prepare('SELECT id FROM clubs WHERE slug=?').bind(cleanText(b.clubSlug||u.managed_club_slug,60)).first();if(!club)return fail('Club nicht gefunden.',404);if(!(await canClubPermission(db,u,club.id,'manage_page')))return fail('Keine VM-Rechte.',403);const ids=[...new Set((Array.isArray(b.goalIds)?b.goalIds:[]).map(Number).filter(Number.isInteger))];if(ids.length>3)return fail('Ein Club kann maximal 3 Saisonziele auswählen.');for(const id of ids){const g=await db.prepare(`SELECT id FROM season_goal_templates WHERE id=? AND scope='CLUB' AND active=1`).bind(id).first();if(!g)return fail('Ungültiges Clubziel.');}
  const stmts=[db.prepare(`DELETE FROM club_season_goals WHERE season_id=? AND club_id=? AND status='SELECTED'`).bind(season.id,club.id)];for(const id of ids)stmts.push(db.prepare(`INSERT OR IGNORE INTO club_season_goals(season_id,club_id,goal_id,selected_by) VALUES(?,?,?,?)`).bind(season.id,club.id,id,u.id));await db.batch(stmts);return json({ok:true});
}
async function adminFinalizeSeason(request,env){
  const db=requireDb(env);await requireAdminPermission(request,env,'leagues');const b=await request.json(),seasonId=asId(b.seasonId);if(!seasonId)return fail('Saison fehlt.');const season=await db.prepare('SELECT * FROM seasons WHERE id=?').bind(seasonId).first();if(!season)return fail('Saison nicht gefunden.',404);
  const pgoals=await db.prepare(`SELECT usg.user_id,usg.goal_id,sgt.metric,sgt.target_value,sgt.reward_coins,sgt.title FROM user_season_goals usg JOIN season_goal_templates sgt ON sgt.id=usg.goal_id WHERE usg.season_id=? AND usg.status='SELECTED'`).bind(seasonId).all();let playerAwards=0,clubAwards=0;
  for(const g of pgoals.results||[]){const progress=await playerGoalMetric(db,g.user_id,seasonId,g.metric),ok=progress>=Number(g.target_value);await db.prepare(`UPDATE user_season_goals SET status=?,progress_value=?,completed_at=CASE WHEN ?='COMPLETED' THEN datetime('now') ELSE NULL END WHERE season_id=? AND user_id=? AND goal_id=?`).bind(ok?'COMPLETED':'FAILED',progress,ok?'COMPLETED':'FAILED',seasonId,g.user_id,g.goal_id).run();if(ok){const ref=`${seasonId}:${g.goal_id}`;const exists=await db.prepare(`SELECT 1 FROM coin_transactions WHERE user_id=? AND type='PERFORMANCE' AND reference_type='SEASON_GOAL' AND reference_id=?`).bind(g.user_id,ref).first();if(!exists){await db.batch([db.prepare(`UPDATE coin_wallets SET balance=balance+?,lifetime_earned=lifetime_earned+?,updated_at=datetime('now') WHERE user_id=?`).bind(g.reward_coins,g.reward_coins,g.user_id),db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'PERFORMANCE','SEASON_GOAL',?,?)`).bind(g.user_id,g.reward_coins,ref,`Saisonziel: ${g.title}`)]);playerAwards++;}}}
  const cgoals=await db.prepare(`SELECT csg.club_id,csg.goal_id,sgt.metric,sgt.target_value,sgt.reward_coins,sgt.title FROM club_season_goals csg JOIN season_goal_templates sgt ON sgt.id=csg.goal_id WHERE csg.season_id=? AND csg.status='SELECTED'`).bind(seasonId).all();
  for(const g of cgoals.results||[]){const progress=await clubGoalMetric(db,g.club_id,seasonId,g.metric),ok=progress>=Number(g.target_value);await db.prepare(`UPDATE club_season_goals SET status=?,progress_value=?,completed_at=CASE WHEN ?='COMPLETED' THEN datetime('now') ELSE NULL END WHERE season_id=? AND club_id=? AND goal_id=?`).bind(ok?'COMPLETED':'FAILED',progress,ok?'COMPLETED':'FAILED',seasonId,g.club_id,g.goal_id).run();if(ok){const members=await db.prepare(`SELECT user_id FROM club_members WHERE club_id=? AND left_at IS NULL`).bind(g.club_id).all();for(const m of members.results||[]){const ref=`${seasonId}:${g.club_id}:${g.goal_id}`;const exists=await db.prepare(`SELECT 1 FROM coin_transactions WHERE user_id=? AND type='PERFORMANCE' AND reference_type='CLUB_SEASON_GOAL' AND reference_id=?`).bind(m.user_id,ref).first();if(!exists){await db.batch([db.prepare(`UPDATE coin_wallets SET balance=balance+?,lifetime_earned=lifetime_earned+?,updated_at=datetime('now') WHERE user_id=?`).bind(g.reward_coins,g.reward_coins,m.user_id),db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'PERFORMANCE','CLUB_SEASON_GOAL',?,?)`).bind(m.user_id,g.reward_coins,ref,`Club-Saisonziel: ${g.title}`)]);clubAwards++;}}}}
  if(b.finishSeason!==false)await db.prepare(`UPDATE seasons SET status='FINISHED' WHERE id=?`).bind(seasonId).run();return json({ok:true,playerAwards,clubAwards});
}
