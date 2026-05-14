import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* Allow Next.js <Image> to optimise Google profile photos.
       Member card avatars use plain <img> tags (unknown external domains),
       so they don't need entries here. */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
