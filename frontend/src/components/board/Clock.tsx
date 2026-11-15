"use client";

import { useEffect, useState } from "react";
import { Flap } from "./Flap";

const PLACEHOLDER = "--:--:--";
const TICK_MS = 1000;

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/**
 * Horloge en palettes. Rendu serveur et première peinture : tirets (aucune dépendance à l'heure
 * du serveur, donc pas d'écart d'hydratation). L'intervalle est arrêté au démontage.
 */
export function Clock() {
  const [time, setTime] = useState(PLACEHOLDER);

  useEffect(() => {
    setTime(formatTime(new Date()));
    const id = setInterval(() => setTime(formatTime(new Date())), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span role="timer" aria-label={time === PLACEHOLDER ? "Heure locale" : `Heure locale : ${time}`} className="flex gap-1">
      {Array.from(time).map((ch, i) => (
        <Flap key={i} ch={ch} size="md" isStill />
      ))}
    </span>
  );
}
