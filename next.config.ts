import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma embarque un binaire natif (query engine) que le bundler ne doit pas
  // empaqueter : on le charge depuis node_modules au moment de l'exécution.
  serverExternalPackages: ["@prisma/client", ".prisma/client", "bcryptjs"],
  experimental: {
    // Par défaut Next.js refuse tout Server Action au-delà de 1 Mo — trop
    // bas pour l'envoi de photos. La limite précise (6 Mo) reste vérifiée
    // dans uploadProducerImage, qui donne un message clair le cas échéant.
    serverActions: { bodySizeLimit: "8mb" },
  },
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
