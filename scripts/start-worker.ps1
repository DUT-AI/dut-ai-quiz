$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $RepoRoot ".worker-venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $Python)) {
    throw "Worker environment not found: $Python. Follow docs/hackathon-minio-worker-guide.md first."
}

Set-Location -LiteralPath $RepoRoot
Write-Host "Starting hackathon worker. Keep this window open." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the worker." -ForegroundColor Yellow
& $Python -m arq worker.presentation.arq_tasks.WorkerSettings
