@echo off
setlocal
set "WORKER=%~1"
if "%WORKER%"=="" set "WORKER=hackathon"

set "REPO_ROOT=%~dp0.."
set "PYTHON=%REPO_ROOT%\.worker-venv\Scripts\python.exe"

if not exist "%PYTHON%" (
    echo Worker environment not found: %PYTHON%
    echo Follow docs\hackathon-minio-worker-guide.md first.
    exit /b 1
)

cd /d "%REPO_ROOT%"
set "PYTHONPATH=%REPO_ROOT%\apps\worker;%REPO_ROOT%\apps\api"
if "%WORKER%"=="hackathon" set "ENTRYPOINT=worker_hackathon.presentation.arq_tasks.WorkerSettings"
if "%WORKER%"=="lesson-index" set "ENTRYPOINT=worker_lesson_index.presentation.arq_tasks.WorkerSettings"
if "%WORKER%"=="evaluate-homework" set "ENTRYPOINT=worker_evaluate_homework.presentation.arq_tasks.WorkerSettings"
if "%ENTRYPOINT%"=="" (
    echo Unknown worker: %WORKER%
    exit /b 1
)
echo Starting %WORKER% worker. Keep this window open.
echo Press Ctrl+C to stop the worker.
"%PYTHON%" -m arq %ENTRYPOINT%
