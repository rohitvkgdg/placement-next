import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for bare-metal / Docker deployment
  output: "standalone",

  // Ensure Prisma runtime files are included in standalone output
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/.prisma/**/*",
      "./node_modules/@prisma/**/*",
    ],
  },

  // Move serverComponentsExternalPackages to the correct location
  serverExternalPackages: ["nodemailer", "@prisma/client", "@aws-sdk/client-s3"],

  // Image optimization — allow any https source (covers R2, CDN, Google avatars)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },

  // Performance
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
