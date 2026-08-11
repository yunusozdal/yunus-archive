import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rarpjbxudomeelcfmnjw.supabase.co",
      },
      {
        protocol: "https",
        hostname: "pub-a27a390d0b304b77b6605f881b23418c.r2.dev",
      },
    ],
  },
};

export default nextConfig;
