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

function mapSuiviRow(row: Record<string, unknown>): SuiviService {
    return {
        id: row.id as string,
        projet_id: row.projet_id as string,
        service_id: row.service_id as string,
        responsable_id: (row.responsable_id as string | null) ?? undefined,
        taux_avancement: Number(row.taux_avancement),
        date_debut_reelle: row.date_debut_reelle as string | undefined,
        date_fin_reelle: row.date_fin_reelle as string | undefined,
        commentaire: (row.commentaire as string | null) ?? undefined,
        blocage: (row.blocage as string | null) ?? undefined,
        statut: row.statut as SuiviService['statut'],
        mis_a_jour_le: row.mis_a_jour_le as Date,
        service: {
            id: row.service_id as string,
            nom: row.service_nom as NomService,
            description: (row.service_description as string | null) ?? undefined,
        },
    };
}

export const SuiviRepository = {
    /** Alias métier : suivis d’un projet avec nom du service */
    async findByProjet(projetId: string): Promise<SuiviService[]> {
        return SuiviRepository.findByProjetId(projetId);
    },

    async findById(id: string): Promise<SuiviService | null> {
        const { rows } = await db.query(
            `SELECT ss.id, ss.projet_id, ss.service_id, ss.responsable_id,
                    ss.taux_avancement, ss.date_debut_reelle, ss.date_fin_reelle,
                    ss.commentaire, ss.blocage, ss.statut::text AS statut, ss.mis_a_jour_le,
                    s.nom::text AS service_nom, s.description AS service_description
             FROM suivi_service ss
             JOIN service s ON s.id = ss.service_id
             WHERE ss.id = $1`,
            [id]
        );
        const row = rows[0];
        if (!row) return null;
        return mapSuiviRow(row as Record<string, unknown>);
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
        return rows.map((row) => mapSuiviRow(row as Record<string, unknown>));
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
        return SuiviRepository.findById(id);
    },
};
