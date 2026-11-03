import { NextResponse } from "next/server";
import { cidV1Raw } from "@/lib/cid";
import { pinToPinata, writeLocal } from "@/lib/ipfsStore";
import { MAX_METADATA_BYTES, parseMetadata } from "@/lib/metadata";

export const runtime = "nodejs";

// Limitation de débit simple, en mémoire : 10 envois par minute et par adresse IP.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.set(ip, [...recent, now]);
  return recent.length >= MAX_PER_WINDOW;
}

/** POST /api/ipfs : valide les métadonnées, les publie sur IPFS (Pinata) et renvoie le CID. */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Trop d'envois, réessayez dans une minute." }, { status: 429 });
  }

  const raw = await request.text();
  if (raw.length > MAX_METADATA_BYTES) {
    return NextResponse.json({ error: "Métadonnées trop volumineuses." }, { status: 413 });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const metadata = parseMetadata(parsed);
  if (!metadata) {
    return NextResponse.json({ error: "Champs manquants ou invalides (titre, club, catégorie, description, 2 à 5 jalons)." }, { status: 400 });
  }

  const content = JSON.stringify(metadata);
  const jwt = process.env.PINATA_JWT;
  try {
    if (jwt) {
      const cid = await pinToPinata(jwt, content, metadata.name);
      await writeLocal(cid, content); // cache : lecture immédiate sans attendre la passerelle
      return NextResponse.json({ cid, mode: "pinata" });
    }
    // Mode développement : pas de clé Pinata. Le CID est calculé localement (même algorithme qu'IPFS),
    // mais le fichier N'EST PAS publié sur le réseau IPFS. Clairement signalé à l'utilisateur.
    const cid = cidV1Raw(content);
    await writeLocal(cid, content);
    return NextResponse.json({ cid, mode: "local" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erreur inconnue";
    return NextResponse.json({ error: `Échec de l'envoi sur IPFS : ${message}` }, { status: 502 });
  }
}
