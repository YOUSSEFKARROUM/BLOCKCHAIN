"""Présentation CampusFund (manim-slides) : toutes les diapositives, dans l'ordre de passage."""

from part0_garde import S00PageDeGarde
from part1_contexte import S01Sommaire, S02Probleme, S03Idee, S04Architecture
from part2_cycle import S05Cycle, S06Vote, S07Garanties
from part3_securite import S08Reentrance, S09FlashLoan, S10GardeFous
from part4_preuves import S13Demo, S14Limites, S15Conclusion

SCENES = [
    S00PageDeGarde,
    S01Sommaire,
    S02Probleme,
    S03Idee,
    S04Architecture,
    S05Cycle,
    S06Vote,
    S07Garanties,
    S13Demo,
    S08Reentrance,
    S09FlashLoan,
    S10GardeFous,
    S14Limites,
    S15Conclusion,
]
