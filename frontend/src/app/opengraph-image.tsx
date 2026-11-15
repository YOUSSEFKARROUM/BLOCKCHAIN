import { ImageResponse } from "next/og";

// Image affichée quand le lien du site est partagé (réseaux sociaux, messageries).
// Runtime « edge » : avec le runtime Node, next/og échoue sous Windows (chemin de police invalide).
export const runtime = "edge";
export const alt = "CampusFund : les fonds décollent sur vote, par jalon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NIGHT = "#09090A";
const AMBER = "#FFB800";
const TICKET = "#F2F0E8";
const C_BG = "linear-gradient(to bottom, #FFC42E 0%, #FFC42E 48%, #09090A 48%, #09090A 52%, #F0A800 52%)";
const F_BG = "linear-gradient(to bottom, #2A2A2E 0%, #2A2A2E 48%, #09090A 48%, #09090A 52%, #1D1D20 52%)";
const TILE_BG = "linear-gradient(to bottom, #2A2A2E 0%, #232326 48.5%, #050506 48.5%, #050506 51.5%, #1C1C1F 51.5%, #17171A 100%)";

function Tile({ ch, background, color, w = 62, h = 82, font = 56 }: { ch: string; background: string; color: string; w?: number; h?: number; font?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 8, background, color, fontSize: font, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {ch}
    </div>
  );
}

function FlapRow({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from(text).map((ch, i) => (
        <Tile key={i} ch={ch === " " ? "" : ch} background={TILE_BG} color={color} w={78} h={102} font={72} />
      ))}
    </div>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: NIGHT, color: TICKET, padding: 64, fontFamily: "monospace" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <Tile ch="C" background={C_BG} color={NIGHT} />
            <Tile ch="F" background={F_BG} color={AMBER} />
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, letterSpacing: 8 }}>CAMPUSFUND</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <FlapRow text="LES FONDS" color={TICKET} />
          <FlapRow text="DÉCOLLENT" color={TICKET} />
          <FlapRow text="SUR VOTE." color={AMBER} />
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#A9A9B2", letterSpacing: 2 }}>CLUBS ÉTUDIANTS · TRANCHE PAR TRANCHE · VOTE DE LA DAO</div>
      </div>
    ),
    size,
  );
}
