// ============================================================
//  Détail projet — suivi par service + OF (§3.2 / §3.3)
// ============================================================
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../services/api';
import { projetsService, suiviService, ofService } from '../services/projets.service';
import {
    Projet,
    SuiviService,
    OrdreFabrication,
    NomService,
    StatutSuivi,
    EtatOF,
    CreateOFDTO,
    HistoriqueEntree,
} from '../types/models';
import { useAuthStore } from '../stores/auth.store';
import { useProjetsStore } from '../stores/projets.store';
import { toDateInputValue, normalizeDateForApi } from '../utils/dateInput';
import { ProjectStepper } from '../components/ProjectStepper';

const SERVICE_LABELS: Record<NomService, string> = {
    ETUDE: 'Étude',
    METHODES: 'Méthodes',
    PRODUCTION: 'Production',
    QUALITE_PRODUIT: 'Qualité Produit',
};

/** Libellés courts pour les boutons d’onglet */
const SERVICE_TAB_LABELS: Record<NomService, string> = {
    ETUDE: 'Étude',
    METHODES: 'Méthodes',
    PRODUCTION: 'Production',
    QUALITE_PRODUIT: 'Qualité',
};

const SERVICE_ORDER: NomService[] = ['ETUDE', 'METHODES', 'PRODUCTION', 'QUALITE_PRODUIT'];

const STATUT_SUIVI_LABELS: Record<StatutSuivi, string> = {
    NON_DEMARRE: 'Non démarré',
    EN_COURS: 'En cours',
    BLOQUE: 'Bloqué',
    TERMINE: 'Terminé',
};

const ETAT_OF_LABELS: Record<EtatOF, string> = {
    PLANIFIE: 'Planifié',
    EN_COURS: 'En cours',
    SUSPENDU: 'Suspendu',
    TERMINE: 'Terminé',
};

const TABLE_HISTO_LABELS: Record<string, string> = {
    projet: 'Projet',
    suivi_service: 'Suivi',
    ordre_fabrication: 'OF',
};

export default function ProjetDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { hasRole } = useAuthStore();
    const retirerProjet = useProjetsStore((s) => s.retirerProjet);
    const [projet, setProjet] = useState<Projet | null>(null);
    const [suivis, setSuivis] = useState<SuiviService[]>([]);
    const [ofsRetard, setOfsRetard] = useState<OrdreFabrication[]>([]);
    const [historique, setHistorique] = useState<HistoriqueEntree[]>([]);
    const [serviceSelectionne, setServiceSelectionne] = useState<NomService | null>(null);

    const canEdit = hasRole('RESPONSABLE_SERVICE', 'CHEF_PROJET', 'ADMIN');
    const canOF = hasRole('RESPONSABLE_SERVICE', 'CHEF_PROJET', 'ADMIN');
    const canEditProjet = hasRole('CHEF_PROJET', 'ADMIN');
    const canDeleteProjet = hasRole('CHEF_PROJET', 'ADMIN');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            const p = await projetsService.getById(id);
            if (cancelled) return;
            setProjet(p);
            if (p.suivis?.length) setSuivis(p.suivis);
            else {
                const s = await suiviService.getByProjet(id);
                if (!cancelled) setSuivis(s);
            }
            const allRetard = await ofService.getEnRetard();
            if (!cancelled) setOfsRetard(allRetard.filter((o) => o.projet_id === id));
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        projetsService.getHistorique(id).then((h) => {
            if (!cancelled) setHistorique(h);
        });
        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        if (suivis.length === 0) return;
        setServiceSelectionne((prev) => {
            if (prev && suivis.some((s) => s.service?.nom === prev)) return prev;
            const first = SERVICE_ORDER.find((nom) => suivis.some((s) => s.service?.nom === nom));
            return first ?? null;
        });
    }, [suivis]);

    async function supprimerProjet() {
        if (!id || !projet) return;
        const ok = window.confirm(
            `Supprimer définitivement le projet « ${projet.nom} » (${projet.reference}) ? Les suivis et OF associés seront supprimés (cascade base de données).`
        );
        if (!ok) return;
        setDeleting(true);
        try {
            await projetsService.delete(id);
            retirerProjet(id);
            navigate('/projets', { replace: true });
        } catch (e) {
            window.alert(getApiErrorMessage(e, 'Suppression impossible.'));
        } finally {
            setDeleting(false);
        }
    }

    if (!projet) return <p>Chargement…</p>;

    const suiviAffiche =
        serviceSelectionne !== null
            ? suivis.find((x) => x.service?.nom === serviceSelectionne)
            : undefined;

    return (
        <div>
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                    <Link to="/projets" style={{ fontSize: 14 }}>
                        ← Projets
                    </Link>
                    <Link to={`/rapports/${projet.id}`} style={{ fontSize: 14 }}>
                        Rapports / exports
                    </Link>
                    {canEditProjet && (
                        <Link to={`/projets/${projet.id}/editer`} style={{ fontSize: 14 }}>
                            Modifier le projet
                        </Link>
                    )}
                    {canDeleteProjet && (
                        <button
                            type="button"
                            onClick={(ev) => {
                                ev.preventDefault();
                                void supprimerProjet();
                            }}
                            disabled={deleting}
                            style={{
                                fontSize: 14,
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: deleting ? 'wait' : 'pointer',
                                color: 'var(--danger)',
                                textDecoration: 'underline',
                            }}
                        >
                            {deleting ? 'Suppression…' : 'Supprimer le projet'}
                        </button>
                    )}
                </div>
                <h1 className="page-title">{projet.nom}</h1>
                <p className="page-sub" style={{ marginBottom: 12 }}>
                    <strong>{projet.reference}</strong> · Client : {projet.client} · Fin prévue :{' '}
                    {new Date(projet.date_fin_prevue).toLocaleDateString('fr-FR')}
                    {projet.responsable && (
                        <>
                            {' '}
                            · Responsable : {projet.responsable.prenom} {projet.responsable.nom}
                        </>
                    )}
                </p>
                <div style={{ height: 10, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                    <div
                        style={{
                            width: `${projet.taux_avancement}%`,
                            height: '100%',
                            background: '#2563eb',
                            transition: 'width 0.3s',
                        }}
                    />
                </div>
                <p style={{ textAlign: 'right', fontSize: 14, color: 'var(--muted)', marginTop: 6 }}>
                    {projet.taux_avancement}% avancement global (moyenne des services)
                </p>
            </div>

            {historique.length > 0 && (
                <div className="card" style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: '1.05rem', marginTop: 0 }}>Journal des modifications</h2>
                    <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0 }}>
                        Dernières entrées enregistrées pour ce projet (projet, suivis, OF).
                    </p>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Table</th>
                                    <th>Action</th>
                                    <th>Utilisateur</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historique.slice(0, 50).map((h) => (
                                    <tr key={h.id}>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            {new Date(h.cree_le).toLocaleString('fr-FR')}
                                        </td>
                                        <td>{TABLE_HISTO_LABELS[h.table_cible] ?? h.table_cible}</td>
                                        <td>{h.action}</td>
                                        <td style={{ fontSize: 13, color: 'var(--muted)' }}>
                                            {h.utilisateur_id ? h.utilisateur_id.slice(0, 8) + '…' : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <h2 style={{ fontSize: '1.15rem', marginBottom: 8 }}>Suivi par service</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0, marginBottom: 8 }}>
                Parcourez les étapes du workflow : avancement, dates réelles, commentaires et blocages.
            </p>

            <ProjectStepper
                activeId={serviceSelectionne}
                onStepClick={(nom) => setServiceSelectionne(nom)}
                steps={SERVICE_ORDER.map((nom) => {
                    const s = suivis.find((x) => x.service?.nom === nom);
                    return {
                        id: nom,
                        label: SERVICE_TAB_LABELS[nom],
                        percent: s != null ? s.taux_avancement : null,
                        disabled: !s,
                    };
                })}
            />

            {suiviAffiche && (
                <div className="project-stepper-content" key={suiviAffiche.id} style={{ marginBottom: 36 }}>
                    <SuiviCard
                        key={suiviAffiche.id}
                        projetId={projet.id}
                        suivi={suiviAffiche}
                        canEdit={canEdit}
                        canOF={canOF}
                        onRefresh={async () => {
                            const list = await suiviService.getByProjet(id!);
                            setSuivis(list);
                            const p2 = await projetsService.getById(id!);
                            setProjet(p2);
                        }}
                    />
                </div>
            )}

            {ofsRetard.length > 0 && (
                <div className="card" style={{ borderColor: '#fecaca', background: '#fffafa' }}>
                    <h2 style={{ marginTop: 0, color: 'var(--danger)', fontSize: '1.1rem' }}>
                        OF en retard sur ce projet ({ofsRetard.length})
                    </h2>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>N° OF</th>
                                    <th>Désignation</th>
                                    <th>Fin prévue</th>
                                    <th>Retard</th>
                                    <th>État</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ofsRetard.map((of) => (
                                    <tr key={of.id}>
                                        <td style={{ fontWeight: 600 }}>{of.numero_of}</td>
                                        <td>{of.designation}</td>
                                        <td>{new Date(of.date_fin_prevue).toLocaleDateString('fr-FR')}</td>
                                        <td style={{ color: 'var(--danger)', fontWeight: 600 }}>
                                            {of.jours_retard ?? '—'} j
                                        </td>
                                        <td>{ETAT_OF_LABELS[of.etat]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function SuiviCard({
    projetId,
    suivi,
    canEdit,
    canOF,
    onRefresh,
}: {
    projetId: string;
    suivi: SuiviService;
    canEdit: boolean;
    canOF: boolean;
    onRefresh: () => Promise<void>;
}) {
    const [avancement, setAvancement] = useState(suivi.taux_avancement);
    const [commentaire, setCommentaire] = useState(suivi.commentaire || '');
    const [blocage, setBlocage] = useState(suivi.blocage || '');
    const [statut, setStatut] = useState<StatutSuivi>(suivi.statut);
    const [deb, setDeb] = useState(() => toDateInputValue(suivi.date_debut_reelle));
    const [fin, setFin] = useState(() => toDateInputValue(suivi.date_fin_reelle));
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [ofForm, setOfForm] = useState<CreateOFDTO>({
        numero_of: '',
        designation: '',
        date_lancement: '',
        date_fin_prevue: '',
        commentaire: '',
    });
    const [ofBusy, setOfBusy] = useState(false);

    // Ne resynchroniser que lorsque le serveur a réellement renvoyé des données à jour
    // (évite d’écraser la saisie à chaque re-render ou changement de référence d’objet `suivi`).
    const syncKey = `${suivi.id}|${String(suivi.mis_a_jour_le ?? '')}`;
    useEffect(() => {
        setAvancement(suivi.taux_avancement);
        setCommentaire(suivi.commentaire || '');
        setBlocage(suivi.blocage || '');
        setStatut(suivi.statut);
        setDeb(toDateInputValue(suivi.date_debut_reelle));
        setFin(toDateInputValue(suivi.date_fin_reelle));
        setSaveError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- on veut seulement resync quand syncKey (serveur) change
    }, [syncKey]);

    const nomService = suivi.service?.nom as NomService | undefined;
    const label = nomService ? SERVICE_LABELS[nomService] : 'Service';
    const showOF = nomService === 'METHODES' || nomService === 'PRODUCTION';
    const ofs = suivi.ordres_fabrication || [];

    async function save() {
        setSaveError(null);
        setSaving(true);
        try {
            await suiviService.update(suivi.id, {
                taux_avancement: avancement,
                commentaire,
                blocage,
                statut,
                date_debut_reelle: normalizeDateForApi(deb),
                date_fin_reelle: normalizeDateForApi(fin),
            });
            await onRefresh();
        } catch (e) {
            setSaveError(
                getApiErrorMessage(e, 'Enregistrement impossible (droits, réseau ou serveur).')
            );
        } finally {
            setSaving(false);
        }
    }

    async function addOF(e: React.FormEvent) {
        e.preventDefault();
        if (!ofForm.numero_of || !ofForm.designation || !ofForm.date_lancement || !ofForm.date_fin_prevue)
            return;
        setOfBusy(true);
        try {
            await ofService.create(suivi.id, {
                projet_id: projetId,
                ...ofForm,
            });
            setOfForm({
                numero_of: '',
                designation: '',
                date_lancement: '',
                date_fin_prevue: '',
                commentaire: '',
            });
            await onRefresh();
        } finally {
            setOfBusy(false);
        }
    }

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border)',
                    background: 'linear-gradient(135deg, rgba(30, 91, 255, 0.08), rgba(106, 13, 173, 0.06))',
                }}
            >
                <strong style={{ fontSize: '1.05rem' }}>{label}</strong>
                <span
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '2px 10px',
                        borderRadius: 999,
                        background: 'rgba(30, 91, 255, 0.15)',
                        color: 'var(--primary-bright, var(--primary))',
                    }}
                >
                    {STATUT_SUIVI_LABELS[statut]}
                </span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '1.1rem' }}>{avancement}%</span>
            </div>

            <div style={{ padding: 18, display: 'grid', gap: 14 }}>
                    <label>
                        Avancement : {avancement}%
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={avancement}
                            onChange={(e) => setAvancement(Number(e.target.value))}
                            disabled={!canEdit}
                            style={{ width: '100%', marginTop: 6 }}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
                        Statut du suivi
                        <select
                            value={statut}
                            onChange={(e) => setStatut(e.target.value as StatutSuivi)}
                            disabled={!canEdit}
                            style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
                        >
                            {(Object.keys(STATUT_SUIVI_LABELS) as StatutSuivi[]).map((k) => (
                                <option key={k} value={k}>
                                    {STATUT_SUIVI_LABELS[k]}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600 }}>
                            Début réel
                            <input
                                type="date"
                                value={deb}
                                onChange={(e) => setDeb(e.target.value)}
                                disabled={!canEdit}
                                style={{ width: '100%', marginTop: 6, padding: 8, borderRadius: 8 }}
                            />
                        </label>
                        <label style={{ fontSize: 13, fontWeight: 600 }}>
                            Fin réelle
                            <input
                                type="date"
                                value={fin}
                                onChange={(e) => setFin(e.target.value)}
                                disabled={!canEdit}
                                style={{ width: '100%', marginTop: 6, padding: 8, borderRadius: 8 }}
                            />
                        </label>
                    </div>

                    <label>
                        Commentaire
                        <textarea
                            value={commentaire}
                            onChange={(e) => setCommentaire(e.target.value)}
                            disabled={!canEdit}
                            rows={3}
                            style={{ width: '100%', marginTop: 4, padding: 10, borderRadius: 8 }}
                        />
                    </label>
                    <label>
                        Blocage éventuel
                        <textarea
                            value={blocage}
                            onChange={(e) => setBlocage(e.target.value)}
                            disabled={!canEdit}
                            rows={2}
                            style={{ width: '100%', marginTop: 4, padding: 10, borderRadius: 8 }}
                        />
                    </label>

                    {saveError && (
                        <p role="alert" style={{ color: 'var(--danger)', margin: 0, fontSize: 14 }}>
                            {saveError}
                        </p>
                    )}
                    {canEdit && (
                        <button type="button" className="btn btn-primary" style={{ justifySelf: 'start' }} onClick={save} disabled={saving}>
                            {saving ? 'Enregistrement…' : 'Enregistrer le suivi'}
                        </button>
                    )}

                    {showOF && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Ordres de fabrication (ce service)</h3>
                            {ofs.length > 0 && (
                                <div className="table-wrap" style={{ marginBottom: 12 }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>N° OF</th>
                                                <th>Désignation</th>
                                                <th>Fin prévue</th>
                                                <th>%</th>
                                                <th>État</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ofs.map((o) => (
                                                <tr key={o.id}>
                                                    <td>{o.numero_of}</td>
                                                    <td>{o.designation}</td>
                                                    <td>{new Date(o.date_fin_prevue).toLocaleDateString('fr-FR')}</td>
                                                    <td>{o.taux_avancement}%</td>
                                                    <td>{ETAT_OF_LABELS[o.etat]}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {canOF && (
                                <form onSubmit={addOF} style={{ display: 'grid', gap: 10 }}>
                                    <strong style={{ fontSize: 14 }}>Nouvel OF</strong>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                                        <input
                                            required
                                            placeholder="N° OF"
                                            value={ofForm.numero_of}
                                            onChange={(e) => setOfForm((f) => ({ ...f, numero_of: e.target.value }))}
                                            style={{ padding: 8, borderRadius: 8 }}
                                        />
                                        <input
                                            required
                                            placeholder="Désignation"
                                            value={ofForm.designation}
                                            onChange={(e) => setOfForm((f) => ({ ...f, designation: e.target.value }))}
                                            style={{ padding: 8, borderRadius: 8 }}
                                        />
                                        <input
                                            required
                                            type="date"
                                            value={ofForm.date_lancement}
                                            onChange={(e) => setOfForm((f) => ({ ...f, date_lancement: e.target.value }))}
                                            style={{ padding: 8, borderRadius: 8 }}
                                        />
                                        <input
                                            required
                                            type="date"
                                            value={ofForm.date_fin_prevue}
                                            onChange={(e) => setOfForm((f) => ({ ...f, date_fin_prevue: e.target.value }))}
                                            style={{ padding: 8, borderRadius: 8 }}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-ghost" disabled={ofBusy}>
                                        {ofBusy ? 'Création…' : 'Ajouter l’OF'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
        </div>
    );
}
