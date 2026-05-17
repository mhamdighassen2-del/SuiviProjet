// ============================================================
//  projet-import.service.ts
//  Crée un projet + ses repères + ses 4 suivis_service à partir
//  du fichier Excel modèle de l'encadrant, en une transaction.
// ============================================================

import db from '../config/database';
import { parseProjetExcel } from '../utils/excel-import.util';
import { HttpError } from '../utils/http-error';

export interface ImportProjetDTO {
    nom: string;
    client: string;
    date_debut?: string;
    date_fin_prevue?: string;
}

export interface ImportResult {
    projet_id: string;
    reference: string;
    reperes_importes: number;
    avertissements: string[];
}

function isoToday(): string {
    return new Date().toISOString().slice(0, 10);
}

function isoPlusDays(days: number): string {
    return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

function buildProjetReference(annee: number, numCli: number, numDos: number): string {
    return `${annee}-${String(numCli).padStart(3, '0')}-${String(numDos).padStart(3, '0')}`;
}

function buildRepereCode(annee: number, numCli: number, numDos: number, ordre: number): string {
    return `${String(annee).slice(-2)}-${String(numCli).padStart(3, '0')}-${String(numDos).padStart(3, '0')}-${String(ordre).padStart(3, '0')}`;
}

export const ProjetImportService = {
    async importer(
        buffer: Buffer,
        dto: ImportProjetDTO,
        responsableId: string
    ): Promise<ImportResult> {
        if (!dto.nom?.trim() || !dto.client?.trim()) {
            throw new HttpError(400, "Les champs 'nom' et 'client' du projet sont requis.");
        }

        const parsed = await parseProjetExcel(buffer);
        const reference = buildProjetReference(parsed.annee, parsed.numero_client, parsed.numero_dossier);
        const dateDebut = dto.date_debut ?? isoToday();
        const dateFin = dto.date_fin_prevue ?? isoPlusDays(90);

        if (new Date(dateDebut) > new Date(dateFin)) {
            throw new HttpError(400, 'La date de début doit être antérieure à la date de fin prévue.');
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const { rows: existing } = await client.query(
                'SELECT id FROM projet WHERE reference = $1',
                [reference]
            );
            if (existing.length > 0) {
                throw new HttpError(409, `Un projet avec la référence ${reference} existe déjà.`);
            }

            const { rows: pr } = await client.query<{ id: string }>(
                `INSERT INTO projet
                    (reference, nom, client, date_debut, date_fin_prevue,
                     responsable_id, annee, numero_client, numero_dossier)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [
                    reference,
                    dto.nom.trim(),
                    dto.client.trim(),
                    dateDebut,
                    dateFin,
                    responsableId,
                    parsed.annee,
                    parsed.numero_client,
                    parsed.numero_dossier,
                ]
            );
            const projetId = pr[0].id;

            await client.query(
                `INSERT INTO suivi_service (projet_id, service_id)
                 SELECT $1, s.id FROM service s`,
                [projetId]
            );

            let ordre = 1;
            for (const r of parsed.reperes) {
                const code = buildRepereCode(parsed.annee, parsed.numero_client, parsed.numero_dossier, ordre);
                await client.query(
                    `INSERT INTO repere
                        (projet_id, code, designation, numero_of, statut,
                         temps_estime, avancement, ordre)
                     VALUES ($1, $2, $3, $4, $5::statut_repere, $6, $7, $8)`,
                    [
                        projetId,
                        code,
                        r.designation,
                        r.numero_of ?? null,
                        r.statut,
                        r.temps_estime,
                        r.avancement,
                        ordre,
                    ]
                );
                ordre++;
            }

            await client.query('COMMIT');

            return {
                projet_id: projetId,
                reference,
                reperes_importes: parsed.reperes.length,
                avertissements: parsed.avertissements,
            };
        } catch (e) {
            try { await client.query('ROLLBACK'); } catch { /* swallow */ }
            throw e;
        } finally {
            client.release();
        }
    },
};
