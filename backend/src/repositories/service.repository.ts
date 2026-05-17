import db from '../config/database';
import { NomService } from '../models/types';

export const ServiceRepository = {
    async findAll(): Promise<{ id: string; nom: NomService; description?: string }[]> {
        const { rows } = await db.query(
            `SELECT id, nom::text AS nom, description FROM service ORDER BY nom`
        );
        return rows as { id: string; nom: NomService; description?: string }[];
    },
};
