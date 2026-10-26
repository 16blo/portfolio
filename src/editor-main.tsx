import { createRoot } from "react-dom/client";
import PortfolioView from "./portfolio";
import Dashboard from "./editor";
import { publicPortfolio, validatePortfolio } from "./validation";
import { getWorkspace } from "./workspace";
import "./style.css";

const root = createRoot(document.getElementById("root")!);

async function start() {
  const response = await fetch(new URL("portfolio.json", document.baseURI), { cache: "no-store" });
  if (!response.ok) throw new Error("Le fichier portfolio.json est introuvable.");
  let data = validatePortfolio(await response.json());
  const editor = new URLSearchParams(location.search).get("apercu") !== "1";
  const preview = !editor && new URLSearchParams(location.search).get("apercu") === "1";
  let previewNotice = false;
  if (preview) {
    const saved = await getWorkspace();
    if (saved) {
      data = saved.data;
      const urls = new Map(saved.assets.map(a => [a.path, URL.createObjectURL(a.blob)]));
      data = { ...data, profile: { ...data.profile, photo: urls.get(data.profile.photo) ?? data.profile.photo, cv: urls.get(data.profile.cv) ?? data.profile.cv }, projects: data.projects.map(p => ({ ...p, image: urls.get(p.image) ?? p.image })), certificates: data.certificates.map(c => ({ ...c, attachment: urls.get(c.attachment) ?? c.attachment })) };
      window.addEventListener("pagehide", () => urls.forEach(url => URL.revokeObjectURL(url)), { once: true });
      previewNotice = true;
    }
  }
  document.title = (editor ? "Atelier de mise à jour — " : "") + data.profile.name + (editor ? "" : " — Portfolio");
  root.render(editor ? <Dashboard initial={data} /> : <>{preview && <div className="preview-banner">{previewNotice ? "Aperçu local de ta préparation. Les fiches en brouillon restent masquées." : "Aucune préparation locale : voici le site publié."} <a href="./editeur.html">Retour à l’atelier →</a></div>}<PortfolioView data={publicPortfolio(data)} /></>);
}

start().catch(error => root.render(<main className="access-page"><h1>Le portfolio ne peut pas se charger.</h1><p>{error instanceof Error ? error.message : "Recharge la page."}</p><p>Sur GitHub Pages, la source doit être la branche <strong>main</strong> et le dossier <strong>/docs</strong>. En local, lance <code>npm run dev</code>.</p><a className="button primary" href="./">Réessayer</a></main>));
