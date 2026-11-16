"""Diapositives 5 à 7 : le cycle complet sur un exemple, puis les cas où tout tourne mal."""

from manim import (
    DOWN,
    LEFT,
    RIGHT,
    UP,
    Arrow,
    Circle,
    Create,
    Cross,
    DashedLine,
    FadeIn,
    FadeOut,
    GrowArrow,
    GrowFromEdge,
    Indicate,
    LaggedStart,
    Line,
    Rectangle,
    ReplacementTransform,
    Rotate,
    RoundedRectangle,
    Transform,
    ValueTracker,
    VGroup,
    always_redraw,
)

from base import CampusSlide
from part1_contexte import lock_icon
from theme import (
    ALERT,
    AMBER,
    GRAY,
    LINE,
    NIGHT,
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

STEPS = ["Créer", "Contribuer", "Clôturer", "Prouver", "Voter", "Exécuter", "Retirer"]


def timeline(active: int) -> VGroup:
    """Frise des 7 étapes ; l'étape active est en ambre, les précédentes en vert."""
    items = VGroup()
    for i, name in enumerate(STEPS):
        color = AMBER if i == active else (OK if i < active else GRAY)
        dot = Circle(radius=0.11, fill_color=color, fill_opacity=1 if i <= active else 0, stroke_color=color, stroke_width=2.5)
        label = mono(name.upper(), 15, color=color)
        items.add(VGroup(dot, label).arrange(DOWN, buff=0.1))
    items.arrange(RIGHT, buff=0.55)
    rail = Line(items[0][0].get_center(), items[-1][0].get_center(), color=LINE, stroke_width=2)
    group = VGroup(rail, items)
    rail.set_z_index(-1)
    return group.to_edge(UP, buff=0.35)


def person(initials: str, color: str = TICKET) -> VGroup:
    head = Circle(radius=0.32, fill_color=TILE, fill_opacity=1, stroke_color=color, stroke_width=2.5)
    label = mono(initials, 18 if len(initials) <= 2 else 12, color=color, weight="BOLD").move_to(head)
    return VGroup(head, label)


def document(name: str) -> VGroup:
    sheet = RoundedRectangle(corner_radius=0.06, width=1.1, height=1.4, fill_color=TICKET, fill_opacity=1, stroke_width=0)
    lines = VGroup(*[Line(LEFT * 0.35, RIGHT * 0.35, color=GRAY, stroke_width=3) for _ in range(4)]).arrange(DOWN, buff=0.17)
    lines.move_to(sheet.get_center() + UP * 0.1)
    label = mono(name, 14, color=AMBER, weight="BOLD").next_to(sheet, DOWN, buff=0.1)
    return VGroup(sheet, lines, label)


def vault_box(width: float = 3.4, height: float = 2.4) -> VGroup:
    box = RoundedRectangle(corner_radius=0.2, width=width, height=height, fill_color=TILE_2, fill_opacity=1, stroke_color=AMBER, stroke_width=3)
    label = mono("CONTRAT", 16, color=AMBER).next_to(box, UP, buff=0.1)
    return VGroup(box, label)


class S05Cycle(CampusSlide):
    index = 4

    def construct(self) -> None:
        steps = timeline(0)
        example = VGroup(
            kicker("Exemple"),
            display("Tournoi d'échecs", 40),
            mono("OBJECTIF 1 000 DH · 2 JALONS · 50 % / 50 %", 18, color=GRAY),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.12).next_to(steps, DOWN, buff=0.5).to_edge(LEFT, buff=0.7)
        self.play(FadeIn(steps), FadeIn(example, shift=RIGHT * 0.2))

        # 1. Créer : la promesse devient publique
        form = VGroup(
            body("Jalon 1 · jeux et pendules", 24),
            body("Preuve promise : la facture", 22, color=GRAY),
            body("Jalon 2 · remise des prix", 24),
            body("Preuve promise : les photos", 22, color=GRAY),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.14)
        form_box = RoundedRectangle(corner_radius=0.15, width=form.width + 0.6, height=form.height + 0.5, fill_color=TILE_2, fill_opacity=1, stroke_color=LINE)
        form_card = VGroup(form_box, form.move_to(form_box)).shift(LEFT * 3.2 + DOWN * 1.4)
        ipfs = pill("IPFS · bafkrei…", color=TILE, text_color=AMBER, size=18).shift(RIGHT * 2.6 + DOWN * 0.6)
        chain = pill("BLOCKCHAIN · CID", color=TILE, text_color=AMBER, size=18).shift(RIGHT * 2.6 + DOWN * 2.0)
        self.play(FadeIn(form_card, shift=UP * 0.2))
        self.play(GrowArrow(Arrow(form_card.get_right(), ipfs.get_left(), color=GRAY, buff=0.2)), FadeIn(ipfs))
        self.play(GrowArrow(Arrow(ipfs.get_bottom(), chain.get_top(), color=GRAY, buff=0.1)), FadeIn(chain))
        self.pause("Étape 1 : le club crée la campagne. Chaque jalon a une part de l'argent et une preuve promise. Le texte va sur IPFS, son empreinte sur la blockchain : la promesse ne peut plus changer.")

        # 2. Contribuer : l'argent va au contrat, pas au club
        self.clear_slide(keep=(steps, example))
        self.play(ReplacementTransform(steps, timeline(1)))
        steps = self.mobjects[-1]
        vault = vault_box().shift(RIGHT * 1.6 + DOWN * 0.7)
        donors = VGroup(person("AS"), person("YK"), person("MB")).arrange(DOWN, buff=0.45).shift(LEFT * 4.6 + DOWN * 0.7)
        progress_bg = RoundedRectangle(corner_radius=0.08, width=3.4, height=0.22, fill_color=TILE, fill_opacity=1, stroke_width=0)
        progress_bg.next_to(vault, DOWN, buff=0.35)
        tracker = ValueTracker(0)
        progress = always_redraw(
            lambda: Rectangle(width=max(0.001, 3.4 * tracker.get_value()), height=0.22, fill_color=AMBER, fill_opacity=1, stroke_width=0).align_to(progress_bg, LEFT).align_to(progress_bg, DOWN)
        )
        percent = always_redraw(lambda: mono(f"{round(tracker.get_value() * 100)} %", 18, color=AMBER).next_to(progress_bg, RIGHT, buff=0.2))
        self.play(FadeIn(vault), FadeIn(donors, lag_ratio=0.2), FadeIn(progress_bg), FadeIn(progress), FadeIn(percent))
        for i, donor in enumerate(donors):
            coins = VGroup(*[coin(0.12) for _ in range(3)]).arrange(RIGHT, buff=0.05).move_to(donor)
            cfd = pill("+ CFD = VOIX", color=OK, size=14).next_to(donor, RIGHT, buff=0.25)
            target = vault[0].get_center() + LEFT * 0.9 + RIGHT * 0.9 * i
            self.play(coins.animate.move_to(target), tracker.animate.set_value((i + 1) / 3), run_time=0.8)
            self.play(FadeIn(cfd, shift=RIGHT * 0.2), run_time=0.4)
        lock = lock_icon(scale=1.1).next_to(vault[0], RIGHT, buff=0.25)
        self.play(FadeIn(lock, scale=1.4))
        self.pause("Étape 2 : chacun contribue. L'argent ne va pas au club : il reste bloqué dans le contrat. En échange, on reçoit des jetons CFD : ce sont ses voix.")

        # 3. Clôturer : le résultat est figé
        self.play(ReplacementTransform(steps, timeline(2)))
        steps = self.mobjects[-1]
        status = pill("COLLECTE", color=TICKET, size=20).next_to(vault[0], UP, buff=0.6)
        self.play(FadeIn(status, shift=DOWN * 0.2))
        funded = pill("FINANCÉE", color=OK, size=20).move_to(status)
        self.play(Transform(status, funded), Indicate(vault[0], color=OK, scale_factor=1.03))
        frozen = body("Les voix sont figées : plus personne ne peut contribuer.", 24, color=GRAY).to_corner(DOWN + LEFT, buff=0.45)
        self.play(FadeIn(frozen))
        self.pause("Étape 3 : à la date prévue, la collecte est clôturée. Objectif atteint : campagne financée. Objectif manqué : tout le monde est remboursé. Les voix sont figées, on ne peut plus en acheter.")


class S06Vote(CampusSlide):
    index = 5

    def construct(self) -> None:
        steps = timeline(3)
        self.play(FadeIn(steps))

        # 4. Prouver
        proof = document("FACTURE.PDF").shift(LEFT * 4.8 + DOWN * 0.6)
        request = card("Débloquer le jalon 1", "500 DH · preuve jointe", 4.2, 1.5, title_size=28).shift(LEFT * 0.2 + UP * 0.9)
        self.play(FadeIn(proof, shift=UP * 0.3))
        self.play(proof.animate.scale(0.55).next_to(request[0], LEFT, buff=0.2), FadeIn(request, shift=LEFT * 0.3))
        rule = pill("SANS PREUVE : REFUSÉ PAR LE CONTRAT", color=ALERT, size=16).next_to(request, DOWN, buff=0.35)
        self.play(FadeIn(rule))
        self.pause("Étape 4 : le club a acheté les jeux. Il demande le déblocage du jalon 1, avec la facture. Sans preuve, le contrat refuse : pas d'argent sans justificatif.")

        # 5. Voter
        self.play(FadeOut(rule), ReplacementTransform(steps, timeline(4)))
        steps = self.mobjects[-1]
        bars_origin = request.get_bottom() + DOWN * 0.9 + LEFT * 1.9
        labels = VGroup(mono("POUR", 18), mono("CONTRE", 18)).arrange(DOWN, aligned_edge=LEFT, buff=0.45).move_to(bars_origin, aligned_edge=LEFT)
        width = 3.6
        tracks = VGroup(*[RoundedRectangle(corner_radius=0.06, width=width, height=0.3, fill_color=TILE, fill_opacity=1, stroke_width=0).next_to(l, RIGHT, buff=0.3) for l in labels])
        tracks.align_to(tracks[0], LEFT)
        for_bar = Rectangle(width=0.001, height=0.3, fill_color=AMBER, fill_opacity=1, stroke_width=0).align_to(tracks[0], LEFT).align_to(tracks[0], DOWN)
        against_bar = Rectangle(width=0.001, height=0.3, fill_color=GRAY, fill_opacity=1, stroke_width=0).align_to(tracks[1], LEFT).align_to(tracks[1], DOWN)
        quorum_x = tracks[0].get_left()[0] + width * 0.1
        quorum = DashedLine([quorum_x, tracks[0].get_top()[1] + 0.25, 0], [quorum_x, tracks[1].get_bottom()[1] - 0.25, 0], color=OK)
        quorum_label = mono("QUORUM 10 %", 14, color=OK).next_to(quorum, DOWN, buff=0.08)
        self.play(FadeIn(labels), FadeIn(tracks), Create(quorum), FadeIn(quorum_label))

        voters = VGroup(person("AS"), person("YK"), person("MB")).arrange(RIGHT, buff=0.3).shift(RIGHT * 4.3 + DOWN * 1.0)
        club = person("CLUB", color=ALERT).scale(1.1).next_to(voters, UP, buff=0.7)
        cross = Cross(club, stroke_color=ALERT, stroke_width=5)
        self.play(FadeIn(voters, lag_ratio=0.2), FadeIn(club))
        self.play(Create(cross))
        no_self = body("Le club ne vote pas pour lui-même.", 22, color=ALERT).next_to(club, UP, buff=0.2)
        self.play(FadeIn(no_self))
        self.play(
            for_bar.animate.stretch_to_fit_width(width * 0.7).align_to(tracks[0], LEFT),
            against_bar.animate.stretch_to_fit_width(width * 0.15).align_to(tracks[1], LEFT),
            run_time=1.4,
        )
        self.pause("Étape 5 : les contributeurs regardent la facture et votent. Seuls ceux qui ont payé votent, avec le poids de leur mise. Le club ne vote pas pour lui-même. Il faut 10 % de participation et plus de pour que de contre.")

        # 6. Exécuter
        self.play(ReplacementTransform(steps, timeline(5)))
        steps = self.mobjects[-1]
        stamp = display("Adopté", 54, color=OK).rotate(0.18).move_to(request.get_center() + RIGHT * 0.4)
        stamp_box = RoundedRectangle(corner_radius=0.1, width=stamp.width + 0.4, height=stamp.height + 0.3, stroke_color=OK, stroke_width=5).rotate(0.18).move_to(stamp)
        self.play(FadeIn(VGroup(stamp_box, stamp), scale=1.6), run_time=0.5)
        self.pause("Étape 6 : à la fin du vote, n'importe qui clique sur Exécuter : la décision est appliquée, le jalon 1 est approuvé.")

        # 7. Retirer
        self.clear_slide(keep=(steps,))
        self.play(ReplacementTransform(steps, timeline(6)))
        vault = vault_box(3.0, 2.2).shift(LEFT * 4.0 + DOWN * 0.6)
        tranche = VGroup(*[coin(0.14) for _ in range(10)]).arrange_in_grid(2, 5, buff=0.08).move_to(vault[0].get_center() + UP * 0.45)
        remaining = VGroup(*[coin(0.14) for _ in range(10)]).arrange_in_grid(2, 5, buff=0.08).move_to(vault[0].get_center() + DOWN * 0.5)
        remaining_lock = lock_icon(scale=0.7).next_to(remaining, RIGHT, buff=0.15)
        club_card = card("Club", "490 DH · 98 %", 3.0, 1.4, color=OK).shift(RIGHT * 2.0 + UP * 0.6)
        treasury = card("Trésorerie", "10 DH · 2 %", 3.0, 1.4).shift(RIGHT * 2.0 + DOWN * 1.6)
        self.play(FadeIn(vault), FadeIn(tranche), FadeIn(remaining), FadeIn(remaining_lock))
        self.play(FadeIn(club_card), FadeIn(treasury))
        self.play(
            VGroup(*tranche[:9]).animate.arrange(RIGHT, buff=0.04).scale(0.8).next_to(club_card, LEFT, buff=0.3),
            tranche[9].animate.next_to(treasury, LEFT, buff=0.3),
            run_time=1.2,
        )
        next_round = body("Jalon 2 : toujours bloqué. Il faudra une nouvelle preuve et un nouveau vote.", 24, color=GRAY).to_edge(DOWN, buff=0.9)
        self.play(FadeIn(next_round))
        self.pause("Étape 7 : le club retire sa tranche. 98 % pour lui, 2 % pour la trésorerie de la plateforme. Le jalon 2 reste bloqué : on recommence avec les photos de la remise des prix.")


class S07Garanties(CampusSlide):
    index = 6

    def construct(self) -> None:
        title = page_heading("Quand ça tourne mal", "L'argent non versé", "est rendu.")
        self.play(FadeIn(title, shift=DOWN * 0.2))
        cases = [
            ("Objectif manqué", "Remboursement", "100 % de la mise rendue à chacun.", OK),
            ("Club disparu", "90 jours sans jalon", "N'importe qui annule ; le reste est rendu.", AMBER),
            ("Fraude suspectée", "Gel par la DAO", "La communauté vote ; le reste est rendu.", ALERT),
        ]
        columns = VGroup()
        for situation, mechanism, effect, color in cases:
            top = display(situation, 24, color=color)
            arrow = Arrow(UP * 0.35, DOWN * 0.35, color=color, stroke_width=5, buff=0)
            middle = pill(mechanism.upper(), color=color, size=17)
            bottom = body(effect, 23, color=TICKET)
            if bottom.width > 3.6:
                bottom.scale_to_fit_width(3.6)
            columns.add(VGroup(top, arrow, middle, bottom).arrange(DOWN, buff=0.3))
        columns.arrange(RIGHT, buff=0.6).shift(DOWN * 0.7)
        if columns.width > 12.8:
            columns.scale_to_fit_width(12.8)
        for column in columns:
            self.play(LaggedStart(*[FadeIn(part, shift=DOWN * 0.15) for part in column], lag_ratio=0.25), run_time=1.1)
        pause_note = body("Incident technique : l'équipe peut mettre en pause, mais ne peut prendre aucun fonds.", 22, color=GRAY).to_edge(DOWN, buff=0.9)
        self.play(FadeIn(pause_note))
        self.pause("Trois filets de sécurité : objectif manqué, abandon, fraude. Dans les trois cas, l'argent qui n'a pas été versé revient aux contributeurs.")
