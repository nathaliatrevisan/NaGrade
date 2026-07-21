import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos de perfil ficam no Storage do Supabase
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
