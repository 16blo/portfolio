import { createRoot } from "react-dom/client";
import PortfolioView from "./portfolio";
import { publicPortfolio, validatePortfolio } from "./validation";
import "./style.css";
const root = createRoot(document.getElementById("root")!);
async function start() {
 const response = await fetch(new URL("portfolio.json", document.baseURI), { cache: "no-store" });
 if (!response.ok) throw new Error("Le portfolio est momentanément indisponible.");
 const data = publicPortfolio(validatePortfolio(await response.json()));
 document.title = data.profile.name + " — Portfolio";
 root.render(<PortfolioView data={data}/>);
}
start().catch(error => root.render(<main className="access-page"><h1>Le portfolio ne peut pas se charger.</h1><p>{error instanceof Error ? error.message : "Recharge la page."}</p><a className="button primary" href="./">Réessayer</a></main>));
