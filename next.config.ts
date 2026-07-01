import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rarpjbxudomeelcfmnjw.supabase.co",
      },
    ],
  },
};

export default nextConfig;