// ============================================================
//  Gestion des utilisateurs — ADMIN uniquement
// ============================================================
import { FormEvent, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../services/api';
import { utilisateursService } from '../services/utilisateurs.service';
import { referentielService } from '../services/referentiel.service';
import { useAuthStore } from '../stores/auth.store';
import { Utilisateur, RoleUtilisateur, NomService } from '../types/models';

const ROLES: { value: RoleUtilisateur; label: string }[] = [
    { value: 'UTILISATEUR', label: 'Utilisateur' },
    { value: 'RESPONSABLE_SERVICE', label: 'Responsable service' },
    { value: 'CHEF_PROJET', label: 'Chef de projet' },
    { value: 'ADMIN', label: 'Administrateur' },
];

const SERVICE_LABELS: Record<NomService, string> = {
    ETUDE: 'Étude',
    METHODES: 'Méthodes',
    PRODUCTION: 'Production',
    QUALITE_PRODUIT: 'Qualité Produit',
};

export default function Utilisateurs() {
    const currentUserId = useAuthStore((s) => s.user?.id);
    const [list, setList] = useState<Utilisateur[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [role, setRole] = useState<RoleUtilisateur>('UTILISATEUR');
    const [serviceId, setServiceId] = useState('');
    const [services, setServices] = useState<{ id: string; nom: NomService }[]>([]);
    const [saving, setSaving] = useState(false);

    function reload() {
        setLoading(true);
        utilisateursService
            .getAll()
            .then(setList)
            .catch(() => setErr('Impossible de charger les utilisateurs.'))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        reload();
    }, []);

    useEffect(() => {
        referentielService
            .getServices()
            .then(setServices)
            .catch(() => setServices([]));
    }, []);

    async function onCreate(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        if (role === 'RESPONSABLE_SERVICE' && !serviceId) {
            setErr('Choisissez le service pour un responsable de service.');
            return;
        }
        setSaving(true);
        try {
            await utilisateursService.create({
                nom: nom.trim(),
                prenom: prenom.trim(),
                email: email.trim(),
                mot_de_passe: motDePasse,
                role,
                service_id: role === 'RESPONSABLE_SERVICE' ? serviceId : null,
            });
            setNom('');
            setPrenom('');
            setEmail('');
            setMotDePasse('');
            setRole('UTILISATEUR');
            setServiceId('');
            reload();
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : null;
            setErr(msg || 'Création impossible.');
        } finally {
            setSaving(false);
        }
    }

    async function activerCompte(u: Utilisateur) {
        setErr(null);
        if (!window.confirm(`Activer le compte de ${u.prenom} ${u.nom} ? Il pourra à nouveau se connecter.`)) return;
        try {
            await utilisateursService.activer(u.id);
            reload();
        } catch (e) {
            setErr(getApiErrorMessage(e, 'Activation impossible.'));
        }
    }

    async function desactiverCompte(u: Utilisateur) {
        setErr(null);
        if (u.id === currentUserId) {
            setErr('Vous ne pouvez pas désactiver votre propre compte.');
            return;
        }
        if (!window.confirm(`Désactiver ${u.prenom} ${u.nom} ? Il ne pourra plus se connecter.`)) return;
        try {
            await utilisateursService.desactiver(u.id);
            reload();
        } catch (e) {
            setErr(getApiErrorMessage(e, 'Désactivation impossible.'));
        }
    }

    async function supprimerCompte(u: Utilisateur) {
        setErr(null);
        if (u.id === currentUserId) {
            setErr('Vous ne pouvez pas supprimer votre propre compte.');
            return;
        }
        if (
            !window.confirm(
                `Supprimer définitivement ${u.prenom} ${u.nom} (${u.email}) ? Cette action est irréversible.`
            )
        )
            return;
        try {
            await utilisateursService.delete(u.id);
            reload();
        } catch (e) {
            setErr(getApiErrorMessage(e, 'Suppression impossible.'));
        }
    }

    async function reinitialiserMotDePasse(u: Utilisateur) {
        setErr(null);
        const np = window.prompt(
            `Nouveau mot de passe pour ${u.prenom} ${u.nom} (${u.email}) — minimum 6 caractères.\n` +
                '(La saisie est visible : préférez un poste de confiance.)'
        );
        if (np === null) return;
        const trimmed = np.trim();
        if (trimmed.length < 6) {
            setErr('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        const confirm = window.prompt('Confirmer le même mot de passe :');
        if (confirm === null) return;
        if (confirm !== trimmed) {
            setErr('Les deux saisies ne correspondent pas.');
            return;
        }
        try {
            await utilisateursService.update(u.id, { mot_de_passe: trimmed });
            reload();
        } catch (e) {
            setErr(getApiErrorMessage(e, 'Réinitialisation impossible.'));
        }
    }

    if (loading && list.length === 0) return <p>Chargement…</p>;

    return (
        <div>
            <h1 className="page-title">Utilisateurs</h1>
            <p className="page-sub">Création et liste des comptes (réservé aux administrateurs).</p>

            <div
                className="card"
                style={{
                    marginBottom: 20,
                    maxWidth: 720,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: 'var(--muted)',
                    borderLeft: '3px solid var(--accent-end)',
                }}
            >
                <strong style={{ color: 'var(--text)' }}>Mots de passe</strong> — Les mots de passe ne sont pas
                stockés en clair : ils sont chiffrés de façon irréversible (bcrypt).{' '}
                <strong>Personne</strong>, pas même un administrateur, ne peut donc les consulter. En cas de perte,
                utilisez « Réinitialiser le mot de passe » pour en définir un nouveau.
            </div>

            {err && (
                <p role="alert" style={{ color: 'var(--danger)', marginBottom: 12 }}>
                    {err}
                </p>
            )}

            <div className="card" style={{ marginBottom: 24, maxWidth: 560 }}>
                <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Nouvel utilisateur</h2>
                <form onSubmit={onCreate} style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <label>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Nom</span>
                            <input
                                required
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                style={inp}
                            />
                        </label>
                        <label>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Prénom</span>
                            <input
                                required
                                value={prenom}
                                onChange={(e) => setPrenom(e.target.value)}
                                style={inp}
                            />
                        </label>
                    </div>
                    <label>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Email</span>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inp}
                        />
                    </label>
                    <label>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Mot de passe</span>
                        <input
                            required
                            type="password"
                            value={motDePasse}
                            onChange={(e) => setMotDePasse(e.target.value)}
                            style={inp}
                            minLength={6}
                        />
                    </label>
                    <label>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Rôle</span>
                        <select
                            value={role}
                            onChange={(e) => {
                                const v = e.target.value as RoleUtilisateur;
                                setRole(v);
                                if (v !== 'RESPONSABLE_SERVICE') setServiceId('');
                            }}
                            style={inp}
                        >
                            {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    {role === 'RESPONSABLE_SERVICE' && (
                        <label>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Service</span>
                            <select
                                required
                                value={serviceId}
                                onChange={(e) => setServiceId(e.target.value)}
                                style={inp}
                            >
                                <option value="">— Sélectionner —</option>
                                {services.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {SERVICE_LABELS[s.nom]}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Création…' : 'Créer'}
                    </button>
                </form>
            </div>

            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Rôle</th>
                            <th>Service</th>
                            <th>Actif</th>
                            <th style={{ minWidth: 280 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((u) => (
                            <tr key={u.id}>
                                <td>
                                    {u.prenom} {u.nom}
                                </td>
                                <td>{u.email}</td>
                                <td>{ROLES.find((r) => r.value === u.role)?.label ?? u.role}</td>
                                <td style={{ fontSize: 14 }}>
                                    {u.service_nom
                                        ? SERVICE_LABELS[u.service_nom]
                                        : '—'}
                                </td>
                                <td>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            padding: '2px 10px',
                                            borderRadius: 999,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            background: u.actif ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                                            color: u.actif ? 'var(--success)' : 'var(--danger)',
                                        }}
                                    >
                                        {u.actif ? 'Actif' : 'Inactif'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {!u.actif && (
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                style={{ padding: '0.35rem 0.85rem', fontSize: 13 }}
                                                onClick={() => void activerCompte(u)}
                                            >
                                                Activer
                                            </button>
                                        )}
                                        {u.actif && (
                                            <button
                                                type="button"
                                                className="btn btn-ghost"
                                                style={{ padding: '0.35rem 0.85rem', fontSize: 13 }}
                                                onClick={() => void desactiverCompte(u)}
                                                disabled={u.id === currentUserId}
                                                title={u.id === currentUserId ? 'Impossible sur votre propre compte' : undefined}
                                            >
                                                Désactiver
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            style={{ padding: '0.35rem 0.85rem', fontSize: 13 }}
                                            onClick={() => void reinitialiserMotDePasse(u)}
                                            title="Définir un nouveau mot de passe (l’ancien ne peut pas être affiché)"
                                        >
                                            Réinitialiser MDP
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            style={{
                                                padding: '0.35rem 0.85rem',
                                                fontSize: 13,
                                                color: 'var(--danger)',
                                                borderColor: 'rgba(248, 113, 113, 0.35)',
                                            }}
                                            onClick={() => void supprimerCompte(u)}
                                            disabled={u.id === currentUserId}
                                            title={u.id === currentUserId ? 'Impossible sur votre propre compte' : undefined}
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const inp: React.CSSProperties = {
    width: '100%',
    marginTop: 4,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid var(--border)',
};
