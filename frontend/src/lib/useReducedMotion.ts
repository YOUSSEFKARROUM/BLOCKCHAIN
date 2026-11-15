"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** `true` si l'utilisateur a demandé moins d'animations. Faux au rendu serveur. */
export function useReducedMotion(): boolean {
  const [isReduced, setIsReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const update = () => setIsReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return isReduced;
}
