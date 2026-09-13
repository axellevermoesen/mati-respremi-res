import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { ProducerNav } from "@/components/site/ProducerNav";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

/**
 * Pour un producteur connecté, on enveloppe toutes les pages `/compte/*` avec le
 * menu latéral persistant. Le menu ne se recharge pas d'une page à l'autre.
 * Pour un acheteur (ou visiteur), on ne touche à rien : chaque page garde son
 * propre en-tête de site.
 */
export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (session?.user?.role === "PRODUCER") {
    const profile = await withRetry(() =>
      prisma.producerProfile.findUnique({
        where: { userId: session.user.id },
        select: { farmName: true, region: true, city: true, logoUrl: true },
      }),
    );

    if (profile) {
      const location = [profile.city, profile.region].filter(Boolean).join(" · ");
      return (
        <>
          <SiteHeader />
          <div className="flex flex-col bg-[var(--surface-page)] lg:min-h-[calc(100vh-65px)] lg:flex-row">
            <ProducerNav
              farmName={profile.farmName}
              location={location || undefined}
              avatarUrl={profile.logoUrl}
            />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
          <SiteFooter />
        </>
      );
    }
  }

  return <>{children}</>;
}
