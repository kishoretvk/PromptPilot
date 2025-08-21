import React, { useState } from "react";

type PromptVersion = {
  version: string;
  createdAt: string;
  promptText: string;
  notes: string;
  testResult?: string;
};

const MOCK_HISTORY: PromptVersion[] = [
  {
    version: "v1",
    createdAt: "2025-08-20",
    promptText: "Translate {text} to French.",
    notes: "Initial version",
    testResult: "Bonjour le monde",
  },
  {
    version: "v2",
    createdAt: "2025-08-21",
    promptText: "Translate '{text}' to French, be formal.",
    notes: "Added formality",
    testResult: "Bonjour, le monde.",
  },
];

export default function PromptHistory() {
  const [selected, setSelected] = useState<PromptVersion | null>(MOCK_HISTORY[0]);
  const [compare, setCompare] = useState<PromptVersion | null>(MOCK_HISTORY[1]);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 8, boxShadow: "0 2px 8px #0001" }}>
      <h2>Prompt Iteration & History</h2>
      <div style={{ display: "flex", gap: 32 }}>
        <div style={{ flex: 1 }}>
          <h4>Versions</h4>
          <ul>
            {MOCK_HISTORY.map((v, i) => (
              <li key={v.version} style={{ marginBottom: 8 }}>
                <button onClick={() => setSelected(v)} style={{ fontWeight: selected?.version === v.version ? "bold" : undefined }}>
                  {v.version} ({v.createdAt})
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 2 }}>
          {selected && (
            <>
              <h4>Prompt: {selected.version}</h4>
              <pre style={{ background: "#f6f8fa", padding: 12 }}>{selected.promptText}</pre>
              <div>Notes: {selected.notes}</div>
              <div>Test Result: <code>{selected.testResult}</code></div>
            </>
          )}
        </div>
        <div style={{ flex: 2 }}>
          <h4>Compare With</h4>
          <select value={compare?.version} onChange={e => setCompare(MOCK_HISTORY.find(v => v.version === e.target.value) || null)}>
            {MOCK_HISTORY.map(v => (
              <option key={v.version} value={v.version}>{v.version}</option>
            ))}
          </select>
          {compare && (
            <>
              <pre style={{ background: "#f6f8fa", padding: 12 }}>{compare.promptText}</pre>
              <div>Notes: {compare.notes}</div>
              <div>Test Result: <code>{compare.testResult}</code></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
