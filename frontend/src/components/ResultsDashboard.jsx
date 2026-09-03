import React, { useEffect, useState } from "react";
import RecommendationCard from "./RecommendationCard.jsx";
import RadarComparison from "./RadarComparison.jsx";
import BarComparison from "./BarComparison.jsx";
import ActIndices from "./ActIndices.jsx";
import DetailTable from "./DetailTable.jsx";
import DownloadPdfButton from "./DownloadPdfButton.jsx";
import { downloadBaselinePdf, createProject } from "../services/Api.js";

export default function ResultsDashboard({ result, runLabel, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // A fresh (re)calculation should offer "Save" again, not keep showing the
  // previous run's "Saved" state.
  useEffect(() => {
    setSaved(false);
    setSaveError(null);
  }, [result]);

  if (!result) return null;

  const winner = result.recommendation.recommended_model;

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await createProject({
        name: result.inputs.project_name,
        recommended_model: winner,
        opi: result.opi[winner].opi,
        status: "waiting_to_start",
        completion_pct: 0,
      });
      setSaved(true);
      if (onSaved) onSaved();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="results-dashboard">
      <div className="report-toolbar">
        <span className="run-tag">{runLabel}</span>
        <div className="toolbar-actions">
          <button type="button" className="btn-outline" onClick={handleSave} disabled={saving || saved}>
            {saved ? "✓ Saved to projects" : saving ? "Saving…" : "+ Save to project list"}
          </button>
          <DownloadPdfButton
            label="Download PDF report"
            onDownload={() => downloadBaselinePdf(result.inputs, runLabel)}
          />
        </div>
      </div>
      {saveError && <div className="card error-card">{saveError}</div>}

      <RecommendationCard result={result} />
      <RadarComparison result={result} />
      <BarComparison result={result} />
      <ActIndices result={result} />
      <DetailTable result={result} />
    </div>
  );
}
