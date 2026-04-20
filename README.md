# Suivi Projets Industriels

Application web pour **piloter des projets techniques** au sein d’une entreprise industrielle : suivre l’avancement par **service** (Étude, Méthodes, Production, Qualité produit), gérer les **ordres de fabrication (OF)** rattachés aux bons services, et offrir des **vues synthétiques** (tableau de bord, rapports PDF/Excel) aux équipes et à la direction.

Ce document explique **à quoi sert chaque partie du projet** et **pourquoi** les choix techniques ont été faits, afin qu’un nouveau développeur ou un chef de projet technique puisse s’y retrouver rapidement.

---

## 1. Objectif métier (le « pourquoi » du produit)

| Besoin | Ce que fait l’application |
|--------|---------------------------|
| Visibilité transverse | Un **projet** regroupe client, dates, responsable et un **statut** global. |
| Suivi par silo technique | Chaque projet a **un suivi par service** (taux, statut, blocages, pièces jointes). |
| Industrialisation | Les **OF** ne concernent que **Méthodes** et **Production** (règle métier réelle : pas d’OF sur l’étude pure ou la qualité « comme un OF »). |
| Traçabilité | Un **historique** des changements liés au projet permet l’audit et le debug métier. |
| Droits différenciés | **Chef de projet / admin** gèrent les projets ; **responsables de service** mettent à jour *leur* suivi et *leurs* OF ; **utilisateurs** consultent. |

Sans ces règles, l’outil serait soit trop générique (Excel partagé), soit incohérent avec le fonctionnement des ateliers et bureaux d’études.

---

## 2. Stack technique et justification

| Couche | Technologie | Pourquoi ce choix |
|--------|-------------|-------------------|
| **Backend** | Node.js + **Express** + **TypeScript** | Écosystème riche, typage pour limiter les erreurs sur un domaine avec beaucoup de règles ; Express reste simple à lire et à maintenir. |
| **Base de données** | **PostgreSQL** | Intégrité référentielle forte, **ENUM**, **triggers**, vues : adapté aux règles métier et au calcul d’avancement côté base. |
| **Accès données** | **SQL natif** via `pg` (**pas d’ORM**) | Contrôle fin des requêtes et des performances ; pas de « magie » cachée pour des agrégats et jointures métier. |
| **Frontend** | **React** + **Vite** + **TypeScript** | UI réactive, build rapide ; TS aligné avec le backend. |
| **État client** | **Zustand** | État global léger (session, thème) sans la verbosité de Redux pour ce périmètre. |
| **HTTP client** | **Axios** | Intercepteurs (JWT), API stable et familière. |
| **Auth** | **JWT** | Stateless pour une API REST ; le client envoie le token à chaque requête. |
| **Exports** | **PDFKit** + **ExcelJS** | Génération de rapports côté serveur, formats demandés en entreprise. |
| **Sécurité HTTP** | **Helmet** + **CORS** configuré | En-têtes de sécurité ; CORS limité au frontend (`FRONTEND_URL`) pour éviter les appels abusifs depuis d’autres origines. |

---

## 3. Architecture backend (3 couches)

Le projet suit une séparation stricte :

```
Requête HTTP → controller → service → repository → PostgreSQL
```

| Couche | Rôle | Pourquoi |
|--------|------|----------|
| **Controller** | Lit `req`, appelle le service, renvoie `res` (JSON, codes HTTP). | **Aucune logique métier** ici : facile à tester et à faire évoluer les routes. |
| **Service** | Règles métier, validations, appels à plusieurs repos si besoin. | Un seul endroit pour les règles (ex. « OF interdit sur Étude » côté app **et** contrainte DB). |
| **Repository** | **Uniquement du SQL** (paramètres `$1`, `$2`…). | Pas de fuite SQL dans les services ; requêtes réutilisables et lisibles. |

Cette structure évite les « gros fichiers » qui mélangent tout et casse les tests unitaires.

---

## 4. Base de données : migrations, seed, règles

### Migrations (`database/migrations/`)

Les scripts sont **numérotés** (`001_`, `002_`, …) et **appliqués dans l’ordre** :

| Fichier | Contenu |
|---------|---------|
| `001_init.sql` | Schéma complet : types ENUM, tables, index, **triggers** (avancement projet, validation OF, statut projet). |
| `002_ordre_fabrication_projet_cascade.sql` | Comportement **ON DELETE** des OF par rapport au projet (cohérence à la suppression). |
| `003_utilisateur_service.sql` | Colonne `service_id` sur `utilisateur` pour rattacher un **responsable de service** à un service. |

**Pourquoi ne pas modifier une migration déjà appliquée ?** En équipe, on ajoute une **nouvelle** migration pour ne pas casser les environnements déjà déployés.

### Seed (`database/seeds/seed.sql`)

Données de **développement / démo** : utilisateurs, projets, suivis, OF. Les mots de passe de test sont **hachés** (bcrypt) ; le commentaire dans le seed indique le mot de passe clair utilisé en local (ex. comptes de démo).

### Règles importantes en base (résumé)

- **`projet.taux_avancement`** : recalculé par **trigger** à partir de la moyenne des `suivi_service.taux_avancement` — on ne le modifie pas à la main dans le code applicatif.
- **Un seul suivi** par couple `(projet × service)` — contrainte `UNIQUE`.
- **OF** : trigger empêchant l’insertion sur un suivi qui n’est pas **Méthodes** ou **Production**.

Le détail : [docs/business-rules.md](./docs/business-rules.md) et [docs/data-model.md](./docs/data-model.md).

---

## 5. Authentification et rôles

- **Login** : `POST /api/auth/login` avec email + mot de passe → **JWT** + profil utilisateur.
- **Session** : `GET /api/auth/me` avec le token (header `Authorization: Bearer …`).
- **Déconnexion** : côté client uniquement (suppression du token) — pas de liste noire serveur dans ce projet (simple et suffisant pour beaucoup de déploiements internes).

### Rôles

| Rôle | Intérêt |
|------|---------|
| `ADMIN` | Gestion des utilisateurs, accès large. |
| `CHEF_PROJET` | Création / modification / suppression des projets. |
| `RESPONSABLE_SERVICE` | Modifier suivi et OF **uniquement pour son service** (`service_id` sur l’utilisateur). |
| `UTILISATEUR` | Consultation. |

Les **mots de passe** ne sont jamais renvoyés par l’API ; seuls des **hash bcrypt** sont stockés — **impossible** de « afficher les mots de passe » en admin ; seule la **réinitialisation** est possible.

---

## 6. Structure des dossiers

```
suivi-projets/
├── docs/                    # Cahier des charges technique, modèle de données, routes API, règles métier
├── database/
│   ├── migrations/          # Schéma versionné (ordre strict)
│   └── seeds/               # Données de test
├── docker-compose.yml       # PostgreSQL isolé pour le dev (port 5433)
├── backend/
│   ├── .env / .env.example  # Configuration locale (non versionné : copier depuis .env.example)
│   ├── scripts/             # create DB, migrations, seed, vérification connexion
│   └── src/
│       ├── config/          # DB, env, CORS, JWT
│       ├── models/          # Types / DTO TypeScript
│       ├── repositories/    # SQL uniquement
│       ├── services/        # Logique métier
│       ├── controllers/     # Routes Express
│       ├── middlewares/     # auth (JWT), rôles
│       └── utils/           # PDF, Excel, helpers
└── frontend/
    └── src/
        ├── types/           # Alignés sur l’API
        ├── services/        # Appels HTTP (Axios)
        ├── stores/          # Zustand (auth, thème)
        ├── components/      # UI réutilisable
        └── pages/           # Une page ≈ une route
```

**Pourquoi `docs/` à la racine ?** Centraliser ce qui est **stable** et lisible hors code (métier, contrat d’API).  
**Pourquoi séparer `services/` frontend et backend ?** Le backend = logique métier ; le frontend = **services API** = client HTTP — même nom, responsabilités différentes.

---

## 7. Variables d’environnement (backend)

Copier `backend/.env.example` vers `backend/.env` et adapter.

| Variable | Rôle |
|----------|------|
| `PORT` | Port d’écoute de l’API (souvent `3000`). |
| `DB_*` | Connexion PostgreSQL — **doit** correspondre au mot de passe du rôle `postgres` (ou au conteneur Docker). |
| `JWT_SECRET` | Signature des tokens — **à changer en production** (longueur suffisante). |
| `JWT_EXPIRES_IN` | Durée de vie du token (ex. `8h`). |
| `FRONTEND_URL` | Origine autorisée pour **CORS** (ex. `http://localhost:5173`). |
| `UPLOAD_DIR`, `MAX_FILE_SIZE_MB` | Stockage des pièces jointes des suivis. |

---

## 8. Démarrage rapide

### Prérequis

- **Node.js** (LTS recommandé)
- **PostgreSQL** installé localement **ou** **Docker** pour lancer la base fournie

### 8.1. Base PostgreSQL

**Option A — PostgreSQL local**  
Le mot de passe du rôle `postgres` doit être le même que `DB_PASSWORD` dans `backend/.env`.  
Si la connexion échoue : `cd backend && npm run setup:db-password` (saisie une fois), puis `npm run db:verify`.

**Option B — Docker**  
À la racine : `docker compose up -d`  
Puis dans `backend/.env` : `DB_PORT=5433` et `DB_PASSWORD=postgres` (voir `docker-compose.yml` — **port 5433** pour éviter le conflit avec un PostgreSQL déjà installé sur 5432).

### 8.2. Installation et schéma

```bash
cd backend
npm install
npm run db:setup
```

**Pourquoi `db:setup` ?** Crée la base si besoin, enchaîne migrations `001` → `002` → `003` + seed.  
Équivalent manuel : `npm run db:create` puis `db:migrate`, `db:migrate:002`, `db:migrate:003`, `db:seed` (voir `backend/package.json`).

### 8.3. Lancer l’API

```bash
cd backend
npm run dev
```

Santé : `GET http://localhost:3000/health`

### 8.4. Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

Ouvrir **http://localhost:5173** — l’API est attendue sur **http://localhost:3000** (proxy ou URL configurée dans les services frontend).

---

## 9. Documentation API et métier

| Document | Contenu |
|----------|---------|
| [docs/api-routes.md](./docs/api-routes.md) | Liste des routes, méthodes, droits. |
| [docs/data-model.md](./docs/data-model.md) | Entités, champs, relations. |
| [docs/business-rules.md](./docs/business-rules.md) | Calculs d’avancement, statuts, OF, contraintes. |

---

## 10. Conventions de développement (résumé)

Le fichier `.cursorrules` à la racine résume les règles pour l’IA et les humains :

- Repositories SQL uniquement ; paramètres liés (`$1`, `$2`…).
- Pas de `any` sauf exception justifiée côté frontend.
- Nouvelles évolutions de schéma : **nouvelle migration**, pas modification de l’ancienne.

---

## 11. Limites assumées (bon à savoir)

- **Pas de logout serveur** : révocation de token non gérée (JWT jusqu’à expiration).
- **Pas d’ORM** : migrations et requêtes SQL à maintenir explicitement — gain en clarté sur les perfs et les jointures métier.
- **Environnement de dev** : secrets dans `.env` (ne pas commiter le fichier réel).

---

## 12. Liens utiles

- [Modèle de données](./docs/data-model.md)
- [Routes API](./docs/api-routes.md)
- [Règles métier](./docs/business-rules.md)

---

*README aligné sur l’état du dépôt ; en cas de divergence, les fichiers de code et `database/migrations/` font foi.*
