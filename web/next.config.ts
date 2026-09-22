import type { NextConfig } from "next";

// The browser only ever talks to this Next.js origin. Requests to /api/* are
// forwarded server-side to the real backend, so the auth cookie the backend
// sets is first-party to the browser (not cross-site), which keeps browsers
// like Safari/Chrome from silently dropping it as a third-party cookie.
const BACKEND_ORIGIN = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
