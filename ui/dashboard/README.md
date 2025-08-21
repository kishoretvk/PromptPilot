# PromptPilot Dashboard

This is the React-based web UI for PromptPilot.

## Getting Started

1. Make sure you have Node.js and npm installed.
2. In the `ui` directory, run:

   ```sh
   npx create-react-app dashboard --template typescript
   cd dashboard
   npm install
   npm start
   ```

3. The app will be available at http://localhost:3000

## Planned Structure

- `src/components/PromptManager/` — Prompt input, provider selection, fine-tuning, versioning
- `src/components/PromptHistory/` — Prompt iteration, test runner, diff view
- `src/components/PipelineBuilder/` — Visual pipeline editor
- `src/components/Analytics/` — Usage, evaluation, and performance dashboards
- `src/components/Settings/` — Theme, system, and user settings
- `src/components/Integrations/` — Agent and external integrations

## Features

- Modern UI with dark/light themes
- Responsive layout
- API integration with PromptPilot backend
- Modular, extensible architecture

---

See `../ENHANCED_UI_PLAN.md` for the full UI/UX plan.
