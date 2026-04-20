// ============================================================
//  Gestion des utilisateurs — ADMIN uniquement
// ============================================================
import { FormEvent, useEffect, useState } from 'react';
import { utilisateursService } from '../services/utilisateurs.service';
import { Utilisateur, RoleUtilisateur } from '../types/models';

const ROLES: { value: RoleUtilisateur; label: string }[] = [
    { value: 'UTILISATEUR', label: 'Utilisateur' },
    { value: 'RESPONSABLE_SERVICE', label: 'Responsable service' },
    { value: 'CHEF_PROJET', label: 'Chef de projet' },
    { value: 'ADMIN', label: 'Administrateur' },
];

export default function Utilisateurs() {
    const [list, setList] = useState<Utilisateur[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [role, setRole] = useState<RoleUtilisateur>('UTILISATEUR');
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

    async function onCreate(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        setSaving(true);
        try {
            await utilisateursService.create({
                nom: nom.trim(),
                prenom: prenom.trim(),
                email: email.trim(),
                mot_de_passe: motDePasse,
                role,
            });
            setNom('');
            setPrenom('');
            setEmail('');
            setMotDePasse('');
            setRole('UTILISATEUR');
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

    async function toggleActif(u: Utilisateur) {
        if (!u.actif) {
            setErr('Réactiver un compte : utilisez la modification (à venir) ou SQL.');
            return;
        }
        if (!window.confirm(`Désactiver ${u.prenom} ${u.nom} ?`)) return;
        try {
            await utilisateursService.desactiver(u.id);
            reload();
        } catch {
            setErr('Désactivation impossible.');
        }
    }

    if (loading && list.length === 0) return <p>Chargement…</p>;

    return (
        <div>
            <h1 className="page-title">Utilisateurs</h1>
            <p className="page-sub">Création et liste des comptes (réservé aux administrateurs).</p>

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
                            onChange={(e) => setRole(e.target.value as RoleUtilisateur)}
                            style={inp}
                        >
                            {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </label>
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
                            <th>Actif</th>
                            <th></th>
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
                                <td>{u.actif ? 'Oui' : 'Non'}</td>
                                <td>
                                    {u.actif && (
                                        <button type="button" className="btn btn-ghost" onClick={() => toggleActif(u)}>
                                            Désactiver
                                        </button>
                                    )}
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
