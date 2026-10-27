import React, { useState } from "react";
import SelectTag from "../components/SelectTag";
import { useNavigate } from "react-router-dom";
import { setAuthToken, login, fetchDemoAccounts, userRegistration } from "../services/Api.js";
//import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage({ onSwitch }) {
  //const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role:"engineer" });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await userRegistration(form);
      setForm({ name: "", email: "", phone: "", password: "", role:"engineer" });
      setSuccess("User Saved Successfully");
      
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  };
  const redirectTo = (e) => {
    navigate("/")
  }
  

  return (
    <div className="login-shell">
      <form className="card login-card" onSubmit={handleSubmit}>
        <div className="brand-mark">SDLC</div>
        <h1>Create your account</h1>
        {success && <div className="auth-success">{success}</div>}
        <label className="field">
          <span className="field-label">Username</span>
          <input value={form.name} onChange={update("name")} placeholder="Full Name" required />
        </label>

        <label className="field">
          <span className="field-label">Phone</span>
          <input value={form.phone} onChange={update("phone")} placeholder="Phone" required minLength={10} />
        </label>

        <label className="field">
          <span className="field-label">Email</span>
          <input type="email" value={form.email} onChange={update("email")} placeholder="Email" required />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <input
            type="password"
            value={form.password}
            onChange={update("password")}
            placeholder="Password (min 6 characters)"
            required
            minLength={6}
          />
        </label>
        
        {error && <div className="auth-error">{error}</div>}
        <div class="button-group">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </div>
        <p className="muted">
          Already have an account?{" "}
          <button type="button" className="link" onClick={redirectTo}>
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
}