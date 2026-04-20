// ============================================================
//  Création / édition projet (§3.1)
// ============================================================
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projetsService } from '../services/projets.service';
import { StatutProjet } from '../types/models';
import { toDateInputValue } from '../utils/dateInput';

const STATUT_OPTIONS: { value: StatutProjet; label: string }[] = [
    { value: 'NON_DEMARRE', label: 'Non démarré' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'EN_RETARD', label: 'En retard' },
    { value: 'TERMINE', label: 'Terminé' },
];

export default function ProjetForm() {
    const { id: editId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = Boolean(editId);

    const [loading, setLoading] = useState(isEdit);
    const [error, setError] = useState<string | null>(null);

    const [reference, setReference] = useState('');
    const [nom, setNom] = useState('');
    const [client, setClient] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [statut, setStatut] = useState<StatutProjet>('NON_DEMARRE');

    useEffect(() => {
        if (!editId) return;
        let cancelled = false;
        projetsService
            .getById(editId)
            .then((p) => {
                if (cancelled) return;
                setReference(p.reference);
                setNom(p.nom);
                setClient(p.client);
                setDateDebut(toDateInputValue(p.date_debut));
                setDateFin(toDateInputValue(p.date_fin_prevue));
                setStatut(p.statut);
            })
            .catch(() => setError('Projet introuvable.'))
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [editId]);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (isEdit && editId) {
                await projetsService.update(editId, {
                    nom: nom.trim(),
                    client: client.trim(),
                    date_fin_prevue: dateFin,
                    statut,
                });
                navigate(`/projets/${editId}`);
            } else {
                const p = await projetsService.create({
                    reference: reference.trim(),
                    nom: nom.trim(),
                    client: client.trim(),
                    date_debut: dateDebut,
                    date_fin_prevue: dateFin,
                    responsable_id: '',
                });
                navigate(`/projets/${p.id}`);
            }
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                    : null;
            setError(msg || 'Erreur lors de l’enregistrement.');
        } finally {
            setLoading(false);
        }
    }

    if (loading && isEdit) return <p>Chargement…</p>;

    return (
        <div>
            <h1 className="page-title">{isEdit ? 'Modifier le projet' : 'Nouveau projet'}</h1>
            <p className="page-sub">
                {isEdit
                    ? 'Mettre à jour les informations du projet.'
                    : 'Référence, intitulé, client et planning. Vous serez enregistré comme responsable du projet.'}
            </p>

            <div className="card" style={{ maxWidth: 520 }}>
                <form onSubmit={onSubmit}>
                    <Field label="Référence projet *">
                        <input
                            required
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="ex. PROJ-2025-001"
                            style={inputStyle}
                            disabled={loading || isEdit}
                        />
                    </Field>
                    {isEdit && (
                        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: -8 }}>
                            La référence ne peut pas être modifiée.
                        </p>
                    )}
                    <Field label="Nom du projet *">
                        <input
                            required
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            style={inputStyle}
                            disabled={loading}
                        />
                    </Field>
                    <Field label="Client *">
                        <input
                            required
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                            style={inputStyle}
                            disabled={loading}
                        />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Field label={isEdit ? 'Date de début' : 'Date de début *'}>
                            <input
                                type="date"
                                required={!isEdit}
                                value={dateDebut}
                                onChange={(e) => setDateDebut(e.target.value)}
                                style={inputStyle}
                                disabled={loading || isEdit}
                            />
                        </Field>
                        <Field label="Date de fin prévue *">
                            <input
                                type="date"
                                required
                                value={dateFin}
                                onChange={(e) => setDateFin(e.target.value)}
                                style={inputStyle}
                                disabled={loading}
                            />
                        </Field>
                    </div>
                    {isEdit && (
                        <Field label="Statut global">
                            <select
                                value={statut}
                                onChange={(e) => setStatut(e.target.value as StatutProjet)}
                                style={{ ...inputStyle, padding: 10 }}
                                disabled={loading}
                            >
                                {STATUT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    )}

                    {error && (
                        <p role="alert" style={{ color: 'var(--danger)', marginBottom: 16 }}>
                            {error}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le projet'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label}</span>
            {children}
        </label>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border)',
    borderRadius: 8,
};
