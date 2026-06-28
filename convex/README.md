# `convex/` — backend Convex

Dossier des fonctions et du schéma Convex (migration depuis Postgres/Prisma).
Stratégie complète : [`docs/CONVEX_MIGRATION.md`](../docs/CONVEX_MIGRATION.md).

## Contenu

| Fichier | Rôle | Phase |
|---|---|---|
| `schema.ts` | Schéma des 16 tables applicatives | 0 |
| `convex.config.ts` | Définition de l'app + composants (Better Auth en Phase 4) | 0 / 4 |
| `tsconfig.json` | Config TS dédiée à `convex/` (le CLI Convex l'utilise) | 0 |
| `_generated/` | **Généré** par `npx convex dev` (ne pas éditer ; non présent tant que le déploiement n'existe pas) | 1 |
| `*.ts` (queries/mutations) | Fonctions de données | 1+ |

## Démarrage (à exécuter par un humain — login navigateur requis)

```bash
npx convex dev        # crée le projet Convex Cloud, génère convex/_generated/,
                      # pose CONVEX_DEPLOYMENT + NEXT_PUBLIC_CONVEX_URL dans .env.local
```

⚠️ Tant que `npx convex dev` n'a pas été lancé, `convex/_generated/` n'existe pas :
n'importez `./_generated/*` depuis aucun fichier compilé par le `tsc` racine.
