// ============================================================
//  Gestion des utilisateurs — ADMIN uniquement
// ============================================================
import { FormEvent, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../services/api';
import { utilisateursService } from '../services/utilisateurs.service';
import { referentielService } from '../services/referentiel.service';
import { useAuthStore } from '../stores/auth.store';
import { Utilisateur, RoleUtilisateur, NomService, CelluleType } from '../types/models';

const ROLES: { value: RoleUtilisateur; label: string }[] = [
    { value: 'UTILISATEUR',         label: 'Utilisateur' },
    { value: 'RESPONSABLE_SERVICE', label: 'Responsable service' },
    { value: 'CHEF_PROJET',         label: 'Chef de projet' },
    { value: 'ADMIN',               label: 'Administrateur' },
];

const SERVICE_LABELS: Record<NomService, string> = {
    ETUDE: 'Étude', METHODES: 'Méthodes', PRODUCTION: 'Production', QUALITE_PRODUIT: 'Qualité Produit',
};

const CELLULE_OPTIONS: { value: CelluleType; label: string }[] = [
    { value: 'DEBITAGE',   label: 'Débitage' },
    { value: 'USINAGE',    label: 'Usinage' },
    { value: 'ASSEMBLAGE', label: 'Assemblage' },
    { value: 'AJUSTAGE',   label: 'Ajustage' },
];

const CELLULE_CONFIG: Record<CelluleType, { label: string; color: string; bg: string; border: string; icon: string }> = {
    DEBITAGE:   { label: 'Débitage',   color: '#d97706', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(217,119,6,0.3)',  icon: '🔩' },
    USINAGE:    { label: 'Usinage',    color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.25)', icon: '⚙️' },
    ASSEMBLAGE: { label: 'Assemblage', color: '#16a34a', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.25)', icon: '🔧' },
    AJUSTAGE:   { label: 'Ajustage',   color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)', icon: '📐' },
};

type FilterTab = CelluleType | 'TOUS' | 'SANS_CELLULE';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
    { value: 'TOUS',        label: 'Tous' },
    { value: 'DEBITAGE',    label: 'Débitage' },
    { value: 'USINAGE',     label: 'Usinage' },
    { value: 'ASSEMBLAGE',  label: 'Assemblage' },
    { value: 'AJUSTAGE',    label: 'Ajustage' },
    { value: 'SANS_CELLULE', label: 'Sans cellule' },
];

export default function Utilisateurs() {
    const currentUserId = useAuthStore((s) => s.user?.id);
    const [list, setList]         = useState<Utilisateur[]>([]);
    const [loading, setLoading]   = useState(true);
    const [err, setErr]           = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<FilterTab>('TOUS');
    const [showForm, setShowForm] = useState(false);

    const [nom, setNom]               = useState('');
    const [prenom, setPrenom]         = useState('');
    const [email, setEmail]           = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [role, setRole]             = useState<RoleUtilisateur>('UTILISATEUR');
    const [serviceId, setServiceId]   = useState('');
    const [cellule, setCellule]       = useState<CelluleType | ''>('');
    const [services, setServices]     = useState<{ id: string; nom: NomService }[]>([]);
    const [saving, setSaving]         = useState(false);

    function reload() {
        setLoading(true);
        utilisateursService.getAll()
            .then(setList)
            .catch(() => setErr('Impossible de charger les utilisateurs.'))
            .finally(() => setLoading(false));
    }

    useEffect(() => { reload(); }, []);
    useEffect(() => {
        referentielService.getServices().then(setServices).catch(() => setServices([]));
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
                nom: nom.trim(), prenom: prenom.trim(), email: email.trim(),
                mot_de_passe: motDePasse, role,
                service_id: role === 'RESPONSABLE_SERVICE' ? serviceId : null,
                cellule: cellule || null,
            });
            setNom(''); setPrenom(''); setEmail(''); setMotDePasse('');
            setRole('UTILISATEUR'); setServiceId(''); setCellule('');
            setShowForm(false);
            reload();
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            setErr(msg || 'Création impossible.');
        } finally {
            setSaving(false);
        }
    }

    async function activerCompte(u: Utilisateur) {
        setErr(null);
        if (!window.confirm(`Activer le compte de ${u.prenom} ${u.nom} ?`)) return;
        try { await utilisateursService.activer(u.id); reload(); }
        catch (e) { setErr(getApiErrorMessage(e, 'Activation impossible.')); }
    }

    async function desactiverCompte(u: Utilisateur) {
        setErr(null);
        if (u.id === currentUserId) { setErr('Vous ne pouvez pas désactiver votre propre compte.'); return; }
        if (!window.confirm(`Désactiver ${u.prenom} ${u.nom} ?`)) return;
        try { await utilisateursService.desactiver(u.id); reload(); }
        catch (e) { setErr(getApiErrorMessage(e, 'Désactivation impossible.')); }
    }

    async function supprimerCompte(u: Utilisateur) {
        setErr(null);
        if (u.id === currentUserId) { setErr('Vous ne pouvez pas supprimer votre propre compte.'); return; }
        if (!window.confirm(`Supprimer définitivement ${u.prenom} ${u.nom} (${u.email}) ?`)) return;
        try { await utilisateursService.delete(u.id); reload(); }
        catch (e) { setErr(getApiErrorMessage(e, 'Suppression impossible.')); }
    }

    async function reinitialiserMotDePasse(u: Utilisateur) {
        setErr(null);
        const np = window.prompt(`Nouveau mot de passe pour ${u.prenom} ${u.nom} — minimum 6 caractères.`);
        if (np === null) return;
        const trimmed = np.trim();
        if (trimmed.length < 6) { setErr('Le mot de passe doit contenir au moins 6 caractères.'); return; }
        const confirm = window.prompt('Confirmer le même mot de passe :');
        if (confirm === null) return;
        if (confirm !== trimmed) { setErr('Les deux saisies ne correspondent pas.'); return; }
        try { await utilisateursService.update(u.id, { mot_de_passe: trimmed }); reload(); }
        catch (e) { setErr(getApiErrorMessage(e, 'Réinitialisation impossible.')); }
    }

    // Filtrage selon onglet actif
    const filtered = list.filter((u) => {
        if (activeTab === 'TOUS') return true;
        if (activeTab === 'SANS_CELLULE') return !u.cellule;
        return u.cellule === activeTab;
    });

    // Comptages par cellule
    const counts: Record<FilterTab, number> = {
        TOUS:         list.length,
        DEBITAGE:     list.filter((u) => u.cellule === 'DEBITAGE').length,
        USINAGE:      list.filter((u) => u.cellule === 'USINAGE').length,
        ASSEMBLAGE:   list.filter((u) => u.cellule === 'ASSEMBLAGE').length,
        AJUSTAGE:     list.filter((u) => u.cellule === 'AJUSTAGE').length,
        SANS_CELLULE: list.filter((u) => !u.cellule).length,
    };

    if (loading && list.length === 0) return <p>Chargement…</p>;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <h1 className="page-title" style={{ margin: 0 }}>Utilisateurs</h1>
                <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
                    {showForm ? 'Fermer' : '+ Nouvel utilisateur'}
                </button>
            </div>
            <p className="page-sub">Gestion des comptes par cellule de production.</p>

            <div className="card" style={{ marginBottom: 20, maxWidth: 720, fontSize: 14, lineHeight: 1.5,
                color: 'var(--muted)', borderLeft: '3px solid var(--accent-end)' }}>
                <strong style={{ color: 'var(--text)' }}>Mots de passe</strong> — Chiffrés en bcrypt.
                En cas de perte, utilisez « Réinitialiser le mot de passe ».
            </div>

            {err && <p role="alert" style={{ color: 'var(--danger)', marginBottom: 12 }}>{err}</p>}

            {/* ---- Formulaire création (collapsible) ---- */}
            {showForm && (
                <div className="card" style={{ marginBottom: 24, maxWidth: 580 }}>
                    <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Nouvel utilisateur</h2>
                    <form onSubmit={onCreate} style={{ display: 'grid', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <label>
                                <span style={lbl}>Nom</span>
                                <input required value={nom} onChange={(e) => setNom(e.target.value)} style={inp} />
                            </label>
                            <label>
                                <span style={lbl}>Prénom</span>
                                <input required value={prenom} onChange={(e) => setPrenom(e.target.value)} style={inp} />
                            </label>
                        </div>
                        <label>
                            <span style={lbl}>Email</span>
                            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} />
                        </label>
                        <label>
                            <span style={lbl}>Mot de passe</span>
                            <input required type="password" value={motDePasse}
                                onChange={(e) => setMotDePasse(e.target.value)} style={inp} minLength={6} />
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <label>
                                <span style={lbl}>Rôle</span>
                                <select value={role} onChange={(e) => {
                                    const v = e.target.value as RoleUtilisateur;
                                    setRole(v);
                                    if (v !== 'RESPONSABLE_SERVICE') setServiceId('');
                                }} style={inp}>
                                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </label>
                            <label>
                                <span style={lbl}>Cellule</span>
                                <select value={cellule}
                                    onChange={(e) => setCellule(e.target.value as CelluleType | '')} style={inp}>
                                    <option value="">— Aucune —</option>
                                    {CELLULE_OPTIONS.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        {role === 'RESPONSABLE_SERVICE' && (
                            <label>
                                <span style={lbl}>Service rattaché</span>
                                <select required value={serviceId}
                                    onChange={(e) => setServiceId(e.target.value)} style={inp}>
                                    <option value="">— Sélectionner —</option>
                                    {services.map((s) => (
                                        <option key={s.id} value={s.id}>{SERVICE_LABELS[s.nom]}</option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Création…' : 'Créer'}
                            </button>
                            <button type="button" className="btn btn-ghost"
                                onClick={() => setShowForm(false)}>Annuler</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ---- Onglets cellule ---- */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {FILTER_TABS.map((tab) => {
                    const cfg = tab.value !== 'TOUS' && tab.value !== 'SANS_CELLULE'
                        ? CELLULE_CONFIG[tab.value as CelluleType] : null;
                    const isActive = activeTab === tab.value;
                    return (
                        <button key={tab.value} type="button" onClick={() => setActiveTab(tab.value)}
                            style={{
                                padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.15s',
                                border: isActive
                                    ? `2px solid ${cfg?.color ?? 'var(--primary)'}`
                                    : '2px solid var(--border)',
                                background: isActive
                                    ? (cfg?.bg ?? 'rgba(30,91,255,0.08)')
                                    : 'var(--card)',
                                color: isActive ? (cfg?.color ?? 'var(--primary)') : 'var(--muted)',
                            }}>
                            {cfg ? `${cfg.icon} ` : ''}{tab.label}
                            <span style={{
                                marginLeft: 6, padding: '1px 7px', borderRadius: 999, fontSize: 11,
                                background: isActive ? (cfg?.color ?? 'var(--primary)') : 'var(--border)',
                                color: isActive ? '#fff' : 'var(--muted)',
                            }}>
                                {counts[tab.value]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ---- Vue groupée par cellule (onglet TOUS) ---- */}
            {activeTab === 'TOUS' ? (
                <div style={{ display: 'grid', gap: 24 }}>
                    {CELLULE_OPTIONS.map(({ value: c }) => {
                        const usersCell = list.filter((u) => u.cellule === c);
                        const cfg = CELLULE_CONFIG[c];
                        if (usersCell.length === 0) return null;
                        return (
                            <div key={c} className="card" style={{
                                borderLeft: `4px solid ${cfg.color}`, padding: 0, overflow: 'hidden',
                            }}>
                                <div style={{
                                    background: cfg.bg, padding: '10px 18px',
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    borderBottom: `1px solid ${cfg.border}`,
                                }}>
                                    <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                                    <span style={{ fontWeight: 700, color: cfg.color, fontSize: 15 }}>
                                        Cellule {cfg.label}
                                    </span>
                                    <span style={{
                                        marginLeft: 6, padding: '1px 8px', borderRadius: 999,
                                        fontSize: 12, fontWeight: 600,
                                        background: cfg.color, color: '#fff',
                                    }}>{usersCell.length}</span>
                                </div>
                                <UserTable users={usersCell} currentUserId={currentUserId}
                                    onActiver={activerCompte} onDesactiver={desactiverCompte}
                                    onSupprimer={supprimerCompte} onReinitMdp={reinitialiserMotDePasse}
                                    showCellule={false} />
                            </div>
                        );
                    })}
                    {/* Sans cellule */}
                    {list.filter((u) => !u.cellule).length > 0 && (
                        <div className="card" style={{ borderLeft: '4px solid var(--muted)', padding: 0, overflow: 'hidden' }}>
                            <div style={{
                                background: 'rgba(100,116,139,0.08)', padding: '10px 18px',
                                display: 'flex', alignItems: 'center', gap: 10,
                                borderBottom: '1px solid rgba(100,116,139,0.2)',
                            }}>
                                <span style={{ fontSize: 18 }}>👤</span>
                                <span style={{ fontWeight: 700, color: 'var(--muted)', fontSize: 15 }}>
                                    Sans cellule
                                </span>
                                <span style={{
                                    marginLeft: 6, padding: '1px 8px', borderRadius: 999,
                                    fontSize: 12, fontWeight: 600,
                                    background: 'var(--muted)', color: '#fff',
                                }}>{list.filter((u) => !u.cellule).length}</span>
                            </div>
                            <UserTable users={list.filter((u) => !u.cellule)} currentUserId={currentUserId}
                                onActiver={activerCompte} onDesactiver={desactiverCompte}
                                onSupprimer={supprimerCompte} onReinitMdp={reinitialiserMotDePasse}
                                showCellule={false} />
                        </div>
                    )}
                </div>
            ) : (
                /* ---- Vue filtrée (un onglet cellule spécifique) ---- */
                <div className="card" style={{
                    padding: 0, overflow: 'hidden',
                    borderLeft: activeTab !== 'SANS_CELLULE'
                        ? `4px solid ${CELLULE_CONFIG[activeTab as CelluleType].color}`
                        : '4px solid var(--muted)',
                }}>
                    {filtered.length === 0 ? (
                        <p style={{ padding: 24, color: 'var(--muted)', textAlign: 'center' }}>
                            Aucun utilisateur dans cette cellule.
                        </p>
                    ) : (
                        <UserTable users={filtered} currentUserId={currentUserId}
                            onActiver={activerCompte} onDesactiver={desactiverCompte}
                            onSupprimer={supprimerCompte} onReinitMdp={reinitialiserMotDePasse}
                            showCellule={activeTab === 'SANS_CELLULE'} />
                    )}
                </div>
            )}
        </div>
    );
}

// ---- Sous-composant tableau utilisateurs ----
interface UserTableProps {
    users: Utilisateur[];
    currentUserId?: string;
    showCellule: boolean;
    onActiver: (u: Utilisateur) => void;
    onDesactiver: (u: Utilisateur) => void;
    onSupprimer: (u: Utilisateur) => void;
    onReinitMdp: (u: Utilisateur) => void;
}

function UserTable({ users, currentUserId, showCellule, onActiver, onDesactiver, onSupprimer, onReinitMdp }: UserTableProps) {
    return (
        <div className="table-wrap" style={{ margin: 0 }}>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        {showCellule && <th>Cellule</th>}
                        <th>Actif</th>
                        <th style={{ minWidth: 280 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => {
                        const cfg = u.cellule ? CELLULE_CONFIG[u.cellule] : null;
                        return (
                            <tr key={u.id}>
                                <td style={{ fontWeight: 600 }}>
                                    {u.prenom} {u.nom}
                                </td>
                                <td style={{ fontSize: 13, color: 'var(--muted)' }}>{u.email}</td>
                                <td>
                                    <span style={{
                                        display: 'inline-block', padding: '2px 10px', borderRadius: 999,
                                        fontSize: 12, fontWeight: 600,
                                        background: 'rgba(100,116,139,0.1)', color: 'var(--text)',
                                    }}>
                                        {ROLES.find((r) => r.value === u.role)?.label ?? u.role}
                                    </span>
                                </td>
                                {showCellule && (
                                    <td>
                                        {cfg ? (
                                            <span style={{
                                                display: 'inline-block', padding: '2px 10px', borderRadius: 999,
                                                fontSize: 12, fontWeight: 600,
                                                background: cfg.bg, color: cfg.color,
                                                border: `1px solid ${cfg.border}`,
                                            }}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                        ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                                    </td>
                                )}
                                <td>
                                    <span style={{
                                        display: 'inline-block', padding: '2px 10px', borderRadius: 999,
                                        fontSize: 12, fontWeight: 600,
                                        background: u.actif ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                                        color: u.actif ? 'var(--success)' : 'var(--danger)',
                                    }}>
                                        {u.actif ? 'Actif' : 'Inactif'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {!u.actif && (
                                            <button type="button" className="btn btn-primary"
                                                style={{ padding: '0.3rem 0.8rem', fontSize: 12 }}
                                                onClick={() => onActiver(u)}>Activer</button>
                                        )}
                                        {u.actif && (
                                            <button type="button" className="btn btn-ghost"
                                                style={{ padding: '0.3rem 0.8rem', fontSize: 12 }}
                                                onClick={() => onDesactiver(u)}
                                                disabled={u.id === currentUserId}
                                                title={u.id === currentUserId ? 'Impossible sur votre propre compte' : undefined}>
                                                Désactiver
                                            </button>
                                        )}
                                        <button type="button" className="btn btn-ghost"
                                            style={{ padding: '0.3rem 0.8rem', fontSize: 12 }}
                                            onClick={() => onReinitMdp(u)}>
                                            Réinit. MDP
                                        </button>
                                        <button type="button" className="btn btn-ghost"
                                            style={{ padding: '0.3rem 0.8rem', fontSize: 12,
                                                color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.35)' }}
                                            onClick={() => onSupprimer(u)}
                                            disabled={u.id === currentUserId}
                                            title={u.id === currentUserId ? 'Impossible sur votre propre compte' : undefined}>
                                            Supprimer
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600 };
const inp: React.CSSProperties = { width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' };
