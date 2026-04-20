# API Routes

Base URL : `http://localhost:3000/api`

## Santé

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/health` | Public | Statut API |

---

## Auth

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/auth/login` | Public | Connexion → JWT + utilisateur |
| GET | `/auth/me` | Connecté | Profil courant |

> La déconnexion côté client supprime le JWT du stockage local ; il n’y a pas d’endpoint `POST /auth/logout` côté serveur.

---

## Référentiel

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/services` | Connecté | Liste des services techniques (id, nom, description) |

---

## Utilisateurs

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/utilisateurs` | ADMIN | Liste |
| GET | `/utilisateurs/:id` | ADMIN | Détail |
| POST | `/utilisateurs` | ADMIN | Créer |
| PUT | `/utilisateurs/:id` | ADMIN | Modifier |
| PATCH | `/utilisateurs/:id/desactiver` | ADMIN | Désactiver (soft) |
| PATCH | `/utilisateurs/:id/activer` | ADMIN | Réactiver |
| DELETE | `/utilisateurs/:id` | ADMIN | Suppression définitive (garde-fous métier) |

Les réponses incluent `service_id` / `service_nom` lorsque l’utilisateur est rattaché à un service. Pour `POST` / `PUT`, le champ `service_id` est **obligatoire** si le rôle est `RESPONSABLE_SERVICE`.

---

## Projets

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/projets` | Connecté | Liste (filtres `statut`, `date_debut`, `date_fin`) |
| GET | `/projets/:id` | Connecté | Détail + suivis |
| GET | `/projets/:id/suivis` | Connecté | Suivis du projet |
| GET | `/projets/:id/historique` | Connecté | Journal des modifications liées au projet |
| POST | `/projets` | CHEF_PROJET, ADMIN | Créer |
| PUT | `/projets/:id` | CHEF_PROJET, ADMIN | Modifier |
| DELETE | `/projets/:id` | CHEF_PROJET, ADMIN | Supprimer |

---

## Suivi par service

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/suivis/:id` | Connecté | Détail d’un suivi |
| PUT | `/suivis/:id` | RESPONSABLE_SERVICE (son service), CHEF_PROJET, ADMIN | Mise à jour |
| POST | `/suivis/:id/documents` | RESPONSABLE_SERVICE (son service), CHEF_PROJET, ADMIN | Upload document |

---

## Ordres de Fabrication

Préfixe `/api` (routes montées sous `/api` dans `of.controller`).

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/ofs` | Connecté | Liste des OF |
| GET | `/ofs/en-retard` | Connecté | OF en retard |
| GET | `/ofs/:id` | Connecté | Détail OF |
| PUT | `/ofs/:id` | RESPONSABLE_SERVICE (son service), CHEF_PROJET, ADMIN | Modifier |
| DELETE | `/ofs/:id` | CHEF_PROJET, ADMIN | Supprimer |
| GET | `/suivis/:suiviId/ofs` | Connecté | OF d’un suivi |
| POST | `/suivis/:suiviId/ofs` | RESPONSABLE_SERVICE (son service), CHEF_PROJET, ADMIN | Créer un OF |

---

## Dashboard

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/dashboard/kpis` | Connecté | KPIs (inclut entre autres OF en retard agrégés) |
| GET | `/dashboard/avancement-par-service` | Connecté | Taux moyen par service |

---

## Rapports / Export

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/rapports/projet/:id/pdf` | Connecté | Export PDF projet |
| GET | `/rapports/projet/:id/excel` | Connecté | Export Excel projet |
| GET | `/rapports/ofs/excel` | Connecté | Export Excel des OF |

---

## Codes de réponse

| Code | Signification |
|------|---------------|
| 200 | OK |
| 201 | Créé |
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Ressource introuvable |
| 500 | Erreur serveur |
