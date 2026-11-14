import { ImageResponse } from "next/og";

// Image affichée quand le lien du site est partagé (réseaux sociaux, messageries).
// Runtime « edge » : avec le runtime Node, next/og échoue sous Windows (chemin de police invalide).
export const runtime = "edge";
export const alt = "CampusFund : le financement étudiant qui se vote";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BAR = { width: 150, height: 38, borderRadius: 19, background: "#000" };

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#000", color: "#f5f5f7", padding: 80 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ width: 96, height: 96, borderRadius: 27, background: "#f5f5f7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <div style={{ ...BAR, width: 54, height: 14, borderRadius: 7 }} />
            <div style={{ ...BAR, width: 54, height: 14, borderRadius: 7, opacity: 0.32 }} />
            <div style={{ ...BAR, width: 54, height: 14, borderRadius: 7, opacity: 0.32 }} />
          </div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>
            Campus<span style={{ color: "#a1a1a6" }}>Fund</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>Ton argent reste au coffre.</div>
          <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -4, lineHeight: 1.1, color: "#6e6e73" }}>Jusqu&apos;au vote.</div>
          <div style={{ marginTop: 28, fontSize: 32, color: "#a1a1a6" }}>Le financement des projets étudiants, débloqué par le vote de ceux qui ont donné.</div>
        </div>
      </div>
    ),
    size,
  );
}
