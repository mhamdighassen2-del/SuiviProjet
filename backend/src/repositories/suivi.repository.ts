import db from '../config/database';
import { SuiviService, UpdateSuiviDTO, NomService } from '../models/types';

/** Accepte yyyy-mm-dd, préfixe ISO ; null / chaîne vide → NULL SQL */
function toPgDate(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    if (typeof v !== 'string') return null;
    const s = v.trim();
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

export const SuiviRepository = {
    /** Alias métier : suivis d’un projet avec nom du service */
    async findByProjet(projetId: string): Promise<SuiviService[]> {
        return SuiviRepository.findByProjetId(projetId);
    },

    async findByProjetId(projetId: string): Promise<SuiviService[]> {
        const { rows } = await db.query(
            `SELECT ss.id, ss.projet_id, ss.service_id, ss.responsable_id,
                    ss.taux_avancement, ss.date_debut_reelle, ss.date_fin_reelle,
                    ss.commentaire, ss.blocage, ss.statut::text AS statut, ss.mis_a_jour_le,
                    s.nom::text AS service_nom, s.description AS service_description
             FROM suivi_service ss
             JOIN service s ON s.id = ss.service_id
             WHERE ss.projet_id = $1
             ORDER BY s.nom`,
            [projetId]
        );
        return rows.map((row) => ({
            id: row.id,
            projet_id: row.projet_id,
            service_id: row.service_id,
            responsable_id: row.responsable_id,
            taux_avancement: Number(row.taux_avancement),
            date_debut_reelle: row.date_debut_reelle,
            date_fin_reelle: row.date_fin_reelle,
            commentaire: row.commentaire,
            blocage: row.blocage,
            statut: row.statut as SuiviService['statut'],
            mis_a_jour_le: row.mis_a_jour_le,
            service: {
                id: row.service_id,
                nom: row.service_nom as NomService,
                description: row.service_description ?? undefined,
            },
        }));
    },

    async update(id: string, dto: UpdateSuiviDTO): Promise<SuiviService | null> {
        const fields: string[] = [];
        const values: unknown[] = [];
        let i = 1;

        if (dto.taux_avancement !== undefined) {
            fields.push(`taux_avancement = $${i++}`);
            values.push(dto.taux_avancement);
        }
        if (dto.date_debut_reelle !== undefined) {
            fields.push(`date_debut_reelle = $${i++}::date`);
            values.push(toPgDate(dto.date_debut_reelle));
        }
        if (dto.date_fin_reelle !== undefined) {
            fields.push(`date_fin_reelle = $${i++}::date`);
            values.push(toPgDate(dto.date_fin_reelle));
        }
        if (dto.commentaire !== undefined) {
            fields.push(`commentaire = $${i++}`);
            values.push(dto.commentaire || null);
        }
        if (dto.blocage !== undefined) {
            fields.push(`blocage = $${i++}`);
            values.push(dto.blocage || null);
        }
        if (dto.statut !== undefined) {
            fields.push(`statut = $${i++}::statut_suivi`);
            values.push(dto.statut);
        }

        if (!fields.length) return null;
        values.push(id);

        const { rows } = await db.query(
            `UPDATE suivi_service SET ${fields.join(', ')}, mis_a_jour_le = NOW()
             WHERE id = $${i} RETURNING id, projet_id, service_id, responsable_id,
               taux_avancement, date_debut_reelle, date_fin_reelle, commentaire, blocage,
               statut::text AS statut, mis_a_jour_le`,
            values
        );
        if (!rows[0]) return null;
        const r = rows[0];
        const svc = await db.query(
            `SELECT s.id, s.nom::text AS nom, s.description FROM service s
             JOIN suivi_service ss ON ss.service_id = s.id WHERE ss.id = $1`,
            [id]
        );
        const srow = svc.rows[0];
        return {
            id: r.id,
            projet_id: r.projet_id,
            service_id: r.service_id,
            responsable_id: r.responsable_id,
            taux_avancement: Number(r.taux_avancement),
            date_debut_reelle: r.date_debut_reelle,
            date_fin_reelle: r.date_fin_reelle,
            commentaire: r.commentaire,
            blocage: r.blocage,
            statut: r.statut as SuiviService['statut'],
            mis_a_jour_le: r.mis_a_jour_le,
            service: srow
                ? { id: srow.id, nom: srow.nom as NomService, description: srow.description ?? undefined }
                : undefined,
        };
    },
};
