import bcrypt from 'bcrypt';
import { UtilisateurRepository } from '../repositories/utilisateur.repository';
import { CreateUtilisateurDTO, UpdateUtilisateurDTO } from '../models/types';

function toApiUser(row: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    actif: boolean;
    cree_le: Date;
}) {
    return {
        id: row.id,
        nom: row.nom,
        prenom: row.prenom,
        email: row.email,
        role: row.role,
        actif: row.actif,
        cree_le: row.cree_le.toISOString(),
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
};
