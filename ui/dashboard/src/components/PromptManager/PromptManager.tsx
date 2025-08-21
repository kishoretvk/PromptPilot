import React, { useState } from "react";

const PROVIDERS = [
  { label: "OpenAI", value: "openai" },
  { label: "Ollama", value: "ollama" },
  { label: "Gemini", value: "gemini" },
  { label: "Anthropic", value: "anthropic" },
];

export default function PromptManager() {
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState(PROVIDERS[0].value);
  const [version, setVersion] = useState("v1");
  const [notes, setNotes] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState<string | null>(null);

  // Placeholder for test logic
  const handleTest = () => {
    setTestOutput(`LLM Output for: "${testInput}" (provider: ${provider})`);
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 8, boxShadow: "0 2px 8px #0001" }}>
      <h2>Prompt Management</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Prompt Text</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={6}
          style={{ width: "100%", fontFamily: "monospace", fontSize: 16, marginTop: 4 }}
          placeholder="Enter your prompt here..."
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>LLM Provider</label>
        <select value={provider} onChange={e => setProvider(e.target.value)} style={{ marginLeft: 8 }}>
          {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Version</label>
        <input value={version} onChange={e => setVersion(e.target.value)} style={{ marginLeft: 8 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Developer Notes</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%", marginTop: 4 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <button style={{ marginRight: 12 }}>Save Prompt</button>
        <button>Fine-tune / Optimize</button>
      </div>
      <hr />
      <h3>Test Prompt</h3>
      <input
        value={testInput}
        onChange={e => setTestInput(e.target.value)}
        placeholder="Enter test input variable(s)..."
        style={{ width: "100%", marginBottom: 8 }}
      />
      <button onClick={handleTest}>Run Test</button>
      {testOutput && (
        <div style={{ marginTop: 12, background: "#f6f8fa", padding: 12, borderRadius: 4 }}>
          <strong>LLM Output:</strong>
          <pre style={{ margin: 0 }}>{testOutput}</pre>
        </div>
      )}
    </div>
  );
}
