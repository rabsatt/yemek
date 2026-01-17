/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Set basePath if deploying to a repo subfolder (e.g., /meal-tracker)
  // basePath: '/meal-tracker',
}

module.exports = nextConfig
