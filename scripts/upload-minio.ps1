param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$FilePath,

    [Parameter(Mandatory = $true, Position = 1)]
    [string]$ObjectKey
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $RepoRoot ".worker-venv\Scripts\python.exe"
$Uploader = Join-Path $PSScriptRoot "minio_upload.py"

if (-not (Test-Path -LiteralPath $Python)) {
    throw "Worker environment not found: $Python. Follow docs/hackathon-minio-worker-guide.md first."
}

& $Python $Uploader $FilePath $ObjectKey
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
