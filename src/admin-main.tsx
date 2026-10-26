import {createRoot} from "react-dom/client";
import {useEffect,useState} from "react";
import {ShieldCheck,ArrowUpRight} from "lucide-react";
import Dashboard from "./editor";
import {validatePortfolio,publicPortfolio} from "./validation";
import type {Portfolio} from "./types";
import type {Asset} from "./workspace";
import "./style.css";
async function api(path:string,options:RequestInit={}){const r=await fetch(path,{...options,credentials:"same-origin",cache:"no-store"});if(!r.headers.get("content-type")?.includes("application/json"))throw new Error("La connexion nécessite l’activation du serveur.");const json=await r.json();if(!r.ok)throw new Error(json.error||"Opération indisponible.");return json;}
function App(){const [data,setData]=useState<Portfolio|null>(null),[csrf,setCsrf]=useState(""),[revision,setRevision]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(true);
useEffect(()=>{api("/api/session").then(async s=>{setCsrf(s.csrf);const p=await api("/api/portfolio");setRevision(p.revision);setData(validatePortfolio(p.data));}).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
async function publish(next:Portfolio,assets:Asset[]){const clean=publicPortfolio(next);const used=new Set([...clean.projects.map(p=>p.image),...clean.certificates.map(c=>c.attachment)]);const attachments=[];for(const a of assets.filter(a=>used.has(a.path))){const bytes=new Uint8Array(await a.blob.arrayBuffer());let binary="";for(const b of bytes)binary+=String.fromCharCode(b);attachments.push({path:a.path,base64:btoa(binary)});}const result=await api("/api/publish",{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-Token":csrf},body:JSON.stringify({data:clean,assets:attachments,revision})});setRevision(result.revision);}
async function logout(){try{await api("/api/logout",{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-Token":csrf},body:"{}"});location.reload();}catch(e){setError(e instanceof Error?e.message:"Déconnexion impossible.");}}
if(data)return <><div className="owner-session"><span><ShieldCheck size={16}/> Connecté · 16blo</span><button className="button secondary" onClick={logout}>Se déconnecter</button></div><Dashboard initial={data} remotePublish={publish}/></>;
return <main className="access-page"><ShieldCheck size={40}/><p className="section-index">ESPACE PROPRIÉTAIRE</p><h1>Ton parcours évolue.<br/>Ton portfolio aussi.</h1><p>Ajoute tes projets et tes certifications, puis publie-les depuis un seul endroit.</p>{loading?<p>Vérification de la connexion…</p>:<><a className="button primary" href="/auth/github">Se connecter avec GitHub <ArrowUpRight size={18}/></a><p>Accès réservé à ton compte 16blo.</p>{error&&<p role="status">{error}</p>}</>}<p><a href="https://16blo.github.io/portfolio/">Voir le portfolio public ↗</a></p></main>;
}
createRoot(document.getElementById("root")!).render(<App/>);
