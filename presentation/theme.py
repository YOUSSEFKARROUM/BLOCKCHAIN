"""Identité visuelle de la présentation CampusFund : couleurs, polices et petites pièces réutilisables."""

from pathlib import Path

import manimpango
from manim import (
    DOWN,
    LEFT,
    ORIGIN,
    RIGHT,
    UP,
    Circle,
    Line,
    Rectangle,
    RoundedRectangle,
    Text,
    VGroup,
)

FONTS_DIR = Path(__file__).parent / "fonts"
for font_file in FONTS_DIR.glob("*.ttf"):
    manimpango.register_font(str(font_file))

# Palette du site
NIGHT = "#09090A"
AMBER = "#FFB800"
TICKET = "#F2F0E8"
TILE = "#232326"
TILE_2 = "#1C1C1F"
LINE = "#3A3A40"
GRAY = "#A9A9B2"
OK = "#4CD964"
ALERT = "#FF6A3D"

DISPLAY = "Archivo"  # Archivo Black : grands titres
BODY = "Archivo Narrow"  # texte courant
MONO = "Space Mono"  # chiffres, adresses, code


def display(text: str, size: float = 64, color: str = TICKET, **kwargs) -> Text:
    """Grand titre condensé, en capitales."""
    return Text(text.upper(), font=DISPLAY, font_size=size, color=color, **kwargs)


def body(text: str, size: float = 30, color: str = TICKET, **kwargs) -> Text:
    return Text(text, font=BODY, font_size=size, color=color, **kwargs)


def mono(text: str, size: float = 26, color: str = TICKET, **kwargs) -> Text:
    return Text(text, font=MONO, font_size=size, color=color, **kwargs)


def kicker(text: str) -> Text:
    """Petite étiquette ambre au-dessus d'un titre."""
    return mono(text.upper(), size=18, color=AMBER)


def heading(main: str, accent: str = "", size: float = 60) -> VGroup:
    """Titre en deux parties : le début en clair, la fin en ambre."""
    parts = [display(main, size)]
    if accent:
        parts.append(display(accent, size, color=AMBER))
    group = VGroup(*parts).arrange(RIGHT, buff=0.25, aligned_edge=DOWN)
    return group


def page_heading(kick: str, main: str, accent: str = "") -> VGroup:
    """Étiquette + titre, placés en haut à gauche de la diapositive."""
    title = heading(main, accent, size=52)
    if title.width > 12.6:
        title.scale_to_fit_width(12.6)
    group = VGroup(kicker(kick), title).arrange(DOWN, aligned_edge=LEFT, buff=0.18)
    return group.to_corner(UP + LEFT, buff=0.6)


def flap(char: str, size: float = 1.0, color: str = TICKET) -> VGroup:
    """Une palette d'affichage : tuile sombre, charnière centrale, un caractère."""
    tile = RoundedRectangle(
        corner_radius=0.08 * size, width=0.82 * size, height=1.05 * size, fill_color=TILE, fill_opacity=1, stroke_width=0
    )
    lower = Rectangle(width=0.82 * size, height=0.5 * size, fill_color=TILE_2, fill_opacity=1, stroke_width=0)
    lower.align_to(tile, DOWN)
    hinge = Line(tile.get_left(), tile.get_right(), color=NIGHT, stroke_width=3 * size)
    letter = mono(char, size=70 * size, color=color, weight="BOLD") if char.strip() else VGroup()
    if char.strip():
        letter.move_to(tile.get_center())
    return VGroup(tile, lower, hinge, letter)


def flap_word(word: str, size: float = 1.0, color: str = TICKET, gap: float = 0.08) -> VGroup:
    tiles = VGroup(*[flap(c, size, color) for c in word]).arrange(RIGHT, buff=gap * size)
    return tiles


def coin(radius: float = 0.16, color: str = AMBER) -> VGroup:
    """Une pièce stylisée (un peu d'ETH)."""
    outer = Circle(radius=radius, fill_color=color, fill_opacity=1, stroke_color="#B98500", stroke_width=2)
    inner = Circle(radius=radius * 0.6, stroke_color="#B98500", stroke_width=1.5)
    return VGroup(outer, inner)


def card(
    title: str,
    subtitle: str = "",
    width: float = 3.2,
    height: float = 1.6,
    color: str = TICKET,
    fill: str = TILE_2,
    title_size: float = 30,
) -> VGroup:
    """Carte sombre avec un titre et une ligne de détail."""
    box = RoundedRectangle(
        corner_radius=0.14, width=width, height=height, fill_color=fill, fill_opacity=1, stroke_color=LINE, stroke_width=1.5
    )
    texts = VGroup(display(title, title_size, color=color))
    if subtitle:
        texts.add(body(subtitle, 22, color=GRAY))
    texts.arrange(DOWN, buff=0.14).move_to(box.get_center())
    if texts.width > width - 0.3:
        texts.scale_to_fit_width(width - 0.3)
    return VGroup(box, texts)


def pill(text: str, color: str = AMBER, text_color: str = NIGHT, size: float = 20) -> VGroup:
    label = mono(text, size=size, color=text_color, weight="BOLD")
    box = RoundedRectangle(
        corner_radius=0.12, width=label.width + 0.4, height=label.height + 0.26, fill_color=color, fill_opacity=1, stroke_width=0
    )
    label.move_to(box.get_center())
    return VGroup(box, label)


def lamp(color: str, radius: float = 0.09) -> VGroup:
    """Voyant lumineux (halo + point)."""
    halo = Circle(radius=radius * 2.2, fill_color=color, fill_opacity=0.18, stroke_width=0)
    dot = Circle(radius=radius, fill_color=color, fill_opacity=1, stroke_width=0)
    return VGroup(halo, dot)


def footer(index: int, total: int) -> VGroup:
    """Numéro de diapositive discret en bas à droite."""
    label = mono(f"{index:02d} / {total:02d}", size=16, color=GRAY)
    brand = mono("CAMPUSFUND", size=16, color=GRAY)
    group = VGroup(brand, label).arrange(RIGHT, buff=0.4)
    return group.to_corner(DOWN + RIGHT, buff=0.35)


__all__ = [
    "AMBER",
    "ALERT",
    "BODY",
    "DISPLAY",
    "GRAY",
    "LINE",
    "MONO",
    "NIGHT",
    "OK",
    "ORIGIN",
    "TICKET",
    "TILE",
    "TILE_2",
    "body",
    "card",
    "coin",
    "display",
    "flap",
    "flap_word",
    "footer",
    "heading",
    "kicker",
    "lamp",
    "mono",
    "page_heading",
    "pill",
]
