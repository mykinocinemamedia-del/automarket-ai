import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles build output natively; standalone is for Docker/custom servers
  output: "standalone",
  // Allow images from common social/CDN domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
