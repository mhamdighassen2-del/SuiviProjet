// ============================================================
//  Rapports — exports PDF / Excel (§4.3 cahier des charges)
//  Permet de sélectionner un projet directement (sans passer
//  par la fiche projet) puis d'exporter en PDF ou Excel.
// ============================================================
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projetsService, rapportService } from '../services/projets.service';
import { Projet } from '../types/models';
import { formatProjetCode } from '../utils/projetCode';
import { getApiErrorMessage } from '../services/api';

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Rapports() {
    const { projetId: projetIdFromUrl } = useParams<{ projetId?: string }>();
    const [projets, setProjets] = useState<Projet[]>([]);
    const [loadingProjets, setLoadingProjets] = useState(true);
    const [selectedId, setSelectedId] = useState<string>('');
    const [msg, setMsg] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let alive = true;
        projetsService.getAll()
            .then((data) => {
                if (!alive) return;
                setProjets(data);
                if (projetIdFromUrl && data.some((p) => p.id === projetIdFromUrl)) {
                    setSelectedId(projetIdFromUrl);
                } else if (data.length > 0 && !projetIdFromUrl) {
                    setSelectedId(data[0].id);
                }
            })
            .catch((e) => setMsg(getApiErrorMessage(e, 'Impossible de charger la liste des projets.')))
            .finally(() => { if (alive) setLoadingProjets(false); });
        return () => { alive = false; };
    }, [projetIdFromUrl]);

    const projetCourant = useMemo(
        () => projets.find((p) => p.id === selectedId) ?? null,
        [projets, selectedId]
    );

    const codeProjet = projetCourant ? formatProjetCode(projetCourant) : '';
    const fileBase = codeProjet || selectedId || 'projet';

    async function exportProjet(kind: 'pdf' | 'excel') {
        if (!selectedId) {
            setMsg('Sélectionnez un projet avant de lancer l\u2019export.');
            return;
        }
        setMsg(null);
        setBusy(true);
        try {
            const res = kind === 'pdf'
                ? await rapportService.exportProjetPDF(selectedId)
                : await rapportService.exportProjetExcel(selectedId);
            downloadBlob(res.data as Blob, `projet-${fileBase}.${kind === 'pdf' ? 'pdf' : 'xlsx'}`);
        } catch (e) {
            setMsg(getApiErrorMessage(e, 'L\u2019export a échoué.'));
        } finally {
            setBusy(false);
        }
    }

    async function exportOFs() {
        setMsg(null);
        setBusy(true);
        try {
            const res = await rapportService.exportOFsExcel();
            downloadBlob(res.data as Blob, 'ofs.xlsx');
        } catch (e) {
            setMsg(getApiErrorMessage(e, 'L\u2019export OF a échoué.'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div>
            <h1 className="page-title">Rapports et exports</h1>
            <p className="page-sub">
                Rapport par projet (PDF / Excel), export des OF (Excel). Les exports réels sont branchés sur
                l&rsquo;API (génération serveur, format aligné sur le modèle Excel de l&rsquo;encadrant).
            </p>

            <div className="card" style={{ maxWidth: 720 }}>
                <h2 style={{ fontSize: '1.05rem', marginTop: 0 }}>Export par projet</h2>

                {loadingProjets ? (
                    <p style={{ color: 'var(--muted)' }}>Chargement des projets…</p>
                ) : projets.length === 0 ? (
                    <p style={{ color: 'var(--muted)' }}>
                        Aucun projet pour le moment. <Link to="/projets/nouveau">Créer un projet</Link>
                    </p>
                ) : (
                    <>
                        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                            Projet à exporter
                        </label>
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            disabled={busy}
                            style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid var(--border)',
                                fontSize: 14,
                                marginBottom: 14,
                                background: 'var(--bg-input, #1f2937)',
                                color: 'inherit',
                            }}
                        >
                            {projets.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {formatProjetCode(p)} — {p.nom} ({p.client})
                                </option>
                            ))}
                        </select>

                        {projetCourant && (
                            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0, marginBottom: 12 }}>
                                Avancement actuel : <strong>{projetCourant.taux_avancement} %</strong>
                                {' · '}
                                <Link to={`/projets/${projetCourant.id}`}>Ouvrir la fiche projet</Link>
                            </p>
                        )}

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={busy || !selectedId}
                                onClick={() => exportProjet('pdf')}
                                title="Génère un PDF avec en-tête, table des repères (modèle Excel) et suivi par service"
                            >
                                Extraire PDF — projet
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                disabled={busy || !selectedId}
                                onClick={() => exportProjet('excel')}
                            >
                                Excel — projet
                            </button>
                        </div>
                    </>
                )}

                <h2 style={{ fontSize: '1.05rem', marginTop: 28 }}>Tous les OF</h2>
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={exportOFs}>
                    Excel — liste des OF
                </button>

                {busy && <p style={{ marginTop: 16 }}>Traitement…</p>}
                {msg && (
                    <p
                        style={{ marginTop: 16, color: 'var(--danger, #ef4444)' }}
                        role="status"
                    >
                        {msg}
                    </p>
                )}
            </div>
        </div>
    );
}
