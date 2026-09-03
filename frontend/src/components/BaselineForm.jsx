import React, { useState } from "react";

const DEFAULTS = {
  project_name: "Customer Portal",
  kloc: 60,
  base_effort_pm: 480,
  team_cost_per_pm_lakh: 1.2,
  target_budget_cr: 15,
  target_duration_months: 8,
  requirement_change_pct: 30,
  billing: "fixed_price",
  compliance: "high",
  technical_uncertainty: "medium",
  feedback: "medium",
  fixed_scope: true,
  fixed_price: true,
};

export default function BaselineForm({ onSubmit, loading }) {
  const [form, setForm] = useState(DEFAULTS);

  const update = (key) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      kloc: Number(form.kloc),
      base_effort_pm: Number(form.base_effort_pm),
      team_cost_per_pm_lakh: Number(form.team_cost_per_pm_lakh),
      target_budget_cr: Number(form.target_budget_cr),
      target_duration_months: Number(form.target_duration_months),
      requirement_change_pct: Number(form.requirement_change_pct),
    });
  };

  return (
    <form className="card baseline-form" onSubmit={handleSubmit}>
      <div className="card-eyebrow">01 — Project baseline</div>
      <h2>Describe the project</h2>
      <p className="muted">
        These are the same inputs used for the effort baseline — fill them in
        once, and the advisor scores Waterfall, Agile and Hybrid against them.
      </p>

      <div className="grid grid-4">
        <Field label="Project name">
          <input value={form.project_name} onChange={update("project_name")} required />
        </Field>
        <Field label="KLOC">
          <input type="number" min="0" step="0.1" value={form.kloc} onChange={update("kloc")} required />
        </Field>
        <Field label="Base effort (PM)">
          <input type="number" min="0" step="1" value={form.base_effort_pm} onChange={update("base_effort_pm")} required />
        </Field>
        <Field label="Team cost / PM (₹ lakh)">
          <input type="number" min="0" step="0.1" value={form.team_cost_per_pm_lakh} onChange={update("team_cost_per_pm_lakh")} required />
        </Field>
      </div>

      <div className="grid grid-4">
        <Field label="Target budget (₹ Cr)">
          <input type="number" min="0" step="0.1" value={form.target_budget_cr} onChange={update("target_budget_cr")} required />
        </Field>
        <Field label="Target duration (months)">
          <input type="number" min="0" step="0.5" value={form.target_duration_months} onChange={update("target_duration_months")} required />
        </Field>
        <Field label="Expected requirement change (%)">
          <input type="number" min="0" max="100" step="1" value={form.requirement_change_pct} onChange={update("requirement_change_pct")} required />
        </Field>
        <Field label="Billing">
          <select value={form.billing} onChange={update("billing")}>
            <option value="fixed_price">Fixed Price</option>
            <option value="time_material">Time &amp; Material</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-4">
        <Field label="Compliance">
          <select value={form.compliance} onChange={update("compliance")}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </Field>
        <Field label="Technical uncertainty">
          <select value={form.technical_uncertainty} onChange={update("technical_uncertainty")}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </Field>
        <Field label="Feedback">
          <select value={form.feedback} onChange={update("feedback")}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </Field>
        <Field label="Flags">
          <div className="checkbox-row">
            <label>
              <input type="checkbox" checked={form.fixed_scope} onChange={update("fixed_scope")} />
              Fixed scope
            </label>
            <label>
              <input type="checkbox" checked={form.fixed_price} onChange={update("fixed_price")} />
              Fixed price
            </label>
          </div>
        </Field>
      </div>

      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "Calculating…" : "Calculate baseline"}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
