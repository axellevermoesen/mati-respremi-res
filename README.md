# Matières Premières

Marketplace de mise en relation **producteurs ↔ restaurants / revendeurs**, avec
**mutualisation des livraisons** et **vitrine publique** (BtoC) pour chaque
producteur.

## Pile technique

| Rôle | Outil |
|------|-------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styles | Tailwind CSS v4 + design system « Circuit Court » (`src/app/globals.css`) |
| Base de données | PostgreSQL (Supabase) via Prisma *(branché à la tranche 1-2)* |
| Authentification | Auth.js / NextAuth *(tranche 2)* |
| Paiement | Stripe Connect *(tranche 6)* |
| Hébergement | Vercel |

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev -- --port 3100
```

Site : http://localhost:3100
Design system : http://localhost:3100/design-system

## Plan de construction (tranches)

1. **Fondations + design system** ← *en cours*
2. Comptes & connexion (producteur / restaurateur / épicerie)
3. Vitrine : fiches producteurs, carte du réseau, pages BtoC
4. Catalogue produits + fiche produit + recherche
5. Panier + commande (réception & gestion producteur)
6. Paiement en ligne (Stripe)
7. Mutualisation des livraisons
8. Contenu (blog, podcast), pages légales, tests, mise en ligne

## Structure

```
src/
  app/                 pages (App Router)
    globals.css        jetons du design system + base
    page.tsx           accueil
    design-system/     page de référence visuelle
  components/
    ui/                briques réutilisables (Button, Badge, Card, Container)
    site/              en-tête et pied de page publics
  lib/                 utilitaires
public/img/            images de démonstration (issues des maquettes)
prisma/                schéma de données (brouillon)
```
