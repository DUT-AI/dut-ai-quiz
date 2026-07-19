@echo off
setlocal

set "REPO_ROOT=%~dp0.."
set "PYTHON=%REPO_ROOT%\.worker-venv\Scripts\python.exe"
set "UPLOADER=%~dp0minio_upload.py"

if "%~1"=="" goto :usage
if "%~2"=="" goto :usage

if not exist "%PYTHON%" (
    echo Worker environment not found: %PYTHON%
    echo Follow docs\hackathon-minio-worker-guide.md first.
    exit /b 1
)

"%PYTHON%" "%UPLOADER%" "%~1" "%~2"
exit /b %ERRORLEVEL%

:usage
echo Usage: scripts\upload-minio.cmd "LOCAL_FILE" "OBJECT_KEY"
echo Example: scripts\upload-minio.cmd "docs\hackathon-sample\public_test.csv" "hackathons\demo\public_test.csv"
exit /b 2
