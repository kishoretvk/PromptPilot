# start-services.ps1
# Script to start both API and UI services in detached mode

Write-Host "Starting PromptPilot services..."

# Start API server
Write-Host "Starting API server..."
Start-Process -FilePath "python" -ArgumentList "-m", "api.rest" -WindowStyle Normal -WorkingDirectory "D:\git\PormptPilot"

# Wait a few seconds for API to start
Start-Sleep -Seconds 5

# Start UI server
Write-Host "Starting UI server..."
Set-Location -Path "D:\git\PormptPilot\ui\dashboard\build"
Start-Process -FilePath "python" -ArgumentList "-m", "http.server", "3000" -WindowStyle Normal

Write-Host "Services started successfully!"
Write-Host "API available at: http://localhost:8000"
Write-Host "UI available at: http://localhost:3000"