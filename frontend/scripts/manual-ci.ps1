[CmdletBinding()]
param(
    [switch]$SkipFrontend,
    [switch]$SkipBackend,
    [switch]$InstallDependencies,
    [switch]$RunMigrationSmoke,
    [switch]$RunPostmanSmoke,
    [string]$BaseUrl = "http://127.0.0.1:8080"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $PSCommandPath
$frontendDir = Split-Path -Parent $scriptDir
$repoRoot = Split-Path -Parent $frontendDir
$backendDir = Join-Path $repoRoot "backend"

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
        throw "Command failed with exit code ${exitCode}: $FilePath $($Arguments -join ' ')"
    }
}

function Set-DefaultBackendCiEnv {
    if (-not $env:DB_URL) { $env:DB_URL = "jdbc:mysql://localhost:3306/ecommerce" }
    if (-not $env:DB_USERNAME) { $env:DB_USERNAME = "root" }
    if (-not $env:DB_PASSWORD) { $env:DB_PASSWORD = "root" }
    if (-not $env:JWT_SECRET_KEY) { $env:JWT_SECRET_KEY = "CI_JWT_SECRET_KEY_012345678901234567890123456789012345678901234567890123456789" }
    if (-not $env:MAIL_USERNAME) { $env:MAIL_USERNAME = "ci@example.com" }
    if (-not $env:MAIL_PASSWORD) { $env:MAIL_PASSWORD = "ci-password" }
}

if (-not (Test-Path (Join-Path $frontendDir "package.json"))) {
    throw "Frontend directory could not be resolved from script location: $frontendDir"
}

if ((-not $SkipBackend) -or $RunMigrationSmoke -or $RunPostmanSmoke) {
    if (-not (Test-Path (Join-Path $backendDir "mvnw.cmd"))) {
        throw "Backend directory is missing mvnw.cmd: $backendDir"
    }
}

if (-not (Get-Command "npm.cmd" -ErrorAction SilentlyContinue)) {
    throw "npm.cmd is not available in PATH."
}

if ((-not $SkipBackend) -or $RunMigrationSmoke) {
    if (-not (Get-Command "java" -ErrorAction SilentlyContinue)) {
        throw "Java is not available in PATH."
    }
}

if ($RunPostmanSmoke -and -not (Get-Command "newman" -ErrorAction SilentlyContinue)) {
    throw "newman is not available in PATH. Install globally: npm i -g newman"
}

Invoke-Step -Name "Tool versions" -Action {
    Invoke-Checked -FilePath "node" -Arguments @("-v")
    Invoke-Checked -FilePath "npm.cmd" -Arguments @("-v")
    if ((-not $SkipBackend) -or $RunMigrationSmoke) {
        Invoke-Checked -FilePath "java" -Arguments @("-version")
    }
}

if (-not $SkipFrontend) {
    Push-Location $frontendDir
    try {
        if ($InstallDependencies) {
            Invoke-Step -Name "Frontend install dependencies" -Action {
                Invoke-Checked -FilePath "npm.cmd" -Arguments @("ci")
            }
        }

        Invoke-Step -Name "Frontend typecheck" -Action {
            Invoke-Checked -FilePath "npm.cmd" -Arguments @("run", "typecheck")
        }

        Invoke-Step -Name "Frontend tests (CI mode)" -Action {
            $env:CI = "true"
            Invoke-Checked -FilePath "npm.cmd" -Arguments @("run", "test:ci")
        }

        Invoke-Step -Name "Frontend build" -Action {
            Invoke-Checked -FilePath "npm.cmd" -Arguments @("run", "build")
        }
    }
    finally {
        Pop-Location
    }
}

if (-not $SkipBackend) {
    Push-Location $backendDir
    try {
        Set-DefaultBackendCiEnv

        Invoke-Step -Name "Backend compile" -Action {
            Invoke-Checked -FilePath "cmd.exe" -Arguments @("/c", "mvnw.cmd -DskipTests compile")
        }

        Invoke-Step -Name "Backend tests" -Action {
            Invoke-Checked -FilePath "cmd.exe" -Arguments @("/c", "mvnw.cmd test -DskipITs")
        }
    }
    finally {
        Pop-Location
    }
}

if ($RunMigrationSmoke) {
    Push-Location $backendDir
    try {
        if (-not $env:FLYWAY_URL) { $env:FLYWAY_URL = "jdbc:mysql://127.0.0.1:3306/ecommerce_migration_smoke" }
        if (-not $env:FLYWAY_USER) { $env:FLYWAY_USER = "root" }
        if (-not $env:FLYWAY_PASSWORD) { $env:FLYWAY_PASSWORD = "root" }

        Invoke-Step -Name "Backend Flyway migration smoke" -Action {
            Invoke-Checked -FilePath "cmd.exe" -Arguments @(
                "/c",
                "mvnw.cmd -Dflyway.url=$env:FLYWAY_URL -Dflyway.user=$env:FLYWAY_USER -Dflyway.password=$env:FLYWAY_PASSWORD org.flywaydb:flyway-maven-plugin:11.14.1:migrate"
            )
        }
    }
    finally {
        Pop-Location
    }
}

if ($RunPostmanSmoke) {
    Push-Location $backendDir
    try {
        $collectionPath = Join-Path $repoRoot "docs\postman\Ecommerce-CI-Smoke.postman_collection.json"
        if (-not (Test-Path $collectionPath)) {
            throw "Postman smoke collection not found: $collectionPath"
        }

        Invoke-Step -Name "Postman smoke (requires backend already running)" -Action {
            Invoke-Checked -FilePath "newman" -Arguments @(
                "run",
                $collectionPath,
                "--env-var",
                "baseUrl=$BaseUrl"
            )
        }
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "Manual CI checks completed successfully." -ForegroundColor Green
