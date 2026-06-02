import React, { useEffect, useState } from "react";
import { Shield, Plus, X, AlertTriangle, Lock } from "lucide-react";
import { sendMessage } from "../utils/chrome.js";
import { getFaviconUrl } from "../utils/time.js";

const DEFAULT_SITES = ["youtube.com", "instagram.com", "reddit.com", "facebook.com"];

function BlockedSiteRow({ domain, onRemove }) {
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    await onRemove(domain);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        opacity: removing ? 0.5 : 1,
        transition: "all 0.2s",
      }}
    >
      <img
        src={getFaviconUrl(domain)}
        alt=""
        width={16}
        height={16}
        style={{ borderRadius: 4, flexShrink: 0 }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {domain}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: "#ff4d6d",
            background: "rgba(255,77,109,0.1)",
            border: "1px solid rgba(255,77,109,0.2)",
            borderRadius: 4,
            padding: "2px 6px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Blocked
        </span>
        <button
          onClick={handleRemove}
          disabled={removing}
          style={{
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 6,
            cursor: "pointer",
            color: "var(--muted)",
            transition: "all 0.15s",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#ff4d6d";
            e.currentTarget.style.color = "#ff4d6d";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--muted)";
          }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

export default function BlockList() {
  const [sites, setSites] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadSites(); }, []);

  async function loadSites() {
    setLoading(true);
    const res = await sendMessage("GET_BLOCKED_SITES");
    setSites(res?.sites || DEFAULT_SITES);
    setLoading(false);
  }

  function normalizeDomain(input) {
    let d = input.trim().toLowerCase();
    d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
    d = d.split("/")[0];
    return d;
  }

  function validateDomain(domain) {
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/.test(domain);
  }

  async function handleAdd() {
    const domain = normalizeDomain(input);
    setError("");

    if (!domain) { setError("Enter a domain name."); return; }
    if (!validateDomain(domain)) { setError("Invalid domain (e.g. example.com)"); return; }
    if (sites.includes(domain)) { setError("Already in your block list."); return; }

    setAdding(true);
    await sendMessage("ADD_BLOCKED_SITE", { domain });
    setSites((prev) => [...prev, domain]);
    setInput("");
    setAdding(false);
  }

  async function handleRemove(domain) {
    await sendMessage("REMOVE_BLOCKED_SITE", { domain });
    setSites((prev) => prev.filter((s) => s !== domain));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleAdd();
  }

  return (
    <div
      className="animate-fade-in"
      style={{ padding: "14px 16px", overflowY: "auto", maxHeight: 460 }}
    >
      {/* Header Info */}
      <div
        style={{
          background: "rgba(255,77,109,0.06)",
          border: "1px solid rgba(255,77,109,0.15)",
          borderRadius: 10,
          padding: "10px 12px",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <Lock size={15} color="#ff4d6d" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#ff4d6d", marginBottom: 2 }}>
            Site Blocking Active
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
            Visiting any blocked site will redirect to the FocusGuard block page.
          </div>
        </div>
      </div>

      {/* Add Input */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Block a Website
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. tiktok.com"
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${error ? "rgba(255,77,109,0.5)" : "var(--border)"}`,
              background: "var(--surface2)",
              color: "var(--text)",
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => { if (!error) e.target.style.borderColor = "var(--accent)"; }}
            onBlur={(e) => { if (!error) e.target.style.borderColor = "var(--border)"; }}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !input.trim()}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "none",
              background: adding || !input.trim()
                ? "var(--border)"
                : "linear-gradient(135deg, #6366f1, #818cf8)",
              color: adding || !input.trim() ? "var(--muted)" : "white",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: adding || !input.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            <Plus size={14} />
            Add
          </button>
        </div>
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
            <AlertTriangle size={11} color="#ff4d6d" />
            <span style={{ fontSize: 11, color: "#ff4d6d" }}>{error}</span>
          </div>
        )}
      </div>

      {/* Site List */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Blocked Sites ({sites.length})
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
          <div
            className="spin"
            style={{
              width: 20,
              height: 20,
              border: "2px solid var(--border)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
            }}
          />
        </div>
      ) : sites.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: "var(--muted)", fontSize: 12 }}>
          <Shield size={28} style={{ opacity: 0.3, display: "block", margin: "0 auto 8px" }} />
          No sites blocked yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sites.map((domain) => (
            <BlockedSiteRow key={domain} domain={domain} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
