import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname,resolve,sep,extname } from 'node:path';
import { createHash } from 'node:crypto';
import { ownerId,random,equal,sign,verify,cookies,cookie,authenticated,mutationAllowed } from './security.mjs';
import { validatePortfolio,publicPortfolio } from '../src/validation.ts';
import { inspectAsset } from '../src/assets.ts';
const repo='16blo/portfolio';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'../admin-dist');
const env=process.env;
const origin=env.APP_ORIGIN || (env.RENDER_EXTERNAL_HOSTNAME?'https://'+env.RENDER_EXTERNAL_HOSTNAME:'');
const configured=()=>/^https:\/\/[^/]+$/.test(origin)&&env.GITHUB_CLIENT_ID&&env.GITHUB_CLIENT_SECRET&&env.GITHUB_CONTENT_TOKEN&&env.SESSION_SECRET?.length>=43;
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: https://16blo.github.io; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'Strict-Transport-Security':'max-age=31536000'};
async function gh(path,options={},token=env.GITHUB_CONTENT_TOKEN) { const r=await fetch('https://api.github.com/'+path,{...options,headers:{Accept:'application/vnd.github+json','User-Agent':'Tehua-Portfolio-Admin','Authorization':'Bearer '+token,'Content-Type':'application/json'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Object.assign(new Error('GitHub a refusé la requête.'),{status:r.status===409||r.status===422?409:502});return r.json(); }
const api=(path,options)=>gh('repos/'+repo+'/'+path,options);
const post=(path,body)=>api(path,{method:'POST',body:JSON.stringify(body)});
async function snapshot(){const ref=await api('git/ref/heads/main');const revision=ref.object.sha;const commit=await api('git/commits/'+revision);const f=await api('contents/public/portfolio.json?ref='+revision);return {revision,tree:commit.tree.sha,data:validatePortfolio(JSON.parse(Buffer.from(f.content,'base64')))};}
async function body(req){const parts=[];let size=0;for await(const p of req){size+=p.length;if(size>16*1024*1024)throw Object.assign(new Error('Envoi limité à 16 Mo.'),{status:413});parts.push(p);}try{return JSON.parse(Buffer.concat(parts));}catch{throw Object.assign(new Error('JSON invalide.'),{status:400});}}
async function publish(payload){
 let data;try{data=validatePortfolio(payload.data);}catch{throw Object.assign(new Error('Vérifie les champs des fiches.'),{status:400});}
 // Contacts and previously withheld personal files must not be reintroduced by the dashboard.
 if(data.profile.email||data.profile.location||data.profile.photo||data.profile.cv)throw Object.assign(new Error('Les coordonnées, la photo et le CV restent privés. Retire-les avant publication.'),{status:400});
 if(data.projects.some(x=>!x.visible)||data.certificates.some(x=>!x.visible))throw Object.assign(new Error('Les brouillons ne doivent pas être envoyés au serveur.'),{status:400});
 if(!Array.isArray(payload.assets)||payload.assets.length>20)throw Object.assign(new Error('Pièces jointes invalides.'),{status:400});
 const current=await snapshot();if(payload.revision!==current.revision)throw Object.assign(new Error('Le dépôt a changé. Sauvegarde ta préparation puis recharge avant de publier.'),{status:409});
 const wanted=new Set([...data.projects.map(x=>x.image),...data.certificates.map(x=>x.attachment)].filter(Boolean));const seen=new Set();const assets=[];
 for(const a of payload.assets){if(typeof a.path!=='string'||!/^uploads\/[a-f0-9]{24}\.(png|jpg|webp|pdf)$/.test(a.path)||!wanted.has(a.path)||seen.has(a.path)||typeof a.base64!=='string'||a.base64.length>7*1024*1024||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(a.base64))throw Object.assign(new Error('Pièce jointe invalide.'),{status:400});seen.add(a.path);const bytes=Buffer.from(a.base64,'base64');let ext;try{ext=await inspectAsset(new Blob([bytes]));}catch{throw Object.assign(new Error('Format ou taille de pièce jointe invalide.'),{status:400});}if(!a.path.endsWith('.'+ext))throw Object.assign(new Error('Extension incohérente.'),{status:400});assets.push(a);}
 const entries=[];for(const a of assets){const b=await post('git/blobs',{content:a.base64,encoding:'base64'});for(const dir of ['public','docs'])entries.push({path:dir+'/'+a.path,mode:'100644',type:'blob',sha:b.sha});}
 const content=JSON.stringify(publicPortfolio(data),null,2)+'\n';for(const dir of ['public','docs'])entries.push({path:dir+'/portfolio.json',mode:'100644',type:'blob',content});
 const tree=await post('git/trees',{base_tree:current.tree,tree:entries});const commit=await post('git/commits',{message:'Mettre à jour le portfolio depuis le dashboard propriétaire',tree:tree.sha,parents:[current.revision]});
 // A concurrent change makes this non-fast-forward; never force a publication.
 await api('git/refs/heads/main',{method:'PATCH',body:JSON.stringify({sha:commit.sha,force:false})});return {revision:commit.sha,url:'https://16blo.github.io/portfolio/'};
}
export const server=createServer(async(req,res)=>{
 const send=(status,value,extra={})=>{res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8',...extra});res.end(JSON.stringify(value));};
 const redirect=(url,extra={})=>{res.writeHead(302,{...headers,Location:url,...extra});res.end();};
 try{
 const url=new URL(req.url,'http://localhost');const path=url.pathname;
 if(path==='/healthz')return send(200,{status:'ok',configuration:{origin:/^https:\/\/[^/]+$/.test(origin),githubClientId:Boolean(env.GITHUB_CLIENT_ID),githubClientSecret:Boolean(env.GITHUB_CLIENT_SECRET),publicationToken:Boolean(env.GITHUB_CONTENT_TOKEN),sessionSecret:Boolean(env.SESSION_SECRET?.length>=43)}});
 if((path.startsWith('/api/')||path.startsWith('/auth/'))&&!configured())return send(503,{error:'Dashboard non activé : configuration de connexion requise.'});
 if(path==='/auth/github'&&req.method==='GET'){const state=random(),verifier=random();const value=sign({state,verifier},env.SESSION_SECRET,600);const u=new URL('https://github.com/login/oauth/authorize');for(const [k,v]of Object.entries({client_id:env.GITHUB_CLIENT_ID,redirect_uri:origin+'/auth/callback',state,scope:'',allow_signup:'false',code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}))u.searchParams.set(k,v);return redirect(u.href,{'Set-Cookie':cookie('oauth',value,600)});}
 if(path==='/auth/callback'&&req.method==='GET'){
 const flow=verify(cookies(req.headers.cookie)['__Host-oauth'],env.SESSION_SECRET);if(!flow||!equal(url.searchParams.get('state'),flow.state)||!url.searchParams.get('code'))return send(403,{error:'Connexion expirée ou invalide.'});
 const r=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code:url.searchParams.get('code'),redirect_uri:origin+'/auth/callback',code_verifier:flow.verifier}),signal:AbortSignal.timeout(15000)});const token=await r.json();if(!r.ok||!token.access_token)return send(403,{error:'Connexion GitHub refusée.'});
 const user=await gh('user',{},token.access_token);if(user.id!==ownerId)return send(403,{error:'Accès réservé au propriétaire.'},{'Set-Cookie':[cookie('oauth','',0),cookie('session','',0)]});
 return redirect('/',{'Set-Cookie':[cookie('oauth','',0),cookie('session',sign({id:ownerId,csrf:random()},env.SESSION_SECRET))]});}
 const session=authenticated(req,env.SESSION_SECRET);
 if(path.startsWith('/api/')){
 if(!session)return send(401,{error:'Connecte-toi avec ton compte GitHub propriétaire.'});
 if(path==='/api/session'&&req.method==='GET')return send(200,{login:'16blo',csrf:session.csrf});
 if(path==='/api/portfolio'&&req.method==='GET'){const s=await snapshot();return send(200,{data:s.data,revision:s.revision});}
 if(!mutationAllowed(req,session,origin))return send(403,{error:'Requête non autorisée.'});
 if(path==='/api/logout'&&req.method==='POST')return send(200,{ok:true},{'Set-Cookie':cookie('session','',0)});
 if(path==='/api/publish'&&req.method==='POST')return send(200,await publish(await body(req)));
 return send(404,{error:'Route inconnue.'});}
 if(req.method!=='GET')return send(405,{error:'Méthode non autorisée.'});
 // Only built UI files are served. No source, environment files or repository browsing.
 const name=path==='/'?'admin.html':path.slice(1);if(!/^(?:admin\.html|assets\/[A-Za-z0-9_.-]+\.(?:js|css)|favicon\.svg)$/.test(name))return send(404,{error:'Introuvable.'});
 const target=resolve(base,name);if(!target.startsWith(base+sep))return send(404,{error:'Introuvable.'});const bytes=await readFile(target);res.writeHead(200,{...headers,'Content-Type':({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'})[extname(name)]});res.end(bytes);
 }catch(e){send(e.status||500,{error:e.status===409?e.message:e.status===400||e.status===413?e.message:'Opération indisponible. Réessaie plus tard.'});}
});
if(process.argv[1]===fileURLToPath(import.meta.url))server.listen(Number(env.PORT||3000),'0.0.0.0');
