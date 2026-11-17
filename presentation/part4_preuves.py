"""Diapositives : démo, limites, conclusion."""

from manim import (
    DOWN,
    LEFT,
    RIGHT,
    UP,
    Circle,
    FadeIn,
    LaggedStart,
    RoundedRectangle,
    VGroup,
)

from base import DEMO, FIN, CampusSlide
from part1_contexte import flip_in
from theme import (
    ALERT,
    AMBER_TEXT,
    FLAP_AMBER,
    GRAY,
    INK,
    LINE,
    OK,
    TILE,
    TILE_2,
    body,
    flap_word,
    icon_clock,
    icon_document,
    icon_people,
    icon_wallet,
    mono,
    page_heading,
    pill,
    qr_code,
)

WHITE = "#FFFFFF"
SITE_URL = "https://campusfund.vercel.app"


class S13Demo(CampusSlide):
    index = 9
    section = DEMO

    def construct(self) -> None:
        tiles = flap_word("DEMO", size=1.3, color=FLAP_AMBER)
        url = mono("campusfund.vercel.app", 34, color=INK, weight="BOLD")
        network = body("Réseau Sepolia · contrats vérifiés sur Etherscan", 26, color=GRAY)
        pills = [pill(text, color=TILE, text_color=AMBER_TEXT, size=25) for text in ("1 · Contribuer", "2 · Voter", "3 · Débloquer", "4 · Retirer")]
        plan = VGroup(VGroup(*pills[:2]).arrange(RIGHT, buff=0.25), VGroup(*pills[2:]).arrange(RIGHT, buff=0.25)).arrange(DOWN, aligned_edge=LEFT, buff=0.22)
        left = VGroup(tiles, url, network, plan).arrange(DOWN, aligned_edge=LEFT, buff=0.38)
        qr = qr_code(SITE_URL, size=3.0)
        qr_caption = body("Scannez pour ouvrir le site", 24, color=GRAY, weight="BOLD").next_to(qr, DOWN, buff=0.2)
        right = VGroup(qr, qr_caption)
        VGroup(left, right).arrange(RIGHT, buff=1.0).move_to(UP * 0.15)

        self.play(flip_in(tiles))
        self.play(FadeIn(url, shift=UP * 0.2), FadeIn(network))
        self.play(FadeIn(qr[0]), LaggedStart(*[FadeIn(square) for square in qr[1]], lag_ratio=0.002, run_time=1.0), FadeIn(qr_caption))
        self.play(LaggedStart(*[FadeIn(p, shift=UP * 0.15) for p in pills], lag_ratio=0.2))
        self.pause("Passons à la démonstration : le site en ligne sur Sepolia, que vous pouvez ouvrir avec ce QR code. On va contribuer, voter, débloquer une tranche, puis la retirer : le cycle que nous venons de voir, en vrai.")


class S14Limites(CampusSlide):
    index = 13
    section = FIN

    def construct(self) -> None:
        title = page_heading("Avec honnêteté", "Limites", "et suites.")
        self.play(FadeIn(title, shift=DOWN * 0.2))
        items = [
            (icon_document, "Une preuve peut être fausse", "Un vérificateur externe"),
            (icon_people, "Un porteur peut avoir 2 comptes", "Une identité étudiante vérifiée"),
            (icon_wallet, "Il faut un portefeuille et de l'ETH", "Payer en dirhams ou en stablecoin"),
            (icon_clock, "Le vote s'applique tout de suite", "Un délai de sécurité (timelock)"),
        ]
        cards = VGroup()
        for icon, limit, fix in items:
            box = RoundedRectangle(corner_radius=0.16, width=6.1, height=1.95, fill_color=TILE_2, fill_opacity=1, stroke_color=LINE, stroke_width=1.5)
            badge = Circle(radius=0.48, fill_color=WHITE, fill_opacity=1, stroke_color=ALERT, stroke_width=3)
            pictogram = icon(color=ALERT, scale=0.85).move_to(badge)
            texts = VGroup(body(limit, 27, weight="BOLD"), body("→ " + fix, 25, color=OK, weight="BOLD")).arrange(DOWN, aligned_edge=LEFT, buff=0.14)
            content = VGroup(VGroup(badge, pictogram), texts).arrange(RIGHT, buff=0.3)
            if content.width > 5.7:
                content.scale_to_fit_width(5.7)
            content.move_to(box)
            cards.add(VGroup(box, content))
        cards.arrange_in_grid(2, 2, buff=(0.3, 0.35)).next_to(title, DOWN, buff=0.5)
        cards.set_x(0)
        self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.15) for c in cards], lag_ratio=0.25), run_time=1.6)
        self.pause("Nos limites, dites franchement : une preuve peut être fausse, un porteur peut avoir deux comptes, il faut un portefeuille, et le vote s'applique sans délai. Et la piste pour chacune.")


class S15Conclusion(CampusSlide):
    index = 14
    section = FIN

    def construct(self) -> None:
        sentences = [
            "L'argent est bloqué dans un programme public.",
            "Il n'est versé qu'avec une preuve et un vote.",
            "Sinon, ce qui n'est pas versé est rendu.",
        ]
        rows = VGroup()
        for i, sentence in enumerate(sentences, start=1):
            number = flap_word(f"0{i}", size=0.62, color=FLAP_AMBER, gap=0.06)
            text = body(sentence, 36, color=AMBER_TEXT if i == 3 else INK, weight="BOLD")
            rows.add(VGroup(number, text).arrange(RIGHT, buff=0.35))
        rows.arrange(DOWN, aligned_edge=LEFT, buff=0.32).move_to(UP * 1.55)
        for row in rows:
            self.play(flip_in(VGroup(*row[0]), lag=0.1), FadeIn(row[1], shift=RIGHT * 0.2), run_time=0.7)
        self.pause("En trois phrases : l'argent est bloqué dans un programme public ; il n'est versé qu'avec une preuve et un vote ; sinon, il est rendu.")

        thanks = flap_word("MERCI", size=1.2).shift(DOWN * 1.45)
        self.play(flip_in(thanks))
        questions = body("Vos questions", 30, color=AMBER_TEXT, weight="BOLD").next_to(thanks, DOWN, buff=0.3)
        self.play(FadeIn(questions))
        self.pause("Merci. Nous sommes prêts pour vos questions.")
