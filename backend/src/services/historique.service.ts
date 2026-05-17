import { HistoriqueRepository, HistoriqueRow } from '../repositories/historique.repository';

function mapRow(h: HistoriqueRow) {
    return {
        id: h.id,
        utilisateur_id: h.utilisateur_id,
        table_cible: h.table_cible,
        entite_id: h.entite_id,
        action: h.action,
        ancienne_valeur: h.ancienne_valeur,
        nouvelle_valeur: h.nouvelle_valeur,
        cree_le: h.cree_le.toISOString(),
    };
}

export const HistoriqueService = {
    async listerPourProjet(projetId: string) {
        const rows = await HistoriqueRepository.findByProjetId(projetId);
        return rows.map(mapRow);
    },

    async log(params: {
        utilisateur_id: string | null;
        table_cible: string;
        entite_id: string;
        action: 'INSERT' | 'UPDATE' | 'DELETE';
        ancienne_valeur?: unknown;
        nouvelle_valeur?: unknown;
    }): Promise<void> {
        await HistoriqueRepository.insert(params);
    },
};
