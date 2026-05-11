import React, { useState } from 'react';
import { Blocks, KeyRound, User as UserIcon } from 'lucide-react';
import { db, User } from '../services/db';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username && password) {
      const user = await db.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password. (Hint: use admin/password)');
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-tertiary)', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '3rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <Blocks size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>RICP Core OS</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sign in to Centralized Platform</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div style={{ color: 'var(--status-danger)', fontSize: '0.875rem', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '0.5rem' }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Username / ID</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter university ID"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', outline: 'none' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', outline: 'none' }}
                required
              />
            </div>
          </div>

          <button type="submit" style={{ width: '100%', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600, marginTop: '0.5rem', cursor: 'pointer' }}>
            Sign In (JWT)
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>or continue with</div>
          <button style={{ width: '100%', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer' }}>
            University SSO (LDAP/AD)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
