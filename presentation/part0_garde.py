"""Diapositive 0 : page de garde, dans le style de la présentation (fond blanc, palettes, accents dorés)."""

from pathlib import Path

from manim import (
    DOWN,
    LEFT,
    RIGHT,
    UP,
    UL,
    UR,
    Circle,
    Create,
    FadeIn,
    GrowFromCenter,
    ImageMobject,
    LaggedStart,
    Line,
    RoundedRectangle,
    VGroup,
    config,
)

from base import CampusSlide
from part1_contexte import flip_in
from theme import AMBER, FLAP_AMBER, FLAP_INK, GRAY, INK, LINE, TILE_2, body, display, flap_word, kicker, mono

ASSETS = Path(__file__).parent / "assets"
TEAM = [("YK", "Youssef AIT KARROUM"), ("OA", "Othmane ALIOUALI"), ("SE", "Saad-Eddine EL JARIDA")]
SUPERVISOR = ("HT", "Pr. Hamza TOUIL")


def member_chip(initials: str, name: str, accent: bool = False) -> VGroup:
    """Pastille d'un membre : initiales dans un disque sombre, puis le nom."""
    disc = Circle(radius=0.3, fill_color="#232326", fill_opacity=1, stroke_color=FLAP_AMBER if accent else LINE, stroke_width=3)
    letters = mono(initials, 17, color=FLAP_AMBER if accent else FLAP_INK, weight="BOLD").move_to(disc)
    label = body(name, 26, color=INK)
    content = VGroup(VGroup(disc, letters), label).arrange(RIGHT, buff=0.22)
    box = RoundedRectangle(
        corner_radius=0.38,
        width=content.width + 0.45,
        height=0.78,
        fill_color=TILE_2,
        fill_opacity=1,
        stroke_color=AMBER if accent else LINE,
        stroke_width=2 if accent else 1.5,
    )
    content.move_to(box)
    return VGroup(box, content)


class S00PageDeGarde(CampusSlide):
    index = 0

    def construct(self) -> None:
        width = config.frame_width

        # En-tête : les deux établissements, séparés du contenu par un filet
        ensa = ImageMobject(str(ASSETS / "ensa-logo.png")).scale_to_fit_height(0.95).to_corner(UL, buff=0.4)
        usms = ImageMobject(str(ASSETS / "usms-logo.png")).scale_to_fit_height(1.45).to_corner(UR, buff=0.22)
        header_rule = Line(LEFT * (width / 2 - 0.45), RIGHT * (width / 2 - 0.45), color=LINE, stroke_width=2).shift(UP * 2.35)
        self.play(FadeIn(ensa, shift=DOWN * 0.15), FadeIn(usms, shift=DOWN * 0.15), Create(header_rule), run_time=0.9)

        # Titre : les palettes du site, sur une ligne
        kick = kicker("Projet de fin de module · Blockchain").shift(UP * 1.85)
        title = VGroup(flap_word("CAMPUS", size=0.98), flap_word("FUND", size=0.98, color=FLAP_AMBER)).arrange(RIGHT, buff=0.32)
        title.next_to(kick, DOWN, buff=0.32)
        self.play(FadeIn(kick, shift=DOWN * 0.1), run_time=0.4)
        self.play(flip_in(VGroup(*title[0], *title[1]), lag=0.07))

        tagline = display("Les fonds débloqués sur vote.", 34, color=INK).next_to(title, DOWN, buff=0.38)
        underline = Line(tagline.get_corner(DOWN + LEFT), tagline.get_corner(DOWN + RIGHT), color=FLAP_AMBER, stroke_width=6).shift(DOWN * 0.12)
        self.play(FadeIn(tagline, shift=UP * 0.12), run_time=0.5)
        self.play(GrowFromCenter(underline), run_time=0.5)

        # Équipe et encadrant
        team_label = mono("RÉALISÉ PAR", 16, color=AMBER, weight="BOLD")
        chips = VGroup(*[member_chip(i, n, accent=(k == 0)) for k, (i, n) in enumerate(TEAM)]).arrange(RIGHT, buff=0.22)
        team = VGroup(team_label, chips).arrange(DOWN, aligned_edge=LEFT, buff=0.18)
        sup_label = mono("ENCADRÉ PAR", 16, color=AMBER, weight="BOLD")
        sup = VGroup(sup_label, member_chip(*SUPERVISOR)).arrange(DOWN, aligned_edge=LEFT, buff=0.18)
        people = VGroup(team, sup).arrange(RIGHT, buff=0.55, aligned_edge=DOWN)
        if people.width > width - 0.9:
            people.scale_to_fit_width(width - 0.9)
        people.next_to(underline, DOWN, buff=0.85)
        self.play(FadeIn(team_label), FadeIn(sup_label), run_time=0.3)
        self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.15) for c in [*chips, sup[1]]], lag_ratio=0.18), run_time=1.1)

        # Pied : filière et année
        foot_rule = Line(LEFT * (width / 2 - 0.45), RIGHT * (width / 2 - 0.45), color=FLAP_AMBER, stroke_width=4).to_edge(DOWN, buff=0.62)
        program = mono("FILIÈRE INTELLIGENCE ARTIFICIELLE ET CYBERSÉCURITÉ", 15, color=GRAY).next_to(foot_rule, DOWN, buff=0.14).align_to(foot_rule, LEFT)
        year = mono("ANNÉE UNIVERSITAIRE 2026/2027", 15, color=GRAY).next_to(foot_rule, DOWN, buff=0.14).align_to(foot_rule, RIGHT)
        self.play(Create(foot_rule), FadeIn(program), FadeIn(year), run_time=0.8)
        self.pause(
            "Bonjour. Nous sommes Youssef Ait Karroum, Othmane Aliouali et Saad-Eddine El Jarida, encadrés par le "
            "professeur Hamza Touil. Notre projet : CampusFund."
        )
