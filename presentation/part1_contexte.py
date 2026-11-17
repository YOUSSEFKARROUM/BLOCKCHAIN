"""Diapositives 1 à 4 : sommaire, problème, idée, architecture."""

from manim import (
    DOWN,
    LEFT,
    PI,
    RIGHT,
    UP,
    Arc,
    Arrow,
    Circle,
    Create,
    FadeIn,
    FadeOut,
    GrowArrow,
    Indicate,
    LaggedStart,
    Line,
    Restore,
    RoundedRectangle,
    Transform,
    VGroup,
)

from base import ARCHITECTURE, PROBLEME, CampusSlide
from theme import (
    ALERT,
    AMBER,
    AMBER_TEXT,
    FLAP_AMBER,
    GRAY,
    LINE,
    OK,
    TILE_2,
    body,
    card,
    coin,
    display,
    flap_word,
    lamp,
    mono,
    page_heading,
    pill,
)


def flip_in(tiles: VGroup, lag: float = 0.08):
    """Chaque palette se retourne pour apparaître (écrasée verticalement, puis dépliée)."""
    for tile in tiles:
        tile.save_state()
        tile.stretch(0.02, 1)
    return LaggedStart(*[Restore(t) for t in tiles], lag_ratio=lag, run_time=1.6)


def lock_icon(color: str = AMBER, scale: float = 1.0, is_open: bool = False) -> VGroup:
    """Cadenas : un corps plein et une anse ; ouvert, l'anse se soulève et pivote sur son pied gauche."""
    case = RoundedRectangle(corner_radius=0.05, width=0.46, height=0.36, fill_color=color, fill_opacity=1, stroke_width=0)
    shackle = Arc(radius=0.15, start_angle=0, angle=PI, color=color, stroke_width=6)
    shackle.move_to(case.get_top() + UP * 0.08)
    legs = VGroup(
        Line(shackle.get_start(), shackle.get_start() + DOWN * 0.08, color=color, stroke_width=6),
        Line(shackle.get_end(), shackle.get_end() + DOWN * 0.08, color=color, stroke_width=6),
    )
    hoop = VGroup(shackle, legs)
    if is_open:
        hoop.shift(UP * 0.14).rotate(0.5, about_point=legs[1].get_end() + UP * 0.14)
    return VGroup(hoop, case).scale(scale)


AGENDA = [
    ("01", "Le problème et l'idée", "Pourquoi un club ne doit pas tout recevoir d'un coup"),
    ("02", "Architecture", "Quatre contrats, IPFS, le site et l'IA"),
    ("03", "Le cycle d'une campagne", "Créer, contribuer, prouver, voter, retirer"),
    ("04", "Démonstration", "Le site en ligne sur Sepolia"),
    ("05", "Sécurité", "The DAO et Beanstalk rejouées, puis bloquées"),
    ("06", "Limites et conclusion", "Ce qui reste à améliorer"),
]


def agenda_row(number: str, title: str, detail: str) -> VGroup:
    """Une entrée du sommaire : le numéro en palettes, le titre, une ligne de détail."""
    tiles = flap_word(number, size=0.74, color=FLAP_AMBER, gap=0.06)
    texts = VGroup(display(title, 27), body(detail, 24, color=GRAY)).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
    return VGroup(tiles, texts).arrange(RIGHT, buff=0.32)


class S01Sommaire(CampusSlide):
    index = 2

    def construct(self) -> None:
        title = page_heading("Sommaire", "Le plan", "en six étapes.")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        rows = [agenda_row(*item) for item in AGENDA]
        left = VGroup(*rows[:3]).arrange(DOWN, aligned_edge=LEFT, buff=0.5)
        right = VGroup(*rows[3:]).arrange(DOWN, aligned_edge=LEFT, buff=0.5)
        columns = VGroup(left, right).arrange(RIGHT, buff=0.9, aligned_edge=UP)
        if columns.width > 12.8:
            columns.scale_to_fit_width(12.8)
        free_top, free_bottom = title.get_bottom()[1] - 0.3, -3.45
        columns.move_to([0, (free_top + free_bottom) / 2, 0])
        divider = Line(columns.get_top(), columns.get_bottom(), color=LINE, stroke_width=2).move_to(
            [(left.get_right()[0] + right.get_left()[0]) / 2, columns.get_center()[1], 0]
        )
        self.play(Create(divider), run_time=0.4)
        for row in rows:
            self.play(flip_in(VGroup(*row[0]), lag=0.1), FadeIn(row[1], shift=RIGHT * 0.2), run_time=0.55)
        self.pause(
            "Voici notre plan : le problème et l'idée, l'architecture, le cycle d'une campagne sur un exemple, la "
            "la démonstration en direct, la sécurité avec deux attaques rejouées, puis les limites."
        )


def side_panel(title: str, color: str) -> VGroup:
    box = RoundedRectangle(corner_radius=0.2, width=6.1, height=4.7, fill_color=TILE_2, fill_opacity=1, stroke_color=color, stroke_width=3)
    label = display(title, 30, color=color).next_to(box.get_top(), DOWN, buff=0.3)
    return VGroup(box, label)


class S02Probleme(CampusSlide):
    index = 3
    section = PROBLEME

    def construct(self) -> None:
        title = page_heading("Le problème", "Qui garantit", "l'usage de l'argent ?")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        before = side_panel("Aujourd'hui", ALERT).shift(LEFT * 3.25 + DOWN * 0.85)
        after = side_panel("Avec CampusFund", OK).shift(RIGHT * 3.25 + DOWN * 0.85)

        # Avant : tout part d'un coup, sans contrôle
        money = VGroup(*[coin(0.17) for _ in range(6)]).arrange_in_grid(2, 3, buff=0.12).move_to(before[0].get_center() + LEFT * 1.75 + UP * 0.25)
        club_before = card("Club", "", 1.9, 0.95, title_size=26).move_to(before[0].get_center() + RIGHT * 1.2 + UP * 0.25)
        arrow_before = Arrow(money.get_right(), club_before.get_left(), color=ALERT, stroke_width=7, buff=0.2)
        question = display("?", 80, color=ALERT).next_to(club_before, RIGHT, buff=0.15)
        verdict_before = body("Tout d'un coup, sans contrôle.", 28, weight="BOLD").next_to(before[0].get_bottom(), UP, buff=0.4)
        self.play(FadeIn(before))
        self.play(FadeIn(money, lag_ratio=0.1), FadeIn(club_before))
        self.play(GrowArrow(arrow_before), money.animate.scale(0.75).next_to(club_before, DOWN, buff=0.15), run_time=1.0)
        self.play(FadeIn(question, scale=1.5), FadeIn(verdict_before, shift=UP * 0.15))
        self.pause("Aujourd'hui, un club reçoit tout l'argent d'un coup. Les donateurs font confiance, sans pouvoir vérifier ni récupérer leur argent.")

        # Après : l'argent attend dans le contrat et part par tranches, sur vote
        vault = RoundedRectangle(corner_radius=0.14, width=2.1, height=1.5, fill_color="#FFFFFF", fill_opacity=1, stroke_color=AMBER, stroke_width=3)
        vault.move_to(after[0].get_center() + LEFT * 1.6 + UP * 0.25)
        vault_coins = VGroup(*[coin(0.14) for _ in range(6)]).arrange_in_grid(2, 3, buff=0.08).move_to(vault)
        vault_label = mono("CONTRAT", 18, color=AMBER_TEXT, weight="BOLD").next_to(vault, UP, buff=0.1)
        club_after = card("Club", "", 1.9, 0.95, title_size=26).move_to(after[0].get_center() + RIGHT * 1.7 + UP * 0.25)
        steps = VGroup(*[pill("vote", color=OK, text_color="#FFFFFF", size=22) for _ in range(3)]).arrange(DOWN, buff=0.12)
        steps.move_to((vault.get_right() + club_after.get_left()) / 2)
        verdict_after = body("Par tranches, après un vote.", 28, weight="BOLD").next_to(after[0].get_bottom(), UP, buff=0.4)
        self.play(FadeIn(after))
        self.play(FadeIn(vault), FadeIn(vault_coins), FadeIn(vault_label), FadeIn(club_after))
        for i, step in enumerate(steps):
            tranche = VGroup(*vault_coins[i * 2 : i * 2 + 2])
            self.play(FadeIn(step, scale=1.3), run_time=0.3)
            self.play(tranche.animate.scale(0.8).next_to(club_after, DOWN, buff=0.15 + 0.35 * i), run_time=0.55)
        self.play(FadeIn(verdict_after, shift=UP * 0.15))
        self.pause("Avec CampusFund, l'argent attend dans un programme public et part par tranches, chacune après un vote des contributeurs.")


class S03Idee(CampusSlide):
    index = 4
    section = PROBLEME

    def construct(self) -> None:
        title = page_heading("L'idée", "Aucun chèque", "en blanc.")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        vault = RoundedRectangle(corner_radius=0.25, width=6.2, height=3.6, fill_color=TILE_2, fill_opacity=1, stroke_color=AMBER, stroke_width=3)
        vault.shift(LEFT * 2.7 + DOWN * 0.8)
        vault_label = mono("CONTRAT CAMPUSFUND", 20, color=AMBER_TEXT, weight="BOLD").next_to(vault, UP, buff=0.15).align_to(vault, LEFT)
        shares = [("Jalon 1", "40 %", 4), ("Jalon 2", "30 %", 3), ("Jalon 3", "30 %", 3)]
        compartments = VGroup()
        for name, share, count in shares:
            stack = VGroup(*[coin(0.17) for _ in range(count)]).arrange(UP, buff=-0.16)
            lock = lock_icon(scale=1.1)
            label = VGroup(body(name, 24, color=GRAY), mono(share, 26, weight="BOLD")).arrange(DOWN, buff=0.06)
            compartments.add(VGroup(lock, stack, label).arrange(DOWN, buff=0.22))
        compartments.arrange(RIGHT, buff=0.95).move_to(vault.get_center())
        club = card("Club", "bénéficiaire", width=3.0, height=1.5).shift(RIGHT * 4.4 + UP * 0.2)

        self.play(Create(vault), FadeIn(vault_label))
        self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.2) for c in compartments], lag_ratio=0.25), FadeIn(club))
        self.pause("L'argent n'est pas donné au club. Il est gardé par un programme public, découpé en jalons.")

        for index, compartment in enumerate(compartments):
            lock, stack, _ = compartment
            vote = pill("voté", color=OK, text_color="#FFFFFF", size=22).next_to(lock, UP, buff=0.12)
            unlocked = VGroup(
                Circle(radius=0.3, fill_color=OK, fill_opacity=1, stroke_width=0),
                Line([-0.12, 0.0, 0], [-0.03, -0.1, 0], color="#FFFFFF", stroke_width=7),
                Line([-0.03, -0.1, 0], [0.14, 0.11, 0], color="#FFFFFF", stroke_width=7),
            ).move_to(lock)
            self.play(FadeIn(vote, scale=1.3), Transform(lock, unlocked), run_time=0.6)
            target = club.get_bottom() + DOWN * 0.75 + RIGHT * (index - 1) * 0.85
            self.play(stack.animate.move_to(target), run_time=0.8)
            if index == 0:
                self.pause("Chaque tranche ne part que si les contributeurs votent que le jalon est atteint, preuve à l'appui.")
        note = body("L'argent part par tranches, et chaque tranche demande un vote.", 28).to_edge(DOWN, buff=0.95)
        self.play(FadeIn(note))
        self.pause("Si le projet échoue ou est abandonné, ce qui n'est pas encore versé est rendu.")


class S04Architecture(CampusSlide):
    index = 5
    section = ARCHITECTURE

    def construct(self) -> None:
        title = page_heading("Architecture", "Quatre contrats,", "trois couches.")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        contracts = VGroup(
            card("CampusFund", "campagnes et jalons", 2.95, 1.4, title_size=24),
            card("Governance", "votes et quorum", 2.95, 1.4, title_size=24),
            card("CFDToken", "jeton de vote", 2.95, 1.4, title_size=24),
            card("Treasury", "frais, 2 clés sur 3", 2.95, 1.4, title_size=24),
        ).arrange_in_grid(2, 2, buff=(0.3, 0.3))
        chain_box = RoundedRectangle(corner_radius=0.2, width=contracts.width + 0.6, height=contracts.height + 1.0, stroke_color=AMBER, stroke_width=3)
        contracts.move_to(chain_box.get_center() + DOWN * 0.2)
        chain_label = mono("BLOCKCHAIN · SEPOLIA", 20, color=AMBER_TEXT, weight="BOLD").next_to(chain_box.get_top(), DOWN, buff=0.14)
        chain = VGroup(chain_box, contracts, chain_label).shift(DOWN * 0.85)

        front = card("Site web", "Next.js, MetaMask", 2.45, 1.4, title_size=24).next_to(chain, LEFT, buff=0.95)
        ipfs = card("IPFS", "textes", 2.45, 1.4, title_size=24).next_to(front, UP, buff=0.75)
        ai = card("Script IA", "score de risque", 2.45, 1.4, title_size=24).next_to(chain, RIGHT, buff=0.95)

        self.play(Create(chain_box), FadeIn(chain_label))
        self.play(LaggedStart(*[FadeIn(c, scale=0.95) for c in contracts], lag_ratio=0.15))
        self.pause("Au cœur : quatre contrats Solidity, testés avec Foundry et basés sur OpenZeppelin.")

        def link(start, end, text: str, label_side) -> VGroup:
            arrow = Arrow(start, end, buff=0.08, color=AMBER, stroke_width=7, max_tip_length_to_length_ratio=0.25)
            caption = body(text, 22, color=AMBER_TEXT, weight="BOLD").next_to(arrow, label_side, buff=0.08)
            return VGroup(arrow, caption)

        links = [
            link(front.get_right(), chain_box.get_left(), "lit, écrit", DOWN),
            link(front.get_top(), ipfs.get_bottom(), "textes", RIGHT),
            link(chain_box.get_right(), ai.get_left(), "événements", DOWN),
        ]
        self.play(FadeIn(front, shift=RIGHT * 0.3))
        self.play(GrowArrow(links[0][0]), FadeIn(links[0][1]))
        self.play(FadeIn(ipfs, shift=DOWN * 0.3), GrowArrow(links[1][0]), FadeIn(links[1][1]))
        self.play(FadeIn(ai, shift=LEFT * 0.3), GrowArrow(links[2][0]), FadeIn(links[2][1]))
        pulse = lamp(AMBER, 0.09).move_to(links[0][0].get_start())
        self.play(pulse.animate.move_to(links[0][0].get_end()), run_time=0.8)
        self.play(FadeOut(pulse), Indicate(contracts[0], color=AMBER, scale_factor=1.04))
        self.pause("Le site lit et écrit sur la chaîne via MetaMask ; les textes sont sur IPFS ; l'IA lit les événements et calcule un score.")
