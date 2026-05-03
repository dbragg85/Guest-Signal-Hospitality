/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for GitHub Pages (guestsignalhospitality.com).
  // No server middleware — portal auth is enforced in the browser + Supabase RLS.
  // Do not use default <Link prefetch> to /services/inquiry/* — use ServicesIntakeLink (no RSC flight on Pages).
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
