import db from '../config/database';
import { Repere, CreateRepereDTO, UpdateRepereDTO, CelluleType, StatutRepere, CauseRetard } from '../models/types';

function mapRow(row: Record<string, unknown>): Repere {
    return {
        id: row.id as string,
        projet_id: row.projet_id as string,
        code: row.code as string,
        designation: row.designation as string,
        numero_of: row.numero_of as string | undefined,
        statut: row.statut as StatutRepere,
        temps_estime: Number(row.temps_estime),
        avancement: Number(row.avancement),
        cause_retard: (row.cause_retard ?? undefined) as CauseRetard | undefined,
        cellule: row.cellule as CelluleType | undefined,
        ordre: Number(row.ordre),
        cree_le: row.cree_le as Date,
        modifie_le: row.modifie_le as Date,
    };
}

export const RepereRepository = {
    async findByProjet(projetId: string): Promise<Repere[]> {
        const { rows } = await db.query(
            `SELECT * FROM repere WHERE projet_id = $1 ORDER BY ordre, cree_le`,
            [projetId]
        );
        return rows.map(mapRow);
    },

    async findById(id: string): Promise<Repere | null> {
        const { rows } = await db.query(`SELECT * FROM repere WHERE id = $1`, [id]);
        return rows[0] ? mapRow(rows[0]) : null;
    },

    async getNextOrdre(projetId: string): Promise<number> {
        const { rows } = await db.query(
            `SELECT COALESCE(MAX(ordre), 0) + 1 AS next FROM repere WHERE projet_id = $1`,
            [projetId]
        );
        return Number(rows[0].next);
    },

    async create(projetId: string, dto: CreateRepereDTO, code: string, ordre: number): Promise<Repere> {
        const { rows } = await db.query(
            `INSERT INTO repere
                (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cause_retard, cellule, ordre)
             VALUES ($1, $2, $3, $4, $5::statut_repere, $6, $7, $8::cause_retard_enum, $9::cellule_type, $10)
             RETURNING *`,
            [
                projetId,
                code,
                dto.designation,
                dto.numero_of ?? null,
                dto.statut ?? 'PLANIFIE',
                dto.temps_estime ?? 0,
                dto.avancement ?? 0,
                dto.cause_retard ?? null,
                dto.cellule ?? null,
                ordre,
            ]
        );
        return mapRow(rows[0]);
    },

    async update(id: string, dto: UpdateRepereDTO): Promise<Repere | null> {
        const fields: string[] = [];
        const values: unknown[] = [];
        let i = 1;

        if (dto.designation !== undefined) { fields.push(`designation = $${i++}`); values.push(dto.designation); }
        if (dto.numero_of !== undefined) { fields.push(`numero_of = $${i++}`); values.push(dto.numero_of || null); }
        if (dto.statut !== undefined) { fields.push(`statut = $${i++}::statut_repere`); values.push(dto.statut); }
        if (dto.temps_estime !== undefined) { fields.push(`temps_estime = $${i++}`); values.push(dto.temps_estime); }
        if (dto.avancement !== undefined) { fields.push(`avancement = $${i++}`); values.push(dto.avancement); }
        if (dto.cause_retard !== undefined) { fields.push(`cause_retard = $${i++}::cause_retard_enum`); values.push(dto.cause_retard || null); }
        if (dto.cellule !== undefined) { fields.push(`cellule = $${i++}::cellule_type`); values.push(dto.cellule || null); }

        if (!fields.length) return this.findById(id);

        fields.push(`modifie_le = NOW()`);
        values.push(id);

        const { rows } = await db.query(
            `UPDATE repere SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
            values
        );
        return rows[0] ? mapRow(rows[0]) : null;
    },

    async delete(id: string): Promise<boolean> {
        const { rowCount } = await db.query(`DELETE FROM repere WHERE id = $1`, [id]);
        return (rowCount ?? 0) > 0;
    },

    async getStats(projetId: string): Promise<{
        total: number;
        planifie: number;
        en_cours: number;
        cloture: number;
        temps_total: number;
        temps_fait: number;
        taux_avancement: number;
    }> {
        const { rows } = await db.query(
            `SELECT
                COUNT(*)::INT                                                  AS total,
                COUNT(*) FILTER (WHERE statut = 'PLANIFIE')::INT              AS planifie,
                COUNT(*) FILTER (WHERE statut = 'EN_COURS')::INT              AS en_cours,
                COUNT(*) FILTER (WHERE statut = 'CLOTURE')::INT               AS cloture,
                COALESCE(SUM(temps_estime), 0)::INT                           AS temps_total,
                COALESCE(SUM(avancement * temps_estime), 0)::NUMERIC          AS temps_fait
             FROM repere WHERE projet_id = $1`,
            [projetId]
        );
        const r = rows[0];
        const taux = r.temps_total > 0
            ? Math.min(Math.round((Number(r.temps_fait) / Number(r.temps_total)) * 100), 100)
            : 0;
        return {
            total: r.total,
            planifie: r.planifie,
            en_cours: r.en_cours,
            cloture: r.cloture,
            temps_total: r.temps_total,
            temps_fait: Number(r.temps_fait),
            taux_avancement: taux,
        };
    },
};
