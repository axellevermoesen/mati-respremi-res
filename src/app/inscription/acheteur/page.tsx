import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AcheteurForm } from "./AcheteurForm";

export const metadata: Metadata = { title: "Inscription acheteur" };

export default async function InscriptionAcheteurPage() {
  const session = await auth();
  if (!session?.user) {
    // Le compte se crée d'abord sur /connexion ; on complète le profil ici.
    redirect("/connexion");
  }
  return <AcheteurForm />;
}
