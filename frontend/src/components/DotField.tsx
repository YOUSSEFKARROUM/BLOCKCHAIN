"use client";

import { useEffect, useRef } from "react";

const GAP = 16; // espacement de la trame, en pixels
const REACH = 110; // rayon d'influence du pointeur

/**
 * Trame de points en fond de tuile. Une onde la traverse une fois au chargement, puis les points
 * grossissent autour du pointeur. Le rendu s'arrête dès que plus rien ne bouge. Fixe si
 * l'utilisateur a réduit les animations.
 */
export function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    const host = canvas?.parentElement;
    if (!canvas || !ctx || !host) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, power: 0, target: 0 };
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;
    let wave = reduce ? 1 : 0; // 0 -> 1 : avancée de l'onde d'entrée

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const diagonal = Math.hypot(width, height);
      for (let y = GAP / 2; y < height; y += GAP) {
        for (let x = GAP / 2; x < width; x += GAP) {
          const near = pointer.power * Math.exp(-(((x - pointer.x) ** 2 + (y - pointer.y) ** 2) / REACH ** 2));
          const ring = (1 - wave) * Math.exp(-(((Math.hypot(width - x, y) - wave * diagonal) / 70) ** 2));
          const lift = Math.max(near, ring);
          // La trame s'efface vers la gauche, sous le texte
          const fade = 0.25 + 0.75 * Math.min(1, Math.max(0, (x / width - 0.3) / 0.5));
          ctx.globalAlpha = (0.14 + 0.86 * lift) * fade;
          ctx.beginPath();
          ctx.arc(x, y, 1 + 4.2 * lift, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const follow = Math.min(1, dt * 14);
      pointer.x += (pointer.tx - pointer.x) * follow;
      pointer.y += (pointer.ty - pointer.y) * follow;
      pointer.power += (pointer.target - pointer.power) * Math.min(1, dt * 7);
      wave = Math.min(1, wave + dt / 1.5);
      draw();
      const moving = wave < 1 || Math.abs(pointer.target - pointer.power) > 0.004 || Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y) > 0.3;
      frame = moving ? requestAnimationFrame(step) : 0;
    };
    const wake = () => {
      if (frame || reduce) return;
      last = performance.now();
      frame = requestAnimationFrame(step);
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#f5f5f7";
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.tx = e.clientX - r.left;
      pointer.ty = e.clientY - r.top;
      if (pointer.target === 0 && pointer.power < 0.05) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
      pointer.target = 1;
      wake();
    };
    const onLeave = () => {
      pointer.target = 0;
      wake();
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    wake();

    return () => {
      observer.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
