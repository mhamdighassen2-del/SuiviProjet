// ============================================================
//  pages/Login.tsx — Connexion (thème EMP)
// ============================================================
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { isAxiosError } from 'axios';

export default function Login() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = 'Connexion — EMP Suivi projets';
    }, []);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email.trim(), password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            if (isAxiosError(err)) {
                const data = err.response?.data as { message?: string } | undefined;
                const fromApi = data?.message;
                if (fromApi) {
                    setError(fromApi);
                } else if (!err.response) {
                    setError(
                        'Impossible de joindre l’API (http://localhost:3000). Lancez le backend : cd backend puis npm run dev.'
                    );
                } else {
                    setError(`Erreur serveur (${err.response.status}).`);
                }
            } else {
                setError('Connexion impossible. Vérifiez l’API et la base de données.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page" style={{ position: 'relative' }}>
            <div className="glow-ring" style={{ top: '-20%', left: '50%', transform: 'translateX(-50%)' }} />
            <div className="login-card">
                <div className="login-card-inner">
                    <h1>Connexion</h1>
                    <p className="login-lead">Suivi projets industriels — Engineering &amp; Machining Precision</p>

                    <form onSubmit={handleSubmit}>
                        <label className="login-label" htmlFor="login-email">
                            Email
                        </label>
                        <input
                            id="login-email"
                            className="input-field"
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            style={{ marginBottom: '1rem' }}
                        />

                        <label className="login-label" htmlFor="login-password">
                            Mot de passe
                        </label>
                        <input
                            id="login-password"
                            className="input-field"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            style={{ marginBottom: '1.25rem' }}
                        />

                        {error && (
                            <p role="alert" className="login-error">
                                {error}
                            </p>
                        )}

                        <button type="submit" className="login-submit" disabled={loading}>
                            {loading ? 'Connexion…' : 'Se connecter'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
