@echo off
REM deploy-gh-pages.bat
REM Windows script to deploy PromptPilot UI to GitHub Pages with mock data

echo 🚀 Starting PromptPilot GitHub Pages deployment...

REM Check if we're in the right directory
if not exist "ui\dashboard" (
    echo ❌ Error: ui\dashboard directory not found
    exit /b 1
)

REM Navigate to UI directory
cd ui\dashboard

REM Install dependencies if needed
echo 📦 Installing dependencies...
npm install --legacy-peer-deps

REM Build the React app
echo 🔨 Building React application...
npm run build

REM Check if build was successful
if not exist "build" (
    echo ❌ Error: Build failed, build directory not found
    exit /b 1
)

echo ✅ Build completed successfully

REM Create a temporary directory for deployment
set DEPLOY_DIR=%TEMP%\promptpilot-deploy
rmdir /s /q %DEPLOY_DIR% 2>nul
mkdir %DEPLOY_DIR%

REM Copy build files to deployment directory
xcopy build\* %DEPLOY_DIR% /E /I /H

REM Add mock data files
echo 🎭 Adding mock data...
(
echo // Mock data for PromptPilot UI demonstration
echo window.MOCK_DATA = {
echo   prompts: [
echo     {
echo       id: "1",
echo       name: "Email Generator",
echo       description: "Generate professional emails",
echo       task_type: "text-generation",
echo       tags: ["email", "professional"],
echo       messages: [
echo         { role: "system", content: "You are a professional email writer." },
echo         { role: "user", content: "Write an email to {{recipient}} about {{topic}}" }
echo       ],
echo       model_provider: "OpenAI",
echo       model_name: "gpt-4",
echo       created_at: "2025-08-20T10:00:00Z",
echo       updated_at: "2025-08-20T10:00:00Z"
echo     },
echo     {
echo       id: "2",
echo       name: "Code Review Assistant",
echo       description: "Review code for best practices",
echo       task_type: "code-review",
echo       tags: ["code", "review"],
echo       messages: [
echo         { role: "system", content: "You are a senior software engineer." },
echo         { role: "user", content: "Review this code:\n{{code}}" }
echo       ],
echo       model_provider: "Anthropic",
echo       model_name: "claude-3",
echo       created_at: "2025-08-21T10:00:00Z",
echo       updated_at: "2025-08-21T10:00:00Z"
echo     }
echo   ],
echo   pipelines: [
echo     {
echo       id: "1",
echo       name: "Content Creation Workflow",
echo       description: "Generate and review content",
echo       steps: [
echo         { id: "1", name: "Generate Draft", step_type: "prompt", prompt_id: "1" },
echo         { id: "2", name: "Review Content", step_type: "prompt", prompt_id: "2" }
echo       ],
echo       created_at: "2025-08-22T10:00:00Z",
echo       updated_at: "2025-08-22T10:00:00Z"
echo     }
echo   ]
echo };
) > %DEPLOY_DIR%\mock-data.js

REM Add a simple mock API implementation
(
echo // Mock API implementation for GitHub Pages demo
echo (function() {
echo   // Override fetch to return mock data
echo   const originalFetch = window.fetch;
echo   
echo   window.fetch = function(url, options) {
echo     // Handle health check
echo     if (url.includes('/health')) {
echo       return Promise.resolve({
echo         ok: true,
echo         status: 200,
echo         json: () =^> Promise.resolve({ status: "healthy", timestamp: new Date().toISOString() })
echo       });
echo     }
echo     
echo     // Handle prompts endpoints
echo     if (url.includes('/api/v1/prompts')) {
echo       if (options && options.method === 'POST') {
echo         // Create prompt
echo         return Promise.resolve({
echo           ok: true,
echo           status: 201,
echo           json: () =^> Promise.resolve({ 
echo             id: Math.random().toString(36).substr(2, 9),
echo             ...JSON.parse(options.body)
echo           })
echo         });
echo       } else if (url.includes('/test')) {
echo         // Test prompt
echo         return Promise.resolve({
echo           ok: true,
echo           status: 200,
echo           json: () =^> Promise.resolve({
echo             id: Math.random().toString(36).substr(2, 9),
echo             output: "This is a mock response from the prompt.",
echo             execution_time: 0.42,
echo             cost: 0.0012,
echo             success: true,
echo             created_at: new Date().toISOString()
echo           })
echo         });
echo       } else {
echo         // Get prompts
echo         return Promise.resolve({
echo           ok: true,
echo           status: 200,
echo           json: () =^> Promise.resolve({
echo             items: window.MOCK_DATA.prompts,
echo             total: window.MOCK_DATA.prompts.length,
echo             page: 1,
echo             per_page: 10,
echo             total_pages: 1,
echo             has_next: false,
echo             has_prev: false
echo           })
echo         });
echo       }
echo     }
echo     
echo     // Handle pipelines endpoints
echo     if (url.includes('/api/v1/pipelines')) {
echo       return Promise.resolve({
echo         ok: true,
echo         status: 200,
echo         json: () =^> Promise.resolve({
echo           items: window.MOCK_DATA.pipelines,
echo           total: window.MOCK_DATA.pipelines.length,
echo           page: 1,
echo           per_page: 10,
echo           total_pages: 1,
echo           has_next: false,
echo           has_prev: false
echo         })
echo       });
echo     }
echo     
echo     // Fall back to original fetch for other requests
echo     return originalFetch.apply(this, arguments);
echo   };
echo })();
) > %DEPLOY_DIR%\mock-api.js

REM Modify index.html to include mock data and API
echo 🔧 Configuring mock environment...
cd %DEPLOY_DIR%
powershell -Command "(gc index.html) -replace '</body>', '  <script src=\"mock-data.js\"></script>`n  <script src=\"mock-api.js\"></script>`n</body>' | Out-File -encoding UTF8 index.html"

REM Create CNAME file for custom domain (if needed)
echo 📝 Creating deployment files...
echo promptpilot.github.io > CNAME

REM Create 404.html for SPA routing
copy index.html 404.html >nul

REM Create README for GitHub Pages
(
echo # PromptPilot UI Demo
echo.
echo This is a static demo of the PromptPilot UI running on GitHub Pages with mock data.
echo.
echo ## Features
echo.
echo - Prompt management interface
echo - Pipeline builder
echo - Analytics dashboard
echo - Settings and integrations
echo.
echo ## Mock Data
echo.
echo The demo uses mock data to simulate API responses:
echo - 2 sample prompts
echo - 1 sample pipeline
echo.
echo ## Deployment
echo.
echo This site is automatically deployed from the main branch using GitHub Actions.
) > README.md

echo ✅ Deployment package ready in %DEPLOY_DIR%

echo 📋 To deploy to GitHub Pages:
echo 1. Create a new branch: git checkout -b gh-pages-deploy
echo 2. Copy files from %DEPLOY_DIR% to your repository
echo 3. Commit: git add . ^&^& git commit -m "Deploy to GitHub Pages"
echo 4. Push: git push origin gh-pages-deploy
echo 5. Set branch as GitHub Pages source in repository settings

echo 🎉 Deployment preparation complete!