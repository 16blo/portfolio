import test,{after,before} from 'node:test';
import assert from 'node:assert/strict';
import {random,sign,verify,ownerId,authenticated,mutationAllowed} from '../server/security.mjs';
const secret=random()+random();
const origin='https://owner.example';
process.env.APP_ORIGIN=origin;process.env.SESSION_SECRET=secret;process.env.GITHUB_CLIENT_ID='test-client';process.env.GITHUB_CLIENT_SECRET='test-value';process.env.GITHUB_CONTENT_TOKEN='test-value';
const {server}=await import('../server/index.mjs');let url;
before(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;});after(()=>server.close());
const session=sign({id:ownerId,csrf:'expected-csrf'},secret);const cookie='__Host-session='+session;
test('signed sessions reject forgery, expiry and other accounts',()=>{
 assert.equal(verify(session+'x',secret),null);assert.equal(verify(sign({id:ownerId},secret,-1),secret),null);
 assert.equal(authenticated({headers:{cookie:'__Host-session='+sign({id:123},secret)}},secret),null);
 assert.equal(authenticated({headers:{cookie}},secret).id,ownerId);
});
test('mutations require exact origin and CSRF proof',()=>{
 const state=verify(session,secret);const headers={origin,'content-type':'application/json','x-csrf-token':'expected-csrf'};
 assert.equal(mutationAllowed({headers},state,origin),true);
 for(const key of ['origin','x-csrf-token','content-type'])assert.equal(mutationAllowed({headers:{...headers,[key]:'bad'}},state,origin),false);
});
test('all data and publication routes refuse unauthenticated requests',async()=>{
 for(const path of ['/api/session','/api/portfolio','/api/publish','/api/logout']){const r=await fetch(url+path,{method:path.includes('publish')||path.includes('logout')?'POST':'GET'});assert.equal(r.status,401);}
});
test('wrong owner and forged cookies cannot read data',async()=>{
 for(const value of [session+'x',sign({id:999,csrf:'expected-csrf'},secret)])assert.equal((await fetch(url+'/api/portfolio',{headers:{Cookie:'__Host-session='+value}})).status,401);
});
test('cross-site publication is forbidden even with an owner cookie',async()=>{
 const r=await fetch(url+'/api/publish',{method:'POST',headers:{Cookie:cookie,Origin:'https://attacker.example','Content-Type':'application/json','X-CSRF-Token':'expected-csrf'},body:'{}'});assert.equal(r.status,403);
});
test('OAuth requires matching signed browser state',async()=>{
 const r=await fetch(url+'/auth/callback?code=invalid&state=forged');assert.equal(r.status,403);
});
test('login requests use state, PKCE and no repository scope',async()=>{
 const r=await fetch(url+'/auth/github',{redirect:'manual'});assert.equal(r.status,302);const location=new URL(r.headers.get('location'));assert.equal(location.origin,'https://github.com');assert.equal(location.searchParams.get('scope'),'');assert.equal(location.searchParams.get('code_challenge_method'),'S256');assert.equal(location.searchParams.get('state').length,43);assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);
});
test('owner can inspect session and logout without exposing secrets',async()=>{
 const r=await fetch(url+'/api/session',{headers:{Cookie:cookie}});assert.deepEqual(await r.json(),{login:'16blo',csrf:'expected-csrf'});assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 const out=await fetch(url+'/api/logout',{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','X-CSRF-Token':'expected-csrf'},body:'{}'});assert.equal(out.status,200);assert.match(out.headers.get('set-cookie'),/Max-Age=0/);
});
test('environment and source paths never served',async()=>{for(const path of ['/.env','/server/index.mjs','/src/editor.tsx','/portfolio.json'])assert.equal((await fetch(url+path)).status,404);});
test('server fails closed when configuration is incomplete',async()=>{const old=process.env.SESSION_SECRET;delete process.env.SESSION_SECRET;try{assert.equal((await fetch(url+'/api/session',{headers:{Cookie:cookie}})).status,503);}finally{process.env.SESSION_SECRET=old;}});

test('publication validates content and writes both JSON files atomically without force',async()=>{
 const {readFile}=await import('node:fs/promises');const data=JSON.parse(await readFile('public/portfolio.json','utf8'));const actualFetch=globalThis.fetch;const calls=[];
 globalThis.fetch=async(input,init={})=>{
  if(!String(input).startsWith('https://api.github.com/'))return actualFetch(input,init);
  const path=new URL(input).pathname;const value=init.body?JSON.parse(init.body):null;calls.push({path,value});let reply;
  if(path.endsWith('/git/ref/heads/main'))reply={object:{sha:'head1'}};
  else if(path.endsWith('/git/commits/head1'))reply={tree:{sha:'tree1'}};
  else if(path.endsWith('/contents/public/portfolio.json'))reply={content:Buffer.from(JSON.stringify(data)).toString('base64')};
  else if(path.endsWith('/git/trees'))reply={sha:'tree2'};
  else if(path.endsWith('/git/commits'))reply={sha:'head2'};
  else if(path.endsWith('/git/refs/heads/main'))reply={object:{sha:'head2'}};
  else throw new Error('Unexpected GitHub route');
  return new Response(JSON.stringify(reply),{headers:{'Content-Type':'application/json'}});
 };
 const publish=payload=>actualFetch(url+'/api/publish',{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','X-CSRF-Token':'expected-csrf'},body:JSON.stringify(payload)});
 try{
  const forbidden=structuredClone(data);forbidden.profile.email='private@example.org';assert.equal((await publish({data:forbidden,assets:[],revision:'head1'})).status,400);assert.equal(calls.length,0);
  const draft=structuredClone(data);draft.certificates[0].visible=false;assert.equal((await publish({data:draft,assets:[],revision:'head1'})).status,400);
  assert.equal((await publish({data,assets:[],revision:'outdated'})).status,409);assert.equal(calls.filter(x=>x.value).length,0);
  const result=await publish({data,assets:[],revision:'head1'});assert.equal(result.status,200);assert.equal((await result.json()).revision,'head2');
  const tree=calls.find(x=>x.path.endsWith('/git/trees')).value;assert.deepEqual(tree.tree.map(x=>x.path),['public/portfolio.json','docs/portfolio.json']);assert.equal(tree.tree[0].content,tree.tree[1].content);
  assert.equal(calls.find(x=>x.path.endsWith('/git/refs/heads/main')).value.force,false);
 }finally{globalThis.fetch=actualFetch;}
});
