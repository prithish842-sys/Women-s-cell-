$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$secureDir = Join-Path $projectRoot ".secure"
$credentialFile = Join-Path $secureDir "womens-cell-login-credentials.json"

$accounts = @(
    @{ Name = "ROJA.P"; Email = "rojapbcompa2024@sankara.ac.in" },
    @{ Name = "Anusiya.A"; Email = "anusiyabsccs2025@sankara.ac.in" },
    @{ Name = "Reshmi R"; Email = "reshmir@sankara.ac.in" },
    @{ Name = "Tharani.P"; Email = "tharanipbcomca2024@sankara.ac.in" },
    @{ Name = "Dr.A.INDUMATHI"; Email = "indumathia@sankara.ac.in" },
    @{ Name = "Revathi.M"; Email = "revathim@sankara.ac.in" },
    @{ Name = "Vinitha S"; Email = "vinithas@sankara.ac.in" },
    @{ Name = "SathyPriya.S"; Email = "sathyapriyas@sankara.ac.in" },
    @{ Name = "Anamika.S"; Email = "anamikasbscit2024@sankara.ac.in" },
    @{ Name = "Dr Jayagowri G S"; Email = "jayagowrigs@sankara.ac.in" },
    @{ Name = "Ms. S. Archana"; Email = "archanas@sankara.ac.in" },
    @{ Name = "Durganandhini V"; Email = "durganandhininandhini524@gmail.com" }
)

New-Item -ItemType Directory -Force -Path $secureDir | Out-Null

$result = @()

foreach ($account in $accounts) {
    while ($true) {
        $securePassword = Read-Host "Temporary password for $($account.Name) <$($account.Email)>" -AsSecureString
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

        try {
            $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
        }
        finally {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        }

        if ($password.Length -ge 8 -and $password -match '[A-Za-z]' -and $password -match '\d') {
            break
        }

        Write-Host "Password must be at least 8 characters and contain letters and numbers." -ForegroundColor Yellow
    }

    $result += [PSCustomObject]@{
        email = $account.Email
        password = $password
    }

    $password = $null
    $securePassword = $null
}

$json = $result | ConvertTo-Json -Depth 3
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($credentialFile, $json, $utf8NoBom)

Write-Host ""
Write-Host "Credential file created locally:" -ForegroundColor Green
Write-Host $credentialFile
Write-Host ""
Write-Host "This file is ignored by Git. Do not upload, commit, email, or share it." -ForegroundColor Yellow
