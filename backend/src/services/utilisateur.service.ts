import bcrypt from 'bcrypt';
import { UtilisateurRepository, UtilisateurRow } from '../repositories/utilisateur.repository';
import {
    CreateUtilisateurDTO,
    NomService,
    RoleUtilisateur,
    UpdateUtilisateurDTO,
} from '../models/types';

function toApiUser(row: UtilisateurRow) {
    return {
        id: row.id,
        nom: row.nom,
        prenom: row.prenom,
        email: row.email,
        role: row.role,
        actif: row.actif,
        cree_le: row.cree_le.toISOString(),
        service_id: row.service_id ?? undefined,
        service_nom: (row.service_nom as NomService | undefined) ?? undefined,
    };
}

export const UtilisateurService = {
    async lister() {
        const rows = await UtilisateurRepository.findAll();
        return rows.map(toApiUser);
    },

    async getById(id: string) {
        const row = await UtilisateurRepository.findById(id);
        return row ? toApiUser(row) : null;
    },

    async creer(dto: CreateUtilisateurDTO) {
        if (dto.role === 'RESPONSABLE_SERVICE' && !dto.service_id) {
            throw new Error('Le service est obligatoire pour un responsable de service.');
        }
        const existing = await UtilisateurRepository.findByEmail(dto.email);
        if (existing) {
            throw new Error('Cet email est déjà utilisé');
        }
        const hash = await bcrypt.hash(dto.mot_de_passe, 10);
        const row = await UtilisateurRepository.create(dto, hash);
        return toApiUser(row);
    },

    async modifier(id: string, dto: UpdateUtilisateurDTO) {
        const current = await UtilisateurRepository.findById(id);
        if (!current) throw new Error('Utilisateur introuvable');

        const nextRole = dto.role ?? (current.role as RoleUtilisateur);
        const nextServiceId =
            dto.service_id !== undefined ? dto.service_id : current.service_id;
        if (nextRole === 'RESPONSABLE_SERVICE' && !nextServiceId) {
            throw new Error('Le service est obligatoire pour un responsable de service.');
        }

        if (dto.email && dto.email.trim().toLowerCase() !== current.email.toLowerCase()) {
            const taken = await UtilisateurRepository.findByEmail(dto.email);
            if (taken && taken.id !== id) {
                throw new Error('Cet email est déjà utilisé');
            }
        }

        let optionalHash: string | undefined;
        if (dto.mot_de_passe !== undefined && dto.mot_de_passe.length > 0) {
            optionalHash = await bcrypt.hash(dto.mot_de_passe, 10);
        }

        const { mot_de_passe: _pwd, ...patch } = dto;
        const row = await UtilisateurRepository.update(id, patch, optionalHash);
        if (!row) throw new Error('Mise à jour impossible');
        return toApiUser(row);
    },

    /** Désactivation (soft delete) — préférable aux FK vers projet.responsable_id */
    async desactiver(id: string) {
        const row = await UtilisateurRepository.update(id, { actif: false });
        if (!row) throw new Error('Utilisateur introuvable');
        return toApiUser(row);
    },

    async activer(id: string) {
        const row = await UtilisateurRepository.update(id, { actif: true });
        if (!row) throw new Error('Utilisateur introuvable');
        return toApiUser(row);
    },

    /**
     * Suppression définitive. Bloqué si responsable de projet(s), dernier ADMIN, ou suppression de soi-même.
     */
    async supprimer(id: string, currentUserId: string) {
        if (id === currentUserId) {
            throw new Error('Vous ne pouvez pas supprimer votre propre compte');
        }
        const row = await UtilisateurRepository.findById(id);
        if (!row) throw new Error('Utilisateur introuvable');

        const nbProjets = await UtilisateurRepository.countProjetsResponsable(id);
        if (nbProjets > 0) {
            throw new Error(
                `Impossible de supprimer : cet utilisateur est responsable de ${nbProjets} projet(s). Réassignez ou supprimez ces projets d'abord.`
            );
        }

        if (row.role === 'ADMIN') {
            const admins = await UtilisateurRepository.countAdmins();
            if (admins <= 1) {
                throw new Error('Impossible de supprimer le dernier administrateur.');
            }
        }

        const ok = await UtilisateurRepository.deleteCascade(id);
        if (!ok) throw new Error('Suppression impossible');
    },
};
