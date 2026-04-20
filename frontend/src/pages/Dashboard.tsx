// ============================================================
//  Tableau de bord — §4.2 cahier des charges (KPI + graphiques)
// ============================================================
import { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { dashboardService } from '../services/projets.service';
import { DashboardKPIs, NomService } from '../types/models';

const SERVICE_CHART_LABEL: Record<NomService, string> = {
    ETUDE: 'Étude',
    METHODES: 'Méthodes',
    PRODUCTION: 'Production',
    QUALITE_PRODUIT: 'Qualité',
};

/** Palette EMP (lisible sur fond sombre / clair) */
const PIE_COLORS = ['#1e5bff', '#ff1e4d', '#34d399', '#6a0dad'];
const CHART_GRID = 'rgba(148, 163, 184, 0.15)';
const CHART_AXIS = '#94a3b8';
const BAR_FILL = '#1e5bff';

const tooltipStyle = {
    backgroundColor: 'rgba(15, 22, 38, 0.95)',
    border: '1px solid rgba(30, 91, 255, 0.35)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: 13,
};
const tooltipStyleLight = {
    ...tooltipStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    border: '1px solid rgba(13, 59, 158, 0.2)',
    color: '#0f172a',
};

export default function Dashboard() {
    const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [light, setLight] = useState(false);

    useEffect(() => {
        dashboardService
            .getKPIs()
            .then(setKpis)
            .catch(() => setErr('Impossible de charger les indicateurs.'));
    }, []);

    useEffect(() => {
        const el = document.documentElement;
        const sync = () => setLight(el.getAttribute('data-theme') === 'light');
        sync();
        const obs = new MutationObserver(sync);
        obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
        return () => obs.disconnect();
    }, []);

    if (err) return <p style={{ color: 'var(--danger)' }}>{err}</p>;
    if (!kpis) return <p>Chargement du tableau de bord…</p>;

    const barData = kpis.avancement_par_service.map((r) => ({
        name: SERVICE_CHART_LABEL[r.service] || r.service,
        taux: r.taux_moyen,
    }));

    const nonDemarre = Math.max(
        0,
        kpis.total_projets -
            kpis.projets_en_cours -
            kpis.projets_en_retard -
            kpis.projets_termines
    );

    const pieData = [
        { name: 'En cours', value: kpis.projets_en_cours },
        { name: 'En retard', value: kpis.projets_en_retard },
        { name: 'Terminés', value: kpis.projets_termines },
        { name: 'Non démarré', value: nonDemarre },
    ].filter((d) => d.value > 0);

    const pieFallback =
        pieData.length === 0 ? [{ name: 'Aucun projet', value: 1 }] : pieData;

    return (
        <div>
            <h1 className="page-title">Tableau de bord</h1>
            <p className="page-sub">
                Vue synthétique : projets, avancement global, répartition par service et OF en retard.
            </p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 16,
                    marginBottom: 28,
                }}
            >
                <KpiCard label="Projets totaux" value={kpis.total_projets} />
                <KpiCard label="En cours" value={kpis.projets_en_cours} color="#1e5bff" />
                <KpiCard label="En retard" value={kpis.projets_en_retard} color="#ff1e4d" />
                <KpiCard label="Terminés" value={kpis.projets_termines} color="#34d399" />
                <KpiCard label="Avancement global" value={`${kpis.taux_avancement_global}%`} />
                <KpiCard label="OF en retard" value={kpis.ofs_en_retard} color="#fbbf24" />
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 24,
                    alignItems: 'stretch',
                }}
            >
                <div className="card" style={{ minHeight: 320 }}>
                    <h2 style={{ marginTop: 0, fontSize: '1.05rem', color: 'var(--text)' }}>Avancement moyen par service</h2>
                    <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0 }}>
                        Étude, Méthodes, Production, Qualité Produit
                    </p>
                    <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                            <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: CHART_AXIS }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: CHART_AXIS }} unit="%" />
                                <Tooltip
                                    formatter={(v: number) => [`${v}%`, 'Moyenne']}
                                    contentStyle={light ? tooltipStyleLight : tooltipStyle}
                                />
                                <Bar dataKey="taux" fill={BAR_FILL} name="Avancement %" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ minHeight: 320 }}>
                    <h2 style={{ marginTop: 0, fontSize: '1.05rem', color: 'var(--text)' }}>Répartition des projets</h2>
                    <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0 }}>Par statut</p>
                    <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieFallback}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={88}
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {pieFallback.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={light ? tooltipStyleLight : tooltipStyle} />
                                <Legend wrapperStyle={{ color: 'var(--text-muted)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({
    label,
    value,
    color = 'var(--text)',
}: {
    label: string;
    value: string | number;
    color?: string;
}) {
    return (
        <div className="card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
            <div style={{ color: 'var(--muted)', marginTop: 4, fontSize: 14 }}>{label}</div>
        </div>
    );
}
