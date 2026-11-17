"""Classe de base des diapositives : fond blanc, trame de points, repère de section, numéro de page."""

from manim import Dot, FadeOut, VGroup, config
from manim_slides import Slide

from theme import LINE, NIGHT, footer

TOTAL_SLIDES = 14  # page de garde comprise
config.background_color = NIGHT

# Sections annoncées dans le sommaire (numéro, nom)
PROBLEME = "01 · Problème et idée"
ARCHITECTURE = "02 · Architecture"
CYCLE = "03 · Cycle d'une campagne"
DEMO = "04 · Démonstration"
SECURITE = "05 · Sécurité"
FIN = "06 · Limites et conclusion"


def dot_grid() -> VGroup:
    """Trame de points discrète, comme le fond du site."""
    dots = VGroup()
    step = 0.5
    width, height = config.frame_width, config.frame_height
    x = -width / 2 + step / 2
    while x < width / 2:
        y = -height / 2 + step / 2
        while y < height / 2:
            dots.add(Dot([x, y, 0], radius=0.012, color=LINE))
            y += step
        x += step
    return dots


class CampusSlide(Slide):
    """Diapositive au style CampusFund. `index` = numéro de page (0 = aucun), `section` = repère en bas à gauche."""

    index = 0
    section = ""
    skip_reversing = True

    def setup(self) -> None:
        super().setup()
        self.chrome = [dot_grid()]
        if self.index:
            self.chrome.append(footer(self.index, TOTAL_SLIDES, self.section))
        self.add(*self.chrome)

    def clear_slide(self, keep: tuple = ()) -> None:
        """Fait disparaître tout le contenu, sauf le fond et le pied de page."""
        movable = [m for m in self.mobjects if m not in self.chrome and m not in keep]
        if movable:
            self.play(*[FadeOut(m) for m in movable], run_time=0.5)

    def pause(self, notes: str = "") -> None:
        """Point d'arrêt : l'orateur passe à la suite d'un clic."""
        self.next_slide(notes=notes)


__all__ = ["ARCHITECTURE", "CYCLE", "CampusSlide", "DEMO", "FIN", "PROBLEME", "SECURITE", "TOTAL_SLIDES"]
