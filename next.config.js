/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server features (Supabase auth middleware, protected routes) require a Node host
  // (e.g. Vercel). Static export to GitHub Pages is not compatible with this setup.
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
