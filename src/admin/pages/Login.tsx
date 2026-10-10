// Admin login (demo auth — see store.ts for the real-auth note).
import { useState } from 'react';
import { login } from '../store';
import { IClock } from '../icons';

export default function Login({ onDone }: { onDone: () => void }) {
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (login(user, pass)) onDone();
    else setErr('Incorrect username or password.');
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <span className="mark"><IClock size={22} /></span>
          <h1>kol<span>fresh</span></h1>
        </div>
        <p className="login-sub">Admin panel · Kolhapur seafood operations</p>
        {err && <p className="login-error">{err}</p>}
        <label className="field">
          <span>Username</span>
          <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
        </label>
        <button className="btn btn-primary btn-block" type="submit">Sign in</button>
        <div className="login-hint">
          <strong>Demo credentials:</strong> username <code>admin</code>, password <code>admin123</code>.
          This is a frontend-only prototype — a production build must authenticate against a
          backend with hashed passwords and role-based access.
        </div>
      </form>
    </div>
  );
}
