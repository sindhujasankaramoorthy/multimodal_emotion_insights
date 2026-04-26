Write-Host "--- Clinical Mood Monitor Startup Tool ---" -ForegroundColor Cyan

# 1. Kill existing processes
Write-Host "Checking for existing processes on ports 8000 and 3000..."
$ports = @(8000, 3000)
foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $procId = $conn.OwningProcess
            if ($procId) {
                Write-Host "Stopping process $procId on port $port..." -ForegroundColor Yellow
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        # Ignore errors if no process found
    }
}

# 2. Start Backend
Write-Host "Starting FastAPI Backend in new window..." -ForegroundColor Green
$pythonPath = Resolve-Path ".\venv\Scripts\python.exe" -ErrorAction SilentlyContinue
if (-not $pythonPath) {
    Write-Error "Virtual environment not found in root! Please ensure 'venv' exists."
    exit
}

# Run backend from the backend directory using the root venv
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- Backend Logs ---' -ForegroundColor Cyan; cd backend; ..\venv\Scripts\python.exe main.py" -WindowStyle Normal

# 3. Start Frontend
Write-Host "Starting Next.js Frontend..." -ForegroundColor Green
if (Test-Path ".\frontend") {
    cd frontend
    npm run dev
} else {
    Write-Error "Frontend directory not found!"
}
