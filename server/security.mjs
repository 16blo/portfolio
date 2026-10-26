import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
export const ownerId = 201839768;
export const random = () => randomBytes(32).toString('base64url');
export function equal(a,b) { const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y); }
export function sign(value,secret,ttl=3600) { const body=Buffer.from(JSON.stringify({...value,exp:Date.now()+ttl*1000})).toString('base64url');return body+'.'+createHmac('sha256',secret).update(body).digest('base64url'); }
export function verify(token,secret) { try { const [body,mac,...extra]=String(token).split('.');if(extra.length||!equal(mac,createHmac('sha256',secret).update(body).digest('base64url')))return null;const v=JSON.parse(Buffer.from(body,'base64url'));return v.exp>Date.now()?v:null; }catch{return null;} }
export function cookies(header='') { return Object.fromEntries(header.split(';').map(x=>x.trim().split('=')).filter(x=>x.length===2)); }
export const cookie=(name,value,age=3600)=>`__Host-${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
export function authenticated(req,secret) { const v=verify(cookies(req.headers.cookie)['__Host-session'],secret);return v?.id===ownerId?v:null; }
export function mutationAllowed(req,session,origin) { return Boolean(session&&req.headers.origin===origin&&req.headers['content-type']==='application/json'&&equal(req.headers['x-csrf-token'],session.csrf)); }
