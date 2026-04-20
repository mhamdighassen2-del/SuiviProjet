# Suivi Projets Industriels

Application web de suivi de projets pour services techniques (Étude, Méthodes, Production, Qualité).

## Stack technique

| Couche | Techno |
|--------|--------|
| Backend | Node.js + Express + TypeScript |
| Base de données | PostgreSQL |
| ORM | Prisma |
| Frontend | React + TypeScript + Vite |
| Auth | JWT |
| Export | PDFKit + ExcelJS |

## Démarrage rapide

```bash
# 1. Base de données
cd database && psql -U postgres -f migrations/001_init.sql

# 2. Backend
cd backend && npm install && cp .env.example .env && npm run dev

# 3. Frontend
cd frontend && npm install && npm run dev
```

## Structure du projet

```
suivi-projets/
├── docs/                    ← Docs techniques & cahier des charges
├── database/
│   ├── migrations/          ← Scripts SQL dans l'ordre (001_, 002_...)
│   └── seeds/               ← Données de test
├── backend/
│   └── src/
│       ├── config/          ← DB, JWT, env
│       ├── models/          ← Types TypeScript (≈ entités)
│       ├── repositories/    ← Accès base de données (SQL/Prisma)
│       ├── services/        ← Logique métier
│       ├── controllers/     ← Handlers HTTP
│       ├── middlewares/     ← Auth, validation, erreurs
│       └── utils/           ← Helpers (pdf, excel, dates...)
└── frontend/
    └── src/
        ├── types/           ← Interfaces TypeScript partagées
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
| `CHEF_PROJET` | Créer/modifier projets |
| `RESPONSABLE_SERVICE` | Modifier suivi de son service |
| `UTILISATEUR` | Lecture seule |

## Liens utiles

- [Modèle de données](./docs/data-model.md)
- [API Routes](./docs/api-routes.md)
- [Règles métier](./docs/business-rules.md)
