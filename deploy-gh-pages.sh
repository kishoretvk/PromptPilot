#!/bin/bash
# deploy-gh-pages.sh
# Script to deploy PromptPilot UI to GitHub Pages with mock data

echo "🚀 Starting PromptPilot GitHub Pages deployment..."

# Check if we're in the right directory
if [ ! -d "ui/dashboard" ]; then
    echo "❌ Error: ui/dashboard directory not found"
    exit 1
fi

# Navigate to UI directory
cd ui/dashboard

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build the React app
echo "🔨 Building React application..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Error: Build failed, build directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Create a temporary directory for deployment
DEPLOY_DIR="/tmp/promptpilot-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy build files to deployment directory
cp -r build/* $DEPLOY_DIR/

# Add mock data files
echo "🎭 Adding mock data..."
cat > $DEPLOY_DIR/mock-data.js << 'EOF'
// Mock data for PromptPilot UI demonstration
window.MOCK_DATA = {
  prompts: [
    {
      id: "1",
      name: "Email Generator",
      description: "Generate professional emails",
      task_type: "text-generation",
      tags: ["email", "professional"],
      messages: [
        { role: "system", content: "You are a professional email writer." },
        { role: "user", content: "Write an email to {{recipient}} about {{topic}}" }
      ],
      model_provider: "OpenAI",
      model_name: "gpt-4",
      created_at: "2025-08-20T10:00:00Z",
      updated_at: "2025-08-20T10:00:00Z"
    },
    {
      id: "2",
      name: "Code Review Assistant",
      description: "Review code for best practices",
      task_type: "code-review",
      tags: ["code", "review"],
      messages: [
        { role: "system", content: "You are a senior software engineer." },
        { role: "user", content: "Review this code:\n{{code}}" }
      ],
      model_provider: "Anthropic",
      model_name: "claude-3",
      created_at: "2025-08-21T10:00:00Z",
      updated_at: "2025-08-21T10:00:00Z"
    }
  ],
  pipelines: [
    {
      id: "1",
      name: "Content Creation Workflow",
      description: "Generate and review content",
      steps: [
        { id: "1", name: "Generate Draft", step_type: "prompt", prompt_id: "1" },
        { id: "2", name: "Review Content", step_type: "prompt", prompt_id: "2" }
      ],
      created_at: "2025-08-22T10:00:00Z",
      updated_at: "2025-08-22T10:00:00Z"
    }
  ]
};
EOF

# Add a simple mock API implementation
cat > $DEPLOY_DIR/mock-api.js << 'EOF'
// Mock API implementation for GitHub Pages demo
(function() {
  // Override fetch to return mock data
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options) {
    // Handle health check
    if (url.includes('/health')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: "healthy", timestamp: new Date().toISOString() })
      });
    }
    
    // Handle prompts endpoints
    if (url.includes('/api/v1/prompts')) {
      if (options && options.method === 'POST') {
        // Create prompt
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ 
            id: Math.random().toString(36).substr(2, 9),
            ...JSON.parse(options.body)
          })
        });
      } else if (url.includes('/test')) {
        // Test prompt
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: Math.random().toString(36).substr(2, 9),
            output: "This is a mock response from the prompt.",
            execution_time: 0.42,
            cost: 0.0012,
            success: true,
            created_at: new Date().toISOString()
          })
        });
      } else {
        // Get prompts
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            items: window.MOCK_DATA.prompts,
            total: window.MOCK_DATA.prompts.length,
            page: 1,
            per_page: 10,
            total_pages: 1,
            has_next: false,
            has_prev: false
          })
        });
      }
    }
    
    // Handle pipelines endpoints
    if (url.includes('/api/v1/pipelines')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          items: window.MOCK_DATA.pipelines,
          total: window.MOCK_DATA.pipelines.length,
          page: 1,
          per_page: 10,
          total_pages: 1,
          has_next: false,
          has_prev: false
        })
      });
    }
    
    // Fall back to original fetch for other requests
    return originalFetch.apply(this, arguments);
  };
})();
EOF

# Modify index.html to include mock data and API
echo "🔧 Configuring mock environment..."
cd $DEPLOY_DIR
sed -i 's|</body>|  <script src="mock-data.js"></script>\n  <script src="mock-api.js"></script>\n</body>|' index.html

# Create CNAME file for custom domain (if needed)
echo "📝 Creating deployment files..."
echo "promptpilot.github.io" > CNAME

# Create 404.html for SPA routing
cp index.html 404.html

# Create README for GitHub Pages
cat > README.md << 'EOF'
# PromptPilot UI Demo

This is a static demo of the PromptPilot UI running on GitHub Pages with mock data.

## Features

- Prompt management interface
- Pipeline builder
- Analytics dashboard
- Settings and integrations

## Mock Data

The demo uses mock data to simulate API responses:
- 2 sample prompts
- 1 sample pipeline

## Deployment

This site is automatically deployed from the main branch using GitHub Actions.
EOF

echo "✅ Deployment package ready in $DEPLOY_DIR"

echo "📋 To deploy to GitHub Pages:"
echo "1. Create a new branch: git checkout -b gh-pages-deploy"
echo "2. Copy files: cp -r $DEPLOY_DIR/* ."
echo "3. Commit: git add . && git commit -m 'Deploy to GitHub Pages'"
echo "4. Push: git push origin gh-pages-deploy"
echo "5. Set branch as GitHub Pages source in repository settings"

echo "🎉 Deployment preparation complete!"