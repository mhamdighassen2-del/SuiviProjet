import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { ProjetService } from './projet.service';
import { OFService } from './of.service';
import { EtatOF, NomService, StatutProjet, StatutSuivi } from '../models/types';

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
        const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: projet.nom } });
        doc.fontSize(18).text(projet.nom, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#333');
        doc.text(`Référence : ${projet.reference}`);
        doc.text(`Client : ${projet.client}`);
        doc.text(`Statut : ${LABEL_STATUT_PROJET[projet.statut]}`);
        doc.text(`Période : ${fmtDate(projet.date_debut)} → fin prévue ${fmtDate(projet.date_fin_prevue)}`);
        doc.text(`Avancement global : ${projet.taux_avancement} %`);
        if (projet.responsable) {
            doc.text(
                `Responsable : ${projet.responsable.prenom} ${projet.responsable.nom} (${projet.responsable.email})`
            );
        }
        doc.moveDown(1);
        doc.fontSize(12).fillColor('#000').text('Suivi par service', { underline: true });
        doc.moveDown(0.5);
        const suivis = projet.suivis ?? [];
        for (const s of suivis) {
            const nom = s.service?.nom as NomService | undefined;
            const label = nom ? LABEL_SERVICE[nom] : 'Service';
            doc.fontSize(11).text(`${label} — ${s.taux_avancement} % — ${LABEL_STATUT_SUIVI[s.statut]}`);
            doc.fontSize(9).fillColor('#444');
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
            doc.fillColor('#000').moveDown(0.5);
        }
        doc.fontSize(8).fillColor('#888').text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 48, doc.page.height - 36, {
            align: 'center',
            width: doc.page.width - 96,
        });
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
