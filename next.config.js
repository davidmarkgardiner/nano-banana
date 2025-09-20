/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    customKey: 'my-value',
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
}

module.exports = nextConfig