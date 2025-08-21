import React, { useState } from "react";

export default function SettingsIntegrations() {
  const [theme, setTheme] = useState("light");
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("openai");
  const [webhook, setWebhook] = useState("");
  const [agent, setAgent] = useState("none");

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 8, boxShadow: "0 2px 8px #0001" }}>
      <h2>Settings & Integrations</h2>
      <div style={{ marginBottom: 24 }}>
        <h4>Theme</h4>
        <select value={theme} onChange={e => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h4>API Key</h4>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="Enter API key"
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <h4>Default LLM Provider</h4>
        <select value={provider} onChange={e => setProvider(e.target.value)}>
          <option value="openai">OpenAI</option>
          <option value="ollama">Ollama</option>
          <option value="gemini">Gemini</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h4>Webhook URL</h4>
        <input
          value={webhook}
          onChange={e => setWebhook(e.target.value)}
          placeholder="https://your-webhook-url"
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <h4>Agent Framework Integration</h4>
        <select value={agent} onChange={e => setAgent(e.target.value)}>
          <option value="none">None</option>
          <option value="langchain">LangChain</option>
          <option value="llamaindex">LlamaIndex</option>
        </select>
      </div>
      <button>Save Settings</button>
    </div>
  );
}
