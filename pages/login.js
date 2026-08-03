import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'login failed');
        return;
      }
      router.push('/overview');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <Head>
        <title>Sign in — Monitoring Services</title>
      </Head>
      <div className="login-card">
        <div className="login-seal-row">
          <span className="seal seal-lg" aria-hidden="true" />
        </div>
        <h1 className="login-title">Monitoring Services</h1>
        <p className="login-subtitle">System Monitoring — Auditor Access</p>
        <form onSubmit={onSubmit}>
          <label className="login-field">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="login-field">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary login-submit"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
