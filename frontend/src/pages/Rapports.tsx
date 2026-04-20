// ============================================================
//  Rapports — exports PDF / Excel (§4.3 cahier des charges)
// ============================================================
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Rapports() {
    const { projetId } = useParams<{ projetId?: string }>();
    const [msg, setMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function exportProjet(kind: 'pdf' | 'excel') {
        if (!projetId) return;
        setMsg(null);
        setLoading(true);
        try {
            const path =
                kind === 'pdf'
                    ? `/rapports/projet/${projetId}/pdf`
                    : `/rapports/projet/${projetId}/excel`;
            const res = await api.get(path, {
                responseType: 'blob',
                validateStatus: (s) => s === 200,
            });
            downloadBlob(
                res.data as Blob,
                kind === 'pdf' ? `projet-${projetId}.pdf` : `projet-${projetId}.xlsx`
            );
        } catch {
            setMsg('Erreur réseau ou authentification.');
        } finally {
            setLoading(false);
        }
    }

    async function exportOFs() {
        setMsg(null);
        setLoading(true);
        try {
            const res = await api.get('/rapports/ofs/excel', {
                responseType: 'blob',
                validateStatus: (s) => s === 200,
            });
            downloadBlob(res.data as Blob, 'ofs.xlsx');
        } catch {
            setMsg('Erreur réseau ou authentification.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h1 className="page-title">Rapports et exports</h1>
            <p className="page-sub">
                Rapport par projet (PDF / Excel), export des OF (Excel). Les exports réels sont branchés sur
                l’API (génération serveur).
            </p>

            <div className="card" style={{ maxWidth: 560 }}>
                {projetId ? (
                    <>
                        <p style={{ marginTop: 0 }}>
                            Projet : <code style={{ fontSize: 14 }}>{projetId}</code> —{' '}
                            <Link to={`/projets/${projetId}`}>Retour fiche projet</Link>
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={loading}
                                onClick={() => exportProjet('pdf')}
                            >
                                PDF — ce projet
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                disabled={loading}
                                onClick={() => exportProjet('excel')}
                            >
                                Excel — ce projet
                            </button>
                        </div>
                    </>
                ) : (
                    <p style={{ marginTop: 0, color: 'var(--muted)' }}>
                        Pour exporter un projet précis, ouvrez cette page depuis la fiche projet (lien « Rapports /
                        exports ») ou utilisez l’URL <code>/rapports/&lt;id-projet&gt;</code>.
                    </p>
                )}

                <h2 style={{ fontSize: '1.05rem', marginTop: 24 }}>Tous les OF</h2>
                <button type="button" className="btn btn-ghost" disabled={loading} onClick={exportOFs}>
                    Excel — liste des OF
                </button>

                {loading && <p style={{ marginTop: 16 }}>Traitement…</p>}
                {msg && (
                    <p style={{ marginTop: 16, color: 'var(--muted)' }} role="status">
                        {msg}
                    </p>
                )}
            </div>
        </div>
    );
}
