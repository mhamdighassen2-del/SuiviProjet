// ============================================================
//  excel-import.util.ts
//  Parse le fichier modèle de l'encadrant (feuille "Feuil2").
//
//  Disposition attendue (voir database/README.md) :
//    D2 = annee
//    D3 = numero_client
//    D4 = numero_dossier
//    Lignes 13..34 : repères (max 22)
//      C = code (informatif, sera régénéré côté backend)
//      D = désignation
//      E = N° OF (optionnel)
//      I = temps estimé (minutes)
//      J = avancement (0..1)
// ============================================================

import ExcelJS from 'exceljs';

export interface ExcelRepereImport {
    designation: string;
    numero_of?: string;
    temps_estime: number;
    avancement: number;
    statut: 'PLANIFIE' | 'EN_COURS' | 'CLOTURE';
    code_excel?: string;
}

export interface ExcelProjetImport {
    annee: number;
    numero_client: number;
    numero_dossier: number;
    reperes: ExcelRepereImport[];
    avertissements: string[];
}

function cellString(cell: ExcelJS.Cell): string {
    const v = cell.value;
    if (v == null) return '';
    if (typeof v === 'string') return v.trim();
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'object') {
        const obj = v as { result?: unknown; richText?: { text: string }[]; text?: string };
        if (obj.richText) return obj.richText.map((rt) => rt.text).join('').trim();
        if (obj.result !== undefined && obj.result !== null) return String(obj.result).trim();
        if (obj.text) return obj.text.trim();
    }
    return String(v).trim();
}

function cellNumber(cell: ExcelJS.Cell): number {
    const v = cell.value;
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'object') {
        const obj = v as { result?: unknown };
        if (typeof obj.result === 'number') return obj.result;
    }
    const n = Number(cellString(cell));
    return Number.isFinite(n) ? n : 0;
}

export async function parseProjetExcel(buffer: Buffer): Promise<ExcelProjetImport> {
    const wb = new ExcelJS.Workbook();
    // ExcelJS attend `Buffer<ArrayBuffer>`, mais multer/Node 20+ produit `Buffer<ArrayBufferLike>`.
    // Sémantiquement compatible — on cast via unknown puis vers le type attendu par ExcelJS.
    await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);

    const sheet = wb.getWorksheet('Feuil2') ?? wb.worksheets[0];
    if (!sheet) {
        throw new Error('Fichier Excel invalide : aucune feuille trouvée.');
    }

    const annee = Math.trunc(cellNumber(sheet.getCell('D2')));
    const numero_client = Math.trunc(cellNumber(sheet.getCell('D3')));
    const numero_dossier = Math.trunc(cellNumber(sheet.getCell('D4')));

    if (!annee || !numero_client || !numero_dossier) {
        throw new Error(
            "Les cellules D2 (Année), D3 (Client) et D4 (Dossier) doivent être renseignées dans la feuille 'Feuil2'."
        );
    }

    const reperes: ExcelRepereImport[] = [];
    const avertissements: string[] = [];

    for (let r = 13; r <= 34; r++) {
        const code = cellString(sheet.getCell(`C${r}`));
        const designation = cellString(sheet.getCell(`D${r}`));
        if (!code && !designation) continue;
        if (!designation) {
            avertissements.push(`Ligne ${r} : désignation manquante, ligne ignorée.`);
            continue;
        }

        const temps_estime = Math.max(0, Math.round(cellNumber(sheet.getCell(`I${r}`))));
        const avancementRaw = cellNumber(sheet.getCell(`J${r}`));
        const avancement = Math.max(0, Math.min(1, avancementRaw));
        const numero_of = cellString(sheet.getCell(`E${r}`)) || undefined;

        let statut: ExcelRepereImport['statut'] = 'PLANIFIE';
        if (avancement >= 1) statut = 'CLOTURE';
        else if (avancement > 0) statut = 'EN_COURS';

        reperes.push({
            designation,
            numero_of,
            temps_estime,
            avancement,
            statut,
            code_excel: code || undefined,
        });
    }

    if (reperes.length === 0) {
        throw new Error('Aucun repère trouvé dans la feuille (plage attendue : lignes 13 à 34).');
    }

    return { annee, numero_client, numero_dossier, reperes, avertissements };
}
