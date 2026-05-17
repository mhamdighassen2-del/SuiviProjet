// ============================================================
//  RepereTable — Tableau de repères style Excel
// ============================================================
import { FormEvent, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../services/api';
import { reperesService } from '../services/reperes.service';
import { Repere, StatutRepere, CelluleType, CreateRepereDTO, UpdateRepereDTO } from '../types/models';
import { CAUSES_RETARD, CauseRetard } from '../constants/causesRetard';

const STATUT_LABELS: Record<StatutRepere, string> = {
    PLANIFIE: 'Planifié',
    EN_COURS: 'En cours',
    CLOTURE: 'Clôturé',
};

const STATUT_COLORS: Record<StatutRepere, string> = {
    PLANIFIE: '#dbeafe',
    EN_COURS: '#fef9c3',
    CLOTURE: '#dcfce7',
};

const CELLULE_LABELS: Record<CelluleType, string> = {
    DEBITAGE: 'Débitage',
    USINAGE: 'Usinage',
    ASSEMBLAGE: 'Assemblage',
    AJUSTAGE: 'Ajustage',
};

interface Props {
    projetId: string;
    canEdit: boolean;
    /** Code consolidé "YYYY-CCC-DDD" affiché dans le pied du tableau,
     *  aligné sur la cellule "Total Projet : …" du modèle Excel. */
    projetCode?: string;
}

const inp: React.CSSProperties = {
    padding: '5px 7px', borderRadius: 6, border: '1px solid var(--border)',
    fontSize: 13, width: '100%', boxSizing: 'border-box',
};

export function RepereTable({ projetId, canEdit, projetCode }: Props) {
    const [reperes, setReperes] = useState<Repere[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRow, setEditRow] = useState<UpdateRepereDTO>({});
    const [saving, setSaving] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newRow, setNewRow] = useState<CreateRepereDTO>({
        designation: '', numero_of: '', statut: 'PLANIFIE',
        temps_estime: 0, avancement: 0, cellule: undefined, cause_retard: null,
    });

    async function load() {
        try {
            const data = await reperesService.getByProjet(projetId);
            setReperes(data);
        } catch (e) {
            setError(getApiErrorMessage(e, 'Impossible de charger les repères.'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { void load(); }, [projetId]);

    function startEdit(r: Repere) {
        setEditingId(r.id);
        setEditRow({
            designation: r.designation,
            numero_of: r.numero_of ?? '',
            statut: r.statut,
            temps_estime: r.temps_estime,
            avancement: r.avancement,
            cause_retard: r.cause_retard ?? null,
            cellule: r.cellule,
        });
    }

    async function saveEdit(id: string) {
        setSaving(true);
        setError(null);
        try {
            await reperesService.update(id, {
                ...editRow,
                avancement: Number(editRow.avancement),
                temps_estime: Number(editRow.temps_estime),
            });
            setEditingId(null);
            await load();
        } catch (e) {
            setError(getApiErrorMessage(e, 'Mise à jour impossible.'));
        } finally {
            setSaving(false);
        }
    }

    async function deleteRepere(id: string, code: string) {
        if (!window.confirm(`Supprimer le repère ${code} ?`)) return;
        setError(null);
        try {
            await reperesService.delete(id);
            await load();
        } catch (e) {
            setError(getApiErrorMessage(e, 'Suppression impossible.'));
        }
    }

    async function addRepere(e: FormEvent) {
        e.preventDefault();
        if (!newRow.designation?.trim()) return;
        setSaving(true);
        setError(null);
        try {
            await reperesService.create(projetId, {
                ...newRow,
                avancement: Number(newRow.avancement) || 0,
                temps_estime: Number(newRow.temps_estime) || 0,
                numero_of: newRow.numero_of?.trim() || undefined,
                cause_retard: newRow.cause_retard || null,
                cellule: newRow.cellule || undefined,
            });
            setNewRow({ designation: '', numero_of: '', statut: 'PLANIFIE', temps_estime: 0, avancement: 0, cause_retard: null });
            setShowAdd(false);
            await load();
        } catch (e) {
            setError(getApiErrorMessage(e, 'Création impossible.'));
        } finally {
            setSaving(false);
        }
    }

    // Totaux
    const tempsTotal = reperes.reduce((s, r) => s + r.temps_estime, 0);
    const tempsFait  = reperes.reduce((s, r) => s + r.avancement * r.temps_estime, 0);
    const tauxGlobal = tempsTotal > 0 ? Math.min(Math.round((tempsFait / tempsTotal) * 100), 100) : 0;

    if (loading) return <p style={{ fontSize: 14 }}>Chargement des repères…</p>;

    return (
        <div>
            {error && (
                <p role="alert" style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 8 }}>{error}</p>
            )}

            <div className="table-wrap">
                <table className="data-table" style={{ fontSize: 13 }}>
                    <thead>
                        <tr>
                            <th>Code repère</th>
                            <th>Désignation</th>
                            <th>N° OF</th>
                            <th>Cellule</th>
                            <th>Statut</th>
                            <th style={{ textAlign: 'right' }}>Tps estimé (min)</th>
                            <th style={{ textAlign: 'right' }}>Avancement %</th>
                            <th style={{ textAlign: 'right' }}>Tps réalisé (min)</th>
                            <th>Cause retard</th>
                            {canEdit && <th style={{ width: 100 }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {reperes.length === 0 && (
                            <tr>
                                <td colSpan={canEdit ? 10 : 9} style={{ textAlign: 'center', color: 'var(--muted)', padding: '16px 0' }}>
                                    Aucun repère — ajoutez le premier ci-dessous.
                                </td>
                            </tr>
                        )}
                        {reperes.map((r) =>
                            editingId === r.id ? (
                                <tr key={r.id} style={{ background: '#f0f9ff' }}>
                                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.code}</td>
                                    <td>
                                        <input style={inp} value={editRow.designation ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, designation: e.target.value }))} />
                                    </td>
                                    <td>
                                        <input style={inp} value={editRow.numero_of ?? ''} placeholder="N° OF" onChange={(e) => setEditRow((p) => ({ ...p, numero_of: e.target.value }))} />
                                    </td>
                                    <td>
                                        <select style={inp} value={editRow.cellule ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, cellule: (e.target.value as CelluleType) || undefined }))}>
                                            <option value="">—</option>
                                            {(Object.keys(CELLULE_LABELS) as CelluleType[]).map((c) => <option key={c} value={c}>{CELLULE_LABELS[c]}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <select style={inp} value={editRow.statut ?? 'PLANIFIE'} onChange={(e) => setEditRow((p) => ({ ...p, statut: e.target.value as StatutRepere }))}>
                                            {(Object.keys(STATUT_LABELS) as StatutRepere[]).map((s) => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <input style={{ ...inp, textAlign: 'right' }} type="number" min={0} value={editRow.temps_estime ?? 0} onChange={(e) => setEditRow((p) => ({ ...p, temps_estime: Number(e.target.value) }))} />
                                    </td>
                                    <td>
                                        <input style={{ ...inp, textAlign: 'right' }} type="number" min={0} max={100} step={1} value={Math.round((editRow.avancement ?? 0) * 100)} onChange={(e) => setEditRow((p) => ({ ...p, avancement: Number(e.target.value) / 100 }))} />
                                    </td>
                                    <td style={{ textAlign: 'right', color: 'var(--muted)' }}>
                                        {Math.round((editRow.avancement ?? 0) * (editRow.temps_estime ?? 0))}
                                    </td>
                                    <td>
                                        <select style={inp} value={editRow.cause_retard ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, cause_retard: (e.target.value as CauseRetard) || null }))}>
                                            <option value="">—</option>
                                            {CAUSES_RETARD.map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </td>
                                    {canEdit && (
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-primary" style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => void saveEdit(r.id)} disabled={saving}>✓</button>
                                                <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => setEditingId(null)}>✕</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ) : (
                                <tr key={r.id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>{r.code}</td>
                                    <td style={{ fontWeight: 500 }}>{r.designation}</td>
                                    <td style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: 12 }}>{r.numero_of ?? '—'}</td>
                                    <td>{r.cellule ? CELLULE_LABELS[r.cellule] : '—'}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                                            fontSize: 12, fontWeight: 600, background: STATUT_COLORS[r.statut],
                                            color: r.statut === 'CLOTURE' ? '#15803d' : r.statut === 'EN_COURS' ? '#92400e' : '#1d4ed8',
                                        }}>
                                            {STATUT_LABELS[r.statut]}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.temps_estime}</td>
                                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: r.avancement >= 1 ? 'var(--success)' : 'inherit' }}>
                                        {Math.round(r.avancement * 100)}%
                                    </td>
                                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--muted)' }}>
                                        {Math.round(r.avancement * r.temps_estime)}
                                    </td>
                                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{r.cause_retard ?? '—'}</td>
                                    {canEdit && (
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => startEdit(r)}>✎</button>
                                                <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 12, color: 'var(--danger)' }} onClick={() => void deleteRepere(r.id, r.code)}>✕</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )
                        )}
                    </tbody>
                    {reperes.length > 0 && (
                        <tfoot>
                            <tr style={{ background: 'rgba(30,91,255,0.05)', fontWeight: 700 }}>
                                <td colSpan={5} style={{ textAlign: 'right', paddingRight: 12 }}>
                                    {projetCode
                                        ? <>Total Projet&nbsp;: <span style={{ fontFamily: 'monospace' }}>{projetCode}</span> ({reperes.length} repère{reperes.length > 1 ? 's' : ''})</>
                                        : <>Total projet ({reperes.length} repère{reperes.length > 1 ? 's' : ''})</>}
                                </td>
                                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{tempsTotal}</td>
                                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: tauxGlobal >= 100 ? 'var(--success)' : 'var(--primary)' }}>
                                    {tauxGlobal}%
                                </td>
                                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--muted)' }}>
                                    {Math.round(tempsFait)}
                                </td>
                                <td colSpan={canEdit ? 2 : 1} />
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {canEdit && (
                <div style={{ marginTop: 12 }}>
                    {!showAdd ? (
                        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowAdd(true)}>
                            + Ajouter un repère
                        </button>
                    ) : (
                        <div className="card" style={{ marginTop: 8, padding: 16 }}>
                            <strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>Nouveau repère</strong>
                            <form onSubmit={addRepere}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 10 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600 }}>
                                        Désignation *
                                        <input required style={inp} value={newRow.designation} onChange={(e) => setNewRow((p) => ({ ...p, designation: e.target.value }))} placeholder="ex. Pilier 1" />
                                    </label>
                                    <label style={{ fontSize: 12, fontWeight: 600 }}>
                                        N° OF
                                        <input style={inp} value={newRow.numero_of ?? ''} onChange={(e) => setNewRow((p) => ({ ...p, numero_of: e.target.value }))} placeholder="ex. 03452/2026-1" />
                                    </label>
                                    <label style={{ fontSize: 12, fontWeight: 600 }}>
                                        Cellule
                                        <select style={inp} value={newRow.cellule ?? ''} onChange={(e) => setNewRow((p) => ({ ...p, cellule: (e.target.value as CelluleType) || undefined }))}>
                                            <option value="">—</option>
                                            {(Object.keys(CELLULE_LABELS) as CelluleType[]).map((c) => <option key={c} value={c}>{CELLULE_LABELS[c]}</option>)}
                                        </select>
                                    </label>
                                    <label style={{ fontSize: 12, fontWeight: 600 }}>
                                        Statut
                                        <select style={inp} value={newRow.statut ?? 'PLANIFIE'} onChange={(e) => setNewRow((p) => ({ ...p, statut: e.target.value as StatutRepere }))}>
                                            {(Object.keys(STATUT_LABELS) as StatutRepere[]).map((s) => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
                                        </select>
                                    </label>
                                    <label style={{ fontSize: 12, fontWeight: 600 }}>
                                        Temps estimé (min)
                                        <input type="number" min={0} style={inp} value={newRow.temps_estime ?? 0} onChange={(e) => setNewRow((p) => ({ ...p, temps_estime: Number(e.target.value) }))} />
                                    </label>
                                    <label style={{ fontSize: 12, fontWeight: 600 }}>
                                        Avancement %
                                        <input type="number" min={0} max={100} step={1} style={inp} value={Math.round((newRow.avancement ?? 0) * 100)} onChange={(e) => setNewRow((p) => ({ ...p, avancement: Number(e.target.value) / 100 }))} />
                                    </label>
                                    <label style={{ fontSize: 12, fontWeight: 600 }}>
                                        Cause retard
                                        <select style={inp} value={newRow.cause_retard ?? ''} onChange={(e) => setNewRow((p) => ({ ...p, cause_retard: (e.target.value as CauseRetard) || null }))}>
                                            <option value="">—</option>
                                            {CAUSES_RETARD.map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </label>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ fontSize: 13 }}>
                                        {saving ? 'Création…' : 'Ajouter'}
                                    </button>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)} style={{ fontSize: 13 }}>
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
