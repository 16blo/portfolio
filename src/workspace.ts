import { validatePortfolio } from "./validation";
import type { Portfolio } from "./types";
import { inspectAsset, maxAssetBytes } from "./assets";

export type Asset = { path: string; blob: Blob };
export type Workspace = { data: Portfolio; assets: Asset[] };
const key = "preparation";
let connection: Promise<IDBDatabase> | undefined;

function open(): Promise<IDBDatabase> {
  return connection ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("yann-portfolio-workspace-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("workspace");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { connection = undefined; reject(request.error); };
  });
}

export async function getWorkspace(): Promise<Workspace | null> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = db.transaction("workspace").objectStore("workspace").get(key);
    request.onsuccess = () => {
      try { const saved = request.result; resolve(saved ? { data: validatePortfolio(saved.data), assets: saved.assets ?? [] } : null); }
      catch (error) { reject(error); }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function putWorkspace(workspace: Workspace): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("workspace", "readwrite");
    tx.objectStore("workspace").put(workspace, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Sauvegarde locale indisponible."));
    tx.onabort = () => reject(tx.error ?? new Error("Sauvegarde locale interrompue."));
  });
}

export async function makeBackup(workspace: Workspace): Promise<Blob> {
  const assets = await Promise.all(workspace.assets.map(async a => {
    const bytes = new Uint8Array(await a.blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
    return { path: a.path, type: a.blob.type, base64: btoa(binary) };
  }));
  return new Blob([JSON.stringify({ version: 1, data: workspace.data, assets }, null, 2)], { type: "application/json" });
}

export async function readBackup(file: File): Promise<Workspace> {
  if (file.size > 100 * 1024 * 1024) throw new Error("La sauvegarde dépasse 100 Mo.");
  const raw = JSON.parse(await file.text());
  if (!raw || typeof raw !== "object" || (raw.version !== undefined && raw.version !== 1)) throw new Error("Version de sauvegarde non reconnue.");
  const data = validatePortfolio(raw.data ?? raw);
  if (raw.assets !== undefined && (!Array.isArray(raw.assets) || raw.assets.length > 600)) throw new Error("La liste des fichiers est invalide.");
  const paths = new Set<string>();
  const assets: Asset[] = await Promise.all((raw.assets ?? []).map(async (a: { path: string; base64: string }) => {
    if (!a || typeof a.path !== "string" || !/^uploads\/[a-zA-Z0-9_-]+\.(?:pdf|png|jpe?g|webp)$/i.test(a.path) || paths.has(a.path) || typeof a.base64 !== "string" || a.base64.length > Math.ceil(maxAssetBytes / 3) * 4) throw new Error("Un fichier joint est invalide.");
    paths.add(a.path);
    const binary = atob(a.base64);
    if (binary.length > 5 * 1024 * 1024) throw new Error("Un fichier joint dépasse 5 Mo.");
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const ext = a.path.split(".").pop()!.toLowerCase();
    const type = ext === "pdf" ? "application/pdf" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/" + ext;
    const blob = new Blob([bytes], { type });
    const actual = await inspectAsset(blob);
    if (actual !== (ext === "jpeg" ? "jpg" : ext)) throw new Error("Le contenu d’un fichier ne correspond pas à son extension.");
    return { path: a.path, blob };
  }));
  return { data, assets };
}
