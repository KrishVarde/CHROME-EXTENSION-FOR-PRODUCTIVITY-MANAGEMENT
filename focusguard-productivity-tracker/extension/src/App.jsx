import React, { useState } from "react";
import { BarChart2, Shield, Settings, Zap } from "lucide-react";
import Dashboard from "./popup/Dashboard.jsx";
import BlockList from "./popup/BlockList.jsx";
import SettingsPanel from "./popup/SettingsPanel.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart2 },
  { id: "block",     label: "Block",      icon: Shield    },
  { id: "settings",  label: "Settings",   icon: Settings  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div
      className="flex flex-col"
      style={{
        width: 380,
        minHeight: 560,
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1, #818cf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          <Zap size={16} color="white" fill="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px", color: "#fff" }}>
            FocusGuard
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: -1 }}>
            Productivity Tracker
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <main style={{ flex: 1, overflow: "hidden" }}>
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "block"     && <BlockList />}
        {activeTab === "settings"  && <SettingsPanel />}
      </main>

      {/* Bottom Nav */}
      <nav
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
        }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "10px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: active ? "var(--accent2)" : "var(--muted)",
                transition: "color 0.2s",
                position: "relative",
              }}
            >
              {active && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 32,
                    height: 2,
                    borderRadius: "0 0 2px 2px",
                    background: "var(--accent)",
                  }}
                />
              )}
              <Icon size={18} />
              <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
