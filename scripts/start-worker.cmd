@echo off
setlocal

set "REPO_ROOT=%~dp0.."
set "PYTHON=%REPO_ROOT%\.worker-venv\Scripts\python.exe"

if not exist "%PYTHON%" (
    echo Worker environment not found: %PYTHON%
    echo Follow docs\hackathon-minio-worker-guide.md first.
    exit /b 1
)

cd /d "%REPO_ROOT%"
echo Starting hackathon worker. Keep this window open.
echo Press Ctrl+C to stop the worker.
"%PYTHON%" -m arq worker.presentation.arq_tasks.WorkerSettings
