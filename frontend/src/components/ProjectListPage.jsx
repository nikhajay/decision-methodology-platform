import React, { useEffect, useState } from "react";
import { fetchProjects, updateProject, deleteProject } from "../services/Api.js";

const STATUS_OPTIONS = [
  ["waiting_to_start", "Waiting to start"],
  ["running", "Running"],
  ["delivered", "Delivered"],
];

const MODEL_LABEL = { waterfall: "Waterfall", agile: "Agile", hybrid: "Hybrid" };

export default function ProjectListPage({ onGoToAnalysis, currentUser }) {
  const [projects, setProjects] = useState([]);
  const [statusLabels, setStatusLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjects();
      setProjects(data.projects);
      setStatusLabels(data.status_labels);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id, status) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    try {
      await updateProject(id, { status });
    } finally {
      load();
    }
  };

  const handleCompletionChange = async (id, completion_pct) => {
    try {
      await updateProject(id, { completion_pct });
    } finally {
      load();
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProject(id);
    } finally {
      load();
    }
  };

  const counts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="results-dashboard">
      <div className="card">
        <div className="card-eyebrow">Projects</div>
        <h2>All projects</h2>
        <p className="muted">
          Signed in as <strong>{currentUser.name}</strong> ({currentUser.role}). Every
          project run through the advisor can be saved here and tracked from
          waiting to start, through running, to delivered.
        </p>

        <div className="status-summary">
          {STATUS_OPTIONS.map(([key, label]) => (
            <div className={`status-pill status-${key}`} key={key}>
              <span>{label}</span>
              <strong>{counts[key] || 0}</strong>
            </div>
          ))}
        </div>

        <button type="button" className="btn-primary" style={{ width: "auto" }} onClick={onGoToAnalysis}>
          + Analyze a new project
        </button>
      </div>

      {error && <div className="card error-card">{error}</div>}
      {loading && <div className="card muted">Loading projects…</div>}

      {!loading && projects.length === 0 && !error && (
        <div className="card empty-card">
          <div className="card-eyebrow">No projects yet</div>
          <h3>Run an initial analysis and save it here</h3>
        </div>
      )}

      <div className="project-grid">
        {projects.map((p) => (
          <div className="card project-card" key={p.id}>
            <div className="project-card-top">
              <h3>{p.name}</h3>
              <span className={`status-badge status-${p.status}`}>
                {p.status === "running"
                  ? `Running · ${Math.round(p.completion_pct)}%`
                  : (statusLabels[p.status] || p.status)}
              </span>
            </div>

            <p className="muted">
              {p.recommended_model ? `Recommended: ${MODEL_LABEL[p.recommended_model] || p.recommended_model}` : "No analysis linked"}
              {p.opi != null ? ` · OPI ${p.opi}` : ""}
            </p>

            {p.status === "running" && (
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${p.completion_pct}%` }} />
              </div>
            )}

            <div className="project-controls">
              <select value={p.status} onChange={(e) => handleStatusChange(p.id, e.target.value)}>
                {STATUS_OPTIONS.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              {p.status === "running" && (
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={Math.round(p.completion_pct)}
                  onChange={(e) => handleCompletionChange(p.id, Number(e.target.value))}
                  title="Completion %"
                />
              )}
              <button type="button" className="btn-outline danger" onClick={() => handleDelete(p.id)}>
                Remove
              </button>
            </div>

            <div className="project-meta muted">Owner: {p.owner}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
