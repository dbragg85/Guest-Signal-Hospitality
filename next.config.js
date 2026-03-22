/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for GitHub Pages (guestsignalhospitality.com).
  // No server middleware — portal auth is enforced in the browser + Supabase RLS.
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
