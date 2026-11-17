"""Ajoute à campusfund.html la touche E : aller directement à la fin de l'animation en cours.

À relancer après chaque `manim_slides convert` (qui réécrit le fichier) : python add_skip_key.py
"""

from pathlib import Path

HTML = Path(__file__).parent / "campusfund.html"
MARKER = "<!-- touche E : fin de l'animation -->"
SNIPPET = (
    MARKER
    + """
    <script>
      // Touche E : amène la vidéo de l'étape affichée à sa dernière image. Rien n'est affiché à l'écran.
      Reveal.addKeyBinding({ keyCode: 69, key: "E", description: "Fin de l'animation" }, () => {
        const background = Reveal.getSlideBackground(Reveal.getCurrentSlide());
        const video = background && background.querySelector("video");
        if (!video) return;
        const jump = () => {
          video.pause();
          video.currentTime = Math.max(0, video.duration - 0.05);
        };
        if (Number.isFinite(video.duration)) jump();
        else video.addEventListener("loadedmetadata", jump, { once: true });
      });
    </script>
"""
)


def main() -> None:
    html = HTML.read_text(encoding="utf-8")
    if MARKER in html:
        print("touche E déjà présente")
        return
    if "</body>" not in html:
        raise SystemExit("balise </body> introuvable dans campusfund.html")
    HTML.write_text(html.replace("</body>", SNIPPET + "  </body>", 1), encoding="utf-8", newline="\n")
    print("touche E ajoutée")


if __name__ == "__main__":
    main()
