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
  async redirects() {
    return [
      // www → non-www canonical redirect (prevents duplicate indexing)
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.academyfind.com" }],
        destination: "https://academyfind.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // SEO + Security headers for all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        // Long cache for static assets (images, fonts, icons)
        source: "/(.*)\\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Prevent indexing of API routes
        source: "/api/(.*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
  // Turbopack is the default bundler in Next.js 16.
  // serverExternalPackages above handles firebase-admin externalization natively.
  // Empty turbopack config suppresses the "webpack config found, no turbopack config" warning.
  turbopack: {},
};

export default nextConfig;

