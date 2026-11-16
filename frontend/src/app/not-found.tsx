import Link from "next/link";
import { ArrowIcon } from "@/components/board/Icons";

/** Page 404 : adresse inconnue, avec un retour vers les campagnes. */
export default function NotFound() {
  return (
    <main className="wrap flex flex-col items-start gap-6 pb-28 pt-12">
      <span className="tag text-amber">Erreur 404</span>
      <h1 className="display display-hero">
        Page
        <br />
        <span className="text-amber">introuvable.</span>
      </h1>
      <p className="m-0 max-w-[520px] text-[19px] text-soft">Cette adresse ne correspond à aucune page de CampusFund.</p>
      <Link href="/#campagnes" className="btn btn-amber">
        Voir les campagnes
        <ArrowIcon />
      </Link>
    </main>
  );
}
