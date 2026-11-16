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
    Indicate,
    LaggedStart,
    Line,
    Rectangle,
    ReplacementTransform,
    RoundedRectangle,
    Transform,
    ValueTracker,
    VGroup,
    always_redraw,
)

from base import CYCLE, CampusSlide
from part1_contexte import lock_icon
from theme import (
    ALERT,
    AMBER,
    AMBER_TEXT,
    GRAY,
    INK,
    LINE,
    OK,
    PAPER,
    TILE,
    TILE_2,
    body,
    card,
    coin,
    display,
    icon_clock,
    icon_refund,
    icon_shield,
    kicker,
    mono,
    page_heading,
    pill,
)

STEPS = ["Créer", "Contribuer", "Clôturer", "Prouver", "Voter", "Exécuter", "Retirer"]
WHITE = "#FFFFFF"


def timeline(active: int) -> VGroup:
    """Frise des 7 étapes ; l'étape active est en or et plus grande, les précédentes en vert."""
    items = VGroup()
    for i, name in enumerate(STEPS):
        is_active = i == active
        color = AMBER_TEXT if is_active else (OK if i < active else GRAY)
        dot = Circle(radius=0.15 if is_active else 0.11, fill_color=color, fill_opacity=1 if i <= active else 0, stroke_color=color, stroke_width=3)
        label = body(name, 26 if is_active else 22, color=color, weight="BOLD" if is_active else "NORMAL")
        items.add(VGroup(dot, label).arrange(DOWN, buff=0.1))
    items.arrange(RIGHT, buff=0.6)
    rail = Line(items[0][0].get_center(), items[-1][0].get_center(), color=LINE, stroke_width=3)
    rail.set_z_index(-1)
    return VGroup(rail, items).to_edge(UP, buff=0.35)


def person(initials: str, color: str = INK) -> VGroup:
    head = Circle(radius=0.34 if len(initials) <= 2 else 0.5, fill_color=TILE, fill_opacity=1, stroke_color=color, stroke_width=3)
    label = mono(initials, 20 if len(initials) <= 2 else 18, color=color, weight="BOLD").move_to(head)
    return VGroup(head, label)


def document(name: str) -> VGroup:
    sheet = RoundedRectangle(corner_radius=0.06, width=1.1, height=1.4, fill_color=PAPER, fill_opacity=1, stroke_color=LINE, stroke_width=2)
    lines = VGroup(*[Line(LEFT * 0.35, RIGHT * 0.35, color=GRAY, stroke_width=3) for _ in range(4)]).arrange(DOWN, buff=0.17)
    lines.move_to(sheet.get_center() + UP * 0.1)
    label = mono(name, 18, color=AMBER_TEXT, weight="BOLD").next_to(sheet, DOWN, buff=0.1)
    return VGroup(sheet, lines, label)


def vault_box(width: float = 3.4, height: float = 2.4) -> VGroup:
    box = RoundedRectangle(corner_radius=0.2, width=width, height=height, fill_color=TILE_2, fill_opacity=1, stroke_color=AMBER, stroke_width=3)
    label = mono("CONTRAT", 20, color=AMBER_TEXT, weight="BOLD").next_to(box, UP, buff=0.1)
    return VGroup(box, label)


def bottom_note(text: str) -> VGroup:
    """Phrase de conclusion d'une étape, centrée au-dessus du pied de page."""
    return body(text, 27).to_edge(DOWN, buff=0.95)


class S05Cycle(CampusSlide):
    index = 6
    section = CYCLE

    def construct(self) -> None:
        steps = timeline(0)
        example = VGroup(
            kicker("Exemple"),
            display("Tournoi d'échecs", 40),
            body("Objectif 1 000 DH · 2 jalons · 50 % / 50 %", 26, color=GRAY),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.12).next_to(steps, DOWN, buff=0.45).to_edge(LEFT, buff=0.7)
        self.play(FadeIn(steps), FadeIn(example, shift=RIGHT * 0.2))

        # 1. Créer : la promesse devient publique
        form = VGroup(
            body("Jalon 1 · jeux et pendules", 27, weight="BOLD"),
            body("Preuve promise : la facture", 25, color=GRAY),
            body("Jalon 2 · remise des prix", 27, weight="BOLD"),
            body("Preuve promise : les photos", 25, color=GRAY),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.14)
        form_box = RoundedRectangle(corner_radius=0.15, width=form.width + 0.6, height=form.height + 0.5, fill_color=TILE_2, fill_opacity=1, stroke_color=LINE)
        form_card = VGroup(form_box, form.move_to(form_box)).shift(LEFT * 3.2 + DOWN * 1.35)
        ipfs = pill("IPFS · bafkrei…", color=TILE, text_color=AMBER_TEXT, size=22, data=True).shift(RIGHT * 2.8 + DOWN * 0.55)
        chain = pill("Blockchain : empreinte", color=TILE, text_color=AMBER_TEXT, size=24).shift(RIGHT * 2.8 + DOWN * 2.1)
        self.play(FadeIn(form_card, shift=UP * 0.2))
        self.play(GrowArrow(Arrow(form_card.get_right(), ipfs.get_left(), color=AMBER, stroke_width=6, buff=0.2)), FadeIn(ipfs))
        self.play(GrowArrow(Arrow(ipfs.get_bottom(), chain.get_top(), color=AMBER, stroke_width=6, buff=0.1)), FadeIn(chain))
        self.pause("Étape 1 : le club crée la campagne. Chaque jalon a une part de l'argent et une preuve promise. Le texte va sur IPFS, son empreinte sur la blockchain : la promesse ne peut plus changer.")

        # 2. Contribuer : l'argent va au contrat, pas au club
        self.clear_slide(keep=(steps, example))
        self.play(ReplacementTransform(steps, timeline(1)))
        steps = self.mobjects[-1]
        vault = vault_box().shift(RIGHT * 1.6 + DOWN * 0.75)
        donors = VGroup(person("AS"), person("YK"), person("MB")).arrange(DOWN, buff=0.45).shift(LEFT * 4.6 + DOWN * 0.75)
        progress_bg = RoundedRectangle(corner_radius=0.1, width=3.4, height=0.3, fill_color=TILE, fill_opacity=1, stroke_width=0)
        progress_bg.next_to(vault, DOWN, buff=0.35)
        tracker = ValueTracker(0)
        progress = always_redraw(
            lambda: Rectangle(width=max(0.001, 3.4 * tracker.get_value()), height=0.3, fill_color=AMBER_FILL_SAFE, fill_opacity=1, stroke_width=0)
            .align_to(progress_bg, LEFT)
            .align_to(progress_bg, DOWN)
        )
        percent = always_redraw(lambda: mono(f"{round(tracker.get_value() * 100)} %", 26, color=AMBER_TEXT, weight="BOLD").next_to(progress_bg, RIGHT, buff=0.25))
        self.play(FadeIn(vault), FadeIn(donors, lag_ratio=0.2), FadeIn(progress_bg), FadeIn(progress), FadeIn(percent))
        for i, donor in enumerate(donors):
            coins = VGroup(*[coin(0.14) for _ in range(3)]).arrange(RIGHT, buff=0.05).move_to(donor)
            target = vault[0].get_center() + LEFT * 0.95 + RIGHT * 0.95 * i
            self.play(coins.animate.move_to(target), tracker.animate.set_value((i + 1) / 3), run_time=0.75)
        votes_note = pill("Chaque contribution donne des voix (CFD)", color=OK, text_color=WHITE, size=24).next_to(donors, RIGHT, buff=0.5).shift(UP * 0.0)
        lock = lock_icon(scale=1.2).next_to(vault[0], RIGHT, buff=0.3)
        self.play(FadeIn(lock, scale=1.4), FadeIn(votes_note, shift=RIGHT * 0.2))
        self.pause("Étape 2 : chacun contribue. L'argent ne va pas au club : il reste bloqué dans le contrat. En échange, on reçoit des jetons CFD : ce sont ses voix.")

        # 3. Clôturer : le résultat est figé
        self.play(ReplacementTransform(steps, timeline(2)), FadeOut(votes_note))
        steps = self.mobjects[-1]
        status = pill("Collecte", color=TILE, size=26).next_to(vault, UP, buff=0.25)
        self.play(FadeIn(status, shift=DOWN * 0.2))
        funded = pill("Financée", color=OK, text_color=WHITE, size=26).move_to(status)
        self.play(Transform(status, funded), Indicate(vault[0], color=OK, scale_factor=1.03))
        self.play(FadeIn(bottom_note("Les voix sont figées : plus personne ne peut contribuer ni en acheter.")))
        self.pause("Étape 3 : à la date prévue, la collecte est clôturée. Objectif atteint : campagne financée. Objectif manqué : tout le monde est remboursé. Les voix sont figées, on ne peut plus en acheter.")


AMBER_FILL_SAFE = "#FFB800"


class S06Vote(CampusSlide):
    index = 7
    section = CYCLE

    def construct(self) -> None:
        steps = timeline(3)
        self.play(FadeIn(steps))

        # 4. Prouver
        proof = document("FACTURE.PDF").shift(LEFT * 4.8 + DOWN * 0.6)
        request = card("Débloquer le jalon 1", "500 DH, preuve jointe", 4.6, 1.6, title_size=30, subtitle_size=26).shift(LEFT * 0.2 + UP * 0.85)
        self.play(FadeIn(proof, shift=UP * 0.3))
        self.play(proof.animate.scale(0.6).next_to(request[0], LEFT, buff=0.25), FadeIn(request, shift=LEFT * 0.3))
        rule = pill("Sans preuve, le contrat refuse la demande", color=ALERT, text_color=WHITE, size=26).next_to(request, DOWN, buff=0.4)
        self.play(FadeIn(rule))
        self.pause("Étape 4 : le club a acheté les jeux. Il demande le déblocage du jalon 1, avec la facture. Sans preuve, le contrat refuse : pas d'argent sans justificatif.")

        # 5. Voter
        self.play(FadeOut(rule), ReplacementTransform(steps, timeline(4)))
        steps = self.mobjects[-1]
        labels = VGroup(body("Pour", 28, weight="BOLD"), body("Contre", 28, weight="BOLD")).arrange(DOWN, aligned_edge=LEFT, buff=0.5)
        labels.move_to(request.get_bottom() + DOWN * 1.2 + LEFT * 2.0, aligned_edge=LEFT)
        width = 3.6
        tracks = VGroup(*[RoundedRectangle(corner_radius=0.08, width=width, height=0.36, fill_color=TILE, fill_opacity=1, stroke_width=0).next_to(l, RIGHT, buff=0.35) for l in labels])
        tracks.align_to(tracks[0], LEFT)
        for_bar = Rectangle(width=0.001, height=0.36, fill_color=AMBER_FILL_SAFE, fill_opacity=1, stroke_width=0).align_to(tracks[0], LEFT).align_to(tracks[0], DOWN)
        against_bar = Rectangle(width=0.001, height=0.36, fill_color=GRAY, fill_opacity=1, stroke_width=0).align_to(tracks[1], LEFT).align_to(tracks[1], DOWN)
        quorum_x = tracks[0].get_left()[0] + width * 0.1
        quorum = DashedLine([quorum_x, tracks[0].get_top()[1] + 0.25, 0], [quorum_x, tracks[1].get_bottom()[1] - 0.25, 0], color=OK, stroke_width=4)
        quorum_label = body("quorum 10 %", 22, color=OK, weight="BOLD").next_to(quorum, DOWN, buff=0.06)
        self.play(FadeIn(labels), FadeIn(tracks), Create(quorum), FadeIn(quorum_label))

        voters = VGroup(person("AS"), person("YK"), person("MB")).arrange(RIGHT, buff=0.3).shift(RIGHT * 4.4 + DOWN * 1.15)
        club = person("CLUB", color=ALERT).next_to(voters, UP, buff=0.7)
        cross = Cross(club, stroke_color=ALERT, stroke_width=6)
        self.play(FadeIn(voters, lag_ratio=0.2), FadeIn(club))
        self.play(Create(cross))
        no_self = body("Le club ne vote pas pour lui-même.", 25, color=ALERT, weight="BOLD").next_to(club, UP, buff=0.2)
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
        stamp = display("Adopté", 58, color=OK).rotate(0.18).move_to(request.get_center() + RIGHT * 0.4)
        stamp_box = RoundedRectangle(corner_radius=0.1, width=stamp.width + 0.4, height=stamp.height + 0.3, stroke_color=OK, stroke_width=6).rotate(0.18).move_to(stamp)
        self.play(FadeIn(VGroup(stamp_box, stamp), scale=1.6), run_time=0.5)
        self.pause("Étape 6 : à la fin du vote, n'importe qui clique sur Exécuter : la décision est appliquée, le jalon 1 est approuvé.")

        # 7. Retirer : le moment fort, en grands chiffres
        self.clear_slide(keep=(steps,))
        self.play(ReplacementTransform(steps, timeline(6)))
        vault = vault_box(3.2, 2.4).shift(LEFT * 4.6 + DOWN * 0.55)
        tranche = VGroup(*[coin(0.15) for _ in range(10)]).arrange_in_grid(2, 5, buff=0.08).move_to(vault[0].get_center() + UP * 0.5)
        remaining = VGroup(*[coin(0.15) for _ in range(10)]).arrange_in_grid(2, 5, buff=0.08).move_to(vault[0].get_center() + DOWN * 0.5)
        remaining_lock = lock_icon(scale=0.8).next_to(remaining, RIGHT, buff=0.12)
        self.play(FadeIn(vault), FadeIn(tranche), FadeIn(remaining), FadeIn(remaining_lock))

        club_value = display("490 DH", 96, color=OK)
        club_caption = body("au club · 98 %", 30, color=INK, weight="BOLD")
        club_block = VGroup(club_value, club_caption).arrange(DOWN, aligned_edge=LEFT, buff=0.1).move_to(RIGHT * 2.3 + UP * 0.55)
        fee_value = display("10 DH", 54, color=AMBER)
        fee_caption = body("à la trésorerie · 2 %", 26, color=GRAY, weight="BOLD")
        fee_block = VGroup(fee_value, fee_caption).arrange(RIGHT, buff=0.3, aligned_edge=DOWN).next_to(club_block, DOWN, buff=0.45, aligned_edge=LEFT)
        flow = Arrow(vault[0].get_right() + UP * 0.5, club_block.get_left() + LEFT * 0.2, color=OK, stroke_width=8, buff=0.15)
        self.play(GrowArrow(flow))
        self.play(
            VGroup(*tranche[:9]).animate.arrange(RIGHT, buff=0.03).scale(0.75).next_to(club_block, UP, buff=0.25, aligned_edge=LEFT),
            tranche[9].animate.next_to(fee_block, LEFT, buff=0.25),
            FadeIn(club_block, shift=LEFT * 0.3),
            run_time=1.2,
        )
        self.play(FadeIn(fee_block, shift=UP * 0.2))
        self.play(FadeIn(bottom_note("Jalon 2 : toujours bloqué. Nouvelle preuve, nouveau vote.")))
        self.pause("Étape 7 : le club retire sa tranche. 490 dirhams pour lui, 10 pour la trésorerie. Le jalon 2 reste bloqué : on recommence avec les photos de la remise des prix.")


class S07Garanties(CampusSlide):
    index = 8
    section = CYCLE

    def construct(self) -> None:
        title = page_heading("Quand ça tourne mal", "L'argent non versé", "est rendu.")
        self.play(FadeIn(title, shift=DOWN * 0.2))
        cases = [
            ("Objectif manqué", icon_refund, "Remboursement", "100 % de la mise rendue", OK),
            ("Club disparu", icon_clock, "90 jours sans jalon", "Le reste est rendu", AMBER),
            ("Fraude suspectée", icon_shield, "Gel voté par la DAO", "Le reste est rendu", ALERT),
        ]
        columns = VGroup()
        for situation, icon, mechanism, effect, color in cases:
            badge = Circle(radius=0.62, fill_color=TILE_2, fill_opacity=1, stroke_color=color, stroke_width=4)
            pictogram = icon(color=color, scale=1.1).move_to(badge)
            top = display(situation, 28, color=color)
            middle = pill(mechanism, color=color, text_color=WHITE, size=25)
            bottom = body(effect, 28, weight="BOLD")
            if bottom.width > 3.9:
                bottom.scale_to_fit_width(3.9)
            columns.add(VGroup(VGroup(badge, pictogram), top, middle, bottom).arrange(DOWN, buff=0.3))
        columns.arrange(RIGHT, buff=0.55).shift(DOWN * 0.75)
        if columns.width > 12.8:
            columns.scale_to_fit_width(12.8)
        for column in columns:
            self.play(LaggedStart(*[FadeIn(part, shift=DOWN * 0.15) for part in column], lag_ratio=0.25), run_time=1.1)
        self.play(FadeIn(bottom_note("Incident technique : l'équipe peut mettre en pause, sans jamais toucher aux fonds.")))
        self.pause("Trois filets de sécurité : objectif manqué, abandon, fraude. Dans les trois cas, l'argent qui n'a pas été versé revient aux contributeurs.")
