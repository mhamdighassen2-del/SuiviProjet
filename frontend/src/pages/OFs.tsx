// ============================================================
//  Vue globale des Ordres de Fabrication — §3.3 cahier des charges
// ============================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ofService } from '../services/projets.service';
import { OrdreFabrication, EtatOF } from '../types/models';

const ETAT_LABELS: Record<EtatOF, string> = {
    PLANIFIE: 'Planifié',
    EN_COURS: 'En cours',
    SUSPENDU: 'Suspendu',
    TERMINE: 'Terminé',
};

export default function OFs() {
    const [ofs, setOfs] = useState<OrdreFabrication[] | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        ofService
            .getAll()
            .then(setOfs)
            .catch(() => setErr('Impossible de charger les OF (API ou authentification).'));
    }, []);

    if (err) return <p style={{ color: 'var(--danger)' }}>{err}</p>;
    if (!ofs) return <p>Chargement des ordres de fabrication…</p>;

    const enRetard = ofs.filter(
        (o) =>
            new Date(o.date_fin_prevue) < new Date() &&
            o.etat !== 'TERMINE'
    );

    return (
        <div>
            <h1 className="page-title">Ordres de fabrication</h1>
            <p className="page-sub">
                OF réservés aux services <strong>Méthodes</strong> et <strong>Production</strong>. Suivi détaillé
                par OF et alertes de retard.
            </p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 12,
                    marginBottom: 24,
                }}
            >
                <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{ofs.length}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 14 }}>OF enregistrés</div>
                </div>
                <div className="card" style={{ padding: 16, borderColor: '#fecaca' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>{enRetard.length}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 14 }}>OF en retard</div>
                </div>
            </div>

            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>N° OF</th>
                            <th>Désignation</th>
                            <th>Projet</th>
                            <th>Lancement</th>
                            <th>Fin prévue</th>
                            <th>Avancement</th>
                            <th>État</th>
                            <th>Retard</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ofs.map((o) => {
                            const retard =
                                o.jours_retard && o.jours_retard > 0 ? `${o.jours_retard} j` : '—';
                            const isLate =
                                new Date(o.date_fin_prevue) < new Date() && o.etat !== 'TERMINE';
                            return (
                                <tr
                                    key={o.id}
                                    style={
                                        isLate
                                            ? { background: '#fef2f2', borderLeft: '3px solid var(--danger)' }
                                            : undefined
                                    }
                                >
                                    <td style={{ fontWeight: 600 }}>{o.numero_of}</td>
                                    <td>{o.designation}</td>
                                    <td>
                                        <Link to={`/projets/${o.projet_id}`}>Voir projet</Link>
                                    </td>
                                    <td>{new Date(o.date_lancement).toLocaleDateString('fr-FR')}</td>
                                    <td>{new Date(o.date_fin_prevue).toLocaleDateString('fr-FR')}</td>
                                    <td>{o.taux_avancement}%</td>
                                    <td>{ETAT_LABELS[o.etat]}</td>
                                    <td style={{ color: o.jours_retard ? 'var(--danger)' : undefined }}>
                                        {retard}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {ofs.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 24 }}>
                    Aucun OF — créez-en depuis la fiche d’un projet (suivi Méthodes ou Production).
                </p>
            )}
        </div>
    );
}
