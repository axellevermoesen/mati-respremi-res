import { InstitutionalPage, getPageMetadata } from "@/components/site/InstitutionalPage";

export const dynamic = "force-dynamic";

const SLUG = "legal/confidentialite";

export async function generateMetadata() {
  return getPageMetadata(SLUG);
}

export default function ConfidentialitePage() {
  return <InstitutionalPage slug={SLUG} />;
}
