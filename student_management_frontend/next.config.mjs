/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow loading images from backend API domain derived from env
    domains: (() => {
      const domains = ['localhost'];
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      try {
        if (apiUrl && apiUrl.startsWith('http')) {
          const { hostname } = new URL(apiUrl);
          if (hostname) domains.push(hostname);
        }
      } catch (_) {
        // ignore invalid URL
      }
      return domains;
    })(),
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
