import Link from "next/link";
import { StatusLamp } from "./StatusLamp";

/** Grille commune à l'en-tête et aux lignes du tableau des départs (maquette Main). */
export const BOARD_GRID = "90px 1.5fr 1.2fr 130px 170px 250px";
export const BOARD_ROW_BG =
  "linear-gradient(#1E1E21 0, #1A1A1D 48.5%, #050506 48.5%, #050506 51.5%, #161618 51.5%, #121214 100%)";

export interface BoardRowData {
  href: string;
  flight: string;
  name: string;
  club: string;
  tranche: string;
  amount: string;
  status: string;
  color: string;
  isBlinking: boolean;
}

const ROW_CLASS = "db-row mono grid h-16 items-center gap-x-5 whitespace-nowrap rounded-md px-5 text-[19px] font-bold tracking-[.05em] text-ticket no-underline";

/** Une ligne du tableau des départs, qui mène à la fiche de la campagne. */
export function BoardRow({ row, delay }: { row: BoardRowData; delay: number }) {
  return (
    <Link
      href={row.href}
      className={ROW_CLASS}
      style={{ gridTemplateColumns: BOARD_GRID, background: BOARD_ROW_BG, animationDelay: `${delay}s` }}
      aria-label={`Vol ${row.flight}, ${row.name}, ${row.club}, ${row.status}`}
    >
      <span className="text-gray">{row.flight}</span>
      <span className="truncate uppercase">{row.name}</span>
      <span className="truncate font-normal uppercase text-soft">{row.club}</span>
      <span>{row.tranche}</span>
      <span>{row.amount}</span>
      <span className="flex items-center gap-3 uppercase" style={{ color: row.color }}>
        <StatusLamp color={row.color} isBlinking={row.isBlinking} />
        {row.status}
      </span>
    </Link>
  );
}

/** Ligne vide qui se retourne en boucle, en attendant les campagnes. */
export function BoardRowPlaceholder({ delay }: { delay: number }) {
  return (
    <div
      aria-hidden="true"
      className="db-flap-loading h-16 rounded-md"
      style={{ background: BOARD_ROW_BG, animationDelay: `${delay}s`, transformOrigin: "50% 0" }}
    />
  );
}
