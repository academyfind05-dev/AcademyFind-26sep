import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling these — they must use native Node.js require/ESM
  // firebase-admin uses jose (ESM-only) via jwks-rsa — bundling it causes ERR_REQUIRE_ESM on Vercel
  serverExternalPackages: [
    "firebase-admin",
    "firebase-admin/app",
    "firebase-admin/auth",
    "firebase-admin/database",
    "firebase-admin/firestore",
    "firebase-admin/messaging",
    "firebase-admin/storage",
    "jose",
    "jwks-rsa",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "places.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.postimg.cc",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/educator/:path*",
        destination: "/institute/:path*",
      },
    ];
  },
  // Webpack: also externalize at the bundler level for belt-and-suspenders
  // This prevents the ERR_REQUIRE_ESM error from jose (used inside firebase-admin)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []),
        "firebase-admin",
        "firebase-admin/app",
        "firebase-admin/auth",
        "firebase-admin/database",
        "firebase-admin/firestore",
        "firebase-admin/messaging",
        "firebase-admin/storage",
        "jose",
        "jwks-rsa",
      ];
    }
    return config;
  },
};

export default nextConfig;
