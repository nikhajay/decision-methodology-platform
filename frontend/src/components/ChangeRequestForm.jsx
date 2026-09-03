import React, { useState } from "react";

const MODEL_OPTIONS = [
  { value: "waterfall", label: "Waterfall" },
  { value: "agile", label: "Agile / Scrum" },
  { value: "hybrid", label: "Hybrid (Waterfall + Agile)" },
];

const PHASE_OPTIONS = [
  ["requirements", "Requirements"],
  ["design", "Design"],
  ["development", "Development"],
  ["testing", "Testing"],
  ["deployment", "Deployment / Live"],
];

const AREA_OPTIONS = [
  ["ui", "UI / Frontend"],
  ["api", "API layer"],
  ["business_logic", "Business logic"],
  ["database", "Database schema"],
  ["integration", "3rd-party integration"],
  ["infrastructure", "Infrastructure / DevOps"],
];

export default function ChangeRequestForm({ initialResult, onSubmit, loading }) {
  const baseline = initialResult.inputs;

  const [form, setForm] = useState({
    chosen_model: initialResult.recommendation.recommended_model,
    change_title: "",
    change_description: "",
    urgency: "medium",
    current_phase: "development",
    percent_complete: 40,
    additional_effort_pm: 20,
    architecture_areas: [],
    change_requirement_volatility_pct: 50,
  });

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const toggleArea = (area) => (e) => {
    setForm((f) => {
      const set = new Set(f.architecture_areas);
      if (e.target.checked) set.add(area);
      else set.delete(area);
      return { ...f, architecture_areas: Array.from(set) };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      original_inputs: baseline,
      chosen_model: form.chosen_model,
      change_title: form.change_title || "Untitled change",
      change_description: form.change_description,
      urgency: form.urgency,
      current_phase: form.current_phase,
      percent_complete: Number(form.percent_complete),
      additional_effort_pm: Number(form.additional_effort_pm),
      architecture_areas: form.architecture_areas,
      change_requirement_volatility_pct: Number(form.change_requirement_volatility_pct),
    });
  };

  return (
    <form className="card baseline-form" onSubmit={handleSubmit}>
      <div className="card-eyebrow">Change request</div>
      <h2>What changed on &ldquo;{baseline.project_name}&rdquo;?</h2>
      <p className="muted">
        Currently running on{" "}
        <strong>{MODEL_OPTIONS.find((m) => m.value === form.chosen_model)?.label}</strong>.
        Describe the change — the advisor will price it, flag the architecture
        impact, re-check the model choice for this slice, and project the
        remaining work.
      </p>

      <div className="grid grid-4">
        <Field label="Model currently in use">
          <select value={form.chosen_model} onChange={update("chosen_model")}>
            {MODEL_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Change raised in phase">
          <select value={form.current_phase} onChange={update("current_phase")}>
            {PHASE_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Urgency">
          <select value={form.urgency} onChange={update("urgency")}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </Field>
        <Field label="% complete when raised">
          <input type="number" min="0" max="100" value={form.percent_complete} onChange={update("percent_complete")} />
        </Field>
      </div>

      <div className="grid grid-4">
        <Field label="Change title">
          <input value={form.change_title} onChange={update("change_title")} placeholder="e.g. Add UPI payment option" required />
        </Field>
        <Field label="Additional effort (PM, base estimate)">
          <input type="number" min="0" step="0.5" value={form.additional_effort_pm} onChange={update("additional_effort_pm")} required />
        </Field>
        <Field label="Requirement volatility of this change (%)">
          <input type="number" min="0" max="100" value={form.change_requirement_volatility_pct} onChange={update("change_requirement_volatility_pct")} />
        </Field>
      </div>

      <Field label="Description (optional)">
        <textarea
          rows={2}
          value={form.change_description}
          onChange={update("change_description")}
          placeholder="What is the customer/stakeholder asking for, and why now?"
        />
      </Field>

      <div className="field" style={{ marginTop: 14, marginBottom: 14 }}>
        <span className="field-label">Architecture layers this touches</span>
        <div className="area-grid">
          {AREA_OPTIONS.map(([v, l]) => (
            <label key={v} className="area-checkbox">
              <input
                type="checkbox"
                checked={form.architecture_areas.includes(v)}
                onChange={toggleArea(v)}
              />
              {l}
            </label>
          ))}
        </div>
      </div>

      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "Analyzing change…" : "Analyze change impact"}
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
