import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Matières Premières — Producteurs × Restaurants",
    template: "%s · Matières Premières",
  },
  description:
    "La marketplace qui mutualise les commandes et les livraisons entre producteurs et restaurants indépendants.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        {/*
          Polices chargées via lien Google Fonts (et non next/font) : le build
          ne dépend plus d'un accès réseau, et le navigateur retombe sur les
          polices système si Google Fonts est injoignable.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
