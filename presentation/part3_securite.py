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
    FadeOut,
    GrowArrow,
    GrowFromEdge,
    Indicate,
    LaggedStart,
    Line,
    Rectangle,
    RoundedRectangle,
    Transform,
    VGroup,
)

from base import CampusSlide
from part1_contexte import lock_icon
from theme import (
    ALERT,
    AMBER,
    GRAY,
    LINE,
    OK,
    TICKET,
    TILE,
    TILE_2,
    body,
    card,
    coin,
    display,
    kicker,
    mono,
    page_heading,
    pill,
)


def panel(title: str, color: str, width: float = 5.8, height: float = 4.0) -> VGroup:
    box = RoundedRectangle(corner_radius=0.18, width=width, height=height, fill_color=TILE_2, fill_opacity=1, stroke_color=color, stroke_width=2.5)
    label = mono(title, 18, color=color, weight="BOLD").next_to(box.get_top(), DOWN, buff=0.22)
    return VGroup(box, label)


class S08Reentrance(CampusSlide):
    index = 7

    def construct(self) -> None:
        title = page_heading("Attaque n°1 · The DAO, 2016", "La réentrance", "")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        left = panel("COFFRE NAÏF", ALERT).shift(LEFT * 3.3 + DOWN * 0.75)
        right = panel("CAMPUSFUND", OK).shift(RIGHT * 3.3 + DOWN * 0.75)
        self.play(FadeIn(left), FadeIn(right))

        # Coffre naïf : il envoie AVANT de remettre le solde à zéro
        vault_coins = VGroup(*[coin(0.14) for _ in range(12)]).arrange_in_grid(3, 4, buff=0.08).move_to(left[0].get_center() + LEFT * 1.3 + DOWN * 0.2)
        attacker = card("Attaquant", "", 1.9, 0.9, color=ALERT, title_size=22).move_to(left[0].get_center() + RIGHT * 1.5 + DOWN * 0.2)
        order = VGroup(mono("1. ENVOIE", 16, color=ALERT), mono("2. MET À ZÉRO", 16, color=GRAY)).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
        order.next_to(left[0].get_bottom(), UP, buff=0.25)
        self.play(FadeIn(vault_coins), FadeIn(attacker), FadeIn(order))
        loop = CurvedArrow(attacker.get_top() + LEFT * 0.3, vault_coins.get_top() + RIGHT * 0.2, angle=1.2, color=ALERT)
        loop_label = mono("RAPPELLE withdraw()", 14, color=ALERT).next_to(loop, UP, buff=0.05)
        self.play(Create(loop), FadeIn(loop_label))
        for i in range(3):
            batch = VGroup(*vault_coins[i * 4 : i * 4 + 4])
            self.play(batch.animate.scale(0.6).move_to(attacker.get_bottom() + DOWN * (0.3 + 0.2 * i)), run_time=0.45)
        drained = pill("VIDÉ", color=ALERT, size=18).next_to(left[1], DOWN, buff=0.15)
        self.play(FadeIn(drained, scale=1.4))
        self.pause("En 2016, The DAO a perdu des millions : le contrat envoyait l'argent avant de mettre le solde à zéro. L'attaquant rappelait la fonction en boucle et vidait le coffre.")

        # CampusFund : met à zéro d'abord, puis verrou anti-rappel
        safe_coins = VGroup(*[coin(0.14) for _ in range(12)]).arrange_in_grid(3, 4, buff=0.08).move_to(right[0].get_center() + LEFT * 1.3 + DOWN * 0.2)
        attacker2 = card("Attaquant", "", 1.9, 0.9, color=ALERT, title_size=22).move_to(right[0].get_center() + RIGHT * 1.5 + DOWN * 0.2)
        order2 = VGroup(mono("1. MET À ZÉRO", 16, color=OK), mono("2. ENVOIE", 16, color=GRAY)).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
        order2.next_to(right[0].get_bottom(), UP, buff=0.25)
        guard = lock_icon(color=OK, scale=0.9).next_to(safe_coins, UP, buff=0.15)
        self.play(FadeIn(safe_coins), FadeIn(attacker2), FadeIn(order2), FadeIn(guard))
        attempt = CurvedArrow(attacker2.get_top() + LEFT * 0.3, guard.get_right(), angle=1.0, color=ALERT)
        self.play(Create(attempt))
        blocked = Cross(attempt, stroke_color=ALERT, stroke_width=6, scale_factor=0.4)
        self.play(Create(blocked), Indicate(guard, color=OK, scale_factor=1.3))
        intact = pill("INTACT", color=OK, size=18).next_to(right[1], DOWN, buff=0.15)
        self.play(FadeIn(intact, scale=1.4))
        rule = body("Checks → Effects → Interactions, et un verrou nonReentrant. Rejoué dans nos tests.", 22, color=GRAY).to_corner(DOWN + LEFT, buff=0.3)
        self.play(FadeIn(rule))
        self.pause("Chez nous : on met le solde à zéro avant d'envoyer, et un verrou refuse tout rappel. Nos tests rejouent l'attaque : le coffre naïf est vidé, CampusFund reste intact.")


class S09FlashLoan(CampusSlide):
    index = 8

    def construct(self) -> None:
        title = page_heading("Attaque n°2 · Beanstalk, 2022", "Le vote", "acheté en un bloc")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        blocks = VGroup()
        for name in ["BLOC N-2", "BLOC N-1", "BLOC N"]:
            box = RoundedRectangle(corner_radius=0.12, width=3.0, height=2.6, fill_color=TILE_2, fill_opacity=1, stroke_color=LINE, stroke_width=2)
            label = mono(name, 16, color=GRAY).next_to(box.get_top(), DOWN, buff=0.15)
            blocks.add(VGroup(box, label))
        blocks.arrange(RIGHT, buff=0.5).shift(DOWN * 0.7 + LEFT * 1.8)
        chain = VGroup(*[Line(blocks[i][0].get_right(), blocks[i + 1][0].get_left(), color=LINE, stroke_width=4) for i in range(2)])
        self.play(LaggedStart(*[FadeIn(b, shift=RIGHT * 0.2) for b in blocks], lag_ratio=0.2), Create(chain))

        loan = VGroup(*[coin(0.12, color=ALERT) for _ in range(15)]).arrange_in_grid(3, 5, buff=0.05).move_to(blocks[2][0].get_center() + DOWN * 0.15)
        loan_label = mono("PRÊT FLASH", 16, color=ALERT, weight="BOLD").next_to(loan, UP, buff=0.12)
        self.play(FadeIn(loan, lag_ratio=0.05), FadeIn(loan_label))
        repaid = mono("EMPRUNTÉ, VOTÉ, RENDU", 14, color=ALERT).next_to(blocks[2][0].get_bottom(), UP, buff=0.15)
        self.play(FadeIn(repaid))
        self.pause("En 2022, un attaquant a emprunté une énorme quantité de jetons, a voté, puis les a rendus, le tout dans la même transaction. Il a pris 182 millions de dollars.")

        naive = pill("VOTE NAÏF : COMPTE LE SOLDE ACTUEL → ATTAQUE RÉUSSIE", color=ALERT, size=15).next_to(blocks, DOWN, buff=0.35)
        self.play(FadeIn(naive))
        snapshot = RoundedRectangle(corner_radius=0.14, width=3.2, height=2.8, stroke_color=OK, stroke_width=5).move_to(blocks[1][0])
        snap_label = mono("PHOTO DES VOIX", 16, color=OK, weight="BOLD").next_to(snapshot, UP, buff=0.12)
        self.play(Create(snapshot), FadeIn(snap_label))
        weight = card("Poids de l'attaquant", "au bloc N-1", 2.8, 1.5, title_size=22).next_to(blocks, RIGHT, buff=0.4)
        zero = display("0", 72, color=OK).next_to(weight, DOWN, buff=0.2)
        self.play(FadeIn(weight), FadeIn(zero, scale=1.5))
        ours = pill("CAMPUSFUND : POIDS LU AU BLOC PRÉCÉDENT → ÉCHEC", color=OK, size=15).move_to(naive)
        self.play(Transform(naive, ours))
        self.pause("Notre parade : les voix sont lues au bloc précédant la proposition. Des jetons empruntés après ne pèsent rien. Pour un déblocage, c'est même la mise, figée à la fin de la collecte. Le test le rejoue en direct.")


class S10GardeFous(CampusSlide):
    index = 9

    def construct(self) -> None:
        title = page_heading("Garde-fous", "Personne ne peut", "partir avec la caisse.")
        self.play(FadeIn(title, shift=DOWN * 0.2))

        # Multisig 2 sur 3
        keys = VGroup(*[card(f"Clé {i}", "membre", 1.6, 1.1, title_size=22) for i in (1, 2, 3)]).arrange(RIGHT, buff=0.25)
        keys.shift(LEFT * 3.4 + DOWN * 0.4)
        safe = card("Trésorerie", "frais 2 %", 2.6, 1.3, color=AMBER, title_size=26).next_to(keys, DOWN, buff=0.7)
        rule = mono("> 1 ETH / JOUR : 2 SIGNATURES SUR 3", 16, color=AMBER).next_to(safe, DOWN, buff=0.25)
        self.play(FadeIn(keys, lag_ratio=0.2), FadeIn(safe))
        arrows = VGroup(*[Arrow(keys[i].get_bottom(), safe.get_top(), buff=0.08, color=OK, stroke_width=4) for i in (0, 1)])
        self.play(*[GrowArrow(a) for a in arrows], Indicate(VGroup(keys[0], keys[1]), color=OK, scale_factor=1.05))
        self.play(FadeIn(rule))
        self.pause("La trésorerie est un coffre à trois clés : au-delà d'un ETH par jour, il faut deux signatures sur trois. Une clé volée ne suffit pas.")

        # Renonciation aux rôles
        roles = VGroup(
            body("Créer des jetons de vote", 26),
            body("Débloquer sans vote", 26),
            body("Changer les règles de vote", 26),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.35)
        roles.shift(RIGHT * 2.4 + DOWN * 0.2)
        roles_title = mono("DROITS ABANDONNÉS AU LANCEMENT", 16, color=GRAY).next_to(roles, UP, buff=0.4).align_to(roles, LEFT)
        self.play(FadeIn(roles_title), FadeIn(roles, lag_ratio=0.2))
        strikes = VGroup(*[Line(r.get_left() + LEFT * 0.1, r.get_right() + RIGHT * 0.1, color=ALERT, stroke_width=5) for r in roles])
        self.play(LaggedStart(*[Create(s) for s in strikes], lag_ratio=0.3))
        kept = pill("RESTE : LE BOUTON PAUSE, SANS ACCÈS AUX FONDS", color=OK, size=13).next_to(roles, DOWN, buff=0.45).align_to(roles, LEFT)
        self.play(FadeIn(kept, shift=UP * 0.2))
        self.pause("Au déploiement, l'équipe a renoncé à ses droits d'administration : personne ne peut créer des voix, débloquer sans vote ou changer les règles. Il reste seulement un bouton pause, qui ne peut prendre aucun fonds.")
