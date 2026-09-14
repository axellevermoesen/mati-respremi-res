import { InstitutionalPage, getPageMetadata } from "@/components/site/InstitutionalPage";

export const dynamic = "force-dynamic";

const SLUG = "aide/faq";

export async function generateMetadata() {
  return getPageMetadata(SLUG);
}

export default function FaqPage() {
  return <InstitutionalPage slug={SLUG} />;
}
