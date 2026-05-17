# Base de données — Schéma `suivi-projets-v1`

PostgreSQL natif (pas d'ORM). Toutes les requêtes passent par `pg` côté backend.

## Ordre canonique des migrations

À exécuter dans cet ordre sur une base **vide** :

| # | Fichier | Rôle |
|---|---|---|
| 1 | `migrations/001_init.sql` | Schéma initial (utilisateur, service, projet, suivi_service, ordre_fabrication, document, historique, vues, triggers de base). |
| 2 | `migrations/002_ordre_fabrication_projet_cascade.sql` | Met la FK `ordre_fabrication.projet_id` en `ON DELETE CASCADE`. |
| 3 | `migrations/003_utilisateur_service.sql` | Ajoute `utilisateur.service_id` (rattachement à un service). |
| 4 | `migrations/004_ai_conversations.sql` | (Optionnel — feature IA, abandonnée). |
| 5 | `migrations/005_drop_ai_conversation.sql` | Supprime les tables IA si `004` a été appliqué. |
| 6 | `migrations/006_cellules_reperes.sql` | Ajoute `cellule_type`, `statut_repere`, table `repere`, colonnes `projet.annee/numero_client/numero_dossier`, trigger d'avancement pondéré. |
| 7 | `migrations/007_adapt_reperes_cellules.sql` | **Destructif** — voir avertissement ci-dessous. |
| 8 | `migrations/008_causes_retard_enum.sql` | Convertit `repere.cause_retard` (TEXT) en ENUM `cause_retard_enum` (14 valeurs du modèle Excel). |
| 9 | `migrations/009_repere_safe_consolidation.sql` | Consolidation idempotente du schéma `repere` (sans DROP). À utiliser en remplacement de `007` sur les environnements avec données. |

## Avertissement sur la migration 007

`007_adapt_reperes_cellules.sql` contient :

```sql
DROP TABLE IF EXISTS repere CASCADE;
DROP TYPE  IF EXISTS statut_repere CASCADE;
```

Ces instructions **suppriment irrémédiablement** les données de `repere` et toutes les contraintes qui en dépendent. La migration référence également un type `nom_cellule` qui n'existe nulle part ailleurs (incohérence connue).

### Stratégie d'exécution

- **Environnement neuf, base vide** : exécuter `001 → 002 → 003 → 005 → 006 → 008 → 009` (skip `004` et `007`). La migration `009` est idempotente et corrigera tout écart.
- **Environnement existant avec données** : **NE PAS exécuter `007`**. Exécuter uniquement `008` puis `009`.
- **Environnement existant où `007` a déjà été appliqué** : exécuter `008` puis `009` pour finaliser.

## Référentiel des causes de retard

La liste des 14 causes de retard est figée et **doit rester synchrone** entre trois emplacements :

- DB : `ENUM cause_retard_enum` (migration `008`)
- Backend : `backend/src/models/causes-retard.ts`
- Frontend : `frontend/src/constants/causesRetard.ts`

Toute évolution de cette liste implique :
1. Nouvelle migration `010_*.sql` avec `ALTER TYPE cause_retard_enum ADD VALUE …` ;
2. Mise à jour synchrone des deux constantes TS.

## Conventions

- Migrations **numérotées et immuables**. Une migration livrée n'est jamais modifiée — toute correction passe par une nouvelle migration.
- Toujours utiliser `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` pour les `CREATE TYPE`.
- Toujours utiliser `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`.
- Tester chaque migration sur un cas nominal **et** un cas d'erreur (cf `.cursorrules`).

## Seeds

- `seeds/seed.sql` : jeu de données de démo complet.
- `seeds/seed_v0_minimal.sql` : utilisateurs admin + service uniquement, pour environnement de recette.
- `seeds/clear_demo_data.sql` : purge des données de démo (préserve les utilisateurs réels).
