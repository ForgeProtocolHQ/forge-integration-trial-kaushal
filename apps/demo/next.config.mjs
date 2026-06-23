/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@forge-trial/sdk"],
  // Linting is run as a dedicated CI step via the root flat ESLint config.
  // (Next 14's bundled `next lint` is incompatible with ESLint 9 flat config.)
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
