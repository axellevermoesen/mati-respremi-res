import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProducteurForm } from "./ProducteurForm";

export const metadata: Metadata = { title: "Inscription producteur" };

export default async function InscriptionProducteurPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (session.user.role !== "PRODUCER") redirect("/compte");
  return <ProducteurForm />;
}
