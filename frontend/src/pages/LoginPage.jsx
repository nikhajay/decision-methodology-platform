import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthToken, login, fetchDemoAccounts } from "../services/Api.js";
//import { setAuthToken, setUnauthorizedHandler, analyzeBaseline, analyzeChangeRequest, fetchHistory } from "./services/Api.js";

const SESSION_KEY = "sdlc_advisor_session";

export default function LoginPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null); // { access_token, user: {username,name,role} }
  const [authReady, setAuthReady] = useState(false);
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

  const redirectDecsion = (e) => {
    navigate("/register");
  }
  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setRole(selectedRole);
    const match = accounts.find((a) => a.role === selectedRole);
    if (match) setUsername(match.username);
  };
console.log(session)
  function onLoggedIn(data) {
    setAuthToken(data.access_token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    setSession(data);
    console.log(session)
    navigate("/decision");
    //setTab("projects");
  }
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
        <div class="button-group">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <button className="btn-primary" type="button" onClick={redirectDecsion} disabled={loading}>
            {loading ? "Signing Up…" : "Sign Up"}
          </button>
        </div>

        <p className="muted demo-hint">
          Demo password for every role: <code>Demo@123</code>
        </p>
      </form>
    </div>
  );
}
