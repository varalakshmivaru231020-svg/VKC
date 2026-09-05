/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Deploys build into a side directory and swap it in (scripts/deploy-server.sh),
  // so the running server never reads a half-written .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  swcMinify: false,
  async redirects() {
    return [
      { source: "/quality-compliance", destination: "/credentials#learning", permanent: true },
      { source: "/registrations", destination: "/credentials#registrations", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000", "vkcgoldikshu.com", "www.vkcgoldikshu.com"] },
  },
  webpack: (config) => {
    config.parallelism = 1;
    return config;
  },
};

export default nextConfig;
