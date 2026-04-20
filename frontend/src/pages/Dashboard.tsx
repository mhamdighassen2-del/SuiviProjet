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

const PIE_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#6b7280'];

export default function Dashboard() {
    const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        dashboardService
            .getKPIs()
            .then(setKpis)
            .catch(() => setErr('Impossible de charger les indicateurs.'));
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
                <KpiCard label="En cours" value={kpis.projets_en_cours} color="#2563eb" />
                <KpiCard label="En retard" value={kpis.projets_en_retard} color="#dc2626" />
                <KpiCard label="Terminés" value={kpis.projets_termines} color="#16a34a" />
                <KpiCard label="Avancement global" value={`${kpis.taux_avancement_global}%`} />
                <KpiCard label="OF en retard" value={kpis.ofs_en_retard} color="#ea580c" />
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
                    <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Avancement moyen par service</h2>
                    <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0 }}>
                        Étude, Méthodes, Production, Qualité Produit
                    </p>
                    <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                            <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                                <Tooltip formatter={(v: number) => [`${v}%`, 'Moyenne']} />
                                <Bar dataKey="taux" fill="#2563eb" name="Avancement %" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ minHeight: 320 }}>
                    <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Répartition des projets</h2>
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
                                <Tooltip />
                                <Legend />
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
    color = '#374151',
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
