import { publicPortfolio, validatePortfolio } from "./validation";
import type { Workspace } from "./workspace";

// Small standards-compliant ZIP writer (stored entries, UTF-8, CRC-32).
// No upload, external service, account token or additional dependency is used.
const table = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const b of bytes) crc = table[(crc ^ b) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
const encoder = new TextEncoder();
type Entry = { path: string; content: Blob | string };
export async function createZip(entries: Entry[]): Promise<Blob> {
  const parts: BlobPart[] = [], central: BlobPart[] = [];
  let offset = 0, centralSize = 0;
  for (const entry of entries) {
    if (!/^[a-zA-Z0-9_./-]+$/.test(entry.path) || entry.path.startsWith("/") || entry.path.split("/").includes("..")) throw new Error("Chemin de fichier invalide.");
    const name = encoder.encode(entry.path);
    const bytes = typeof entry.content === "string" ? encoder.encode(entry.content) : new Uint8Array(await entry.content.arrayBuffer());
    const crc = crc32(bytes);
    const header = new Uint8Array(30 + name.length);
    const local = new DataView(header.buffer);
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
    local.setUint16(12, 0x21, true); local.setUint32(14, crc, true); local.setUint32(18, bytes.length, true); local.setUint32(22, bytes.length, true); local.setUint16(26, name.length, true);
    header.set(name, 30);
    parts.push(header, bytes);
    const directory = new Uint8Array(46 + name.length);
    const view = new DataView(directory.buffer);
    view.setUint32(0, 0x02014b50, true); view.setUint16(4, 20, true); view.setUint16(6, 20, true); view.setUint16(8, 0x0800, true); view.setUint16(14, 0x21, true);
    view.setUint32(16, crc, true); view.setUint32(20, bytes.length, true); view.setUint32(24, bytes.length, true); view.setUint16(28, name.length, true); view.setUint32(42, offset, true);
    directory.set(name, 46); central.push(directory); centralSize += directory.length; offset += header.length + bytes.length;
  }
  const end = new Uint8Array(22), footer = new DataView(end.buffer);
  footer.setUint32(0, 0x06054b50, true); footer.setUint16(8, entries.length, true); footer.setUint16(10, entries.length, true); footer.setUint32(12, centralSize, true); footer.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: "application/zip" });
}

export async function publicationZip(workspace: Workspace): Promise<Blob> {
  const data = publicPortfolio(validatePortfolio(workspace.data));
  const json = JSON.stringify(data, null, 2) + "\n";
  const paths = new Set([data.profile.photo, data.profile.cv, ...data.projects.map(p => p.image), ...data.certificates.map(c => c.attachment)]);
  const files: Entry[] = [{ path: "docs/portfolio.json", content: json }, { path: "public/portfolio.json", content: json }];
  for (const path of paths) {
    if (!path || /^https:\/\//i.test(path)) continue;
    let blob = workspace.assets.find(a => a.path === path)?.blob;
    if (!blob) {
      const url = new URL(path, document.baseURI);
      if (url.origin !== location.origin) throw new Error("Un fichier joint doit appartenir au portfolio.");
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Le fichier « " + path + " » est introuvable. Ajoute-le à nouveau avant d’exporter.");
      blob = await response.blob();
      if (blob.type.includes("text/html")) throw new Error("Le fichier « " + path + " » est introuvable.");
    }
    files.push({ path: "docs/" + path, content: blob }, { path: "public/" + path, content: blob });
  }
  return createZip(files);
}

export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
