// ============================================================
//  Création / édition projet
// ============================================================
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../services/api';
import { projetsService } from '../services/projets.service';
import { StatutProjet } from '../types/models';
import { toDateInputValue } from '../utils/dateInput';

const STATUT_OPTIONS: { value: StatutProjet; label: string }[] = [
    { value: 'NON_DEMARRE', label: 'Non démarré' },
    { value: 'EN_COURS',    label: 'En cours' },
    { value: 'EN_RETARD',   label: 'En retard' },
    { value: 'TERMINE',     label: 'Terminé' },
];

const currentYear = new Date().getFullYear();

function buildReference(annee: number, client: number, dossier: number): string {
    if (!annee || !client || !dossier) return '';
    return `${annee}-${String(client).padStart(3, '0')}-${String(dossier).padStart(3, '0')}`;
}

export default function ProjetForm() {
    const { id: editId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = Boolean(editId);

    const [loading, setLoading] = useState(isEdit);
    const [error, setError] = useState<string | null>(null);
    const [importBusy, setImportBusy] = useState(false);
    const [importInfo, setImportInfo] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [annee, setAnnee] = useState<number>(currentYear);
    const [numeroClient, setNumeroClient] = useState<number | ''>('');
    const [numeroDossier, setNumeroDossier] = useState<number | ''>('');

    const [nom, setNom] = useState('');
    const [client, setClient] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [statut, setStatut] = useState<StatutProjet>('NON_DEMARRE');

    const reference = buildReference(annee, Number(numeroClient), Number(numeroDossier));

    useEffect(() => {
        if (!editId) return;
        let cancelled = false;
        projetsService
            .getById(editId)
            .then((p) => {
                if (cancelled) return;
                if (p.annee) setAnnee(p.annee);
                if (p.numero_client) setNumeroClient(p.numero_client);
                if (p.numero_dossier) setNumeroDossier(p.numero_dossier);
                setNom(p.nom);
                setClient(p.client);
                setDateDebut(toDateInputValue(p.date_debut));
                setDateFin(toDateInputValue(p.date_fin_prevue));
                setStatut(p.statut);
            })
            .catch(() => setError('Projet introuvable.'))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [editId]);

    async function onImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
        const fichier = e.target.files?.[0];
        if (!fichier) return;
        if (!nom.trim() || !client.trim()) {
            setError("Renseignez d'abord l'intitulé du projet et le client avant d'importer le fichier Excel.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setError(null);
        setImportInfo(null);
        setImportBusy(true);
        try {
            const result = await projetsService.importExcel(fichier, {
                nom: nom.trim(),
                client: client.trim(),
                date_debut: dateDebut || undefined,
                date_fin_prevue: dateFin || undefined,
            });
            const msg =
                `Projet ${result.reference} importé (${result.reperes_importes} repère${result.reperes_importes > 1 ? 's' : ''}).` +
                (result.avertissements.length ? `\nAvertissements :\n - ${result.avertissements.join('\n - ')}` : '');
            setImportInfo(msg);
            navigate(`/projets/${result.projet_id}`);
        } catch (err) {
            setError(getApiErrorMessage(err, "Import Excel impossible."));
        } finally {
            setImportBusy(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!isEdit && (!numeroClient || !numeroDossier)) {
            setError('N° Client et N° Dossier sont obligatoires.');
            return;
        }

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
                    annee,
                    numero_client: Number(numeroClient),
                    numero_dossier: Number(numeroDossier),
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
            setError(msg || "Erreur lors de l'enregistrement.");
        } finally {
            setLoading(false);
        }
    }

    if (loading && isEdit) return <p>Chargement…</p>;

    return (
        <div>
            <h1 className="page-title">{isEdit ? 'Modifier le projet' : 'Nouveau dossier projet'}</h1>
            <p className="page-sub">
                {isEdit
                    ? 'Mettre à jour les informations du projet.'
                    : "Saisissez l'année, le N° client et le N° dossier — la référence est générée automatiquement."}
            </p>

            <div className="card" style={{ maxWidth: 560 }}>
                <form onSubmit={onSubmit}>

                    <div style={{ marginBottom: 20 }}>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                            Numérotation du dossier *
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 10 }}>
                            <label>
                                <span style={lblStyle}>Année</span>
                                <input
                                    type="number"
                                    required={!isEdit}
                                    value={annee}
                                    onChange={(e) => setAnnee(Number(e.target.value))}
                                    style={inputStyle}
                                    disabled={loading || isEdit}
                                    min={2000} max={2099}
                                />
                            </label>
                            <label>
                                <span style={lblStyle}>N° Client</span>
                                <input
                                    type="number"
                                    required={!isEdit}
                                    value={numeroClient}
                                    onChange={(e) => setNumeroClient(e.target.value ? Number(e.target.value) : '')}
                                    style={inputStyle}
                                    disabled={loading || isEdit}
                                    min={1} max={999}
                                    placeholder="ex. 52"
                                />
                            </label>
                            <label>
                                <span style={lblStyle}>N° Dossier</span>
                                <input
                                    type="number"
                                    required={!isEdit}
                                    value={numeroDossier}
                                    onChange={(e) => setNumeroDossier(e.target.value ? Number(e.target.value) : '')}
                                    style={inputStyle}
                                    disabled={loading || isEdit}
                                    min={1} max={999}
                                    placeholder="ex. 18"
                                />
                            </label>
                        </div>
                        {reference && (
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                background: 'rgba(30,91,255,0.08)', borderRadius: 8, padding: '6px 14px',
                            }}>
                                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Référence générée :</span>
                                <code style={{ fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>{reference}</code>
                            </div>
                        )}
                    </div>

                    <Field label="Intitulé du projet *">
                        <input
                            required
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            style={inputStyle}
                            disabled={loading}
                            placeholder="ex. Ligne d'assemblage A3"
                        />
                    </Field>

                    <Field label="Client *">
                        <input
                            required
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                            style={inputStyle}
                            disabled={loading}
                            placeholder="Nom du client"
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
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </Field>
                    )}

                    {error && (
                        <p role="alert" style={{ color: 'var(--danger)', marginBottom: 16, whiteSpace: 'pre-wrap' }}>{error}</p>
                    )}
                    {importInfo && (
                        <p role="status" style={{ color: 'var(--success, #15803d)', marginBottom: 16, whiteSpace: 'pre-wrap' }}>{importInfo}</p>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <button type="submit" className="btn btn-primary" disabled={loading || importBusy}>
                            {loading ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le dossier'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)} disabled={loading || importBusy}>
                            Annuler
                        </button>
                    </div>
                </form>
            </div>

            {!isEdit && (
                <div className="card" style={{ maxWidth: 560, marginTop: 16, padding: 16 }}>
                    <strong style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>
                        ou — Importer le fichier modèle Excel
                    </strong>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0 }}>
                        Renseignez d'abord <em>l'intitulé du projet</em> et <em>le client</em> ci-dessus, puis
                        chargez le fichier modèle <code>.xlsx</code>. L'année, le n° client, le n° dossier et les
                        repères seront extraits automatiquement de la feuille <code>Feuil2</code>.
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={(e) => void onImportExcel(e)}
                        disabled={importBusy}
                        style={{ fontSize: 13 }}
                    />
                    {importBusy && (
                        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>Import en cours…</p>
                    )}
                </div>
            )}
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

const lblStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8 };
