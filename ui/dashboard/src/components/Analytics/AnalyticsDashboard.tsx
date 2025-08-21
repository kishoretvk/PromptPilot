import React from "react";

const MOCK_STATS = {
  totalPrompts: 12,
  totalRuns: 87,
  avgLatency: "1.2s",
  successRate: "97%",
  cost: "$4.23",
  topProviders: [
    { name: "OpenAI", count: 50 },
    { name: "Ollama", count: 25 },
    { name: "Gemini", count: 12 },
  ],
};

export default function AnalyticsDashboard() {
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 8, boxShadow: "0 2px 8px #0001" }}>
      <h2>Analytics & Dashboard</h2>
      <div style={{ display: "flex", gap: 32, marginBottom: 32 }}>
        <div>
          <h4>Total Prompts</h4>
          <div style={{ fontSize: 32 }}>{MOCK_STATS.totalPrompts}</div>
        </div>
        <div>
          <h4>Total Runs</h4>
          <div style={{ fontSize: 32 }}>{MOCK_STATS.totalRuns}</div>
        </div>
        <div>
          <h4>Avg Latency</h4>
          <div style={{ fontSize: 32 }}>{MOCK_STATS.avgLatency}</div>
        </div>
        <div>
          <h4>Success Rate</h4>
          <div style={{ fontSize: 32 }}>{MOCK_STATS.successRate}</div>
        </div>
        <div>
          <h4>Cost</h4>
          <div style={{ fontSize: 32 }}>{MOCK_STATS.cost}</div>
        </div>
      </div>
      <div>
        <h4>Top Providers</h4>
        <ul>
          {MOCK_STATS.topProviders.map(p => (
            <li key={p.name}>
              {p.name}: {p.count} runs
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 32 }}>
        <h4>Recent Activity (Mockup)</h4>
        <ul>
          <li>Prompt "Translate" run on OpenAI - Success</li>
          <li>Prompt "Summarize" run on Ollama - Success</li>
          <li>Prompt "Classify" run on Gemini - Failed</li>
        </ul>
      </div>
    </div>
  );
}
