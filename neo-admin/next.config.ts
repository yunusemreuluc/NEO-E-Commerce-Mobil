/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Sadece domain bazlı izinler
    domains: [
      "picsum.photos",
      "res.cloudinary.com",
      "localhost",
      "192.168.137.1", // 🔴 PC'nin LAN IP'si (kendine göre değiştir)
    ],

    // Daha güvenli ve net tanım (uploads için)
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "192.168.137.1", // 🔴 aynı IP
        port: "4000",
        pathname: "/uploads/**",
      },
    ],
    
    // Güvenlik ayarlarını gevşet (sadece development için)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    // Loader'ı devre dışı bırak
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Development modunda güvenlik kontrollerini gevşet
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      allowedRevalidateHeaderKeys: ['*'],
    },
  }),
};

module.exports = nextConfig;
