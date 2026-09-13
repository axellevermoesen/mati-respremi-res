import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma embarque un binaire natif (query engine) que le bundler ne doit pas
  // empaqueter : on le charge depuis node_modules au moment de l'exécution.
  serverExternalPackages: ["@prisma/client", ".prisma/client", "bcryptjs"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fbldigvbtkmfsxmwibyt.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
