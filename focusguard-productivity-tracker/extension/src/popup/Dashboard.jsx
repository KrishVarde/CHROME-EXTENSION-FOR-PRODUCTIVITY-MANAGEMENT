import React, { useEffect, useState } from "react";
import { Clock, TrendingUp, Globe, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { sendMessage } from "../utils/chrome.js";
import {
  formatSeconds,
  formatSecondsShort,
  getTopSites,
  getTotalSeconds,
  getFaviconUrl,
  getProductivityScore,
} from "../utils/time.js";

const COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];

function StatCard({ icon: Icon, label, value, sub, color = "var(--accent)" }) {
  return (
    <div
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}18`,
          border: `1px solid ${color}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SiteRow({ domain, seconds, total, rank }) {
  const pct = total > 0 ? (seconds / total) * 100 : 0;
  const color = COLORS[Math.min(rank, COLORS.length - 1)];

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <img
          src={getFaviconUrl(domain)}
          alt=""
          width={14}
          height={14}
          style={{ borderRadius: 3, flexShrink: 0 }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
        <span
          style={{
            fontSize: 12,
            color: "var(--text)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {domain}
        </span>
        <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
          {formatSeconds(seconds)}
        </span>
      </div>
      <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 2,
            transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ff4d6d";

  return (
    <div style={{ position: "relative", width: 72, height: 72 }}>
      <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 8, color: "var(--muted)", marginTop: 1 }}>FOCUS</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 11,
        color: "var(--text)",
      }}
    >
      <div style={{ fontWeight: 600 }}>{payload[0]?.payload?.domain}</div>
      <div style={{ color: "var(--muted)" }}>{formatSeconds(payload[0]?.value)}</div>
    </div>
  );
};

export default function Dashboard() {
  const [view, setView] = useState("today"); // "today" | "week"
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    setLoading(true);
    const type = view === "today" ? "GET_TODAY_STATS" : "GET_WEEK_STATS";
    const res = await sendMessage(type);
    setStats(res?.stats || {});
    setLoading(false);
  }

  useEffect(() => { loadStats(); }, [view]);

  const topSites = getTopSites(stats, 6);
  const total = getTotalSeconds(stats);
  const score = getProductivityScore(stats);
  const chartData = getTopSites(stats, 5).map((s) => ({
    domain: s.domain.replace(".com", "").replace(".org", ""),
    seconds: s.seconds,
    fullDomain: s.domain,
  }));

  return (
    <div
      className="animate-fade-in"
      style={{ padding: "14px 16px", overflowY: "auto", maxHeight: 460 }}
    >
      {/* View Toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["today", "week"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              transition: "all 0.2s",
              border: "1px solid",
              borderColor: view === v ? "var(--accent)" : "var(--border)",
              background: view === v ? "rgba(99,102,241,0.15)" : "transparent",
              color: view === v ? "var(--accent2)" : "var(--muted)",
            }}
          >
            {v === "today" ? "Today" : "This Week"}
          </button>
        ))}
        <button
          onClick={loadStats}
          style={{
            marginLeft: "auto",
            padding: "5px 10px",
            borderRadius: 8,
            fontSize: 11,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--muted)",
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div
            className="spin"
            style={{
              width: 24,
              height: 24,
              border: "2px solid var(--border)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
            }}
          />
        </div>
      ) : (
        <>
          {/* Score + Stats Row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
            <div
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                flex: "0 0 auto",
              }}
            >
              <ScoreRing score={score} />
              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>PRODUCTIVITY</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                  {score >= 75 ? "Great work! 🎯" : score >= 50 ? "Stay focused 💪" : "Heads up! ⚠️"}
                </div>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <StatCard
                icon={Clock}
                label="Total Time"
                value={formatSeconds(total)}
                color="var(--accent)"
              />
              <StatCard
                icon={Globe}
                label="Sites Visited"
                value={Object.keys(stats).length}
                sub="unique domains"
                color="#10b981"
              />
            </div>
          </div>

          {/* Bar Chart */}
          {chartData.length > 0 && (
            <div
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "12px 10px 8px",
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 10, paddingLeft: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Top Sites
              </div>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={chartData} barSize={20}>
                  <XAxis
                    dataKey="domain"
                    tick={{ fontSize: 9, fill: "var(--muted)", fontFamily: "'DM Sans'" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                  <Bar dataKey="seconds" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Site List */}
          {topSites.length > 0 ? (
            <div
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Breakdown
              </div>
              {topSites.map((site, i) => (
                <SiteRow key={site.domain} {...site} total={total} rank={i} />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                color: "var(--muted)",
                fontSize: 13,
              }}
            >
              <Activity size={28} style={{ marginBottom: 8, opacity: 0.4, margin: "0 auto 8px" }} />
              <p>No browsing data yet.</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>Start browsing to see your stats.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
