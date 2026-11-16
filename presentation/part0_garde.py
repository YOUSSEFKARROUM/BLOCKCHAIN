"""Diapositive 0 : page de garde (école, titre, équipe, encadrant)."""

from pathlib import Path

from manim import (
    DOWN,
    LEFT,
    RIGHT,
    UP,
    UR,
    UL,
    Create,
    Dot,
    FadeIn,
    GrowFromCenter,
    ImageMobject,
    LaggedStart,
    Line,
    Rectangle,
    Text,
    VGroup,
    config,
)

from base import CampusSlide
from theme import BODY, DISPLAY

NAVY = "#1B2242"
RUST = "#C4552B"
CREAM = "#F6F2EA"
INK_SOFT = "#4A4A55"
LOGO = Path(__file__).parent / "assets" / "ensa-logo.png"

TEAM = ["Youssef AIT KARROUM", "Othmane ALIOUALI", "Saad-Eddine EL JARIDA"]
SUPERVISOR = "Pr. Hamza TOUIL"


def label(text: str, size: float, color: str = NAVY, weight: str = "NORMAL", font: str = BODY) -> Text:
    return Text(text, font=font, font_size=size, color=color, weight=weight)


class S00PageDeGarde(CampusSlide):
    index = 0

    def construct(self) -> None:
        width, height = config.frame_width, config.frame_height
        paper = Rectangle(width=width, height=height, fill_color=CREAM, fill_opacity=1, stroke_width=0)
        self.add(paper)

        logo = ImageMobject(str(LOGO)).scale_to_fit_width(3.6).to_corner(UL, buff=0.35)
        wordmark = VGroup(label("Campus", 46, NAVY, "BOLD", DISPLAY), label("Fund", 46, RUST, "BOLD", DISPLAY)).arrange(RIGHT, buff=0.05)
        wordmark.to_corner(UR, buff=0.45)
        self.play(FadeIn(logo, shift=DOWN * 0.15), FadeIn(wordmark, shift=DOWN * 0.15), run_time=0.8)

        kicker = label("PROJET DE FIN DE MODULE BLOCKCHAIN", 26, INK_SOFT, "BOLD").shift(UP * 1.75)
        dots = VGroup(*[Dot(radius=0.03, color=RUST) for _ in range(3)]).arrange(RIGHT, buff=0.08).next_to(kicker, DOWN, buff=0.3)
        rule_left = Line(dots.get_left() + LEFT * 1.6, dots.get_left() + LEFT * 0.25, color=RUST, stroke_width=3)
        rule_right = Line(dots.get_right() + RIGHT * 0.25, dots.get_right() + RIGHT * 1.6, color=RUST, stroke_width=3)
        self.play(FadeIn(kicker, shift=UP * 0.1), GrowFromCenter(rule_left), GrowFromCenter(rule_right), FadeIn(dots), run_time=0.8)

        title = Text("CAMPUSFUND", font=DISPLAY, font_size=150, weight="BOLD")
        title.set_color_by_gradient(NAVY, "#5A3352", RUST)
        if title.width > width - 1.6:
            title.scale_to_fit_width(width - 1.6)
        title.shift(UP * 0.05)
        self.play(LaggedStart(*[FadeIn(letter, shift=UP * 0.25) for letter in title], lag_ratio=0.06), run_time=1.3)

        made_by = VGroup(label("Réalisé par", 26, NAVY, "BOLD"), *[label(name, 26, NAVY) for name in TEAM])
        made_by.arrange(DOWN, aligned_edge=LEFT, buff=0.14).to_edge(LEFT, buff=1.2).shift(DOWN * 2.05)
        supervised = VGroup(label("Encadré par", 26, NAVY, "BOLD"), label(SUPERVISOR, 26, NAVY))
        supervised.arrange(DOWN, aligned_edge=LEFT, buff=0.14).to_edge(RIGHT, buff=2.0).align_to(made_by, UP).shift(DOWN * 0.3)
        self.play(
            LaggedStart(*[FadeIn(line, shift=RIGHT * 0.15) for line in made_by], lag_ratio=0.15),
            LaggedStart(*[FadeIn(line, shift=LEFT * 0.15) for line in supervised], lag_ratio=0.15),
            run_time=1.2,
        )

        bottom_rule = Line(LEFT * (width / 2 - 0.55), RIGHT * (width / 2 - 0.55), color=RUST, stroke_width=4).to_edge(DOWN, buff=0.62)
        program = label("FILIÈRE INTELLIGENCE ARTIFICIELLE ET CYBERSÉCURITÉ", 17, INK_SOFT, "BOLD").next_to(bottom_rule, DOWN, buff=0.14).align_to(bottom_rule, LEFT)
        year = label("ANNÉE UNIVERSITAIRE 2026/2027", 17, INK_SOFT, "BOLD").next_to(bottom_rule, DOWN, buff=0.14).align_to(bottom_rule, RIGHT)
        self.play(Create(bottom_rule), FadeIn(program), FadeIn(year), run_time=0.8)
        self.pause(
            "Bonjour. Nous sommes Youssef Ait Karroum, Othmane Aliouali et Saad-Eddine El Jarida, encadrés par le "
            "professeur Hamza Touil. Notre projet : CampusFund."
        )
