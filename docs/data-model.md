# Modèle de données

## Entités & attributs

### `utilisateur`
| Champ | Type | Contrainte |
|-------|------|-----------|
| id | UUID | PK |
| nom | VARCHAR(100) | NOT NULL |
| prenom | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | NOT NULL UNIQUE |
| mot_de_passe_hash | TEXT | NOT NULL |
| role | ENUM | `ADMIN \| CHEF_PROJET \| RESPONSABLE_SERVICE \| UTILISATEUR` |
| actif | BOOLEAN | DEFAULT true |
| cree_le | TIMESTAMP | DEFAULT NOW() |

---

### `service`
Données fixes — les 4 services de l'entreprise.

| Champ | Type | Contrainte |
|-------|------|-----------|
| id | UUID | PK |
| nom | ENUM | `ETUDE \| METHODES \| PRODUCTION \| QUALITE_PRODUIT` |
| description | TEXT | nullable |

---

### `projet`
| Champ | Type | Contrainte |
|-------|------|-----------|
| id | UUID | PK |
| reference | VARCHAR(50) | NOT NULL UNIQUE |
| nom | VARCHAR(255) | NOT NULL |
| client | VARCHAR(255) | NOT NULL |
| date_debut | DATE | NOT NULL |
| date_fin_prevue | DATE | NOT NULL |
| date_fin_reelle | DATE | nullable |
| responsable_id | UUID | FK → utilisateur |
| statut | ENUM | `NON_DEMARRE \| EN_COURS \| EN_RETARD \| TERMINE` |
| taux_avancement | SMALLINT | 0-100, calculé automatiquement |
| cree_le | TIMESTAMP | DEFAULT NOW() |
| mis_a_jour_le | TIMESTAMP | DEFAULT NOW() |

> **Calcul automatique** : `taux_avancement = AVG(suivi_service.taux_avancement)` via trigger PostgreSQL.

---

### `suivi_service`
Table pivot entre `projet` et `service`. Un enregistrement par combinaison (projet × service).

| Champ | Type | Contrainte |
|-------|------|-----------|
| id | UUID | PK |
| projet_id | UUID | FK → projet |
| service_id | UUID | FK → service |
| responsable_id | UUID | FK → utilisateur, nullable |
| taux_avancement | SMALLINT | 0-100 |
| date_debut_reelle | DATE | nullable |
| date_fin_reelle | DATE | nullable |
| commentaire | TEXT | nullable |
| blocage | TEXT | nullable |
| statut | ENUM | `NON_DEMARRE \| EN_COURS \| BLOQUE \| TERMINE` |
| mis_a_jour_le | TIMESTAMP | DEFAULT NOW() |

> **Contrainte UNIQUE** : `(projet_id, service_id)` — un seul suivi par service par projet.

---

### `ordre_fabrication`
⚠️ **Uniquement pour les services METHODES et PRODUCTION.**

| Champ | Type | Contrainte |
|-------|------|-----------|
| id | UUID | PK |
| numero_of | VARCHAR(50) | NOT NULL UNIQUE |
| suivi_service_id | UUID | FK → suivi_service |
| projet_id | UUID | FK → projet |
| designation | VARCHAR(255) | NOT NULL |
| date_lancement | DATE | NOT NULL |
| date_fin_prevue | DATE | NOT NULL |
| date_fin_reelle | DATE | nullable |
| etat | ENUM | `PLANIFIE \| EN_COURS \| SUSPENDU \| TERMINE` |
| taux_avancement | SMALLINT | 0-100 |
| commentaire | TEXT | nullable |
| cree_le | TIMESTAMP | DEFAULT NOW() |

> **Trigger de validation** : vérifie que `suivi_service.service.nom IN ('METHODES', 'PRODUCTION')` à chaque INSERT/UPDATE.

---

### `document`
| Champ | Type | Contrainte |
|-------|------|-----------|
| id | UUID | PK |
| suivi_service_id | UUID | FK → suivi_service |
| nom_fichier | VARCHAR(255) | NOT NULL |
| chemin_stockage | TEXT | NOT NULL |
| type_mime | VARCHAR(100) | nullable |
| uploade_par | UUID | FK → utilisateur |
| uploade_le | TIMESTAMP | DEFAULT NOW() |

---

### `historique`
Log immutable de toutes les modifications.

| Champ | Type | Contrainte |
|-------|------|-----------|
| id | UUID | PK |
| utilisateur_id | UUID | FK → utilisateur |
| table_cible | VARCHAR(100) | NOT NULL |
| entite_id | UUID | NOT NULL |
| action | VARCHAR(20) | `INSERT \| UPDATE \| DELETE` |
| ancienne_valeur | JSONB | nullable |
| nouvelle_valeur | JSONB | nullable |
| cree_le | TIMESTAMP | DEFAULT NOW() |

---

## Relations

```
utilisateur ──< projet          (1 utilisateur dirige N projets)
utilisateur ──< suivi_service   (1 utilisateur est responsable de N suivis)
projet      ──< suivi_service   (1 projet a N suivis, 1 par service)
service     ──< suivi_service   (1 service apparaît dans N suivis)
suivi_service ──< ordre_fabrication  (1 suivi a N OF — Méthodes/Production seulement)
suivi_service ──< document      (1 suivi a N documents)
utilisateur ──< historique      (1 utilisateur génère N entrées)
```
