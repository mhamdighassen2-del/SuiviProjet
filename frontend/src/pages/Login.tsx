// ============================================================
//  pages/Login.tsx
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
        document.title = 'Connexion — Suivi projets';
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
            const msg = isAxiosError(err)
                ? (err.response?.data as { message?: string })?.message
                : null;
            setError(msg || 'Connexion impossible. Vérifiez l’API et la base de données.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            style={{
                minHeight: '70vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 400,
                    padding: 32,
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
            >
                <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>
                    Connexion
                </h1>
                <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: 14 }}>
                    Suivi projets industriels
                </p>

                <form onSubmit={handleSubmit}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                        Email
                    </label>
                    <input
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px 12px',
                            marginBottom: 16,
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontSize: 15,
                        }}
                    />

                    <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                        Mot de passe
                    </label>
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px 12px',
                            marginBottom: 20,
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontSize: 15,
                        }}
                    />

                    {error && (
                        <p
                            role="alert"
                            style={{
                                margin: '0 0 16px',
                                padding: '10px 12px',
                                background: '#fef2f2',
                                color: '#b91c1c',
                                borderRadius: 8,
                                fontSize: 14,
                            }}
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: 15,
                            fontWeight: 600,
                            color: '#fff',
                            background: loading ? '#9ca3af' : '#2563eb',
                            border: 'none',
                            borderRadius: 8,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading ? 'Connexion…' : 'Se connecter'}
                    </button>
                </form>
            </div>
        </div>
    );
}
