// ============================================================
//  types/models.ts  —  Interfaces TypeScript (miroir du schéma DB)
// ============================================================

import type { CauseRetard } from './causes-retard';

export type { CauseRetard };

// --- Énumérations -------------------------------------------

export type RoleUtilisateur =
    | 'ADMIN'
    | 'CHEF_PROJET'
    | 'RESPONSABLE_SERVICE'
    | 'UTILISATEUR';

export type StatutProjet =
    | 'NON_DEMARRE'
    | 'EN_COURS'
    | 'EN_RETARD'
    | 'TERMINE';

export type NomService =
    | 'ETUDE'
    | 'METHODES'
    | 'PRODUCTION'
    | 'QUALITE_PRODUIT';

export type CelluleType =
    | 'DEBITAGE'
    | 'USINAGE'
    | 'ASSEMBLAGE'
    | 'AJUSTAGE';

export type StatutSuivi =
    | 'NON_DEMARRE'
    | 'EN_COURS'
    | 'BLOQUE'
    | 'TERMINE';

export type EtatOF =
    | 'PLANIFIE'
    | 'EN_COURS'
    | 'SUSPENDU'
    | 'TERMINE';

export type StatutRepere =
    | 'PLANIFIE'
    | 'EN_COURS'
    | 'CLOTURE';

// --- Entités ------------------------------------------------

export interface Utilisateur {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: RoleUtilisateur;
    actif: boolean;
    cree_le: Date;
    service_id?: string | null;
    service_nom?: NomService | null;
    cellule?: CelluleType | null;
}

export interface Service {
    id: string;
    nom: NomService;
    description?: string;
}

export interface Projet {
    id: string;
    reference: string;
    nom: string;
    client: string;
    annee?: number | null;
    numero_client?: number | null;
    numero_dossier?: number | null;
    /** Format PostgreSQL DATE : 'YYYY-MM-DD' */
    date_debut: string;
    date_fin_prevue: string;
    date_fin_reelle?: string;
    responsable_id: string;
    responsable?: Utilisateur;
    statut: StatutProjet;
    taux_avancement: number; // 0-100
    suivis?: SuiviService[];
    reperes?: Repere[];
    cree_le: Date;
    mis_a_jour_le: Date;
}

export interface Repere {
    id: string;
    projet_id: string;
    code: string;
    designation: string;
    numero_of?: string;
    statut: StatutRepere;
    temps_estime: number;
    avancement: number; // 0.0–1.0
    cause_retard?: CauseRetard | null;
    cellule?: CelluleType;
    ordre: number;
    cree_le: Date;
    modifie_le: Date;
}

export interface SuiviService {
    id: string;
    projet_id: string;
    projet?: Projet;
    service_id: string;
    service?: Service;
    responsable_id?: string;
    responsable?: Utilisateur;
    taux_avancement: number; // 0-100
    date_debut_reelle?: string;
    date_fin_reelle?: string;
    commentaire?: string;
    blocage?: string;
    statut: StatutSuivi;
    ordres_fabrication?: OrdreFabrication[];
    documents?: Document[];
    mis_a_jour_le: Date;
}

export interface OrdreFabrication {
    id: string;
    numero_of: string;
    suivi_service_id: string;
    projet_id: string;
    projet?: Projet;
    designation: string;
    date_lancement: string;
    date_fin_prevue: string;
    date_fin_reelle?: string;
    etat: EtatOF;
    taux_avancement: number; // 0-100
    commentaire?: string;
    cree_le: Date;
    jours_retard?: number;
}

export interface Document {
    id: string;
    suivi_service_id: string;
    nom_fichier: string;
    chemin_stockage: string;
    type_mime?: string;
    uploade_par?: string;
    uploade_le: Date;
}

export interface Historique {
    id: string;
    utilisateur_id?: string;
    utilisateur?: Utilisateur;
    table_cible: string;
    entite_id: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    ancienne_valeur?: Record<string, unknown>;
    nouvelle_valeur?: Record<string, unknown>;
    cree_le: Date;
}

// --- DTOs (payloads API) ------------------------------------

export interface CreateProjetDTO {
    reference?: string;
    annee?: number;
    numero_client?: number;
    numero_dossier?: number;
    nom: string;
    client: string;
    date_debut: string;
    date_fin_prevue: string;
    responsable_id: string;
}

export interface UpdateProjetDTO {
    nom?: string;
    client?: string;
    date_fin_prevue?: string;
    responsable_id?: string;
    statut?: StatutProjet;
}

export interface UpdateSuiviDTO {
    taux_avancement?: number;
    date_debut_reelle?: string | null;
    date_fin_reelle?: string | null;
    commentaire?: string;
    blocage?: string;
    statut?: StatutSuivi;
}

export interface CreateOFDTO {
    numero_of: string;
    designation: string;
    date_lancement: string;
    date_fin_prevue: string;
    commentaire?: string;
}

export interface UpdateOFDTO {
    designation?: string;
    date_fin_prevue?: string;
    date_fin_reelle?: string;
    etat?: EtatOF;
    taux_avancement?: number;
    commentaire?: string;
}

export interface CreateRepereDTO {
    designation: string;
    numero_of?: string;
    statut?: StatutRepere;
    temps_estime?: number;
    avancement?: number;
    cause_retard?: CauseRetard | null;
    cellule?: CelluleType;
}

export interface UpdateRepereDTO {
    designation?: string;
    numero_of?: string;
    statut?: StatutRepere;
    temps_estime?: number;
    avancement?: number;
    cause_retard?: CauseRetard | null;
    cellule?: CelluleType;
}

export interface LoginDTO {
    email: string;
    mot_de_passe: string;
}

export interface CreateUtilisateurDTO {
    nom: string;
    prenom: string;
    email: string;
    mot_de_passe: string;
    role: RoleUtilisateur;
    service_id?: string | null;
    cellule?: CelluleType | null;
}

export interface UpdateUtilisateurDTO {
    nom?: string;
    prenom?: string;
    email?: string;
    mot_de_passe?: string;
    role?: RoleUtilisateur;
    actif?: boolean;
    service_id?: string | null;
    cellule?: CelluleType | null;
}

// --- Réponses API -------------------------------------------

export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface DashboardKPIs {
    total_projets: number;
    projets_en_cours: number;
    projets_en_retard: number;
    projets_termines: number;
    taux_avancement_global: number;
    ofs_en_retard: number;
    avancement_par_service: {
        service: NomService;
        taux_moyen: number;
    }[];
}
