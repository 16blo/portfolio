import { z } from "zod";
import type { Portfolio } from "./types";

const text = (n: number) => z.string().trim().max(n);
const month = text(7).regex(/^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/, "Indique une année ou un mois valide, par exemple 2026-10.");
const id = text(80).regex(/^[a-zA-Z0-9_-]+$/);
const external = text(1500).refine(v => {
  if (!v) return true;
  try { const url = new URL(v); return /^https:\/\//i.test(v) && !/[\s\\]/.test(v) && url.protocol === "https:" && !!url.hostname && !url.username && !url.password; }
  catch { return false; }
}, "Utilise un lien HTTPS valide, sans identifiant ni mot de passe dans l’adresse.");
const asset = text(1500).refine(v => !v || /^(?:images|cv|uploads)\/[a-zA-Z0-9_-]+\.(?:pdf|png|jpe?g|webp)$/i.test(v), "Ajoute une pièce jointe à partir de l’atelier du portfolio.");
const schema = z.object({
  profile: z.object({
    name: text(100).min(3), headline: text(150).min(3), intro: text(800).min(20), about: text(2500).min(20),
    email: z.union([text(200).email(),z.literal("")]), location: text(100), linkedin: external, cv: asset, photo: asset
  }),
  projects: z.array(z.object({
    id, title: text(140).min(3), category: text(60).min(2), summary: text(350).min(10), date: month,
    tags: z.array(text(40)).max(10), context: text(150), details: text(4000), learning: text(2500),
    image: asset, link: external, visible: z.boolean(), art: z.enum(["network", "code", "terminal", "circuit"])
  })).max(300),
  certificates: z.array(z.object({
    id, title: text(200).min(3), issuer: text(100).min(2), category: text(60).min(2), date: month,
    expires: z.union([month, z.literal("")]), link: external, attachment: asset, visible: z.boolean()
  })).max(500),
  timeline: z.array(z.object({ period: text(100), label: text(150), title: text(200), place: text(200), text: text(2500), type: z.enum(["formation", "experience", "current"]) })).max(100),
  skills: z.array(z.object({ title: text(100), icon: z.enum(["server", "code", "cpu", "tools"]), desc: text(200), items: z.array(text(200)).max(30) })).max(30)
});

export function validatePortfolio(value: unknown): Portfolio {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error("Vérifie « " + issue.path.join(" / ") + " » : " + issue.message);
  }
  for (const list of [result.data.projects, result.data.certificates]) {
    if (new Set(list.map(x => x.id)).size !== list.length) throw new Error("Chaque fiche doit avoir un identifiant unique.");
  }
  return result.data;
}

export function publicPortfolio(data: Portfolio): Portfolio {
  return { ...data, projects: data.projects.filter(x => x.visible), certificates: data.certificates.filter(x => x.visible) };
}
