"""Diapositives 1 à 4 : ouverture, problème, idée, architecture."""

from manim import (
    DOWN,
    LEFT,
    ORIGIN,
    RIGHT,
    UP,
    AnimationGroup,
    Arrow,
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
    Write,
)

from base import CampusSlide
from theme import (
    ALERT,
    AMBER,
    GRAY,
    LINE,
    NIGHT,
    OK,
    TICKET,
    TILE_2,
    body,
    card,
    coin,
    display,
    flap_word,
    kicker,
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


def lock_icon(color: str = AMBER, scale: float = 1.0) -> VGroup:
    """Cadenas : un anneau et un corps."""
    from manim import Arc

    shackle = Arc(radius=0.16, start_angle=0, angle=3.1416, color=color, stroke_width=5).shift(UP * 0.12)
    body_box = RoundedRectangle(corner_radius=0.05, width=0.46, height=0.34, fill_color=color, fill_opacity=1, stroke_width=0)
    body_box.shift(DOWN * 0.08)
    return VGroup(shackle, body_box).scale(scale)


class S01Ouverture(CampusSlide):
    index = 0

    def construct(self) -> None:
        top = flap_word("CAMPUS", size=1.15)
        bottom = flap_word("FUND", size=1.15, color=AMBER)
        word = VGroup(top, bottom).arrange(DOWN, buff=0.18).shift(UP * 0.9)
        self.play(flip_in(VGroup(*top, *bottom)))

        tagline = display("Les fonds débloqués sur vote.", 44)
        tagline.next_to(word, DOWN, buff=0.6)
        info = mono("ENSA BÉNI MELLAL · IA & CYBERSÉCURITÉ · MINI-PROJET BLOCKCHAIN", size=18, color=GRAY)
        info.next_to(tagline, DOWN, buff=0.35)
        self.play(FadeIn(tagline, shift=UP * 0.2), run_time=0.8)
        self.play(FadeIn(info), run_time=0.6)
        self.pause("Bonjour. CampusFund : une plateforme de financement participatif pour les clubs étudiants, où l'argent n'est versé qu'après un vote.")


class S02Probleme(CampusSlide):
    index = 1

    def construct(self) -> None:
        title = page_heading("Le problème", "Qui garantit", "l'usage de l'argent ?")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        donors = VGroup(*[coin(0.2) for _ in range(6)]).arrange_in_grid(2, 3, buff=0.25).shift(LEFT * 4.2 + DOWN * 0.6)
        donors_label = body("Étudiants, anciens, parents, sponsors", 24, color=GRAY).next_to(donors, DOWN, buff=0.35)
        club = card("Club", "reçoit tout d'un coup", width=3.2, height=1.6).shift(RIGHT * 3.6 + DOWN * 0.6)
        self.play(FadeIn(donors, lag_ratio=0.1), FadeIn(donors_label), FadeIn(club))
        arrow = Arrow(donors.get_right(), club.get_left(), color=GRAY, buff=0.35, stroke_width=6)
        self.play(GrowArrow(arrow))
        self.play(donors.animate.scale(0.6).move_to(club.get_center() + DOWN * 1.25), run_time=1.0)

        question = display("?", 140, color=ALERT).next_to(club, UP, buff=0.15)
        doubts = VGroup(
            body("Comment l'argent est-il dépensé ?", 26),
            body("Et si le projet est abandonné ?", 26),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.18)
        doubts.next_to(club, DOWN, buff=1.0).align_to(club, LEFT).shift(LEFT * 1.2)
        self.play(FadeIn(question, scale=1.4), run_time=0.6)
        self.play(LaggedStart(*[FadeIn(d, shift=RIGHT * 0.2) for d in doubts], lag_ratio=0.4))
        self.pause("Aujourd'hui, un club reçoit tout l'argent d'un coup. Les donateurs doivent faire confiance, sans pouvoir vérifier ni récupérer leur argent.")


class S03Idee(CampusSlide):
    index = 2

    def construct(self) -> None:
        title = page_heading("L'idée", "Aucun chèque", "en blanc.")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        vault = RoundedRectangle(corner_radius=0.25, width=5.6, height=3.2, fill_color=TILE_2, fill_opacity=1, stroke_color=AMBER, stroke_width=3)
        vault.shift(LEFT * 2.6 + DOWN * 0.9)
        vault_label = mono("CONTRAT CAMPUSFUND", 18, color=AMBER).next_to(vault, UP, buff=0.15).align_to(vault, LEFT)
        shares = [("Jalon 1", "40 %"), ("Jalon 2", "30 %"), ("Jalon 3", "30 %")]
        compartments = VGroup()
        for name, share in shares:
            stack = VGroup(*[coin(0.13) for _ in range(4 if share == "40 %" else 3)]).arrange(UP, buff=-0.12)
            lock = lock_icon(scale=0.9)
            label = VGroup(mono(name.upper(), 16, color=GRAY), mono(share, 22, weight="BOLD")).arrange(DOWN, buff=0.08)
            compartments.add(VGroup(lock, stack, label).arrange(DOWN, buff=0.18))
        compartments.arrange(RIGHT, buff=0.75).move_to(vault.get_center())
        club = card("Club", "bénéficiaire", width=2.8, height=1.4).shift(RIGHT * 4.3 + DOWN * 0.9)

        self.play(Create(vault), FadeIn(vault_label))
        self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.2) for c in compartments], lag_ratio=0.25), FadeIn(club))
        self.pause("L'argent n'est pas donné au club. Il est gardé par un programme public, découpé en jalons.")

        for index, compartment in enumerate(compartments):
            lock, stack, _ = compartment
            vote = pill("VOTÉ", color=OK, size=16).next_to(lock, UP, buff=0.12)
            open_lock = lock_icon(color=OK, scale=0.9).move_to(lock)
            open_lock[0].shift(UP * 0.12)
            self.play(FadeIn(vote, scale=1.3), Transform(lock, open_lock), run_time=0.6)
            self.play(stack.animate.scale(0.8).move_to(club.get_bottom() + DOWN * 0.55 + RIGHT * (index - 1) * 0.7), run_time=0.8)
            if index == 0:
                self.pause("Chaque tranche ne part que si les contributeurs votent que le jalon est atteint, preuve à l'appui.")
        note = body("L'argent part par tranches, et chaque tranche demande un vote.", 26, color=GRAY).to_edge(DOWN, buff=0.9)
        self.play(FadeIn(note))
        self.pause("Si le projet échoue ou est abandonné, ce qui n'est pas encore versé est rendu.")


class S04Architecture(CampusSlide):
    index = 3

    def construct(self) -> None:
        title = page_heading("Architecture", "Quatre contrats,", "trois couches.")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        contracts = VGroup(
            card("CampusFund", "campagnes, jalons, remboursements", 3.0, 1.3, title_size=24),
            card("Governance", "votes, quorum, snapshot", 3.0, 1.3, title_size=24),
            card("CFDToken", "jeton de vote (ERC20Votes)", 3.0, 1.3, title_size=24),
            card("Treasury", "frais 2 %, multisig 2 sur 3", 3.0, 1.3, title_size=24),
        ).arrange_in_grid(2, 2, buff=(0.35, 0.3))
        chain_box = RoundedRectangle(corner_radius=0.2, width=contracts.width + 0.6, height=contracts.height + 0.9, stroke_color=AMBER, stroke_width=2)
        chain = VGroup(chain_box, contracts)
        contracts.move_to(chain_box.get_center() + DOWN * 0.15)
        chain_label = mono("BLOCKCHAIN ETHEREUM (SEPOLIA)", 16, color=AMBER).next_to(chain_box.get_top(), DOWN, buff=0.12)
        chain.add(chain_label).shift(DOWN * 0.8)

        front = card("Site web", "Next.js + MetaMask", 2.6, 1.3, title_size=24).next_to(chain, LEFT, buff=0.55)
        ipfs = card("IPFS", "textes des campagnes", 2.6, 1.3, title_size=24).next_to(front, UP, buff=0.4)
        ai = card("Script IA", "score de risque", 2.6, 1.3, title_size=24).next_to(chain, RIGHT, buff=0.55)

        self.play(Create(chain_box), FadeIn(chain_label))
        self.play(LaggedStart(*[FadeIn(c, scale=0.95) for c in contracts], lag_ratio=0.15))
        self.pause("Au cœur : quatre contrats Solidity, testés avec Foundry et basés sur OpenZeppelin.")

        links = VGroup(
            Arrow(front.get_right(), chain_box.get_left(), buff=0.1, color=GRAY, stroke_width=4),
            Arrow(front.get_top(), ipfs.get_bottom(), buff=0.08, color=GRAY, stroke_width=4),
            Arrow(chain_box.get_right(), ai.get_left(), buff=0.1, color=GRAY, stroke_width=4),
        )
        self.play(FadeIn(front, shift=RIGHT * 0.3))
        self.play(GrowArrow(links[0]))
        self.play(FadeIn(ipfs, shift=DOWN * 0.3), GrowArrow(links[1]))
        self.play(FadeIn(ai, shift=LEFT * 0.3), GrowArrow(links[2]))
        pulse = lamp(AMBER, 0.08).move_to(links[0].get_start())
        self.play(pulse.animate.move_to(links[0].get_end()), run_time=0.8)
        self.play(FadeOut(pulse), Indicate(contracts[0], color=AMBER, scale_factor=1.04))
        self.pause("Le site lit et écrit sur la chaîne via MetaMask ; les textes sont sur IPFS ; l'IA lit les événements et calcule un score.")
