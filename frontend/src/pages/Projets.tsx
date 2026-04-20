// ============================================================
//  Liste des projets — filtres par statut et période (§3.2)
// ============================================================
import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { useProjetsStore } from '../stores/projets.store';
import { useAuthStore } from '../stores/auth.store';
import { projetsService } from '../services/projets.service';
import { StatutProjet } from '../types/models';

const STATUT_LABELS: Record<StatutProjet, string> = {
    NON_DEMARRE: 'Non démarré',
    EN_COURS: 'En cours',
    EN_RETARD: 'En retard',
    TERMINE: 'Terminé',
};
const STATUT_COLORS: Record<StatutProjet, string> = {
    NON_DEMARRE: '#6b7280',
    EN_COURS: '#2563eb',
    EN_RETARD: '#dc2626',
    TERMINE: '#16a34a',
};

export default function Projets() {
    const { projets, isLoading, charger } = useProjetsStore();
    const { hasRole } = useAuthStore();
    const canManageProjets = hasRole('CHEF_PROJET', 'ADMIN');
    const canDeleteProjet = hasRole('ADMIN');
    const [statut, setStatut] = useState<StatutProjet | ''>('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [listError, setListError] = useState<string | null>(null);

    const filters = {
        statut: statut || undefined,
        date_debut: dateDebut || undefined,
        date_fin: dateFin || undefined,
    };

    useEffect(() => {
        charger({
            statut: statut || undefined,
            date_debut: dateDebut || undefined,
            date_fin: dateFin || undefined,
        });
    }, [statut, dateDebut, dateFin, charger]);

    async function supprimer(p: { id: string; nom: string; reference: string }) {
        const ok = window.confirm(
            `Supprimer définitivement « ${p.nom} » (${p.reference}) ? Cette action est irréversible.`
        );
        if (!ok) return;
        setListError(null);
        setDeletingId(p.id);
        try {
            await projetsService.delete(p.id);
            await charger(filters);
        } catch (e) {
            const msg = isAxiosError(e)
                ? (e.response?.data as { message?: string })?.message
                : null;
            setListError(msg || 'Suppression impossible.');
        } finally {
            setDeletingId(null);
        }
    }

    if (isLoading && projets.length === 0) return <p>Chargement…</p>;

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                <div>
                    <h1 className="page-title" style={{ marginBottom: 4 }}>
                        Projets
                    </h1>
                    <p className="page-sub" style={{ margin: 0 }}>
                        Vue par projet — filtres par statut et période (dates de début / fin prévue).
                    </p>
                </div>
                {canManageProjets && (
                    <Link to="/projets/nouveau" className="btn btn-primary">
                        + Nouveau projet
                    </Link>
                )}
            </div>

            <div
                className="card"
                style={{
                    marginBottom: 20,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                    alignItems: 'end',
                }}
            >
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
                    Statut
                    <select
                        value={statut}
                        onChange={(e) => setStatut((e.target.value || '') as StatutProjet | '')}
                        style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                        }}
                    >
                        <option value="">Tous</option>
                        {(Object.keys(STATUT_LABELS) as StatutProjet[]).map((s) => (
                            <option key={s} value={s}>
                                {STATUT_LABELS[s]}
                            </option>
                        ))}
                    </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
                    Début ≥
                    <input
                        type="date"
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                        style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                        }}
                    />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
                    Fin prévue ≤
                    <input
                        type="date"
                        value={dateFin}
                        onChange={(e) => setDateFin(e.target.value)}
                        style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                        }}
                    />
                </label>
                <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                        setStatut('');
                        setDateDebut('');
                        setDateFin('');
                    }}
                >
                    Réinitialiser filtres
                </button>
            </div>

            {listError && (
                <p role="alert" style={{ color: 'var(--danger)', marginBottom: 12 }}>
                    {listError}
                </p>
            )}

            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Référence</th>
                            <th>Nom</th>
                            <th>Client</th>
                            <th>Responsable</th>
                            <th>Fin prévue</th>
                            <th>Avancement</th>
                            <th>Statut</th>
                            <th style={{ minWidth: canManageProjets ? 200 : 100 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projets.map((p) => (
                            <tr key={p.id}>
                                <td style={{ fontWeight: 600 }}>{p.reference}</td>
                                <td>{p.nom}</td>
                                <td>{p.client}</td>
                                <td style={{ fontSize: 14 }}>
                                    {p.responsable
                                        ? `${p.responsable.prenom} ${p.responsable.nom}`
                                        : '—'}
                                </td>
                                <td>{new Date(p.date_fin_prevue).toLocaleDateString('fr-FR')}</td>
                                <td>
                                    <ProgressBar value={p.taux_avancement} />
                                </td>
                                <td>
                                    <span
                                        style={{
                                            background: STATUT_COLORS[p.statut] + '22',
                                            color: STATUT_COLORS[p.statut],
                                            padding: '2px 10px',
                                            borderRadius: 999,
                                            fontSize: 12,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {STATUT_LABELS[p.statut]}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center', fontSize: 14 }}>
                                        <Link to={`/projets/${p.id}`}>Détail</Link>
                                        {canManageProjets && (
                                            <Link to={`/projets/${p.id}/editer`}>Modifier</Link>
                                        )}
                                        {canDeleteProjet && (
                                            <button
                                                type="button"
                                                className="btn btn-ghost"
                                                style={{ color: 'var(--danger)', padding: '2px 0' }}
                                                disabled={deletingId === p.id}
                                                onClick={() => void supprimer(p)}
                                            >
                                                {deletingId === p.id ? '…' : 'Supprimer'}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {projets.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 32 }}>Aucun projet</p>
            )}
        </div>
    );
}

function ProgressBar({ value }: { value: number }) {
    const color = value >= 80 ? '#16a34a' : value >= 40 ? '#2563eb' : '#ea580c';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
            <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 36 }}>{value}%</span>
        </div>
    );
}
