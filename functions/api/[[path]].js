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
    if(route === 'config' && method === 'GET') return json({turnstileSiteKey:env.TURNSTILE_SITE_KEY||'',paymentsEnabled:String(env.PAYMENTS_ENABLED||'false')==='true'});
    if(route === 'auth/register' && method === 'POST') return register(request,env);
    if(route === 'auth/login' && method === 'POST') return login(request,env);
    if(route === 'auth/logout' && method === 'POST') return logout(request,env);
    if(route === 'auth/me' && method === 'GET') return me(request,env);
    if(route === 'social/follow' && method === 'POST') return follow(request,env);
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
    if(route === 'transfers' && method === 'GET') return listTransfers(env);
    if(route === 'posts' && method === 'POST') return createPost(request,env);
    if(route === 'admin/coin-award' && method === 'POST') return adminCoinAward(request,env);
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

async function hashPassword(password, salt=randomId(16)){
  const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:fromB64url(salt),iterations:210000},key,256);
  return `pbkdf2_sha256$210000$${salt}$${b64url(new Uint8Array(bits))}`;
}
async function verifyPassword(password, stored){
  const [algo,it,salt,expected]=String(stored).split('$'); if(algo!=='pbkdf2_sha256')return false;
  const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:fromB64url(salt),iterations:Number(it)},key,256);
  const got=b64url(new Uint8Array(bits)); if(got.length!==expected.length)return false; let diff=0;for(let i=0;i<got.length;i++)diff|=got.charCodeAt(i)^expected.charCodeAt(i);return diff===0;
}
async function verifyTurnstile(request,env,token){
  if(!env.TURNSTILE_SECRET)return true;
  if(!token)return false;
  const body=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token});
  const ip=request.headers.get('CF-Connecting-IP');if(ip)body.set('remoteip',ip);
  const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body});
  const out=await res.json();return !!out.success;
}
async function currentUser(request,env){
  const db=requireDb(env), sid=cookieMap(request).epl_session;if(!sid)return null;
  const row=await db.prepare(`SELECT u.id,u.email,u.username,u.role,u.status,p.avatar_key,p.cover_key,p.position,p.secondary_position,p.country,p.bio,w.balance AS coins
    FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN coin_wallets w ON w.user_id=u.id
    WHERE s.id=? AND s.expires_at>datetime('now')`).bind(sid).first();
  return row||null;
}
async function requireUser(request,env,roles){const u=await currentUser(request,env);if(!u)throw httpError('Bitte zuerst anmelden.',401);if(u.status!=='ACTIVE')throw httpError('Account ist nicht aktiv.',403);if(roles && !roles.includes(u.role))throw httpError('Keine Berechtigung.',403);return u}
function httpError(message,status){const e=new Error(message);e.status=status;return e}

async function register(request,env){
  const db=requireDb(env), body=await request.json();
  if(!(await verifyTurnstile(request,env,body.turnstileToken))) return fail('Turnstile-Prüfung fehlgeschlagen.',403);
  const username=cleanText(body.username,24), email=cleanText(body.email,160).toLowerCase(), password=String(body.password||'');
  if(!/^[A-Za-z0-9_.-]{3,24}$/.test(username))return fail('Username: 3–24 Zeichen, nur Buchstaben, Zahlen, _ . -');
  if(!/^\S+@\S+\.\S+$/.test(email))return fail('Ungültige E-Mail-Adresse.');
  if(password.length<8)return fail('Passwort muss mindestens 8 Zeichen haben.');
  const exists=await db.prepare('SELECT id FROM users WHERE email=? OR username=?').bind(email,username).first();if(exists)return fail('E-Mail oder Username ist bereits vergeben.',409);
  const hash=await hashPassword(password);
  const result=await db.prepare('INSERT INTO users(email,username,password_hash) VALUES(?,?,?)').bind(email,username,hash).run();
  const userId=result.meta.last_row_id;
  await db.batch([
    db.prepare(`INSERT INTO profiles(user_id,ea_id,platform,discord,country,position,secondary_position,bio) VALUES(?,?,?,?,?,?,?,?)`).bind(userId,cleanText(body.eaId,80),cleanText(body.platform,30),cleanText(body.discord,80),cleanText(body.country||'DE',2).toUpperCase(),cleanText(body.position,8),cleanText(body.secondaryPosition,8),'Neu in der Elite Pro League.'),
    db.prepare('INSERT INTO coin_wallets(user_id,balance) VALUES(?,0)').bind(userId)
  ]);
  const sid=randomId(32), maxAge=60*60*24*30;await db.prepare(`INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,datetime('now','+30 days'))`).bind(sid,userId).run();
  return json({user:{id:userId,email,username,role:'PLAYER',coins:0}},201,{'set-cookie':secureCookie(sid,maxAge)});
}
async function login(request,env){
  const db=requireDb(env), body=await request.json();if(!(await verifyTurnstile(request,env,body.turnstileToken)))return fail('Turnstile-Prüfung fehlgeschlagen.',403);
  const login=cleanText(body.login,160), password=String(body.password||'');
  const row=await db.prepare(`SELECT u.*,COALESCE(w.balance,0) coins FROM users u LEFT JOIN coin_wallets w ON w.user_id=u.id WHERE u.email=? COLLATE NOCASE OR u.username=? COLLATE NOCASE`).bind(login,login).first();
  if(!row || !(await verifyPassword(password,row.password_hash)))return fail('Login-Daten sind falsch.',401);if(row.status!=='ACTIVE')return fail('Account ist gesperrt.',403);
  const sid=randomId(32), maxAge=60*60*24*30;await db.batch([db.prepare('DELETE FROM sessions WHERE expires_at<=datetime(\'now\')'),db.prepare(`INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,datetime('now','+30 days'))`).bind(sid,row.id)]);
  return json({user:{id:row.id,email:row.email,username:row.username,role:row.role,coins:row.coins}},200,{'set-cookie':secureCookie(sid,maxAge)});
}
async function logout(request,env){const db=requireDb(env),sid=cookieMap(request).epl_session;if(sid)await db.prepare('DELETE FROM sessions WHERE id=?').bind(sid).run();return json({ok:true},200,{'set-cookie':'epl_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'})}
async function me(request,env){const user=await currentUser(request,env);return user?json({user}):fail('Nicht angemeldet.',401)}

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
async function createContract(request,env){const db=requireDb(env),u=await requireUser(request,env,['MANAGER','LEAGUE_ADMIN','SUPER_ADMIN']),b=await request.json();const club=await db.prepare('SELECT id,manager_user_id FROM clubs WHERE slug=?').bind(cleanText(b.clubSlug,60)).first();if(!club)return fail('Club nicht gefunden.',404);if(!['LEAGUE_ADMIN','SUPER_ADMIN'].includes(u.role)&&club.manager_user_id!==u.id)return fail('Du verwaltest diesen Club nicht.',403);const player=await db.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE').bind(cleanText(b.username,24)).first();if(!player)return fail('Spieler nicht gefunden.',404);const r=await db.prepare('INSERT INTO contracts(club_id,user_id,offered_by,starts_at,ends_at,message) VALUES(?,?,?,?,?,?)').bind(club.id,player.id,u.id,b.startsAt||null,b.endsAt||null,cleanText(b.message,800)).run();return json({id:r.meta.last_row_id,status:'OFFERED'},201)}

async function purchaseItem(request,env){
  const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),itemId=Number(b.itemId);const item=await db.prepare('SELECT id,name,price_coins FROM shop_items WHERE id=? AND active=1').bind(itemId).first();if(!item)return fail('Shop-Item nicht gefunden.',404);
  const owned=await db.prepare('SELECT 1 FROM user_inventory WHERE user_id=? AND item_id=?').bind(u.id,itemId).first();if(owned)return fail('Item bereits im Besitz.',409);
  const wallet=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(u.id).first();if(!wallet||wallet.balance<item.price_coins)return fail('Nicht genügend EPL Coins.',409);
  await db.batch([
    db.prepare('UPDATE coin_wallets SET balance=balance-?,lifetime_spent=lifetime_spent+?,updated_at=datetime(\'now\') WHERE user_id=?').bind(item.price_coins,item.price_coins,u.id),
    db.prepare('INSERT INTO user_inventory(user_id,item_id) VALUES(?,?)').bind(u.id,itemId),
    db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'SHOP_PURCHASE','SHOP_ITEM',?,?)`).bind(u.id,-item.price_coins,String(itemId),item.name)
  ]);
  return json({ok:true,balance:wallet.balance-item.price_coins});
}
async function getWallet(request,env){const db=requireDb(env),u=await requireUser(request,env);const wallet=await db.prepare('SELECT * FROM coin_wallets WHERE user_id=?').bind(u.id).first();const tx=await db.prepare('SELECT amount,type,description,created_at FROM coin_transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(u.id).all();return json({wallet,transactions:tx.results})}

async function createCheckout(request,env){
  const db=requireDb(env),u=await requireUser(request,env);if(String(env.PAYMENTS_ENABLED||'false')!=='true')return fail('Echtgeld-Zahlungen sind noch nicht aktiviert.',503);if(!env.STRIPE_SECRET_KEY)return fail('Stripe Secret fehlt.',503);
  const b=await request.json(),pack=packs[b.packId];if(!pack)return fail('Ungültiges Coin-Paket.');const orderId=crypto.randomUUID();
  const site=(env.PUBLIC_SITE_URL||new URL(request.url).origin).replace(/\/$/,'');
  const form=new URLSearchParams();form.set('mode','payment');form.set('success_url',`${site}/shop?payment=success&session_id={CHECKOUT_SESSION_ID}`);form.set('cancel_url',`${site}/shop?payment=cancelled`);form.set('line_items[0][quantity]','1');form.set('line_items[0][price_data][currency]','eur');form.set('line_items[0][price_data][unit_amount]',String(pack.cents));form.set('line_items[0][price_data][product_data][name]',`${pack.coins.toLocaleString('de-DE')} EPL Coins`);form.set('metadata[order_id]',orderId);form.set('metadata[user_id]',String(u.id));form.set('metadata[coins]',String(pack.coins));
  const res=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded'},body:form});const out=await res.json();if(!res.ok)return fail(out.error?.message||'Stripe Checkout konnte nicht erstellt werden.',502);
  await db.prepare('INSERT INTO coin_orders(id,user_id,pack_id,coins,amount_cents,provider_session_id) VALUES(?,?,?,?,?,?)').bind(orderId,u.id,b.packId,pack.coins,pack.cents,out.id).run();return json({url:out.url,orderId});
}
async function stripeWebhook(request,env){
  const db=requireDb(env);if(!env.STRIPE_WEBHOOK_SECRET)return fail('Stripe webhook secret fehlt.',503);const raw=await request.text();const sig=request.headers.get('Stripe-Signature')||'';if(!(await verifyStripe(raw,sig,env.STRIPE_WEBHOOK_SECRET)))return fail('Ungültige Stripe Signatur.',400);const evt=JSON.parse(raw);if(evt.type!=='checkout.session.completed')return json({received:true});const session=evt.data.object;if(session.payment_status!=='paid')return json({received:true});const orderId=session.metadata?.order_id;if(!orderId)return fail('Order metadata fehlt.',400);const order=await db.prepare('SELECT * FROM coin_orders WHERE id=?').bind(orderId).first();if(!order)return fail('Order nicht gefunden.',404);if(order.status==='PAID')return json({received:true,duplicate:true});
  await db.batch([
    db.prepare(`UPDATE coin_orders SET status='PAID',paid_at=datetime('now') WHERE id=? AND status='PENDING'`).bind(orderId),
    db.prepare('UPDATE coin_wallets SET balance=balance+?,lifetime_earned=lifetime_earned+?,updated_at=datetime(\'now\') WHERE user_id=?').bind(order.coins,order.coins,order.user_id),
    db.prepare(`INSERT OR IGNORE INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'REAL_MONEY_PURCHASE','COIN_ORDER',?,?)`).bind(order.user_id,order.coins,orderId,`${order.coins} EPL Coins gekauft`)
  ]);return json({received:true});
}
async function verifyStripe(payload,header,secret){const parts=Object.fromEntries(header.split(',').map(x=>x.split('=')));const t=parts.t,v1=parts.v1;if(!t||!v1)return false;if(Math.abs(Date.now()/1000-Number(t))>300)return false;const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',key,enc.encode(`${t}.${payload}`));const hex=[...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');if(hex.length!==v1.length)return false;let d=0;for(let i=0;i<hex.length;i++)d|=hex.charCodeAt(i)^v1.charCodeAt(i);return d===0}

async function uploadMedia(request,env){
  const u=await requireUser(request,env);if(!env.MEDIA)return fail('R2 binding MEDIA fehlt.',503);const form=await request.formData(),file=form.get('file'),kind=String(form.get('kind')||'avatar');if(!(file instanceof File))return fail('Keine Datei übermittelt.');if(file.size>6*1024*1024)return fail('Datei darf maximal 6 MB groß sein.');if(!['image/jpeg','image/png','image/webp'].includes(file.type))return fail('Nur JPG, PNG oder WebP erlaubt.');
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const db=requireDb(env);let key;
  if(kind==='club-logo'||kind==='club-cover'){const clubSlug=cleanText(form.get('clubSlug'),60);const club=await db.prepare('SELECT id,manager_user_id FROM clubs WHERE slug=?').bind(clubSlug).first();if(!club)return fail('Club nicht gefunden.',404);if(!['LEAGUE_ADMIN','SUPER_ADMIN'].includes(u.role)&&club.manager_user_id!==u.id)return fail('Du verwaltest diesen Club nicht.',403);key=`clubs/${club.id}/${kind}-${crypto.randomUUID()}.${ext}`;await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:file.type,cacheControl:'public, max-age=31536000, immutable'}});const col=kind==='club-logo'?'logo_key':'cover_key';await db.prepare(`UPDATE clubs SET ${col}=?,updated_at=datetime('now') WHERE id=?`).bind(key,club.id).run();}
  else {key=`profiles/${u.id}/${kind}-${crypto.randomUUID()}.${ext}`;await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:file.type,cacheControl:'public, max-age=31536000, immutable'}});if(kind==='avatar')await db.prepare('UPDATE profiles SET avatar_key=?,updated_at=datetime(\'now\') WHERE user_id=?').bind(key,u.id).run();if(kind==='cover')await db.prepare('UPDATE profiles SET cover_key=?,updated_at=datetime(\'now\') WHERE user_id=?').bind(key,u.id).run();}
  return json({key,url:`/api/media/${encodeURIComponent(key)}`});
}
async function getMedia(key,env){if(!env.MEDIA)return new Response('Not found',{status:404});key=decodeURIComponent(key);const obj=await env.MEDIA.get(key);if(!obj)return new Response('Not found',{status:404});const h=new Headers();obj.writeHttpMetadata(h);h.set('etag',obj.httpEtag);h.set('cache-control',h.get('cache-control')||'public, max-age=3600');return new Response(obj.body,{headers:h})}


async function createPost(request,env){const db=requireDb(env),u=await requireUser(request,env),b=await request.json(),body=cleanText(b.body,2000);if(!body)return fail('Beitrag ist leer.');let clubId=null;if(b.clubSlug){const c=await db.prepare('SELECT id,manager_user_id FROM clubs WHERE slug=?').bind(cleanText(b.clubSlug,60)).first();if(!c)return fail('Club nicht gefunden.',404);if(!['LEAGUE_ADMIN','SUPER_ADMIN'].includes(u.role)&&c.manager_user_id!==u.id)return fail('Du darfst für diesen Club nicht posten.',403);clubId=c.id;}const r=await db.prepare('INSERT INTO posts(author_user_id,club_id,body,media_key,match_id) VALUES(?,?,?,?,?)').bind(clubId?null:u.id,clubId,body,cleanText(b.mediaKey,250)||null,b.matchId||null).run();return json({id:r.meta.last_row_id},201)}
async function adminCoinAward(request,env){const db=requireDb(env),u=await requireUser(request,env,['LEAGUE_ADMIN','SUPER_ADMIN']),b=await request.json(),amount=Math.trunc(Number(b.amount));if(!Number.isFinite(amount)||amount===0||Math.abs(amount)>10000)return fail('Ungültiger Coin-Betrag.');const target=await db.prepare('SELECT id,username FROM users WHERE username=? COLLATE NOCASE').bind(cleanText(b.username,24)).first();if(!target)return fail('Spieler nicht gefunden.',404);if(amount<0){const w=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(target.id).first();if(!w||w.balance+amount<0)return fail('Wallet würde negativ werden.',409);}const ref=crypto.randomUUID();await db.batch([db.prepare('UPDATE coin_wallets SET balance=balance+?,lifetime_earned=lifetime_earned+CASE WHEN ?>0 THEN ? ELSE 0 END,lifetime_spent=lifetime_spent+CASE WHEN ?<0 THEN -? ELSE 0 END,updated_at=datetime(\'now\') WHERE user_id=?').bind(amount,amount,amount,amount,amount,target.id),db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'ADMIN_ADJUSTMENT','ADMIN',?,?)`).bind(target.id,amount,ref,cleanText(b.description,200)||`Admin-Anpassung durch ${u.username}`)]);const w2=await db.prepare('SELECT balance FROM coin_wallets WHERE user_id=?').bind(target.id).first();return json({ok:true,balance:w2.balance})}
async function submitMatch(route,request,env){const db=requireDb(env),u=await requireUser(request,env,['MANAGER','LEAGUE_ADMIN','SUPER_ADMIN']),id=Number(route.split('/')[1]),b=await request.json();const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(id).first();if(!m)return fail('Match nicht gefunden.',404);if(!['LEAGUE_ADMIN','SUPER_ADMIN'].includes(u.role)){const managed=await db.prepare('SELECT 1 FROM clubs WHERE manager_user_id=? AND id IN (?,?)').bind(u.id,m.home_club_id,m.away_club_id).first();if(!managed)return fail('Du bist kein Manager eines beteiligten Clubs.',403);}const hs=Math.trunc(Number(b.homeScore)),as=Math.trunc(Number(b.awayScore));if(hs<0||as<0||hs>99||as>99)return fail('Ungültiges Ergebnis.');await db.prepare(`UPDATE matches SET home_score=?,away_score=?,status='SUBMITTED',submitted_by=?,notes=?,updated_at=datetime('now') WHERE id=?`).bind(hs,as,u.id,cleanText(b.notes,500),id).run();return json({ok:true,status:'SUBMITTED'})}
async function confirmMatch(route,request,env){const db=requireDb(env),u=await requireUser(request,env,['MANAGER','LEAGUE_ADMIN','SUPER_ADMIN']),id=Number(route.split('/')[1]);const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(id).first();if(!m)return fail('Match nicht gefunden.',404);if(m.status!=='SUBMITTED')return fail('Match ist nicht zur Bestätigung eingereicht.',409);if(!['LEAGUE_ADMIN','SUPER_ADMIN'].includes(u.role)){const managed=await db.prepare('SELECT id FROM clubs WHERE manager_user_id=? AND id IN (?,?)').bind(u.id,m.home_club_id,m.away_club_id).first();if(!managed)return fail('Du bist kein Manager eines beteiligten Clubs.',403);const submitterClub=await db.prepare('SELECT id FROM clubs WHERE manager_user_id=?').bind(m.submitted_by).first();if(submitterClub&&submitterClub.id===managed.id)return fail('Das Ergebnis muss vom Gegner oder Admin bestätigt werden.',403);}await db.prepare(`UPDATE matches SET status='CONFIRMED',confirmed_by=?,updated_at=datetime('now') WHERE id=?`).bind(u.id,id).run();await awardMatchCoins(db,m);return json({ok:true,status:'CONFIRMED'})}

async function updateProfile(request,env){const db=requireDb(env),u=await requireUser(request,env),b=await request.json();const fields={ea_id:cleanText(b.eaId,80),platform:cleanText(b.platform,30),console_id:cleanText(b.consoleId,80),discord:cleanText(b.discord,80),country:cleanText(b.country||'DE',2).toUpperCase(),position:cleanText(b.position,8),secondary_position:cleanText(b.secondaryPosition,8),bio:cleanText(b.bio,500),free_agent:b.freeAgent?1:0};await db.prepare(`UPDATE profiles SET ea_id=?,platform=?,console_id=?,discord=?,country=?,position=?,secondary_position=?,bio=?,free_agent=?,updated_at=datetime('now') WHERE user_id=?`).bind(fields.ea_id,fields.platform,fields.console_id,fields.discord,fields.country,fields.position,fields.secondary_position,fields.bio,fields.free_agent,u.id).run();return json({ok:true,profile:fields})}
async function awardMatchCoins(db,m){const stats=await db.prepare('SELECT user_id,club_id,motm,clean_sheet FROM player_stats WHERE match_id=?').bind(m.id).all();const winner=m.home_score>m.away_score?m.home_club_id:m.away_score>m.home_score?m.away_club_id:null;for(const st of stats.results){let amount=0,parts=[];if(winner&&st.club_id===winner){amount+=150;parts.push('Siegbonus');}if(st.motm){amount+=100;parts.push('MOTM');}if(st.clean_sheet){amount+=75;parts.push('Clean Sheet');}if(!amount)continue;const exists=await db.prepare(`SELECT 1 FROM coin_transactions WHERE user_id=? AND type='PERFORMANCE' AND reference_type='MATCH' AND reference_id=?`).bind(st.user_id,String(m.id)).first();if(exists)continue;await db.batch([db.prepare('UPDATE coin_wallets SET balance=balance+?,lifetime_earned=lifetime_earned+?,updated_at=datetime(\'now\') WHERE user_id=?').bind(amount,amount,st.user_id),db.prepare(`INSERT INTO coin_transactions(user_id,amount,type,reference_type,reference_id,description) VALUES(?,?,'PERFORMANCE','MATCH',?,?)`).bind(st.user_id,amount,String(m.id),parts.join(' + '))]);}}
async function eaClubInfo(request,env){const u=new URL(request.url),clubId=(u.searchParams.get('clubId')||'').trim(),platform=(u.searchParams.get('platform')||'common-gen5').trim();if(!/^\d{1,12}$/.test(clubId))return fail('Ungültige EA Club ID.');if(!['common-gen5','common-gen4'].includes(platform))return fail('Ungültige Plattform.');const target=`https://proclubs.ea.com/api/fc/clubs/info?platform=${encodeURIComponent(platform)}&clubIds=${encodeURIComponent(clubId)}`;const res=await fetch(target,{headers:{accept:'application/json','user-agent':'EPL-Elite-Pro-League/1.0'},signal:AbortSignal.timeout(9000)});if(!res.ok)return fail(`EA Clubs antwortet mit HTTP ${res.status}.`,502);const data=await res.json();return json({provider:'EA Clubs',clubId,platform,data});}
async function getProfile(slug,request,env){const db=requireDb(env);const p=await db.prepare(`SELECT u.id,u.username,u.role,p.*,COALESCE(w.balance,0) coins,(SELECT COUNT(*) FROM follows WHERE followed_user_id=u.id) followers,(SELECT COUNT(*) FROM follows WHERE follower_user_id=u.id) following FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN coin_wallets w ON w.user_id=u.id WHERE lower(u.username)=?`).bind(slug.toLowerCase()).first();if(!p)return fail('Spieler nicht gefunden.',404);const stats=await db.prepare(`SELECT COUNT(*) matches,COALESCE(SUM(goals),0) goals,COALESCE(SUM(assists),0) assists,ROUND(AVG(rating),2) rating FROM player_stats WHERE user_id=?`).bind(p.id).first();return json({profile:p,stats})}
async function getClub(slug,request,env){const db=requireDb(env);const c=await db.prepare(`SELECT c.*,u.username manager_username,d.name division_name FROM clubs c LEFT JOIN users u ON u.id=c.manager_user_id LEFT JOIN divisions d ON d.id=c.division_id WHERE c.slug=?`).bind(slug).first();if(!c)return fail('Club nicht gefunden.',404);const squad=await db.prepare(`SELECT u.username,cm.role,cm.shirt_number,p.position,p.overall,p.avatar_key FROM club_members cm JOIN users u ON u.id=cm.user_id LEFT JOIN profiles p ON p.user_id=u.id WHERE cm.club_id=? AND cm.left_at IS NULL`).bind(c.id).all();return json({club:c,squad:squad.results})}
async function getStandings(env){const db=requireDb(env);const r=await db.prepare(`WITH stats AS (SELECT sc.club_id,COUNT(m.id) played,SUM(CASE WHEN (m.home_club_id=sc.club_id AND m.home_score>m.away_score) OR (m.away_club_id=sc.club_id AND m.away_score>m.home_score) THEN 1 ELSE 0 END) wins,SUM(CASE WHEN m.home_score=m.away_score THEN 1 ELSE 0 END) draws,SUM(CASE WHEN (m.home_club_id=sc.club_id AND m.home_score<m.away_score) OR (m.away_club_id=sc.club_id AND m.away_score<m.home_score) THEN 1 ELSE 0 END) losses,SUM(CASE WHEN m.home_club_id=sc.club_id THEN m.home_score ELSE m.away_score END) gf,SUM(CASE WHEN m.home_club_id=sc.club_id THEN m.away_score ELSE m.home_score END) ga FROM season_clubs sc LEFT JOIN matches m ON m.season_id=sc.season_id AND (m.home_club_id=sc.club_id OR m.away_club_id=sc.club_id) AND m.status='CONFIRMED' WHERE sc.season_id=1 GROUP BY sc.club_id) SELECT c.id,c.name,c.slug,COALESCE(s.played,0) played,COALESCE(s.wins,0) wins,COALESCE(s.draws,0) draws,COALESCE(s.losses,0) losses,COALESCE(s.gf,0) gf,COALESCE(s.ga,0) ga,(COALESCE(s.wins,0)*3+COALESCE(s.draws,0)) points FROM clubs c JOIN season_clubs sc ON sc.club_id=c.id AND sc.season_id=1 LEFT JOIN stats s ON s.club_id=c.id ORDER BY points DESC,(gf-ga) DESC,gf DESC`).all();return json({standings:r.results})}
async function getFixtures(env){const db=requireDb(env);const r=await db.prepare(`SELECT m.*,h.name home_name,h.slug home_slug,a.name away_name,a.slug away_slug,d.name division_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id JOIN divisions d ON d.id=m.division_id ORDER BY scheduled_at ASC LIMIT 50`).all();return json({fixtures:r.results})}

async function listPlayers(env){
  const db=requireDb(env);
  const r=await db.prepare(`SELECT u.username,lower(u.username) slug,p.position,p.secondary_position,p.country,p.avatar_key,p.overall,COALESCE(c.name,'Free Agent') club,COALESCE((SELECT COUNT(*) FROM player_stats ps WHERE ps.user_id=u.id),0) matches,COALESCE((SELECT SUM(ps.goals) FROM player_stats ps WHERE ps.user_id=u.id),0) goals,COALESCE((SELECT SUM(ps.assists) FROM player_stats ps WHERE ps.user_id=u.id),0) assists,COALESCE(ROUND((SELECT AVG(ps.rating) FROM player_stats ps WHERE ps.user_id=u.id),2),COALESCE(p.overall,0)) rating FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id WHERE u.status='ACTIVE' ORDER BY COALESCE((SELECT SUM(ps.goals) FROM player_stats ps WHERE ps.user_id=u.id),0) DESC, u.created_at DESC`).all();
  return json({players:r.results});
}
async function listClubs(env){
  const db=requireDb(env);
  const r=await db.prepare(`SELECT c.id,c.name,c.slug,c.logo_key,c.cover_key,c.reputation,c.followers_count,c.verified,d.name division,u.username manager,COALESCE((SELECT COUNT(*) FROM club_members cm WHERE cm.club_id=c.id AND cm.left_at IS NULL),0) squad_size,COALESCE((SELECT COUNT(*) FROM matches m WHERE (m.home_club_id=c.id OR m.away_club_id=c.id) AND m.status='CONFIRMED'),0) played,COALESCE((SELECT COUNT(*)*3 FROM matches m WHERE ((m.home_club_id=c.id AND m.home_score>m.away_score) OR (m.away_club_id=c.id AND m.away_score>m.home_score)) AND m.status='CONFIRMED'),0)+COALESCE((SELECT COUNT(*) FROM matches m WHERE (m.home_club_id=c.id OR m.away_club_id=c.id) AND m.home_score=m.away_score AND m.status='CONFIRMED'),0) points FROM clubs c LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN users u ON u.id=c.manager_user_id ORDER BY c.created_at DESC`).all();
  return json({clubs:r.results});
}
async function listNews(env){
  const db=requireDb(env);
  const r=await db.prepare(`SELECT id,title,excerpt,image_key,published_at FROM news WHERE published=1 ORDER BY COALESCE(published_at,created_at) DESC LIMIT 20`).all();
  return json({news:r.results});
}
async function listTransfers(env){
  const db=requireDb(env);
  const r=await db.prepare(`SELECT t.id,t.type,t.fee_text,t.created_at,u.username player,p.position,p.overall rating,fc.name from_club,tc.name to_club FROM transfers t LEFT JOIN users u ON u.id=t.user_id LEFT JOIN profiles p ON p.user_id=t.user_id LEFT JOIN clubs fc ON fc.id=t.from_club_id LEFT JOIN clubs tc ON tc.id=t.to_club_id ORDER BY t.created_at DESC LIMIT 30`).all();
  return json({transfers:r.results});
}
async function getBootstrap(env){
  const db=requireDb(env);
  const [news,fixtures,players,clubs,transfers,standings]=await Promise.all([
    db.prepare(`SELECT id,title,excerpt,image_key,published_at FROM news WHERE published=1 ORDER BY COALESCE(published_at,created_at) DESC LIMIT 3`).all(),
    db.prepare(`SELECT m.id,m.scheduled_at,m.status,h.name home_name,h.slug home_slug,a.name away_name,a.slug away_slug,d.name division_name FROM matches m JOIN clubs h ON h.id=m.home_club_id JOIN clubs a ON a.id=m.away_club_id JOIN divisions d ON d.id=m.division_id ORDER BY scheduled_at ASC LIMIT 6`).all(),
    db.prepare(`SELECT u.username,lower(u.username) slug,p.position,p.country,p.avatar_key,COALESCE(c.name,'Free Agent') club,COALESCE((SELECT SUM(ps.goals) FROM player_stats ps WHERE ps.user_id=u.id),0) goals,COALESCE((SELECT SUM(ps.assists) FROM player_stats ps WHERE ps.user_id=u.id),0) assists,COALESCE((SELECT COUNT(*) FROM player_stats ps WHERE ps.user_id=u.id),0) matches,COALESCE(ROUND((SELECT AVG(ps.rating) FROM player_stats ps WHERE ps.user_id=u.id),2),COALESCE(p.overall,0)) rating FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN club_members cm ON cm.user_id=u.id AND cm.left_at IS NULL LEFT JOIN clubs c ON c.id=cm.club_id WHERE u.status='ACTIVE' ORDER BY goals DESC,matches DESC LIMIT 6`).all(),
    db.prepare(`SELECT c.name,c.slug,c.logo_key,c.reputation,c.followers_count,COALESCE(d.name,'Ohne Division') division,u.username manager FROM clubs c LEFT JOIN divisions d ON d.id=c.division_id LEFT JOIN users u ON u.id=c.manager_user_id ORDER BY c.created_at DESC LIMIT 8`).all(),
    db.prepare(`SELECT t.id,t.type,t.created_at,u.username player,p.position,p.overall rating,fc.name from_club,tc.name to_club FROM transfers t LEFT JOIN users u ON u.id=t.user_id LEFT JOIN profiles p ON p.user_id=t.user_id LEFT JOIN clubs fc ON fc.id=t.from_club_id LEFT JOIN clubs tc ON tc.id=t.to_club_id ORDER BY t.created_at DESC LIMIT 6`).all(),
    db.prepare(`WITH stats AS (SELECT sc.club_id,COUNT(m.id) played,SUM(CASE WHEN (m.home_club_id=sc.club_id AND m.home_score>m.away_score) OR (m.away_club_id=sc.club_id AND m.away_score>m.home_score) THEN 1 ELSE 0 END) wins,SUM(CASE WHEN m.home_score=m.away_score THEN 1 ELSE 0 END) draws,SUM(CASE WHEN (m.home_club_id=sc.club_id AND m.home_score<m.away_score) OR (m.away_club_id=sc.club_id AND m.away_score<m.home_score) THEN 1 ELSE 0 END) losses,SUM(CASE WHEN m.home_club_id=sc.club_id THEN m.home_score ELSE m.away_score END) gf,SUM(CASE WHEN m.home_club_id=sc.club_id THEN m.away_score ELSE m.home_score END) ga FROM season_clubs sc LEFT JOIN matches m ON m.season_id=sc.season_id AND (m.home_club_id=sc.club_id OR m.away_club_id=sc.club_id) AND m.status='CONFIRMED' WHERE sc.season_id=1 GROUP BY sc.club_id) SELECT c.id,c.name,c.slug,COALESCE(s.played,0) played,COALESCE(s.wins,0) wins,COALESCE(s.draws,0) draws,COALESCE(s.losses,0) losses,COALESCE(s.gf,0) gf,COALESCE(s.ga,0) ga,(COALESCE(s.wins,0)*3+COALESCE(s.draws,0)) points FROM clubs c JOIN season_clubs sc ON sc.club_id=c.id AND sc.season_id=1 LEFT JOIN stats s ON s.club_id=c.id ORDER BY points DESC,(gf-ga) DESC,gf DESC LIMIT 6`).all()
  ]);
  return json({news:news.results,fixtures:fixtures.results,players:players.results,clubs:clubs.results,transfers:transfers.results,standings:standings.results});
}
