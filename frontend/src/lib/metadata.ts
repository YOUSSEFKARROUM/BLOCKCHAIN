/** Métadonnées d'une campagne, stockées sur IPFS (seul le CID est on-chain). */
export interface CampaignMetadata {
  schema?: string;
  name: string;
  club: string;
  category: string;
  description: string;
  milestones: { title: string; description: string }[];
}

export const CID_PATTERN = /^(b[a-z2-7]{20,120}|Qm[1-9A-HJ-NP-Za-km-z]{44})$/;
export const MAX_METADATA_BYTES = 16_000;

function isString(v: unknown, max: number): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

/** Validation stricte : utilisée côté serveur (upload) ET côté client (lecture de données externes). */
export function parseMetadata(input: unknown): CampaignMetadata | null {
  if (typeof input !== "object" || input === null) return null;
  const o = input as Record<string, unknown>;
  if (!isString(o.name, 120) || !isString(o.club, 120) || !isString(o.category, 40) || !isString(o.description, 4000))
    return null;
  if (!Array.isArray(o.milestones) || o.milestones.length < 2 || o.milestones.length > 5) return null;
  const milestones = [];
  for (const m of o.milestones) {
    const mm = (m ?? {}) as Record<string, unknown>;
    if (!isString(mm.title, 120)) return null;
    milestones.push({ title: mm.title, description: typeof mm.description === "string" ? mm.description.slice(0, 600) : "" });
  }
  return { schema: "campusfund/v1", name: o.name, club: o.club, category: o.category, description: o.description, milestones };
}
