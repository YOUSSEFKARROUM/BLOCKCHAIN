"""Diapositives 8 à 10 : réentrance (The DAO), prêt flash (Beanstalk), garde-fous."""

from manim import (
    DOWN,
    LEFT,
    RIGHT,
    UP,
    Arrow,
    Create,
    Cross,
    CurvedArrow,
    FadeIn,
    GrowArrow,
    Indicate,
    LaggedStart,
    Line,
    RoundedRectangle,
    Transform,
    VGroup,
)

from base import SECURITE, CampusSlide
from part1_contexte import lock_icon
from part2_cycle import bottom_note
from theme import (
    ALERT,
    AMBER,
    AMBER_FILL,
    AMBER_TEXT,
    GRAY,
    INK,
    LINE,
    OK,
    TILE_2,
    body,
    card,
    coin,
    display,
    mono,
    page_heading,
    pill,
)

WHITE = "#FFFFFF"


def panel(title: str, steps: str, color: str, width: float = 6.0, height: float = 4.3) -> VGroup:
    """Cadre de démonstration : titre en couleur et, dessous, l'ordre des opérations."""
    box = RoundedRectangle(corner_radius=0.18, width=width, height=height, fill_color=TILE_2, fill_opacity=1, stroke_color=color, stroke_width=3)
    head = VGroup(display(title, 26, color=color), body(steps, 24, color=INK, weight="BOLD")).arrange(DOWN, buff=0.08)
    head.next_to(box.get_top(), DOWN, buff=0.22)
    return VGroup(box, head)


class S08Reentrance(CampusSlide):
    index = 10
    section = SECURITE

    def construct(self) -> None:
        title = page_heading("Attaque n°1 · The DAO, 2016", "La réentrance", "")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        left = panel("Coffre naïf", "1. envoie   2. met le solde à zéro", ALERT, height=3.9).shift(LEFT * 3.25 + DOWN * 0.45)
        right = panel("CampusFund", "1. met le solde à zéro   2. envoie", OK, height=3.9).shift(RIGHT * 3.25 + DOWN * 0.45)
        self.play(FadeIn(left), FadeIn(right))

        # Coffre naïf : il envoie AVANT de remettre le solde à zéro
        vault_coins = VGroup(*[coin(0.15) for _ in range(12)]).arrange_in_grid(3, 4, buff=0.08).move_to(left[0].get_center() + LEFT * 1.4 + DOWN * 0.55)
        attacker = card("Attaquant", "", 2.0, 0.95, color=ALERT, title_size=24).move_to(left[0].get_center() + RIGHT * 1.45 + DOWN * 0.55)
        self.play(FadeIn(vault_coins), FadeIn(attacker))
        loop = CurvedArrow(attacker.get_top() + LEFT * 0.3, vault_coins.get_top() + RIGHT * 0.2, angle=1.2, color=ALERT, stroke_width=6)
        loop_label = mono("rappelle withdraw()", 20, color=ALERT, weight="BOLD").next_to(loop, UP, buff=0.04)
        self.play(Create(loop), FadeIn(loop_label))
        for i in range(3):
            batch = VGroup(*vault_coins[i * 4 : i * 4 + 4])
            self.play(batch.animate.scale(0.6).move_to(attacker.get_bottom() + DOWN * (0.3 + 0.22 * i)), run_time=0.45)
        drained = pill("vidé", color=ALERT, text_color=WHITE, size=26).move_to(left[0].get_center() + LEFT * 1.4 + DOWN * 0.55)
        self.play(FadeIn(drained, scale=1.4))
        self.pause("En 2016, The DAO a perdu des millions : le contrat envoyait l'argent avant de mettre le solde à zéro. L'attaquant rappelait la fonction en boucle et vidait le coffre.")

        # CampusFund : met à zéro d'abord, puis verrou anti-rappel
        safe_coins = VGroup(*[coin(0.15) for _ in range(12)]).arrange_in_grid(3, 4, buff=0.08).move_to(right[0].get_center() + LEFT * 1.4 + DOWN * 0.7)
        attacker2 = card("Attaquant", "", 2.0, 0.95, color=ALERT, title_size=24).move_to(right[0].get_center() + RIGHT * 1.45 + DOWN * 0.55)
        guard = lock_icon(color=OK, scale=1.0).next_to(safe_coins, UP, buff=0.15)
        self.play(FadeIn(safe_coins), FadeIn(attacker2), FadeIn(guard))
        attempt = CurvedArrow(attacker2.get_top() + LEFT * 0.3, guard.get_right() + RIGHT * 0.05, angle=1.0, color=ALERT, stroke_width=6)
        self.play(Create(attempt))
        blocked = Cross(attempt, stroke_color=ALERT, stroke_width=7, scale_factor=0.4)
        self.play(Create(blocked), Indicate(guard, color=OK, scale_factor=1.3))
        intact = pill("intact", color=OK, text_color=WHITE, size=26).next_to(attacker2, DOWN, buff=0.25)
        self.play(FadeIn(intact, scale=1.4))
        self.play(FadeIn(bottom_note("Un verrou refuse tout rappel. L'attaque est rejouée dans nos tests.")))
        self.pause("Chez nous : on met le solde à zéro avant d'envoyer, et un verrou refuse tout rappel. Nos tests rejouent l'attaque : le coffre naïf est vidé, CampusFund reste intact.")


class S09FlashLoan(CampusSlide):
    index = 11
    section = SECURITE

    def construct(self) -> None:
        title = page_heading("Attaque n°2 · Beanstalk, 2022", "Le vote", "acheté en un bloc")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        blocks = VGroup()
        for name in ["Bloc N-2", "Bloc N-1", "Bloc N"]:
            box = RoundedRectangle(corner_radius=0.12, width=2.85, height=2.7, fill_color=TILE_2, fill_opacity=1, stroke_color=LINE, stroke_width=2)
            label = body(name, 24, color=GRAY, weight="BOLD").next_to(box.get_top(), DOWN, buff=0.15)
            blocks.add(VGroup(box, label))
        blocks.arrange(RIGHT, buff=0.45).shift(DOWN * 0.55 + LEFT * 2.05)
        chain = VGroup(*[Line(blocks[i][0].get_right(), blocks[i + 1][0].get_left(), color=LINE, stroke_width=5) for i in range(2)])
        self.play(LaggedStart(*[FadeIn(b, shift=RIGHT * 0.2) for b in blocks], lag_ratio=0.2), Create(chain))

        # Les voix réelles existent déjà dans les blocs passés
        for block in blocks[:2]:
            real = VGroup(*[coin(0.12, color=AMBER_FILL) for _ in range(6)]).arrange_in_grid(2, 3, buff=0.06).move_to(block[0].get_center() + DOWN * 0.05)
            real_label = body("voix réelles", 22, color=AMBER_TEXT, weight="BOLD").next_to(real, DOWN, buff=0.12)
            self.play(FadeIn(real, lag_ratio=0.05), FadeIn(real_label), run_time=0.5)

        loan = VGroup(*[coin(0.12, color=ALERT) for _ in range(15)]).arrange_in_grid(3, 5, buff=0.05).move_to(blocks[2][0].get_center() + DOWN * 0.05)
        loan_label = body("prêt flash", 24, color=ALERT, weight="BOLD").next_to(loan, UP, buff=0.12)
        repaid = body("emprunté, voté, rendu", 22, color=ALERT).next_to(loan, DOWN, buff=0.12)
        self.play(FadeIn(loan, lag_ratio=0.05), FadeIn(loan_label), FadeIn(repaid))
        self.pause("En 2022, un attaquant a emprunté une énorme quantité de jetons, a voté, puis les a rendus, le tout dans la même transaction. Il a pris 182 millions de dollars.")

        naive = pill("Vote naïf : il compte le solde actuel, l'attaque réussit", color=ALERT, text_color=WHITE, size=24).next_to(blocks, DOWN, buff=0.4)
        self.play(FadeIn(naive))
        snapshot = RoundedRectangle(corner_radius=0.14, width=3.05, height=2.9, stroke_color=OK, stroke_width=6).move_to(blocks[1][0])
        snap_label = body("photo des voix", 24, color=OK, weight="BOLD").next_to(snapshot, UP, buff=0.1)
        self.play(Create(snapshot), FadeIn(snap_label))

        weight_label = body("Poids de l'attaquant", 26, color=INK, weight="BOLD")
        zero = display("0", 140, color=OK)
        verdict = VGroup(weight_label, zero).arrange(DOWN, buff=0.15).next_to(blocks, RIGHT, buff=0.55)
        self.play(FadeIn(weight_label), FadeIn(zero, scale=1.6))
        ours = pill("CampusFund : poids lu au bloc précédent, l'attaque échoue", color=OK, text_color=WHITE, size=24).move_to(naive)
        self.play(Transform(naive, ours))
        self.pause("Notre parade : les voix sont lues au bloc précédant la proposition. Des jetons empruntés après ne pèsent rien. Pour un déblocage, c'est même la mise, figée à la fin de la collecte. Le test le rejoue en direct.")


class S10GardeFous(CampusSlide):
    index = 12
    section = SECURITE

    def construct(self) -> None:
        title = page_heading("Garde-fous", "Personne ne peut", "partir avec la caisse.")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        def half(heading_text: str, color: str) -> VGroup:
            box = RoundedRectangle(corner_radius=0.18, width=6.0, height=4.5, fill_color=TILE_2, fill_opacity=1, stroke_color=color, stroke_width=3)
            head = display(heading_text, 26, color=color).next_to(box.get_top(), DOWN, buff=0.28)
            return VGroup(box, head)

        left = half("Trésorerie : 2 clés sur 3", AMBER).shift(LEFT * 3.25 + DOWN * 0.6)
        right = half("Droits abandonnés", ALERT).shift(RIGHT * 3.25 + DOWN * 0.6)
        self.play(FadeIn(left), FadeIn(right))

        # Multisig 2 sur 3
        keys = VGroup(*[card(f"Clé {i}", "membre", 1.55, 1.05, title_size=24, subtitle_size=22) for i in (1, 2, 3)]).arrange(RIGHT, buff=0.25)
        keys.move_to(left[0].get_center() + UP * 0.6)
        safe = card("Coffre", "frais 2 %", 2.4, 1.05, color=AMBER, title_size=26).next_to(keys, DOWN, buff=0.45)
        self.play(FadeIn(keys, lag_ratio=0.2), FadeIn(safe))
        arrows = VGroup(*[Arrow(keys[i].get_bottom(), safe.get_top(), buff=0.08, color=OK, stroke_width=6) for i in (0, 1)])
        self.play(*[GrowArrow(a) for a in arrows], Indicate(VGroup(keys[0], keys[1]), color=OK, scale_factor=1.05))
        rule = body("Au-delà d'1 ETH par jour : 2 signatures", 24, weight="BOLD").next_to(safe, DOWN, buff=0.18)
        self.play(FadeIn(rule))
        self.pause("La trésorerie est un coffre à trois clés : au-delà d'un ETH par jour, il faut deux signatures sur trois. Une clé volée ne suffit pas.")

        # Renonciation aux rôles
        roles = VGroup(
            body("Créer des jetons de vote", 28),
            body("Débloquer sans vote", 28),
            body("Changer les règles de vote", 28),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.4)
        roles.move_to(right[0].get_center() + UP * 0.25)
        self.play(FadeIn(roles, lag_ratio=0.2))
        strikes = VGroup(*[Line(r.get_left() + LEFT * 0.1, r.get_right() + RIGHT * 0.1, color=ALERT, stroke_width=6) for r in roles])
        self.play(LaggedStart(*[Create(s) for s in strikes], lag_ratio=0.3))
        kept = pill("Reste : la pause, sans accès aux fonds", color=OK, text_color=WHITE, size=24).next_to(roles, DOWN, buff=0.5)
        self.play(FadeIn(kept, shift=UP * 0.2))
        self.pause("Au déploiement, l'équipe a renoncé à ses droits d'administration : personne ne peut créer des voix, débloquer sans vote ou changer les règles. Il reste seulement un bouton pause, qui ne peut prendre aucun fonds.")
