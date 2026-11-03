import { NextResponse } from "next/server";
import { readGateway, readLocal } from "@/lib/ipfsStore";
import { CID_PATTERN, parseMetadata } from "@/lib/metadata";

export const runtime = "nodejs";

/** GET /api/ipfs/<cid> : métadonnées depuis le cache local, sinon depuis une passerelle IPFS publique. */
export async function GET(_request: Request, { params }: { params: { cid: string } }) {
  const { cid } = params;
  if (!CID_PATTERN.test(cid)) return NextResponse.json({ error: "CID invalide." }, { status: 400 });

  const local = await readLocal(cid);
  const text = local ?? (await readGateway(cid));
  if (!text) return NextResponse.json({ error: "Métadonnées introuvables sur IPFS." }, { status: 404 });

  let metadata = null;
  try {
    metadata = parseMetadata(JSON.parse(text));
  } catch {
    metadata = null;
  }
  if (!metadata) return NextResponse.json({ error: "Métadonnées au format inattendu." }, { status: 422 });
  return NextResponse.json({ metadata, source: local ? "cache" : "gateway" });
}
