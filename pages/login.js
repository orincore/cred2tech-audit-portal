import { useState } from 'react';
import { useRouter } from 'next/router';

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
    <div style={{ maxWidth: 360, margin: '96px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20 }}>CISA Audit Portal</h1>
      <form onSubmit={onSubmit}>
        <label style={{ display: 'block', marginTop: 16 }}>
          Username
          <input
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label style={{ display: 'block', marginTop: 16 }}>
          Password
          <input
            type="password"
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && <p style={{ color: '#b91c1c', marginTop: 12 }}>{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          style={{ marginTop: 20, padding: '8px 16px' }}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
