/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma needs to stay external to the server bundle.
  serverExternalPackages: ["@prisma/client", "prisma"],

  // The village is a static game in public/village; send /village to its page.
  async redirects() {
    return [{ source: "/village", destination: "/village/index.html", permanent: false }];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" }, // no embedding us in iframes (clickjacking)
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
