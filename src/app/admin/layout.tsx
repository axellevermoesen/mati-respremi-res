import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logoutAction } from "@/lib/actions/auth";

const NAV = [
  { label: "Vue d'ensemble", href: "/admin" },
  { label: "Comptes", href: "/admin/comptes" },
  { label: "Articles", href: "/admin/articles" },
  { label: "Podcast", href: "/admin/podcasts" },
  { label: "Pages", href: "/admin/pages" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (session.user.role !== "ADMIN") redirect("/compte");

  return (
    <div className="flex min-h-screen bg-[var(--surface-page)]">
      <aside className="flex w-[248px] shrink-0 flex-col justify-between bg-green-900 px-5 py-6 text-white">
        <div>
          <div className="font-display text-[17px]">Matières Premières</div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--rose-300,#d698ab)]">
            Administration
          </div>
          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[var(--radius-s)] px-3 py-2.5 text-[14px] font-semibold text-[hsl(45_30%_96%_/_0.85)] hover:bg-[hsl(150_30%_20%)] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-[hsl(45_30%_96%_/_0.15)] pt-4">
          <Link href="/" className="text-[13px] text-[hsl(45_30%_96%_/_0.7)] hover:text-white">
            ← Retour au site
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-left text-[13px] text-[hsl(45_30%_96%_/_0.7)] hover:text-white"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1 px-10 py-8">{children}</div>
    </div>
  );
}
