import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { MobileNav } from "@/components/site/MobileNav";
import { cn } from "@/lib/cn";

const NAV = [
  { label: "Catalogue", href: "/catalogue" },
  { label: "Producteurs", href: "/producteurs" },
  { label: "Réseau", href: "/reseau" },
  { label: "Blog", href: "/blog" },
  { label: "Podcast", href: "/podcast" },
  { label: "Contact", href: "/contact" },
];

export async function SiteHeader({ fluid = false }: { fluid?: boolean } = {}) {
  const session = await auth();

  const isBuyer =
    session?.user?.role === "RESTAURANT" || session?.user?.role === "RESELLER";
  let cartCount = 0;
  if (isBuyer) {
    const agg = await withRetry(() =>
      prisma.cartItem.aggregate({
        where: { cart: { buyer: { userId: session!.user.id } } },
        _sum: { quantity: true },
      }),
    ).catch(() => null);
    cartCount = agg?._sum.quantity ?? 0;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[hsl(45_30%_98%_/_0.85)] backdrop-blur-[10px]">
      <div
        className={cn(
          "flex w-full items-center justify-between gap-4 py-4",
          fluid ? "px-5" : "mx-auto max-w-[var(--container-max)] px-[var(--container-pad)]",
        )}
      >
        <div className="flex min-w-0 shrink items-center gap-7">
          <Link
            href="/"
            className="shrink-0 font-display text-[16px] leading-[1.15] tracking-[var(--tracking-tight)] text-green-900 sm:text-[18px] sm:leading-normal"
          >
            Matières<br className="sm:hidden" /> Premières
          </Link>
          <nav className="hidden items-center gap-[18px] md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="mp-nav-link whitespace-nowrap">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {session?.user ? (
            <>
              {isBuyer && (
                <Link
                  href="/panier"
                  className="relative flex h-9 items-center gap-2 rounded-[var(--radius-m)] px-3 text-[13px] font-semibold text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-default)] hover:bg-[var(--surface-sunken)]"
                >
                  Panier
                  {cartCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              <Button href="/compte" variant="outline" size="sm">
                Mon compte
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" size="sm" className="hidden! md:inline-flex!">
                  Se déconnecter
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button
                href="/connexion"
                variant="outline"
                size="sm"
                className="hidden! md:inline-flex!"
              >
                Espace producteur
              </Button>
              <Button href="/connexion" size="sm">
                Espace acheteur
              </Button>
            </>
          )}
          <MobileNav navItems={NAV} loggedIn={Boolean(session?.user)} logoutAction={logoutAction} />
        </div>
      </div>
    </header>
  );
}
