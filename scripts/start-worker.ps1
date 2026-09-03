param([ValidateSet("hackathon", "lesson-index", "evaluate-homework")][string]$Worker = "hackathon")
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $RepoRoot ".worker-venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $Python)) {
    throw "Worker environment not found: $Python. Follow docs/hackathon-minio-worker-guide.md first."
}

Set-Location -LiteralPath $RepoRoot
$env:PYTHONPATH = "$(Join-Path $RepoRoot 'apps\worker');$(Join-Path $RepoRoot 'apps\api')"
$Entrypoints = @{
    "hackathon" = "worker_hackathon.presentation.arq_tasks.WorkerSettings"
    "lesson-index" = "worker_lesson_index.presentation.arq_tasks.WorkerSettings"
    "evaluate-homework" = "worker_evaluate_homework.presentation.arq_tasks.WorkerSettings"
}
Write-Host "Starting $Worker worker. Keep this window open." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the worker." -ForegroundColor Yellow
& $Python -m arq $Entrypoints[$Worker]
