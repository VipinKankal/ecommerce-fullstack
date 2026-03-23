param(
    [switch]$SkipFrontend,
    [switch]$SkipBackend
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Action
    )

    Write-Host ""
    Write-Host "==> $Name" -ForegroundColor Cyan
    & $Action
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    & $FilePath @Arguments
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        $commandText = "$FilePath $($Arguments -join ' ')"
        throw "Command failed with exit code ${exitCode}: $commandText"
    }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is not available in PATH."
}

if (-not (Get-Command "npm.cmd" -ErrorAction SilentlyContinue)) {
    throw "npm.cmd is not available in PATH."
}

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    throw "Java is not available in PATH."
}

$detectedJavaHome = $null
$javaSettingsOutput = cmd /c "java -XshowSettings:properties -version 2>&1"
$javaHomeLine = $javaSettingsOutput | Where-Object { $_ -match '^\s*java\.home\s*=' } | Select-Object -First 1
if ($javaHomeLine) {
    $detectedJavaHome = ($javaHomeLine -split '=', 2)[1].Trim()
}

if ($detectedJavaHome -and (Test-Path $detectedJavaHome)) {
    $env:JAVA_HOME = $detectedJavaHome
} elseif (-not $env:JAVA_HOME) {
    $javaExePath = (Get-Command java).Source
    $env:JAVA_HOME = Split-Path -Parent (Split-Path -Parent $javaExePath)
}

if (-not (Test-Path $env:JAVA_HOME)) {
    throw "JAVA_HOME is not valid: $env:JAVA_HOME"
}

$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Invoke-Step -Name "Environment versions" -Action {
    Invoke-Checked -FilePath "node" -Arguments @("-v")
    Invoke-Checked -FilePath "npm.cmd" -Arguments @("-v")
    Invoke-Checked -FilePath "java" -Arguments @("-version")
    Write-Host "JAVA_HOME=$env:JAVA_HOME"
}

if (-not $SkipFrontend) {
    Push-Location (Join-Path $repoRoot "frontend")
    try {
        Invoke-Step -Name "Frontend typecheck" -Action {
            Invoke-Checked -FilePath "npm.cmd" -Arguments @("run", "typecheck")
        }

        Invoke-Step -Name "Frontend tests (CI mode)" -Action {
            $env:CI = "true"
            Invoke-Checked -FilePath "npm.cmd" -Arguments @("run", "test:ci")
        }

        Invoke-Step -Name "Frontend production build" -Action {
            Invoke-Checked -FilePath "npm.cmd" -Arguments @("run", "build")
        }
    } finally {
        Pop-Location
    }
}

if (-not $SkipBackend) {
    Push-Location (Join-Path $repoRoot "backend")
    try {
        Invoke-Step -Name "Backend compile" -Action {
            Invoke-Checked -FilePath "cmd" -Arguments @("/c", "mvnw.cmd -DskipTests compile")
        }

        Invoke-Step -Name "Backend tests" -Action {
            Invoke-Checked -FilePath "cmd" -Arguments @("/c", "mvnw.cmd test")
        }
    } finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "Setup verification completed successfully." -ForegroundColor Green

