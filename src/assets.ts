export const maxAssetBytes = 5 * 1024 * 1024;
export type AssetExtension = "png" | "jpg" | "webp" | "pdf";

export async function inspectAsset(blob: Blob): Promise<AssetExtension> {
  if (!blob.size || blob.size > maxAssetBytes) throw new Error("Choisis un fichier non vide de 5 Mo maximum.");
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) return "png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpg";
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  if (String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") return "pdf";
  throw new Error("Format non accepté. Utilise une image PNG, JPEG ou WebP, ou un PDF. Les fichiers HTML et SVG ne sont pas acceptés.");
}
