import config from "../config/configs"
const BASE = "/api";
//console.log("testing ")
//console.log(config)

// The current session's JWT lives here (module-level, set once by App.jsx
// right after login / on restoring a saved session) so every call below
// can attach it without threading a token prop through every component.
let AUTH_TOKEN = "N5At6DuhjQedhMiTkigsuzRQ4UjEDBaAS69h5UCWwWg7OxhHJtAS5A6I4NNhELwq";
let onUnauthorized = null;

export function setAuthToken(token) {
  AUTH_TOKEN = token;
}

/** App.jsx registers a logout callback here once, on mount — any 401 from
 *  any endpoint below triggers it automatically, so an expired/invalid
 *  session always drops back to the login screen instead of silently
 *  failing in place. */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

function authHeaders() {
  return AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new Error("Session expired — please log in again.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request to ${path} failed`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// --------------------------------------------------------------------------- //
// Auth
// --------------------------------------------------------------------------- //

export function login(username, password) {
  return request("/auth/login", { method: "POST", body: { username, password } });
}

export function userRegistration(form) {
  return request("/users/user-registration", 
    { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: form
    });
}

export function fetchMe() {
  return request("/auth/me");
}

/** Public endpoint — powers the role dropdown on the login screen (role ->
 *  matching demo username), no token needed. */
export function fetchDemoAccounts() {
  return request("/auth/demo-accounts");
}

// --------------------------------------------------------------------------- //
// Baseline analysis
// --------------------------------------------------------------------------- //

export function analyzeBaseline(payload) {
  return request("/analyze", { method: "POST", body: payload });
}

export function analyzeChangeRequest(payload) {
  return request("/change-request", { method: "POST", body: payload });
}

export function fetchHistory() {
  return request("/history");
}

// --------------------------------------------------------------------------- //
// PDF export
// --------------------------------------------------------------------------- //

async function downloadPdf(path, payload, label, filenameFallback) {
  const url = `${BASE}${path}?label=${encodeURIComponent(label)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new Error("Session expired — please log in again.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Could not generate the PDF");
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : filenameFallback;

  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(objectUrl);
}

/** label distinguishes "First-time baseline" from a later "Recalculated
 *  baseline" download — the PDF's own subtitle line reflects whichever you
 *  pass in, so both the first-time and modified-time reports are traceable. */
export function downloadBaselinePdf(payload, label = "First-time baseline") {
  return downloadPdf("/analyze/pdf", payload, label, "baseline_report.pdf");
}

export function downloadChangePdf(payload, label = "Change request") {
  return downloadPdf("/change-request/pdf", payload, label, "change_report.pdf");
}

// --------------------------------------------------------------------------- //
// Project list (post-login) — status: waiting_to_start | running | delivered
// --------------------------------------------------------------------------- //

export function fetchProjects() {
  return request("/projects");
}

export function createProject(payload) {
  return request("/projects", { method: "POST", body: payload });
}

export function updateProject(id, payload) {
  return request(`/projects/${id}`, { method: "PATCH", body: payload });
}

export function deleteProject(id) {
  return request(`/projects/${id}`, { method: "DELETE" });
}
