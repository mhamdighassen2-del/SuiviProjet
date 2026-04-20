// ============================================================
//  App.tsx  —  Routing principal (services techniques)
// ============================================================
import { useEffect } from 'react';
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

/** Création / édition fiche projet (API : CHEF_PROJET ou ADMIN) */
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

function NavLinkItem({ to, children }: { to: string; children: React.ReactNode }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
            end={to === '/dashboard'}
        >
            {children}
        </NavLink>
    );
}

export default function App() {
    const { isAuthenticated, user, logout, hasRole } = useAuthStore();

    return (
        <BrowserRouter>
            <SessionBoot />
            <div className="app-shell">
                {isAuthenticated && (
                    <header className="app-nav">
                        <span className="app-nav__brand">Suivi projets — Services techniques</span>
                        <NavLinkItem to="/dashboard">Tableau de bord</NavLinkItem>
                        <NavLinkItem to="/projets">Projets</NavLinkItem>
                        <NavLinkItem to="/ofs">Ordres de fabrication</NavLinkItem>
                        <NavLinkItem to="/rapports">Rapports</NavLinkItem>
                        {hasRole('ADMIN') && <NavLinkItem to="/utilisateurs">Utilisateurs</NavLinkItem>}
                        <div className="app-nav__user">
                            <span>
                                {user?.prenom} {user?.nom}
                                <span style={{ color: 'var(--border)', margin: '0 6px' }}>|</span>
                                {user?.role}
                            </span>
                            <button type="button" className="btn btn-ghost" onClick={logout}>
                                Déconnexion
                            </button>
                        </div>
                    </header>
                )}

                <main className="app-main">
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
        </BrowserRouter>
    );
}
