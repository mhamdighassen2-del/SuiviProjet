// ============================================================
//  types/models.ts  —  Copie des types partagés
//  (identique à backend/src/models/types.ts)
// ============================================================

export type RoleUtilisateur =
    | 'ADMIN' | 'CHEF_PROJET' | 'RESPONSABLE_SERVICE' | 'UTILISATEUR';

export type StatutProjet =
    | 'NON_DEMARRE' | 'EN_COURS' | 'EN_RETARD' | 'TERMINE';

export type NomService =
    | 'ETUDE' | 'METHODES' | 'PRODUCTION' | 'QUALITE_PRODUIT';

export type StatutSuivi =
    | 'NON_DEMARRE' | 'EN_COURS' | 'BLOQUE' | 'TERMINE';

export type EtatOF =
    | 'PLANIFIE' | 'EN_COURS' | 'SUSPENDU' | 'TERMINE';

export interface Utilisateur {
    id: string; nom: string; prenom: string;
    email: string; role: RoleUtilisateur; actif: boolean; cree_le: string;
}

export interface Service {
    id: string; nom: NomService; description?: string;
}

export interface Projet {
    id: string; reference: string; nom: string; client: string;
    date_debut: string; date_fin_prevue: string; date_fin_reelle?: string;
    responsable_id: string; responsable?: Utilisateur;
    statut: StatutProjet; taux_avancement: number;
    suivis?: SuiviService[]; cree_le: string; mis_a_jour_le: string;
}

export interface SuiviService {
    id: string; projet_id: string; service_id: string; service?: Service;
    responsable_id?: string; responsable?: Utilisateur;
    taux_avancement: number; date_debut_reelle?: string; date_fin_reelle?: string;
    commentaire?: string; blocage?: string; statut: StatutSuivi;
    ordres_fabrication?: OrdreFabrication[]; mis_a_jour_le: string;
}

export interface OrdreFabrication {
    id: string; numero_of: string; suivi_service_id: string; projet_id: string;
    designation: string; date_lancement: string; date_fin_prevue: string;
    date_fin_reelle?: string; etat: EtatOF; taux_avancement: number;
    commentaire?: string; cree_le: string; jours_retard?: number;
}

export interface DashboardKPIs {
    total_projets: number; projets_en_cours: number;
    projets_en_retard: number; projets_termines: number;
    taux_avancement_global: number; ofs_en_retard: number;
    avancement_par_service: { service: NomService; taux_moyen: number }[];
}

// DTOs
export interface CreateProjetDTO {
    reference: string; nom: string; client: string;
    date_debut: string; date_fin_prevue: string; responsable_id: string;
}
export interface UpdateProjetDTO {
    nom?: string; client?: string; date_fin_prevue?: string;
    responsable_id?: string; statut?: StatutProjet;
}
export interface UpdateSuiviDTO {
    taux_avancement?: number;
    /** yyyy-mm-dd ou null pour effacer */
    date_debut_reelle?: string | null;
    date_fin_reelle?: string | null;
    commentaire?: string; blocage?: string; statut?: StatutSuivi;
}
export interface CreateOFDTO {
    numero_of: string; designation: string;
    date_lancement: string; date_fin_prevue: string; commentaire?: string;
}
export interface UpdateOFDTO {
    designation?: string; date_fin_prevue?: string; date_fin_reelle?: string;
    etat?: EtatOF; taux_avancement?: number; commentaire?: string;
}

export interface CreateUtilisateurDTO {
    nom: string;
    prenom: string;
    email: string;
    mot_de_passe: string;
    role: RoleUtilisateur;
}

export interface UpdateUtilisateurDTO {
    nom?: string;
    prenom?: string;
    email?: string;
    mot_de_passe?: string;
    role?: RoleUtilisateur;
    actif?: boolean;
}
