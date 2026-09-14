import { InstitutionalPage, getPageMetadata } from "@/components/site/InstitutionalPage";

export const dynamic = "force-dynamic";

const SLUG = "ressources";

export async function generateMetadata() {
  return getPageMetadata(SLUG);
}

export default function RessourcesPage() {
  return <InstitutionalPage slug={SLUG} />;
}
