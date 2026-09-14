import { InstitutionalPage, getPageMetadata } from "@/components/site/InstitutionalPage";

export const dynamic = "force-dynamic";

const SLUG = "legal/cgu";

export async function generateMetadata() {
  return getPageMetadata(SLUG);
}

export default function CguPage() {
  return <InstitutionalPage slug={SLUG} />;
}
