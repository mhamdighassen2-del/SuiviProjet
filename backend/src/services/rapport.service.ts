import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { ProjetService } from './projet.service';
import { OFService } from './of.service';
import { RepereService } from './repere.service';
import {
    CelluleType,
    EtatOF,
    NomService,
    Repere,
    StatutProjet,
    StatutRepere,
    StatutSuivi,
} from '../models/types';

const LABEL_STATUT_PROJET: Record<StatutProjet, string> = {
    NON_DEMARRE: 'Non démarré',
    EN_COURS: 'En cours',
    EN_RETARD: 'En retard',
    TERMINE: 'Terminé',
};

const LABEL_SERVICE: Record<NomService, string> = {
    ETUDE: 'Étude',
    METHODES: 'Méthodes',
    PRODUCTION: 'Production',
    QUALITE_PRODUIT: 'Qualité Produit',
};

const LABEL_STATUT_SUIVI: Record<StatutSuivi, string> = {
    NON_DEMARRE: 'Non démarré',
    EN_COURS: 'En cours',
    BLOQUE: 'Bloqué',
    TERMINE: 'Terminé',
};

const LABEL_ETAT_OF: Record<EtatOF, string> = {
    PLANIFIE: 'Planifié',
    EN_COURS: 'En cours',
    SUSPENDU: 'Suspendu',
    TERMINE: 'Terminé',
};

const LABEL_STATUT_REPERE: Record<StatutRepere, string> = {
    PLANIFIE: 'Planifié',
    EN_COURS: 'En cours',
    CLOTURE: 'Clôturé',
};

const LABEL_CELLULE: Record<CelluleType, string> = {
    DEBITAGE: 'Débitage',
    USINAGE: 'Usinage',
    ASSEMBLAGE: 'Assemblage',
    AJUSTAGE: 'Ajustage',
};

/** Code consolidé "YYYY-CCC-DDD" aligné sur la cellule "Total Projet" du modèle Excel. */
function formatProjetCode(p: {
    annee?: number | null;
    numero_client?: number | null;
    numero_dossier?: number | null;
    reference: string;
}): string {
    if (p.annee && p.numero_client && p.numero_dossier) {
        return `${p.annee}-${String(p.numero_client).padStart(3, '0')}-${String(p.numero_dossier).padStart(3, '0')}`;
    }
    return p.reference;
}

// ----- Helpers de dessin de tableau (PDFKit n'en fournit pas en natif) ------

type Doc = InstanceType<typeof PDFDocument>;

interface TableColumn {
    header: string;
    width: number;
    align?: 'left' | 'center' | 'right';
}

function tableTotalWidth(cols: TableColumn[]): number {
    return cols.reduce((s, c) => s + c.width, 0);
}

function drawTableHeader(doc: Doc, x0: number, y: number, cols: TableColumn[], rowH: number): number {
    const totalW = tableTotalWidth(cols);
    doc.save();
    doc.rect(x0, y, totalW, rowH).fillAndStroke('#1e5bff', '#1e5bff');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    let cx = x0;
    for (const c of cols) {
        doc.text(c.header, cx + 4, y + 5, {
            width: c.width - 8,
            align: c.align ?? 'left',
            lineBreak: false,
        });
        cx += c.width;
    }
    doc.restore();
    return y + rowH;
}

function drawTableRow(
    doc: Doc,
    x0: number,
    y: number,
    cols: TableColumn[],
    rowH: number,
    values: string[],
    opts?: { bold?: boolean; bg?: string; textColor?: string }
): number {
    const totalW = tableTotalWidth(cols);
    doc.save();
    if (opts?.bg) {
        doc.rect(x0, y, totalW, rowH).fillAndStroke(opts.bg, '#bbbbbb');
    } else {
        doc.rect(x0, y, totalW, rowH).lineWidth(0.5).strokeColor('#cccccc').stroke();
    }
    doc.fillColor(opts?.textColor ?? '#000000').fontSize(8).font(opts?.bold ? 'Helvetica-Bold' : 'Helvetica');
    let cx = x0;
    for (let i = 0; i < cols.length; i++) {
        const c = cols[i];
        doc.text(values[i] ?? '', cx + 4, y + 5, {
            width: c.width - 8,
            align: c.align ?? 'left',
            lineBreak: false,
            ellipsis: true,
        });
        cx += c.width;
    }
    doc.restore();
    return y + rowH;
}

function drawReperesTable(
    doc: Doc,
    reperes: Repere[],
    codeProjet: string,
    x0: number,
    yStart: number
): number {
    const cols: TableColumn[] = [
        { header: 'Code',        width: 70  },
        { header: 'Désignation', width: 175 },
        { header: 'N° OF',       width: 78  },
        { header: 'Cellule',     width: 60  },
        { header: 'Statut',      width: 60, align: 'center' },
        { header: 'Tps est.',    width: 50, align: 'right' },
        { header: 'Avt %',       width: 45, align: 'right' },
        { header: 'Tps réa.',    width: 50, align: 'right' },
        { header: 'Cause retard',width: 190 },
    ];
    const rowH = 16;
    const bottomY = doc.page.height - doc.page.margins.bottom - 24;

    let y = drawTableHeader(doc, x0, yStart, cols, rowH);

    let totalEst = 0;
    let totalRea = 0;
    let alt = false;

    for (const r of reperes) {
        if (y + rowH > bottomY) {
            doc.addPage();
            y = doc.page.margins.top;
            y = drawTableHeader(doc, x0, y, cols, rowH);
        }
        const rea = Math.round(r.temps_estime * r.avancement);
        totalEst += r.temps_estime;
        totalRea += rea;

        const values = [
            r.code,
            r.designation,
            r.numero_of ?? '—',
            r.cellule ? LABEL_CELLULE[r.cellule] : '—',
            LABEL_STATUT_REPERE[r.statut],
            String(r.temps_estime),
            `${Math.round(r.avancement * 100)} %`,
            String(rea),
            r.cause_retard ?? '—',
        ];
        y = drawTableRow(doc, x0, y, cols, rowH, values, alt ? { bg: '#f7f9ff' } : undefined);
        alt = !alt;
    }

    // Ligne totaux — équivalent ligne 35 du modèle Excel ("Total Projet : YYYY-CCC-DDD")
    if (y + rowH + 4 > bottomY) {
        doc.addPage();
        y = doc.page.margins.top;
        y = drawTableHeader(doc, x0, y, cols, rowH);
    }
    const tauxGlobal = totalEst > 0 ? Math.min(100, Math.round((totalRea / totalEst) * 100)) : 0;
    const totalLabel = `Total Projet : ${codeProjet}`;
    const repCount = `${reperes.length} repère${reperes.length > 1 ? 's' : ''}`;
    y = drawTableRow(
        doc,
        x0,
        y,
        cols,
        rowH + 2,
        [totalLabel, repCount, '', '', '', String(totalEst), `${tauxGlobal} %`, String(totalRea), ''],
        { bold: true, bg: '#eef3ff' }
    );
    return y;
}

function pdfToBuffer(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
    });
}

function fmtDate(s: string | undefined) {
    if (!s) return '—';
    try {
        return new Date(s).toLocaleDateString('fr-FR');
    } catch {
        return s;
    }
}

export const RapportService = {
    async exportProjetPdf(projetId: string): Promise<Buffer> {
        const projet = await ProjetService.getProjet(projetId);
        const reperes = await RepereService.listerParProjet(projetId);
        const codeProjet = formatProjetCode(projet);

        // A4 paysage : nécessaire pour loger les 9 colonnes du tableau de repères
        // (aligné sur le modèle Excel de l'encadrant).
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margin: 32,
            bufferPages: true, // requis pour le pied de page numéroté ("Page X / N")
            info: { Title: projet.nom, Author: 'suivi-projets' },
        });

        // ---------- En-tête ------------------------------------
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#000').text(projet.nom);
        doc.moveDown(0.2);
        doc.fontSize(10).font('Helvetica').fillColor('#333');
        doc.text(`Total Projet : ${codeProjet}    ·    Client : ${projet.client}`);
        doc.text(
            `Statut : ${LABEL_STATUT_PROJET[projet.statut]}    ·    Avancement global : ${projet.taux_avancement} %`
        );
        doc.text(
            `Période : ${fmtDate(projet.date_debut)} → fin prévue ${fmtDate(projet.date_fin_prevue)}`
        );
        if (projet.responsable) {
            doc.text(
                `Responsable : ${projet.responsable.prenom} ${projet.responsable.nom} (${projet.responsable.email})`
            );
        }
        doc.moveDown(0.7);

        // ---------- Section Repères (aligné modèle Excel) ------
        if (reperes.length > 0) {
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Repères');
            doc.moveDown(0.3);
            const yAfterTable = drawReperesTable(doc, reperes, codeProjet, doc.page.margins.left, doc.y);
            doc.y = yAfterTable + 12;
        }

        // ---------- Section Suivi par service ------------------
        const suivis = projet.suivis ?? [];
        if (suivis.length > 0) {
            // Saut de page si peu de place restante
            if (doc.y > doc.page.height - doc.page.margins.bottom - 120) {
                doc.addPage();
            }
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Suivi par service');
            doc.moveDown(0.3);
            for (const s of suivis) {
                const nom = s.service?.nom as NomService | undefined;
                const label = nom ? LABEL_SERVICE[nom] : 'Service';
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#000')
                    .text(`${label} — ${s.taux_avancement} % — ${LABEL_STATUT_SUIVI[s.statut]}`);
                doc.font('Helvetica').fontSize(9).fillColor('#444');
                doc.text(
                    `  Début réel : ${fmtDate(s.date_debut_reelle)} · Fin réelle : ${fmtDate(s.date_fin_reelle)}`
                );
                if (s.commentaire) doc.text(`  Commentaire : ${s.commentaire}`);
                if (s.blocage) doc.text(`  Blocage : ${s.blocage}`);
                const ofs = s.ordres_fabrication ?? [];
                if (ofs.length > 0) {
                    doc.text(`  OF (${ofs.length}) :`);
                    for (const o of ofs) {
                        doc.text(
                            `    • ${o.numero_of} — ${o.designation} — ${LABEL_ETAT_OF[o.etat]} — ${o.taux_avancement}%`
                        );
                    }
                }
                doc.fillColor('#000').moveDown(0.4);
            }
        }

        // ---------- Pied de page (toutes les pages) ------------
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor('#888').font('Helvetica').text(
                `Généré le ${new Date().toLocaleString('fr-FR')}    ·    Page ${i - range.start + 1} / ${range.count}`,
                doc.page.margins.left,
                doc.page.height - 22,
                {
                    align: 'center',
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                    lineBreak: false,
                }
            );
        }

        return pdfToBuffer(doc);
    },

    async exportProjetExcel(projetId: string): Promise<Buffer> {
        const projet = await ProjetService.getProjet(projetId);
        const wb = new ExcelJS.Workbook();
        wb.creator = 'suivi-projets';
        const ws = wb.addWorksheet('Projet', { views: [{ state: 'frozen', ySplit: 1 }] });
        ws.columns = [
            { header: 'Champ', key: 'k', width: 22 },
            { header: 'Valeur', key: 'v', width: 48 },
        ];
        ws.addRows([
            { k: 'Référence', v: projet.reference },
            { k: 'Nom', v: projet.nom },
            { k: 'Client', v: projet.client },
            { k: 'Statut', v: LABEL_STATUT_PROJET[projet.statut] },
            { k: 'Date début', v: projet.date_debut },
            { k: 'Fin prévue', v: projet.date_fin_prevue },
            { k: 'Avancement %', v: projet.taux_avancement },
        ]);
        ws.getRow(1).font = { bold: true };

        const ws2 = wb.addWorksheet('Suivis');
        ws2.columns = [
            { header: 'Service', key: 'svc', width: 18 },
            { header: 'Avancement %', key: 'pct', width: 12 },
            { header: 'Statut', key: 'st', width: 14 },
            { header: 'Début réel', key: 'd1', width: 12 },
            { header: 'Fin réelle', key: 'd2', width: 12 },
            { header: 'Commentaire', key: 'c', width: 40 },
        ];
        ws2.getRow(1).font = { bold: true };
        for (const s of projet.suivis ?? []) {
            const nom = s.service?.nom as NomService | undefined;
            ws2.addRow({
                svc: nom ? LABEL_SERVICE[nom] : '',
                pct: s.taux_avancement,
                st: LABEL_STATUT_SUIVI[s.statut],
                d1: s.date_debut_reelle ?? '',
                d2: s.date_fin_reelle ?? '',
                c: s.commentaire ?? '',
            });
        }

        const ws3 = wb.addWorksheet('OF');
        ws3.columns = [
            { header: 'N° OF', key: 'n', width: 14 },
            { header: 'Désignation', key: 'd', width: 36 },
            { header: 'Service', key: 'svc', width: 14 },
            { header: 'Lancement', key: 'l', width: 12 },
            { header: 'Fin prévue', key: 'f', width: 12 },
            { header: 'État', key: 'e', width: 12 },
            { header: '%', key: 'p', width: 6 },
        ];
        ws3.getRow(1).font = { bold: true };
        for (const s of projet.suivis ?? []) {
            const nom = s.service?.nom as NomService | undefined;
            const label = nom ? LABEL_SERVICE[nom] : '';
            for (const o of s.ordres_fabrication ?? []) {
                ws3.addRow({
                    n: o.numero_of,
                    d: o.designation,
                    svc: label,
                    l: o.date_lancement,
                    f: o.date_fin_prevue,
                    e: LABEL_ETAT_OF[o.etat],
                    p: o.taux_avancement,
                });
            }
        }

        const buf = await wb.xlsx.writeBuffer();
        return Buffer.from(buf);
    },

    async exportOFsExcel(): Promise<Buffer> {
        const ofs = await OFService.listerPourExportExcel(2000);
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('OF');
        ws.columns = [
            { header: 'N° OF', key: 'n', width: 14 },
            { header: 'Projet', key: 'p', width: 28 },
            { header: 'Désignation', key: 'd', width: 36 },
            { header: 'Lancement', key: 'l', width: 12 },
            { header: 'Fin prévue', key: 'f', width: 12 },
            { header: 'État', key: 'e', width: 12 },
            { header: '%', key: 'pct', width: 6 },
            { header: 'Jours retard', key: 'j', width: 12 },
        ];
        ws.getRow(1).font = { bold: true };
        for (const o of ofs) {
            ws.addRow({
                n: o.numero_of,
                p: o.projet_nom,
                d: o.designation,
                l: o.date_lancement,
                f: o.date_fin_prevue,
                e: LABEL_ETAT_OF[o.etat],
                pct: o.taux_avancement,
                j: o.jours_retard ?? 0,
            });
        }
        const buf = await wb.xlsx.writeBuffer();
        return Buffer.from(buf);
    },
};
