[CmdletBinding()]
param(
    [string]$Branch = "main",
    [string]$Remote = "origin",
    [switch]$SkipFetch
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $PSCommandPath
$frontendDir = Split-Path -Parent $scriptDir
$repoRoot = Split-Path -Parent $frontendDir
$logDir = Join-Path $env:LOCALAPPDATA "EcommerceFullstack\Logs"
$logPath = Join-Path $logDir "daily-auto-commit.log"

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
}

function Write-Log {
    param([string]$Message)

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $Message"
    Add-Content -Path $logPath -Value $line
    Write-Output $line
}

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$GitArgs,
        [switch]$Quiet
    )

    $stdoutPath = [System.IO.Path]::GetTempFileName()
    $stderrPath = [System.IO.Path]::GetTempFileName()

    try {
        $process = Start-Process `
            -FilePath "git" `
            -ArgumentList $GitArgs `
            -NoNewWindow `
            -Wait `
            -PassThru `
            -RedirectStandardOutput $stdoutPath `
            -RedirectStandardError $stderrPath

        $output = @()
        if (Test-Path $stdoutPath) {
            $output += @(Get-Content $stdoutPath)
        }
        if (Test-Path $stderrPath) {
            $output += @(Get-Content $stderrPath)
        }

        if ($process.ExitCode -ne 0) {
            foreach ($line in @($output)) {
                if ($line) {
                    Write-Log "git $($GitArgs -join ' ') :: $line"
                }
            }
            throw "git $($GitArgs -join ' ') failed with exit code $($process.ExitCode)."
        }

        if (-not $Quiet) {
            foreach ($line in @($output)) {
                if ($line) {
                    Write-Log "git $($GitArgs -join ' ') :: $line"
                }
            }
        }

        return @($output)
    }
    finally {
        Remove-Item $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue
    }
}

try {
    Write-Log "Starting daily auto commit run."
    Set-Location $repoRoot

    $currentBranch = (Invoke-Git -GitArgs @("branch", "--show-current") -Quiet | Select-Object -Last 1).Trim()
    if ($currentBranch -ne $Branch) {
        Write-Log "Current branch is '$currentBranch', expected '$Branch'. Stopping."
        exit 1
    }

    if (-not $SkipFetch) {
        Write-Log "Fetching $Remote/$Branch before evaluating push safety."
        Invoke-Git -GitArgs @("fetch", $Remote, $Branch)
    }

    $head = (Invoke-Git -GitArgs @("rev-parse", "HEAD") -Quiet | Select-Object -Last 1).Trim()
    $upstream = (Invoke-Git -GitArgs @("rev-parse", "$Remote/$Branch") -Quiet | Select-Object -Last 1).Trim()
    $base = (Invoke-Git -GitArgs @("merge-base", "HEAD", "$Remote/$Branch") -Quiet | Select-Object -Last 1).Trim()

    if ($head -ne $upstream) {
        if ($base -eq $head) {
            Write-Log "Local branch is behind $Remote/$Branch. Resolve manually before auto commit can continue."
            exit 1
        }

        if ($base -ne $upstream) {
            Write-Log "Local branch has diverged from $Remote/$Branch. Resolve manually before auto commit can continue."
            exit 1
        }
    }

    $workingTree = @(Invoke-Git -GitArgs @("status", "--porcelain") -Quiet)
    $hasChanges = $workingTree.Count -gt 0

    if (-not $hasChanges) {
        if ($head -ne $upstream) {
            Write-Log "No working tree changes detected, but local branch is ahead. Pushing outstanding commit(s)."
            Invoke-Git -GitArgs @("push", $Remote, $Branch)
            Write-Log "Outstanding commit(s) pushed successfully."
            exit 0
        }

        Write-Log "No working tree changes detected. Nothing to commit."
        exit 0
    }

    Write-Log "Changes detected. Staging repository updates."
    Invoke-Git -GitArgs @("add", "-A")

    $staged = @(Invoke-Git -GitArgs @("diff", "--cached", "--name-only") -Quiet)
    if ($staged.Count -eq 0) {
        Write-Log "No staged diff remains after git add -A. Nothing to commit."
        exit 0
    }

    $message = "chore: daily auto commit $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    Write-Log "Creating signed commit: $message"
    Invoke-Git -GitArgs @("commit", "-S", "-m", $message)

    Write-Log "Pushing new commit to $Remote/$Branch."
    Invoke-Git -GitArgs @("push", $Remote, $Branch)

    Write-Log "Daily auto commit run completed successfully."
}
catch {
    Write-Log "Automation failed: $($_.Exception.Message)"
    exit 1
}
