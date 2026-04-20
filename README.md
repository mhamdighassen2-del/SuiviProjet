# Suivi Projets Industriels

Application web de suivi de projets pour services techniques (Étude, Méthodes, Production, Qualité).

## Stack technique

| Couche | Techno |
|--------|--------|
| Backend | Node.js + Express + TypeScript |
| Base de données | PostgreSQL |
| Accès données | SQL natif via `pg` (pas d’ORM) |
| Frontend | React + TypeScript + Vite + Zustand + Axios |
| Auth | JWT |
| Export | PDFKit + ExcelJS |

## Démarrage rapide

**PostgreSQL** : le mot de passe du rôle `postgres` doit être le même que dans `backend/.env` (`DB_PASSWORD`). Si la connexion échoue, dans `backend` exécutez **`npm run setup:db-password`** (saisie du mot de passe une fois), puis **`npm run db:verify`**.  
Alternative : [Docker Desktop](https://www.docker.com/products/docker-desktop/) puis à la racine du projet **`docker compose up -d`**, et dans `backend/.env` : `DB_PORT=5433` et `DB_PASSWORD=postgres`.

```bash
# 1. Base de données (schéma + FK OF → projet + rattachement utilisateur/service, puis données de test)
cd backend && npm install && npm run db:setup

# Ou manuellement depuis database/ :
# psql -U postgres -f migrations/001_init.sql
# psql -U postgres -f migrations/002_ordre_fabrication_projet_cascade.sql
# psql -U postgres -f migrations/003_utilisateur_service.sql
# psql -U postgres -f seeds/seed.sql

# 2. Backend — copier .env (voir backend/.env.example si présent)
cd backend && npm run dev

# 3. Frontend
cd frontend && npm install && npm run dev
```

Ouvrir `http://localhost:5173` (API : `http://localhost:3000`).

## Structure du projet

```
suivi-projets/
├── docs/                    ← Docs techniques & cahier des charges
├── database/
│   ├── migrations/          ← Scripts SQL dans l'ordre (001_, 002_...)
│   └── seeds/               ← Données de test
├── backend/
│   └── src/
│       ├── config/          ← DB, JWT, env, CORS
│       ├── models/          ← Types TypeScript
│       ├── repositories/    ← Requêtes SQL uniquement
│       ├── services/        ← Logique métier
│       ├── controllers/     ← Handlers HTTP
│       ├── middlewares/     ← Auth, validation
│       └── utils/           ← PDF, Excel, dates...
└── frontend/
    └── src/
        ├── types/           ← Interfaces TypeScript
        ├── services/        ← Appels API
        ├── stores/          ← État global (Zustand)
        ├── hooks/           ← Custom hooks
        ├── components/      ← Composants réutilisables
        └── pages/           ← Pages = routes
```

## Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| `ADMIN` | Tout |
| `CHEF_PROJET` | Créer/modifier/supprimer projets |
| `RESPONSABLE_SERVICE` | Modifier suivi / OF de **son** service |
| `UTILISATEUR` | Lecture seule |

## Liens utiles

- [Modèle de données](./docs/data-model.md)
- [API Routes](./docs/api-routes.md)
- [Règles métier](./docs/business-rules.md)
