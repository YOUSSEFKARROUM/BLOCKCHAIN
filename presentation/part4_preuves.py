"""Diapositives 11 à 15 : preuves, IA, démo, limites, conclusion."""

from manim import (
    DOWN,
    LEFT,
    PI,
    RIGHT,
    UP,
    AnnularSector,
    Circle,
    Create,
    FadeIn,
    LaggedStart,
    Line,
    Rectangle,
    RoundedRectangle,
    ValueTracker,
    VGroup,
    always_redraw,
    np,
)

from base import DEMO, FIN, PREUVES, CampusSlide
from part1_contexte import flip_in
from part2_cycle import bottom_note
from theme import (
    ALERT,
    AMBER,
    AMBER_TEXT,
    FLAP_AMBER,
    FLAP_INK,
    FLAP_OK,
    GRAY,
    INK,
    LINE,
    OK,
    TILE,
    TILE_2,
    body,
    display,
    flap_word,
    icon_clock,
    icon_document,
    icon_people,
    icon_wallet,
    kicker,
    mono,
    page_heading,
    pill,
    qr_code,
)

WHITE = "#FFFFFF"
SITE_URL = "https://campusfund.vercel.app"


def stat_tile(value: str, caption: str, color: str = FLAP_INK, width: float = 3.0, height: float = 1.95, digit_size: float = 0.55) -> VGroup:
    """Tuile de chiffre-clé : le nombre en palettes, sa légende dessous."""
    box = RoundedRectangle(corner_radius=0.14, width=width, height=height, fill_color=TILE_2, fill_opacity=1, stroke_color=LINE, stroke_width=1.5)
    digits = flap_word(value, size=digit_size, color=color, gap=0.06)
    if digits.width > width - 0.4:
        digits.scale_to_fit_width(width - 0.4)
    label = body(caption, 24, color=GRAY)
    if label.width > width - 0.3:
        label.scale_to_fit_width(width - 0.3)
    VGroup(digits, label).arrange(DOWN, buff=0.22).move_to(box)
    return VGroup(box, digits, label)


class S11Tests(CampusSlide):
    index = 12
    section = PREUVES

    def construct(self) -> None:
        title = page_heading("Preuves", "Testé,", "attaqué, audité.")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        # Le chiffre principal, mis en avant à gauche ; les autres, plus petits, à droite
        hero = stat_tile("159", "tests automatiques, tous verts", FLAP_AMBER, width=4.6, height=4.3, digit_size=1.15)
        others = VGroup(
            stat_tile("100%", "des lignes exécutées"),
            stat_tile("97%", "des branches testées"),
            stat_tile("8000", "valeurs au hasard (fuzz)"),
            stat_tile("6", "parcours testés dans le site", FLAP_OK),
        ).arrange_in_grid(2, 2, buff=(0.3, 0.35))
        board = VGroup(hero, others).arrange(RIGHT, buff=0.45).next_to(title, DOWN, buff=0.45)
        if board.width > 12.8:
            board.scale_to_fit_width(12.8)
        board.set_x(0)
        self.play(FadeIn(hero[0]), *[FadeIn(t[0]) for t in others], run_time=0.6)
        self.play(flip_in(VGroup(*hero[1]), lag=0.12))
        self.play(FadeIn(hero[2], shift=UP * 0.1))
        self.play(flip_in(VGroup(*[tile for t in others for tile in t[1]]), lag=0.04), LaggedStart(*[FadeIn(t[2]) for t in others], lag_ratio=0.1))
        self.play(FadeIn(bottom_note("Slither : aucune faille grave ou moyenne. 5 invariants vérifiés sur 256 scénarios.")))
        self.pause("159 tests automatiques, tous verts. 100 % des lignes, 97 % des branches, des milliers de valeurs au hasard, et six parcours testés dans le vrai site. L'analyseur Slither ne trouve aucune faille grave.")


def gauge(radius: float = 2.2) -> VGroup:
    """Demi-cadran 0-100 : Faible (0-35), Moyen (35-50), Élevé (50-100)."""
    zones = [(0, 35, OK), (35, 50, AMBER), (50, 100, ALERT)]
    arcs = VGroup()
    for start, end, color in zones:
        arcs.add(
            AnnularSector(
                inner_radius=radius * 0.78,
                outer_radius=radius,
                angle=-(end - start) / 100 * PI,
                start_angle=PI - start / 100 * PI,
                fill_color=color,
                fill_opacity=1,
                stroke_width=0,
            )
        )
    ticks = VGroup()
    for value in (0, 35, 50, 100):
        angle = PI - value / 100 * PI
        position = np.array([np.cos(angle), np.sin(angle), 0]) * (radius + 0.32)
        ticks.add(mono(str(value), 20, color=GRAY, weight="BOLD").move_to(position))
    return VGroup(arcs, ticks)


class S12IA(CampusSlide):
    index = 13
    section = PREUVES

    def construct(self) -> None:
        title = page_heading("Intelligence artificielle", "L'IA signale,", "la DAO décide.")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        dial = gauge().shift(LEFT * 3.4 + DOWN * 1.15)
        center = np.array([dial.get_center()[0], dial[0].get_bottom()[1], 0])
        score = ValueTracker(0)

        def needle() -> VGroup:
            angle = PI - score.get_value() / 100 * PI
            tip = center + np.array([np.cos(angle), np.sin(angle), 0]) * 1.65
            return VGroup(Line(center, tip, color=INK, stroke_width=8), Circle(radius=0.13, fill_color=INK, fill_opacity=1, stroke_width=0).move_to(center))

        self.play(Create(dial[0]), FadeIn(dial[1]))
        self.add(always_redraw(needle))
        campaign = body("Campagne « Bourse de matériel » (démo)", 24, color=GRAY, weight="BOLD").next_to(dial, UP, buff=0.3)
        self.play(FadeIn(campaign))
        self.play(score.animate.set_value(92), run_time=2.2)
        result = display("92", 72, color=ALERT).next_to(center, DOWN, buff=0.25)
        level = body("risque élevé", 28, color=ALERT, weight="BOLD").next_to(result, RIGHT, buff=0.3)
        self.play(FadeIn(result, scale=1.4), FadeIn(level))

        reasons = VGroup(
            body("8 comptes neufs, tous financés par la même source", 26),
            body("Montants identiques : 0,5 ETH chacun", 26),
            body("Une rafale en quelques blocs", 26),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.24)
        bullets = VGroup(*[Circle(radius=0.07, fill_color=ALERT, fill_opacity=1, stroke_width=0).next_to(r, LEFT, buff=0.2) for r in reasons])
        reason_block = VGroup(bullets, reasons)
        formula = body("Score = 60 % de règles + 40 % d'Isolation Forest", 24, color=AMBER_TEXT, weight="BOLD")
        right = VGroup(formula, reason_block).arrange(DOWN, aligned_edge=LEFT, buff=0.3).move_to(RIGHT * 3.25 + UP * 0.55)
        self.play(FadeIn(formula), LaggedStart(*[FadeIn(VGroup(b, r), shift=LEFT * 0.2) for b, r in zip(bullets, reasons)], lag_ratio=0.3))
        self.pause("Un script analyse les contributions et donne une note de risque. Ici, huit comptes neufs, tous financés par la même source, versent exactement le même montant : 92 sur 100.")

        honest_title = kicker("Évaluation honnête, données simulées")
        rows = VGroup()
        for label, value, color in [("Fraudes simples", 0.88, OK), ("Fraudes déguisées", 0.38, ALERT)]:
            name = body(label, 25, weight="BOLD")
            track = Rectangle(width=2.5, height=0.32, fill_color=TILE, fill_opacity=1, stroke_width=0)
            fill = Rectangle(width=2.5 * value, height=0.32, fill_color=color, fill_opacity=1, stroke_width=0).align_to(track, LEFT)
            figure = mono(f"{round(value * 100)} %", 24, color=color, weight="BOLD")
            rows.add(VGroup(name, VGroup(track, fill), figure).arrange(RIGHT, buff=0.25))
        rows.arrange(DOWN, aligned_edge=LEFT, buff=0.22)
        bar_x = max(row[0].get_right()[0] for row in rows) + 0.3
        for row in rows:
            row[1].shift(RIGHT * (bar_x - row[1].get_left()[0]))
            row[2].next_to(row[1], RIGHT, buff=0.25)
        honest = VGroup(honest_title, rows).arrange(DOWN, aligned_edge=LEFT, buff=0.2).next_to(right, DOWN, buff=0.5).align_to(right, LEFT)
        overflow = honest.get_right()[0] - 6.75
        if overflow > 0:
            honest.shift(LEFT * overflow)
        self.play(FadeIn(honest_title), *[FadeIn(r[0]) for r in rows], *[FadeIn(r[1][0]) for r in rows])
        self.play(*[FadeIn(r[1][1], shift=RIGHT * 0.3) for r in rows], *[FadeIn(r[2]) for r in rows], run_time=1.0)
        self.pause("Nous le disons franchement : il repère 88 % des fraudes simples, mais seulement 38 % des fraudes bien déguisées. C'est un signal, pas une preuve : il ne bloque rien, la communauté vote.")


class S13Demo(CampusSlide):
    index = 14
    section = DEMO

    def construct(self) -> None:
        tiles = flap_word("DEMO", size=1.3, color=FLAP_AMBER)
        url = mono("campusfund.vercel.app", 34, color=INK, weight="BOLD")
        network = body("Réseau Sepolia · contrats vérifiés sur Etherscan", 26, color=GRAY)
        pills = [pill(text, color=TILE, text_color=AMBER_TEXT, size=25) for text in ("1 · Contribuer", "2 · Voter", "3 · Débloquer", "4 · Rejouer l'attaque")]
        plan = VGroup(VGroup(*pills[:2]).arrange(RIGHT, buff=0.25), VGroup(*pills[2:]).arrange(RIGHT, buff=0.25)).arrange(DOWN, aligned_edge=LEFT, buff=0.22)
        left = VGroup(tiles, url, network, plan).arrange(DOWN, aligned_edge=LEFT, buff=0.38)
        qr = qr_code(SITE_URL, size=3.0)
        qr_caption = body("Scannez pour ouvrir le site", 24, color=GRAY, weight="BOLD").next_to(qr, DOWN, buff=0.2)
        right = VGroup(qr, qr_caption)
        layout = VGroup(left, right).arrange(RIGHT, buff=1.0).move_to(UP * 0.15)

        self.play(flip_in(tiles))
        self.play(FadeIn(url, shift=UP * 0.2), FadeIn(network))
        self.play(FadeIn(qr[0]), LaggedStart(*[FadeIn(square) for square in qr[1]], lag_ratio=0.002, run_time=1.0), FadeIn(qr_caption))
        self.play(LaggedStart(*[FadeIn(p, shift=UP * 0.15) for p in pills], lag_ratio=0.2))
        self.pause("Passons à la démonstration : le site en ligne sur Sepolia, que vous pouvez ouvrir avec ce QR code. Contribuer, voter, débloquer une tranche, puis le test qui rejoue l'attaque du prêt flash.")


class S14Limites(CampusSlide):
    index = 15
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
    index = 16
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
