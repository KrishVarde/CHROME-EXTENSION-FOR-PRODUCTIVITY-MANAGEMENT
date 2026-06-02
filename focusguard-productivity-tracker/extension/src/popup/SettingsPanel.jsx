import React, { useState } from "react";
import { Trash2, Server, Info, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { sendMessage } from "../utils/chrome.js";

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 10,
          paddingLeft: 2,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, sub, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        gap: 12,
        marginBottom: 6,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

export default function SettingsPanel() {
  const [apiUrl, setApiUrl] = useState("http://localhost:5000");
  const [editingApi, setEditingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState(null); // "ok" | "error" | "checking"
  const [clearStatus, setClearStatus] = useState(null);
  const [notifications, setNotifications] = useState(true);

  async function testConnection() {
    setApiStatus("checking");
    try {
      const res = await fetch(`${apiUrl}/api/health`, { signal: AbortSignal.timeout(3000) });
      setApiStatus(res.ok ? "ok" : "error");
    } catch {
      setApiStatus("error");
    }
  }

  async function clearData() {
    if (!confirm("Clear all tracked data? This cannot be undone.")) return;
    setClearStatus("clearing");
    await sendMessage("CLEAR_DATA");
    setTimeout(() => setClearStatus("done"), 1000);
    setTimeout(() => setClearStatus(null), 3000);
  }

  return (
    <div
      className="animate-fade-in"
      style={{ padding: "14px 16px", overflowY: "auto", maxHeight: 460 }}
    >
      {/* Backend */}
      <Section title="Backend Connection">
        <Row
          label="API Server"
          sub={apiUrl}
        >
          <button
            onClick={() => setEditingApi((v) => !v)}
            style={{
              padding: "5px 10px",
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--muted)",
              fontSize: 11,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        </Row>

        {editingApi && (
          <div style={{ marginBottom: 8, display: "flex", gap: 6 }}>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              style={{
                flex: 1,
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface2)",
                color: "var(--text)",
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button
              onClick={() => setEditingApi(false)}
              style={{
                padding: "7px 10px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "white",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
        )}

        <button
          onClick={testConnection}
          disabled={apiStatus === "checking"}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "transparent",
            color:
              apiStatus === "ok"
                ? "#10b981"
                : apiStatus === "error"
                ? "#ff4d6d"
                : "var(--muted)",
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.2s",
          }}
        >
          {apiStatus === "checking" ? (
            <>
              <div
                className="spin"
                style={{
                  width: 12,
                  height: 12,
                  border: "1.5px solid var(--border)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                }}
              />
              Testing connection…
            </>
          ) : apiStatus === "ok" ? (
            <><CheckCircle size={13} /> Connected successfully</>
          ) : apiStatus === "error" ? (
            <><AlertCircle size={13} /> Connection failed</>
          ) : (
            <><Server size={13} /> Test Connection</>
          )}
        </button>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Row label="Focus reminders" sub="Alerts when visiting blocked sites">
          <button
            onClick={() => setNotifications((v) => !v)}
            style={{
              width: 40,
              height: 22,
              borderRadius: 11,
              border: "none",
              background: notifications
                ? "linear-gradient(135deg, #6366f1, #818cf8)"
                : "var(--border)",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
              padding: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: notifications ? 21 : 3,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "white",
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            />
          </button>
        </Row>
      </Section>

      {/* Data Management */}
      <Section title="Data">
        <button
          onClick={clearData}
          disabled={clearStatus === "clearing"}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 10,
            border: "1px solid rgba(255,77,109,0.25)",
            background: "rgba(255,77,109,0.06)",
            color:
              clearStatus === "done" ? "#10b981" : "#ff4d6d",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            cursor: clearStatus === "clearing" ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.2s",
          }}
        >
          {clearStatus === "clearing" ? (
            "Clearing…"
          ) : clearStatus === "done" ? (
            <><CheckCircle size={14} /> Data cleared</>
          ) : (
            <><Trash2 size={14} /> Clear All Tracking Data</>
          )}
        </button>
        <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 6 }}>
          Removes all locally stored usage data.
        </p>
      </Section>

      {/* About */}
      <Section title="About">
        <div
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>FocusGuard</span>
            <span
              style={{
                fontSize: 10,
                color: "var(--accent2)",
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 4,
                padding: "2px 7px",
                fontWeight: 600,
              }}
            >
              v1.0.0
            </span>
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6, marginBottom: 10 }}>
            A productivity tracker and site blocker Chrome Extension built with React, Node.js, Express, and MongoDB.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "var(--accent2)",
              cursor: "pointer",
            }}
          >
            <ExternalLink size={11} />
            View on GitHub
          </div>
        </div>
      </Section>
    </div>
  );
}
