import React, { useEffect, useState } from "react";
import { login, fetchDemoAccounts } from "../services/Api.js";

export default function LoginPage({ onLoggedIn }) {
  const [accounts, setAccounts] = useState([]);
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("Demo@123");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDemoAccounts()
      .then((list) => {
        setAccounts(list);
        if (list.length) {
          setRole(list[0].role);
          setUsername(list[0].username);
        }
      })
      .catch(() => {
        // Demo-account list is a convenience only — a plain username/password
        // form still works fine without it.
      });
  }, []);

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setRole(selectedRole);
    const match = accounts.find((a) => a.role === selectedRole);
    if (match) setUsername(match.username);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await login(username, password);
      onLoggedIn(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="card login-card" onSubmit={handleSubmit}>
        <div className="brand-mark">SDLC</div>
        <h2>Sign in</h2>
        <p className="muted">
          Sign in with your role to see the project list, run analyses, and
          log change requests.
        </p>

        {accounts.length > 0 && (
          <label className="field">
            <span className="field-label">Role</span>
            <select value={role} onChange={handleRoleChange}>
              {accounts.map((a) => (
                <option key={a.role} value={a.role}>{a.role}</option>
              ))}
            </select>
          </label>
        )}

        <label className="field">
          <span className="field-label">Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <div className="card error-card login-error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="muted demo-hint">
          Demo password for every role: <code>Demo@123</code>
        </p>
      </form>
    </div>
  );
}
