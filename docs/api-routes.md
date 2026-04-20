# API Routes

Base URL : `http://localhost:3000/api`

## Auth
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/auth/login` | Public | Connexion → retourne JWT |
| POST | `/auth/logout` | Connecté | Invalide le token |
| GET | `/auth/me` | Connecté | Profil courant |

---

## Utilisateurs
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/utilisateurs` | ADMIN | Liste tous les utilisateurs |
| POST | `/utilisateurs` | ADMIN | Créer un utilisateur |
| PUT | `/utilisateurs/:id` | ADMIN | Modifier |
| DELETE | `/utilisateurs/:id` | ADMIN | Désactiver (soft delete) |

---

## Projets
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/projets` | Connecté | Liste avec filtres (statut, service, période) |
| GET | `/projets/:id` | Connecté | Détail complet |
| POST | `/projets` | CHEF_PROJET+ | Créer |
| PUT | `/projets/:id` | CHEF_PROJET+ | Modifier |
| DELETE | `/projets/:id` | ADMIN | Supprimer |
| GET | `/projets/:id/historique` | Connecté | Journal des modifications |

---

## Suivi par service
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/projets/:id/suivis` | Connecté | Tous les suivis d'un projet |
| GET | `/suivis/:id` | Connecté | Détail d'un suivi |
| PUT | `/suivis/:id` | RESPONSABLE_SERVICE+ | Mettre à jour avancement, commentaire, blocage |
| POST | `/suivis/:id/documents` | RESPONSABLE_SERVICE+ | Uploader un document |

---

## Ordres de Fabrication
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/suivis/:suiviId/ofs` | Connecté | OFs d'un suivi |
| POST | `/suivis/:suiviId/ofs` | RESPONSABLE_SERVICE+ | Créer un OF |
| GET | `/ofs/:id` | Connecté | Détail OF |
| PUT | `/ofs/:id` | RESPONSABLE_SERVICE+ | Modifier |
| DELETE | `/ofs/:id` | CHEF_PROJET+ | Supprimer |
| GET | `/ofs/en-retard` | Connecté | OF dont date_fin_prevue < aujourd'hui |

---

## Dashboard
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/dashboard/kpis` | Connecté | Compteurs globaux |
| GET | `/dashboard/avancement-par-service` | Connecté | Taux moyen par service |
| GET | `/dashboard/ofs-en-retard` | Connecté | Liste OF en retard |

---

## Rapports / Export
| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/rapports/projet/:id/pdf` | Connecté | Export PDF d'un projet |
| GET | `/rapports/projet/:id/excel` | Connecté | Export Excel |
| GET | `/rapports/service/:nom/pdf` | Connecté | Rapport par service |
| GET | `/rapports/ofs/excel` | Connecté | Export OF |

---

## Codes de réponse

| Code | Signification |
|------|---------------|
| 200 | OK |
| 201 | Créé |
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Non autorisé (rôle insuffisant) |
| 404 | Ressource introuvable |
| 500 | Erreur serveur |
