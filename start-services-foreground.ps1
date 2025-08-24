# start-services-foreground.ps1
# Script to start both API and UI services in foreground for testing

Write-Host "Starting PromptPilot services in foreground..."

# Start API server in background job
Write-Host "Starting API server in background job..."
$apiJob = Start-Job -ScriptBlock {
    Set-Location -Path "D:\git\PormptPilot"
    python -m api.rest
}

# Wait a few seconds for API to start
Start-Sleep -Seconds 5

# Start UI server in background job
Write-Host "Starting UI server in background job..."
$uiJob = Start-Job -ScriptBlock {
    Set-Location -Path "D:\git\PormptPilot\ui\dashboard\build"
    python -m http.server 3000
}

# Display job status
Write-Host "API Server Job: $($apiJob.State)"
Write-Host "UI Server Job: $($uiJob.State)"

# Keep script running and show job output
while ($true) {
    Write-Host "=== Service Status ==="
    Write-Host "API Server Job: $($apiJob.State)"
    Write-Host "UI Server Job: $($uiJob.State)"
    
    # Show recent output from jobs
    $apiOutput = Receive-Job -Job $apiJob -Keep
    if ($apiOutput) {
        Write-Host "API Output: $apiOutput"
    }
    
    $uiOutput = Receive-Job -Job $uiJob -Keep
    if ($uiOutput) {
        Write-Host "UI Output: $uiOutput"
    }
    
    Write-Host "======================"
    Start-Sleep -Seconds 10
}