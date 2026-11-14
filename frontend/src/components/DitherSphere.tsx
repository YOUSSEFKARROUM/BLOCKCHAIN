"use client";

import { useEffect, useRef } from "react";

const CELLS = 38; // points par côté
const RADIUS = 0.92; // rayon de la sphère dans le carré [-1, 1]
const REST = { x: -0.45, y: -0.5 }; // lumière au repos : en haut à gauche
const RESPONSE = 0.45; // ressort amorti critique (pas de rebond), « response » en secondes
const STIFFNESS = (2 * Math.PI / RESPONSE) ** 2;
const DAMPING = 2 * Math.sqrt(STIFFNESS);

/**
 * Sphère tramée : chaque point grossit selon la lumière qu'il reçoit. La lumière suit le pointeur
 * avec un ressort, donc on peut changer de direction à tout moment sans à-coup. Aucune boucle
 * permanente : le rendu s'arrête dès que le ressort est au repos. Fixe si l'utilisateur a réduit
 * les animations.
 */
export function DitherSphere() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    const host = canvas?.parentElement;
    if (!canvas || !ctx || !host) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Au chargement, la lumière arrive par la droite puis se pose : un seul mouvement d'entrée.
    const light = { x: reduce ? REST.x : 0.85, y: reduce ? REST.y : 0.35, vx: 0, vy: 0 };
    const target = { ...REST };
    let size = 0;
    let frame = 0;
    let last = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const cell = size / CELLS;
      const lz = Math.sqrt(Math.max(0.12, 1 - light.x * light.x - light.y * light.y));
      const norm = Math.hypot(light.x, light.y, lz);
      for (let j = 0; j < CELLS; j++) {
        for (let i = 0; i < CELLS; i++) {
          const u = (((i + 0.5) / CELLS) * 2 - 1) / RADIUS;
          const v = (((j + 0.5) / CELLS) * 2 - 1) / RADIUS;
          const d = u * u + v * v;
          if (d > 1) continue;
          const lit = Math.max(0, (u * light.x + v * light.y + Math.sqrt(1 - d) * lz) / norm);
          ctx.globalAlpha = 0.16 + 0.84 * lit;
          ctx.beginPath();
          ctx.arc((i + 0.5) * cell, (j + 0.5) * cell, cell * (0.08 + 0.4 * lit ** 1.3), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      light.vx += (-STIFFNESS * (light.x - target.x) - DAMPING * light.vx) * dt;
      light.vy += (-STIFFNESS * (light.y - target.y) - DAMPING * light.vy) * dt;
      light.x += light.vx * dt;
      light.y += light.vy * dt;
      draw();
      const settled = Math.abs(light.x - target.x) + Math.abs(light.y - target.y) + Math.abs(light.vx) + Math.abs(light.vy) < 0.002;
      frame = settled ? 0 : requestAnimationFrame(step);
    };
    const wake = () => {
      if (frame || reduce) return;
      last = performance.now();
      frame = requestAnimationFrame(step);
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size = canvas.clientWidth;
      canvas.width = canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#f5f5f7";
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      target.x = Math.max(-0.9, Math.min(0.9, ((e.clientX - r.left) / r.width) * 2 - 1));
      target.y = Math.max(-0.9, Math.min(0.9, ((e.clientY - r.top) / r.height) * 2 - 1));
      wake();
    };
    const onLeave = () => {
      target.x = REST.x;
      target.y = REST.y;
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

  return <canvas ref={ref} aria-hidden className="mx-auto aspect-square w-full max-w-[26rem]" />;
}
