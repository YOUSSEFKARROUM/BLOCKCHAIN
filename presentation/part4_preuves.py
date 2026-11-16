"""Diapositives 11 à 15 : tests, IA, démo, limites, conclusion."""

from manim import (
    DOWN,
    LEFT,
    PI,
    RIGHT,
    UP,
    AnnularSector,
    Create,
    FadeIn,
    FadeOut,
    LaggedStart,
    Line,
    Polygon,
    Rectangle,
    Rotate,
    RoundedRectangle,
    ValueTracker,
    VGroup,
    always_redraw,
    np,
)

from base import CampusSlide
from part1_contexte import flip_in
from theme import (
    ALERT,
    AMBER,
    FLAP_AMBER,
    FLAP_INK,
    FLAP_OK,
    GRAY,
    LINE,
    OK,
    TICKET,
    TILE,
    TILE_2,
    body,
    display,
    flap_word,
    kicker,
    mono,
    page_heading,
    pill,
)


def stat_tile(value: str, caption: str, color: str = TICKET) -> VGroup:
    """Tuile de chiffre-clé : le nombre en palettes, sa légende dessous."""
    box = RoundedRectangle(corner_radius=0.14, width=3.3, height=2.1, fill_color=TILE_2, fill_opacity=1, stroke_color=LINE, stroke_width=1.5)
    digits = flap_word(value, size=0.62, color=color, gap=0.06).move_to(box.get_center() + UP * 0.3)
    if digits.width > 3.0:
        digits.scale_to_fit_width(3.0)
    label = body(caption, 21, color=GRAY).move_to(box.get_center() + DOWN * 0.62)
    if label.width > 3.0:
        label.scale_to_fit_width(3.0)
    return VGroup(box, digits, label)


class S11Tests(CampusSlide):
    index = 10

    def construct(self) -> None:
        title = page_heading("Preuves", "Testé,", "attaqué, audité.")
        self.play(FadeIn(title, shift=DOWN * 0.2))
        stats = [
            ("159", "tests automatiques", FLAP_AMBER),
            ("100%", "des lignes exécutées", FLAP_INK),
            ("97%", "des branches testées", FLAP_INK),
            ("8000", "valeurs aléatoires (fuzz)", FLAP_INK),
            ("5", "invariants × 256 scénarios", FLAP_INK),
            ("6", "parcours testés dans le site", FLAP_OK),
        ]
        tiles = VGroup(*[stat_tile(value, caption, color) for value, caption, color in stats])
        tiles.arrange_in_grid(2, 3, buff=(0.35, 0.35)).shift(DOWN * 0.55)
        self.play(LaggedStart(*[FadeIn(t[0]) for t in tiles], lag_ratio=0.08), run_time=0.8)
        self.play(flip_in(VGroup(*[tile for t in tiles for tile in t[1]]), lag=0.04))
        self.play(LaggedStart(*[FadeIn(t[2], shift=UP * 0.1) for t in tiles], lag_ratio=0.08))
        slither = pill("SLITHER : 0 FAILLE GRAVE OU MOYENNE", color=OK, size=16).to_corner(DOWN + LEFT, buff=0.45)
        self.play(FadeIn(slither, shift=UP * 0.2))
        self.pause("159 tests automatiques, 100 % des lignes, 97 % des branches. Des milliers de valeurs aléatoires, cinq propriétés qui doivent toujours rester vraies, et six parcours testés dans le vrai site. L'analyseur Slither ne trouve aucune faille grave.")


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
        position = np.array([np.cos(angle), np.sin(angle), 0]) * (radius + 0.3)
        ticks.add(mono(str(value), 16, color=GRAY).move_to(position))
    return VGroup(arcs, ticks)


class S12IA(CampusSlide):
    index = 11

    def construct(self) -> None:
        title = page_heading("Intelligence artificielle", "L'IA signale,", "la DAO décide.")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        dial = gauge().shift(LEFT * 3.3 + DOWN * 1.2)
        center = np.array([dial.get_center()[0], dial[0].get_bottom()[1], 0])
        score = ValueTracker(0)

        def needle() -> VGroup:
            angle = PI - score.get_value() / 100 * PI
            tip = center + np.array([np.cos(angle), np.sin(angle), 0]) * 1.65
            line = Line(center, tip, color=TICKET, stroke_width=7)
            hub = RoundedRectangle(corner_radius=0.12, width=0.24, height=0.24, fill_color=TICKET, fill_opacity=1, stroke_width=0).move_to(center)
            return VGroup(line, hub)

        self.play(Create(dial[0]), FadeIn(dial[1]))
        live_needle = always_redraw(needle)
        self.add(live_needle)
        campaign = mono("« BOURSE DE MATÉRIEL » (DÉMO)", 16, color=GRAY).next_to(dial, UP, buff=0.3)
        self.play(FadeIn(campaign))
        self.play(score.animate.set_value(92), run_time=2.2)
        result = display("92", 64, color=ALERT).next_to(center, DOWN, buff=0.25)
        level = mono("RISQUE ÉLEVÉ", 18, color=ALERT, weight="BOLD").next_to(result, RIGHT, buff=0.3)
        self.play(FadeIn(result, scale=1.4), FadeIn(level))

        reasons = VGroup(
            pill("8 COMPTES NEUFS, UNE SEULE SOURCE", color=TILE, text_color=ALERT, size=15),
            pill("MONTANTS IDENTIQUES : 0,5 ETH", color=TILE, text_color=ALERT, size=15),
            pill("RAFALE EN QUELQUES BLOCS", color=TILE, text_color=ALERT, size=15),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.22).shift(RIGHT * 3.1 + UP * 0.3)
        formula = mono("SCORE = 60 % RÈGLES + 40 % ISOLATION FOREST", 15, color=AMBER).next_to(reasons, UP, buff=0.4).align_to(reasons, LEFT)
        self.play(FadeIn(formula), LaggedStart(*[FadeIn(r, shift=LEFT * 0.2) for r in reasons], lag_ratio=0.3))
        self.pause("Un script analyse les contributions et donne une note de risque. Ici, huit comptes neufs, tous financés par la même source, versent exactement le même montant : 92 sur 100.")

        honest = VGroup(kicker("Évaluation honnête (données simulées)"))
        bars = VGroup()
        for label, value, color in [("Fraudes simples", 0.88, OK), ("Fraudes déguisées", 0.38, ALERT)]:
            name = body(label, 22)
            track = Rectangle(width=2.6, height=0.28, fill_color=TILE, fill_opacity=1, stroke_width=0)
            fill = Rectangle(width=2.6 * value, height=0.28, fill_color=color, fill_opacity=1, stroke_width=0).align_to(track, LEFT)
            figure = mono(f"{round(value * 100)} %", 18, color=color, weight="BOLD")
            row = VGroup(name, VGroup(track, fill), figure).arrange(RIGHT, buff=0.25)
            bars.add(row)
        bars.arrange(DOWN, aligned_edge=LEFT, buff=0.25)
        honest.add(bars).arrange(DOWN, aligned_edge=LEFT, buff=0.2).next_to(reasons, DOWN, buff=0.55).align_to(reasons, LEFT)
        overflow = honest.get_right()[0] - 6.7
        if overflow > 0:
            honest.shift(LEFT * overflow)
        self.play(FadeIn(honest[0]), *[FadeIn(r[0]) for r in bars], *[FadeIn(r[1][0]) for r in bars])
        self.play(*[FadeIn(r[1][1], shift=RIGHT * 0.3) for r in bars], *[FadeIn(r[2]) for r in bars], run_time=1.0)
        self.pause("Nous le disons franchement : il repère 88 % des fraudes simples, mais seulement 38 % des fraudes bien déguisées. C'est un signal, pas une preuve : il ne bloque rien, la communauté vote.")


class S13Demo(CampusSlide):
    index = 12

    def construct(self) -> None:
        tiles = flap_word("DEMO", size=1.4, color=FLAP_AMBER).shift(UP * 1.2)
        self.play(flip_in(tiles))
        url = mono("campusfund.vercel.app", 34, color=TICKET, weight="BOLD").next_to(tiles, DOWN, buff=0.6)
        network = mono("RÉSEAU SEPOLIA · CONTRATS VÉRIFIÉS SUR ETHERSCAN", 18, color=GRAY).next_to(url, DOWN, buff=0.25)
        plan = VGroup(
            pill("1 · CONTRIBUER", color=TILE, text_color=AMBER, size=18),
            pill("2 · VOTER", color=TILE, text_color=AMBER, size=18),
            pill("3 · DÉBLOQUER", color=TILE, text_color=AMBER, size=18),
            pill("4 · LE TEST DE L'ATTAQUE", color=TILE, text_color=AMBER, size=18),
        ).arrange(RIGHT, buff=0.3).next_to(network, DOWN, buff=0.6)
        self.play(FadeIn(url, shift=UP * 0.2), FadeIn(network))
        self.play(LaggedStart(*[FadeIn(p, shift=UP * 0.15) for p in plan], lag_ratio=0.2))
        self.pause("Passons à la démonstration : le site en ligne sur Sepolia. Contribuer, voter, débloquer une tranche, puis le test qui rejoue l'attaque du prêt flash.")


class S14Limites(CampusSlide):
    index = 13

    def construct(self) -> None:
        title = page_heading("Avec honnêteté", "Limites", "et suites.")
        self.play(FadeIn(title, shift=DOWN * 0.2))
        pairs = [
            ("Une preuve peut être fausse", "les votants la jugent ; ajouter un vérificateur externe"),
            ("Un porteur peut avoir 2 comptes", "identité étudiante vérifiée"),
            ("Il faut un portefeuille et de l'ETH", "paiement en dirhams ou en stablecoin"),
            ("Vote exécuté tout de suite", "un délai de sécurité (timelock)"),
        ]
        lefts = VGroup(*[body(limit, 26, color=TICKET) for limit, _ in pairs]).arrange(DOWN, aligned_edge=LEFT, buff=0.42)
        lefts.to_edge(LEFT, buff=0.9).shift(DOWN * 0.5)
        column_x = lefts.get_right()[0] + 0.45
        rows = VGroup()
        for left, (_, next_step) in zip(lefts, pairs):
            arrow = mono("→", 26, color=AMBER).move_to([column_x, left.get_center()[1], 0])
            right = body(next_step, 24, color=OK).next_to(arrow, RIGHT, buff=0.3)
            rows.add(VGroup(left, arrow, right))
        if rows.width > 12.6:
            rows.scale_to_fit_width(12.6)
        for row in rows:
            self.play(FadeIn(row[0], shift=RIGHT * 0.2), run_time=0.45)
            self.play(FadeIn(row[1]), FadeIn(row[2], shift=RIGHT * 0.2), run_time=0.45)
        self.pause("Nos limites, dites franchement : une preuve peut être fausse, un porteur peut avoir deux comptes, il faut un portefeuille. Et les pistes pour chacune.")


class S15Conclusion(CampusSlide):
    index = 14

    def construct(self) -> None:
        lines = VGroup(
            body("L'argent est bloqué dans un programme public.", 32),
            body("Il n'est versé qu'avec une preuve et un vote.", 32),
            body("Sinon, ce qui n'est pas versé est rendu.", 32, color=AMBER),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.35).shift(UP * 1.6)
        numbers = VGroup(*[mono(f"0{i}", 22, color=AMBER) for i in (1, 2, 3)])
        for number, line in zip(numbers, lines):
            number.next_to(line, LEFT, buff=0.35)
        for number, line in zip(numbers, lines):
            self.play(FadeIn(number), FadeIn(line, shift=RIGHT * 0.2), run_time=0.6)
        self.pause("En trois phrases : l'argent est bloqué dans un programme public ; il n'est versé qu'avec une preuve et un vote ; sinon, il est rendu.")

        thanks = flap_word("MERCI", size=1.2).shift(DOWN * 1.4)
        self.play(flip_in(thanks))
        questions = mono("VOS QUESTIONS", 22, color=AMBER).next_to(thanks, DOWN, buff=0.35)
        self.play(FadeIn(questions))
        self.pause("Merci. Nous sommes prêts pour vos questions.")
