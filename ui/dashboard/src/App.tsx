import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import PromptManager from "./components/PromptManager/PromptManager";
import PromptHistory from "./components/PromptHistory/PromptHistory";

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>{title}</h1>
      <p>This is a placeholder for the {title} screen.</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <nav style={{ width: 220, background: "#222", color: "#fff", padding: 24 }}>
          <h2>PromptPilot</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li><Link to="/" style={{ color: "#fff" }}>Prompt Management</Link></li>
            <li><Link to="/history" style={{ color: "#fff" }}>Prompt Iteration</Link></li>
            <li><Link to="/pipeline" style={{ color: "#fff" }}>Pipeline Builder</Link></li>
            <li><Link to="/analytics" style={{ color: "#fff" }}>Analytics</Link></li>
            <li><Link to="/settings" style={{ color: "#fff" }}>Settings</Link></li>
            <li><Link to="/integrations" style={{ color: "#fff" }}>Integrations</Link></li>
          </ul>
        </nav>
        <main style={{ flex: 1, background: "#f5f5f5" }}>
          <Routes>
            <Route path="/" element={<PromptManager />} />
            <Route path="/history" element={<PromptHistory />} />
            <Route path="/pipeline" element={<Placeholder title="Pipeline Builder" />} />
            <Route path="/analytics" element={<Placeholder title="Analytics & Dashboard" />} />
            <Route path="/settings" element={<Placeholder title="Settings" />} />
            <Route path="/integrations" element={<Placeholder title="Integrations" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
