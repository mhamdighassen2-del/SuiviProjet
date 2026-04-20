# Règles métier

## Calcul automatique de l'avancement projet

`projet.taux_avancement = MOYENNE(suivi_service.taux_avancement)`

- Déclenché par un **trigger PostgreSQL** à chaque UPDATE sur `suivi_service`.
- Le backend n'a pas à calculer cette valeur manuellement.

---

## Statut du projet

| Condition | Statut automatique |
|-----------|-------------------|
| Aucun suivi démarré | `NON_DEMARRE` |
| Au moins un suivi en cours | `EN_COURS` |
| `EN_COURS` ET `date_fin_prevue < aujourd'hui` | `EN_RETARD` |
| Tous les suivis à 100% | `TERMINE` |

Géré par trigger sur `projet` et recalcul depuis le service.

---

## Ordres de Fabrication (OF)

- **Restriction service** : les OF ne peuvent être créés que pour les services `METHODES` et `PRODUCTION`. Toute tentative sur `ETUDE` ou `QUALITE_PRODUIT` → erreur 400.
- **OF en retard** : `date_fin_prevue < CURRENT_DATE AND etat != 'TERMINE'`
- Le `taux_avancement` d'un suivi Méthodes/Production **peut** être calculé comme la moyenne des OF associés (optionnel, configurable).

---

## Droits d'accès par action

| Action | UTILISATEUR | RESPONSABLE_SERVICE | CHEF_PROJET | ADMIN |
|--------|:-----------:|:-------------------:|:-----------:|:-----:|
| Voir projets | ✅ | ✅ | ✅ | ✅ |
| Créer projet | ❌ | ❌ | ✅ | ✅ |
| Modifier projet | ❌ | ❌ | ✅ | ✅ |
| Modifier suivi | ❌ | ✅ (son service) | ✅ | ✅ |
| Créer OF | ❌ | ✅ (son service) | ✅ | ✅ |
| Gérer utilisateurs | ❌ | ❌ | ❌ | ✅ |
| Exporter rapports | ✅ | ✅ | ✅ | ✅ |

> Un `RESPONSABLE_SERVICE` ne peut modifier que les suivis du service auquel il est rattaché.

---

## Contraintes de dates

- `date_debut <= date_fin_prevue` (validation à la création).
- `date_fin_reelle` ne peut être renseignée que si `statut = 'TERMINE'`.
- Un OF ne peut pas avoir une `date_lancement` antérieure à `projet.date_debut`.

---

## Historique

- Toute modification sur `projet`, `suivi_service`, `ordre_fabrication` génère une entrée dans `historique`.
- L'historique est **en lecture seule** — aucun endpoint DELETE/PUT.
- Stocké en JSONB : `ancienne_valeur` et `nouvelle_valeur` contiennent l'objet complet avant/après.
