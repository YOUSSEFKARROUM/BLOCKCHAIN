"""Identité visuelle de la présentation CampusFund : couleurs, polices, règles de lisibilité et pièces réutilisables.

Règles de lisibilité au projecteur (canevas 720p) :
- aucun texte sous 22 px (`MIN_TEXT`), le gris réservé au texte secondaire ;
- les phrases en Archivo (casse normale) ; la police à chasse fixe Space Mono réservée aux données
  (chiffres, adresses, codes) et aux petites étiquettes ;
- l'or foncé `AMBER` sur les grands titres, l'or plus sombre `AMBER_TEXT` sur les petits textes.
"""

from pathlib import Path

import manimpango
from manim import (
    DOWN,
    LEFT,
    ORIGIN,
    PI,
    RIGHT,
    UP,
    Arc,
    Circle,
    Line,
    Polygon,
    Rectangle,
    RoundedRectangle,
    Square,
    Text,
    VGroup,
)

FONTS_DIR = Path(__file__).parent / "fonts"
for font_file in FONTS_DIR.glob("*.ttf"):
    manimpango.register_font(str(font_file))

# Palette claire : fond blanc, encre sombre. Les palettes d'affichage restent sombres.
NIGHT = "#FFFFFF"  # fond de page
INK = "#111114"  # texte principal
AMBER = "#B87A00"  # accent des grands titres, pièces et cadres
AMBER_TEXT = "#8A5C00"  # accent des petits textes (contraste ≥ 4,5:1 sur blanc)
AMBER_FILL = "#FFB800"  # ambre vif, uniquement en aplat avec du texte sombre
TICKET = INK  # texte principal (nom historique)
TILE = "#ECECEF"  # aplat de carte
TILE_2 = "#F6F6F8"  # fond de carte
LINE = "#D4D4DA"  # bordures et trame
GRAY = "#55555E"  # texte secondaire
OK = "#1E9E45"
ALERT = "#D9481B"
PAPER = "#FFFFFF"

FLAP_BG = "#232326"
FLAP_BG_2 = "#1C1C1F"
FLAP_INK = "#F2F0E8"
FLAP_AMBER = "#FFB800"
FLAP_OK = "#4CD964"

DISPLAY = "Archivo"  # Archivo Black : grands titres
BODY = "Archivo Narrow"  # texte courant
MONO = "Space Mono"  # données

MIN_TEXT = 22


def display(text: str, size: float = 64, color: str = INK, **kwargs) -> Text:
    """Grand titre condensé, en capitales."""
    return Text(text.upper(), font=DISPLAY, font_size=size, color=color, **kwargs)


def body(text: str, size: float = 30, color: str = INK, **kwargs) -> Text:
    return Text(text, font=BODY, font_size=max(size, MIN_TEXT), color=color, **kwargs)


def mono(text: str, size: float = 26, color: str = INK, **kwargs) -> Text:
    return Text(text, font=MONO, font_size=size, color=color, **kwargs)


def kicker(text: str) -> Text:
    """Petite étiquette au-dessus d'un titre."""
    return mono(text.upper(), size=20, color=AMBER_TEXT, weight="BOLD")


def heading(main: str, accent: str = "", size: float = 60) -> VGroup:
    """Titre en deux parties : le début en noir, la fin en or."""
    parts = [display(main, size)]
    if accent:
        parts.append(display(accent, size, color=AMBER))
    return VGroup(*parts).arrange(RIGHT, buff=0.25, aligned_edge=DOWN)


def page_heading(kick: str, main: str, accent: str = "") -> VGroup:
    """Étiquette + titre, en haut à gauche."""
    title = heading(main, accent, size=52)
    if title.width > 12.6:
        title.scale_to_fit_width(12.6)
    group = VGroup(kicker(kick), title).arrange(DOWN, aligned_edge=LEFT, buff=0.18)
    return group.to_corner(UP + LEFT, buff=0.6)


def flap(char: str, size: float = 1.0, color: str = FLAP_INK) -> VGroup:
    """Une palette d'affichage : tuile sombre, charnière centrale, un caractère."""
    tile = RoundedRectangle(corner_radius=0.08 * size, width=0.82 * size, height=1.05 * size, fill_color=FLAP_BG, fill_opacity=1, stroke_width=0)
    lower = Rectangle(width=0.82 * size, height=0.5 * size, fill_color=FLAP_BG_2, fill_opacity=1, stroke_width=0)
    lower.align_to(tile, DOWN)
    hinge = Line(tile.get_left(), tile.get_right(), color="#050506", stroke_width=3 * size)
    letter = mono(char, size=70 * size, color=color, weight="BOLD") if char.strip() else VGroup()
    if char.strip():
        letter.move_to(tile.get_center())
    return VGroup(tile, lower, hinge, letter)


def flap_word(word: str, size: float = 1.0, color: str = FLAP_INK, gap: float = 0.08) -> VGroup:
    return VGroup(*[flap(c, size, color) for c in word]).arrange(RIGHT, buff=gap * size)


def coin(radius: float = 0.16, color: str = AMBER_FILL) -> VGroup:
    """Une pièce stylisée (un peu d'ETH)."""
    outer = Circle(radius=radius, fill_color=color, fill_opacity=1, stroke_color="#B98500", stroke_width=2)
    inner = Circle(radius=radius * 0.6, stroke_color="#B98500", stroke_width=1.5)
    return VGroup(outer, inner)


def card(
    title: str,
    subtitle: str = "",
    width: float = 3.2,
    height: float = 1.6,
    color: str = INK,
    fill: str = TILE_2,
    title_size: float = 30,
    subtitle_size: float = 24,
) -> VGroup:
    """Carte claire avec un titre et une ligne de détail."""
    box = RoundedRectangle(corner_radius=0.14, width=width, height=height, fill_color=fill, fill_opacity=1, stroke_color=LINE, stroke_width=1.5)
    texts = VGroup(display(title, title_size, color=color))
    if subtitle:
        texts.add(body(subtitle, subtitle_size, color=GRAY))
    texts.arrange(DOWN, buff=0.14).move_to(box.get_center())
    if texts.width > width - 0.3:
        texts.scale_to_fit_width(width - 0.3)
    return VGroup(box, texts)


def pill(text: str, color: str = AMBER_FILL, text_color: str = INK, size: float = 24, data: bool = False) -> VGroup:
    """Pastille : une phrase courte en Archivo, ou une donnée en Space Mono (`data=True`)."""
    if data:
        label = mono(text, size=size, color=text_color, weight="BOLD")
    else:
        label = body(text, size, color=text_color, weight="BOLD")
    box = RoundedRectangle(corner_radius=0.14, width=label.width + 0.45, height=label.height + 0.3, fill_color=color, fill_opacity=1, stroke_width=0)
    label.move_to(box.get_center())
    return VGroup(box, label)


def lamp(color: str, radius: float = 0.09) -> VGroup:
    """Voyant lumineux (halo + point)."""
    halo = Circle(radius=radius * 2.2, fill_color=color, fill_opacity=0.18, stroke_width=0)
    dot = Circle(radius=radius, fill_color=color, fill_opacity=1, stroke_width=0)
    return VGroup(halo, dot)


def footer(index: int, total: int, section: str = "") -> VGroup:
    """Repère de section en bas à gauche, numéro de page en bas à droite."""
    right = VGroup(mono("CAMPUSFUND", size=18, color=GRAY), mono(f"{index:02d} / {total:02d}", size=18, color=INK, weight="BOLD"))
    right.arrange(RIGHT, buff=0.4).to_corner(DOWN + RIGHT, buff=0.35)
    if not section:
        return right
    left = mono(section.upper(), size=18, color=AMBER_TEXT, weight="BOLD").to_corner(DOWN + LEFT, buff=0.35)
    return VGroup(left, right)


# ------------------------------------------------------------------ Pictogrammes


def icon_clock(color: str = INK, scale: float = 1.0) -> VGroup:
    ring = Circle(radius=0.36, color=color, stroke_width=6)
    hands = VGroup(Line(ORIGIN, UP * 0.22, color=color, stroke_width=6), Line(ORIGIN, RIGHT * 0.17, color=color, stroke_width=6))
    return VGroup(ring, hands).scale(scale)


def icon_shield(color: str = INK, scale: float = 1.0) -> VGroup:
    outline = Polygon([-0.32, 0.3, 0], [0, 0.42, 0], [0.32, 0.3, 0], [0.28, -0.08, 0], [0, -0.42, 0], [-0.28, -0.08, 0], color=color, stroke_width=6)
    tick = VGroup(Line([-0.13, 0.0, 0], [-0.03, -0.11, 0], color=color, stroke_width=6), Line([-0.03, -0.11, 0], [0.15, 0.12, 0], color=color, stroke_width=6))
    return VGroup(outline, tick).scale(scale)


def icon_refund(color: str = INK, scale: float = 1.0) -> VGroup:
    arrow = Arc(radius=0.34, start_angle=0.3, angle=1.6 * PI, color=color, stroke_width=6)
    head = Polygon([0.33, 0.24, 0], [0.4, 0.0, 0], [0.16, 0.08, 0], color=color, fill_color=color, fill_opacity=1, stroke_width=0)
    center = coin(0.13)
    return VGroup(arrow, head, center).scale(scale)


def icon_document(color: str = INK, scale: float = 1.0) -> VGroup:
    sheet = RoundedRectangle(corner_radius=0.05, width=0.56, height=0.74, color=color, stroke_width=5)
    lines = VGroup(*[Line(LEFT * 0.16, RIGHT * 0.16, color=color, stroke_width=4) for _ in range(3)]).arrange(DOWN, buff=0.12)
    return VGroup(sheet, lines.move_to(sheet)).scale(scale)


def icon_people(color: str = INK, scale: float = 1.0) -> VGroup:
    def person() -> VGroup:
        head = Circle(radius=0.12, color=color, stroke_width=5)
        shoulders = Arc(radius=0.22, start_angle=0, angle=PI, color=color, stroke_width=5).next_to(head, DOWN, buff=0.04)
        return VGroup(head, shoulders)

    return VGroup(person(), person()).arrange(RIGHT, buff=0.08).scale(scale)


def icon_wallet(color: str = INK, scale: float = 1.0) -> VGroup:
    case = RoundedRectangle(corner_radius=0.08, width=0.8, height=0.56, color=color, stroke_width=5)
    flap_ = RoundedRectangle(corner_radius=0.06, width=0.28, height=0.2, color=color, stroke_width=5).align_to(case, RIGHT)
    return VGroup(case, flap_).scale(scale)


def qr_code(data: str, size: float = 2.2, color: str = INK) -> VGroup:
    """QR code dessiné en carrés (net à toute résolution)."""
    import qrcode

    matrix = qrcode.QRCode(border=0, error_correction=qrcode.constants.ERROR_CORRECT_M)
    matrix.add_data(data)
    matrix.make(fit=True)
    cells = matrix.get_matrix()
    n = len(cells)
    step = size / n
    squares = VGroup()
    for row, values in enumerate(cells):
        for col, filled in enumerate(values):
            if filled:
                squares.add(Square(step * 1.02, fill_color=color, fill_opacity=1, stroke_width=0).move_to([col * step, -row * step, 0]))
    squares.move_to(ORIGIN)
    frame = RoundedRectangle(corner_radius=0.12, width=size + 0.4, height=size + 0.4, fill_color=PAPER, fill_opacity=1, stroke_color=LINE, stroke_width=2)
    return VGroup(frame, squares)


__all__ = [
    "ALERT",
    "AMBER",
    "AMBER_FILL",
    "AMBER_TEXT",
    "BODY",
    "DISPLAY",
    "FLAP_AMBER",
    "FLAP_INK",
    "FLAP_OK",
    "GRAY",
    "INK",
    "LINE",
    "MIN_TEXT",
    "MONO",
    "NIGHT",
    "OK",
    "ORIGIN",
    "PAPER",
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
    "icon_clock",
    "icon_document",
    "icon_people",
    "icon_refund",
    "icon_shield",
    "icon_wallet",
    "kicker",
    "lamp",
    "mono",
    "page_heading",
    "pill",
    "qr_code",
]
