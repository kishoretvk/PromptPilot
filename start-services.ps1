# start-services.ps1
# Script to start both API and UI services in detached mode

Write-Host "🚀 Starting PromptPilot services..."
Write-Host "=================================="

# Check if Ollama is running
Write-Host "Checking Ollama status..."
try {
    $ollamaResponse = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($ollamaResponse.StatusCode -eq 200) {
        Write-Host "✅ Ollama is running and accessible"
    }
} catch {
    Write-Host "⚠️  Ollama not detected. Make sure Ollama is running on port 11434"
    Write-Host "   Install Ollama: https://ollama.ai/download"
    Write-Host "   Start Ollama: ollama serve"
}

# Start API server
Write-Host "Starting API server..."
$apiProcess = Start-Process -FilePath "python" -ArgumentList "-m", "api.rest" -WindowStyle Normal -WorkingDirectory "D:\git\PormptPilot" -PassThru

# Wait for API to start
Write-Host "Waiting for API to initialize..."
Start-Sleep -Seconds 3

# Test API health
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 10
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ API server started successfully"
        Write-Host "   Health check: http://localhost:8000/health"
        Write-Host "   API docs: http://localhost:8000/docs"
    }
} catch {
    Write-Host "❌ API server failed to start or is not responding"
}

# Start UI server
Write-Host "Starting UI server..."
if (Test-Path "D:\git\PormptPilot\ui\dashboard\build") {
    Set-Location -Path "D:\git\PormptPilot\ui\dashboard\build"
    $uiProcess = Start-Process -FilePath "python" -ArgumentList "-m", "http.server", "3000" -WindowStyle Normal -PassThru
    Write-Host "✅ UI server started successfully"
} else {
    Write-Host "❌ UI build directory not found. Run 'npm run build' in ui/dashboard first"
}

Write-Host ""
Write-Host "🎉 Services started successfully!"
Write-Host "=================================="
Write-Host "API available at: http://localhost:8000"
Write-Host "UI available at: http://localhost:3000"
Write-Host "API docs: http://localhost:8000/docs"
Write-Host ""
Write-Host "🧪 Test Ollama integration:"
Write-Host "   API test: http://localhost:8000/test-ollama"
Write-Host "   UI: Go to Settings > Integrations to configure Ollama"
Write-Host ""
Write-Host "Press Ctrl+C to stop services"
