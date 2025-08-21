import React, { useState } from "react";

type PipelineStep = {
  id: string;
  name: string;
  type: string;
  config: string;
};

const MOCK_STEPS: PipelineStep[] = [
  { id: "1", name: "Input", type: "input", config: "User input" },
  { id: "2", name: "Prompt", type: "prompt", config: "Prompt v1" },
  { id: "3", name: "LLM Call", type: "llm", config: "OpenAI GPT-4" },
  { id: "4", name: "Output", type: "output", config: "Show result" },
];

export default function PipelineBuilder() {
  const [steps, setSteps] = useState<PipelineStep[]>(MOCK_STEPS);

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 8, boxShadow: "0 2px 8px #0001" }}>
      <h2>Pipeline Builder</h2>
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h4>Pipeline Steps</h4>
          <ul>
            {steps.map(step => (
              <li key={step.id} style={{ marginBottom: 8 }}>
                <strong>{step.name}</strong> ({step.type})<br />
                <span style={{ fontSize: 12, color: "#666" }}>{step.config}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 2 }}>
          <h4>Visual Pipeline (Mockup)</h4>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {steps.map((step, i) => (
              <React.Fragment key={step.id}>
                <div style={{
                  padding: 16,
                  borderRadius: 8,
                  background: "#e3e8f0",
                  minWidth: 100,
                  textAlign: "center",
                  border: "2px solid #b5b5b5"
                }}>
                  {step.name}
                </div>
                {i < steps.length - 1 && <span style={{ fontSize: 24 }}>→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 32 }}>
        <button>Add Step</button>
        <button style={{ marginLeft: 12 }}>Save Pipeline</button>
      </div>
    </div>
  );
}
