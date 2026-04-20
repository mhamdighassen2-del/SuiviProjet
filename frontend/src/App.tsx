// ============================================================
//  App.tsx  —  Routing + layout sidebar (thème EMP)
// ============================================================
import { useEffect, useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import Dashboard from './pages/Dashboard';
import Projets from './pages/Projets';
import ProjetDetail from './pages/ProjetDetail';
import ProjetForm from './pages/ProjetForm';
import Login from './pages/Login';
import OFs from './pages/OFs';
import Rapports from './pages/Rapports';
import Utilisateurs from './pages/Utilisateurs';
import {
    IconChart,
    IconCog,
    IconDashboard,
    IconFolder,
    IconMoon,
    IconSun,
    IconUsers,
} from './components/NavIcons';

function RequireAuth({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, hasRole } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!hasRole('ADMIN')) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
}

function RequireChefOrAdmin({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, hasRole } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!hasRole('CHEF_PROJET', 'ADMIN')) return <Navigate to="/projets" replace />;
    return <>{children}</>;
}

function SessionBoot() {
    const fetchSession = useAuthStore((s) => s.fetchSession);
    useEffect(() => {
        void fetchSession();
    }, [fetchSession]);
    return null;
}

function NavLinkItem({
    to,
    end,
    icon,
    children,
}: {
    to: string;
    end?: boolean;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
            {icon}
            {children}
        </NavLink>
    );
}

function ThemeToggle() {
    const [theme, setTheme] = useState<'dark' | 'light'>(() =>
        document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
    );

    const toggle = useCallback(() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('emp-theme', next);
    }, [theme]);

    return (
        <button type="button" className="theme-toggle" onClick={toggle} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
            {theme === 'dark' ? 'Clair' : 'Sombre'}
        </button>
    );
}

export default function App() {
    const { isAuthenticated, user, logout, hasRole } = useAuthStore();

    return (
        <BrowserRouter>
            <SessionBoot />
            <div className="app-bg-mesh" aria-hidden />
            <div className={`app-shell${isAuthenticated ? ' app-shell--auth' : ''}`}>
                {isAuthenticated && (
                    <aside className="app-sidebar" aria-label="Navigation principale">
                        <div className="app-sidebar__brand">
                            <div className="brand-mark" aria-hidden />
                            <div className="brand-text">
                                <span className="brand-emp">EMP</span>
                                <span className="brand-tagline">Suivi projets</span>
                            </div>
                        </div>
                        <nav className="app-sidebar__nav">
                            <NavLinkItem to="/dashboard" end icon={<IconDashboard />}>
                                Tableau de bord
                            </NavLinkItem>
                            <NavLinkItem to="/projets" icon={<IconFolder />}>
                                Projets
                            </NavLinkItem>
                            <NavLinkItem to="/ofs" icon={<IconCog />}>
                                Ordres de fabrication
                            </NavLinkItem>
                            <NavLinkItem to="/rapports" icon={<IconChart />}>
                                Rapports
                            </NavLinkItem>
                            {hasRole('ADMIN') && (
                                <NavLinkItem to="/utilisateurs" icon={<IconUsers />}>
                                    Utilisateurs
                                </NavLinkItem>
                            )}
                        </nav>
                        <div className="app-sidebar__footer">
                            <div className="app-sidebar__user">
                                <strong>
                                    {user?.prenom} {user?.nom}
                                </strong>
                                <span>{user?.role}</span>
                            </div>
                            <ThemeToggle />
                            <button type="button" className="btn btn-ghost" onClick={logout} style={{ width: '100%' }}>
                                Déconnexion
                            </button>
                        </div>
                    </aside>
                )}

                <div className="app-main-wrap">
                    <main className={`app-main${isAuthenticated ? '' : ' app-main--guest'}`}>
                        <Routes>
                            <Route path="/login" element={<Login />} />

                            <Route
                                path="/dashboard"
                                element={
                                    <RequireAuth>
                                        <Dashboard />
                                    </RequireAuth>
                                }
                            />
                            <Route
                                path="/projets"
                                element={
                                    <RequireAuth>
                                        <Projets />
                                    </RequireAuth>
                                }
                            />
                            <Route
                                path="/projets/nouveau"
                                element={
                                    <RequireChefOrAdmin>
                                        <ProjetForm />
                                    </RequireChefOrAdmin>
                                }
                            />
                            <Route
                                path="/projets/:id/editer"
                                element={
                                    <RequireChefOrAdmin>
                                        <ProjetForm />
                                    </RequireChefOrAdmin>
                                }
                            />
                            <Route
                                path="/projets/:id"
                                element={
                                    <RequireAuth>
                                        <ProjetDetail />
                                    </RequireAuth>
                                }
                            />
                            <Route
                                path="/ofs"
                                element={
                                    <RequireAuth>
                                        <OFs />
                                    </RequireAuth>
                                }
                            />
                            <Route
                                path="/rapports"
                                element={
                                    <RequireAuth>
                                        <Rapports />
                                    </RequireAuth>
                                }
                            />
                            <Route
                                path="/rapports/:projetId"
                                element={
                                    <RequireAuth>
                                        <Rapports />
                                    </RequireAuth>
                                }
                            />
                            <Route
                                path="/utilisateurs"
                                element={
                                    <RequireAdmin>
                                        <Utilisateurs />
                                    </RequireAdmin>
                                }
                            />

                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </BrowserRouter>
    );
}
