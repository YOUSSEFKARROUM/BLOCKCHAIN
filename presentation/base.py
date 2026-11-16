"""Classe de base des diapositives : fond nuit, trame de points, numéro de page."""

from manim import DOWN, LEFT, RIGHT, UP, Dot, FadeIn, FadeOut, Group, VGroup, config
from manim_slides import Slide

from theme import LINE, NIGHT, footer

TOTAL_SLIDES = 14
config.background_color = NIGHT


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
    """Diapositive au style CampusFund. `index` = numéro affiché en bas à droite."""

    index = 0
    skip_reversing = True

    def setup(self) -> None:
        super().setup()
        self.chrome = [dot_grid()]
        if self.index:
            self.chrome.append(footer(self.index, TOTAL_SLIDES))
        self.add(*self.chrome)

    def clear_slide(self, keep: tuple = ()) -> None:
        """Fait disparaître tout le contenu, sauf le fond et le pied de page."""
        movable = [m for m in self.mobjects if m not in self.chrome and m not in keep]
        if movable:
            self.play(*[FadeOut(m) for m in movable], run_time=0.5)

    def pause(self, notes: str = "") -> None:
        """Point d'arrêt : l'orateur passe à la suite d'un clic."""
        self.next_slide(notes=notes)


__all__ = ["CampusSlide", "DOWN", "FadeIn", "Group", "LEFT", "RIGHT", "UP", "TOTAL_SLIDES"]
