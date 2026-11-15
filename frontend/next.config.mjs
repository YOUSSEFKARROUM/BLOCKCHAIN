/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dossier de sortie : .next par défaut. NEXT_DIST_DIR permet de lancer `next build` à côté d'un
  // `next dev` en cours sans écraser ses fichiers (ex. NEXT_DIST_DIR=.next-build npm run build).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
