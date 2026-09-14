import { InstitutionalPage, getPageMetadata } from "@/components/site/InstitutionalPage";

export const dynamic = "force-dynamic";

const SLUG = "legal/mentions";

export async function generateMetadata() {
  return getPageMetadata(SLUG);
}

export default function MentionsPage() {
  return <InstitutionalPage slug={SLUG} />;
}
