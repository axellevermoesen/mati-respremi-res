import { InstitutionalPage, getPageMetadata } from "@/components/site/InstitutionalPage";

export const dynamic = "force-dynamic";

const SLUG = "a-propos";

export async function generateMetadata() {
  return getPageMetadata(SLUG);
}

export default function AProposPage() {
  return <InstitutionalPage slug={SLUG} />;
}
